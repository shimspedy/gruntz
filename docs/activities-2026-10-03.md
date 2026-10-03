# Outdoor activities — October 3, 2026

Runs, rucks and hikes now have a single durable recorder, optional background GPS, saved route history, native maps and shareable PNG cards. The recorder belongs to the app lifecycle, so leaving the recording screen does not end an activity. Pause and signal gaps start separate route segments and do not add unrecorded distance. UI-first interrupted launches recover the last durable draft paused; headless task recovery can continue while excluding stale gaps. Force-closing the app can interrupt GPS recording.

History saves finish before the draft is discarded. A stable activity ID prevents duplicate history, mileage or personal-record credit after retry/recovery. Android stores readiness/history in two checksummed document-file revisions, migrating the old SQLite row only after verifying the new copy; backup, restore and reset use the same storage adapter.

Native MapLibre uses OpenFreeMap's dark map style, inspired by mapcn's MapLibre approach. Sharing offers Field and Signal themes, renders a privacy-trimmed map or offline route art, and exports a 1080-pixel PNG through the device share sheet. The preview hides all route visits within 200 m of the start and finish by default; displaying the full route requires confirmation. Short routes can be entirely hidden.

Precise routes stay on the device by default. Cloud backup excludes route coordinates unless the athlete explicitly enables route backup. Older schema-1 clients cannot restore the new schema-2 backup. The updated live privacy policy and App Store location disclosure are published with this native release.

## Validation

- `npm run check`: TypeScript, 123 tests and the website build pass.
- Expo Doctor: 21/21 checks pass.
- iOS Release simulator build succeeds with background location, TaskManager, MapLibre and image export modules.
- Synthetic GPS route renders on the native map. Pause/resume excludes the paused interval and creates a new segment.
- Locked-screen recording continues saving timestamped GPS fixes; unlocking restores current elapsed time and distance.
- Native permission testing found an Expo iOS initial Always-upgrade timing race. The adapter now waits for foreground/sheet dismissal and confirms native authorization without another prompt; cancellation and denial waits are bounded and covered by tests.
- Fresh iOS 26.5 installation grants foreground, Always location and motion access on the first start; the recorder reports background recording enabled without a second attempt.
- A locked-screen synthetic run keeps persisting current GPS fixes. Native interruption/relaunch retains the activity ID; pausing, terminating and reopening preserves the paused time and distance.
- Finishing that recovered run saves exactly one history item with 91 route points, removes the durable active draft and leaves GPS-route backup disabled. Profile → Activity history displays the saved route and matching totals; the Hike filter opens the correct activity mode.
- Field and Signal cards both export native PNG files at 1080 × 2127 pixels with the privacy-trimmed map and complete stats/footer. The device share sheet opens; dismissing it removes the temporary export. No share destination was selected.
- Full-route selection displays the privacy confirmation, cancel keeps endpoints hidden, and disabling the route produces a stats-only card.
- A second native Hike saves correctly into the Hike filter; All shows exactly two distinct activities with combined distance/time. Both finishes remove the active draft. Synthetic GPS is disabled after QA.

No physical outdoor GPS, battery drain or Android foreground-service runtime test has been performed. Automated Android tests cover histories above SQLite's per-row limit, migration failures, torn writes, backup restoration/rollback and reset.

## Release

- Production [EAS build 1.9 (38)](https://expo.dev/accounts/blaqdu/projects/gruntz/builds/3a2e0631-49a8-4ea2-a962-fd199e37fb59) succeeded from feature commit `bd3efaf085f339f08763807469d3a25c8831a02d`, including the prior billing, workout and data audit fixes. This is a new native binary with background-location, map and image-export modules.
- [EAS upload](https://expo.dev/accounts/blaqdu/projects/gruntz/submissions/8f7d02e8-c7b9-4a3d-b9da-0ad103425f68) succeeded. Apple build ID `ef70c734-5173-434e-a560-0e618a80300c` processed as `VALID` / `APP_STORE_ELIGIBLE` with export compliance declared.
- Native QA finished before the earlier build-37 review was canceled. Its review submission reached `COMPLETE`, then the existing version 1.9 was attached to build 38 and release/reviewer notes updated. No unrelated submission was canceled.
- **Version 1.9 (38) was submitted October 3, 2026 at 12:28:04 UTC (8:28:04 a.m. America/Detroit).** Both the app version and new review submission were read back as **WAITING_FOR_REVIEW**, with build 38 attached.
- App Store version ID: `c12d2e35-f2ef-4e7d-808f-e3256596bb53`. New review submission ID: `1bc8296c-be75-4ea1-8862-f6436e1768b9`. Existing `AFTER_APPROVAL` release mode, reviewer contact/demo-account settings and all 14 processed screenshots were preserved.
- The live [privacy policy](https://gruntzfit.com/privacy-policy) includes active background GPS, local history, separate route-backup consent, map requests and endpoint hiding. Production Netlify deploy `6ac0f152420f2b3ca9129ed5` is live. App Store privacy shows Precise Location linked to the user for App Functionality, with no tracking.
- Review creation used a durable pre-request journal and exact-draft reconciliation to prevent duplicate review creation after an unknown response; seven mocked replay regressions and an independent helper review passed.
