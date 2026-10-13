const { withAndroidManifest } = require("expo/config-plugins");

/**
 * The image picker asks for the CAMERA permission, and Android reads that as "needs a
 * camera" unless told otherwise, which drops every Chromebook and car from the Play
 * listing. A profile photo can come from the library, so the camera is optional.
 */
module.exports = function withOptionalCamera(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = manifest["uses-feature"] ?? [];
    for (const name of ["android.hardware.camera", "android.hardware.camera.any", "android.hardware.camera.autofocus"]) {
      const existing = features.find((f) => f.$?.["android:name"] === name);
      if (existing) existing.$["android:required"] = "false";
      else features.push({ $: { "android:name": name, "android:required": "false" } });
    }
    manifest["uses-feature"] = features;
    return config;
  });
};
