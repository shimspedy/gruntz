# Gruntz Launch And Monetization Plan

Last updated: April 7, 2026

## Product Thesis

Gruntz should launch as a narrow tactical training app, not a broad fitness app.

Core promise:

- show up today
- complete the mission
- keep the streak alive
- earn XP
- finish the cycle

The product should stay centered on:

- Raider and Recon program selection
- daily mission completion
- streaks, XP, rank, and achievements
- progress tied to actual mission completion
- run tracking only when it supports the programmed work

## What To Keep As Core

- Home as the command center
- daily mission flow
- mission completion and rewards
- progress summary
- profile, achievements, and settings
- program detail and program selection
- workout cards as support content

## What Not To Build The Business Around

Do not lead the launch with:

- generic health dashboards
- AI-heavy features
- broad wellness positioning
- complicated data views that do not improve adherence
- “fitness for everyone” messaging

## Recommended Launch Positioning

Primary positioning:

`Daily tactical prep missions for people training for selection, readiness, or hard events.`

Target users:

- military applicants and active-duty members
- tactical athletes
- CrossFit-style users who want structure
- Spartan / Tough Mudder / hybrid event users

## Recommended Monetization

### Simple version

Launch with one auto-renewable subscription group and one monthly product.

Recommended implementation:

- every new user gets `15 days` of app access
- after that, subscription required
- subscription price: `$4.99/month`

### Important product note

This is best implemented as an app-level access window, not necessarily as an App Store introductory offer.

That means:

- user installs and completes onboarding
- user gets `15 days` of full in-app access
- after day 15, the paywall appears
- paid membership continues access

### Important Apple constraint

If you later want the free period to happen through Apple’s subscription system itself, Apple’s standard intro durations for a monthly auto-renewable subscription do not include `15 days`.

Closest Apple-native option:

- `2-week free trial`
- then `$4.99/month`

So there are two valid paths:

- current recommended app behavior: `15-day in-app access window`
- Apple intro-offer version: `2-week subscription trial`

If you want the cleanest possible first monetization setup, use:

- `Gruntz Pro Monthly`
- price: `$4.99/month`
- app-controlled `15-day` free access window

### Why this pricing makes sense

This is a good launch price because:

- it is simple
- it lowers friction for first buyers
- it matches the current scope better than a premium tactical platform price
- it gives you room to raise later if retention is strong

### When to add annual pricing

Do not start with too many SKUs.

Add annual only after you have:

- proof that users finish week 1
- proof that users make it into week 2 and week 3
- proof that trial conversion is working

Then add:

- annual at roughly `$39.99` to `$49.99`

## Suggested Paywall Model

Free:

- onboarding
- program selection
- limited early missions
- XP, streak, and basic progress

Paid:

- full Raider program
- full Recon program
- all weeks unlocked
- full mission history
- future premium program drops

## Launch Sequence

### Phase 1: TestFlight

Start with a private TestFlight group.

Target:

- 25 to 50 users
- military prep users
- veterans
- CrossFit / hybrid users
- OCR users

What to measure:

- onboarding completion
- program selection rate
- day-1 mission completion
- day-7 retention
- trial start rate
- trial-to-paid conversion

### Phase 2: Public launch

Only go public after:

- subscription is working
- onboarding is stable
- first-session mission flow is clean
- App Store screenshots and copy are focused

Use a phased release instead of a full blast launch.

### Phase 3: Growth

Use:

- TestFlight feedback
- offer codes
- military community outreach
- creator demos from tactical / OCR / hybrid athletes

## Messaging Recommendations

Lead with:

- today’s mission
- XP
- streak
- progression
- program completion

Do not lead with:

- vague body metrics
- generic “wellness”
- overbuilt data features

## Immediate Next Steps

1. Set up one auto-renewable subscription group in App Store Connect.
2. Create one monthly product at `$4.99/month`.
3. Implement the `15-day` app access window for new users.
4. Wire billing and entitlement checks in-app.
5. Define exactly what is free vs paid after day 15.
6. Run TestFlight before public launch.
7. Tighten App Store copy around tactical mission adherence.

## Recommendations Summary

My recommendation for Gruntz right now:

- keep the app focused and narrow
- monetize with one simple monthly subscription
- use a `15-day` app-level free access window because it matches the product decision
- launch first to TestFlight, not broad public traffic
- sell discipline, adherence, and tactical readiness, not “more features”

## Sources

- Apple subscriptions overview: https://developer.apple.com/app-store/subscriptions/
- Auto-renewable subscriptions setup: https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/
- Introductory offers: https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions/
- Offer codes: https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-subscription-offer-codes/
- Win-back offers: https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-win-back-offers/
- TestFlight: https://developer.apple.com/testflight/
- App Store Small Business Program: https://developer.apple.com/app-store/small-business-program/
