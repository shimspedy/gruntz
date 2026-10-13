import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
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
import { loadProfilePhotoLocation } from '../services/profilePhoto';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { IconButton, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
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

/** Teams: the ones you are in, a way to find more, and a code or a name to start another. */
export default function LeaderToolsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const unlocked = useTrainingAccess();
  const [view, setView] = useState<View_>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sheet, setSheet] = useState<'join' | 'create' | null>(null);
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
      setSheet(null);
      setCode('');
      setName('');
      await load();
    } else {
      haptic.warning();
      toast(FAILURE_MESSAGE[result.reason], { tone: 'error', icon: 'alert' });
    }
    if (alive.current) setBusy(false);
  };

  const openCreate = () => {
    if (!unlocked) return navigation.navigate('Paywall');
    setSheet('create');
  };

  const mine = localTeamStatus();
  const teams = view.kind === 'teams' ? view.teams : [];
  const canAct = view.kind === 'teams';
  const atLimit = teams.length >= MAX_TEAMS;

  return (
    <View style={styles.screen}>
      <NavHeader title="Teams" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }}
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

        <View style={styles.preview} accessible accessibilityLabel={`What you share: ${mine.sessions} sessions, ${mine.streak} day streak, status ${STATUS_LABEL[mine.status]}`}>
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

        {canAct ? (
          <>
            <Tap feedback="highlight" baseColor={color.surface} pressedColor={color.surfacePressed} onPress={() => navigation.navigate('Communities')} style={styles.discover} accessibilityRole="button" accessibilityLabel="Find communities">
              <View style={[styles.actionIcon, { backgroundColor: color.accentSoft }]}>
                <Icon name="globe2" size={20} color={color.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="headline">Find communities</Text>
                <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>Open groups anyone can join. Run clubs, test prep, ruck crews.</Text>
              </View>
              <Icon name="chevronRight" size={15} color={color.textTertiary} weight="semibold" />
            </Tap>

            <View style={styles.actions}>
              <ActionButton icon="plus" label="Join with code" onPress={() => setSheet('join')} disabled={atLimit} />
              <ActionButton icon="flag" label={unlocked ? 'Create team' : 'Create team · Pro'} onPress={openCreate} disabled={atLimit} />
            </View>
            {atLimit ? (
              <Text variant="footnote" tone="tertiary" style={styles.hint}>
                You are in {MAX_TEAMS} teams, the most Gruntz allows. Leave one to join or create another.
              </Text>
            ) : null}

            {teams.length ? (
              <>
                <Text variant="overline" tone="secondary" style={styles.label}>
                  {teams.length === 1 ? 'Your team' : `Your ${teams.length} teams`}
                </Text>
                <View style={styles.list}>
                  {teams.map((team, index) => (
                    <TeamRow key={team.id} team={team} last={index === teams.length - 1} onPress={() => navigation.navigate('Team', { teamId: team.id })} onChat={() => navigation.navigate('Team', { teamId: team.id, tab: 'chat' })} />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyTeams}>
                <Icon name="people" size={24} color={color.textSecondary} />
                <Text variant="headline" style={{ marginTop: space.sm }}>No teams yet</Text>
                <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>
                  Join a community above, enter a code from a leader, or start your own.
                </Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      <Sheet visible={sheet === 'join'} onClose={() => setSheet(null)} title="Join with a code" avoidKeyboard>
        <View style={styles.sheetBody}>
          <Text variant="subhead" tone="secondary">Six characters from the team’s leader.</Text>
          <TextInput
            maxFontSizeMultiplier={1.8}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            maxLength={6}
            placeholder="ABC123"
            placeholderTextColor={color.textTertiary}
            style={[styles.input, styles.codeInput]}
            selectionColor={color.accent}
            returnKeyType="join"
            onSubmitEditing={() => code.length === 6 && void run(() => joinTeam(code), 'You joined the team')}
            accessibilityLabel="Invite code"
          />
          <Button title="Join team" loading={busy} disabled={code.length !== 6} onPress={() => void run(() => joinTeam(code), 'You joined the team')} style={{ marginTop: space.lg }} />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'create'} onClose={() => setSheet(null)} title="Create a team" avoidKeyboard>
        <View style={styles.sheetBody}>
          <Text variant="subhead" tone="secondary">Up to 50 athletes. You can open it to everyone later from the team’s menu.</Text>
          <TextInput
            maxFontSizeMultiplier={1.8}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={40}
            placeholder="2nd Platoon, Saturday crew…"
            placeholderTextColor={color.textTertiary}
            style={styles.input}
            selectionColor={color.accent}
            returnKeyType="done"
            onSubmitEditing={() => name.trim() && void run(() => createTeam(name), 'Team created')}
            accessibilityLabel="Team name"
          />
          <Button title="Create team" loading={busy} disabled={!name.trim()} onPress={() => void run(() => createTeam(name), 'Team created')} style={{ marginTop: space.lg }} />
        </View>
      </Sheet>
    </View>
  );
}

function ActionButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Tap feedback="highlight" baseColor={color.surface} pressedColor={color.surfacePressed} onPress={onPress} disabled={disabled} style={[styles.action, disabled && { opacity: 0.45 }]} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.actionIcon}>
        <Icon name={icon} size={18} color={color.text} weight="semibold" />
      </View>
      <Text variant="headline" numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Tap>
  );
}

/** The photo on this phone, for your own face in the row; teammates' come with the roster. */
function useMyPhoto(): string | null {
  const file = useChromePrefs((s) => s.profilePhotoFile);
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    void loadProfilePhotoLocation().then((next) => { if (current) setUri(next); });
    return () => { current = false; };
  }, [file]);
  return uri;
}

/** A team at a glance: who is in it, how many are ready, and a way straight into its chat. */
function TeamRow({ team, last, onPress, onChat }: { team: Team; last: boolean; onPress: () => void; onChat: () => void }) {
  const myPhoto = useMyPhoto();
  const ready = team.members.filter((m) => m.status === 'green').length;
  const faces = team.members.slice(0, 4).map((member) => ({ ...member, avatarUrl: member.isMe ? myPhoto : member.avatarUrl }));
  // Two separate targets side by side, so the chat button stays reachable with a screen reader.
  return (
    <View style={[styles.teamRow, !last && styles.divider]}>
      <Tap
        feedback="highlight"
        baseColor={color.surface}
        pressedColor={color.surfacePressed}
        onPress={onPress}
        style={styles.teamMain}
        accessibilityRole="button"
        accessibilityLabel={`${team.name}, ${team.members.length === 1 ? '1 athlete' : `${team.members.length} athletes`}, ${ready} ready${team.isLeader ? ', you lead it' : ''}${team.isPublic ? ', public' : ''}`}
      >
      <View style={styles.faces}>
        {faces.map((member, index) => (
          <View key={member.userId} style={[styles.face, { marginLeft: index ? -10 : 0, zIndex: faces.length - index }]}>
            {member.avatarUrl ? <Image source={{ uri: member.avatarUrl }} style={styles.faceImage} contentFit="cover" accessibilityIgnoresInvertColors />
              : <Text style={styles.faceInitial}>{member.displayName.trim().charAt(0).toUpperCase() || '?'}</Text>}
          </View>
        ))}
        {team.members.length > faces.length ? (
          <View style={[styles.face, { marginLeft: -10, zIndex: 0 }]}><Text style={styles.faceInitial}>+{team.members.length - faces.length}</Text></View>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="headline" numberOfLines={1}>{team.name}</Text>
        <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
          {team.isLeader ? 'You lead · ' : ''}
          {team.members.length === 1 ? '1 athlete' : `${team.members.length} athletes`} · {ready} ready{team.isPublic ? ' · Public' : ''}
        </Text>
      </View>
      </Tap>
      <Tap feedback="opacity" hitSlop={8} onPress={onChat} style={styles.chatButton} accessibilityRole="button" accessibilityLabel={`Chat with ${team.name}`}>
        <Icon name="chat" size={18} color={color.accent} />
      </Tap>
    </View>
  );
}

function Notice({ icon, title, body, children }: { icon: 'info' | 'alert' | 'people'; title: string; body: string; children?: React.ReactNode }) {
  return (
    <View style={[styles.card, { marginTop: space.xl }]}>
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
      <Text style={{ fontFamily: font.bold, fontSize: small ? 15 : 20, lineHeight: 26, color: tint }} tabular numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  privacy: { flexDirection: 'row', gap: 14, padding: space.md, marginTop: space.sm, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.accentSoft },
  privacyClose: { marginTop: -6, marginRight: -6 },
  preview: { flexDirection: 'row', paddingVertical: space.md, marginTop: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  vr: { width: StyleSheet.hairlineWidth, backgroundColor: color.line },
  label: { marginTop: space.xl, marginBottom: 10, marginLeft: 6 },
  hint: { marginTop: space.sm, paddingHorizontal: 6 },
  state: { marginTop: space.xxl },
  card: { padding: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  discover: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, marginTop: space.xl, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingHorizontal: space.sm + 2, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  actionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  list: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md, overflow: 'hidden' },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 72 },
  teamMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, marginLeft: -space.md, paddingLeft: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  faces: { flexDirection: 'row', alignItems: 'center' },
  face: { width: 34, height: 34, borderRadius: 17, backgroundColor: color.surfaceHigh, borderWidth: 2, borderColor: color.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  faceImage: { width: 30, height: 30, borderRadius: 15 },
  faceInitial: { fontFamily: font.bold, fontSize: 12, color: color.text },
  chatButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTeams: { alignItems: 'center', padding: space.lg, marginTop: space.xl, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  sheetBody: { paddingHorizontal: space.gutter, paddingTop: space.md },
  input: {
    height: 52,
    marginTop: space.sm,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    paddingHorizontal: space.md,
    color: color.text,
    fontFamily: font.medium,
    fontSize: 17,
  },
  codeInput: { fontFamily: font.bold, fontSize: 22, letterSpacing: 5, fontVariant: ['tabular-nums'], textAlign: 'center' },
});
