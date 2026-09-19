import serial, time

def monitor():
    try:
        ser = serial.Serial('/dev/cu.usbserial-0001', 115200, timeout=1)
        print("Monitoring ESP32 on /dev/cu.usbserial-0001...")
        start = time.time()
        while time.time() - start < 15:
            line = ser.readline().decode('utf-8', errors='ignore')
            if line.strip():
                print(line.strip())
        ser.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    monitor()
