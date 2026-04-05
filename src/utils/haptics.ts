import * as Haptics from 'expo-haptics';

/** Light tap — buttons, toggles, selections */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium impact — confirmations, card presses */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy impact — major actions, warnings */
export function hapticHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success notification — mission complete, save, level up */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning notification — errors, destructive actions */
export function hapticWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Selection tick — pickers, sliders, tab switches */
export function hapticSelection() {
  Haptics.selectionAsync();
}
