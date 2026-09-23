import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isBackupAvailable } from '../config/backup';
import {
  deleteBackup,
  fetchBackupMeta,
  getSignedInEmail,
  pushBackup,
  requestSignInCode,
  reconcileTrialStart,
  restoreBackup,
  signOut,
  type BackupMeta,
} from '../services/backup';
import { verifySignInCode } from '../services/backup';
import { Button } from '../ui/Button';
import { EmptyState, Group, NavHeader, Row } from '../ui/Layout';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return 'just now';
  const minutes = Math.round(diff / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/**
 * Optional progress backup.
 *
 * Nothing in Gruntz requires an account. This screen exists so that losing a phone
 * does not lose a training history, and it is reached from Profile — after someone
 * already has something worth keeping, never before. The app is fully usable, for
 * as long as anyone likes, without ever opening it.
 */
export default function BackupScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [meta, setMeta] = useState<BackupMeta | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const current = await getSignedInEmail();
    setSignedInEmail(current);
    setMeta(current ? await fetchBackupMeta() : null);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  // A build without Supabase keys is a supported state, not a broken one.
  if (!isBackupAvailable()) {
    return (
      <View style={styles.screen}>
        <NavHeader title="Back up progress" />
        <EmptyState
          icon="alert"
          title="Backup isn’t available"
          body="This build of Gruntz doesn’t have progress backup configured. Your training is still saved on this device."
        />
      </View>
    );
  }

  const sendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      toast('Enter your email address', { tone: 'error', icon: 'alert' });
      return;
    }
    setBusy(true);
    const result = await requestSignInCode(trimmed);
    setBusy(false);
    if (result === 'sent') {
      haptic.success();
      setStage('code');
      toast('Check your email for a 6-digit code', { icon: 'check' });
      return;
    }
    Alert.alert(
      'Couldn’t send the code',
      result === 'unavailable'
        ? 'Backup isn’t available in this build.'
        : 'We couldn’t reach the server. Check your connection and try again — your training is safe on this device either way.',
    );
  };

  const verify = async () => {
    setBusy(true);
    const result = await verifySignInCode(email, code);
    setBusy(false);
    if (result === 'signed-in') {
      haptic.success();
      setCode('');
      setStage('email');
      // Before the first push, so a reinstall resumes the real trial instead of
      // overwriting the server's earlier start with this device's fresh one.
      await reconcileTrialStart();
      await refresh();
      // First sign-in on a device that has been training: get it safe immediately,
      // rather than waiting for the next debounced push.
      void pushBackup();
      toast('Signed in · your progress will back up automatically', { icon: 'check' });
      return;
    }
    if (result === 'invalid-code') {
      haptic.error();
      Alert.alert('That code didn’t work', 'Codes expire after a few minutes. Send a new one and try again.');
      return;
    }
    Alert.alert('Couldn’t sign in', 'Something went wrong. Your training is safe on this device.');
  };

  const backUpNow = async () => {
    setBusy(true);
    const result = await pushBackup();
    setBusy(false);
    if (result === 'ok') {
      haptic.success();
      await refresh();
      toast('Progress backed up', { icon: 'check' });
      return;
    }
    Alert.alert('Backup didn’t finish', 'We couldn’t reach the server. Nothing on this device has changed.');
  };

  const confirmRestore = () => {
    Alert.alert(
      'Restore from backup?',
      meta
        ? `This replaces everything on this phone with the backup from ${relativeTime(meta.updatedAt)} (${meta.workoutCount} workouts). Anything logged here since then will be lost.`
        : 'This replaces everything on this phone with your backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace my data',
          style: 'destructive',
          onPress: () => void doRestore(),
        },
      ],
    );
  };

  const doRestore = async () => {
    setBusy(true);
    const result = await restoreBackup();
    setBusy(false);
    if (result === 'restored') {
      haptic.success();
      // The stores read AsyncStorage once at startup, so the app has to be reopened
      // for this to take effect. Saying so is better than looking broken.
      Alert.alert(
        'Progress restored',
        'Close and reopen Gruntz to finish. Your training history, plan and streak will be back where you left them.',
      );
      return;
    }
    const message = result === 'no-backup'
      ? 'There’s no backup on this account yet.'
      : result === 'too-new'
        ? 'That backup was made by a newer version of Gruntz. Update the app, then restore.'
        : 'We couldn’t reach the server. Nothing on this device has changed.';
    Alert.alert('Nothing restored', message);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete my backup?',
      'This removes the copy on the server. Your training stays on this phone — but if you lose it, there will be nothing to restore.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete backup',
          style: 'destructive',
          onPress: () => void deleteBackup().then(async (result) => {
            if (result === 'deleted') {
              await refresh();
              toast('Backup deleted');
            } else {
              Alert.alert('Couldn’t delete', 'We couldn’t reach the server. Try again in a moment.');
            }
          }),
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <NavHeader title="Back up progress" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {signedInEmail ? (
          <>
            <Group style={styles.group}>
              <Row icon="check" title="Signed in" value={signedInEmail} />
              <Row
                icon="restart"
                title="Last backup"
                value={meta ? relativeTime(meta.updatedAt) : 'Not yet'}
              />
            </Group>

            <Text variant="callout" tone="secondary" style={styles.note}>
              Your progress backs up automatically after you train. You can restore it on any
              phone by signing in with this email.
            </Text>

            <Button title="Back up now" onPress={() => void backUpNow()} loading={busy} />
            <View style={styles.spacer} />
            <Button
              title="Restore on this phone"
              variant="secondary"
              onPress={confirmRestore}
              disabled={busy || !meta}
            />

            <Group style={styles.group}>
              <Row icon="back" title="Sign out" onPress={() => void signOut().then(refresh)} />
              <Row icon="alert" title="Delete my backup" onPress={confirmDelete} />
            </Group>
          </>
        ) : (
          <>
            <Text variant="title" style={styles.heading}>
              Keep your training if you lose your phone
            </Text>
            <Text variant="callout" tone="secondary" style={styles.note}>
              Gruntz works completely offline and always will — everything you log is saved on
              this phone. Adding your email means there’s a copy to restore from if this phone
              is lost, broken or replaced. No password, no ads, nothing shared.
            </Text>

            {stage === 'email' ? (
              <>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={color.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  maxFontSizeMultiplier={1.8}
                  style={styles.input}
                  selectionColor={color.accent}
                  accessibilityLabel="Email address"
                />
                <Button title="Email me a code" onPress={() => void sendCode()} loading={busy} />
              </>
            ) : (
              <>
                <Text variant="callout" tone="secondary" style={styles.note}>
                  {`We sent a 6-digit code to ${email.trim()}.`}
                </Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  placeholderTextColor={color.textTertiary}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  maxFontSizeMultiplier={1.8}
                  style={[styles.input, styles.codeInput]}
                  selectionColor={color.accent}
                  accessibilityLabel="Six digit code"
                />
                <Button title="Sign in" onPress={() => void verify()} loading={busy} />
                <View style={styles.spacer} />
                <Button
                  title="Use a different email"
                  variant="secondary"
                  onPress={() => { setStage('email'); setCode(''); }}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { padding: space.md, paddingBottom: space.xl },
  heading: { marginBottom: space.sm },
  note: { marginBottom: space.md, lineHeight: 21 },
  group: { marginVertical: space.md },
  spacer: { height: space.sm },
  input: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    paddingHorizontal: space.md,
    color: color.text,
    fontFamily: font.medium,
    fontSize: 17,
    marginBottom: space.md,
  },
  codeInput: { letterSpacing: 6, textAlign: 'center' },
});
