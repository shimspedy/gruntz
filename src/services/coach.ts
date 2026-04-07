import { UserProgress } from '../types';

export interface CoachInsight {
  icon: string;
  title: string;
  message: string;
  type: 'tip' | 'motivation' | 'warning' | 'celebration';
}

/** Generate multiple coach insights based on user data */
export function getCoachInsights(progress: UserProgress): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday

  // Streak-based
  if (progress.streak_days >= 30) {
    insights.push({
      icon: 'achievement',
      title: 'LEGENDARY STREAK',
      message: `${progress.streak_days} days straight. You're in the top tier.`,
      type: 'celebration',
    });
  } else if (progress.streak_days >= 14) {
    insights.push({
      icon: 'streak',
      title: 'ON FIRE',
      message: `${progress.streak_days}-day streak. Keep this momentum — it's building real results.`,
      type: 'motivation',
    });
  } else if (progress.streak_days >= 3) {
    insights.push({
      icon: 'progress',
      title: 'BUILDING MOMENTUM',
      message: `${progress.streak_days} days in. Consistency beats intensity.`,
      type: 'motivation',
    });
  } else if (progress.streak_days === 0 && progress.workouts_completed > 0) {
    insights.push({
      icon: 'warning',
      title: 'STREAK AT RISK',
      message: 'Get a mission in today to keep your streak alive.',
      type: 'warning',
    });
  }

  // Strength vs endurance imbalance
  const scoreDelta = progress.strength_score - progress.endurance_score;
  if (Math.abs(scoreDelta) > 20) {
    if (scoreDelta > 0) {
      insights.push({
        icon: 'run',
        title: 'ENDURANCE GAP',
        message: 'Your cardio is falling behind strength. Prioritize running and rowing days.',
        type: 'tip',
      });
    } else {
      insights.push({
        icon: 'strength',
        title: 'STRENGTH GAP',
        message: 'Push harder on calisthenics. Increase sets or slow down the reps.',
        type: 'tip',
      });
    }
  }

  // Weekly workout patterns
  const recentWeeks = progress.weekly_workouts.slice(-4);
  if (recentWeeks.length >= 2) {
    const lastWeek = recentWeeks[recentWeeks.length - 1] ?? 0;
    const prevWeek = recentWeeks[recentWeeks.length - 2] ?? 0;
    if (lastWeek > prevWeek && prevWeek > 0) {
      insights.push({
        icon: 'stats',
        title: 'VOLUME UP',
        message: `${lastWeek} sessions last week vs ${prevWeek} the week before. Great trend.`,
        type: 'celebration',
      });
    } else if (lastWeek < prevWeek && prevWeek > 0) {
      insights.push({
        icon: 'progress',
        title: 'VOLUME DIP',
        message: `Last week was ${lastWeek} sessions vs ${prevWeek}. Aim to match or beat this week.`,
        type: 'warning',
      });
    }
  }

  // Recovery advice on rest days (Sunday / Wednesday)
  if (dayOfWeek === 0 || dayOfWeek === 3) {
    insights.push({
      icon: 'recovery',
      title: 'RECOVERY CHECK',
      message: 'Hydrate, stretch, foam roll. Recovery is where gains happen.',
      type: 'tip',
    });
  }

  // Milestone celebrations
  const milestones = [10, 25, 50, 100, 200, 500];
  for (const m of milestones) {
    if (progress.workouts_completed === m) {
      insights.push({
        icon: 'rank',
        title: `${m} MISSIONS COMPLETE`,
        message: `You've hit a major milestone. Not many make it this far.`,
        type: 'celebration',
      });
      break;
    }
  }

  // Rep milestones
  const repMilestones = [500, 1000, 5000, 10000, 25000];
  for (const m of repMilestones) {
    if (progress.total_reps >= m && progress.total_reps < m * 1.1) {
      insights.push({
        icon: 'stats',
        title: `${m.toLocaleString()}+ REPS`,
        message: 'Your total volume is stacking up. Serious work.',
        type: 'celebration',
      });
      break;
    }
  }

  // Level-based coaching
  if (progress.current_level <= 3) {
    insights.push({
      icon: 'target',
      title: 'EARLY FOCUS',
      message: 'Nail your form first. Speed and weight come later.',
      type: 'tip',
    });
  } else if (progress.current_level >= 10) {
    insights.push({
      icon: 'level',
      title: 'ADVANCED TRAINING',
      message: 'Time to push progressive overload. Add reps or slow the eccentric.',
      type: 'tip',
    });
  }

  // Consistency score feedback
  if (progress.consistency_score >= 80) {
      insights.push({
        icon: 'rank',
      title: 'ELITE CONSISTENCY',
      message: `${progress.consistency_score}% consistency. You're operating at an elite level.`,
      type: 'celebration',
    });
  } else if (progress.consistency_score < 40 && progress.workouts_completed > 3) {
      insights.push({
        icon: 'time',
      title: 'SCHEDULE IT',
      message: 'Set a fixed training time. Treat it like a formation — non-negotiable.',
      type: 'tip',
    });
  }

  // Always return at least one
  if (insights.length === 0) {
    insights.push({
      icon: 'target',
      title: 'STAY THE COURSE',
      message: 'Every rep counts. Show up tomorrow and you win.',
      type: 'motivation',
    });
  }

  return insights;
}

/** Get a single rotating insight that changes each time the screen loads */
export function getRotatingInsight(progress: UserProgress): CoachInsight {
  const insights = getCoachInsights(progress);
  return insights[Math.floor(Math.random() * insights.length)];
}

/** Get the top 3 most relevant insights */
export function getTopInsights(progress: UserProgress): CoachInsight[] {
  const all = getCoachInsights(progress);
  // Priority: warning > tip > motivation > celebration
  const priority: Record<CoachInsight['type'], number> = {
    warning: 0,
    tip: 1,
    motivation: 2,
    celebration: 3,
  };
  all.sort((a, b) => priority[a.type] - priority[b.type]);
  return all.slice(0, 3);
}

/** Generate a weekly summary string */
export function getWeeklySummary(progress: UserProgress): string {
  const recentWeek = progress.weekly_workouts[progress.weekly_workouts.length - 1] ?? 0;
  const totalXP = progress.current_xp;
  const level = progress.current_level;

  const lines: string[] = [];
  lines.push(`Level ${level} · ${totalXP.toLocaleString()} XP`);
  lines.push(`${recentWeek} workouts this week`);
  lines.push(`${progress.streak_days}-day streak`);

  if (progress.strength_score > 0 || progress.endurance_score > 0) {
    lines.push(`STR ${progress.strength_score} · END ${progress.endurance_score}`);
  }

  return lines.join('\n');
}
