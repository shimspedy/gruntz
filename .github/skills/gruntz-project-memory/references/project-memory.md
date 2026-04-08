# Gruntz Project Memory

## Product Direction
- Gruntz is a mission-driven tactical training app.
- The core loop is: choose a program, open today’s mission, complete the work, earn XP, keep the streak, progress through the cycle.
- Avoid broad wellness, vanity tracking, and feature noise unless it directly improves program adherence or training quality.

## UX Rules
- Keep the app feeling game-like, sharp, and tactical rather than casual fitness.
- The mission flow is the product. Supporting screens should reinforce it, not compete with it.
- Avoid blank-screen `return null` behavior for broken route params or missing content. Prefer explicit fallback states with a recovery action.
- For exercises with sets and rest, behave like a gym app:
  - log one set at a time
  - rest between sets
  - keep the exercise active until all required sets are logged
  - only mark the exercise complete after the final required set

## Current Workout Logging Rules
- Partial set progress should display as in-progress, not complete.
- Blank sets must not be savable.
- Rest overlays should mask the screen and return the user to the same exercise if more sets remain.
- Resetting a completed exercise should clear all logged sets for that exercise instance.
- Keep row-level logging actions and info buttons as separate touch targets. Do not nest a secondary action inside the main exercise press target.

## Data And State Rules
- Use local date keys for streak and mission-completion logic. Do not use UTC date splitting for local mission state.
- Today’s mission completion is derived from persisted claimed mission keys in the user store.
- Repeated exercises inside a workout need unique instance keys; never use raw exercise IDs as React keys in mission lists.
- If no program is selected, do not synthesize a default mission. The app should stay in an explicit "choose a program" state.
- User settings that affect UX, permissions, or units should be stored in the persisted profile, not local screen state.

## Notification Rules
- Workout-progress notifications must be cleared when mission tracking stops, the screen unmounts, or the mission completes.
- Notification calls should be guarded so platform failures do not crash or poison the UX.
- Achievement unlocks should generate user-facing notifications when they happen.

## Run Tracking Rules
- GPS, pedometer, timer, and barometer listeners must clean up correctly on pause, stop, resume, and restart.
- Paused runs must not continue accumulating steps or altitude in the background.
- Resuming a run should preserve prior elevation totals instead of resetting them.
- If location permission is denied, the app should surface that to the user instead of failing silently.
- Native sensor/location watcher setup should fail closed: return a safe false/error state, clean up listeners, and keep the app usable instead of throwing.
- Pace formatting should normalize rounded seconds so the UI never renders impossible times like `12:60`.

## Monetization Rules
- The app uses a 15-day app-level free access window for new users.
- Paid access target is `$4.99/month`.
- RevenueCat identifiers expected by the app:
  - entitlement: `pro`
  - offering: `default`
  - App Store product: `monthly`
- Keep secrets out of repo files; `.env` stays local.

## Release And Platform Notes
- RevenueCat and App Store Connect configuration can fail independently; verify dashboard mapping before assuming app-side purchase bugs.
- Expo/React Native iOS builds commonly show Hermes script warnings; these are noise unless accompanied by real build errors.
- RevenueCat helper methods should fail to an unavailable/fallback path if native configure or URL-opening calls reject.
- Haptic calls should fail closed too. Never allow `expo-haptics` promise rejections to show up as unhandled runtime noise.
- Invalid detail screens should always offer a recovery action instead of plain dead-end text.
- Every achievement condition type present in `src/data/achievements.ts` must be implemented in `useUserStore.checkAchievements`, and condition ids must match real exercise ids.

## Agent Working Rules
- Before non-trivial work, read this file.
- After non-trivial work, update this file if the task changed durable behavior, product direction, or recurring failure knowledge.
- Keep this file short, current, and edited in place. Do not turn it into a changelog.
