/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
// Gruntz on the wrist. Runs, rucks, hikes and indoor walks record with live heart rate
// straight into Apple Health and need no phone; the phone app imports them through the
// Apple Health sync. Workouts are started and logged set by set against the phone app
// over WatchConnectivity (see PhoneLink.swift and src/services/watchLink.ts).
module.exports = (config) => ({
  type: 'watch',
  // The target's product name must differ from the phone app's; the display name
  // users see on the watch is CFBundleDisplayName in Info.plist ("Gruntz").
  name: 'GruntzWatch',
  displayName: 'Gruntz',
  bundleIdentifier: `${config.ios.bundleIdentifier}.watchkitapp`,
  icon: '../../assets/icon.png',
  colors: { $accent: '#2D8CFF' },
  deploymentTarget: '10.0',
  frameworks: ['SwiftUI', 'HealthKit', 'WatchConnectivity'],
  entitlements: {
    'com.apple.developer.healthkit': true,
    'com.apple.developer.healthkit.access': [],
  },
});
