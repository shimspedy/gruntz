import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChallengeStore } from '../store/useChallengeStore';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { useExerciseNotesStore } from '../store/useExerciseNotesStore';
import { useOnboardingDraftStore } from '../store/useOnboardingDraftStore';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useProgramStore } from '../store/useProgramStore';
import { useReadinessStore } from '../store/useReadinessStore';
import { useRoutineStore } from '../store/useRoutineStore';
import { useSessionStore } from '../store/useSessionStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import { Button } from '../ui/Button';
import { LogoMark } from '../ui/Logo';
import { Text } from '../ui/Text';
import { color } from '../ui/tokens';

/**
 * Shown instead of the app when saved state could not be read at launch. Nothing is
 * deleted by arriving here: the first button re-reads every store, and only after that
 * has failed is clearing the unfinished workout offered.
 */
export function BootFailure() {
  const [retried, setRetried] = useState(false);
  return (
    <View style={[styles.fill, styles.boot, { paddingHorizontal: 28, gap: 20 }]}>
      <LogoMark size={64} />
      <Text variant="title" align="center">Couldn’t load your saved progress</Text>
      <Text variant="callout" tone="secondary" align="center">Your saved data has been kept. Try loading it again, or close and reopen Gruntz.</Text>
      <Button title="Try again" onPress={() => {
        setRetried(true);
        void Promise.all([
          useUserStore.persist.rehydrate(), useProgramStore.persist.rehydrate(),
          useSubscriptionStore.persist.rehydrate(), useSessionStore.persist.rehydrate(),
          useRoutineStore.persist.rehydrate(), usePlanLibraryStore.persist.rehydrate(),
          useExerciseLogStore.persist.rehydrate(), useReadinessStore.persist.rehydrate(),
          useChallengeStore.persist.rehydrate(), useOnboardingDraftStore.persist.rehydrate(),
          useExerciseNotesStore.persist.rehydrate(),
        ]).catch(() => undefined);
      }} />
      {/* If a retry didn't help, the usual cause is an unreadable draft. Those are the only
          things cleared here: training history, plans and the subscription are untouched. */}
      {retried ? (
        <Button
          title="Clear unfinished workout and retry"
          variant="secondary"
          onPress={() =>
            Alert.alert('Clear unfinished workout?', 'This removes a workout you had not finished and half-completed setup answers. Your history, plans and progress stay.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear and retry',
                style: 'destructive',
                onPress: () => {
                  void AsyncStorage.multiRemove(['@gruntz_session', '@gruntz_chrome', '@gruntz_onboarding_draft', '@gruntz_nav_state'])
                    .catch(() => undefined)
                    .then(() => Promise.all([
                      useSessionStore.persist.rehydrate(), useOnboardingDraftStore.persist.rehydrate(),
                      useRoutineStore.persist.rehydrate(), usePlanLibraryStore.persist.rehydrate(),
                      useExerciseLogStore.persist.rehydrate(), useReadinessStore.persist.rehydrate(),
                      useChallengeStore.persist.rehydrate(), useExerciseNotesStore.persist.rehydrate(),
                    ]))
                    .catch(() => undefined);
                },
              },
            ])
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.bg },
  boot: { alignItems: 'center', justifyContent: 'center' },
});
