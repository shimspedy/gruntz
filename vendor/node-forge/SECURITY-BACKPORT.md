# Local node-forge security backport

This is **a local fork, not an upstream node-forge release**. It is named
`@gruntz/node-forge@1.4.0-gruntz.1` and supplies the existing CommonJS Node API
to Expo's transitive `node-forge` consumers.

The base is the integrity-verified npm `node-forge@1.4.0` source. Every `lib/`
file is unchanged except `lib/rsa.js`, copied exactly from immutable upstream
pull request [#1159](https://github.com/digitalbazaar/forge/pull/1159), commit
`db05494352dd3c9a5a07c5270333dcc78866cad2`. That pull request is **unmerged** as
of 2026-10-26. See `provenance.json` for source URLs and SHA-256 hashes.

The patch addresses
[CVE-2026-85393 / GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
by requiring canonical DER DigestInfo bytes during RSA PKCS#1 v1.5 verification.
Checking only the nested element count (PR #1152) leaves nonempty NULL and
nonminimal length encodings accepted. This patch rejects those forms as well
as extra elements, while preserving valid signatures with or without NULL
parameters. Other RSA schemes and the public API are unchanged.

Only Node source is distributed here; unpatched prebuilt browser bundles and
Flash files are deliberately omitted. The app uses this through Expo's Node
development/signing tools, not as a new app runtime dependency. Original
copyright headers, README, and the complete dual-license notice are retained;
redistribution uses the BSD-3-Clause option.

Rebuild from the pinned public sources:

```sh
node scripts/security/rebuild-node-forge.cjs
node --test tests/node-forge-security.test.cjs
```

The regression suite checks all vendored source hashes and verifies that both
installed Expo consumers resolve the identified fork and patched RSA source.
Behavioral tests target the actual Expo CLI-resolved installation, covering
malformed encodings using real RSA operations and normal PKCS#1 padding, valid
SHA-256/384/512 signatures, RSA-PSS/NONE, and Expo's actual certificate/CSR/signing functions.
It can target an unpatched copy to demonstrate that the attack regressions
fail: `NODE_FORGE_SECURITY_TARGET=/path/to/node-forge node --test tests/node-forge-security.test.cjs`.

Replace this local fork with a supported upstream fixed release when available,
after rerunning those tests. Do not remove audit findings by changing version
labels or omitting these behavioral checks.
