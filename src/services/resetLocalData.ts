import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { pauseAutomaticBackups } from './backup';
import { cancelDailyReminder, cancelRestDone, cancelTrialEndingReminder, cancelWeeklyRecap, clearWorkoutProgress, setNotificationsEnabled } from './notifications';
import { flushUserPersistence, useUserStore } from '../store/useUserStore';
import { useProgramStore } from '../store/useProgramStore';
import { useSessionStore } from '../store/useSessionStore';
import { useRoutineStore } from '../store/useRoutineStore';
import { useChallengeStore } from '../store/useChallengeStore';
import { clearReadinessPersistence, flushReadinessPersistence, useReadinessStore } from '../store/useReadinessStore';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { useExerciseNotesStore } from '../store/useExerciseNotesStore';
import { useOnboardingDraftStore } from '../store/useOnboardingDraftStore';
import { useChromePrefs, useUiStore } from '../store/useUiStore';

/** Clear disk AND memory; otherwise the next store write resurrects deleted data. */
export async function resetLocalData() {
  // A device-only reset must never upload an empty profile over the cloud backup.
  await pauseAutomaticBackups();
  const { stopActiveActivityForDataChange } = await import('./activityTracking');
  await stopActiveActivityForDataChange();
  setNotificationsEnabled(false);
  await Promise.all([cancelDailyReminder(), cancelWeeklyRecap(), cancelTrialEndingReminder(), cancelRestDone(), clearWorkoutProgress()]);
  await SecureStore.deleteItemAsync('gruntz_assessment');
  useSessionStore.getState().discard();
  useSessionStore.setState(useSessionStore.getInitialState());
  useRoutineStore.setState(useRoutineStore.getInitialState());
  useChallengeStore.setState(useChallengeStore.getInitialState());
  useReadinessStore.setState(useReadinessStore.getInitialState());
  usePlanLibraryStore.setState(usePlanLibraryStore.getInitialState());
  useExerciseLogStore.setState(useExerciseLogStore.getInitialState());
  useExerciseNotesStore.setState(useExerciseNotesStore.getInitialState());
  useOnboardingDraftStore.setState(useOnboardingDraftStore.getInitialState());
  useChromePrefs.setState(useChromePrefs.getInitialState());
  useUiStore.setState(useUiStore.getInitialState());
  useProgramStore.setState({ ...useProgramStore.getInitialState(), hasHydrated: true });
  useUserStore.getState().reset();
  await Promise.all([flushUserPersistence(), flushReadinessPersistence()]);
  // Also deletes every saved GPS route, which on Android are files the key sweep below cannot see.
  await clearReadinessPersistence();
  await useSessionStore.persist.clearStorage();
  const keys = await AsyncStorage.getAllKeys();
  // Billing remains store-managed and the original trial must not restart on erase.
  const retained = new Set(['@gruntz_subscription', '@gruntz_backup_owner', '@gruntz_backup_synced_at']);
  const ours = keys.filter((key) => key.startsWith('@gruntz') && !retained.has(key));
  if (ours.length) await AsyncStorage.multiRemove(ours);
}

/** Error recovery also needs to reset the already hydrated in-memory stores. */
export async function resetTransientState() {
  const { stopActiveActivityForDataChange } = await import('./activityTracking');
  await stopActiveActivityForDataChange();
  useSessionStore.getState().discard();
  useSessionStore.setState(useSessionStore.getInitialState());
  useChromePrefs.setState(useChromePrefs.getInitialState());
  useOnboardingDraftStore.setState(useOnboardingDraftStore.getInitialState());
  useUiStore.setState(useUiStore.getInitialState());
  await Promise.all([cancelRestDone(), clearWorkoutProgress()]);
  await useSessionStore.persist.clearStorage();
  await AsyncStorage.multiRemove(['@gruntz_session', '@gruntz_chrome', '@gruntz_onboarding_draft', '@gruntz_nav_state']);
}
