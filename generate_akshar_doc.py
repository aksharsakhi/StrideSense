#!/usr/bin/env python3
"""
Generate comprehensive Word Document (.docx) for Akshar's presentation:
Dataset, Edge Analytics, TinyML Pre-processing, and Viva Defense Guide.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

doc = docx.Document()

# Standard Margins
for section in doc.sections:
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)

# Color Palette Constants
COLOR_NAVY = RGBColor(16, 44, 87)       # #102C57 - Primary Headings
COLOR_TEAL = RGBColor(14, 131, 136)     # #0E8388 - Subheadings & Accents
COLOR_DARK = RGBColor(30, 41, 59)       # #1E293B - Body Text
COLOR_MUTED = RGBColor(100, 116, 139)   # #64748B - Metadata & Footers
COLOR_RED = RGBColor(185, 28, 28)       # #B91C1C - Highlights / Alerts

HEX_NAVY = "102C57"
HEX_TEAL = "0E8388"
HEX_LIGHT_BG = "F8FAFC"
HEX_BORDER = "CBD5E1"
HEX_CALLOUT_BG = "F0FDF4"
HEX_CALLOUT_BORDER = "22C55E"
HEX_WARN_BG = "FEF2F2"
HEX_WARN_BORDER = "EF4444"
HEX_CODE_BG = "F1F5F9"

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="none"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def add_header(title, level=1):
    h = doc.add_paragraph()
    h.paragraph_format.keep_with_next = True
    run = h.add_run(title)
    run.font.name = "Arial"
    run.font.bold = True
    if level == 1:
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        run.font.size = Pt(15)
        run.font.color.rgb = COLOR_NAVY
    elif level == 2:
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        run.font.size = Pt(12.5)
        run.font.color.rgb = COLOR_TEAL
    elif level == 3:
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(2)
        run.font.size = Pt(11)
        run.font.color.rgb = COLOR_DARK
    return h

def add_p(text, bold_prefix="", space_after=5):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
    r_body = p.add_run(text)
    r_body.font.name = "Arial"
    r_body.font.size = Pt(10)
    r_body.font.color.rgb = COLOR_DARK
    return p

def add_bullet(text, bold_prefix=""):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
    r_body = p.add_run(text)
    r_body.font.name = "Arial"
    r_body.font.size = Pt(10)
    r_body.font.color.rgb = COLOR_DARK
    return p

def add_callout(text, title="KEY TAKEAWAY", is_warn=False):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.rows[0].cells[0]
    cell.width = Inches(7.0)
    bg = HEX_WARN_BG if is_warn else HEX_CALLOUT_BG
    border_col = HEX_WARN_BORDER if is_warn else HEX_CALLOUT_BORDER
    set_cell_background(cell, bg)
    set_cell_margins(cell, top=100, bottom=100, left=160, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_col}"/>
            <w:top w:val="none"/>
            <w:right w:val="none"/>
            <w:bottom w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)

    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(f"[{title}] ")
    r_title.font.name = "Arial"
    r_title.font.bold = True
    r_title.font.size = Pt(10)
    r_title.font.color.rgb = COLOR_RED if is_warn else COLOR_TEAL

    r_text = p.add_run(text)
    r_text.font.name = "Arial"
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

# =========================================================================
# DOCUMENT TITLE & METADATA
# =========================================================================
title_p = doc.add_paragraph()
title_p.paragraph_format.space_before = Pt(0)
title_p.paragraph_format.space_after = Pt(3)
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_title = title_p.add_run("STRIDESENSE: AI SMART INSOLE")
run_title.font.name = "Arial"
run_title.font.size = Pt(22)
run_title.font.bold = True
run_title.font.color.rgb = COLOR_NAVY

sub_p = doc.add_paragraph()
sub_p.paragraph_format.space_after = Pt(12)
sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_sub = sub_p.add_run("EXPLANATION & PRESENTATION MASTER GUIDE: DATASETS, EDGE ANALYTICS & TINYML PRE-PROCESSING")
run_sub.font.name = "Arial"
run_sub.font.size = Pt(11)
run_sub.font.bold = True
run_sub.font.color.rgb = COLOR_TEAL

# Metadata Box
meta_table = doc.add_table(rows=3, cols=2)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    [("Presenter:", " Akshar"), ("Team:", " Team 4 (Diya, Nishanth, Akshar, Ladda)")],
    [("Assigned Presentation Focus:", " Datasets, Edge Analytics & TinyML"), ("Target Evaluation Marks:", " 11.25 Marks (Rubric 3 + Individual Viva)")],
    [("Source Firmware Files:", " tinyml_infer.cpp, fall_detector.cpp, filter.cpp"), ("Dataset & ML Scripts:", " datasets/gait_synthesizer.py, ml/train_model.py")]
]
for r_idx, row in enumerate(meta_table.rows):
    for c_idx, cell in enumerate(row.cells):
        cell.width = Inches(3.5)
        set_cell_background(cell, HEX_LIGHT_BG)
        set_cell_margins(cell, top=70, bottom=70, left=120, right=120)
        lbl, val = meta_data[r_idx][c_idx]
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r_lbl = p.add_run(lbl)
        r_lbl.font.name = "Arial"
        r_lbl.font.size = Pt(9.5)
        r_lbl.font.bold = True
        r_lbl.font.color.rgb = COLOR_NAVY
        r_val = p.add_run(val)
        r_val.font.name = "Arial"
        r_val.font.size = Pt(9.5)
        r_val.font.color.rgb = COLOR_DARK
set_table_borders(meta_table, HEX_BORDER, sz="6")

doc.add_paragraph().paragraph_format.space_after = Pt(8)

# =========================================================================
# SECTION 1: THE DATASETS
# =========================================================================
add_header("1. The Datasets: Origins, Public Baselines & Custom Synthesizer", level=1)

add_p("If the external examiner or professor asks: 'Did you download your dataset or make your own?', here is the exact, engineering-rigorous answer to deliver:")

add_callout(
    "\"We adopted a HYBRID STRATEGY: We referenced four international clinical benchmark datasets (Nature Scientific Data Smart-Insole, PhysioNet gaitpdb, SisFall, and UCI-HAR) to study biomechanical force curves and fall kinematics. Then, because commercial datasets have 16–32 pressure nodes that do not match our shoe's 6-FSR hardware geometry, we engineered an in-tree Biomechanical Gait Synthesizer (gait_synthesizer.py). This generated our 25,000-sample Master Dataset across 5 demographic profiles, which we cross-validated against real readings from our physical ESP32 prototype.\"",
    title="EXACT ANSWER TO PROFESSOR"
)

add_header("1.1 The Four Clinical Benchmark References We Studied", level=2)
add_p("These clinical databases (cataloged in datasets/README.md and automated via datasets/download_datasets.py) provided our mathematical and physiological foundation:")

benchmarks = [
    ("A. The Smart-Insole Dataset (Nature Scientific Data / BMI-HMU): ", "29 subjects (healthy young adults, elderly, and Parkinson's patients) walking with Moticon wireless sensor insoles at 100 Hz. Contained 16 pressure sensors per insole + 3D accelerometer + 3D gyroscope. Used by us to baseline heel-to-toe force transfer timing and bilateral symmetry."),
    ("B. PhysioNet Gait in Parkinson's Disease (gaitpdb): ", "166 subjects (93 patients, 73 controls) using 8 vertical Ground Reaction Force (vGRF) sensors under each foot at 100 Hz. Used by us to calibrate stance-phase duration and swing-phase force decay curves."),
    ("C. SisFall: Fall and Movement Dataset (Sensors 2017): ", "38 participants (23 young adults, 15 elderly) performing 34 activities: 19 Activities of Daily Living (ADLs) and 15 Fall types (slip, trip, lateral, backward, fainting). Provided the mathematical thresholds for free-fall (<0.6g) and collision impact (>3.5g)."),
    ("D. UCI Human Activity Recognition (HAR): ", "30 volunteers wearing 6-DOF IMUs at 50 Hz performing walking, climbing, sitting, and standing. Provided baseline angular velocity statistics for standard locomotion.")
]
for title, desc in benchmarks:
    add_bullet(desc, bold_prefix=title)

add_header("1.2 Why Commercial Datasets Were Inadequate for Direct Training", level=2)
add_bullet("Sensor Geometry Incompatibility: Moticon insoles use 16 to 32 pressure cells spread across the foot. StrideSense uses 6 strategically placed FSR sensors (S1 Calcaneus, S2 Lateral Midfoot, S3 Medial Arch, S4 4th/5th Metatarsal, S5 1st Metatarsal ball, S6 Hallux big toe) + 1 arch-mounted MPU-6050 IMU. Training on a 32-sensor matrix would make it impossible to deploy bare-metal inference on our 6-FSR hardware.", bold_prefix="Spatial Mismatch: ")
add_bullet("Safety & Geriatric Realism: You cannot ask human volunteers—especially elderly test subjects—to suffer 200 real, violent falls onto a concrete floor to train a model. A physics-grounded mathematical synthesizer allows safe, high-fidelity modeling of diverse body weights, cadences, and fall angles.", bold_prefix="Safety Constraints: ")

add_header("1.3 Our Master Dataset: Biomechanical Gait Synthesizer", level=2)
add_p("Built in datasets/gait_synthesizer.py and saved to datasets/stridesense_master_dataset.csv:")

# Dataset Summary Table
ds_table = doc.add_table(rows=6, cols=3)
ds_table.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ["Parameter", "Specification", "Engineering & Biomechanical Significance"]
for i, h in enumerate(headers):
    cell = ds_table.rows[0].cells[i]
    set_cell_background(cell, HEX_NAVY)
    set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
    p = cell.paragraphs[0]
    r = p.add_run(h)
    r.font.name = "Arial"
    r.font.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(255, 255, 255)

rows_data = [
    ("Total Samples", "25,000 synchronized records", "500 seconds (8.3 minutes) of continuous multi-channel locomotion."),
    ("Sampling Rate", "50 Hz (dt = 20 ms)", "Exactly matches the ESP32 firmware non-blocking sensor loop clock."),
    ("Synchronized Channels", "12 Channels (P1..P6, Ax, Ay, Az, Gx, Gy, Gz)", "6 calibrated plantar FSRs (0-4095 ADC) + 6-DOF IMU kinematics."),
    ("Subject Profiles", "5 Demographic Profiles (50kg to 95kg)", "Covers Normal, Lightweight, Heavyweight, Brisk Walker, Elderly Gait."),
    ("Activity Classes", "5 Classes (Standing, Walking, Running, Sitting, Fall)", "Stratified distribution: Walk (35%), Stand (20%), Run (20%), Sit (15%), Fall (10%).")
]

for r_idx, (p1, p2, p3) in enumerate(rows_data):
    row = ds_table.rows[r_idx + 1]
    bg = HEX_LIGHT_BG if r_idx % 2 == 0 else "FFFFFF"
    for c_idx, val in enumerate([p1, p2, p3]):
        cell = row.cells[c_idx]
        set_cell_background(cell, bg)
        set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(val)
        r.font.name = "Arial"
        r.font.size = Pt(9)
        if c_idx == 0:
            r.font.bold = True
            r.font.color.rgb = COLOR_NAVY
        else:
            r.font.color.rgb = COLOR_DARK
set_table_borders(ds_table, HEX_BORDER, sz="4")

doc.add_paragraph().paragraph_format.space_after = Pt(10)

# =========================================================================
# SECTION 2: EDGE ANALYTICS & TINYML PRE-PROCESSING
# =========================================================================
add_header("2. Edge Analytics & TinyML Pre-Processing Pipeline", level=1)

add_p("This is Akshar's primary technical pillar (Rubric 3). Wearable health insoles cannot stream raw 50 Hz waveforms to the cloud due to battery drain, RF dropouts, and network latency. StrideSense performs 100% of feature extraction, model inference, and fall detection locally on the ESP32 in real time.")

add_header("2.1 The 4-Stage On-Device Architecture", level=2)

flow_steps = [
    ("Stage 1: Raw Sensor Ingestion & Ring Buffer (filter.cpp): ", "Acquires 6 FSR analog channels and 6-DOF MPU-6050 readings at 50 Hz. Ingests samples into a 50-element circular static buffer (1.0 sec window, 500 ms stride) with zero dynamic memory allocation."),
    ("Stage 2: Real-Time Biomechanical Feature Extraction (tinyml_infer.cpp): ", "Computes a 24-dimensional feature vector across statistical, kinematic, and plantar kinetic domains."),
    ("Stage 3: Bare-Metal C TinyML Inference (model_data.h / model_neural_tinyml.h): ", "Executes a compiled Random Forest (8 trees) or Deep Learning MLP (24->16->5) in under 1 microsecond."),
    ("Stage 4: Edge Analytics & Dual-Trigger Fall Guard (fall_detector.cpp): ", "Calculates step cadence, pronation ratios, and runs a 4-state fall detection machine with a 15-second haptic cancellation window.")
]
for title, desc in flow_steps:
    add_bullet(desc, bold_prefix=title)

add_header("2.2 Stage 1: Windowing & Filtering (filter.cpp, filter.h)", level=2)
add_p("The ESP32 firmware samples the hardware at 50 Hz (20 ms interval) maintained by: if (now - last_sample_time >= SAMPLING_PERIOD_MS).")
add_bullet("Window Size (N = 50 samples): Represents exactly 1.0 second of temporal movement, long enough to capture at least one complete heel-strike-to-toe-off stride cycle.", bold_prefix="1.0s Window: ")
add_bullet("Stride / Step Size (25 samples = 500 ms): 50% window overlap. TinyML inference evaluates twice every second, ensuring seamless state tracking without missing rapid dynamic transitions.", bold_prefix="50% Overlap: ")
add_bullet("Static Circular Ring Buffer: All memory is pre-allocated at compile time (SensorSample buffer[50]). Zero dynamic heap allocation (0 bytes malloc) prevents memory fragmentation and eliminates MCU crash risks.", bold_prefix="Zero Heap Fragmentation: ")

add_header("2.3 Stage 2: The 24-Dimensional Feature Extraction Matrix", level=2)
add_p("In tinyml_infer.cpp, extractFeatures() transforms the 50 raw samples into a 24-dimensional vector that encapsulates human biomechanics:")

# Feature Matrix Table
feat_table = doc.add_table(rows=9, cols=3)
feat_table.alignment = WD_TABLE_ALIGNMENT.CENTER
f_headers = ["Index Range", "Feature Category & Formula", "Biomechanical Purpose & Clinical Meaning"]
for i, h in enumerate(f_headers):
    cell = feat_table.rows[0].cells[i]
    set_cell_background(cell, HEX_NAVY)
    set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
    p = cell.paragraphs[0]
    r = p.add_run(h)
    r.font.name = "Arial"
    r.font.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(255, 255, 255)

f_rows = [
    ("0 to 5", "Linear Kinematics:\nMean & Std of Ax, Ay, Az", "Tracks foot inclination, gravitational tilt vector, and forward acceleration intensity."),
    ("6 to 11", "Angular Kinematics:\nMean & Std of Gx, Gy, Gz", "Measures leg swing angular velocity (Gy), foot roll stability (Gx), and pivot rotation (Gz)."),
    ("12 to 14", "Accel Signal Vector Mag:\nMean, Max, Std of sqrt(Ax^2+Ay^2+Az^2)", "Measures 3D shock energy. Max SVM detects ground impact (>3.5g); low SVM detects free-fall (<0.6g)."),
    ("15 to 16", "Gyro Signal Vector Mag:\nMean, Max of sqrt(Gx^2+Gy^2+Gz^2)", "Quantifies overall rotational agility. Distinguishes controlled turning from sudden uncontrolled stumbling."),
    ("17 to 19", "Total Plantar Force:\nMean, Std, Max of sum(P1..P6)", "Differentiates foot contact states: completely unloaded (<200) = Sitting; fully loaded (>2000) = Walking/Running."),
    ("20", "Plantar Stance Ratio:\nP_heel / (P_forefoot + 1.0)", "Identifies gait cycle phases: high ratio (>2.0) = Heel Strike; low ratio (<0.4) = Terminal Propulsion (Toe-off)."),
    ("21", "Medial / Lateral Balance:\nP_medial / (P_lateral + 1.0)", "Monitors foot pronation vs supination. Crucial for diabetic ulcer prevention and gait correction."),
    ("22 to 23", "Isolated Force Concentrations:\nMean Heel (P1) & Mean Forefoot (P4+P5+P6)", "Provides absolute weight loading across the calcaneus vs the metatarsal propulsion zone.")
]

for r_idx, (p1, p2, p3) in enumerate(f_rows):
    row = feat_table.rows[r_idx + 1]
    bg = HEX_LIGHT_BG if r_idx % 2 == 0 else "FFFFFF"
    for c_idx, val in enumerate([p1, p2, p3]):
        cell = row.cells[c_idx]
        set_cell_background(cell, bg)
        set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(val)
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        if c_idx == 0:
            r.font.bold = True
            r.font.color.rgb = COLOR_NAVY
        else:
            r.font.color.rgb = COLOR_DARK
set_table_borders(feat_table, HEX_BORDER, sz="4")

doc.add_paragraph().paragraph_format.space_after = Pt(10)

add_header("2.4 Stage 3: Bare-Metal C TinyML Inference (model_data.h & model_neural_tinyml.h)", level=2)

add_callout(
    "WHY BARE-METAL C INSTEAD OF TENSORFLOW LITE MICRO (TFLM)?\nTFLM requires ~150 KB of flash for runtime interpreters, operator kernels, and tensor arena allocations. By translating our scikit-learn decision trees and PyTorch MLP weights into pure C headers with static arrays, we achieved 0.2 microsecond latency, zero dynamic heap allocation, and reduced flash footprint to under 5 KB!",
    title="KEY ARCHITECTURAL DECISION"
)

# Benchmark Table
bm_table = doc.add_table(rows=7, cols=3)
bm_table.alignment = WD_TABLE_ALIGNMENT.CENTER
bm_headers = ["Metric / Benchmark", "Random Forest Model (Primary)", "Deep Learning MLP Neural Network"]
for i, h in enumerate(bm_headers):
    cell = bm_table.rows[0].cells[i]
    set_cell_background(cell, HEX_NAVY)
    set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
    p = cell.paragraphs[0]
    r = p.add_run(h)
    r.font.name = "Arial"
    r.font.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(255, 255, 255)

bm_rows = [
    ("Model Architecture", "8 Decision Trees (max_depth = 7)", "Linear(24->16) + ReLU + Linear(16->5) + Softmax"),
    ("Test Accuracy", "98.97%", "98.97%"),
    ("5-Fold Cross Validation", "98.46% (±0.00%)", "98.15% (±0.45%)"),
    ("Inference Execution Latency", "0.20 – 0.27 microseconds", "0.53 – 0.60 microseconds"),
    ("Flash Memory Footprint", "~4.8 KB", "~2.4 KB"),
    ("Dynamic Heap RAM", "0 Bytes (Stack Only)", "0 Bytes (Stack Only)")
]

for r_idx, (p1, p2, p3) in enumerate(bm_rows):
    row = bm_table.rows[r_idx + 1]
    bg = HEX_LIGHT_BG if r_idx % 2 == 0 else "FFFFFF"
    for c_idx, val in enumerate([p1, p2, p3]):
        cell = row.cells[c_idx]
        set_cell_background(cell, bg)
        set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(val)
        r.font.name = "Arial"
        r.font.size = Pt(9)
        if c_idx == 0:
            r.font.bold = True
            r.font.color.rgb = COLOR_NAVY
        elif c_idx == 1:
            r.font.bold = True
            r.font.color.rgb = COLOR_TEAL
        else:
            r.font.color.rgb = COLOR_DARK
set_table_borders(bm_table, HEX_BORDER, sz="4")

doc.add_paragraph().paragraph_format.space_after = Pt(10)

add_header("2.5 Stage 4: Dual-Trigger Fall Guard State Machine (fall_detector.cpp)", level=2)
add_p("Fall detection runs in parallel with TinyML to provide emergency safety with zero false alarms:")
add_bullet("Phase 1: Free-Fall Drop: Triggered when SVM_acc < 0.6g for >= 160 ms (loss of gravitational support).", bold_prefix="Free-Fall Detection: ")
add_bullet("Phase 2: Impact Collision Shock: Triggered when SVM_acc exceeds 3.5g within 800 ms of free fall.", bold_prefix="Impact Shock: ")
add_bullet("Phase 3: Post-Impact Posture & Stillness: Settle period of 1.5 seconds. Confirms fall if pitch/roll tilt shifted by > 45 degrees AND gyroscope angular velocity is quiet (< 35 deg/s, lying motionless on the floor).", bold_prefix="Posture & Stillness: ")
add_bullet("Phase 4: 15-Second Grace Window: Hardware haptic motor pulses + Red LED flashes. The user has 15 seconds to press the physical SOS / Cancel button on GPIO 14. If uncancelled, emergency telemetry is dispatched to cloud/caregivers and saved to Flash NVS storage.", bold_prefix="15s Haptic Grace Window: ")

# =========================================================================
# SECTION 3: VERBATIM 2-MINUTE PRESENTATION SCRIPT
# =========================================================================
add_header("3. Verbatim 2-Minute Presentation Script (Read Aloud)", level=1)

add_p("Practice reading this script out loud tonight. It takes exactly 110 seconds, hits every required rubric mark, and sounds natural and technically authoritative:")

script_text = (
    "\"Good morning, esteemed evaluators. My name is Akshar, and I am presenting the Edge Analytics, TinyML Pre-Processing, and Fall Detection Pipeline for StrideSense.\n\n"
    "In wearable health systems, transmitting raw 50 Hz waveforms across the internet drains battery within hours and fails whenever Wi-Fi disconnects. To solve this, StrideSense performs 100% of its feature extraction and machine learning directly on the ESP32 in real time.\n\n"
    "For our data foundation, we utilized a dual strategy: We referenced four clinical benchmarks—such as the Nature Scientific Data Smart-Insole dataset and the SisFall database—to extract ground-truth ground reaction forces and fall kinematics. Because our hardware uses a custom 12-channel configuration of 6 plantar FSRs and a 6-DOF IMU, we developed a multi-subject biomechanical synthesizer in Python. This generated 25,000 synchronized samples across 5 demographic profiles, including lightweight, heavyweight, and elderly walking styles.\n\n"
    "On the ESP32, our processing operates in four stages:\n"
    "First, incoming sensor streams are ingested at 50 Hz into a static circular window buffer of 50 samples, providing a 1.0-second temporal window with a 500-millisecond stride.\n\n"
    "Second, our engine computes a 24-dimensional feature vector in real time. This captures 3D kinematic variance, Signal Vector Magnitude for collision shock, total plantar load, and clinical ratios like the Heel-to-Forefoot propulsion ratio and Medial-to-Lateral pronation balance.\n\n"
    "Third, for inference, instead of heavy runtimes like TensorFlow Lite, we compiled our trained Random Forest and Deep Learning MLP models directly into pure C static headers. Both achieve 98.97% test accuracy, require zero dynamic heap memory, and execute in under 1 microsecond on the ESP32's 240 MHz Tensilica core.\n\n"
    "Finally, this feeds our Dual-Trigger Fall Guard state machine, which detects free-fall drops below 0.6g, impact shocks above 3.5g, and post-fall immobility, supported by a 15-second haptic cancellation window.\n\n"
    "This pipeline is currently running live on the physical hardware before you. Thank you, and I am glad to answer any questions.\""
)

add_callout(script_text, title="AKSHAR'S 2-MINUTE VERBATIM SCRIPT")

# =========================================================================
# SECTION 4: TECHNICAL VIVA DEFENSE & EXAMINER Q&A
# =========================================================================
add_header("4. Technical Viva Defense: 8 Likely Examiner Questions & Answers", level=1)

qas = [
    ("Q1: Why did you use synthetic data instead of just walking around in the shoe?",
     "We used real prototype hardware to calibrate ADC sensor baselines and zero-offsets. However, training a generalized machine learning model requires thousands of samples across diverse body weights (50 kg to 95 kg), walking cadences, and dangerous edge-cases like violent slip-and-fall events. Asking human subjects—especially elderly individuals—to perform 200 real falls onto hard floors is hazardous. Our physics synthesizer accurately modeled these dynamics based on published clinical data from Nature and SisFall."),
    
    ("Q2: Why did you choose 24 features? Which features have the highest importance?",
     "The 24 features capture the complete tri-axial kinematics and plantar kinetics without redundant computation. The most influential features are:\n1. svm_acc_max: Instantly isolates ground impact collision during falls or running.\n2. force_total_mean: Reliably distinguishes sitting (unloaded foot) from standing and walking.\n3. heel_forefoot_ratio: Tracks stance progression from initial heel-strike to toe-off.\n4. gyro_y_std: Measures the rhythmic pitch swing of the lower leg during locomotion."),
     
    ("Q3: Why did you avoid TensorFlow Lite Micro?",
     "TensorFlow Lite Micro introduces roughly 150 KB of flash overhead and requires dynamic tensor arena memory management. By compiling our trained scikit-learn trees and PyTorch weights into bare-metal C headers (model_data.h), we achieved 0.2 microsecond execution latency, required 0 bytes of dynamic heap memory, and completely eliminated MCU memory fragmentation."),
     
    ("Q4: How do you prevent false fall alarms when someone jumps or sits down quickly?",
     "Through our 3-stage validation logic in fall_detector.cpp: Jumping produces high impact, but it is NOT preceded by a prolonged free-fall phase (<0.6g), nor is it followed by post-impact stillness and a >45 degree tilt change. Sitting down exhibits controlled angular velocity, not an uncontrolled collapse. Furthermore, our 15-second haptic grace period allows the user to cancel accidental triggers via GPIO 14 before any alert is sent."),
     
    ("Q5: What is the CPU execution budget of your TinyML model on the ESP32?",
     "Our sensor sampling interval is 20 ms (20,000 microseconds). Our Random Forest model executes in 0.20 microseconds, consuming less than 0.005% of the available CPU time on the 240 MHz Tensilica core. This leaves 99.99% of the CPU free for Wi-Fi transmission, calibration, and sensor polling."),
     
    ("Q6: How does the ESP32 compute cadence in real time?",
     "Cadence is derived from cyclic force variance of total plantar force combined with heel-strike peak detection. For walking, it maps to 104–130 steps per minute; for running, it scales to 158–195 steps per minute."),
     
    ("Q7: How do you handle sensor drift and ADC noise?",
     "In sensors.cpp, we run a software tare zero-calibration routine at boot (tareSensorBaseline()) that subtracts resting baseline ADC noise from each FSR channel. In addition, our 50-sample sliding window acts as a moving average low-pass filter to reject high-frequency electronic noise."),
     
    ("Q8: How does the ESP32 know the user is lying motionless after a fall?",
     "The fall state machine waits for a 1.5-second settle period after impact shock, then checks the gyroscope magnitude sqrt(Gx^2+Gy^2+Gz^2). If angular velocity is below 35 deg/s and the orientation tilt changed by more than 45 degrees, the user is confirmed to be motionless on the ground.")
]

for q, a in qas:
    add_p(a, bold_prefix=f"{q}\nAnswer: ", space_after=6)

# =========================================================================
# SECTION 5: LIVE HARDWARE DEMO CHOREOGRAPHY
# =========================================================================
add_header("5. Live Hardware Demonstration Choreography (Akshar's Turn)", level=1)

add_p("During your presentation segment, perform this 30-second live demonstration on the ESP32 hardware to secure full practical marks:")

demo_steps = [
    ("Step 1 (Show Serial Monitor & Real-Time Inference): ", "Point to the Serial Monitor showing: [TinyML] Activity: Walking | Conf: 100% | Latency: 0 us. Highlight that latency is under 1 microsecond."),
    ("Step 2 (Demonstrate Heel-Strike vs Toe-Off): ", "Press the Calcaneus FSR (GPIO 34). Show that the step count increments and the Heel-to-Forefoot ratio jumps above 2.0."),
    ("Step 3 (Trigger Simulated Fall Alert): ", "Quickly drop and tilt the board horizontally onto the desk. Show that the Red LED flashes and the haptic motor vibrates, entering the 15-second grace window."),
    ("Step 4 (Cancel Alert via Hardware SOS Button): ", "Press the tactile switch on GPIO 14. Show that the alarm cancels immediately ([FallEngine] Fall alert successfully CANCELLED by user). Explain that this prevents false emergency dispatches.")
]
for title, desc in demo_steps:
    add_bullet(desc, bold_prefix=title)

# Output path
output_docx = "/Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/AKSHAR_PRESENTATION_DATASET_AND_TINYML_GUIDE.docx"
doc.save(output_docx)
print(f"Document successfully created at: {output_docx}")
