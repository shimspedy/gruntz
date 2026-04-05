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

/** Error notification — failed actions */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Selection tick — pickers, sliders, tab switches */
export function hapticSelection() {
  Haptics.selectionAsync();
}

// ─── Rich Compound Patterns (iOS 26 / Android 16) ──────────────

/** Double-tap celebration — XP gain, exercise complete */
export async function hapticDoubleTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await delay(80);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Triple-burst — level up, rank promotion */
export async function hapticLevelUp() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await delay(60);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await delay(60);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await delay(100);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Heartbeat pulse — streak milestone, countdown */
export async function hapticHeartbeat() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await delay(120);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await delay(400);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await delay(120);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Ramp-up — progress bar filling, countdown finishing */
export async function hapticRampUp() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await delay(100);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await delay(80);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await delay(60);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Soft tick sequence — scrolling through a list of options */
export function hapticSoftTick() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
