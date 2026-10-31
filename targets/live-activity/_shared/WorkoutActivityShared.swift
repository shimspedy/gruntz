import ActivityKit
import Foundation

/// The App Group the app, the Live Activity and its Log set button share.
let gruntzAppGroup = "group.com.gruntz.fitness"

/// One running workout on the Lock Screen and in the Dynamic Island.
/// The app, the native module and the widget each compile this same file, so the
/// type matches by name everywhere ActivityKit looks for it.
struct WorkoutActivityAttributes: ActivityAttributes {
  struct UpcomingSet: Codable, Hashable {
    var exKey: String
    var setId: String
    var exerciseName: String
    var setLabel: String
    var detail: String
    var restSeconds: Int
  }

  struct ContentState: Codable, Hashable {
    var exerciseName: String
    var setLabel: String
    var detail: String
    var exercisesDone: Int
    var exercisesTotal: Int
    var restEndsAt: Date?
    var lastActivityAt: Date
    /// Sets the Log set button can tick off without the app, in order.
    var upcoming: [UpcomingSet]
    var loggedFromLockScreen: Int
  }

  var title: String
  var startedAt: Date
}

/// Sets logged from the Lock Screen, waiting for the app to apply them.
enum LoggedSetQueue {
  private static let key = "liveActivity.loggedSets"
  private static var defaults: UserDefaults? { UserDefaults(suiteName: gruntzAppGroup) }

  static var hasPending: Bool { !(defaults?.array(forKey: key) ?? []).isEmpty }

  static func append(exKey: String, setId: String, at: Date) {
    guard let defaults else { return }
    var list = defaults.array(forKey: key) as? [[String: Any]] ?? []
    list.append(["exKey": exKey, "setId": setId, "at": at.timeIntervalSince1970 * 1000])
    defaults.set(list, forKey: key)
  }

  /// Returns the queue as JSON and empties it.
  static func drain() -> String {
    guard let defaults else { return "[]" }
    let list = defaults.array(forKey: key) as? [[String: Any]] ?? []
    defaults.removeObject(forKey: key)
    guard let data = try? JSONSerialization.data(withJSONObject: list), let json = String(data: data, encoding: .utf8) else { return "[]" }
    return json
  }

  static func clear() {
    defaults?.removeObject(forKey: key)
  }
}
