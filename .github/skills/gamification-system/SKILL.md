---
name: gamification-system
description: "Implement XP, leveling, ranks, streaks, achievements, and rewards. Use when: calculating XP, updating levels, checking rank thresholds, awarding achievements, tracking streaks, designing progression curves, implementing reward logic."
---

# Gamification System

## When to Use
- Implementing or modifying XP calculations
- Adding new achievements or badges
- Updating level/rank thresholds
- Building streak logic
- Designing reward flows (mission complete, PR, milestone)
- Creating challenge reward systems

## XP Calculation (Pure Functions in `/src/utils/xp.ts`)

### XP Sources
| Source | XP Range | Notes |
|--------|----------|-------|
| Exercise completion | 5-30 XP | Based on `exercise.xp_value` |
| Mission completion bonus | 50-150 XP | Based on mission difficulty |
| Perfect completion (all exercises) | +50% bonus | Multiplier on mission XP |
| Personal record | 25-100 XP | Based on category |
| Streak milestone (3,7,14,30 days) | 10 × streak_day | At milestone days only |
| Weekly mission pack complete | 250 XP | All 5-6 missions in a week |
| Challenge completion | 50-500 XP | Based on challenge difficulty |

### XP Formula
```typescript
function calculateMissionXP(mission: CompletedMission): number {
  let xp = mission.exercises.reduce((sum, ex) => sum + ex.xp_value, 0);
  xp += mission.completionBonus; // 50-150 based on difficulty
  if (mission.isPerfect) xp = Math.floor(xp * 1.5);
  if (mission.hasPersonalRecord) xp += mission.prBonus;
  return xp;
}
```

## Leveling System
Cumulative XP thresholds with scaling curve:
```typescript
function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}
// Level 1: 0, Level 2: 100, Level 3: 283, Level 4: 520, Level 5: 800...
```

## Rank System
| Rank | Levels | Unlock |
|------|--------|--------|
| Recruit | 1-4 | Start |
| Cadet | 5-9 | Basic avatar gear |
| Operator | 10-19 | Tactical gear |
| Veteran | 20-29 | Advanced cosmetics |
| Elite | 30-39 | Elite badge + gear |
| Shadow | 40-49 | Exclusive cosmetics |
| Apex | 50+ | Legendary status |

```typescript
function getRank(level: number): Rank {
  if (level >= 50) return 'Apex';
  if (level >= 40) return 'Shadow';
  if (level >= 30) return 'Elite';
  if (level >= 20) return 'Veteran';
  if (level >= 10) return 'Operator';
  if (level >= 5) return 'Cadet';
  return 'Recruit';
}
```

## Streak Logic
- Streak increments when user completes at least 1 mission per day
- Streak resets to 0 if a full calendar day is missed
- Rest days count toward streak if scheduled
- Streak milestones: 3, 7, 14, 21, 30, 60, 100 days

## Achievement System
Achievements are unlocked by checking conditions after each mission completion:
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (progress: UserProgress) => boolean;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at?: string;
}
```

### Core Achievements
- First Mission Completed
- 3/7/14/30-Day Streak
- First 1000 XP
- First Personal Record
- Completed Week 1-10
- Completed 10-Week Program
- 100/500/1000 Push-ups Total
- 10/50/100 Miles Run
- Each rank reached

## Anti-patterns
- Don't calculate XP on the client and trust it — validate server-side for premium features
- Don't allow negative XP
- Don't reset XP on level up (cumulative system)
- Don't make levels too easy early or too hard late — use the power curve
- Don't award streak bonus every day — only at milestones
