# Import & export

Gruntz reads and writes **Strong's workout CSV**. Strong's export is the de-facto
interchange format for lifting apps, so an athlete arriving from Strong can bring
their history, and one leaving Gruntz can take it with them.

Reached from **Profile → Import & export**. Nothing about it is required to train.

## The format

One row per **set**, with the workout's identity repeated on every row:

```
Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
2026-09-22 12:25:05,Push Day,,Barbell Squat,1,25,5,,,,,
```

Two traps in it, both handled in `src/features/strongCsv.ts`:

- **`Set Order` is not always a number.** A row with `Rest Timer` there is not a set —
  it carries that exercise's configured rest in `Seconds`. Parsing it as a set invents
  a 0-rep set nobody performed.
- **Names and notes contain commas.** Splitting on `,` shifts every later column, so
  reps land in the distance field instead of failing loudly. The parser is quote-aware.

## Import

Deliberately **two-phase**. Picking a file only *reads* it; nothing is written until
the athlete has seen the plan and accepted it.

1. `pickImportFile()` — pick, parse, and match every exercise name against the
   library. Returns an `ImportPlan`. **No writes.**
2. The screen shows the plan: how many workouts, over what span, which exercises are
   **coming in** (and what they'll be saved as), and which are **staying behind**.
3. `applyImport(plan, unit)` — builds entries and writes them in one store call.

### Unit

A Strong CSV has **no unit column**. The athlete picks lb or kg on the review screen,
defaulted from their profile setting. This is prominent because getting it wrong
silently corrupts every weight in their history.

### Matching

`src/features/exerciseMatch.ts` compares *token sets*, not strings: Strong writes
`Squat (Barbell)`, Gruntz calls it `Barbell Squat`. Equipment in the parentheses is
weighed separately, because without it `Standing Calf Raise (Dumbbell)` matches the
Machine variant just as well as a dumbbell one.

Below `MATCH_THRESHOLD` (0.72) nothing is written. **A wrong match is worse than an
honest gap** — it silently corrupts the history someone is trying to preserve, and
the athlete has no way to know. Against the reference export:

| Source name | Result |
|---|---|
| `Squat (Barbell)` | → Barbell Squat |
| `Overhead Press (Barbell)` | → Barbell Overhead Press |
| `Deadlift (Barbell)` | → Barbell Deadlift |
| `Leg Extension (Machine)` | → Machine Leg Extension |
| `Flat Leg Raise` | no equivalent — the library has no leg raise |
| `Ab Wheel` | no equivalent |
| `Standing Calf Raise (Dumbbell)` | no equivalent — the library has single-leg and machine calf raises, which are different lifts under different loads |

Unmatched exercises are **not** written under an invented key. The exercise log is
only ever read *by* library key (`logs[logKey]` in `ExerciseProgress.tsx`); nothing
enumerates it. An invented key would store data no screen can display and no UI can
delete — invisible, unreachable ghost history.

### Re-importing

Entry ids are `strong:<ISO instant>:<library key>`. The instant is normalised, so a
`Date` cell written `09:05` and one written `09:05:00` are the same workout rather
than two. The store dedupes on id, so importing the same file twice adds nothing
instead of doubling someone's history.

## Export

`exportWorkouts({ includeNotes, unit })` writes a CSV to the cache directory and
opens the iOS share sheet. The file is named `gruntz_workouts_<date>_<unit>.csv` —
the unit is in the name because the format has nowhere else to put it.

Every entry logged at the same instant belongs to one workout (that is how
`useSessionStore.finish()` writes them), so grouping on the timestamp reassembles
sessions without Gruntz having to store a session id.

Weights are converted to a single chosen unit, so one numeric column never means two
different things in one file.

A Gruntz → Gruntz round trip is lossless for matched exercises: the export writes
Gruntz's own exercise names, which always re-match.

## What is deliberately left empty

Strong's format has columns Gruntz has no data for. They are written **empty rather
than guessed**, and the screen says so:

| Column | Why |
|---|---|
| `Duration` | Session duration is shown on the summary screen and never persisted. |
| `Workout Notes` | Gruntz has per-exercise notes, not per-workout ones. |
| `RPE` | Not collected. |

Strong's own export sheet offers an **Include Rest Timers** toggle. Gruntz does not,
because the log stores no per-exercise rest — a toggle that did nothing would be
exactly the kind of decoration the 2026-09-22 audit removed everywhere else.
**Include Notes** is offered, because `useExerciseNotesStore` is real.

## Caps

The log's ceilings still apply on import (300 entries per exercise, 400 tracked
exercises). `mergeLogs` applies them once for the whole batch, and **every number the
UI shows is counted after they have been applied**.

This matters more than it sounds. A five-year Strong export can hold 450 sessions of
squats; only 300 are kept. Reporting the attempted figure told that athlete *"1,800
sets imported"* when 1,200 were stored — a 33% overstatement, on exactly the user the
feature exists for.

The caps evict the **oldest**, so an import of data newer than what is already logged
deletes existing entries. That is the long-standing policy, but during normal training
it is reached one session at a time and nobody notices; an import can cross it in one
batch. So it is surfaced twice:

- **Before** committing, `estimateCapPressure()` warns on the review screen that the
  file goes past the ceiling and the oldest sessions will be dropped — while there is
  still a Cancel button.
- **After**, `ImportResult.droppedSets` and `.evictedEntries` report what actually
  went, including history that was already on the phone.

`mergeLogs` is a pure function (`src/store/useExerciseLogStore.ts`) rather than store
internals precisely so these counts can be tested directly.

## Known limitation

The parser splits on newlines before parsing quotes, so it is not RFC-4180 complete:
a newline *inside* a quoted field starts a new record. Strong does not produce these —
workout and exercise names are single-line — and when it does happen the affected rows
are counted in `skippedLines` and shown on the review screen rather than being dropped
in silence. Worth fixing; not worth destabilising the parser for right before a
release.
