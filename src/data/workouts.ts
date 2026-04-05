import { WorkoutDay } from '../types';

// ============================================================
// MARSOC 10-WEEK A&S PREP — COMPLETE WORKOUT SCHEDULE
// Faithful to the official MARSOC Fitness Preparation Log
//
// Weekly structure:
//   Sun: Rest, stretch, hydrate & recover
//   Mon: Movement Prep → Run → Movement Card → (Run) → Post-Workout
//   Tue: Movement Prep → Ruck → Movement Card (Ruck) → Ruck → Post-Workout
//   Wed: Rest, stretch, hydrate & recover
//   Thu: Movement Prep → Swim Card → Post-Workout
//   Fri: Movement Prep → Sprint/PFT → Swim → Post-Workout
//   Sat: Movement Prep → Long Ruck → Assess Feet → Post-Workout
// ============================================================

// Reusable section references
const MOVEMENT_PREP = ['ankles_hips_shoulders', 'hip_bridge', 'elbow_pushups', 'bird_dog', 'frog_squat_warmup', 'worlds_greatest_stretch', 'inchworm', 'walking_high_knees', 'walking_quads_pulls', 'cradles', 'backwards_hamstring', 'high_knees', 'butt_kicks'];
const POST_WORKOUT = ['ais_calf', 'ais_hamstring', 'ais_it_band', 'ais_groin', 'ais_quads', 'ais_rotator_cuff', 'ais_thoracic', 'ais_middle_back', 'ais_triceps', 'roller_full'];

// ============================================================
// MOVEMENT CARDS (reusable workout blocks from the PDF)
// ============================================================

// Card 1: Core Work
const CARD_1_MARSOC_PREP = ['pullups', 'usmc_crunches', 'burpees']; // 3 rounds
const CARD_1_CORE = ['forward_plank', 'side_plank', 'knees_to_elbows', 'dumbbell_getups', 'flutter_kicks']; // 5 rounds
const CARD_1_FINISHER = ['usmc_crunches']; // 2x100

// Card 2: Ruck Based
const CARD_2_DYNAMIC = ['lunges_counter_rotation', 'skaters', 'broad_jumps', 'mountain_climbers', 'skaters', 'dumbbell_getups'];
const CARD_2_PLANKS = ['forward_plank', 'side_plank', 'frog_squats']; // 2 rounds
const CARD_2_MARSOC = ['usmc_crunches', 'pullups', 'jog_100_200m']; // 5 rounds
const CARD_2_WORKOUT = ['high_crawl', 'partner_drags', 'walking_ammo_can_lunge', 'tire_flips', 'walking_ammo_can_lunge']; // 4 rounds

// Card 3: MARSOC In Test Prep and Core
const CARD_3_PLANKS = ['forward_plank', 'side_plank', 'frog_squats'];
const CARD_3_MARSOC = ['hand_release_pushups', 'pullups', 'usmc_crunches']; // 4 rounds
const CARD_3_FINISHER = ['usmc_crunches']; // max reps 2min, 1min, 30sec

// Card 4: Ruck Based Strength
const CARD_4_MARSOC = ['pullups', 'usmc_crunches', 'burpees']; // 3 rounds
const CARD_4_WORKOUT = ['ammo_can_front_squats', 'walking_lunges', 'ammo_can_thruster', 'dumbbell_getups']; // 4 rounds

// Card 5: Total Body
const CARD_5_PLANKS = ['forward_plank', 'side_plank', 'frog_squats'];
const CARD_5_WARMUP = ['pullups', 'pushups', 'air_squats', 'skaters']; // 3 rounds
const CARD_5_WORKOUT = ['pullups', 'pushups', 'air_squats']; // 10-20 rounds
const CARD_5_FINISHER = ['farmers_carry']; // 5-10 x 50m

// Card 6: Ruck Core
const CARD_6_WORKOUT = ['forward_plank', 'air_squats', 'dumbbell_getups', 'burpees']; // 5 rounds
const CARD_6_INTEST = ['usmc_crunches', 'forward_plank']; // descending max reps
const CARD_6_PULLUPS = ['pullups']; // pyramid 1-5-1

// Helper to build a standard day
function buildDay(
  id: string, week: number, day: number, title: string, objective: string,
  duration: number, sections: WorkoutDay['sections'], xp: number, coins: number
): WorkoutDay {
  return { id, week, day, title, objective, estimated_duration: duration, sections, rewards: { xp, coins } };
}

// ============================================================
// WEEK BUILDERS
// ============================================================

function buildMonday(week: number, runType: 'split' | 'full3', cardNum: number): WorkoutDay {
  const cardMap: Record<number, string[]> = {
    1: [...CARD_1_MARSOC_PREP, ...CARD_1_CORE, ...CARD_1_FINISHER],
    3: [...CARD_3_PLANKS, ...CARD_3_MARSOC, ...CARD_3_FINISHER],
    5: [...CARD_5_PLANKS, ...CARD_5_WARMUP, ...CARD_5_WORKOUT, ...CARD_5_FINISHER],
  };
  const runExercises = runType === 'split' ? ['run_1_5mi'] : ['run_3mi'];
  const sections: WorkoutDay['sections'] = [
    { id: `w${week}mon_prep`, type: 'warmup', title: 'Movement Prep Card', instructions: 'Complete all 13 movements.', exercises: MOVEMENT_PREP },
    { id: `w${week}mon_run1`, type: 'cardio', title: runType === 'split' ? '1.5-Mile Run' : '3-Mile Run', instructions: runType === 'split' ? 'Run 1.5 miles at near-PFT pace.' : 'Run 3 miles at PFT pace.', exercises: runExercises },
    { id: `w${week}mon_work`, type: 'workout', title: `Movement Card #${cardNum}`, instructions: `Complete Movement Card #${cardNum} with good form.`, rounds: cardNum === 5 ? 15 : cardNum === 1 ? 5 : 4, exercises: cardMap[cardNum] || cardMap[1] },
  ];
  if (runType === 'split') {
    sections.push({ id: `w${week}mon_run2`, type: 'cardio', title: '1.5-Mile Run', instructions: 'Run 1.5 miles at near-PFT pace.', exercises: ['run_1_5mi'] });
  }
  sections.push({ id: `w${week}mon_post`, type: 'recovery', title: 'Post-Workout', instructions: 'AIS stretches + foam rolling.', exercises: POST_WORKOUT });
  const title = cardNum === 1 ? 'Core Work' : cardNum === 3 ? 'In Test Prep & Core' : 'Total Body';
  return buildDay(`week${week}_mon`, week, 1, `${title} + Run`, `Week ${week} Monday: ${title}`, runType === 'split' ? 75 : 60, sections, 200, 35);
}

function buildTuesday(week: number, cardNum: number): WorkoutDay {
  const cardMap: Record<number, string[]> = {
    2: [...CARD_2_DYNAMIC, ...CARD_2_PLANKS, ...CARD_2_MARSOC, ...CARD_2_WORKOUT],
    4: [...CARD_4_MARSOC, ...CARD_4_WORKOUT],
    6: [...CARD_6_WORKOUT, ...CARD_6_INTEST, ...CARD_6_PULLUPS],
  };
  const sections: WorkoutDay['sections'] = [
    { id: `w${week}tue_prep`, type: 'warmup', title: 'Movement Prep Card', instructions: 'Complete all 13 movements.', exercises: MOVEMENT_PREP },
    { id: `w${week}tue_ruck1`, type: 'ruck', title: '1-2 Mile Ruck', instructions: 'Ruck 1-2 miles at faster than 13 min/mile.', exercises: ['ruck_1_2mi'] },
    { id: `w${week}tue_work`, type: 'workout', title: `Movement Card #${cardNum}`, instructions: `Complete Movement Card #${cardNum}. Ruck exercises as indicated.`, rounds: cardNum === 2 ? 4 : cardNum === 4 ? 4 : 5, exercises: cardMap[cardNum] || cardMap[2] },
    { id: `w${week}tue_ruck2`, type: 'ruck', title: '1-2 Mile Ruck', instructions: 'Ruck 1-2 miles at faster than 13 min/mile.', exercises: ['ruck_1_2mi'] },
    { id: `w${week}tue_post`, type: 'recovery', title: 'Post-Workout', instructions: 'AIS stretches + foam rolling.', exercises: POST_WORKOUT },
  ];
  const title = cardNum === 2 ? 'Ruck Based' : cardNum === 4 ? 'Ruck Strength' : 'Ruck Core';
  return buildDay(`week${week}_tue`, week, 2, `${title} Day`, `Week ${week} Tuesday: ${title}`, 90, sections, 220, 40);
}

function buildThursday(week: number, swimCardNum: number): WorkoutDay {
  // Map swim card content based on the PDF
  const swimExercises: Record<number, string[]> = {
    1: ['swim_25m', 'pushups', 'air_squats', 'usmc_crunches', 'swim_100m', 'tread_hands_up', 'swim_50m', 'pushups', 'flutter_kicks', 'pullups'],
    2: ['swim_25m', 'pushups', 'air_squats', 'usmc_crunches', 'swim_300m', 'tread_water', 'swim_50m', 'pushups', 'flutter_kicks', 'pullups'],
    3: ['air_squats', 'pushups', 'usmc_crunches', 'flutter_kicks', 'swim_300m', 'tread_water', 'swim_200m', 'air_squats', 'pullups', 'chinups', 'pullups'],
    4: ['swim_50m', 'pushups', 'air_squats', 'usmc_crunches', 'swim_300m', 'tread_hands_up', 'tread_water', 'swim_100m', 'pushups', 'flutter_kicks', 'pullups'],
    5: ['swim_25m', 'pushups', 'air_squats', 'usmc_crunches', 'swim_500m', 'tread_water', 'underwater_swim', 'swim_25m', 'pullups'],
  };
  return buildDay(`week${week}_thu`, week, 4, `Swim Card #${swimCardNum}`, `Week ${week} Thursday: Swim training`, 75, [
    { id: `w${week}thu_prep`, type: 'warmup', title: 'Movement Prep Card', instructions: 'Complete all 13 movements.', exercises: MOVEMENT_PREP },
    { id: `w${week}thu_swim`, type: 'swim', title: `Swim Card #${swimCardNum}`, instructions: `Complete Swim Card #${swimCardNum}. Perform main sets in cammies if possible.`, exercises: swimExercises[swimCardNum] || swimExercises[1] },
    { id: `w${week}thu_post`, type: 'recovery', title: 'Post-Workout', instructions: 'AIS stretches + foam rolling.', exercises: POST_WORKOUT },
  ], 180, 30);
}

function buildFriday(week: number, sprintId: string, sprintSets: number, swimId: string, swimSets: number): WorkoutDay {
  return buildDay(`week${week}_fri`, week, 5, 'Speed & Swim', `Week ${week} Friday: Interval sprints + swim`, 60, [
    { id: `w${week}fri_prep`, type: 'warmup', title: 'Movement Prep Card', instructions: 'Complete all 13 movements.', exercises: MOVEMENT_PREP },
    { id: `w${week}fri_run`, type: 'cardio', title: `${sprintSets}x Sprints`, instructions: `Complete ${sprintSets} sprint intervals.`, exercises: [sprintId] },
    { id: `w${week}fri_swim`, type: 'swim', title: `${swimSets}x Swim`, instructions: `Complete ${swimSets} swim sets.`, exercises: [swimId] },
    { id: `w${week}fri_post`, type: 'recovery', title: 'Post-Workout', instructions: 'AIS stretches + foam rolling.', exercises: POST_WORKOUT },
  ], 160, 30);
}

function buildPFTFriday(week: number): WorkoutDay {
  return buildDay(`week${week}_fri`, week, 5, 'PFT + Swim Test', `Week ${week} Friday: Training Check — PFT then swim assessment`, 90, [
    { id: `w${week}fri_prep`, type: 'warmup', title: 'Movement Prep Card', instructions: 'Complete all 13 movements.', exercises: MOVEMENT_PREP },
    { id: `w${week}fri_pft`, type: 'test', title: 'PFT (3-Mile Run)', instructions: 'Max effort 3-mile timed run. Record your time.', exercises: ['pft_run'] },
    { id: `w${week}fri_swim`, type: 'test', title: '300m Swim Test', instructions: 'Swim 300m for time. Goal: under 13 min.', exercises: ['swim_300m'] },
    { id: `w${week}fri_tread`, type: 'test', title: 'Tread Water + Float', instructions: '11 min treading water + 4 min survival float.', exercises: ['tread_water', 'float_4min'] },
    { id: `w${week}fri_post`, type: 'recovery', title: 'Post-Workout', instructions: 'AIS stretches + foam rolling.', exercises: POST_WORKOUT },
  ], 250, 50);
}

function buildSaturday(week: number, ruckId: string): WorkoutDay {
  return buildDay(`week${week}_sat`, week, 6, 'Long Ruck', `Week ${week} Saturday: Distance ruck`, 120, [
    { id: `w${week}sat_prep`, type: 'warmup', title: 'Movement Prep Card', instructions: 'Complete all 13 movements.', exercises: MOVEMENT_PREP },
    { id: `w${week}sat_ruck`, type: 'ruck', title: 'Distance Ruck', instructions: 'Complete the distance ruck at target pace or faster.', exercises: [ruckId] },
    { id: `w${week}sat_feet`, type: 'recovery', title: 'Assess Feet & Gear', instructions: 'Check feet for hot spots. Change socks. Powder feet.', exercises: ['assess_feet_gear'] },
    { id: `w${week}sat_post`, type: 'recovery', title: 'Post-Workout', instructions: 'AIS stretches + foam rolling.', exercises: POST_WORKOUT },
  ], 180, 35);
}

// ============================================================
// 10-WEEK PROGRAM (exact MARSOC PDF schedule)
// ============================================================

// Week 1: Mon(Card1+split run), Tue(Card2), Thu(Swim1), Fri(4x400+2x200m swim), Sat(4mi ruck)
const week1: WorkoutDay[] = [
  buildMonday(1, 'split', 1),
  buildTuesday(1, 2),
  buildThursday(1, 1),
  buildFriday(1, 'sprint_400m', 4, 'swim_200m', 2),
  buildSaturday(1, 'ruck_4mi'),
];

// Week 2: Mon(Card3+3mi), Tue(Card4), Thu(Swim2), Fri(9x200+500m swim), Sat(4mi ruck)
const week2: WorkoutDay[] = [
  buildMonday(2, 'full3', 3),
  buildTuesday(2, 4),
  buildThursday(2, 2),
  buildFriday(2, 'sprint_200m', 9, 'swim_500m', 1),
  buildSaturday(2, 'ruck_4mi'),
];

// Week 3: Mon(Card5+split), Tue(Card6), Thu(Swim3), Fri(5x400+2x400m swim), Sat(5mi ruck)
const week3: WorkoutDay[] = [
  buildMonday(3, 'split', 5),
  buildTuesday(3, 6),
  buildThursday(3, 3),
  buildFriday(3, 'sprint_400m', 5, 'swim_200m', 2),
  buildSaturday(3, 'ruck_5mi'),
];

// Week 4: Mon(Card1+3mi), Tue(Card2), Thu(Swim4), Fri(10x200+800m swim), Sat(5mi ruck)
const week4: WorkoutDay[] = [
  buildMonday(4, 'full3', 1),
  buildTuesday(4, 2),
  buildThursday(4, 4),
  buildFriday(4, 'sprint_200m', 10, 'swim_800m', 1),
  buildSaturday(4, 'ruck_5mi'),
];

// Week 5: Mon(Card3+split), Tue(Card4), Thu(Swim5), Fri(3x800+2x300m swim), Sat(6mi ruck)
const week5: WorkoutDay[] = [
  buildMonday(5, 'split', 3),
  buildTuesday(5, 4),
  buildThursday(5, 5),
  buildFriday(5, 'sprint_800m', 3, 'swim_300m', 2),
  buildSaturday(5, 'ruck_6mi'),
];

// Week 6: TRAINING CHECK — Mon(Card5+3mi), Tue(Card6), Thu+Wed REST, Fri(PFT+swim test), Sat(7mi ruck)
const week6: WorkoutDay[] = [
  buildMonday(6, 'full3', 5),
  buildTuesday(6, 6),
  buildPFTFriday(6),
  buildSaturday(6, 'ruck_7mi'),
];

// Week 7: Mon(Card1+split), Tue(Card2), Thu(Swim4), Fri(10x200+8x100m swim), Sat(8mi ruck)
const week7: WorkoutDay[] = [
  buildMonday(7, 'split', 1),
  buildTuesday(7, 2),
  buildThursday(7, 4),
  buildFriday(7, 'sprint_200m', 10, 'swim_100m', 8),
  buildSaturday(7, 'ruck_8mi'),
];

// Week 8: TRAINING CHECK — Mon(Card3+3mi), Tue(Card4), Thu+Wed REST, Fri(PFT+swim test), Sat(9mi ruck)
const week8: WorkoutDay[] = [
  buildMonday(8, 'full3', 3),
  buildTuesday(8, 4),
  buildPFTFriday(8),
  buildSaturday(8, 'ruck_9mi'),
];

// Week 9: Mon(Card5+split), Tue(Card6), Thu(Swim5), Fri(6x400+3x300m swim), Sat(10mi ruck)
const week9: WorkoutDay[] = [
  buildMonday(9, 'split', 5),
  buildTuesday(9, 6),
  buildThursday(9, 5),
  buildFriday(9, 'sprint_400m', 6, 'swim_300m', 3),
  buildSaturday(9, 'ruck_10mi'),
];

// Week 10: FINAL CHECK — Mon(Card1+split), Tue(Card2), Thu+Wed REST, Fri(PFT+swim test), Sat(12mi ruck)
const week10: WorkoutDay[] = [
  buildMonday(10, 'split', 1),
  buildTuesday(10, 2),
  buildPFTFriday(10),
  buildSaturday(10, 'ruck_12mi'),
];

// ============================================================
// EXPORTS
// ============================================================

export const allWorkoutDays: WorkoutDay[] = [
  ...week1, ...week2, ...week3, ...week4, ...week5,
  ...week6, ...week7, ...week8, ...week9, ...week10,
];

export function getWorkoutDay(id: string): WorkoutDay | undefined {
  return allWorkoutDays.find(d => d.id === id);
}

export function getWorkoutDaysForWeek(week: number): WorkoutDay[] {
  return allWorkoutDays.filter(d => d.week === week);
}

export function getCurrentWeekDay(weekNumber: number, dayOfWeek: number): WorkoutDay | undefined {
  // dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const weekDays = getWorkoutDaysForWeek(weekNumber);
  const dayMap: Record<number, number> = { 1: 1, 2: 2, 4: 4, 5: 5, 6: 6 };
  return weekDays.find(d => d.day === dayMap[dayOfWeek]);
}

export const TOTAL_WEEKS = 10;
export const REST_DAYS = [0, 3]; // Sunday and Wednesday are always rest days
