import * as Haptics from 'expo-haptics';

function fireAndForget(promise: Promise<unknown>) {
  void promise.catch(() => {});
}

async function safelyAwait(promise: Promise<unknown>) {
  try {
    await promise;
  } catch {
    // Haptics should never destabilize the app.
  }
}

/** Light tap — buttons, toggles, selections */
export function hapticLight() {
  fireAndForget(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Medium impact — confirmations, card presses */
export function hapticMedium() {
  fireAndForget(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Heavy impact — major actions, warnings */
export function hapticHeavy() {
  fireAndForget(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

/** Success notification — mission complete, save, level up */
export function hapticSuccess() {
  fireAndForget(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Warning notification — errors, destructive actions */
export function hapticWarning() {
  fireAndForget(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** Error notification — failed actions */
export function hapticError() {
  fireAndForget(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

/** Selection tick — pickers, sliders, tab switches */
export function hapticSelection() {
  fireAndForget(Haptics.selectionAsync());
}

// ─── Rich Compound Patterns (iOS 26 / Android 16) ──────────────

/** Double-tap celebration — XP gain, exercise complete */
export async function hapticDoubleTap() {
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  await delay(80);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Triple-burst — level up, rank promotion */
export async function hapticLevelUp() {
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  await delay(60);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  await delay(60);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  await delay(100);
  await safelyAwait(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Heartbeat pulse — streak milestone, countdown */
export async function hapticHeartbeat() {
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  await delay(120);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  await delay(400);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  await delay(120);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

/** Ramp-up — progress bar filling, countdown finishing */
export async function hapticRampUp() {
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  await delay(100);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  await delay(80);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  await delay(60);
  await safelyAwait(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

/** Soft tick sequence — scrolling through a list of options */
export function hapticSoftTick() {
  fireAndForget(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
