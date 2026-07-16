# Gruntz product audit — 2026-07-15

## Outcome

The app has a coherent tactical identity, adaptive programming, offline-first local state, accessible motion handling, exercise demonstrations, run tracking, progression, and a complete subscription/legal surface. The highest-impact gap was not missing content; it was that the home screen did not explain how the plan maps to the service member's real constraints.

## Implemented in this pass

- Reorganized primary navigation around the operator's real workflow: Today, Plan, Test, Progress, and Profile.
- Added branch, service status, occupational demand, primary fitness test, and test-date onboarding inputs.
- Added a personalized Field Brief and transparent "Why this order" explanation tied to readiness, goals, time, and available equipment.
- Added a daily readiness check-in covering sleep, soreness, energy, stress, and hydration, with safe intensity guidance.
- Added a weekly Plan screen with training intent, capability rotation, readiness adjustments, and direct training-card access.
- Added a Test Center for Army, Marine Corps, Navy, Air Force, Coast Guard, and general-readiness profiles, with event scores, targets, test countdown, preparation benchmarks, and official-source links.
- Promoted rucking to a first-class tracked activity with pack weight, terrain, elevation, pace, precision/battery GPS modes, and saved session history.
- Added Field Mode preferences for high-signal presentation, audio cues, screen-awake intent, and battery-aware GPS sampling.
- Added privacy-conscious Leader Tools with an explicit local-only team boundary and no default roster surveillance.
- Added recent run/ruck sessions to Progress and retained offline-first persistence for readiness and test data.
- Restored reproducible root and website dependency installs.
- Added `typecheck`, `doctor`, and combined `check` commands.
- Applied all dependency security updates available without a breaking Expo SDK upgrade.
- Verified TypeScript, the Astro production build, Expo configuration, and a production iOS bundle.

## Audit coverage

- Product positioning and military relevance
- Onboarding and adaptive program selection
- Home, mission, run, progress, profile, settings, and paywall flows
- Accessibility, reduced motion, contrast, touch targets, and state recovery
- Local persistence and subscription entitlement handling
- Type safety, Expo compatibility, dependency security, website production build, and iOS bundling

## Safety and scope boundaries

- Readiness and test estimates are training guidance, not medical advice or official service scores.
- Each service changes standards over time; Test Center links point users to the official source and clearly labels preparation benchmarks as non-official.
- Weather and environmental conditions are not guessed without a verified data source. The tracker instead requires a visible route, water, weather, and local-safety check before step-off.
- Leader Tools remain local and privacy-forward until a secure organization-approved identity, consent, and data-retention model exists.

## Residual platform notes

- `npm audit` reports moderate transitive advisories inside Expo's build toolchain. The only automated remediation offered replaces Expo 54 with Expo 57, so it was intentionally not forced into this release.
- Exercise videos are intentionally bundled for field/offline availability. This increases install size but avoids connectivity becoming a workout blocker.
