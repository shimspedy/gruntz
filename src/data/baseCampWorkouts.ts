import type { UserProfile, WorkoutDay } from '../types';

export const BASE_CAMP_TOTAL_WEEKS = 8;

export type BaseCampReadiness = 'foundation' | 'standard' | 'accelerated';

const BASE_CAMP_DAY_MAPS: Record<number, Record<number, number>> = {
  3: { 1: 1, 3: 2, 5: 3 },
  4: { 1: 1, 2: 2, 4: 3, 6: 4 },
  5: { 1: 1, 2: 2, 3: 3, 5: 4, 6: 5 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hasLimitation(profile: UserProfile | null | undefined, key: string) {
  return profile?.movement_limitations?.includes(key) === true;
}

function wantsGoal(profile: UserProfile | null | undefined, text: string) {
  return profile?.goals?.some((goal) => goal.toLowerCase().includes(text.toLowerCase())) === true;
}

export function getBaseCampTrainingDays(profile?: UserProfile | null): number {
  return clamp(profile?.workout_days_per_week ?? 4, 3, 5);
}

export function getBaseCampReadiness(profile?: UserProfile | null): BaseCampReadiness {
  if (!profile) {
    return 'standard';
  }

  const safetyFirst =
    profile.fitness_level === 'beginner' ||
    profile.preferred_intensity === 'low' ||
    profile.age_range === '60_plus' ||
    hasLimitation(profile, 'low_impact') ||
    hasLimitation(profile, 'joint_concerns') ||
    hasLimitation(profile, 'returning_after_break') ||
    profile.workout_days_per_week <= 3;

  if (safetyFirst) {
    return 'foundation';
  }

  if (
    profile.fitness_level === 'advanced' &&
    profile.preferred_intensity === 'high' &&
    profile.workout_days_per_week >= 5
  ) {
    return 'accelerated';
  }

  return 'standard';
}

export function getBaseCampDayNumberForWeekday(dayOfWeek: number, profile?: UserProfile | null): number | null {
  const trainingDays = getBaseCampTrainingDays(profile);
  return BASE_CAMP_DAY_MAPS[trainingDays][dayOfWeek] ?? null;
}

export function getBaseCampWorkoutForDate(week: number, date: Date, profile?: UserProfile | null): WorkoutDay | null {
  const dayNumber = getBaseCampDayNumberForWeekday(date.getDay(), profile);
  return dayNumber ? buildBaseCampWorkoutDay(week, dayNumber, profile) : null;
}

export function getBaseCampWeek(week: number, profile?: UserProfile | null): WorkoutDay[] {
  const trainingDays = getBaseCampTrainingDays(profile);
  return Array.from({ length: trainingDays }, (_, index) =>
    buildBaseCampWorkoutDay(week, index + 1, profile),
  );
}

export function getBaseCampWorkoutDay(id: string, profile?: UserProfile | null): WorkoutDay | undefined {
  const match = id.match(/^basecamp_w(\d+)d(\d+)$/);
  if (!match) {
    return undefined;
  }

  return buildBaseCampWorkoutDay(Number(match[1]), Number(match[2]), profile);
}

function buildBaseCampWorkoutDay(weekInput: number, dayInput: number, profile?: UserProfile | null): WorkoutDay {
  const week = clamp(Number.isFinite(weekInput) ? Math.trunc(weekInput) : 1, 1, BASE_CAMP_TOTAL_WEEKS);
  const maxDays = getBaseCampTrainingDays(profile);
  const day = clamp(Number.isFinite(dayInput) ? Math.trunc(dayInput) : 1, 1, maxDays);
  const readiness = getBaseCampReadiness(profile);
  const sessionMinutes = profile?.preferred_session_minutes
    ? clamp(profile.preferred_session_minutes, 20, 60)
    : readiness === 'foundation'
      ? 25
      : readiness === 'accelerated'
        ? 45
        : 35;
  const baseXP = readiness === 'foundation' ? 55 : readiness === 'accelerated' ? 95 : 75;
  const rewardXP = baseXP + week * 5 + day * 3;

  const workout = getDayTemplate(day, week, readiness, profile);

  return {
    id: `basecamp_w${week}d${day}`,
    week,
    day,
    title: workout.title,
    objective: workout.objective,
    estimated_duration: sessionMinutes,
    sections: workout.sections,
    rewards: {
      xp: rewardXP,
      coins: Math.round(rewardXP / 6),
    },
  };
}

function getDayTemplate(
  day: number,
  week: number,
  readiness: BaseCampReadiness,
  profile?: UserProfile | null,
): Pick<WorkoutDay, 'title' | 'objective' | 'sections'> {
  const warmup = getWarmup(readiness);
  const recovery = getRecovery(readiness);

  switch (day) {
    case 1:
      return {
        title: 'Foundation Strength',
        objective: getObjective(readiness, 'Build full-body strength with clean, repeatable movement.'),
        sections: [
          buildSection('warmup', week, day, 'Warm-Up', 'Move easy and check how your body feels today.', warmup),
          buildSection('workout', week, day, 'Strength Base', getStrengthInstructions(readiness), getStrengthBlock(readiness, 'push')),
          buildSection('cardio', week, day, 'Easy Aerobic Finish', 'Keep this conversational. Stop before joint pain changes your stride.', [getWalkExercise(week, readiness)]),
          buildSection('recovery', week, day, 'Mobility Downshift', 'Finish calm. Breathe slow and restore range of motion.', recovery),
        ],
      };
    case 2:
      return {
        title: wantsGoal(profile, 'endurance') ? 'Endurance Builder' : 'Steady Conditioning',
        objective: getObjective(readiness, 'Build your walking base and core control without chasing max intensity.'),
        sections: [
          buildSection('warmup', week, day, 'Warm-Up', 'Raise temperature without rushing.', warmup),
          buildSection('cardio', week, day, 'Conditioning', getConditioningInstructions(readiness), [getConditioningExercise(week, readiness, profile)]),
          buildSection('workout', week, day, 'Core Control', 'Move slowly and keep breathing under control.', getCoreBlock(readiness)),
          buildSection('recovery', week, day, 'Balance + Mobility', 'Use support as needed. The goal is control, not difficulty.', ['base_single_leg_balance', 'base_mobility_flow']),
        ],
      };
    case 3:
      return {
        title: 'Durability Circuit',
        objective: getObjective(readiness, 'Strengthen legs, hips, core, and shoulders for better daily capacity.'),
        sections: [
          buildSection('warmup', week, day, 'Warm-Up', 'Prime hips, shoulders, and trunk.', warmup),
          buildSection('workout', week, day, 'Durability Work', getStrengthInstructions(readiness), getStrengthBlock(readiness, 'legs')),
          buildSection('cardio', week, day, 'Short Walk', 'Finish with easy movement. Keep it relaxed.', [week >= 5 && readiness !== 'foundation' ? 'base_walk_20min' : 'base_walk_10min']),
          buildSection('recovery', week, day, 'Recovery Flow', 'No painful ranges. Leave feeling better than you started.', recovery),
        ],
      };
    case 4:
      return {
        title: wantsGoal(profile, 'strong') ? 'Strength Endurance' : 'Aerobic Base',
        objective: getObjective(readiness, 'Extend your session just enough to improve capacity while preserving recovery.'),
        sections: [
          buildSection('warmup', week, day, 'Warm-Up', 'Start smooth and controlled.', warmup),
          buildSection('cardio', week, day, 'Base Builder', 'Stay in a pace you could repeat tomorrow.', [getLongConditioningExercise(week, readiness, profile)]),
          buildSection('workout', week, day, 'Support Strength', 'Use controlled reps and stop one or two reps before form breaks.', getSupportStrengthBlock(readiness)),
          buildSection('recovery', week, day, 'Mobility Downshift', 'Restore hips, calves, and shoulders.', recovery),
        ],
      };
    default:
      return {
        title: profile?.has_ruck_access && readiness !== 'foundation' ? 'Pack Walk Base' : 'Total Body Builder',
        objective: getObjective(readiness, 'Bridge basic fitness toward harder missions with a controlled total-body day.'),
        sections: [
          buildSection('warmup', week, day, 'Warm-Up', 'Check your joints before adding intensity.', warmup),
          buildSection(
            profile?.has_ruck_access && readiness !== 'foundation' ? 'ruck' : 'cardio',
            week,
            day,
            profile?.has_ruck_access && readiness !== 'foundation' ? 'Light Pack Walk' : 'Steady Walk',
            'This is not a test. Keep the pace controlled and stop before form breaks.',
            [profile?.has_ruck_access && readiness !== 'foundation' ? 'base_light_ruck_walk' : getWalkExercise(week, readiness)],
          ),
          buildSection('workout', week, day, 'Total Body Strength', getStrengthInstructions(readiness), getTotalBodyBlock(readiness)),
          buildSection('recovery', week, day, 'Recovery Flow', 'Downshift and leave something in the tank.', recovery),
        ],
      };
  }
}

function buildSection(
  type: WorkoutDay['sections'][number]['type'],
  week: number,
  day: number,
  title: string,
  instructions: string,
  exercises: string[],
): WorkoutDay['sections'][number] {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  return {
    id: `base_w${week}d${day}_${slug}`,
    type,
    title,
    instructions,
    exercises,
  };
}

function getWarmup(readiness: BaseCampReadiness): string[] {
  if (readiness === 'foundation') {
    return ['base_march_in_place', 'base_arm_circles', 'base_single_leg_balance'];
  }

  return ['base_march_in_place', 'base_arm_circles', 'worlds_greatest_stretch'];
}

function getRecovery(readiness: BaseCampReadiness): string[] {
  return readiness === 'accelerated'
    ? ['base_mobility_flow', 'ais_calf', 'ais_hamstring']
    : ['base_mobility_flow'];
}

function getStrengthBlock(readiness: BaseCampReadiness, focus: 'push' | 'legs'): string[] {
  if (readiness === 'foundation') {
    return focus === 'push'
      ? ['base_wall_pushups', 'base_chair_squats', 'base_dead_bug', 'base_glute_bridge']
      : ['base_chair_squats', 'base_glute_bridge', 'base_dead_bug', 'base_single_leg_balance'];
  }

  if (readiness === 'accelerated') {
    return focus === 'push'
      ? ['pushups', 'air_squats', 'forward_plank', 'base_low_stepups']
      : ['air_squats', 'walking_lunges', 'forward_plank', 'base_low_stepups'];
  }

  return focus === 'push'
    ? ['base_incline_pushups', 'base_chair_squats', 'base_dead_bug', 'base_low_stepups']
    : ['base_chair_squats', 'base_low_stepups', 'base_glute_bridge', 'base_dead_bug'];
}

function getSupportStrengthBlock(readiness: BaseCampReadiness): string[] {
  if (readiness === 'foundation') {
    return ['base_wall_pushups', 'base_glute_bridge', 'base_dead_bug'];
  }

  if (readiness === 'accelerated') {
    return ['pushups', 'air_squats', 'mountain_climbers'];
  }

  return ['base_incline_pushups', 'base_low_stepups', 'base_dead_bug'];
}

function getTotalBodyBlock(readiness: BaseCampReadiness): string[] {
  if (readiness === 'foundation') {
    return ['base_chair_squats', 'base_wall_pushups', 'base_glute_bridge', 'base_dead_bug'];
  }

  if (readiness === 'accelerated') {
    return ['pushups', 'air_squats', 'walking_lunges', 'forward_plank'];
  }

  return ['base_incline_pushups', 'base_chair_squats', 'base_low_stepups', 'base_dead_bug'];
}

function getCoreBlock(readiness: BaseCampReadiness): string[] {
  if (readiness === 'accelerated') {
    return ['forward_plank', 'side_plank', 'mountain_climbers'];
  }

  return readiness === 'foundation'
    ? ['base_dead_bug', 'base_glute_bridge']
    : ['base_dead_bug', 'forward_plank', 'base_glute_bridge'];
}

function getWalkExercise(week: number, readiness: BaseCampReadiness): string {
  if (readiness === 'foundation') {
    return week >= 5 ? 'base_walk_20min' : 'base_walk_10min';
  }

  return week >= 6 ? 'base_walk_30min' : 'base_walk_20min';
}

function getConditioningExercise(week: number, readiness: BaseCampReadiness, profile?: UserProfile | null): string {
  if (profile?.has_ruck_access && readiness === 'accelerated' && week >= 4) {
    return 'base_light_ruck_walk';
  }

  if (readiness === 'accelerated' || (readiness === 'standard' && profile?.preferred_intensity === 'high' && week >= 5)) {
    return 'base_walk_jog_intervals';
  }

  return getWalkExercise(week, readiness);
}

function getLongConditioningExercise(week: number, readiness: BaseCampReadiness, profile?: UserProfile | null): string {
  if (profile?.has_ruck_access && readiness !== 'foundation' && week >= 6) {
    return 'base_light_ruck_walk';
  }

  return getWalkExercise(week + 1, readiness);
}

function getStrengthInstructions(readiness: BaseCampReadiness): string {
  if (readiness === 'foundation') {
    return 'Use easy reps. Pause before form gets shaky and use support whenever needed.';
  }

  if (readiness === 'accelerated') {
    return 'Work at a steady pace. Keep one or two reps in reserve on every movement.';
  }

  return 'Controlled reps, clean breathing, and no max-effort sets.';
}

function getConditioningInstructions(readiness: BaseCampReadiness): string {
  if (readiness === 'accelerated') {
    return 'Use a strong but controlled pace. You should still finish with good mechanics.';
  }

  return 'Keep this easy enough to repeat. Some activity beats chasing intensity.';
}

function getObjective(readiness: BaseCampReadiness, objective: string): string {
  const prefix =
    readiness === 'foundation'
      ? 'Foundation track:'
      : readiness === 'accelerated'
        ? 'Accelerated track:'
        : 'Standard track:';

  return `${prefix} ${objective}`;
}
