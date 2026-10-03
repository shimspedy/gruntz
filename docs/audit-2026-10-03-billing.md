# Billing audit and App Store preparation — October 3, 2026

## Fixed in this audit

- RevenueCat initialization is shared across simultaneous startup/paywall calls and can recover from failed native configuration.
- Annual-only offerings and custom annual packages remain purchasable without displaying a false monthly price. Savings compare actual monthly and annual prices.
- Failed/empty offerings now produce visible unavailable/retry states instead of an endless loading label. Native configuration and displayed pricing are refreshed each launch instead of persisted as purchase-ready.
- Native purchase completion only announces success when the `pro` entitlement is active. Pending store approval or unconfirmed access has a separate message; failed requests no longer falsely promise that no charge occurred.
- Annual and monthly introductory offers include the offer period and duration, qualified by store eligibility.
- The app trial no longer skips customer-info retrieval. Known subscription access survives failed requests, while a successful authoritative inactive result removes access.
- Invalid trial dates cannot crash access checks. Cloud trial reconciliation can only adopt an earlier valid start and now has a live-store method (`adoptTrialStart`).
- Customer Center failures recover through the platform subscription-management URL. A successful fallback does not open twice, failed refresh after dismissal does not falsely report presentation failure, and both membership screens show actionable failure messages.
- Development subscription bypass requires `EXPO_PUBLIC_DEV_UNLOCK=true`; release builds cannot enable it.

## Verification

`node --test tests/billing.test.cjs`: 21 passing regression tests using mocked native SDK responses, covering concurrent configuration, retries, offline customer info, failed/empty offerings, annual-only plans, intro disclosures, purchases without entitlements, pending payment, cancellation, restores, management fallback, trial validation, persisted state, and explicit development bypass.

Installed RevenueCat method signatures and introductory-price types were checked against 10.10.0 and the subsequently installed 10.11.0. The 10.11.0 release adds optional external-purchase configuration and native dependency updates; the API methods used here retain their signatures. The npm audit warnings on RevenueCat are inherited from React Native / Metro dependencies, not a direct RevenueCat advisory.

References: [RevenueCat subscription status](https://www.revenuecat.com/docs/customers/customer-info), [RevenueCat purchase handling](https://www.revenuecat.com/docs/getting-started/making-purchases), [RevenueCat 10.11.0 release](https://github.com/RevenueCat/react-native-purchases/releases/tag/10.11.0).

## Live billing verification and correction

Apple app: `6761699137`, bundle: `com.gruntz.fitness`.

Both App Store products are `APPROVED` in subscription group `22020635`:

| Product | Apple subscription ID | Period | RevenueCat entitlement |
| --- | --- | --- | --- |
| `monthly` | `6761798019` | One month | `pro` |
| `com.gruntz.fitness.pro.annual` | `6764237381` | One year | `pro` |

The RevenueCat SDK product-to-entitlement mapping was checked with a read-only request and confirms both mappings. No purchase/customer writes were performed.

With authorization to fix the app's billing configuration, the annual product's `groupLevel` was changed from `2` to `1`, matching the monthly product's existing `1`. Both unlock identical Pro content. Readback confirmed both are still approved at level 1; no prices or product IDs were changed. Apple recommends equal subscription levels for equal content with different durations: [Apple subscription guidance](https://developer.apple.com/app-store/subscriptions/).

## App Store Connect preparation

Prior live version: **1.8 (36)**, ready for distribution. Its metadata, reviewer contact information, and no-demo-account requirement were retained.

Prepared version: **1.9**, ID `c12d2e35-f2ef-4e7d-808f-e3256596bb53`.

- State at preparation: `PREPARE_FOR_SUBMISSION`.
- Release behavior retained: `AFTER_APPROVAL`.
- English description, keywords, support/marketing URLs retained; What's New describes billing, workouts, backup/restore, reminders, and startup reliability fixes.
- All reviewer fields verified equal to the prior version; no sign-in credentials are needed to review core app flows.
- Seven iPhone and seven iPad screenshots carried forward, all `COMPLETE` without errors.
- Build initially unattached. Planned next build is **37**, subject to the root agent's build/upload validation.
- No review submission was made during preparation.

The temporary release helper `/tmp/gruntz-asc-submit.mjs` is prepared for the root agent's final upload validation. It defaults to read-only inspection; explicit `--submit --validated-build=37` attaches only the validated 1.9 build 37, reuses an existing matching review draft, submits, and reads back review state. It does not change reviewer details, pricing, or release mode.

## Remaining device verification

Mocked regression tests and live product approval/mapping checks do not perform StoreKit transactions. A real-device sandbox/TestFlight purchase, cancellation, restore after reinstall, and Customer Center cancellation/change-plan walkthrough remain the appropriate end-to-end validation of Apple's payment UI and receipts. No real payment was initiated during the audit.
