import { create } from 'zustand';
import { DailyMission, CompletedExercise, WorkoutDay } from '../types';
import { getNextProgramWorkout, getProgramWorkoutForDate } from '../data/programWorkouts';
import { useProgramStore } from './useProgramStore';
import { useUserStore } from './useUserStore';
import { getLocalDateKey } from '../utils/dateKey';

interface MissionState {
  todaysMission: DailyMission | null;
  nextWorkout: WorkoutDay | null;
  isRestDay: boolean;
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

export const useMissionStore = create<MissionState>((set) => ({
  todaysMission: null,
  nextWorkout: null,
  isRestDay: false,
  currentExerciseIndex: 0,
  completedExercises: [],
  missionStartTime: null,
  isActive: false,

  loadTodaysMission: () => {
    const { selectedProgram, currentWeek } = useProgramStore.getState();

    if (!selectedProgram) {
      set({
        todaysMission: null,
        isRestDay: false,
        nextWorkout: null,
        completedExercises: [],
        currentExerciseIndex: 0,
        isActive: false,
      });
      return;
    }

    const profile = useUserStore.getState().profile;
    const todayDate = new Date();
    const workoutDay = getProgramWorkoutForDate(selectedProgram, currentWeek, todayDate, profile);
    const today = getLocalDateKey();

    if (!workoutDay) {
      // Rest day — find next upcoming workout
      const next = getNextProgramWorkout(selectedProgram, currentWeek, todayDate, profile);
      set({ todaysMission: null, isRestDay: true, nextWorkout: next, completedExercises: [], currentExerciseIndex: 0, isActive: false });
      return;
    }

    const claimKey = `${today}:${workoutDay.id}`;
    const isCompleted = useUserStore.getState().progress.claimed_missions.has(claimKey);

    const mission: DailyMission = {
      date: today,
      workout_day_id: workoutDay.id,
      mission_title: workoutDay.title,
      mission_summary: workoutDay.objective,
      bonus_objectives: ['Complete all exercises', 'Record your times'],
      reward_xp: workoutDay.rewards.xp,
      reward_coins: workoutDay.rewards.coins,
      completed: isCompleted,
    };
    set({
      todaysMission: mission,
      isRestDay: false,
      nextWorkout: null,
      completedExercises: [],
      currentExerciseIndex: 0,
      isActive: false,
    });
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
