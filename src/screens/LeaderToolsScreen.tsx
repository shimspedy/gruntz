import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';

/** Optional team layer. Only completion and an approved status are shareable. */
export default function LeaderToolsScreen() {
  const insets = useSafeAreaInsets();
  const progress = useUserStore((s) => s.progress);
  const checkIns = useReadinessStore((s) => s.checkIns);
  const teamName = useReadinessStore((s) => s.teamName);
  const teamCode = useReadinessStore((s) => s.teamCode);
  const setTeam = useReadinessStore((s) => s.setTeam);
  const [name, setName] = useState(teamName);
  const [code, setCode] = useState(teamCode);
  const readiness = calculateDailyReadiness(getTodaysCheckIn(checkIns));
  // Green / Amber / Red is the scale; "Private" was a rank sitting in a list of statuses.
  const status = readiness >= 75 ? 'Green' : readiness >= 50 ? 'Amber' : 'Red';

  return (
    <View style={styles.screen}>
      <NavHeader title="Leader tools" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
        <View style={styles.privacy}>
          <Icon name="lock" size={20} color={color.accent} />
          <View style={{ flex: 1 }}>
            <Text variant="headline">Private by default</Text>
            <Text variant="subhead" tone="secondary" style={{ marginTop: 4 }}>
              Only session counts, streak and a green or amber status are designed to be shared. Weight, sleep, limitations and exact scores stay on this phone.
            </Text>
          </View>
        </View>

        {/* The screen took a team name and an invite code and saved them to this
            phone, with nothing on the other end — it read as "your team can see
            this" when no team could see anything. */}
        <View style={styles.notice}>
          <Icon name="info" size={18} color={color.textSecondary} />
          <Text variant="subhead" tone="secondary" style={{ flex: 1 }}>
            Sharing with a team is not live yet. What you enter here is saved on this phone so it is ready when it is.
          </Text>
        </View>

        <Text variant="overline" tone="secondary" style={styles.label}>
          Team
        </Text>
        <View style={styles.form}>
          <Text variant="subhead" tone="secondary">
            Team or section name
          </Text>
          <TextInput maxFontSizeMultiplier={1.8} value={name} onChangeText={setName} placeholder="Your team name" placeholderTextColor={color.textTertiary} style={styles.input} selectionColor={color.accent} />
          <Text variant="subhead" tone="secondary" style={{ marginTop: space.md }}>
            Invite code
          </Text>
          <TextInput maxFontSizeMultiplier={1.8} value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={12} placeholder="GRUNTZ-01" placeholderTextColor={color.textTertiary} style={styles.input} selectionColor={color.accent} />
          <Button
            title="Save team"
            size="md"
            style={{ marginTop: space.lg }}
            disabled={!name.trim()}
            onPress={() => {
              setTeam(name.trim(), code.trim().toUpperCase());
              haptic.success();
              toast('Saved on this phone');
            }}
          />
        </View>

        <Text variant="overline" tone="secondary" style={styles.label}>
          What a team would see
        </Text>
        <View style={styles.preview}>
          <Metric label="Sessions" value={String(progress.workouts_completed)} />
          <View style={styles.vr} />
          <Metric label="Streak" value={`${progress.streak_days}d`} />
          <View style={styles.vr} />
          <Metric label="Status" value={status} tint={status === 'Green' ? color.success : status === 'Amber' ? color.flame : color.danger} />
        </View>
        <Text variant="footnote" tone="tertiary" style={{ marginTop: space.md, paddingHorizontal: 6 }}>
          No cloud roster is connected in this release. Shared rosters will use this same permission model.
        </Text>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, tint = color.text }: { label: string; value: string; tint?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: font.bold, fontSize: 22, color: tint }} tabular>
        {value}
      </Text>
      <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginTop: space.lg, paddingHorizontal: space.xs },
  screen: { flex: 1, backgroundColor: color.bg },
  privacy: { flexDirection: 'row', gap: 14, padding: space.md, marginTop: space.sm, borderRadius: radius.lg, backgroundColor: color.accentSoft },
  label: { marginTop: space.xl, marginBottom: 10, marginLeft: 6 },
  form: { padding: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  input: {
    height: 50,
    marginTop: 8,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    backgroundColor: color.surfaceHigh,
    paddingHorizontal: space.md,
    color: color.text,
    fontFamily: font.medium,
    fontSize: 17,
  },
  preview: { flexDirection: 'row', paddingVertical: space.lg, borderRadius: radius.lg, backgroundColor: color.surface },
  vr: { width: StyleSheet.hairlineWidth, backgroundColor: color.line },
});
