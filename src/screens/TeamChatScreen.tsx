import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cleanMessage, deleteMessage, fetchMessages, MAX_MESSAGE_LENGTH, mergeMessages, reportMessage, sendMessage, subscribeToMessages, type TeamMessage,
} from '../services/teamChat';
import type { Team } from '../services/teams';
import { Image } from 'expo-image';
import { Icon } from '../ui/Icon';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';
import { FAILURE_MESSAGE } from './LeaderToolsScreen';

const timeLabel = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/** A team's chat: a plain message log, newest at the bottom, live while open. Fills whatever holds it. */
export function TeamChatView({ team }: { team: Team }) {
  const insets = useSafeAreaInsets();
  const teamId = team.id;
  const [messages, setMessages] = useState<TeamMessage[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const exhausted = useRef(false);
  const list = useRef<FlatList<TeamMessage>>(null);

  const load = useCallback(async () => {
    const page = await fetchMessages(teamId);
    if (!page.ok) { setFailed(true); return; }
    setFailed(false);
    setMessages((current) => mergeMessages(current ?? [], page.value));
  }, [teamId]);

  useEffect(() => {
    void load();
    // Live events carry new lines in; a slow poll covers a socket that never came up.
    const poll = setInterval(() => { void load(); }, 20_000);
    const unsubscribe = subscribeToMessages(teamId, (change) => {
      setMessages((current) => {
        if (!current) return current;
        if (change.kind === 'added') return mergeMessages(current, [change.message]);
        return current.filter((message) => message.id !== change.id);
      });
    });
    return () => { clearInterval(poll); unsubscribe(); };
  }, [load, teamId]);

  const older = async () => {
    if (loadingOlder || exhausted.current || !messages?.length) return;
    setLoadingOlder(true);
    const page = await fetchMessages(teamId, messages[0].createdAt);
    if (page.ok) {
      if (!page.value.length) exhausted.current = true;
      setMessages((current) => mergeMessages(current ?? [], page.value));
    }
    setLoadingOlder(false);
  };

  const send = async () => {
    const text = cleanMessage(draft);
    if (!text || sending) return;
    setSending(true);
    const result = await sendMessage(teamId, text);
    setSending(false);
    if (!result.ok) {
      haptic.warning();
      toast(result.reason === 'not-found' ? 'You are no longer in this team.' : FAILURE_MESSAGE[result.reason], { tone: 'error', icon: 'alert' });
      return;
    }
    haptic.light();
    setDraft('');
    setMessages((current) => mergeMessages(current ?? [], [result.value]));
  };

  const options = (message: TeamMessage) => {
    haptic.light();
    const canDelete = message.isMe || team.isLeader;
    const remove = () => Alert.alert('Delete this message?', 'It disappears for everyone in the team.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        void deleteMessage(message).then((result) => {
          if (result.ok) setMessages((current) => (current ?? []).filter((item) => item.id !== message.id));
          else toast(FAILURE_MESSAGE[result.reason], { tone: 'error', icon: 'alert' });
        });
      } },
    ]);
    const report = () => Alert.alert('Report this message?', 'It goes to Gruntz for review. The team leader can also remove it, or the member who sent it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => {
        void reportMessage(message, '').then((result) => toast(result.ok ? 'Reported. Thank you.' : FAILURE_MESSAGE[result.reason], result.ok ? undefined : { tone: 'error', icon: 'alert' }));
      } },
    ]);
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [
      ...(message.isMe ? [] : [{ label: 'Report message', run: report }]),
      ...(canDelete ? [{ label: 'Delete message', run: remove, destructive: true }] : []),
    ];
    if (!actions.length) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: `${message.displayName} · ${timeLabel(message.createdAt)}`, options: [...actions.map((a) => a.label), 'Cancel'], destructiveButtonIndex: actions.findIndex((a) => a.destructive), cancelButtonIndex: actions.length, userInterfaceStyle: 'dark' },
        (i) => actions[i]?.run(),
      );
      return;
    }
    Alert.alert(message.displayName, undefined, [
      ...actions.map((a) => ({ text: a.label, onPress: a.run, ...(a.destructive ? { style: 'destructive' as const } : {}) })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const photoFor = (message: TeamMessage) => team.members.find((member) => member.userId === message.userId)?.avatarUrl ?? null;
  const canSend = !!cleanMessage(draft) && !sending;

  return (
    <View style={styles.screen}>
      {/* Both platforms pad: Android draws edge-to-edge, so the window no longer shrinks for the keyboard on its own. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={insets.top + 100}>
        <FlatList
          ref={list}
          data={messages ? [...messages].reverse() : []}
          inverted
          keyExtractor={(message) => message.id}
          renderItem={({ item, index }) => {
            const data = messages ? [...messages].reverse() : [];
            const previous = data[index + 1];
            const sameAuthor = previous?.userId === item.userId && Date.parse(item.createdAt) - Date.parse(previous.createdAt) < 5 * 60_000;
            return <Bubble message={item} showAuthor={!sameAuthor} photoUrl={photoFor(item)} onLongPress={() => options(item)} />;
          }}
          onEndReached={() => { void older(); }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingHorizontal: space.md, paddingVertical: space.md }}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            <View style={styles.empty}>
              {failed ? (
                <>
                  <Icon name="alert" size={22} color={color.textSecondary} />
                  <Text variant="headline" style={{ marginTop: space.sm }}>Couldn’t load the chat</Text>
                  <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>Check your connection and pull down to try again.</Text>
                </>
              ) : messages ? (
                <>
                  <Icon name="people" size={22} color={color.textSecondary} />
                  <Text variant="headline" style={{ marginTop: space.sm }}>Nothing yet</Text>
                  <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>Say when the next session is, or who is in.</Text>
                </>
              ) : (
                <Text variant="callout" tone="secondary">Loading…</Text>
              )}
            </View>
          }
          refreshing={false}
          onRefresh={() => { void load(); }}
        />
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
          <TextInput
            maxFontSizeMultiplier={1.6}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message the team"
            placeholderTextColor={color.textTertiary}
            style={styles.input}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            selectionColor={color.accent}
            accessibilityLabel="Message"
          />
          <Tap onPress={() => { void send(); }} disabled={!canSend} style={[styles.send, !canSend && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel="Send">
            <Icon name="send" size={18} color="#000" weight="semibold" />
          </Tap>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ message, showAuthor, photoUrl, onLongPress }: { message: TeamMessage; showAuthor: boolean; photoUrl: string | null; onLongPress: () => void }) {
  const mine = message.isMe;
  return (
    <Tap feedback="opacity" onLongPress={onLongPress} onPress={() => undefined} style={[styles.row, mine && styles.rowMine]} accessibilityLabel={`${message.displayName}: ${message.body}`} accessibilityHint="Long press for options">
      {!mine ? (
        <View style={styles.avatar}>
          {photoUrl ? <Image source={{ uri: photoUrl }} style={{ width: 28, height: 28, borderRadius: 14 }} contentFit="cover" accessibilityIgnoresInvertColors /> : <Text style={styles.avatarInitial}>{message.displayName.charAt(0).toUpperCase()}</Text>}
        </View>
      ) : null}
      <View style={{ maxWidth: '78%' }}>
        {showAuthor ? (
          <Text variant="caption" tone="tertiary" style={[styles.author, mine && { textAlign: 'right' }]}>
            {mine ? timeLabel(message.createdAt) : `${message.displayName} · ${timeLabel(message.createdAt)}`}
          </Text>
        ) : null}
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text variant="body" style={mine ? { color: '#000' } : undefined}>{message.body}</Text>
        </View>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg, transform: [{ scaleY: -1 }] },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 },
  rowMine: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  avatarInitial: { fontFamily: font.bold, fontSize: 12, color: color.text },
  author: { marginBottom: 4, marginLeft: 4, marginTop: 8 },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.lg, borderCurve: 'continuous' },
  bubbleTheirs: { backgroundColor: color.surface, borderBottomLeftRadius: 6 },
  bubbleMine: { backgroundColor: color.accent, borderBottomRightRadius: 6 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: space.md, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, backgroundColor: color.bg },
  input: { flex: 1, minHeight: 44, maxHeight: 132, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11, borderRadius: 22, backgroundColor: color.surface, color: color.text, fontFamily: font.regular, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
});
