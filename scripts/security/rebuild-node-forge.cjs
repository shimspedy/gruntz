#!/usr/bin/env node
'use strict';

// Rebuild the explicitly identified local fork; never patches node_modules.
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const destination = path.join(root, 'vendor/node-forge');
const tarball = 'https://registry.npmjs.org/node-forge/-/node-forge-1.4.0.tgz';
const integrity = 'sha512-LarFH0+6VfriEhqMMcLX2F7SwSXeWwnEAJEsYm5QKWchiVYVvJyV9v7UDvUv+w5HO23ZpQTXDv/GxdDdMyOuoQ==';
const commit = 'db05494352dd3c9a5a07c5270333dcc78866cad2';
const patchedHash = 'c7b72e7ef41f4fc0e5228dce3e37851e9ca064c789365d5e392c25d1c5f6e710';
const baseHash = 'fd4740238145ec26470eb3f06a627c72039538ce1307dbdce40521f94dfd0a50';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gruntz-forge-rebuild-'));
  try {
    const [archive, rsa] = await Promise.all([
      download(tarball),
      download(`https://raw.githubusercontent.com/matthewscottconroy/forge/${commit}/lib/rsa.js`),
    ]);
    if (`sha512-${createHash('sha512').update(archive).digest('base64')}` !== integrity) {
      throw new Error('Upstream package integrity does not match pinned source');
    }
    if (sha256(rsa) !== patchedHash) throw new Error('Patched RSA source hash mismatch');
    const archivePath = path.join(temporary, 'package.tgz');
    fs.writeFileSync(archivePath, archive);
    execFileSync('tar', ['-xzf', archivePath, '-C', temporary]);
    const source = path.join(temporary, 'package');
    if (sha256(fs.readFileSync(path.join(source, 'lib/rsa.js'))) !== baseHash) {
      throw new Error('Base RSA source hash mismatch');
    }
    // Only public Node source and notices are carried, never vulnerable dist bundles.
    const files = ['LICENSE', 'README.md', ...fs.readdirSync(path.join(source, 'lib')).map(name => `lib/${name}`)].sort();
    const upstreamFiles = {};
    fs.mkdirSync(destination, { recursive: true });
    fs.rmSync(path.join(destination, 'lib'), { recursive: true, force: true });
    for (const name of files) {
      const bytes = fs.readFileSync(path.join(source, name));
      upstreamFiles[name] = sha256(bytes);
      fs.mkdirSync(path.dirname(path.join(destination, name)), { recursive: true });
      fs.writeFileSync(path.join(destination, name), name === 'lib/rsa.js' ? rsa : bytes);
    }
    const packageJson = {
      name: '@gruntz/node-forge', version: '1.4.0-gruntz.1', private: true,
      description: 'Local node-forge 1.4.0 security backport for CVE-2026-85393; not an upstream release',
      main: 'lib/index.js', license: '(BSD-3-Clause OR GPL-2.0)',
      engines: { node: '>=6.13.0' }, browser: { buffer: false, crypto: false, process: false },
      files: ['lib/*.js', 'LICENSE', 'README.md', 'SECURITY-BACKPORT.md', 'provenance.json'],
    };
    const provenance = {
      upstreamPackage: 'node-forge', upstreamVersion: '1.4.0', upstreamTarball: tarball,
      upstreamIntegrity: integrity,
      advisory: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
      patchReview: 'https://github.com/digitalbazaar/forge/pull/1159', patchCommit: commit,
      patchedRsaSha256: patchedHash, baseRsaSha256: baseHash, upstreamFiles,
    };
    fs.writeFileSync(path.join(destination, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
    fs.writeFileSync(path.join(destination, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
    process.stdout.write(`Rebuilt ${files.length} verified source/notice files; RSA-only security backport.\n`);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
