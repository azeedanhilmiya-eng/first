import { useState } from "react";
import { Code2, Github, CheckCircle2, Circle, Clock, ChevronRight, Zap, Layers, Smartphone, Server } from "lucide-react";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24", red: "#F87171",
};

const TEMPLATES = [
  {
    key: "nextjs",
    name: "Next.js 全栈",
    desc: "前后端一体，适合需要 SSR 和 API Routes 的 Web 应用",
    icon: Layers,
    color: C.blue,
    techStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Prisma ORM", "PostgreSQL", "Vercel 部署"],
    files: [
      "app/page.tsx — 首页",
      "app/api/trace/route.ts — 溯源 API",
      "app/api/auth/[...nextauth].ts — 认证",
      "prisma/schema.prisma — 数据模型",
      "components/TraceCard.tsx — 溯源卡片",
      "lib/blockchain.ts — 链上交互",
      "middleware.ts — 路由守卫",
    ],
  },
  {
    key: "fastapi",
    name: "Python FastAPI",
    desc: "高性能异步后端，配合 React 前端，适合 AI/ML 模型集成",
    icon: Server,
    color: C.purple,
    techStack: ["FastAPI", "Python 3.11", "SQLAlchemy", "Celery", "Redis", "Docker Compose"],
    files: [
      "main.py — FastAPI 入口",
      "routers/trace.py — 溯源路由",
      "routers/auth.py — 认证路由",
      "models/product.py — 数据模型",
      "services/blockchain.py — 区块链服务",
      "tasks/quality_pred.py — 品质预测任务",
      "frontend/src/App.tsx — React 前端",
    ],
  },
  {
    key: "miniapp",
    name: "微信小程序",
    desc: "原生小程序开发，配套云开发，覆盖 12 亿微信用户",
    icon: Smartphone,
    color: C.green,
    techStack: ["微信原生 WXML", "TypeScript", "微信云开发", "云函数", "云数据库", "云存储"],
    files: [
      "pages/index/index.wxml — 首页",
      "pages/scan/scan.ts — 扫码溯源",
      "pages/trace/trace.ts — 溯源详情",
      "cloudfunctions/upload/index.ts — 上链云函数",
      "cloudfunctions/query/index.ts — 查询云函数",
      "components/qrcode/qrcode.wxml — 二维码组件",
    ],
  },
];

const MILESTONES = [
  { id: 1, title: "项目初始化与环境搭建", desc: "创建仓库、配置 CI/CD、搭建开发环境", days: "Day 1–2", status: "done", priority: "高" },
  { id: 2, title: "数据库模型设计", desc: "设计农产品、溯源记录、用户等核心数据模型，完成迁移脚本", days: "Day 2–3", status: "done", priority: "高" },
  { id: 3, title: "用户认证系统", desc: "JWT 认证、角色权限（农户/消费者/管理员）、登录注册接口", days: "Day 3–5", status: "active", priority: "高" },
  { id: 4, title: "农产品信息上链模块", desc: "集成 Hyperledger Fabric SDK，实现农产品信息写入区块链", days: "Day 5–9", status: "active", priority: "高" },
  { id: 5, title: "溯源查询 API 开发", desc: "扫码 → 链上查询 → 返回完整溯源链数据，响应时间 < 3s", days: "Day 9–11", status: "pending", priority: "高" },
  { id: 6, title: "品质预测模型集成", desc: "封装 XGBoost 模型为 REST API，集成到农产品创建流程", days: "Day 11–13", status: "pending", priority: "中" },
  { id: 7, title: "消费者前端 — 扫码溯源页", desc: "微信小程序扫码页面，展示溯源时间线与品质报告", days: "Day 13–15", status: "pending", priority: "高" },
  { id: 8, title: "农户管理后台", desc: "农户端数据录入、批次管理、上链记录查看", days: "Day 15–17", status: "pending", priority: "中" },
  { id: 9, title: "管理员监控平台", desc: "全局溯源数据看板、异常预警、数据导出", days: "Day 17–19", status: "pending", priority: "低" },
  { id: 10, title: "测试与性能优化", desc: "单元测试覆盖率 > 80%，压力测试 1000 QPS，缓存优化", days: "Day 19–21", status: "pending", priority: "高" },
  { id: 11, title: "容器化与部署上线", desc: "Docker Compose 编排，Nginx 反向代理，域名 + HTTPS 配置", days: "Day 21–22", status: "pending", priority: "中" },
  { id: 12, title: "文档与演示准备", desc: "API 文档（Swagger）、用户使用手册、演示视频录制", days: "Day 22–24", status: "pending", priority: "低" },
];

const STATUS_MAP = {
  done: { icon: CheckCircle2, color: C.green, label: "已完成" },
  active: { icon: Clock, color: C.yellow, label: "进行中" },
  pending: { icon: Circle, color: C.border, label: "待开始" },
};

const PRIORITY_MAP = {
  高: C.red,
  中: C.yellow,
  低: C.textSec,
};

export default function PrototypePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>("nextjs");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [milestones, setMilestones] = useState(MILESTONES);
  const [pushed, setPushed] = useState(false);
  const [pushing, setPushing] = useState(false);

  const template = TEMPLATES.find((t) => t.key === selectedTemplate);
  const done = milestones.filter((m) => m.status === "done").length;
  const active = milestones.filter((m) => m.status === "active").length;

  const handlePush = async () => {
    setPushing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setPushing(false);
    setPushed(true);
  };

  const toggleMilestone = (id: number) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === "done" ? "pending" : "done" }
          : m
      )
    );
  };

  return (
    <div className="p-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 15, color: C.text }}>原型脚手架</h2>
          <p className="text-xs mt-0.5" style={{ color: C.textSec }}>选择技术栈，AI 自动生成项目骨架与里程碑清单</p>
        </div>
        <button
          onClick={handlePush}
          disabled={!selectedTemplate || pushing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: pushed ? `${C.green}` : "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
        >
          {pushing ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />推送中…</>
          ) : pushed ? (
            <><CheckCircle2 size={16} />已推送到 GitHub</>
          ) : (
            <><Github size={16} />一键推送到 GitHub</>
          )}
        </button>
      </div>

      {/* Template selector: 3 columns */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {TEMPLATES.map((tmpl) => {
          const Icon = tmpl.icon;
          const isSelected = selectedTemplate === tmpl.key;
          const isHovered = hoveredTemplate === tmpl.key;
          return (
            <div
              key={tmpl.key}
              className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${tmpl.color}18, ${tmpl.color}08)`
                  : C.card,
                border: `1px solid ${isSelected ? tmpl.color + "60" : C.border}`,
                boxShadow: isSelected ? `0 0 20px ${tmpl.color}20` : "none",
              }}
              onClick={() => setSelectedTemplate(tmpl.key)}
              onMouseEnter={() => setHoveredTemplate(tmpl.key)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              <div className="p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${tmpl.color}20`, border: `1px solid ${tmpl.color}30` }}>
                  <Icon size={20} style={{ color: tmpl.color }} />
                </div>
                <h3 className="font-semibold mb-1" style={{ fontSize: 14, color: C.text }}>{tmpl.name}</h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.textSec }}>{tmpl.desc}</p>

                {/* Tech stack chips */}
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.techStack.slice(0, 4).map((tech) => (
                    <span key={tech} className="text-xs px-2 py-0.5 rounded-lg"
                      style={{ background: `${tmpl.color}12`, color: tmpl.color, border: `1px solid ${tmpl.color}25` }}>
                      {tech}
                    </span>
                  ))}
                  {tmpl.techStack.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: `${C.border}40`, color: C.textSec }}>
                      +{tmpl.techStack.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Hover overlay: file list */}
              {(isHovered || isSelected) && (
                <div className="px-5 pb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: C.textSec }}>包含文件</p>
                  <ul className="space-y-1">
                    {tmpl.files.map((file) => (
                      <li key={file} className="text-xs flex items-center gap-1.5" style={{ color: C.textSec }}>
                        <Code2 size={10} style={{ color: tmpl.color }} />
                        <span style={{ fontFamily: "monospace" }}>{file}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: tmpl.color }}>
                  <span className="text-white text-[10px]">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Milestone kanban */}
      {selectedTemplate && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold" style={{ fontSize: 14, color: C.text }}>
                AI 拆解里程碑清单
                <span className="ml-2 text-xs font-normal" style={{ color: C.textSec }}>
                  {done}/{milestones.length} 已完成 · {active} 进行中
                </span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: C.textSec }}>预计总工期 24 天（8 周 Sprint 规划）</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 rounded-full overflow-hidden" style={{ background: `${C.border}60` }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(done / milestones.length) * 100}%`, background: "linear-gradient(to right, #3B82F6, #10B981)" }} />
              </div>
              <span className="text-xs" style={{ color: C.textSec }}>{Math.round((done / milestones.length) * 100)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            {milestones.map((m) => {
              const { icon: Icon, color, label } = STATUS_MAP[m.status as keyof typeof STATUS_MAP];
              const priorityColor = PRIORITY_MAP[m.priority as keyof typeof PRIORITY_MAP];
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/3 cursor-pointer group"
                  style={{
                    background: m.status === "active" ? `${C.yellow}08` : C.card,
                    border: `1px solid ${m.status === "active" ? C.yellow + "30" : C.border}`,
                  }}
                  onClick={() => toggleMilestone(m.id)}
                >
                  <Icon size={18} style={{ color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: m.status === "done" ? C.textSec : C.text,
                          textDecoration: m.status === "done" ? "line-through" : "none",
                        }}
                      >
                        #{m.id} {m.title}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: `${priorityColor}18`, color: priorityColor }}>
                        {m.priority}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{m.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs hidden sm:block" style={{ color: C.textSec, fontFamily: "monospace" }}>
                      {m.days}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
