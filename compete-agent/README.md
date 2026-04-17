# 赛道官 · CompeteAgent

大学生竞赛/创新项目孵化 Agent —— 面向中国"互联网+"大学生创新创业大赛等赛事的立项、BP、原型、路演全链路 AI 助手。

## 当前目标

- **主攻赛事**：中国国际"互联网+"大学生创新创业大赛（2026 年 7–8 月省赛窗口）
- **首批用户**：本校信息工程学院参赛队
- **节奏**：3 个月单人 MVP → 本院 20 队试用 → 报名参赛

## 模块

| 优先级 | 模块 | 位置 | 状态 |
|------|------|------|------|
| P0 | 立项助手 | `agents/ideation.ts` | 🚧 脚手架 |
| P0 | BP 生成 | `agents/bp-writer.ts` | ⏳ |
| P1 | 原型脚手架 | `agents/scaffolder.ts` | ⏳ |
| P1 | 评审模拟 | `agents/reviewer.ts` | ⏳ |
| P2 | 答辩 PPT 大纲 | `agents/pitch.ts` | ⏳ |

## 技术栈

- **前端/后端**：Next.js 15（App Router） + Route Handlers
- **LLM**：OpenAI 兼容 SDK，默认经 codeflow.asia 代理（可切官方 OpenAI / Claude 兼容端点）
- **RAG**：Supabase pgvector（数据源 = 公开获奖项目 + 路演/新闻提取）
- **UI**：最小自绘（后期换 shadcn/ui）
- **部署**：Vercel + Supabase 免费额度

## 环境变量（Vercel 配置）

| 变量 | 说明 |
|-----|------|
| `LLM_API_KEY` | API key（codeflow.asia 后台生成） |
| `LLM_BASE_URL` | 代理 base URL，如 `https://codeflow.asia/v1` |
| `LLM_MODEL` | 模型名，如 `gpt-5.4-mini` |

未配置 key 时自动进入演示模式（返回样例输出）。

## 本地开发

```bash
cd compete-agent
cp .env.example .env.local   # 填入 ANTHROPIC_API_KEY
npm install
npm run dev
```

访问 http://localhost:3000 。

## 数据来源

- 脚本爬取公开获奖名单（tiaozhanbei.net、教育部官网等）
- B 站公开路演视频 / 主流媒体获奖报道语料提取
- 不采集非公开 BP，学生私有内容加密存储、不入训

## 完整规划

见仓库根目录外 `/root/.claude/plans/modular-soaring-nebula.md` 或会话中的规划文档。
