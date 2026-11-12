import { createAndroidFileStorage } from './androidFileStorage';

export const READINESS_STORAGE_KEY = '@gruntz_readiness';

/** iOS keeps its existing file-backed AsyncStorage; Android bypasses SQLite for route history. */
export const readinessStorage = createAndroidFileStorage(READINESS_STORAGE_KEY, 'gruntz-activity-history', 'activity history');
