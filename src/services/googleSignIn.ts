import Constants from 'expo-constants';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { signInWithProviderToken, type ProviderSignInResult } from './backup';

const extra = Constants.expoConfig?.extra as { googleIosClientId?: string; googleWebClientId?: string } | undefined;
/** The iOS OAuth client. A public identifier, not a secret; it also sits in the app's URL schemes. */
const iosClientId = extra?.googleIosClientId;
/**
 * The Web OAuth client. On Android, Google issues the identity token to this client,
 * so it is the audience Supabase checks. Public, like the iOS one; its secret never
 * ships in the app. Android also needs an Android OAuth client in the same Google
 * Cloud project for package com.gruntz.fitness and each signing certificate's SHA-1
 * (Play app signing, upload, debug), or sign-in fails with DEVELOPER_ERROR.
 */
const webClientId = extra?.googleWebClientId;

export const googleSignInAvailable = (): boolean =>
  (Platform.OS === 'ios' && !!iosClientId) || (Platform.OS === 'android' && !!webClientId);

let configured = false;

/**
 * Sign in with Google, natively. Google signs an identity token for this app's client
 * ID; Supabase checks the signature and that the token was issued to this app, then
 * starts the session. Only the basic profile scopes are asked for, and Google's
 * session on the phone is dropped afterwards: this app keeps its own.
 */
export async function signInWithGoogle(): Promise<ProviderSignInResult> {
  if (!googleSignInAvailable()) return 'unavailable';
  try {
    if (!configured) {
      GoogleSignin.configure(
        Platform.OS === 'ios' ? { iosClientId, scopes: ['email'] } : { webClientId, scopes: ['email'] },
      );
      configured = true;
    }
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return 'cancelled';
    const token = response.data.idToken;
    // Nothing else from Google is needed once Supabase has the token.
    void GoogleSignin.signOut().catch(() => undefined);
    if (!token) return 'error';
    return await signInWithProviderToken('google', token);
  } catch (error) {
    if (isErrorWithCode(error) && (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS)) return 'cancelled';
    if (__DEV__) console.warn('[auth] google sign-in failed', error);
    return 'error';
  }
}
