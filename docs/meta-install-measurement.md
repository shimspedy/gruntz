# Meta install measurement

This change prepares an iOS app update. It does not release the iOS app, deploy the privacy policy,
or activate/change an ad campaign. A new App Store binary must be released before ordinary installs
can produce these events. Registering the Meta app alone does not add tracking to existing builds.

## Current verification status — November 2, 2026

- TestFlight **1.16.1 (59)** is processed and assigned to the existing internal **gruntz** group.
  The owner reports normal launch and an enabled Ad measurement control. A fresh paired-phone
  inventory independently confirms build 59; its subsequent Gruntz-only crash listing contains
  no files newer than the known build 58 crash. The 20-gate signed-artifact check passed.
- The owner also verified opt-out persistence: turn measurement off, fully close/reopen, confirm
  it remains off and training works, then re-enable measurement.
- Meta's **App Ads Helper confirms a received iOS install** for app `1742670326812925` (displayed
  as 18 minutes ago when checked), with green iOS CPC and optimized-CPM checks. This is install
  receipt evidence; it does not establish modern-iOS AEM eligibility or campaign delivery.
  The Events Manager analytics/test views still lagged behind that helper result. A genuine
  owner-triggered close/reopen produced no sanitized SDK warning/error matches, which alone
  would not establish delivery. Read-only SDK requests
  confirm the client token is accepted, event collection is enabled, the event kill switch is
  false, and authorized activity routing uses the already-declared `ep1.facebook.com`.
- The source audit passed. Two isolated Duo simulators failed runtime migration before any
  app launch, including a fresh device; fold/resize runtime checks have not passed.
- The new install campaign is an unpublished draft. Production privacy policy, App Store
  privacy answers, App Review submission and public app release remain pending.

## Scope and consent

The iOS-only local Expo module uses Meta `FBSDKCoreKit` **19.0.0**, with matching
`FBSDKCoreKit_Basics` and `FBAEMKit` dependencies. It does not include Login or Share kits.
This avoids depending on a React Native wrapper's compatibility with Expo 57 / React Native 0.86.

After onboarding and normal navigation are ready, Gruntz presents Apple's optional ATT prompt
once. Training access is unaffected by the choice. Native code initializes Meta only when both
ATT authorization and Gruntz's separately persisted opt-in are present. The SDK is not initialized
by an AppDelegate hook. Linking CoreKit may create a local anonymous ID before consent, but does
not send it. Android, web, Expo Go and builds without configuration do not prompt or send events.

Manual native `AppEvents.shared.activateApp()` publishes an install once and app-open/session
information, including prior-session deactivation/duration metadata. No profile, email, workout,
health, fitness-test, location, purchase or subscription payload is supplied. IDFA collection,
automatic app/purchase events, screen-title/link metadata and product-improvement collection are
disabled in Info.plist and native settings. Normal conversion/ad measurement is enabled only
after both consent gates pass; the SDK's event-data-usage restriction is set on local revocation.
Event flushing is explicit and consent-gated, rather than timer/background driven.

Profile → Settings → Ad measurement clears Gruntz's native opt-in synchronously. Deleting local
data does the same before asynchronous erase work, and does not re-prompt afterwards. Revision
checks prevent a pending ATT result from undoing an opt-out. Native guards re-check ATT, local
consent and foreground state before every manual activation and flush.

Meta has no public SDK shutdown API. After consent has initialized the SDK, configuration/lifecycle
requests already started can finish, and internal configuration requests may continue until exit.
Opt-out stops our future manual measurement events immediately; full SDK disable takes effect
on the next app launch. It cannot retract data already received by Meta. Do not describe this as
instant cancellation of every SDK network request.

## Build configuration

Public app identifiers:

- Meta app: `1742670326812925`
- iOS bundle: `com.gruntz.fitness`
- App Store: `6761699137`

`plugins/withMetaInstallTracking.js` reads **GRUNTZ_META_CLIENT_TOKEN** from the build environment.
Only a Meta **client token** belongs here, never an app secret or user access token. It is embedded
in the native Info.plist because CoreKit requires it, and is never copied to Expo `extra` or logs.
Do not print `expo config`/Info.plist output in shared logs: it includes the native token.

The client token is already provisioned as an encrypted secret in this project's EAS **production**
environment and in an ignored, restricted local `.env.local`. Preview/development EAS environments
have not been provisioned. Missing configuration disables measurement and its prompt in development;
it fails `production` and `release-simulator` builds. Keep `.env.local` out of git and EAS uploads.

## Verification and release prerequisites

1. Run the focused consent/configuration tests, typecheck, lint and existing app tests. Rebuild the
   native app; this is not an over-the-air JavaScript-only change.
2. Confirm generated Info.plist has the app ID and the false collection flags without logging its
   client token. Confirm the app's privacy manifest declares tracking domains and the built app
   includes **both CoreKit and FBAEMKit privacy manifest resource bundles**.
3. On a real iPhone with a fresh permission state: deny ATT and verify no Meta initialization or
   events; separately grant ATT and verify one install plus activation in Meta Events Manager.
   Test background/resume, local opt-out, ATT revocation, local data erase, and a pending-prompt
   erase race. Do not fake installs or send test events from another user's device.
4. Update App Store Connect privacy answers for the new SDK's actual identifiers, product interaction,
   device/app/session metadata, advertising measurement and tracking practices. Review the built
   SDK privacy report. The bundled SDK manifest declares tracking and must not be stripped or
   changed to claim no tracking. Existing health/location disclosures must remain accurate; those
   values are not supplied to this integration.
5. Publish the updated privacy policy and set an accurate effective date before distributing the
   tracking-enabled app. The policy source is updated here; it has not been deployed by this task.
6. Build the release with **Xcode 27.1 / iOS 27.1 SDK or newer**. The existing EAS production profile
   pins `macos-tahoe-26.6-xcode-27.1`. That image is available and completed the simulator verification
   build below. The default local Xcode is 27.0; a separate Xcode 27.1 install is available at
   `~/Applications/BootzReleaseTools/Xcode-27.1.0.app`. Select that installation explicitly for
   local release work. Before
   release run `~/.claude/skills/iphone-duo-ready/scripts/audit.sh .` (exit 0)
   and test resized/folded/unfolded layouts per AGENTS.md.
7. Submit and release the new binary. Verify received Gruntz events and Meta app eligibility before
   changing or enabling the app-promotion campaign. Keep the authorized total ad budget unchanged.

Device event verification, privacy-label submission, policy deployment, app release, and ad activation
are still pending until explicitly completed and verified. Unit tests alone do not establish Meta AEM
eligibility or prove install attribution on a real device.

## Prepared Meta account state

The Gruntz Meta registration is published under business `2203594243230044`, connected to ad account
`1947278579469729`, and configured for the iOS bundle and App Store IDs above. Meta currently disables
it in the iOS 14+ campaign selector because conversion data is missing or partial; the selector
specifically recommends setting up the Facebook SDK for iOS. Registration alone did not unlock it.

The original ad `120254722474450640` ("Comic - Air Force - Brief Then Lift") remains on its original
`gruntzfit.com` destination. Meta rejected a direct App Store URL in that published Traffic campaign;
the attempted edit was restored and its draft cleared by publishing the original settings again.

A separate, **off and unpublished** copy preserves the selected comic creative:

- Campaign `120254780382490640`: "Gruntz - App Installs - Air Force - Prepared", App promotion,
  campaign budget **$10/day**. This is a proposed replacement, not additional authorized spend.
- Ad set `120254780382500640`; ad `120254780382570640`.
- Gruntz app selection remains blocked by Meta eligibility. Changing the objective reset audience
  controls, so compare and restore the original military-base locations, age range and placements
  before any activation. The draft is **not ready to publish**.
- An earlier empty setup draft, campaign `120254780246540640`, is also off and not publish-ready.
  It is not the prepared creative copy above.

No new ad was activated, and the existing campaign's spending settings were not changed.

## Verification record

- Full repository checks: TypeScript passed, ESLint had no errors (existing warnings remain),
  **427 tests passed**, and the website production build passed.
- Rechecked the final consent/lifecycle/reset cases: **27 tests passed**; final TypeScript and
  updated privacy-page build also passed.
- Updated privacy policy is available **only as a preview**, at
  [the November 2 privacy preview](https://6ae8292201cb864da1a1718d--gruntz.netlify.app/privacy-policy/).
  Its header and effective date both show **November 2, 2026**. This is **not** a production
  policy publication at `gruntzfit.com`. The rendered Terms dates remain October 31, 2026.
- iPhone Duo source audit: **exit 0**. Real resize/fold tests remain part of release QA.
- Expo native config introspection confirmed the correct Meta app ID, credential presence, ATT
  purpose text and disabled automatic collection flags. Credential values were not logged.
- [Xcode 27.1 simulator verification build](https://expo.dev/accounts/blaqdu/projects/gruntz/builds/e4c6974d-325a-46b6-9f3e-881e2fa6096f):
  **FINISHED**. Native compilation passed on the pinned Xcode 27.1 image.
- Built-app inspection verified the Meta app ID, client-token presence, ATT purpose text,
  disabled automatic collection flags, app tracking-domain declarations, and bundled
  CoreKit, CoreKit Basics and FBAEMKit privacy manifests. Credential values were not logged.
- This simulator artifact is not an App Store distribution build or a release. Native compilation
  and configuration inspection do not verify actual ATT behavior, received Meta events, AEM
  eligibility, install attribution or ad activation; those checks remain pending.
- The artifact installed successfully in a fresh, isolated iPhone Duo / iOS 27.1 simulator.
  Device Hub accessibility calls repeatedly timed out, so runtime consent and fold/resize checks
  were not completed. The QA simulator was shut down; existing user devices and app data were
  not modified.
- App Store Connect: **1.16.0 (55)** remains ready for distribution. **1.16.1** is now an
  unsubmitted **Prepare for Submission** draft, with updated What's New and App Review notes
  explaining optional Meta measurement. The saved text was confirmed after a page reload.
  Release is set to manual. No build is attached yet.
- The first production attempt stopped before creating a build job because EAS lacked the
  Live Activity extension's signing configuration; that attempt consumed build counter **56**.
  EAS accepted existing, unexpired App Store profiles that match the existing EAS distribution
  certificate. The main profile was updated to the existing App Group-capable profile and the
  widget profile was assigned; Watch credentials were preserved. No new Apple certificate,
  capability or account access was created. Temporary signing copies were
  kept outside the repository in a private folder and removed after configuration.
- [Production build 1.16.1 (57)](https://expo.dev/accounts/blaqdu/projects/gruntz/builds/2c6b448f-1814-419e-8b98-2dd498c19808)
  **failed during signing**: Xcode-managed main/widget profiles are incompatible with EAS's
  manual-signing configuration. No IPA was produced. The existing manual main profile
  `FR83HMH278` was subsequently regenerated in Apple's portal using its existing certificate.
  A compatible manual widget profile, `UA86D4DBB6` ("Gruntz Live Activity App Store 2026-11-02"),
  was created for the existing widget App ID using that same certificate. Both are ready in
  Apple's portal. Chrome blocked the automated profile download; the existing Apple API
  credential also declined a read-only download request. No browser protection was bypassed,
  and the temporary API-key copy was removed. The user downloaded both profiles into the Mac's
  Downloads folder. Their decoded manual/App Store flags, App IDs, team, App Group, certificate
  serial and expiration were verified. Both exact files were synced to the existing EAS App Store
  build records; post-write checks confirmed Watch and certificate associations were preserved.
  No App Review submission or public release occurred; the later TestFlight upload is recorded below.

  Profile download pages:
  [main app](https://developer.apple.com/account/resources/profiles/review/FR83HMH278),
  [Live Activity](https://developer.apple.com/account/resources/profiles/review/UA86D4DBB6).
- [Production build 1.16.1 (58)](https://expo.dev/accounts/blaqdu/projects/gruntz/builds/fe335709-c9a3-4b59-b018-b7bf2c36448b)
  **FINISHED** using the corrected manual profiles and pinned Xcode 27.1 image. Native
  compilation, archive/export and all 14 signed-artifact checks passed: matching main/Watch/widget
  versions, signing, manual profiles, Meta configuration, privacy manifests and registered native
  module metadata. IPA SHA-256:
  `d9c340a05565110f728f31db946dd7b179337df3f11b76069b80016b0ff7a111`.
- Build **1.16.1 (58)** was uploaded to Apple and processed successfully. EAS submission
  `ce2c2f6a-bf89-40b3-97ef-54da2a3d6b27` reported an error only at a later group-lookup step
  for the earlier name `greuntz`; the binary did not need another upload. The live App Store
  Connect view now shows the actual internal group **gruntz** already linked to build 58,
  with **one invite**, in the existing group `b6a70fe8-88f6-4067-b8ca-20025eef0da4`.
  Apple build ID: `9d2860c1-d0cc-4bf6-83f2-5f0664b8eadc`. The owner has been asked to install
  this TestFlight build and report the optional tracking prompt and Settings control. Runtime
  consent and received Meta events are still unverified. No App Review submission/public release.
- **Build 58 is blocked: the owner reported an immediate launch crash.** Its physical-device
  crash report ends in `RCTInstance.handleBundleLoadingError`. Inspection of the exact signed
  IPA confirmed that `main.jsbundle` and all JavaScript app assets are absent, although the
  release `AppDelegate` requires that bundle. The earlier 14 checks covered signing and native
  configuration; they did not establish that the app could launch.
  The archive log identifies the cause: Sentry's build wrapper rejected missing organization
  configuration before running React Native's bundler, while `SENTRY_ALLOW_FAILURE=true`
  converted that failure into a successful exit. EAS's earlier temporary eager bundle was
  never embedded in the app. A replacement must explicitly run bundling without unconfigured
  source-map uploads, reject an absent release bundle, and pass runtime QA before public release.
  The production profile now uses `SENTRY_DISABLE_AUTO_UPLOAD=true` instead of allowing Sentry
  failures, so the installed wrapper runs the React Native bundler directly and preserves its
  exit status. `withReleaseBundleGuard` adds a separate, always-run phase immediately after
  bundling, checking the actual main app resources for a nonempty `main.jsbundle`; Watch and
  widget targets are excluded. Regression tests reproduce the old false-success boundary,
  verify genuine bundler errors remain fatal, and exercise generated phase ordering and
  idempotence. The full check passed with **432 tests**, TypeScript, lint (existing warnings),
  and website build; the iPhone Duo source audit exited 0. Runtime QA remains outstanding.
  Replacement build **1.16.1 (59)** was already uploading when the owner reprioritized ads and
  deferred app work. EAS accepted build `106620e5-72ad-44b7-9fff-947ae46e168d`; its artifact,
  runtime behavior and TestFlight distribution have not been checked. It has not been submitted
  to Apple by this workflow. Resume verification later rather than assuming this build is ready.
  The owner subsequently resumed app and ad work. Build 59 finished and passed **20/20**
  artifact checks, including a valid 11,346,812-byte Hermes bundle (bytecode 98, compiler decode
  and footer validated), all seven startup fonts and three onboarding images, plus the previous
  native configuration/signing checks. The IPA contains 37 fonts and 1,185 images. Its SHA-256 is
  `25c81e14c74fc64613c6c3f72cd78f30932c9b0c4d9c0f0ee93200f89ef7299e`.
  Exact archive logs confirm the Sentry upload-disabled branch, copied app assets, and the
  main-target release-bundle guard running before successful archive. This establishes the
  packaging repair, not a passed runtime test.
  EAS submission `7e23e0a3-eff9-4770-ac10-04f2aeed95f5` uploaded this exact build once to Apple,
  requesting the observed internal group **gruntz**; Apple processing was still pending at the
  last check. No App Review submission or public release yet.
  The submission subsequently **FINISHED** successfully on November 2 at 1:40 AM EST. Apple
  processed build 59 and the existing **gruntz** internal group was already assigned; no extra
  invitations or duplicate build upload were needed. Real-device launch and consent checks are
  the next acceptance step.
- Native simulator QA recovery confirmed Device Hub itself was not responding. Only that frozen
  process was force-quit, and only the isolated QA simulator was booted and shut down. Reopening
  Device Hub still failed; bootstatus also reported a data-migration failure. No runtime or fold
  checks passed. Physical devices and other simulators were not changed.
- Live ad status was checked again on November 2: the original Air Force ad is **Active**,
  with 29 link clicks and 809 impressions in the displayed October 3–November 1 report.
  Other original Gruntz comic ads also show Active. This is website-traffic delivery; the
  new direct-install campaign remains an unpublished draft.
- On the owner's request to prioritize Instagram and Threads ads, the live ad-set review
  confirmed Instagram Feed/Stories/Explore/Reels/Profile/Search and Threads Feed are selected.
  The original ad set also has an existing unpublished edit; no changes from that draft were
  published or discarded during this inspection. The live original comic ads still show Active.
  In the prepared install draft, the modern iOS app selector still disables Gruntz with the
  AEM missing/partial conversion-data message. Turning iOS 14+ off exposes a phone destination
  explicitly labeled **Apple App Store (iOS 13.7 or earlier)**, unsuitable for Gruntz's iOS 16.4
  minimum; the prepared draft was restored to iOS 14+ on and remains off/unpublished.
  No SKAN option was exposed in the inspected campaign/ad-set controls. Threads supports app
  ads, but that does not remove this app eligibility block. The unused empty draft's iPad
  lookup was inspected (no app selected or publication); a tablet-only campaign was not used
  as a substitute for the requested current-iPhone acquisition campaign.
- Install-ad draft targeting has now been restored from the original saved audience **fitvete**
  (`120254780414130640`): military-base locations in the original countries, minimum age 18,
  age suggestion 18–34 and its existing military/fitness suggestions. Its placements are
  Instagram Feed/Stories/Explore/Reels/Profile/Search plus Threads Feed. Facebook and Audience
  Network are off, and limited spending to excluded placements is off. The draft retains the
  $10/day campaign budget and now ends November 6, 2026 at 12:00 AM EST, matching the live
  campaign; start was reset to November 2. It remains unpublished/off at campaign level.
  App selection is still pending eligibility. Do not add this budget to the original campaign:
  coordinate replacement delivery to avoid unapproved double spending.

## Draft App Store privacy delta

These are proposed answers, **not posted to App Store Connect**. Actual ATT behavior, network
payloads and received Meta events have not passed real-device verification. Preserve existing
accurate disclosures and review the final category mapping before publishing the answers.

| Data category | Proposed delta for this integration |
| --- | --- |
| Device ID | Add **Developer's Advertising or Marketing + Third-Party Advertising** and **Used for Tracking: Yes**; retain **Linked: Yes** and existing purposes. The SDK sends a persistent anonymous installation identifier even with IDFA collection disabled. No IDFV read was found in the inspected SDK source. |
| Product Interaction | Add the same advertising purposes and tracking flag for install, app-open and session events; retain the existing linked flag and purposes. |
| Other Usage Data | Do not automatically mark this existing category as tracking. App openings and session duration fit Product Interaction; change this category only if a distinct transmitted usage field belongs here. |
| Other Data Types | **Provisional new category:** app/device metadata such as OS, app version and hardware characteristics is transmitted in the attribution payload. Proposed purposes: **Developer's Advertising or Marketing + Third-Party Advertising + Analytics**, **Linked: Yes**, **Tracking: Yes** because it accompanies identifiers. This catchall mapping is an inference to confirm against the real payload and partner use, not a conclusion from the generic SDK manifest alone. |

Apple explicitly places sharing data with entities displaying **our own ads** under Developer's
Advertising or Marketing. **Third-Party Advertising also belongs in this draft**: Meta's
[Business Tools Terms §2.a.v](https://m.facebook.com/legal/terms/businesstools) permit combining
Event Data with other advertisers' and Meta data to improve ad relevance and personalize ads
and recommendations on and off Meta, rather than limiting use to Gruntz ads. The
[Meta Privacy Policy](https://m.facebook.com/privacy/policy/) also describes personalization
and advertising use. Disabled extra collection does not exclude this permitted downstream use.
The category mapping above follows the actual attribution data and these uses; it is not a
blind copy of the SDK's generic manifest purposes. Actual payload and attribution behavior
remain unverified on a real device.

Built CoreKit declares tracking/device identifiers; CoreKit Basics declares unlinked,
non-tracking Other Data Types for Analytics without mapping that declaration to individual
fields. Actual source adds anonymous identifiers, usage events and app/device `extinfo`.
Automatic purchases, IDFA, captured screen titles/URLs and SDK crash instrumentation are
disabled in this configuration. This integration supplies no Gruntz account/profile, contact,
health, workout, precise-location or purchase payload, so it does not justify adding Meta
marketing/tracking purposes to those existing categories. Source-IP retention/use is not
established by the SDK source; categorize it according to confirmed use rather than assuming
a new location category.

Evidence: [Apple category/purpose/tracking definitions](https://developer.apple.com/app-store/app-privacy-details/),
[SDK payload construction](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/AppEvents/Internal/FBSDKAppEventsUtility.m),
[device metadata](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/AppEvents/Internal/FBSDKAppEventsDeviceInfo.m),
and [Basics manifest](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit_Basics/FBSDKCoreKit_Basics/PrivacyInfo.xcprivacy).

## Draft release text for 1.16.1

The public What's New text and a concise version of the following review instructions are saved
in the unsubmitted App Store Connect 1.16.1 draft. The current 1.16.0 store release is unchanged.

### What's New

> Optional ad measurement now has a clear permission prompt and a control in Settings.
> You can keep using Gruntz with measurement turned off.

### App Review notes

Replace the outdated App Review claim that this update adds no analytics or tracking. Version
1.16.1 adds optional Meta advertising measurement, so that claim is no longer accurate. Preserve
the other accurate review instructions and subscription information when replacing that text.

```text
Version 1.16.1 adds optional Meta install and app-open measurement. Core training does not require an account; accounts remain optional for progress backup and teams.

After onboarding is complete and the normal app navigation is ready, Gruntz requests permission through Apple's App Tracking Transparency prompt. Declining does not restrict training access. The Meta SDK initializes only when ATT is authorized and the app's local measurement preference is enabled.

With permission, Meta receives install, app-open and session events plus basic app, device and network metadata, including the IP address. This integration does not send health data, GPS location or routes, workouts, fitness-test answers, profile or email information, purchases or subscription events to Meta. Automatic event and purchase logging, advertising-identifier collection, screen-title/link collection and product-improvement collection are disabled.

To review the permission flow, complete onboarding with a fresh tracking-permission state. Then open Profile → Settings → Ad measurement to inspect or turn off the preference. Turning it off stops future manual measurement events. Previously started SDK requests may finish; the SDK stays disabled on the next app launch while this preference is off. Apple tracking permission can also be changed in iOS Settings.
```

These notes describe the implemented behavior and reviewer steps. They do not claim that actual
ATT prompts, network behavior, received Meta events or install attribution have passed device QA.

## Primary implementation references

- [Meta iOS SDK 19.0.0 release](https://github.com/meta/facebook-ios-sdk/releases/tag/v19.0.0)
- [Native initialization and lifecycle](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/ApplicationDelegate.swift)
- [Collection controls and limited event use](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/Settings.swift)
- [Manual activation, install publishing, and automatic purchase gates](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/AppEvents/FBSDKAppEvents.m)
- [Session activation semantics](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/AppEvents/Internal/FBSDKTimeSpentData.m)
- [CoreKit privacy manifest](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/PrivacyInfo.xcprivacy)
- [Apple user privacy and ATT requirements](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [Apple App Store privacy disclosures](https://developer.apple.com/app-store/app-privacy-details/)
