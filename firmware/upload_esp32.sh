#!/usr/bin/env bash
# ==============================================================================
# StrideSense - 1-Click ESP32 Firmware Compiler & Flasher (Bilateral Dual-Insole)
# Automatically selects Left/Right insole role, compiles TinyML firmware, and uploads.
# ==============================================================================

set -e

ARDUINO_CLI="/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKETCH_DIR="$SCRIPT_DIR/StrideSense_Firmware"
CONFIG_FILE="$SKETCH_DIR/config.h"
FQBN="esp32:esp32:esp32"

echo "========================================================"
echo "    STRIDESENSE - ESP32 1-CLICK FIRMWARE FLASHER        "
echo "========================================================"

if [ ! -f "$ARDUINO_CLI" ]; then
    echo "[-] Error: Arduino CLI not found at $ARDUINO_CLI"
    exit 1
fi

# Step 1: Determine Insole Side (left | right)
SIDE_ARG="${1:-}"
if [ -z "$SIDE_ARG" ]; then
    if [ -t 0 ]; then
        echo "Which insole board are you flashing right now?"
        echo "  [1] LEFT Insole  (Device ID: insole_left_01)"
        echo "  [2] RIGHT Insole (Device ID: insole_right_01)"
        read -p "Enter choice [1 or 2] (default: 1): " CHOICE
        if [ "$CHOICE" == "2" ] || [ "$CHOICE" == "right" ] || [ "$CHOICE" == "r" ]; then
            SIDE="right"
        else
            SIDE="left"
        fi
    else
        SIDE="left"
    fi
else
    SIDE=$(echo "$SIDE_ARG" | tr '[:upper:]' '[:lower:]')
fi

if [[ "$SIDE" == *"right"* ]] || [[ "$SIDE" == "2" ]]; then
    echo "[*] Configuring firmware for: RIGHT INSOLE (insole_right_01)..."
    sed -i '' 's/#define INSOLE_SIDE .*/#define INSOLE_SIDE           INSOLE_SIDE_RIGHT/' "$CONFIG_FILE"
else
    echo "[*] Configuring firmware for: LEFT INSOLE (insole_left_01)..."
    sed -i '' 's/#define INSOLE_SIDE .*/#define INSOLE_SIDE           INSOLE_SIDE_LEFT/' "$CONFIG_FILE"
fi

# Step 2: Detect Connected ESP32 Serial Port
echo "[*] Scanning for connected ESP32 board..."
PORT=$(ls /dev/cu.usbserial* /dev/cu.wchusbserial* /dev/cu.SLAB_USBtoUART* /dev/cu.usbmodem* 2>/dev/null | head -n 1 || true)

if [ -z "$PORT" ]; then
    echo "[-] No ESP32 detected on USB ports."
    echo "[!] Please connect your ESP32 board to your Mac via USB and re-run."
    exit 1
fi

echo "[+] Detected ESP32 on port: $PORT"

# Step 3: Compile
echo "[*] Compiling StrideSense firmware & TinyML model..."
"$ARDUINO_CLI" compile --fqbn "$FQBN" "$SKETCH_DIR"
echo "[+] Compilation successful!"

# Step 4: Upload
echo "[*] Uploading to ESP32 on $PORT..."
echo "[!] Note: If upload stalls at 'Connecting...', press and hold the 'BOOT' button on the ESP32 for 1 second."
"$ARDUINO_CLI" upload -p "$PORT" --fqbn "$FQBN" "$SKETCH_DIR"

echo "========================================================"
echo " [✓] $SIDE INSOLE FIRMWARE FLASHED SUCCESSFULLY! "
echo "========================================================"
echo "[*] To monitor live sensor readings at 115200 baud, run:"
echo "    ./serial_monitor.sh"
echo "========================================================"
