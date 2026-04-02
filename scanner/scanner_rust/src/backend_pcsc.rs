use pcsc::{Context, Protocols, Scope, ShareMode};
use std::collections::HashMap;
use std::thread;
use std::time::{Duration, Instant};

use crate::scan_data::{hex_upper, post_scan_data};
use crate::usb_port::build_pcsc_to_usb_mapping;

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
    let mut reader_to_port: HashMap<String, String> = HashMap::new();

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
        if let Some((reader_name, idm_str)) = try_read_card(&ctx, &mut reader_to_port) {
            if idm_str != last_idm {
                let usb_port = reader_to_port.get(&reader_name).cloned();
                let reader_type = reader_type_from_pcsc_name(&reader_name);
                println!(
                    "[PCSC] Reader={} Type={} IDm={} USB_Port={}",
                    reader_name,
                    reader_type,
                    idm_str,
                    usb_port.as_deref().unwrap_or("Unknown")
                );
                post_scan_data(&idm_str, usb_port, reader_type);
                last_idm = idm_str;
                last_read_time = Some(Instant::now());
            }
        }

        thread::sleep(Duration::from_millis(300));
    }
}

/// Try to connect to a reader and read FeliCa IDm.
/// Returns Some((reader_name, idm_hex_string)) on success, None otherwise.
/// Also rebuilds the reader-to-USB-port mapping when the reader list changes.
fn try_read_card(
    ctx: &Context,
    reader_to_port: &mut HashMap<String, String>,
) -> Option<(String, String)> {
    let len = ctx.list_readers_len().ok()?;
    let mut buf = vec![0u8; len];
    let readers = ctx.list_readers(&mut buf).ok()?;

    // Collect reader names and rebuild mapping if needed
    let reader_names: Vec<String> = readers
        .clone()
        .map(|r| r.to_string_lossy().into_owned())
        .collect();
    if reader_to_port.is_empty() || reader_names.len() != reader_to_port.len() {
        *reader_to_port = build_pcsc_to_usb_mapping(&reader_names, RC_S300_PID);
    }

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
                return Some((reader.to_string_lossy().into_owned(), idm_str));
            }
        }
    }

    None
}

/// Extract the reader model from a PC/SC reader name string.
/// e.g. "Sony FeliCa Port/PaSoRi RC-S300/P 00 00" -> "RC-S300"
fn reader_type_from_pcsc_name(name: &str) -> &str {
    if name.contains("RC-S300") || name.contains("S300") {
        "RC-S300"
    } else if name.contains("RC-S320") || name.contains("S320") {
        "RC-S320"
    } else if name.contains("RC-S330") || name.contains("S330") {
        "RC-S330"
    } else {
        "Unknown"
    }
}
