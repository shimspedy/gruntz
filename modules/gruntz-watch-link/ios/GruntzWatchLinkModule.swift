import ExpoModulesCore
import Foundation
import WatchConnectivity

/// Sends the running workout to the Gruntz watch app and hands the app what the
/// athlete did on the wrist. The phone owns the workout; the watch is a remote for it.
public class GruntzWatchLinkModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GruntzWatchLink")

    Events("onCommands", "onStatus")

    OnCreate {
      WatchLink.shared.activate()
      WatchLink.shared.onCommands = { [weak self] in self?.sendEvent("onCommands", [:]) }
      WatchLink.shared.onStatus = { [weak self] in self?.sendEvent("onStatus", [:]) }
    }

    Function("status") { () -> String in
      WatchLink.shared.statusJSON()
    }

    AsyncFunction("push") { (state: String) in
      WatchLink.shared.push(state)
    }

    Function("drainCommands") { () -> String in
      WatchCommandQueue.drain()
    }
  }
}

/// Activates the session as the app launches, so a command that woke the app in the
/// background is caught and queued even before any JavaScript has run.
public class GruntzWatchLinkAppDelegate: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    WatchLink.shared.activate()
    return true
  }
}

final class WatchLink: NSObject, WCSessionDelegate {
  static let shared = WatchLink()

  var onCommands: (() -> Void)?
  var onStatus: (() -> Void)?
  private var activated = false
  /// The newest state, kept until the session is ready to carry it.
  private var pending: String?
  private let lock = NSLock()

  func activate() {
    guard WCSession.isSupported() else { return }
    lock.lock()
    let first = !activated
    activated = true
    lock.unlock()
    guard first else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func statusJSON() -> String {
    guard WCSession.isSupported() else { return "{\"supported\":false}" }
    let s = WCSession.default
    let active = s.activationState == .activated
    let status: [String: Bool] = [
      "supported": true,
      "paired": active && s.isPaired,
      "installed": active && s.isWatchAppInstalled,
      "reachable": active && s.isReachable,
    ]
    guard let data = try? JSONSerialization.data(withJSONObject: status), let json = String(data: data, encoding: .utf8) else { return "{\"supported\":true}" }
    return json
  }

  func push(_ state: String) {
    guard WCSession.isSupported() else { return }
    let s = WCSession.default
    guard s.activationState == .activated else {
      lock.lock(); pending = state; lock.unlock()
      activate()
      return
    }
    guard s.isPaired else { return }
    // The context survives until the watch app next opens; the message makes it instant
    // while the watch app is on screen. Both carry the same whole state. Without the watch
    // app installed the system refuses the context, which is the right outcome.
    try? s.updateApplicationContext(["state": state])
    if s.isReachable { s.sendMessage(["state": state], replyHandler: nil, errorHandler: nil) }
  }

  private func receive(_ payload: [String: Any]) {
    guard let command = payload["command"] as? String, command.utf8.count <= 4096 else { return }
    WatchCommandQueue.append(command)
    DispatchQueue.main.async { self.onCommands?() }
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    lock.lock()
    let waiting = pending
    pending = nil
    lock.unlock()
    if let waiting { push(waiting) }
    DispatchQueue.main.async { self.onStatus?() }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  // A second watch was switched to: start again with that one.
  func sessionDidDeactivate(_ session: WCSession) { WCSession.default.activate() }

  func sessionWatchStateDidChange(_ session: WCSession) { DispatchQueue.main.async { self.onStatus?() } }

  func sessionReachabilityDidChange(_ session: WCSession) { DispatchQueue.main.async { self.onStatus?() } }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) { receive(message) }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    // Acknowledged once it is on disk: from here the command survives the app being closed.
    receive(message)
    replyHandler(["ok": true])
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) { receive(userInfo) }
}

/// Commands from the watch, waiting for the app to apply them. Each is one JSON object,
/// stored as the text the watch sent; the app parses and validates it.
enum WatchCommandQueue {
  private static let key = "watchLink.commands"
  private static let limit = 500
  private static let lock = NSLock()

  static func append(_ command: String) {
    lock.lock(); defer { lock.unlock() }
    var list = UserDefaults.standard.stringArray(forKey: key) ?? []
    list.append(command)
    if list.count > limit { list.removeFirst(list.count - limit) }
    UserDefaults.standard.set(list, forKey: key)
  }

  /// Returns the queue as a JSON array and empties it.
  static func drain() -> String {
    lock.lock(); defer { lock.unlock() }
    let list = UserDefaults.standard.stringArray(forKey: key) ?? []
    UserDefaults.standard.removeObject(forKey: key)
    return "[" + list.filter { command in
      guard let data = command.data(using: .utf8) else { return false }
      return (try? JSONSerialization.jsonObject(with: data)) is [String: Any]
    }.joined(separator: ",") + "]"
  }
}
