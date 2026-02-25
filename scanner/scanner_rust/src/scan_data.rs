use serde::Serialize;
use std::env;
use std::process::Command;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Debug, Clone)]
pub struct ScanData {
    pub idm: String,
    pub usb_port: Option<u32>,
    pub timestamp: String,
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

// pub fn api_url() -> String {
//     env::var("API_URL")
//         .unwrap_or_else(|_| "http://127.0.0.1:3658/m1/1205805-1201144-default/".to_string())
// }

/// Map USB path to physical port number (1-7) on the 7-port hub.
fn usb_port_to_int(port: &str) -> Option<u32> {
    match port {
        "1-1.4" => Some(1),
        "1-1.2" => Some(2),
        "1-1.1" => Some(3),
        "1-1.3.4" => Some(4),
        "1-1.3.2" => Some(5),
        "1-1.3.1" => Some(6),
        "1-1.3.3" => Some(7),
        _ => None,
    }
}

const SOUND_OK: &str = "/usr/local/share/sounds/paypay.mp3";
const SOUND_ADMIN: &str = "/usr/local/share/sounds/admin-2.mp3";
const SOUND_ERR: &str = "/usr/local/share/sounds/error-2.mp3";

/// Play a sound file in a background thread (non-blocking).
pub fn play_sound(path: &'static str) {
    thread::spawn(move || {
        let _ = Command::new("mpg123").arg("-q").arg(path).status();
    });
}

fn iso8601_now() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();
    let millis = now.subsec_millis();
    let s = secs % 60;
    let m = (secs / 60) % 60;
    let h = (secs / 3600) % 24;
    let days = secs / 86400;
    // days since 1970-01-01
    let (y, mo, d) = days_to_ymd(days);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        y, mo, d, h, m, s, millis
    )
}

fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    let mut d = days;
    let mut y = 1970u64;
    loop {
        let leap = y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
        let days_in_year = if leap { 366 } else { 365 };
        if d < days_in_year {
            break;
        }
        d -= days_in_year;
        y += 1;
    }
    let leap = y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
    let month_days = [
        31,
        if leap { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    let mut mo = 1u64;
    for &md in &month_days {
        if d < md {
            break;
        }
        d -= md;
        mo += 1;
    }
    (y, mo, d + 1)
}

pub fn post_scan_data(idm: &str, usb_port: Option<String>, reader_type: &str) {
    let port_num = usb_port.as_deref().and_then(usb_port_to_int);

    // Port 5: play sound immediately before sending data.
    if port_num == Some(5) {
        play_sound(SOUND_ADMIN);
    }

    let data = ScanData {
        idm: idm.to_string(),
        usb_port: port_num,
        timestamp: iso8601_now(),
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
                if port_num != Some(5) {
                    play_sound(SOUND_OK);
                }
            } else if port_num != Some(5) {
                eprintln!("[POST] HTTP {}: {}", status, data.idm);
                play_sound(SOUND_ERR);
            }
        }
        Err(e) => {
            eprintln!("[POST] Error for {}: {}", data.idm, e);
            if port_num != Some(5) {
                play_sound(SOUND_ERR);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_hex_upper() {
        assert_eq!(hex_upper(&[0x01, 0x13, 0xAB, 0xFF]), "0113ABFF");
        assert_eq!(hex_upper(&[]), "");
        assert_eq!(hex_upper(&[0x00]), "00");
    }

    #[test]
    fn test_usb_port_to_int_known() {
        assert_eq!(usb_port_to_int("1-1.4"), Some(1));
        assert_eq!(usb_port_to_int("1-1.2"), Some(2));
        assert_eq!(usb_port_to_int("1-1.1"), Some(3));
        assert_eq!(usb_port_to_int("1-1.3.4"), Some(4));
        assert_eq!(usb_port_to_int("1-1.3.2"), Some(5));
        assert_eq!(usb_port_to_int("1-1.3.1"), Some(6));
        assert_eq!(usb_port_to_int("1-1.3.3"), Some(7));
    }

    #[test]
    fn test_usb_port_to_int_unknown() {
        assert_eq!(usb_port_to_int("1-2.1"), None);
        assert_eq!(usb_port_to_int(""), None);
    }

    #[test]
    fn test_api_url_default() {
        env::remove_var("API_URL");
        let url = api_url();
        assert!(url.contains("ic_cards/scan") || url.contains("3658"));
    }

    #[test]
    fn test_api_url_env_override() {
        env::set_var("API_URL", "http://test.example.com/scan");
        let url = api_url();
        assert_eq!(url, "http://test.example.com/scan");
        env::remove_var("API_URL");
    }

    #[test]
    fn test_days_to_ymd_epoch() {
        assert_eq!(days_to_ymd(0), (1970, 1, 1));
    }

    #[test]
    fn test_days_to_ymd_known_date() {
        // 2026-02-23
        let days = (2026 - 1970) * 365
            + 14  // leap years: 1972,76,80,84,88,92,96,2000,04,08,12,16,20,24
            + 31  // Jan
            + 22; // Feb 1-22
        assert_eq!(days_to_ymd(days), (2026, 2, 23));
    }

    #[test]
    fn test_days_to_ymd_leap_year() {
        // 2000-02-29 (leap year)
        let days = (2000 - 1970) * 365
            + 7   // leap years before 2000: 1972,76,80,84,88,92,96
            + 31  // Jan
            + 28; // Feb 1-28 to reach Feb 29
        let (y, mo, d) = days_to_ymd(days);
        assert_eq!(y, 2000);
        assert_eq!(mo, 2);
        assert_eq!(d, 29);
    }

    #[test]
    fn test_days_to_ymd_year_end() {
        // 1970-12-31
        assert_eq!(days_to_ymd(364), (1970, 12, 31));
    }

    #[test]
    fn test_iso8601_now_format() {
        let ts = iso8601_now();
        assert!(ts.contains('T'));
        assert!(ts.ends_with('Z'));
        assert_eq!(ts.len(), 24); // "2026-02-23T09:33:00.033Z"
    }
}
