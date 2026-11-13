/**
 * The line a finished workout posts to the athlete's private teams when they have
 * switched that on. Plain text, so it is an ordinary chat message: no new message
 * type, nothing for an older build to misread.
 */
export function workoutAnnouncement(input: { title: string; minutes: number; sets: number; personalRecords: number }): string | null {
  const title = input.title.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (!title || !(input.sets > 0)) return null;
  const parts = [`Finished ${title}`];
  const minutes = Math.round(input.minutes);
  if (Number.isFinite(minutes) && minutes > 0) parts.push(`${minutes} min`);
  parts.push(`${input.sets} ${input.sets === 1 ? 'set' : 'sets'}`);
  if (input.personalRecords > 0) parts.push(`${input.personalRecords} ${input.personalRecords === 1 ? 'record' : 'records'}`);
  return parts.join(' · ');
}
