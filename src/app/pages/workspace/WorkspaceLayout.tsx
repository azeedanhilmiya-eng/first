import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Lightbulb, FileText, Code2, MessageSquareText, Presentation,
  ChevronLeft, ChevronRight, HelpCircle, Keyboard, X
} from "lucide-react";
import AppNav from "../../components/AppNav";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6",
  green: "#10B981", yellow: "#FBBF24",
};

const STEPS = [
  { key: "topic", label: "立项", shortcut: "I", icon: Lightbulb, path: "/workspace/topic" },
  { key: "bp", label: "BP", shortcut: "B", icon: FileText, path: "/workspace/bp" },
  { key: "prototype", label: "原型", shortcut: "P", icon: Code2, path: "/workspace/prototype" },
  { key: "review", label: "评审", shortcut: "R", icon: MessageSquareText, path: "/workspace/review" },
  { key: "ppt", label: "PPT", shortcut: "S", icon: Presentation, path: "/workspace/ppt" },
];

const SHORTCUTS = [
  { keys: ["G", "I"], action: "跳至立项" },
  { keys: ["G", "B"], action: "跳至 BP" },
  { keys: ["G", "P"], action: "跳至原型" },
  { keys: ["G", "R"], action: "跳至评审" },
  { keys: ["G", "S"], action: "跳至 PPT" },
  { keys: ["⌘", "↵"], action: "生成内容" },
  { keys: ["⌘", "S"], action: "保存" },
];

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(11,16,32,0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: C.text }}>什么是互联网+？</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
            <X size={16} style={{ color: C.textSec }} />
          </button>
        </div>
        <div className="space-y-3 text-sm" style={{ color: C.textSec, lineHeight: 1.8 }}>
          <p>"互联网+"大学生创新创业大赛是由教育部等部门主办的<strong style={{ color: C.text }}>国家级 A 类竞赛</strong>，每年参赛规模超过 <strong style={{ color: C.text }}>300 万人</strong>。</p>
          <div className="rounded-lg p-3" style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}20` }}>
            <p className="text-xs font-medium mb-2" style={{ color: C.blue }}>五维评审体系</p>
            {[
              ["创新性", "25%", C.blue],
              ["团队情况", "20%", C.purple],
              ["商业模式", "25%", C.green],
              ["可行性", "15%", C.yellow],
              ["带动就业引领", "15%", "#EC4899"],
            ].map(([name, pct, color]) => (
              <div key={name} className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: C.textSec }}>{name}</span>
                <span style={{ color }}>{pct}</span>
              </div>
            ))}
          </div>
          <p>赛道包含：高教主赛道、产业命题赛道、"青年红色筑梦之旅"赛道等。</p>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsVisible, setShortcutsVisible] = useState(false);

  const currentPath = location.pathname;
  const activeStep = STEPS.find((s) => currentPath.includes(s.key)) || STEPS[0];
  const activeIndex = STEPS.indexOf(activeStep);

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh" }}>
      <AppNav showProjectSwitcher />

      {/* Steps Bar */}
      <div
        className="sticky top-14 z-40 overflow-x-auto"
        style={{ background: `${C.bg}dd`, borderBottom: `1px solid ${C.border}40`, backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center px-4 md:px-6 py-0 gap-0 min-w-max">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.key === activeStep.key;
            const isDone = i < activeIndex;
            return (
              <button
                key={step.key}
                onClick={() => navigate(step.path)}
                className="flex items-center gap-1.5 px-3 md:px-4 py-3.5 relative transition-all text-sm"
                style={{
                  color: isActive ? C.blue : isDone ? C.green : C.textSec,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #3B82F6, #8B5CF6)"
                      : isDone ? `${C.green}20` : `${C.border}40`,
                    border: isDone ? `1px solid ${C.green}60` : "none",
                  }}
                >
                  {isDone ? (
                    <span className="text-[10px]" style={{ color: C.green }}>✓</span>
                  ) : (
                    <Icon size={10} style={{ color: isActive ? "white" : C.textSec }} />
                  )}
                </div>
                <span className="hidden sm:block">{step.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(to right, #3B82F6, #8B5CF6)" }} />
                )}
                {i < STEPS.length - 1 && (
                  <ChevronRight size={12} className="hidden sm:block ml-2" style={{ color: C.border }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex" style={{ height: "calc(100vh - 112px)" }}>
        {/* Left Sidebar (desktop) */}
        <aside
          className="hidden md:flex flex-col shrink-0 transition-all duration-300"
          style={{
            width: sidebarCollapsed ? 60 : 200,
            background: `${C.card}80`,
            borderRight: `1px solid ${C.border}`,
          }}
        >
          {/* Collapse toggle */}
          <div className="flex justify-end p-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              {sidebarCollapsed
                ? <ChevronRight size={14} style={{ color: C.textSec }} />
                : <ChevronLeft size={14} style={{ color: C.textSec }} />
              }
            </button>
          </div>

          {/* Module tabs */}
          <nav className="flex-1 px-2 space-y-1">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.key === activeStep.key;
              return (
                <button
                  key={step.key}
                  onClick={() => navigate(step.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                  style={{
                    background: isActive ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))" : "transparent",
                    border: isActive ? `1px solid ${C.blue}30` : "1px solid transparent",
                    color: isActive ? C.blue : C.textSec,
                  }}
                >
                  <Icon size={18} />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{step.label}</span>
                  )}
                  {!sidebarCollapsed && (
                    <kbd className="ml-auto text-xs px-1.5 py-0.5 rounded"
                      style={{ background: `${C.border}40`, color: C.textSec, fontFamily: "Inter" }}>
                      {step.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-16 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: `${C.card}f0`,
          borderTop: `1px solid ${C.border}`,
          backdropFilter: "blur(12px)",
        }}
      >
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.key === activeStep.key;
          return (
            <button
              key={step.key}
              onClick={() => navigate(step.path)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
              style={{ color: isActive ? C.blue : C.textSec }}
            >
              <Icon size={20} />
              <span className="text-xs">{step.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: "linear-gradient(to right, #3B82F6, #8B5CF6)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Help floating button */}
      <button
        onClick={() => setHelpOpen(true)}
        className="fixed right-4 bottom-20 md:bottom-12 z-30 flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-90"
        style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSec }}
      >
        <HelpCircle size={14} />
        <span className="hidden sm:block">什么是互联网+？</span>
      </button>

      {/* Desktop Keyboard Shortcuts Bar */}
      <div
        className="hidden md:flex fixed bottom-0 left-0 right-0 items-center gap-4 px-6 py-2 z-30"
        style={{ background: `${C.bg}dd`, borderTop: `1px solid ${C.border}20`, backdropFilter: "blur(8px)" }}
      >
        <button
          onClick={() => setShortcutsVisible(!shortcutsVisible)}
          className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
          style={{ color: C.textSec }}
        >
          <Keyboard size={12} />
          <span>快捷键</span>
        </button>
        {shortcutsVisible && (
          <div className="flex items-center gap-4 overflow-x-auto">
            {SHORTCUTS.map(({ keys, action }) => (
              <div key={action} className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  {keys.map((k) => (
                    <kbd key={k} className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSec, fontFamily: "Inter" }}>
                      {k}
                    </kbd>
                  ))}
                </div>
                <span className="text-xs" style={{ color: C.textSec }}>{action}</span>
              </div>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textSec }}>
            <span>互联网+ 省赛</span>
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${C.yellow}18`, color: C.yellow }}>12 天后截止</span>
          </div>
        </div>
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
