export type EquipmentAccess = 'none' | 'minimal' | 'gym';

export interface Exercise {
  id: string;
  name: string;
  category: 'calisthenics' | 'core' | 'running' | 'swimming' | 'rucking' | 'warmup' | 'recovery' | 'strength';
  description: string;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  distance?: string;
  rest_seconds: number;
  equipment: string[];
  equipment_access: EquipmentAccess;
  gym_alternative_id?: string;
  xp_value: number;
  form_tips: string[];
  progression_rules?: ProgressionRules;
  muscle_groups?: string[];
  steps?: string[];
  illustration?: string;
}

export interface ProgressionRules {
  increment_reps?: number;
  increment_sets?: number;
  increment_duration?: number;
  frequency: 'daily' | 'weekly' | 'biweekly';
}

export interface WorkoutSection {
  id: string;
  type: 'warmup' | 'workout' | 'cardio' | 'recovery' | 'test' | 'ruck' | 'swim';
  title: string;
  instructions: string;
  rounds?: number;
  exercises: string[]; // exercise IDs
}

export interface WorkoutDay {
  id: string;
  week: number;
  day: number;
  title: string;
  objective: string;
  estimated_duration: number;
  sections: WorkoutSection[];
  rewards: {
    xp: number;
    coins: number;
  };
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'elite';
  duration_weeks: number;
  category: string;
  days: WorkoutDay[];
}

export interface DailyMission {
  date: string;
  workout_day_id: string;
  mission_title: string;
  mission_summary: string;
  bonus_objectives: string[];
  reward_xp: number;
  reward_coins: number;
  completed: boolean;
}

export interface UserProgress {
  user_id: string;
  current_level: number;
  current_xp: number;
  current_rank: Rank;
  streak_days: number;
  last_workout_date: string;
  workouts_completed: number;
  total_reps: number;
  total_distance_miles: number;
  best_run_times: Record<string, number>;
  best_ruck_times: Record<string, number>;
  best_swim_times: Record<string, number>;
  strength_score: number;
  endurance_score: number;
  stamina_score: number;
  mobility_score: number;
  consistency_score: number;
  recovery_score: number;
  challenges_completed: number;
  challenge_streak_days: number;
  challenge_xp_earned: number;
  challenge_time_seconds_logged: number;
  last_challenge_date: string;
  exercises_completed: Record<string, number>;
  weekly_workouts: number[];
  claimed_missions: Set<string>;
}

export type Rank = 'Recruit' | 'Cadet' | 'Operator' | 'Veteran' | 'Elite' | 'Shadow' | 'Apex';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'xp' | 'workout' | 'record' | 'rank' | 'program';
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

export interface UserAchievement {
  achievement_id: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  target_value: number;
  current_value: number;
  reward_xp: number;
  reward_coins: number;
  start_date: string;
  end_date: string;
  completed: boolean;
}

export interface AvatarConfig {
  body_stage: number;
  outfit_id: string;
  gear_ids: string[];
  badge_ids: string[];
}

export interface AvatarUnlock {
  id: string;
  name: string;
  type: 'outfit' | 'gear' | 'badge';
  required_rank: Rank;
  required_level: number;
  icon: string;
  description: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  onboarding_complete: boolean;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  available_equipment: string[];
  workout_days_per_week: number;
  has_pool_access: boolean;
  has_ruck_access: boolean;
  preferred_intensity: 'low' | 'moderate' | 'high';
  settings: UserSettings;
}

export interface UserSettings {
  notifications_enabled: boolean;
  reminder_time: string;
  units: 'imperial' | 'metric';
}

export interface CompletedExercise {
  exercise_id: string;
  completed_reps?: number;
  completed_sets?: number;
  completed_duration_seconds?: number;
  completed_distance?: string;
  xp_earned: number;
  is_personal_record: boolean;
}

export interface CompletedMission {
  mission_date: string;
  workout_day_id: string;
  exercises: CompletedExercise[];
  total_xp: number;
  completion_bonus: number;
  is_perfect: boolean;
  has_personal_record: boolean;
  pr_bonus: number;
  duration_minutes: number;
  completed_at: string;
}

export interface CoachMessage {
  id: string;
  type: 'motivation' | 'insight' | 'recovery' | 'warning' | 'celebration';
  message: string;
  generated_at: string;
}

// Movement Card system
export interface CardExercise {
  exercise_id: string;
  order: number;
  prescribed_sets?: number;
  prescribed_reps?: number;
  prescribed_duration?: number;
  notes?: string;
}

export interface MovementCard {
  id: string;
  card_number: number;
  name: string;
  category: 'strength' | 'ruck' | 'core' | 'total_body' | 'swim';
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  target_muscle_groups: string[];
  sections: CardSection[];
  total_rounds: number;
  icon: string;
}

export interface CardSection {
  id: string;
  name: string;
  rounds: number;
  exercises: CardExercise[];
  rest_between_rounds?: number;
  notes?: string;
}

// Rep/set logging
export interface SetLog {
  set_number: number;
  reps_completed?: number;
  weight_used?: number;
  duration_seconds?: number;
  distance?: string;
  rpe?: number;
}

export interface ExerciseLog {
  exercise_id: string;
  sets_completed: SetLog[];
  rest_taken_seconds: number;
  notes?: string;
  timestamp: string;
}

// AI Recommendations
export interface WorkoutRecommendation {
  card_id: string;
  card_name: string;
  reason: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  focus_areas: string[];
}

// Training Programs
export type ProgramId = 'raider' | 'recon';

export interface TrainingProgram {
  id: ProgramId;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  duration_weeks: number;
  days_per_week: number;
  difficulty: 'intermediate' | 'advanced' | 'elite';
  focus_areas: string[];
  prerequisites: string[];
  equipment_needed: string[];
  phases: ProgramPhase[];
  rpe_guide: RPEGuide;
}

export interface ProgramPhase {
  phase_number: number;
  name: string;
  weeks: [number, number]; // [start, end]
  description: string;
  focus: string;
  is_deload_included: boolean;
}

export interface RPEGuide {
  scale: RPELevel[];
}

export interface RPELevel {
  value: number | string;
  label: string;
  description: string;
  color: string;
}

export interface IntervalSplits {
  mile_split_range: string;
  splits_400m: string;
  splits_800m: string;
  splits_1200m: string;
  splits_1600m: string;
}

export interface UserAssessment {
  five_mile_time_minutes?: number;
  mile_split_seconds?: number;
  max_pushups?: number;
  max_situps?: number;
  max_chinups?: number;
  max_pullups?: number;
  assessed_at?: string;
}
