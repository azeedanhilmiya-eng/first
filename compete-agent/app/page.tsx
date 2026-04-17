import Link from "next/link";
import {
  ArrowRight,
  Code2,
  FileText,
  Lightbulb,
  MessageSquareText,
  Presentation,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C } from "./_components/theme";

const MODULES: Array<{
  title: string;
  desc: string;
  icon: LucideIcon;
  href: string;
}> = [
  {
    title: "立项助手",
    desc: "把赛道方向、团队能力和时间预算压缩成 3 条真正能答辩的候选选题。",
    icon: Lightbulb,
    href: "/workspace/topic",
  },
  {
    title: "BP 生成",
    desc: "围绕评审五维逻辑，逐段整理项目价值、技术方案和商业模式。",
    icon: FileText,
    href: "/workspace/bp",
  },
  {
    title: "原型脚手架",
    desc: "从概念推进到演示结构，梳理页面、流程、动效与版本节奏。",
    icon: Code2,
    href: "/workspace/prototype",
  },
  {
    title: "评审模拟",
    desc: "把“评委会问什么”提前具体化，减少上台前的不确定感。",
    icon: MessageSquareText,
    href: "/workspace/review",
  },
  {
    title: "答辩 PPT",
    desc: "从项目脉络中直接抽出答辩表达结构，不再最后一周临时拼稿。",
    icon: Presentation,
    href: "/workspace/ppt",
  },
];

const STATS: Array<{
  value: string;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "20+ 队", label: "首批试用团队", icon: Users },
  { value: "300+", label: "往届案例储备", icon: Trophy },
  { value: "5 模块", label: "完整工作台流程", icon: Sparkles },
];

export default function LandingPage() {
  return (
    <main className="page-shell min-h-screen px-4 pb-16 pt-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="glass-card-strong animate-fade-up rounded-[34px] px-5 py-4 md:px-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[22px]"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <div className="gradient-text text-lg font-semibold">赛道官</div>
                <div className="text-xs" style={{ color: C.textSec }}>
                  CompeteAgent · White Blush Edition
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/login"
                className="soft-hover rounded-full px-4 py-2 text-sm"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  border: `1px solid ${C.border}`,
                  color: C.text,
                }}
              >
                登录
              </Link>
              <Link
                href="/workspace/topic"
                className="pulse-glow soft-hover inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                直接开始
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
              style={{
                background: "rgba(244,219,227,0.72)",
                color: C.pinkStrong,
                border: `1px solid ${C.border}`,
              }}
            >
              <Sparkles size={12} />
              多页面已接入 · 白色与淡粉色低饱和主题
            </div>

            <h1
              className="mb-4"
              style={{
                color: C.text,
                fontSize: "clamp(34px, 6vw, 62px)",
                fontWeight: 700,
                lineHeight: 1.06,
              }}
            >
              用更轻柔的界面，
              <br />
              把比赛准备做得
              <br />
              <span className="gradient-text">更完整，也更像作品。</span>
            </h1>

            <p
              className="max-w-2xl text-sm leading-8 md:text-[15px]"
              style={{ color: C.textSec }}
            >
              这一版已经把 Figma 的多页面结构正式接进了 Next 应用，不再只有一个工作台页面。同时整体降低了颜色饱和度，改成白色加淡粉色主调，并增加了更自然的入场、悬浮和过渡动效。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/workspace/topic"
                className="pulse-glow soft-hover inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                进入立项助手
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/dashboard"
                className="soft-hover inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  border: `1px solid ${C.border}`,
                  color: C.text,
                }}
              >
                查看仪表盘
              </Link>
            </div>
          </div>

          <div
            className="relative min-h-[360px] animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            <div
              className="animate-float absolute left-6 top-6 h-44 w-44 rounded-full"
              style={{ background: "rgba(244,219,227,0.7)", filter: "blur(34px)" }}
            />
            <div
              className="animate-drift absolute bottom-0 right-0 h-56 w-56 rounded-full"
              style={{ background: "rgba(255,255,255,0.92)", filter: "blur(22px)" }}
            />
            <div className="glass-card-strong relative ml-auto max-w-lg rounded-[34px] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ color: C.text }}>
                    体验变化
                  </div>
                  <div className="mt-1 text-xs" style={{ color: C.textSec }}>
                    从单页原型升级到完整多页流程
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{ background: "rgba(146,184,173,0.22)", color: C.success }}
                >
                  已上线预览
                </span>
              </div>

              <div className="grid gap-3">
                {[
                  ["5 个工作台模块", "立项、BP、原型、评审、PPT 都有独立页面入口"],
                  ["淡粉白主色", "整体从高对比深色切到更柔和的白粉低饱和方案"],
                  ["更多动效", "加入淡入上浮、柔和悬停、漂浮背景和按钮呼吸感"],
                ].map(([title, desc]) => (
                  <div
                    key={title}
                    className="rounded-[24px] p-4"
                    style={{
                      background: "rgba(255,255,255,0.78)",
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div className="mb-1 text-sm font-medium" style={{ color: C.text }}>
                      {title}
                    </div>
                    <div className="text-xs leading-6" style={{ color: C.textSec }}>
                      {desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {STATS.map(({ value, label, icon: Icon }, index) => (
            <div
              key={label}
              className="glass-card soft-hover animate-fade-up rounded-[28px] p-5 text-center"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div
                className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: "rgba(244,219,227,0.72)", color: C.pinkStrong }}
              >
                <Icon size={18} />
              </div>
              <div className="mb-1 text-3xl font-bold gradient-text">{value}</div>
              <div className="text-sm" style={{ color: C.textSec }}>
                {label}
              </div>
            </div>
          ))}
        </section>

        <section className="py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div
                className="text-xs uppercase tracking-[0.25em]"
                style={{ color: C.textSoft }}
              >
                Modules
              </div>
              <h2 className="mt-2 text-2xl font-semibold" style={{ color: C.text }}>
                现在不止一个页面了
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MODULES.map(({ title, desc, icon: Icon, href }, index) => (
              <Link
                key={title}
                href={href}
                className="glass-card soft-hover animate-fade-up rounded-[30px] p-5"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-[20px]"
                  style={{ background: "rgba(244,219,227,0.76)", color: C.pinkStrong }}
                >
                  <Icon size={20} />
                </div>
                <div className="mb-2 text-base font-semibold" style={{ color: C.text }}>
                  {title}
                </div>
                <p className="text-sm leading-7" style={{ color: C.textSec }}>
                  {desc}
                </p>
                <div
                  className="mt-4 inline-flex items-center gap-2 text-sm"
                  style={{ color: C.pinkStrong }}
                >
                  进入页面
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
