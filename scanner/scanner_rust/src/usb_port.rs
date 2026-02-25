use std::fs;
use std::path::Path;

/// Known USB device IDs for Sony FeliCa readers.
/// (vendor_id, product_id, human_name)
const KNOWN_DEVICES: &[(&str, &str, &str)] = &[
    ("054c", "01bb", "RC-S320"),
    ("054c", "02e1", "RC-S330"),
    ("054c", "0dc9", "RC-S300"),
];

#[derive(Debug, Clone)]
pub struct UsbReaderInfo {
    pub usb_port: String,
    pub product_id: String,
    pub reader_name: String,
}

/// Scan /sys/bus/usb/devices/ and return info for all connected FeliCa readers.
pub fn detect_usb_readers() -> Vec<UsbReaderInfo> {
    let mut readers = Vec::new();
    let usb_devices = Path::new("/sys/bus/usb/devices");

    let entries = match fs::read_dir(usb_devices) {
        Ok(e) => e,
        Err(e) => {
            eprintln!("[USB] Cannot read /sys/bus/usb/devices: {}", e);
            return readers;
        }
    };

    for entry in entries.flatten() {
        let dir = entry.path();
        let vendor_path = dir.join("idVendor");
        let product_path = dir.join("idProduct");

        if !vendor_path.exists() || !product_path.exists() {
            continue;
        }

        let vendor = fs::read_to_string(&vendor_path)
            .unwrap_or_default()
            .trim()
            .to_lowercase();
        let product = fs::read_to_string(&product_path)
            .unwrap_or_default()
            .trim()
            .to_lowercase();

        for &(vid, pid, name) in KNOWN_DEVICES {
            if vendor == vid && product == pid {
                let usb_port = entry.file_name().to_string_lossy().to_string();
                readers.push(UsbReaderInfo {
                    usb_port,
                    product_id: product.clone(),
                    reader_name: name.to_string(),
                });
                break;
            }
        }
    }

    readers
}

/// Find the USB port string for a specific product ID.
pub fn find_usb_port_for_product(product_id: &str) -> Option<String> {
    detect_usb_readers()
        .into_iter()
        .find(|r| r.product_id == product_id)
        .map(|r| r.usb_port)
}
