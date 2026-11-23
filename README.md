# Word World · 词页

**一款以语境理解和主动回忆为核心的考研英语（一）离线词汇学习应用。**

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
- 词库检索：中英文搜索、词汇优先级筛选、收藏和词条详情。
- 本地数据：保存学习记录，支持 JSON 导入与导出。
- 间隔复习：Android 构建集成 `ts-fsrs`；独立 HTML 预览使用简化调度器。

## 本地预览

需要 **Node.js 22 或更新版本**。在仓库根目录运行：

```bash
npm test
npm run preview
```

在浏览器打开 `output/preview.html`。此预览无需 Android SDK，内置 **125 个演示词条**；演示数据不代表经核实的考研真题词频或重点义项。

## Android 构建

在 [GitHub Actions · Android APK](https://github.com/Alioth-31/Word-World/actions/workflows/build-apk.yml) 选择 **Run workflow**。成功运行后，在该次运行的 **Artifacts** 中获取调试版 APK。

Windows 也可以安装 Node.js 22+、JDK 21+ 和 Android SDK，然后运行 `build-android.cmd`；成功时输出 `output/word-world-debug.apk`。

> 目前未提供经过真机验收的正式发行版 APK。完整词库在构建阶段从第三方来源获取，可能受网络、数据来源与许可证限制。Android 工作流需要单独运行；上方 Tests 徽章通过并不代表 APK 编译通过。

## 项目结构

```text
app/                   应用界面、复习逻辑及演示词库
assets/                Android 图标资源
scripts/               词库处理与构建工具
tests/                 自动测试
docs/                  数据许可说明与界面截图
.github/workflows/     自动测试与 Android 构建
```

## 数据、许可与隐私

原创代码采用 [MIT 许可证](LICENSE)。从第三方获取的考研词表、例句及考试材料**不属于本项目 MIT 授权范围**。词汇优先级基于来源数据计算，仍属待验证的启发式排序。

- [数据来源与第三方许可](docs/DATA.md)
- [隐私说明](PRIVACY.md)
- [English documentation](README.en.md)
