#!/usr/bin/env node
'use strict';

// Rebuild the identified local fork from pinned public sources; never patches node_modules.
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const destination = path.join(root, 'vendor/deepmerge');
const tarball = 'https://registry.npmjs.org/deepmerge/-/deepmerge-4.3.1.tgz';
const integrity = 'sha512-3sUqbMEc77XqpdNO7FRyRog+eW3ph+GYCbj+rK+uYyRMuwsVy0rMiVtPn+QJlKFvWP/1PYpapqYn0Me2knFn+A==';
const commit = 'c5ad573121574db1c625b0aabcc6114ed7df6c5a';
const baseIndexHash = '12440c84957c1990ea2d5e33dc0091722dc1dc1585c6d20e0c780e568ffa9d30';
const patchedIndexHash = 'dbef7cab6abdd1338228a08297f0047b3f56c9d7533b38358629b6024c78dbc7';
const baseCjsHash = '2e5160f84a1141bd927264afe4d15766f1e6cf07daef182b37ff53fea121de7d';
const patchedCjsHash = '8983763adcccc772c023cb97bbf8830de52f7eeaa3c997b867345e1e62dd9d3b';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** The same three edits as upstream PR274, also applied to its self-contained CJS build. */
function patchDeepmerge(source) {
  const edits = [
    ['// Protects from prototype poisoning and unexpected merging up the prototype chain.',
      "function propertyIsForbidden(key) {\n\treturn key === '__proto__'\n}\n\n// Protects from prototype poisoning and unexpected merging up the prototype chain."],
    ['\t\tgetKeys(target).forEach(function(key) {\n',
      '\t\tgetKeys(target).forEach(function(key) {\n\t\t\tif (propertyIsForbidden(key)) {\n\t\t\t\treturn\n\t\t\t}\n'],
    ['if (propertyIsUnsafe(target, key)) {', 'if (propertyIsForbidden(key) || propertyIsUnsafe(target, key)) {'],
  ];
  for (const [before, after] of edits) {
    if (source.split(before).length !== 2) throw new Error('Deepmerge source changed; review the security patch.');
    source = source.replace(before, after);
  }
  return source;
}

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gruntz-deepmerge-rebuild-'));
  try {
    const [archive, patchedIndex] = await Promise.all([
      download(tarball),
      download(`https://raw.githubusercontent.com/cristianfloresRC/deepmerge/${commit}/index.js`),
    ]);
    if (`sha512-${createHash('sha512').update(archive).digest('base64')}` !== integrity) throw new Error('Upstream package integrity mismatch');
    if (sha256(patchedIndex) !== patchedIndexHash) throw new Error('Upstream patch source hash mismatch');
    const archivePath = path.join(temporary, 'package.tgz');
    fs.writeFileSync(archivePath, archive);
    execFileSync('tar', ['-xzf', archivePath, '-C', temporary]);
    const source = path.join(temporary, 'package');
    const baseIndex = fs.readFileSync(path.join(source, 'index.js'));
    const baseCjs = fs.readFileSync(path.join(source, 'dist/cjs.js'));
    if (sha256(baseIndex) !== baseIndexHash || sha256(baseCjs) !== baseCjsHash) throw new Error('Base source hash mismatch');
    if (patchDeepmerge(baseIndex.toString()) !== patchedIndex.toString()) throw new Error('Local edits differ from pinned upstream patch');
    const patchedCjs = Buffer.from(patchDeepmerge(baseCjs.toString()));
    if (sha256(patchedCjs) !== patchedCjsHash) throw new Error('Patched CJS source hash mismatch');

    const files = ['dist/cjs.js', 'index.d.ts', 'license.txt', 'readme.md', 'changelog.md'].sort();
    const upstreamFiles = {};
    fs.mkdirSync(destination, { recursive: true });
    fs.rmSync(path.join(destination, 'dist'), { recursive: true, force: true });
    for (const file of files) {
      const original = fs.readFileSync(path.join(source, file));
      upstreamFiles[file] = sha256(original);
      fs.mkdirSync(path.dirname(path.join(destination, file)), { recursive: true });
      fs.writeFileSync(path.join(destination, file), file === 'dist/cjs.js' ? patchedCjs : original);
    }
    fs.writeFileSync(path.join(destination, 'package.json'), `${JSON.stringify({
      name: '@gruntz/deepmerge', version: '4.3.1-gruntz.1', private: true,
      description: 'Local deepmerge 4.3.1 prototype-poisoning security backport; not an upstream release',
      main: 'dist/cjs.js', types: 'index.d.ts', license: 'MIT', engines: { node: '>=0.10.0' },
      files: [...files, 'SECURITY-BACKPORT.md', 'provenance.json'],
    }, null, 2)}\n`);
    fs.writeFileSync(path.join(destination, 'provenance.json'), `${JSON.stringify({
      upstreamPackage: 'deepmerge', upstreamVersion: '4.3.1', upstreamTarball: tarball, upstreamIntegrity: integrity,
      advisory: 'https://github.com/advisories/GHSA-gcqx-w48m-w2h4',
      patchReview: 'https://github.com/TehShrike/deepmerge/pull/274', patchCommit: commit,
      baseIndexSha256: baseIndexHash, patchedIndexSha256: patchedIndexHash,
      baseCjsSha256: baseCjsHash, patchedCjsSha256: patchedCjsHash, upstreamFiles,
    }, null, 2)}\n`);
    process.stdout.write(`Rebuilt ${files.length} verified runtime/notice files; prototype-key security backport.\n`);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

module.exports = { patchDeepmerge };
if (require.main === module) main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
