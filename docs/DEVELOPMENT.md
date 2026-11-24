# Development checkpoint

Branch: `dev/exam1-vocabulary`

- English I frequency: 2010–2025 corpus, independently selectable in offline app; original mixed-source and importance orders retained.
- Personalization phase 1: goal-specific ordering (CET6 overlap / English I / balanced), reversible self-reported familiarity, unchanged FSRS and backup compatibility.
- Personalization phase 2: 12-word stratified self-assessment, explicit pending weaknesses, separate diagnostic history, feedback into personal study queue and ordinary FSRS study.

- Content architecture phase 1: shared catalog, stable legacy progress keys, NETEM and explicitly incomplete CET6 overlap books; book-scoped new words/assessment/browsing and global due reviews.

Next: automated source import and full NETEM/CET6 union, independent versioned word-book manifests, content validation and installable offline packages; then storage migration and sense-level content/assessment. Keep stable IDs, provenance, and backup compatibility.

Work in coherent milestones. Read only relevant files; do not push minor edits or merge automatically. Keep the distinction between self-reported familiarity, successful recall, scheduled review, and validated mastery.

- Personalization phase 3: independently scored pilot skill bank (18 units / 36 variants), separate skill-level FSRS, due-first and round-robin new tasks, variant rotation, observed first-attempt and current weakness metrics, cross-book review. Original questions require broader content coverage and empirical calibration. No general exam-score inference.
