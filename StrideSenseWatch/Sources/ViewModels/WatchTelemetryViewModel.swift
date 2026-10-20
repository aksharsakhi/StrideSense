import Foundation
import SwiftUI
import Combine

@MainActor
public final class WatchTelemetryViewModel: ObservableObject {
    @Published public var telemetry: TelemetryData
    @Published public var patient: PatientProfile
    
    @Published public var isConnectedToCloud: Bool = false
    @Published public var isLiveSyncActive: Bool = true
    @Published public var isDemoMode: Bool = true
    
    // Fall Detection State
    @Published public var fallAlertActive: Bool = false
    @Published public var fallCountdown: Int = 15
    @Published public var sosDispatched: Bool = false
    
    private var syncTimer: AnyCancellable?
    private var demoWalkTimer: AnyCancellable?
    private var countdownTimer: AnyCancellable?
    private var walkPhase: Double = 0.0
    
    public init() {
        self.telemetry = TelemetryData()
        self.patient = PatientProfile()
        
        startTimers()
    }
    
    deinit {
        syncTimer?.cancel()
        demoWalkTimer?.cancel()
        countdownTimer?.cancel()
    }
    
    public func startTimers() {
        // Polling loop for Supabase Cloud (every 1.2 seconds)
        syncTimer = Timer.publish(every: 1.2, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self, self.isLiveSyncActive, !self.isDemoMode else { return }
                Task {
                    await self.pollCloud()
                }
            }
        
        // Dynamic Biomechanical Gait Simulator (for instant on-watch demo without hardware)
        demoWalkTimer = Timer.publish(every: 0.05, on: .main, in: .common) // 20 Hz
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self, self.isDemoMode, !self.fallAlertActive else { return }
                self.updateDemoBiomechanics()
            }
    }
    
    private func pollCloud() async {
        do {
            if let latest = try await SupabaseWatchClient.shared.fetchLatestTelemetry() {
                self.telemetry = latest
                self.isConnectedToCloud = true
                if latest.fallAlert && !self.fallAlertActive {
                    self.triggerFallAlert(reason: "Cloud Triggered Fall")
                }
            } else {
                self.isConnectedToCloud = false
            }
        } catch {
            self.isConnectedToCloud = false
        }
    }
    
    // Real-time sinusoidal heel-strike to toe-off gait cycle
    private func updateDemoBiomechanics() {
        walkPhase += 0.08
        if walkPhase > .pi * 2 {
            walkPhase -= .pi * 2
            telemetry.steps += 1
        }
        
        let sinL = sin(walkPhase)
        let sinR = sin(walkPhase + .pi) // 180 deg out of phase
        
        let lHeel = max(0, sinL * 85.0 + 10.0)
        let lFore = max(0, sin(walkPhase + 0.4) * 90.0 + 8.0)
        let rHeel = max(0, sinR * 82.0 + 10.0)
        let rFore = max(0, sin(walkPhase + .pi + 0.4) * 88.0 + 8.0)
        
        telemetry.pressure.left.heel = lHeel
        telemetry.pressure.left.forefoot = lFore
        telemetry.pressure.left.contact = (lHeel > 15 || lFore > 15)
        
        telemetry.pressure.right.heel = rHeel
        telemetry.pressure.right.forefoot = rFore
        telemetry.pressure.right.contact = (rHeel > 15 || rFore > 15)
        
        // Kinematics
        telemetry.pitch = sin(walkPhase) * 14.0
        telemetry.roll = cos(walkPhase) * 6.5
        telemetry.svmA = 1.0 + abs(sin(walkPhase * 2)) * 0.45
        telemetry.cadenceSPM = 110.0 + sin(walkPhase * 0.5) * 4.0
    }
    
    // MARK: - Fall Detection Protocol
    public func triggerFallAlert(reason: String = "Kinematic Impact Test") {
        guard !fallAlertActive else { return }
        
        fallAlertActive = true
        fallCountdown = 15
        sosDispatched = false
        
        HapticManager.shared.playFallWarning()
        
        countdownTimer?.cancel()
        countdownTimer = Timer.publish(every: 1.0, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self else { return }
                if self.fallCountdown > 1 {
                    self.fallCountdown -= 1
                    HapticManager.shared.playFallWarning()
                } else {
                    self.fallCountdown = 0
                    self.countdownTimer?.cancel()
                    self.executeSosDispatch()
                }
            }
    }
    
    public func dismissFallAlert() {
        fallAlertActive = false
        countdownTimer?.cancel()
        HapticManager.shared.playSuccess()
    }
    
    public func triggerManualSOS() {
        triggerFallAlert(reason: "Manual Wrist SOS Button")
    }
    
    private func executeSosDispatch() {
        sosDispatched = true
        HapticManager.shared.playSosDispatched()
        Task {
            await SupabaseWatchClient.shared.reportFallIncident(
                device: telemetry.deviceId,
                reason: "Watch Countdown Expired — Automated Caregiver SOS Dispatched"
            )
        }
    }
    
    public func toggleDemoMode() {
        isDemoMode.toggle()
        HapticManager.shared.playTap()
    }
    
    public func cycleGaitPattern() {
        let patterns = GaitPattern.allCases
        if let idx = patterns.firstIndex(of: telemetry.gaitClass) {
            let nextIdx = (idx + 1) % patterns.count
            telemetry.gaitClass = patterns[nextIdx]
            HapticManager.shared.playTap()
        }
    }
    
    public func calibrateBaseline() {
        HapticManager.shared.playSuccess()
    }
}
