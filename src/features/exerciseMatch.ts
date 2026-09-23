import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

/**
 * Map a name from another app onto a Gruntz library exercise.
 *
 * Strong writes `Squat (Barbell)`; Gruntz calls the same movement `Barbell Squat`.
 * The words match, the order does not, so this compares token sets rather than
 * strings, and weighs the equipment in the parentheses — without it,
 * `Standing Calf Raise (Dumbbell)` matches the Machine variant just as well as the
 * Dumbbell one, and the athlete's history lands on the wrong exercise.
 *
 * Some movements genuinely have no equivalent: the library has no Ab Wheel and no
 * leg raise at all. Those must come back `null` rather than being forced onto the
 * nearest thing — a wrong match is worse than an honest gap, because it silently
 * corrupts history the athlete is trying to preserve.
 */

const STOP_WORDS = new Set(['the', 'a', 'of', 'with', 'and', 'or']);

/** Vocabulary differences between apps, not synonyms in general. */
const ALIASES: Record<string, string> = {
  bb: 'barbell',
  db: 'dumbbell',
  kb: 'kettlebell',
  ohp: 'overhead',
  bw: 'bodyweight',
  machines: 'machine',
  cables: 'cable',
  dumbbells: 'dumbbell',
  barbells: 'barbell',
  raises: 'raise',
  curls: 'curl',
  presses: 'press',
  rows: 'row',
  squats: 'squat',
  extensions: 'extension',
  flyes: 'fly',
  flys: 'fly',
};

/**
 * Muscle names that other apps put in a title and Gruntz leaves out.
 *
 * "Bicep Curl (Dumbbell)" is Gruntz's "Dumbbell Curl": the movement word already
 * implies the muscle. Requiring "bicep" to appear dropped one of the most common
 * lifts there is. These do not count against coverage when missing, but still count
 * toward it when present, so they can break a tie without being able to veto.
 *
 * Position and stance words — standing, seated, incline, decline — are deliberately
 * NOT here. Those change the exercise.
 */
const OPTIONAL_QUALIFIERS = new Set([
  'bicep', 'biceps', 'tricep', 'triceps', 'quad', 'quads', 'quadricep', 'quadriceps',
  'glute', 'glutes', 'hamstring', 'hamstrings', 'pec', 'pecs', 'delt', 'delts',
  'lat', 'lats', 'trap', 'traps', 'calf', 'calves', 'ab', 'abs', 'abdominal',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map((word) => ALIASES[word] ?? word);
}

/** `Squat (Barbell)` -> base `Squat`, equipment `Barbell`. */
export function splitForeignName(name: string): { base: string; equipment: string } {
  const match = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(name.trim());
  if (!match) return { base: name.trim(), equipment: '' };
  return { base: match[1]!.trim(), equipment: match[2]!.trim() };
}

export type ExerciseMatch = {
  key: string;
  name: string;
  score: number;
};

type IndexedExercise = { key: string; name: string; tokens: Set<string>; equipment: Set<string> };
let index: IndexedExercise[] | null = null;

function getIndex(): IndexedExercise[] {
  if (index) return index;
  index = EXERCISE_LIBRARY.map((item) => ({
    key: item.key,
    name: item.name,
    tokens: new Set(tokenize(item.name)),
    equipment: new Set((item.equipment ?? []).flatMap((e) => tokenize(e))),
  }));
  return index;
}

/**
 * Below this, a match is a guess rather than a recognition.
 *
 * Tuned against a real Strong export: the five movements with a genuine equivalent
 * score 0.78 and above, and the two with none (Ab Wheel, Flat Leg Raise) score well
 * below. Lowering it to "rescue" those two would map them onto unrelated exercises.
 */
export const MATCH_THRESHOLD = 0.72;

export function matchExercise(foreignName: string): ExerciseMatch | null {
  const { base, equipment } = splitForeignName(foreignName);
  const baseTokens = tokenize(base);
  const equipTokens = tokenize(equipment);
  if (!baseTokens.length) return null;

  const wanted = new Set([...baseTokens, ...equipTokens]);
  let best: ExerciseMatch | null = null;

  for (const candidate of getIndex()) {
    if (!candidate.tokens.size) continue;

    let shared = 0;
    for (const token of wanted) if (candidate.tokens.has(token)) shared += 1;
    if (!shared) continue;

    // Every *essential* word of the movement has to be present, so "Squat" does not
    // match "Barbell Split Squat" as readily as "Barbell Squat". Muscle names are
    // not essential — they are what the two apps disagree about.
    const essential = baseTokens.filter((t) => !OPTIONAL_QUALIFIERS.has(t));
    const required = essential.length ? essential : baseTokens;
    const covered = required.filter((t) => candidate.tokens.has(t)).length / required.length;
    const bonus = baseTokens.length > required.length
      ? baseTokens.filter((t) => OPTIONAL_QUALIFIERS.has(t) && candidate.tokens.has(t)).length
        / (baseTokens.length - required.length)
      : 0;
    const baseCovered = Math.min(1, covered + bonus * 0.05);
    const union = new Set([...wanted, ...candidate.tokens]).size;
    const overlap = shared / union;

    // Equipment is a tie-breaker between variants of one movement, which is exactly
    // where the wrong answer is most tempting and most damaging.
    let equipmentFit = 0;
    if (equipTokens.length) {
      const inName = equipTokens.filter((t) => candidate.tokens.has(t)).length;
      const inEquipment = equipTokens.filter((t) => candidate.equipment.has(t)).length;
      equipmentFit = Math.min(1, (inName + inEquipment) / equipTokens.length);
    }

    const score = equipTokens.length
      ? baseCovered * 0.55 + overlap * 0.2 + equipmentFit * 0.25
      : baseCovered * 0.7 + overlap * 0.3;

    if (!best || score > best.score) best = { key: candidate.key, name: candidate.name, score };
  }

  return best && best.score >= MATCH_THRESHOLD ? best : null;
}
