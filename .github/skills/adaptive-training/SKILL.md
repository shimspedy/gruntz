---
name: adaptive-training
description: "Implement adaptive training logic that adjusts workouts based on user performance. Use when: adjusting difficulty, handling missed days, scaling exercises, recommending recovery, calculating fitness scores, implementing smart coach suggestions."
---

# Adaptive Training Logic

## When to Use
- Adjusting next mission based on user history
- Handling missed workout days
- Scaling exercise difficulty up or down
- Recommending recovery or lighter sessions
- Calculating skill category scores
- Generating coach insights and recommendations

## Adaptation Rules

### Missed Days
- 1 missed day: No adjustment, continue as planned
- 2 consecutive missed days: Reduce next mission volume by 15%
- 3+ consecutive missed days: Reduce volume by 25%, add extra warmup
- 7+ missed days: Suggest a "restart" mission (lighter than where they left off)

### Performance-Based Scaling
- User consistently completes all reps with "easy" rating → increase reps by 10-20% next week
- User fails to complete target reps → reduce by 10% and add form emphasis
- User beats time targets by >15% → suggest harder time target
- User reports high soreness → recommend recovery day

### Recovery Recommendations
```typescript
function shouldRecommendRecovery(progress: UserProgress): boolean {
  const recentWorkouts = getWorkoutsInLastNDays(progress, 3);
  const avgIntensity = calculateAverageIntensity(recentWorkouts);
  const reportedSoreness = progress.lastSorenessRating;
  return (recentWorkouts.length >= 3 && avgIntensity > 0.8) || reportedSoreness >= 4;
}
```

## Skill Category Scores (0-100)
| Category | Inputs |
|----------|--------|
| Strength | Push-ups, pull-ups, squats completed vs targets |
| Endurance | Run times, swim times, ruck times vs benchmarks |
| Stamina | Workout completion %, sustained performance over weeks |
| Mobility | Movement prep completion, recovery session adherence |
| Consistency | Streak length, weekly completion rate |
| Recovery | Recovery session completion, rest day adherence |

### Score Formula
```typescript
function calculateCategoryScore(category: string, progress: UserProgress): number {
  // Compare user's metrics to benchmark targets for their current week
  // Score = (actual / target) * 100, capped at 100
  // Weight recent performance more heavily (exponential moving average)
}
```

## Coach Messages
Generate contextual messages based on:
1. **Progress trends** — "Your plank time improved 20% this week!"
2. **Weakness identification** — "Upper-body pulling is lagging. Focus on pull-up progressions."
3. **Motivation** — "You're on a 7-day streak! Keep the momentum."
4. **Recovery nudges** — "You've trained hard 3 days straight. Consider active recovery today."
5. **Milestone celebration** — "You just hit Operator rank! New gear unlocked."

## Implementation Location
- Pure logic functions: `/src/utils/adaptive.ts`
- Coach message generation: `/src/features/coach/`
- Skill score calculation: `/src/utils/scoring.ts`

## Anti-patterns
- Don't reduce difficulty too aggressively — users should still feel challenged
- Don't make all recommendations negative — celebrate wins first
- Don't adjust mid-workout — only between sessions
- Don't override user choice — suggest, don't force
