import { getProgramWorkoutForDate } from '../data/programWorkouts';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useProgramStore } from '../store/useProgramStore';
import { useUserStore } from '../store/useUserStore';
import type { ProgramId, UserProfile } from '../types';
import type { TrainingSchedule } from '../utils/trainingDays';

/**
 * The weekdays a program actually programs in a given week (0 = Sunday), or null when
 * it programs none. Read from the same lookup the Train tab uses, so a reminder can
 * never land on a day the program rests.
 */
export function programWeekdays(program: ProgramId, week: number, profile?: UserProfile | null): number[] | null {
  const days: number[] = [];
  for (let weekday = 0; weekday < 7; weekday += 1) {
    // Any date with this weekday will do: 4 January 1970 was a Sunday.
    const date = new Date(1970, 0, 4 + weekday, 12);
    if (getProgramWorkoutForDate(program, week, date, profile)) days.push(weekday);
  }
  return days.length ? days : null;
}

/**
 * When this athlete trains. Following a built-in program, that is the program's own
 * days: a generic spread for "5 days a week" reminded a Raider athlete on Wednesday,
 * which Raider rests, and never on Thursday, which it trains. On a library plan or
 * with no program there is no fixed calendar, so the stated days-per-week decides.
 */
export function scheduleFor(input: {
  program: ProgramId | null | undefined;
  week: number;
  profile: UserProfile | null | undefined;
  onLibraryPlan: boolean;
}): TrainingSchedule {
  if (input.program && !input.onLibraryPlan) {
    const days = programWeekdays(input.program, input.week, input.profile);
    if (days) return days;
  }
  return input.profile?.workout_days_per_week;
}

/** `scheduleFor` read from the live stores, for code that is not rendering. */
export function currentSchedule(profile: UserProfile | null | undefined = useUserStore.getState().profile): TrainingSchedule {
  const { selectedProgram, currentWeek } = useProgramStore.getState();
  return scheduleFor({ program: selectedProgram, week: currentWeek, profile, onLibraryPlan: !!usePlanLibraryStore.getState().activePlanId });
}
