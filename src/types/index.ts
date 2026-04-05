export interface Exercise {
  id: string;
  name: string;
  category: 'calisthenics' | 'core' | 'running' | 'swimming' | 'rucking' | 'warmup' | 'recovery';
  description: string;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  distance?: string;
  rest_seconds: number;
  equipment: string[];
  xp_value: number;
  form_tips: string[];
  progression_rules?: ProgressionRules;
}

export interface ProgressionRules {
  increment_reps?: number;
  increment_sets?: number;
  increment_duration?: number;
  frequency: 'daily' | 'weekly' | 'biweekly';
}

export interface WorkoutSection {
  id: string;
  type: 'warmup' | 'workout' | 'cardio' | 'recovery' | 'test';
  title: string;
  instructions: string;
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
  exercises_completed: Record<string, number>;
  weekly_workouts: number[];
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
