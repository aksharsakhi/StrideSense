import Foundation

public struct PatientProfile: Codable, Equatable {
    public var name: String
    public var age: Int
    public var weightKg: Double
    public var heightCm: Double
    public var gender: String
    public var shoeSize: String
    public var bloodGroup: String
    public var emergencyContactName: String
    public var emergencyContactPhone: String
    
    public init(
        name: String = "Akshar Sakhi",
        age: Int = 21,
        weightKg: Double = 68.0,
        heightCm: Double = 173.0,
        gender: String = "Male",
        shoeSize: String = "US 9.5",
        bloodGroup: String = "O+",
        emergencyContactName: String = "Dr. Aris Thorne",
        emergencyContactPhone: String = "+1 (555) 019-2834"
    ) {
        self.name = name
        self.age = age
        self.weightKg = weightKg
        self.heightCm = heightCm
        self.gender = gender
        self.shoeSize = shoeSize
        self.bloodGroup = bloodGroup
        self.emergencyContactName = emergencyContactName
        self.emergencyContactPhone = emergencyContactPhone
    }
    
    public var bmi: Double {
        let heightM = heightCm / 100.0
        guard heightM > 0 else { return 22.0 }
        return weightKg / (heightM * heightM)
    }
    
    public var estimatedStrideLengthM: Double {
        return (heightCm * 0.43) / 100.0
    }
}
