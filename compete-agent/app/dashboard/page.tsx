import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FolderKanban,
  Lightbulb,
  MessageSquareText,
  Plus,
  Presentation,
  Sparkles,
  Target,
  Trophy,
  WalletCards,
} from "lucide-react";
import { AppNav } from "@/app/_components/AppNav";
import { C, SAMPLE_PROJECTS } from "@/app/_components/theme";

function getNextDeadline() {
  const now = new Date();
  const year = now.getMonth() > 7 ? now.getFullYear() + 1 : now.getFullYear();
  const deadline = new Date(year, 7, 15, 23, 59, 59);
  const diff = Math.max(
    0,
    Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return {
    label: `${year} 省赛报名窗口`,
    daysLeft: diff,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

const ACTIVITIES = [
  { time: "今天 14:32", text: "BP 第三章已扩写完成，建议补充真实市场数据。", color: C.pinkStrong },
  { time: "今天 11:08", text: "评审模拟分数提升到 81 分，可以开始整理答辩稿。", color: C.success },
  { time: "昨天 20:15", text: "原型页新增 2 个关键流程草图，适合下一步录演示。", color: C.warning },
];

const RECOMMENDATIONS = [
  {
    icon: Lightbulb,
    title: "先锁定一个选题",
    text: "当前最适合你们的方向仍然是“工训安全微学习平台”，完整度和落地性最好。",
  },
  {
    icon: MessageSquareText,
    title: "本周做一次评审模拟",
    text: "越早暴露问题，BP 和路演后面返工越少，尤其是商业模式与证据链部分。",
  },
  {
    icon: Presentation,
    title: "提早准备答辩表达",
    text: "PPT 不要等项目都写完再做，先把故事线拉出来，后面补内容会更顺。",
  },
];

const TOKEN_SEGMENTS = [
  { label: "BP", value: 42, color: C.pinkStrong },
  { label: "评审", value: 26, color: C.success },
  { label: "立项", value: 18, color: C.warning },
  { label: "其他", value: 14, color: C.textSoft },
];

export default function DashboardPage() {
  const deadline = getNextDeadline();
  const greeting = getGreeting();

  return (
    <div className="page-shell min-h-screen">
      <AppNav />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card-strong dot-grid-bg animate-fade-up rounded-[34px] p-6 md:p-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong, border: `1px solid ${C.border}` }}>
              <Sparkles size={12} />
              多项目总览
            </div>

            <h1 className="text-[clamp(28px,4vw,46px)] font-semibold leading-[1.1]" style={{ color: C.text }}>
              {greeting}，张同学
              <br />
              <span className="gradient-text">你的比赛准备已经不再散着做了</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 md:text-[15px]" style={{ color: C.textSec }}>
              仪表盘把立项、BP、原型、评审和 PPT 都串了起来。你现在可以从这里继续一个项目，也可以直接新建新赛题。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/workspace/topic"
                className="pulse-glow soft-hover inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Plus size={16} />
                开始新项目
              </Link>
              <Link
                href="/settings"
                className="soft-hover inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.82)", color: C.text, border: `1px solid ${C.border}` }}
              >
                <WalletCards size={16} />
                查看设置
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "120ms" }}>
              <div className="mb-3 flex items-center gap-2">
                <Target size={16} style={{ color: C.warning }} />
                <span className="text-sm font-medium" style={{ color: C.text }}>
                  {deadline.label}
                </span>
              </div>
              <div className="text-4xl font-semibold gradient-text">{deadline.daysLeft}</div>
              <p className="mt-2 text-sm" style={{ color: C.textSec }}>
                天后进入截止节点，建议本周至少把 BP 主线和一版答辩结构整理出来。
              </p>
            </div>

            <div className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "220ms" }}>
              <div className="mb-3 flex items-center gap-2">
                <WalletCards size={16} style={{ color: C.success }} />
                <span className="text-sm font-medium" style={{ color: C.text }}>
                  本月 Token 用量
                </span>
              </div>
              <div className="mb-4 flex items-end gap-2">
                <span className="text-4xl font-semibold" style={{ color: C.text }}>
                  2,340
                </span>
                <span className="pb-1 text-sm" style={{ color: C.textSec }}>
                  / 10,000
                </span>
              </div>
              <div className="mb-3 flex h-3 overflow-hidden rounded-full" style={{ background: "rgba(214,188,197,0.28)" }}>
                {TOKEN_SEGMENTS.map((item) => (
                  <div key={item.label} style={{ width: `${item.value}%`, background: item.color }} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: C.textSec }}>
                {TOKEN_SEGMENTS.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { label: "进行中项目", value: "3", sub: "目前已接入工作台", icon: FolderKanban, color: C.pinkStrong },
            { label: "最高完成度", value: "88%", sub: "校园安全学习平台", icon: Trophy, color: C.success },
            { label: "本周建议动作", value: "2", sub: "补证据链 + 做一次模拟", icon: Clock3, color: C.warning },
          ].map(({ label, value, sub, icon: Icon, color }, index) => (
            <div
              key={label}
              className="glass-card soft-hover animate-fade-up rounded-[28px] p-5"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[18px]" style={{ background: `${color}22`, color }}>
                <Icon size={18} />
              </div>
              <div className="text-3xl font-semibold" style={{ color: C.text }}>
                {value}
              </div>
              <div className="mt-1 text-sm font-medium" style={{ color: C.text }}>
                {label}
              </div>
              <div className="mt-1 text-xs leading-6" style={{ color: C.textSec }}>
                {sub}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="glass-card-strong animate-fade-up rounded-[34px] p-6" style={{ animationDelay: "120ms" }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: C.text }}>
                  我的参赛项目
                </h2>
                <p className="mt-1 text-sm" style={{ color: C.textSec }}>
                  点击任意卡片都可以继续进入该项目的工作台。
                </p>
              </div>
              <Link href="/workspace/topic" className="text-sm" style={{ color: C.pinkStrong }}>
                新建项目
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {SAMPLE_PROJECTS.map((project) => {
                const steps = Object.values(project.progress);
                const overall = Math.round(
                  steps.reduce((sum, item) => sum + item, 0) / steps.length,
                );

                return (
                  <Link
                    key={project.id}
                    href="/workspace/topic"
                    className="soft-hover rounded-[28px] p-5"
                    style={{ background: "rgba(255,255,255,0.76)", border: `1px solid ${C.border}` }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 inline-flex rounded-full px-2.5 py-1 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong }}>
                          {project.competition} · {project.track}
                        </div>
                        <h3 className="text-base font-semibold" style={{ color: C.text }}>
                          {project.name}
                        </h3>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: "rgba(146,184,173,0.18)", color: C.success }}>
                        {project.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        ["立项", project.progress.topic, C.pinkStrong],
                        ["BP", project.progress.bp, C.warning],
                        ["原型", project.progress.prototype, C.success],
                        ["评审", project.progress.review, C.textSoft],
                        ["PPT", project.progress.ppt, C.blushStrong],
                      ].map(([label, value, color]) => (
                        <div key={String(label)}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span style={{ color: C.textSec }}>{label}</span>
                            <span style={{ color: C.text }}>{value}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(214,188,197,0.24)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: String(color) }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span style={{ color: C.textSec }}>综合完成度 {overall}%</span>
                      <span className="inline-flex items-center gap-1" style={{ color: C.pinkStrong }}>
                        继续推进
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "220ms" }}>
              <h2 className="mb-4 text-base font-semibold" style={{ color: C.text }}>
                优化建议
              </h2>
              <div className="space-y-3">
                {RECOMMENDATIONS.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-[22px] p-4" style={{ background: "rgba(255,255,255,0.74)", border: `1px solid ${C.border}` }}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-2xl" style={{ background: "rgba(244,219,227,0.72)", color: C.pinkStrong }}>
                        <Icon size={14} />
                      </div>
                      <div className="text-sm font-medium" style={{ color: C.text }}>
                        {title}
                      </div>
                    </div>
                    <p className="text-xs leading-6" style={{ color: C.textSec }}>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "300ms" }}>
              <h2 className="mb-4 text-base font-semibold" style={{ color: C.text }}>
                近期活动
              </h2>
              <div className="space-y-4">
                {ACTIVITIES.map((item) => (
                  <div key={item.time + item.text} className="flex gap-3">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    <div>
                      <p className="text-sm leading-7" style={{ color: C.text }}>
                        {item.text}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: C.textSec }}>
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
