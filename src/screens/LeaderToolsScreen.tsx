import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createTeam,
  fetchMyTeams,
  joinTeam,
  localTeamStatus,
  MAX_TEAMS,
  syncTeamStatus,
  type Team,
  type TeamFailure,
  type TeamStatus,
} from '../services/teams';
import { useTrainingAccess } from '../store/useSubscriptionStore';
import { useChromePrefs } from '../store/useUiStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { IconButton, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';

type View_ =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'error' }
  | { kind: 'teams'; teams: Team[] };

export const STATUS_LABEL: Record<TeamStatus, string> = { green: 'Green', amber: 'Amber', red: 'Red', unknown: 'No check-in' };
export const STATUS_TINT: Record<TeamStatus, string> = { green: color.success, amber: color.flame, red: color.danger, unknown: color.textQuaternary };

export const FAILURE_MESSAGE: Record<TeamFailure, string> = {
  'signed-out': 'Sign in first to use teams.',
  unavailable: 'Teams are not available in this build.',
  'not-found': 'No team uses that code. Check it with your leader.',
  full: 'That team is full.',
  'already-in-team': 'You are already in that team.',
  'too-many-teams': `You can be in up to ${MAX_TEAMS} teams. Leave one to join another.`,
  error: 'That didn’t go through. Check your connection and try again.',
};

/** Teams: lead some, join others with a code, and open any of them to see who is training and who is ready. */
export default function LeaderToolsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const unlocked = useTrainingAccess();
  const [view, setView] = useState<View_>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const alive = useRef(true);
  const privacyDismissed = useChromePrefs((s) => s.leaderPrivacyDismissed);
  const setPrivacyDismissed = useChromePrefs((s) => s.setLeaderPrivacyDismissed);

  const load = useCallback(async () => {
    // Publish first, so the rosters that come back already show this athlete's latest numbers.
    await syncTeamStatus();
    const result = await fetchMyTeams();
    if (!alive.current) return;
    if (result.ok) setView({ kind: 'teams', teams: result.value });
    else setView({ kind: result.reason === 'signed-out' ? 'signed-out' : result.reason === 'unavailable' ? 'unavailable' : 'error' });
  }, []);

  // On focus, not on mount: signing in happens on another screen and this one has to notice.
  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      void load();
      return () => {
        alive.current = false;
      };
    }, [load]),
  );

  const run = async (action: () => Promise<{ ok: true } | { ok: false; reason: TeamFailure }>, done: string) => {
    if (busy) return;
    setBusy(true);
    const result = await action();
    if (result.ok) {
      haptic.success();
      toast(done);
      setCode('');
      setName('');
      await load();
    } else {
      haptic.warning();
      toast(FAILURE_MESSAGE[result.reason], { tone: 'error', icon: 'alert' });
    }
    if (alive.current) setBusy(false);
  };

  const create = () => {
    if (!unlocked) return navigation.navigate('Paywall');
    void run(() => createTeam(name), 'Team created');
  };

  const mine = localTeamStatus();
  const teams = view.kind === 'teams' ? view.teams : [];
  const atLimit = teams.length >= MAX_TEAMS;

  return (
    <View style={styles.screen}>
      <NavHeader title="Leader tools" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={color.textSecondary}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => alive.current && setRefreshing(false));
            }}
          />
        }
      >
        {/* Shown until it has been read once; a team's menu brings it back. */}
        {!privacyDismissed ? (
          <View style={styles.privacy}>
            <Icon name="lock" size={20} color={color.accent} />
            <View style={{ flex: 1 }}>
              <Text variant="headline">Three numbers and a photo, nothing else</Text>
              <Text variant="subhead" tone="secondary" style={{ marginTop: 4 }}>
                A team sees your name, your profile photo if you set one, your session count, your streak and a green, amber or red status from today’s check-in. Weights, sleep, limitations and test scores stay on this phone.
              </Text>
            </View>
            <IconButton icon="close" label="Dismiss" size={18} tint={color.textSecondary} onPress={() => { haptic.selection(); setPrivacyDismissed(true); }} style={styles.privacyClose} />
          </View>
        ) : null}

        <Text variant="overline" tone="secondary" style={styles.label}>
          What you share
        </Text>
        <View style={styles.preview}>
          <Metric label="Sessions" value={String(mine.sessions)} />
          <View style={styles.vr} />
          <Metric label="Streak" value={`${mine.streak}d`} />
          <View style={styles.vr} />
          <Metric label="Status" value={STATUS_LABEL[mine.status]} tint={STATUS_TINT[mine.status]} small={mine.status === 'unknown'} />
        </View>

        {view.kind === 'loading' ? (
          <Text variant="callout" tone="secondary" align="center" style={styles.state}>
            Loading your teams…
          </Text>
        ) : null}

        {view.kind === 'unavailable' ? (
          <Notice icon="info" title="Teams need an account" body="This build is not connected to Gruntz accounts, so teams are switched off." />
        ) : null}

        {view.kind === 'error' ? (
          <Notice icon="alert" title="Couldn’t reach your teams" body="Check your connection, then try again.">
            <Button title="Try again" variant="secondary" size="md" onPress={() => { setView({ kind: 'loading' }); void load(); }} style={{ marginTop: space.md }} />
          </Notice>
        ) : null}

        {view.kind === 'signed-out' ? (
          <Notice icon="people" title="Sign in to use teams" body="A team needs to know who is who, so it uses the same email sign-in as your progress backup. It takes a six-digit code, no password.">
            <Button title="Sign in" size="md" onPress={() => navigation.navigate('Backup')} style={{ marginTop: space.md }} />
          </Notice>
        ) : null}

        {view.kind === 'teams' ? (
          <>
            {teams.length ? (
              <>
                <Text variant="overline" tone="secondary" style={styles.label}>
                  {teams.length === 1 ? 'Your team' : `Your ${teams.length} teams`}
                </Text>
                <View style={styles.list}>
                  {teams.map((team, index) => (
                    <TeamRow key={team.id} team={team} last={index === teams.length - 1} onPress={() => navigation.navigate('Team', { teamId: team.id })} />
                  ))}
                </View>
              </>
            ) : null}

            <Text variant="overline" tone="secondary" style={styles.label}>
              {teams.length ? 'Join another team' : 'Join a team'}
            </Text>
            <View style={styles.form}>
              <Text variant="subhead" tone="secondary">
                Invite code from its leader
              </Text>
              <TextInput
                maxFontSizeMultiplier={1.8}
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                placeholder="6 characters"
                placeholderTextColor={color.textTertiary}
                style={[styles.input, styles.codeInput]}
                selectionColor={color.accent}
                returnKeyType="join"
                onSubmitEditing={() => code.length === 6 && void run(() => joinTeam(code), 'You joined the team')}
                accessibilityLabel="Invite code"
                editable={!atLimit}
              />
              <Button title="Join team" size="md" loading={busy} disabled={code.length !== 6 || atLimit} onPress={() => void run(() => joinTeam(code), 'You joined the team')} style={{ marginTop: space.lg }} />
            </View>

            <Text variant="overline" tone="secondary" style={styles.label}>
              {teams.length ? 'Lead another team' : 'Lead a team'}
            </Text>
            <View style={styles.form}>
              <Text variant="subhead" tone="secondary">
                Team or section name
              </Text>
              <TextInput
                maxFontSizeMultiplier={1.8}
                value={name}
                onChangeText={setName}
                maxLength={40}
                placeholder="2nd Platoon, Saturday crew…"
                placeholderTextColor={color.textTertiary}
                style={styles.input}
                selectionColor={color.accent}
                returnKeyType="done"
                accessibilityLabel="Team name"
                editable={!atLimit}
              />
              <Button
                title={unlocked ? 'Create team' : 'Unlock Gruntz Pro to lead a team'}
                size="md"
                variant={unlocked ? 'primary' : 'secondary'}
                loading={busy}
                disabled={atLimit || (unlocked && !name.trim())}
                onPress={create}
                style={{ marginTop: space.lg }}
              />
              <Text variant="footnote" tone="tertiary" style={{ marginTop: space.sm }}>
                {atLimit
                  ? `You are in ${MAX_TEAMS} teams, the most Gruntz allows. Leave one to join or create another.`
                  : `Up to 50 athletes per team, and you can be in up to ${MAX_TEAMS}. Joining is free; leading is part of Gruntz Pro.`}
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function TeamRow({ team, last, onPress }: { team: Team; last: boolean; onPress: () => void }) {
  const ready = team.members.filter((m) => m.status === 'green').length;
  return (
    <Tap
      feedback="highlight"
      baseColor={color.surface}
      pressedColor={color.surfacePressed}
      onPress={onPress}
      style={[styles.teamRow, !last && styles.rosterDivider]}
      accessibilityRole="button"
      accessibilityLabel={`${team.name}, ${team.members.length} athletes, ${ready} ready${team.isLeader ? ', you lead it' : ''}`}
    >
      <View style={styles.teamIcon}>
        <Icon name={team.isLeader ? 'flag' : 'people'} size={18} color={color.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="headline" numberOfLines={1}>{team.name}</Text>
        <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
          {team.isLeader ? 'You lead · ' : ''}
          {team.members.length === 1 ? '1 athlete' : `${team.members.length} athletes`} · {ready} ready
        </Text>
      </View>
      <Icon name="chevronRight" size={15} color={color.textTertiary} weight="semibold" />
    </Tap>
  );
}

function Notice({ icon, title, body, children }: { icon: 'info' | 'alert' | 'people'; title: string; body: string; children?: React.ReactNode }) {
  return (
    <View style={[styles.form, { marginTop: space.xl }]}>
      <Icon name={icon} size={22} color={color.textSecondary} />
      <Text variant="headline" style={{ marginTop: space.sm }}>
        {title}
      </Text>
      <Text variant="subhead" tone="secondary" style={{ marginTop: 4 }}>
        {body}
      </Text>
      {children}
    </View>
  );
}

function Metric({ label, value, tint = color.text, small }: { label: string; value: string; tint?: string; small?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
      <Text style={{ fontFamily: font.bold, fontSize: small ? 15 : 22, lineHeight: 28, color: tint }} tabular numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  privacy: { flexDirection: 'row', gap: 14, padding: space.md, marginTop: space.sm, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.accentSoft },
  privacyClose: { marginTop: -6, marginRight: -6 },
  label: { marginTop: space.xl, marginBottom: 10, marginLeft: 6 },
  state: { marginTop: space.xxl },
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
  codeInput: { fontFamily: font.bold, fontSize: 20, letterSpacing: 4, fontVariant: ['tabular-nums'] },
  preview: { flexDirection: 'row', paddingVertical: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  vr: { width: StyleSheet.hairlineWidth, backgroundColor: color.line },
  list: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md, overflow: 'hidden' },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 64, paddingVertical: space.sm },
  teamIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  rosterDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
});
