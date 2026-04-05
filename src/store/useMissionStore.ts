import { create } from 'zustand';
import { DailyMission, CompletedExercise } from '../types';
import { allWorkoutDays, REST_DAYS, getWorkoutDaysForWeek } from '../data/workouts';

interface MissionState {
  todaysMission: DailyMission | null;
  currentWeek: number;
  currentExerciseIndex: number;
  completedExercises: CompletedExercise[];
  missionStartTime: number | null;
  isActive: boolean;

  loadTodaysMission: () => void;
  startMission: () => void;
  completeExercise: (exercise: CompletedExercise) => void;
  finishMission: () => void;
  resetMission: () => void;
  setCurrentWeek: (week: number) => void;
}

function getTodayWorkoutDay(currentWeek: number) {
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat

  // Sun(0) and Wed(3) are rest days
  if (REST_DAYS.includes(dayOfWeek)) return null;

  const weekDays = getWorkoutDaysForWeek(currentWeek);
  // Map day of week to workout day number: Mon=1, Tue=2, Thu=4, Fri=5, Sat=6
  const dayMap: Record<number, number> = { 1: 1, 2: 2, 4: 4, 5: 5, 6: 6 };
  const targetDay = dayMap[dayOfWeek];
  if (!targetDay) return weekDays[0] || allWorkoutDays[0]; // fallback

  return weekDays.find(d => d.day === targetDay) || weekDays[0] || allWorkoutDays[0];
}

export const useMissionStore = create<MissionState>((set, get) => ({
  todaysMission: null,
  currentWeek: 1,
  currentExerciseIndex: 0,
  completedExercises: [],
  missionStartTime: null,
  isActive: false,

  loadTodaysMission: () => {
    const { currentWeek } = get();
    const workoutDay = getTodayWorkoutDay(currentWeek);
    const today = new Date().toISOString().split('T')[0];

    if (!workoutDay) {
      // Rest day
      set({ todaysMission: null, completedExercises: [], currentExerciseIndex: 0, isActive: false });
      return;
    }

    const mission: DailyMission = {
      date: today,
      workout_day_id: workoutDay.id,
      mission_title: workoutDay.title,
      mission_summary: workoutDay.objective,
      bonus_objectives: ['Complete all exercises', 'Record your times'],
      reward_xp: workoutDay.rewards.xp,
      reward_coins: workoutDay.rewards.coins,
      completed: false,
    };
    set({ todaysMission: mission, completedExercises: [], currentExerciseIndex: 0, isActive: false });
  },

  startMission: () => {
    set({ missionStartTime: Date.now(), isActive: true });
  },

  completeExercise: (exercise) => {
    set((state) => ({
      completedExercises: [...state.completedExercises, exercise],
      currentExerciseIndex: state.currentExerciseIndex + 1,
    }));
  },

  finishMission: () => {
    set((state) => ({
      todaysMission: state.todaysMission ? { ...state.todaysMission, completed: true } : null,
      isActive: false,
    }));
  },

  resetMission: () => {
    set({ completedExercises: [], currentExerciseIndex: 0, missionStartTime: null, isActive: false });
  },

  setCurrentWeek: (week: number) => {
    set({ currentWeek: Math.max(1, Math.min(10, week)) });
  },
}));
