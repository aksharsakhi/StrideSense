#!/usr/bin/env bash
# ==============================================================================
# StrideSense - 1-Click ESP32 Firmware Compiler & Flasher
# Automatically detects connected ESP32, compiles TinyML firmware, and uploads.
# ==============================================================================

set -e

ARDUINO_CLI="/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli"
SKETCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/StrideSense_Firmware" && pwd)"
FQBN="esp32:esp32:esp32"

echo "========================================================"
echo "    STRIDESENSE - ESP32 1-CLICK FIRMWARE FLASHER        "
echo "========================================================"

if [ ! -f "$ARDUINO_CLI" ]; then
    echo "[-] Error: Arduino CLI not found at $ARDUINO_CLI"
    exit 1
fi

# Step 1: Detect Connected ESP32 Serial Port
echo "[*] Scanning for connected ESP32 board..."
PORT=$(ls /dev/cu.usbserial* /dev/cu.wchusbserial* /dev/cu.SLAB_USBtoUART* /dev/cu.usbmodem* 2>/dev/null | head -n 1 || true)

if [ -z "$PORT" ]; then
    echo "[-] No ESP32 detected on USB ports."
    echo "[!] Please plug your ESP32 into your Mac via USB cable and re-run."
    exit 1
fi

echo "[+] Detected ESP32 on port: $PORT"

# Step 2: Compile
echo "[*] Compiling StrideSense firmware & embedded TinyML model..."
"$ARDUINO_CLI" compile --fqbn "$FQBN" "$SKETCH_DIR"
echo "[+] Compilation successful!"

# Step 3: Upload
echo "[*] Uploading firmware to ESP32 on $PORT..."
echo "[!] Note: If upload stalls at 'Connecting...', press and hold the 'BOOT' button on your ESP32 for 1 second."
"$ARDUINO_CLI" upload -p "$PORT" --fqbn "$FQBN" "$SKETCH_DIR"

echo "========================================================"
echo " [✓] FIRMWARE & TINYML MODEL FLASHED SUCCESSFULLY!      "
echo "========================================================"
echo "[*] To monitor live serial output at 115200 baud, run:"
echo "    screen $PORT 115200"
echo "========================================================"
