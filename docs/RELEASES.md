# Release policy

Use Semantic Versioning (`MAJOR.MINOR.PATCH`) for the product, independently of the data schema and vocabulary revisions. `package.json` is the source of the app version. The service worker cache follows the full app version; the backup schema stays at 3 while changes are additive. Content revisions use their own source metadata and stable IDs. Do not increment the app version for each local edit.

| Channel | Purpose | Version example |
| --- | --- | --- |
| Development | Work in progress on a `dev/*` branch | Unreleased commits |
| Beta | Integrated feature checkpoint; incomplete device/UX validation | `0.6.0-beta.1` |
| Release candidate | Frozen features, full regression and install/update tests | `0.6.0-rc.1` |
| Stable | Approved, signed/tagged release with release notes and verified upgrade path | `0.6.0` |
| Patch | Compatible bug fix on stable series | `0.6.1` |

Minor increments introduce compatible features; major increments indicate breaking compatibility or a new major product generation. Until 1.0, explicitly document incompatible changes. Git tags should use `v` + the package version, annotated at a verified release commit. Beta/RC tags and GitHub releases must be identified as prereleases. Do not publish a debug APK as stable. Android versionCode must increase for every distributed APK, independent of SemVer; before distribution record it in the native build configuration. No APK distribution is part of this beta source integration.

## Merge and release gates

1. Single coherent branch checkpoint; review changes, no experimental HTML bundles or duplicated archives in the source tree.
2. All repository tests pass, standalone full-dictionary preview builds, assets and IDs validate, backup migration preserves old data. Open PR and verify exact head CI. Do not bypass failed checks.
3. Beta may integrate into `main` only if source checks pass; do not label it stable. RC additionally requires real-device offline/persistence/backup/update tests, accessibility review and Android build. Stable additionally requires approval, release signing and versioned distribution artifacts.
4. Do not auto-merge or publish future checkpoints without the owner's explicit authorization.

## Planned milestones

- `0.6.0-beta.1`: consolidated short lessons, English I priorities, 36 structured focus entries, independent usage practice, learning analytics and optional Word FC league. Scouts reflect the existing vocabulary order and recovery training uses due weak tasks. Source-level beta, not device-certified.
- `0.6.0-beta.2` only if substantial beta corrections are needed; `0.6.0-rc.1` when feature work freezes.
- `0.6.0`: stable once device and distribution gates pass.
- `0.7.0`: vetted sense/phrase content pipeline and evidence-linked priorities; no expansion into full exam courses.
- `1.0.0`: dependable offline use, tested upgrade/backup and content management, stable release and support policy.
