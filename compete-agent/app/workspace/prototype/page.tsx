import {
  CheckCircle2,
  Code2,
  type LucideIcon,
  LayoutTemplate,
  MonitorSmartphone,
  Rocket,
  Sparkles,
} from "lucide-react";
import { C } from "@/app/_components/theme";

const PHASES = [
  {
    title: "页面结构",
    desc: "先把首页、课程页、风险识别互动页和学习记录页串起来，形成完整演示路径。",
    progress: 84,
    color: C.pinkStrong,
  },
  {
    title: "交互原型",
    desc: "重点做 2 到 3 个让评委看得到变化的核心交互，而不是平均分配精力。",
    progress: 68,
    color: C.success,
  },
  {
    title: "答辩演示包装",
    desc: "把动效、录屏脚本和产品叙述一起做，形成可用于展示的成品感。",
    progress: 42,
    color: C.warning,
  },
];

const PROTOTYPE_SUMMARY: Array<{
  title: string;
  desc: string;
  icon: LucideIcon;
}> = [
  { title: "主端形态", desc: "Web 演示版优先", icon: MonitorSmartphone },
  { title: "技术栈", desc: "Next.js + Figma 演示流程", icon: Code2 },
  { title: "本周目标", desc: "完成 3 个关键页面", icon: Rocket },
];

export default function PrototypePage() {
  return (
    <div className="min-h-[calc(100vh-118px)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-card-strong dot-grid-bg animate-fade-up rounded-[34px] p-6 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong, border: `1px solid ${C.border}` }}>
                <Sparkles size={12} />
                原型脚手架
              </div>
              <h1 className="text-[clamp(24px,4vw,38px)] font-semibold leading-[1.12]" style={{ color: C.text }}>
                让项目不只是“有想法”
                <br />
                <span className="gradient-text">而是真的有能演示的产品感</span>
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: C.textSec }}>
                这里承接 Figma 的原型页结构，先给你一套更适合答辩展示的实现节奏。重点不是把功能堆满，而是做出最能说明价值的核心流程。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {PROTOTYPE_SUMMARY.map(({ title, desc, icon: Icon }) => (
                <div key={String(title)} className="glass-card rounded-[24px] p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(244,219,227,0.72)", color: C.pinkStrong }}>
                    <Icon size={16} />
                  </div>
                  <div className="text-sm font-medium" style={{ color: C.text }}>
                    {title}
                  </div>
                  <div className="mt-1 text-xs leading-6" style={{ color: C.textSec }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="glass-card-strong animate-fade-up rounded-[32px] p-6" style={{ animationDelay: "120ms" }}>
            <h2 className="mb-5 text-lg font-semibold" style={{ color: C.text }}>
              原型推进节奏
            </h2>
            <div className="space-y-4">
              {PHASES.map((phase, index) => (
                <div key={phase.title} className="rounded-[26px] p-5" style={{ background: "rgba(255,255,255,0.78)", border: `1px solid ${C.border}` }}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-medium" style={{ color: C.text }}>
                        {phase.title}
                      </div>
                      <div className="mt-1 text-sm leading-7" style={{ color: C.textSec }}>
                        {phase.desc}
                      </div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: phase.color }}>
                      0{index + 1}
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "rgba(214,188,197,0.24)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${phase.progress}%`, background: phase.color }} />
                  </div>
                  <div className="mt-2 text-xs" style={{ color: C.textSec }}>
                    当前完成度 {phase.progress}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "180ms" }}>
              <div className="mb-4 flex items-center gap-2">
                <LayoutTemplate size={15} style={{ color: C.success }} />
                <h2 className="text-base font-semibold" style={{ color: C.text }}>
                  MVP 清单
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  "课程首页与模块导航",
                  "实验风险识别互动页",
                  "学习记录与考核结果页",
                  "教师 / 培训后台概览",
                ].map((item) => (
                  <div key={item} className="flex gap-3 text-sm" style={{ color: C.textSec }}>
                    <CheckCircle2 size={16} style={{ color: C.success, marginTop: 2 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "260ms" }}>
              <h2 className="mb-4 text-base font-semibold" style={{ color: C.text }}>
                演示建议
              </h2>
              <p className="text-sm leading-7" style={{ color: C.textSec }}>
                建议先把 Figma 和可交互页面统一成这套白粉低饱和风格，再补上轻量入场、悬浮和切换动效，答辩时成品质感会明显更好。
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
