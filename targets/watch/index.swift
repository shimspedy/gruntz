import SwiftUI

@main
struct GruntzWatchApp: App {
    @StateObject private var workout = WorkoutManager()
    @StateObject private var link = PhoneLink()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(workout)
                .environmentObject(link)
                .onAppear { workout.requestAuthorization() }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active { link.refresh() }
                }
        }
    }
}
