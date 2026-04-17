const { withPodfile } = require("@expo/config-plugins");

const PATCH_MARKER = "GRUNTZ_REACT_CORE_PREBUILT_EMBED_FIX";

const rubyPatch = `
    # ${PATCH_MARKER}: React Native 0.81 prebuilt core links React.framework,
    # but CocoaPods can omit it from the app embed phase in generated debug builds.
    react_core_line = '  install_framework "\${PODS_XCFRAMEWORKS_BUILD_DIR}/React-Core-prebuilt/React.framework"'
    rn_deps_line = '  install_framework "\${PODS_XCFRAMEWORKS_BUILD_DIR}/ReactNativeDependencies/ReactNativeDependencies.framework"'
    frameworks_script = File.join(__dir__, 'Pods/Target Support Files/Pods-Gruntz/Pods-Gruntz-frameworks.sh')

    if File.exist?(frameworks_script)
      frameworks_script_contents = File.read(frameworks_script)
      unless frameworks_script_contents.include?(react_core_line)
        frameworks_script_contents = frameworks_script_contents.gsub(rn_deps_line, "#{react_core_line}\\n#{rn_deps_line}")
        File.write(frameworks_script, frameworks_script_contents)
      end
    end

    project = Xcodeproj::Project.open(File.join(__dir__, 'Gruntz.xcodeproj'))
    app_target = project.targets.find { |target| target.name == 'Gruntz' }
    embed_phase = app_target&.shell_script_build_phases&.find { |phase| phase.name == '[CP] Embed Pods Frameworks' }

    if embed_phase
      react_core_input = '\${PODS_XCFRAMEWORKS_BUILD_DIR}/React-Core-prebuilt/React.framework/React'
      react_core_output = '\${TARGET_BUILD_DIR}/\${FRAMEWORKS_FOLDER_PATH}/React.framework'

      embed_phase.input_paths.insert(1, react_core_input) unless embed_phase.input_paths.include?(react_core_input)
      embed_phase.output_paths.insert(0, react_core_output) unless embed_phase.output_paths.include?(react_core_output)
      project.save
    end
`;

function addReactCorePrebuiltEmbedFix(contents) {
  if (contents.includes(PATCH_MARKER)) {
    return contents;
  }

  const postInstallPattern =
    /(\s+react_native_post_install\([\s\S]*?\n\s+\)\n)(\s+end\nend\s*)$/;

  if (!postInstallPattern.test(contents)) {
    throw new Error(
      "Unable to patch ios/Podfile: react_native_post_install block was not found."
    );
  }

  return contents.replace(postInstallPattern, `$1${rubyPatch}$2`);
}

module.exports = function withReactCorePrebuiltEmbedFix(config) {
  return withPodfile(config, (config) => {
    config.modResults.contents = addReactCorePrebuiltEmbedFix(
      config.modResults.contents
    );
    return config;
  });
};
