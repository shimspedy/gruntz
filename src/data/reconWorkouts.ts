import { WorkoutDay } from '../types';

// ============================================================
// RECON PREP 12-WEEK TRAINING PLAN
// Based on a 12-week tactical selection preparation program
//
// 3 Phases: Phase 1 (Wk 1-4), Phase 2 (Wk 5-8), Phase 3 (Wk 9-12)
// Each phase: 3 weeks ramp + 1 week de-load
// 6 training days per week (Day 1-6)
//
// Day patterns:
//   Day 1: Lower Body Strength + Sprint Intervals
//   Day 2: Upper Body Strength + Flush / Track / Tempo
//   Day 3: Track Repeats / Tempo Run
//   Day 4: Lower Body Strength 2 + Sprint Intervals
//   Day 5: Upper Body / Assessment + Flush
//   Day 6: Long Run / Ruck
// ============================================================

// Reusable prep blocks
const PREP_LOWER_P1 = ['worlds_greatest_stretch', 'air_squats', 'rear_lunge_warmup'];
const PREP_UPPER_P1 = ['straight_arm_pulls', 'thoracic_rotations', 'bench_press']; // empty barbell bench as warmup
const PREP_PRESS = ['lat_hang_stretch', 'db_curl_to_press', 'strict_standing_press']; // empty barbell
const PREP_P2_STRENGTH = ['light_bent_over_row', 'light_overhead_press', 'light_squat'];
const PREP_P2_PULL = ['rear_lunge_warmup', 'straight_arm_pulls', 'bodyweight_hip_thrusts'];

export const reconWorkouts: WorkoutDay[] = [
  // ============================================================
  // PHASE 1 — WEEK 1 (RPE 7-9)
  // ============================================================
  {
    id: 'recon_w1d1', week: 1, day: 1,
    title: 'Lower Strength + Sprints',
    objective: 'Build squat and posterior chain strength. Back Squat 4x6, RDL 4x10, accessories, then sprint intervals.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w1d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_LOWER_P1 },
      { id: 'rc_w1d1_main', type: 'workout', title: 'Strength', instructions: 'Build each set. Rest 1-2 min between sets.', exercises: ['back_squat', 'rdl', 'weighted_step_up', 'kb_swings', 'lateral_lunge'] },
      { id: 'rc_w1d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 90s EASY on non-impact machine.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w1d2', week: 1, day: 2,
    title: 'Upper Strength + Flush',
    objective: 'Bench Press 4x6, Strict Pull-Ups 3x4, accessories, then 20min flush.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w1d2_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_UPPER_P1 },
      { id: 'rc_w1d2_main', type: 'workout', title: 'Strength', instructions: 'Build each set. Rest 1-2 min.', exercises: ['bench_press', 'strict_pullup', 'bent_over_rows', 'close_grip_pushups', 'bent_over_reverse_flys'] },
      { id: 'rc_w1d2_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush on non-impact machine.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 180, coins: 18 },
  },
  {
    id: 'recon_w1d3', week: 1, day: 3,
    title: 'Track: 400m Repeats',
    objective: '8x400m with 400m recovery walk between each rep. Use assessment-based splits.',
    estimated_duration: 60,
    sections: [
      { id: 'rc_w1d3_warm', type: 'warmup', title: 'Warm-Up', instructions: '10-20 min easy jog.', exercises: ['easy_pace_run'] },
      { id: 'rc_w1d3_main', type: 'cardio', title: 'Track Repeats', instructions: '8x400m w/400m recovery walk between reps.', exercises: ['run_400m_repeats'] },
    ],
    rewards: { xp: 180, coins: 18 },
  },
  {
    id: 'recon_w1d4', week: 1, day: 4,
    title: 'Lower Strength 2 + Sprints',
    objective: 'Deadlift 4x6, Rear Lunges 4x8/side, accessories, then 30s/30s sprint intervals.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w1d4_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_LOWER_P1 },
      { id: 'rc_w1d4_main', type: 'workout', title: 'Strength', instructions: 'Build each set. Rest 1-2 min.', exercises: ['deadlift', 'weighted_rear_lunges', 'split_squats', 'hip_thrusts', 'single_leg_rdl'] },
      { id: 'rc_w1d4_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 30s EASY on non-impact machine.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w1d5', week: 1, day: 5,
    title: 'Press + Assessment Work + Flush',
    objective: 'Strict Press 4x6, Inverted Rows, accessories. Push-ups & sit-ups at 50% of assessment. 20min flush.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w1d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_PRESS },
      { id: 'rc_w1d5_main', type: 'workout', title: 'Strength', instructions: 'Build each set. Rest 1-2 min.', exercises: ['strict_standing_press', 'inverted_rows', 'hanging_leg_raises', 'dips', 'face_pulls'] },
      { id: 'rc_w1d5_assess', type: 'test', title: 'Assessment Work', instructions: '3 sets each at 50% of assessment max.', exercises: ['strict_pushups', 'strict_situps'] },
      { id: 'rc_w1d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush on non-impact machine.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 190, coins: 19 },
  },
  {
    id: 'recon_w1d6', week: 1, day: 6,
    title: '3-Mile Easy Run',
    objective: 'Zone 2 easy pace run. Conversation pace. ~2 min/mi slower than assessment.',
    estimated_duration: 50,
    sections: [
      { id: 'rc_w1d6_main', type: 'cardio', title: 'Easy Run', instructions: '10-20 min warm up. 3 miles at easy pace. Zone 2. 10 min cool.', exercises: ['easy_pace_run'] },
    ],
    rewards: { xp: 150, coins: 15 },
  },

  // ============================================================
  // PHASE 1 — WEEK 2 (RPE 7-9)
  // ============================================================
  {
    id: 'recon_w2d1', week: 2, day: 1,
    title: 'Lower Strength + Sprints',
    objective: 'Back Squat 4x4 (heavier). RDL 4x10, accessories, sprint intervals.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w2d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_LOWER_P1 },
      { id: 'rc_w2d1_main', type: 'workout', title: 'Strength', instructions: 'Build each set. 4x4 Back Squat.', exercises: ['back_squat', 'rdl', 'weighted_step_up', 'kb_swings', 'lateral_lunge'] },
      { id: 'rc_w2d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 90s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 210, coins: 21 },
  },
  {
    id: 'recon_w2d2', week: 2, day: 2,
    title: 'Upper Strength + Flush',
    objective: 'Bench Press 4x4, Strict Pull-Ups 3x5, accessories, 20min flush.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w2d2_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_UPPER_P1 },
      { id: 'rc_w2d2_main', type: 'workout', title: 'Strength', instructions: 'Build each set. 4x4 BP, 3x5 Pull-Ups.', exercises: ['bench_press', 'strict_pullup', 'bent_over_rows', 'close_grip_pushups', 'bent_over_reverse_flys'] },
      { id: 'rc_w2d2_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 190, coins: 19 },
  },
  {
    id: 'recon_w2d3', week: 2, day: 3,
    title: 'Short Tempo Run',
    objective: '1mi warm, 2mi at short tempo (20s slower than assessment), 1mi cool.',
    estimated_duration: 50,
    sections: [
      { id: 'rc_w2d3_main', type: 'cardio', title: 'Tempo Run', instructions: '1mi warm (untimed) → 2mi short tempo → 1mi cool.', exercises: ['tempo_run_short'] },
    ],
    rewards: { xp: 170, coins: 17 },
  },
  {
    id: 'recon_w2d4', week: 2, day: 4,
    title: 'Lower Strength 2 + Sprints',
    objective: 'Deadlift 4x4, Rear Lunges 4x8/side, accessories. 30s/30s intervals.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w2d4_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_LOWER_P1 },
      { id: 'rc_w2d4_main', type: 'workout', title: 'Strength', instructions: 'Build each set. DL 4x4.', exercises: ['deadlift', 'weighted_rear_lunges', 'split_squats', 'hip_thrusts', 'single_leg_rdl'] },
      { id: 'rc_w2d4_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 30s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 210, coins: 21 },
  },
  {
    id: 'recon_w2d5', week: 2, day: 5,
    title: 'Press + Assessment Work + Flush',
    objective: 'Strict Press 4x4, Inverted Rows, accessories. Push-ups & sit-ups at 55% assessment. 20min flush.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w2d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_PRESS },
      { id: 'rc_w2d5_main', type: 'workout', title: 'Strength', instructions: 'Build each set. SP 4x4.', exercises: ['strict_standing_press', 'inverted_rows', 'hanging_leg_raises', 'dips', 'face_pulls'] },
      { id: 'rc_w2d5_assess', type: 'test', title: 'Assessment Work', instructions: '3 sets each at 55% of assessment max.', exercises: ['strict_pushups', 'strict_situps'] },
      { id: 'rc_w2d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w2d6', week: 2, day: 6,
    title: '4-Mile Ruck (35#)',
    objective: 'Ruck 4 miles with 35lb pack.',
    estimated_duration: 60,
    sections: [
      { id: 'rc_w2d6_main', type: 'ruck', title: 'Ruck March', instructions: 'Ruck 4 miles at 35#. No running.', exercises: ['ruck_4mi_35'] },
    ],
    rewards: { xp: 170, coins: 17 },
  },

  // ============================================================
  // PHASE 1 — WEEK 3 (RPE 8-9)
  // ============================================================
  {
    id: 'recon_w3d1', week: 3, day: 1,
    title: 'Lower Strength + Sprints',
    objective: 'Back Squat 4x3 (heavy). RDL 4x8, accessories, sprint intervals.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w3d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_LOWER_P1 },
      { id: 'rc_w3d1_main', type: 'workout', title: 'Strength', instructions: 'Build each set. 4x3 BS, 4x8 RDL.', exercises: ['back_squat', 'rdl', 'weighted_step_up', 'kb_swings', 'lateral_lunge'] },
      { id: 'rc_w3d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 90s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 220, coins: 22 },
  },
  {
    id: 'recon_w3d2', week: 3, day: 2,
    title: 'Upper Strength + Flush',
    objective: 'Bench Press 4x3, Strict Pull-Ups 3x6, accessories, 20min flush.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w3d2_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_UPPER_P1 },
      { id: 'rc_w3d2_main', type: 'workout', title: 'Strength', instructions: 'Build each set. 4x3 BP, 3x6 Pull-Ups.', exercises: ['bench_press', 'strict_pullup', 'bent_over_rows', 'close_grip_pushups', 'bent_over_reverse_flys'] },
      { id: 'rc_w3d2_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w3d3', week: 3, day: 3,
    title: 'Track: 800m Repeats',
    objective: '5x800m with 400m recovery walk between reps.',
    estimated_duration: 60,
    sections: [
      { id: 'rc_w3d3_warm', type: 'warmup', title: 'Warm-Up', instructions: '10-20 min easy jog.', exercises: ['easy_pace_run'] },
      { id: 'rc_w3d3_main', type: 'cardio', title: 'Track Repeats', instructions: '5x800m with 400m recovery walks.', exercises: ['run_800m_repeats'] },
    ],
    rewards: { xp: 190, coins: 19 },
  },
  {
    id: 'recon_w3d4', week: 3, day: 4,
    title: 'Lower Strength 2 + Sprints',
    objective: 'Deadlift 4x4, Rear Lunges, accessories. 30s/30s sprints.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w3d4_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_LOWER_P1 },
      { id: 'rc_w3d4_main', type: 'workout', title: 'Strength', instructions: 'Build each set. DL 4x4.', exercises: ['deadlift', 'weighted_rear_lunges', 'split_squats', 'hip_thrusts', 'single_leg_rdl'] },
      { id: 'rc_w3d4_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 30s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 220, coins: 22 },
  },
  {
    id: 'recon_w3d5', week: 3, day: 5,
    title: 'Press + Assessment 60% + Flush',
    objective: 'Strict Press 4x4, accessories. Push-ups & sit-ups at 60% assessment. 20min flush.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w3d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_PRESS },
      { id: 'rc_w3d5_main', type: 'workout', title: 'Strength', instructions: 'Build each. SP 4x4.', exercises: ['strict_standing_press', 'inverted_rows', 'hanging_leg_raises', 'dips', 'face_pulls'] },
      { id: 'rc_w3d5_assess', type: 'test', title: 'Assessment Work', instructions: '3 sets at 60% of assessment max.', exercises: ['strict_pushups', 'strict_situps'] },
      { id: 'rc_w3d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 210, coins: 21 },
  },
  {
    id: 'recon_w3d6', week: 3, day: 6,
    title: '4-Mile Easy Run',
    objective: 'Zone 2 easy pace. Conversation pace. 10 min warm, 4mi run, 10 min cool.',
    estimated_duration: 60,
    sections: [
      { id: 'rc_w3d6_main', type: 'cardio', title: 'Easy Run', instructions: '4 miles Zone 2. Add warm-up/cool-down.', exercises: ['easy_pace_run'] },
    ],
    rewards: { xp: 160, coins: 16 },
  },

  // ============================================================
  // PHASE 1 — WEEK 4 (DE-LOAD)
  // ============================================================
  {
    id: 'recon_w4d1', week: 4, day: 1,
    title: 'De-load: Lower Strength',
    objective: 'Back Squat 4x3 (same weight). RDL 2x8, accessories at 2 sets. 5-6 sprint reps.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w4d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_LOWER_P1 },
      { id: 'rc_w4d1_main', type: 'workout', title: 'Strength (Reduced)', instructions: 'Same weight, reduced volume. BS 4x3, RDL 2x8, accessories 2 sets.', exercises: ['back_squat', 'rdl', 'weighted_step_up', 'kb_swings', 'lateral_lunge'] },
      { id: 'rc_w4d1_cond', type: 'cardio', title: 'Conditioning', instructions: '5-6 reps: 30s SPRINT / 90s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 150, coins: 15 },
  },
  {
    id: 'recon_w4d2', week: 4, day: 2,
    title: 'De-load: Upper Strength',
    objective: 'Bench Press 4x3, Pull-Ups 2x6, accessories at 2 sets. 20min flush.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w4d2_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_UPPER_P1 },
      { id: 'rc_w4d2_main', type: 'workout', title: 'Strength (Reduced)', instructions: 'BP 4x3, Pull-Ups 2x6, accessories 2 sets.', exercises: ['bench_press', 'strict_pullup', 'bent_over_rows', 'close_grip_pushups', 'bent_over_reverse_flys'] },
      { id: 'rc_w4d2_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 140, coins: 14 },
  },
  {
    id: 'recon_w4d3', week: 4, day: 3,
    title: 'Short Tempo Run (3mi)',
    objective: '1mi warm, 3mi at short tempo (20s slower), 1mi cool.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w4d3_main', type: 'cardio', title: 'Tempo Run', instructions: '1mi warm → 3mi short tempo → 1mi cool.', exercises: ['tempo_run_short'] },
    ],
    rewards: { xp: 180, coins: 18 },
  },
  {
    id: 'recon_w4d4', week: 4, day: 4,
    title: 'De-load: Lower Strength 2',
    objective: 'Deadlift 4x3, Rear Lunges 2x8, accessories at 2 sets. 5-6 sprint reps.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w4d4_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_LOWER_P1 },
      { id: 'rc_w4d4_main', type: 'workout', title: 'Strength (Reduced)', instructions: 'DL 4x3, accessories at 2 sets.', exercises: ['deadlift', 'weighted_rear_lunges', 'split_squats', 'hip_thrusts', 'single_leg_rdl'] },
      { id: 'rc_w4d4_cond', type: 'cardio', title: 'Conditioning', instructions: '5-6 reps: 30s SPRINT / 30s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 150, coins: 15 },
  },
  {
    id: 'recon_w4d5', week: 4, day: 5,
    title: 'De-load: Press + Assessment 60%',
    objective: 'Strict Press 4x3, Inv Rows 2x10, accessories 2 sets. Push-ups 1x60%, sit-ups 1x60%. Flush.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w4d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_PRESS },
      { id: 'rc_w4d5_main', type: 'workout', title: 'Strength (Reduced)', instructions: 'SP 4x3, Inv Rows 2x10, accessories 2 sets.', exercises: ['strict_standing_press', 'inverted_rows', 'hanging_leg_raises', 'dips', 'face_pulls'] },
      { id: 'rc_w4d5_assess', type: 'test', title: 'Assessment Work', instructions: '1 set at 60% of assessment max.', exercises: ['strict_pushups', 'strict_situps'] },
      { id: 'rc_w4d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 140, coins: 14 },
  },
  {
    id: 'recon_w4d6', week: 4, day: 6,
    title: '5-Mile Ruck (35#)',
    objective: 'Ruck 5 miles with 35lb pack.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w4d6_main', type: 'ruck', title: 'Ruck March', instructions: 'Ruck 5 miles at 35#.', exercises: ['ruck_5mi_35'] },
    ],
    rewards: { xp: 180, coins: 18 },
  },

  // ============================================================
  // PHASE 2 — WEEK 5 (RPE 7-9)
  // ============================================================
  {
    id: 'recon_w5d1', week: 5, day: 1,
    title: 'Squat + Press + AMRAP',
    objective: 'Back Squat 3x5, Strict Press 3x12. 10min AMRAP: chin-ups/push-ups/sit-ups at 30% assessment.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w5d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w5d1_main', type: 'workout', title: 'Strength', instructions: 'BS 3x5, SP 3x12.', exercises: ['back_squat', 'strict_standing_press'] },
      { id: 'rc_w5d1_amrap', type: 'workout', title: 'AMRAP (10 min)', instructions: 'As many rounds in 10 min: Chin-ups, Push-ups, Sit-ups at 30% assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w5d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 60s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 220, coins: 22 },
  },
  {
    id: 'recon_w5d2', week: 5, day: 2,
    title: 'Track: 1600m Repeats',
    objective: '2x1600m at 15s/mi faster than assessment + 1x800m same pace. Recovery walks.',
    estimated_duration: 60,
    sections: [
      { id: 'rc_w5d2_warm', type: 'warmup', title: 'Warm-Up', instructions: '10-20 min easy jog.', exercises: ['easy_pace_run'] },
      { id: 'rc_w5d2_main', type: 'cardio', title: 'Track Repeats', instructions: '2x1600m + 1x800m with 400m recovery walks.', exercises: ['run_1600m_repeats', 'run_800m_repeats'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w5d3', week: 5, day: 3,
    title: 'Deadlift + Bench + AMRAP',
    objective: 'Deadlift 3x5, Bench 4x8, Rows 3x10. 10min AMRAP: inv rows/CG push-ups/hanging leg raises.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w5d3_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_PULL },
      { id: 'rc_w5d3_main', type: 'workout', title: 'Strength', instructions: 'DL 3x5, BP 4x8, Rows 3x10.', exercises: ['deadlift', 'bench_press', 'bent_over_rows'] },
      { id: 'rc_w5d3_amrap', type: 'workout', title: 'AMRAP (10 min)', instructions: 'Inverted Rows x10, CG Push-ups x10, Hanging Leg Raises x10.', exercises: ['inverted_rows', 'close_grip_pushups', 'hanging_leg_raises'] },
      { id: 'rc_w5d3_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 220, coins: 22 },
  },
  {
    id: 'recon_w5d4', week: 5, day: 4,
    title: 'Functional AMRAP: Carries & Sleds',
    objective: '22 min AMRAP: Carry 50m, Sled/Drag 50m, Locomotive 50m.',
    estimated_duration: 50,
    sections: [
      { id: 'rc_w5d4_warm', type: 'warmup', title: 'Dynamic Warm-Up', instructions: 'General dynamic warm-up.', exercises: ['worlds_greatest_stretch', 'air_squats', 'high_knees'] },
      { id: 'rc_w5d4_main', type: 'workout', title: 'AMRAP (22 min)', instructions: 'As many rounds: Carry 50m → Sled/Drag 50m → Locomotive 50m.', exercises: ['carry_choice_50m', 'sled_drag_choice_50m', 'locomotive_choice_50m'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w5d5', week: 5, day: 5,
    title: 'Squat + Press + Assessment 50%',
    objective: 'Back Squat 4x8, Strict Press 4x5, KB Swings 4x25. Chin-ups/Push-ups/Sit-ups at 50% assessment.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w5d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w5d5_main', type: 'workout', title: 'Strength', instructions: 'BS 4x8, SP 4x5, KB 4x25.', exercises: ['back_squat', 'strict_standing_press', 'kb_swings'] },
      { id: 'rc_w5d5_assess', type: 'test', title: 'Assessment Work', instructions: '3 rounds: Chin-ups 50%, Push-ups 50%, Sit-ups 50% of assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w5d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 230, coins: 23 },
  },
  {
    id: 'recon_w5d6', week: 5, day: 6,
    title: '4-Mile Easy Run',
    objective: 'Zone 2 easy pace. 10 min warm, 4mi, 10 min cool.',
    estimated_duration: 60,
    sections: [
      { id: 'rc_w5d6_main', type: 'cardio', title: 'Easy Run', instructions: '4 miles Zone 2, conversation pace.', exercises: ['easy_pace_run'] },
    ],
    rewards: { xp: 160, coins: 16 },
  },

  // ============================================================
  // PHASE 2 — WEEK 6 (RPE 8-9)
  // ============================================================
  {
    id: 'recon_w6d1', week: 6, day: 1,
    title: 'Squat + Press + AMRAP 35%',
    objective: 'Back Squat 3x4, Strict Press 3x12. 10min AMRAP at 35% assessment.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w6d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w6d1_main', type: 'workout', title: 'Strength', instructions: 'BS 3x4, SP 3x12.', exercises: ['back_squat', 'strict_standing_press'] },
      { id: 'rc_w6d1_amrap', type: 'workout', title: 'AMRAP (10 min)', instructions: 'Chin-ups/Push-ups/Sit-ups at 35% assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w6d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 60s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 230, coins: 23 },
  },
  {
    id: 'recon_w6d2', week: 6, day: 2,
    title: 'Pyramid Track Workout',
    objective: '200-400-600-800-800-600-400-200m with 400m recovery walks.',
    estimated_duration: 65,
    sections: [
      { id: 'rc_w6d2_warm', type: 'warmup', title: 'Warm-Up', instructions: '10-20 min easy jog.', exercises: ['easy_pace_run'] },
      { id: 'rc_w6d2_main', type: 'cardio', title: 'Pyramid', instructions: 'Pyramid: 200-400-600-800-800-600-400-200m. Recovery walks.', exercises: ['pyramid_track'] },
    ],
    rewards: { xp: 210, coins: 21 },
  },
  {
    id: 'recon_w6d3', week: 6, day: 3,
    title: 'Deadlift + Bench + AMRAP',
    objective: 'Deadlift 3x4, Bench 4x8, Rows 3x10. 11min AMRAP.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w6d3_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_PULL },
      { id: 'rc_w6d3_main', type: 'workout', title: 'Strength', instructions: 'DL 3x4, BP 4x8, Rows 3x10.', exercises: ['deadlift', 'bench_press', 'bent_over_rows'] },
      { id: 'rc_w6d3_amrap', type: 'workout', title: 'AMRAP (11 min)', instructions: 'Inv Rows x10, CG Push-ups x10, HLR x10.', exercises: ['inverted_rows', 'close_grip_pushups', 'hanging_leg_raises'] },
      { id: 'rc_w6d3_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 230, coins: 23 },
  },
  {
    id: 'recon_w6d4', week: 6, day: 4,
    title: 'Functional AMRAP: 24 min',
    objective: '24 min AMRAP: Carry 50m, Sled/Drag 50m, Locomotive 50m.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w6d4_warm', type: 'warmup', title: 'Dynamic Warm-Up', instructions: 'General dynamic warm-up.', exercises: ['worlds_greatest_stretch', 'air_squats', 'high_knees'] },
      { id: 'rc_w6d4_main', type: 'workout', title: 'AMRAP (24 min)', instructions: 'As many rounds. Increase from 22 to 24 min this week.', exercises: ['carry_choice_50m', 'sled_drag_choice_50m', 'locomotive_choice_50m'] },
    ],
    rewards: { xp: 210, coins: 21 },
  },
  {
    id: 'recon_w6d5', week: 6, day: 5,
    title: 'Squat + KB + Assessment 55%',
    objective: 'Back Squat 4x6, Strict Press 4x5, KB 2x50. Assessment 55%.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w6d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w6d5_main', type: 'workout', title: 'Strength', instructions: 'BS 4x6, SP 4x5, KB 2x50.', exercises: ['back_squat', 'strict_standing_press', 'kb_swings'] },
      { id: 'rc_w6d5_assess', type: 'test', title: 'Assessment Work', instructions: '3 rounds at 55% of assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w6d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 240, coins: 24 },
  },
  {
    id: 'recon_w6d6', week: 6, day: 6,
    title: '6-Mile Ruck (35#)',
    objective: 'Ruck 6 miles with 35lb pack. 10 min warm, 10 min cool.',
    estimated_duration: 90,
    sections: [
      { id: 'rc_w6d6_main', type: 'ruck', title: 'Ruck March', instructions: 'Ruck 6 miles at 35#.', exercises: ['ruck_6mi_35'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },

  // ============================================================
  // PHASE 2 — WEEK 7 (RPE 8-9)
  // ============================================================
  {
    id: 'recon_w7d1', week: 7, day: 1,
    title: 'Squat + Press + AMRAP 40%',
    objective: 'Back Squat 3x4, Strict Press 3x10. 10min AMRAP at 40% assessment. 30s/45s sprints.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w7d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w7d1_main', type: 'workout', title: 'Strength', instructions: 'BS 3x4, SP 3x10.', exercises: ['back_squat', 'strict_standing_press'] },
      { id: 'rc_w7d1_amrap', type: 'workout', title: 'AMRAP (10 min)', instructions: 'Chin-ups/Push-ups/Sit-ups at 40% assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w7d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 45s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 240, coins: 24 },
  },
  {
    id: 'recon_w7d2', week: 7, day: 2,
    title: 'Mid Tempo Run (4mi)',
    objective: '1mi warm, 4mi at mid tempo (40s slower), 1mi cool.',
    estimated_duration: 65,
    sections: [
      { id: 'rc_w7d2_main', type: 'cardio', title: 'Tempo Run', instructions: '1mi warm → 4mi mid tempo → 1mi cool. 40s slower than assessment.', exercises: ['tempo_run_mid'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w7d3', week: 7, day: 3,
    title: 'Deadlift + Bench + AMRAP (12 min)',
    objective: 'Deadlift 3x4, Bench 4x6, Rows 3x10. 12min AMRAP.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w7d3_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_PULL },
      { id: 'rc_w7d3_main', type: 'workout', title: 'Strength', instructions: 'DL 3x4, BP 4x6, Rows 3x10.', exercises: ['deadlift', 'bench_press', 'bent_over_rows'] },
      { id: 'rc_w7d3_amrap', type: 'workout', title: 'AMRAP (12 min)', instructions: 'Inv Rows x10, CG Push-ups x10, HLR x10.', exercises: ['inverted_rows', 'close_grip_pushups', 'hanging_leg_raises'] },
      { id: 'rc_w7d3_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 240, coins: 24 },
  },
  {
    id: 'recon_w7d4', week: 7, day: 4,
    title: 'Functional AMRAP: 26 min',
    objective: '26 min AMRAP: Carry 50m, Sled/Drag 50m, Locomotive 50m.',
    estimated_duration: 60,
    sections: [
      { id: 'rc_w7d4_warm', type: 'warmup', title: 'Dynamic Warm-Up', instructions: 'General dynamic warm-up.', exercises: ['worlds_greatest_stretch', 'air_squats', 'high_knees'] },
      { id: 'rc_w7d4_main', type: 'workout', title: 'AMRAP (26 min)', instructions: 'As many rounds. Continue increasing duration.', exercises: ['carry_choice_50m', 'sled_drag_choice_50m', 'locomotive_choice_50m'] },
    ],
    rewards: { xp: 220, coins: 22 },
  },
  {
    id: 'recon_w7d5', week: 7, day: 5,
    title: 'Squat + KB + Assessment 65%',
    objective: 'Back Squat 4x5, Strict Press 4x3, KB 2x50. Assessment 65%.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w7d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w7d5_main', type: 'workout', title: 'Strength', instructions: 'BS 4x5, SP 4x3, KB 2x50.', exercises: ['back_squat', 'strict_standing_press', 'kb_swings'] },
      { id: 'rc_w7d5_assess', type: 'test', title: 'Assessment Work', instructions: '3 rounds at 65% of assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w7d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 250, coins: 25 },
  },
  {
    id: 'recon_w7d6', week: 7, day: 6,
    title: '5-Mile Easy Run',
    objective: 'Zone 2, conversation pace. 10 min warm, 5mi, 10 min cool.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w7d6_main', type: 'cardio', title: 'Easy Run', instructions: '5 miles Zone 2.', exercises: ['easy_pace_run'] },
    ],
    rewards: { xp: 180, coins: 18 },
  },

  // ============================================================
  // PHASE 2 — WEEK 8 (DE-LOAD)
  // ============================================================
  {
    id: 'recon_w8d1', week: 8, day: 1,
    title: 'De-load: Squat + AMRAP (5 min)',
    objective: 'Back Squat 2x4, Strict Press 2x8. 5min AMRAP at 40%. Reduced sprints.',
    estimated_duration: 50,
    sections: [
      { id: 'rc_w8d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w8d1_main', type: 'workout', title: 'Strength (Reduced)', instructions: 'BS 2x4, SP 2x8.', exercises: ['back_squat', 'strict_standing_press'] },
      { id: 'rc_w8d1_amrap', type: 'workout', title: 'AMRAP (5 min)', instructions: 'Reduced to 5 min. 40% assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w8d1_cond', type: 'cardio', title: 'Conditioning', instructions: '6-8 reps: 30s SPRINT / 45s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 140, coins: 14 },
  },
  {
    id: 'recon_w8d2', week: 8, day: 2,
    title: 'De-load: Ruck (35# Fast)',
    objective: 'Ruck 4 miles at 35#. 15-20s faster per mile. No running.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w8d2_main', type: 'ruck', title: 'Fast Ruck', instructions: '4mi at 35#, 15-20s/mi faster. No running.', exercises: ['ruck_4mi_35_fast'] },
    ],
    rewards: { xp: 160, coins: 16 },
  },
  {
    id: 'recon_w8d3', week: 8, day: 3,
    title: 'De-load: Deadlift + AMRAP (6 min)',
    objective: 'Deadlift 3x3, Bench 4x6, Rows 3x10. 6min AMRAP.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w8d3_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_PULL },
      { id: 'rc_w8d3_main', type: 'workout', title: 'Strength (Reduced)', instructions: 'DL 3x3, BP 4x6, Rows 3x10.', exercises: ['deadlift', 'bench_press', 'bent_over_rows'] },
      { id: 'rc_w8d3_amrap', type: 'workout', title: 'AMRAP (6 min)', instructions: 'Inv Rows x10, CG Push-ups x10, HLR x10.', exercises: ['inverted_rows', 'close_grip_pushups', 'hanging_leg_raises'] },
      { id: 'rc_w8d3_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 140, coins: 14 },
  },
  {
    id: 'recon_w8d4', week: 8, day: 4,
    title: 'De-load: Functional (12 min)',
    objective: '12 min AMRAP. Reduced volume.',
    estimated_duration: 40,
    sections: [
      { id: 'rc_w8d4_warm', type: 'warmup', title: 'Dynamic Warm-Up', instructions: 'General dynamic warm-up.', exercises: ['worlds_greatest_stretch', 'air_squats', 'high_knees'] },
      { id: 'rc_w8d4_main', type: 'workout', title: 'AMRAP (12 min)', instructions: 'Reduced from 26 to 12 min.', exercises: ['carry_choice_50m', 'sled_drag_choice_50m', 'locomotive_choice_50m'] },
    ],
    rewards: { xp: 130, coins: 13 },
  },
  {
    id: 'recon_w8d5', week: 8, day: 5,
    title: 'De-load: Squat + KB + Assessment 65%',
    objective: 'Back Squat 4x3, Strict Press 4x3, KB 2x50. 2 rounds at 65%.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w8d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w8d5_main', type: 'workout', title: 'Strength (Reduced)', instructions: 'BS 4x3, SP 4x3, KB 2x50.', exercises: ['back_squat', 'strict_standing_press', 'kb_swings'] },
      { id: 'rc_w8d5_assess', type: 'test', title: 'Assessment Work', instructions: '2 rounds at 65% of assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w8d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 150, coins: 15 },
  },
  {
    id: 'recon_w8d6', week: 8, day: 6,
    title: '1000m Repeats',
    objective: '4x1000m with 400m recovery walks.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w8d6_warm', type: 'warmup', title: 'Warm-Up', instructions: '10-20 min easy jog.', exercises: ['easy_pace_run'] },
      { id: 'rc_w8d6_main', type: 'cardio', title: '1000m Repeats', instructions: '4x1000m with 400m recovery walks.', exercises: ['run_1000m_repeats'] },
    ],
    rewards: { xp: 170, coins: 17 },
  },

  // ============================================================
  // PHASE 3 — WEEK 9 (RPE 8-9)
  // ============================================================
  {
    id: 'recon_w9d1', week: 9, day: 1,
    title: 'Peak: Squat 5x5 + AMRAP 60%',
    objective: 'Back Squat 5x5. Strict Press 3x10. 10min AMRAP at 60% assessment.',
    estimated_duration: 80,
    sections: [
      { id: 'rc_w9d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w9d1_main', type: 'workout', title: 'Strength', instructions: 'BS 5x5 — peak volume. SP 3x10.', exercises: ['back_squat', 'strict_standing_press'] },
      { id: 'rc_w9d1_amrap', type: 'workout', title: 'AMRAP (10 min)', instructions: '60% assessment. Significant jump.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w9d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 45s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 260, coins: 26 },
  },
  {
    id: 'recon_w9d2', week: 9, day: 2,
    title: '3-Mile Heavy Ruck (55-60#)',
    objective: 'Heavy ruck 3 miles at 55-60lb. Build load tolerance.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w9d2_main', type: 'ruck', title: 'Heavy Ruck', instructions: '3 miles at 55-60#. Push pace.', exercises: ['ruck_3mi_heavy'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w9d3', week: 9, day: 3,
    title: 'Sled Complex + Carries',
    objective: 'Build-ups, Sled Pull 6x50m, Pinch Carry 6x60m, Sled Push 6x50m with chin-ups/rows/sit-ups.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w9d3_warm', type: 'warmup', title: 'Dynamic Warm-Up', instructions: 'General dynamic warm-up.', exercises: ['worlds_greatest_stretch', 'air_squats', 'high_knees'] },
      { id: 'rc_w9d3_buildups', type: 'workout', title: 'Build-Ups', instructions: '6-8 x 40yd at 85-90%.', exercises: ['running_buildups'] },
      { id: 'rc_w9d3_main', type: 'workout', title: 'Sled Complex', instructions: 'B1/B2, C1/C2, D1/D2 pairs. 60-90s rest between.', exercises: ['sled_pull_backwards', 'strict_chinups', 'pinch_grip_plate_carry', 'gorilla_rows', 'sled_push_quick', 'strict_situps'] },
    ],
    rewards: { xp: 250, coins: 25 },
  },
  {
    id: 'recon_w9d4', week: 9, day: 4,
    title: 'Short Tempo Run (3mi)',
    objective: '1mi warm, 3mi short tempo, 1mi cool.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w9d4_main', type: 'cardio', title: 'Tempo Run', instructions: '1mi warm → 3mi short tempo → 1mi cool.', exercises: ['tempo_run_short'] },
    ],
    rewards: { xp: 190, coins: 19 },
  },
  {
    id: 'recon_w9d5', week: 9, day: 5,
    title: 'Peak: Deadlift 5x5 + Rounds',
    objective: 'Deadlift 5x5, Bench 4x6, Rows 3x10. 4 rounds: Inv Rows/CG Push-ups/HLR.',
    estimated_duration: 80,
    sections: [
      { id: 'rc_w9d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_PULL },
      { id: 'rc_w9d5_main', type: 'workout', title: 'Strength', instructions: 'DL 5x5, BP 4x6, Rows 3x10.', exercises: ['deadlift', 'bench_press', 'bent_over_rows'] },
      { id: 'rc_w9d5_circuit', type: 'workout', title: 'Circuit (4 rounds)', instructions: 'Inv Rows x10, CG Push-ups x10, HLR x10.', rounds: 4, exercises: ['inverted_rows', 'close_grip_pushups', 'hanging_leg_raises'] },
      { id: 'rc_w9d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 260, coins: 26 },
  },
  {
    id: 'recon_w9d6', week: 9, day: 6,
    title: '5-Mile Easy Run',
    objective: 'Zone 2 easy pace. 5 miles.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w9d6_main', type: 'cardio', title: 'Easy Run', instructions: '5 miles Zone 2. Warm-up/cool-down.', exercises: ['easy_pace_run'] },
    ],
    rewards: { xp: 180, coins: 18 },
  },

  // ============================================================
  // PHASE 3 — WEEK 10 (RPE 7-9)
  // ============================================================
  {
    id: 'recon_w10d1', week: 10, day: 1,
    title: 'Squat 5x4 + AMRAP 65%',
    objective: 'Back Squat 5x4. Strict Press 3x10. 10min AMRAP at 65% assessment.',
    estimated_duration: 80,
    sections: [
      { id: 'rc_w10d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w10d1_main', type: 'workout', title: 'Strength', instructions: 'BS 5x4, SP 3x10.', exercises: ['back_squat', 'strict_standing_press'] },
      { id: 'rc_w10d1_amrap', type: 'workout', title: 'AMRAP (10 min)', instructions: '65% assessment.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w10d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 45s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 260, coins: 26 },
  },
  {
    id: 'recon_w10d2', week: 10, day: 2,
    title: '6-Mile Easy Run',
    objective: 'Zone 2, 6 miles. Conversation pace.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w10d2_main', type: 'cardio', title: 'Easy Run', instructions: '6 miles Zone 2.', exercises: ['easy_pace_run'] },
    ],
    rewards: { xp: 190, coins: 19 },
  },
  {
    id: 'recon_w10d3', week: 10, day: 3,
    title: 'Sled Complex (Progressive)',
    objective: 'Build-ups, Sled Pull 7x50m, Pinch Carry 6x60m, Sled Push 7x50m.',
    estimated_duration: 70,
    sections: [
      { id: 'rc_w10d3_buildups', type: 'workout', title: 'Build-Ups', instructions: '6-8 x 40yd at 85-90%.', exercises: ['running_buildups'] },
      { id: 'rc_w10d3_main', type: 'workout', title: 'Sled Complex', instructions: 'Increased volume: 7 sets sled work.', exercises: ['sled_pull_backwards', 'strict_chinups', 'pinch_grip_plate_carry', 'gorilla_rows', 'sled_push_quick', 'strict_situps'] },
    ],
    rewards: { xp: 250, coins: 25 },
  },
  {
    id: 'recon_w10d4', week: 10, day: 4,
    title: 'Alternating Tempo Miles',
    objective: '1mi warm → 1mi tempo → 1mi easy → 1mi tempo → 1mi easy → 1mi tempo → 1mi cool.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w10d4_main', type: 'cardio', title: 'Alternating Tempo', instructions: '7 miles: alternate tempo/easy. Short tempo pace.', exercises: ['tempo_run_short'] },
    ],
    rewards: { xp: 220, coins: 22 },
  },
  {
    id: 'recon_w10d5', week: 10, day: 5,
    title: 'Deadlift 5x4 + 5 Rounds',
    objective: 'Deadlift 5x4, Bench 4x6, Rows 3x10. 5 rounds circuit.',
    estimated_duration: 80,
    sections: [
      { id: 'rc_w10d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_PULL },
      { id: 'rc_w10d5_main', type: 'workout', title: 'Strength', instructions: 'DL 5x4, BP 4x6, Rows 3x10.', exercises: ['deadlift', 'bench_press', 'bent_over_rows'] },
      { id: 'rc_w10d5_circuit', type: 'workout', title: 'Circuit (5 rounds)', instructions: 'Inv Rows x10, CG Push-ups x10, HLR x10.', rounds: 5, exercises: ['inverted_rows', 'close_grip_pushups', 'hanging_leg_raises'] },
      { id: 'rc_w10d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 270, coins: 27 },
  },
  {
    id: 'recon_w10d6', week: 10, day: 6,
    title: '4-Mile Ruck (35# Fast)',
    objective: 'Ruck 4 miles 35#. 15-20s faster per mile. No running.',
    estimated_duration: 55,
    sections: [
      { id: 'rc_w10d6_main', type: 'ruck', title: 'Fast Ruck', instructions: '4mi at 35#, push pace. No running.', exercises: ['ruck_4mi_35_fast'] },
    ],
    rewards: { xp: 170, coins: 17 },
  },

  // ============================================================
  // PHASE 3 — WEEK 11 (RPE 8-9)
  // ============================================================
  {
    id: 'recon_w11d1', week: 11, day: 1,
    title: 'Peak: Squat 5x3 + AMRAP 70%',
    objective: 'Back Squat 5x3 (heaviest). Strict Press 3x10. 10min AMRAP at 70% assessment.',
    estimated_duration: 80,
    sections: [
      { id: 'rc_w11d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w11d1_main', type: 'workout', title: 'Strength', instructions: 'BS 5x3 — peak intensity. SP 3x10.', exercises: ['back_squat', 'strict_standing_press'] },
      { id: 'rc_w11d1_amrap', type: 'workout', title: 'AMRAP (10 min)', instructions: '70% assessment — highest yet.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w11d1_cond', type: 'cardio', title: 'Conditioning', instructions: '10-12 reps: 30s SPRINT / 45s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 280, coins: 28 },
  },
  {
    id: 'recon_w11d2', week: 11, day: 2,
    title: '7-Mile Easy Run',
    objective: 'Zone 2, 7 miles. Longest run of the program.',
    estimated_duration: 85,
    sections: [
      { id: 'rc_w11d2_main', type: 'cardio', title: 'Easy Run', instructions: '7 miles Zone 2. Longest run.', exercises: ['easy_pace_run'] },
    ],
    rewards: { xp: 210, coins: 21 },
  },
  {
    id: 'recon_w11d3', week: 11, day: 3,
    title: 'Sled Complex (Peak Volume)',
    objective: 'Build-ups 6-8x40yd. Sled Pull 8x50m, Pinch Carry 6x60m, Sled Push 8x50m.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w11d3_buildups', type: 'workout', title: 'Build-Ups', instructions: '6-8 x 40yd at 85-90%.', exercises: ['running_buildups'] },
      { id: 'rc_w11d3_main', type: 'workout', title: 'Sled Complex (Peak)', instructions: 'Peak volume: 8 sets sled work.', exercises: ['sled_pull_backwards', 'strict_chinups', 'pinch_grip_plate_carry', 'gorilla_rows', 'sled_push_quick', 'strict_situps'] },
    ],
    rewards: { xp: 270, coins: 27 },
  },
  {
    id: 'recon_w11d4', week: 11, day: 4,
    title: 'Mid Tempo Run (4mi)',
    objective: '1mi warm, 4mi at mid tempo, 1mi cool.',
    estimated_duration: 65,
    sections: [
      { id: 'rc_w11d4_main', type: 'cardio', title: 'Tempo Run', instructions: '1mi warm → 4mi mid tempo → 1mi cool.', exercises: ['tempo_run_mid'] },
    ],
    rewards: { xp: 200, coins: 20 },
  },
  {
    id: 'recon_w11d5', week: 11, day: 5,
    title: 'Peak: Deadlift 5x3 + EMOM',
    objective: 'Deadlift 5x3, Bench 4x4, Rows 3x10. EMOM 12 min: 5 reps each.',
    estimated_duration: 80,
    sections: [
      { id: 'rc_w11d5_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_PULL },
      { id: 'rc_w11d5_main', type: 'workout', title: 'Strength', instructions: 'DL 5x3, BP 4x4, Rows 3x10.', exercises: ['deadlift', 'bench_press', 'bent_over_rows'] },
      { id: 'rc_w11d5_emom', type: 'workout', title: 'EMOM (12 min)', instructions: 'Every minute on the minute: Inv Rows x5, CG Push-ups x5, HLR x5.', exercises: ['inverted_rows', 'close_grip_pushups', 'hanging_leg_raises'] },
      { id: 'rc_w11d5_cond', type: 'cardio', title: 'Conditioning', instructions: '20 min flush.', exercises: ['conditioning_flush'] },
    ],
    rewards: { xp: 280, coins: 28 },
  },
  {
    id: 'recon_w11d6', week: 11, day: 6,
    title: '6-Mile Easy Run',
    objective: 'Zone 2, 6 miles.',
    estimated_duration: 75,
    sections: [
      { id: 'rc_w11d6_main', type: 'cardio', title: 'Easy Run', instructions: '6 miles Zone 2.', exercises: ['easy_pace_run'] },
    ],
    rewards: { xp: 190, coins: 19 },
  },

  // ============================================================
  // PHASE 3 — WEEK 12 (DE-LOAD / TAPER — GET READY FOR selection)
  // ============================================================
  {
    id: 'recon_w12d1', week: 12, day: 1,
    title: 'Taper: Squat 3x3 + AMRAP 35%',
    objective: 'Back Squat 3x3, Strict Press 2x10. 5min AMRAP at 35%. Minimal conditioning.',
    estimated_duration: 45,
    sections: [
      { id: 'rc_w12d1_prep', type: 'warmup', title: 'Movement Prep', instructions: '3 rounds', rounds: 3, exercises: PREP_P2_STRENGTH },
      { id: 'rc_w12d1_main', type: 'workout', title: 'Strength (Tapered)', instructions: 'BS 3x3, SP 2x10. Maintain intensity, cut volume.', exercises: ['back_squat', 'strict_standing_press'] },
      { id: 'rc_w12d1_amrap', type: 'workout', title: 'AMRAP (5 min)', instructions: '35% assessment. Light.', exercises: ['strict_chinups', 'strict_pushups', 'strict_situps'] },
      { id: 'rc_w12d1_cond', type: 'cardio', title: 'Conditioning', instructions: '5-6 reps: 30s SPRINT / 45s EASY.', exercises: ['conditioning_sprint_interval'] },
    ],
    rewards: { xp: 150, coins: 15 },
  },
  {
    id: 'recon_w12d2', week: 12, day: 2,
    title: 'Taper: 2-Mile Heavy Ruck',
    objective: '2 miles heavy ruck at 55-60#. Short and heavy.',
    estimated_duration: 40,
    sections: [
      { id: 'rc_w12d2_main', type: 'ruck', title: 'Heavy Ruck (Short)', instructions: '2 miles at 55-60#.', exercises: ['ruck_2mi_heavy'] },
    ],
    rewards: { xp: 130, coins: 13 },
  },
  {
    id: 'recon_w12d3', week: 12, day: 3,
    title: 'Recovery Swim / Flush',
    objective: '30 min recovery swim or non-impact machine flush.',
    estimated_duration: 35,
    sections: [
      { id: 'rc_w12d3_main', type: 'recovery', title: 'Recovery', instructions: '30 min easy swim or machine.', exercises: ['recovery_swim'] },
    ],
    rewards: { xp: 100, coins: 10 },
  },
  {
    id: 'recon_w12d4', week: 12, day: 4,
    title: 'Taper: Sled Complex (Reduced)',
    objective: '3x40yd build-ups. Sled Pull 3x50m, Pinch Carry 3x60m, Sled Push 3x50m.',
    estimated_duration: 40,
    sections: [
      { id: 'rc_w12d4_buildups', type: 'workout', title: 'Build-Ups', instructions: '3 x 40yd. Reduced.', exercises: ['running_buildups'] },
      { id: 'rc_w12d4_main', type: 'workout', title: 'Sled Complex (Reduced)', instructions: '3 sets each. Maintain quality.', exercises: ['sled_pull_backwards', 'strict_chinups', 'pinch_grip_plate_carry', 'gorilla_rows', 'sled_push_quick', 'strict_situps'] },
    ],
    rewards: { xp: 130, coins: 13 },
  },
  {
    id: 'recon_w12d5', week: 12, day: 5,
    title: 'RECOVER',
    objective: 'Full rest day. Recovery, sleep, nutrition, mental prep for selection.',
    estimated_duration: 0,
    sections: [
      { id: 'rc_w12d5_main', type: 'recovery', title: 'Recovery Day', instructions: 'Full rest. Hydrate, eat well, sleep 8+ hours. Get ready for selection.', exercises: [] },
    ],
    rewards: { xp: 50, coins: 5 },
  },
  {
    id: 'recon_w12d6', week: 12, day: 6,
    title: 'RECOVER',
    objective: 'Full rest. You earned it. Report to selection ready.',
    estimated_duration: 0,
    sections: [
      { id: 'rc_w12d6_main', type: 'recovery', title: 'Recovery Day', instructions: 'Final recovery day before selection. Trust your training.', exercises: [] },
    ],
    rewards: { xp: 50, coins: 5 },
  },
];

// Helper functions
export function getReconWorkoutDay(id: string): WorkoutDay | undefined {
  return reconWorkouts.find(w => w.id === id);
}

export function getReconWeek(week: number): WorkoutDay[] {
  return reconWorkouts.filter(w => w.week === week);
}

export function getReconPhase(phase: number): WorkoutDay[] {
  const phaseWeeks: Record<number, number[]> = {
    1: [1, 2, 3, 4],
    2: [5, 6, 7, 8],
    3: [9, 10, 11, 12],
  };
  const weeks = phaseWeeks[phase] || [];
  return reconWorkouts.filter(w => weeks.includes(w.week));
}
