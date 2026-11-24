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

## Ranking version 2

The bundled dictionary preserves source meanings and counts. The upstream [data dictionary](https://github.com/exam-data/NETEMVocabulary/blob/master/docs/data-dictionary.md) distinguishes mixed-exam lemmatized frequency from the 2005–2023 postgraduate exam word-list count. The bundled data has 2,443 positive exam counts, 3,087 zeros and 1,159 unknown CEFR labels. A source count of zero does not establish absence from English I papers.

The bundled importance score uses 56% source exam count, 26% mixed frequency, 10% core-list membership, 6% CEFR difficulty, and 2% academic-word membership. Counts are log-normalized by the maximum over the vocabulary. Missing exam counts remain null and contribute zero without redistributing weight; unknown CEFR takes a neutral 0.5. Frequency ties are ordered alphabetically, independently of importance. Importance tiers use 20/30/30/20 percent rank bands. This is a learning heuristic, not a validated exam performance model.

When at least 12 valid years of English I passages are explicitly added, the formula uses surface-form count (30%), year coverage (15%), source exam count (30%), mixed frequency (12%), core membership (8%), CEFR (4%) and academic membership (1%). The bundled dictionary does not use this optional corpus.

[Supplementary sense notes](../data/sense-notes.json) are original Chinese learning notes informed by corresponding Cambridge Dictionary entries, not copied English definitions or exam quotations. Source meanings remain intact; the builder merges the notes during refresh.

## Independent English I passage statistics

`data/exam1-frequency.json` records statistics for all 5,530 entries from the 2010–2025 English I cloze visible text, four Reading Part A passages and translation passages. It excludes Part B, questions, options, explanations, writing and unfilled cloze answers. The pinned source revision and sixteen per-paper Git blob hashes are listed in [exam1-source.json](../data/exam1-source.json).

Case-normalized exact matches and unique-candidate rule-based inflection estimates are recorded separately; case-distinct entries retain their literal spelling. Phrase matches may overlap constituent words and do not cross paragraph or punctuation boundaries. Only unmatched forms are candidates for inference, and competing dictionary candidates remain unmatched. These are not POS- or sense-disambiguated lemma counts. Both ranks use competition ranking among positive counts; unobserved words have null ranks. Annual entries are stored as [exact, inferred] counts.

The dataset contains 38,035 passage tokens: 26,674 exact matches, 6,686 inferred matches and 4,675 unmatched tokens, plus 20 overlapping phrase matches. Only derived counts are stored, not exam passages or explanations. The statistics do not yet affect the app or the V2 importance formula.

To reproduce, place the [pinned corpus revision](https://github.com/LIziak112/structured-kaoyan-english/tree/ce0e9ac7c48e74738ffaeb04ff7033e69ea314c9) in `sources/structured-kaoyan-english`, then run `npm run data:exam1` (or `npm run data:exam1 -- /path/to/corpus`). The script checks each file's Git blob SHA-1 and validates the expected passage structure. The upstream corpus is unofficial and may contain transcription errors.

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
