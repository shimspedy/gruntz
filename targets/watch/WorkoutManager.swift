import Foundation
import HealthKit
import Combine

/// What the wrist can record. A ruck is a hike to HealthKit, tagged so the phone can tell them apart;
/// an indoor walk is tagged too, so the phone keeps it and leaves everyday strolls alone.
/// `strength` is the session that runs alongside a workout logged set by set.
enum WristActivity: String, CaseIterable, Identifiable {
    case run, ruck, hike, walk, strength

    /// The ones the athlete starts by themselves from the home screen.
    static let cardio: [WristActivity] = [.run, .ruck, .hike, .walk]

    var id: String { rawValue }

    var title: String {
        switch self {
        case .run: return "Run"
        case .ruck: return "Ruck"
        case .hike: return "Hike"
        case .walk: return "Indoor Walk"
        case .strength: return "Workout"
        }
    }

    var indoor: Bool { self == .walk || self == .strength }

    var symbol: String {
        switch self {
        case .run: return "figure.run"
        case .ruck: return "backpack"
        case .hike: return "figure.hiking"
        case .walk: return "figure.walk"
        case .strength: return "dumbbell.fill"
        }
    }

    var hkType: HKWorkoutActivityType {
        switch self {
        case .run: return .running
        case .ruck, .hike: return .hiking
        case .walk: return .walking
        case .strength: return .traditionalStrengthTraining
        }
    }
}

/// Drives one workout session and publishes the numbers the screen shows.
/// Everything it records lands in Apple Health; the Gruntz phone app imports from there.
final class WorkoutManager: NSObject, ObservableObject {
    static let brand = "Gruntz"
    static let activityKey = "GruntzActivity"

    @Published var activity: WristActivity?
    @Published var running = false
    @Published var elapsed: TimeInterval = 0
    @Published var heartRate: Double = 0
    @Published var distanceMeters: Double = 0
    @Published var activeCalories: Double = 0
    @Published var finished = false
    @Published var authorized: Bool? = nil
    @Published var error: String?
    /// Whether the last workout failed to save, so the summary does not claim it did.
    @Published var saveFailed = false

    private let store = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var timer: AnyCancellable?
    private var workoutTitle: String?
    private var discarding = false
    /// Set when the session ends without a summary screen of its own.
    private var quiet = false

    var available: Bool { HKHealthStore.isHealthDataAvailable() }

    func requestAuthorization() {
        guard available else { authorized = false; return }
        let share: Set<HKSampleType> = [HKQuantityType.workoutType()]
        let read: Set<HKObjectType> = [
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned),
            HKQuantityType(.distanceWalkingRunning),
        ]
        store.requestAuthorization(toShare: share, read: read) { [weak self] ok, err in
            DispatchQueue.main.async {
                self?.authorized = ok
                if let err { self?.error = err.localizedDescription }
            }
        }
    }

    /// True while a session of any kind is open, recording or paused.
    var busy: Bool { session != nil && !finished }

    func start(_ activity: WristActivity, title: String? = nil) {
        guard !busy else { return }
        // An error belongs to the workout it happened in; it used to follow every later one.
        error = nil
        saveFailed = false
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = activity.hkType
        configuration.locationType = activity.indoor ? .indoor : .outdoor
        workoutTitle = title
        discarding = false
        do {
            let session = try HKWorkoutSession(healthStore: store, configuration: configuration)
            let builder = session.associatedWorkoutBuilder()
            builder.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: configuration)
            session.delegate = self
            builder.delegate = self
            self.session = session
            self.builder = builder
            self.activity = activity
            finished = false
            elapsed = 0
            heartRate = 0
            distanceMeters = 0
            activeCalories = 0
            let startDate = Date()
            session.startActivity(with: startDate)
            builder.beginCollection(withStart: startDate) { [weak self] _, err in
                DispatchQueue.main.async { if let err { self?.error = err.localizedDescription } }
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func togglePause() {
        guard let session else { return }
        if running { session.pause() } else { session.resume() }
    }

    func end() {
        session?.end()
    }

    /// Ends the session alongside a set-by-set workout. A workout discarded on the phone
    /// leaves nothing in Health; a finished one is saved without stopping on a summary.
    func endStrength(save: Bool) {
        guard activity == .strength, session != nil else { return }
        discarding = !save
        quiet = true
        session?.end()
    }

    /// Back to the start screen once the summary has been read.
    func reset() {
        activity = nil
        finished = false
        session = nil
        builder = nil
        timer = nil
        elapsed = 0
        heartRate = 0
        distanceMeters = 0
        activeCalories = 0
        workoutTitle = nil
        discarding = false
        quiet = false
        error = nil
        saveFailed = false
    }

    private func startClock() {
        timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect().sink { [weak self] _ in
            guard let self, let builder = self.builder else { return }
            self.elapsed = builder.elapsedTime
        }
    }

    private func update(_ statistics: HKStatistics?) {
        guard let statistics else { return }
        DispatchQueue.main.async {
            switch statistics.quantityType {
            case HKQuantityType(.heartRate):
                let unit = HKUnit.count().unitDivided(by: .minute())
                self.heartRate = statistics.mostRecentQuantity()?.doubleValue(for: unit) ?? self.heartRate
            case HKQuantityType(.distanceWalkingRunning):
                self.distanceMeters = statistics.sumQuantity()?.doubleValue(for: .meter()) ?? self.distanceMeters
            case HKQuantityType(.activeEnergyBurned):
                self.activeCalories = statistics.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? self.activeCalories
            default:
                break
            }
        }
    }
}

extension WorkoutManager: HKWorkoutSessionDelegate {
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        DispatchQueue.main.async {
            self.running = toState == .running
            if toState == .running, self.timer == nil { self.startClock() }
        }
        guard toState == .ended, let builder else { return }
        // Name the workout so the phone app can show where it came from, and keep the ruck/hike distinction.
        var metadata: [String: Any] = [HKMetadataKeyWorkoutBrandName: Self.brand]
        if let activity {
            metadata[Self.activityKey] = activity.rawValue
            if activity.indoor { metadata[HKMetadataKeyIndoorWorkout] = true }
        }
        if let workoutTitle { metadata["GruntzWorkout"] = String(workoutTitle.prefix(80)) }
        let discarding = self.discarding
        let quiet = self.quiet
        let done: (Error?) -> Void = { [weak self] err in
            DispatchQueue.main.async {
                guard let self else { return }
                if let err {
                    self.error = err.localizedDescription
                    self.saveFailed = true
                }
                self.timer = nil
                // A session that ran beside a workout has no summary here: straight back to idle.
                if quiet { self.quiet = false; self.reset() } else { self.finished = true }
            }
        }
        if discarding {
            builder.endCollection(withEnd: date) { _, _ in
                builder.discardWorkout()
                done(nil)
            }
            return
        }
        builder.addMetadata(metadata) { _, _ in
            builder.endCollection(withEnd: date) { _, _ in
                builder.finishWorkout { _, err in done(err) }
            }
        }
    }

    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        DispatchQueue.main.async { self.error = error.localizedDescription }
    }
}

extension WorkoutManager: HKLiveWorkoutBuilderDelegate {
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType else { continue }
            update(workoutBuilder.statistics(for: quantityType))
        }
    }

    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
}
