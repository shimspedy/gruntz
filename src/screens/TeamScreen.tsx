import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, RefreshControl, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { fetchMyTeams, leaveTeam, removeTeamMember, setTeamVisibility, syncTeamStatus, type Team, type TeamFailure, type TeamMember } from '../services/teams';
import { loadProfilePhotoLocation } from '../services/profilePhoto';
import { useChromePrefs } from '../store/useUiStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { IconButton, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';
import { relativeTime } from '../utils/relativeTime';
import { FAILURE_MESSAGE, STATUS_LABEL, STATUS_TINT } from './LeaderToolsScreen';
import { TeamChatView } from './TeamChatScreen';

type State = { kind: 'loading' } | { kind: 'team'; team: Team } | { kind: 'gone' } | { kind: 'error' };
type Tab = 'chat' | 'leaderboard' | 'members';
const TABS: { id: Tab; label: string }[] = [{ id: 'chat', label: 'Chat' }, { id: 'leaderboard', label: 'Leaderboard' }, { id: 'members', label: 'Members' }];

/** One team: its chat, who is ahead, and who is in it. */
export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teamId, tab: initialTab } = useRoute<RouteProp<RootStackParamList, 'Team'>>().params;
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [tab, setTab] = useState<Tab>(initialTab ?? 'chat');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const privacyDismissed = useChromePrefs((s) => s.leaderPrivacyDismissed);
  const setPrivacyDismissed = useChromePrefs((s) => s.setLeaderPrivacyDismissed);
  const [visibility, setVisibility] = useState<{ team: Team; description: string } | null>(null);

  const load = useCallback(async () => {
    await syncTeamStatus();
    const result = await fetchMyTeams();
    if (!alive.current) return;
    if (!result.ok) { setState((current) => (current.kind === 'team' ? current : { kind: 'error' })); return; }
    const team = result.value.find((item) => item.id === teamId);
    setState(team ? { kind: 'team', team } : { kind: 'gone' });
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      void load();
      return () => { alive.current = false; };
    }, [load]),
  );

  const run = async (action: () => Promise<{ ok: true } | { ok: false; reason: TeamFailure }>, done: string, then?: () => void) => {
    if (busy) return;
    setBusy(true);
    const result = await action();
    if (result.ok) {
      haptic.success();
      toast(done);
      if (then) then(); else await load();
    } else {
      haptic.warning();
      toast(FAILURE_MESSAGE[result.reason], { tone: 'error', icon: 'alert' });
    }
    if (alive.current) setBusy(false);
  };

  const invite = (team: Team) => {
    haptic.light();
    void Share.share({ message: `Join ${team.name} on Gruntz. Open Profile, then Teams, and enter the code ${team.inviteCode}.` }).catch(() => undefined);
  };

  const confirmLeave = (team: Team) => {
    const soleMember = team.members.length === 1;
    Alert.alert(
      soleMember ? 'Delete this team?' : 'Leave this team?',
      soleMember
        ? 'You are the only member, so leaving removes the team, its chat and its invite code.'
        : team.isLeader
          ? 'The longest-standing member becomes the leader. Your sessions, streak and status stop being shared with this team.'
          : 'Your sessions, streak and status stop being shared with this team.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: soleMember ? 'Delete team' : 'Leave team', style: 'destructive', onPress: () => void run(() => leaveTeam(team.id), soleMember ? 'Team deleted' : 'You left the team', () => navigation.goBack()) },
      ],
    );
  };

  /** Leaving and deleting sit behind the menu with the other team actions, never one tap from the page. */
  const teamOptions = (team: Team) => {
    haptic.light();
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [
      { label: 'Share invite code', run: () => invite(team) },
      ...(team.isLeader ? [{ label: team.isPublic ? 'Edit community listing' : 'Open to everyone', run: () => setVisibility({ team, description: team.description }) }] : []),
      ...(privacyDismissed ? [{ label: 'What a team sees', run: () => { setPrivacyDismissed(false); navigation.navigate('LeaderTools'); } }] : []),
      { label: team.members.length === 1 ? 'Delete team' : 'Leave team', run: () => confirmLeave(team), destructive: true },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: team.name, options: [...actions.map((a) => a.label), 'Cancel'], destructiveButtonIndex: actions.length - 1, cancelButtonIndex: actions.length, userInterfaceStyle: 'dark' },
        (i) => actions[i]?.run(),
      );
      return;
    }
    Alert.alert(team.name, undefined, [
      ...actions.map((a) => ({ text: a.label, onPress: a.run, ...(a.destructive ? { style: 'destructive' as const } : {}) })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const memberOptions = (team: Team, member: TeamMember) => {
    haptic.light();
    const remove = () =>
      Alert.alert(`Remove ${member.displayName}?`, 'They can join again with the invite code.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void run(() => removeTeamMember(team.id, member.userId), `${member.displayName} removed`) },
      ]);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: member.displayName, options: ['Remove from team', 'Cancel'], destructiveButtonIndex: 0, cancelButtonIndex: 1, userInterfaceStyle: 'dark' },
        (i) => { if (i === 0) remove(); },
      );
      return;
    }
    remove();
  };

  const team = state.kind === 'team' ? state.team : null;
  const refresh = <RefreshControl refreshing={refreshing} tintColor={color.textSecondary} onRefresh={() => { setRefreshing(true); void load().finally(() => alive.current && setRefreshing(false)); }} />;

  return (
    <View style={styles.screen}>
      <NavHeader title={team?.name ?? 'Team'} right={team ? <IconButton icon="more" label="Team options" onPress={() => teamOptions(team)} /> : undefined} />

      {team ? (
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((item) => {
            const selected = item.id === tab;
            return (
              <Tap key={item.id} feedback="opacity" onPress={() => { if (!selected) { haptic.selection(); setTab(item.id); } }} style={[styles.tab, selected && styles.tabSelected]} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={item.label}>
                <Text variant="subhead" style={{ fontFamily: font.semibold, color: selected ? '#000' : color.textSecondary }}>{item.label}</Text>
              </Tap>
            );
          })}
        </View>
      ) : null}

      {state.kind === 'loading' ? (
        <Text variant="callout" tone="secondary" align="center" style={styles.state}>Loading…</Text>
      ) : null}
      {state.kind === 'gone' ? (
        <View style={styles.notice}>
          <Icon name="people" size={22} color={color.textSecondary} />
          <Text variant="headline" style={{ marginTop: space.sm }}>You’re no longer in this team</Text>
          <Text variant="subhead" tone="secondary" style={{ marginTop: 4 }}>It was removed, or its leader removed you. Ask for the invite code to join again.</Text>
          <Button title="Back to Teams" variant="secondary" size="md" onPress={() => navigation.goBack()} style={{ marginTop: space.md }} />
        </View>
      ) : null}
      {state.kind === 'error' ? (
        <View style={styles.notice}>
          <Icon name="alert" size={22} color={color.textSecondary} />
          <Text variant="headline" style={{ marginTop: space.sm }}>Couldn’t reach your team</Text>
          <Text variant="subhead" tone="secondary" style={{ marginTop: 4 }}>Check your connection, then try again.</Text>
          <Button title="Try again" variant="secondary" size="md" onPress={() => { setState({ kind: 'loading' }); void load(); }} style={{ marginTop: space.md }} />
        </View>
      ) : null}

      {team && tab === 'chat' ? <TeamChatView team={team} /> : null}

      {team && tab === 'leaderboard' ? (
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxl }]} showsVerticalScrollIndicator={false} refreshControl={refresh}>
          <Leaderboard team={team} />
        </ScrollView>
      ) : null}

      {team && tab === 'members' ? (
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxl }]} showsVerticalScrollIndicator={false} refreshControl={refresh}>
          <View style={styles.inviteCard}>
            <View style={{ flex: 1 }}>
              <Text variant="subhead" tone="secondary">{team.isLeader ? 'Your invite code' : 'Invite code'}</Text>
              <Text style={styles.code} selectable accessibilityLabel={`Invite code ${team.inviteCode.split('').join(' ')}`}>{team.inviteCode}</Text>
            </View>
            <Button title="Share" icon="share" size="md" variant="secondary" onPress={() => invite(team)} />
          </View>
          {team.isPublic ? (
            <Text variant="footnote" tone="tertiary" style={{ marginTop: space.sm, paddingHorizontal: 6 }}>
              Listed under Communities: anyone can find and join it.{team.description ? ` “${team.description}”` : ''}
            </Text>
          ) : null}
          <Text variant="overline" tone="secondary" style={styles.label}>
            {team.members.length === 1 ? '1 athlete' : `${team.members.length} athletes`}
          </Text>
          <View style={styles.roster}>
            {team.members.map((member, index) => (
              <RosterRow key={member.userId} member={member} last={index === team.members.length - 1} onOptions={team.isLeader && !member.isMe ? () => memberOptions(team, member) : undefined} />
            ))}
          </View>
          {team.members.length === 1 ? (
            <Text variant="footnote" tone="tertiary" style={{ marginTop: space.md, paddingHorizontal: 6 }}>Share the code and athletes appear here as they join.</Text>
          ) : null}
        </ScrollView>
      ) : null}

      <Sheet visible={visibility !== null} onClose={() => setVisibility(null)} title={visibility?.team.isPublic ? 'Community listing' : 'Open to everyone'} avoidKeyboard>
        {visibility ? (
          <View style={styles.sheetBody}>
            <Text variant="subhead" tone="secondary">
              A public team is listed under Communities with its name and this description, and anyone signed in can join. The roster and chat stay members only.
            </Text>
            <TextInput
              maxFontSizeMultiplier={1.6}
              value={visibility.description}
              onChangeText={(description) => setVisibility({ ...visibility, description })}
              placeholder="What is it for, and when do you train?"
              placeholderTextColor={color.textTertiary}
              style={styles.input}
              multiline
              maxLength={200}
              selectionColor={color.accent}
              accessibilityLabel="Community description"
            />
            <Button
              title={visibility.team.isPublic ? 'Save listing' : 'List it publicly'}
              loading={busy}
              onPress={() => void run(() => setTeamVisibility(visibility.team.id, true, visibility.description), visibility.team.isPublic ? 'Listing updated' : 'Your team is now public', () => { setVisibility(null); void load(); })}
              style={{ marginTop: space.lg }}
            />
            {visibility.team.isPublic ? (
              <Button
                title="Make private again"
                variant="secondary"
                loading={busy}
                onPress={() => void run(() => setTeamVisibility(visibility.team.id, false, visibility.description), 'Your team is private again', () => { setVisibility(null); void load(); })}
                style={{ marginTop: space.sm }}
              />
            ) : null}
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

/** Ranked by sessions completed, then streak. Your own row is marked, and the top three get a medal. */
function Leaderboard({ team }: { team: Team }) {
  const ranked = [...team.members].sort((a, b) => b.sessions - a.sessions || b.streak - a.streak || a.displayName.localeCompare(b.displayName));
  const mine = ranked.findIndex((m) => m.isMe);
  return (
    <>
      <View style={styles.standing}>
        <Text variant="callout" tone="secondary">Your standing</Text>
        <Text style={styles.standingValue} tabular>{mine >= 0 ? `#${mine + 1}` : '—'}<Text variant="subhead" tone="tertiary"> of {ranked.length}</Text></Text>
        <Text variant="footnote" tone="tertiary">Sessions completed, all time. Streak breaks ties.</Text>
      </View>
      <View style={styles.roster}>
        {ranked.map((member, index) => (
          <View key={member.userId} style={[styles.rosterRow, index < ranked.length - 1 && styles.rosterDivider]} accessible accessibilityLabel={`Number ${index + 1}, ${member.displayName}${member.isMe ? ', you' : ''}, ${member.sessions} sessions, ${member.streak} day streak`}>
            <View style={styles.rank}>
              {index < 3 ? <Icon name="medal" size={20} color={[color.cta, '#C0C0C0', '#CD7F32'][index]} /> : <Text style={styles.rankNumber} tabular>{index + 1}</Text>}
            </View>
            <MemberPhoto member={member} />
            <View style={{ flex: 1 }}>
              <Text variant="headline" numberOfLines={1} style={member.isMe ? { color: color.accent } : undefined}>
                {member.displayName}{member.isMe ? '  You' : ''}
              </Text>
              <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>{member.streak} day streak</Text>
            </View>
            <View style={styles.rosterStat}>
              <Text variant="headline" tabular>{member.sessions}</Text>
              <Text variant="caption" tone="tertiary">sessions</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

/** Your own row shows the photo on this phone; everyone else's comes with the roster. */
function MemberPhoto({ member }: { member: TeamMember }) {
  const file = useChromePrefs((s) => s.profilePhotoFile);
  const [mine, setMine] = useState<string | null>(null);
  useEffect(() => {
    if (!member.isMe) return undefined;
    let current = true;
    void loadProfilePhotoLocation().then((uri) => { if (current) setMine(uri); });
    return () => { current = false; };
  }, [member.isMe, file]);
  const uri = member.isMe ? mine : member.avatarUrl;
  return (
    <View style={styles.memberPhoto}>
      {uri ? <Image source={{ uri }} style={styles.memberImage} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
        : <Text style={styles.memberInitial}>{member.displayName.trim().charAt(0).toUpperCase() || '?'}</Text>}
      <View style={[styles.dot, { backgroundColor: STATUS_TINT[member.status] }]} />
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
      <MemberPhoto member={member} />
      <View style={{ flex: 1 }}>
        <Text variant="headline" numberOfLines={1}>
          {member.displayName}
          {member.isMe ? <Text variant="headline" tone="tertiary">{'  You'}</Text> : null}
        </Text>
        <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
          {member.role === 'leader' ? 'Leader · ' : ''}
          {STATUS_LABEL[member.status]} · {relativeTime(member.updatedAt)}
        </Text>
      </View>
      <View style={styles.rosterStat}>
        <Text variant="headline" tabular>{member.sessions}</Text>
        <Text variant="caption" tone="tertiary">sessions</Text>
      </View>
      <View style={styles.rosterStat}>
        <Text variant="headline" tabular>{member.streak}d</Text>
        <Text variant="caption" tone="tertiary">streak</Text>
      </View>
      {onOptions ? (
        <Tap feedback="opacity" hitSlop={8} onPress={onOptions} style={styles.rowMore} accessibilityLabel={`Options for ${member.displayName}`}>
          <Icon name="more" size={18} color={color.textTertiary} />
        </Tap>
      ) : <View style={{ width: 8 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  tabs: { flexDirection: 'row', marginHorizontal: space.md, marginBottom: space.sm, padding: 3, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: color.surface },
  tab: { flex: 1, height: 36, borderRadius: radius.md - 3, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  tabSelected: { backgroundColor: color.cta },
  body: { paddingHorizontal: space.md, paddingTop: space.sm },
  label: { marginTop: space.xl, marginBottom: 10, marginLeft: 6 },
  state: { marginTop: space.xxl },
  notice: { padding: space.md, marginHorizontal: space.md, marginTop: space.xl, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  code: { fontFamily: font.bold, fontSize: 28, letterSpacing: 5, color: color.text, marginTop: 2, fontVariant: ['tabular-nums'] },
  standing: { padding: space.md, marginBottom: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, gap: 4 },
  standingValue: { fontFamily: font.bold, fontSize: 30, color: color.text },
  rank: { width: 28, alignItems: 'center' },
  rankNumber: { fontFamily: font.bold, fontSize: 16, color: color.textSecondary },
  roster: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md },
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 64, paddingVertical: space.sm },
  rosterDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  rosterStat: { alignItems: 'flex-end', minWidth: 54 },
  rowMore: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  memberPhoto: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  memberImage: { width: 40, height: 40, borderRadius: 20 },
  memberInitial: { fontFamily: font.bold, fontSize: 17, color: color.text },
  dot: { position: 'absolute', right: -2, bottom: -2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color.surface },
  sheetBody: { paddingHorizontal: space.gutter, paddingTop: space.md },
  input: { minHeight: 88, marginTop: space.sm, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md, paddingTop: 12, color: color.text, fontFamily: font.medium, fontSize: 16 },
});
