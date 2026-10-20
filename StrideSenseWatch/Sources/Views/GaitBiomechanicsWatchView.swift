import SwiftUI

public struct GaitBiomechanicsWatchView: View {
    @ObservedObject var vm: WatchTelemetryViewModel
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header
                HStack {
                    Image(systemName: "waveform.path.ecg")
                        .foregroundColor(.cyan)
                        .font(.system(size: 11))
                    Text("GAIT BIOMECHANICS")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                    Spacer()
                    if vm.telemetry.isOnline {
                        Text("\(Int(vm.telemetry.confidence * 100))% conf")
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundColor(.green)
                    }
                }
                .padding(.horizontal, 4)
                
                // TinyML Classification Badge
                HStack(spacing: 5) {
                    Circle()
                        .fill(vm.telemetry.isOnline ? vm.telemetry.gaitClass.badgeColor : Color.gray)
                        .frame(width: 7, height: 7)
                    Text(vm.telemetry.isOnline ? vm.telemetry.gaitClass.rawValue.uppercased() : "OFFLINE / STANDBY")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(vm.telemetry.isOnline ? vm.telemetry.gaitClass.badgeColor.opacity(0.2) : Color(white: 0.1))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(vm.telemetry.isOnline ? vm.telemetry.gaitClass.badgeColor.opacity(0.5) : Color(white: 0.2), lineWidth: 1)
                        )
                )
                
                // Cadence & Symmetry Metrics
                HStack(spacing: 8) {
                    // Cadence Card
                    VStack(spacing: 2) {
                        Text(vm.telemetry.isOnline ? "\(Int(vm.telemetry.cadenceSPM))" : "--")
                            .font(.system(size: 20, weight: .heavy, design: .rounded))
                            .foregroundColor(vm.telemetry.isOnline ? .cyan : .gray)
                        Text("CADENCE SPM")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                    
                    // Symmetry Card
                    VStack(spacing: 2) {
                        Text(vm.telemetry.isOnline ? "\(String(format: "%.0f", vm.telemetry.symmetryPct))%" : "--")
                            .font(.system(size: 20, weight: .heavy, design: .rounded))
                            .foregroundColor(vm.telemetry.isOnline ? .green : .gray)
                        Text("SYMMETRY")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                }
                
                // Stance vs Swing Duty Cycle
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("DUTY CYCLE")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.gray)
                        Spacer()
                        Text(vm.telemetry.isOnline ? "62% Stance • 38% Swing" : "Awaiting Stride")
                            .font(.system(size: 8, weight: .semibold, design: .rounded))
                            .foregroundColor(vm.telemetry.isOnline ? .white : .gray)
                    }
                    
                    GeometryReader { geo in
                        if vm.telemetry.isOnline {
                            HStack(spacing: 2) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.cyan)
                                    .frame(width: geo.size.width * 0.62, height: 6)
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.orange)
                                    .frame(width: geo.size.width * 0.38, height: 6)
                            }
                        } else {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color(white: 0.15))
                                .frame(height: 6)
                        }
                    }
                    .frame(height: 6)
                }
                .padding(6)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
            }
            .padding(.horizontal, 2)
        }
    }
}
