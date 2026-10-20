import SwiftUI

public struct HealthStepsWatchView: View {
    @ObservedObject var vm: WatchTelemetryViewModel
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header Bar
                HStack {
                    Image(systemName: "figure.walk")
                        .foregroundColor(.green)
                        .font(.system(size: 11, weight: .bold))
                    Text("ACTIVITY & STEPS")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                    Spacer()
                    // Online / Offline Status Badge
                    HStack(spacing: 4) {
                        Circle()
                            .fill(vm.telemetry.isOnline ? Color.green : Color.gray)
                            .frame(width: 6, height: 6)
                        Text(vm.telemetry.isOnline ? "LIVE" : "OFFLINE")
                            .font(.system(size: 8, weight: .bold, design: .rounded))
                            .foregroundColor(vm.telemetry.isOnline ? .green : .gray)
                    }
                    .padding(.horizontal, 5)
                    .padding(.vertical, 2)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(vm.telemetry.isOnline ? Color.green.opacity(0.15) : Color(white: 0.12))
                    )
                }
                .padding(.horizontal, 4)
                
                // Primary Steps Ring Card (Apple Watch Health Style)
                ZStack {
                    // Circular Progress Ring
                    Circle()
                        .stroke(Color(white: 0.15), lineWidth: 8)
                        .frame(width: 110, height: 110)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(vm.stepGoalProgress))
                        .stroke(
                            AngularGradient(
                                gradient: Gradient(colors: [Color.cyan, Color.green, Color.cyan]),
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .frame(width: 110, height: 110)
                        .shadow(color: Color.green.opacity(0.4), radius: 5)
                    
                    // Center Metric
                    VStack(spacing: 0) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.orange)
                        
                        Text("\(vm.telemetry.steps)")
                            .font(.system(size: 24, weight: .heavy, design: .rounded))
                            .foregroundColor(.white)
                            .minimumScaleFactor(0.7)
                        
                        Text("STEPS")
                            .font(.system(size: 8, weight: .heavy, design: .rounded))
                            .foregroundColor(.gray)
                    }
                }
                .padding(.vertical, 4)
                
                // Distance & Calories Two-Column Card
                HStack(spacing: 8) {
                    // Distance
                    VStack(spacing: 2) {
                        Text(String(format: "%.2f", vm.distanceKm))
                            .font(.system(size: 15, weight: .heavy, design: .rounded))
                            .foregroundColor(.cyan)
                        Text("KM DIST")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 5)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                    
                    // Calories
                    VStack(spacing: 2) {
                        Text("\(vm.activeCaloriesKcal)")
                            .font(.system(size: 15, weight: .heavy, design: .rounded))
                            .foregroundColor(.orange)
                        Text("ACTIVE KCAL")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 5)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color(white: 0.08)))
                }
                
                // ESP32 Hardware Status Card
                VStack(spacing: 2) {
                    HStack {
                        Circle()
                            .fill(vm.telemetry.isOnline ? Color.green : Color.orange)
                            .frame(width: 5, height: 5)
                        Text(vm.telemetry.isOnline ? "ESP32 Unified Insole Active" : "ESP32 Hardware Disconnected")
                            .font(.system(size: 8, weight: .bold, design: .rounded))
                            .foregroundColor(vm.telemetry.isOnline ? .white : Color(white: 0.6))
                        Spacer()
                    }
                    HStack {
                        Text(vm.telemetry.isOnline ? "Real-time 50 Hz cloud stream" : "Values held until insole transmits")
                            .font(.system(size: 7))
                            .foregroundColor(.gray)
                        Spacer()
                    }
                }
                .padding(6)
                .background(RoundedRectangle(cornerRadius: 8).fill(Color(white: 0.06)))
            }
            .padding(.horizontal, 2)
        }
    }
}
