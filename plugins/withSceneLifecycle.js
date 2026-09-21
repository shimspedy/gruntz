const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

/**
 * iOS 27 asserts at launch unless the app adopts the UIScene life cycle. Expo ships
 * `ExpoAppSceneDelegate` for this, but the SDK 57 template doesn't opt in yet, so:
 *  - declare a single window scene in Info.plist,
 *  - make AppDelegate an `ExpoReactNativeFactoryProvider` and stop it creating the window,
 *  - add a `SceneDelegate` that inherits Expo's (it creates the window and starts React Native).
 */
const MARKER = "GRUNTZ_SCENE_LIFECYCLE";

function patchAppDelegate(src) {
  if (src.includes(MARKER)) return src;

  let out = src.replace(
    "class AppDelegate: ExpoAppDelegate {",
    "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {"
  );

  // The scene delegate owns the window now; the app delegate only builds the factory.
  out = out.replace(
    /#if os\(iOS\) \|\| os\(tvOS\)\n\s+window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s+factory\.startReactNative\([\s\S]*?\)\n#endif\n/,
    `    // ${MARKER}: window creation moved to SceneDelegate (ExpoAppSceneDelegate).\n`
  );

  if (out.includes("UIWindow(frame: UIScreen.main.bounds)")) {
    throw new Error("withSceneLifecycle: could not find the window bootstrap in AppDelegate.swift");
  }

  out += `
// ${MARKER}
class SceneDelegate: ExpoAppSceneDelegate {}
`;
  return out;
}

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          },
        ],
      },
    };
    return config;
  });

  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      throw new Error("withSceneLifecycle expects a Swift AppDelegate");
    }
    config.modResults.contents = patchAppDelegate(config.modResults.contents);
    return config;
  });
};
