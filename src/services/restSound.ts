import { AppState } from 'react-native';
import { useSessionStore } from '../store/useSessionStore';
import { useChromePrefs } from '../store/useUiStore';
import { reportHandled } from './crashReporting';



/** A rest that ended longer ago than this ended while the app was away: the notification already rang. */
const LATE_MS = 1500;

type Player = { seekTo(seconds: number): Promise<void>; play(): void };
let player: Promise<Player | null> | null = null;

/**
 * Loaded on first use, never at launch. The session is set to mix, so the chime plays
 * over whatever the athlete is listening to and nothing they started is paused or
 * turned down. It ignores the silent switch on purpose: a phone that lives on silent
 * would otherwise never be heard through the headphones it is playing music into.
 */
function load(): Promise<Player | null> {
  player ??= (async () => {
    try {
      const audio = require('expo-audio') as typeof import('expo-audio');
      await audio.setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false, allowsRecording: false });
      return audio.createAudioPlayer(require('../../assets/sounds/rest-done.mp3'));
    } catch (error) {
      // A build made before the audio module was added: the haptic and banner still fire.
      reportHandled(error, 'restSound.load');
      return null;
    }
  })();
  return player;
}

let lastPlayedFor = 0;

/**
 * Plays the end-of-rest chime once for the rest that was due at `deadline`. Skipped when
 * the sound is switched off, when the app is not in front (the notification covers
 * that), and when the deadline passed a while ago.
 */
export function playRestDone(deadline: number) {
  if (deadline === lastPlayedFor || useChromePrefs.getState().restSoundOff) return;
  if (AppState.currentState && AppState.currentState !== 'active') return;
  if (Date.now() - deadline > LATE_MS) return;
  lastPlayedFor = deadline;
  void load().then(async (p) => {
    if (!p) return;
    await p.seekTo(0);
    p.play();
  }).catch((error: unknown) => reportHandled(error, 'restSound.play'));
}

let started = false;

/**
 * Rings when a rest runs out anywhere in the app, not only on the workout screen: with
 * the workout tucked into the mini bar nothing else marks the moment. A rest that is
 * skipped or restarted never rings.
 */
export function initializeRestSound() {
  if (started) return;
  started = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let watching: number | null = null;
  const arm = (deadline: number | null) => {
    if (deadline === watching) return;
    watching = deadline;
    clearTimeout(timer);
    if (deadline === null) return;
    const wait = deadline - Date.now();
    if (wait < -LATE_MS) return;
    // Warm the player while the athlete rests, so the chime lands on the second.
    if (!useChromePrefs.getState().restSoundOff) void load();
    timer = setTimeout(() => playRestDone(deadline), Math.max(0, wait));
  };
  arm(useSessionStore.getState().active ? useSessionStore.getState().restEndsAt : null);
  useSessionStore.subscribe((s) => arm(s.active ? s.restEndsAt : null));
}
