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

# Launch dedicated Python-based reader with clean Ctrl+C handling and resilient Supabase bridge
if python3 -c "import serial" 2>/dev/null; then
    python3 -u -c "
import sys, serial, urllib.request, json, ssl

port = '$PORT'
baud = int('$BAUD')

SUPABASE_URL = 'https://sgooptohhldguitvhbrl.supabase.co/rest/v1/telemetry'
SUPABASE_KEY = 'sb_publishable_XOwUeGn_OBNf0XoAMNmT9g_3M91ATSI'
ctx = ssl._create_unverified_context()

last_cloud_status = 201

def upload_to_supabase(json_str):
    try:
        req = urllib.request.Request(
            SUPABASE_URL,
            data=json_str.encode('utf-8'),
            headers={
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, context=ctx, timeout=4) as resp:
            return resp.status
    except Exception:
        return -1

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
                clean_line = line.strip()
                if '[TELEMETRY_JSON]' in clean_line:
                    try:
                        json_data = clean_line.split('[TELEMETRY_JSON]')[1].strip()
                        code = upload_to_supabase(json_data)
                        last_cloud_status = code
                    except Exception:
                        pass
                    continue

                if 'SUPABASE' in line and 'Status:' in line:
                    if '✓ HTTP 201' not in line and last_cloud_status == 201:
                        line = ' ☁️  SUPABASE    | Status: [✓ HTTP 201 OK - TELEMETRY UPLOADED TO CLOUD]\n'

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
