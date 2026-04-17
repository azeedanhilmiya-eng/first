import type { IdeationOutput } from "@/agents/ideation";

export const DEMO_IDEATION: IdeationOutput = {
  candidates: [
    {
      title: "赛道官 · 竞赛孵化 AI Agent",
      one_liner: "面向大学生参赛队的 AI 助手，覆盖立项→BP→原型→路演全链路。",
      innovation: {
        score: 9,
        reason:
          "首个将 Coding Agent + 评审维度 RAG 结合的大学生竞赛专用 Agent，对标 Cursor/Claude Code 的应用层产品。",
      },
      feasibility: {
        score: 8,
        reason: "Next.js + Claude API 单人可行，12 周可交付 4 个核心模块。",
      },
      business: {
        score: 7,
        reason: "B 端面向双创学院，C 端学生订阅；校级年费 3-8 万，国内 2000+ 高校。",
      },
      similar_awards: ["2024 挑战杯「魔法笔记」金奖（多模态学习平台）"],
      mvp_scope: ["立项助手", "BP 生成", "评审模拟", "往届获奖 RAG"],
      risks: ["数据质量依赖公开语料", "高校采购周期长"],
    },
    {
      title: "校园二手书 AI 定价助手",
      one_liner: "学生上传书名/图片，Agent 给出合理回收/售卖价与同校匹配买家。",
      innovation: {
        score: 6,
        reason: "已有闲鱼/孔夫子，但无校内专用 + AI 定价差异化。",
      },
      feasibility: { score: 9, reason: "数据源（当当/孔夫子）公开，2 周能做 MVP。" },
      business: {
        score: 5,
        reason: "高频低客单，靠流量变现，竞争激烈。",
      },
      similar_awards: [],
      mvp_scope: ["图片识书", "历史成交价", "校内挂牌/撮合"],
      risks: ["校内用户密度不足"],
    },
    {
      title: "信工学院课程 AI 答疑助手",
      one_liner: "基于学院课件和历年考题训练的学科专属 RAG 助手。",
      innovation: {
        score: 5,
        reason: "通用 AI 答疑已多，但学院定制+教师审核是差异点。",
      },
      feasibility: { score: 7, reason: "需要拿到课件授权，技术本身不难。" },
      business: {
        score: 6,
        reason: "可做成学院级教辅服务，但扩张依赖一个个学院谈。",
      },
      similar_awards: ["2023 互联网+ 省赛「学科 AI 助教」银奖"],
      mvp_scope: ["课件入库", "答疑对话", "教师审核后台"],
      risks: ["版权授权", "与 ChatGPT 等通用模型的替代风险"],
    },
  ],
  recommendation:
    "推荐 1 号：技术亮点（Agent+RAG）贴合 2026 互联网+ 人工智能+ 专项；自己就是自己的用户，可路演时现场演示闭环，叙事最强。",
};
