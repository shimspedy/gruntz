import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

private let accent = Color(red: 45 / 255, green: 140 / 255, blue: 1)
private let surface = Color(red: 0.11, green: 0.11, blue: 0.12)

struct WorkoutLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
      LockScreenView(context: context)
        .activityBackgroundTint(Color.black.opacity(0.85))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 2) {
            Text(context.state.exerciseName).font(.headline).lineLimit(1)
            Text(context.state.setLabel).font(.caption).foregroundStyle(.secondary).lineLimit(1)
          }
          .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          WorkoutClock(context: context).font(.title3.monospacedDigit()).foregroundStyle(accent)
            .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
              Text(context.state.detail).font(.subheadline).lineLimit(1)
              Text("\(context.state.exercisesDone)/\(context.state.exercisesTotal) exercises · \(context.attributes.startedAt, style: .timer)")
                .font(.caption.monospacedDigit()).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer(minLength: 0)
            LogSetButton(context: context)
          }
          .padding(.horizontal, 4)
        }
      } compactLeading: {
        Image(systemName: "figure.strengthtraining.traditional").foregroundStyle(accent)
      } compactTrailing: {
        WorkoutClock(context: context).font(.caption2.monospacedDigit()).frame(maxWidth: 52)
      } minimal: {
        Image(systemName: context.state.restEndsAt != nil ? "timer" : "figure.strengthtraining.traditional").foregroundStyle(accent)
      }
      .keylineTint(accent)
      .widgetURL(URL(string: "gruntz://train"))
    }
  }
}

/// Rest countdown while resting, otherwise how long the workout has run.
private struct WorkoutClock: View {
  let context: ActivityViewContext<WorkoutActivityAttributes>
  var body: some View {
    if let rest = context.state.restEndsAt, rest > Date() {
      Text(timerInterval: Date()...rest, countsDown: true).multilineTextAlignment(.trailing)
    } else {
      Text(context.attributes.startedAt, style: .timer).multilineTextAlignment(.trailing)
    }
  }
}

private struct LogSetButton: View {
  let context: ActivityViewContext<WorkoutActivityAttributes>
  var body: some View {
    if !context.state.upcoming.isEmpty && !context.isStale {
      Button(intent: LogNextSetIntent()) {
        Label("Log set", systemImage: "checkmark").font(.subheadline.weight(.semibold)).padding(.horizontal, 4)
      }
      .buttonStyle(.borderedProminent)
      .tint(accent)
    } else {
      Link(destination: URL(string: "gruntz://train")!) {
        Text(context.isStale ? "Finish" : "Open").font(.subheadline.weight(.semibold))
      }
    }
  }
}

private struct LockScreenView: View {
  let context: ActivityViewContext<WorkoutActivityAttributes>
  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack {
        Text(context.attributes.title.uppercased()).font(.caption2.weight(.semibold)).foregroundStyle(accent).lineLimit(1)
        Spacer()
        Text(context.attributes.startedAt, style: .timer).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
      }
      if context.isStale {
        Text("Still training?").font(.headline)
        Text("No sets for a while. Open Gruntz to finish or discard, so the extra time doesn't count.")
          .font(.subheadline).foregroundStyle(.secondary)
      } else {
        HStack(alignment: .center, spacing: 12) {
          VStack(alignment: .leading, spacing: 3) {
            Text(context.state.exerciseName).font(.headline).lineLimit(1)
            Text([context.state.setLabel, context.state.detail].filter { !$0.isEmpty }.joined(separator: " · "))
              .font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
            if let rest = context.state.restEndsAt, rest > Date() {
              HStack(spacing: 4) {
                Image(systemName: "timer")
                Text("Rest")
                Text(timerInterval: Date()...rest, countsDown: true).monospacedDigit()
              }
              .font(.caption).foregroundStyle(accent)
            } else {
              Text("\(context.state.exercisesDone) of \(context.state.exercisesTotal) exercises done")
                .font(.caption).foregroundStyle(.secondary)
            }
          }
          Spacer(minLength: 0)
          LogSetButton(context: context)
        }
      }
    }
    .padding(16)
  }
}
