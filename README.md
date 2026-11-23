# Word World · 词页

**围绕真实考研词汇、重要性和词频排序的离线学习应用。**

**语言 / Language：简体中文 | [English](README.en.md)**

[![Tests](https://github.com/Alioth-31/Word-World/actions/workflows/test.yml/badge.svg)](https://github.com/Alioth-31/Word-World/actions/workflows/test.yml)
[![MIT License](https://img.shields.io/badge/Code-MIT-344d48)](LICENSE)
[![Android APK](https://img.shields.io/badge/Android-手动构建-586864)](https://github.com/Alioth-31/Word-World/actions/workflows/build-apk.yml)

<p align="center">
  <img src="docs/images/today.png" alt="今日学习首页" height="450">
  &nbsp;&nbsp;
  <img src="docs/images/study.png" alt="词义和语境阅读" height="450">
</p>
<p align="center"><sub>真实运行界面 · 使用仓库内的演示词汇</sub></p>

## 项目简介

Word World 将**词汇查询**与**记忆训练**分开：查词时直接呈现释义；学习时先主动回忆，再揭示词义和语境，最后评价记忆表现，以安排后续复习。学习进度默认仅保存在设备本地。

```mermaid
flowchart LR
    A[今日任务] --> B[主动回忆]
    B --> C[释义与语境]
    C --> D[记忆评价]
    D --> E[安排复习]
```

**主要功能**

- 今日任务：优先完成到期复习，再学习新词。
- 沉浸学习：回忆、词义揭示、例句阅读、四级记忆反馈。
- **完整词库**：内置 5,530 条考研词条及音标、释义、原始来源词频；标注 3,050 词核心集合与四六级重合信息。
- **两种排序**：默认综合重要性排序，也能切换来源词频降序；首页和学习记录均可设置新词顺序，词条详情分别显示两套排名。
- 词库检索：中英文搜索、优先级筛选、收藏和词条详情。
- 本地数据：保存学习记录，支持 JSON 导入与导出。
- 间隔复习：Android 构建集成 `ts-fsrs`；独立 HTML 预览使用简化调度器。

## 本地预览

需要 **Node.js 22 或更新版本**。在仓库根目录运行：

```bash
npm test
npm run preview
```

在浏览器打开 `output/preview.html`。此预览无需 Android SDK，**直接使用仓库内的 5,530 条真实词条**。部分词条附有原创示例句，其余词条以词义、音标和词频为主。

## Android 构建

在 [GitHub Actions · Android APK](https://github.com/Alioth-31/Word-World/actions/workflows/build-apk.yml) 选择 **Run workflow**。成功运行后，在该次运行的 **Artifacts** 中获取调试版 APK。

Windows 也可以安装 Node.js 22+、JDK 21+ 和 Android SDK，然后运行 `build-android.cmd`；成功时输出 `output/word-world-debug.apk`。

> 目前未提供经过真机验收的正式发行版 APK。Android 构建直接使用仓库已内置的完整词库，避免因下载更新而改变词条顺序。需要主动更新词库时单独运行 `npm run build:refresh-data`，校核变更后再提交生成数据。Android 工作流需要单独运行；上方 Tests 徽章通过并不代表 APK 编译通过。

## 项目结构

```text
app/                   应用界面、复习逻辑及 5,530 词数据（词表另有许可）
assets/                Android 图标资源
scripts/               词库处理与构建工具
tests/                 自动测试
docs/                  数据许可说明与界面截图
.github/workflows/     自动测试与 Android 构建
```

## 数据、许可与隐私

原创代码采用 [MIT 许可证](LICENSE)。**已内置的第三方词表属于 CC BY-NC-SA 4.0，不属于本项目 MIT 授权范围**；源码和原创示例另按 MIT 授权。综合重要性为未经过考试表现验证的启发式排序；来源词频涵盖四六级、考研及其他考试，**并非纯英语一真题词频**。

- [数据来源与第三方许可](docs/DATA.md)
- [隐私说明](PRIVACY.md)
- [English documentation](README.en.md)
