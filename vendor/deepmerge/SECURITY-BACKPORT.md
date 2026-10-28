# Local deepmerge security backport

This is **a local fork, not an upstream release**. `@gruntz/deepmerge@4.3.1-gruntz.1`
supplies Expo's existing transitive `deepmerge` CommonJS API. The upstream npm
latest remains 4.3.1 and has no patched release as of 2026-10-28.

The base is the integrity-verified npm `deepmerge@4.3.1` distribution. The only
runtime change applies the three source edits from upstream pull request
[#274](https://github.com/TehShrike/deepmerge/pull/274), immutable commit
`c5ad573121574db1c625b0aabcc6114ed7df6c5a`, to the self-contained CommonJS build.
That pull request is **closed and unmerged**. Its complete source patch is
independently compared against those edits during regeneration; hashes, the npm
tarball integrity, and source URLs are recorded in `provenance.json`.

[CVE-2026-93753 / GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
can poison the prototype of the **returned object**, without changing global
`Object.prototype`, when merging null/primitive placeholders, null-prototype
targets, or a target with its own `__proto__` key. The patch rejects the exact
string key `__proto__` before either copy loop reads its value or assigns it.
Existing inherited/nonenumerable guards and normal `constructor`/`prototype`
data keys, symbols, arrays, cloning and custom merge options are unchanged.

Only the self-contained CommonJS entry and unchanged declarations/notices are
distributed here. Unpatched UMD bundles and the source entry requiring a
development-only dependency are omitted. The original MIT license and copyright
are retained. Expo config consumers use this as build tooling; the audited B31
mobile source map contains no `deepmerge` or `@expo/config` modules. The website
has no `deepmerge` dependency.

Rebuild and test:

```sh
node scripts/security/rebuild-deepmerge.cjs
node --test --test-concurrency=1 tests/deepmerge-security.test.cjs
```

The tests exercise both installed Expo config versions, actual config/plugin
merging, returned-object poisoning, and public API compatibility. Attack tests
can be demonstrated against an unpatched copy by setting
`DEEPMERGE_SECURITY_TARGET=/absolute/path/to/deepmerge`. No audit suppressions or
upstream version labels are changed. Replace this fork with an officially fixed
release when available, after rerunning these checks.
