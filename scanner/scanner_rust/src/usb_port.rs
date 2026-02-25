use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Known USB device IDs for Sony FeliCa readers.
/// (vendor_id, product_id, human_name)
const KNOWN_DEVICES: &[(&str, &str, &str)] =
    &[("054c", "01bb", "RC-S320"), ("054c", "0dc9", "RC-S300")];

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

/// Find the USB port string for a specific product ID (returns the first match).
pub fn find_usb_port_for_product(product_id: &str) -> Option<String> {
    detect_usb_readers()
        .into_iter()
        .find(|r| r.product_id == product_id)
        .map(|r| r.usb_port)
}

/// Build a mapping from PC/SC reader names to USB sysfs ports.
///
/// pcscd enumerates readers in USB bus order, so we correlate the sorted
/// PC/SC reader names with the sorted USB sysfs paths for the same product.
pub fn build_pcsc_to_usb_mapping(
    pcsc_reader_names: &[String],
    product_id: &str,
) -> HashMap<String, String> {
    let mut mapping = HashMap::new();

    // Get sorted USB ports for this product
    let mut usb_ports: Vec<String> = detect_usb_readers()
        .into_iter()
        .filter(|r| r.product_id == product_id)
        .map(|r| r.usb_port)
        .collect();
    usb_ports.sort();

    // Filter and sort PC/SC reader names that match this product
    let product_name = match product_id {
        "0dc9" => "RC-S300",
        "01bb" => "RC-S320",
        "02e1" => "RC-S330",
        _ => return mapping,
    };

    let mut matched_readers: Vec<&String> = pcsc_reader_names
        .iter()
        .filter(|name| name.contains(product_name) || name.contains(&product_id.to_uppercase()))
        .collect();
    matched_readers.sort();

    if matched_readers.len() != usb_ports.len() {
        eprintln!(
            "[USB] Reader count mismatch: {} PC/SC readers vs {} USB ports for {}",
            matched_readers.len(),
            usb_ports.len(),
            product_name
        );
    }

    // Pair by index
    for (reader, port) in matched_readers.into_iter().zip(usb_ports.into_iter()) {
        println!("[USB] Mapped {} -> {}", reader, port);
        mapping.insert(reader.clone(), port);
    }

    mapping
}
