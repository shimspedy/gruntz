import type { ActivityType } from '../types/activity';
import type { TrackedSession } from '../store/useReadinessStore';

export type ActivityUnits = 'metric' | 'imperial';
export const activityLabel = (type: ActivityType) => ({ run: 'Run', ruck: 'Ruck', hike: 'Hike' })[type];
export const activityAccent = (type: ActivityType) => type === 'run' ? '#A8F16A' : type === 'ruck' ? '#55B8FF' : '#FFC879';
const safe = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;

export function activityDistance(miles: number, units: ActivityUnits) {
  return { value: (safe(miles) * (units === 'metric' ? 1.609344 : 1)).toFixed(2), unit: units === 'metric' ? 'km' : 'mi' };
}

export function activityDuration(seconds: number) {
  const total = Math.round(safe(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

export function activityPace(session: Pick<TrackedSession, 'distanceMiles' | 'durationSeconds'>, units: ActivityUnits) {
  const distance = safe(session.distanceMiles) * (units === 'metric' ? 1.609344 : 1);
  return { value: distance > 0 && safe(session.durationSeconds) > 0 ? activityDuration(session.durationSeconds / distance) : '—', unit: units === 'metric' ? '/km' : '/mi' };
}

export function activityAscent(feet: number, units: ActivityUnits) {
  return `${Math.round(safe(feet) * (units === 'metric' ? 0.3048 : 1)).toLocaleString()} ${units === 'metric' ? 'm' : 'ft'}`;
}

/** A legacy YYYY-MM-DD is a local calendar date, not midnight UTC. */
export function activityDate(session: Pick<TrackedSession, 'date' | 'startedAt'>) {
  if (session.startedAt) {
    const started = new Date(session.startedAt);
    if (Number.isFinite(started.getTime())) return started;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(session.date);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
  }
  const date = new Date(session.date);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function activityDateLabel(session: Pick<TrackedSession, 'date' | 'startedAt'>, long = false) {
  return activityDate(session)?.toLocaleDateString(undefined, {
    month: long ? 'long' : 'short', day: 'numeric', year: 'numeric',
  }) ?? 'Date unavailable';
}

export function sortActivities(sessions: TrackedSession[]) {
  return [...sessions].sort((a, b) => (activityDate(b)?.getTime() ?? 0) - (activityDate(a)?.getTime() ?? 0));
}

export function activityTotals(sessions: TrackedSession[]) {
  return sessions.reduce((total, session) => ({
    count: total.count + 1,
    distanceMiles: total.distanceMiles + safe(session.distanceMiles),
    durationSeconds: total.durationSeconds + safe(session.durationSeconds),
    elevationFeet: total.elevationFeet + safe(session.elevationFeet),
  }), { count: 0, distanceMiles: 0, durationSeconds: 0, elevationFeet: 0 });
}
