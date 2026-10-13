import Foundation
import HealthKit
import Combine

/// What the wrist can record. A ruck is a hike to HealthKit, tagged so the phone can tell them apart.
enum WristActivity: String, CaseIterable, Identifiable {
    case run, ruck, hike

    var id: String { rawValue }

    var title: String {
        switch self {
        case .run: return "Run"
        case .ruck: return "Ruck"
        case .hike: return "Hike"
        }
    }

    var symbol: String {
        switch self {
        case .run: return "figure.run"
        case .ruck: return "backpack"
        case .hike: return "figure.hiking"
        }
    }

    var hkType: HKWorkoutActivityType {
        switch self {
        case .run: return .running
        case .ruck, .hike: return .hiking
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

    private let store = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var timer: AnyCancellable?

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

    func start(_ activity: WristActivity) {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = activity.hkType
        configuration.locationType = .outdoor
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

    /// Back to the start screen once the summary has been read.
    func reset() {
        activity = nil
        finished = false
        session = nil
        builder = nil
        timer = nil
        elapsed = 0
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
        if let activity { metadata[Self.activityKey] = activity.rawValue }
        builder.addMetadata(metadata) { [weak self] _, _ in
            builder.endCollection(withEnd: date) { [weak self] _, _ in
                builder.finishWorkout { [weak self] _, err in
                    DispatchQueue.main.async {
                        if let err { self?.error = err.localizedDescription }
                        self?.timer = nil
                        self?.finished = true
                    }
                }
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
