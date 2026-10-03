import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Pedometer } from 'expo-sensors';
import { AppState, Platform } from 'react-native';
import { requestActivityBackgroundPermission } from './activityTrackingPermissions';
import { createActivityTracker, type ActivityTrackingOptions } from './activityTrackingCore';

export { ACTIVE_ACTIVITY_STORAGE_KEY, DEFAULT_BODY_WEIGHT_LBS } from './activityTrackingCore';
export type { ActivityTrackingOptions, RunTrackerState } from './activityTrackingCore';
export const ACTIVITY_LOCATION_TASK = 'gruntz-outdoor-activity-location-v1';

const locationOptions = (options: ActivityTrackingOptions): Location.LocationTaskOptions => ({
  accuracy: options.batterySaver ? Location.Accuracy.High : Location.Accuracy.BestForNavigation,
  timeInterval: options.batterySaver ? 5000 : 2000,
  distanceInterval: options.batterySaver ? 10 : 3,
  activityType: Location.ActivityType.Fitness,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
  deferredUpdatesInterval: options.batterySaver ? 10000 : 0,
  deferredUpdatesDistance: options.batterySaver ? 15 : 0,
  foregroundService: {
    notificationTitle: 'Gruntz activity recording',
    notificationBody: 'Your route is recording. Open Gruntz to pause or finish.',
    notificationColor: '#C4F542',
    killServiceOnDestroy: true,
  },
});

export const activityTracker = createActivityTracker({
  storage: AsyncStorage,
  now: () => Date.now(),
  platform: Platform.OS,
  foregroundPermission: async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted',
  backgroundPermission: (canContinue = () => true) => requestActivityBackgroundPermission({
    platform: Platform.OS,
    getPermission: () => Location.getBackgroundPermissionsAsync(),
    requestPermission: () => Location.requestBackgroundPermissionsAsync(),
    appState: () => AppState.currentState ?? null,
    subscribeAppState: (listener) => AppState.addEventListener('change', listener),
    canContinue,
  }),
  backgroundAvailable: async () => Platform.OS !== 'web' && await TaskManager.isAvailableAsync(),
  startBackground: (options) => Location.startLocationUpdatesAsync(ACTIVITY_LOCATION_TASK, locationOptions(options)),
  stopBackground: async () => {
    if (Platform.OS !== 'web' && await Location.hasStartedLocationUpdatesAsync(ACTIVITY_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(ACTIVITY_LOCATION_TASK);
    }
  },
  hasBackground: () => Location.hasStartedLocationUpdatesAsync(ACTIVITY_LOCATION_TASK),
  watchForeground: (options, onLocation, onError) => Location.watchPositionAsync(locationOptions(options), onLocation, onError),
  stepsAvailable: async () => {
    if (!await Pedometer.isAvailableAsync()) return false;
    return (await Pedometer.requestPermissionsAsync()).status === 'granted';
  },
  watchSteps: (callback) => Pedometer.watchStepCount((result) => callback(result.steps)),
  getSteps: Platform.OS === 'ios' ? async (start, end) => (await Pedometer.getStepCountAsync(new Date(start), new Date(end))).steps : undefined,
});

// This module is imported from index.ts before App. Headless execution does not
// mount React, so the task definition and durable route owner must live globally.
if (!TaskManager.isTaskDefined(ACTIVITY_LOCATION_TASK)) {
  TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(ACTIVITY_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      // Expo's foreground LocationsStreamer also ignores CoreLocation code 0.
      // Background TaskConsumer forwards it, so classify that temporary failure.
      if (Platform.OS === 'ios' && String(error.code) === '0') {
        await activityTracker.reportSignalLoss();
        return;
      }
      await activityTracker.reportTaskError('GPS recording was interrupted. Your activity was paused; check location access and resume.');
      return;
    }
    if (data?.locations?.length) await activityTracker.acceptLocations(data.locations);
  });
}

let appStateAttached = false;
let uiClock: ReturnType<typeof setInterval> | null = null;
let durableCheckpoint: ReturnType<typeof setInterval> | null = null;
function setForegroundClock(active: boolean) {
  if (!active) {
    if (uiClock) clearInterval(uiClock);
    if (durableCheckpoint) clearInterval(durableCheckpoint);
    uiClock = null;
    durableCheckpoint = null;
    return;
  }
  if (!uiClock) uiClock = setInterval(() => activityTracker.tick(), 1000);
  if (!durableCheckpoint) durableCheckpoint = setInterval(() => {
    void activityTracker.checkpoint().catch(() => {
      void activityTracker.reportTaskError('Recording paused because the activity could not be saved. Please retry.');
    });
  }, 15000);
}
/** Attach the UI lifecycle once. Unmounting a tracker screen never ends a real activity. */
export function initializeActivityTracking(): Promise<void> {
  if (!appStateAttached) {
    appStateAttached = true;
    setForegroundClock(!AppState.currentState || AppState.currentState === 'active');
    AppState.addEventListener('change', (next) => {
      setForegroundClock(next === 'active');
      void activityTracker.handleAppState(next);
    });
  }
  return activityTracker.hydrate();
}

/** Reset/restore must await this before touching local data or swapping stores. */
export const stopActiveActivityForDataChange = (): Promise<void> => activityTracker.discard();
export const discardActiveActivity = stopActiveActivityForDataChange;
