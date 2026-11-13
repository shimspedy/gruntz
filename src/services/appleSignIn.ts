import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { signInWithProviderToken, type ProviderSignInResult } from './backup';

/** Only where the system offers it: iOS 13 and later, not Android. */
export async function appleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Sign in with Apple, natively. Apple signs an identity token for this app; Supabase
 * checks that signature and the nonce, then starts the session. No password is involved
 * and this app never sees one.
 *
 * The nonce ties the token to this one attempt: Apple is given its SHA-256, Supabase the
 * raw value, so a token captured elsewhere cannot be replayed here.
 */
export async function signInWithApple(): Promise<ProviderSignInResult> {
  try {
    const rawNonce = Array.from(await Crypto.getRandomBytesAsync(32), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) return 'error';
    return await signInWithProviderToken('apple', credential.identityToken, rawNonce);
  } catch (error) {
    // Closing the sheet is a choice, not a failure.
    if ((error as { code?: string } | null)?.code === 'ERR_REQUEST_CANCELED') return 'cancelled';
    if (__DEV__) console.warn('[auth] apple sign-in failed', error);
    return 'error';
  }
}
