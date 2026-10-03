/** Resolve launch links once so saved navigation cannot override a notification tap. */
export function createInitialLinkResolver(source: {
  getLink: () => Promise<string | null>;
  getNotificationLink: () => Promise<string | null>;
  clearNotification: () => Promise<void>;
}) {
  let initial: Promise<string | null> | undefined;
  return () => {
    if (!initial) {
      initial = Promise.all([
        source.getLink().catch(() => null),
        source.getNotificationLink().catch(() => null),
      ]).then(async ([link, notification]) => {
        // Expo retains the last response. Consume it so later ordinary launches
        // do not reopen an old notification's destination.
        if (notification) await source.clearNotification().catch(() => undefined);
        return link || notification;
      });
    }
    return initial;
  };
}
