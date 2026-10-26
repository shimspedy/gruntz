import type { ProgramId, UserProfile, WorkoutDay } from '../types';
import { BASE_CAMP_TOTAL_WEEKS, getBaseCampWeek, getBaseCampWorkoutDay, getBaseCampWorkoutForDate } from './baseCampWorkouts';
import { getReconWeek, getReconWorkoutDay } from './reconWorkouts';
import { getWorkoutDay, getWorkoutDaysForWeek, REST_DAYS, TOTAL_WEEKS as RAIDER_TOTAL_WEEKS } from './workouts';
import { getExerciseById } from './exercises';
import { matchesTrainingFocus, prioritizeWorkout, type TrainingFocus } from '../features/trainingFocus';

const RECON_TOTAL_WEEKS = 12;

export function getProgramMaxWeek(programId: ProgramId | null): number {
  switch (programId) {
    case 'basecamp':
      return BASE_CAMP_TOTAL_WEEKS;
    case 'recon':
      return RECON_TOTAL_WEEKS;
    case 'raider':
    default:
      return RAIDER_TOTAL_WEEKS;
  }
}

export function getProgramWeek(programId: ProgramId, week: number, profile?: UserProfile | null): WorkoutDay[] {
  switch (programId) {
    case 'basecamp':
      return getBaseCampWeek(week, profile);
    case 'recon':
      return getReconWeek(week);
    case 'raider':
    default:
      return getWorkoutDaysForWeek(week);
  }
}

export function getProgramWorkoutDay(
  programId: ProgramId | null,
  workoutId: string,
  profile?: UserProfile | null,
): WorkoutDay | undefined {
  switch (programId) {
    case 'basecamp':
      return getBaseCampWorkoutDay(workoutId, profile);
    case 'recon':
      return getReconWorkoutDay(workoutId);
    case 'raider':
      return getWorkoutDay(workoutId);
    default:
      return undefined;
  }
}

export function getProgramWorkoutForDate(
  programId: ProgramId,
  week: number,
  date: Date,
  profile?: UserProfile | null,
): WorkoutDay | null {
  if (programId === 'basecamp') {
    return getBaseCampWorkoutForDate(week, date, profile);
  }

  if (programId === 'recon') {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      return null;
    }

    return getReconWeek(week).find((day) => day.day === dayOfWeek) ?? null;
  }

  const dayOfWeek = date.getDay();
  if (REST_DAYS.includes(dayOfWeek)) {
    return null;
  }

  const dayMap: Record<number, number> = { 1: 1, 2: 2, 4: 4, 5: 5, 6: 6 };
  const targetDay = dayMap[dayOfWeek];
  if (!targetDay) {
    return null;
  }

  const weekDays = getWorkoutDaysForWeek(week);
  return weekDays.find((day) => day.day === targetDay) ?? weekDays[0] ?? null;
}

export function getNextProgramWorkout(
  programId: ProgramId,
  week: number,
  date: Date,
  profile?: UserProfile | null,
): WorkoutDay | null {
  for (let offset = 1; offset <= 6; offset++) {
    const future = new Date(date);
    future.setDate(date.getDate() + offset);
    const workout = getProgramWorkoutForDate(programId, week, future, profile);
    if (workout) {
      return workout;
    }
  }

  return null;
}

/** Choose an authored mission containing the athlete's priority event support work. */
export function getFocusedProgramWorkout(
  programId: ProgramId,
  week: number,
  profile: UserProfile | null | undefined,
  focus: TrainingFocus,
): WorkoutDay | null {
  const ranked = getProgramWeek(programId, week, profile).map((day) => ({
    day,
    matches: day.sections.filter((section) => section.type !== 'warmup' && section.type !== 'recovery').reduce((sum, section) => sum + section.exercises.filter((id) => {
      const exercise = getExerciseById(id);
      return !!exercise && matchesTrainingFocus(exercise, focus);
    }).length, 0),
  })).filter((entry) => entry.matches > 0).sort((a, b) => b.matches - a.matches || a.day.day - b.day.day);
  return ranked[0] ? prioritizeWorkout(ranked[0].day, focus, getExerciseById) : null;
}
