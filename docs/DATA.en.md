# Data Sources and Third-party Licenses

**Language / 语言: [简体中文](DATA.md) | English**

## Building the vocabulary

The repository **bundles 5,530 authentic postgraduate vocabulary entries**, with source definitions, British IPA, raw source frequencies and separate ranking fields. A **3,050-word core list** contributes to importance scoring. This vocabulary is licensed separately under **CC BY-NC-SA 4.0** ([full license text](../app/data/LICENSE-CC-BY-NC-SA-4.0.txt)); it is **not MIT-licensed**.

Upstream exam/news/example sentences are not bundled due to separate third-party rights. A small number of original practice sentences are included only as optional aids. The builder can update the vocabulary and, when available, use 2010–2025 English I passage token counts.

```bash
npm install
npm run data
# Skip the exam corpus if it cannot be retrieved
node scripts/prepare-data.cjs --without-corpus
# Use files already prepared in sources/
node scripts/prepare-data.cjs --offline
```

The `sources/` directory is Git-ignored. `app/data/vocabulary.js` **already contains upstream-licensed vocabulary data** and must not be redistributed under the project's MIT license. Running the builder replaces this file with a newly generated version. The regular `npm run build` verifies the committed vocabulary and bundles the scheduler without refreshing the dictionary. Use `npm run build:refresh-data` explicitly when updated source data is needed, then review the resulting changes.

**The two rankings differ**: source frequency counts come from mixed exam corpora (including CET, postgraduate and TEM examinations), **not English I alone**. Composite importance is a separate **unvalidated heuristic** incorporating source-provided exam counts, mixed frequency, CEFR and core-set membership. Exact token matches are not lemmatized matches and cannot establish which sense of a polysemous word occurs in a passage. With insufficient corpus data, scoring falls back to source fields and is **not** an independently verified English I frequency list.

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
