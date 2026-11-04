import { useCallback, useMemo } from 'react';
import { achievements } from '../data/achievements';
import { challengeMode, formatChallengeAmount, getChallengeTemplateForDate, scaleChallenge, type DailyChallenge } from '../data/dailyChallenges';
import { challengeScale, useChallengeStore } from '../store/useChallengeStore';
import { useUserStore } from '../store/useUserStore';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { getLocalDateKey } from '../utils/dateKey';

export { challengeMode, type ChallengeMode } from '../data/dailyChallenges';

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

/**
 * Today's challenge at the athlete's scale, plus progress, with the reward side
 * effects wired in one place. `target` is the personal number; `fullTarget` is the
 * unscaled one a bonus is paid for.
 */
export function useDailyChallenge() {
  const progressRaw = useChallengeStore((s) => s.currentProgress);
  const activeDate = useChallengeStore((s) => s.activeDate);
  const completedDates = useChallengeStore((s) => s.completedDates);
  const bonusDates = useChallengeStore((s) => s.bonusDates);
  const todayCompletedFlag = useChallengeStore((s) => s.todayCompleted);
  const scaleByMode = useChallengeStore((s) => s.scaleByMode);
  const addProgress = useChallengeStore((s) => s.addProgress);
  const complete = useChallengeStore((s) => s.completeChallenge);
  const level = useUserStore((s) => s.profile?.fitness_level);

  const key = getLocalDateKey();
  const template = getChallengeTemplateForDate(new Date());
  const scale = challengeScale(scaleByMode, challengeMode(template), level);
  const challenge = useMemo(() => scaleChallenge(template, scale), [template, scale]);

  const done = completedDates.includes(key) || (activeDate === key && todayCompletedFlag);
  const bonusDone = bonusDates.includes(key);
  const hasBonus = challenge.bonusXp > 0 && challenge.fullTarget > challenge.target;
  const logged = activeDate === key ? progressRaw : 0;
  // Progress never reads below a state that has already been reached.
  const progress = Math.min(challenge.fullTarget, bonusDone ? challenge.fullTarget : done ? Math.max(logged, challenge.target) : logged);
  const ratio = challenge.target > 0 ? Math.min(1, progress / challenge.target) : 0;
  const bonusRatio = hasBonus ? Math.min(1, progress / challenge.fullTarget) : ratio;

  const celebrate = useCallback((ids: string[]) => {
    haptic.success();
    const unlocked = ids.map((id) => achievements.find((x) => x.id === id)).filter(Boolean);
    if (unlocked.length) setTimeout(() => toast(`Achievement unlocked · ${unlocked[0]!.name}`, { icon: 'trophy' }), 2900);
  }, []);

  const add = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      haptic.selection();
      const r = addProgress(amount, challenge);
      if (r.completedNow || r.bonusNow) celebrate(r.unlockedAchievementIds);
    },
    [addProgress, challenge, celebrate],
  );

  const markComplete = useCallback(() => {
    const r = complete(challenge);
    if (r.completedNow) celebrate(r.unlockedAchievementIds);
  }, [complete, challenge, celebrate]);

  return {
    challenge,
    progress,
    ratio,
    bonusRatio,
    done,
    hasBonus,
    bonusDone,
    remaining: Math.max(0, challenge.target - progress),
    bonusRemaining: hasBonus ? Math.max(0, challenge.fullTarget - progress) : 0,
    add,
    markComplete,
  };
}
