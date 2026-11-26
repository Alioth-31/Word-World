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

## Temporal ranking evaluation

Run `npm run eval:exam1` to reproduce the [evaluation report](../data/exam1-ranking-eval.json) without raw exam text. Candidate models train on 2010–2017 and are selected on 2018–2021 only, then rebuilt using 2010–2021 and evaluated on 2022–2025. Token and type coverage denominators are matched single-word vocabulary entries within the evaluated subset, not all passage tokens. Results distinguish all entries, non-A1/A2 entries (including unknown CEFR), known B1 or higher entries, and exact versus exact-plus-inferred targets.

The validation criterion averages exact-target token and type coverage at budgets of 500, 1000 and 2000 non-A1/A2 words. The selected candidate uses 50% log-normalized weighted count (exact + 0.5 inferred) and 50% weighted year coverage (1 for exact, 0.5 for inferred-only). Its validation score is 69.66%. On 2022–2025, top-1000 exact-token/type coverage is 77.98% / 60.64%, compared with 35.98% / 48.91% for V2 and 78.04% / 62.23% for mixed frequency. Upstream frequency and V2 may include evaluation years, so they are retrospective comparators only; the dictionary and CEFR annotations are retrospectively defined as well. Coverage is not exam performance, and the V2 default remains unchanged.

An exploratory audit of inferred matches in 2010, 2015, 2020 and 2025 found 1,737 inferred occurrences across 789 distinct form-to-entry pairs. For instance, according → accord may conflate a fixed expression with a verb. Inferred counts are not disambiguated lemma counts. This post-hoc observation was not used to change the evaluated model or frequency dataset.

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

### English I frequency in the app

`npm run data:exam1:app` projects the separate report into the offline asset `app/data/exam1.js` with word IDs, exact and inferred counts, observed years, and estimated ranks. Library and new-word ordering support this separate ranking; unobserved entries follow observed entries, ordered by existing importance. Mixed-source frequency, importance and review scheduling remain unchanged. The option is disabled if the resource is absent or does not match the vocabulary IDs, and study falls back to importance. The demo vocabulary does not use the full ranking.

### Personalized study (phase one)

The personal order supports balanced, CET6-first and English I-first goals. CET6 overlap is prioritized without excluding other entries; English I frequency reorders within 100-position importance bands. This is an interpretable heuristic, not a validated learning-effectiveness model. Self-reported familiar words are stored separately in the local `known` backup field, excluded from new-word plans, and recoverable from the library. They do not count as learned or stable; existing review records cannot be skipped through this feature. Rating a previously excluded word in direct study returns it to normal scheduling. Legacy backups remain compatible.

### Stratified vocabulary self-assessment (phase two)

Each round samples up to 12 previously unassessed entries without review records, taking up to three from each quartile of the importance-ordered vocabulary, then filling from remaining entries. Learners recall before revealing definitions and report unknown, partial, or accurate recall. The local `diagnostic` field stores the responses. Accurate recall marks self-reported familiarity; weak responses remove that mark and take priority in personal study. Assessment never creates FSRS records or counts toward study totals. Normal study removes the entry from the pending weakness queue while preserving diagnostic history. Results are subjective and do not estimate total vocabulary size or sense-level mastery.

### Shared content catalog and word books

`app/js/content.js` owns access to bundled vocabulary and English I statistics and exposes word lookup, stable progress keys, book membership, and frequency lookup. The current NETEM book contains the existing vocabulary; the CET6 overlap book references the same entries tagged CET6 and is not a full CET6 list. No meanings or personal records are duplicated. `prefs.book` defaults to NETEM for legacy backups. New words, assessment and browsing are scoped to the selected book; the daily quota and due review queue remain global. Personal storage retains schema 3; no storage-engine migration has occurred.

### Independent skill memory and objective practice

The pilot asset contains 18 learning units with two original variants each (36 exercises), covering contextual senses, collocation choice and typed spelling. These are not exam questions and have not undergone psychometric validation. The ability engine scores answers, prioritizes due items, rotates new skills and variants, schedules independent FSRS reviews and reports item-level first-attempt outcomes. The optional `abilities` backup field stores records by stable unit ID without modifying word review records or daily vocabulary quotas. Cross-book skill reviews remain accessible. Results describe tested items only, not general proficiency or predicted exam scores.
