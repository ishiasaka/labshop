use libloading::{Library, Symbol};
use std::thread;
use std::time::{Duration, Instant};

use crate::scan_data::{hex_upper, post_scan_data};
use crate::usb_port::find_usb_port_for_product;

type Pasori = *mut std::ffi::c_void;
type FelicaTag = *mut std::ffi::c_void;

// libpafe function signatures
// NOTE: pasori_open takes void (no arguments), unlike felicalib.dll
type PasoriOpen = unsafe extern "C" fn() -> Pasori;
type PasoriInit = unsafe extern "C" fn(p: Pasori) -> i32;
type PasoriClose = unsafe extern "C" fn(p: Pasori);
type FelicaPolling =
    unsafe extern "C" fn(p: Pasori, systemcode: u16, rfu: u8, timeslot: u8) -> FelicaTag;
type FelicaGetIdm = unsafe extern "C" fn(f: FelicaTag, idm_out: *mut u8) -> i32;

/// USB product ID for RC-S320
const RC_S320_PID: &str = "01bb";

/// Run the RC-S320 polling loop (blocks forever).
pub fn run_libpafe_loop() {
    println!("[RC-S320/libpafe] Starting backend...");

    let lib = match unsafe { Library::new("libpafe.so") } {
        Ok(l) => l,
        Err(e) => {
            eprintln!(
                "[RC-S320/libpafe] Failed to load libpafe.so: {}. Is libpafe installed?",
                e
            );
            return;
        }
    };

    unsafe {
        let pasori_open: Symbol<PasoriOpen> = match lib.get(b"pasori_open\0") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[RC-S320/libpafe] Symbol error: {}", e);
                return;
            }
        };
        let pasori_init: Symbol<PasoriInit> = match lib.get(b"pasori_init\0") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[RC-S320/libpafe] Symbol error: {}", e);
                return;
            }
        };
        let pasori_close: Symbol<PasoriClose> = match lib.get(b"pasori_close\0") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[RC-S320/libpafe] Symbol error: {}", e);
                return;
            }
        };
        let felica_polling: Symbol<FelicaPolling> = match lib.get(b"felica_polling\0") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[RC-S320/libpafe] Symbol error: {}", e);
                return;
            }
        };
        let felica_getidm: Symbol<FelicaGetIdm> = match lib
            .get(b"felica_getidm\0")
            .or_else(|_| lib.get(b"felica_get_idm\0"))
        {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[RC-S320/libpafe] Symbol error: {}", e);
                return;
            }
        };

        // libpafe's pasori_open() takes no arguments
        let pasori: Pasori = pasori_open();
        if pasori.is_null() {
            eprintln!("[RC-S320/libpafe] pasori_open() returned NULL. Is RC-S320 connected?");
            return;
        }

        if pasori_init(pasori) != 0 {
            eprintln!("[RC-S320/libpafe] pasori_init() failed.");
            pasori_close(pasori);
            return;
        }

        println!("[RC-S320/libpafe] Ready. Waiting for card touch...");

        let system_code: u16 = 0xFFFF;
        let cooldown = Duration::from_secs(2);
        let mut last_idm = [0u8; 8];
        let mut last_read_time: Option<Instant> = None;

        loop {
            if let Some(t) = last_read_time {
                if t.elapsed() < cooldown {
                    thread::sleep(Duration::from_millis(150));
                    continue;
                } else {
                    last_idm = [0u8; 8];
                    last_read_time = None;
                }
            }

            let f: FelicaTag = felica_polling(pasori, system_code, 0x00, 0x00);
            if !f.is_null() {
                let mut idm = [0u8; 8];
                felica_getidm(f, idm.as_mut_ptr());

                // libpafe allocates felica with malloc; free with libc::free
                libc::free(f);

                if idm != [0u8; 8] && idm != last_idm {
                    let idm_str = hex_upper(&idm);
                    let usb_port = find_usb_port_for_product(RC_S320_PID);

                    println!(
                        "[RC-S320/libpafe] IDm={} USB_Port={}",
                        idm_str,
                        usb_port.as_deref().unwrap_or("Unknown")
                    );
                    post_scan_data(&idm_str, usb_port);

                    last_idm = idm;
                    last_read_time = Some(Instant::now());
                }
            }

            thread::sleep(Duration::from_millis(150));
        }
    }
}
