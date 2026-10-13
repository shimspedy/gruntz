import SwiftUI

/// Start screen → live numbers while recording → a short summary. One activity at a time.
struct ContentView: View {
    @EnvironmentObject private var workout: WorkoutManager

    var body: some View {
        NavigationStack {
            if workout.finished {
                SummaryView()
            } else if workout.activity != nil {
                LiveView()
            } else {
                StartView()
            }
        }
    }
}

struct StartView: View {
    @EnvironmentObject private var workout: WorkoutManager

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                if workout.authorized == false {
                    Text("Allow Health access on this watch to record.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.bottom, 4)
                }
                ForEach(WristActivity.allCases) { activity in
                    Button {
                        workout.start(activity)
                    } label: {
                        HStack {
                            Image(systemName: activity.symbol)
                                .font(.title3)
                                .frame(width: 28)
                            Text(activity.title)
                                .font(.headline)
                            Spacer()
                        }
                        .padding(.vertical, 6)
                    }
                    .tint(.accentColor)
                    .disabled(workout.authorized == false)
                }
                Text("Saves to Apple Health. Gruntz on your phone picks it up from there.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.top, 6)
            }
        }
        .navigationTitle("Gruntz")
    }
}

struct LiveView: View {
    @EnvironmentObject private var workout: WorkoutManager

    var body: some View {
        TabView {
            metrics
            controls
        }
        .tabViewStyle(.verticalPage)
        .navigationTitle(workout.activity?.title ?? "")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var metrics: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(elapsedLabel)
                .font(.system(size: 40, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(.yellow)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(workout.heartRate > 0 ? "\(Int(workout.heartRate))" : "--")
                    .font(.system(size: 30, weight: .medium, design: .rounded).monospacedDigit())
                Text("BPM").font(.caption).foregroundStyle(.secondary)
                Image(systemName: "heart.fill").foregroundStyle(.red).font(.caption)
            }
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(String(format: "%.2f", workout.distanceMeters / 1609.344))
                    .font(.system(size: 30, weight: .medium, design: .rounded).monospacedDigit())
                Text("MI").font(.caption).foregroundStyle(.secondary)
            }
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(Int(workout.activeCalories))")
                    .font(.system(size: 24, weight: .medium, design: .rounded).monospacedDigit())
                Text("CAL").font(.caption).foregroundStyle(.secondary)
            }
            if !workout.running {
                Text("Paused").font(.caption).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 4)
    }

    private var controls: some View {
        HStack(spacing: 12) {
            VStack {
                Button { workout.end() } label: {
                    Image(systemName: "xmark").font(.title2)
                }
                .tint(.red)
                Text("End").font(.caption2)
            }
            VStack {
                Button { workout.togglePause() } label: {
                    Image(systemName: workout.running ? "pause" : "play.fill").font(.title2)
                }
                .tint(.yellow)
                Text(workout.running ? "Pause" : "Resume").font(.caption2)
            }
        }
    }

    private var elapsedLabel: String {
        let total = Int(workout.elapsed)
        let h = total / 3600, m = (total % 3600) / 60, s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%02d:%02d", m, s)
    }
}

struct SummaryView: View {
    @EnvironmentObject private var workout: WorkoutManager

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text("Saved to Health")
                    .font(.headline)
                row("Time", value: elapsedLabel)
                row("Distance", value: String(format: "%.2f mi", workout.distanceMeters / 1609.344))
                row("Calories", value: "\(Int(workout.activeCalories))")
                if workout.heartRate > 0 { row("Heart rate", value: "\(Int(workout.heartRate)) bpm") }
                if let error = workout.error {
                    Text(error).font(.caption2).foregroundStyle(.secondary)
                }
                Button("Done") { workout.reset() }
                    .tint(.accentColor)
                    .padding(.top, 6)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .navigationTitle(workout.activity?.title ?? "Done")
    }

    private func row(_ label: String, value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(.secondary)
            Spacer()
            Text(value).monospacedDigit()
        }
        .font(.footnote)
    }

    private var elapsedLabel: String {
        let total = Int(workout.elapsed)
        let h = total / 3600, m = (total % 3600) / 60, s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%02d:%02d", m, s)
    }
}
