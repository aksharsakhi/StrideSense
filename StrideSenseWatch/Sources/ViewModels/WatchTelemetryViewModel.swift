import Foundation
import SwiftUI
import Combine

@MainActor
public final class WatchTelemetryViewModel: ObservableObject {
    @Published public var telemetry: TelemetryData
    @Published public var patient: PatientProfile
    
    @Published public var isFetching: Bool = false
    @Published public var lastSyncTimestamp: Date?
    
    // Fall Detection State
    @Published public var fallAlertActive: Bool = false
    @Published public var fallCountdown: Int = 15
    @Published public var sosDispatched: Bool = false
    
    private var syncTimer: AnyCancellable?
    private var countdownTimer: AnyCancellable?
    
    public init() {
        self.telemetry = TelemetryData()
        self.patient = PatientProfile()
        
        startLivePolling()
        
        // Initial fetch immediately
        Task {
            await self.pollESP32Telemetry()
        }
    }
    
    deinit {
        syncTimer?.cancel()
        countdownTimer?.cancel()
    }
    
    // Dedicated 1-second continuous telemetry sync for ESP32 hardware
    public func startLivePolling() {
        syncTimer?.cancel()
        syncTimer = Timer.publish(every: 1.0, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self else { return }
                Task {
                    await self.pollESP32Telemetry()
                }
            }
    }
    
    public func refreshNow() {
        Task {
            await self.pollESP32Telemetry()
        }
    }
    
    private func pollESP32Telemetry() async {
        isFetching = true
        defer { isFetching = false }
        
        do {
            if let latest = try await SupabaseWatchClient.shared.fetchLatestESP32Telemetry() {
                self.telemetry = latest
                self.lastSyncTimestamp = Date()
                
                // Real Fall Alert triggered from ESP32 dual-trigger kinematics
                if latest.isOnline && latest.fallAlert && !self.fallAlertActive {
                    self.triggerFallAlert(reason: "ESP32 Fall Detection State Machine")
                }
            } else {
                // If network failed or no rows, transition to offline
                self.telemetry.isOnline = false
                self.telemetry.gaitClass = .offline
            }
        } catch {
            self.telemetry.isOnline = false
            self.telemetry.gaitClass = .offline
        }
    }
    
    // MARK: - Health Calculations (Based on Patient Akshar Sakhi)
    public var distanceKm: Double {
        let strideMeters = patient.estimatedStrideLengthM
        let totalMeters = Double(telemetry.steps) * strideMeters
        return totalMeters / 1000.0
    }
    
    public var activeCaloriesKcal: Int {
        // Biomechanical walking expenditure approx: 0.045 kcal per step for 68kg body weight
        let kcalPerStep = (patient.weightKg / 70.0) * 0.044
        return Int(Double(telemetry.steps) * kcalPerStep)
    }
    
    // Step goal: 10,000 steps
    public var stepGoalProgress: Double {
        return min(1.0, Double(telemetry.steps) / 10000.0)
    }
    
    // MARK: - Emergency Fall Protocol
    public func triggerFallAlert(reason: String = "ESP32 Dual-Trigger Kinematic Fall") {
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
        triggerFallAlert(reason: "Manual Watch Emergency SOS Triggered by User")
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
}
