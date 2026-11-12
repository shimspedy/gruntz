import { createAndroidFileStorage } from './androidFileStorage';

export const EXERCISE_LOG_STORAGE_KEY = '@gruntz_exercise_log';

/**
 * Every logged set, so the store that grows fastest. Its caps allow far more than an
 * Android AsyncStorage row can hold: a few years of training, or one long import, and
 * the log could no longer be read at launch.
 */
export const exerciseLogStorage = createAndroidFileStorage(EXERCISE_LOG_STORAGE_KEY, 'gruntz-exercise-log', 'workout history');
