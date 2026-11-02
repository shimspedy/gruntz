const { withInfoPlist } = require('expo/config-plugins');

module.exports = function withMetaInstallTracking(config) {
  // CoreKit's own bundled manifest declares tracking too. Preserve it; the app
  // must not claim that it never tracks simply because permission is optional.
  const privacy = config.ios?.privacyManifests || {};
  config.ios = {
    ...config.ios,
    privacyManifests: {
      ...privacy,
      NSPrivacyTracking: true,
      NSPrivacyTrackingDomains: [...new Set([...(privacy.NSPrivacyTrackingDomains || []), 'ep1.facebook.com', 'graph.facebook.com'])],
    },
  };
  return withInfoPlist(config, (config) => {
    const info = config.modResults;
    const clientToken = (process.env.GRUNTZ_META_CLIENT_TOKEN || '').trim();
    info.FacebookAppID = '1742670326812925';
    info.FacebookDisplayName = 'Gruntz';
    info.FacebookAutoInitEnabled = false;
    info.FacebookAutoLogAppEventsEnabled = false;
    info.FacebookAdvertiserIDCollectionEnabled = false;
    info.FBSDKAutoLogMetaDataEnabled = false;
    info.FBSDKAutoLogProductImprovementEnabled = false;
    info.FBSDKAemAutoSetupEnabled = false;
    info.GruntzMetaInstallTrackingEnabled = Boolean(clientToken);
    info.NSUserTrackingUsageDescription = 'Allow Gruntz to share app installs, app openings and basic device information with Meta to measure and improve our ads. Your workouts, health data and GPS routes are not shared.';
    if (clientToken) info.FacebookClientToken = clientToken;
    else {
      delete info.FacebookClientToken;
      if (['production', 'release-simulator'].includes(process.env.EAS_BUILD_PROFILE)) {
        throw new Error('GRUNTZ_META_CLIENT_TOKEN must be configured for this production build. No Meta client token was supplied.');
      }
      console.warn('[Gruntz] GRUNTZ_META_CLIENT_TOKEN is missing. Meta install measurement and its permission prompt are disabled in this build.');
    }
    return config;
  });
};
