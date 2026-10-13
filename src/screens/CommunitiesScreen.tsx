import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchPublicTeams, joinPublicTeam, type PublicTeam } from '../services/teams';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';
import { FAILURE_MESSAGE } from './LeaderToolsScreen';

/** Public teams anyone signed in can find and join without a code. */
export default function CommunitiesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<PublicTeam[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const latest = useRef(0);

  const load = useCallback(async (q: string) => {
    const ticket = ++latest.current;
    const result = await fetchPublicTeams(q);
    if (!alive.current || ticket !== latest.current) return;
    if (result.ok) { setTeams(result.value); setFailed(false); } else { setFailed(true); }
  }, []);

  useEffect(() => {
    alive.current = true;
    const timer = setTimeout(() => { void load(query); }, query ? 250 : 0);
    return () => { alive.current = false; clearTimeout(timer); };
  }, [query, load]);

  const join = async (team: PublicTeam) => {
    if (joining) return;
    setJoining(team.id);
    const result = await joinPublicTeam(team.id);
    if (!alive.current) return;
    setJoining(null);
    if (!result.ok) { haptic.warning(); toast(FAILURE_MESSAGE[result.reason], { tone: 'error', icon: 'alert' }); return; }
    haptic.success();
    toast(`You joined ${team.name}`);
    setTeams((current) => (current ?? []).map((item) => (item.id === team.id ? { ...item, isMember: true, memberCount: item.memberCount + 1 } : item)));
    navigation.navigate('Team', { teamId: team.id });
  };

  return (
    <View style={styles.screen}>
      <NavHeader title="Communities" />
      <View style={styles.search}>
        <Icon name="search" size={16} color={color.textTertiary} />
        <TextInput
          maxFontSizeMultiplier={1.6}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or purpose"
          placeholderTextColor={color.textTertiary}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          selectionColor={color.accent}
          accessibilityLabel="Search communities"
        />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={color.textSecondary} onRefresh={() => { setRefreshing(true); void load(query).finally(() => alive.current && setRefreshing(false)); }} />}
      >
        {failed ? (
          <View style={styles.empty}>
            <Icon name="alert" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>Couldn’t load communities</Text>
            <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>Check your connection, then try again.</Text>
            <Button title="Try again" variant="secondary" size="md" onPress={() => { void load(query); }} style={{ marginTop: space.md }} />
          </View>
        ) : teams === null ? (
          <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.xxl }}>Loading…</Text>
        ) : teams.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="globe2" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>{query ? 'Nothing matches' : 'No communities yet'}</Text>
            <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>
              {query ? 'Try another word, or ask the leader for an invite code.' : 'Create a team and open it to everyone from its menu, and it shows up here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {teams.map((team, index) => (
              <View key={team.id} style={[styles.row, index < teams.length - 1 && styles.divider]}>
                <Tap feedback="opacity" disabled={!team.isMember} onPress={() => navigation.navigate('Team', { teamId: team.id })} style={{ flex: 1 }} accessibilityRole={team.isMember ? 'button' : undefined} accessibilityLabel={`${team.name}, ${team.memberCount} ${team.memberCount === 1 ? 'member' : 'members'}${team.isMember ? ', joined' : ''}`}>
                  <Text variant="headline" numberOfLines={1}>{team.name}</Text>
                  {team.description ? <Text variant="subhead" tone="secondary" numberOfLines={2} style={{ marginTop: 2 }}>{team.description}</Text> : null}
                  <Text variant="footnote" tone="tertiary" style={{ marginTop: 4 }}>
                    {team.memberCount === 1 ? '1 member' : `${team.memberCount} members`}
                  </Text>
                </Tap>
                {team.isMember ? (
                  <View style={styles.joined}><Text variant="footnote" style={{ color: color.accent, fontFamily: font.semibold }}>Joined</Text></View>
                ) : (
                  <Button title="Join" size="sm" variant="accent" loading={joining === team.id} onPress={() => { void join(team); }} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: space.md, marginBottom: space.md, paddingHorizontal: 14, height: 44, borderRadius: 22, backgroundColor: color.surface },
  searchInput: { flex: 1, color: color.text, fontFamily: font.regular, fontSize: 16, height: 44 },
  list: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  joined: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: space.lg, marginTop: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
});
