/**
 * Daily Challenge system with 30+ rotating challenges
 * Challenges rotate based on the day of the year
 */

export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'reps' | 'time' | 'distance';
  target: number;
  unit: string;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  muscleGroups: string[];
}

const challenges: DailyChallenge[] = [
  // Reps-based challenges
  {
    id: 'pushup_100',
    name: '100 Push-Up Challenge',
    description: 'Complete 100 total pushups in any number of sets.',
    icon: 'pushup',
    type: 'reps',
    target: 100,
    unit: 'reps',
    xpReward: 150,
    difficulty: 'medium',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
  },
  {
    id: 'pullup_50',
    name: '50 Pull-Up Challenge',
    description: 'Complete 50 total pull-ups.',
    icon: 'pullup',
    type: 'reps',
    target: 50,
    unit: 'reps',
    xpReward: 200,
    difficulty: 'hard',
    muscleGroups: ['biceps', 'back', 'shoulders'],
  },
  {
    id: 'squat_200',
    name: '200 Bodyweight Squats',
    description: 'Complete 200 bodyweight squats in any form.',
    icon: 'squat',
    type: 'reps',
    target: 200,
    unit: 'reps',
    xpReward: 150,
    difficulty: 'medium',
    muscleGroups: ['quads', 'hamstrings', 'glutes'],
  },
  {
    id: 'burpee_50',
    name: '50 Burpee Blitz',
    description: '50 full burpees. Your heart will thank you.',
    icon: 'burpee',
    type: 'reps',
    target: 50,
    unit: 'reps',
    xpReward: 200,
    difficulty: 'hard',
    muscleGroups: ['chest', 'core', 'legs', 'arms'],
  },
  {
    id: 'situp_150',
    name: '150 Sit-Up Grind',
    description: 'Complete 150 sit-ups to strengthen your core.',
    icon: 'situp',
    type: 'reps',
    target: 150,
    unit: 'reps',
    xpReward: 120,
    difficulty: 'medium',
    muscleGroups: ['core'],
  },
  {
    id: 'lunge_100',
    name: '100 Walking Lunges',
    description: '100 lunges (50 per leg) for leg strength.',
    icon: 'lunge',
    type: 'reps',
    target: 100,
    unit: 'reps',
    xpReward: 140,
    difficulty: 'medium',
    muscleGroups: ['quads', 'hamstrings', 'glutes'],
  },
  {
    id: 'dip_75',
    name: '75 Dips Challenge',
    description: 'Complete 75 dips on parallel bars or bench.',
    icon: 'dip',
    type: 'reps',
    target: 75,
    unit: 'reps',
    xpReward: 180,
    difficulty: 'hard',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
  },
  {
    id: 'crunch_200',
    name: '200 Crunches',
    description: 'Target those abs with 200 crunches.',
    icon: 'crunch',
    type: 'reps',
    target: 200,
    unit: 'reps',
    xpReward: 100,
    difficulty: 'easy',
    muscleGroups: ['core'],
  },
  {
    id: 'mountain_climber_500',
    name: '500 Mountain Climbers',
    description: '500 mountain climber reps. Full body cardio.',
    icon: 'climbing',
    type: 'reps',
    target: 500,
    unit: 'reps',
    xpReward: 160,
    difficulty: 'medium',
    muscleGroups: ['core', 'chest', 'cardio'],
  },
  {
    id: 'jump_squat_100',
    name: '100 Jump Squats',
    description: 'Explosive jump squats for power and conditioning.',
    icon: 'squat',
    type: 'reps',
    target: 100,
    unit: 'reps',
    xpReward: 140,
    difficulty: 'medium',
    muscleGroups: ['quads', 'hamstrings', 'glutes', 'cardio'],
  },

  // Time-based challenges
  {
    id: 'plank_5min',
    name: '5-Minute Plank Hold',
    description: 'Hold a plank position for 5 minutes straight.',
    icon: 'plank',
    type: 'time',
    target: 300,
    unit: 'seconds',
    xpReward: 200,
    difficulty: 'hard',
    muscleGroups: ['core', 'shoulders'],
  },
  {
    id: 'wall_sit_3min',
    name: '3-Minute Wall Sit',
    description: 'Hold a wall sit for 3 minutes.',
    icon: 'wall_sit',
    type: 'time',
    target: 180,
    unit: 'seconds',
    xpReward: 150,
    difficulty: 'hard',
    muscleGroups: ['quads', 'glutes'],
  },
  {
    id: 'hollow_hold_2min',
    name: '2-Minute Hollow Body Hold',
    description: 'Maintain a hollow body position for 2 minutes.',
    icon: 'hollow_hold',
    type: 'time',
    target: 120,
    unit: 'seconds',
    xpReward: 130,
    difficulty: 'medium',
    muscleGroups: ['core', 'shoulders'],
  },
  {
    id: 'amrap_20',
    name: '20-Minute AMRAP',
    description: 'As many rounds as possible in 20 minutes. (Your choice of workout)',
    icon: 'timer',
    type: 'time',
    target: 1200,
    unit: 'seconds',
    xpReward: 250,
    difficulty: 'hard',
    muscleGroups: ['full_body'],
  },
  {
    id: 'tabata_16min',
    name: '16-Minute Tabata Session',
    description: '4 rounds of Tabata (20s hard, 10s rest) x 4 exercises.',
    icon: 'timer',
    type: 'time',
    target: 960,
    unit: 'seconds',
    xpReward: 180,
    difficulty: 'hard',
    muscleGroups: ['full_body'],
  },
  {
    id: 'emom_10',
    name: '10-Minute EMOM',
    description: 'Every minute on the minute - pick your exercise.',
    icon: 'timer',
    type: 'time',
    target: 600,
    unit: 'seconds',
    xpReward: 140,
    difficulty: 'medium',
    muscleGroups: ['full_body'],
  },

  // Distance-based challenges
  {
    id: 'run_5k',
    name: '5K Run Challenge',
    description: 'Run 5 kilometers as fast as you can.',
    icon: 'running',
    type: 'distance',
    target: 5,
    unit: 'km',
    xpReward: 220,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'legs'],
  },
  {
    id: 'run_10k',
    name: '10K Endurance Run',
    description: 'Complete a 10-kilometer run.',
    icon: 'running',
    type: 'distance',
    target: 10,
    unit: 'km',
    xpReward: 300,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'legs'],
  },
  {
    id: 'ruck_3mi',
    name: '3-Mile Ruck',
    description: 'Ruck 3 miles with weight. Build mental toughness.',
    icon: 'ruck',
    type: 'distance',
    target: 3,
    unit: 'miles',
    xpReward: 250,
    difficulty: 'hard',
    muscleGroups: ['legs', 'core', 'cardio'],
  },
  {
    id: 'sprint_1mi',
    name: '1-Mile Sprint',
    description: 'Go all-out for a 1-mile sprint.',
    icon: 'running',
    type: 'distance',
    target: 1,
    unit: 'miles',
    xpReward: 200,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'legs'],
  },
  {
    id: 'run_2mi',
    name: '2-Mile Run',
    description: 'Run 2 miles - solid training distance.',
    icon: 'running',
    type: 'distance',
    target: 2,
    unit: 'miles',
    xpReward: 160,
    difficulty: 'medium',
    muscleGroups: ['cardio', 'legs'],
  },
  {
    id: 'swim_1mi',
    name: '1-Mile Swim',
    description: 'Complete a 1-mile swim - full body conditioning.',
    icon: 'swimming',
    type: 'distance',
    target: 1,
    unit: 'miles',
    xpReward: 280,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'full_body'],
  },
  {
    id: 'swim_40min',
    name: '40-Minute Swim',
    description: 'Continuous swimming for 40 minutes.',
    icon: 'swimming',
    type: 'distance',
    target: 40,
    unit: 'minutes',
    xpReward: 240,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'full_body'],
  },

  // Specialty challenges
  {
    id: 'handstand_3min',
    name: '3-Minute Handstand Challenge',
    description: 'Total accumulated handstand time of 3 minutes.',
    icon: 'handstand',
    type: 'time',
    target: 180,
    unit: 'seconds',
    xpReward: 220,
    difficulty: 'hard',
    muscleGroups: ['shoulders', 'core', 'arms'],
  },
  {
    id: 'l_sit_1min',
    name: '1-Minute L-Sit Challenge',
    description: 'Hold an L-sit position for 1 minute total.',
    icon: 'lsit',
    type: 'time',
    target: 60,
    unit: 'seconds',
    xpReward: 180,
    difficulty: 'hard',
    muscleGroups: ['core', 'arms', 'shoulders'],
  },
];

/**
 * Get today's daily challenge based on the current date
 */
export function getTodaysChallenge(): DailyChallenge {
  const now = new Date();
  return getChallengeForDate(now);
}

/**
 * Get the daily challenge for a specific date
 * Uses day-of-year modulo to rotate through challenges
 */
export function getChallengeForDate(date: Date): DailyChallenge {
  // Calculate day of year (0-365)
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Get challenge index from day of year
  const index = dayOfYear % challenges.length;
  return challenges[index];
}

/**
 * Get all available challenges (useful for UI displays)
 */
export function getAllChallenges(): DailyChallenge[] {
  return [...challenges];
}

export function formatChallengeAmount(
  value: number,
  challenge: Pick<DailyChallenge, 'type' | 'unit'>
): string {
  if (challenge.unit === 'seconds') {
    const totalSeconds = Math.max(0, Math.round(value));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0 && seconds > 0) {
      return `${minutes}m ${seconds}s`;
    }

    if (minutes > 0) {
      return `${minutes}m`;
    }

    return `${totalSeconds}s`;
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
}
