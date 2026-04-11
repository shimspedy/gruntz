/**
 * Apple HealthKit Integration Service
 *
 * This is a foundation service with mock implementation.
 * Real HealthKit integration requires native modules (expo-health or react-native-health).
 *
 * For production, you would:
 * 1. Install expo-health or react-native-health
 * 2. Configure Info.plist with HealthKit permissions
 * 3. Implement actual HealthKit API calls in place of mocks
 * 4. Handle authorization flow with user permissions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WorkoutData {
  type: 'running' | 'strength' | 'swimming' | 'rucking' | 'functional';
  startDate: Date;
  endDate: Date;
  calories: number;
  distance?: number; // meters
  heartRateAvg?: number;
}

export interface HealthKitService {
  isAvailable: () => Promise<boolean>;
  requestAuthorization: () => Promise<boolean>;
  syncWorkout: (workout: WorkoutData) => Promise<boolean>;
  getTodaySteps: () => Promise<number>;
  getTodayActiveCalories: () => Promise<number>;
}

// Mock storage key for local health data
const HEALTH_DATA_KEY = '@gruntz_health_data';
const HEALTH_AUTH_KEY = '@gruntz_health_authorized';

interface MockHealthData {
  steps: number;
  activeCalories: number;
  workouts: WorkoutData[];
  lastUpdated: string;
}

/**
 * Creates a mock HealthKit service for development/fallback
 *
 * This implementation:
 * - Stores data in AsyncStorage
 * - Logs all intentions for debugging
 * - Can be replaced with real HealthKit calls
 * - Maintains consistent interface for UI
 */
export function createHealthKitService(): HealthKitService {
  return {
    /**
     * Check if HealthKit is available on this device
     * Mock: Always returns true (iOS)
     * Real: Would check native availability
     */
    isAvailable: async () => {
      try {
        // Real: Check if device is iOS and HealthKit is available
        // return HealthKit.isAvailable();

        // Mock implementation
        console.log('[HealthKit] Checking availability');
        return true;
      } catch (error) {
        console.error('[HealthKit] Availability check failed:', error);
        return false;
      }
    },

    /**
     * Request user authorization to access HealthKit data
     * Mock: Returns stored authorization state
     * Real: Would show native permission dialog
     */
    requestAuthorization: async () => {
      try {
        // Real: Request permissions with native dialog
        // await HealthKit.requestAuthorization({
        //   permissions: {
        //     read: [
        //       HealthKit.Constants.Permissions.HKQuantityTypeIdentifierStepCount,
        //       HealthKit.Constants.Permissions.HKQuantityTypeIdentifierActiveEnergyBurned,
        //       HealthKit.Constants.Permissions.HKWorkoutTypeIdentifier,
        //     ],
        //     write: [
        //       HealthKit.Constants.Permissions.HKWorkoutTypeIdentifier,
        //     ],
        //   },
        // });

        // Mock implementation
        console.log('[HealthKit] Requesting user authorization');
        const authorized = true; // In real app, this would come from user response

        if (authorized) {
          await AsyncStorage.setItem(HEALTH_AUTH_KEY, 'true');
        }

        return authorized;
      } catch (error) {
        console.error('[HealthKit] Authorization request failed:', error);
        return false;
      }
    },

    /**
     * Sync a completed workout to HealthKit
     * Mock: Stores locally
     * Real: Writes to HealthKit
     */
    syncWorkout: async (workout: WorkoutData) => {
      try {
        // Check authorization first
        const isAuthorized = await AsyncStorage.getItem(HEALTH_AUTH_KEY);
        if (!isAuthorized) {
          console.warn('[HealthKit] Not authorized. Call requestAuthorization first.');
          return false;
        }

        // Real: Write workout to HealthKit
        // await HealthKit.saveWorkout({
        //   startDate: workout.startDate,
        //   endDate: workout.endDate,
        //   activityType: mapWorkoutTypeToHealthKit(workout.type),
        //   calories: workout.calories,
        //   distance: workout.distance,
        // });

        // Mock implementation - store locally
        const data = await AsyncStorage.getItem(HEALTH_DATA_KEY);
        const healthData: MockHealthData = data ? JSON.parse(data) : {
          steps: 0,
          activeCalories: 0,
          workouts: [],
          lastUpdated: new Date().toISOString(),
        };

        healthData.workouts.push(workout);
        healthData.activeCalories += workout.calories;
        healthData.lastUpdated = new Date().toISOString();

        await AsyncStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(healthData));

        console.log('[HealthKit] Workout synced:', {
          type: workout.type,
          calories: workout.calories,
          distance: workout.distance,
        });

        return true;
      } catch (error) {
        console.error('[HealthKit] Workout sync failed:', error);
        return false;
      }
    },

    /**
     * Get today's step count
     * Mock: Returns stored value or 0
     * Real: Queries HealthKit for today's steps
     */
    getTodaySteps: async () => {
      try {
        // Real: Query HealthKit
        // const today = new Date();
        // today.setHours(0, 0, 0, 0);
        // const steps = await HealthKit.getStepCount({
        //   startDate: today,
        //   endDate: new Date(),
        // });
        // return steps || 0;

        // Mock implementation
        const data = await AsyncStorage.getItem(HEALTH_DATA_KEY);
        if (data) {
          const healthData: MockHealthData = JSON.parse(data);
          return healthData.steps;
        }
        return 0;
      } catch (error) {
        console.error('[HealthKit] Failed to get step count:', error);
        return 0;
      }
    },

    /**
     * Get today's active calories burned
     * Mock: Returns stored value or 0
     * Real: Queries HealthKit for today's active calories
     */
    getTodayActiveCalories: async () => {
      try {
        // Real: Query HealthKit
        // const today = new Date();
        // today.setHours(0, 0, 0, 0);
        // const calories = await HealthKit.getActiveEnergyBurned({
        //   startDate: today,
        //   endDate: new Date(),
        // });
        // return calories || 0;

        // Mock implementation
        const data = await AsyncStorage.getItem(HEALTH_DATA_KEY);
        if (data) {
          const healthData: MockHealthData = JSON.parse(data);
          return healthData.activeCalories;
        }
        return 0;
      } catch (error) {
        console.error('[HealthKit] Failed to get active calories:', error);
        return 0;
      }
    },
  };
}

/**
 * Singleton instance
 */
let instance: HealthKitService | null = null;

export function getHealthKitService(): HealthKitService {
  if (!instance) {
    instance = createHealthKitService();
  }
  return instance;
}

// Reference for HealthKit workout type mapping
// Real implementation would map to HKWorkoutActivityType:
// 'running' -> HKWorkoutActivityTypeRunning
// 'strength' -> HKWorkoutActivityTypeTraditionalStrengthTraining
// 'swimming' -> HKWorkoutActivityTypeSwimming
// 'rucking' -> HKWorkoutActivityTypeHiking or Custom
// 'functional' -> HKWorkoutActivityTypeMixedCardio or Custom
