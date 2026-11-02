const { withXcodeProject } = require('expo/config-plugins');

const BUNDLE_PHASE = 'Bundle React Native code and images';
const GUARD_PHASE = '[Gruntz] Verify release JavaScript bundle';
const GUARD_SCRIPT = `set -eu
case "\${CONFIGURATION:-}" in
  *Debug*) exit 0 ;;
esac

# Check the actual app resources, after the bundling phase has completed.
# A successful upload wrapper must never produce a release that cannot launch.
GRUNTZ_RELEASE_BUNDLE="\${TARGET_BUILD_DIR}/\${UNLOCALIZED_RESOURCES_FOLDER_PATH}/main.jsbundle"
if [ ! -s "$GRUNTZ_RELEASE_BUNDLE" ]; then
  echo "error: Release app is missing a nonempty main.jsbundle. JavaScript bundling must succeed before archiving." >&2
  exit 1
fi
`;

module.exports = function withReleaseBundleGuard(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const application = project.getTarget('com.apple.product-type.application');
    if (!application) throw new Error('withReleaseBundleGuard: application target not found');

    const phases = application.target.buildPhases;
    if (!phases.some((phase) => phase.comment === BUNDLE_PHASE)) {
      throw new Error('withReleaseBundleGuard: React Native bundle phase not found');
    }

    let guard = phases.find((phase) => phase.comment === GUARD_PHASE);
    if (!guard) {
      const added = project.addBuildPhase([], 'PBXShellScriptBuildPhase', GUARD_PHASE, application.uuid, {
        shellPath: '/bin/sh',
        shellScript: GUARD_SCRIPT,
        alwaysOutOfDate: true,
      });
      guard = phases.find((phase) => phase.value === added.uuid);
    }

    // Use the same escaped representation as Expo/Sentry's generated phases.
    const definition = project.hash.project.objects.PBXShellScriptBuildPhase[guard.value];
    definition.shellScript = JSON.stringify(GUARD_SCRIPT);
    definition.alwaysOutOfDate = 1;

    // Keep it immediately after bundling, including on repeated prebuilds.
    phases.splice(phases.indexOf(guard), 1);
    phases.splice(phases.findIndex((phase) => phase.comment === BUNDLE_PHASE) + 1, 0, guard);
    return config;
  });
};
