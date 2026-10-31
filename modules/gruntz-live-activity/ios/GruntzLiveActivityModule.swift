import ActivityKit
import ExpoModulesCore
import Foundation

/// Starts, updates and ends the workout Live Activity, and hands the app the sets that
/// were logged from the Lock Screen while it was away.
public class GruntzLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GruntzLiveActivity")

    // Interactive Live Activities (the Log set button) need iOS 17.
    Function("isSupported") { () -> Bool in
      guard #available(iOS 17.0, *) else { return false }
      return ActivityAuthorizationInfo().areActivitiesEnabled
    }

    AsyncFunction("sync") { (payload: String) in
      guard #available(iOS 17.0, *) else { return }
      await LiveWorkout.sync(payload)
    }

    AsyncFunction("end") { () in
      guard #available(iOS 17.0, *) else { return }
      await LiveWorkout.end()
    }

    Function("drainLoggedSets") { () -> String in
      LoggedSetQueue.drain()
    }
  }
}

@available(iOS 17.0, *)
enum LiveWorkout {
  private struct Payload: Decodable {
    let title: String
    let startedAt: Double
    let state: State
    struct State: Decodable {
      let exerciseName: String
      let setLabel: String
      let detail: String
      let exercisesDone: Int
      let exercisesTotal: Int
      let restEndsAt: Double?
      let lastActivityAt: Double
      let upcoming: [Upcoming]
      let loggedFromLockScreen: Int
    }
    struct Upcoming: Decodable {
      let exKey: String
      let setId: String
      let exerciseName: String
      let setLabel: String
      let detail: String
      let restSeconds: Int
    }
  }

  private static func date(_ ms: Double) -> Date { Date(timeIntervalSince1970: ms / 1000) }

  static func sync(_ json: String) async {
    // Sets logged from the Lock Screen are not in the app yet; it drains them first,
    // then sends a state that includes them. Updating now would roll them back.
    if LoggedSetQueue.hasPending { return }
    guard let data = json.data(using: .utf8), let p = try? JSONDecoder().decode(Payload.self, from: data) else { return }
    let state = WorkoutActivityAttributes.ContentState(
      exerciseName: p.state.exerciseName,
      setLabel: p.state.setLabel,
      detail: p.state.detail,
      exercisesDone: p.state.exercisesDone,
      exercisesTotal: p.state.exercisesTotal,
      restEndsAt: p.state.restEndsAt.map(date),
      lastActivityAt: date(p.state.lastActivityAt),
      upcoming: p.state.upcoming.map {
        .init(exKey: $0.exKey, setId: $0.setId, exerciseName: $0.exerciseName, setLabel: $0.setLabel, detail: $0.detail, restSeconds: $0.restSeconds)
      },
      loggedFromLockScreen: p.state.loggedFromLockScreen
    )
    // An hour without a set and the activity reads as stale: "Still training?"
    let content = ActivityContent(state: state, staleDate: state.lastActivityAt.addingTimeInterval(3600))
    let startedAt = date(p.startedAt)
    let current = Activity<WorkoutActivityAttributes>.activities
    if let activity = current.first(where: { $0.attributes.startedAt == startedAt }) {
      for other in current where other.id != activity.id { await other.end(nil, dismissalPolicy: .immediate) }
      await activity.update(content)
      return
    }
    for other in current { await other.end(nil, dismissalPolicy: .immediate) }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    _ = try? Activity.request(attributes: WorkoutActivityAttributes(title: p.title, startedAt: startedAt), content: content, pushType: nil)
  }

  static func end() async {
    LoggedSetQueue.clear()
    for activity in Activity<WorkoutActivityAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }
}
