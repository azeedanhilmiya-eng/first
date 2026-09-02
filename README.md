# 手机编程指南 / Mobile Programming Guide

## 你能在手机上编程吗？

**可以！** 现在手机上编程已经完全可行，以下是常用的方式：

---

## 推荐工具

### 1. 在线 IDE（浏览器直接使用）

| 工具 | 支持语言 | 说明 |
|------|----------|------|
| [GitHub Codespaces](https://github.com/codespaces) | 全语言 | 云端 VS Code，浏览器直接用 |
| [Replit](https://replit.com) | 全语言 | 手机端支持较好 |
| [StackBlitz](https://stackblitz.com) | JS/TS/Web | 前端开发利器 |
| [CodeSandbox](https://codesandbox.io) | JS/Web | 适合 React/Vue 项目 |

### 2. 手机原生 App

| App | 平台 | 说明 |
|-----|------|------|
| [Termux](https://termux.dev) | Android | 完整 Linux 终端环境 |
| [a-Shell](https://holzschu.github.io/a-Shell_iOS/) | iOS | 支持 Python、JS 等 |
| [iSH](https://ish.app) | iOS | Alpine Linux 模拟器 |
| [Spck Code Editor](https://spck.io) | Android/iOS | 前端开发 |

### 3. SSH 连接远程服务器

通过手机 SSH 客户端（如 **Termius**、**JuiceSSH**）连接云服务器，在服务器上编程：

```bash
# 在手机 SSH 客户端中连接
ssh user@your-server.com

# 然后使用 vim / nano / tmux 正常开发
```

---

## 使用 Termux 快速开始（Android）

```bash
# 安装开发工具
pkg update && pkg upgrade
pkg install git python nodejs

# 克隆项目
git clone https://github.com/your/repo.git

# 开始编码
cd repo
python main.py
```

---

## 使用 Claude Code 在手机上编程

Claude Code 支持通过网页端（[claude.ai/code](https://claude.ai/code)）在手机浏览器中使用，可以：

- 直接对话让 AI 帮你写代码
- 连接 GitHub 仓库进行开发
- 无需本地环境，云端完成所有工作

---

## 建议

- **轻度开发**：用在线 IDE（Replit、Codespaces）
- **重度开发**：SSH 到云服务器 + tmux + vim/neovim
- **Android 用户**：Termux 是最强选择
- **iOS 用户**：a-Shell + iSH 组合使用

手机屏幕小，建议外接蓝牙键盘以提升体验。

---

## C++ 教程系列 / C++ Tutorial Series

**C++: From Beginner to Advanced: Beneath the Abstraction** — 面向有 Python/Java 基础、零 C++ 经验的开发者，讲解代码在内存与硬件/操作系统层面到底发生了什么。

- 目录与阅读路线：[docs/cpp-beneath-the-abstraction/README.md](docs/cpp-beneath-the-abstraction/README.md)
- 每章示例均可编译运行：`cd docs/cpp-beneath-the-abstraction && ./verify.sh`
