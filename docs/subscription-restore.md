# Subscription and progress restore

Gruntz Pro is tied to the athlete's Apple ID or Google account, not to a phone or a
Gruntz login. RevenueCat (`react-native-purchases`) is the only source of truth; the
app never validates receipts itself.

## How it works

| When | What happens |
| --- | --- |
| Every launch | `getCustomerInfo()` runs quietly. Active → unlocked; not active → locked. |
| While open | `addCustomerInfoUpdateListener` applies changes live. |
| Back to foreground | Checked again (at most every 30 s), so a change applies within the session. |
| Offline | The last confirmed answer is trusted for **72 hours**, then Pro switches off until the store answers again. The app's own free trial is separate and unaffected. |
| Restore purchases | On the welcome screen, the paywall and Settings. Calls `restorePurchases()` and unlocks at once, no restart. |

Code: `src/services/entitlementStatus.ts` (states, messages, 72-hour rule),
`src/store/useSubscriptionStore.ts` (checks, transitions, foreground re-check),
`src/components/restoreResult.ts` (the one place results are shown),
`src/components/MovedDeviceSheet.tsx`.

### States and what the athlete sees

| State | Pro | Message |
| --- | --- | --- |
| active | on | "Gruntz Pro restored" toast |
| grace (billing issue, store still retrying) | on | Toast, plus "Update payment" prompt |
| billing-retry (grace over) | off | "Payment didn't go through" + Update payment |
| expired / refunded | off | "Your subscription has ended", mentions cancelled or refunded |
| moved (restored on another phone) | off | "Gruntz Pro is on another device. Restore here to move it back." |
| none | off | "No purchases found", asks them to check they're on the same Apple ID / Google account and where to look |

RevenueCat's SDK does not distinguish a refund from an ordinary expiry, so both use
the "ended" message. Every transition is logged as a breadcrumb (`subscription`
category) for crash reports, with no personal data.

## One active device

Set in the RevenueCat dashboard:

1. **Project Settings → Restore Behavior → "Transfer to new App User ID".**
2. Entitlement identifier `pro`, attached to the monthly and annual products.
3. Offering `default` as the current offering.
4. App Store Connect App-Specific Shared Secret / In-App Purchase key, and the Google
   Play service account credentials, connected so RevenueCat sees renewals, billing
   issues and refunds.
5. Platform server notifications enabled (App Store Server Notifications V2 and Google
   Real-time Developer Notifications), so grace, billing retry and refunds reach
   devices quickly.

Athletes are anonymous RevenueCat App User IDs. When phone B restores the same store
account, the purchase transfers to B's App User ID. Phone A's next check (live
listener, launch or foreground) finds no `pro` entitlement at all and shows a calm
sheet with a **Restore here** button that moves it back. Nothing on phone A is wiped.
There is no device fingerprinting and reinstalling is never blocked: the store
receipt plus the transfer setting is the whole mechanism.

## Progress restore

Progress is separate from the subscription; either can be restored without the
other.

- Athletes who sign in with their email (optional, no password) get an automatic
  cloud backup. On a new phone: Get Started → "Restore your progress" → email code
  → confirm. Nothing is overwritten without that confirmation.
- A returning subscriber is detected after Get Started (the quiet entitlement check)
  and asked "Welcome back. Restore your progress?" with Restore or Start fresh.
- The profile photo of a signed-in athlete is saved with the account and comes back
  on its own.

- iPhone: the backup email is remembered in the athlete's own iCloud key-value store
  (`modules/gruntz-cloud-hint`, entitlement `com.apple.developer.ubiquity-kvstore-identifier`).
  After a reinstall or on a new iPhone with the same Apple ID, Get Started offers
  "Welcome back" even to non-subscribers, with the email filled in. The emailed code is
  still required, and nothing is restored without confirming.
- Android: Auto Backup is on (`allowBackup`), with Expo SecureStore excluded by its own
  backup rules, so app data comes back with the phone's Google backup.

## Review notes (paste into App Store Connect / Play Console)

> Gruntz Pro is an auto-renewing subscription sold through the App Store / Google
> Play and managed by RevenueCat. Users do not need an account. "Restore purchases"
> is on the first screen, on the paywall and in Settings. A subscription is active on
> one device at a time: restoring it on another device moves it there, and the
> previous device shows a message with a Restore button to move it back. No data is
> deleted when this happens. The app's 15-day free access does not require payment.

## Testing checklist

Use StoreKit sandbox testers (iOS) and Play license testers (Android). Filter device
logs for `[subscription]` to see every transition in development builds.

- [ ] Buy on phone A → install on phone B → Restore → B has Pro; A shows the
      "another device" sheet when brought to the foreground.
- [ ] Restore here on A → A has Pro; B shows the sheet.
- [ ] Delete and reinstall on one phone → welcome screen → Get Started → "Gruntz Pro
      restored" toast and the welcome-back offer.
- [ ] Expired subscription → Restore → locked, "Your subscription has ended".
- [ ] Refund in sandbox → Pro switches off at the next check, "ended" message.
- [ ] Airplane mode with Pro confirmed < 72 h ago → still Pro; after 72 h → locked
      until online.
- [ ] Different Apple ID / Google account → "No purchases found" with the account hint.
