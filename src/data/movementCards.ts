import { MovementCard } from '../types';

// ============================================================
// MARSOC MOVEMENT CARDS (6) + SWIM CARDS (5)
// Faithful to the official MARSOC Fitness Preparation Log
// Each card is a self-contained workout block used in the weekly schedule
// ============================================================

export const movementCards: MovementCard[] = [
  // ============================
  // MOVEMENT CARD #1: CORE WORK
  // ============================
  {
    id: 'card_1',
    card_number: 1,
    name: 'Core Work',
    category: 'core',
    description: 'Heavy core focus with MARSOC Prep warm-up, plank/core circuit, and crunches finisher. Builds the trunk stability needed for rucking and combat tasks.',
    difficulty: 'intermediate',
    estimated_duration: 35,
    target_muscle_groups: ['core', 'shoulders', 'back', 'hip flexors'],
    icon: '🔥',
    total_rounds: 10,
    sections: [
      {
        id: 'card1_marsoc_prep',
        name: 'MARSOC Prep Warm-Up',
        rounds: 3,
        rest_between_rounds: 60,
        notes: 'Complete all 3 exercises back-to-back, then rest.',
        exercises: [
          { exercise_id: 'pullups', order: 1, prescribed_sets: 1, prescribed_reps: 8, notes: 'Dead hang start, chin over bar' },
          { exercise_id: 'usmc_crunches', order: 2, prescribed_sets: 1, prescribed_reps: 30, notes: 'Full range of motion' },
          { exercise_id: 'burpees', order: 3, prescribed_sets: 1, prescribed_reps: 10, notes: 'Full push-up, explosive jump' },
        ],
      },
      {
        id: 'card1_core',
        name: 'Core Circuit',
        rounds: 5,
        rest_between_rounds: 45,
        notes: '5 rounds of core work. Maintain form throughout.',
        exercises: [
          { exercise_id: 'forward_plank', order: 1, prescribed_duration: 60, notes: 'Hold 60 seconds' },
          { exercise_id: 'side_plank', order: 2, prescribed_duration: 30, notes: '30 seconds each side' },
          { exercise_id: 'knees_to_elbows', order: 3, prescribed_sets: 1, prescribed_reps: 12, notes: 'Smooth motion, no swinging' },
          { exercise_id: 'dumbbell_getups', order: 4, prescribed_sets: 1, prescribed_reps: 10, notes: '5 each side, 30lb' },
          { exercise_id: 'flutter_kicks', order: 5, prescribed_sets: 1, prescribed_reps: 20, notes: '4-count reps' },
        ],
      },
      {
        id: 'card1_finisher',
        name: 'Crunch Finisher',
        rounds: 2,
        rest_between_rounds: 120,
        notes: '2 sets of 100 crunches.',
        exercises: [
          { exercise_id: 'usmc_crunches', order: 1, prescribed_sets: 1, prescribed_reps: 100, notes: 'Controlled pace, full ROM' },
        ],
      },
    ],
  },

  // ============================
  // MOVEMENT CARD #2: RUCK BASED
  // ============================
  {
    id: 'card_2',
    card_number: 2,
    name: 'Ruck Based',
    category: 'ruck',
    description: 'Ruck-focused training with dynamic warmup, plank holds, MARSOC prep circuit, and heavy ruck movements including crawls, drags, and carries.',
    difficulty: 'advanced',
    estimated_duration: 45,
    target_muscle_groups: ['legs', 'back', 'core', 'shoulders', 'grip'],
    icon: '🎒',
    total_rounds: 16,
    sections: [
      {
        id: 'card2_dynamic',
        name: 'Dynamic Warm-Up',
        rounds: 1,
        notes: 'Complete all exercises once through with 100-200m jog between exercises.',
        exercises: [
          { exercise_id: 'lunges_counter_rotation', order: 1, prescribed_reps: 10, notes: '10 each side' },
          { exercise_id: 'skaters', order: 2, prescribed_reps: 30, notes: 'Stabilize each landing' },
          { exercise_id: 'broad_jumps', order: 3, prescribed_reps: 10, notes: 'Explosive, soft landing' },
          { exercise_id: 'mountain_climbers', order: 4, prescribed_reps: 20, notes: '4-count' },
          { exercise_id: 'skaters', order: 5, prescribed_reps: 30, notes: 'Second round' },
          { exercise_id: 'dumbbell_getups', order: 6, prescribed_reps: 10, notes: '5 each side' },
        ],
      },
      {
        id: 'card2_planks',
        name: 'Plank Hold',
        rounds: 2,
        rest_between_rounds: 30,
        notes: '2 rounds of planks and frog squats.',
        exercises: [
          { exercise_id: 'forward_plank', order: 1, prescribed_duration: 60, notes: 'Hold 60 seconds' },
          { exercise_id: 'side_plank', order: 2, prescribed_duration: 30, notes: '30 sec each side' },
          { exercise_id: 'frog_squats', order: 3, prescribed_reps: 10, notes: 'Full depth' },
        ],
      },
      {
        id: 'card2_marsoc',
        name: 'MARSOC Prep Circuit',
        rounds: 5,
        rest_between_rounds: 45,
        notes: '5 rounds with jog between rounds.',
        exercises: [
          { exercise_id: 'usmc_crunches', order: 1, prescribed_reps: 30, notes: 'Full range' },
          { exercise_id: 'pullups', order: 2, prescribed_reps: 8, notes: 'Dead hang' },
          { exercise_id: 'jog_100_200m', order: 3, notes: '100-200m recovery jog' },
        ],
      },
      {
        id: 'card2_ruck_workout',
        name: 'Ruck Workout',
        rounds: 4,
        rest_between_rounds: 90,
        notes: '4 rounds. Rucked exercises where indicated.',
        exercises: [
          { exercise_id: 'high_crawl', order: 1, notes: '20m high crawl' },
          { exercise_id: 'partner_drags', order: 2, notes: '20m drag (or sled)' },
          { exercise_id: 'walking_ammo_can_lunge', order: 3, prescribed_reps: 20, notes: '20 steps with weight' },
          { exercise_id: 'tire_flips', order: 4, prescribed_reps: 8, notes: 'Or deadlift alternative' },
          { exercise_id: 'walking_ammo_can_lunge', order: 5, prescribed_reps: 20, notes: '20 steps back' },
        ],
      },
    ],
  },

  // ============================
  // MOVEMENT CARD #3: MARSOC IN TEST PREP AND CORE
  // ============================
  {
    id: 'card_3',
    card_number: 3,
    name: 'In Test Prep & Core',
    category: 'core',
    description: 'Prepares you for the MARSOC assessment tests. Focus on hand-release push-ups, pull-ups, and crunches with plank foundation.',
    difficulty: 'intermediate',
    estimated_duration: 30,
    target_muscle_groups: ['chest', 'back', 'core', 'shoulders'],
    icon: '📋',
    total_rounds: 7,
    sections: [
      {
        id: 'card3_planks',
        name: 'Plank Foundation',
        rounds: 1,
        notes: 'Hold each position with perfect form.',
        exercises: [
          { exercise_id: 'forward_plank', order: 1, prescribed_duration: 60, notes: 'Hold 60 seconds' },
          { exercise_id: 'side_plank', order: 2, prescribed_duration: 30, notes: '30 sec each side' },
          { exercise_id: 'frog_squats', order: 3, prescribed_reps: 10, notes: 'Deep squat, heels down' },
        ],
      },
      {
        id: 'card3_marsoc_intest',
        name: 'MARSOC In-Test Circuit',
        rounds: 4,
        rest_between_rounds: 60,
        notes: '4 rounds. These are the actual A&S assessment exercises.',
        exercises: [
          { exercise_id: 'hand_release_pushups', order: 1, prescribed_reps: 12, notes: 'Chest to ground, hands fully off' },
          { exercise_id: 'pullups', order: 2, prescribed_reps: 8, notes: 'Dead hang, no kipping' },
          { exercise_id: 'usmc_crunches', order: 3, prescribed_reps: 30, notes: 'Full range, shoulders to deck' },
        ],
      },
      {
        id: 'card3_finisher',
        name: 'Crunch Ladder',
        rounds: 1,
        notes: 'Max USMC crunches: 2 min, rest 1 min, 1 min, rest 30 sec, 30 sec.',
        exercises: [
          { exercise_id: 'usmc_crunches', order: 1, prescribed_duration: 120, notes: '2 min max reps' },
          { exercise_id: 'rest_2min', order: 2, prescribed_duration: 60, notes: '1 min rest' },
          { exercise_id: 'usmc_crunches', order: 3, prescribed_duration: 60, notes: '1 min max reps' },
          { exercise_id: 'usmc_crunches', order: 4, prescribed_duration: 30, notes: '30 sec max reps' },
        ],
      },
    ],
  },

  // ============================
  // MOVEMENT CARD #4: RUCK BASED STRENGTH
  // ============================
  {
    id: 'card_4',
    card_number: 4,
    name: 'Ruck Strength',
    category: 'ruck',
    description: 'Builds ruck-specific strength through loaded squats, lunges, thrusters, and get-ups. Essential for carrying heavy packs over distance.',
    difficulty: 'advanced',
    estimated_duration: 40,
    target_muscle_groups: ['legs', 'glutes', 'shoulders', 'core', 'back'],
    icon: '🏋️',
    total_rounds: 7,
    sections: [
      {
        id: 'card4_marsoc_prep',
        name: 'MARSOC Prep',
        rounds: 3,
        rest_between_rounds: 60,
        notes: '3 rounds of pull-ups, crunches, burpees.',
        exercises: [
          { exercise_id: 'pullups', order: 1, prescribed_reps: 8, notes: 'Dead hang' },
          { exercise_id: 'usmc_crunches', order: 2, prescribed_reps: 30 },
          { exercise_id: 'burpees', order: 3, prescribed_reps: 10, notes: 'Full push-up + jump' },
        ],
      },
      {
        id: 'card4_strength',
        name: 'Ruck Strength Circuit',
        rounds: 4,
        rest_between_rounds: 90,
        notes: '4 rounds with 30lb ammo cans or dumbbells.',
        exercises: [
          { exercise_id: 'ammo_can_front_squats', order: 1, prescribed_reps: 10, notes: 'Hip crease below knee' },
          { exercise_id: 'walking_lunges', order: 2, prescribed_reps: 20, notes: '10 each leg' },
          { exercise_id: 'ammo_can_thruster', order: 3, prescribed_reps: 10, notes: 'Full squat to press' },
          { exercise_id: 'dumbbell_getups', order: 4, prescribed_reps: 10, notes: '5 each side' },
        ],
      },
    ],
  },

  // ============================
  // MOVEMENT CARD #5: TOTAL BODY
  // ============================
  {
    id: 'card_5',
    card_number: 5,
    name: 'Total Body',
    category: 'total_body',
    description: 'High-volume total body circuit. Descending rep scheme from 20 to 10 creates a grinder that builds muscular endurance and mental toughness.',
    difficulty: 'advanced',
    estimated_duration: 50,
    target_muscle_groups: ['chest', 'back', 'legs', 'core', 'shoulders', 'grip'],
    icon: '💪',
    total_rounds: 20,
    sections: [
      {
        id: 'card5_planks',
        name: 'Plank Foundation',
        rounds: 1,
        notes: 'Hold each position with perfect form.',
        exercises: [
          { exercise_id: 'forward_plank', order: 1, prescribed_duration: 60, notes: 'Hold 60 seconds' },
          { exercise_id: 'side_plank', order: 2, prescribed_duration: 30, notes: '30 sec each side' },
          { exercise_id: 'frog_squats', order: 3, prescribed_reps: 10, notes: 'Full depth' },
        ],
      },
      {
        id: 'card5_warmup',
        name: 'Warm-Up Circuit',
        rounds: 3,
        rest_between_rounds: 30,
        notes: '3 rounds to prime the muscles.',
        exercises: [
          { exercise_id: 'pullups', order: 1, prescribed_reps: 5, notes: 'Easy reps' },
          { exercise_id: 'pushups', order: 2, prescribed_reps: 10 },
          { exercise_id: 'air_squats', order: 3, prescribed_reps: 15 },
          { exercise_id: 'skaters', order: 4, prescribed_reps: 20 },
        ],
      },
      {
        id: 'card5_main',
        name: 'Descending Grinder',
        rounds: 10,
        rest_between_rounds: 30,
        notes: 'Start at 20 reps, decrease by 1-2 each round down to 10. Minimal rest.',
        exercises: [
          { exercise_id: 'pullups', order: 1, notes: 'Start 10 reps → decrease to 5' },
          { exercise_id: 'pushups', order: 2, notes: 'Start 20 reps → decrease to 10' },
          { exercise_id: 'air_squats', order: 3, notes: 'Start 20 reps → decrease to 10' },
        ],
      },
      {
        id: 'card5_finisher',
        name: "Farmer's Carry Finisher",
        rounds: 5,
        rest_between_rounds: 30,
        notes: '5-10 × 50m carries with 50lb+ per hand.',
        exercises: [
          { exercise_id: 'farmers_carry', order: 1, notes: '50m carry, 50lb+ each hand' },
        ],
      },
    ],
  },

  // ============================
  // MOVEMENT CARD #6: RUCK CORE
  // ============================
  {
    id: 'card_6',
    card_number: 6,
    name: 'Ruck Core',
    category: 'ruck',
    description: 'Combines core endurance with functional ruck movements. Features a pull-up pyramid and descending crunch ladder.',
    difficulty: 'advanced',
    estimated_duration: 40,
    target_muscle_groups: ['core', 'legs', 'back', 'shoulders'],
    icon: '🎯',
    total_rounds: 11,
    sections: [
      {
        id: 'card6_main',
        name: 'Ruck Core Circuit',
        rounds: 5,
        rest_between_rounds: 60,
        notes: '5 rounds of combined ruck and core work.',
        exercises: [
          { exercise_id: 'forward_plank', order: 1, prescribed_duration: 60, notes: '60 second hold' },
          { exercise_id: 'air_squats', order: 2, prescribed_reps: 20, notes: 'Full depth' },
          { exercise_id: 'dumbbell_getups', order: 3, prescribed_reps: 10, notes: '5 each side' },
          { exercise_id: 'burpees', order: 4, prescribed_reps: 10, notes: 'Full push-up + jump' },
        ],
      },
      {
        id: 'card6_intest',
        name: 'In-Test Crunch Ladder',
        rounds: 3,
        rest_between_rounds: 30,
        notes: 'Descending max-rep crunches with plank holds between.',
        exercises: [
          { exercise_id: 'usmc_crunches', order: 1, prescribed_duration: 120, notes: '2 min max reps' },
          { exercise_id: 'forward_plank', order: 2, prescribed_duration: 60, notes: '60 sec hold' },
        ],
      },
      {
        id: 'card6_pullup_pyramid',
        name: 'Pull-Up Pyramid',
        rounds: 9,
        rest_between_rounds: 30,
        notes: 'Pyramid: 1-2-3-4-5-4-3-2-1 pull-ups.',
        exercises: [
          { exercise_id: 'pullups', order: 1, notes: 'Pyramid reps: 1→5→1' },
        ],
      },
    ],
  },

  // ============================
  // SWIM CARD #1
  // ============================
  {
    id: 'swim_card_1',
    card_number: 1,
    name: 'Swim Foundations',
    category: 'swim',
    description: 'Introduction to combat side stroke and breast stroke. Builds water confidence with PT pyramids, treading, and short underwater swims.',
    difficulty: 'beginner',
    estimated_duration: 60,
    target_muscle_groups: ['shoulders', 'back', 'core', 'legs'],
    icon: '🏊',
    total_rounds: 8,
    sections: [
      {
        id: 'sc1_warmup',
        name: 'Swim Warm-Up',
        rounds: 4,
        rest_between_rounds: 15,
        notes: '4×25m side stroke or breast stroke.',
        exercises: [
          { exercise_id: 'swim_25m', order: 1, notes: 'Side stroke or breast stroke' },
        ],
      },
      {
        id: 'sc1_pt_pyramid',
        name: 'PT/Swim Pyramid',
        rounds: 1,
        notes: 'Push-ups, squats, crunches between swim sets.',
        exercises: [
          { exercise_id: 'pushups', order: 1, prescribed_reps: 15 },
          { exercise_id: 'air_squats', order: 2, prescribed_reps: 20 },
          { exercise_id: 'usmc_crunches', order: 3, prescribed_reps: 30 },
        ],
      },
      {
        id: 'sc1_main',
        name: 'Main Swim Set',
        rounds: 2,
        rest_between_rounds: 30,
        notes: '2×100m side stroke.',
        exercises: [
          { exercise_id: 'swim_100m', order: 1, notes: 'Side stroke' },
        ],
      },
      {
        id: 'sc1_tread',
        name: 'Tread Water',
        rounds: 3,
        rest_between_rounds: 30,
        notes: 'Build treading endurance. Hands up variation.',
        exercises: [
          { exercise_id: 'tread_hands_up', order: 1, notes: '15 sec each hand then both' },
        ],
      },
      {
        id: 'sc1_finish',
        name: 'Swim Finisher',
        rounds: 1,
        notes: 'Cool down swim and PT.',
        exercises: [
          { exercise_id: 'swim_50m', order: 1, notes: 'Easy pace' },
          { exercise_id: 'pushups', order: 2, prescribed_reps: 15 },
          { exercise_id: 'flutter_kicks', order: 3, prescribed_reps: 20 },
          { exercise_id: 'pullups', order: 4, prescribed_reps: 8 },
        ],
      },
    ],
  },

  // ============================
  // SWIM CARD #2
  // ============================
  {
    id: 'swim_card_2',
    card_number: 2,
    name: 'Endurance Swim',
    category: 'swim',
    description: 'Builds swim endurance with 300m continuous swim, 11-minute tread, and survival float. Prepares for A&S water assessment.',
    difficulty: 'intermediate',
    estimated_duration: 70,
    target_muscle_groups: ['shoulders', 'back', 'core', 'legs', 'cardiovascular'],
    icon: '🌊',
    total_rounds: 7,
    sections: [
      {
        id: 'sc2_warmup',
        name: 'Swim Warm-Up',
        rounds: 4,
        rest_between_rounds: 15,
        notes: '4×25m to loosen up.',
        exercises: [
          { exercise_id: 'swim_25m', order: 1, notes: 'Easy pace' },
        ],
      },
      {
        id: 'sc2_pt',
        name: 'Pool-Side PT',
        rounds: 1,
        notes: 'PT circuit on pool deck.',
        exercises: [
          { exercise_id: 'pushups', order: 1, prescribed_reps: 15 },
          { exercise_id: 'air_squats', order: 2, prescribed_reps: 20 },
          { exercise_id: 'usmc_crunches', order: 3, prescribed_reps: 30 },
        ],
      },
      {
        id: 'sc2_main',
        name: '300m Swim',
        rounds: 1,
        notes: 'Continuous 300m side stroke or breast stroke.',
        exercises: [
          { exercise_id: 'swim_300m', order: 1, notes: 'Side stroke or breast stroke. Target under 13 min.' },
        ],
      },
      {
        id: 'sc2_tread',
        name: 'Tread + Float',
        rounds: 1,
        notes: '11 min treading water + 4 min survival float.',
        exercises: [
          { exercise_id: 'tread_water', order: 1, prescribed_duration: 660, notes: '11 minutes' },
          { exercise_id: 'float_4min', order: 2, notes: '4 min survival float' },
        ],
      },
      {
        id: 'sc2_intervals',
        name: 'Swim Intervals',
        rounds: 4,
        rest_between_rounds: 30,
        notes: '4×50m with rest.',
        exercises: [
          { exercise_id: 'swim_50m', order: 1, notes: 'Moderate pace' },
        ],
      },
      {
        id: 'sc2_finish',
        name: 'Swim Finisher PT',
        rounds: 1,
        notes: 'Pool-side PT to finish.',
        exercises: [
          { exercise_id: 'pushups', order: 1, prescribed_reps: 15 },
          { exercise_id: 'flutter_kicks', order: 2, prescribed_reps: 20 },
          { exercise_id: 'pullups', order: 3, prescribed_reps: 8 },
        ],
      },
    ],
  },

  // ============================
  // SWIM CARD #3
  // ============================
  {
    id: 'swim_card_3',
    card_number: 3,
    name: 'Swim Strength',
    category: 'swim',
    description: 'Higher volume swim with 300m continuous, 4×200m intervals, and extended treading. Integrates calisthenics for full-body conditioning.',
    difficulty: 'intermediate',
    estimated_duration: 75,
    target_muscle_groups: ['shoulders', 'back', 'core', 'legs', 'chest'],
    icon: '💧',
    total_rounds: 8,
    sections: [
      {
        id: 'sc3_pt_circuit',
        name: 'PT Circuit',
        rounds: 1,
        notes: 'Calisthenics warm-up on pool deck.',
        exercises: [
          { exercise_id: 'air_squats', order: 1, prescribed_reps: 20 },
          { exercise_id: 'pushups', order: 2, prescribed_reps: 15 },
          { exercise_id: 'usmc_crunches', order: 3, prescribed_reps: 30 },
          { exercise_id: 'flutter_kicks', order: 4, prescribed_reps: 20 },
        ],
      },
      {
        id: 'sc3_main_swim',
        name: '300m Swim',
        rounds: 1,
        notes: 'Continuous 300m. Build on Card 2 time.',
        exercises: [
          { exercise_id: 'swim_300m', order: 1, notes: 'Beat your Card 2 time' },
        ],
      },
      {
        id: 'sc3_tread',
        name: 'Tread Water',
        rounds: 1,
        notes: 'Extended treading.',
        exercises: [
          { exercise_id: 'tread_water', order: 1, prescribed_duration: 660, notes: '11+ minutes' },
        ],
      },
      {
        id: 'sc3_intervals',
        name: '200m Intervals',
        rounds: 4,
        rest_between_rounds: 60,
        notes: '4×200m with 60 sec rest.',
        exercises: [
          { exercise_id: 'swim_200m', order: 1, notes: 'Moderate to hard pace' },
        ],
      },
      {
        id: 'sc3_floor_pt',
        name: 'Floor PT',
        rounds: 1,
        notes: 'Calisthenics on pool deck.',
        exercises: [
          { exercise_id: 'air_squats', order: 1, prescribed_reps: 20 },
          { exercise_id: 'pullups', order: 2, prescribed_reps: 8 },
          { exercise_id: 'chinups', order: 3, prescribed_reps: 8 },
          { exercise_id: 'pullups', order: 4, prescribed_reps: 5, notes: 'Burnout set' },
        ],
      },
    ],
  },

  // ============================
  // SWIM CARD #4
  // ============================
  {
    id: 'swim_card_4',
    card_number: 4,
    name: 'Combat Swim',
    category: 'swim',
    description: 'Advanced swim training with 300m for time, hands-up treading, extended tread, and 100m intervals. Simulates combat water conditions.',
    difficulty: 'advanced',
    estimated_duration: 80,
    target_muscle_groups: ['shoulders', 'back', 'core', 'legs', 'cardiovascular'],
    icon: '⚓',
    total_rounds: 9,
    sections: [
      {
        id: 'sc4_warmup',
        name: 'Swim Warm-Up',
        rounds: 2,
        rest_between_rounds: 15,
        notes: '2×50m easy swim.',
        exercises: [
          { exercise_id: 'swim_50m', order: 1, notes: 'Easy pace warm-up' },
        ],
      },
      {
        id: 'sc4_pt',
        name: 'Pool-Side PT',
        rounds: 1,
        notes: 'Calisthenics on deck.',
        exercises: [
          { exercise_id: 'pushups', order: 1, prescribed_reps: 15 },
          { exercise_id: 'air_squats', order: 2, prescribed_reps: 20 },
          { exercise_id: 'usmc_crunches', order: 3, prescribed_reps: 30 },
        ],
      },
      {
        id: 'sc4_main',
        name: '300m Timed Swim',
        rounds: 1,
        notes: 'Beat your previous 300m time.',
        exercises: [
          { exercise_id: 'swim_300m', order: 1, notes: 'All-out effort' },
        ],
      },
      {
        id: 'sc4_tread_advanced',
        name: 'Advanced Treading',
        rounds: 1,
        notes: 'Hands-up tread then full 11 min tread.',
        exercises: [
          { exercise_id: 'tread_hands_up', order: 1, notes: '15 sec each hand, then both' },
          { exercise_id: 'tread_water', order: 2, prescribed_duration: 660, notes: '11 minutes' },
        ],
      },
      {
        id: 'sc4_intervals',
        name: '100m Intervals',
        rounds: 4,
        rest_between_rounds: 30,
        notes: '4×100m with 30 sec rest.',
        exercises: [
          { exercise_id: 'swim_100m', order: 1, notes: 'Hard pace' },
        ],
      },
      {
        id: 'sc4_finish',
        name: 'Finisher PT',
        rounds: 1,
        notes: 'Pool-side PT.',
        exercises: [
          { exercise_id: 'pushups', order: 1, prescribed_reps: 15 },
          { exercise_id: 'flutter_kicks', order: 2, prescribed_reps: 20 },
          { exercise_id: 'pullups', order: 3, prescribed_reps: 8 },
        ],
      },
    ],
  },

  // ============================
  // SWIM CARD #5
  // ============================
  {
    id: 'swim_card_5',
    card_number: 5,
    name: 'A&S Swim Prep',
    category: 'swim',
    description: 'Final swim preparation. 500m for time, underwater swimming, extended treading. This is as close to A&S Phase I water assessment as training gets.',
    difficulty: 'advanced',
    estimated_duration: 85,
    target_muscle_groups: ['full body', 'cardiovascular', 'mental toughness'],
    icon: '🦈',
    total_rounds: 7,
    sections: [
      {
        id: 'sc5_warmup',
        name: 'Swim Warm-Up',
        rounds: 4,
        rest_between_rounds: 15,
        notes: '4×25m easy.',
        exercises: [
          { exercise_id: 'swim_25m', order: 1, notes: 'Easy pace' },
        ],
      },
      {
        id: 'sc5_pt',
        name: 'Pool-Side PT',
        rounds: 1,
        notes: 'Calisthenics on deck.',
        exercises: [
          { exercise_id: 'pushups', order: 1, prescribed_reps: 20 },
          { exercise_id: 'air_squats', order: 2, prescribed_reps: 25 },
          { exercise_id: 'usmc_crunches', order: 3, prescribed_reps: 40 },
        ],
      },
      {
        id: 'sc5_main',
        name: '500m Timed Swim',
        rounds: 1,
        notes: 'Full 500m for time. Target under 15 minutes.',
        exercises: [
          { exercise_id: 'swim_500m', order: 1, notes: 'Target under 15 min. Record your time.' },
        ],
      },
      {
        id: 'sc5_tread',
        name: 'Extended Tread',
        rounds: 1,
        notes: 'Build toward 30 min treading.',
        exercises: [
          { exercise_id: 'tread_water', order: 1, prescribed_duration: 900, notes: '15+ minutes' },
        ],
      },
      {
        id: 'sc5_underwater',
        name: 'Underwater Swim',
        rounds: 1,
        notes: 'Pool-length underwater swim. Practice breath control.',
        exercises: [
          { exercise_id: 'underwater_swim', order: 1, notes: 'Full pool length' },
        ],
      },
      {
        id: 'sc5_cooldown',
        name: 'Cool-Down Swim',
        rounds: 1,
        notes: 'Easy 25m to finish.',
        exercises: [
          { exercise_id: 'swim_25m', order: 1, notes: 'Easy recovery' },
          { exercise_id: 'pullups', order: 2, prescribed_reps: 10, notes: 'Final set' },
        ],
      },
    ],
  },
];

export function getMovementCard(id: string): MovementCard | undefined {
  return movementCards.find(c => c.id === id);
}

export function getMovementCardByNumber(cardNumber: number, category?: string): MovementCard | undefined {
  return movementCards.find(c =>
    c.card_number === cardNumber && (!category || c.category === category)
  );
}

export function getCardsByCategory(category: MovementCard['category']): MovementCard[] {
  return movementCards.filter(c => c.category === category);
}

export function getAllMovementCards(): MovementCard[] {
  return movementCards.filter(c => c.category !== 'swim');
}

export function getAllSwimCards(): MovementCard[] {
  return movementCards.filter(c => c.category === 'swim');
}
