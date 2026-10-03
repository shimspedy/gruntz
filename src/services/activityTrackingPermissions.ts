interface PermissionResult { status: string; canAskAgain?: boolean }
interface Subscription { remove(): void }
export interface BackgroundPermissionDependencies {
  platform: string;
  getPermission(): Promise<PermissionResult>;
  requestPermission(): Promise<PermissionResult>;
  appState(): string | null;
  subscribeAppState(listener: () => void): Subscription;
  canContinue(): boolean;
  /** Small values allow deterministic permission-race tests. */
  maxWaitMs?: number;
  pollMs?: number;
}

/**
 * Expo iOS can resolve an Always upgrade early if the preceding foreground sheet
 * is still dismissing: its requester waits 1.5s for a new resign-active event.
 * Ask from active state, then confirm native authorization after the sheet closes.
 * Read again without presenting another prompt; cancellation never starts GPS.
 */
export async function requestActivityBackgroundPermission(deps: BackgroundPermissionDependencies): Promise<boolean> {
  if (!deps.canContinue()) return false;
  const existing = await deps.getPermission();
  if (!deps.canContinue()) return false;
  if (existing.status === 'granted') return true;
  if (existing.canAskAgain === false) return false;
  if (deps.platform !== 'ios') return (await deps.requestPermission()).status === 'granted' && deps.canContinue();

  const pollMs = deps.pollMs ?? 100;
  const deadline = Date.now() + (deps.maxWaitMs ?? 30000);
  const remaining = () => Math.max(0, deadline - Date.now());
  async function waitUntilActive(): Promise<boolean> {
    if (!deps.canContinue()) return false;
    if (deps.appState() === 'active' || deps.appState() === null) return true;
    return new Promise((resolve) => {
      let settled = false;
      let subscription: Subscription | undefined;
      let interval: ReturnType<typeof setInterval> | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        subscription?.remove();
        if (interval) clearInterval(interval);
        if (timeout) clearTimeout(timeout);
        resolve(value);
      };
      const check = () => {
        if (!deps.canContinue()) finish(false);
        else if (deps.appState() === 'active' || deps.appState() === null) finish(true);
      };
      subscription = deps.subscribeAppState(check);
      interval = setInterval(check, pollMs);
      timeout = setTimeout(() => finish(false), remaining());
      check();
    });
  }
  async function boundedRequest(): Promise<PermissionResult | null> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: PermissionResult | null) => {
        if (settled) return;
        settled = true;
        clearInterval(interval);
        clearTimeout(timeout);
        resolve(value);
      };
      const interval = setInterval(() => { if (!deps.canContinue()) finish(null); }, pollMs);
      const timeout = setTimeout(() => finish(null), remaining());
      void deps.requestPermission().then(finish, () => finish(null));
    });
  }
  if (!await waitUntilActive() || !deps.canContinue() || remaining() === 0) return false;
  const requested = await boundedRequest();
  if (!requested || !deps.canContinue()) return false;
  // Even a denied result can be stale while the upgrade prompt remains open.
  if (!await waitUntilActive() || !deps.canContinue()) return false;
  // Authorization delegate propagation may trail UIApplicationDidBecomeActive.
  // Give it a short bounded opportunity, using reads rather than extra prompts.
  for (let attempt = 0; attempt < 6 && deps.canContinue() && remaining() > 0; attempt += 1) {
    if ((await deps.getPermission()).status === 'granted' && deps.canContinue()) return true;
    if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, Math.min(pollMs, remaining())));
  }
  return false;
}
