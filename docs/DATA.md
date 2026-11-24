# 数据来源与第三方许可

**语言 / Language：简体中文 | [English](DATA.en.md)**

## 词库构建

仓库已内置 **5,530 条真实考研词条**，分别保存英文词、来源释义、英式音标、原始词频与两种排名，并引用 **3,050 词核心集合**辅助计算重要性。原始数据来自下方开源项目；完整词表按 **CC BY-NC-SA 4.0** 发布，不适用本仓库代码的 MIT 许可证（[完整许可文本](../app/data/LICENSE-CC-BY-NC-SA-4.0.txt)）。

原始词表附带的第三方真题、新闻及其他例句未随仓库打包；少量自编示例句作为学习辅助。构建脚本可以重新获取来源数据，并在可用时加入 2010—2025 年英语（一）正文词形计数。

```bash
npm install
npm run data
# 无法获取真题语料时
node scripts/prepare-data.cjs --without-corpus
# 已将来源文件放入 sources/ 时
node scripts/prepare-data.cjs --offline
```

`sources/` 已被 Git 忽略。`app/data/vocabulary.js` **已经包含第三方授权的真实词表**，不得以本项目 MIT 许可证重新分发。更新脚本会替换此文件；重要性结果可能随来源和语料覆盖改变。常规 `npm run build` 不再联网更新词库，仅校验已提交数据并构建复习调度器；需要更新词库时明确执行 `npm run build:refresh-data`，核查差异后提交。

**排序含义**：来源词频是上游混合英语考试试卷中的出现次数，不是英语一专属频率；综合重要性则将来源真题次数、混合词频、CEFR 和核心词表作为启发式学习权重，独立于来源词频排名。词汇优先级属于**未经考试表现验证的启发式评分**。表面词形匹配不等于词元匹配，也不能确定多义词在真题中的实际义项。语料不足时退回来源词表字段，不能称作独立核实的英语（一）词频。

## 排序版本 2

本次内置词库依据 NETEMVocabulary 完整表与核心表（[上游字段说明](https://github.com/exam-data/NETEMVocabulary/blob/master/docs/data-dictionary.md)）更新，保留原始词频和原始释义。当前内置数据的真题次数均有数值：2,443 个为正数，3,087 个为 0；CEFR 未匹配 1,159 个。零值只表示来源词表统计值为零，不代表该词从未出现在英语一试卷中。

未引入独立英语一正文语料时，综合重要性由以下指标构成：

| 指标 | 权重 |
|---|---:|
| 来源真题次数（2005—2023 年考研真题词表） | 56% |
| 来源混合考试词频 | 26% |
| 3,050 词核心表成员 | 10% |
| CEFR 难度 | 6% |
| 学术词汇标记 | 2% |

计数项以全表最大值进行对数归一化。缺失真题次数保留为 null，评分贡献为零，不重新分配权重；未知 CEFR 采用中性值 0.5。该权重是可解释的学习启发式，不是根据考试成绩拟合的预测模型。两种排序独立；词频相同按单词字母顺序排列。分层为重要性排名的 20% / 30% / 30% / 20%，不表示官方考试难度。

如果另行导入至少 12 个有效年份的英语一正文，评分采用正文表面词形次数 30%、年份覆盖 15%、来源真题次数 30%、混合词频 12%、核心表 8%、CEFR 4%、学术词汇 1%。当前内置词库没有使用这组正文统计。

[补充义项](../data/sense-notes.json) 是项目原创中文学习提示，参考 Cambridge Dictionary 的对应词条编写；不复制其英文释义或例句，不宣称是真题义项频率。原始释义仍保留，更新脚本会重新合并补充义项。

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
