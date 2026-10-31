'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');

const cliRoot = path.dirname(require.resolve('@expo/cli/package.json'));
const cliRequire = createRequire(path.join(cliRoot, 'build/src/run/ios/codeSigning/Security.js'));
const certificatesRequire = createRequire(require.resolve('@expo/code-signing-certificates'));
const installedConsumers = [
  ['Expo CLI', cliRequire],
  ['Expo code-signing certificates', certificatesRequire],
].map(([name, consumerRequire]) => ({
  name,
  directory: path.dirname(consumerRequire.resolve('node-forge/package.json')),
}));
// By default every behavioral regression targets Expo's installed dependency.
// The override is only for demonstrating failures against an unpatched copy
// (for example node-forge 1.4.0).
const target = process.env.NODE_FORGE_SECURITY_TARGET
  ? path.resolve(process.env.NODE_FORGE_SECURITY_TARGET)
  : installedConsumers[0].directory;
const forge = require(target);
const message = Buffer.from('Gruntz Expo code signing security regression');
const digest = crypto.createHash('sha256').update(message).digest();
const oid = Buffer.from('0609608648016503040201', 'hex');
const nullParameters = Buffer.from('0500', 'hex');

// Build the bytes independently of forge's permissive ASN.1 parser. Force-long
// deliberately creates a nonminimal length when the content fits short form.
function tlv(tag, content, forceLong = false) {
  let length = content.length < 128 && !forceLong
    ? Buffer.from([content.length])
    : Buffer.from([0x81, content.length]);
  assert.ok(content.length < 256);
  return Buffer.concat([Buffer.from([tag]), length, content]);
}

function digestInfo(parameters = nullParameters, { extraInner, extraOuter, longOuter, longInner } = {}) {
  const algorithm = tlv(0x30, Buffer.concat([oid, parameters, extraInner || Buffer.alloc(0)]), longInner);
  return tlv(0x30, Buffer.concat([algorithm, tlv(0x04, digest), extraOuter || Buffer.alloc(0)]), longOuter);
}

function signatureForEncodedDigest(info, privateKey) {
  // Normal EMSA-PKCS1-v1_5 type-1 padding, with >=8 FF bytes. No testing flags
  // skip padding checks; a real RSA operation reaches the vulnerable verifier.
  const size = privateKey.asymmetricKeyDetails.modulusLength / 8;
  const padding = Buffer.alloc(size - info.length - 3, 0xff);
  assert.ok(padding.length >= 8);
  return crypto.privateEncrypt({ key: privateKey, padding: crypto.constants.RSA_NO_PADDING },
    Buffer.concat([Buffer.from([0, 1]), padding, Buffer.from([0]), info])).toString('binary');
}

// node-forge 1.4.1 is the first upstream release that requires canonical DER
// DigestInfo bytes (CVE-2026-85393 / GHSA-86w9-cpqp-85rv); 1.4.2 also fixes
// the PEM parsing ReDoS (GHSA-7wch-p9px-956x).
const minimumFixedVersion = [1, 4, 2];

function atLeast(version, minimum) {
  const parts = version.split(/[.-]/, 3).map(Number);
  for (let i = 0; i < minimum.length; i += 1) {
    if (parts[i] !== minimum[i]) return parts[i] > minimum[i];
  }
  return true;
}

test('both installed Expo consumers resolve an upstream node-forge release with the security fixes', () => {
  for (const { name, directory } of installedConsumers) {
    const installedPackage = require(path.join(directory, 'package.json'));
    assert.equal(installedPackage.name, 'node-forge', `${name}: package identity`);
    assert.ok(atLeast(installedPackage.version, minimumFixedVersion),
      `${name}: node-forge ${installedPackage.version} predates ${minimumFixedVersion.join('.')}`);
  }
});

for (const exponent of [3, 65537]) {
  const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicExponent: exponent });
  const publicKeyPEM = keys.publicKey.export({ type: 'spki', format: 'pem' });
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPEM);
  const verify = info => publicKey.verify(digest.toString('binary'), signatureForEncodedDigest(info, keys.privateKey));
  const garbage = Buffer.alloc(100, 0x88);
  const malformed = [
    ['extra nested DigestAlgorithm element', digestInfo(nullParameters, { extraInner: tlv(0x04, garbage) })],
    ['non-NULL parameters', digestInfo(tlv(0x04, garbage))],
    ['nonempty NULL parameters', digestInfo(tlv(0x05, garbage))],
    ['nonminimal outer length', digestInfo(nullParameters, { longOuter: true })],
    ['nonminimal inner length', digestInfo(nullParameters, { longInner: true })],
    ['extra outer DigestInfo element', digestInfo(nullParameters, { extraOuter: tlv(0x04, garbage) })],
  ];
  for (const [name, info] of malformed) {
    test(`RSA e=${exponent} rejects ${name} (CVE-2026-85393)`, () => {
      assert.throws(() => verify(info), /valid RSASSA-PKCS1-v1_5 DigestInfo/);
    });
  }
  test(`RSA e=${exponent} accepts canonical NULL and omitted parameters and rejects a wrong digest`, () => {
    assert.equal(verify(digestInfo()), true);
    assert.equal(verify(digestInfo(Buffer.alloc(0))), true);
    const signature = signatureForEncodedDigest(digestInfo(), keys.privateKey);
    assert.equal(publicKey.verify(Buffer.alloc(32).toString('binary'), signature), false);
  });
  for (const algorithm of ['sha256', 'sha384', 'sha512']) {
    test(`RSA e=${exponent} verifies Node/OpenSSL ${algorithm} signatures`, () => {
      const signature = crypto.sign(algorithm, message, keys.privateKey);
      const hash = crypto.createHash(algorithm).update(message).digest('binary');
      assert.equal(publicKey.verify(hash, signature.toString('binary')), true);
    });
  }
  test(`RSA e=${exponent} keeps RSA-PSS and NONE verification compatible`, () => {
    const pss = forge.pss.create({ md: forge.md.sha256.create(), mgf: forge.mgf.mgf1.create(forge.md.sha256.create()), saltLength: 32 });
    const signature = crypto.sign('sha256', message, { key: keys.privateKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 });
    assert.equal(publicKey.verify(digest.toString('binary'), signature.toString('binary'), pss), true);
    const rawSignature = crypto.privateEncrypt({ key: keys.privateKey, padding: crypto.constants.RSA_PKCS1_PADDING }, digest);
    assert.equal(publicKey.verify(digest.toString('binary'), rawSignature.toString('binary'), 'NONE'), true);
  });
}

test('Expo certificate/key PEM, CSR, manifest signing and verification work with the installed node-forge', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gruntz-forge-expo-test-'));
  try {
    // Exercise the actual installed consumer code with isolated Node resolution.
    // This does not change the running Metro process or active node_modules.
    const consumerSource = path.dirname(require.resolve('@expo/code-signing-certificates/package.json'));
    const consumerPath = path.join(temporary, 'node_modules/@expo/code-signing-certificates');
    fs.mkdirSync(path.dirname(consumerPath), { recursive: true });
    // Skip the consumer's nested node_modules so it resolves the target forge.
    fs.cpSync(consumerSource, consumerPath, {
      recursive: true,
      filter: source => !path.relative(consumerSource, source).split(path.sep).includes('node_modules'),
    });
    fs.symlinkSync(target, path.join(temporary, 'node_modules/node-forge'), 'dir');
    const isolatedRequire = createRequire(path.join(temporary, 'test.cjs'));
    const consumerRequire = createRequire(path.join(consumerPath, 'package.json'));
    assert.equal(fs.realpathSync(consumerRequire.resolve('node-forge')), fs.realpathSync(require.resolve(target)));
    const signing = isolatedRequire('@expo/code-signing-certificates');
    const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = {
      privateKeyPEM: keys.privateKey.export({ type: 'pkcs1', format: 'pem' }),
      publicKeyPEM: keys.publicKey.export({ type: 'spki', format: 'pem' }),
    };
    const keyPair = signing.convertKeyPairPEMToKeyPair(pem);
    assert.equal(signing.convertKeyPairToPEM(keyPair).privateKeyPEM.replace(/\r/g, ''), pem.privateKeyPEM);
    const certificate = signing.generateSelfSignedCodeSigningCertificate({
      keyPair, validityNotBefore: new Date(Date.now() - 60000),
      validityNotAfter: new Date(Date.now() + 86400000), commonName: 'Gruntz security regression',
    });
    const restored = signing.convertCertificatePEMToCertificate(signing.convertCertificateToCertificatePEM(certificate));
    signing.validateSelfSignedCertificate(restored, keyPair);
    const signature = signing.signBufferRSASHA256AndVerify(keyPair.privateKey, restored, message);
    assert.equal(crypto.verify('sha256', message, keys.publicKey, Buffer.from(signature, 'base64')), true);
    const csr = signing.convertCSRPEMToCSR(signing.convertCSRToCSRPEM(signing.generateCSR(keyPair, 'Gruntz CSR')));
    assert.equal(csr.verify(), true);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
