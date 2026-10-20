import SwiftUI

public struct MainWatchTabView: View {
    @StateObject private var vm = WatchTelemetryViewModel()
    @State private var selectedTab: Int = 0
    
    public init() {}
    
    public var body: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                // Screen 1: Activity & Steps (Apple Health Style)
                HealthStepsWatchView(vm: vm)
                    .tag(0)
                
                // Screen 2: Plantar Pressure Sensors
                PlantarPressureWatchView(vm: vm)
                    .tag(1)
                
                // Screen 3: Gait Biomechanics Analysis
                GaitBiomechanicsWatchView(vm: vm)
                    .tag(2)
                
                // Screen 4: Fall Guard Alarm & Emergency Shield
                FallGuardWatchView(vm: vm)
                    .tag(3)
                
                // Screen 5: 6-DOF IMU Motion
                MotionWatchView(vm: vm)
                    .tag(4)
                
                // Screen 6: Settings & Patient Profile
                SettingsWatchView(vm: vm)
                    .tag(5)
            }
            .tabViewStyle(.page)
            
            // Full-Screen Emergency Modal Overlay when Fall Alert is Triggered
            if vm.fallAlertActive {
                Color.black.opacity(0.85)
                    .ignoresSafeArea()
                FallGuardWatchView(vm: vm)
                    .transition(.scale)
            }
        }
        .onChange(of: vm.fallAlertActive) { active in
            if active {
                selectedTab = 3 // Jump directly to Fall Guard tab
            }
        }
    }
}
