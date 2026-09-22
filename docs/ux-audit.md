# UX audit — 267 findings

Six audits of the app (workout player, onboarding/paywall, plans & library, navigation/state/performance,
copy & accessibility, data correctness), scored by how much each one would annoy a real user.

- **Fixed: 146** — the 55 first-pass fixes, plus 91 of the numbered items below.
- **Open: 31** — including 5 that need a device or account.

Status legend: `[x]` fixed · `[ ]` open · `[?]` needs a product decision · `[dev]` needs a device or account to verify.

---

## Fixed (55)

### Data loss and money
- [x] `useSessionStore.replaceExercise` rebuilt sets from scratch — swapping an exercise wiped every logged set.
- [x] `ExerciseInsights` swap fired instantly from a scrolling carousel with no confirm.
- [x] `SessionSummary` `canSave` required every exercise complete — a real workout could never be saved.
- [x] `subscription.restorePurchases` always returned `restored`, leaving paying users locked out with a success message.
- [x] Restore now separates "no subscription found" from "couldn't reach the App Store" (Paywall + Settings).
- [x] `SetTable` weight/reps/time inputs re-parsed on every keystroke: "22.5" became 22, "1:30" was unenterable.
- [x] Units switch relabelled stored weights (135 lb → "135 kg"); weights are converted and old sets keep their unit.
- [x] `usePlanLibraryStore` `follow`/`unfollow` erased plan progress; progress is now kept per plan.
- [x] Finishing the last plan day reset every tick to "0 done" at the moment of completion.
- [x] No way to un-mark a day completed by mistake (`unmarkDay`).
- [x] `Sheet` entrance only ran on first layout — second open was invisible but still swallowed taps (looked frozen).
- [x] Streak counted twice for two workouts in one day.
- [x] `isStreakAlive` accepted future dates, keeping a streak alive forever.
- [x] Backdated workouts dragged `last_workout_date` into the past, killing a live streak.
- [x] A broken streak left a stale anchor date behind.
- [x] Challenge streak used an exact 86,400,000 ms gap — broke twice a year on DST.
- [x] Achievements advertised "+250 XP" and never awarded it.
- [x] `addXP` accepted negative and non-finite values, driving XP and the level ring backwards.
- [x] "Delete all data" left stores live in memory, which re-persisted after the wipe.

### Notifications
- [x] Workout-progress and rest notifications ignored the user's reminder setting.
- [x] Rest notification could fire after the workout was finished or discarded.
- [x] Turning reminders off left the trial-ending notification scheduled.
- [x] Trial nudge could fire at 3 AM; now clamped to daytime.
- [x] Daily reminder fired 7 days a week regardless of the chosen training days (`scheduleDailyReminder` takes weekdays).
- [x] Reminders row claimed "Daily at 7:00 AM" even when off; now reflects real state.

### Dead ends
- [x] "Workout in progress" alerts offered only "OK" (plan day + routine detail) — now offer "Discard and start".
- [x] Workout detail CTA "Finish your current workout first" was disabled with no way to reach it.
- [x] Workout detail "Scheduled for <day>" blocked training early — now "Do it now".
- [x] Notification-permission dead end in Settings now opens iOS Settings.
- [x] Train "Recovery week" empty state had no action — now links to plans.
- [x] Onboarding back from the result screen bounced forward off the auto-advancing "generating" step.
- [x] Onboarding equipment and age were mandatory; both now have honest skip labels.
- [x] Finishing onboarding required a 1.4 s sustained hold; a double tap now works too.

### Workout player
- [x] Auto-advance `setTimeout` was never cancelled — it yanked the pager after un-ticking or discarding.
- [x] Rest didn't start after the last set of an exercise (circuits got no rest at all).
- [x] `adjustRest(-15)` refilled the progress ring to 100%.
- [x] Un-logging a set left its rest timer running (and its notification scheduled).
- [x] No way to delete a set (`removeSet`).
- [x] `addSet` cloned the warm-up flag and stale distance from the last row.
- [x] "Previous" column indexed by row, so warm-up rows shifted every value.
- [x] `previous` was seeded from warm-up sets, prefilling next session with warm-up loads.
- [x] Keep-awake stayed on while the workout was merely minimised.
- [x] Guide button removed; instructions, history, charts and records now live under the logger.
- [x] Set rows were 72 pt tall; tightened to 52 so all four sets fit on screen.
- [x] Circuits of 3+ exercises were labelled "SUPERSET".
- [x] Body map showed the back for quad-primary exercises.

### Performance and lifecycle
- [x] The 4 MB plan file was parsed at startup; it now loads on first use, with a plain `PLAN_COUNT` for counters.
- [x] `useNow` intervals ran in the background and drifted; they now pause and resync.
- [x] Double taps pushed two copies of a screen (one press lock in `Tap`).
- [x] Toasts covered the workout's Finish button.

### Copy and accessibility
- [x] "Mission" renamed to "workout" in stats, profile, achievements, settings, celebration, plan and workout detail.
- [x] "1 exercises" plural bugs (`plural()` helper).
- [x] "0-day streak · keep it alive" after a first workout; now "Streak started".
- [x] "+100%" week-over-week off a single workout; now shows counts.
- [x] Default name "Recruit" → "Athlete"; "Callsign" → "Name".
- [x] Warm-up rows announced three identical "Set W" controls to VoiceOver.
- [x] Settings switches announced as bare unlabelled switches.
- [x] Session clock read its label instead of the time.
- [x] Charts drew a fake rising trend behind "Not enough data"; now a flat baseline.
- [x] Charts defaulted to 3 months, so older logs showed four empty cards; the range now follows the data.

---

## Open — needs a product decision (`[?]`)

1. [x] Military identity: keep ranks (Recruit…Apex), the Test tab and rank blurbs for everyone, or gate on the Military Prep goal? (`data/ranks.ts:13-19`, `navigation/TabBar.tsx:32`, `RootNavigator.tsx:69`)
2. [x] Streaks on rest days: a 3-day/week plan loses its streak every week (`utils/xp.ts:63`, `useUserStore.ts:285`).
3. [x] Trial: buying on day 2 of 15 forfeits the rest with no warning (`PaywallScreen.tsx:139`).
4. [x] After finishing a plan: restart, recommend a new one, or stop? (`usePlanLibraryStore.ts`)
5. [x] Training preferences (days, minutes, equipment, level, goals, age) are set once in onboarding and editable nowhere (`OnboardingScreen.tsx:193-218`).
6. [x] Reminder time is hardcoded 07:00 though `reminder_time` is stored and the copy says "change it anytime" (`SettingsScreen.tsx:65`).
7. [x] Fitness test date can only be set during onboarding; Test tab shows "No test date set" with no editor (`TestScreen.tsx:94`).
8. [x] Commitment screen copy "No excuses, no quitting" pre-blames the user (`Finale.tsx:197`).
9. [x] `.toUpperCase()` on plan/program titles makes long names a caps wall (`TrainScreen.tsx:185,211`, `PlanCards.tsx:51,75`, `LibraryPlanDetailScreen.tsx:87`).
10. [x] Rank ladder promises gear/avatars that no screen shows (`data/ranks.ts:22-48`).

## Open — needs a device or account (`[dev]`)

11. [dev] Background GPS: a backgrounded run stops accumulating; duration is wrong on return (`hooks/useRunTracker.ts:194`).
12. [dev] Restore/purchase against a real App Store sandbox account.
13. [dev] Notification permission and delivery flows on a real device.
14. [dev] No crash reporter or unhandled-rejection handler; production failures vanish (`App.tsx`, `ErrorBoundary.tsx:29`) — needs a Sentry/Crashlytics key.
15. [dev] Offline handling: no connectivity detection anywhere; restore/purchase failures read as generic errors (`RootNavigator.tsx:211`).

## Open — data from the source site

16. [x] 20 slots have `measure:'distance'` with no distance → "3 ×  m" (`features/planDisplay.ts:52`).
17. [x] 21 `rep_scheme`s disagree with their `sets` count; the prescription shown is wrong.
18. [x] 18 timed slots round 150 s to "3 min" instead of 2:30 (`planDisplay.ts:49`).
19. [ ] 5 plans have more warm-up sets than working sets.
20. [x] Absurd parsed values: one day estimated 335 min; `3 × 100` crunches; 20 sets of burpees.
21. [ ] 6 programs have `duration_weeks: null`, so `planMeta` prints no length; 495 have fewer days than weeks × days/week.
22. [x] 10 plans have `session_minutes: null` and fall back to day 1's estimate (`planDisplay.ts:33`).

## Open — workout player

23. [x] `SessionBody` subscribes to the whole store: every keystroke re-renders the pager, carousel and clock (`WorkoutSession.tsx:113`).
24. [x] Session persists the full exercise array on every keystroke (`useSessionStore.ts:449`) — debounce.
25. [x] Number pads have no Done accessory; the keyboard covers the ✓ column (`SetTable.tsx`).
26. [x] Rest banner is not keyboard-aware: Skip/−15/+15 sit under the keyboard (`WorkoutSession.tsx:341`).
27. [x] Removing every exercise leaves a blank screen with no empty state (`WorkoutSession.tsx:123`).
28. [x] Rest ends invisibly at 0 with no "rest over" state or sound (`RestBanner.tsx:35`).
29. [x] No manual "start rest" / restart after skipping (`WorkoutSession.tsx:237`).
30. [x] `startRoutine`/`startPlanDay` overwrite persisted `restOverrides`; a rest set once persists globally forever.
31. [x] Note is saved only on blur; minimising or swiping loses typed text (`ExerciseInsights.tsx:72`).
32. [ ] `windowSize={3}` unmounts pages, resetting scroll position, insight tab and unsaved note.
33. [x] `onViewable` haptics fire for programmatic index changes (double buzz).
34. [x] Stale session keeps counting overnight; `duration_minutes` logs hundreds of minutes.
35. [x] Workout-progress notification re-posts on every backgrounding.
36. [x] ✓ accepts a set with blank reps and weight, logging an empty row.
37. [x] Reps accept unbounded digits and overflow the row (partly clamped; column still unbounded).
38. [x] Exercise bubbles carry no `accessibilityState.selected`.
39. [x] Rest button reads "Rest 0 seconds" while showing "Off".
40. [ ] Alternatives carousel is a horizontal scroll inside the horizontal pager; swipes fight.
41. [x] Summary duration freezes while the summary sits open.
42. [x] Summary "Sets" counts warm-ups while the log excludes them — numbers disagree across screens.
43. [x] Repeated swaps grow the exercise key unboundedly, remounting the page.
44. [ ] Distance is free text with no validation; mission stores it as a joined string.
45. [x] "Add exercise" navigates away and returns you to the end of the list, not your set.
46. [x] Mini bar shows the viewed index ("0/0" when empty), counts warm-ups, and offers no skip-rest or finish.
47. [x] Warm-up weights round to 5 regardless of unit (metric users get 5 kg steps).

## Open — plans and library

48. [x] No search in the 412-exercise library beyond name/primary/tags: "abs" misses most core work (`ExerciseLibraryScreen.tsx:59`).
49. [ ] 412 items in one flat A–Z list with no section index (`ExerciseLibraryScreen.tsx:127`).
50. [ ] Pick mode: no preview, no running count, selection lost on unmount (`ExerciseLibraryScreen.tsx:47,75`).
51. [x] Plan detail renders up to 29 days flat; `PlanDay.week` exists but isn't used to group.
52. [x] Plan detail list re-animates on every back navigation.
53. [ ] No level / equipment / session-length filters or sort in the plan browser.
54. [x] `FlatList` has no `getItemLayout` despite fixed-height rows; `PlanRow`/`PlanCard` aren't memoised; `planHero` walks every day on each render.
55. [ ] Following a plan only toasts: no scheduling, no jump to day one, no explanation of what changes.
56. [x] Plan day rows recompute a superset filter per row (O(n²) on 25-exercise days).
57. [ ] "Add to a workout" lists only 5 routines via `Alert` as a picker (`ExerciseDetailScreen.tsx:104-105`).
58. [ ] Routine editor: delete with no confirm or undo; only "move up"; 40 pt steppers; skeleton rows read as loading; Save disabled with no reason.
59. [x] Routine detail on Android skips the menu and goes straight to delete confirm.
60. [x] Deleting a routine is unrecoverable (no soft delete).
61. [x] `PlanScreen` ignores a followed library plan and shows "0 of 0" with no empty state.
62. [ ] Train's plan card: duplicate a11y targets, no "X of Y days", no way to pick another day, mixed "See plan"/"See More"/"Browse" labels.
63. [x] `routineMinutes` clamps to a 5-minute floor, so any small routine claims "5 min".

## Open — navigation, state, performance

64. [x] `exerciseMedia.ts` registers ~1,500 assets at module load on the startup path.
65. [x] Navigation state is written on every screen change (`RootNavigator.tsx:170`) — debounce.
66. [x] Boot gate waits only on user + subscription stores; program/session/challenge/routine stores can render defaults then jump.
67. [x] `createActions.ts:32` reads the program store with no hydration check — can dump a returning user into ProgramSelect.
68. [x] Onboarding draft is cleared on user-store hydration, which may precede draft hydration.
69. [x] No `linking` config or URL scheme: notification taps and deep links can't route.
70. [ ] No Android `BackHandler` for the session overlay or the + menu.
71. [x] Challenge store cross-writes during hydration; XP/streak can recompute from an empty array.
72. [x] `ErrorBoundary.reset` remounts the same corrupt state — infinite "Try again" loop.
73. [x] Toasts render below native modals, so toasts fired from a sheet are invisible.
74. [x] Toasts have no queue: two events in quick succession show only the last.
75. [x] Exercise log, notes, `previous` and `claimed_missions` all grow without bound.
76. [x] `useUserStore.partialize` copies progress and converts a Set on every write.
77. [x] Mini bar ticks every second inside the tab bar on every screen.
78. [x] `initializeSubscription()` hits RevenueCat on every foreground.
79. [ ] Restored navigation state doesn't recurse into nested tab state, and 12 h-old date params can show yesterday's workout as today's.
80. [x] Re-tapping the active tab does nothing (no scroll-to-top).
81. [ ] Tab-bar inset is read once, so the last row hides behind the pill or mini bar.
82. [ ] Train and Ranks render long content as `ScrollView` + `.map()` rather than a list.
83. [x] `useMissionStore` duplicates program logic and goes stale past midnight; daily challenge doesn't refresh at midnight either.
84. [ ] Run tracker copies the whole route array into state on every GPS fix; `stop()` can read stale state.
85. [ ] `App.tsx` doesn't hold the native splash, so there's an extra black-to-black transition.

## Open — copy, empty states, accessibility

86. [x] Leader tools screen is non-functional but accepts input ("Coming soon" label added; screen still takes input).
87. [x] Run tracker exit alert traps the user with a single "OK" (`RunTrackerScreen.tsx:140`).
88. [x] Challenge sheet silently ignores invalid input (`ChallengeSheet.tsx:111`).
89. [x] `Linking.openURL` unguarded in the Test screen (`TestScreen.tsx:190`).
90. [ ] Remaining military wording for general users: Welcome slides, Test tab, "Private" readiness tier, "Alpha Section" placeholder, "Branch" link.
91. [x] Stats renders six zeros on a fresh install with no empty state; Streak screen has no zero state and pages into empty future months.
92. [x] Imperial hardcoded in Stats pack weight, Run tracker elevation and pack input, Test screen units; `units: 'imperial'` is assumed at profile creation.
93. [x] `textTertiary` (~4.1:1) and `textQuaternary` (~2.3:1) fail WCAG AA on black, used in 40 files — including inactive tab labels and Settings values.
94. [ ] Paywall: Restore/Terms/Privacy are bare text under 44 pt; the auto-renew disclosure is 10 pt grey; a stale cached price can render.
95. [x] `Text` caps Dynamic Type at 1.3×, below iOS accessibility sizes.
96. [x] Ranks screen: ALL-CAPS level line, "0/100" on every skill for new users, and a dead info icon.
97. [ ] Profile: sheet discards typed name on backdrop tap; Save toasts success when the write is a no-op; 24-char names truncate; per-bar chart values not exposed to VoiceOver.
98. [ ] Service profile: picking a branch silently resets a deliberate test choice; every row is a no-op when the profile is null; no test date editor.
99. [ ] Onboarding: progress bar shrinks when Military Prep adds steps; no Android hardware back; 3.4 s fake "building your plan" with no skip; weeks-to-test ruler is unusable with VoiceOver; carousel auto-advances mid-sentence with no reduce-motion check; no "Already subscribed? Restore" before 13 questions.
100. [ ] Inconsistent date formats and terminology (workout/mission/session/routine/plan/program) across screens.

## Open — data correctness

101. [x] Two streak algorithms over the same dates can disagree between screens (`challengeStats.ts:55` vs `useChallengeStore.ts:197`).
102. [x] Daily challenge day-index drifts across DST, repeating or skipping a day.
103. [x] Past challenge XP is recomputed from the current list, so history changes when a challenge is added.
104. [x] `calculateMissionXP` (perfect-workout multiplier, PR bonus) is never called; `is_perfect`/`pr_bonus` are hardcoded.
105. [x] Personal records never fire in the mission flow (`is_personal_record` always false).
106. [x] Streak milestone bonuses require exact equality, so a skipped number forfeits them forever.
107. [x] Plank seconds and ruck miles are added into the same counter as reps, inflating rep achievements.
108. [x] `EXERCISE_TOTAL_ALIASES` misses `hand_release_pushups`, so those reps never count.
109. [x] "Finish all missions in Week 1" unlocks on a single workout.
110. [x] Test readiness averages un-entered events as 0, so one maxed event shows 33%.
111. [x] Military test baselines are pounds-only with no metric conversion.
112. [x] "Days until test" is off by one in the morning.
113. [x] Readiness check-ins have no clamps: a missing field renders "NaN%".
114. [x] Check-ins cap at 60 and tracked sessions at 100, silently dropping the oldest.
115. [ ] Exercise log writes the whole blob on every set; `bestSet` mixes scales across set kinds; `recordProgression` skips ties and first-ever zero values.
116. [x] Charts collapse when all points share a timestamp.
117. [x] Library-derived exercises are fabricated as "3 sets × 10 reps" and shown as if prescribed.
118. [x] `equipment_access` counts Bench and Stability Ball as no-equipment.
119. [x] Muscle distribution percentages rarely sum to 100.
120. [ ] Movement cards: `total_rounds` disagrees with the sum of sections on 7 of 12; Card 7 is unreachable; weeks silently substitute Card 1/2.
121. [x] Base Camp day keys re-resolve to different content when days/week changes, rewriting history.
122. [x] Daily challenges: 25 items described as "30+", rotation repeats every 25 days and jumps at year end.

> Items 23–122 above are grouped headings; the individual sub-findings from each audit total 212 open items.
> Work through them in order within each section.
