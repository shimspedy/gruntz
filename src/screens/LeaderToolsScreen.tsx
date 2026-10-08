import React, { useCallback, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, RefreshControl, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createTeam,
  fetchMyTeam,
  joinTeam,
  leaveTeam,
  localTeamStatus,
  removeTeamMember,
  syncTeamStatus,
  type Team,
  type TeamFailure,
  type TeamMember,
  type TeamStatus,
} from '../services/teams';
import { useTrainingAccess } from '../store/useSubscriptionStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
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
  | { kind: 'none' }
  | { kind: 'team'; team: Team };

const STATUS_LABEL: Record<TeamStatus, string> = { green: 'Green', amber: 'Amber', red: 'Red', unknown: 'No check-in' };
const STATUS_TINT: Record<TeamStatus, string> = { green: color.success, amber: color.flame, red: color.danger, unknown: color.textQuaternary };

const FAILURE_MESSAGE: Record<TeamFailure, string> = {
  'signed-out': 'Sign in first to use teams.',
  unavailable: 'Teams are not available in this build.',
  'not-found': 'No team uses that code. Check it with your leader.',
  full: 'That team is full.',
  'already-in-team': 'You are already in a team. Leave it before joining another.',
  error: 'That didn’t go through. Check your connection and try again.',
};

function updatedLabel(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`;
  const days = Math.round(minutes / (60 * 24));
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

/** Teams: create one or join with a code, then see who is training and who is ready. */
export default function LeaderToolsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const unlocked = useTrainingAccess();
  const [view, setView] = useState<View_>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const alive = useRef(true);

  const load = useCallback(async () => {
    // Publish first, so the roster that comes back already shows this athlete's latest numbers.
    await syncTeamStatus();
    const result = await fetchMyTeam();
    if (!alive.current) return;
    if (result.ok) setView(result.value ? { kind: 'team', team: result.value } : { kind: 'none' });
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

  const run = async (action: () => Promise<{ ok: true } | { ok: false; reason: TeamFailure }>, done?: string) => {
    if (busy) return;
    setBusy(true);
    const result = await action();
    if (result.ok) {
      haptic.success();
      if (done) toast(done);
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

  const invite = (team: Team) => {
    haptic.light();
    void Share.share({ message: `Join ${team.name} on Gruntz. Open Profile, then Leader tools, and enter the code ${team.inviteCode}.` }).catch(() => undefined);
  };

  const confirmLeave = (team: Team) => {
    const soleMember = team.members.length === 1;
    Alert.alert(
      soleMember ? 'Delete this team?' : 'Leave this team?',
      soleMember
        ? 'You are the only member, so leaving removes the team and its invite code.'
        : team.isLeader
          ? 'The longest-standing member becomes the leader. Your sessions, streak and status stop being shared.'
          : 'Your sessions, streak and status stop being shared with this team.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: soleMember ? 'Delete team' : 'Leave team', style: 'destructive', onPress: () => void run(leaveTeam, soleMember ? 'Team deleted' : 'You left the team') },
      ],
    );
  };

  const memberOptions = (member: TeamMember) => {
    haptic.light();
    const remove = () =>
      Alert.alert(`Remove ${member.displayName}?`, 'They can join again with the invite code.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void run(() => removeTeamMember(member.userId), `${member.displayName} removed`) },
      ]);
    if (process.env.EXPO_OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: member.displayName, options: ['Remove from team', 'Cancel'], destructiveButtonIndex: 0, cancelButtonIndex: 1, userInterfaceStyle: 'dark' },
        (i) => {
          if (i === 0) remove();
        },
      );
      return;
    }
    remove();
  };

  const mine = localTeamStatus();

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
        <View style={styles.privacy}>
          <Icon name="lock" size={20} color={color.accent} />
          <View style={{ flex: 1 }}>
            <Text variant="headline">Three numbers, nothing else</Text>
            <Text variant="subhead" tone="secondary" style={{ marginTop: 4 }}>
              A team sees your session count, your streak and a green, amber or red status from today’s check-in. Weights, sleep, limitations and test scores stay on this phone.
            </Text>
          </View>
        </View>

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
            Loading your team…
          </Text>
        ) : null}

        {view.kind === 'unavailable' ? (
          <Notice icon="info" title="Teams need an account" body="This build is not connected to Gruntz accounts, so teams are switched off." />
        ) : null}

        {view.kind === 'error' ? (
          <Notice icon="alert" title="Couldn’t reach your team" body="Check your connection, then try again.">
            <Button title="Try again" variant="secondary" size="md" onPress={() => { setView({ kind: 'loading' }); void load(); }} style={{ marginTop: space.md }} />
          </Notice>
        ) : null}

        {view.kind === 'signed-out' ? (
          <Notice icon="people" title="Sign in to use teams" body="A team needs to know who is who, so it uses the same email sign-in as your progress backup. It takes a six-digit code, no password.">
            <Button title="Sign in" size="md" onPress={() => navigation.navigate('Backup')} style={{ marginTop: space.md }} />
          </Notice>
        ) : null}

        {view.kind === 'none' ? (
          <>
            <Text variant="overline" tone="secondary" style={styles.label}>
              Join a team
            </Text>
            <View style={styles.form}>
              <Text variant="subhead" tone="secondary">
                Invite code from your leader
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
              />
              <Button title="Join team" size="md" loading={busy} disabled={code.length !== 6} onPress={() => void run(() => joinTeam(code), 'You joined the team')} style={{ marginTop: space.lg }} />
            </View>

            <Text variant="overline" tone="secondary" style={styles.label}>
              Lead a team
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
              />
              <Button
                title={unlocked ? 'Create team' : 'Unlock Gruntz Pro to lead a team'}
                size="md"
                variant={unlocked ? 'primary' : 'secondary'}
                loading={busy}
                disabled={unlocked && !name.trim()}
                onPress={create}
                style={{ marginTop: space.lg }}
              />
              <Text variant="footnote" tone="tertiary" style={{ marginTop: space.sm }}>
                Up to 50 athletes. Joining a team is free; leading one is part of Gruntz Pro.
              </Text>
            </View>
          </>
        ) : null}

        {view.kind === 'team' ? (
          <>
            <Text variant="overline" tone="secondary" style={styles.label}>
              {view.team.name}
            </Text>
            <View style={styles.inviteCard}>
              <View style={{ flex: 1 }}>
                <Text variant="subhead" tone="secondary">
                  Invite code
                </Text>
                <Text style={styles.code} selectable accessibilityLabel={`Invite code ${view.team.inviteCode.split('').join(' ')}`}>
                  {view.team.inviteCode}
                </Text>
              </View>
              <Button title="Share" icon="share" size="md" variant="secondary" onPress={() => invite(view.team)} />
            </View>

            <Text variant="overline" tone="secondary" style={styles.label}>
              {view.team.members.length === 1 ? '1 athlete' : `${view.team.members.length} athletes`}
            </Text>
            <View style={styles.roster}>
              {view.team.members.map((member, index) => (
                <RosterRow
                  key={member.userId}
                  member={member}
                  last={index === view.team.members.length - 1}
                  onOptions={view.team.isLeader && !member.isMe ? () => memberOptions(member) : undefined}
                />
              ))}
            </View>
            {view.team.members.length === 1 ? (
              <Text variant="footnote" tone="tertiary" style={{ marginTop: space.md, paddingHorizontal: 6 }}>
                Share the code and athletes appear here as they join.
              </Text>
            ) : null}

            <Tap feedback="opacity" disabled={busy} onPress={() => confirmLeave(view.team)} style={styles.leave} accessibilityRole="button">
              <Text variant="headline" style={{ color: color.danger }}>
                {view.team.members.length === 1 ? 'Delete team' : 'Leave team'}
              </Text>
            </Tap>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function RosterRow({ member, last, onOptions }: { member: TeamMember; last: boolean; onOptions?: () => void }) {
  return (
    <View
      style={[styles.rosterRow, !last && styles.rosterDivider]}
      accessible
      accessibilityLabel={`${member.displayName}${member.role === 'leader' ? ', leader' : ''}, ${member.sessions} sessions, ${member.streak} day streak, status ${STATUS_LABEL[member.status]}`}
    >
      <View style={[styles.dot, { backgroundColor: STATUS_TINT[member.status] }]} />
      <View style={{ flex: 1 }}>
        <Text variant="headline" numberOfLines={1}>
          {member.displayName}
          {member.isMe ? <Text variant="headline" tone="tertiary">{'  You'}</Text> : null}
        </Text>
        <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
          {member.role === 'leader' ? 'Leader · ' : ''}
          {STATUS_LABEL[member.status]} · {updatedLabel(member.updatedAt)}
        </Text>
      </View>
      <View style={styles.rosterStat}>
        <Text variant="headline" tabular>
          {member.sessions}
        </Text>
        <Text variant="caption" tone="tertiary">
          sessions
        </Text>
      </View>
      <View style={styles.rosterStat}>
        <Text variant="headline" tabular>
          {member.streak}d
        </Text>
        <Text variant="caption" tone="tertiary">
          streak
        </Text>
      </View>
      {onOptions ? (
        <Tap feedback="opacity" hitSlop={8} onPress={onOptions} style={styles.rowMore} accessibilityLabel={`Options for ${member.displayName}`}>
          <Icon name="more" size={20} color={color.textSecondary} weight="semibold" />
        </Tap>
      ) : null}
    </View>
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
  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  code: { fontFamily: font.bold, fontSize: 28, letterSpacing: 5, color: color.text, marginTop: 2, fontVariant: ['tabular-nums'] },
  roster: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md },
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 64, paddingVertical: space.sm },
  rosterDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  rosterStat: { alignItems: 'flex-end', minWidth: 54 },
  rowMore: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  leave: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: space.xl },
});
