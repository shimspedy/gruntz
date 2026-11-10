import SwiftUI

/// What you can do from the wrist: carry on the workout that is open, start one of
/// yours on the phone, or record a run, ruck, hike or indoor walk on the watch alone.
struct HomeView: View {
    @EnvironmentObject private var workout: WorkoutManager
    @EnvironmentObject private var link: PhoneLink

    var body: some View {
        List {
            if let live = link.live {
                Section {
                    Button { link.inSession = true } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(live.title).font(.headline).lineLimit(2)
                            Text("\(live.setsDone) of \(live.setsTotal) sets · Continue")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowBackground(Color.accentColor.opacity(0.3).clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous)))
                } header: {
                    Text("In progress")
                }
            } else {
                Section {
                    if let result = link.result { ResultRow(result: result) }
                    if link.workouts.isEmpty {
                        Text("Open Gruntz on your iPhone once and your workouts appear here.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    ForEach(link.workouts) { item in
                        Button { link.start(item) } label: {
                            HStack(spacing: 8) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.title).font(.headline).lineLimit(2)
                                    Text(item.detail).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                                }
                                Spacer(minLength: 0)
                                if link.starting == item.id {
                                    ProgressView().frame(width: 20)
                                } else if item.locked == true {
                                    Image(systemName: "lock.fill").font(.caption).foregroundStyle(.secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .disabled(link.starting != nil)
                    }
                } header: {
                    Text("Workouts")
                }
            }

            if let message = link.message {
                Section {
                    Text(message).font(.footnote).foregroundStyle(.secondary)
                }
            }

            Section {
                if workout.authorized == false {
                    Text("Allow Health access on this watch to record.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                ForEach(WristActivity.cardio) { activity in
                    Button {
                        workout.start(activity)
                    } label: {
                        Label(activity.title, systemImage: activity.symbol)
                            .font(.headline)
                            .padding(.vertical, 4)
                    }
                    // One session at a time: the watch cannot record a run inside a workout.
                    .disabled(workout.authorized == false || workout.busy)
                }
            } header: {
                Text("Record")
            } footer: {
                Text("Saves to Apple Health. Gruntz on your phone picks it up from there.")
            }
        }
        .navigationTitle("Gruntz")
    }
}

/// What the workout just finished from the wrist earned.
private struct ResultRow: View {
    let result: WorkoutResult

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Label("Workout saved", systemImage: "checkmark.circle.fill")
                .font(.headline)
                .foregroundStyle(.green)
            Text(summary).font(.caption).foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }

    private var summary: String {
        var parts = ["\(Int(result.sets)) sets", "\(Int(result.minutes)) min"]
        if result.xp > 0 { parts.append("+\(Int(result.xp)) XP") }
        if result.personalRecords > 0 { parts.append("\(Int(result.personalRecords)) PR") }
        return parts.joined(separator: " · ")
    }
}
