import { getLocalDateKey } from '../utils/dateKey';

/** A recap belongs to the delivered week even if it is opened after Monday. */
export function resolveNotificationLink(data: Record<string, unknown> | undefined, deliveredAt: number | undefined): string | null {
  const url = data?.url;
  // Only the app's own links are routed, whatever a notification payload carries.
  if (typeof url !== 'string' || !url.startsWith('gruntz://')) return null;
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
