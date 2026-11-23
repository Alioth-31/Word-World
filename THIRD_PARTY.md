# 第三方依赖与数据许可

项目的 **MIT License** 仅覆盖仓库中的原创代码、文档和原创演示内容，不覆盖由构建流程下载的第三方数据或依赖。

| 项目 | 用途 | 许可与边界 |
|---|---|---|
| [exam-data/NETEMVocabulary](https://github.com/exam-data/NETEMVocabulary) | 考研词表、释义、来源词频及排序依据 | 数据仓库声明为 **CC BY-NC-SA 4.0**。非商业、署名和相同方式共享要求适用于相关数据及改编内容。 |
| [exam-data/CETVocabulary](https://github.com/exam-data/CETVocabulary) | 四六级词汇匹配与补充标签 | 数据仓库声明为 **CC BY-NC-SA 4.0**。 |
| [LIziak112/structured-kaoyan-english](https://github.com/LIziak112/structured-kaoyan-english) | 考研英语（一）正文的本地词频统计 | 仓库声明分层许可，并明确第三方解析可能受版权保护；项目声明不能替代原权利人授权。构建程序用于内部统计，不直接把完整原文嵌入输出词库。 |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | FSRS 调度算法 | MIT；构建阶段由 npm 安装并打包。 |
| [ionic-team/capacitor](https://github.com/ionic-team/capacitor) | Android 容器与桥接 | MIT；构建阶段由 npm 安装。 |
| [evanw/esbuild](https://github.com/evanw/esbuild) | JavaScript 构建 | MIT；构建阶段由 npm 安装。 |

本仓库默认提交的是项目原创的 125 条示例词汇及其演示例句，不包含下载取得的完整第三方词库、整篇真题或教辅解析。`sources/` 被 `.gitignore` 排除。

**分发提醒：** 若将构建后包含第三方词表与释义的 APK 对外发布，需依据实际包含的材料满足许可条款；特别是非商业限制、署名、许可证文本及必要的相同方式共享条款。完整词库不是 MIT 授权数据。
