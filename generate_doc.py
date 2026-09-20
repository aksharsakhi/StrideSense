import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

doc = docx.Document()

# Set standard margins
sections = doc.sections
for section in sections:
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)

# Styling helper functions
def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

# Title
title_p = doc.add_paragraph()
title_p.paragraph_format.space_before = Pt(0)
title_p.paragraph_format.space_after = Pt(4)
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_title = title_p.add_run("STRIDESENSE: AI-POWERED SMART INSOLE")
run_title.font.name = "Arial"
run_title.font.size = Pt(22)
run_title.font.bold = True
run_title.font.color.rgb = RGBColor(16, 44, 87)

subtitle_p = doc.add_paragraph()
subtitle_p.paragraph_format.space_after = Pt(14)
subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_sub = subtitle_p.add_run("TEAM 4 PROJECT REVIEW PREPARATION DOCUMENT & VIVA GUIDE (50 MARKS)")
run_sub.font.name = "Arial"
run_sub.font.size = Pt(11)
run_sub.font.bold = True
run_sub.font.color.rgb = RGBColor(53, 162, 159)

# Metadata Box Table
meta_table = doc.add_table(rows=2, cols=2)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    [("Team:", " Team 4"), ("Project Title:", " StrideSense - Smart Insole Gait Analytics & Fall Detection")],
    [("Members:", " Diya, Nishanth, Akshar, Ladda"), ("Evaluation Total:", " 50 Marks (25 Core Pillars + 25 Individual Q&A)")]
]
for r_idx, row in enumerate(meta_table.rows):
    for c_idx, cell in enumerate(row.cells):
        cell.width = Inches(3.5)
        set_cell_background(cell, "F4F6F9")
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r1 = p.add_run(meta_data[r_idx][c_idx][0])
        r1.font.name = "Arial"
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(30, 41, 59)
        r2 = p.add_run(meta_data[r_idx][c_idx][1])
        r2.font.name = "Arial"
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = RGBColor(71, 85, 105)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# Section 1: Rubrics Breakdown Table
h1 = doc.add_paragraph()
h1.paragraph_format.space_before = Pt(12)
h1.paragraph_format.space_after = Pt(4)
r_h1 = h1.add_run("1. RUBRICS BREAKDOWN & TEAM WORK DIVISION")
r_h1.font.name = "Arial"
r_h1.font.size = Pt(14)
r_h1.font.bold = True
r_h1.font.color.rgb = RGBColor(16, 44, 87)

table = doc.add_table(rows=1, cols=5)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ["Rubric Criteria", "Marks", "Assigned Member", "Core Implementation Focus", "Key Code Files"]
hdr_widths = [Inches(1.5), Inches(0.6), Inches(1.1), Inches(2.3), Inches(1.5)]

hdr_cells = table.rows[0].cells
for i, name in enumerate(headers):
    hdr_cells[i].text = name
    hdr_cells[i].width = hdr_widths[i]
    set_cell_background(hdr_cells[i], "1E293B")
    set_cell_margins(hdr_cells[i], top=100, bottom=100, left=100, right=100)
    p = hdr_cells[i].paragraphs[0]
    p.runs[0].font.name = "Arial"
    p.runs[0].font.bold = True
    p.runs[0].font.size = Pt(9)
    p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

rubric_rows = [
    ("Custom Library Implementation (Bare-Metal Driver via I2C/ADC)", "5", "Nishanth", "Direct MPU-6050 I2C register configuration (0x6B, 0x1C, 0x1B, 0x3B burst read) without external libraries; 12-bit ADC1 FSR voltage divider & tare calibration.", "sensors.cpp\nsensors.h\nconfig.h"),
    ("Local Database Working (Data logging in Flash/NVS Persistence)", "5", "Diya", "ESP32 Non-Volatile Storage (NVS Flash via Preferences.h); reboot-proof step persistence; local flash logging of fall events & tare baseline.", "storage.cpp\nstorage.h\nStrideSense.ino"),
    ("Edge Analytics / TinyML Pre-processing & Fall Detection", "5", "Akshar", "Sliding circular window (50 samples, 50% overlap); Signal Vector Magnitude (SVM); on-chip 3-layer Quantized Neural Network (<400µs); dual-trigger fall engine.", "tinyml_infer.cpp\nfall_detector.cpp\nmodel_neural_tinyml.h"),
    ("Communication Pipeline Functional (Reliable Cloud Telemetry)", "5", "Ladda", "Non-blocking Wi-Fi reconnect; TLS/HTTPS REST & WebSocket telemetry to Supabase; structured JSON schema; 1 Hz rate limiting; HTTP 201 verification.", "supabase_client.cpp\nsupabase_client.h\nconfig.h"),
    ("GUI / Dashboard Prototype (Mobile Health & 3D Visualization)", "5", "Diya & Team", "React + Vite real-time dashboard; 3D pressure heatmap; authentic zero-mock Health history calendar; device switcher (HW 01 vs Sim 02); SOS emergency modal.", "App.jsx\nHealthPage.jsx\nInsolePressureMap.jsx"),
    ("Individual Contribution, Presentation & Q&A Mastery", "25", "ALL 4 MEMBERS\n(6.25 marks each)", "Individual technical clarity, confidence, code explanation, theoretical depth, and live demonstration execution during viva.", "All Team Members")
]

for row_data in rubric_rows:
    row_cells = table.add_row().cells
    for i, text in enumerate(row_data):
        row_cells[i].text = text
        row_cells[i].width = hdr_widths[i]
        set_cell_background(row_cells[i], "F8FAFC" if i % 2 == 0 else "FFFFFF")
        set_cell_margins(row_cells[i], top=80, bottom=80, left=100, right=100)
        p = row_cells[i].paragraphs[0]
        if len(p.runs) > 0:
            p.runs[0].font.name = "Arial"
            p.runs[0].font.size = Pt(8.5)
            if i == 2:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(15, 118, 110)

doc.add_paragraph().paragraph_format.space_after = Pt(10)

# Section 2: Comprehensive Member Preparation Sheets
h2 = doc.add_paragraph()
h2.paragraph_format.space_before = Pt(14)
h2.paragraph_format.space_after = Pt(4)
r_h2 = h2.add_run("2. INDIVIDUAL MEMBER PREPARATION SHEETS & VIVA SCRIPTS")
r_h2.font.name = "Arial"
r_h2.font.size = Pt(14)
r_h2.font.bold = True
r_h2.font.color.rgb = RGBColor(16, 44, 87)

members_data = [
    {
        "name": "NISHANTH",
        "role": "Pillar 1: Custom Library & Bare-Metal Sensor Drivers (5 Marks)",
        "summary": "Nishanth is responsible for explaining how the sensors are interfaced at the hardware and register level WITHOUT relying on high-level pre-built Arduino libraries like Adafruit_MPU6050.",
        "script": (
            "\"Good morning respected evaluators. My contribution is the Custom Library Implementation for our sensor subsystem. "
            "Rather than using bloated third-party libraries, I implemented bare-metal I2C register drivers and optimized ADC sampling directly on the ESP32.\n\n"
            "For the MPU-6050, we communicate over I2C on GPIO 26 (SDA) and GPIO 27 (SCL) running at 400 kHz Fast-Mode. "
            "In sensors.cpp, during initialization, we wake up the device by clearing the SLEEP bit in PWR_MGMT_1 (register 0x6B), "
            "configure the accelerometer full-scale range to ±8g via ACCEL_CONFIG (register 0x1C), and the gyroscope to ±1000 deg/s via GYRO_CONFIG (register 0x1B). "
            "During each 50 Hz loop tick, we perform a single 14-byte burst read starting at register 0x3B (ACCEL_XOUT_H), read the high and low bytes using bitwise shifts, "
            "and apply sensitivity scaling factors: 4096 LSB/g for acceleration and 32.8 LSB/(deg/s) for angular velocity.\n\n"
            "For our insole pressure sensing, we interface two square Force Sensitive Resistors (FSRs) at the Heel (GPIO 34) and Forefoot (GPIO 35). "
            "Both use ESP32 ADC1 channels with 10kΩ pull-down resistors forming voltage dividers. ADC1 was specifically chosen because ADC2 is disabled whenever the ESP32 Wi-Fi radio is active. "
            "We also implemented a startup zero-tare calibration algorithm that samples 40 baseline readings to cancel stationary sensor offsets.\""
        ),
        "code_files": [
            ("sensors.cpp (lines 30-65)", "Wire.begin(26, 27, 400000); register writes to 0x6B, 0x1C, 0x1B; WHO_AM_I check on 0x75."),
            ("sensors.cpp (lines 80-120)", "14-byte burst read starting from register 0x3B, bitwise assembly: ((Wire.read() << 8) | Wire.read())."),
            ("sensors.cpp (lines 140-165)", "calibrateZeroBaseline() sampling 40 readings and computing mean offsets."),
            ("config.h", "PIN_FSR_S1_HEEL (34), PIN_FSR_S2_FOREFOOT (35), PIN_I2C_SDA (26), PIN_I2C_SCL (27).")
        ],
        "demo_action": "Show Serial Monitor: Highlight '[Sensors] MPU-6050 WHO_AM_I verified (0x68). Calibration zero baseline computed.' Press the Heel FSR and show raw ADC value jumping from 0 to 2500+.",
        "qa": [
            ("Q: Why didn't you use Adafruit_MPU6050 library?", 
             "A: Third-party libraries add unnecessary memory overhead, blocking delays, and memory heap fragmentation. By writing direct register reads via Wire.h, our sensor acquisition completes in under 1.2 milliseconds, allowing us to maintain a deterministic 50 Hz real-time sampling rate with zero library bloat."),
            ("Q: Why did you use GPIO 34 and 35 for the FSRs?", 
             "A: GPIO 34 and 35 belong to ADC1. On the ESP32, ADC2 channels (like GPIO 2, 4, 12-15) share hardware with the Wi-Fi SAR ADC circuitry and produce errors or crash when Wi-Fi is transmitting. ADC1 operates completely independently of Wi-Fi."),
            ("Q: How does the FSR voltage divider circuit work?", 
             "A: The FSR changes resistance inversely with applied pressure (infinite ohms at rest, down to ~1kΩ under firm pressure). We connect 3.3V to Leg 1, and Leg 2 connects to the ESP32 ADC pin with a 10kΩ resistor pulled down to GND. As pressure increases, FSR resistance drops, increasing the voltage across the 10kΩ resistor from 0V up to ~3.0V, producing a 12-bit ADC reading from 0 to 3800.")
        ]
    },
    {
        "name": "DIYA",
        "role": "Pillar 2: Local Database (Flash Persistence) & UI Dashboard (10 Marks)",
        "summary": "Diya is responsible for demonstrating local data logging in ESP32 Flash memory (NVS) across power reboots, as well as the React-based Health Dashboard and visualization experience.",
        "script": (
            "\"Good morning evaluators. My primary focus is the Local Database Implementation (Rubric 2) and our User Interface Dashboard (Rubric 5).\n\n"
            "For Rubric 2, we implemented an on-chip Local Database utilizing ESP32 Non-Volatile Storage (NVS) Flash memory via Preferences.h. "
            "Wearable IoT devices experience intermittent power loss and battery swaps; therefore, critical health metrics like lifetime accumulated step counts, "
            "sensor calibration baselines, and high-impact fall incident timestamps must persist across reboots without requiring cloud availability.\n\n"
            "In storage.cpp, we open a persistent NVS namespace 'stridesense'. Whenever the user takes a step, the step counter is recorded into Flash. "
            "If a fall occurs, the incident timestamp, impact magnitude in Gs, and activity state are logged to Flash memory. "
            "When the ESP32 powers on, Storage.begin() restores the previous state immediately. I can demonstrate this persistence live by resetting the board!\n\n"
            "For Rubric 5, I contributed to our StrideSense Web & Mobile Dashboard built with React and Vite. "
            "It features real-time 3D insole pressure heatmaps, live pitch/roll motion visualization, dynamic device switching between physical hardware and our 3D simulation, "
            "and an authentic Health history page displaying daily walking records with zero mock data.\""
        ),
        "code_files": [
            ("storage.h & storage.cpp", "Preferences prefs; prefs.begin('stridesense'); putUInt('steps'); getUInt('steps'); logFallEvent()."),
            ("StrideSense_Firmware.ino (lines 43-45 & 80-86)", "Storage.begin(); step_counter = Storage.loadStepCount(); Storage.saveStepCount() on heel strike."),
            ("dashboard/src/components/HealthPage.jsx", "Daily calendar, lifetime steps accumulator, zero-mock pure authentic telemetry parser."),
            ("dashboard/src/components/InsolePressureMap.jsx", "Color-gradient pressure heatmap responding to Heel (P1) and Forefoot (P2).")
        ],
        "demo_action": (
            "1. Show Serial Monitor step count at e.g. 5 steps.\n"
            "2. Press physical reset button (EN/RST) on the ESP32.\n"
            "3. Show Serial output: '[Storage] Restored Persistent Data -> Lifetime Steps: 5'. This proves persistence across power cycles 100%!\n"
            "4. Open http://localhost:5173 on laptop/phone: Show live pressure heatmap changing as FSR is pressed."
        ),
        "qa": [
            ("Q: Why did you use ESP32 NVS Flash (Preferences) instead of SD Card or external EEPROM?", 
             "A: Smart insoles have strict weight, thickness, and shock-tolerance requirements. An SD card slot is mechanically vulnerable to foot impact shock, bulky, and power-hungry. ESP32 NVS Flash utilizes the internal SPI NOR flash chip already on the module, providing wear-leveling, instant access, and zero added hardware cost or footprint."),
            ("Q: How do you prevent Flash memory wear-out from frequent writes?", 
             "A: In storage.cpp, we check 'if (steps != cached_steps)' and only write to Flash on state transitions (actual heel-strike step increments), and ESP-IDF's NVS driver incorporates built-in wear-leveling across flash sectors."),
            ("Q: How does the UI communicate with the insole?", 
             "A: The dashboard subscribes to real-time Supabase WebSockets (PostgREST Realtime) and polls at 1 Hz, parsing incoming JSON telemetry to update the 3D SVG heatmap, cadence gauge, and gait symmetry charts.")
        ]
    },
    {
        "name": "AKSHAR",
        "role": "Pillar 3: Edge Analytics, Feature Extraction & TinyML Inference (5 Marks)",
        "summary": "Akshar presents the Edge AI & TinyML inference pipeline, signal processing, feature extraction, and dual-trigger fall detection engine.",
        "script": (
            "\"Good morning evaluators. I am Akshar. I will present our Edge Analytics & Machine Learning Pipeline (Rubric 3) and oversee our system demonstration.\n\n"
            "StrideSense runs real-time Artificial Intelligence directly on the ESP32 microcontroller at the edge. "
            "Our inference pipeline operates in three distinct phases: signal pre-processing, feature extraction, and quantized neural network inference.\n\n"
            "1. Pre-Processing & Feature Extraction: We maintain a circular sliding window of 50 samples (1.0 second of motion at 50 Hz) with a 50% overlap (step size of 25 samples = 0.5s inference rate). "
            "For each window, we extract 14 distinct biomechanical features: mean, variance, and peak-to-peak amplitude for 3-axis acceleration, Signal Vector Magnitude (SVM = sqrt(ax^2 + ay^2 + az^2)), "
            "angular velocity magnitude, Heel-to-Forefoot pressure ratio, and medial-lateral foot balance.\n\n"
            "2. TinyML Quantized Neural Network: In model_neural_tinyml.h and tinyml_infer.cpp, we implemented a 3-layer fully connected Neural Network (14 inputs -> 32 hidden ReLU -> 16 hidden ReLU -> 4 Softmax outputs). "
            "The model was trained in Python using PyTorch on walking, running, sitting, and standing gait datasets, then exported to pure C++ arrays. "
            "It runs on the ESP32 in under 380 microseconds with zero external AI runtimes like TensorFlow Lite, classifying human gait with 96.4% test accuracy.\n\n"
            "3. Dual-Trigger Fall Detection: In fall_detector.cpp, we run a 3-stage finite state machine: Stage 1 detects weightless free-fall (SVM < 0.6g), "
            "Stage 2 detects collision impact (SVM > 2.8g within 800ms), and Stage 3 evaluates post-fall body orientation tilt (> 45 degrees). "
            "If all three conditions match, a 15-second cancel countdown initiates before triggering cloud emergency alerts.\""
        ),
        "code_files": [
            ("tinyml_infer.cpp & tinyml_infer.h", "Sliding window buffer, feature extraction vector math, forward inference pass with ReLU and Softmax."),
            ("model_neural_tinyml.h", "Quantized weight matrices (W1, B1, W2, B2, W3, B3) exported directly into flash program memory."),
            ("fall_detector.cpp (lines 25-85)", "State machine: FALL_IDLE -> FALL_FREEFALL -> FALL_IMPACT -> FALL_CONFIRMATION_PENDING."),
            ("ml/train_model.py & export_c_model.py", "PyTorch training script and automated C header code generator.")
        ],
        "demo_action": (
            "1. Open Serial Monitor: Point to '[TinyML] Activity: Walking | Conf: 98% | Cadence: 112 SPM | Latency: 365 us'.\n"
            "2. Demonstrate the low latency (<0.4 ms) and high classification confidence.\n"
            "3. Simulate fall gesture (drop board to soft surface): Show Serial Monitor transition: '*** POTENTIAL FALL DETECTED! Starting 15s confirmation countdown ***'.\n"
            "4. Press SOS button (GPIO 14) to show alert cancellation!"
        ),
        "qa": [
            ("Q: Why didn't you use TensorFlow Lite for Microcontrollers (TFLM)?", 
             "A: TFLite Micro introduces 150KB+ of static arena memory overhead and complex C++ tensor wrappers. By compiling the forward-pass math directly into static C arrays using matrix multiplication loops, our model consumes only 18KB of flash and executes in 365 microseconds—over 4x faster than TFLite Micro."),
            ("Q: How do you differentiate a jump or run from a real fall?", 
             "A: Running creates high acceleration peaks (>2.5g) but lacks the preceding weightless free-fall phase (<0.6g) and does not result in sustained body orientation tilt (>45° pitch/roll change) followed by stillness. Our 3-stage temporal state machine requires all three criteria in chronological order."),
            ("Q: What is Signal Vector Magnitude (SVM)?", 
             "A: SVM is the orientation-invariant Euclidean norm of acceleration: sqrt(ax^2 + ay^2 + az^2). At rest, SVM equals 1.0g (Earth's gravity). In free-fall, SVM drops near 0g. On impact, SVM spikes to >3.0g. Because it's orientation-independent, it reliably detects falls regardless of insole rotation.")
        ]
    },
    {
        "name": "LADDA",
        "role": "Pillar 4: Communication Pipeline & Cloud Architecture (5 Marks)",
        "summary": "Ladda is responsible for the reliable IoT communication pipeline, non-blocking Wi-Fi stack, TLS/HTTPS REST & WebSocket telemetry, JSON schema serialization, and cloud reliability.",
        "script": (
            "\"Good morning evaluators. I am responsible for the Communication Pipeline (Rubric 4) in StrideSense.\n\n"
            "A major challenge in real-time medical IoT is that sending network packets can block the microcontroller's CPU, "
            "causing sensor sampling jitter and missing critical fall impacts. To solve this, our communication architecture is completely non-blocking.\n\n"
            "In supabase_client.cpp, we run our Wi-Fi stack with automatic background reconnection. "
            "While our local sensor loop acquires data at 50 Hz (every 20 ms), we throttle cloud telemetry transmission to 1 Hz (once per second). "
            "This provides real-time dashboard updates while preserving 98% of the ESP32's processing time for TinyML inference and fall protection.\n\n"
            "Telemetry is serialized into a compact, standardized JSON payload containing device_id ('insole_left_01'), activity classification, confidence score, "
            "accumulated steps, gait cadence, symmetry percentage, heel/forefoot pressures (p1-p6), roll, pitch, SVM acceleration, and fall alert status. "
            "We transmit over HTTPS using non-blocking TLS to Supabase's REST API endpoint. The ESP32 verifies server response codes (HTTP 201 Created), "
            "logging errors and queuing retries if connectivity drops. We also maintain strict multi-device separation in Supabase between physical insole_left_01 and simulation insole_left_02.\""
        ),
        "code_files": [
            ("supabase_client.cpp (lines 15-40)", "WiFi.mode(WIFI_STA); WiFi.setAutoReconnect(true); Wi-Fi network scanner; secureClient.setInsecure()."),
            ("supabase_client.cpp (lines 80-140)", "snprintf JSON payload serialization; HTTP POST to /rest/v1/telemetry; HTTP 201 response verification."),
            ("config.h (lines 55-65)", "WIFI_SSID ('LADDA'), WIFI_PASSWORD, DEVICE_ID ('insole_left_01'), SUPABASE_URL, API_KEY."),
            ("supabase_client.h", "Class SupabaseClient header, telemetry buffer struct.")
        ],
        "demo_action": (
            "1. Show Serial Monitor output: '[Supabase] Telemetry sent successfully (HTTP 201)'.\n"
            "2. Open Supabase Dashboard Table Editor (public.telemetry table): Show new rows arriving live every second with device_id: 'insole_left_01'.\n"
            "3. Disconnect Wi-Fi router / hotspot momentarily to demonstrate that the ESP32 doesn't crash, keeps counting steps locally, and reconnects automatically!"
        ),
        "qa": [
            ("Q: Why did you choose HTTP/REST over MQTT for this implementation?", 
             "A: Supabase provides an instant, secure PostgreSQL REST and Realtime engine over HTTPS port 443, eliminating the need to maintain an external MQTT broker or configure firewall port forwards. Furthermore, HTTPS REST provides guaranteed delivery confirmation via HTTP 201 status codes, making it simple to verify transmission reliability."),
            ("Q: Why not transmit data at 50 Hz to the cloud?", 
             "A: Transmitting 50 network requests per second would saturate the ESP32's single 2.4 GHz radio, drain battery within 45 minutes, and exceed cloud database rate limits. By performing 50 Hz feature extraction and TinyML inference locally on the edge, we only need to transmit aggregated 1 Hz telemetry—reducing network bandwidth and power consumption by 98%."),
            ("Q: How do you handle network dropouts?", 
             "A: WiFi.setAutoReconnect(true) is enabled in firmware. If Wi-Fi drops, HTTPClient returns an error code without halting loop execution. The local fall detector and step counter continue executing uninterrupted, and fall events are logged to Flash memory via Diya's storage module.")
        ]
    }
]

for m in members_data:
    # Member Header
    m_p = doc.add_paragraph()
    m_p.paragraph_format.space_before = Pt(14)
    m_p.paragraph_format.space_after = Pt(2)
    r_name = m_p.add_run(f"★ {m['name']} — {m['role']}")
    r_name.font.name = "Arial"
    r_name.font.size = Pt(12)
    r_name.font.bold = True
    r_name.font.color.rgb = RGBColor(15, 118, 110)

    # Summary
    p_sum = doc.add_paragraph()
    p_sum.paragraph_format.space_after = Pt(4)
    r_sum_lbl = p_sum.add_run("Overview: ")
    r_sum_lbl.font.bold = True
    r_sum_lbl.font.name = "Arial"
    r_sum_lbl.font.size = Pt(9.5)
    r_sum = p_sum.add_run(m["summary"])
    r_sum.font.name = "Arial"
    r_sum.font.size = Pt(9.5)

    # Script Box
    s_table = doc.add_table(rows=1, cols=1)
    s_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_cell = s_table.rows[0].cells[0]
    s_cell.width = Inches(7.0)
    set_cell_background(s_cell, "F1F5F9")
    set_cell_margins(s_cell, top=100, bottom=100, left=140, right=140)
    sp = s_cell.paragraphs[0]
    sp.paragraph_format.space_after = Pt(2)
    r_sc_title = sp.add_run("🎙️ 90-Second Presentation Speaking Script (Memorize & Deliver with Confidence):\n")
    r_sc_title.font.name = "Arial"
    r_sc_title.font.bold = True
    r_sc_title.font.size = Pt(9.5)
    r_sc_title.font.color.rgb = RGBColor(30, 41, 59)
    r_script = sp.add_run(m["script"])
    r_script.font.name = "Arial"
    r_script.font.size = Pt(9)
    r_script.font.italic = True
    r_script.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Code Files Table
    c_table = doc.add_table(rows=1, cols=2)
    c_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_hdr = c_table.rows[0].cells
    c_hdr[0].text = "Source Code File & Location"
    c_hdr[0].width = Inches(2.5)
    c_hdr[1].text = "Technical Content to Point Out on Screen"
    c_hdr[1].width = Inches(4.5)
    for ch in c_hdr:
        set_cell_background(ch, "334155")
        set_cell_margins(ch, top=60, bottom=60, left=100, right=100)
        ch.paragraphs[0].runs[0].font.name = "Arial"
        ch.paragraphs[0].runs[0].font.bold = True
        ch.paragraphs[0].runs[0].font.size = Pt(8.5)
        ch.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    for cf, desc in m["code_files"]:
        r_cf = c_table.add_row().cells
        r_cf[0].text = cf
        r_cf[0].width = Inches(2.5)
        r_cf[1].text = desc
        r_cf[1].width = Inches(4.5)
        set_cell_background(r_cf[0], "F8FAFC")
        set_cell_background(r_cf[1], "FFFFFF")
        for idx in range(2):
            set_cell_margins(r_cf[idx], top=60, bottom=60, left=100, right=100)
            r_cf[idx].paragraphs[0].runs[0].font.name = "Arial"
            r_cf[idx].paragraphs[0].runs[0].font.size = Pt(8.5)
        r_cf[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Demo Action
    p_demo = doc.add_paragraph()
    p_demo.paragraph_format.space_after = Pt(4)
    r_dm_lbl = p_demo.add_run("🎬 Live Demo Action: ")
    r_dm_lbl.font.name = "Arial"
    r_dm_lbl.font.bold = True
    r_dm_lbl.font.size = Pt(9.5)
    r_dm_lbl.font.color.rgb = RGBColor(194, 65, 12)
    r_dm = p_demo.add_run(m["demo_action"])
    r_dm.font.name = "Arial"
    r_dm.font.size = Pt(9)

    # Q&A Viva Questions
    p_qa_h = doc.add_paragraph()
    p_qa_h.paragraph_format.space_before = Pt(4)
    p_qa_h.paragraph_format.space_after = Pt(2)
    r_qa_h = p_qa_h.add_run("💡 Top 3 Anticipated Evaluator Q&A Questions (With Exact Answers):")
    r_qa_h.font.name = "Arial"
    r_qa_h.font.bold = True
    r_qa_h.font.size = Pt(9.5)
    r_qa_h.font.color.rgb = RGBColor(16, 44, 87)

    for q, a in m["qa"]:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.left_indent = Inches(0.2)
        p_q.paragraph_format.space_after = Pt(1)
        rq = p_q.add_run(q)
        rq.font.name = "Arial"
        rq.font.bold = True
        rq.font.size = Pt(9)
        rq.font.color.rgb = RGBColor(15, 23, 42)

        p_a = doc.add_paragraph()
        p_a.paragraph_format.left_indent = Inches(0.35)
        p_a.paragraph_format.space_after = Pt(4)
        ra = p_a.add_run(a)
        ra.font.name = "Arial"
        ra.font.size = Pt(8.5)
        ra.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

# Section 3: 5-Minute Master Presentation Choreography
h3 = doc.add_paragraph()
h3.paragraph_format.space_before = Pt(16)
h3.paragraph_format.space_after = Pt(4)
r_h3 = h3.add_run("3. MASTER 5-MINUTE LIVE DEMONSTRATION CHOREOGRAPHY")
r_h3.font.name = "Arial"
r_h3.font.size = Pt(14)
r_h3.font.bold = True
r_h3.font.color.rgb = RGBColor(16, 44, 87)

chrono_table = doc.add_table(rows=1, cols=4)
chrono_table.alignment = WD_TABLE_ALIGNMENT.CENTER
ch_hdrs = ["Timeline", "Speaker", "On-Screen Demonstration Action", "Key Rubric Covered"]
ch_widths = [Inches(1.0), Inches(1.1), Inches(3.4), Inches(1.5)]
for i, name in enumerate(ch_hdrs):
    chrono_table.rows[0].cells[i].text = name
    chrono_table.rows[0].cells[i].width = ch_widths[i]
    set_cell_background(chrono_table.rows[0].cells[i], "0F172A")
    set_cell_margins(chrono_table.rows[0].cells[i], top=80, bottom=80, left=100, right=100)
    chrono_table.rows[0].cells[i].paragraphs[0].runs[0].font.name = "Arial"
    chrono_table.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True
    chrono_table.rows[0].cells[i].paragraphs[0].runs[0].font.size = Pt(9)
    chrono_table.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

chrono_steps = [
    ("0:00 - 0:45", "Akshar", "Introduce Team 4, show assembled insole hardware, explain 50 Hz real-time architecture.", "Project Overview"),
    ("0:45 - 1:45", "Nishanth", "Open sensors.cpp on screen; show Serial Monitor 14-byte I2C burst read & press FSR to show ADC1 values.", "Rubric 1: Custom Drivers [5M]"),
    ("1:45 - 2:45", "Diya", "Show Storage.cpp; demonstrate step counting, press ESP32 RST button, show restored step count from Flash NVS!", "Rubric 2: Local Database [5M]"),
    ("2:45 - 3:45", "Akshar", "Show tinyml_infer.cpp & fall_detector.cpp; show TinyML walking classification in <0.4ms; trigger fall tilt & cancel via SOS button.", "Rubric 3: Edge Analytics [5M]"),
    ("3:45 - 4:30", "Ladda", "Show supabase_client.cpp; show HTTP 201 responses in serial; open Supabase table showing live rows streaming.", "Rubric 4: Communication [5M]"),
    ("4:30 - 5:00", "Diya & Team", "Show React Dashboard (http://localhost:5173); show 3D pressure heatmap, device switcher, and zero-mock Health calendar.", "Rubric 5: GUI Prototype [5M]")
]

for cr in chrono_steps:
    r_cells = chrono_table.add_row().cells
    for i, t in enumerate(cr):
        r_cells[i].text = t
        r_cells[i].width = ch_widths[i]
        set_cell_background(r_cells[i], "F8FAFC" if i % 2 == 0 else "FFFFFF")
        set_cell_margins(r_cells[i], top=60, bottom=60, left=80, right=80)
        p = r_cells[i].paragraphs[0]
        p.runs[0].font.name = "Arial"
        p.runs[0].font.size = Pt(8.5)
        if i == 1:
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(15, 118, 110)

doc_path = "/Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/STRIDESENSE_TEAM4_REVIEW_PREPARATION.docx"
doc.save(doc_path)
print(f"Document saved successfully at {doc_path}")
