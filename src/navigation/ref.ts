import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

/** For surfaces that live outside the navigator (the session overlay, toasts). */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
