import { create } from 'zustand';
import { DailyMission, CompletedExercise } from '../types';
import { week1Days } from '../data/workouts';

interface MissionState {
  todaysMission: DailyMission | null;
  currentExerciseIndex: number;
  completedExercises: CompletedExercise[];
  missionStartTime: number | null;
  isActive: boolean;

  loadTodaysMission: () => void;
  startMission: () => void;
  completeExercise: (exercise: CompletedExercise) => void;
  finishMission: () => void;
  resetMission: () => void;
}

function getTodayWorkoutDay() {
  // For MVP: cycle through week 1 days based on a counter stored in workouts completed
  // In production, this would track actual program progress
  const dayIndex = new Date().getDay(); // 0-6
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Mon=0, Sun=6
  if (adjustedIndex >= week1Days.length) return week1Days[0]; // fallback
  return week1Days[adjustedIndex];
}

export const useMissionStore = create<MissionState>((set, get) => ({
  todaysMission: null,
  currentExerciseIndex: 0,
  completedExercises: [],
  missionStartTime: null,
  isActive: false,

  loadTodaysMission: () => {
    const workoutDay = getTodayWorkoutDay();
    const today = new Date().toISOString().split('T')[0];
    const mission: DailyMission = {
      date: today,
      workout_day_id: workoutDay.id,
      mission_title: workoutDay.title,
      mission_summary: workoutDay.objective,
      bonus_objectives: ['Complete all exercises', 'Set a personal record'],
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
}));
