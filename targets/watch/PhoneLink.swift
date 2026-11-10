import Combine
import Foundation
import WatchConnectivity
import WatchKit

/// The watch's side of the conversation with the phone app. It shows the phone's workout,
/// logs sets against it, and keeps what was logged on screen until the phone confirms it,
/// so a set logged out of range is still there when the phone comes back.
final class PhoneLink: NSObject, ObservableObject {
    @Published private(set) var state: WatchState?
    @Published private(set) var pending: [String: PendingLog] = [:]
    @Published private(set) var restEndsAt: Date?
    @Published private(set) var restTotal: TimeInterval = 0
    @Published private(set) var reachable = false
    /// The exercise on screen. The athlete can move around; logging advances it.
    @Published var exerciseIndex = 0
    /// The workout the phone has been asked to start, while the answer is awaited.
    @Published private(set) var starting: String?
    @Published private(set) var finishing = false
    /// Why the last request did nothing, shown once.
    @Published var message: String?
    /// Whether the workout screen is open (it opens itself when a workout starts).
    @Published var inSession = false

    private static let pendingKey = "phoneLink.pending"
    private static let stateKey = "phoneLink.state"
    private var backlog: [[String: Any]] = []
    private var restTask: Task<Void, Never>?
    private var waitTask: Task<Void, Never>?
    private var lastRequestAt: Double = 0

    override init() {
        super.init()
        if let data = UserDefaults.standard.data(forKey: Self.pendingKey), let saved = try? JSONDecoder().decode([String: PendingLog].self, from: data) {
            pending = saved
        }
        // The last picture the phone sent, so the app opens on something real even out of range.
        if let data = UserDefaults.standard.data(forKey: Self.stateKey), let saved = try? JSONDecoder().decode(WatchState.self, from: data) {
            state = saved
            inSession = saved.live != nil
            exerciseIndex = min(max(0, saved.live?.index ?? 0), max(0, (saved.live?.exercises.count ?? 1) - 1))
        }
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    // MARK: What the screens read

    /// The workout as the phone last described it, with sets logged here already ticked.
    var live: LiveWorkout? {
        guard var live = state?.live else { return nil }
        guard !pending.isEmpty else { return live }
        for e in live.exercises.indices {
            for s in live.exercises[e].sets.indices {
                guard let log = pending[live.exercises[e].sets[s].id], log.session == live.id else { continue }
                live.exercises[e].sets[s].done = true
                if let reps = log.reps { live.exercises[e].sets[s].reps = Double(reps) }
                if let weight = log.weight { live.exercises[e].sets[s].weight = weight > 0 ? weight : nil }
                if let seconds = log.seconds { live.exercises[e].sets[s].seconds = Double(seconds) }
            }
        }
        return live
    }

    var unit: String { state?.unit ?? "lb" }
    var workouts: [StartableWorkout] { state?.workouts ?? [] }
    var result: WorkoutResult? { state?.result }
    var resting: Bool { (restEndsAt ?? .distantPast) > Date() }

    // MARK: What the athlete does

    func log(exercise: LiveExercise, set: LiveSet, reps: Int?, weight: Double?, seconds: Int?) {
        guard let live = state?.live else { return }
        let now = Date()
        pending[set.id] = PendingLog(session: live.id, exKey: exercise.key, reps: reps, weight: weight, seconds: seconds, at: now)
        savePending()
        var body: [String: Any] = ["t": "log", "session": live.id, "exKey": exercise.key, "setId": set.id]
        if let reps { body["reps"] = reps }
        if let weight { body["weight"] = weight }
        if let seconds { body["seconds"] = seconds }
        send(body, at: now)
        WKInterfaceDevice.current().play(.success)
        setRest(exercise.rest > 0 ? now.addingTimeInterval(TimeInterval(exercise.rest)) : nil, total: TimeInterval(exercise.rest))
        advance()
    }

    func skipRest() {
        guard let live = state?.live else { return }
        setRest(nil)
        send(["t": "rest", "session": live.id, "action": "skip", "seconds": 0])
    }

    func addRest(_ seconds: Int) {
        guard let live = state?.live, let end = restEndsAt else { return }
        let next = max(Date().addingTimeInterval(1), end.addingTimeInterval(TimeInterval(seconds)))
        setRest(next, total: max(next.timeIntervalSinceNow, restTotal + TimeInterval(seconds)))
        send(["t": "rest", "session": live.id, "action": "add", "seconds": seconds])
    }

    /// Starting needs the phone now: it builds the workout. Nothing is queued for later.
    func start(_ workout: StartableWorkout) {
        if workout.locked == true {
            message = "Unlock Gruntz Pro on your iPhone to start this workout."
            return
        }
        guard WCSession.default.activationState == .activated, WCSession.default.isReachable else {
            message = "Can’t reach your iPhone. Keep it nearby, open Gruntz on it once, then try again."
            return
        }
        starting = workout.id
        message = nil
        send(["t": "start", "workout": workout.id], durable: false)
        wait(seconds: 12) { [weak self] in
            guard let self, self.starting != nil else { return }
            self.starting = nil
            self.message = "Your iPhone didn’t answer. Open Gruntz on it and try again."
        }
    }

    func finish() {
        guard let live = state?.live else { return }
        guard WCSession.default.activationState == .activated, WCSession.default.isReachable else {
            message = "Can’t reach your iPhone. Your sets are saved here and will sync; finish the workout on your iPhone."
            return
        }
        finishing = true
        message = nil
        send(["t": "finish", "session": live.id], durable: false)
        wait(seconds: 15) { [weak self] in
            guard let self, self.finishing else { return }
            self.finishing = false
            self.message = "Your iPhone didn’t answer. Finish the workout in Gruntz on your iPhone."
        }
    }

    /// Asks the phone for a fresh picture; used when the app comes to the front.
    func refresh() {
        guard WCSession.default.activationState == .activated, WCSession.default.isReachable else { return }
        send(["t": "sync"], durable: false)
    }

    // MARK: Plumbing

    /// Moves on when the exercise on screen is finished, to the next one with sets left.
    private func advance() {
        guard let live else { return }
        let count = live.exercises.count
        guard count > 0, exerciseIndex < count, live.exercises[exerciseIndex].nextSet == nil || live.exercises[exerciseIndex].isDone else { return }
        for step in 1..<max(2, count) {
            let candidate = (exerciseIndex + step) % count
            if !live.exercises[candidate].isDone, live.exercises[candidate].nextSet != nil {
                exerciseIndex = candidate
                return
            }
        }
    }

    private func setRest(_ end: Date?, total: TimeInterval = 0) {
        restTask?.cancel()
        restTask = nil
        guard let end, end > Date() else {
            if restEndsAt != nil { restEndsAt = nil }
            restTotal = 0
            return
        }
        restEndsAt = end
        restTotal = max(total, end.timeIntervalSinceNow)
        // A workout session keeps the app running with the wrist down, so this fires on time.
        restTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(max(0, end.timeIntervalSinceNow) * 1_000_000_000))
            guard !Task.isCancelled, let self, self.restEndsAt == end else { return }
            self.restEndsAt = nil
            self.restTotal = 0
            WKInterfaceDevice.current().play(.notification)
        }
    }

    private func wait(seconds: Double, then: @escaping @MainActor () -> Void) {
        waitTask?.cancel()
        waitTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            guard !Task.isCancelled else { return }
            then()
        }
    }

    private func savePending() {
        if let data = try? JSONEncoder().encode(pending) { UserDefaults.standard.set(data, forKey: Self.pendingKey) }
    }

    /// `durable` commands are queued by the system when the phone is out of reach and
    /// delivered when it is back; the rest only make sense right now.
    private func send(_ body: [String: Any], at: Date = Date(), durable: Bool = true) {
        var body = body
        body["id"] = UUID().uuidString
        body["at"] = (at.timeIntervalSince1970 * 1000).rounded()
        lastRequestAt = max(lastRequestAt, body["at"] as? Double ?? 0)
        guard WCSession.isSupported() else { return }
        guard WCSession.default.activationState == .activated else {
            if durable { backlog.append(body) }
            return
        }
        deliver(body, durable: durable)
    }

    private func deliver(_ body: [String: Any], durable: Bool) {
        guard let data = try? JSONSerialization.data(withJSONObject: body), let json = String(data: data, encoding: .utf8) else { return }
        let session = WCSession.default
        let payload = ["command": json]
        if session.isReachable {
            session.sendMessage(payload, replyHandler: { _ in }, errorHandler: { _ in
                // Lost in flight: hand it to the queue that survives being out of range.
                if durable { session.transferUserInfo(payload) }
            })
        } else if durable {
            session.transferUserInfo(payload)
        }
    }

    private func adopt(_ next: WatchState) {
        // The application context and a direct message can cross: an older snapshot must not undo a newer one.
        // Only a short gap counts, so a phone whose clock was set back is not ignored for long.
        if let at = next.at, let last = state?.at, at < last, last - at < 600_000 { return }
        let previous = state?.live?.id
        state = next
        if let data = try? JSONEncoder().encode(next) { UserDefaults.standard.set(data, forKey: Self.stateKey) }
        if let live = next.live {
            var done: [String: Bool] = [:]
            for exercise in live.exercises { for set in exercise.sets { done[set.id] = set.done } }
            let now = Date()
            let kept = pending.filter { id, log in
                // Confirmed, gone, or from another workout: nothing left to show.
                guard log.session == live.id, done[id] == false else { return false }
                // In touch with the phone and still not accepted after this long: it refused the set.
                return !(reachable && now.timeIntervalSince(log.at) > 20)
            }
            if kept != pending { pending = kept; savePending() }
            if previous != live.id {
                exerciseIndex = min(max(0, live.index), max(0, live.exercises.count - 1))
                inSession = true
                setRest(nil)
            }
            exerciseIndex = min(exerciseIndex, max(0, live.exercises.count - 1))
            // With nothing waiting on the phone, its rest clock is the truth (it may have been skipped there).
            if pending.isEmpty {
                let end = live.restEndsAt.map { Date(timeIntervalSince1970: $0 / 1000) }
                if end != restEndsAt { setRest(end, total: restTotal) }
            }
            starting = nil
        } else {
            if !pending.isEmpty { pending = [:]; savePending() }
            setRest(nil)
            exerciseIndex = 0
            if finishing {
                finishing = false
                waitTask?.cancel()
            }
        }
        if let notice = next.notice, notice.at >= lastRequestAt - 1000, starting != nil || finishing {
            message = notice.text
            starting = nil
            finishing = false
            waitTask?.cancel()
        }
    }

    private func receive(_ payload: [String: Any]) {
        guard let json = payload["state"] as? String, let data = json.data(using: .utf8),
              let next = try? JSONDecoder().decode(WatchState.self, from: data) else { return }
        DispatchQueue.main.async { self.adopt(next) }
    }
}

extension PhoneLink: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let context = session.receivedApplicationContext
        DispatchQueue.main.async {
            self.reachable = session.isReachable
            let waiting = self.backlog
            self.backlog = []
            for body in waiting { self.deliver(body, durable: true) }
            self.refresh()
        }
        if !context.isEmpty { receive(context) }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.reachable = session.isReachable
            if session.isReachable { self.refresh() }
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) { receive(applicationContext) }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) { receive(message) }
}
