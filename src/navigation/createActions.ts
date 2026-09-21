import { useNavigation } from '@react-navigation/native';
import { getProgramWorkoutForDate, getNextProgramWorkout } from '../data/programWorkouts';
import { useProgramStore } from '../store/useProgramStore';
import { useSessionStore } from '../store/useSessionStore';
import { useRoutineStore } from '../store/useRoutineStore';
import { useUiStore } from '../store/useUiStore';
import { useUserStore } from '../store/useUserStore';
import type { IconName } from '../ui/Icon';
import { toast } from '../ui/Toast';
import { getLocalDateKey } from '../utils/dateKey';

export interface CreateAction {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  highlight?: boolean;
}

/** The + menu: every way to start doing something, one tap from any tab. */
export function useCreateActions(): CreateAction[] {
  const navigation = useNavigation();
  const close = () => useUiStore.getState().setCreateMenu(false);
  const sessionActive = useSessionStore((s) => s.active);

  const openMission = () => {
    close();
    if (useSessionStore.getState().active) {
      useSessionStore.getState().expand();
      return;
    }
    const program = useProgramStore.getState().selectedProgram;
    if (!program) {
      navigation.navigate('ProgramSelect');
      return;
    }
    const { currentWeek } = useProgramStore.getState();
    const profile = useUserStore.getState().profile;
    const today = new Date();
    const workout = getProgramWorkoutForDate(program, currentWeek, today, profile);
    if (workout) {
      navigation.navigate('WorkoutDetail', { workoutId: workout.id, dateKey: getLocalDateKey(today) });
      return;
    }
    const next = getNextProgramWorkout(program, currentWeek, today, profile);
    toast(next ? `Rest day. Next up: ${next.title}` : 'Rest day. Recover and come back ready.', { tone: 'info', icon: 'moon' });
    navigation.navigate('Plan');
  };

  return [
    {
      icon: sessionActive ? 'play' : 'sparkles',
      title: sessionActive ? 'Resume workout' : "Today's mission",
      subtitle: sessionActive ? 'Pick up where you left off' : 'Start your scheduled workout',
      onPress: openMission,
      highlight: true,
    },
    {
      icon: 'pencil',
      title: 'Plan a workout',
      subtitle: 'Build your own from 412 exercises',
      onPress: () => {
        close();
        useRoutineStore.getState().newDraft();
        navigation.navigate('RoutineEditor');
      },
    },
    {
      icon: 'run',
      title: 'Run or ruck',
      subtitle: 'Track distance, pace and elevation',
      onPress: () => {
        close();
        navigation.navigate('RunTracker');
      },
    },
    {
      icon: 'flame',
      title: 'Daily challenge',
      subtitle: 'Log reps toward today’s target',
      onPress: () => {
        close();
        useUiStore.getState().setChallenge(true);
      },
    },
    {
      icon: 'pulse',
      title: 'Readiness check-in',
      subtitle: 'Sleep, energy and soreness',
      onPress: () => {
        close();
        useUiStore.getState().setReadiness(true);
      },
    },
  ];
}
