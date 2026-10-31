import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { entitlementMessage } from '../services/entitlementStatus';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { space } from '../ui/tokens';
import { showRestoreResult } from './restoreResult';

/**
 * Shown once when Gruntz Pro moves to another phone (another device restored the
 * same Apple ID / Google account). Nothing on this phone is touched; Restore moves
 * the subscription back here, and "Not now" leaves it where it is.
 */
export function MovedDeviceSheet() {
  const movedNotice = useSubscriptionStore((s) => s.movedNotice);
  const [busy, setBusy] = useState(false);
  const { title, body } = entitlementMessage('moved', Platform.OS);
  const close = () => useSubscriptionStore.getState().dismissMovedNotice();

  const restoreHere = async () => {
    if (busy) return;
    setBusy(true);
    const outcome = await useSubscriptionStore.getState().restoreAccess();
    setBusy(false);
    close();
    showRestoreResult(outcome);
  };

  return (
    <Sheet visible={movedNotice} onClose={close} title={title}>
      <View style={styles.body}>
        <Text variant="callout" tone="secondary">{body}</Text>
        <Button title="Restore here" onPress={() => void restoreHere()} loading={busy} />
        <Button title="Not now" variant="secondary" onPress={close} disabled={busy} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.md },
});
