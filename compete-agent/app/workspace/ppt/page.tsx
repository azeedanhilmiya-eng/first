import {
  FileStack,
  LayoutPanelTop,
  type LucideIcon,
  PanelsTopLeft,
  Presentation,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { C } from "@/app/_components/theme";

const SLIDES = [
  { no: "01", title: "项目开场", text: "一句话讲清你们在解决什么问题，为什么值得现在做。", accent: C.pinkStrong },
  { no: "02", title: "痛点与机会", text: "用场景和数据证明问题真实存在，而且传统方式没有解决好。", accent: C.warning },
  { no: "03", title: "解决方案", text: "展示产品结构、核心流程和差异化，而不是泛泛讲功能。", accent: C.success },
  { no: "04", title: "商业模式", text: "说明谁买单、为什么买单、如何持续增长。", accent: C.textSoft },
  { no: "05", title: "团队与成果", text: "强调你们为什么最适合做这件事，以及已经完成了什么。", accent: C.blushStrong },
];

const PPT_SUMMARY: Array<{
  title: string;
  desc: string;
  icon: LucideIcon;
}> = [
  { title: "推荐页数", desc: "8-10 页最稳妥", icon: PanelsTopLeft },
  { title: "表达方式", desc: "故事线优先", icon: FileStack },
  { title: "当前状态", desc: "已生成一版大纲", icon: WandSparkles },
];

export default function PPTPage() {
  return (
    <div className="min-h-[calc(100vh-118px)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-card-strong dot-grid-bg animate-fade-up rounded-[34px] p-6 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong, border: `1px solid ${C.border}` }}>
                <Presentation size={12} />
                答辩 PPT
              </div>
              <h1 className="text-[clamp(24px,4vw,38px)] font-semibold leading-[1.12]" style={{ color: C.text }}>
                不用等到最后一周
                <br />
                <span className="gradient-text">现在就可以把答辩故事线拉出来</span>
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: C.textSec }}>
                这里沿用了 Figma 里的 PPT 模块思路，但视觉改成了更轻的白粉风格，也增加了更适合展示页的层次和动效。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {PPT_SUMMARY.map(({ title, desc, icon: Icon }) => (
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

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="glass-card-strong animate-fade-up rounded-[32px] p-6" style={{ animationDelay: "120ms" }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: C.text }}>
                推荐答辩大纲
              </h2>
              <button className="pulse-glow soft-hover rounded-[18px] px-4 py-3 text-sm text-white" style={{ background: "var(--gradient-primary)" }}>
                导出 PPT 提纲
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {SLIDES.map((slide, index) => (
                <div
                  key={slide.no}
                  className="soft-hover animate-fade-up rounded-[26px] p-5"
                  style={{
                    animationDelay: `${index * 90}ms`,
                    background: "rgba(255,255,255,0.78)",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs tracking-[0.24em]" style={{ color: slide.accent }}>
                      {slide.no}
                    </span>
                    <div className="h-2 w-16 rounded-full" style={{ background: slide.accent }} />
                  </div>
                  <div className="text-base font-medium" style={{ color: C.text }}>
                    {slide.title}
                  </div>
                  <p className="mt-2 text-sm leading-7" style={{ color: C.textSec }}>
                    {slide.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "200ms" }}>
              <div className="mb-4 flex items-center gap-2">
                <LayoutPanelTop size={15} style={{ color: C.success }} />
                <h2 className="text-base font-semibold" style={{ color: C.text }}>
                  讲法提示
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-7" style={{ color: C.textSec }}>
                <p>每一页尽量只讲一个判断，不要一页堆太多点。</p>
                <p>“为什么值得做”要比“怎么做”更早出现。</p>
                <p>原型页和结果页优先使用真实界面，而不是纯文字截图。</p>
              </div>
            </div>

            <div className="glass-card animate-fade-up rounded-[30px] p-5" style={{ animationDelay: "280ms" }}>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={15} style={{ color: C.pinkStrong }} />
                <h2 className="text-base font-semibold" style={{ color: C.text }}>
                  当前建议
                </h2>
              </div>
              <p className="text-sm leading-7" style={{ color: C.textSec }}>
                先把 5 页核心大纲定下来，再把立项、BP、原型页中已经写好的内容抽进 PPT，会比从空白页硬拼更顺。
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
