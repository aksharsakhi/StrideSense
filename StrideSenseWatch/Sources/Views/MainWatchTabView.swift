import SwiftUI

public struct MainWatchTabView: View {
    @StateObject private var vm = WatchTelemetryViewModel()
    @State private var selectedTab: Int = 0
    
    public init() {}
    
    public var body: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                PlantarPressureWatchView(vm: vm)
                    .tag(0)
                
                GaitBiomechanicsWatchView(vm: vm)
                    .tag(1)
                
                FallGuardWatchView(vm: vm)
                    .tag(2)
                
                MotionWatchView(vm: vm)
                    .tag(3)
                
                SettingsWatchView(vm: vm)
                    .tag(4)
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
                selectedTab = 2 // Switch directly to Fall Guard tab
            }
        }
    }
}
