mod backend_libpafe;
mod backend_pcsc;
mod scan_data;
mod usb_port;

use std::thread;

fn main() {
    println!("=== FeliCa Multi-Reader Scanner (Linux/Docker) ===");
    println!("API_URL: {}", scan_data::api_url());

    // Detect connected readers at startup (informational)
    let readers = usb_port::detect_usb_readers();
    if readers.is_empty() {
        println!("[WARN] No FeliCa readers detected via sysfs. They may appear later.");
    } else {
        for r in &readers {
            println!("[INFO] Found {} at USB port {}", r.reader_name, r.usb_port);
        }
    }

    // Spawn backend threads - both run concurrently and independently.
    // If a reader is not connected, the backend logs an error and returns.
    let pcsc_handle = thread::Builder::new()
        .name("pcsc-rc-s300".to_string())
        .spawn(|| {
            backend_pcsc::run_pcsc_loop();
        })
        .expect("Failed to spawn PC/SC thread");

    let libpafe_handle = thread::Builder::new()
        .name("libpafe-rc-s320".to_string())
        .spawn(|| {
            backend_libpafe::run_libpafe_loop();
        })
        .expect("Failed to spawn libpafe thread");

    // Wait for both threads (they run forever under normal operation)
    let _ = pcsc_handle.join();
    let _ = libpafe_handle.join();

    eprintln!("[MAIN] All backends exited. Shutting down.");
}
