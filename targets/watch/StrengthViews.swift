import SwiftUI
import WatchKit

/// A workout logged set by set. The phone owns it; the wrist shows the set that is up,
/// lets the Digital Crown correct the weight and reps, logs it, and counts the rest.
struct StrengthSessionView: View {
    @EnvironmentObject private var workout: WorkoutManager
    @EnvironmentObject private var link: PhoneLink
    @State private var showExercises = false
    @State private var showControls = false

    var body: some View {
        Group {
            if let live = link.live, live.exercises.indices.contains(link.exerciseIndex) {
                SetPage(live: live, exercise: live.exercises[link.exerciseIndex])
            } else {
                ProgressView()
            }
        }
        .navigationTitle(position)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button { showExercises = true } label: { Image(systemName: "list.bullet") }
                    .accessibilityLabel("Exercises")
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { showControls = true } label: { Image(systemName: "ellipsis") }
                    .accessibilityLabel("Workout")
            }
        }
        .sheet(isPresented: $showExercises) { ExerciseListSheet(isPresented: $showExercises) }
        .sheet(isPresented: $showControls) { SessionControlsSheet(isPresented: $showControls) }
        .onAppear(perform: track)
        .onChange(of: workout.authorized) { _, _ in track() }
    }

    private var position: String {
        guard let live = link.live else { return "" }
        return "\(min(link.exerciseIndex + 1, live.exercises.count)) of \(live.exercises.count)"
    }

    /// Heart rate and calories for the workout; also what keeps the rest timer running wrist-down.
    private func track() {
        guard workout.authorized == true, !workout.busy, let live = link.live else { return }
        workout.start(.strength, title: live.title)
    }
}

private struct SetPage: View {
    @EnvironmentObject private var workout: WorkoutManager
    @EnvironmentObject private var link: PhoneLink
    let live: LiveWorkout
    let exercise: LiveExercise

    private enum Field { case weight, reps, seconds }
    @FocusState private var focus: Field?
    @State private var weight: Double = 0
    @State private var reps: Double = 0
    @State private var seconds: Double = 0
    /// A timed set counting down on the wrist.
    @State private var holdEndsAt: Date?
    @State private var holdTask: Task<Void, Never>?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let end = link.restEndsAt, end > Date() {
                RestView(end: end, next: nextUp)
            } else if let set = exercise.nextSet {
                header(exercise.label(for: set))
                fields(for: set)
                logButton(for: set)
            } else if live.allDone {
                finished
            } else {
                header("Complete")
                Button("Next exercise") { moveOn() }
                    .buttonStyle(.borderedProminent)
                    .tint(.accentColor)
            }
            if let message = link.message {
                Text(message).font(.caption2).foregroundStyle(.secondary).lineLimit(4)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(.horizontal, 4)
        .onChange(of: valuesKey, initial: true) { _, _ in load() }
        .onDisappear { holdTask?.cancel() }
    }

    /// Changes when another set comes up, or the phone corrects this one's numbers.
    private var valuesKey: String {
        guard let set = exercise.nextSet else { return exercise.key }
        return "\(set.id)|\(set.reps ?? -1)|\(set.weight ?? -1)|\(set.seconds ?? -1)"
    }

    private func load() {
        holdTask?.cancel()
        holdEndsAt = nil
        guard let set = exercise.nextSet else { return }
        weight = set.weight ?? 0
        reps = set.reps ?? 0
        seconds = set.seconds ?? 0
        focus = exercise.kind == "time" ? .seconds : exercise.kind == "reps" ? .reps : nil
    }

    private func header(_ label: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(exercise.name)
                .font(.headline)
                .lineLimit(2)
                .minimumScaleFactor(0.75)
            HStack(spacing: 4) {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Spacer(minLength: 0)
                if workout.heartRate > 0 {
                    Image(systemName: "heart.fill").font(.caption2).foregroundStyle(.red)
                    Text("\(Int(workout.heartRate))").font(.caption.monospacedDigit())
                }
            }
        }
    }

    @ViewBuilder
    private func fields(for set: LiveSet) -> some View {
        HStack(spacing: 6) {
            if exercise.weighted {
                ValueField(value: Format.weight(weight), unit: link.unit)
                    .focusable()
                    .focused($focus, equals: .weight)
                    .digitalCrownRotation($weight, from: 0, through: 1500, by: link.unit == "kg" ? 2.5 : 5, sensitivity: .low, isContinuous: false, isHapticFeedbackEnabled: true)
                    .accessibilityLabel("Weight")
                    .accessibilityValue("\(Format.weight(weight)) \(link.unit)")
            }
            switch exercise.kind {
            case "time":
                ValueField(value: Format.clock(Int(seconds)), unit: "hold")
                    .focusable(holdEndsAt == nil)
                    .focused($focus, equals: .seconds)
                    .digitalCrownRotation($seconds, from: 5, through: 3600, by: 5, sensitivity: .low, isContinuous: false, isHapticFeedbackEnabled: true)
                    .accessibilityLabel("Hold time")
            case "distance":
                ValueField(value: set.distance ?? "--", unit: "distance")
            default:
                ValueField(value: reps > 0 ? String(Int(reps)) : "--", unit: "reps")
                    .focusable()
                    .focused($focus, equals: .reps)
                    .digitalCrownRotation($reps, from: 0, through: 999, by: 1, sensitivity: .low, isContinuous: false, isHapticFeedbackEnabled: true)
                    .accessibilityLabel("Reps")
                    .accessibilityValue("\(Int(reps))")
            }
        }
    }

    @ViewBuilder
    private func logButton(for set: LiveSet) -> some View {
        if exercise.kind == "time" {
            if let end = holdEndsAt {
                Button { cancelHold() } label: {
                    Text(timerInterval: Date()...max(end, Date()), countsDown: true)
                        .monospacedDigit()
                        .frame(maxWidth: .infinity)
                }
                .tint(.yellow)
                .accessibilityLabel("Stop timer")
            } else {
                HStack(spacing: 6) {
                    Button { startHold(set) } label: { Image(systemName: "timer").frame(maxWidth: .infinity) }
                        .accessibilityLabel("Start timer")
                    Button { log(set) } label: { Text("Log").frame(maxWidth: .infinity) }
                        .buttonStyle(.borderedProminent)
                        .tint(.accentColor)
                }
            }
        } else {
            Button { log(set) } label: { Text("Log set").frame(maxWidth: .infinity) }
                .buttonStyle(.borderedProminent)
                .tint(.accentColor)
                // A set with no number yet (a max-effort set) needs one dialled in first.
                .disabled(exercise.kind == "reps" && reps < 1)
        }
    }

    private var finished: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("All sets logged", systemImage: "checkmark.circle.fill")
                .font(.headline)
                .foregroundStyle(.green)
            Text("\(live.setsDone) sets · \(live.exercises.count) exercises")
                .font(.caption)
                .foregroundStyle(.secondary)
            FinishButton()
        }
    }

    /// The set that follows the rest, so the athlete knows what to load.
    private var nextUp: String? {
        guard let set = exercise.nextSet else { return live.allDone ? "Last set done" : nil }
        var parts: [String] = []
        if exercise.weighted, let weight = set.weight, weight > 0 { parts.append("\(Format.weight(weight)) \(link.unit)") }
        if exercise.kind == "reps", let reps = set.reps, reps > 0 { parts.append("\(Int(reps)) reps") }
        if exercise.kind == "time", let seconds = set.seconds, seconds > 0 { parts.append(Format.clock(Int(seconds))) }
        // Same exercise, so its name would only push the numbers off the screen.
        let detail = parts.joined(separator: " × ")
        return detail.isEmpty ? exercise.label(for: set) : "\(exercise.label(for: set)) · \(detail)"
    }

    private func log(_ set: LiveSet) {
        holdTask?.cancel()
        holdEndsAt = nil
        link.message = nil
        link.log(
            exercise: exercise,
            set: set,
            reps: exercise.kind == "reps" && reps >= 1 ? Int(reps) : nil,
            weight: exercise.weighted ? weight : nil,
            seconds: exercise.kind == "time" && seconds >= 1 ? Int(seconds) : nil
        )
    }

    private func startHold(_ set: LiveSet) {
        let end = Date().addingTimeInterval(seconds)
        holdEndsAt = end
        WKInterfaceDevice.current().play(.start)
        holdTask?.cancel()
        holdTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(max(0, end.timeIntervalSinceNow) * 1_000_000_000))
            guard !Task.isCancelled, holdEndsAt == end else { return }
            log(set)
        }
    }

    private func cancelHold() {
        holdTask?.cancel()
        holdEndsAt = nil
        WKInterfaceDevice.current().play(.stop)
    }

    private func moveOn() {
        let count = live.exercises.count
        for step in 1..<max(2, count) {
            let candidate = (link.exerciseIndex + step) % count
            if !live.exercises[candidate].isDone { link.exerciseIndex = candidate; return }
        }
    }
}

/// One number the Digital Crown can turn. Tap it to choose it; the system ring shows which is live.
private struct ValueField: View {
    let value: String
    let unit: String

    var body: some View {
        VStack(spacing: 0) {
            Text(value)
                .font(.system(.title2, design: .rounded).weight(.semibold).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(unit).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.gray.opacity(0.22)))
    }
}

private struct RestView: View {
    @EnvironmentObject private var link: PhoneLink
    let end: Date
    let next: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Rest").font(.caption).foregroundStyle(.secondary)
            Text(timerInterval: Date()...max(end, Date()), countsDown: true)
                .font(.system(size: 40, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(.yellow)
            ProgressView(timerInterval: end.addingTimeInterval(-max(link.restTotal, 1))...end, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                .tint(.yellow)
            if let next {
                Text("Next: \(next)").font(.caption2).foregroundStyle(.secondary).lineLimit(2).minimumScaleFactor(0.8)
            }
            HStack(spacing: 4) {
                Button { link.addRest(-15) } label: { Text("−15").frame(maxWidth: .infinity) }
                    .accessibilityLabel("Subtract 15 seconds")
                Button { link.skipRest() } label: { Text("Skip").frame(maxWidth: .infinity) }
                    .buttonStyle(.borderedProminent)
                    .tint(.accentColor)
                Button { link.addRest(15) } label: { Text("+15").frame(maxWidth: .infinity) }
                    .accessibilityLabel("Add 15 seconds")
            }
            .font(.footnote)
        }
    }
}

private struct FinishButton: View {
    @EnvironmentObject private var link: PhoneLink
    @State private var confirming = false

    var body: some View {
        Button {
            confirming = true
        } label: {
            if link.finishing { ProgressView() } else { Text("Finish workout").frame(maxWidth: .infinity) }
        }
        .buttonStyle(.borderedProminent)
        .tint(.green)
        .disabled(link.finishing)
        .confirmationDialog("Finish and save this workout?", isPresented: $confirming, titleVisibility: .visible) {
            Button("Finish workout") { link.finish() }
            Button("Keep training", role: .cancel) {}
        }
    }
}

private struct ExerciseListSheet: View {
    @EnvironmentObject private var link: PhoneLink
    @Binding var isPresented: Bool

    var body: some View {
        List {
            ForEach(Array((link.live?.exercises ?? []).enumerated()), id: \.element.key) { index, exercise in
                Button {
                    link.exerciseIndex = index
                    isPresented = false
                } label: {
                    HStack(spacing: 6) {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(exercise.name).font(.footnote.weight(.semibold)).lineLimit(2)
                            Text("\(exercise.workingDone) of \(max(exercise.required, exercise.workingDone)) sets")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Spacer(minLength: 0)
                        if exercise.isDone {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                        } else if index == link.exerciseIndex {
                            Image(systemName: "chevron.right").font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("Exercises")
    }
}

private struct SessionControlsSheet: View {
    @EnvironmentObject private var workout: WorkoutManager
    @EnvironmentObject private var link: PhoneLink
    @Binding var isPresented: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                if let live = link.live {
                    Text(live.title).font(.headline).lineLimit(2)
                    Text(Date(timeIntervalSince1970: live.startedAt / 1000), style: .timer)
                        .font(.system(size: 34, weight: .semibold, design: .rounded).monospacedDigit())
                        .foregroundStyle(.yellow)
                    HStack(spacing: 12) {
                        metric(workout.heartRate > 0 ? "\(Int(workout.heartRate))" : "--", "BPM")
                        metric("\(Int(workout.activeCalories))", "CAL")
                        metric("\(live.setsDone)/\(live.setsTotal)", "SETS")
                    }
                }
                if !link.reachable {
                    Text("iPhone out of reach. Sets you log are kept and sync when it is back.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                FinishButton()
                Button {
                    isPresented = false
                    link.inSession = false
                } label: {
                    Text("Home").frame(maxWidth: .infinity)
                }
                if let message = link.message {
                    Text(message).font(.caption2).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func metric(_ value: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(value).font(.system(.title3, design: .rounded).weight(.medium).monospacedDigit())
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
    }
}
