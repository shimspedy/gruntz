import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { branchDefaultTest, getTestsForBranch } from '../data/militaryTests';
import { useUserStore } from '../store/useUserStore';
import { toast } from '../ui/Toast';
import type { FitnessTestType, ServiceBranch, ServiceStatus } from '../types';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, radius, space } from '../ui/tokens';
import { BRANCH_LABEL } from './TestScreen';

const BRANCHES: ServiceBranch[] = ['army', 'marines', 'navy', 'air_force', 'space_force', 'coast_guard', 'general'];
const STATUSES: { id: ServiceStatus; label: string }[] = [
  { id: 'recruit', label: 'Recruit or applicant' },
  { id: 'active', label: 'Active duty' },
  { id: 'reserve', label: 'Reserve' },
  { id: 'guard', label: 'National Guard' },
  { id: 'rotc', label: 'ROTC or academy' },
  { id: 'veteran', label: 'Veteran' },
  { id: 'civilian', label: 'Civilian' },
];

/** Branch drives the Test tab. Changing it swaps the event board immediately. */
export default function ServiceProfileScreen() {
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const branch = profile?.service_branch ?? 'general';
  const tests = getTestsForBranch(branch);
  const selectedTest = tests.some((t) => t.id === profile?.fitness_test_type) ? profile?.fitness_test_type : branchDefaultTest[branch];

  const update = (patch: Partial<NonNullable<typeof profile>>) => {
    // Every row was a silent no-op before the profile loaded, which looked like the
    // screen was broken rather than not ready.
    if (!profile) {
      toast('Your profile is still loading', { tone: 'info', icon: 'alert' });
      return;
    }
    haptic.selection();
    setProfile({ ...profile, ...patch });
  };

  /**
   * Switching branch normally moves you to that branch's default test — but not if
   * you had deliberately chosen a different one that the new branch also offers.
   * That choice used to be discarded without a word.
   */
  const selectBranch = (next: ServiceBranch) => {
    const keepsTest = getTestsForBranch(next).some((t) => t.id === profile?.fitness_test_type);
    update({ service_branch: next, ...(keepsTest ? {} : { fitness_test_type: branchDefaultTest[next] }) });
  };

  return (
    <View style={styles.screen}>
      <NavHeader title="Service profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }} showsVerticalScrollIndicator={false}>
        <Text variant="callout" tone="secondary" style={styles.intro}>
          Your branch sets the test on your Test tab. Scores are kept per test, so switching never erases them.
        </Text>

        <Choice label="Branch">
          {BRANCHES.map((b) => (
            <Option key={b} title={BRANCH_LABEL[b]} selected={branch === b} onPress={() => selectBranch(b)} />
          ))}
        </Choice>

        <Choice label="Assessment">
          {tests.map((t) => (
            <Option key={t.id} title={t.name} subtitle={`${t.events.length} events · ${t.effectiveLabel}`} selected={selectedTest === t.id} onPress={() => update({ fitness_test_type: t.id as FitnessTestType })} />
          ))}
        </Choice>

        <Choice label="Status">
          {STATUSES.map((s) => (
            <Option key={s.id} title={s.label} selected={profile?.service_status === s.id} onPress={() => update({ service_status: s.id })} />
          ))}
        </Choice>
      </ScrollView>
    </View>
  );
}

function Choice({ label, children }: { label: string; children: React.ReactNode }) {
  const rows = React.Children.toArray(children);
  return (
    <View style={{ marginTop: space.xl }}>
      <Text variant="overline" tone="secondary" style={{ marginLeft: 6, marginBottom: 10 }}>
        {label}
      </Text>
      <View style={styles.group} accessibilityRole="radiogroup">
        {rows.map((r, i) => (
          <View key={i} style={i > 0 ? styles.divider : null}>
            {r}
          </View>
        ))}
      </View>
    </View>
  );
}

function Option({ title, subtitle, selected, onPress }: { title: string; subtitle?: string; selected: boolean; onPress: () => void }) {
  return (
    <Tap feedback="highlight" baseColor={color.surface} pressedColor={color.surfacePressed} onPress={onPress} style={styles.row} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={title}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle ? (
          <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon name="check" size={18} color={color.accent} weight="semibold" /> : null}
    </Tap>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  intro: { paddingHorizontal: 6, marginTop: space.sm },
  group: { backgroundColor: color.surface, borderRadius: radius.lg, borderCurve: 'continuous', overflow: 'hidden' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md + 2, paddingVertical: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, marginLeft: space.md + 2 },
});
