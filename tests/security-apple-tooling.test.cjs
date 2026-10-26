const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');

// Allows validating the candidate dependency tree without touching the running app's install.
const dependencyRequire = createRequire(path.join(
  process.env.GRUNTZ_SECURITY_DEPS_ROOT || path.join(__dirname, '..'),
  'package.json',
));
const xcodeRequire = createRequire(dependencyRequire.resolve('@bacons/xcode'));
const plistRequire = createRequire(xcodeRequire.resolve('@expo/plist'));
const plist = xcodeRequire('@expo/plist').default;

test('Apple tooling round-trips the Watch plist and HealthKit entitlements', () => {
  const source = fs.readFileSync(path.join(__dirname, '../targets/watch/Info.plist'), 'utf8');
  const watchInfo = plist.parse(source);
  assert.equal(watchInfo.CFBundleDisplayName, 'Gruntz');
  assert.deepEqual(plist.parse(plist.build(watchInfo)), watchInfo);

  const entitlements = {
    'com.apple.developer.healthkit': true,
    'com.apple.developer.healthkit.access': [],
    'com.apple.security.application-groups': ['group.com.gruntz.fitness'],
    fixture: '<key>injected</key>&]]>🚀',
  };
  assert.deepEqual({ ...plist.parse(plist.build(entitlements)) }, entitlements);
});

test('Xcode plist consumers preserve settings, scheme management and workspace checks', () => {
  const settings = dependencyRequire('@bacons/xcode/settings');
  const scheme = dependencyRequire('@bacons/xcode/scheme');
  const workspace = dependencyRequire('@bacons/xcode/workspace');
  const input = {
    BuildSystemType: 'Latest',
    DerivedDataCustomLocation: 'Gruntz & Watch/DerivedData',
    PreviewsEnabled: true,
    IDEWorkspaceSharedSettings_AutocreateContextsIfNeeded: false,
  };
  assert.deepEqual(settings.parse(settings.build(input)), input);
  const management = {
    SchemeUserState: { 'GruntzWatch.xcscheme_^#shared#^_': { orderHint: 1, isShown: true } },
    SuppressBuildableAutocreation: { '000000000000000000000003': { primary: true } },
  };
  assert.deepEqual(scheme.parseManagement(scheme.buildManagement(management)), management);
  const checks = { IDESuppressExperimentalFeatureWarnings: true, IDESuppressDeprecatedBuildSystemWarning: false };
  assert.deepEqual(workspace.parseChecks(workspace.buildChecks(checks)), checks);
});

test('Xcode Watch project edits and XML property reads survive serialization', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gruntz-apple-security-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const projectFile = path.join(root, 'ios/Gruntz.xcodeproj/project.pbxproj');
  fs.mkdirSync(path.dirname(projectFile), { recursive: true });
  fs.mkdirSync(path.join(root, 'targets/watch'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '../targets/watch/Info.plist'), path.join(root, 'targets/watch/Info.plist'));
  const entitlementFile = path.join(root, 'ios/watch.entitlements');
  fs.writeFileSync(entitlementFile, plist.build({ 'com.apple.developer.healthkit': true }));
  const id = n => String(n).padStart(24, '0');
  const buildSettings = {
    SDKROOT: 'watchos', WATCHOS_DEPLOYMENT_TARGET: '10.0',
    PRODUCT_BUNDLE_IDENTIFIER: 'com.gruntz.fitness.watchkitapp',
    INFOPLIST_FILE: '../targets/watch/Info.plist', CODE_SIGN_ENTITLEMENTS: 'watch.entitlements',
  };
  const json = dependencyRequire('@bacons/xcode/json');
  const fixture = {
    archiveVersion: 1, objectVersion: 56, classes: {}, rootObject: id(1),
    objects: {
      [id(1)]: { isa: 'PBXProject', mainGroup: id(2), targets: [id(3)], attributes: {} },
      [id(2)]: { isa: 'PBXGroup', children: [], sourceTree: '<group>' },
      [id(3)]: {
        isa: 'PBXNativeTarget', name: 'GruntzWatch', productName: 'GruntzWatch',
        productType: 'com.apple.product-type.application.watchapp2',
        buildConfigurationList: id(4), buildPhases: [], buildRules: [], dependencies: [],
      },
      [id(4)]: { isa: 'XCConfigurationList', buildConfigurations: [id(5), id(6)], defaultConfigurationName: 'Release', defaultConfigurationIsVisible: 0 },
      [id(5)]: { isa: 'XCBuildConfiguration', name: 'Debug', buildSettings: { ...buildSettings } },
      [id(6)]: { isa: 'XCBuildConfiguration', name: 'Release', buildSettings: { ...buildSettings } },
    },
  };
  fs.writeFileSync(projectFile, json.build(fixture));
  const { XcodeProject } = dependencyRequire('@bacons/xcode');
  const project = XcodeProject.open(projectFile);
  const target = project.rootObject.props.targets[0];
  assert.equal(target.isWatchOSTarget(), true);
  assert.equal(target.getDefaultConfiguration().getInfoPlist().CFBundleDisplayName, 'Gruntz');
  assert.equal(target.getDefaultConfiguration().getEntitlements()['com.apple.developer.healthkit'], true);
  target.setBuildSetting('SWIFT_VERSION', '5.0');
  project.rootObject.ensureMainGroupChild('Security & Watch');
  fs.writeFileSync(projectFile, json.build(project.toJSON()));
  const reopened = XcodeProject.open(projectFile);
  const watch = reopened.rootObject.props.targets[0];
  assert.equal(watch.getDefaultBuildSetting('SWIFT_VERSION'), '5.0');
  assert.equal(watch.getDefaultBuildSetting('PRODUCT_BUNDLE_IDENTIFIER'), 'com.gruntz.fitness.watchkitapp');
  assert.equal(reopened.rootObject.props.mainGroup.getChildGroups()[0].getDisplayName(), 'Security & Watch');
});

test('XML CDATA serialization cannot create an injected element', () => {
  const { DOMImplementation, DOMParser, XMLSerializer } = plistRequire('@xmldom/xmldom');
  const doc = new DOMImplementation().createDocument(null, 'root', null);
  const payload = 'before]]><injected/>after';
  const cdata = doc.createCDATASection('safe');
  cdata.data = payload;
  doc.documentElement.appendChild(cdata);
  const serialized = new XMLSerializer().serializeToString(doc);
  const reparsed = new DOMParser().parseFromString(serialized, 'application/xml');
  assert.equal(reparsed.getElementsByTagName('injected').length, 0);
  assert.equal(reparsed.documentElement.textContent, payload);
});

test('scoped UUID upgrade preserves CommonJS API and rejects truncated output buffers', () => {
  const { v4, v5, validate } = xcodeRequire('uuid');
  assert.equal(validate(v4()), true);
  assert.equal(v5('GruntzWatch', v5.URL), 'c6a460cb-b312-57bb-ae67-8cbbe5259f18');
  assert.throws(() => v5('GruntzWatch', v5.URL, new Uint8Array(8), 4), RangeError);
});
