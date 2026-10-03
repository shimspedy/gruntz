# Outdoor activities — October 3, 2026

Runs, rucks and hikes now have a single durable recorder, optional background GPS, saved route history, native maps and shareable PNG cards. The recorder belongs to the app lifecycle, so leaving the recording screen does not end an activity. Pause and signal gaps start separate route segments and do not add unrecorded distance. UI-first interrupted launches recover the last durable draft paused; headless task recovery can continue while excluding stale gaps. Force-closing the app can interrupt GPS recording.

History saves finish before the draft is discarded. A stable activity ID prevents duplicate history, mileage or personal-record credit after retry/recovery. Android stores readiness/history in two checksummed document-file revisions, migrating the old SQLite row only after verifying the new copy; backup, restore and reset use the same storage adapter.

Native MapLibre uses OpenFreeMap's dark map style, inspired by mapcn's MapLibre approach. Sharing offers Field and Signal themes, renders a privacy-trimmed map or offline route art, and exports a 1080-pixel PNG through the device share sheet. The preview hides all route visits within 200 m of the start and finish by default; displaying the full route requires confirmation. Short routes can be entirely hidden.

Precise routes stay on the device by default. Cloud backup excludes route coordinates unless the athlete explicitly enables route backup. Older schema-1 clients cannot restore the new schema-2 backup. The updated privacy policy and App Store location disclosure must be published with this native release.

## Validation

- `npm run check`: TypeScript, 123 tests and the website build pass.
- Expo Doctor: 21/21 checks pass.
- iOS Release simulator build succeeds with background location, TaskManager, MapLibre and image export modules.
- Synthetic GPS route renders on the native map. Pause/resume excludes the paused interval and creates a new segment.
- Locked-screen recording continues saving timestamped GPS fixes; unlocking restores current elapsed time and distance.
- Native permission testing found an Expo iOS initial Always-upgrade timing race. The adapter now waits for foreground/sheet dismissal and confirms native authorization without another prompt; cancellation and denial waits are bounded and covered by tests.
- Native history recovery and PNG export checks are completed before replacement review submission and recorded below.

No physical outdoor GPS, battery drain or Android foreground-service runtime test has been performed. Automated Android tests cover histories above SQLite's per-row limit, migration failures, torn writes, backup restoration/rollback and reset.

## Release

The earlier audit build 1.9 (37) remains Waiting for Review while the replacement is prepared. This feature requires a new native build; it is not included in build 37 and cannot be delivered by a JavaScript-only update. Replace that pending review only after the new binary is uploaded, valid and verified. Preserve existing screenshots and reviewer contact details; update release/review notes for these features.
