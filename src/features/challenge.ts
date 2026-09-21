import { useCallback } from 'react';
import { achievements } from '../data/achievements';
import { formatChallengeAmount, getTodaysChallenge, type DailyChallenge } from '../data/dailyChallenges';
import { useChallengeStore } from '../store/useChallengeStore';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { getLocalDateKey } from '../utils/dateKey';

export type ChallengeMode = 'reps' | 'time' | 'distance';

export function challengeMode(c: DailyChallenge): ChallengeMode {
  if (c.unit === 'seconds' || c.unit === 'minutes' || c.type === 'time') return 'time';
  if (c.unit === 'km' || c.unit === 'miles' || c.type === 'distance') return 'distance';
  return 'reps';
}

const roundToStep = (v: number, step: number) => (step <= 0 ? v : Math.max(step, Math.round(v / step) * step));

export function quickAdds(c: DailyChallenge, remaining: number): number[] {
  const mode = challengeMode(c);
  const t = c.target;
  let options: number[];
  if (mode === 'distance') {
    const step = t >= 5 ? 0.5 : 0.25;
    options = [step, roundToStep(t * 0.25, step), roundToStep(t * 0.5, step)];
  } else if (mode === 'time') {
    if (c.unit === 'minutes') options = [5, 10, 15];
    else {
      const step = t >= 300 ? 60 : 30;
      options = [step, roundToStep(t * 0.25, step), roundToStep(t * 0.5, step)];
    }
  } else {
    const step = t >= 100 ? 10 : t >= 40 ? 5 : 1;
    options = [step, roundToStep(t * 0.25, step), roundToStep(t * 0.5, step)];
  }
  const filtered = Array.from(new Set(options.map((v) => Math.round(v * 100) / 100).filter((v) => v > 0 && v <= remaining))).sort(
    (a, b) => a - b,
  );
  if (filtered.length || remaining <= 0) return filtered;
  return [Math.round(Math.min(remaining, t) * 100) / 100];
}

export function formatAmount(value: number, c: DailyChallenge) {
  return c.unit === 'seconds' ? formatChallengeAmount(value, c) : `${formatChallengeAmount(value, c)} ${c.unit}`;
}

export function formatQuick(value: number, c: DailyChallenge) {
  return c.unit === 'seconds' ? formatChallengeAmount(value, c) : `+${formatChallengeAmount(value, c)}`;
}

/** Today's challenge plus progress, with the reward side effects wired in one place. */
export function useDailyChallenge() {
  const challenge = getTodaysChallenge();
  const progressRaw = useChallengeStore((s) => s.currentProgress);
  const activeDate = useChallengeStore((s) => s.activeDate);
  const completedDates = useChallengeStore((s) => s.completedDates);
  const todayCompletedFlag = useChallengeStore((s) => s.todayCompleted);
  const addProgress = useChallengeStore((s) => s.addProgress);
  const complete = useChallengeStore((s) => s.completeChallenge);

  const key = getLocalDateKey();
  const done = completedDates.includes(key) || (activeDate === key && todayCompletedFlag);
  const progress = done ? challenge.target : activeDate === key ? Math.min(progressRaw, challenge.target) : 0;
  const ratio = challenge.target > 0 ? progress / challenge.target : 0;

  const celebrate = useCallback((ids: string[]) => {
    haptic.success();
    const unlocked = ids.map((id) => achievements.find((x) => x.id === id)).filter(Boolean);
    if (unlocked.length) setTimeout(() => toast(`Achievement unlocked · ${unlocked[0]!.name}`, { icon: 'trophy' }), 2900);
  }, [challenge.xpReward]);

  const add = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      haptic.selection();
      const r = addProgress(amount, challenge);
      if (r.completedNow) celebrate(r.unlockedAchievementIds);
    },
    [addProgress, challenge, celebrate],
  );

  const markComplete = useCallback(() => {
    const r = complete(challenge);
    if (r.completedNow) celebrate(r.unlockedAchievementIds);
  }, [complete, challenge, celebrate]);

  return { challenge, progress, ratio, done, remaining: Math.max(0, challenge.target - progress), add, markComplete };
}
