import ExpoModulesCore
import Foundation

/// A few small strings kept in the athlete's own iCloud (key-value storage), so a
/// reinstall or a new iPhone on the same Apple ID can recognise a returning athlete.
/// Without iCloud, or without the entitlement, reads return nil and writes do nothing.
public class GruntzCloudHintModule: Module {
  private var store: NSUbiquitousKeyValueStore { NSUbiquitousKeyValueStore.default }

  public func definition() -> ModuleDefinition {
    Name("GruntzCloudHint")

    /// Asks iCloud for the latest values; reads right after a fresh install may lag.
    Function("prime") { () -> Bool in
      self.store.synchronize()
    }

    Function("get") { (key: String) -> String? in
      self.store.string(forKey: key)
    }

    Function("set") { (key: String, value: String) in
      self.store.set(value, forKey: key)
      self.store.synchronize()
    }

    Function("remove") { (key: String) in
      self.store.removeObject(forKey: key)
      self.store.synchronize()
    }
  }
}
