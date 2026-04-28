import { Linking, Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_STORE_ID = '6761699137';
const ANDROID_PACKAGE = 'com.gruntz.fitness';
const SHARE_DEEPLINK = 'https://gruntzfit.com/';
const REVIEW_LAST_SHOWN_KEY = '@gruntz_review_last_shown';
const REVIEW_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Try the native StoreReview prompt; fall back to opening the App/Play Store.
 * `expo-store-review` is loaded via dynamic import so the app keeps building
 * even if the dependency isn't installed yet.
 */
export async function maybeRequestReview(reason: string) {
  try {
    const lastShown = await AsyncStorage.getItem(REVIEW_LAST_SHOWN_KEY);
    if (lastShown) {
      const ts = Number(lastShown);
      if (Number.isFinite(ts) && Date.now() - ts < REVIEW_COOLDOWN_MS) {
        return false;
      }
    }
  } catch {
    // Storage unavailable — proceed and let the OS rate-limit.
  }

  let prompted = false;
  try {
    const mod = (await import('expo-store-review')) as {
      isAvailableAsync?: () => Promise<boolean>;
      hasAction?: () => Promise<boolean>;
      requestReview: () => Promise<void>;
    };
    const available = mod.isAvailableAsync ? await mod.isAvailableAsync() : true;
    if (available) {
      await mod.requestReview();
      prompted = true;
    }
  } catch {
    prompted = false;
  }

  if (!prompted) {
    const url = Platform.select({
      ios: `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`,
      android: `market://details?id=${ANDROID_PACKAGE}`,
      default: `https://apps.apple.com/app/id${APP_STORE_ID}`,
    });
    try {
      await Linking.openURL(url);
      prompted = true;
    } catch {
      prompted = false;
    }
  }

  if (prompted) {
    try {
      await AsyncStorage.setItem(REVIEW_LAST_SHOWN_KEY, String(Date.now()));
    } catch {
      // best-effort
    }
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[review] prompted (${reason})`);
    }
  }
  return prompted;
}

export async function shareStreak(streakDays: number, rank?: string) {
  const headline = streakDays >= 1
    ? `${streakDays}-day streak on Gruntz${rank ? ` · ${rank}` : ''}`
    : 'Training daily on Gruntz';
  const message = `${headline}\nMission-based military fitness — show up daily.\n${SHARE_DEEPLINK}`;
  try {
    await Share.share({ message, url: SHARE_DEEPLINK, title: 'Gruntz' });
    return true;
  } catch {
    return false;
  }
}
