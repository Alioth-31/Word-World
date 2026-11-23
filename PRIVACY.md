# 隐私说明 / Privacy

[简体中文](#简体中文) · [English](#english)

## 简体中文

Word World 无需注册账户。当前公开源码不包含广告 SDK、遥测分析 SDK 或由本项目运营的学习数据服务器。单词学习状态、收藏和偏好保存在设备本地。

- **备份**：导出时生成 JSON 文件，保存与分享由用户自行决定；导入会读取用户选定的文件。
- **联网**：第三方完整词库在**构建阶段**下载，基础学习流程不要求在线账户。发音使用设备或浏览器的语音服务；具体是否联网取决于系统语音引擎。
- **数据保留**：卸载应用或清除应用数据可能删除本地记录；请提前导出备份。目前没有自动跨设备同步。

本说明对应当前仓库源码。如果分支或分发版本增加网络服务、分析功能或其他 SDK，应同步修订此说明。

## English

Word World does not require an account. The current published source contains no advertising SDK, analytics telemetry SDK, or project-operated server for study records. Study progress, bookmarks, and preferences are kept locally on the device.

- **Backups:** Export creates a JSON file. The user chooses where to store or share it; import reads a file selected by the user.
- **Network:** Full third-party datasets are downloaded **at build time**, not as part of ordinary studying. Pronunciation uses the device or browser speech engine; the engine itself may use network services.
- **Retention:** Uninstalling or clearing app data may delete local progress. Export a backup first. Automatic cross-device synchronization is not currently implemented.

This notice describes the published source as it stands. Any variant that adds remote services, analytics, or other SDKs should update its privacy notice accordingly.
