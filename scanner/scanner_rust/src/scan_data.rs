use serde::Serialize;
use std::env;

#[derive(Serialize, Debug, Clone)]
pub struct ScanData {
    pub idm: String,
    pub usb_port: Option<String>,
}

pub fn hex_upper(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02X}", b));
    }
    s
}

pub fn api_url() -> String {
    env::var("API_URL").unwrap_or_else(|_| "http://127.0.0.1:8000/api/scan".to_string())
}

pub fn post_scan_data(idm: &str, usb_port: Option<String>) {
    let data = ScanData {
        idm: idm.to_string(),
        usb_port,
    };

    let url = api_url();
    match ureq::post(&url)
        .set("Content-Type", "application/json")
        .send_json(&data)
    {
        Ok(resp) => {
            println!("[POST] OK: {} -> {}", data.idm, resp.status());
        }
        Err(e) => {
            eprintln!("[POST] Error for {}: {}", data.idm, e);
        }
    }
}
