#!/bin/bash
set -e

echo "=== FeliCa Scanner Container Starting ==="

# Blacklist kernel modules that interfere with libpafe's direct USB access.
# pn533/pn533_usb would claim the RC-S320 before libpafe can access it.
if [ -d /sys/module/pn533_usb ]; then
    echo "Removing pn533_usb kernel module..."
    rmmod pn533_usb 2>/dev/null || true
fi
if [ -d /sys/module/pn533 ]; then
    echo "Removing pn533 kernel module..."
    rmmod pn533 2>/dev/null || true
fi

# Start pcscd (PC/SC daemon) for RC-S300 support.
echo "Starting pcscd..."
pcscd --foreground --auto-exit &
PCSCD_PID=$!

# Give pcscd time to initialize and detect readers
sleep 2

echo "Starting felica_scanner..."
exec /usr/local/bin/felica_scanner
