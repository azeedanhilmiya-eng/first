"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { IdeationOutput } from "@/agents/ideation";
import {
  AlertTriangle,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { C } from "./theme";

const COMPETITION_OPTIONS = [
  '中国国际"互联网+"大学生创新创业大赛',
  "挑战杯全国大学生课外学术科技作品竞赛",
  "全国大学生创新创业训练计划（大创）",
];

const TRACK_OPTIONS = [
  "高教主赛道",
  "青年红色筑梦之旅赛道",
  "产业命题赛道",
  "乡村振兴方向",
  "教育数字化方向",
  "人工智能方向",
];

const GROUP_OPTIONS = [
  "本科生创意组",
  "本科生创业组",
  "研究生创意组",
  "研究生创业组",
];

const WEEK_OPTIONS = [
  { label: "4 周", value: 4 },
  { label: "6 周", value: 6 },
  { label: "8 周", value: 8 },
  { label: "10 周", value: 10 },
  { label: "12 周", value: 12 },
];

function ScoreBar({
  label,
  value,
  color,
  reason,
}: {
  label: string;
  value: number;
  color: string;
  reason: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: C.textSec }}>
          {label}
        </span>
        <span className="text-xs font-medium" style={{ color }}>
          {value}/10
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(214,188,197,0.35)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <p className="mt-1 text-xs leading-6" style={{ color: C.textSec }}>
        {reason}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-[28px] p-5">
      <div className="skeleton mb-3 h-4 w-3/4 rounded-full" />
      <div className="skeleton mb-2 h-3 w-full rounded-full" />
      <div className="skeleton mb-4 h-3 w-5/6 rounded-full" />
      <div className="space-y-2">
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs" style={{ color: C.textSec }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  border: `1px solid ${C.border}`,
  color: C.text,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.48)",
};

export function IdeationWorkspace() {
  const router = useRouter();
  const [form, setForm] = useState({
    competition: COMPETITION_OPTIONS[0],
    track: TRACK_OPTIONS[0],
    group: GROUP_OPTIONS[0],
    interests: "",
    capabilities: "",
    time_budget_weeks: 12,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(IdeationOutput & { _demo?: boolean }) | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const selectedCandidate = selectedTopic !== null ? result?.candidates[selectedTopic] ?? null : null;

  const recommendationTone = useMemo(() => {
    if (!result) return "填写左侧信息后，AI 会根据赛道和团队能力给出 3 条结构化候选选题。";
    if (result._demo) return "当前显示的是演示样例，接入真实 Key 后会返回真实模型结果。";
    return result.recommendation;
  }, [result]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ideation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          track: form.track,
          group: form.group,
          interests: form.interests,
          capabilities: form.capabilities,
          time_budget_weeks: form.time_budget_weeks,
          extra: `目标赛事：${form.competition}`,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = (await res.json()) as IdeationOutput & { _demo?: boolean };
      setResult(data);
      setSelectedTopic(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-118px)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-card-strong dot-grid-bg animate-fade-up overflow-hidden rounded-[34px] px-6 py-7 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(244,219,227,0.72)", border: `1px solid ${C.border}`, color: C.pinkStrong }}>
                <Sparkles size={12} />
                低饱和白粉主题 · Figma 工作台重构版
              </div>

              <h1 className="mb-3 text-[clamp(28px,4vw,48px)] font-bold leading-[1.12]" style={{ color: C.text }}>
                立项助手
                <br />
                <span className="gradient-text">把模糊方向变成可答辩的选题</span>
              </h1>

              <p className="max-w-2xl text-sm leading-7 md:text-[15px]" style={{ color: C.textSec }}>
                保留 Figma 的工作台信息密度，但把主色调换成更柔和的白色与淡粉色，并且把结果区直接接到 ideation agent。选中候选选题后，就可以继续进入 BP 页面。
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: WandSparkles, title: "实时生成", text: "提交表单后直接返回结构化选题结果", color: C.pinkStrong },
                  { icon: TrendingUp, title: "多维评分", text: "创新、可行、商业三条维度同步展示", color: C.success },
                  { icon: Trophy, title: "直连下一步", text: "候选选题选中后可直接进入 BP 生成", color: C.warning },
                ].map(({ icon: Icon, title, text, color }, index) => (
                  <div key={title} className="glass-card soft-hover animate-fade-up rounded-[24px] p-4" style={{ animationDelay: `${index * 120}ms` }}>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${color}22`, color }}>
                      <Icon size={18} />
                    </div>
                    <div className="mb-1 text-sm font-semibold" style={{ color: C.text }}>
                      {title}
                    </div>
                    <p className="text-xs leading-6" style={{ color: C.textSec }}>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-full min-h-[240px]">
              <div className="animate-float absolute left-6 top-6 h-44 w-44 rounded-full" style={{ background: "rgba(233,192,205,0.42)", filter: "blur(32px)" }} />
              <div className="animate-drift absolute bottom-6 right-8 h-56 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.95)", filter: "blur(20px)" }} />
              <div className="glass-card-strong relative mx-auto max-w-md rounded-[32px] p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: C.text }}>
                      赛道画像
                    </div>
                    <div className="mt-1 text-xs" style={{ color: C.textSec }}>
                      让每个模块都带着“答辩感”，而不是“填表感”。
                    </div>
                  </div>
                  <div className="rounded-full px-3 py-1 text-xs" style={{ background: "rgba(244,219,227,0.72)", color: C.pinkStrong }}>
                    2026 省赛准备中
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ["创新性", "把想法讲成评委能理解的差异化故事"],
                    ["可行性", "把资源、周期和产出收束到 8-12 周内"],
                    ["商业模式", "不只讲概念，还要讲谁买单、为什么付费"],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-[22px] p-4" style={{ background: "rgba(255,255,255,0.78)", border: `1px solid ${C.border}` }}>
                      <div className="mb-1 text-sm font-medium" style={{ color: C.text }}>
                        {title}
                      </div>
                      <div className="text-xs leading-6" style={{ color: C.textSec }}>
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="glass-card-strong animate-fade-up rounded-[30px] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb size={18} style={{ color: C.pinkStrong }} />
                <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>
                  立项配置
                </h2>
              </div>

              <div className="space-y-4">
                <div className="glass-card rounded-[24px] p-4">
                  <h3 className="mb-3 text-xs font-medium" style={{ color: C.textSec }}>
                    赛事信息
                  </h3>
                  <div className="space-y-3">
                    <Field label="目标赛事">
                      <select value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} className="w-full rounded-2xl px-3 py-2.5 text-sm outline-none" style={inputStyle}>
                        {COMPETITION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="赛道方向">
                      <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className="w-full rounded-2xl px-3 py-2.5 text-sm outline-none" style={inputStyle}>
                        {TRACK_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="参赛组别">
                      <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} className="w-full rounded-2xl px-3 py-2.5 text-sm outline-none" style={inputStyle}>
                        {GROUP_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="glass-card rounded-[24px] p-4">
                  <h3 className="mb-3 text-xs font-medium" style={{ color: C.textSec }}>
                    团队信息
                  </h3>
                  <div className="space-y-3">
                    <Field label="兴趣方向 / 专业背景">
                      <textarea
                        value={form.interests}
                        onChange={(e) => setForm({ ...form, interests: e.target.value })}
                        rows={3}
                        placeholder="例如：信息工程学院大二，对 AI Agent、教育科技、校园应用感兴趣"
                        className="w-full resize-none rounded-2xl px-3 py-2.5 text-sm outline-none"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="现有能力 / 技术栈 / 资源">
                      <textarea
                        value={form.capabilities}
                        onChange={(e) => setForm({ ...form, capabilities: e.target.value })}
                        rows={3}
                        placeholder="例如：熟悉 Next.js、Python、Figma；队内 1 人负责设计"
                        className="w-full resize-none rounded-2xl px-3 py-2.5 text-sm outline-none"
                        style={inputStyle}
                      />
                    </Field>

                    <div>
                      <label className="mb-2 block text-xs" style={{ color: C.textSec }}>
                        可投入周数
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WEEK_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setForm({ ...form, time_budget_weeks: option.value })}
                            className="soft-hover rounded-2xl px-4 py-2 text-sm"
                            style={{
                              background: form.time_budget_weeks === option.value ? "var(--gradient-primary)" : "rgba(255,255,255,0.72)",
                              color: form.time_budget_weeks === option.value ? "white" : C.textSec,
                              border: `1px solid ${C.border}`,
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="pulse-glow soft-hover flex w-full items-center justify-center gap-2 rounded-[22px] px-4 py-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      生成中…
                    </>
                  ) : (
                    <>
                      <WandSparkles size={16} />
                      生成候选选题
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            <div className="glass-card-strong animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "120ms" }}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>
                    候选选题推荐
                    {result && (
                      <span className="ml-2 rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(146,184,173,0.22)", color: C.success }}>
                        {result.candidates.length} 条已生成
                      </span>
                    )}
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: C.textSec }}>
                    结果区保留 Figma 的卡片式浏览体验，但整体改成了更柔和的白粉色系。
                  </p>
                </div>

                {result && (
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="soft-hover flex items-center gap-1.5 rounded-full px-3 py-2 text-xs"
                    style={{ background: "rgba(255,255,255,0.82)", color: C.textSec, border: `1px solid ${C.border}` }}
                  >
                    <RefreshCw size={12} />
                    换一批
                  </button>
                )}
              </div>

              {result?._demo && (
                <div className="mb-4 rounded-[20px] px-4 py-3 text-sm" style={{ background: "rgba(244,219,227,0.72)", border: `1px solid ${C.border}`, color: C.pinkStrong }}>
                  当前处于演示模式，页面显示的是预置样例输出。
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-[20px] px-4 py-3 text-sm" style={{ background: "rgba(212,143,156,0.14)", border: "1px solid rgba(212,143,156,0.32)", color: C.danger }}>
                  {error}
                </div>
              )}

              {loading ? (
                <div className="space-y-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {result.candidates.map((topic, idx) => (
                    <div
                      key={`${topic.title}-${idx}`}
                      className="glass-card soft-hover animate-fade-up cursor-pointer rounded-[28px] p-5"
                      style={{
                        animationDelay: `${idx * 120}ms`,
                        background: selectedTopic === idx ? "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,219,227,0.86))" : "rgba(255,255,255,0.72)",
                        border: `1px solid ${selectedTopic === idx ? C.borderStrong : C.border}`,
                      }}
                      onClick={() => setSelectedTopic(idx)}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {idx === 0 && (
                              <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong }}>
                                推荐优先
                              </span>
                            )}
                            <span className="text-xs" style={{ color: C.textSec }}>
                              选题 {idx + 1}
                            </span>
                          </div>
                          <h3 className="text-[17px] font-semibold leading-8" style={{ color: C.text }}>
                            {topic.title}
                          </h3>
                        </div>
                        {selectedTopic === idx && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: "var(--gradient-primary)" }}>
                            ✓
                          </div>
                        )}
                      </div>

                      <p className="mb-4 text-sm leading-7" style={{ color: C.textSec }}>
                        {topic.one_liner}
                      </p>

                      <div className="mb-4 space-y-3">
                        <ScoreBar label="创新性" value={topic.innovation.score} reason={topic.innovation.reason} color={C.pinkStrong} />
                        <ScoreBar label="可行性" value={topic.feasibility.score} reason={topic.feasibility.reason} color={C.success} />
                        <ScoreBar label="商业价值" value={topic.business.score} reason={topic.business.reason} color={C.warning} />
                      </div>

                      {topic.similar_awards.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {topic.similar_awards.map((award) => (
                            <span key={award} className="rounded-full px-3 py-1 text-xs" style={{ background: "rgba(255,255,255,0.82)", border: `1px solid ${C.border}`, color: C.textSec }}>
                              {award}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-medium" style={{ color: C.textSec }}>
                            MVP 范围
                          </p>
                          <ul className="space-y-1.5">
                            {topic.mvp_scope.map((item) => (
                              <li key={item} className="flex gap-2 text-xs leading-6" style={{ color: C.textSec }}>
                                <span style={{ color: C.success }}>•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-medium" style={{ color: C.textSec }}>
                            关键风险
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {topic.risks.map((risk) => (
                              <span key={risk} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs" style={{ background: "rgba(212,143,156,0.12)", color: C.danger }}>
                                <AlertTriangle size={10} />
                                {risk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="gradient-border animate-fade-up flex items-center gap-4 rounded-[28px] p-5" style={{ animationDelay: "300ms" }}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong }}>
                      <Trophy size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: C.text }}>
                        {selectedCandidate ? `已选择：${selectedCandidate.title}` : "等待选择推荐选题"}
                      </p>
                      <p className="mt-1 text-xs leading-6" style={{ color: C.textSec }}>
                        {selectedCandidate ? result.recommendation : recommendationTone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/workspace/bp")}
                      className="pulse-glow soft-hover flex items-center gap-1.5 rounded-[18px] px-4 py-3 text-sm text-white"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      进入 BP 生成
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed" style={{ borderColor: C.border }}>
                  <Lightbulb size={40} className="mb-3" style={{ color: C.textSoft }} />
                  <p className="max-w-md text-center text-sm leading-7" style={{ color: C.textSec }}>
                    填写左侧表单后，AI 会在这里展示 3 条候选选题，以及对应的评分、MVP 范围和关键风险。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
