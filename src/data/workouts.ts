import { WorkoutDay } from '../types';

export const week1Days: WorkoutDay[] = [
  {
    id: 'week1_day1',
    week: 1,
    day: 1,
    title: 'Foundation Core Mission',
    objective: 'Build core stability and upper-body endurance',
    estimated_duration: 35,
    sections: [
      {
        id: 'w1d1_warmup',
        type: 'warmup',
        title: 'Movement Prep',
        instructions: 'Prepare the body for training with controlled movements.',
        exercises: ['hip_bridge', 'bird_dog', 'frog_squat'],
      },
      {
        id: 'w1d1_work',
        type: 'workout',
        title: 'Core & Calisthenics',
        instructions: 'Complete all sets with good form. Rest between sets.',
        exercises: ['pushup_standard', 'front_plank', 'flutter_kicks', 'squat_bodyweight'],
      },
      {
        id: 'w1d1_recovery',
        type: 'recovery',
        title: 'Cool Down',
        instructions: 'Stretch major muscle groups used during the workout.',
        exercises: ['hamstring_stretch', 'hip_flexor_stretch'],
      },
    ],
    rewards: { xp: 120, coins: 20 },
  },
  {
    id: 'week1_day2',
    week: 1,
    day: 2,
    title: 'Endurance Ignition',
    objective: 'Build aerobic base and lower-body stamina',
    estimated_duration: 40,
    sections: [
      {
        id: 'w1d2_warmup',
        type: 'warmup',
        title: 'Movement Prep',
        instructions: 'Dynamic warmup to prepare for running and lower-body work.',
        exercises: ['leg_swings', 'arm_circles', 'inchworm'],
      },
      {
        id: 'w1d2_cardio',
        type: 'cardio',
        title: 'Run Session',
        instructions: 'Run at a comfortable pace. Focus on breathing and form.',
        exercises: ['easy_run_1mi'],
      },
      {
        id: 'w1d2_work',
        type: 'workout',
        title: 'Lower Body Strength',
        instructions: 'Build lower body power with controlled movements.',
        exercises: ['squat_bodyweight', 'lunges', 'situps'],
      },
      {
        id: 'w1d2_recovery',
        type: 'recovery',
        title: 'Cool Down',
        instructions: 'Stretch and recover.',
        exercises: ['hamstring_stretch', 'childs_pose'],
      },
    ],
    rewards: { xp: 140, coins: 25 },
  },
  {
    id: 'week1_day3',
    week: 1,
    day: 3,
    title: 'Recovery & Mobility',
    objective: 'Active recovery to reduce soreness and improve flexibility',
    estimated_duration: 25,
    sections: [
      {
        id: 'w1d3_warmup',
        type: 'warmup',
        title: 'Light Movement',
        instructions: 'Gentle movements to increase blood flow.',
        exercises: ['arm_circles', 'leg_swings'],
      },
      {
        id: 'w1d3_recovery',
        type: 'recovery',
        title: 'Deep Stretch & Recovery',
        instructions: 'Hold each stretch for 30-60 seconds. Breathe deeply.',
        exercises: ['hamstring_stretch', 'hip_flexor_stretch', 'foam_roll_quads', 'childs_pose'],
      },
    ],
    rewards: { xp: 60, coins: 10 },
  },
  {
    id: 'week1_day4',
    week: 1,
    day: 4,
    title: 'Upper Body Assault',
    objective: 'Build pushing and pulling strength with bodyweight exercises',
    estimated_duration: 40,
    sections: [
      {
        id: 'w1d4_warmup',
        type: 'warmup',
        title: 'Movement Prep',
        instructions: 'Prepare shoulders, chest, and core.',
        exercises: ['arm_circles', 'inchworm', 'bird_dog'],
      },
      {
        id: 'w1d4_work',
        type: 'workout',
        title: 'Push-Pull Circuit',
        instructions: 'Complete all exercises. Focus on controlled motion and full range.',
        exercises: ['pushup_standard', 'pullup', 'dips', 'russian_twist', 'mountain_climbers'],
      },
      {
        id: 'w1d4_recovery',
        type: 'recovery',
        title: 'Cool Down',
        instructions: 'Stretch the upper body.',
        exercises: ['childs_pose'],
      },
    ],
    rewards: { xp: 160, coins: 30 },
  },
  {
    id: 'week1_day5',
    week: 1,
    day: 5,
    title: 'Cardio Blast',
    objective: 'Push cardiovascular endurance with intervals and distance',
    estimated_duration: 45,
    sections: [
      {
        id: 'w1d5_warmup',
        type: 'warmup',
        title: 'Movement Prep',
        instructions: 'Dynamic warmup for high-intensity cardio.',
        exercises: ['leg_swings', 'hip_bridge', 'frog_squat'],
      },
      {
        id: 'w1d5_cardio',
        type: 'cardio',
        title: 'Interval Training',
        instructions: 'Sprint intervals with rest periods. Push the pace.',
        exercises: ['interval_run_400m'],
      },
      {
        id: 'w1d5_work',
        type: 'workout',
        title: 'Conditioning Finisher',
        instructions: 'High-intensity bodyweight conditioning.',
        exercises: ['burpees', 'mountain_climbers', 'flutter_kicks'],
      },
      {
        id: 'w1d5_recovery',
        type: 'recovery',
        title: 'Cool Down',
        instructions: 'Full body stretch and recovery.',
        exercises: ['hamstring_stretch', 'hip_flexor_stretch', 'childs_pose'],
      },
    ],
    rewards: { xp: 180, coins: 35 },
  },
];

export const allWorkoutDays: WorkoutDay[] = [...week1Days];

export function getWorkoutDay(id: string): WorkoutDay | undefined {
  return allWorkoutDays.find(d => d.id === id);
}

export function getWorkoutDaysForWeek(week: number): WorkoutDay[] {
  return allWorkoutDays.filter(d => d.week === week);
}
