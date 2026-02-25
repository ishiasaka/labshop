use pcsc::{Context, Protocols, Scope, ShareMode};
use std::thread;
use std::time::{Duration, Instant};

use crate::scan_data::{hex_upper, post_scan_data};
use crate::usb_port::find_usb_port_for_product;

/// GET DATA APDU: returns FeliCa IDm (or ISO 14443 UID).
const GET_IDM_APDU: &[u8] = &[0xFF, 0xCA, 0x00, 0x00, 0x00];

/// USB product ID for RC-S300
const RC_S300_PID: &str = "0dc9";

/// Run the RC-S300 polling loop (blocks forever).
pub fn run_pcsc_loop() {
    println!("[RC-S300/PCSC] Starting backend...");

    let ctx = match Context::establish(Scope::System) {
        Ok(c) => c,
        Err(e) => {
            eprintln!(
                "[RC-S300/PCSC] Failed to establish context: {}. Is pcscd running?",
                e
            );
            return;
        }
    };

    let cooldown = Duration::from_secs(2);
    let mut last_idm = String::new();
    let mut last_read_time: Option<Instant> = None;

    loop {
        // Cooldown handling
        if let Some(t) = last_read_time {
            if t.elapsed() < cooldown {
                thread::sleep(Duration::from_millis(150));
                continue;
            } else {
                last_idm.clear();
                last_read_time = None;
            }
        }

        // List readers and try to read a card
        if let Some(idm_str) = try_read_card(&ctx) {
            if idm_str != last_idm {
                let usb_port = find_usb_port_for_product(RC_S300_PID);
                println!(
                    "[RC-S300/PCSC] IDm={} USB_Port={}",
                    idm_str,
                    usb_port.as_deref().unwrap_or("Unknown")
                );
                post_scan_data(&idm_str, usb_port);
                last_idm = idm_str;
                last_read_time = Some(Instant::now());
            }
        }

        thread::sleep(Duration::from_millis(300));
    }
}

/// Try to connect to a reader and read FeliCa IDm.
/// Returns Some(idm_hex_string) on success, None otherwise.
fn try_read_card(ctx: &Context) -> Option<String> {
    let len = ctx.list_readers_len().ok()?;
    let mut buf = vec![0u8; len];
    let readers = ctx.list_readers(&mut buf).ok()?;

    for reader in readers {
        let card = match ctx.connect(reader, ShareMode::Shared, Protocols::ANY) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let mut response_buf = [0u8; 256];
        let response = match card.transmit(GET_IDM_APDU, &mut response_buf) {
            Ok(r) => r,
            Err(_) => continue,
        };

        // Response format: [IDm bytes...] [SW1] [SW2]
        if response.len() < 4 {
            continue;
        }

        let sw1 = response[response.len() - 2];
        let sw2 = response[response.len() - 1];

        if sw1 == 0x90 && sw2 == 0x00 {
            let idm_bytes = &response[..response.len() - 2];
            let idm_str = hex_upper(idm_bytes);
            if !idm_str.is_empty() {
                return Some(idm_str);
            }
        }
    }

    None
}
