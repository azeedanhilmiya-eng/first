import {
  AlertTriangle,
  MessageSquareText,
  ShieldQuestion,
  Star,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { C } from "@/app/_components/theme";

const JUDGES = [
  {
    name: "技术评委",
    tone: "会追问方案是否真的可落地，尤其关注系统边界和实现节奏。",
    score: 82,
    color: C.pinkStrong,
    questions: [
      "为什么这个方向一定要做成平台，而不是一个课程包或工具集？",
      "12 周里你们最先上线的三个功能是什么？",
    ],
  },
  {
    name: "商业评委",
    tone: "更看重谁付费、为什么现在会买，以及你的证据链是否成立。",
    score: 76,
    color: C.warning,
    questions: [
      "第一批客户究竟是学校、培训机构还是企业？",
      "如果没有 B 端预算，你们怎么证明有人愿意持续使用？",
    ],
  },
  {
    name: "教育评委",
    tone: "重点会看项目是否真的理解教学场景，而不是仅仅套一个 AI 外壳。",
    score: 84,
    color: C.success,
    questions: [
      "与普通线上课程相比，你们的教学效果提升体现在哪？",
      "项目如何证明能降低实验风险或提升操作规范？",
    ],
  },
];

export default function ReviewPage() {
  return (
    <div className="min-h-[calc(100vh-118px)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-card-strong dot-grid-bg animate-fade-up rounded-[34px] p-6 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong, border: `1px solid ${C.border}` }}>
                <MessageSquareText size={12} />
                评审模拟
              </div>
              <h1 className="text-[clamp(24px,4vw,38px)] font-semibold leading-[1.12]" style={{ color: C.text }}>
                提前感受评委会怎么问
                <br />
                <span className="gradient-text">你就不会在台上第一次听到这些问题</span>
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: C.textSec }}>
                这一页接住了 Figma 的评审模块设想，用不同角色评委的视角去模拟压力测试，让 BP、原型和 PPT 都能更早补洞。
              </p>
            </div>

            <div className="glass-card rounded-[28px] p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={15} style={{ color: C.success }} />
                <div className="text-sm font-medium" style={{ color: C.text }}>
                  当前总体表现
                </div>
              </div>
              <div className="mb-3 text-5xl font-semibold gradient-text">80</div>
              <div className="space-y-3">
                {[
                  ["项目表达", 84, C.pinkStrong],
                  ["证据链完整度", 71, C.warning],
                  ["落地可信度", 79, C.success],
                ].map(([label, value, color]) => (
                  <div key={String(label)}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: C.textSec }}>{label}</span>
                      <span style={{ color: C.text }}>{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(214,188,197,0.24)" }}>
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: String(color) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {JUDGES.map((judge, index) => (
            <div
              key={judge.name}
              className="glass-card soft-hover animate-fade-up rounded-[30px] p-5"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px]" style={{ background: `${judge.color}22`, color: judge.color }}>
                    <UserRound size={16} />
                  </div>
                  <div>
                    <div className="text-base font-semibold" style={{ color: C.text }}>
                      {judge.name}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: C.textSec }}>
                      {judge.tone}
                    </div>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs" style={{ background: `${judge.color}18`, color: judge.color }}>
                  {judge.score} 分
                </span>
              </div>

              <div className="space-y-3">
                {judge.questions.map((question) => (
                  <div key={question} className="rounded-[22px] p-4" style={{ background: "rgba(255,255,255,0.76)", border: `1px solid ${C.border}` }}>
                    <div className="mb-2 inline-flex items-center gap-2 text-xs" style={{ color: C.pinkStrong }}>
                      <ShieldQuestion size={12} />
                      高频追问
                    </div>
                    <p className="text-sm leading-7" style={{ color: C.textSec }}>
                      {question}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="glass-card-strong animate-fade-up rounded-[32px] p-6" style={{ animationDelay: "200ms" }}>
            <h2 className="mb-5 text-lg font-semibold" style={{ color: C.text }}>
              当前最需要补的两处
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "证据链不够实",
                  desc: "需要用真实采访、合作意向、采购逻辑或试点反馈来支撑商业模式，不然容易被认为只是概念包装。",
                },
                {
                  title: "专业可信度仍可增强",
                  desc: "建议补上安全教育导师、合作单位或课程负责人，让项目与真实场景的连接更明确。",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] p-5" style={{ background: "rgba(255,255,255,0.78)", border: `1px solid ${C.border}` }}>
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle size={15} style={{ color: C.warning }} />
                    <div className="text-base font-medium" style={{ color: C.text }}>
                      {item.title}
                    </div>
                  </div>
                  <p className="text-sm leading-7" style={{ color: C.textSec }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "280ms" }}>
            <div className="mb-4 flex items-center gap-2">
              <Star size={15} style={{ color: C.pinkStrong }} />
              <h2 className="text-base font-semibold" style={{ color: C.text }}>
                答辩建议
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-7" style={{ color: C.textSec }}>
              <p>先讲痛点，再讲方案，最后才讲功能。</p>
              <p>不要把“AI”当主角，主角应该是场景价值和解决结果。</p>
              <p>每个结论尽量带一个可验证依据，哪怕只是小规模访谈也比空话更强。</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
