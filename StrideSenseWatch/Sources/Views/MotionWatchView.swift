import SwiftUI

public struct MotionWatchView: View {
    @ObservedObject var vm: WatchTelemetryViewModel
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header
                HStack {
                    Image(systemName: "gyroscope")
                        .foregroundColor(.purple)
                        .font(.system(size: 11))
                    Text("6-DOF IMU MOTION")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                    Spacer()
                    if vm.telemetry.isOnline {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 5, height: 5)
                        Text("50 Hz")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.green)
                    }
                }
                .padding(.horizontal, 4)
                
                // Acceleration G-Force Shock Bar
                VStack(spacing: 3) {
                    HStack {
                        Text("ACCELERATION")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.gray)
                        Spacer()
                        Text(vm.telemetry.isOnline ? "\(String(format: "%.2f", vm.telemetry.svmA))g" : "--")
                            .font(.system(size: 11, weight: .heavy, design: .rounded))
                            .foregroundColor(vm.telemetry.isOnline ? (vm.telemetry.svmA > 2.0 ? .red : .cyan) : .gray)
                    }
                    
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color(white: 0.15))
                                .frame(height: 6)
                            if vm.telemetry.isOnline {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(vm.telemetry.svmA > 2.0 ? Color.red : Color.cyan)
                                    .frame(width: max(0, min(geo.size.width, geo.size.width * CGFloat(vm.telemetry.svmA / 3.5))), height: 6)
                            }
                        }
                    }
                    .frame(height: 6)
                }
                .padding(6)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                
                // Pitch & Roll Attitude
                HStack(spacing: 8) {
                    // Pitch
                    VStack(spacing: 2) {
                        Text(vm.telemetry.isOnline ? "\(Int(vm.telemetry.pitch))°" : "--")
                            .font(.system(size: 18, weight: .heavy, design: .rounded))
                            .foregroundColor(vm.telemetry.isOnline ? .white : .gray)
                        Text("PITCH")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                    
                    // Roll
                    VStack(spacing: 2) {
                        Text(vm.telemetry.isOnline ? "\(Int(vm.telemetry.roll))°" : "--")
                            .font(.system(size: 18, weight: .heavy, design: .rounded))
                            .foregroundColor(vm.telemetry.isOnline ? .white : .gray)
                        Text("ROLL")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                }
                
                // Sensor Info
                HStack {
                    Circle()
                        .fill(vm.telemetry.isOnline ? Color.green : Color.gray)
                        .frame(width: 5, height: 5)
                    Text("MPU-6050 • Fast I2C (GPIO 21/22)")
                        .font(.system(size: 7, weight: .medium))
                        .foregroundColor(.gray)
                    Spacer()
                }
                .padding(.horizontal, 4)
            }
            .padding(.horizontal, 2)
        }
    }
}
