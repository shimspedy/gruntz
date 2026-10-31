import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { scheduleBackup } from '../services/backup';
import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { useUiStore } from '../store/useUiStore';
import { Button } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { Ring } from '../ui/Progress';
import { Tap } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';
import { getLocalDateKey } from '../utils/dateKey';
import { getTodaysTrainingChoice, type TrainingMode } from '../features/trainingFocus';
import { trackRetentionEvent } from '../services/retentionAnalytics';

export function readinessStatus(score: number) {
  if (score >= 75) return { label: 'Green', action: 'Train as planned' };
  if (score >= 50) return { label: 'Amber', action: 'Control volume' };
  return { label: 'Red', action: 'Recovery priority' };
}

/** Sixty-second check-in: five tap scales, one score. */
export function ReadinessSheet() {
  const visible = useUiStore((s) => s.readinessOpen);
  const setOpen = useUiStore((s) => s.setReadiness);
  const checkIns = useReadinessStore((s) => s.checkIns);
  const save = useReadinessStore((s) => s.saveCheckIn);
  const today = getTodaysCheckIn(checkIns);
  const choice = useReadinessStore((s) => s.trainingChoice);

  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [stress, setStress] = useState(2);
  const [hydration, setHydration] = useState(3);
  const [mode, setMode] = useState<TrainingMode>('planned');

  useEffect(() => {
    if (!visible) return;
    setSleep(today?.sleepHours ?? 7);
    setEnergy(today?.energy ?? 3);
    setSoreness(today?.soreness ?? 2);
    setStress(today?.stress ?? 2);
    setHydration(today?.hydration ?? 3);
    setMode(getTodaysTrainingChoice(choice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const draft = { date: getLocalDateKey(), sleepHours: sleep, energy, soreness, stress, hydration };
  const score = calculateDailyReadiness(draft);
  const status = readinessStatus(score);

  return (
    <Sheet visible={visible} onClose={() => setOpen(false)} plainHeader scrollable>
      <View style={styles.header}>
        <Ring progress={score / 100} size={64} stroke={5} trackColor="#2B3038">
          <Text variant="headline" tabular>
            {score}
          </Text>
        </Ring>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text variant="headline" style={{ fontSize: 19 }}>
            Daily readiness
          </Text>
          <Text variant="subhead" tone="accent" style={{ marginTop: 3 }}>
            {status.label} · {status.action}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.body}>
        <Scale icon="sleep" label="Sleep" options={[5, 6, 7, 8, 9]} format={(v) => `${v}h`} value={sleep} onChange={setSleep} />
        <Scale icon="battery" label="Energy" options={[1, 2, 3, 4, 5]} value={energy} onChange={setEnergy} />
        <Scale icon="bandage" label="Soreness" options={[1, 2, 3, 4, 5]} value={soreness} onChange={setSoreness} />
        <Scale icon="brain" label="Stress" options={[1, 2, 3, 4, 5]} value={stress} onChange={setStress} />
        <Scale icon="drop" label="Hydration" options={[1, 2, 3, 4, 5]} value={hydration} onChange={setHydration} />
        <Text variant="headline" style={{ marginTop: space.xl }}>Choose today’s session</Text>
        <Text variant="footnote" tone="secondary" style={{ marginTop: 6, marginBottom: space.md }}>
          {score < 50 ? 'A lighter option is available. You decide what fits today.' : score < 75 ? 'Keep your plan or make room for a lighter day.' : 'Your plan is ready. You can still choose a lighter option.'}
        </Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Today’s training option" style={{ gap: 8 }}>
          {([
            { mode: 'planned', title: 'Keep my session', body: 'Use the original sets and targets.' },
            { mode: 'shorter', title: 'Choose a shorter session', body: 'Reduce working sets or single-set targets by about a third. Counts as your adjusted plan day.' },
            { mode: 'recovery', title: 'Choose recovery', body: 'An easy mobility mission. Your planned workout stays available.' },
          ] as const).map((option) => (
            <Tap key={option.mode} onPress={() => setMode(option.mode)} accessibilityRole="radio" accessibilityState={{ selected: mode === option.mode }} accessibilityLabel={option.title} style={[styles.choice, mode === option.mode && styles.choiceActive]}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{option.title}</Text>
                <Text variant="footnote" tone="secondary" style={{ marginTop: 3 }}>{option.body}</Text>
              </View>
              <Icon name={mode === option.mode ? 'check' : 'chevronRight'} size={18} color={mode === option.mode ? color.accent : color.textTertiary} />
            </Tap>
          ))}
        </View>
        <Button
          title={today ? 'Update check-in' : 'Save check-in'}
          style={{ marginTop: space.lg }}
          onPress={() => {
            save(draft);
            useReadinessStore.getState().setTrainingChoice(mode);
            trackRetentionEvent('readiness_option_selected', { mode });
            scheduleBackup();
            haptic.success();
            setOpen(false);
            toast(mode === 'planned' ? 'Check-in saved · session kept as planned' : mode === 'shorter' ? 'Your next session will use the shorter option' : 'Your next session will be a recovery mission', { icon: 'pulse' });
          }}
        />
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
          Applies when you start a session today. A workout already in progress stays as it is. A training aid, not medical clearance.
        </Text>
      </View>
    </Sheet>
  );
}

function Scale({
  icon,
  label,
  options,
  value,
  onChange,
  format = (v: number) => String(v),
}: {
  icon: IconName;
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <View style={styles.scale}>
      <View style={styles.scaleLabel}>
        <Icon name={icon} size={18} color={color.textSecondary} />
        <Text variant="subhead" tone="secondary">
          {label}
        </Text>
      </View>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const active = o === value;
          return (
            <Tap
              key={o}
              scaleTo={0.92}
              onPress={() => {
                haptic.selection();
                onChange(o);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label} ${format(o)}`}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text variant="headline" tabular style={{ color: active ? color.onCta : color.text, fontSize: 16 }}>
                {format(o)}
              </Text>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, backgroundColor: color.surface, borderRadius: radius.md, borderWidth: 1, borderColor: color.line },
  choiceActive: { borderColor: color.accent, backgroundColor: color.accentSoft },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingTop: 6, paddingBottom: space.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.line },
  body: { paddingHorizontal: space.gutter, paddingTop: space.md },
  scale: { marginTop: space.md },
  scaleLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    height: 46,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: { backgroundColor: color.cta },
});
