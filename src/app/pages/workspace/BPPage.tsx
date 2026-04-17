import { useState, useEffect } from "react";
import { FileText, Download, RefreshCw, ThumbsUp, ThumbsDown, BookOpen, Trophy, ChevronRight } from "lucide-react";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24", red: "#F87171",
};

const DIMENSIONS = [
  { key: "innovation", label: "创新性", weight: "25%", color: C.blue, active: true },
  { key: "team", label: "团队情况", weight: "20%", color: C.purple },
  { key: "commercial", label: "商业模式", weight: "25%", color: C.green },
  { key: "feasibility", label: "可行性", weight: "15%", color: C.yellow },
  { key: "impact", label: "带动就业引领", weight: "15%", color: "#EC4899" },
];

const BP_CONTENT: Record<string, string> = {
  innovation: `## 一、创新性分析

### 1.1 技术创新

本项目采用**联盟区块链（Hyperledger Fabric）** 与**物联网传感器网络**的深度融合方案，实现了以下技术突破：

- **多维数据上链**：将土壤 pH 值、农药施用记录、运输温湿度等 23 项关键指标实时上链，单条溯源记录平均确认时间 < 3 秒
- **零知识证明隐私保护**：在公开溯源数据的同时，通过 ZKP 技术保护农户商业敏感信息，行业内尚无成熟应用案例
- **AI 品质预测模型**：基于历史数据训练的 XGBoost 模型，农产品品质预测准确率达 **91.3%**（实验室验证）

### 1.2 模式创新

区别于传统中心化溯源系统（如阿里巴巴天猫溯源），本项目采用**多方联合记账**机制：

> 农户 → 加工厂 → 物流方 → 零售商 → 消费者，每个节点均为区块链参与方，无法单方篡改数据。

### 1.3 创新性对比

| 维度 | 传统方案 | 本项目方案 |
|------|----------|------------|
| 数据可信度 | 中心化存储，可篡改 | 区块链存储，不可篡改 |
| 隐私保护 | 无 | ZKP 保护商业信息 |
| 实时性 | T+1 更新 | 实时上链 < 3 秒 |
| 参与成本 | 高（专用设备） | 低（微信小程序即可） |`,

  team: `## 二、团队情况

### 2.1 核心成员

**张明远**（队长）— 软件工程大三，主攻区块链方向，曾参与 Hyperledger Fabric 开源贡献，GitHub Stars 200+

**李晓茹** — 计算机科学大三，全栈开发经手，独立完成 3 个微信小程序项目，日活最高 5,000+

**王志强** — 农业经济学大四，在乡政府实习期间深度接触农产品流通体系，拥有真实痛点认知

**陈佳慧** — 数据科学大三，机器学习竞赛获奖者（Kaggle Top 8%），负责品质预测模型开发

### 2.2 指导老师

**刘建国教授** — 电子科技大学网络空间安全学院，区块链方向博士生导师，主持国家自然科学基金 2 项

### 2.3 团队优势

- 技术 × 商业 × 农业三维交叉，避免了纯技术团队的市场盲区
- 已与当地 2 个农业合作社建立合作意向，获得真实数据源
- 原型系统已在测试农场运行 3 个月，积累了 1,200 条真实溯源记录`,

  commercial: `## 三、商业模式

### 3.1 目标市场

**市场规模**：中国农产品溯源市场 2024 年规模约 **280 亿元**，预计 2028 年达 **680 亿元**（CAGR 24.7%）

**目标客户（MVP 阶段）**：
- 有机农产品生产合作社（全国约 22,000 家）
- 中高端生鲜电商平台（盒马、叮咚、美团买菜）
- 政府农业监管部门（食品安全抽查溯源）

### 3.2 盈利模式

\`\`\`
SaaS 订阅  →  农业合作社 ¥3,000–8,000/年
数据服务   →  电商平台品质认证报告 ¥50–200/次
政府采购   →  监管溯源系统定制化开发
\`\`\`

### 3.3 财务预测（三年）

| 年份 | 服务合作社数 | 预计营收 | 净利润率 |
|------|------------|---------|---------|
| Year 1 | 50 | 24 万元 | -35% |
| Year 2 | 200 | 96 万元 | +12% |
| Year 3 | 600 | 288 万元 | +28% |`,

  feasibility: `## 四、可行性分析

### 4.1 技术可行性

✅ **核心技术已验证**：Hyperledger Fabric 已在全球 500+ 企业生产环境部署，技术成熟度高

✅ **原型已完成**：MVP 版本已实现扫码溯源、数据上链、消费者查询三大核心功能

✅ **算法精度达标**：品质预测模型在 300 个样本测试集上 F1-Score = 0.913

### 4.2 市场可行性

- 国家政策：农业农村部 2024 年《农产品质量安全追溯管理办法》强制要求规模农产品溯源
- 消费升级：愿意为可溯源产品支付溢价的消费者比例达 **67%**（尼尔森 2024 调研）

### 4.3 团队执行可行性

- 8 周 MVP 开发计划已细化至 Sprint 级别
- 已获得学校创业基金 **2 万元** 种子支持
- 技术债零积累，代码覆盖率 > 80%`,

  impact: `## 五、带动就业与社会引领

### 5.1 直接带动就业

- 项目成立预计 Year 1 招募 **4 名**全职成员（含 2 名应届毕业生）
- 合作农业合作社规范化运营后，间接稳固农户就业 **200+** 人

### 5.2 乡村振兴贡献

通过数字化溯源体系，帮助农户：
- 有机认证产品溢价提升约 **25%**
- 减少因食品安全问题导致的退货损失约 **40%**
- 对接中高端渠道，拓宽销售半径从县域扩展到全国

### 5.3 数字农业示范效应

项目计划在成都平原 2 个县域试点，形成**可复制的数字农业溯源标准**，推动行业规范化，具有政策示范价值。`,
};

const SIMILAR_AWARDS = [
  { title: "农产品区块链溯源管理平台", competition: "2023 互联网+ 金奖", track: "乡村振兴赛道", match: "92%" },
  { title: "基于物联网的茶叶品质追溯系统", competition: "2024 挑战杯一等奖", track: "科技类作品", match: "85%" },
  { title: "冷链物流区块链监控平台", competition: "2023 大创重点项目", track: "产业数字化", match: "78%" },
];

function useTypewriter(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);
  return { displayed, done };
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-sm" style={{ color: C.text }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i} className="font-bold mt-4 mb-2" style={{ fontSize: 15, color: C.text }}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="font-semibold mt-3 mb-1" style={{ fontSize: 13, color: C.blue }}>{line.slice(4)}</h3>;
        if (line.startsWith("| ")) return (
          <div key={i} className="text-xs px-2 py-1 rounded" style={{ background: `${C.border}30`, fontFamily: "monospace", color: C.textSec }}>{line}</div>
        );
        if (line.startsWith("- ") || line.startsWith("✅ ")) return (
          <div key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: C.textSec }}>
            <span style={{ color: C.green }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, `<strong style="color:${C.text}">$1</strong>`) }} />
          </div>
        );
        if (line.startsWith("> ")) return (
          <blockquote key={i} className="pl-3 py-1 rounded-r text-xs italic" style={{ borderLeft: `2px solid ${C.blue}`, color: C.textSec, background: `${C.blue}08` }}>
            {line.slice(2)}
          </blockquote>
        );
        if (line.startsWith("```")) return <div key={i} />;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-xs leading-relaxed" style={{ color: C.textSec }}
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${C.text}">$1</strong>`) }} />
        );
      })}
    </div>
  );
}

export default function BPPage() {
  const [activeDim, setActiveDim] = useState("innovation");
  const [generating, setGenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [voted, setVoted] = useState<null | "up" | "down">(null);
  const { displayed, done } = useTypewriter(BP_CONTENT[activeDim] || "", generating ? 0 : 8);

  const handleRegenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setGenerating(false);
    setVoted(null);
  };

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Selected topic card */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold" style={{ fontSize: 15, color: C.text }}>BP 生成器</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:bg-white/10"
                style={{ border: `1px solid ${C.border}`, color: C.textSec }}
              >
                <BookOpen size={12} />
                往届案例
              </button>
              <button
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-xs font-medium transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
              >
                <Download size={13} />
                导出 Word / PDF
              </button>
            </div>
          </div>

          {/* Selected topic */}
          <div className="flex items-center gap-3 p-3 rounded-xl mb-3"
            style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}25` }}>
            <Trophy size={14} style={{ color: C.yellow }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: C.text }}>
                基于区块链的农产品溯源与品质认证平台
              </p>
              <p className="text-xs mt-0.5" style={{ color: C.textSec }}>乡村振兴赛道 · 互联网+ · 综合评分 83/100</p>
            </div>
          </div>

          {/* Dimension chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DIMENSIONS.map((dim) => (
              <button
                key={dim.key}
                onClick={() => setActiveDim(dim.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap shrink-0"
                style={{
                  background: activeDim === dim.key ? `${dim.color}20` : `${C.border}30`,
                  border: `1px solid ${activeDim === dim.key ? dim.color + "60" : C.border}`,
                  color: activeDim === dim.key ? dim.color : C.textSec,
                }}
              >
                {dim.label}
                <span className="opacity-70">{dim.weight}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dual-column editor */}
        <div className="flex-1 grid md:grid-cols-2 gap-0 min-h-0" style={{ borderTop: `1px solid ${C.border}30` }}>
          {/* Left: AI Generated Content */}
          <div className="flex flex-col min-h-0" style={{ borderRight: `1px solid ${C.border}30` }}>
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: `1px solid ${C.border}30`, background: `${C.card}80` }}>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: C.textSec }}>AI 生成内容</span>
                {!done && <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: C.blue }} />}
              </div>
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                style={{ color: C.textSec }}
              >
                <RefreshCw size={11} />
                重新生成本段
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {generating ? (
                <div className="space-y-3">
                  {[1, 0.8, 0.9, 0.7, 0.85, 0.6].map((w, i) => (
                    <div key={i} className="skeleton h-3 rounded" style={{ width: `${w * 100}%` }} />
                  ))}
                </div>
              ) : (
                <div className={done ? "" : "cursor-blink"}>
                  <MarkdownRenderer content={displayed} />
                </div>
              )}

              {/* Feedback */}
              {done && (
                <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}30` }}>
                  <span className="text-xs" style={{ color: C.textSec }}>内容质量如何？</span>
                  <button onClick={() => setVoted("up")}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: voted === "up" ? `${C.green}20` : "transparent", border: `1px solid ${voted === "up" ? C.green : C.border}` }}>
                    <ThumbsUp size={12} style={{ color: voted === "up" ? C.green : C.textSec }} />
                  </button>
                  <button onClick={() => setVoted("down")}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: voted === "down" ? `${C.red}20` : "transparent", border: `1px solid ${voted === "down" ? C.red : C.border}` }}>
                    <ThumbsDown size={12} style={{ color: voted === "down" ? C.red : C.textSec }} />
                  </button>
                  {voted && <span className="text-xs" style={{ color: C.textSec }}>感谢反馈！</span>}
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="hidden md:flex flex-col min-h-0">
            <div className="flex items-center px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}30`, background: `${C.card}40` }}>
              <span className="text-xs" style={{ color: C.textSec }}>实时预览</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5" style={{ background: "#0D1326" }}>
              <div className="rounded-xl p-5" style={{ background: "white", maxWidth: 500 }}>
                <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: "1px solid #eee" }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
                    <span className="text-white text-[8px]">赛</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#666", fontFamily: "sans-serif" }}>基于区块链的农产品溯源与品质认证平台 · 商业计划书</span>
                </div>
                <div className="prose prose-sm max-w-none">
                  {displayed.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 8 }}>{line.slice(3)}</h2>;
                    if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 12, fontWeight: 600, color: "#3B82F6", marginBottom: 4 }}>{line.slice(4)}</h3>;
                    if (line.startsWith("- ") || line.startsWith("✅ ")) return <p key={i} style={{ fontSize: 10, color: "#555", marginLeft: 8, marginBottom: 3 }}>• {line.slice(2)}</p>;
                    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
                    return <p key={i} style={{ fontSize: 10, color: "#444", marginBottom: 3, lineHeight: 1.6 }}>{line}</p>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right drawer: Similar award cases */}
      {drawerOpen && (
        <div
          className="hidden lg:flex flex-col w-64 shrink-0"
          style={{ borderLeft: `1px solid ${C.border}`, background: `${C.card}60` }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <BookOpen size={14} style={{ color: C.blue }} />
            <span className="text-sm font-medium" style={{ color: C.text }}>往届相似获奖</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {SIMILAR_AWARDS.map((award, i) => (
              <div key={i} className="rounded-xl p-3 cursor-pointer transition-all hover:bg-white/5"
                style={{ background: `${C.card}`, border: `1px solid ${C.border}` }}>
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: `${C.green}15`, color: C.green }}>
                    匹配 {award.match}
                  </span>
                  <ChevronRight size={12} style={{ color: C.textSec }} />
                </div>
                <p className="text-xs font-medium leading-snug mb-1.5" style={{ color: C.text }}>{award.title}</p>
                <p className="text-xs" style={{ color: C.yellow }}>{award.competition}</p>
                <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{award.track}</p>
              </div>
            ))}
            <p className="text-xs text-center pt-2" style={{ color: C.textSec }}>
              共检索到 12 个相似案例
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
