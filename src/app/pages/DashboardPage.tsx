import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Lightbulb, FileText, Code2, MessageSquareText, Presentation,
  TrendingUp, Zap, Target, BarChart3, AlertTriangle, CheckCircle2, Clock
} from "lucide-react";
import AppNav from "../components/AppNav";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24", red: "#F87171",
};

const PROJECTS = [
  {
    id: 1, name: "智慧农业溯源平台", track: "乡村振兴赛道", competition: "互联网+",
    color: C.green, updated: "2小时前",
    progress: { topic: 100, bp: 80, prototype: 45, review: 20, ppt: 0 },
    status: "进行中",
  },
  {
    id: 2, name: "AI 心理健康助手", track: "医疗健康赛道", competition: "挑战杯",
    color: C.purple, updated: "昨天",
    progress: { topic: 100, bp: 100, prototype: 90, review: 60, ppt: 30 },
    status: "评审阶段",
  },
  {
    id: 3, name: "碳中和监测系统", track: "绿色环保赛道", competition: "大创",
    color: C.yellow, updated: "3天前",
    progress: { topic: 100, bp: 40, prototype: 0, review: 0, ppt: 0 },
    status: "撰写 BP",
  },
];

const TOKEN_DATA = [
  { name: "已使用", value: 2340, color: C.blue },
  { name: "剩余", value: 7660, color: C.border },
];

const TIPS = [
  { icon: TrendingUp, color: C.green, text: "项目"AI 心理健康"路演准备度已达 76%，建议进行最后一轮评审模拟" },
  { icon: AlertTriangle, color: C.yellow, text: "互联网+省赛报名截止还有 12 天，"智慧农业"BP 建议本周完成" },
  { icon: CheckCircle2, color: C.blue, text: "本月已节省约 34 小时准备时间，相当于完成了 4.25 个工作日" },
];

const STEP_LABELS = [
  { key: "topic", label: "立项", icon: Lightbulb },
  { key: "bp", label: "BP", icon: FileText },
  { key: "prototype", label: "原型", icon: Code2 },
  { key: "review", label: "评审", icon: MessageSquareText },
  { key: "ppt", label: "PPT", icon: Presentation },
];

function ProjectCard({ project, onClick }: { project: typeof PROJECTS[0]; onClick: () => void }) {
  const steps = Object.values(project.progress);
  const overall = Math.round(steps.reduce((a, b) => a + b, 0) / steps.length);

  return (
    <div
      className="rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 duration-200 group"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: project.color }} />
            <span className="text-xs" style={{ color: project.color }}>
              {project.competition}
            </span>
          </div>
          <h3 className="font-semibold" style={{ fontSize: 15, color: C.text }}>{project.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{project.track}</p>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: `${project.color}18`, color: project.color, border: `1px solid ${project.color}30`, whiteSpace: "nowrap" }}
        >
          {project.status}
        </span>
      </div>

      {/* Progress bars */}
      <div className="space-y-2 mb-3">
        {STEP_LABELS.map(({ key, label }) => {
          const val = project.progress[key as keyof typeof project.progress];
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs w-8 shrink-0" style={{ color: C.textSec }}>{label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${C.border}60` }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${val}%`,
                    background: val === 100
                      ? `linear-gradient(to right, ${C.green}, ${C.green}dd)`
                      : "linear-gradient(to right, #3B82F6, #8B5CF6)",
                  }}
                />
              </div>
              <span className="text-xs w-8 text-right shrink-0" style={{ color: val === 100 ? C.green : C.textSec }}>
                {val}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5" style={{ color: C.textSec }}>
          <Clock size={12} />
          <span className="text-xs">{project.updated}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: `${C.border}60` }}>
            <div className="h-full rounded-full" style={{ width: `${overall}%`, background: "linear-gradient(to right, #3B82F6, #8B5CF6)" }} />
          </div>
          <span className="text-xs font-medium gradient-text">{overall}%</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  // Countdown to next competition deadline
  const deadline = new Date("2025-09-15");
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh" }}>
      <AppNav />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Greeting Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, color: C.text }}>
              {greeting}，张同学 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: C.textSec }}>
              你有 3 个进行中的参赛项目，继续加油！
            </p>
          </div>
          {/* Countdown capsule */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-full"
            style={{
              background: `${C.yellow}18`,
              border: `1px solid ${C.yellow}30`,
            }}
          >
            <Target size={16} style={{ color: C.yellow }} />
            <div>
              <span className="text-xs" style={{ color: C.textSec }}>互联网+省赛报名</span>
              <span className="font-bold ml-2" style={{ color: C.yellow }}>还有 {daysLeft} 天</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Quick Create */}
            <button
              onClick={() => navigate("/workspace/topic")}
              className="w-full flex flex-col sm:flex-row items-center gap-4 p-5 rounded-xl mb-6 transition-all hover:opacity-90 duration-200 group"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))",
                border: `1px solid ${C.blue}30`,
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
                <Plus size={22} className="text-white" />
              </div>
              <div className="text-center sm:text-left">
                <div className="font-semibold text-base" style={{ color: C.text }}>开始新参赛项目</div>
                <div className="text-sm mt-0.5" style={{ color: C.textSec }}>
                  选择赛道 → AI 推荐选题 → 自动生成 BP → 全流程辅导
                </div>
              </div>
              <div className="sm:ml-auto flex items-center gap-1 text-sm" style={{ color: C.blue }}>
                立即开始 <Zap size={14} />
              </div>
            </button>

            {/* Projects Grid */}
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>我的参赛项目</h2>
              <span className="text-sm" style={{ color: C.textSec }}>{PROJECTS.length} 个项目</span>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {PROJECTS.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate("/workspace/topic")}
                />
              ))}
              {/* Add new */}
              <button
                onClick={() => navigate("/workspace/topic")}
                className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/5 duration-200 min-h-48"
                style={{ border: `1px dashed ${C.border}`, color: C.textSec }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ border: `1px dashed ${C.border}` }}>
                  <Plus size={20} />
                </div>
                <span className="text-sm">新建项目</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar (desktop only) */}
          <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
            {/* Token Usage Donut */}
            <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: C.text }}>本月 Token 用量</h3>
                <BarChart3 size={16} style={{ color: C.textSec }} />
              </div>
              <div className="h-36 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={TOKEN_DATA}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={60}
                      startAngle={90} endAngle={-270}
                      dataKey="value" paddingAngle={2}
                    >
                      {TOKEN_DATA.map((entry, index) => (
                        <Cell key={index} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-bold" style={{ fontSize: 20, color: C.text }}>2,340</span>
                  <span className="text-xs" style={{ color: C.textSec }}>/ 10,000</span>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5" style={{ color: C.textSec }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: C.blue }} />已用
                  </span>
                  <span style={{ color: C.text }}>2,340 (23.4%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5" style={{ color: C.textSec }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: C.border }} />剩余
                  </span>
                  <span style={{ color: C.text }}>7,660</span>
                </div>
              </div>
              <button
                className="w-full mt-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", color: "white" }}
              >
                升级为 Pro（50,000 Token/月）
              </button>
            </div>

            {/* Tips */}
            <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: C.text }}>优化建议</h3>
              <div className="space-y-3">
                {TIPS.map(({ icon: Icon, color, text }, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}18` }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.textSec }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>近期活动</h3>
              <div className="space-y-3">
                {[
                  { time: "今天 14:32", action: "BP 第五章「商业模式」已生成", color: C.blue },
                  { time: "今天 11:20", action: "评委"投资人"模拟评分 4.2/5", color: C.green },
                  { time: "昨天 16:45", action: "项目里程碑#3 标记完成", color: C.purple },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: item.color }} />
                    <div>
                      <p className="text-xs" style={{ color: C.text }}>{item.action}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
