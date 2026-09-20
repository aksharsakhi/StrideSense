#!/usr/bin/env bash
# ==============================================================================
# StrideSense - Interactive Serial Monitor (115200 Baud)
# Auto-detects connected ESP32, streams real-time telemetry, handles Ctrl+C cleanly.
# ==============================================================================

set -e

BAUD="${2:-115200}"

# Auto-detect port if not provided as $1
if [ -n "$1" ]; then
    PORT="$1"
else
    PORT=$(ls /dev/cu.usbserial* /dev/cu.wchusbserial* /dev/cu.SLAB_USBtoUART* /dev/cu.usbmodem* 2>/dev/null | head -n 1 || true)
fi

echo "========================================================"
echo "    STRIDESENSE - ESP32 INTERACTIVE SERIAL MONITOR      "
echo "========================================================"

if [ -z "$PORT" ]; then
    echo "[-] No ESP32 detected on USB ports."
    echo "[!] Please connect your ESP32 via a data USB cable and try again."
    echo "    Available ports on your system:"
    ls /dev/cu.* 2>/dev/null || true
    exit 1
fi

echo "[✓] Connected Device Port : $PORT"
echo "[✓] Serial Baud Rate      : $BAUD bps"
echo "--------------------------------------------------------"
echo "[*] Tip: Press the 'EN' / 'RST' button on your ESP32"
echo "    to view boot calibration and Flash NVS messages."
echo "[*] Press [Ctrl + C] to exit at any time."
echo "========================================================"
echo ""

# Launch dedicated Python-based reader with clean Ctrl+C handling
if python3 -c "import serial" 2>/dev/null; then
    python3 -c "
import sys, serial

port = '$PORT'
baud = int('$BAUD')

try:
    ser = serial.Serial(port, baud, timeout=0.1)
except serial.SerialException as e:
    print(f'[-] Failed to open {port}: {e}')
    print('[!] Ensure no other application (Arduino IDE, Screen, etc.) is using the port.')
    sys.exit(1)

try:
    while True:
        try:
            line = ser.readline().decode('utf-8', errors='ignore')
            if line:
                sys.stdout.write(line)
                sys.stdout.flush()
        except serial.SerialException:
            print('\n[!] Device disconnected.')
            break
except KeyboardInterrupt:
    print('\n\n[✓] Serial monitor closed.')
finally:
    try:
        ser.close()
    except Exception:
        pass
"
elif command -v screen >/dev/null 2>&1; then
    echo "[*] pyserial not found, falling back to screen (Press Ctrl+A then K to quit)..."
    screen "$PORT" "$BAUD"
else
    stty -f "$PORT" "$BAUD" cs8 -cstopb -parenb
    cat "$PORT"
fi
