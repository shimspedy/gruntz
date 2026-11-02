import * as Sentry from '@sentry/react-native';

/**
 * Crash reporting.
 *
 * Off unless the build has `EXPO_PUBLIC_SENTRY_DSN`, and always off in development.
 * A build without the key behaves exactly as before, the same as backup without its
 * Supabase keys.
 *
 * Reports carry the error, the stack and the app/device version, nothing about the
 * person: no email, name, IP address, screenshots or view hierarchy. Account ids and
 * emails are masked everywhere a report can carry text (message, exception, extra data,
 * contexts, tags, breadcrumbs, URL paths), and URLs lose their query strings.
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || '';

let started = false;

export function crashReportingEnabled(): boolean {
  return started;
}

export function initCrashReporting(): void {
  if (started || !DSN || __DEV__) return;
  started = true;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    // Crashes only; no performance tracing or session replay.
    tracesSampleRate: 0,
    beforeSend(event) {
      delete event.user;
      // Database errors can quote row values: account ids and emails never leave the device.
      if (event.message) event.message = redact(event.message);
      for (const exception of event.exception?.values ?? []) {
        if (exception.value) exception.value = redact(exception.value);
      }
      // A non-Error value (a PostgREST error object) is serialized into `extra`.
      if (event.extra) event.extra = redactDeep(event.extra) as typeof event.extra;
      if (event.contexts) event.contexts = redactDeep(event.contexts) as typeof event.contexts;
      if (event.tags) event.tags = redactDeep(event.tags) as typeof event.tags;
      if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        if (event.request.url) event.request.url = cleanUrl(event.request.url);
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      // Console output can echo user input; it is not needed to read a crash.
      if (breadcrumb.category === 'console') return null;
      return scrubBreadcrumb(breadcrumb);
    },
  });
}

/** For errors the app catches itself (the root error boundary) that would otherwise go unseen. */
export function reportError(error: unknown, componentStack?: string | null): void {
  if (!started) return;
  Sentry.captureException(error, componentStack ? { contexts: { react: { componentStack } } } : undefined);
}

/**
 * For errors the app catches and recovers from (a failed backup, a storage write) that
 * would otherwise vanish. Tagged so they group by where they came from. Same scrubbing
 * as every other report: they go through the same `beforeSend`.
 */
/** A trail entry attached to any later crash report: never personal data. */
export function logBreadcrumb(category: string, message: string, data?: Record<string, string | number | boolean | null>): void {
  if (__DEV__) console.info(`[${category}] ${message}`, data ?? '');
  if (!started) return;
  Sentry.addBreadcrumb({ category, message, data, level: 'info' });
}

export function reportHandled(error: unknown, tag: string): void {
  if (!started) return;
  Sentry.withScope((scope) => {
    scope.setTag('handled', tag);
    Sentry.captureException(error);
  });
}

export function redact(text: string): string {
  return text
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
    .replace(/[^\s@"'()<>]+@[^\s@"'()<>]+\.[a-z]{2,}/gi, '<email>');
}

function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

/** Query strings off, and ids out of the path (the profile photo is stored as `<account id>.jpg`). */
function cleanUrl(url: string): string {
  return redact(stripQuery(url));
}

/** Masks ids and emails in every string of a JSON-like value, without walking forever. */
export function redactDeep(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return redact(value);
  if (!value || typeof value !== 'object' || depth > 8) return value;
  if (Array.isArray(value)) return value.map((item) => redactDeep(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) out[redact(key)] = redactDeep(item, depth + 1);
  return out;
}

function scrubBreadcrumb<T extends { message?: string; data?: Record<string, unknown> }>(breadcrumb: T): T {
  const next = { ...breadcrumb };
  if (typeof next.message === 'string') next.message = redact(next.message);
  if (next.data) {
    const data = redactDeep(next.data) as Record<string, unknown>;
    if (typeof next.data.url === 'string') data.url = cleanUrl(next.data.url);
    next.data = data;
  }
  return next;
}

// Starts on import; `index.ts` imports this module before anything else.
initCrashReporting();
