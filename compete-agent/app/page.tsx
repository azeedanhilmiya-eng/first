"use client";

import { useMemo, useState } from "react";
import type { IdeationOutput } from "@/agents/ideation";
import {
  AlertTriangle,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

const C = {
  bg: "#0B1020",
  card: "#141A33",
  border: "#2A3656",
  text: "#E6E8EF",
  textSec: "#9AA4BF",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  green: "#10B981",
  yellow: "#FBBF24",
  red: "#F87171",
};

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
  "人工智能方向",
  "教育数字化方向",
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
      <div
        className="h-1.5 overflow-hidden rounded-full"
        style={{ background: `${C.border}60` }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value * 10}%`, background: color }}
        />
      </div>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: C.textSec }}>
        {reason}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="skeleton mb-3 h-4 w-3/4 rounded" />
      <div className="skeleton mb-1.5 h-3 w-full rounded" />
      <div className="skeleton mb-4 h-3 w-5/6 rounded" />
      <div className="space-y-2">
        <div className="skeleton h-2 w-full rounded" />
        <div className="skeleton h-2 w-full rounded" />
        <div className="skeleton h-2 w-full rounded" />
      </div>
    </div>
  );
}

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {[
        [200, 60, 28],
        [120, 130, 22],
        [280, 130, 22],
        [80, 220, 18],
        [200, 200, 24],
        [320, 220, 18],
        [155, 280, 16],
        [245, 280, 16],
      ].map(([cx, cy, r], i) => (
        <polygon
          key={i}
          points={`${cx},${cy - r} ${cx + r * 0.866},${cy - r * 0.5} ${cx + r * 0.866},${cy + r * 0.5} ${cx},${cy + r} ${cx - r * 0.866},${cy + r * 0.5} ${cx - r * 0.866},${cy - r * 0.5}`}
          stroke="url(#grad1)"
          strokeWidth="1.5"
          fill="rgba(59,130,246,0.06)"
        />
      ))}

      {[
        [200, 60, 120, 130],
        [200, 60, 280, 130],
        [120, 130, 80, 220],
        [120, 130, 200, 200],
        [280, 130, 200, 200],
        [280, 130, 320, 220],
        [80, 220, 155, 280],
        [200, 200, 155, 280],
        [200, 200, 245, 280],
        [320, 220, 245, 280],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="url(#grad2)"
          strokeWidth="1"
        />
      ))}

      <path
        d="M185 45 L215 45 L218 58 L200 65 L182 58 Z"
        stroke="url(#grad1)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M192 65 L192 72 M208 65 L208 72 M186 72 L214 72"
        stroke="url(#grad1)"
        strokeWidth="1.5"
      />
      <circle
        cx="200"
        cy="57"
        r="6"
        stroke="#FBBF24"
        strokeWidth="1"
        fill="rgba(251,191,36,0.1)"
      />
      <line x1="197" y1="63" x2="203" y2="63" stroke="#FBBF24" strokeWidth="1" />
    </svg>
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
      <span className="mb-1 block text-xs" style={{ color: C.textSec }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  color: C.text,
};

export default function Home() {
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
  const [result, setResult] = useState<(IdeationOutput & { _demo?: boolean }) | null>(
    null,
  );
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const selectedCandidate =
    selectedTopic !== null ? result?.candidates[selectedTopic] ?? null : null;

  const recommendationTone = useMemo(() => {
    if (!result) return "填写左侧信息后，AI 会根据赛道与团队能力推荐 3 条候选选题。";
    if (result._demo) return "当前显示的是演示样例，你可以先验证流程，再接入真实模型输出。";
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

      if (!res.ok) {
        throw new Error(await res.text());
      }

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
    <main
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top, rgba(59,130,246,0.12), transparent 30%), #0B1020",
      }}
    >
      <header
        className="sticky top-0 z-30 border-b px-4 py-4 backdrop-blur md:px-6"
        style={{
          borderColor: `${C.border}40`,
          background: "rgba(11,16,32,0.88)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="gradient-text text-base font-semibold">赛道官</div>
              <div className="text-xs" style={{ color: C.textSec }}>
                CompeteAgent · Ideation Workspace
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span
              className="rounded-full px-3 py-1 text-xs"
              style={{
                background: `${C.blue}18`,
                border: `1px solid ${C.blue}30`,
                color: C.blue,
              }}
            >
              互联网+ 2026 准备中
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs"
              style={{
                background: `${C.green}18`,
                border: `1px solid ${C.green}30`,
                color: C.green,
              }}
            >
              立项助手已接通
            </span>
          </div>
        </div>
      </header>

      <section className="dot-grid-bg overflow-hidden border-b px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
              style={{
                background: `${C.blue}18`,
                border: `1px solid ${C.blue}30`,
                color: C.blue,
              }}
            >
              <Sparkles size={12} />
              直接采用 Figma 视觉骨架
            </div>

            <h1
              className="mb-4"
              style={{
                color: C.text,
                fontSize: "clamp(30px, 5vw, 54px)",
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              <span className="gradient-text">立项助手</span>
              <br />
              <span style={{ color: C.textSec, fontWeight: 500 }}>
                用 Figma 工作台样式
              </span>
              <br />
              <span>直接驱动真实选题生成</span>
            </h1>

            <p
              className="max-w-2xl text-sm leading-7 md:text-[15px]"
              style={{ color: C.textSec }}
            >
              保留 Figma 导出的深色工作台布局、表单层级和卡片结果区，只做 Next.js
              适配与语法修复。你现在填完左侧信息后，右侧会直接显示 ideation agent 的真实输出。
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: TrendingUp,
                  title: "五维导向",
                  text: "围绕互联网+评审逻辑组织输入与输出",
                  color: C.blue,
                },
                {
                  icon: Shield,
                  title: "演示兜底",
                  text: "未配 Key 时自动回退到 demo 数据",
                  color: C.green,
                },
                {
                  icon: Trophy,
                  title: "结果可选",
                  text: "选题卡片支持聚焦与推荐摘要",
                  color: C.yellow,
                },
              ].map(({ icon: Icon, title, text, color }) => (
                <div
                  key={title}
                  className="rounded-2xl p-4"
                  style={{
                    background: `${C.card}cc`,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                  >
                    <Icon size={18} style={{ color }} />
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

          <div className="mx-auto w-full max-w-md">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.14), transparent)",
                  filter: "blur(20px)",
                }}
              />
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 md:px-6 md:py-8">
        <div
          className="mx-auto flex max-w-7xl flex-col overflow-hidden rounded-[28px] border xl:flex-row"
          style={{
            background: "rgba(11,16,32,0.96)",
            borderColor: `${C.border}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
          }}
        >
          <form
            className="shrink-0 p-5 md:p-6 xl:w-80"
            onSubmit={handleSubmit}
            style={{ borderRight: `1px solid ${C.border}40` }}
          >
            <div className="mb-5 flex items-center gap-2">
              <Lightbulb size={18} style={{ color: C.yellow }} />
              <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>
                立项配置
              </h2>
            </div>

            <div className="space-y-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: `${C.card}cc`,
                  border: `1px solid ${C.border}`,
                }}
              >
                <h3 className="mb-3 text-xs font-medium" style={{ color: C.textSec }}>
                  竞赛信息
                </h3>
                <div className="space-y-3">
                  <Field label="目标赛事">
                    <select
                      value={form.competition}
                      onChange={(e) =>
                        setForm({ ...form, competition: e.target.value })
                      }
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                    >
                      {COMPETITION_OPTIONS.map((option) => (
                        <option
                          key={option}
                          value={option}
                          style={{ background: C.card }}
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="赛道方向">
                    <select
                      value={form.track}
                      onChange={(e) => setForm({ ...form, track: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                    >
                      {TRACK_OPTIONS.map((option) => (
                        <option
                          key={option}
                          value={option}
                          style={{ background: C.card }}
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="参赛组别">
                    <select
                      value={form.group}
                      onChange={(e) => setForm({ ...form, group: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                    >
                      {GROUP_OPTIONS.map((option) => (
                        <option
                          key={option}
                          value={option}
                          style={{ background: C.card }}
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: `${C.card}cc`,
                  border: `1px solid ${C.border}`,
                }}
              >
                <h3 className="mb-3 text-xs font-medium" style={{ color: C.textSec }}>
                  团队信息
                </h3>
                <div className="space-y-3">
                  <Field label="兴趣方向 / 专业背景">
                    <textarea
                      value={form.interests}
                      onChange={(e) => setForm({ ...form, interests: e.target.value })}
                      rows={3}
                      placeholder="例：信息工程学院大二，对 AI Agent、教育科技、校园应用感兴趣"
                      className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="现有能力 / 技术栈 / 资源">
                    <textarea
                      value={form.capabilities}
                      onChange={(e) =>
                        setForm({ ...form, capabilities: e.target.value })
                      }
                      rows={3}
                      placeholder="例：熟悉 Next.js + Python；队内有 1 人负责设计；可调度实验室 GPU"
                      className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                    />
                  </Field>

                  <div>
                    <label
                      className="mb-1 block text-xs"
                      style={{ color: C.textSec }}
                    >
                      可投入周数
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WEEK_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, time_budget_weeks: option.value })
                          }
                          className="rounded-lg px-3 py-1.5 text-xs transition-all"
                          style={{
                            background:
                              form.time_budget_weeks === option.value
                                ? "linear-gradient(135deg, #3B82F6, #8B5CF6)"
                                : `${C.border}40`,
                            color:
                              form.time_budget_weeks === option.value
                                ? "white"
                                : C.textSec,
                            border:
                              form.time_budget_weeks === option.value
                                ? "none"
                                : `1px solid ${C.border}`,
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
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    AI 分析中…
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    生成候选选题
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="flex-1 p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>
                  候选选题推荐
                  {result && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs"
                      style={{
                        background: `${C.green}18`,
                        color: C.green,
                      }}
                    >
                      {result.candidates.length} 条已生成
                    </span>
                  )}
                </h2>
                <p className="mt-1 text-xs" style={{ color: C.textSec }}>
                  右侧卡片延续 Figma 原稿布局，直接展示 agent 返回的真实结构化结果。
                </p>
              </div>

              {result && (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                  style={{ color: C.textSec }}
                >
                  <RefreshCw size={12} />
                  换一批
                </button>
              )}
            </div>

            {result?._demo && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: `${C.yellow}12`,
                  border: `1px solid ${C.yellow}30`,
                  color: C.yellow,
                }}
              >
                当前处于演示模式，尚未检测到模型 Key，页面展示的是预置样例输出。
              </div>
            )}

            {error && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: `${C.red}12`,
                  border: `1px solid ${C.red}30`,
                  color: C.red,
                }}
              >
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
                    className="cursor-pointer rounded-xl p-5 transition-all duration-200"
                    style={{
                      background:
                        selectedTopic === idx
                          ? "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))"
                          : C.card,
                      border:
                        selectedTopic === idx
                          ? `1px solid ${C.blue}50`
                          : `1px solid ${C.border}`,
                      boxShadow:
                        selectedTopic === idx ? `0 0 20px ${C.blue}15` : "none",
                    }}
                    onClick={() => setSelectedTopic(idx)}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          {idx === 0 && (
                            <span
                              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                              style={{
                                background: `${C.yellow}18`,
                                color: C.yellow,
                                border: `1px solid ${C.yellow}30`,
                              }}
                            >
                              <Star size={10} fill={C.yellow} />
                              推荐优先
                            </span>
                          )}
                          <span className="text-xs" style={{ color: C.textSec }}>
                            选题 {idx + 1}
                          </span>
                        </div>
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: C.text,
                            lineHeight: 1.45,
                          }}
                        >
                          {topic.title}
                        </h3>
                      </div>

                      {selectedTopic === idx && (
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full"
                          style={{
                            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                          }}
                        >
                          <span className="text-[10px] text-white">✓</span>
                        </div>
                      )}
                    </div>

                    <p
                      className="mb-4 text-sm leading-relaxed"
                      style={{ color: C.textSec }}
                    >
                      {topic.one_liner}
                    </p>

                    <div className="mb-4 space-y-2">
                      <ScoreBar
                        label="创新性"
                        value={topic.innovation.score}
                        reason={topic.innovation.reason}
                        color={C.blue}
                      />
                      <ScoreBar
                        label="可行性"
                        value={topic.feasibility.score}
                        reason={topic.feasibility.reason}
                        color={C.green}
                      />
                      <ScoreBar
                        label="商业价值"
                        value={topic.business.score}
                        reason={topic.business.reason}
                        color={C.purple}
                      />
                    </div>

                    {topic.similar_awards.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {topic.similar_awards.map((award) => (
                          <span
                            key={award}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
                            style={{
                              background: `${C.yellow}10`,
                              color: C.yellow,
                              border: `1px solid ${C.yellow}20`,
                            }}
                          >
                            <Trophy size={10} />
                            {award}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p
                          className="mb-1.5 text-xs font-medium"
                          style={{ color: C.textSec }}
                        >
                          MVP 范围
                        </p>
                        <ul className="space-y-1">
                          {topic.mvp_scope.map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-1.5 text-xs"
                              style={{ color: C.textSec }}
                            >
                              <span
                                className="h-1 w-1 shrink-0 rounded-full"
                                style={{ background: C.green }}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p
                          className="mb-1.5 text-xs font-medium"
                          style={{ color: C.textSec }}
                        >
                          关键风险
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {topic.risks.map((risk) => (
                            <span
                              key={risk}
                              className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs"
                              style={{
                                background: `${C.red}10`,
                                color: C.red,
                                border: `1px solid ${C.red}20`,
                              }}
                            >
                              <AlertTriangle size={9} />
                              {risk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  className="gradient-border flex items-center gap-4 rounded-xl p-4"
                  style={{ boxShadow: `0 0 30px ${C.blue}10` }}
                >
                  <Trophy size={20} style={{ color: C.yellow }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: C.text }}>
                      {selectedCandidate
                        ? `已选择：${selectedCandidate.title}`
                        : "等待选择推荐选题"}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: C.textSec }}>
                      {selectedCandidate
                        ? result.recommendation
                        : recommendationTone}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-white transition-all hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                    }}
                  >
                    进入 BP 生成
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed"
                style={{ borderColor: `${C.border}`, color: C.textSec }}
              >
                <Lightbulb size={40} className="mb-3" style={{ color: C.border }} />
                <p className="max-w-md text-center text-sm leading-7">
                  填写左侧表单后，AI 会按 Figma 工作台样式把 3 条候选选题展示在这里，
                  包含评分、MVP 范围、相似获奖案例和关键风险。
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
