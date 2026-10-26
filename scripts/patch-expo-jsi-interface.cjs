const fs = require('node:fs');
const path = require('node:path');

// Expo 57's build already removes C++-only extensions from public interfaces.
// Swift 6.4 spells their module qualification with `::` rather than `.`, which
// the shipped sanitizer misses. Keep the same cleanup for either compiler form.
function patchExpoJsiInterfaceSource(source) {
  const before = "sed '/^extension __ObjC\\./";
  const after = "sed -E '/^extension __ObjC(\\.|::)/";
  return source.replace(before, after);
}

if (require.main === module) {
  const script = path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi', 'apple', 'scripts', 'build-xcframework.sh');
  if (fs.existsSync(script)) {
    const source = fs.readFileSync(script, 'utf8');
    const patched = patchExpoJsiInterfaceSource(source);
    if (patched !== source) {
      fs.writeFileSync(script, patched);
      console.log('Updated Expo JSI interface cleanup for Swift 6.4.');
    }
  }
}

module.exports = { patchExpoJsiInterfaceSource };
