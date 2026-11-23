# 数据来源与第三方许可

**语言 / Language：简体中文 | [English](DATA.en.md)**

## 词库构建

仓库只提交 **125 条原创演示词条**，不提交完整第三方词表、整篇真题或教辅解析。构建脚本可获取考研词汇、四六级重合标签及 2010—2025 年英语（一）结构化语料，计算词汇重要性排序。

```bash
npm install
npm run data
# 无法获取真题语料时
node scripts/prepare-data.cjs --without-corpus
# 已将来源文件放入 sources/ 时
node scripts/prepare-data.cjs --offline
```

`sources/` 已被 Git 忽略。生成的 `app/data/vocabulary.js` 可能含第三方授权内容，不得直接以本项目 MIT 许可证重新分发。

词汇优先级属于**未经考试表现验证的启发式评分**。表面词形匹配不等于词元匹配，也不能确定多义词在真题中的实际义项。语料不足时退回来源词表字段，不能称作独立核实的英语（一）词频。

## 第三方资料

| 来源 | 用途 | 声明的许可及注意事项 |
|---|---|---|
| [NETEMVocabulary](https://github.com/exam-data/NETEMVocabulary) | 考研词表与释义 | CC BY-NC-SA 4.0，需核对上游版权与署名要求 |
| [CETVocabulary](https://github.com/exam-data/CETVocabulary) | 四六级重合标签 | CC BY-NC-SA 4.0，需核对上游版权与署名要求 |
| [structured-kaoyan-english](https://github.com/LIziak112/structured-kaoyan-english) | 英语（一）正文词频统计 | 可能包含另有版权的考试材料；仓库声明不等于原权利人授权 |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | 间隔复习调度 | MIT |
| [Capacitor](https://github.com/ionic-team/capacitor) | Android 应用容器 | MIT |
| [esbuild](https://github.com/evanw/esbuild) | JavaScript 构建 | MIT |

发布含第三方数据的 APK 前，应依据实际打包内容核对署名、非商业限制、相同方式共享及原权利人的许可要求。本项目 [MIT 许可证](../LICENSE)仅覆盖有权授权的原创内容。应用中另有 `app/THIRD_PARTY.txt` 简要声明。

[← 返回项目主页](../README.md)
