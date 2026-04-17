import { useState, useRef, useEffect } from "react";
import { Send, ThumbsUp, ThumbsDown, RefreshCw, TrendingUp } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from "recharts";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24", red: "#F87171",
};

const JUDGES = [
  {
    key: "industry", name: "产业评委", title: "上市公司创始人", avatar: "产",
    color: C.blue, desc: "关注商业可行性、市场规模、竞争壁垒",
  },
  {
    key: "academic", name: "学术评委", title: "副教授 · 博导", avatar: "学",
    color: C.purple, desc: "关注技术创新性、研究深度、理论支撑",
  },
  {
    key: "investor", name: "投资人评委", title: "VC 合伙人", avatar: "投",
    color: C.green, desc: "关注团队执行力、增长潜力、退出路径",
  },
];

interface Message {
  id: number;
  role: "judge" | "student";
  judgeKey?: string;
  content: string;
  voted?: null | "up" | "down";
}

const JUDGE_QUESTIONS: Record<string, string[]> = {
  industry: [
    "你们的目标客户是谁？单个客户的年付费意愿大概是多少？",
    "农业合作社这个客群获客成本怎么控制？你们有渠道优势吗？",
    "区块链溯源市场已经有京东农场、天猫溯源了，你们的差异化壁垒是什么？",
    "三年后如果大厂进入这个赛道，你们的护城河在哪里？",
  ],
  academic: [
    "你们用的联盟链方案和公链方案相比，在数据一致性上有什么取舍？",
    "ZKP 隐私保护的性能损耗大概是多少？在低配 IOT 设备上可以运行吗？",
    "XGBoost 模型的训练数据从哪里来？样本量有多少？有没有做过过拟合检验？",
    "你们的技术方案有没有发表过论文或参加过技术评审？",
  ],
  investor: [
    "核心团队有没有全职的计划？你们打算什么时候注册公司？",
    "如果今天给你们 50 万，这笔钱怎么花？18 个月后你们的里程碑是什么？",
    "你们接触过哪些农业合作社？有没有付费意向？LOI 签了吗？",
    "退出路径你们考虑过吗？被大厂并购还是独立上市？",
  ],
};

const JUDGE_PROMPTS: Record<string, string[]> = {
  industry: [
    "从商业角度看，农业合作社愿意为 SaaS 年付费，但要先证明 ROI。建议在 BP 中加入具体案例，量化使用本产品后的损失减少数据。",
    "建议重点研究京东农场的失败案例，找到他们做不好的环节，这就是你们的机会窗口。",
  ],
  academic: [
    "技术创新点要更加量化，不能只说'使用区块链'，要说清楚用了哪种共识算法，TPS 是多少，和现有方案比有多少提升。",
    "建议在路演 PPT 中加入技术路线图，评委喜欢看到你们对技术演进的规划。",
  ],
  investor: [
    "投资人最怕的是团队问题，你们最好提前想好 equity split、vesting 方案，路演时被问到不要答不上来。",
    "50 万的 use of funds 要非常具体：招几个人、花多少钱获客、产品路线图到哪里，每一项都要可量化。",
  ],
};

const INITIAL_SCORES = {
  industry: { innovation: 72, team: 78, commercial: 55, feasibility: 80, impact: 70 },
  academic: { innovation: 85, team: 75, commercial: 60, feasibility: 82, impact: 68 },
  investor: { innovation: 70, team: 82, commercial: 62, feasibility: 76, impact: 65 },
};

const SCORE_DIMS = [
  { key: "innovation", label: "创新性" },
  { key: "team", label: "团队" },
  { key: "commercial", label: "商业" },
  { key: "feasibility", label: "可行性" },
  { key: "impact", label: "引领" },
];

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { setDone(true); clearInterval(timer); }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);
  return { displayed, done };
}

function JudgeMessage({ msg, judgeColor, onVote }: { msg: Message; judgeColor: string; onVote: (v: "up" | "down") => void }) {
  const { displayed, done } = useTypewriter(msg.content, 14);
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ background: judgeColor }}>
        {JUDGES.find((j) => j.key === msg.judgeKey)?.avatar}
      </div>
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-medium" style={{ color: judgeColor }}>
            {JUDGES.find((j) => j.key === msg.judgeKey)?.name}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: `${judgeColor}18`, color: judgeColor }}>
            {JUDGES.find((j) => j.key === msg.judgeKey)?.title}
          </span>
        </div>
        <div className="p-3 rounded-xl text-sm leading-relaxed"
          style={{ background: `${judgeColor}12`, border: `1px solid ${judgeColor}25`, color: C.text }}>
          <p className={!done ? "cursor-blink" : ""}>{displayed}</p>
        </div>
        {done && (
          <div className="flex items-center gap-2 mt-1.5">
            <button onClick={() => onVote("up")}
              className="w-6 h-6 rounded flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: msg.voted === "up" ? C.green : C.textSec }}>
              <ThumbsUp size={11} />
            </button>
            <button onClick={() => onVote("down")}
              className="w-6 h-6 rounded flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: msg.voted === "down" ? C.red : C.textSec }}>
              <ThumbsDown size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [activeJudge, setActiveJudge] = useState("industry");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1, role: "judge", judgeKey: "industry",
      content: "好，你们来介绍一下这个项目。首先，你们的目标客户是谁？单个客户的年付费意愿大概是多少？",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [improvements, setImprovements] = useState(JUDGE_PROMPTS.industry);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const judge = JUDGES.find((j) => j.key === activeJudge)!;
  const currentScores = scores[activeJudge as keyof typeof scores];

  const radarData = SCORE_DIMS.map((d) => ({
    dim: d.label,
    score: currentScores[d.key as keyof typeof currentScores],
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: messages.length + 1, role: "student", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1200));

    const questions = JUDGE_QUESTIONS[activeJudge];
    const nextQ = questions[Math.floor(Math.random() * questions.length)];
    const judgeMsg: Message = { id: messages.length + 2, role: "judge", judgeKey: activeJudge, content: nextQ };
    setMessages((prev) => [...prev, judgeMsg]);
    setLoading(false);

    // Update scores
    setScores((prev) => ({
      ...prev,
      [activeJudge]: {
        ...prev[activeJudge as keyof typeof prev],
        commercial: Math.min(100, prev[activeJudge as keyof typeof prev].commercial + Math.floor(Math.random() * 8) + 2),
        team: Math.min(100, prev[activeJudge as keyof typeof prev].team + Math.floor(Math.random() * 4)),
      },
    }));
    setImprovements(JUDGE_PROMPTS[activeJudge]);
  };

  const switchJudge = (key: string) => {
    setActiveJudge(key);
    setMessages([{
      id: 1, role: "judge", judgeKey: key,
      content: JUDGE_QUESTIONS[key][0],
    }]);
    setImprovements(JUDGE_PROMPTS[key]);
  };

  const voteMessage = (msgId: number, v: "up" | "down") => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, voted: v } : m));
  };

  const overallScore = Math.round(Object.values(currentScores).reduce((a, b) => a + b, 0) / 5);

  return (
    <div className="flex h-full">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Judge selector */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.border}30` }}>
          <h2 className="font-semibold mb-3" style={{ fontSize: 15, color: C.text }}>评审模拟</h2>
          <div className="flex gap-2 flex-wrap">
            {JUDGES.map((j) => (
              <button
                key={j.key}
                onClick={() => switchJudge(j.key)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                style={{
                  background: activeJudge === j.key ? `${j.color}18` : `${C.card}`,
                  border: `1px solid ${activeJudge === j.key ? j.color + "50" : C.border}`,
                }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: j.color }}>
                  {j.avatar}
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium" style={{ color: activeJudge === j.key ? j.color : C.text }}>
                    {j.name}
                  </div>
                  <div className="text-xs" style={{ color: C.textSec }}>{j.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            msg.role === "judge" ? (
              <JudgeMessage
                key={msg.id}
                msg={msg}
                judgeColor={judge.color}
                onVote={(v) => voteMessage(msg.id, v)}
              />
            ) : (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-md">
                  <div className="p-3 rounded-xl text-sm leading-relaxed"
                    style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))", color: C.text, border: `1px solid ${C.blue}25` }}>
                    {msg.content}
                  </div>
                  <p className="text-xs text-right mt-1" style={{ color: C.textSec }}>你的回答</p>
                </div>
              </div>
            )
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                style={{ background: judge.color }}>{judge.avatar}</div>
              <div className="p-3 rounded-xl" style={{ background: `${judge.color}12`, border: `1px solid ${judge.color}25` }}>
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((d) => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: judge.color, animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: `1px solid ${C.border}30` }}>
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`回答${judge.name}的问题… (Enter 发送)`}
              rows={2}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center self-end transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Right sidebar: Radar chart + Suggestions */}
      <div
        className="hidden lg:flex flex-col w-72 shrink-0"
        style={{ borderLeft: `1px solid ${C.border}`, background: `${C.card}60` }}
      >
        {/* Score overview */}
        <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold" style={{ color: C.text }}>实时评分</span>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} style={{ color: C.green }} />
              <span className="text-sm font-bold" style={{ color: C.green }}>{overallScore}</span>
              <span className="text-xs" style={{ color: C.textSec }}>/100</span>
            </div>
          </div>
          <p className="text-xs" style={{ color: C.textSec }}>{judge.name} 视角评分（实时更新）</p>
        </div>

        {/* Radar chart */}
        <div className="h-52 px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={75}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis
                dataKey="dim"
                tick={{ fill: C.textSec, fontSize: 10 }}
              />
              <Radar
                name="评分"
                dataKey="score"
                stroke={judge.color}
                fill={judge.color}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
                formatter={(v: number) => [v, "分"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score breakdown */}
        <div className="px-4 space-y-2 mb-4">
          {SCORE_DIMS.map((d) => {
            const val = currentScores[d.key as keyof typeof currentScores];
            const color = val >= 80 ? C.green : val >= 65 ? C.yellow : C.red;
            return (
              <div key={d.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: C.textSec }}>{d.label}</span>
                  <span className="text-xs font-medium" style={{ color }}>{val}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${C.border}60` }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Improvement suggestions */}
        <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ borderTop: `1px solid ${C.border}` }}>
          <h3 className="text-xs font-semibold mt-3 mb-3" style={{ color: C.text }}>改进建议</h3>
          <div className="space-y-2.5">
            {improvements.map((tip, i) => (
              <div key={i} className="p-3 rounded-xl text-xs leading-relaxed"
                style={{ background: `${judge.color}08`, border: `1px solid ${judge.color}20`, color: C.textSec }}>
                <span style={{ color: judge.color }}>建议 {i + 1}：</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
