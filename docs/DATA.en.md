# Data Sources and Third-party Licenses

**Language / 语言: [简体中文](DATA.md) | English**

## Building the vocabulary

This repository includes **125 original demo entries** but no complete third-party dictionaries, full exam passages, or teaching materials. The builder can retrieve postgraduate vocabulary, CET overlap labels, and structured English I material from 2010–2025 to calculate vocabulary priority scores.

```bash
npm install
npm run data
# Skip the exam corpus if it cannot be retrieved
node scripts/prepare-data.cjs --without-corpus
# Use files already prepared in sources/
node scripts/prepare-data.cjs --offline
```

The `sources/` directory is Git-ignored. Generated `app/data/vocabulary.js` may contain third-party licensed data and must not be redistributed under this project's MIT license.

The priority ranking is an **unvalidated heuristic**. Exact token matches are not lemmatized matches and cannot establish which sense of a polysemous word occurs in a passage. With insufficient corpus data, scoring falls back to source fields and is **not** an independently verified English I frequency list.

## Third-party sources

| Source | Use | Stated license and limitations |
|---|---|---|
| [NETEMVocabulary](https://github.com/exam-data/NETEMVocabulary) | Postgraduate word lists and meanings | CC BY-NC-SA 4.0; verify original-rightsholder and attribution requirements |
| [CETVocabulary](https://github.com/exam-data/CETVocabulary) | CET overlap labels | CC BY-NC-SA 4.0; verify original-rightsholder and attribution requirements |
| [structured-kaoyan-english](https://github.com/LIziak112/structured-kaoyan-english) | English I passage-based frequency estimates | May include copyrighted exam material; repository terms do not necessarily grant underlying rights |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | Spaced repetition | MIT |
| [Capacitor](https://github.com/ionic-team/capacitor) | Android runtime | MIT |
| [esbuild](https://github.com/evanw/esbuild) | JavaScript bundling | MIT |

Before distributing APKs that contain third-party data, check the actual bundled materials and comply with attribution, non-commercial, ShareAlike, and original-rightsholder requirements. This project's [MIT License](../LICENSE) covers only material it has the right to license. A brief notice is also shipped as `app/THIRD_PARTY.txt`.

[← Back to README](../README.en.md)
