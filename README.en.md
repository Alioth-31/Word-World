# Word World

**An offline, vocabulary-first app for China's postgraduate English I exam, with independent importance and frequency rankings.**

**Language / 语言: [简体中文](README.md) | English**

[![Tests](https://github.com/Alioth-31/Word-World/actions/workflows/test.yml/badge.svg)](https://github.com/Alioth-31/Word-World/actions/workflows/test.yml)
[![MIT License](https://img.shields.io/badge/Code-MIT-344d48)](LICENSE)
[![Android APK](https://img.shields.io/badge/Android-manual%20build-586864)](https://github.com/Alioth-31/Word-World/actions/workflows/build-apk.yml)

<p align="center">
  <img src="docs/images/today.png" alt="Daily study screen" height="450">
  &nbsp;&nbsp;
  <img src="docs/images/study.png" alt="Meaning and context screen" height="450">
</p>
<p align="center"><sub>Real interface screenshots using the bundled demo vocabulary</sub></p>

## Overview

Word World separates **dictionary lookup** from **memory practice**. A lookup shows definitions immediately; study sessions begin with active recall, followed by meaning and contextual examples, four-grade feedback, and spaced scheduling. Study progress remains on the device by default.

```mermaid
flowchart LR
    A[Today's tasks] --> B[Active recall]
    B --> C[Meaning and context]
    C --> D[Memory rating]
    D --> E[Scheduled review]
```

**Features**

- Daily tasks: due reviews first, then new vocabulary.
- Focused practice: recall, reveal, contextual examples, and four-grade feedback.
- **Full vocabulary** — 5,530 authentic entries with pronunciations, meanings, source frequency counts, a 3,050-word core-list label and CET overlap information.
- **Two ranking modes** — composite study importance (default) and descending raw source frequency. The daily screen and settings control new-word order; dictionary details show both ranks.
- Dictionary — Chinese/English search, filters, bookmarks, and word details.
- Local records: on-device progress and JSON import/export.
- Spaced repetition: Android builds integrate `ts-fsrs`; standalone HTML previews use a simplified fallback scheduler.

## Browser preview

Requires **Node.js 22+**. From the repository root:

```bash
npm test
npm run preview
```

Open `output/preview.html`. No Android SDK is needed. The preview includes the **full 5,530-word dictionary**. Original demonstration sentences are supplementary; words, definitions, pronunciations and ranking data are primary.

## Android build

Open [GitHub Actions · Android APK](https://github.com/Alioth-31/Word-World/actions/workflows/build-apk.yml) and select **Run workflow**. Once the job succeeds, download the debug APK from that run's **Artifacts**.

On Windows, install Node.js 22+, JDK 21+, and the Android SDK, then run `build-android.cmd`. A successful build writes `output/word-world-debug.apk`.

> There is currently no production APK validated on a physical device. Android builds use the committed vocabulary without fetching updated rankings. Refreshing source data is an explicit operation (`npm run build:refresh-data`) and should be reviewed before committing regenerated assets. The Android workflow must run separately: a green Tests badge **does not** establish that the APK builds successfully.

## Repository layout

```text
app/                   UI, scheduling logic and 5,530-word licensed vocabulary
assets/                Android icon assets
scripts/               Vocabulary processing and build tools
tests/                 Automated tests
docs/                  Data notices and interface screenshots
.github/workflows/     Tests and Android build workflows
```

## Data, license and privacy

Original code is distributed under the [MIT License](LICENSE). The **bundled vocabulary is licensed under CC BY-NC-SA 4.0**, not this project's MIT license. Source frequency counts combine several English exams and are **not English I-only frequencies**. Composite importance rankings are an unvalidated learning heuristic.

- [Data sources and third-party licenses](docs/DATA.en.md)
- [Privacy notice](PRIVACY.en.md)
- [简体中文文档](README.md)
