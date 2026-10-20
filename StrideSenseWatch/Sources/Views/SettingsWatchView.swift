import SwiftUI

public struct SettingsWatchView: View {
    @ObservedObject var vm: WatchTelemetryViewModel
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header
                HStack {
                    Image(systemName: "gearshape.fill")
                        .foregroundColor(.gray)
                        .font(.system(size: 11))
                    Text("SETTINGS & PROFILE")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                    Spacer()
                }
                .padding(.horizontal, 4)
                
                // Mode Toggle
                Button(action: {
                    vm.toggleDemoMode()
                }) {
                    HStack {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(vm.isDemoMode ? "Mode: Demo Walk" : "Mode: Live Cloud")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                            Text(vm.isDemoMode ? "Generating 20Hz Gait" : "Supabase REST Polling")
                                .font(.system(size: 7))
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Image(systemName: vm.isDemoMode ? "play.circle.fill" : "icloud.fill")
                            .font(.system(size: 14))
                            .foregroundColor(vm.isDemoMode ? .purple : .cyan)
                    }
                    .padding(6)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                }
                .buttonStyle(PlainButtonStyle())
                
                // Patient Card
                VStack(alignment: .leading, spacing: 3) {
                    HStack {
                        Text(vm.patient.name)
                            .font(.system(size: 10, weight: .heavy, design: .rounded))
                            .foregroundColor(.white)
                        Spacer()
                        Text("BMI \(String(format: "%.1f", vm.patient.bmi))")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.green)
                    }
                    
                    HStack(spacing: 8) {
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
                
                // Battery & Device Info
                HStack(spacing: 8) {
                    HStack(spacing: 4) {
                        Image(systemName: "battery.75")
                            .foregroundColor(.green)
                            .font(.system(size: 9))
                        Text("\(vm.telemetry.batteryPct)%")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    Text("\(String(format: "%.2f", vm.telemetry.batteryVoltage))V")
                        .font(.system(size: 8, weight: .medium))
                        .foregroundColor(.gray)
                }
                .padding(6)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
            }
            .padding(.horizontal, 2)
        }
    }
}
