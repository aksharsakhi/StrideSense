# StrideSense Datasets Catalog & Guide 📊

This directory documents the public datasets suitable for training, evaluating, and benchmarking the StrideSense smart insole system, along with an automated downloader and a realistic biomechanical gait and fall synthesizer.

---

## 1. Public Real-World Datasets

### A. The Smart-Insole Dataset (BMI-HMU / Nature Scientific Data)
- **Primary Reference**: Nature Scientific Data / Biomedical Informatics & eHealth Laboratory (HMU).
- **Participants**: 29 subjects (healthy young adults, elderly individuals, and patients with Parkinson's disease).
- **Sensory Hardware**: Moticon SCIENCE instrumented sensor insoles.
- **Channels**: 51 total features per record:
  - 16 pressure sensors per insole (32 total for bilateral recording)
  - 3-axis accelerometer ($A_x, A_y, A_z$)
  - 3-axis gyroscope ($G_x, G_y, G_z$)
  - Total force ($F_{total}$) and Center of Pressure ($COP_x, COP_y$)
- **Sampling Frequency**: 100 Hz.
- **Protocol**: 10-meter Walk Straight and Turn (WST) and Timed Up and Go (TUG).
- **Access / URL**: [BMI HMU Smart Insole Portal](https://bmi.hmu.gr/) & [Scientific Data Publication](https://doi.org/10.1038/s41597-020-00693-3).
- **Application to StrideSense**: Ideal benchmark for spatial foot pressure distribution and bilateral gait symmetry metrics.

### B. PhysioNet Gait in Parkinson's Disease Database (gaitpdb)
- **Reference**: PhysioNet / Hausdorff et al.
- **Participants**: 93 patients with Parkinson's Disease and 73 healthy controls (166 total subjects).
- **Sensory Hardware**: Ultraflex computer-based force measurement system with 8 vertical ground reaction force (vGRF) sensors under each foot.
- **Channels**: 19 columns:
  - Column 1: Time (seconds)
  - Columns 2–9: vGRF (Newtons) for 8 sensors under the Left foot
  - Columns 10–17: vGRF (Newtons) for 8 sensors under the Right foot
  - Column 18: Total left force
  - Column 19: Total right force
- **Sampling Frequency**: 100 Hz.
- **Access / URL**: [PhysioNet gaitpdb v1.0.0](https://physionet.org/content/gaitpdb/1.0.0/).
- **Application to StrideSense**: Validating heel-strike to toe-off force progression and stance-phase time variability.

### C. SisFall: A Fall and Movement Dataset
- **Reference**: Sucerquia et al., Sensors 2017.
- **Participants**: 38 participants (23 young adults aged 19–30, and 15 elderly individuals aged 60–75).
- **Sensory Hardware**: 2 triaxial accelerometers (ADXL345, MMA8451Q) and 1 triaxial gyroscope (ITG3200) worn at waist/lower body.
- **Activities**: 34 activity classes:
  - 19 Activities of Daily Living (ADLs): Walking, jogging, ascending/descending stairs, stumbling, sitting, squatting, lying down.
  - 15 Fall Types: Slip fall forward, trip fall forward, lateral falls (left/right), backward falls, fainting with knee flexion, fall with recovery attempt.
- **Sampling Frequency**: 200 Hz.
- **Access / URL**: [SisFall Dataset on Mendeley / UCI](http://sistemic.udea.edu.co/en/investigacion/proyectos/english-sisfall/).
- **Application to StrideSense**: Benchmarking fall detection algorithms against diverse edge-case ADLs (e.g., jumping into bed, stumbling without falling).

### D. UCI Human Activity Recognition (HAR) Using Smartphones
- **Reference**: Anguita et al., 2013.
- **Participants**: 30 volunteers aged 19–48.
- **Sensors**: Triaxial linear acceleration and angular velocity at 50 Hz.
- **Activities**: 6 standard activities: Walking, Walking Upstairs, Walking Downstairs, Sitting, Standing, Laying.
- **Access / URL**: [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/240/human+activity+recognition+using+smartphones).

---

## 2. Sensor Layout & Mapping in StrideSense

StrideSense simplifies insole hardware to 6 carefully positioned FSRs (Force Sensitive Resistors) and one 6-DOF IMU (MPU6050) located at the foot arch:

| Sensor ID | Anatomical Location | Primary Biomechanical Role |
|-----------|--------------------|----------------------------|
| **S1**    | Calcaneus (Heel)   | Initial contact / Heel-strike detection |
| **S2**    | Midfoot Lateral    | Lateral arch support during midstance |
| **S3**    | Midfoot Medial     | Medial longitudinal arch collapse / pronation |
| **S4**    | 4th–5th Metatarsal | Lateral forefoot roll & lateral weight transfer |
| **S5**    | 1st Metatarsal (Ball)| Primary propulsion force center |
| **S6**    | Hallux (Big Toe)   | Terminal stance & Toe-off phase termination |
| **Ax, Ay, Az** | Midfoot Arch (IMU) | Linear foot kinematics, ground shock, free-fall drop |
| **Gx, Gy, Gz** | Midfoot Arch (IMU) | Sagittal swing pitch, roll stability, yaw rotation |

---

## 3. High-Fidelity Gait & Fall Synthesizer (`gait_synthesizer.py`)

Because acquiring hardware-synchronized recordings for all 5 activities requires wearing the prototype shoe across dozens of trial sessions, we provide an in-tree biomechanical gait synthesizer that generates mathematically rigorous, physically grounded 12-channel time-series data:

```bash
# Generate 10,000 samples (~200 seconds) of 50 Hz synchronized insole data
python3 datasets/gait_synthesizer.py --samples 10000 --output datasets/synthetic_gait.csv
```

The synthesizer simulates:
- **Periodic Gait Waves**: Sinusoidal and bell-shaped force distributions parameterized by cadence ($60-140\text{ steps/min}$), duty cycle ($60\%\text{ stance}, 40\%\text{ swing}$), and foot roll delay ($\Delta t_{heel \to toe}$).
- **Sensor Noise & Baseline Drift**: Thermal drift and ADC quantization noise.
- **Fall Dynamics**: Multi-stage kinematics (Pre-fall loss of balance $\to$ near zero-g free-fall drop $<0.5g$ $\to$ high-G collision shock $>3.5g$ $\to$ foot impact peak $\to$ prolonged stationary immobility).

---

## 4. Automated Public Dataset Downloader (`download_datasets.py`)

Run the downloader script to pull sample data from available open repositories:

```bash
python3 datasets/download_datasets.py --dataset uci-har
python3 datasets/download_datasets.py --dataset physionet-gait
```
