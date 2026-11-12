const DAY_MS = 24 * 60 * 60 * 1000;

function pad(part: number) {
  return String(part).padStart(2, '0');
}

export function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseLocalDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  // `new Date` rolls impossible dates forward (Feb 31 becomes Mar 3); those are not keys.
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day ? parsed : null;
}

export function getLocalDayDiffFromToday(dateKey: string, today = new Date()) {
  const parsed = parseLocalDateKey(dateKey);
  if (!parsed) {
    return Number.POSITIVE_INFINITY;
  }

  const startOfToday = parseLocalDateKey(getLocalDateKey(today));
  if (!startOfToday) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.round((startOfToday.getTime() - parsed.getTime()) / DAY_MS);
}
