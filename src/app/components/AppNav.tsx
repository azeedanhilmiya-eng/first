import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell, ChevronDown, Settings, LogOut, User, Zap, LayoutDashboard
} from "lucide-react";

interface AppNavProps {
  showProjectSwitcher?: boolean;
  currentProject?: string;
}

const C = {
  bg: "#0B1020",
  card: "#141A33",
  border: "#2A3656",
  text: "#E6E8EF",
  textSec: "#9AA4BF",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

export default function AppNav({ showProjectSwitcher = false, currentProject = "智慧农业溯源平台" }: AppNavProps) {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const projects = [
    { name: "智慧农业溯源平台", track: "乡村振兴赛道" },
    { name: "AI 心理健康助手", track: "医疗健康赛道" },
    { name: "碳中和监测系统", track: "绿色环保赛道" },
  ];

  const notifications = [
    { text: "BP 第三章已生成完毕，请查看", time: "5分钟前", unread: true },
    { text: "模拟评委"投资人"已给出评分：4.2/5", time: "2小时前", unread: true },
    { text: "项目"AI 心理健康助手"更新了里程碑", time: "昨天", unread: false },
  ];

  return (
    <nav
      className="glass-nav sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 h-14"
      style={{ borderBottom: `1px solid ${C.border}40` }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 group"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
          >
            <Zap size={14} className="text-white" />
          </div>
          <span
            className="font-semibold text-sm tracking-wide gradient-text hidden sm:block"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            赛道官
          </span>
        </button>

        {/* Project Switcher */}
        {showProjectSwitcher && (
          <div className="relative ml-2">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all hover:opacity-90"
              style={{
                background: `${C.card}`,
                border: `1px solid ${C.border}`,
                color: C.text,
              }}
            >
              <span className="max-w-32 truncate hidden sm:block">{currentProject}</span>
              <span className="sm:hidden">项目</span>
              <ChevronDown size={12} style={{ color: C.textSec }} />
            </button>
            {projectMenuOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-56 rounded-xl overflow-hidden z-50"
                style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
              >
                {projects.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setProjectMenuOpen(false)}
                    className="w-full flex flex-col items-start px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm" style={{ color: C.text }}>{p.name}</span>
                    <span className="text-xs mt-0.5" style={{ color: C.textSec }}>{p.track}</span>
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  <button
                    onClick={() => { navigate("/dashboard"); setProjectMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                    style={{ color: C.blue }}
                  >
                    <LayoutDashboard size={14} />
                    <span className="text-sm">管理所有项目</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Notif + Avatar */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <Bell size={16} style={{ color: C.textSec }} />
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: C.blue }}
            />
          </button>
          {notifOpen && (
            <div
              className="absolute top-full right-0 mt-2 w-72 rounded-xl overflow-hidden z-50"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                <span className="text-sm font-medium" style={{ color: C.text }}>通知</span>
                <span className="text-xs" style={{ color: C.blue }}>全部已读</span>
              </div>
              {notifications.map((n, i) => (
                <div
                  key={i}
                  className="px-4 py-3 hover:bg-white/5 transition-colors flex items-start gap-3"
                  style={{ borderBottom: i < notifications.length - 1 ? `1px solid ${C.border}20` : undefined }}
                >
                  {n.unread && (
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: C.blue }} />
                  )}
                  {!n.unread && <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" />}
                  <div>
                    <p className="text-sm leading-relaxed" style={{ color: n.unread ? C.text : C.textSec }}>{n.text}</p>
                    <p className="text-xs mt-1" style={{ color: C.textSec }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              张
            </div>
          </button>
          {userMenuOpen && (
            <div
              className="absolute top-full right-0 mt-2 w-48 rounded-xl overflow-hidden z-50"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
            >
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                <p className="text-sm font-medium" style={{ color: C.text }}>张同学</p>
                <p className="text-xs mt-0.5" style={{ color: C.textSec }}>zhang@scu.edu.cn</p>
              </div>
              {[
                { icon: User, label: "账号设置", action: () => navigate("/settings") },
                { icon: Settings, label: "开发者设置", action: () => navigate("/settings") },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={() => { action(); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <Icon size={15} style={{ color: C.textSec }} />
                  <span className="text-sm" style={{ color: C.text }}>{label}</span>
                </button>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}` }}>
                <button
                  onClick={() => { navigate("/"); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <LogOut size={15} style={{ color: "#F87171" }} />
                  <span className="text-sm" style={{ color: "#F87171" }}>退出登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
