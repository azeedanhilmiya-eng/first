import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Zap, ChevronRight, Lightbulb, FileText, Code2, MessageSquareText,
  Presentation, Trophy, Clock, Users, Star, ArrowRight, Github,
  Sparkles, BarChart3, Shield, ChevronLeft
} from "lucide-react";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24",
};

const COMPETITIONS = [
  "挑战杯全国大学生课外学术科技作品竞赛",
  "中国国际"互联网+"大学生创新创业大赛",
  "全国大学生创新创业训练计划（大创）",
  "蓝桥杯全国软件和信息技术专业人才大赛",
  "三创赛·全国大学生创业综合模拟大赛",
  "创青春·全国大学生创业大赛",
  "全国大学生数学建模竞赛",
  "中国创新创业大赛",
];

const PAIN_POINTS = [
  {
    icon: Lightbulb, color: C.yellow, tag: "选题茫然",
    title: "赛道太多，无从下手",
    desc: "互联网+、挑战杯、大创……每个赛道方向不同，评分权重各异。大量时间消耗在信息搜集上，真正用于创作的时间所剩无几。",
    items: ["赛道方向多达 40+ 细分领域", "往届优质案例分散难以获取", "团队能力与赛道匹配度不清晰"],
  },
  {
    icon: FileText, color: C.blue, tag: "立项耗时",
    title: "BP 初稿三周，逻辑仍差强人意",
    desc: "手动整理竞品分析、市场调研、商业模式画布……商业计划书结构繁琐，且不知道评委真正在乎哪些维度。",
    items: ["BP 平均花费 60+ 小时初稿", "不了解五维评分权重分布", "语言表达缺乏竞赛专业范式"],
  },
  {
    icon: MessageSquareText, color: C.purple, tag: "评审盲区",
    title: "路演前完全不知道会被问什么",
    desc: "从未见过真实评委，不知道产业评委、学术评委、投资人评委关注点的差异，路演彩排缺乏真实反馈机制。",
    items: ["三类评委提问逻辑截然不同", "答辩 PPT 缺乏专业结构", "无法量化路演准备状态"],
  },
];

const MODULES = [
  { step: 1, path: "topic", icon: Lightbulb, title: "立项助手", tag: "AI 选题推荐", color: C.blue,
    desc: "输入赛道偏好与团队能力，AI 生成 3 条候选选题，附创新 / 可行 / 商业三维评分与往届相似获奖案例对比。" },
  { step: 2, path: "bp", icon: FileText, title: "BP 生成器", tag: "五维权重对齐", color: C.purple,
    desc: "基于互联网+五维评审权重（创新 25%·团队 20%·商业 25%·可行 15%·引领 15%）自动生成结构化 BP，支持实时编辑与导出。" },
  { step: 3, path: "prototype", icon: Code2, title: "原型脚手架", tag: "一键推送 GitHub", color: C.green,
    desc: "选择技术栈（Next.js / FastAPI / 小程序），AI 拆解 8–12 个里程碑，自动生成项目骨架并推送至 GitHub 仓库。" },
  { step: 4, path: "review", icon: MessageSquareText, title: "评审模拟", tag: "三类评委 · 雷达图评分", color: C.yellow,
    desc: "模拟产业评委、学术评委、投资人评委的真实提问风格，对话过程中实时更新五维打分雷达图与改进建议。" },
  { step: 5, path: "ppt", icon: Presentation, title: "答辩 PPT", tag: "10 页大纲 · 一键导出", color: "#EC4899",
    desc: "自动生成 10 页路演 PPT 大纲，每页含关键要点与 AI 语气建议，支持逐页重新生成与 PPTX 导出。" },
];

const STATS = [
  { number: "300+", label: "往届获奖案例", sub: "覆盖近五届互联网+、挑战杯真实赛事数据", icon: Trophy },
  { number: "80%", label: "节省准备时间", sub: "单项目平均节省 60 小时，从立项到提交仅需 2 周", icon: Clock },
  { number: "20 队", label: "本院试点", sub: "信息工程学院首批内测，3 队进入省赛决赛", icon: Users },
];

const TESTIMONIALS = [
  {
    name: "陈晓彤", role: "大三 · 软件工程 · 四川大学", avatar: "陈",
    rating: 5, track: "互联网+",
    quote: "用立项助手 2 天就锁定了赛道方向，BP 自动生成之后改了一轮就提交了。以前准备一份 BP 要三周，现在三天搞定，而且质量更高。评审模拟功能让我第一次知道投资人视角的问题跟学术评委有多大差别。",
  },
  {
    name: "李明辉", role: "创业导师 · 副教授 · 电子科技大学", avatar: "李",
    rating: 5, track: "指导老师",
    quote: "我带的三支团队同时使用了赛道官，作品整体质量明显提升，特别是 BP 的五维结构和评委视角把握得很准确。原来我需要花大量时间帮学生改 BP 逻辑，现在只需要做最后的亮点打磨。",
  },
  {
    name: "吴启航", role: "大二 · 计算机科学 · 重庆大学", avatar: "吴",
    rating: 5, track: "挑战杯",
    quote: "评审模拟功能太有用了！第一次模拟被产业评委问懵了，连续练了三轮之后完全不怕刁钻问题了。路演当天评委问的问题有 70% 都在训练集里出现过，感觉胜券在握。",
  },
];

// Geometric SVG illustration for hero
function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Hexagonal nodes */}
      {[
        [200, 60, 28], [120, 130, 22], [280, 130, 22],
        [80, 220, 18], [200, 200, 24], [320, 220, 18],
        [155, 280, 16], [245, 280, 16],
      ].map(([cx, cy, r], i) => (
        <polygon
          key={i}
          points={`${cx},${cy - r} ${cx + r * 0.866},${cy - r * 0.5} ${cx + r * 0.866},${cy + r * 0.5} ${cx},${cy + r} ${cx - r * 0.866},${cy + r * 0.5} ${cx - r * 0.866},${cy - r * 0.5}`}
          stroke="url(#grad1)" strokeWidth="1.5" fill="rgba(59,130,246,0.06)"
          filter="url(#glow)"
        />
      ))}
      {/* Connection lines */}
      {[
        [200, 60, 120, 130], [200, 60, 280, 130],
        [120, 130, 80, 220], [120, 130, 200, 200],
        [280, 130, 200, 200], [280, 130, 320, 220],
        [80, 220, 155, 280], [200, 200, 155, 280],
        [200, 200, 245, 280], [320, 220, 245, 280],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="url(#grad2)" strokeWidth="1" />
      ))}
      {/* Trophy outline at center */}
      <path d="M185 45 L215 45 L218 58 L200 65 L182 58 Z" stroke="url(#grad1)" strokeWidth="1.5" fill="none" />
      <path d="M192 65 L192 72 M208 65 L208 72 M186 72 L214 72" stroke="url(#grad1)" strokeWidth="1.5" />
      {/* Lightbulb at top node */}
      <circle cx="200" cy="57" r="6" stroke="#FBBF24" strokeWidth="1" fill="rgba(251,191,36,0.1)" />
      <line x1="197" y1="63" x2="203" y2="63" stroke="#FBBF24" strokeWidth="1" />
      {/* Small dots at intersections */}
      {[[200, 60], [120, 130], [280, 130], [80, 220], [200, 200], [320, 220]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="url(#grad1)" opacity="0.9" />
      ))}
      {/* Floating particles */}
      {[[50, 80], [350, 100], [30, 180], [370, 200], [100, 300], [300, 310]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill="#3B82F6" opacity="0.5" />
      ))}
      {/* Arc lines */}
      <path d="M60 60 Q100 30 140 50" stroke="#8B5CF6" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M260 50 Q300 30 340 60" stroke="#3B82F6" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh" }}>
      {/* NAVBAR */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          background: scrolled ? "rgba(11,16,32,0.9)" : "transparent",
          borderBottom: scrolled ? `1px solid ${C.border}40` : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <span className="font-semibold text-base gradient-text">赛道官</span>
              <span className="text-xs ml-1 hidden sm:inline" style={{ color: C.textSec, fontFamily: "Inter" }}>· CompeteAgent</span>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {["产品特性", "模块介绍", "案例数据", "团队"].map((item) => (
              <a key={item} href={`#${item}`} className="text-sm transition-colors hover:opacity-90"
                style={{ color: C.textSec }}>{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-lg text-sm transition-all hover:opacity-90"
              style={{ color: C.textSec, border: `1px solid ${C.border}` }}>
              登录
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-lg text-sm text-white transition-all hover:opacity-90 hidden sm:block"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
              免费试用
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 dot-grid-bg overflow-hidden">
        {/* Gradient orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)", filter: "blur(40px)" }} />

        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6"
                style={{ background: `${C.blue}18`, border: `1px solid ${C.blue}40`, color: C.blue }}>
                <Sparkles size={12} />
                <span>AI 参赛教练 · 首批内测开放中</span>
              </div>

              <h1 className="mb-4" style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 700, lineHeight: 1.15, color: C.text }}>
                <span className="gradient-text">赛道官</span>
                <br />
                <span style={{ fontSize: "clamp(20px, 3.5vw, 36px)", fontWeight: 500, color: C.textSec }}>
                  让大学生从立项到获奖
                </span>
                <br />
                <span style={{ fontSize: "clamp(20px, 3.5vw, 36px)", fontWeight: 500, color: C.text }}>
                  只需 <span className="gradient-text">2 周</span>
                </span>
              </h1>

              <p className="mb-8 max-w-lg mx-auto lg:mx-0" style={{ color: C.textSec, fontSize: 15, lineHeight: 1.8 }}>
                AI 参赛教练，覆盖<strong style={{ color: C.text }}>选题立项 → 撰写 BP → 搭建原型 → 模拟评审 → 准备路演</strong>全流程，
                专为互联网+、挑战杯、大创等国家级竞赛打造。
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-medium transition-all hover:opacity-90 pulse-glow"
                  style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontSize: 15 }}>
                  <Zap size={16} />
                  免费试用 立项助手
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all hover:bg-white/5"
                  style={{ border: `1px solid ${C.border}`, color: C.text, fontSize: 15 }}>
                  查看演示 Dashboard
                  <ArrowRight size={16} />
                </button>
              </div>

              <p className="mt-4 text-xs" style={{ color: C.textSec }}>
                无需信用卡 · 校园邮箱即可注册 · 每月 10,000 Token 免费额度
              </p>
            </div>

            {/* Right: Illustration */}
            <div className="flex-1 max-w-sm lg:max-w-md w-full">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1), transparent)", filter: "blur(20px)" }} />
                <HeroIllustration />
              </div>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="mt-12 overflow-hidden relative">
          <div style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
            <div className="flex animate-marquee whitespace-nowrap gap-0">
              {[...COMPETITIONS, ...COMPETITIONS].map((comp, i) => (
                <span key={i} className="inline-flex items-center gap-3 mx-4 text-sm"
                  style={{ color: C.textSec }}>
                  <Trophy size={12} style={{ color: C.yellow }} />
                  {comp}
                  <span style={{ color: C.border }}>·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS: 3 ��断层 */}
      <section className="py-16 md:py-24" id="产品特性">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: C.blue, fontFamily: "Inter" }}>
              THE PROBLEM
            </p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: C.text }}>
              3 个断层，<span className="gradient-text">一个 Agent</span> 解决
            </h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ color: C.textSec, fontSize: 15 }}>
              每年超过 300 万大学生参与各类竞赛，80% 的团队在这三个环节上消耗了大量时间却收效甚微。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PAIN_POINTS.map(({ icon: Icon, color, tag, title, desc, items }) => (
              <div key={tag} className="rounded-xl p-6 transition-all hover:-translate-y-1 duration-300 group"
                style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full mb-3 inline-block"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                  {tag}
                </span>
                <h3 className="mb-2" style={{ fontSize: 17, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{title}</h3>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: C.textSec }}>{desc}</p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm" style={{ color: C.textSec }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES: 5 模块 */}
      <section className="py-16 md:py-24" id="模块介绍">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: C.purple, fontFamily: "Inter" }}>
              FULL PIPELINE
            </p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: C.text }}>
              5 个模块，<span className="gradient-text">覆盖全链路</span>
            </h2>
          </div>

          <div className="space-y-4">
            {MODULES.map(({ step, icon: Icon, title, tag, color, desc, path }) => (
              <div
                key={step}
                className="flex flex-col md:flex-row items-start md:items-center gap-5 rounded-xl p-5 md:p-6 cursor-pointer transition-all hover:-translate-y-0.5 duration-200 group"
                style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                onClick={() => navigate(`/workspace/${path}`)}
              >
                {/* Step Number */}
                <div className="flex-shrink-0 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", boxShadow: `0 0 20px ${C.blue}30` }}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="hidden md:block w-px h-10" style={{ background: `linear-gradient(to bottom, ${color}60, transparent)` }} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span style={{ fontSize: 11, color: C.textSec, fontFamily: "Inter" }}>STEP {step}</span>
                    <span className="w-1 h-1 rounded-full" style={{ background: C.border }} />
                    <span className="font-semibold" style={{ fontSize: 16, color: C.text }}>{title}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                      {tag}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>{desc}</p>
                </div>

                {/* CTA */}
                <button className="flex-shrink-0 flex items-center gap-1 text-sm transition-all group-hover:gap-2 duration-200"
                  style={{ color: color }}>
                  进入模块 <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS: 真实数据 */}
      <section className="py-16 md:py-24" id="案例数据">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: C.green, fontFamily: "Inter" }}>
              REAL RESULTS
            </p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: C.text }}>
              真实数据，<span className="gradient-text">说话</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {STATS.map(({ number, label, sub, icon: Icon }) => (
              <div key={label}
                className="gradient-border rounded-xl p-8 text-center transition-all hover:-translate-y-1 duration-300"
                style={{ boxShadow: "inset 0 1px 0 rgba(59,130,246,0.08), 0 0 40px rgba(59,130,246,0.05)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))" }}>
                  <Icon size={22} style={{ color: C.blue }} />
                </div>
                <div className="mb-2 gradient-text" style={{ fontSize: "clamp(40px, 7vw, 64px)", fontWeight: 800, lineHeight: 1 }}>
                  {number}
                </div>
                <div className="font-semibold mb-2" style={{ color: C.text, fontSize: 16 }}>{label}</div>
                <div className="text-sm" style={{ color: C.textSec }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 md:py-24" id="团队">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: C.yellow, fontFamily: "Inter" }}>
              TESTIMONIALS
            </p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: C.text }}>
              他们这样说
            </h2>
          </div>

          <div className="relative">
            <div className="rounded-2xl p-8 md:p-10" style={{ background: C.card, border: `1px solid ${C.border}`, minHeight: 240 }}>
              <div className="flex gap-1 mb-6">
                {Array.from({ length: TESTIMONIALS[activeTestimonial].rating }).map((_, i) => (
                  <Star key={i} size={16} style={{ color: C.yellow }} fill={C.yellow} />
                ))}
              </div>
              <blockquote className="mb-6 leading-relaxed" style={{ color: C.text, fontSize: 16 }}>
                "{ TESTIMONIALS[activeTestimonial].quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
                  {TESTIMONIALS[activeTestimonial].avatar}
                </div>
                <div>
                  <div className="font-medium" style={{ color: C.text }}>{TESTIMONIALS[activeTestimonial].name}</div>
                  <div className="text-sm" style={{ color: C.textSec }}>{TESTIMONIALS[activeTestimonial].role}</div>
                </div>
                <span className="ml-auto px-3 py-1 rounded-full text-xs"
                  style={{ background: `${C.blue}18`, color: C.blue, border: `1px solid ${C.blue}30` }}>
                  {TESTIMONIALS[activeTestimonial].track}
                </span>
              </div>
            </div>

            {/* Carousel controls */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setActiveTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ border: `1px solid ${C.border}` }}>
                <ChevronLeft size={16} style={{ color: C.textSec }} />
              </button>
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{ background: i === activeTestimonial ? C.blue : C.border,
                    transform: i === activeTestimonial ? "scale(1.3)" : "scale(1)" }} />
              ))}
              <button onClick={() => setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ border: `1px solid ${C.border}` }}>
                <ChevronRight size={16} style={{ color: C.textSec }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <div className="rounded-2xl p-8 md:p-12 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))", border: `1px solid ${C.blue}30` }}>
            <div className="absolute inset-0 dot-grid-bg opacity-30" />
            <div className="relative">
              <h2 className="mb-3" style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: C.text }}>
                准备好开始了吗？
              </h2>
              <p className="mb-6" style={{ color: C.textSec }}>用校园邮箱注册，立即获得每月 10,000 Token 免费额度</p>
              <button onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-medium transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontSize: 16 }}>
                <Zap size={18} />
                免费试用 立项助手
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}30` }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-semibold gradient-text">赛道官</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>
                AI 参赛教练，专为中国大学生国家级竞赛打造。
              </p>
            </div>
            {[
              { title: "产品", links: ["立项助手", "BP 生成器", "原型脚手架", "评审模拟", "答辩 PPT"] },
              { title: "资源", links: ["往届案例库", "竞赛日历", "使用文档", "API 接口"] },
              { title: "关于", links: ["团队介绍", "联系我们", "开源协议", "隐私政策"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm transition-colors hover:opacity-80" style={{ color: C.textSec }}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ borderTop: `1px solid ${C.border}30` }}>
            <p className="text-xs" style={{ color: C.textSec }}>
              © 2025 赛道官 CompeteAgent · 蜀ICP备2025XXXXXXX号 · 仅供学习与参赛辅助用途
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs hover:opacity-80 transition-opacity" style={{ color: C.textSec }}>隐私政策</a>
              <a href="#" className="text-xs hover:opacity-80 transition-opacity" style={{ color: C.textSec }}>服务条款</a>
              <a href="#" className="text-xs hover:opacity-80 transition-opacity" style={{ color: C.textSec, fontFamily: "Inter" }}>GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}