import SwiftUI

@main
struct GruntzWatchApp: App {
    @StateObject private var workout = WorkoutManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(workout)
                .onAppear { workout.requestAuthorization() }
        }
    }
}
