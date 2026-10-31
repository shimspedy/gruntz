import ActivityKit
import AppIntents
import Foundation

/// The Log set button. Runs in the app's process without opening it: ticks the next
/// set, starts its rest, and leaves the set in the shared queue for the app to apply.
@available(iOS 17.0, *)
struct LogNextSetIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Log set"
  static var description = IntentDescription("Logs the next set of the running workout.")
  /// Only the Live Activity's button runs it; it has no place in Shortcuts or Spotlight.
  static var isDiscoverable: Bool = false

  init() {}

  func perform() async throws -> some IntentResult {
    guard let activity = Activity<WorkoutActivityAttributes>.activities.first else { return .result() }
    var state = activity.content.state
    guard !state.upcoming.isEmpty else { return .result() }
    let logged = state.upcoming.removeFirst()
    let now = Date()
    LoggedSetQueue.append(exKey: logged.exKey, setId: logged.setId, at: now)
    state.loggedFromLockScreen += 1
    state.lastActivityAt = now
    state.restEndsAt = logged.restSeconds > 0 ? now.addingTimeInterval(TimeInterval(logged.restSeconds)) : nil
    if let next = state.upcoming.first {
      if next.exKey != logged.exKey { state.exercisesDone = min(state.exercisesTotal, state.exercisesDone + 1) }
      state.exerciseName = next.exerciseName
      state.setLabel = next.setLabel
      state.detail = next.detail
    } else {
      state.setLabel = "Logged \(state.loggedFromLockScreen) from Lock Screen"
      state.detail = "Open Gruntz for what's next"
    }
    await activity.update(ActivityContent(state: state, staleDate: now.addingTimeInterval(3600)))
    return .result()
  }
}
