# Word World

[![License: MIT](https://img.shields.io/badge/Code%20License-MIT-blue.svg)](LICENSE)

面向考研英语（一）的离线词汇学习应用，提供语境学习、主动回忆、间隔复习及按考试价值排序的词库。应用采用 Capacitor 封装 Android，核心界面由原生 Web 技术实现。

> 当前仓库包含可运行的 125 词示例数据。完整考研词库由构建脚本从第三方资料生成，其许可与本项目代码的 MIT 许可不同。有关数据来源及使用限制，请参阅 [第三方材料](THIRD_PARTY.md)。

## 功能

- 今日学习：区分到期复习和新词学习。
- 沉浸学习：先回忆单词，再揭示词义与语境，最后评价记忆程度。
- 词库：支持英文或中文搜索、重要性筛选、排序和收藏。
- 复习：Android 构建使用 `ts-fsrs`；无需依赖的单文件演示使用简化调度器。
- 数据：学习记录保存在本机，可导入和导出 JSON 备份。

## 项目结构

```text
app/                    应用源码及内置演示数据
  assets/               图标
  data/                 运行时词库
  js/                   学习逻辑与复习调度适配
assets/                 Android 图标源文件
data/                   词库演示数据源
scripts/                数据处理和预览构建脚本
tests/                  Node.js 自动化测试
.github/workflows/      Android 构建流程
build-android.cmd       Windows 构建入口
```

## 本地运行

安装 Node.js 22 或更新版本后，在项目目录执行：

```bash
npm test
npm run preview
```

在浏览器打开 `output/preview.html`，即可使用示例词汇体验学习流程。预览不需要下载 Android SDK。

## 构建 Android 安装包

### GitHub Actions

仓库的 **Actions → Android APK → Run workflow** 可构建测试用 APK。生成的 APK 可在对应的工作流运行页面 **Artifacts** 中获取。CI 会尝试下载完整词表和英语（一）语料，并生成相应的优先级数据。

### Windows

本机需要 Node.js 22+、JDK 21+、Android SDK，随后运行 `build-android.cmd`。成功后安装包位于 `output/word-world-debug.apk`。

### 命令行

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx capacitor-assets generate --android --assetPath assets --iconBackgroundColor "#14272e" --splashBackgroundColor "#14272e"
cd android
./gradlew assembleDebug
```

`npm run build` 会下载考研词库与可用的考试语料。需要离线构建时，可将来源数据放入 `sources/`；详见 [数据说明](docs/data.md)。

需要从本机一次性创建 GitHub 仓库并上传源码时，可安装 GitHub CLI 并完成 `gh auth login`，随后运行 `scripts/publish-github.cmd`。该脚本将创建公开的 `word-world` 仓库并推送初始提交。脚本将使用与个人身份无关的通用提交者署名，不读取本机 Git 配置的真实姓名或邮箱。GitHub 仓库归属账号仍为公开信息。

## 测试与限制

```bash
npm test
```

本仓库的测试覆盖主要学习流程和词库优先级计算。当前没有在此仓库中提供经过真机验收的正式签名发行包。

考研词汇重要性排序是基于来源词频、真题样本和难度标签的启发式评分，不是官方考试等级。数据源可能包含转录错误；正文匹配目前未覆盖所有屈折词形与一词多义。跨设备数据同步尚未实现。

## 许可证

本项目原创代码和原创演示内容采用 [MIT License](LICENSE)。第三方依赖、词表与真题资料分别遵守其原始许可（构建 APK 时保留 `app/THIRD_PARTY.txt`），**不因仓库采用 MIT 而转为 MIT**。请阅读 [THIRD_PARTY.md](THIRD_PARTY.md)。