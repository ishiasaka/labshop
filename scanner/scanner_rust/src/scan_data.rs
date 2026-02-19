use serde::Serialize;
use std::env;
use std::process::Command;
use std::thread;

#[derive(Serialize, Debug, Clone)]
pub struct ScanData {
    pub idm: String,
    pub usb_port: Option<u32>,
    pub reader_type: String,
}

pub fn hex_upper(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02X}", b));
    }
    s
}

pub fn api_url() -> String {
    env::var("API_URL").unwrap_or_else(|_| "http://127.0.0.1:8000/ic_cards/scan".to_string())
}

/// Map USB path to physical port number (1-7) on the 7-port hub.
fn usb_port_to_int(port: &str) -> Option<u32> {
    match port {
        "1-1.4"   => Some(1),
        "1-1.2"   => Some(2),
        "1-1.1"   => Some(3),
        "1-1.3.4" => Some(4),
        "1-1.3.2" => Some(5),
        "1-1.3.1" => Some(6),
        "1-1.3.3" => Some(7),
        _ => None,
    }
}

const SOUND_OK: &str = "/usr/local/share/sounds/paypay.mp3";
const SOUND_ERR: &str = "/usr/local/share/sounds/error.wav";

/// Play a sound file in a background thread (non-blocking).
pub fn play_sound(path: &'static str) {
    thread::spawn(move || {
        let _ = Command::new("mpg123")
            .arg("-q")
            .arg(path)
            .status();
    });
}

pub fn post_scan_data(idm: &str, usb_port: Option<String>, reader_type: &str) {
    let data = ScanData {
        idm: idm.to_string(),
        usb_port: usb_port.as_deref().and_then(usb_port_to_int),
        reader_type: reader_type.to_string(),
    };

    let url = api_url();
    match ureq::post(&url)
        .set("Content-Type", "application/json")
        .send_json(&data)
    {
        Ok(resp) => {
            let status = resp.status();
            println!("[POST] OK: {} -> {}", data.idm, status);
            if status == 200 {
                play_sound(SOUND_OK);
            } else {
                eprintln!("[POST] HTTP {}: {}", status, data.idm);
                play_sound(SOUND_ERR);
            }
        }
        Err(e) => {
            eprintln!("[POST] Error for {}: {}", data.idm, e);
            play_sound(SOUND_ERR);
        }
    }
}
