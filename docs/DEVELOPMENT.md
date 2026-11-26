# Development checkpoint

Target: `0.6.0-beta.1` (integration beta). This checkpoint consolidates the local experiments into the actual 5,530-word app. Earlier numbered local prototypes are not product releases; generated previews and ZIPs are not source files.

- Product scope: English I vocabulary, targeted sense/collocation practice, short lessons and independent memory records. Preserve the existing data IDs and schema-3 backup compatibility.
- Learning: adaptive time-budget allocation, priority and independent word/skill recall; evidence is separated from immediate repair.
- Analytics: descriptive coverage, recall and due weak-item tasks. No inferred exam score.
- Optional Word FC: daily match, match report, season history, season XI, roster, scouting based on personal new-word order and recovery based on existing due weak tasks. No effect on FSRS or study priorities.
- Architecture and release rules: [ARCHITECTURE.md](ARCHITECTURE.md), [RELEASES.md](RELEASES.md), [CHANGELOG](../CHANGELOG.md).

Next: fix integration/device issues on the beta series, then freeze features for RC. Expand vetted sense/phrase content and evidence-linked priorities in the next minor release; keep vocabulary learning central. No automatic push or merge for future milestones without owner approval.

Release gates still open: native Android build/install/update, actual persistent storage and migration on physical devices, accessibility audit, and content verification. No stable release or signed APK is claimed.
