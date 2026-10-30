import * as Sentry from '@sentry/react-native';

/**
 * Crash reporting.
 *
 * Off unless the build has `EXPO_PUBLIC_SENTRY_DSN`, and always off in development.
 * A build without the key behaves exactly as before, the same as backup without its
 * Supabase keys.
 *
 * Reports carry the error, the stack and the app/device version, nothing about the
 * person: no email, name, IP address, screenshots or view hierarchy, and request
 * breadcrumbs lose their query strings (Supabase puts the account id there).
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
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        if (event.request.url) event.request.url = stripQuery(event.request.url);
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      // Console output can echo user input; it is not needed to read a crash.
      if (breadcrumb.category === 'console') return null;
      if (breadcrumb.data && typeof breadcrumb.data.url === 'string') {
        breadcrumb.data = { ...breadcrumb.data, url: stripQuery(breadcrumb.data.url) };
      }
      return breadcrumb;
    },
  });
}

/** For errors the app catches itself (the root error boundary) that would otherwise go unseen. */
export function reportError(error: unknown, componentStack?: string | null): void {
  if (!started) return;
  Sentry.captureException(error, componentStack ? { contexts: { react: { componentStack } } } : undefined);
}

function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

// Starts on import; `index.ts` imports this module before anything else.
initCrashReporting();
