/** "12 minutes ago", "yesterday": how long since an ISO date or timestamp, for status lines. */
export function relativeTime(when: string | number): string {
  const diff = Date.now() - new Date(when).getTime();
  if (!Number.isFinite(diff) || diff < 0) return 'just now';
  const minutes = Math.round(diff / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
