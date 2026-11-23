# 数据与第三方许可 / Data & Third-party Licenses

[简体中文](#简体中文) · [English](#english)

## 简体中文

### 词库构建

本仓库仅提交 **125 条原创演示词条**，不提交从其他项目下载的完整词库、真题正文或教辅解析。执行 `npm run data` 时，脚本会按可用程度获取考研词汇、四六级重合标签和 2010—2025 年考研英语（一）结构化语料，用于生成运行时词表及重要性排序。

```bash
npm install
npm run data
# 无法获取真题语料时：
node scripts/prepare-data.cjs --without-corpus
# 从已准备好的 sources/ 目录离线读取：
node scripts/prepare-data.cjs --offline
```

默认使用的 `sources/` 目录已加入 `.gitignore`。生成结果写入 `app/data/vocabulary.js`；**不要把包含第三方词表的生成文件当作 MIT 授权内容重新发布**。

优先级评分组合原始词表字段、可获得的正文词形出现次数和年份覆盖情况；词形匹配不等于词元匹配，也不能确认单词在真题中的具体释义。缺少足量英语（一）语料时会退回到来源字段，不应将其称为独立的英语（一）真实词频。

### 第三方资源

| 来源 / Source | 用途 / Use | 许可与边界 / License and limits |
|---|---|---|
| [NETEMVocabulary](https://github.com/exam-data/NETEMVocabulary) | 考研词表与释义 / Postgraduate vocabulary | 源仓库声明 CC BY-NC-SA 4.0 / Source declares CC BY-NC-SA 4.0 |
| [CETVocabulary](https://github.com/exam-data/CETVocabulary) | 四六级重合标签 / CET overlap tags | 源仓库声明 CC BY-NC-SA 4.0 / Source declares CC BY-NC-SA 4.0 |
| [structured-kaoyan-english](https://github.com/LIziak112/structured-kaoyan-english) | 英语（一）正文词频统计 / English I corpus counts | 可能含第三方受版权保护的考试材料 / May include third-party copyrighted texts |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | 间隔复习调度 / Spaced repetition | MIT |
| [Capacitor](https://github.com/ionic-team/capacitor) | Android 应用容器 / Android runtime | MIT |
| [esbuild](https://github.com/evanw/esbuild) | JavaScript 打包 / JS bundling | MIT |

若分发包含第三方词库的 APK，必须按照实际打包内容核对署名、非商业限制、相同方式共享及上游权利人的授权条件。MIT 只适用于本项目有权授权的原创部分。构建应用中的 `app/THIRD_PARTY.txt` 保留了随应用分发的基本数据来源提醒。

## English

### Building the vocabulary

The repository tracks **125 original demo entries**. It does not commit complete downloaded dictionaries, exam passages, or teaching materials. Running `npm run data` attempts to fetch the postgraduate vocabulary list, CET overlap tags, and structured English I material from 2010–2025, then generates the runtime dictionary and priority scores.

The `sources/` directory is Git-ignored. Generated output is written to `app/data/vocabulary.js`. **Do not redistribute a third-party-derived vocabulary file under this project's MIT license.** To skip the exam corpus or use locally prepared sources, use the commands above.

Priority is an **unvalidated heuristic** combining source attributes with available token-form counts and year coverage. Surface-form counts are not lemmatized counts and do not identify the intended sense of a polysemous word. If sufficient English I text is unavailable, the builder falls back to source-provided counts; that fallback is **not** an independently verified English I frequency ranking.

### Licensing and redistribution

The table above identifies the upstream repositories and their stated license terms. The structured exam corpus may contain third-party material whose rights are not granted by the repository maintainers. Distributing an APK that bundles such data requires checking the actual included materials and complying with attribution, non-commercial, ShareAlike, and original-rightsholder requirements where applicable.

Only original material that this project can license is covered by [MIT](../LICENSE). The application also carries a compact notice at `app/THIRD_PARTY.txt`.
