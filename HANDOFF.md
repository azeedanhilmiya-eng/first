# 赛道官 · CompeteAgent 交接文档

> 本文档用于在不同 AI 编程助手（Claude Code / Codex / Cursor 等）之间交接项目上下文。
> 任何新助手开工前先读这份。

## 项目背景

面向中国"互联网+"大学生创新创业大赛 2026 省赛（7–8 月窗口）的 AI Agent 平台，帮本科团队完成 **选题 → BP → 原型 → 评审模拟 → 路演** 全链路。

- **主攻赛事**：中国国际"互联网+"大学生创新创业大赛
- **首批用户**：本校信息工程学院参赛队（约 20 队）
- **节奏**：单人 3 个月 MVP → 本院试用 → 报名参赛

## 仓库与部署

- **仓库**：`azeedanhilmiya-eng/first`
- **主开发分支**：`claude/review-repo-contents-r5zqo`
- **Figma 前端分支**：用户新建的另一分支（Figma 生成的 UI 代码，尚未并入主线）
- **Next.js 代码目录**：`compete-agent/`（Vercel Root Directory 设为此子目录）
- **线上预览**：https://first-mauve-eta.vercel.app/
- **LLM**：OpenAI 兼容 SDK + codeflow.asia 代理；模型 `gpt-5.4-mini`
- **Vercel 环境变量（已配）**：
  - `LLM_API_KEY`
  - `LLM_BASE_URL=https://codeflow.asia/v1`
  - `LLM_MODEL=gpt-5.4-mini`

## 技术栈

Next.js 15 App Router · OpenAI SDK · Zod · YAML rubric · Supabase pgvector（后续）· 当前纯内联样式（UI 重做时改 shadcn/ui + Tailwind）

## 进度表

| 状态 | 模块 | 位置 | 备注 |
|---|---|---|---|
| ✅ 完成 | 项目脚手架（Next.js 15 + 懒加载 LLM 客户端 + 演示模式） | `compete-agent/` | 无 key 时返回样例；build 不再要求 env |
| ✅ 完成 | 立项助手 后端 | `agents/ideation.ts` + `app/api/ideation/route.ts` | Zod 强校验 3 候选选题 |
| ✅ 完成 | 立项助手 前端（极简版） | `app/page.tsx` | 内联样式、功能通、颜值差 |
| ✅ 完成 | 互联网+ 评审 rubric | `data/rubrics/huliuwangjia.yaml` | 5 维度 + 评委人格 |
| ✅ 完成 | Vercel 部署流水线 | `vercel.json` + `next.config.ts` | 已解决 Root Directory / 构建期 env 报错 |
| ✅ 完成 | UI 视觉蓝图 | `/root/.claude/plans/modular-soaring-nebula.md` | 含 Stitch/Figma 提示词 |
| ✅ 完成 | Figma 前端稿转代码 | Figma 分支 | 用户已上传到 first 仓库另一分支 |
| 🚧 进行中 | **将 Figma 代码合进 `compete-agent/`** | 待做 | 抽 design tokens → `app/tokens.css`；用 shadcn/ui 替换内联样式；先重做立项助手页 |
| ⏳ 待做 | BP 生成 Agent（P0） | `agents/bp-writer.ts`（空） | 按 5 维度生成，双栏 Markdown 编辑 |
| ⏳ 待做 | 登录/注册 | Supabase Auth | 校园邮箱优先，GitHub 第三方，微信占位 |
| ⏳ 待做 | 仪表盘（我的项目列表 / Token 用量） | `app/dashboard/` | |
| ⏳ 待做 | 项目工作台（5 模块 Tab） | `app/project/[id]/` | |
| ⏳ 待做 | 原型脚手架 Agent（P1） | `agents/scaffolder.ts` | 三模板：Next.js / FastAPI / 小程序 |
| ⏳ 待做 | 评审模拟 Agent（P1） | `agents/reviewer.ts` | 三角色评委聊天 + 雷达图 |
| ⏳ 待做 | PPT 大纲 Agent（P2） | `agents/pitch.ts` | 10 页缩略图 + 大图编辑 |
| ⏳ 待做 | 往届获奖 RAG（pgvector） | 侧边抽屉 | 数据源：tiaozhanbei.net / B 站路演 |

## 下一步优先级

1. **UI 重做立项助手页**（合并 Figma 分支 → 提取 tokens → shadcn/ui 化）
2. **BP 生成 Agent**（与立项助手同构：prompts + agent + route + page）
3. 登录 + 仪表盘（铺开多项目骨架）

## 关键约束 & 已踩坑

- OpenAI SDK **不能在模块顶层实例化**（构建期 env 不存在会炸）→ 必须用 `getLLM()` 懒加载，见 `compete-agent/lib/llm.ts`
- Vercel Root Directory **必须**设为 `compete-agent`，Production Branch 设为 `claude/review-repo-contents-r5zqo`
- API 路由要读 `data/**/*.yaml` → `next.config.ts` 里配了 `outputFileTracingIncludes`
- 不要把 API key 写进代码/提交；`.env.local` 仅本地
- 设计风格：深色 `#0B1020` 底 + `#3B82F6 → #8B5CF6` 渐变，移动端优先

## 给新助手的开工指令

先 `git pull` 拿到最新分支，然后：

1. 看 `compete-agent/agents/ideation.ts` 理解现有 Agent 模式（system prompt + Zod schema + chat.completions JSON mode）
2. 看 Figma 分支的组件目录，挑出 Button / Card / Input / 渐变 CTA
3. 在 `compete-agent` 里建 `app/tokens.css` + 装 Tailwind + shadcn/ui
4. 重写 `app/page.tsx` 为工作台骨架，把立项表单接进去
5. 开始写 `agents/bp-writer.ts`（照 ideation 抄结构）

## 文件索引

```
first/
├── HANDOFF.md                       ← 本文件
├── README.md
└── compete-agent/                   ← Next.js 应用
    ├── agents/
    │   ├── ideation.ts              ← 立项 Agent（完成）
    │   └── ideation-demo.ts         ← 无 key 时的演示样例
    ├── app/
    │   ├── page.tsx                 ← 立项助手前端（待美化）
    │   └── api/ideation/route.ts    ← 立项 API
    ├── data/rubrics/
    │   └── huliuwangjia.yaml        ← 互联网+ 5 维度评分标准
    ├── lib/
    │   ├── llm.ts                   ← 懒加载 OpenAI 客户端
    │   └── rubric.ts                ← rubric 加载器
    ├── prompts/
    │   └── ideation.ts              ← 立项 system prompt
    ├── next.config.ts
    ├── vercel.json
    └── package.json
```
