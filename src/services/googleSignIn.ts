import Constants from 'expo-constants';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { signInWithProviderToken, type ProviderSignInResult } from './backup';

/** The iOS OAuth client. A public identifier, not a secret; it also sits in the app's URL schemes. */
const iosClientId = (Constants.expoConfig?.extra as { googleIosClientId?: string } | undefined)?.googleIosClientId;

/** iOS only for now: Android needs its own client tied to the Play signing certificate. */
export const googleSignInAvailable = (): boolean => Platform.OS === 'ios' && !!iosClientId;

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
      GoogleSignin.configure({ iosClientId, scopes: ['email'] });
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
