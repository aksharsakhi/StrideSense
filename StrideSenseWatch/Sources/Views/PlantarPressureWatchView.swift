import SwiftUI

public struct PlantarPressureWatchView: View {
    @ObservedObject var vm: WatchTelemetryViewModel
    
    private func pressureColor(_ value: Double) -> Color {
        if value < 20 {
            return Color(red: 0.1, green: 0.7, blue: 0.9).opacity(0.35)
        } else if value < 50 {
            return Color(red: 0.0, green: 0.94, blue: 1.0) // Cyan
        } else if value < 75 {
            return Color(red: 0.1, green: 0.85, blue: 0.5) // Emerald
        } else if value < 90 {
            return Color(red: 0.98, green: 0.65, blue: 0.0) // Amber
        } else {
            return Color(red: 0.95, green: 0.25, blue: 0.3) // Red
        }
    }
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header Status
                HStack {
                    Circle()
                        .fill(vm.isDemoMode ? Color.purple : Color.cyan)
                        .frame(width: 7, height: 7)
                    Text(vm.isDemoMode ? "DEMO WALK" : "LIVE SENSOR")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                    Spacer()
                    Text("\(vm.telemetry.steps) steps")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 4)
                
                // Bilateral Foot Insoles
                HStack(spacing: 12) {
                    // Left Foot
                    VStack(spacing: 5) {
                        Text("LEFT")
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundColor(Color(white: 0.6))
                        
                        // Forefoot Pod
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(pressureColor(vm.telemetry.pressure.left.forefoot))
                                .frame(width: 48, height: 32)
                                .shadow(color: pressureColor(vm.telemetry.pressure.left.forefoot).opacity(0.6), radius: 5)
                            Text("\(Int(vm.telemetry.pressure.left.forefoot))%")
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundColor(.black)
                        }
                        
                        // Arch Connector
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color(white: 0.18))
                            .frame(width: 22, height: 14)
                        
                        // Heel Pod
                        ZStack {
                            Circle()
                                .fill(pressureColor(vm.telemetry.pressure.left.heel))
                                .frame(width: 40, height: 40)
                                .shadow(color: pressureColor(vm.telemetry.pressure.left.heel).opacity(0.6), radius: 5)
                            Text("\(Int(vm.telemetry.pressure.left.heel))%")
                                .font(.system(size: 10, weight: .heavy, design: .rounded))
                                .foregroundColor(.black)
                        }
                    }
                    .padding(6)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Color(white: 0.08)))
                    
                    // Right Foot
                    VStack(spacing: 5) {
                        Text("RIGHT")
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundColor(Color(white: 0.6))
                        
                        // Forefoot Pod
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(pressureColor(vm.telemetry.pressure.right.forefoot))
                                .frame(width: 48, height: 32)
                                .shadow(color: pressureColor(vm.telemetry.pressure.right.forefoot).opacity(0.6), radius: 5)
                            Text("\(Int(vm.telemetry.pressure.right.forefoot))%")
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundColor(.black)
                        }
                        
                        // Arch Connector
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color(white: 0.18))
                            .frame(width: 22, height: 14)
                        
                        // Heel Pod
                        ZStack {
                            Circle()
                                .fill(pressureColor(vm.telemetry.pressure.right.heel))
                                .frame(width: 40, height: 40)
                                .shadow(color: pressureColor(vm.telemetry.pressure.right.heel).opacity(0.6), radius: 5)
                            Text("\(Int(vm.telemetry.pressure.right.heel))%")
                                .font(.system(size: 10, weight: .heavy, design: .rounded))
                                .foregroundColor(.black)
                        }
                    }
                    .padding(6)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Color(white: 0.08)))
                }
                
                // Balance Split Bar
                VStack(spacing: 3) {
                    HStack {
                        Text("L \(Int(vm.telemetry.pressure.balanceLeftPercentage))%")
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundColor(.cyan)
                        Spacer()
                        Text("BALANCE")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.gray)
                        Spacer()
                        Text("R \(Int(vm.telemetry.pressure.balanceRightPercentage))%")
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundColor(.purple)
                    }
                    
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.purple.opacity(0.4))
                                .frame(height: 5)
                            
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.cyan)
                                .frame(width: max(0, min(geo.size.width, geo.size.width * (vm.telemetry.pressure.balanceLeftPercentage / 100.0))), height: 5)
                        }
                    }
                    .frame(height: 5)
                }
                .padding(.horizontal, 6)
                .padding(.top, 2)
            }
            .padding(.horizontal, 2)
        }
    }
}
