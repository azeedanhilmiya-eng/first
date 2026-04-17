import { useState } from "react";
import {
  Lightbulb, Zap, Trophy, ChevronRight, ThumbsUp, ThumbsDown,
  AlertTriangle, RefreshCw, Star, BarChart2, TrendingUp, Shield
} from "lucide-react";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24", red: "#F87171",
};

const MOCK_TOPICS = [
  {
    title: "基于区块链的农产品溯源与品质认证平台",
    desc: "利用区块链不可篡改特性，构建从种植到消费的全链路数字化溯源体系，解决食品安全信息不对称问题。",
    scores: { innovation: 88, feasibility: 82, commercial: 79 },
    awards: ["2023 互联网+ 金奖相似项目", "2024 挑战杯一等奖类型"],
    mvp: ["微信小程序扫码溯源", "农户端数据上链", "消费者评价系统", "政府监管后台"],
    risks: ["技术门槛较高", "农户端推广难度大", "区块链Gas费成本"],
    recommended: true,
  },
  {
    title: "AI 驱动的高校心理健康早期预警系统",
    desc: "基于自然语言处理与多模态数据分析，构建大学生心理健康风险评估模型，实现早期预警与干预推送。",
    scores: { innovation: 85, feasibility: 75, commercial: 65 },
    awards: ["2024 大创重点项目", "2023 挑战杯三等奖相似"],
    mvp: ["匿名心理量表系统", "NLP 情绪分析引擎", "辅导员预警推送", "数据隐私保护层"],
    risks: ["数据隐私合规挑战", "模型误判率控制", "心理数据敏感性"],
    recommended: false,
  },
  {
    title: "面向乡村振兴的智能电商供应链优化系统",
    desc: "运用机器学习预测农产品需求波动，智能匹配农户与电商平台，减少农产品滞销和供应链中间环节损耗。",
    scores: { innovation: 72, feasibility: 90, commercial: 86 },
    awards: ["2024 互联网+ 银奖赛道", "青年红色筑梦赛道热门"],
    mvp: ["需求预测仪表盘", "农户订单匹配系统", "物流路径优化", "收益分析报告"],
    risks: ["竞品方案成熟度高", "物流合作方依赖", "季节性数据不稳定"],
    recommended: false,
  },
];

const TRACK_OPTIONS = ["乡村振兴赛道", "医疗健康赛道", "绿色环保赛道", "教育信息化赛道", "产业数字化赛道", "智慧城市赛道"];
const GROUP_OPTIONS = ["本科生创业组", "研究生创业组", "公益组", "国际赛道"];
const WEEK_OPTIONS = ["4 周", "6 周", "8 周", "10 周", "12 周以上"];

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: C.textSec }}>{label}</span>
        <span className="text-xs font-medium" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${C.border}60` }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="skeleton h-4 w-3/4 rounded mb-3" />
      <div className="skeleton h-3 w-full rounded mb-1.5" />
      <div className="skeleton h-3 w-5/6 rounded mb-4" />
      <div className="space-y-2">
        <div className="skeleton h-2 w-full rounded" />
        <div className="skeleton h-2 w-full rounded" />
        <div className="skeleton h-2 w-full rounded" />
      </div>
    </div>
  );
}

function FeedbackBar() {
  const [voted, setVoted] = useState<null | "up" | "down">(null);
  return (
    <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}30` }}>
      <span className="text-xs" style={{ color: C.textSec }}>这个推荐有帮助吗？</span>
      <button
        onClick={() => setVoted("up")}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
        style={{ background: voted === "up" ? `${C.green}20` : "transparent", border: `1px solid ${voted === "up" ? C.green : C.border}` }}
      >
        <ThumbsUp size={12} style={{ color: voted === "up" ? C.green : C.textSec }} />
      </button>
      <button
        onClick={() => setVoted("down")}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
        style={{ background: voted === "down" ? `${C.red}20` : "transparent", border: `1px solid ${voted === "down" ? C.red : C.border}` }}
      >
        <ThumbsDown size={12} style={{ color: voted === "down" ? C.red : C.textSec }} />
      </button>
      {voted && <span className="text-xs" style={{ color: C.textSec }}>感谢反馈！</span>}
    </div>
  );
}

export default function TopicPage() {
  const [formData, setFormData] = useState({
    competition: "中国国际"互联网+"大学生创新创业大赛",
    track: "乡村振兴赛道",
    group: "本科生创业组",
    interests: "农业科技、区块链、人工智能",
    skills: "Python、React、微信小程序开发",
    weeks: "8 周",
  });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(0);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    await new Promise((r) => setTimeout(r, 2200));
    setLoading(false);
    setGenerated(true);
  };

  return (
    <div className="flex flex-col xl:flex-row h-full">
      {/* Left: Input Form */}
      <div
        className="xl:w-80 shrink-0 p-5 overflow-y-auto"
        style={{ borderRight: `1px solid ${C.border}40` }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb size={18} style={{ color: C.yellow }} />
          <h2 className="font-semibold" style={{ fontSize: 15, color: C.text }}>立项配置</h2>
        </div>

        <div className="space-y-4">
          {/* Competition */}
          <div className="rounded-xl p-4" style={{ background: `${C.card}80`, border: `1px solid ${C.border}` }}>
            <h3 className="text-xs font-medium mb-3" style={{ color: C.textSec }}>竞赛信息</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: C.textSec }}>目标赛事</label>
                <select
                  value={formData.competition}
                  onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                >
                  {["中国国际"互联网+"大学生创新创业大赛", "挑战杯全国大学生课外学术科技作品竞赛", "全国大学生创新创业训练计划"].map((c) => (
                    <option key={c} value={c} style={{ background: C.card }}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: C.textSec }}>赛道方向</label>
                <select
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                >
                  {TRACK_OPTIONS.map((t) => <option key={t} value={t} style={{ background: C.card }}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: C.textSec }}>参赛组别</label>
                <select
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                >
                  {GROUP_OPTIONS.map((g) => <option key={g} value={g} style={{ background: C.card }}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Team Info */}
          <div className="rounded-xl p-4" style={{ background: `${C.card}80`, border: `1px solid ${C.border}` }}>
            <h3 className="text-xs font-medium mb-3" style={{ color: C.textSec }}>团队信息</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: C.textSec }}>兴趣方向</label>
                <textarea
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  rows={2}
                  placeholder="例：农业科技、区块链、可持续发展"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: C.textSec }}>团队技术能力</label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  rows={2}
                  placeholder="例：Python、前端开发、数据分析"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: C.textSec }}>可投入周数</label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_OPTIONS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setFormData({ ...formData, weeks: w })}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        background: formData.weeks === w ? "linear-gradient(135deg, #3B82F6, #8B5CF6)" : `${C.border}40`,
                        color: formData.weeks === w ? "white" : C.textSec,
                        border: formData.weeks === w ? "none" : `1px solid ${C.border}`,
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
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
      </div>

      {/* Right: Results */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ fontSize: 15, color: C.text }}>
            候选选题推荐
            {generated && <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.green}18`, color: C.green }}>3 条已生成</span>}
          </h2>
          {generated && (
            <button onClick={handleGenerate} className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80" style={{ color: C.textSec }}>
              <RefreshCw size={12} />换一批
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : generated ? (
          <div className="space-y-4">
            {MOCK_TOPICS.map((topic, idx) => (
              <div
                key={idx}
                className="rounded-xl p-5 cursor-pointer transition-all duration-200"
                style={{
                  background: selectedTopic === idx
                    ? "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))"
                    : C.card,
                  border: selectedTopic === idx ? `1px solid ${C.blue}50` : `1px solid ${C.border}`,
                  boxShadow: selectedTopic === idx ? `0 0 20px ${C.blue}15` : "none",
                }}
                onClick={() => setSelectedTopic(idx)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {topic.recommended && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: `${C.yellow}18`, color: C.yellow, border: `1px solid ${C.yellow}30` }}>
                          <Star size={10} fill={C.yellow} />推荐优先
                        </span>
                      )}
                      <span className="text-xs" style={{ color: C.textSec }}>选题 {idx + 1}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{topic.title}</h3>
                  </div>
                  {selectedTopic === idx && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
                      <span className="text-[10px] text-white">✓</span>
                    </div>
                  )}
                </div>

                <p className="text-sm mb-4 leading-relaxed" style={{ color: C.textSec }}>{topic.desc}</p>

                {/* Scores */}
                <div className="space-y-2 mb-4">
                  <ScoreBar label="创新性" value={topic.scores.innovation} color={C.blue} />
                  <ScoreBar label="可行性" value={topic.scores.feasibility} color={C.green} />
                  <ScoreBar label="商业价值" value={topic.scores.commercial} color={C.purple} />
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {topic.awards.map((award) => (
                    <span key={award} className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                      style={{ background: `${C.yellow}10`, color: C.yellow, border: `1px solid ${C.yellow}20` }}>
                      <Trophy size={10} />
                      {award}
                    </span>
                  ))}
                </div>

                {/* MVP and Risks */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: C.textSec }}>MVP 范围</p>
                    <ul className="space-y-1">
                      {topic.mvp.map((m) => (
                        <li key={m} className="flex items-center gap-1.5 text-xs" style={{ color: C.textSec }}>
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: C.green }} />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: C.textSec }}>关键风险</p>
                    <div className="flex flex-wrap gap-1">
                      {topic.risks.map((r) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1"
                          style={{ background: `${C.red}10`, color: C.red, border: `1px solid ${C.red}20` }}>
                          <AlertTriangle size={9} />
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <FeedbackBar />
              </div>
            ))}

            {/* Recommendation strip */}
            {selectedTopic !== null && (
              <div
                className="gradient-border rounded-xl p-4 flex items-center gap-4"
                style={{ boxShadow: `0 0 30px ${C.blue}10` }}
              >
                <Trophy size={20} style={{ color: C.yellow }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: C.text }}>
                    已选择：{MOCK_TOPICS[selectedTopic].title.substring(0, 20)}…
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: C.textSec }}>
                    推荐优先级：综合评分最高，与往届获奖项目赛道高度吻合
                  </p>
                </div>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
                >
                  进入 BP 生成 <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <Lightbulb size={40} style={{ color: C.border }} className="mb-3" />
            <p style={{ color: C.textSec }}>填写左侧表单，点击生成候选选题</p>
          </div>
        )}
      </div>
    </div>
  );
}
