"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Download,
  FileText,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import { C } from "@/app/_components/theme";

const DIMENSIONS = [
  { key: "innovation", label: "创新性", weight: "25%" },
  { key: "team", label: "团队情况", weight: "20%" },
  { key: "commercial", label: "商业模式", weight: "25%" },
  { key: "feasibility", label: "可行性", weight: "15%" },
  { key: "impact", label: "社会价值", weight: "15%" },
];

const BP_CONTENT: Record<string, { title: string; sections: string[] }> = {
  innovation: {
    title: "一、创新性",
    sections: [
      "项目将安全教育从传统题库训练改造成情景化微学习产品，把课前预习、课中操作与课后考核串成同一条闭环体验。",
      "相比普通 LMS，本方案更强调工训场景中的真实风险识别，具有明显的专业场景差异化。",
      "MVP 先聚焦实验室与工训车间的高频事故点，用更小的功能面换取更强的展示完成度。",
    ],
  },
  team: {
    title: "二、团队情况",
    sections: [
      "团队成员由信息工程、设计和运营方向组成，能够完成从界面原型到演示内容包装的主要工作。",
      "如果补上一位安全教育导师或合作单位老师，答辩时的可信度会明显增强。",
      "当前执行优势在于开发和视觉效率较高，适合 12 周内做出完整且可演示的版本。",
    ],
  },
  commercial: {
    title: "三、商业模式",
    sections: [
      "前期以高校实验安全培训和企业新员工入职培训为核心客户，通过账号订阅与课程包授权收费。",
      "后续可扩展到行业培训机构与校企共建课程，形成内容授权 + 平台服务的双轮模型。",
      "需要在答辩中补足采购决策链与预算来源，避免商业化叙述停留在愿景层面。",
    ],
  },
  feasibility: {
    title: "四、可行性分析",
    sections: [
      "现阶段最适合先做 Web 演示版本，优先完成课程首页、风险识别互动和学习记录后台三块。",
      "技术路径上可直接用 Next.js 完成交互原型，再结合视频或动效增强答辩展示。",
      "在时间约束下，应减少大而全的平台叙述，聚焦 2 到 3 个高质量核心场景。",
    ],
  },
  impact: {
    title: "五、社会价值与引领性",
    sections: [
      "高校实验安全教育与职业培训都存在内容枯燥、到课率低、考核效果弱的问题，本项目有现实切口。",
      "如果能把“减少事故、提升规范、强化岗位上手能力”转化成更直观的成效指标，答辩说服力会更强。",
      "项目有机会成为校内工训中心与企业培训部门合作的数字化样板。",
    ],
  },
};

const SIMILAR_CASES = [
  { title: "实验室安全微课平台", label: "2025 校赛金奖", score: "92%" },
  { title: "职业培训交互式学习系统", label: "2024 省赛银奖", score: "85%" },
  { title: "工训课堂风险模拟项目", label: "2025 创新训练立项", score: "81%" },
];

export default function BPPage() {
  const [active, setActive] = useState("innovation");
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const content = useMemo(() => BP_CONTENT[active], [active]);

  return (
    <div className="min-h-[calc(100vh-118px)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_300px]">
        <section className="glass-card-strong animate-fade-up rounded-[34px] p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong, border: `1px solid ${C.border}` }}>
                <Sparkles size={12} />
                BP 生成器
              </div>
              <h1 className="text-[clamp(24px,4vw,38px)] font-semibold leading-[1.12]" style={{ color: C.text }}>
                把选题卡片
                <br />
                <span className="gradient-text">推进成可答辩的商业计划书框架</span>
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: C.textSec }}>
                这一页已经不是空入口了。现在可以在五个评分维度之间切换，查看生成中的 BP 内容、相似案例和导出位。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="soft-hover inline-flex items-center gap-2 rounded-[18px] px-4 py-3 text-sm" style={{ background: "rgba(255,255,255,0.78)", color: C.text, border: `1px solid ${C.border}` }}>
                <RefreshCw size={14} />
                重生成本段
              </button>
              <button className="pulse-glow soft-hover inline-flex items-center gap-2 rounded-[18px] px-4 py-3 text-sm text-white" style={{ background: "var(--gradient-primary)" }}>
                <Download size={14} />
                导出 Word / PDF
              </button>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-[24px] p-4" style={{ background: "rgba(255,255,255,0.76)", border: `1px solid ${C.border}` }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px]" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong }}>
              <Trophy size={18} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: C.text }}>
                已选项目：工训安全微学习平台
              </div>
              <div className="mt-1 text-xs" style={{ color: C.textSec }}>
                教育数字化方向 · 综合评分 83 / 100 · 当前正适合推进 BP 第一版
              </div>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {DIMENSIONS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className="soft-hover rounded-full px-4 py-2 text-sm"
                style={{
                  background: active === item.key ? "rgba(244,219,227,0.86)" : "rgba(255,255,255,0.74)",
                  color: active === item.key ? C.pinkStrong : C.textSec,
                  border: `1px solid ${active === item.key ? C.borderStrong : C.border}`,
                }}
              >
                {item.label} · {item.weight}
              </button>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] p-5" style={{ background: "rgba(255,255,255,0.82)", border: `1px solid ${C.border}` }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium" style={{ color: C.text }}>
                  AI 生成内容
                </div>
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: C.pinkStrong }}>
                  <FileText size={12} />
                  当前维度
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold" style={{ color: C.text }}>
                  {content.title}
                </h2>
                {content.sections.map((section, index) => (
                  <p
                    key={section}
                    className="animate-fade-up text-sm leading-8"
                    style={{ color: C.textSec, animationDelay: `${index * 110}ms` }}
                  >
                    {section}
                  </p>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 border-t pt-4" style={{ borderColor: "rgba(214,188,197,0.32)" }}>
                <span className="text-xs" style={{ color: C.textSec }}>
                  这段内容对你有帮助吗？
                </span>
                <button
                  onClick={() => setVote("up")}
                  className="soft-hover flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: vote === "up" ? "rgba(146,184,173,0.2)" : "rgba(255,255,255,0.74)", border: `1px solid ${vote === "up" ? "rgba(146,184,173,0.5)" : C.border}` }}
                >
                  <ThumbsUp size={13} style={{ color: vote === "up" ? C.success : C.textSec }} />
                </button>
                <button
                  onClick={() => setVote("down")}
                  className="soft-hover flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: vote === "down" ? "rgba(212,143,156,0.18)" : "rgba(255,255,255,0.74)", border: `1px solid ${vote === "down" ? "rgba(212,143,156,0.5)" : C.border}` }}
                >
                  <ThumbsDown size={13} style={{ color: vote === "down" ? C.danger : C.textSec }} />
                </button>
              </div>
            </div>

            <div className="rounded-[28px] p-5" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,237,241,0.9))", border: `1px solid ${C.border}` }}>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen size={15} style={{ color: C.warning }} />
                <div className="text-sm font-medium" style={{ color: C.text }}>
                  实时预览
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-5 shadow-[0_24px_70px_rgba(204,170,183,0.18)]">
                <div className="mb-3 flex items-center gap-2 border-b pb-3" style={{ borderColor: "rgba(214,188,197,0.3)" }}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl text-xs text-white" style={{ background: "var(--gradient-primary)" }}>
                    赛
                  </div>
                  <div className="text-xs" style={{ color: "#74646d" }}>
                    工训安全微学习平台 · 商业计划书草稿
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-[#352d31]">{content.title}</h3>
                  {content.sections.map((section) => (
                    <p key={section} className="text-xs leading-6 text-[#5c5258]">
                      {section}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "160ms" }}>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={15} style={{ color: C.warning }} />
            <div className="text-sm font-medium" style={{ color: C.text }}>
              相似案例
            </div>
          </div>
          <div className="space-y-3">
            {SIMILAR_CASES.map((item, index) => (
              <div key={item.title} className="soft-hover rounded-[22px] p-4" style={{ background: "rgba(255,255,255,0.74)", border: `1px solid ${C.border}` }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong }}>
                    匹配 {item.score}
                  </span>
                  <span className="text-xs" style={{ color: C.textSoft }}>
                    0{index + 1}
                  </span>
                </div>
                <div className="text-sm font-medium leading-6" style={{ color: C.text }}>
                  {item.title}
                </div>
                <div className="mt-1 text-xs" style={{ color: C.textSec }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
