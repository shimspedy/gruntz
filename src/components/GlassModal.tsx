import React, { useEffect, useMemo, useRef } from 'react';
import { View, Modal, StyleSheet, TouchableWithoutFeedback, Platform, KeyboardAvoidingView, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 0-100 blur intensity (iOS only) */
  intensity?: number;
}

/**
 * Liquid Glass bottom sheet modal.
 * iOS: BlurView backdrop + frosted glass sheet.
 * Android: dark overlay + semi-transparent sheet.
 *
 * Uses a spring-based settle animation for a premium bounce on entry.
 */
export function GlassModal({ visible, onClose, children, intensity = 40 }: GlassModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bottomPad = Math.max(spacing.md, insets.bottom);

  const settleY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (visible) {
      settleY.setValue(16);
      Animated.spring(settleY, {
        toValue: 0,
        damping: 14,
        stiffness: 140,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, settleY]);

  const sheet = (
    <Animated.View
      style={[styles.sheet, { transform: [{ translateY: settleY }], paddingBottom: bottomPad }]}
      accessibilityViewIsModal
    >
      {/* Handle bar */}
      <View style={styles.handleRow}>
        <View style={[styles.handle, { backgroundColor: colors.textSecondary }]} />
      </View>
      {children}
    </Animated.View>
  );

  const glassSheet = Platform.OS === 'ios' ? (
    <Animated.View
      style={[styles.sheetOuter, { transform: [{ translateY: settleY }] }]}
      accessibilityViewIsModal
    >
      <BlurView intensity={intensity} tint="dark" style={styles.blurSheet}>
        <View style={[styles.glassOverlay, { backgroundColor: `${colors.card}77`, paddingBottom: bottomPad }]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.textSecondary }]} />
          </View>
          {children}
        </View>
      </BlurView>
    </Animated.View>
  ) : sheet;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} tint="dark" style={styles.backdrop} />
          ) : (
            <View style={styles.backdropAndroid} />
          )}
        </TouchableWithoutFeedback>
        {glassSheet}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropAndroid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetOuter: {
    width: '100%',
    alignSelf: 'stretch',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: `${colors.accent}18`,
    maxHeight: '85%',
  },
  blurSheet: {
    width: '100%',
  },
  glassOverlay: {
    width: '100%',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.cardBorder,
    maxHeight: '85%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
});
