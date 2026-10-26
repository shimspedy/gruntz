import { getLocalDateKey } from '../utils/dateKey';

/** A recap belongs to the delivered week even if it is opened after Monday. */
export function resolveNotificationLink(data: Record<string, unknown> | undefined, deliveredAt: number | undefined): string | null {
  const url = data?.url;
  if (typeof url !== 'string') return null;
  if (data?.type !== 'weekly-recap') return url;
  // Expo 57 forwards seconds on iOS and milliseconds on Android.
  const millis = typeof deliveredAt === 'number' && Number.isFinite(deliveredAt)
    ? deliveredAt < 1e12 ? deliveredAt * 1000 : deliveredAt : NaN;
  const date = new Date(millis);
  if (!Number.isFinite(date.getTime())) return 'gruntz://weekly-debrief';
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `gruntz://weekly-debrief?weekStart=${getLocalDateKey(date)}`;
}
