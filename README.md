# 单词树1.0 · Word Tree

**把英语单词连成树，一背背一片。**

[![Build and data checks](https://github.com/lyle-alpha-sun/word-tree-1.0/actions/workflows/ci.yml/badge.svg)](https://github.com/lyle-alpha-sun/word-tree-1.0/actions/workflows/ci.yml)

开源的英语词汇学习与词族思维导图工具。围绕一个目标词，同时查看可用词根、同根词、派生词、复数、三单、过去式和分词；点击任何单词继续探索，用一组有联系的词帮助记忆。

**English vocabulary learning · Word family tree · Etymology · Mind map · IELTS vocabulary · Offline macOS app**

[下载 Mac 应用](../../releases/latest) · [English introduction](README.en.md) · [使用指南](docs/USER_GUIDE.md) · [数据来源与许可](THIRD_PARTY_NOTICES.md) · [反馈问题](../../issues)

![单词树 macOS 独立应用：主题目录、词史、词族树和双语例句](docs/macos-app.jpg)

## 适合正在找什么的人？

- 想通过**词根词缀、同根词、词族**串联记忆，而不是只看一张张孤立单词卡。
- 想找能点开和重新展开的**单词树、词汇关系图、英语思维导图**。
- 正在积累**雅思词汇、英语高频词、学术英语词汇**，希望按主题和关联一起学习。
- 想要**本地保存、无需账号、无需付费 API**的背单词工具。
- 想找一个可修改的 **React + TypeScript + React Flow** 英语学习项目，或体积较小的 **Swift / WebKit macOS 桌面应用**。

## 核心功能

### 1. 以目标词为中心，沿关系展开

基本阅读方向为：**左侧词根／上游 → 目标词 → 右侧派生与词形分支**。有可靠记录时可展开同根词。曲线连线连接词条卡片，分词、复数等连在它们对应的原词上。

单击查看释义、音标、词性、例句和词史；双击把该词设为新的中心，重新展开附近关系。`+ / −` 可以收起或展开分支，阅读视图与看全图用于不同大小的词族。

例如：`write → wrote / written / writing`，或从 `art` 探索 `artist → artistic`。`medium` 页区分 `media` 的媒介义复数与 `mediums`。

### 2. 主题目录和词族目录

提供 18 个主题分类，例如自然与环境、生活与健康、科学与技术、工业与工程、经济与金融、商业与工作、政治与法律、历史与文化等。

目录可以收起、滚动和筛选，并展示单词及中文释义。主搜索、图中选词和右栏关联词链接会与目录定位联动，不必一直逐组翻页。大主题用于找词，树页根据有依据的词语关系组织；无关系的词独立展示。

### 3. 高频词优先

公开版将目标词与 **NGSL 1.2 及其官方补充表**对照，可切换“全部 / 高频优先 / 其余词”。匹配原词及词典明确记载的原形，匹配结果按优先级排列。

目前 **1,837 个目标词**进入高频优先，其余 **3,193 个**保留在完整词库中。这是本词库中的通用英语高频对照，不是 IELTS 官方考试频次统计，也不承诺考试押题。

### 4. 词史、释义与语境

词史区域展示已有的语言来源、借入链和旧义；长内容可滚动、折叠。右栏提供中文释义、已收录搭配、双语例句和可点击的关联词。词条有已有音标、词性标记及系统朗读入口。

相关词、语法变化与词根／借词来源分别标识：词形相似或 WordNet 关联，不自动等于同一个词根。原始资料仍可能有歧义或错误，欢迎附来源反馈。

### 5. 独立 Mac 应用与本地学习记录

Mac 版有自己的窗口、Dock 图标和菜单，词库随应用打包；不需要先启动开发服务器。网页版可在本地浏览器运行。

支持收藏、标记已掌握，以及 JSON 进度导入／导出。没有账号系统、云同步或广告服务。Mac 版与网页版分别保存记录，可通过进度文件迁移。

## 1.0 数据规模

| 内容 | 数量 |
| --- | ---: |
| 目标词 | 5,030 |
| 关联扩展词及词形 | 15,710 |
| 总词条 | 20,740 |
| 主题分类 | 18 |
| 词语关系 | 15,527 |
| 已有词史记录 | 1,913 |
| 公开版高频优先目标词 | 1,837 |

词库包含带 IELTS 标签的目标词及相关扩展，**不代表官方雅思词汇大纲**。词史尚未覆盖所有词；已有例句与词典数据也需要持续校订。1.0 提供关联探索、收藏和掌握标记，暂未实现间隔重复算法、自动复习计划或移动端原生应用。

## 下载 Mac 应用

1. 打开 [Releases](../../releases/latest)，下载 `WordTree-1.0-macOS-arm64.zip`。
2. 解压，将 `单词树.app` 放入应用程序目录，双击打开。
3. 想迁移网页进度：先在网页“导出进度”，再在应用“导入进度”。

当前安装包面向 **Apple Silicon Mac**。编译目标为 macOS 13 起，实机验证环境为 macOS 26.6.2；其他系统版本尚未验证。公开包尚未经过 Apple Developer ID 公证，系统可能提示无法验证开发者；也可以按下方步骤从源码构建。

应用核心界面和词库可离线使用；外部来源网页需要联网，离线朗读取决于系统是否安装相应英语语音。

## 本地运行网页版

准备 Node.js 24 LTS（最低 20.19 或 22.12+），然后运行：

```bash
git clone https://github.com/lyle-alpha-sun/word-tree-1.0.git
cd word-tree-1.0
npm ci
npm run dev
```

打开 `http://127.0.0.1:5178/`。词库已放在 `public/data/`，无需购买 API、配置密钥或下载个人开发资料。

构建与检查：

```bash
npm run check:data
npm run build
npm run preview
```

## 自己构建 Mac 应用

在 Apple Silicon Mac 安装 Xcode Command Line Tools，准备 Python 3 与 Node.js：

```bash
npm ci
npm run build:mac
```

输出为 `release/单词树.app`。桌面窗口使用 macOS AppKit / WebKit，不内置 Electron 或 Node 运行时。Web 前端在其他平台可通过浏览器运行；目前没有提供 Windows、Linux 或 Intel Mac 安装包。

## 项目结构

```text
src/                  React 页面、词族图、目录与学习记录
public/data/          已整理的词条、关系、主题、例句、词史和高频对照
desktop/              Swift 原生窗口及图标生成源码
scripts/              数据校验、高频对照和 Mac 打包工具
data-sources/ngsl/    NGSL 原始公开词表及补充表
licenses/             第三方资料许可副本
docs/                 使用说明、数据说明与截图
```

## 数据与许可证

原创程序代码使用 [MIT License](LICENSE)。第三方词典、词语关系、例句、词史与高频词表保留各自来源、署名和许可证，**不因本仓库的代码许可而变成 MIT 数据**。详细清单和修改说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与 [数据说明](docs/DATA.md)。

公开版高频对照使用可再分发的 NGSL 数据；未打包 AWL 词表及其匹配结果。个人学习记录、私人工作日志、缓存、备份、账号信息及开发机器路径不属于发布内容。

## 参与改进

欢迎提交词义／音标修正、词族关系来源、分类建议、界面改进和跨平台适配。反馈数据问题时，请说明单词、当前显示、建议改法及可核查来源；尽量区分“派生”“词形变化”“词根／借词”与一般相关词。

更多说明见 [CONTRIBUTING.md](CONTRIBUTING.md)。喜欢这个方向也欢迎 Star，让更多想找**词根背单词、词族树、雅思词汇导图、开源离线背单词软件**的人发现这个项目。
