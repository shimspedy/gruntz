import { create } from 'zustand';
import { DailyMission, CompletedExercise, WorkoutDay } from '../types';
import { allWorkoutDays, REST_DAYS, getWorkoutDaysForWeek } from '../data/workouts';
import { reconWorkouts, getReconWeek } from '../data/reconWorkouts';
import { useProgramStore } from './useProgramStore';
import { useUserStore } from './useUserStore';
import { getLocalDateKey } from '../utils/dateKey';

interface MissionState {
  todaysMission: DailyMission | null;
  nextWorkout: WorkoutDay | null;
  isRestDay: boolean;
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

function getRaiderWorkoutDay(currentWeek: number) {
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

function getReconWorkoutDay(currentWeek: number) {
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat

  // Sunday is the only rest day for Recon (6 days/week Mon-Sat)
  if (dayOfWeek === 0) return null;

  const weekDays = getReconWeek(currentWeek);
  // Map day of week to day number: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  const targetDay = dayOfWeek; // 1-6 maps directly
  return weekDays.find(d => d.day === targetDay) || weekDays[0] || reconWorkouts[0];
}

function getNextWorkoutDay(selectedProgram: string | null, activeWeek: number): WorkoutDay | null {
  const dayOfWeek = new Date().getDay();
  // Look ahead up to 6 days to find next workout
  for (let offset = 1; offset <= 6; offset++) {
    const futureDay = (dayOfWeek + offset) % 7;
    if (selectedProgram === 'recon') {
      if (futureDay === 0) continue; // Sunday rest
      const weekDays = getReconWeek(activeWeek);
      const found = weekDays.find(d => d.day === futureDay);
      if (found) return found;
    } else {
      if (REST_DAYS.includes(futureDay)) continue;
      const weekDays = getWorkoutDaysForWeek(activeWeek);
      const dayMap: Record<number, number> = { 1: 1, 2: 2, 4: 4, 5: 5, 6: 6 };
      const targetDay = dayMap[futureDay];
      if (!targetDay) continue;
      const found = weekDays.find(d => d.day === targetDay);
      if (found) return found;
    }
  }
  return null;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  todaysMission: null,
  nextWorkout: null,
  isRestDay: false,
  currentWeek: 1,
  currentExerciseIndex: 0,
  completedExercises: [],
  missionStartTime: null,
  isActive: false,

  loadTodaysMission: () => {
    const { currentWeek } = get();
    const { selectedProgram } = useProgramStore.getState();
    const programWeek = useProgramStore.getState().currentWeek;
    const activeWeek = selectedProgram ? programWeek : currentWeek;

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

    const workoutDay = selectedProgram === 'recon'
      ? getReconWorkoutDay(activeWeek)
      : getRaiderWorkoutDay(activeWeek);
    const today = getLocalDateKey();

    if (!workoutDay) {
      // Rest day — find next upcoming workout
      const next = getNextWorkoutDay(selectedProgram, activeWeek);
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

  setCurrentWeek: (week: number) => {
    const { selectedProgram } = useProgramStore.getState();
    const max = selectedProgram === 'recon' ? 12 : 10;
    set({ currentWeek: Math.max(1, Math.min(max, week)) });
  },
}));
