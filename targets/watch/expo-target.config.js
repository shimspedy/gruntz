/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
// Gruntz on the wrist: records a run, ruck or hike with live heart rate straight into
// Apple Health. The phone app imports it through the Apple Health sync, so the watch
// needs no connection to the phone to be useful.
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
  frameworks: ['SwiftUI', 'HealthKit'],
  entitlements: {
    'com.apple.developer.healthkit': true,
    'com.apple.developer.healthkit.access': [],
  },
});
