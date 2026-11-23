# 数据来源与构建

运行 `npm run data` 将：

1. 下载 `exam-data/NETEMVocabulary` 的词条及释义。
2. 尝试下载 `exam-data/CETVocabulary`，以添加相关考试重合标签。
3. 尝试读取 2010—2025 年英语（一）结构化正文，统计英语一正文原形词频与覆盖年份。
4. 将来源词频、语料覆盖与难度标签合成为学习优先级，并输出 `app/data/vocabulary.js`。

默认数据目录 `sources/` 不纳入版本控制。若需要离线准备数据：

```text
sources/
  netem_full_list.json
  cet_full_list.json
  structured-kaoyan-english/data/2024-1/2024-1.json
  ...
```

`node scripts/prepare-data.cjs --without-corpus` 可以跳过真题正文下载；由来源自带的真题次数、混合考试词频等字段建立回退排序。未导入完整语料时，应用不得将回退排序标注为英语（一）独立词频。

该评分属于启发式排序，不等于官方考研考试难度等级。原形匹配不涵盖所有词形变化，也不能自动确认一词多义的重点义项。数据来源许可见 [THIRD_PARTY.md](../THIRD_PARTY.md)。
