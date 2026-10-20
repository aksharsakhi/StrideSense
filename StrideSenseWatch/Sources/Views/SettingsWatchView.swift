import SwiftUI

public struct SettingsWatchView: View {
    @ObservedObject var vm: WatchTelemetryViewModel
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header
                HStack {
                    Image(systemName: "person.crop.circle.fill")
                        .foregroundColor(.cyan)
                        .font(.system(size: 11))
                    Text("PATIENT & HARDWARE")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                    Spacer()
                }
                .padding(.horizontal, 4)
                
                // Patient Card
                VStack(alignment: .leading, spacing: 3) {
                    HStack {
                        Text(vm.patient.name)
                            .font(.system(size: 11, weight: .heavy, design: .rounded))
                            .foregroundColor(.white)
                        Spacer()
                        Text("BMI \(String(format: "%.1f", vm.patient.bmi))")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.green)
                    }
                    
                    HStack(spacing: 6) {
                        Text("Age \(vm.patient.age)")
                            .font(.system(size: 7))
                            .foregroundColor(.gray)
                        Text("•")
                            .font(.system(size: 7))
                            .foregroundColor(.gray)
                        Text(vm.patient.shoeSize)
                            .font(.system(size: 7))
                            .foregroundColor(.gray)
                        Text("•")
                            .font(.system(size: 7))
                            .foregroundColor(.gray)
                        Text(vm.patient.bloodGroup)
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.red)
                    }
                }
                .padding(6)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                
                // Hardware Device Card (stridesense_esp32_01)
                VStack(alignment: .leading, spacing: 3) {
                    HStack {
                        Text("Hardware Device")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.gray)
                        Spacer()
                        Circle()
                            .fill(vm.telemetry.isOnline ? Color.green : Color.orange)
                            .frame(width: 5, height: 5)
                        Text(vm.telemetry.isOnline ? "ONLINE" : "OFFLINE")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(vm.telemetry.isOnline ? .green : .orange)
                    }
                    
                    Text(vm.telemetry.deviceId)
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.cyan)
                    
                    HStack {
                        HStack(spacing: 3) {
                            Image(systemName: "battery.75")
                                .font(.system(size: 8))
                                .foregroundColor(.green)
                            Text("\(vm.telemetry.batteryPct)%")
                                .font(.system(size: 8, weight: .semibold))
                                .foregroundColor(.white)
                        }
                        Spacer()
                        Text("\(String(format: "%.2f", vm.telemetry.batteryVoltage))V LiPo")
                            .font(.system(size: 8))
                            .foregroundColor(.gray)
                    }
                }
                .padding(6)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                
                // Refresh / Sync Button
                Button(action: {
                    HapticManager.shared.playTap()
                    vm.refreshNow()
                }) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 9, weight: .bold))
                        Text(vm.isFetching ? "Syncing..." : "Sync With ESP32 Cloud")
                            .font(.system(size: 9, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Color.cyan.opacity(0.2)))
                    .foregroundColor(.cyan)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 2)
        }
    }
}
