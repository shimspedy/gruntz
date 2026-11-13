import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useReadinessStore } from '../store/useReadinessStore';
import { reportHandled } from './crashReporting';
import { requestNotificationPermission } from './notifications';
import { getSupabase } from './supabaseClient';

/**
 * Push notifications for the social side: a teammate's chat line, a nudge, a new follower.
 *
 * Off until the athlete turns it on. The phone's push token is stored against their
 * account only while it is on, and removed when they switch it off or sign out. Sending
 * happens on the server (`supabase/functions/team-push`); this phone only ever says
 * "I just did this", never who to notify or what to say.
 */
const TOKEN_KEY = '@gruntz_push_token';
export const TEAM_CHANNEL = 'team';

async function deviceToken(): Promise<string | null> {
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (!projectId || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TEAM_CHANNEL, { name: 'Teams and followers', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return typeof data === 'string' && data.startsWith('ExponentPushToken[') ? data : null;
}

/** Registers this phone for the signed-in account. Quietly does nothing when it cannot. */
export async function syncPushToken(): Promise<boolean> {
  if (!useReadinessStore.getState().teamNotifications) return false;
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return false;
    const token = await deviceToken();
    if (!token) return false;
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (error) return false;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    // The simulator and builds without push credentials land here; that is not a fault.
    reportHandled(error, 'teamPush.sync');
    return false;
  }
}

/** Turns team notifications on: asks the system once, then registers this phone. */
export async function enableTeamNotifications(): Promise<'on' | 'denied' | 'unavailable'> {
  if (!await requestNotificationPermission()) return 'denied';
  useReadinessStore.getState().setFieldPreference('teamNotifications', true);
  if (await syncPushToken()) return 'on';
  useReadinessStore.getState().setFieldPreference('teamNotifications', false);
  return 'unavailable';
}

/** Removes this phone's token from the account. Needs the session, so call it before signing out. */
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await getSupabase()?.rpc('unregister_push_token', { p_token: token });
  } catch {
    // The token also leaves when another account registers on this phone, or the app is removed.
  }
}

export async function disableTeamNotifications(): Promise<void> {
  useReadinessStore.getState().setFieldPreference('teamNotifications', false);
  await unregisterPushToken();
}
