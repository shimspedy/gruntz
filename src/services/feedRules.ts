import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { openExternalUrl } from '../utils/externalLinks';
import { getSupabase } from './supabaseClient';

/**
 * The community rules every athlete agrees to before their first post or comment.
 *
 * App Review guideline 1.2 asks apps with user content to have people accept terms that
 * leave no tolerance for objectionable content or abusive users. Agreement is kept per
 * account on this phone; bumping RULES_VERSION asks everyone again.
 */
const RULES_VERSION = 1;
const KEY = '@gruntz_feed_rules';
const TERMS_URL = 'https://gruntzfit.com/terms-of-use';

async function accountId(): Promise<string | null> {
  try {
    const { data } = await (getSupabase()?.auth.getSession() ?? Promise.resolve({ data: { session: null } }));
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

async function accepted(): Promise<string[]> {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null') as { v?: number; ids?: unknown } | null;
    return saved?.v === RULES_VERSION && Array.isArray(saved.ids) ? saved.ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** True when the signed-in athlete has agreed, asking once if they have not. */
export async function ensureFeedRulesAccepted(): Promise<boolean> {
  const id = await accountId();
  if (!id) return false;
  const ids = await accepted();
  if (ids.includes(id)) return true;
  const agreed = await new Promise<boolean>((resolve) => {
    Alert.alert(
      'Community rules',
      'Gruntz has no tolerance for objectionable content or abusive athletes. Posts, photos and comments that are hateful, harassing, sexual, violent, illegal or that share someone else’s private information are removed, and the account can be closed.\n\nUse Report or Block on any post or comment to tell us or to stop seeing someone.',
      [
        { text: 'Read the rules', onPress: () => { void openExternalUrl(TERMS_URL); resolve(false); } },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'I agree', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
  if (!agreed) return false;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ v: RULES_VERSION, ids: [...ids.filter((x) => x !== id), id].slice(-20) }));
  } catch {
    // Asked again next time; agreeing still counts for this post.
  }
  return true;
}
