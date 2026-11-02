# Meta install measurement

Version **1.16.1 (59)** adds optional iOS install and app-open measurement. Its privacy policy and
App Store privacy disclosures are published. The last authenticated Apple status was Waiting for
Review, with automatic release after approval selected. The current public app remains **1.16.0 (55)**.
Registering the Meta app alone does not add tracking to existing builds. New App Store installs
currently receive the functional build 55; measurement in ordinary public installs requires build
59 to be released.

## Latest ad recovery status — November 2, 2026

The owner accidentally deleted the entire install campaign `120254780382490640`. Its replacement
was published as campaign **`120254786100820640`** ("Gruntz - App Installs - All Branches - IG + Threads")
and ad set **`120254786100890640`** ("Military bases - All branches - App Installs"). The latest fresh
Meta reload shows the replacement campaign **On / Preparing**. The last individual-ad verification
also shows exactly six replacement ads, all **On / Preparing**, with zero drafts and the November 6
end date. Proof: `gruntz-restored-six-preparing.jpg`. These are pending delivery states; the
replacement has not yet been verified Active.

A fresh **Today, November 2** report for the exact replacement ad set verifies its first delivery:
**36 impressions** across Navy (**28 impressions, reach 18, $0.08 rounded spend**), Coast Guard
(**4 impressions, reach 3, $0.02 rounded spend**) and Marines (**4 impressions, reach 2, $0.00 rounded
spend**). Air Force, Army and Space Force have no reported impressions in this reading. All six
individual status labels still show **On / Preparing**. Mobile app installs remain a dash, so these
impressions are delivery evidence, not attributed installs. Proof: `gruntz-restored-first-delivery.jpg`.

| Branch | Replacement ad ID |
| --- | --- |
| Air Force | `120254786100830640` |
| Marines | `120254786100840640` |
| Army | `120254786100850640` |
| Navy | `120254786100860640` |
| Space Force | `120254786100870640` |
| Coast Guard | `120254786100880640` |

The owner increased the shared campaign budget to **$20/day total**. The end remains
**November 6, 2026 at 12:00 AM EST**. Review verified saved audience **fitvete**, AEM, the seven
Instagram and Threads placements listed below, and excluded-placement spending off. Every ad was
verified with App Store app `6761699137`, Meta app `1742670326812925`, **Install now**, original
branch feed/story creative, all creative enhancements off and multi-advertiser ads off.

With the owner's explicit approval at deletion, cleanup removed **two inactive campaigns**,
including the original Traffic campaign's **seven old ads** and **one test ad**. A fresh reload
confirms only the enabled replacement campaign remains in the account's current campaign view,
with **zero drafts** and Review and publish disabled. Deleted historical reporting rows may still
appear when filtered; they are not enabled ads. The earlier four original draft items are no longer
pending.

**Historical record below:** earlier ad IDs, delivery observations and the **$10/day** budget refer
to the pre-deletion rollout, not the replacement above. Earlier delivery does not establish
delivery by the replacement. Operational monitoring must use the replacement IDs and $20/day total.

## Pre-deletion verification snapshot — November 2, 2026

- TestFlight **1.16.1 (59)** is processed and assigned to the existing internal **gruntz** group.
  The owner reports normal launch and an enabled Ad measurement control. A fresh paired-phone
  inventory independently confirms build 59; its subsequent Gruntz-only crash listing contains
  no files newer than the known build 58 crash. The 20-gate signed-artifact check passed.
- The owner also verified opt-out persistence: turn measurement off, fully close/reopen, confirm
  it remains off and training works, then re-enable measurement.
- Meta Events Manager now shows **Active**, **App Installs: 1** and **Activate App: 2** for app
  `1742670326812925`. App Ads Helper also confirms a received iOS install, with green iOS CPC and
  optimized-CPM checks. These establish received events, not ad-attributed installs or campaign
  delivery. Meta acknowledged low conversion volume and offered the AEM acknowledgement action;
  Gruntz is now selectable for a modern-iOS app-promotion campaign. Read-only SDK requests
  confirm the client token is accepted, event collection is enabled, the event kill switch is
  false, and authorized activity routing uses the already-declared `ep1.facebook.com`.
- The production [privacy policy](https://gruntzfit.com/privacy-policy/) is live with a November 2,
  2026 effective date. App Store privacy disclosures now mark **Device ID**, **Product Interaction**
  and **Other Data Types** as linked to the user and used for tracking.
- **1.16.1 (59)** was submitted to Apple review on **November 2, 2026 at 2:18 AM EST**;
  submission `eb0aa68a-17b5-4a97-8e62-b1ba63c271b8` was last authenticated as **Waiting for Review**.
  Automatic release after approval was saved and verified after reload. The App Store Connect
  session has since expired, so there is no newer authenticated review-status reading. A fresh
  public App Store page still shows **1.16.0**.
- The source audit passed. Two isolated Duo simulators failed runtime migration before any
  app launch, including a fresh device; fold/resize runtime checks have not passed.
- The original Traffic campaign's pause was published, followed by publication of the install
  campaign's enabled status. All six military-branch install ads are now published and enabled:
  the latest November 2 reload shows Air Force **Active** and all other five **Preparing**.
  With the report set to **Today, November 2**,
  Air Force showed **4 impressions, reach 1 and $0.00 rounded spend** in the latest proof
  (the first delivery observation was 3 impressions). This is delivery evidence for Air Force only.
  The shared campaign keeps the authorized **$10/day total** and
  November 6 end date; delivery for the other five ads and public app release remain pending.
  Only the original campaign's Campaign Status change was selected for publication; the other
  four draft items were left unchecked and preserved.
- Six final ads use clean app-install setups, verified App Store destinations, full branch-specific
  feed/story artwork and the approved text. The retained website URL/WhatsApp add-on in failed
  copy attempts was not published. With explicit owner approval, all **21 temporary copies**
  were discarded. A fresh reload shows only the six clean ads under the install ad set; the
  global draft count remains the original **four**, untouched.

A follow-up check, `finish-gruntz-install-rollout`, is active in this chat every 15 minutes. It
checks the six exact published ad IDs listed below and public App Store release status, preserves
the budget and end date without extension, and stays quiet except for meaningful changes or required
action. Apple authentication is requested only when an actionable step requires it. The check stops
after all six ads are Active, actual delivery is evidenced and **1.16.1 (59)** is public; local
scheduled checks require the computer and Codex app to remain running.

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
   tracking-enabled app. Completed: the production policy is live with a November 2, 2026 effective
   date; its deployment is recorded below.
6. Build the release with **Xcode 27.1 / iOS 27.1 SDK or newer**. The existing EAS production profile
   pins `macos-tahoe-26.6-xcode-27.1`. That image is available and completed the simulator verification
   build below. The default local Xcode is 27.0; a separate Xcode 27.1 install is available at
   `~/Applications/BootzReleaseTools/Xcode-27.1.0.app`. Select that installation explicitly for
   local release work. Before
   release run `~/.claude/skills/iphone-duo-ready/scripts/audit.sh .` (exit 0)
   and test resized/folded/unfolded layouts per AGENTS.md.
7. Submit and release the new binary. Build 59 was last authenticated as Waiting for Review with
   automatic release after approval selected; the public store still shows 1.16.0. Received Gruntz
   events and modern-iOS app selection are verified. All six install ads are published and enabled;
   Air Force is Active with first delivery evidence, while the other five remain Preparing.
   The original Traffic campaign is paused. The replacement preserves the existing $10/day total.

Owner launch/opt-out checks, Meta event receipt, privacy-label publication, policy deployment and
App Review submission are complete. Fresh-state denial, ATT revocation, erase-race and Duo runtime
checks remain unverified, as do ad-attributed installs, public app release and delivery for the
remaining five branch ads. Unit tests alone do not establish those runtime outcomes.

## Meta account and published ads

The Gruntz Meta registration is published under business `2203594243230044`, connected to ad account
`1947278579469729`, and configured for the iOS bundle and App Store IDs above. Registration alone
did not unlock the iOS 14+ campaign selector. After the real install/activation events arrived,
Meta offered a low-volume AEM acknowledgement and Gruntz became selectable.

The original ad `120254722474450640` ("Comic - Air Force - Brief Then Lift") remains on its original
`gruntzfit.com` destination. Meta rejected a direct App Store URL in that published Traffic campaign;
the attempted edit was restored and its draft cleared by publishing the original settings again.
The original Traffic campaign `120254721028370640` is now **paused**, with that single Campaign
Status change published successfully. The four other draft items were unchecked and preserved.

A separate, **published and enabled** install campaign now contains all six military-branch creatives:

- Campaign `120254780382490640`: "Gruntz - App Installs - All Branches - IG + Threads", App promotion,
  campaign budget **$10/day**. This is a replacement within the existing authorized total budget.
- Ad set `120254780382500640`: "Military bases - All branches - App Installs", freshly verified
  **Active** and on. All six published ad IDs and latest observed statuses are listed below.
- Gruntz is selected using AEM, with **Maximize app installs** as the performance goal. The app
  destination uses **Install Now**, with no deep link or custom product page. All six final ads
  were created through fresh ad setup, with verified `http://itunes.apple.com/app/id6761699137`
  destinations and Gruntz app events `1742670326812925`. Each uses its full original branch-specific
  feed/story account images, the approved primary text and headline, and the fitvete Instagram
  identity with Threads set to Use Instagram account. AI enhancements and multi-advertiser ads
  are off.
- Manual placements are Instagram Feed/Stories/Explore/Reels/Profile/Search plus Threads Feed.
  Facebook and Audience Network are off; limited spending to excluded placements is off.
- Meta's initial Publish confirmation reported one campaign, one ad set and one ad. After the
  original Traffic campaign's pause was published, enabling the install campaign was published
  as one campaign change. The additional clean branch ads were published individually. The parent
  renames were then published as **one campaign and one ad set only**; all six draft ads and the
  other parents in that review were excluded. The shared $10/day total and November 6 end date
  are unchanged. Air Force now has verified delivery; the other five ads do not yet.
- An earlier empty setup draft, campaign `120254780246540640`, is also off and not publish-ready.
  It is not the prepared creative copy above.

| Branch | Published ad ID | Last observed delivery |
| --- | --- | --- |
| Air Force | `120254780382570640` | Active |
| Marines | `120254784795790640` | Preparing |
| Army | `120254785000730640` | Preparing |
| Navy | `120254785012290640` | Preparing |
| Space Force | `120254785030000640` | Preparing |
| Coast Guard | `120254785034710640` | Preparing |

Statuses above reflect the latest **November 2 reload**, with all six ads enabled. The **Today,
November 2** report showed Air Force at **4 impressions, reach 1 and $0.00 rounded spend**. This
establishes first delivery for Air Force, not all six ads or an attributed install.

Failed duplicate attempts retained the old website URL and a WhatsApp add-on; those incorrect
setups were never published. The owner explicitly authorized discarding the first 16 temporary
copies and the final five failed-clone drafts: `120254784682070640`, `120254784682080640`,
`120254784682090640`, `120254784682100640` and `120254784682110640`. All **21 temporary copies**
are now removed. A fresh reload confirms only six clean ads under this ad set and a global draft
count of four unchanged original items. Parent display names above are the published, verified
All Branches names.

The budget transition is complete: the original campaign is paused and the install campaign is
enabled at the same $10/day total. The ad set is Active and Air Force has first delivery evidence;
the remaining five branch ads still await delivery. Unrelated unpublished edits on the original
ad set remain preserved.

## Verification record

- Full repository checks: TypeScript passed, ESLint had no errors (existing warnings remain),
  **427 tests passed**, and the website production build passed.
- The SDK implementation and policy source changes were merged to `main` through
  [PR #11](https://github.com/shimspedy/gruntz/pull/11), commit
  `46e0ef0f6a191422aa80f03615c7dccf4c5ca96b`. The rollout status documentation is maintained
  separately from that implementation merge.
- Rechecked the final consent/lifecycle/reset cases: **27 tests passed**; final TypeScript and
  updated privacy-page build also passed.
- Updated privacy policy is verified live at
  [gruntzfit.com/privacy-policy/](https://gruntzfit.com/privacy-policy/), with header and effective
  date **November 2, 2026**. Production deploy `6ae83692609b939af6edac69` uses commit
  `46e0ef0f6a191422aa80f03615c7dccf4c5ca96b`, merged through
  [PR #11](https://github.com/shimspedy/gruntz/pull/11). The rendered Terms dates remain
  October 31, 2026.
- iPhone Duo source audit: **exit 0**. Real resize/fold tests remain part of release QA.
- Expo native config introspection confirmed the correct Meta app ID, credential presence, ATT
  purpose text and disabled automatic collection flags. Credential values were not logged.
- [Xcode 27.1 simulator verification build](https://expo.dev/accounts/blaqdu/projects/gruntz/builds/e4c6974d-325a-46b6-9f3e-881e2fa6096f):
  **FINISHED**. Native compilation passed on the pinned Xcode 27.1 image.
- Built-app inspection verified the Meta app ID, client-token presence, ATT purpose text,
  disabled automatic collection flags, app tracking-domain declarations, and bundled
  CoreKit, CoreKit Basics and FBAEMKit privacy manifests. Credential values were not logged.
- This simulator artifact is not an App Store distribution build or a release. Native compilation
  and configuration inspection alone do not verify ATT behavior, received Meta events, AEM
  eligibility, install attribution or ad activation. Later build 59 device and Meta observations
  are recorded separately below.
- The artifact installed successfully in a fresh, isolated iPhone Duo / iOS 27.1 simulator.
  Device Hub accessibility calls repeatedly timed out, so runtime consent and fold/resize checks
  were not completed. The QA simulator was shut down; existing user devices and app data were
  not modified.
- App Store Connect: **1.16.0 (55)** remains the public version. **1.16.1 (59)** was submitted
  for review on **November 2, 2026 at 2:18 AM EST**, with updated What's New and App Review notes
  explaining optional Meta measurement. Submission `eb0aa68a-17b5-4a97-8e62-b1ba63c271b8` was
  last authenticated as **Waiting for Review**; automatic release after approval was saved and
  verified after reload. The authenticated session later expired. The fresh public store page
  still shows 1.16.0; build 59 has not been verified publicly released.
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
  No App Review submission or public release occurred during this signing step; later submission
  and TestFlight results are recorded separately.

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
  Apple build ID: `9d2860c1-d0cc-4bf6-83f2-5f0664b8eadc`. The owner installed this build and
  reported the launch crash below. Build 58 was superseded by build 59 and was not submitted
  for public App Review.
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
  and website build; the iPhone Duo source audit exited 0.
- Replacement [production build **1.16.1 (59)**](https://expo.dev/accounts/blaqdu/projects/gruntz/builds/106620e5-72ad-44b7-9fff-947ae46e168d)
  finished and passed **20/20 artifact checks**, including a valid 11,346,812-byte Hermes bundle
  (bytecode 98, compiler decode
  and footer validated), all seven startup fonts and three onboarding images, plus the previous
  native configuration/signing checks. The IPA contains 37 fonts and 1,185 images. Its SHA-256 is
  `25c81e14c74fc64613c6c3f72cd78f30932c9b0c4d9c0f0ee93200f89ef7299e`.
  Exact archive logs confirm the Sentry upload-disabled branch, copied app assets, and the
  main-target release-bundle guard running before successful archive. This establishes the
  packaging repair, not a passed runtime test.
  EAS submission `7e23e0a3-eff9-4770-ac10-04f2aeed95f5` uploaded this exact build once to Apple,
  requesting the observed internal group **gruntz**. The submission **FINISHED** successfully
  on November 2 at 1:40 AM EST. Apple processed build 59 and the existing **gruntz** internal
  group was already assigned; no extra
  invitations or duplicate build upload were needed. Apple build ID:
  `a908ff13-9cb0-4417-8089-625a56e4cd2c`. A fresh physical-device inventory confirms 1.16.1 (59).
  The owner confirmed normal launch and enabled measurement, then turned measurement off,
  fully closed/reopened the app and confirmed it remained off while training still worked.
  The owner then re-enabled measurement. These pass launch and opt-out-persistence checks;
  they do not establish every fresh-permission, ATT-revocation or erase-race case.
- Meta Events Manager subsequently showed **Active**, **App Installs: 1** and **Activate App: 2**.
  App Ads Helper independently showed the received iOS install. Read-only configuration and
  gatekeeper requests returned HTTP 200, valid app/client configuration, event collection enabled,
  `app_events_killswitch=false`, and authorized `/activities` routing to `ep1.facebook.com`.
  Those GET probes sent no events and alone do not establish delivery; the Events Manager and
  App Ads Helper observations provide the receipt evidence. No ad-attributed install is claimed.
- Native simulator QA recovery confirmed Device Hub itself was not responding. Only that frozen
  process was force-quit, and only the isolated QA simulator was booted and shut down. Reopening
  Device Hub still failed; bootstatus also reported a data-migration failure. No runtime or fold
  checks passed. Physical devices and other simulators were not changed.
- An earlier live ad-status check on November 2 showed the original Air Force ad **Active**,
  with 29 link clicks and 809 impressions in the displayed October 3–November 1 report.
  Other original Gruntz comic ads also showed Active. This was website-traffic delivery; the
  original Traffic campaign was subsequently paused and replaced by the enabled install
  install campaign recorded above.
- On the owner's request to prioritize Instagram and Threads ads, the live ad-set review
  confirmed Instagram Feed/Stories/Explore/Reels/Profile/Search and Threads Feed are selected.
  The original ad set also had an existing unpublished edit; no changes from that draft were
  published or discarded during this inspection. The original comic ads showed Active at that
  check, before the later campaign-level pause.
  At that earlier preparation stage, the modern iOS app selector disabled Gruntz with the
  AEM missing/partial conversion-data message. Turning iOS 14+ off exposes a phone destination
  explicitly labeled **Apple App Store (iOS 13.7 or earlier)**, unsuitable for Gruntz's iOS 16.4
  minimum; the prepared draft was restored to iOS 14+ on. After real events arrived, Gruntz
  became selectable through the low-volume AEM acknowledgement described above.
  No SKAN option was exposed in the inspected campaign/ad-set controls. Threads support for app
  ads did not bypass the eligibility block at that stage. The unused empty draft's iPad
  lookup was inspected (no app selected or publication); a tablet-only campaign was not used
  as a substitute for the requested current-iPhone acquisition campaign.
- Install-ad targeting was restored from the original saved audience **fitvete**
  (`120254780414130640`): military-base locations in the original countries, minimum age 18,
  age suggestion 18–34 and its existing military/fitness suggestions. Its placements are
  Instagram Feed/Stories/Explore/Reels/Profile/Search plus Threads Feed. Facebook and Audience
  Network are off, and limited spending to excluded placements is off. The install campaign retains the
  $10/day campaign budget and now ends November 6, 2026 at 12:00 AM EST, matching the live
  campaign; start was reset to November 2. Gruntz/AEM and Install Now were subsequently selected.
  Publication first showed the campaign OFF and ad Processing; the original Traffic campaign
  was then paused and the install campaign enabled through separate successful one-campaign
  publications. All six branch ads were subsequently published, and the All Branches parent
  names were published as one campaign and one ad set only, excluding all six draft ads and
  other parent items. The latest November 2 reload shows Air Force Active with 4 impressions and
  reach 1 in the Today/November 2 report; all other five ads are now Preparing, including Army
  and Space Force after leaving review. Spend displayed $0.00 rounded. The existing $10/day total and
  November 6 end date are unchanged. Delivery is verified for Air Force only. The original four
  draft items remain preserved. Incorrect clone setups were not published. After explicit owner
  approval of both cleanup steps, all 21 temporary copies were discarded; a fresh reload shows
  only the six clean ads under the install ad set and the original global draft count of four.

## Published App Store privacy update

App Store Connect privacy disclosures are published with **Device ID**, **Product Interaction**
and **Other Data Types** marked **Linked: Yes** and **Used for Tracking: Yes**. Existing accurate
health/location and other disclosures were preserved. The Other Data Types classification is a
conservative mapping from inspected SDK source, not a captured device payload. Received install
and activation events are verified; a full network-payload audit has not been performed.

| Data category | Published tracking/linking update and source rationale |
| --- | --- |
| Device ID | **Linked: Yes; Tracking: Yes.** Advertising purposes include **Developer's Advertising or Marketing + Third-Party Advertising**, alongside retained existing purposes. The SDK sends a persistent anonymous installation identifier even with IDFA collection disabled. No IDFV read was found in the inspected SDK source. |
| Product Interaction | **Linked: Yes; Tracking: Yes**, covering install, app-open and session events and the same advertising purposes, with existing purposes retained. |
| Other Usage Data | No additional Meta tracking classification was inferred for this category. App openings and session duration fit Product Interaction; a distinct transmitted usage field would need its own review. |
| Other Data Types | Added with **Linked: Yes; Tracking: Yes** for app/device metadata such as OS, app version and hardware characteristics that accompanies identifiers. Purposes: **Developer's Advertising or Marketing + Third-Party Advertising + Analytics**. This catchall mapping is a conservative source-based inference, not a captured-payload finding or a blind copy of the generic SDK manifest. |

Apple explicitly places sharing data with entities displaying **our own ads** under Developer's
Advertising or Marketing. **Third-Party Advertising also belongs in these disclosures**: Meta's
[Business Tools Terms §2.a.v](https://m.facebook.com/legal/terms/businesstools) permit combining
Event Data with other advertisers' and Meta data to improve ad relevance and personalize ads
and recommendations on and off Meta, rather than limiting use to Gruntz ads. The
[Meta Privacy Policy](https://m.facebook.com/privacy/policy/) also describes personalization
and advertising use. Disabled extra collection does not exclude this permitted downstream use.
The category mapping above follows the actual attribution data and these uses; it is not a
blind copy of the SDK's generic manifest purposes. Full payload contents and ad-attribution behavior
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

## Submitted release text for 1.16.1

The public What's New text and a concise version of the following review instructions are saved
in the submitted App Store Connect **1.16.1 (59)** version. The current public **1.16.0 (55)**
store release is unchanged. The last authenticated 1.16.1 status was Waiting for Review, with
automatic release after approval saved and verified after reload.

### What's New

> Optional ad measurement now has a clear permission prompt and a control in Settings.
> You can keep using Gruntz with measurement turned off.

### App Review notes

The submitted review notes replace the outdated claim that this update adds no analytics or
tracking. Version 1.16.1 adds optional Meta advertising measurement. The other accurate review
instructions and subscription information are retained.

```text
Version 1.16.1 adds optional Meta install and app-open measurement. Core training does not require an account; accounts remain optional for progress backup and teams.

After onboarding is complete and the normal app navigation is ready, Gruntz requests permission through Apple's App Tracking Transparency prompt. Declining does not restrict training access. The Meta SDK initializes only when ATT is authorized and the app's local measurement preference is enabled.

With permission, Meta receives install, app-open and session events plus basic app, device and network metadata, including the IP address. This integration does not send health data, GPS location or routes, workouts, fitness-test answers, profile or email information, purchases or subscription events to Meta. Automatic event and purchase logging, advertising-identifier collection, screen-title/link collection and product-improvement collection are disabled.

To review the permission flow, complete onboarding with a fresh tracking-permission state. Then open Profile → Settings → Ad measurement to inspect or turn off the preference. Turning it off stops future manual measurement events. Previously started SDK requests may finish; the SDK stays disabled on the next app launch while this preference is off. Apple tracking permission can also be changed in iOS Settings.
```

These notes describe the implemented behavior and reviewer steps. Owner launch/opt-out-persistence
checks and Meta install/activation receipt are verified. Fresh-state ATT denial, revocation,
erase-race cases, full network payloads and ad-attributed installs have not been verified.

## Primary implementation references

- [Meta iOS SDK 19.0.0 release](https://github.com/meta/facebook-ios-sdk/releases/tag/v19.0.0)
- [Native initialization and lifecycle](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/ApplicationDelegate.swift)
- [Collection controls and limited event use](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/Settings.swift)
- [Manual activation, install publishing, and automatic purchase gates](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/AppEvents/FBSDKAppEvents.m)
- [Session activation semantics](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/AppEvents/Internal/FBSDKTimeSpentData.m)
- [CoreKit privacy manifest](https://github.com/meta/facebook-ios-sdk/blob/v19.0.0/FBSDKCoreKit/FBSDKCoreKit/PrivacyInfo.xcprivacy)
- [Apple user privacy and ATT requirements](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [Apple App Store privacy disclosures](https://developer.apple.com/app-store/app-privacy-details/)
