# Source architecture

The product is a vocabulary learner for English I. Keep one application, one real dictionary, one ordinary progress store and one canonical short-lesson queue. The football layer is optional presentation and rewards, never a competing curriculum.

| Area | Files | Contract |
| --- | --- | --- |
| Content | `app/data/vocabulary.js`, `exam1.js`, `abilities.js`, `exam-senses.js`; `app/js/content.js` | Stable word and skill IDs, provenance; English I word-level counts are not sense frequencies |
| Learning | `learning-policy.js`, `adaptive-learning.js`, `exam-priority.js`, `word-lesson.js`, `word-lesson-bridge.js` | Budget, evidence, priority, session transitions; scheduler invoked only for independent tasks |
| Memory | `fsrs-entry.js`, `fsrs-engine.js`, `srs-fallback.js`, `abilities.js` | Keep word and skill records separate; production build bundles ts-fsrs, preview may use fallback |
| Analytics | `study-analysis.js`, `study-analysis-ui.js` | Read existing evidence; no fabricated mastery or score |
| Optional league | `football-season.js`, `football-ui.js` | Observe the learning plan/events; no mutation of FSRS due dates; scouting uses planned order, recovery uses existing due weak tasks |
| App composition | `app/js/app.js`, `app/index.html`, `app/style.css`, `app/styles/` | Composition, storage, navigation and feature styles. Old hidden controls are migration compatibility paths, not independent product screens |
| Build | `scripts/build-preview.cjs`, `app/sw.js`, `package.json` | Standalone preview generated from the actual app; cache tracks full app version |

Maintain stable keys and schema-3 backup compatibility. New fields are additive; no migration of old self-ratings into objective mastery. Source modules are kept in the existing vanilla JS conventions; avoid a second parallel app. Feature CSS is loaded independently in dependency order. Keep source docs and tests; generated previews, test outputs, and intermediate ZIPs stay outside Git. The current standalone preview uses the same 5,530-word dictionary and application as the Android build, with a simplified scheduler fallback. The 36 structured focus entries are an instructional pilot, not a separate dictionary.

Before moving paths or changing schemas, add migration and full-app integration tests. The remaining legacy navigation/DOM compatibility code should be removed only after equivalent tests for the short-lesson route exist. Data-specific source and licensing details are in DATA.md; feature rules are in the corresponding feature documentation.
