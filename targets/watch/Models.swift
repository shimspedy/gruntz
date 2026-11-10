import Foundation

/// What the phone tells the watch. The phone owns the workout; this is its picture of it.
/// Mirrors `src/features/watchState.ts`.
struct WatchState: Codable, Equatable {
    var v: Int
    var unit: String
    var live: LiveWorkout?
    var workouts: [StartableWorkout]
    var result: WorkoutResult?
    var notice: PhoneNotice?
    /// When the phone sent this, in milliseconds. Absent from an older phone app.
    var at: Double?
}

struct LiveWorkout: Codable, Equatable {
    /// The session's start time in milliseconds; commands carry it so a stale one is ignored.
    var id: Double
    var title: String
    var startedAt: Double
    var index: Int
    var restEndsAt: Double?
    var exercises: [LiveExercise]

    var setsDone: Int { exercises.reduce(0) { $0 + $1.workingDone } }
    var setsTotal: Int { exercises.reduce(0) { $0 + max($1.required, $1.workingDone) } }
    var allDone: Bool { !exercises.isEmpty && exercises.allSatisfy(\.isDone) }
}

struct LiveExercise: Codable, Equatable, Identifiable {
    var key: String
    var name: String
    var kind: String
    var weighted: Bool
    var rest: Int
    var required: Int
    var sets: [LiveSet]

    var id: String { key }
    var workingDone: Int { sets.filter { $0.done && $0.warmup != true }.count }
    var isDone: Bool { workingDone >= required }
    var nextSet: LiveSet? { sets.first { !$0.done } }

    func label(for set: LiveSet) -> String {
        if set.warmup == true { return "Warm-up" }
        let working = sets.filter { $0.warmup != true }
        let position = (working.firstIndex { $0.id == set.id } ?? 0) + 1
        return "Set \(position) of \(working.count)"
    }
}

struct LiveSet: Codable, Equatable, Identifiable {
    var id: String
    var warmup: Bool?
    var reps: Double?
    var weight: Double?
    var seconds: Double?
    var distance: String?
    var done: Bool
}

struct StartableWorkout: Codable, Equatable, Identifiable {
    var id: String
    var title: String
    var detail: String
    var locked: Bool?
}

struct WorkoutResult: Codable, Equatable {
    var session: Double
    var xp: Double
    var sets: Double
    var minutes: Double
    var personalRecords: Double
}

struct PhoneNotice: Codable, Equatable {
    var at: Double
    var text: String
}

/// A set logged on the wrist that the phone has not confirmed yet.
struct PendingLog: Codable, Equatable {
    var session: Double
    var exKey: String
    var reps: Int?
    var weight: Double?
    var seconds: Int?
    var at: Date
}

enum Format {
    static func weight(_ value: Double) -> String {
        value == value.rounded() ? String(Int(value)) : String(format: "%.1f", value)
    }

    static func clock(_ seconds: Int) -> String {
        let s = max(0, seconds)
        return s >= 3600 ? String(format: "%d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60) : String(format: "%d:%02d", s / 60, s % 60)
    }
}
