import AppTrackingTransparency
import ExpoModulesCore
import FBSDKCoreKit
import UIKit

/// No SDK calls, initialization, or AppDelegate integration before both gates pass.
/// Merely linking CoreKit creates a device-local anonymous ID; it does not send it.
public class GruntzMetaEventsModule: Module {
  private static let enabledKey = "GruntzMetaMeasurementEnabled"
  private static let choiceKey = "GruntzMetaMeasurementChoiceMade"
  private static var sdkInitialized = false

  private var configured: Bool {
    let info = Bundle.main.infoDictionary ?? [:]
    return info["GruntzMetaInstallTrackingEnabled"] as? Bool == true
      && info["FacebookAppID"] as? String == "1742670326812925"
      && !(info["FacebookClientToken"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }

  private var permission: String {
    guard configured else { return "unavailable" }
    switch ATTrackingManager.trackingAuthorizationStatus {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .restricted: return "restricted"
    case .notDetermined: return "not-determined"
    @unknown default: return "restricted"
    }
  }

  private func state() -> [String: Any] {
    [
      "available": configured,
      "choiceMade": UserDefaults.standard.bool(forKey: Self.choiceKey),
      "enabled": configured && UserDefaults.standard.bool(forKey: Self.enabledKey) && permission == "authorized",
      "permission": permission,
    ]
  }

  public func definition() -> ModuleDefinition {
    Name("GruntzMetaEvents")

    Function("getState") { self.state() }

    Function("setEnabled") { (enabled: Bool) -> [String: Any] in
      // ATT authorization alone is insufficient: an explicit local opt-out wins.
      let allowed = enabled && self.configured && self.permission == "authorized"
      UserDefaults.standard.set(allowed, forKey: Self.enabledKey)
      UserDefaults.standard.set(true, forKey: Self.choiceKey)
      if !allowed {
        DispatchQueue.main.async {
          guard Self.sdkInitialized else { return }
          // A newer explicit opt-in wins over an earlier queued revoke.
          guard !UserDefaults.standard.bool(forKey: Self.enabledKey)
            || ATTrackingManager.trackingAuthorizationStatus != .authorized else { return }
          // On iOS 17+, ATT itself controls this setting. The independent local
          // gate still prevents our future activate/flush calls on every OS.
          if #unavailable(iOS 17.0) {
            Settings.shared.isAdvertiserTrackingEnabled = false
          }
          Settings.shared.isEventDataUsageLimited = true
        }
      }
      return self.state()
    }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      guard self.configured, UIApplication.shared.applicationState == .active else {
        promise.resolve(self.permission)
        return
      }
      guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else {
        promise.resolve(self.permission)
        return
      }
      ATTrackingManager.requestTrackingAuthorization { _ in
        promise.resolve(self.permission)
      }
    }.runOnQueue(.main)

    AsyncFunction("activate") { () -> Bool in
      guard self.configured,
        UserDefaults.standard.bool(forKey: Self.enabledKey),
        ATTrackingManager.trackingAuthorizationStatus == .authorized,
        UIApplication.shared.applicationState == .active
      else { return false }

      if !Self.sdkInitialized {
        // The same false values must already be in Info.plist: SDK initialization
        // makes configuration requests and must never run before consent.
        ApplicationDelegate.shared.initializeSDK()
        let settings = Settings.shared
        settings.isAutoLogAppEventsEnabled = false
        settings.isAdvertiserIDCollectionEnabled = false
        settings.isMetaDataCollectionEnabled = false
        settings.isAutoLogProductImprovementEnabled = false
        // No timer/background flush of previously queued events after an opt-out.
        AppEvents.shared.flushBehavior = .explicitOnly
        Self.sdkInitialized = true
      }
      // A local opt-in maps to normal conversion measurement; setting limited
      // data usage here would mark application_tracking_enabled=0 on the wire.
      Settings.shared.isEventDataUsageLimited = false
      if #unavailable(iOS 17.0) {
        Settings.shared.isAdvertiserTrackingEnabled = true
      }
      // Official native lifecycle API publishes install once and app-open/session
      // events. We never send purchases, user identity, health or training data.
      AppEvents.shared.activateApp()
      // activateApp schedules session logging on main. Queue our flush after it,
      // then re-check consent because the user may have opted out in the meantime.
      DispatchQueue.main.async {
        guard self.configured,
          UserDefaults.standard.bool(forKey: Self.enabledKey),
          ATTrackingManager.trackingAuthorizationStatus == .authorized,
          UIApplication.shared.applicationState == .active
        else { return }
        AppEvents.shared.flush()
      }
      return true
    }.runOnQueue(.main)
  }
}
