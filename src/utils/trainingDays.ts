/**
 * Which weekdays an athlete is scheduled to train.
 *
 * Reminders used to fire seven days a week whatever the athlete answered, because
 * `scheduleDailyReminder` accepted a `weekdays` argument that no caller passed —
 * so a 3-day-a-week athlete was nagged on all four rest days, which is how an app
 * gets its notifications switched off.
 *
 * The 3/4/5 rows are the same spreads `BASE_CAMP_DAY_MAPS` already uses, so a Base
 * Camp athlete is reminded on exactly the days their program actually programs.
 * The rest follow the same principle: start Monday, spread the load, keep Sunday
 * free until someone genuinely trains six or seven days.
 */
const WEEKDAYS_BY_COUNT: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** JavaScript weekday indexes (0 = Sunday), as `Date.getDay()` reports them. */
export function trainingWeekdays(daysPerWeek: number | null | undefined): number[] {
  const count = Math.max(1, Math.min(7, Math.round(daysPerWeek ?? 3)));
  return WEEKDAYS_BY_COUNT[count] ?? WEEKDAYS_BY_COUNT[3]!;
}

/**
 * The same days as expo-notifications weekday numbers, where 1 = Sunday.
 *
 * Off by one from `Date.getDay()`, which is exactly the kind of mismatch that
 * silently reminds people on the wrong day, so the conversion lives here once.
 */
export function notificationWeekdays(daysPerWeek: number | null | undefined): number[] {
  return trainingWeekdays(daysPerWeek).map((day) => day + 1);
}
