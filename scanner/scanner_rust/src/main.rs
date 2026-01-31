use libloading::{Library, Symbol};
use rodio::{Decoder, OutputStream, Sink};
use std::{
    error::Error,
    ffi::{c_char, CStr},
    fs::File,
    io::BufReader,
    thread,
    time::{Duration, Instant},
};

type Pasori = *mut std::ffi::c_void;
type Felica = *mut std::ffi::c_void;

type PasoriOpen = unsafe extern "C" fn(port: *const c_char) -> Pasori;
type PasoriClose = unsafe extern "C" fn(p: Pasori);
type PasoriInit = unsafe extern "C" fn(p: Pasori) -> i32;

type FelicaPolling =
    unsafe extern "C" fn(p: Pasori, systemcode: u16, rfu: u8, timeslot: u8) -> Felica;
type FelicaGetIdm = unsafe extern "C" fn(f: Felica, idm_out: *mut u8);
type FelicaFree = unsafe extern "C" fn(f: Felica);

fn hex_upper(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02X}", b));
    }
    s
}

fn main() -> Result<(), Box<dyn Error>> {
    // exe と同じフォルダに felicalib.dll を置く
    let lib = unsafe { Library::new("felicalib.dll") }?;

    unsafe {
        let pasori_open: Symbol<PasoriOpen> = lib.get(b"pasori_open\0")?;
        let pasori_close: Symbol<PasoriClose> = lib.get(b"pasori_close\0")?;
        let pasori_init: Symbol<PasoriInit> = lib.get(b"pasori_init\0")?;
        let felica_polling: Symbol<FelicaPolling> = lib.get(b"felica_polling\0")?;
        let felica_getidm: Symbol<FelicaGetIdm> = lib
            .get(b"felica_getidm\0")
            .or_else(|_| lib.get(b"felica_get_idm\0"))?;
        let felica_free: Symbol<FelicaFree> = lib.get(b"felica_free\0")?;

        // RC-S320 は NULL で開けることが多い．ダメなら USB0 なども試す
        let ports: [Option<&CStr>; 2] = [None, Some(CStr::from_bytes_with_nul(b"USB0\0")?)];

        let mut pasori: Pasori = std::ptr::null_mut();
        for p in ports {
            let ptr = p.map(|s| s.as_ptr()).unwrap_or(std::ptr::null());
            let h = pasori_open(ptr);
            if !h.is_null() {
                pasori = h;
                break;
            }
        }

        if pasori.is_null() {
            return Err("pasori_open failed．felicalib.dll と RC-S320 の接続を確認．".into());
        }

        if pasori_init(pasori) != 0 {
            pasori_close(pasori);
            return Err("pasori_init failed．".into());
        }

        println!("Ready．タッチしてね．");

        // 0xFFFF は system code ワイルドカード
        let system_code: u16 = 0xFFFF;

        let mut last_idm = [0u8; 8];
        let mut last_read_time: Option<Instant> = None;
        let cooldown = Duration::from_secs(2);

        loop {
            // クールダウン中はスキップ
            if let Some(t) = last_read_time {
                if t.elapsed() < cooldown {
                    thread::sleep(Duration::from_millis(150));
                    continue;
                }
            }

            let f = felica_polling(pasori, system_code, 0x00, 0x00);
            if !f.is_null() {
                let mut idm = [0u8; 8];
                felica_getidm(f, idm.as_mut_ptr());
                felica_free(f);

                if idm != [0u8; 8] && idm != last_idm {
                    println!("IDm={}", hex_upper(&idm));
                    last_idm = idm;
                    last_read_time = Some(Instant::now());

                    // Play sound file when card is detected
                    let sound_path = std::env::current_exe()
                        .ok()
                        .and_then(|p| p.parent().map(|d| d.join("paypay.mp3")))
                        .unwrap_or_else(|| std::path::PathBuf::from("paypay.mp3"));
                    if let Ok(file) = File::open(&sound_path) {
                        if let Ok((_stream, stream_handle)) = OutputStream::try_default() {
                            if let Ok(source) = Decoder::new(BufReader::new(file)) {
                                if let Ok(sink) = Sink::try_new(&stream_handle) {
                                    sink.append(source);
                                    sink.sleep_until_end();
                                }
                            }
                        }
                    }
                }
            }

            thread::sleep(Duration::from_millis(150));
        }
    }
}