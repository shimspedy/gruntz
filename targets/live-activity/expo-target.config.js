/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
// The running workout on the Lock Screen and in the Dynamic Island: the exercise,
// the set, the rest countdown and workout time, with a Log set button that works
// without opening the app.
module.exports = (config) => ({
  type: 'widget',
  name: 'GruntzLiveWidget',
  displayName: 'Gruntz',
  bundleIdentifier: '.liveactivity',
  // Interactive Live Activities (buttons) need iOS 17.
  deploymentTarget: '17.0',
  colors: { $accent: '#2D8CFF' },
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit', 'AppIntents'],
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
