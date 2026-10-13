import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { fetchMyTeams, leaveTeam, removeTeamMember, syncTeamStatus, type Team, type TeamFailure, type TeamMember } from '../services/teams';
import { loadProfilePhotoLocation } from '../services/profilePhoto';
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
import { relativeTime } from '../utils/relativeTime';
import { FAILURE_MESSAGE, STATUS_LABEL, STATUS_TINT } from './LeaderToolsScreen';

type State = { kind: 'loading' } | { kind: 'team'; team: Team } | { kind: 'gone' } | { kind: 'error' };

/** One team: its invite code, who is in it and how they are doing. */
export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teamId } = useRoute<RouteProp<RootStackParamList, 'Team'>>().params;
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const privacyDismissed = useChromePrefs((s) => s.leaderPrivacyDismissed);
  const setPrivacyDismissed = useChromePrefs((s) => s.setLeaderPrivacyDismissed);

  const load = useCallback(async () => {
    await syncTeamStatus();
    const result = await fetchMyTeams();
    if (!alive.current) return;
    if (!result.ok) { setState({ kind: 'error' }); return; }
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
    void Share.share({ message: `Join ${team.name} on Gruntz. Open Profile, then Leader tools, and enter the code ${team.inviteCode}.` }).catch(() => undefined);
  };

  const confirmLeave = (team: Team) => {
    const soleMember = team.members.length === 1;
    Alert.alert(
      soleMember ? 'Delete this team?' : 'Leave this team?',
      soleMember
        ? 'You are the only member, so leaving removes the team and its invite code.'
        : team.isLeader
          ? 'The longest-standing member becomes the leader. Your sessions, streak and status stop being shared with this team.'
          : 'Your sessions, streak and status stop being shared with this team.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: soleMember ? 'Delete team' : 'Leave team', style: 'destructive', onPress: () => void run(() => leaveTeam(team.id), soleMember ? 'Team deleted' : 'You left the team', () => navigation.goBack()) },
      ],
    );
  };

  /** Leaving and deleting sit behind the menu with the other team actions, never one tap from the roster. */
  const teamOptions = (team: Team) => {
    haptic.light();
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [
      { label: 'Share invite code', run: () => invite(team) },
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

  return (
    <View style={styles.screen}>
      <NavHeader title={team?.name ?? 'Team'} right={team ? <IconButton icon="more" label="Team options" onPress={() => teamOptions(team)} /> : undefined} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={color.textSecondary} onRefresh={() => { setRefreshing(true); void load().finally(() => alive.current && setRefreshing(false)); }} />}
      >
        {state.kind === 'loading' ? (
          <Text variant="callout" tone="secondary" align="center" style={styles.state}>Loading…</Text>
        ) : null}
        {state.kind === 'gone' ? (
          <View style={styles.notice}>
            <Icon name="people" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>You’re no longer in this team</Text>
            <Text variant="subhead" tone="secondary" style={{ marginTop: 4 }}>It was removed, or its leader removed you. Ask for the invite code to join again.</Text>
            <Button title="Back to Leader tools" variant="secondary" size="md" onPress={() => navigation.goBack()} style={{ marginTop: space.md }} />
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

        {team ? (
          <>
            <Text variant="overline" tone="secondary" style={styles.label}>
              {team.isLeader ? 'You lead this team' : 'Invite code'}
            </Text>
            <View style={styles.inviteCard}>
              <View style={{ flex: 1 }}>
                <Text variant="subhead" tone="secondary">Invite code</Text>
                <Text style={styles.code} selectable accessibilityLabel={`Invite code ${team.inviteCode.split('').join(' ')}`}>{team.inviteCode}</Text>
              </View>
              <Button title="Share" icon="share" size="md" variant="secondary" onPress={() => invite(team)} />
            </View>

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
          </>
        ) : null}
      </ScrollView>
    </View>
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
  label: { marginTop: space.xl, marginBottom: 10, marginLeft: 6 },
  state: { marginTop: space.xxl },
  notice: { padding: space.md, marginTop: space.xl, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  code: { fontFamily: font.bold, fontSize: 28, letterSpacing: 5, color: color.text, marginTop: 2, fontVariant: ['tabular-nums'] },
  roster: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md },
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 64, paddingVertical: space.sm },
  rosterDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  rosterStat: { alignItems: 'flex-end', minWidth: 54 },
  rowMore: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  memberPhoto: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  memberImage: { width: 40, height: 40, borderRadius: 20 },
  memberInitial: { fontFamily: font.bold, fontSize: 17, color: color.text },
  dot: { position: 'absolute', right: -2, bottom: -2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color.surface },
});
