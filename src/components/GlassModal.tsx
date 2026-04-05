import React, { useMemo } from 'react';
import { View, Modal, StyleSheet, TouchableWithoutFeedback, Platform, KeyboardAvoidingView } from 'react-native';
import { BlurView } from 'expo-blur';
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
 */
export function GlassModal({ visible, onClose, children, intensity = 40 }: GlassModalProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const sheet = (
    <View style={styles.sheet}>
      {/* Handle bar */}
      <View style={styles.handleRow}>
        <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
      </View>
      {children}
    </View>
  );

  const glassSheet = Platform.OS === 'ios' ? (
    <View style={styles.sheetOuter}>
      <BlurView intensity={intensity} tint="dark" style={styles.blurSheet}>
        <View style={[styles.glassOverlay, { backgroundColor: `${colors.card}77` }]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
          </View>
          {children}
        </View>
      </BlurView>
    </View>
  ) : sheet;

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: `${colors.accent}18`,
    maxHeight: '85%',
  },
  blurSheet: {
    flex: 1,
  },
  glassOverlay: {
    flex: 1,
  },
  sheet: {
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
