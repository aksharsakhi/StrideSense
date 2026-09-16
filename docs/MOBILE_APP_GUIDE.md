# StrideSense - Native Mobile Application Guide (Capacitor) 📱

StrideSense includes a native mobile application powered by **Capacitor 6** and **React 19**, targeting both **Android** and **iOS** devices with native status bar theming and hardware haptic feedback.

---

## 🌟 Mobile Architecture & Features

1. **Native Hardware Haptics**: Uses `@capacitor/haptics` to deliver tactile feedback:
   - Light impact on tab navigation and parameter adjustments.
   - Medium impact on simulator activity toggling.
   - Heavy recurring vibration pattern during Fall Detection events.
2. **Dynamic Mobile Navigation**:
   - **Heatmap Tab**: Anatomical foot pressure insole with interactive touch probe values, total ground reaction force in Newtons, and real-time FSR level bars.
   - **Gait Tab**: Daily step rings, live cadence speedometer, bilateral symmetry balance gauge, and stance vs swing duty cycle bar.
   - **Motion Tab**: 3D gyroscopic attitude horizon level, triaxial acceleration readings ($A_x, A_y, A_z$), and Signal Vector Magnitude ($SVM_a$) G-force meter.
   - **Fall Guard Tab**: Active fall protection shield, immediate telephone SOS dialer, designated emergency contact list with click-to-call, and controlled fall test simulator.
   - **Settings Tab**: Hardware telemetry link status, battery voltage, firmware OTA specs, and circuit pinouts.
3. **Safe Area & Notch Insets**: Full support for iPhone Dynamic Island, iOS home indicator bar, and Android edge-to-edge system navigation bars.

---

## 🛠️ Building & Running for Android

### Prerequisites
- **Android Studio** (Hedgehog or newer) with Android SDK 34+.
- Java JDK 17+.

### Commands
```bash
cd dashboard

# 1. Build web distribution
npm run build

# 2. Synchronize web assets with native Android wrapper
npm run cap:sync

# 3. Open project directly in Android Studio
npm run cap:open:android
# Or run from command line: npx cap run android
```

In Android Studio:
1. Wait for Gradle sync to complete.
2. Select your connected physical Android device or Emulator.
3. Click **Run (Shift + F10)**.
4. To build signed APK/AAB: Go to **Build > Generate Signed Bundle / APK**.

---

## 🍎 Building & Running for iOS (macOS)

### Prerequisites
- **Xcode 15+** on macOS.
- CocoaPods / Swift Package Manager (configured automatically).

### Commands
```bash
cd dashboard

# 1. Build web distribution
npm run build

# 2. Synchronize web assets with native iOS wrapper
npm run cap:sync

# 3. Open project directly in Xcode
npm run cap:open:ios
# Or run from command line: npx cap run ios
```

In Xcode:
1. Select your target: iOS Simulator (e.g., iPhone 15 Pro) or a connected iPhone.
2. In Signing & Capabilities, select your Apple Developer Team.
3. Click **Run (Cmd + R)**.

---

## 🔄 Development Workflow

When modifying React code inside `dashboard/src/`:
```bash
cd dashboard
npm run build
npm run cap:sync
```
The changes are instantly copied to both `android/app/src/main/assets/public/` and `ios/App/App/public/`.
