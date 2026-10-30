import { registerRootComponent } from 'expo';
// First import, so a crash while the rest of the app loads is still reported.
import './src/services/crashReporting';

import './src/services/activityTracking';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
