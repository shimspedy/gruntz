import type { TrainingProgram, IntervalSplits } from '../types';

// ============================================================
// TRAINING PROGRAMS — Base Camp, Raider Prep & Recon Prep
// ============================================================

export const PROGRAMS: TrainingProgram[] = [
  {
    id: 'basecamp',
    name: 'Base Camp',
    subtitle: 'Adaptive Starting Point',
    description: 'An 8-week adaptive mission plan for first-timers, returning athletes, fat-loss goals, older users, and anyone who wants to build a durable foundation before tactical prep. Sessions are generated locally from your onboarding answers, with low-impact, bodyweight, and steady progression options.',
    icon: 'basecamp',
    duration_weeks: 8,
    days_per_week: 4,
    difficulty: 'beginner',
    focus_areas: ['Walking Base', 'Bodyweight Strength', 'Mobility', 'Balance', 'Habit Building'],
    prerequisites: ['Able to move comfortably at your own pace', 'No acute medical restriction against exercise', 'Willing to start steady and progress gradually'],
    equipment_needed: ['Comfortable shoes', 'Floor space', 'Optional chair, step, light backpack, or dumbbells'],
    phases: [
      {
        phase_number: 1,
        name: 'Start Moving',
        weeks: [1, 2],
        description: 'Short, joint-friendly missions that build confidence, basic strength, and daily movement rhythm.',
        focus: 'Consistency + movement quality',
        is_deload_included: false,
      },
      {
        phase_number: 2,
        name: 'Build Capacity',
        weeks: [3, 6],
        description: 'Progress walking time, bodyweight strength, core control, and low-impact conditioning.',
        focus: 'Aerobic base + strength endurance',
        is_deload_included: true,
      },
      {
        phase_number: 3,
        name: 'Mission Ready Base',
        weeks: [7, 8],
        description: 'Blend strength, conditioning, and recovery so users can continue Base Camp or graduate into Raider or Recon.',
        focus: 'Readiness bridge',
        is_deload_included: false,
      },
    ],
    rpe_guide: {
      scale: [
        { value: 1, label: 'Very Easy', description: 'Almost no strain. Useful for warm-ups and recovery.', color: '#4CAF50' },
        { value: '2-3', label: 'Easy', description: 'Comfortable effort. You can speak in full sentences.', color: '#8BC34A' },
        { value: '4-6', label: 'Steady', description: 'Working, but controlled. Breathing is deeper but manageable.', color: '#FFEB3B' },
        { value: '7-8', label: 'Hard', description: 'Short phrases only. Reserved for users who selected higher intensity.', color: '#FF9800' },
        { value: 9, label: 'Very Hard', description: 'Brief efforts only. Stop if form breaks down.', color: '#FF5722' },
        { value: 10, label: 'Max', description: 'Not used in Base Camp programming.', color: '#F44336' },
      ],
    },
  },
  {
    id: 'raider',
    name: 'Raider Prep',
    subtitle: 'Elite Selection Readiness',
    description: '10-week assessment & selection preparation. Progressive training with movement cards, swimming, rucking, and PFT preparation. Designed to take you from general fitness to special operations readiness.',
    icon: 'program',
    duration_weeks: 10,
    days_per_week: 5,
    difficulty: 'elite',
    focus_areas: ['Calisthenics', 'Swimming', 'Rucking', 'Running', 'Core Endurance'],
    prerequisites: ['Solid fitness base', 'Able to run 3 miles', 'Basic swim competency', 'Pull-up bar access'],
    equipment_needed: ['Pull-up bar', 'Ruck (45 lbs)', 'Pool access', 'Ammo cans or dumbbells', 'Foam roller', 'Resistance band'],
    phases: [
      { phase_number: 1, name: 'Foundation', weeks: [1, 4], description: 'Build base fitness with movement prep, running, and introduce rucking.', focus: 'Base conditioning', is_deload_included: false },
      { phase_number: 2, name: 'Build Phase', weeks: [5, 7], description: 'Increase volume and intensity. Longer rucks, faster runs, harder cards.', focus: 'Volume & intensity', is_deload_included: false },
      { phase_number: 3, name: 'Peak & Test', weeks: [8, 10], description: 'Peak training with PFT testing weeks. Prepare for A&S.', focus: 'Peak performance', is_deload_included: true },
    ],
    rpe_guide: {
      scale: [
        { value: 1, label: 'Very Light', description: 'Hardly any exertion, more than sleeping', color: '#4CAF50' },
        { value: '2-3', label: 'Light', description: 'Easy to breathe, can carry a conversation', color: '#8BC34A' },
        { value: '4-6', label: 'Moderate', description: 'Breathing heavily, still somewhat comfortable', color: '#FFEB3B' },
        { value: '7-8', label: 'Vigorous', description: 'Borderline uncomfortable, short of breath', color: '#FF9800' },
        { value: 9, label: 'Very Hard', description: 'Very difficult to maintain intensity', color: '#FF5722' },
        { value: 10, label: 'Max Effort', description: 'Impossible to keep going, completely out of breath', color: '#F44336' },
      ],
    },
  },
  {
    id: 'recon',
    name: 'Recon Prep',
    subtitle: '12-Week Tactical School Prep',
    description: 'Complete 12-week progressive program designed to prepare you for tactical selection. 3 phases with periodized strength, endurance, and functional training. RPE-driven intensity with assessment-based progressions for running and bodyweight exercises.',
    icon: 'program',
    duration_weeks: 12,
    days_per_week: 6,
    difficulty: 'elite',
    focus_areas: ['Barbell Strength', 'Running (Track + Tempo)', 'Rucking', 'Functional Carries', 'Bodyweight Assessment %'],
    prerequisites: ['Physical Fitness Assessment completed', 'General physical preparedness', 'Gym access with barbell/rack', '5-mile run assessment time'],
    equipment_needed: ['Barbell + squat rack', 'Bench press', 'Pull-up bar', 'Kettlebells', 'Dumbbells', 'Sled', 'Ruck (35-60 lbs)', 'Track/running route', 'Non-impact cardio machine'],
    phases: [
      {
        phase_number: 1,
        name: 'Strength Foundation',
        weeks: [1, 4],
        description: 'Build maximal strength with compound barbell lifts. Introduce track repeats and tempo runs. Establish assessment baselines.',
        focus: 'Strength + aerobic base',
        is_deload_included: true,
      },
      {
        phase_number: 2,
        name: 'Strength-Endurance',
        weeks: [5, 8],
        description: 'Blend strength with muscular endurance. Add functional carries, sled work, and AMRAPs. Increase running volume.',
        focus: 'Muscular endurance + functional fitness',
        is_deload_included: true,
      },
      {
        phase_number: 3,
        name: 'Peak & Taper',
        weeks: [9, 12],
        description: 'Peak strength volume with 5x5/5x4/5x3 progressions. Heavy rucks, long runs, sled complexes. Final deload before selection.',
        focus: 'Peak performance + taper',
        is_deload_included: true,
      },
    ],
    rpe_guide: {
      scale: [
        { value: 1, label: 'Very Light', description: 'Hardly any exertion, more than sleeping', color: '#4CAF50' },
        { value: '2-3', label: 'Light', description: 'Easy to breathe, can carry a conversation', color: '#8BC34A' },
        { value: '4-6', label: 'Moderate', description: 'Breathing heavily, still somewhat comfortable', color: '#FFEB3B' },
        { value: '7-8', label: 'Vigorous', description: 'Borderline uncomfortable, short of breath', color: '#FF9800' },
        { value: 9, label: 'Very Hard', description: 'Very difficult to maintain intensity', color: '#FF5722' },
        { value: 10, label: 'Max Effort', description: 'Impossible to keep going, completely out of breath', color: '#F44336' },
      ],
    },
  },
];

// Recon interval split reference based on 5-mile assessment
export const RECON_INTERVAL_SPLITS: IntervalSplits[] = [
  { mile_split_range: '6:30-7:00', splits_400m: '1:23-1:29', splits_800m: '2:46-2:58', splits_1200m: '4:09-4:27', splits_1600m: '5:32-5:56' },
  { mile_split_range: '7:01-7:30', splits_400m: '1:29-1:35', splits_800m: '2:58-3:10', splits_1200m: '4:27-4:45', splits_1600m: '5:56-6:20' },
  { mile_split_range: '7:31-8:00', splits_400m: '1:35-1:41', splits_800m: '3:10-3:22', splits_1200m: '4:45-5:03', splits_1600m: '6:20-6:44' },
  { mile_split_range: '8:01-8:30', splits_400m: '1:41-1:47', splits_800m: '3:22-3:34', splits_1200m: '5:03-5:21', splits_1600m: '6:44-7:08' },
  { mile_split_range: '8:31-9:00', splits_400m: '1:47-1:53', splits_800m: '3:34-3:46', splits_1200m: '5:21-5:39', splits_1600m: '7:08-7:32' },
];

export function getProgramById(id: string): TrainingProgram | undefined {
  return PROGRAMS.find(p => p.id === id);
}

export function getAllPrograms(): TrainingProgram[] {
  return PROGRAMS;
}
