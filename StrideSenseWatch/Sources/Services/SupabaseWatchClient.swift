import Foundation

public struct SupabaseTelemetryRow: Codable {
    public let id: Int?
    public let device_id: String?
    public let created_at: String?
    public let activity: String?
    public let confidence: Double?
    public let steps: Int?
    public let cadence: Double?
    public let symmetry: Double?
    public let fall_alert: Bool?
    public let p1: Double?
    public let p2: Double?
    public let p3: Double?
    public let p4: Double?
    public let p5: Double?
    public let p6: Double?
    public let pitch: Double?
    public let roll: Double?
    public let svm_a: Double?
}

public actor SupabaseWatchClient {
    public static let shared = SupabaseWatchClient()
    
    private let baseUrl = "https://sgooptohhldguitvhbrl.supabase.co/rest/v1"
    private let apiKey = "sb_publishable_XOwUeGn_OBNf0XoAMNmT9g_3M91ATSI"
    
    private let session: URLSession
    
    public init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 4.0
        config.timeoutIntervalForResource = 8.0
        self.session = URLSession(configuration: config)
    }
    
    public func fetchLatestTelemetry(deviceId: String = "stridesense_esp32_01") async throws -> TelemetryData? {
        guard let url = URL(string: "\(baseUrl)/telemetry?order=created_at.desc&limit=1") else {
            return nil
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            return nil
        }
        
        let decoder = JSONDecoder()
        let rows = try decoder.decode([SupabaseTelemetryRow].self, from: data)
        guard let row = rows.first else { return nil }
        
        // Map FSR pressure sensors:
        // p1: Left Forefoot, p2: Left Heel, p3: Right Forefoot, p4: Right Heel
        let lFore = row.p1 ?? 0
        let lHeel = row.p2 ?? 0
        let rFore = row.p3 ?? 0
        let rHeel = row.p4 ?? 0
        
        let leftFoot = FootPressure(
            heel: min(100.0, lHeel),
            forefoot: min(100.0, lFore),
            contact: (lHeel > 15 || lFore > 15)
        )
        let rightFoot = FootPressure(
            heel: min(100.0, rHeel),
            forefoot: min(100.0, rFore),
            contact: (rHeel > 15 || rFore > 15)
        )
        
        // Map gait pattern
        let act = (row.activity ?? "Normal Gait").lowercased()
        let pattern: GaitPattern
        if act.contains("pro") {
            pattern = .overpronation
        } else if act.contains("sup") {
            pattern = .supination
        } else if act.contains("limp") || act.contains("asym") {
            pattern = .limpAsymmetric
        } else {
            pattern = .normal
        }
        
        return TelemetryData(
            deviceId: row.device_id ?? deviceId,
            timestamp: Date(),
            pressure: BilateralPressure(left: leftFoot, right: rightFoot),
            gaitClass: pattern,
            confidence: row.confidence ?? 0.98,
            cadenceSPM: row.cadence ?? 108.0,
            stanceRatio: 62.0,
            swingRatio: 38.0,
            symmetryPct: row.symmetry ?? 96.0,
            steps: row.steps ?? 1241,
            pitch: row.pitch ?? 0.0,
            roll: row.roll ?? 0.0,
            svmA: row.svm_a ?? 1.0,
            batteryPct: 95,
            batteryVoltage: 4.08,
            fallAlert: row.fall_alert ?? false
        )
    }
    
    public func reportFallIncident(device: String, reason: String) async {
        guard let url = URL(string: "\(baseUrl)/fall_incidents") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        
        let payload: [String: Any] = [
            "device_id": device,
            "incident_type": "IMPACT_FREEFALL_FALL",
            "confidence": 0.99,
            "notes": "Emergency alert triggered via StrideSense Apple Watch Companion: \(reason)",
            "created_at": ISO8601DateFormatter().string(from: Date())
        ]
        
        if let body = try? JSONSerialization.data(withJSONObject: payload) {
            request.httpBody = body
            _ = try? await session.data(for: request)
        }
    }
}
