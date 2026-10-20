import SwiftUI

public struct GaitBiomechanicsWatchView: View {
    @ObservedObject var vm: WatchTelemetryViewModel
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header
                HStack {
                    Image(systemName: "figure.walk")
                        .foregroundColor(.cyan)
                        .font(.system(size: 11))
                    Text("GAIT BIOMECHANICS")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                    Spacer()
                }
                .padding(.horizontal, 4)
                
                // TinyML Classification Badge
                Button(action: {
                    if vm.isDemoMode {
                        vm.cycleGaitPattern()
                    }
                }) {
                    HStack(spacing: 5) {
                        Circle()
                            .fill(vm.telemetry.gaitClass.badgeColor)
                            .frame(width: 7, height: 7)
                        Text(vm.telemetry.gaitClass.rawValue.uppercased())
                            .font(.system(size: 11, weight: .heavy, design: .rounded))
                            .foregroundColor(.white)
                        if vm.isDemoMode {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.system(size: 8))
                                .foregroundColor(.gray)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 5)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(vm.telemetry.gaitClass.badgeColor.opacity(0.2))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(vm.telemetry.gaitClass.badgeColor.opacity(0.5), lineWidth: 1)
                            )
                    )
                }
                .buttonStyle(PlainButtonStyle())
                
                // Cadence & Symmetry Metrics
                HStack(spacing: 8) {
                    // Cadence Card
                    VStack(spacing: 2) {
                        Text("\(Int(vm.telemetry.cadenceSPM))")
                            .font(.system(size: 20, weight: .heavy, design: .rounded))
                            .foregroundColor(.cyan)
                        Text("CADENCE SPM")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                    
                    // Symmetry Card
                    VStack(spacing: 2) {
                        Text("\(String(format: "%.0f", vm.telemetry.symmetryPct))%")
                            .font(.system(size: 20, weight: .heavy, design: .rounded))
                            .foregroundColor(.green)
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
                        Text("62% Stance • 38% Swing")
                            .font(.system(size: 8, weight: .semibold, design: .rounded))
                            .foregroundColor(.white)
                    }
                    
                    GeometryReader { geo in
                        HStack(spacing: 2) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.cyan)
                                .frame(width: geo.size.width * 0.62, height: 6)
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.orange)
                                .frame(width: geo.size.width * 0.38, height: 6)
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
