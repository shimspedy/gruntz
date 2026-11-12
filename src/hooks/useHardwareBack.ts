import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Routes Android's hardware back through the same exit a screen's own close button uses.
 *
 * `gestureEnabled: false` only stops the iOS swipe. On Android, back still popped the
 * screen directly, skipping whatever the close button asks or does first. Only the
 * focused screen listens, so a sheet or alert on top keeps its own back behaviour.
 */
export function useHardwareBack(onBack: () => void) {
  const latest = useRef(onBack);
  useEffect(() => { latest.current = onBack; });
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      latest.current();
      return true;
    });
    return () => sub.remove();
  }, []));
}
