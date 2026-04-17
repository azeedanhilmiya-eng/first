import { useState } from "react";
import { Download, RefreshCw, Play, Edit3, ThumbsUp, ThumbsDown, Mic, Sparkles } from "lucide-react";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24", red: "#F87171",
};

const SLIDES = [
  {
    id: 1, title: "封面页", icon: "🎯",
    points: ["项目名称：基于区块链的农产品溯源与品质认证平台", "团队名称、学校、参赛赛道", "一句话价值主张"],
    tone: "自信简洁，避免 buzzword 堆砌，直接亮出核心价值",
    color: "#3B82F6",
  },
  {
    id: 2, title: "问题与机遇", icon: "❓",
    points: ["每年食品安全事件 X 起，消费者对农产品信任度仅 32%", "现有溯源系统数据可篡改，中心化存储存在单点风险", "政策窗口：农业农村部 2024 年强制溯源新规"],
    tone: "用数据说话，引发共鸣，让评委先感受到痛点",
    color: "#F87171",
  },
  {
    id: 3, title: "解决方案", icon: "💡",
    points: ["联盟区块链 + IoT 传感器网络的融合架构", "零知识证明保护农户商业隐私", "消费者微信扫码即可查询完整溯源链"],
    tone: "技术术语对普通人要解释清楚，产业评委重视'为什么是我们能做'",
    color: "#10B981",
  },
  {
    id: 4, title: "技术创新", icon: "⚡",
    points: ["自研多维数据上链协议：23 项关键指标，确认时间 < 3 秒", "品质预测 AI 模型：XGBoost，F1 = 0.913", "零知识证明隐私层：行业首例应用于农业溯源"],
    tone: "学术评委最看这页，要有数据支撑，不能只堆概念",
    color: "#8B5CF6",
  },
  {
    id: 5, title: "市场机遇", icon: "📈",
    points: ["中国农产品溯源市场 2024：280 亿元，CAGR 24.7%", "目标客群：全国 22,000 家有机农业合作社", "政策催化：农业农村部强制溯源令 2025 年全面执行"],
    tone: "数据要有出处，投资人会核查，避免过度乐观的预测",
    color: "#FBBF24",
  },
  {
    id: 6, title: "商业模式", icon: "💰",
    points: ["SaaS 年费：合作社端 3,000–8,000 元/年", "数据服务：品质认证报告 50–200 元/次", "政府采购：监管平台定制化开发"],
    tone: "清晰展示盈利闭环，产业评委喜欢看收费逻辑是否合理",
    color: "#10B981",
  },
  {
    id: 7, title: "竞争分析", icon: "🏆",
    points: ["直接竞争：京东农场溯源（中心化）、天猫溯源（不开放）", "我们的差异：多方联合记账、ZKP 隐私、低接入门槛", "护城河：数据网络效应 + 区块链联盟规模壁垒"],
    tone: "不要回避竞争对手，正视差距更显成熟，重点说'为什么是我们'",
    color: "#3B82F6",
  },
  {
    id: 8, title: "团队介绍", icon: "👥",
    points: ["4 人核心团队：技术 × 商业 × 农业三维交叉", "指导老师：XXX 教授，区块链方向博导", "已获种子资金 2 万元，与 2 个合作社签订合作意向"],
    tone: "团队页要突出互补性，评委投的是人，不只是项目",
    color: "#8B5CF6",
  },
  {
    id: 9, title: "执行路线图", icon: "🗺️",
    points: ["MVP（已完成）：微信扫码溯源 + 基础上链", "Phase 2（3 个月）：AI 品质预测上线，50 家合作社签约", "Phase 3（12 个月）：300 家合作社，全国区域覆盖"],
    tone: "里程碑要具体可量化，避免'努力推进'这类虚词",
    color: "#FBBF24",
  },
  {
    id: 10, title: "总结与愿景", icon: "✨",
    points: ["用科技重建农产品信任体系，让每一口食物都可溯源", "已有 1,200 条真实溯源数据，验证了市场可行性", "期待与评委共同推动中国农业数字化转型"],
    tone: "结尾要有感召力但不夸张，留一句记忆点让评委印象深刻",
    color: "#10B981",
  },
];

function SlideThumb({ slide, active, onClick }: { slide: typeof SLIDES[0]; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group"
      style={{
        background: active
          ? `linear-gradient(135deg, ${slide.color}18, ${slide.color}08)`
          : C.card,
        border: `1px solid ${active ? slide.color + "60" : C.border}`,
        boxShadow: active ? `0 0 15px ${slide.color}15` : "none",
        aspectRatio: "16/9",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="p-3 h-full flex flex-col">
        <div className="flex items-center gap-1.5 mb-2">
          <span style={{ fontSize: 14 }}>{slide.icon}</span>
          <span className="text-xs font-medium truncate" style={{ color: active ? slide.color : C.text }}>
            {slide.id}. {slide.title}
          </span>
        </div>
        <div className="flex-1 space-y-1 overflow-hidden">
          {slide.points.slice(0, 2).map((p, i) => (
            <div key={i} className="flex items-start gap-1">
              <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: slide.color }} />
              <p className="text-[9px] leading-tight line-clamp-1" style={{ color: C.textSec }}>{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hover overlay: regenerate */}
      {hovered && !active && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(11,16,32,0.8)" }}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", color: "white" }}>
            <RefreshCw size={11} />重新生成本页
          </button>
        </div>
      )}

      {active && (
        <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: slide.color }}>
          <span className="text-white text-[8px]">✓</span>
        </div>
      )}
    </div>
  );
}

export default function PPTPage() {
  const [activePage, setActivePage] = useState(0);
  const [editedPoints, setEditedPoints] = useState<string[][]>(SLIDES.map((s) => [...s.points]));
  const [titles, setTitles] = useState(SLIDES.map((s) => s.title));
  const [voted, setVoted] = useState<null | "up" | "down">(null);
  const [regenerating, setRegenrating] = useState(false);

  const slide = SLIDES[activePage];

  const handleRegenPage = async () => {
    setRegenrating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRegenrating(false);
    setVoted(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}30` }}>
        <div>
          <h2 className="font-semibold" style={{ fontSize: 15, color: C.text }}>答辩 PPT 大纲</h2>
          <p className="text-xs mt-0.5" style={{ color: C.textSec }}>10 页路演幻灯片，含 AI 语气建议</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all hover:opacity-90"
            style={{ border: `1px solid ${C.border}`, color: C.textSec }}
          >
            <Play size={14} />
            进入路演彩排
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
          >
            <Download size={14} />
            下载 PPTX
          </button>
        </div>
      </div>

      {/* Main: slide grid + edit panel */}
      <div className="flex-1 flex min-h-0">
        {/* Slide thumbnails */}
        <div
          className="overflow-y-auto p-4"
          style={{
            width: "min(280px, 45vw)",
            borderRight: `1px solid ${C.border}30`,
            flexShrink: 0,
          }}
        >
          <p className="text-xs mb-3" style={{ color: C.textSec }}>
            {SLIDES.length} 页 · 点击编辑 · 悬停重新生成
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {SLIDES.map((slide, i) => (
              <SlideThumb
                key={slide.id}
                slide={slide}
                active={activePage === i}
                onClick={() => setActivePage(i)}
              />
            ))}
          </div>
        </div>

        {/* Edit panel */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Slide header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${slide.color}18`, border: `1px solid ${slide.color}30` }}>
              {slide.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: C.textSec, fontFamily: "Inter" }}>SLIDE {slide.id}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${slide.color}18`, color: slide.color }}>
                  当前编辑
                </span>
              </div>
              <input
                value={titles[activePage]}
                onChange={(e) => setTitles((prev) => { const n = [...prev]; n[activePage] = e.target.value; return n; })}
                className="font-semibold text-base outline-none bg-transparent mt-0.5 w-full"
                style={{ color: C.text }}
              />
            </div>
            <button
              onClick={handleRegenPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
              style={{ border: `1px solid ${C.border}`, color: C.textSec }}
            >
              {regenerating ? <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: C.blue }} /> : <RefreshCw size={11} />}
              重新生成本页
            </button>
          </div>

          {/* Slide preview */}
          <div
            className="rounded-xl p-6 mb-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${slide.color}10, ${slide.color}04)`,
              border: `1px solid ${slide.color}30`,
              aspectRatio: "16/9",
              maxHeight: 240,
            }}
          >
            <div className="absolute inset-0 dot-grid-bg opacity-20" />
            <div className="relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 24 }}>{slide.icon}</span>
                <h3 className="font-bold" style={{ fontSize: 18, color: C.text }}>{titles[activePage]}</h3>
              </div>
              <ul className="space-y-1.5">
                {editedPoints[activePage].slice(0, 3).map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.textSec }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: slide.color }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key points editor */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Edit3 size={14} style={{ color: C.blue }} />
              <h4 className="text-sm font-medium" style={{ color: C.text }}>关键要点</h4>
              <span className="text-xs" style={{ color: C.textSec }}>（逐条编辑）</span>
            </div>
            <div className="space-y-2.5">
              {editedPoints[activePage].map((point, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 mt-1.5"
                    style={{ background: `${slide.color}20`, color: slide.color }}>
                    {i + 1}
                  </div>
                  <textarea
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...editedPoints];
                      newPoints[activePage] = [...newPoints[activePage]];
                      newPoints[activePage][i] = e.target.value;
                      setEditedPoints(newPoints);
                    }}
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AI Tone suggestion */}
          <div className="rounded-xl p-4 mb-5"
            style={{ background: `${slide.color}08`, border: `1px solid ${slide.color}25` }}>
            <div className="flex items-center gap-2 mb-2">
              <Mic size={14} style={{ color: slide.color }} />
              <span className="text-xs font-medium" style={{ color: slide.color }}>AI 语气建议</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>{slide.tone}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs" style={{ color: C.textSec }}>建议有帮助吗？</span>
              <button onClick={() => setVoted("up")}
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: voted === "up" ? `${C.green}20` : "transparent", border: `1px solid ${voted === "up" ? C.green : C.border}` }}>
                <ThumbsUp size={11} style={{ color: voted === "up" ? C.green : C.textSec }} />
              </button>
              <button onClick={() => setVoted("down")}
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: voted === "down" ? `${C.red}20` : "transparent", border: `1px solid ${voted === "down" ? C.red : C.border}` }}>
                <ThumbsDown size={11} style={{ color: voted === "down" ? C.red : C.textSec }} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              disabled={activePage === 0}
              onClick={() => setActivePage((p) => p - 1)}
              className="px-4 py-2 rounded-xl text-sm transition-all hover:bg-white/5 disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, color: C.textSec }}
            >
              ← 上一页
            </button>
            <span className="text-sm" style={{ color: C.textSec }}>
              {activePage + 1} / {SLIDES.length}
            </span>
            <button
              disabled={activePage === SLIDES.length - 1}
              onClick={() => setActivePage((p) => p + 1)}
              className="px-4 py-2 rounded-xl text-sm transition-all hover:bg-white/5 disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, color: C.textSec }}
            >
              下一页 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
