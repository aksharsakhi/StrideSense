import Foundation
import WatchKit

public final class HapticManager {
    public static let shared = HapticManager()
    
    private init() {}
    
    public func playTap() {
        WKInterfaceDevice.current().play(.click)
    }
    
    public func playSuccess() {
        WKInterfaceDevice.current().play(.success)
    }
    
    public func playStep() {
        WKInterfaceDevice.current().play(.navigationGenericManeuver)
    }
    
    public func playFallWarning() {
        // High-priority urgent vibration sequence
        WKInterfaceDevice.current().play(.failure)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            WKInterfaceDevice.current().play(.directionUp)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            WKInterfaceDevice.current().play(.retry)
        }
    }
    
    public func playSosDispatched() {
        WKInterfaceDevice.current().play(.stop)
    }
}
