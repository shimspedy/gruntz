import React, { useState } from 'react';
import { StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { challengeMode, formatAmount, formatQuick, quickAdds, useDailyChallenge } from '../features/challenge';
import { useChromePrefs, useUiStore } from '../store/useUiStore';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { getLocalDateKey } from '../utils/dateKey';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Ring } from '../ui/Progress';
import { Tap } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { color, font, motion, radius, space } from '../ui/tokens';

const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 800;

/** The pill shows until today's challenge is done or the user swipes it away for the day. */
export function useChallengePillVisible() {
  const { done } = useDailyChallenge();
  const hiddenOn = useChromePrefs((s) => s.challengePillHiddenOn);
  return !done && hiddenOn !== getLocalDateKey();
}

/** Floating pill above the tab bar — the day's challenge at a glance. Swipe sideways to hide it for today. */
export function ChallengePill() {
  const { challenge, ratio, done, progress } = useDailyChallenge();
  const open = useUiStore((s) => s.setChallenge);
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const subtitle = done ? `Complete · +${challenge.xpReward} XP earned` : progress > 0 ? `${formatAmount(progress, challenge)} logged` : `Earn ${challenge.xpReward} XP today`;

  const dismiss = () => {
    haptic.light();
    useChromePrefs.getState().hideChallengePill(getLocalDateKey());
    toast('Challenge hidden for today · find it under +', { tone: 'info', icon: 'check' });
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onChange((e) => {
      x.set(e.translationX);
    })
    .onEnd((e) => {
      const projected = e.translationX + e.velocityX * 0.15;
      if (Math.abs(projected) > DISMISS_DISTANCE || Math.abs(e.velocityX) > DISMISS_VELOCITY) {
        const dir = Math.sign(projected || e.velocityX) || 1;
        x.set(
          withTiming(dir * width, { duration: 200, easing: motion.easeOut }, (finished) => {
            if (finished) scheduleOnRN(dismiss);
          }),
        );
      } else {
        x.set(withSpring(0, { ...motion.settle, velocity: e.velocityX }));
      }
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    opacity: interpolate(Math.abs(x.get()), [0, width * 0.6], [1, 0], 'clamp'),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={swipeStyle}>
        <Tap onPress={() => open(true)} scaleTo={0.98} style={styles.pill} accessibilityLabel={`Daily challenge, ${challenge.name}, ${Math.round(ratio * 100)} percent`}>
          <LinearGradient
            colors={['#1D2838', '#151A22', '#121418']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[StyleSheet.absoluteFill, styles.pillFill]}
          />
          <Ring progress={ratio} size={52} stroke={4} trackColor="#2B3038">
            {done ? (
              <Icon name="check" size={18} color={color.accent} weight="bold" />
            ) : (
              <Text variant="caption" style={styles.ringLabel} tabular>
                {`${Math.round(ratio * 100)}%`}
              </Text>
            )}
          </Ring>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text variant="headline" numberOfLines={1}>
              {challenge.name}
            </Text>
            <Text variant="subhead" tone="accent" numberOfLines={1} style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          </View>
          <Icon name="chevronRight" size={16} color={color.textSecondary} weight="semibold" />
        </Tap>
      </Animated.View>
    </GestureDetector>
  );
}

export function ChallengeSheet() {
  const visible = useUiStore((s) => s.challengeOpen);
  const setOpen = useUiStore((s) => s.setChallenge);
  const { challenge, ratio, done, remaining, progress, add, markComplete } = useDailyChallenge();
  const [custom, setCustom] = useState('');
  const mode = challengeMode(challenge);
  const quick = done ? [] : quickAdds(challenge, remaining);

  const submitCustom = () => {
    const v = Number.parseFloat(custom);
    if (!Number.isFinite(v) || v <= 0) {
      // Silently doing nothing reads as a broken button.
      haptic.warning();
      toast('Enter a number above zero', { tone: 'error', icon: 'alert' });
      return;
    }
    add(v);
    setCustom('');
  };

  return (
    <Sheet visible={visible} onClose={() => setOpen(false)} plainHeader avoidKeyboard>
      <View style={styles.header}>
        <Ring progress={ratio} size={64} stroke={5} trackColor="#2B3038">
          <Text variant="subhead" tabular>
            {Math.round(ratio * 100)}%
          </Text>
        </Ring>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text variant="headline" style={{ fontSize: 19 }}>
            {challenge.name}
          </Text>
          <Text variant="subhead" tone="accent" style={{ marginTop: 3 }}>
            {done ? 'Completed today' : `${formatAmount(remaining, challenge)} to go`}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.body}>
        <Text variant="callout" tone="secondary">
          {challenge.description}
        </Text>

        <View style={styles.metrics}>
          <Metric label="Logged" value={formatAmount(progress, challenge)} />
          <Metric label="Target" value={formatAmount(challenge.target, challenge)} />
          <Metric label="Reward" value={`${challenge.xpReward} XP`} accent />
        </View>

        {done ? (
          <Animated.View entering={FadeIn.duration(240)} style={styles.doneRow}>
            <View style={styles.doneCheck}>
              <Icon name="check" size={16} color="#FFFFFF" weight="bold" />
            </View>
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              XP added. A new challenge unlocks tomorrow.
            </Text>
          </Animated.View>
        ) : (
          <>
            <Text variant="overline" tone="secondary" style={{ marginTop: space.xl, marginBottom: 10 }}>
              Quick add
            </Text>
            <View style={styles.quickRow}>
              {quick.map((q) => (
                <Tap key={q} onPress={() => add(q)} style={styles.quick} accessibilityLabel={`Add ${formatAmount(q, challenge)}`}>
                  <Text variant="headline" tabular>
                    {formatQuick(q, challenge)}
                  </Text>
                </Tap>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder={mode === 'distance' ? 'Distance' : mode === 'time' ? 'Seconds' : 'Reps'}
                placeholderTextColor={color.textTertiary}
                keyboardType={mode === 'distance' ? 'decimal-pad' : 'number-pad'}
                returnKeyType="done"
                onSubmitEditing={submitCustom}
                style={styles.input}
                selectionColor={color.accent}
              />
              <Button title="Add" size="md" variant="secondary" onPress={submitCustom} disabled={!custom} style={{ width: 96 }} />
            </View>
            <Button title="Mark as complete" onPress={markComplete} style={{ marginTop: space.lg }} />
          </>
        )}
      </View>
    </Sheet>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="footnote" tone="tertiary">
        {label}
      </Text>
      <Text variant="headline" tabular style={{ marginTop: 4, color: accent ? color.accent : color.text }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 80,
    borderRadius: 40,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 22,
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
  },
  pillFill: { borderRadius: 40, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  ringLabel: { fontFamily: font.semibold, fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingTop: 6, paddingBottom: space.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.line },
  body: { paddingHorizontal: space.gutter, paddingTop: space.lg },
  metrics: { flexDirection: 'row', marginTop: space.lg },
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    paddingHorizontal: space.md,
    color: color.text,
    fontFamily: font.medium,
    fontSize: 17,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: space.xl,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.accentSoft,
  },
  doneCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
});
