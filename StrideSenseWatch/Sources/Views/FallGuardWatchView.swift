import SwiftUI

public struct FallGuardWatchView: View {
    @ObservedObject var vm: WatchTelemetryViewModel
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                if vm.fallAlertActive {
                    // EMERGENCY COUNTDOWN STATE
                    VStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 26))
                            .foregroundColor(.yellow)
                        
                        Text("FALL DETECTED!")
                            .font(.system(size: 13, weight: .black, design: .rounded))
                            .foregroundColor(.red)
                        
                        Text("\(vm.fallCountdown)")
                            .font(.system(size: 36, weight: .heavy, design: .rounded))
                            .foregroundColor(.white)
                            .frame(width: 60, height: 44)
                            .background(Circle().fill(Color.red.opacity(0.4)))
                        
                        Text(vm.sosDispatched ? "Emergency SOS Dispatched!" : "Dispatching SOS in seconds...")
                            .font(.system(size: 8))
                            .foregroundColor(.gray)
                        
                        Button(action: {
                            vm.dismissFallAlert()
                        }) {
                            Text("I'M OK — CANCEL")
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(RoundedRectangle(cornerRadius: 12).fill(Color.green))
                        }
                        .buttonStyle(PlainButtonStyle())
                        .padding(.top, 4)
                    }
                    .padding(8)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Color.red.opacity(0.2)))
                } else {
                    // NORMAL MONITORING STATE
                    VStack(spacing: 6) {
                        HStack {
                            Image(systemName: vm.telemetry.isOnline ? "shield.fill" : "shield.slash.fill")
                                .foregroundColor(vm.telemetry.isOnline ? .green : .gray)
                                .font(.system(size: 12))
                            Text(vm.telemetry.isOnline ? "FALL GUARD ARMED" : "GUARD STANDBY")
                                .font(.system(size: 9, weight: .bold, design: .rounded))
                                .foregroundColor(vm.telemetry.isOnline ? .green : .gray)
                            Spacer()
                        }
                        .padding(.horizontal, 4)
                        
                        VStack(spacing: 3) {
                            Text(vm.telemetry.isOnline ? "Edge Kinematics Active" : "Insole Disconnected")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(.white)
                            Text("Dual Trigger: Free-Fall <0.6g + Impact >2.8g")
                                .font(.system(size: 7))
                                .foregroundColor(.gray)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                        
                        // Caregiver Contact Info
                        HStack {
                            VStack(alignment: .leading, spacing: 1) {
                                Text("Emergency Contact")
                                    .font(.system(size: 7, weight: .bold))
                                    .foregroundColor(.gray)
                                Text(vm.patient.emergencyContactName)
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundColor(.white)
                            }
                            Spacer()
                            Image(systemName: "phone.fill")
                                .font(.system(size: 10))
                                .foregroundColor(.cyan)
                        }
                        .padding(6)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Color(white: 0.06)))
                        
                        // Manual Emergency SOS Button
                        Button(action: {
                            vm.triggerManualSOS()
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "sos")
                                    .font(.system(size: 11, weight: .heavy))
                                Text("EMERGENCY SOS")
                                    .font(.system(size: 10, weight: .heavy))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(RoundedRectangle(cornerRadius: 10).fill(Color.red))
                            .foregroundColor(.white)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .padding(.top, 2)
                    }
                }
            }
            .padding(.horizontal, 2)
        }
    }
}
