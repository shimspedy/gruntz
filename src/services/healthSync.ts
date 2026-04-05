import { Platform } from 'react-native';

/**
 * Health Sync Service
 *
 * Provides a unified interface for syncing workout data to platform health stores:
 * - iOS: Apple HealthKit
 * - Android: Health Connect
 *
 * NOTE: Both HealthKit and Health Connect require native modules that are NOT
 * available in Expo Go. This service gracefully degrades — all calls are no-ops
 * when running in Expo Go. When building with EAS (development/production build),
 * install the native packages and flip `HEALTH_SYNC_AVAILABLE` to true.
 *
 * Packages needed for EAS build:
 *   iOS:     expo-apple-health-kit or react-native-health
 *   Android: react-native-health-connect
 */

const HEALTH_SYNC_AVAILABLE = false; // Flip to true after adding native health packages

export interface WorkoutSyncData {
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  caloriesBurned?: number;
  workoutType: 'functional_strength' | 'running' | 'swimming' | 'rucking' | 'flexibility';
  title: string;
}

export interface HealthPermissionStatus {
  granted: boolean;
  canRequest: boolean;
}

/** Check if health sync is available on this device/build */
export function isHealthSyncAvailable(): boolean {
  return HEALTH_SYNC_AVAILABLE;
}

/** Request permissions to read/write health data */
export async function requestHealthPermissions(): Promise<HealthPermissionStatus> {
  if (!HEALTH_SYNC_AVAILABLE) {
    return { granted: false, canRequest: false };
  }

  // Placeholder for native implementation
  // iOS: HKHealthStore.requestAuthorization(toShare: [.workoutType], read: [.stepCount, ...])
  // Android: HealthConnectClient.permissionController.requestPermissions(...)
  if (Platform.OS === 'ios') {
    return requestIOSHealthPermissions();
  } else if (Platform.OS === 'android') {
    return requestAndroidHealthPermissions();
  }

  return { granted: false, canRequest: false };
}

/** Sync a completed workout to the health store */
export async function syncWorkout(data: WorkoutSyncData): Promise<boolean> {
  if (!HEALTH_SYNC_AVAILABLE) return false;

  if (Platform.OS === 'ios') {
    return syncWorkoutIOS(data);
  } else if (Platform.OS === 'android') {
    return syncWorkoutAndroid(data);
  }

  return false;
}

/** Get today's step count from health store */
export async function getTodaySteps(): Promise<number | null> {
  if (!HEALTH_SYNC_AVAILABLE) return null;

  if (Platform.OS === 'ios') {
    return getStepsIOS();
  } else if (Platform.OS === 'android') {
    return getStepsAndroid();
  }

  return null;
}

// ── iOS (HealthKit) stubs ──────────────────────────────────────────

async function requestIOSHealthPermissions(): Promise<HealthPermissionStatus> {
  // TODO: Implement with expo-apple-health-kit or react-native-health
  // import AppleHealthKit from 'react-native-health';
  // const permissions = { permissions: { read: [...], write: [...] } };
  // return new Promise((resolve) => {
  //   AppleHealthKit.initHealthKit(permissions, (err) => {
  //     resolve({ granted: !err, canRequest: true });
  //   });
  // });
  return { granted: false, canRequest: true };
}

async function syncWorkoutIOS(_data: WorkoutSyncData): Promise<boolean> {
  // TODO: HKWorkout save via HealthKit bridge
  return false;
}

async function getStepsIOS(): Promise<number | null> {
  // TODO: HKQuantityType.stepCount query
  return null;
}

// ── Android (Health Connect) stubs ─────────────────────────────────

async function requestAndroidHealthPermissions(): Promise<HealthPermissionStatus> {
  // TODO: Implement with react-native-health-connect
  // import { initialize, requestPermission } from 'react-native-health-connect';
  // await initialize();
  // const granted = await requestPermission([{ accessType: 'write', recordType: 'ExerciseSession' }]);
  // return { granted: granted.length > 0, canRequest: true };
  return { granted: false, canRequest: true };
}

async function syncWorkoutAndroid(_data: WorkoutSyncData): Promise<boolean> {
  // TODO: insertRecords([{ recordType: 'ExerciseSession', ... }])
  return false;
}

async function getStepsAndroid(): Promise<number | null> {
  // TODO: readRecords({ recordType: 'Steps', ... })
  return null;
}
