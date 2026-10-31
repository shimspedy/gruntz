import { useMemo, useRef, useState } from 'react';
import { Alert, Modal, PixelRatio, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { captureRef, releaseCapture } from 'react-native-view-shot';
import { cardDate, type ShareCardModel } from '../../features/shareCards';
import { trackRetentionEvent } from '../../services/retentionAnalytics';
import { Button } from '../../ui/Button';
import { NavHeader } from '../../ui/Layout';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, space } from '../../ui/tokens';
import { useContentSize } from '../../ui/useContentSize';
import { activityCaptureSize } from '../../utils/activityCapture';
import { SHARE_CARD_RATIO, ShareCard } from './ShareCard';

/** Room the header, caption and Share button take around the card. */
const CHROME = 210;
const MAX_CARD = 440;

/**
 * Full-screen preview of a share card. What is on screen is what gets exported:
 * the same view is captured at 1080px wide.
 */
export function ShareCardSheet({ model, visible, onClose, source }: {
  model: ShareCardModel | null; visible: boolean; onClose: () => void; source: 'test' | 'mission';
}) {
  const insets = useSafeAreaInsets();
  // Measured on every render: the window can be resized (fold, mirroring) while open.
  const { width, height } = useContentSize();
  const cardWidth = Math.max(240, Math.floor(Math.min(width - space.xl * 2, (height - insets.top - insets.bottom - CHROME) / SHARE_CARD_RATIO, MAX_CARD)));
  const cardView = useRef<View>(null);
  const layout = useRef({ width: 0, height: 0 });
  const [sharing, setSharing] = useState(false);
  const date = useMemo(() => cardDate(), [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const share = async () => {
    if (!model || sharing) return;
    setSharing(true);
    let file: string | undefined;
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing isn’t available on this device.');
      file = await captureRef(cardView, {
        format: 'png',
        result: 'tmpfile',
        ...activityCaptureSize(layout.current.width, layout.current.height, Platform.OS, PixelRatio.get()),
      });
      haptic.light();
      await Sharing.shareAsync(file, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share your Gruntz card' });
      trackRetentionEvent('share_card_shared', { source, kind: model.kind });
    } catch (error) {
      Alert.alert('Couldn’t share the card', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      if (file) releaseCapture(file);
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!sharing) onClose(); }}>
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
        <NavHeader title="Share" icon="close" onBack={() => { if (!sharing) onClose(); }} />
        {model ? (
          <>
            <View style={styles.stage}>
              <View style={[styles.shadow, { borderRadius: cardWidth * 0.06 }]}>
                <View style={[styles.clip, { borderRadius: cardWidth * 0.06 }]}>
                  <View ref={cardView} collapsable={false} onLayout={(event) => { layout.current = event.nativeEvent.layout; }}>
                    <ShareCard model={model} width={cardWidth} date={date} />
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.footer}>
              <Text variant="footnote" tone="secondary" align="center" style={styles.caption}>
                Post it to your story or send it to your unit.
              </Text>
              <Button title="Share" icon="share" onPress={() => void share()} loading={sharing} />
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  shadow: { backgroundColor: '#050607', boxShadow: '0 24px 60px rgba(0,0,0,0.55)' },
  clip: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: '#23262C' },
  footer: { paddingHorizontal: space.md, paddingBottom: space.xs },
  caption: { marginBottom: space.md },
});
