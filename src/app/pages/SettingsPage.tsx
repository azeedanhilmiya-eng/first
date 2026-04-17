import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User, Users, BarChart3, CreditCard, Code, Bell, Shield,
  Save, Plus, Trash2, AlertTriangle, ChevronRight, Zap
} from "lucide-react";
import AppNav from "../components/AppNav";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24", red: "#F87171",
};

const TABS = [
  { key: "account", label: "账户信息", icon: User },
  { key: "team", label: "团队成员", icon: Users },
  { key: "usage", label: "API 用量", icon: BarChart3 },
  { key: "billing", label: "计费", icon: CreditCard },
  { key: "developer", label: "开发者", icon: Code },
];

const DAILY_USAGE = [
  { date: "4/11", topic: 120, bp: 340, prototype: 80, review: 200, ppt: 60 },
  { date: "4/12", topic: 80, bp: 420, prototype: 120, review: 180, ppt: 90 },
  { date: "4/13", topic: 200, bp: 280, prototype: 60, review: 320, ppt: 140 },
  { date: "4/14", topic: 150, bp: 380, prototype: 200, review: 240, ppt: 80 },
  { date: "4/15", topic: 90, bp: 460, prototype: 160, review: 190, ppt: 110 },
  { date: "4/16", topic: 180, bp: 320, prototype: 100, review: 280, ppt: 160 },
  { date: "4/17", topic: 110, bp: 290, prototype: 140, review: 210, ppt: 70 },
];

const MODULE_USAGE = [
  { module: "立项", tokens: 930, color: C.blue },
  { module: "BP", tokens: 2490, color: C.purple },
  { module: "原型", tokens: 860, color: C.green },
  { module: "评审", tokens: 1620, color: C.yellow },
  { module: "PPT", tokens: 710, color: "#EC4899" },
];

const TEAM_MEMBERS = [
  { name: "张明远", email: "zhang@scu.edu.cn", role: "团队队长", avatar: "张", joined: "2025-03-01" },
  { name: "李晓茹", email: "li@scu.edu.cn", role: "前端开发", avatar: "李", joined: "2025-03-05" },
  { name: "王志强", email: "wang@scu.edu.cn", role: "商业分析", avatar: "王", joined: "2025-03-08" },
];

function AccountTab() {
  const [form, setForm] = useState({ name: "张明远", email: "zhang@scu.edu.cn", school: "四川大学", major: "软件工程", grade: "大三" });
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
          style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>张</div>
        <div>
          <h3 className="font-semibold" style={{ color: C.text }}>张明远</h3>
          <p className="text-sm" style={{ color: C.textSec }}>zhang@scu.edu.cn · 四川大学</p>
          <button className="text-xs mt-1 transition-colors hover:opacity-80" style={{ color: C.blue }}>更换头像</button>
        </div>
      </div>
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="font-medium mb-4" style={{ color: C.text }}>基本信息</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: "name", label: "姓名" },
            { key: "email", label: "邮箱" },
            { key: "school", label: "学校" },
            { key: "major", label: "专业" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs mb-1 block" style={{ color: C.textSec }}>{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: `${C.bg}`, border: `1px solid ${C.border}`, color: C.text }}
              />
            </div>
          ))}
        </div>
        <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
          <Save size={14} />保存修改
        </button>
      </div>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium" style={{ color: C.text }}>团队成员</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", color: "white" }}>
            <Plus size={14} />邀请成员
          </button>
        </div>
        <div className="space-y-3">
          {TEAM_MEMBERS.map((m) => (
            <div key={m.email} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: `${C.bg}60`, border: `1px solid ${C.border}30` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>{m.avatar}</div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: C.text }}>{m.name}</p>
                <p className="text-xs" style={{ color: C.textSec }}>{m.email}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.blue}15`, color: C.blue }}>{m.role}</span>
              <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
                <Trash2 size={13} style={{ color: C.textSec }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageTab() {
  const [threshold, setThreshold] = useState(8000);
  const totalUsed = 2340;
  const totalLimit = 10000;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "本月已用", value: "2,340", sub: "Token", color: C.blue },
          { label: "剩余额度", value: "7,660", sub: "Token", color: C.green },
          { label: "日均消耗", value: "334", sub: "Token/天", color: C.purple },
          { label: "预计耗尽", value: "≈23天", sub: "后", color: C.yellow },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="font-bold mb-0.5" style={{ fontSize: 20, color }}>{value}</div>
            <div className="text-xs" style={{ color: C.textSec }}>{sub}</div>
            <div className="text-xs mt-1" style={{ color: C.textSec }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Daily consumption line chart */}
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="font-medium mb-4" style={{ color: C.text }}>每日 Token 消耗（最近 7 天）</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DAILY_USAGE} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
              <XAxis dataKey="date" tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="topic" stroke={C.blue} strokeWidth={2} dot={false} name="立项" />
              <Line type="monotone" dataKey="bp" stroke={C.purple} strokeWidth={2} dot={false} name="BP" />
              <Line type="monotone" dataKey="review" stroke={C.yellow} strokeWidth={2} dot={false} name="评审" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module bar chart */}
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="font-medium mb-4" style={{ color: C.text }}>按模块消耗分布</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MODULE_USAGE} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
              <XAxis dataKey="module" tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }}
                formatter={(v: number) => [`${v} Token`, "消耗"]}
              />
              <Bar dataKey="tokens" fill={C.blue} radius={[4, 4, 0, 0]} name="Token 消耗" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Threshold setting */}
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} style={{ color: C.yellow }} />
          <h3 className="font-medium" style={{ color: C.text }}>预警阈值设置</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: C.textSec }}>
          当本月用量超过以下阈值时，系统将发送邮件提醒
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range" min={1000} max={10000} step={500}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: C.blue }}
          />
          <div className="px-3 py-1.5 rounded-lg text-sm font-medium w-28 text-center"
            style={{ background: `${C.yellow}15`, border: `1px solid ${C.yellow}40`, color: C.yellow }}>
            {threshold.toLocaleString()} Token
          </div>
        </div>
        <p className="text-xs mt-2" style={{ color: C.textSec }}>
          当前设置：用量超过 <strong style={{ color: C.yellow }}>{threshold.toLocaleString()}</strong> Token（占额度 {Math.round(threshold / totalLimit * 100)}%）时预警
        </p>
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-4">
      {/* Current plan */}
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium" style={{ color: C.text }}>当前套餐</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-bold" style={{ fontSize: 28, color: C.text }}>免费版</span>
              <span style={{ color: C.textSec }}>/ 月</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${C.green}18`, color: C.green }}>当前套餐</span>
        </div>
        <ul className="space-y-2 mb-4">
          {["10,000 Token / 月", "最多 3 个参赛项目", "基础 AI 功能（立项 · BP · 评审）", "社区支持"].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm" style={{ color: C.textSec }}>
              <span style={{ color: C.green }}>✓</span>{f}
            </li>
          ))}
        </ul>
      </div>
      {/* Pro plan */}
      <div className="gradient-border rounded-xl p-5" style={{ boxShadow: `0 0 30px ${C.blue}10` }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium" style={{ color: C.text }}>Pro 版</h3>
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${C.blue}18`, color: C.blue }}>推荐</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-bold gradient-text" style={{ fontSize: 28 }}>¥39</span>
              <span style={{ color: C.textSec }}>/ 月</span>
            </div>
          </div>
        </div>
        <ul className="space-y-2 mb-5">
          {["50,000 Token / 月（5× 免费版）", "无限参赛项目", "原型脚手架 + PPT 大纲功能", "优先 AI 队列（响应更快）", "往届案例库完整访问", "专属导师支持频道"].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm" style={{ color: C.textSec }}>
              <span style={{ color: C.blue }}>✓</span>{f}
            </li>
          ))}
        </ul>
        <button className="w-full py-3 rounded-xl text-white font-medium transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
          升级为 Pro
        </button>
      </div>
    </div>
  );
}

function DevTab() {
  const [apiKey, setApiKey] = useState("sk-compete-agent-xxxxxxxxxxxxxxxxxxxx");
  const [masked, setMasked] = useState(true);
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="font-medium mb-3" style={{ color: C.text }}>API 密钥</h3>
        <p className="text-xs mb-4" style={{ color: C.textSec }}>使用此密钥调用赛道官 API，请勿泄露给他人</p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center px-3 rounded-xl" style={{ background: `${C.bg}`, border: `1px solid ${C.border}` }}>
            <span className="font-mono text-sm py-2.5 flex-1 truncate" style={{ color: C.text }}>
              {masked ? "sk-compete-agent-••••••••••••••••" : apiKey}
            </span>
          </div>
          <button onClick={() => setMasked(!masked)} className="px-3 rounded-xl text-sm transition-all hover:bg-white/5"
            style={{ border: `1px solid ${C.border}`, color: C.textSec }}>
            {masked ? "显示" : "隐藏"}
          </button>
          <button className="px-3 rounded-xl text-sm transition-all hover:bg-white/5"
            style={{ border: `1px solid ${C.border}`, color: C.textSec }}>
            复制
          </button>
        </div>
      </div>
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="font-medium mb-3" style={{ color: C.text }}>Webhook 配置</h3>
        <div>
          <label className="text-xs mb-1 block" style={{ color: C.textSec }}>回调 URL</label>
          <input
            placeholder="https://your-server.com/webhook/compete-agent"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: `${C.bg}`, border: `1px solid ${C.border}`, color: C.text }}
          />
        </div>
        <button className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
          <Save size={14} />保存 Webhook
        </button>
      </div>
    </div>
  );
}

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  account: AccountTab,
  team: TeamTab,
  usage: UsageTab,
  billing: BillingTab,
  developer: DevTab,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const TabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh" }}>
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate("/dashboard")} className="text-sm transition-colors hover:opacity-80" style={{ color: C.textSec }}>
            仪表盘
          </button>
          <ChevronRight size={14} style={{ color: C.border }} />
          <span className="text-sm" style={{ color: C.text }}>设置</span>
        </div>

        <div className="flex gap-6">
          {/* Left Tabs */}
          <div
            className="hidden sm:flex flex-col gap-1 w-44 shrink-0"
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                style={{
                  background: activeTab === key ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))" : "transparent",
                  border: activeTab === key ? `1px solid ${C.blue}30` : "1px solid transparent",
                  color: activeTab === key ? C.blue : C.textSec,
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Mobile: horizontal tabs */}
          <div className="sm:hidden flex gap-2 overflow-x-auto pb-2 mb-2 w-full">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm shrink-0 transition-all"
                style={{
                  background: activeTab === key ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))" : C.card,
                  border: `1px solid ${activeTab === key ? C.blue + "50" : C.border}`,
                  color: activeTab === key ? C.blue : C.textSec,
                }}
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold mb-5" style={{ fontSize: 16, color: C.text }}>
              {TABS.find((t) => t.key === activeTab)?.label}
            </h2>
            <TabComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
