import Foundation
import SwiftUI

// MARK: - Gait Classification Enum
public enum GaitPattern: String, Codable, CaseIterable {
    case normal = "Normal Gait"
    case overpronation = "Overpronation"
    case supination = "Supination"
    case limpAsymmetric = "Asymmetric Limp"
    
    public var shortName: String {
        switch self {
        case .normal: return "NORMAL"
        case .overpronation: return "PRONATION"
        case .supination: return "SUPINATION"
        case .limpAsymmetric: return "LIMP"
        }
    }
    
    public var badgeColor: Color {
        switch self {
        case .normal: return Color(red: 0.06, green: 0.73, blue: 0.51) // Emerald
        case .overpronation: return Color(red: 0.96, green: 0.62, blue: 0.04) // Amber
        case .supination: return Color(red: 0.66, green: 0.33, blue: 0.97) // Purple
        case .limpAsymmetric: return Color(red: 0.94, green: 0.27, blue: 0.27) // Red
        }
    }
}

// MARK: - Plantar Foot Pressures
public struct FootPressure: Codable, Equatable {
    public var heel: Double     // 0 - 100%
    public var forefoot: Double // 0 - 100%
    public var contact: Bool
    
    public init(heel: Double = 0, forefoot: Double = 0, contact: Bool = false) {
        self.heel = heel
        self.forefoot = forefoot
        self.contact = contact
    }
    
    public var total: Double {
        return (heel + forefoot) / 2.0
    }
}

// MARK: - Bilateral Plantar Insole State
public struct BilateralPressure: Codable, Equatable {
    public var left: FootPressure
    public var right: FootPressure
    
    public init(left: FootPressure = FootPressure(), right: FootPressure = FootPressure()) {
        self.left = left
        self.right = right
    }
    
    public var balanceLeftPercentage: Double {
        let lTot = left.total
        let rTot = right.total
        let sum = lTot + rTot
        if sum < 0.01 { return 50.0 }
        return (lTot / sum) * 100.0
    }
    
    public var balanceRightPercentage: Double {
        return 100.0 - balanceLeftPercentage
    }
}

// MARK: - Master Real-Time Telemetry Data
public struct TelemetryData: Codable, Equatable {
    public var deviceId: String
    public var timestamp: Date
    public var pressure: BilateralPressure
    public var gaitClass: GaitPattern
    public var confidence: Double // 0.0 - 1.0
    public var cadenceSPM: Double // Steps per minute
    public var stanceRatio: Double // e.g. 62%
    public var swingRatio: Double  // e.g. 38%
    public var symmetryPct: Double // e.g. 96.5%
    public var steps: Int
    public var pitch: Double
    public var roll: Double
    public var svmA: Double // G-force magnitude
    public var batteryPct: Int
    public var batteryVoltage: Double
    public var fallAlert: Bool
    
    public init(
        deviceId: String = "stridesense_esp32_01",
        timestamp: Date = Date(),
        pressure: BilateralPressure = BilateralPressure(
            left: FootPressure(heel: 42, forefoot: 65, contact: true),
            right: FootPressure(heel: 38, forefoot: 58, contact: true)
        ),
        gaitClass: GaitPattern = .normal,
        confidence: Double = 0.98,
        cadenceSPM: Double = 108,
        stanceRatio: Double = 62.0,
        swingRatio: Double = 38.0,
        symmetryPct: Double = 96.0,
        steps: Int = 1241,
        pitch: Double = 4.2,
        roll: Double = -1.8,
        svmA: Double = 1.02,
        batteryPct: Int = 95,
        batteryVoltage: Double = 4.08,
        fallAlert: Bool = false
    ) {
        self.deviceId = deviceId
        self.timestamp = timestamp
        self.pressure = pressure
        self.gaitClass = gaitClass
        self.confidence = confidence
        self.cadenceSPM = cadenceSPM
        self.stanceRatio = stanceRatio
        self.swingRatio = swingRatio
        self.symmetryPct = symmetryPct
        self.steps = steps
        self.pitch = pitch
        self.roll = roll
        self.svmA = svmA
        self.batteryPct = batteryPct
        self.batteryVoltage = batteryVoltage
        self.fallAlert = fallAlert
    }
}
