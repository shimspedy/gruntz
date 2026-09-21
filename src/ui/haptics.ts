import * as Haptics from 'expo-haptics';

const safe = (fn: () => Promise<unknown>) => () => {
  fn().catch(() => {});
};

/** Haptics are punctuation: one per user action, on the same frame as the visual. */
export const haptic = {
  selection: safe(() => Haptics.selectionAsync()),
  light: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  rigid: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),
  soft: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  success: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
