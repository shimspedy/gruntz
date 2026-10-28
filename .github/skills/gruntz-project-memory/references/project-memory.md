# Gruntz Project Memory

## Product Direction
- Gruntz is a mission-driven tactical training app.
- The core loop is: choose a program, open today’s mission, complete the work, earn XP, keep the streak, progress through the cycle.
- Avoid broad wellness, vanity tracking, and feature noise unless it directly improves program adherence or training quality.

## UX Rules
- Keep the app feeling game-like, sharp, and tactical rather than casual fitness.
- The mission flow is the product. Supporting screens should reinforce it, not compete with it.
- Onboarding practice is isolated from workout history, streaks, achievements and XP; entering core training does not require an onboarding purchase.
- Military setup recommends the matching built-in program first. Base Camp's displayed frequency must use its adaptive schedule, including the onboarding draft profile.
- Avoid blank-screen `return null` behavior for broken route params or missing content. Prefer explicit fallback states with a recovery action.
- For tab-root screens, bottom scroll padding must account for the real tab bar height and safe-area inset. Do not rely on small fixed padding values under an absolute tab bar.
- For exercises with sets and rest, behave like a gym app:
  - log one set at a time
  - rest between sets
  - keep the exercise active until all required sets are logged
  - only mark the exercise complete after the final required set

## Current Workout Logging Rules
- Partial set progress should display as in-progress, not complete.
- Blank sets must not be savable.
- Improvement comparisons and PR XP require verified matching performed-movement metadata; shared media/history keys and unverified legacy records cannot establish equivalence.
- Readiness choices apply only to a newly started session. Shorter/recovery sessions must describe the actual prescription and completion credit honestly.
- Partial working sets belong in history and mission rep totals; only complete working-set targets mark a plan day done.
- Prior weights must be converted from their recorded lb/kg unit before prefilling a new workout. Do not relabel already logged sets when swapping exercises.
- Rest overlays should mask the screen and return the user to the same exercise if more sets remain.
- Resetting a completed exercise should clear all logged sets for that exercise instance.
- Keep row-level logging actions and info buttons as separate touch targets. Do not nest a secondary action inside the main exercise press target.

## Data And State Rules
- Use local date keys for streak and mission-completion logic. Do not use UTC date splitting for local mission state.
- Today’s mission completion is derived from persisted claimed mission keys in the user store.
- Repeated exercises inside a workout need unique instance keys; never use raw exercise IDs as React keys in mission lists.
- If no program is selected, do not synthesize a default mission. The app should stay in an explicit "choose a program" state.
- User settings that affect UX, permissions, or units should be stored in the persisted profile, not local screen state.
- Never write persisted defaults after a hydration read/parse error. The boot gate must wait for training stores before daily rollover or edits.
- Backup restore must update live stores along with disk and cancel pending session writes. A new device must not overwrite an existing cloud snapshot before explicit restore/replacement.
- Pin cloud requests to the captured account token and invalidate old backup generations on session-change intent. Only an already-started local restore commit delays an account change; cloud requests do not. Serialize SDK auth mutations separately: `verifyOtp` persists a valid session before its promise returns. Conditional deletion cleanup must preserve newer login intents.
- Health sync waits for training-store hydration and invalidates old connection generations. Reset/restore suspend new syncs and drain started local imports with their matching credit, without waiting for native reads.
- Device-only reset preserves the original subscription/trial and the persisted backup pause marker, clears live training stores, and cancels session write debounce.
- Streak decay must be applied on app hydration and foreground, not only when a mission completes.

## Notification Rules
- Workout-progress notifications must be cleared when mission tracking stops, the screen unmounts, or the mission completes.
- Notification calls should be guarded so platform failures do not crash or poison the UX.
- Achievement unlocks should generate user-facing notifications when they happen.

## Run Tracking Rules
- GPS, pedometer, timer, and barometer listeners must clean up correctly on pause, stop, resume, and restart.
- Paused runs must not continue accumulating steps or altitude in the background.
- GPS recording has one durable singleton owner with a global Expo TaskManager task. `@gruntz_active_activity` stores the active/finished draft; UI unmount does not stop recording. Native setup callbacks must be invalidated on pause/stop/reset.
- Background recording requires iOS Always location or Android background permission and its foreground service. Foreground-only fallback pauses when backgrounded. A force-quit can interrupt GPS; reopen recovers to the last saved update and pauses, preserving gaps rather than inventing distance.
- Run, ruck and hike history retains every saved activity; routes are bounded to 6,000 points with segment boundaries. Stable IDs make save/credit replay safe; both history and progress writes must be flushed before clearing a finished draft.
- Android background step totals are partial; iOS queries historical active intervals. Do not present partial counts as complete.
- Resuming a run should preserve prior elevation totals instead of resetting them.
- If location permission is denied, the app should surface that to the user instead of failing silently.
- Native sensor/location watcher setup should fail closed: return a safe false/error state, clean up listeners, and keep the app usable instead of throwing.
- Saved-activity Retry/Discard controls require the tracker's explicit blocked-draft-read state. Permission denial or ordinary GPS failure must not claim an unsaved recording exists; retain real paused/ended recordings and clear only the recovered error's typed origin.
- Pace formatting should normalize rounded seconds so the UI never renders impossible times like `12:60`.
- Starting a new run must immediately clear stale distance, time, step, and route UI before the first fresh sensor update arrives.
- Only show live barometer altitude UI while the barometer hook is active; do not render stale altitude after stop/pause/failure.

## Activity Maps And Sharing
- Use native MapLibre 11 with OpenFreeMap styles. Mapcn is a web/Tailwind component and is the design reference, not a native dependency. Keep map-data attribution in exported map images.
- Share cards preview Field/Signal themes and export PNG through view-shot and the device share sheet. Convert native map/Skia artwork to a loaded React Native Image before capturing to avoid blank GPU surfaces.
- Hide every point and crossing line within 200 metres of route start/end by default, including loop returns. Snapshot styles/bounds receive only the redacted route; never replace a paused gap with a connecting line.
- Precise routes remain local unless the athlete separately opts into including GPS routes in cloud backup. Backups keep activity stats by default and validate route payloads before restore. Reset/restore await native recorder cancellation.

## Monetization Rules
- The app uses a 15-day app-level free access window for new users.
- Paid access target is `$4.99/month`.
- RevenueCat identifiers expected by the app:
  - entitlement: `pro`
  - offering: `default`
  - App Store product: `monthly`
- Apple-side iOS subscription setup has already been handled by the user. When iOS billing issues come up, first verify app-side env values and RevenueCat product/offering mapping before re-explaining App Store Connect key setup.
- Keep secrets out of repo files; `.env` stays local.
- Development billing bypass is opt-in via `EXPO_PUBLIC_DEV_UNLOCK=true` and impossible in release builds. Verify store entitlement before calling a purchase successful; pending approval and unknown/offline entitlement are distinct states.
- Order RevenueCat responses using native `requestDateMillis` when available plus operation order for ties/missing dates; formatted `requestDate` can lose subsecond precision. An older startup fetch must not undo a newer purchase/listener result.
- Monthly and annual Pro have the same App Store subscription service level (1); changing billing duration must not imply a different feature tier.

## Release And Platform Notes
- Production iOS builds use the pinned `macos-tahoe-26.6-xcode-27.1` EAS image with the existing custom scene-lifecycle plugin. Do not layer Expo's automatic scene migration over that custom AppDelegate/manifest.
- Before a new upload, read the live App Store version and highest build number. EAS remote versioning is authoritative; local/manual uploads can leave its counter behind. Preserve the existing store release mode, reviewer contact, privacy declarations and screenshots.
- Non-interactive API-key signing also needs `EXPO_APPLE_TEAM_ID` and `EXPO_APPLE_TEAM_TYPE=INDIVIDUAL` alongside the `EXPO_ASC_*` key settings. Phone and Watch share the distribution certificate but require separate App Store provisioning profiles; configure both before queuing a build, because a credential failure can still consume its remote build number.
- EAS Submit uploads a binary; App Review submission is a separate action. `scripts/app-store-review.cjs` verifies the exact app/version/processed build, prepares an isolated draft, and submits it separately. Supply atomic durable journal storage; reconcile unknown mutation outcomes instead of replaying requests. Keep journal files and credentials outside Git.
- Read age ratings through the editable App Info's `ageRatingDeclaration` relationship and retain Apple's `meta.associatedErrors` when diagnosing review validation. Newly required fields can be null even when the previous release was approved. Gruntz has member-only team chat and public community listings (messaging/UGC), but no social feed or content amplification; declare the implemented capabilities rather than blindly copying old answers.
- This Mac also has Xcode 27.1 under `~/Applications/BootzReleaseTools/Xcode-27.1.0.app`. Select it per command with `DEVELOPER_DIR`; do not switch global Xcode or restart shared Simulator services while other app work is active. For Duo QA, verify actual hinge position and fresh app viewport/screenshot after folding; setting a display's geometry alone does not prove the app resized.
- Coordinate one active simulator guest total across projects on this 18 GB Mac; multiple guests caused severe paging and service timeouts. Preserve existing device containers. iOS 27.1's current special runtime supports Duo; run iPhone 18 Pro on iOS 27.0 with the SDK 27.1-built app. The phone is portrait locked, so rotation dispatch alone cannot establish a short-window layout pass.
- For headed simulator control, filter Device Hub's sidebar by the exact QA device name before starting it. Rebind CUA after display-mode changes. Activate resize mode after the final app launch and verify the active app's dimensions; stopping/relaunching can return it to the physical display even when a resizable screen has custom geometry.
- Expo tooling security uses scoped plist/UUID/Zod overrides, a guarded first-party Zod bounds patch, and an explicitly identified local Forge RSA backport. Include `vendor/node-forge` in build archives and run first-party postinstall even when dependency scripts are skipped. Keep the fork's provenance/license and installed-consumer regressions; replace it with a verified upstream fixed release when available.
- Android activity history uses two checksummed document-file revisions to avoid AsyncStorage SQLite row and database limits. Readiness backup, restore and reset I/O must use `readinessStorage`; await `clearReadinessPersistence()` for deletion because Zustand's `persist.clearStorage()` returns void.
- RevenueCat and App Store Connect configuration can fail independently; verify dashboard mapping before assuming app-side purchase bugs.
- Account deletion uses the verified caller identity, hands over every team, and removes only that user's private team avatar before Auth deletion. The live `delete-account` function includes this cleanup for older clients too; do not rely on a client-only loop or accept a target user ID from the request body.
- Expo/React Native iOS builds commonly show Hermes script warnings; these are noise unless accompanied by real build errors.
- RevenueCat helper methods should fail to an unavailable/fallback path if native configure or URL-opening calls reject.
- Haptic calls should fail closed too. Never allow `expo-haptics` promise rejections to show up as unhandled runtime noise.
- Custom tab-bar interactions should use proper `Pressable`/button semantics, not raw touch-end handlers on plain views, especially for Android reliability and accessibility.
- Invalid detail screens should always offer a recovery action instead of plain dead-end text.
- Bound grids from current measured content width, including text shrink constraints. Height-capped action menus must scroll; test their last action in a short window.
- Navigation from a shared Sheet waits for `onDismissed`. Reopening an unsaved draft must toggle presentation after dismissal. Public deep links seed `Tabs` beneath the destination so Back can return to Train.
- Every achievement condition type present in `src/data/achievements.ts` must be implemented in `useUserStore.checkAchievements`, and condition ids must match real exercise ids.

## Agent Working Rules
- Before non-trivial work, read this file.
- After non-trivial work, update this file if the task changed durable behavior, product direction, or recurring failure knowledge.
- Keep this file short, current, and edited in place. Do not turn it into a changelog.
