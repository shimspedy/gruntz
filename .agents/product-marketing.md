# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-10-30
**Status:** Repository-derived draft. Product capabilities below are verified against source; audience motivations and positioning are working hypotheses, not customer research. Check the shipping App Store build before publishing exact catalog counts.

## Product Overview

**One-liner:** Gruntz is a military fitness app that puts today's workout, set logging, and training progress in one place.

**What it does:** Users choose a program or library plan, follow training sessions, log completed sets, and earn XP and streak progress. Military Prep users can select their branch and fitness assessment, save event results, compare progress, and identify a logged event to focus on.

**Product category:** Military fitness, workout planning and logging, PT test preparation.

**Product type:** Local-first iOS mobile app, built with Expo / React Native. Android source exists but is not a shipping platform according to `src/config/monetization.ts`.

**Business model:** 15 included days of full app access, followed by Gruntz Pro subscription access. Monthly and annual packages are supported when offered by the store. Prices and introductory offers come from RevenueCat / the App Store. The website's static $4.99/month is not a live price verification. The included app-access period is separate from any store introductory offer; downloading does not itself establish a paid subscription.

## Target Audience

**Primary audience:** Recruits, candidates, and service members seeking structure for military fitness preparation. Branch profiles cover Army, Marine Corps, Navy, Air Force, Space Force, and Coast Guard.

**Secondary audience:** Returning exercisers, veterans, and civilian athletes who want a repeatable training routine. General training and civilian progression labels exist in the app.

**Primary use case:** Open the app, see the next session, complete the work, and retain a useful training record.

**Jobs to be done:**
- Decide what to train today from a chosen program or plan.
- Record sets, reps, load, time, and progress without leaving the workout.
- For Military Prep, record test events and focus on the largest logged gap to a target.

## Problems & Pain Points

Working hypotheses: inconsistent training, uncertainty about today's workout, fragmented records across notes and timers, and difficulty seeing changes in test-event performance. Do not present these as interview findings or quantified user outcomes.

## Competitive Landscape

Relevant alternatives are generic workout trackers, static training PDFs, spreadsheets, notes, and separate fitness-test calculators. No competitor superiority, speed comparison, or market-leadership claim has been verified.

## Differentiation

- Chosen training plan, workout logging, XP, ranks, and streaks share one workflow.
- Military Prep includes six branch profiles and eight assessment / benchmark definitions, including Marine PFT and CFT plus a general tactical benchmark.
- Test focus uses entered results and targets; matching work in authored military sessions can move first after the warm-up. Library plans retain their exercise selection.
- Exercise demonstrations, muscle information, form instructions, and common mistakes support the training flow.
- Core training uses bundled content and local persistence. Team functions, cloud backup, subscriptions, and some mapping services require connectivity.

## Objections

| Objection | Source-grounded response |
|---|---|
| Is this only for Marines? | Military Prep has profiles for all six branches; general training is also available. |
| Will it tell me whether I pass? | It records event results and shows a preparation benchmark. Official scoring and passing standards must be verified with the user's service. |
| Do I need a full gym? | Bodyweight, minimal-equipment, and gym movements and plans are present. Equipment requirements depend on the selected plan. |
| What happens after the included period? | Continued Pro access requires a subscription. The App Store shows current prices and terms before purchase. |

**Anti-persona:** Someone seeking an official fitness certification, medical supervision, a guaranteed passing score, or a service-issued training product.

## Switching Dynamics

Hypotheses: the push is having to assemble each training day; the pull is a visible next session with its log; habit is keeping notes or following an existing PDF; anxiety is losing history, uncertain pricing, or getting a plan beyond current ability.

## Customer Language

No customer interview or review corpus is available in this repository. Do not invent quotations.

**Words to use:** today's workout, training plan, log every set, your logged events, preparation benchmark, test focus, XP, streak, rank.

**Words to avoid:** guaranteed pass, official score, pass probability, injury prevention promises, fastest, every movement you will ever do, combat-ready as an assured product outcome.

## Brand Voice

Direct, practical, disciplined, and lightly humorous where appropriate. Preserve the founder's military vocabulary without turning every sentence into a command. Existing marketing states “Built by a former U.S. Marine.” Avoid shaming beginners or implying that all users are soldiers.

**Tone by context:** Clear instructions in product/support; concrete product benefits on the website; more room for original everyday military humor in comic ads.

**Existing brand line:** “Military fitness, one mission a day.”

## Proof Points and Claim Boundaries

| Claim | Evidence / boundary |
|---|---|
| 15 included days | `src/config/monetization.ts`; access starts during onboarding. |
| Six military branch profiles | `src/types/index.ts`, `src/data/militaryTests.ts`, onboarding and Service Profile screens. |
| Seven rank tiers | `src/data/ranks.ts`; military labels Recruit through Apex, with civilian alternatives. |
| Hundreds of exercise demos | Current `exerciseLibrary.json` has 582 entries; `exerciseMedia.ts` and bundled dark video folder contain 582 videos. Old website and listing copy says 412. Verify release alignment before publishing 582. |
| Varied plan lengths | Base Camp is 8 weeks, Raider Prep 10, Recon Prep 12; library durations vary. Do not say all programs last 8 weeks. |
| Plan catalog | Current `workoutPlans.json`: 593 entries, including 480 multi-day programs and 113 single workouts. `PLAN_COUNT = 528` is stale. Avoid exact public totals until reconciled. |
| Test benchmark | `getTestReadiness` interpolates baseline-to-target values for entered events. `TestScreen` calls it “Preparation benchmark · your logged events.” It is not official age/sex scoring or a pass prediction. |
| Offline core | Plans, logs, and videos use bundled / local content. Do not claim every feature works offline forever. |

No verified customer-count, rating, conversion, outcome, injury, or performance-study claims are available. Add attributed testimonials only from genuine approved sources.

## Goals

**Business goal:** Increase qualified App Store visits and app adoption.

**Primary conversion action:** Download Gruntz from the App Store. Use one primary download action throughout the homepage; a quieter secondary action can open an authentic app preview or feature section.

**Metrics:** Website conversion and activation metrics are not supplied. Treat proposed copy and layout changes as hypotheses until measured.

## Paid Ads

Existing Meta comic concepts include Orders, Start Monday, and Motivation. Current creative direction asks for cleaner original comic characters, everyday branch-appropriate uniforms, coverage of all six branches, and authentic app screens. Do not invent endorsements, uniforms, or product interfaces.

Target CPA, budgets, conversion values, and tracking quality are unknown. Creative preparation does not authorize launches, budget changes, or edits to live campaigns.

## Learnings

No validated experiment results recorded yet.

## Changelog

- v1 (2026-10-30) — Initial repository-derived context; separated supported training features from outdated catalog counts, unverified prices, and unsupported fitness outcomes.
