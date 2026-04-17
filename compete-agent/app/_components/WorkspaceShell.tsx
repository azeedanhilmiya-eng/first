"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Keyboard,
  X,
} from "lucide-react";
import { AppNav } from "./AppNav";
import { C, WORKSPACE_STEPS } from "./theme";

const SHORTCUTS = [
  { keys: ["G", "I"], action: "跳到立项" },
  { keys: ["G", "B"], action: "跳到 BP" },
  { keys: ["G", "P"], action: "跳到原型" },
  { keys: ["G", "R"], action: "跳到评审" },
  { keys: ["G", "S"], action: "跳到 PPT" },
];

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-white/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="glass-card-strong w-full max-w-sm rounded-[32px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: C.text }}>
            什么是“互联网+”？
          </h3>
          <button onClick={onClose} className="rounded-full p-2">
            <X size={16} style={{ color: C.textSec }} />
          </button>
        </div>
        <div className="space-y-3 text-sm leading-7" style={{ color: C.textSec }}>
          <p>
            中国国际“互联网+”大学生创新创业大赛很看重创新性、团队情况、商业模式、可行性与社会价值，所以这套工作台本质上就是围绕这些评审点在补材料。
          </p>
          <div className="rounded-3xl p-4" style={{ background: "rgba(248,237,241,0.8)", border: `1px solid ${C.border}` }}>
            {[
              ["创新性", "25%"],
              ["团队情况", "20%"],
              ["商业模式", "25%"],
              ["可行性", "15%"],
              ["带动就业与引领", "15%"],
            ].map(([name, pct]) => (
              <div key={name} className="mb-1 flex items-center justify-between text-xs last:mb-0">
                <span>{name}</span>
                <span style={{ color: C.pinkStrong }}>{pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsVisible, setShortcutsVisible] = useState(false);

  const activeIndex = useMemo(() => {
    const idx = WORKSPACE_STEPS.findIndex((step) => pathname.includes(step.key));
    return idx === -1 ? 0 : idx;
  }, [pathname]);

  return (
    <div className="page-shell">
      <AppNav showProjectSwitcher />

      <div
        className="sticky top-[68px] z-40 overflow-x-auto border-b backdrop-blur"
        style={{ background: "rgba(255,252,252,0.8)", borderColor: C.border }}
      >
        <div className="mx-auto flex max-w-7xl min-w-max items-center px-4 md:px-6">
          {WORKSPACE_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeIndex;
            const isDone = index < activeIndex;
            return (
              <Link
                key={step.key}
                href={step.path}
                className="relative flex items-center gap-2 px-4 py-4 text-sm soft-hover"
                style={{ color: isActive ? C.pinkStrong : isDone ? C.success : C.textSec }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
                  style={{
                    background: isActive
                      ? "var(--gradient-primary)"
                      : isDone
                        ? "rgba(146,184,173,0.18)"
                        : "rgba(214,188,197,0.35)",
                    color: isActive ? "white" : isDone ? C.success : C.textSec,
                    border: `1px solid ${isDone ? "rgba(146,184,173,0.4)" : "transparent"}`,
                  }}
                >
                  {isDone ? "✓" : <Icon size={11} />}
                </div>
                <span className="hidden sm:block">{step.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style={{ background: "var(--gradient-primary)" }} />
                )}
                {index < WORKSPACE_STEPS.length - 1 && (
                  <ChevronRight size={12} style={{ color: C.textSoft }} className="hidden sm:block" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className="hidden min-h-[calc(100vh-118px)] border-r md:flex md:flex-col"
          style={{
            width: collapsed ? 72 : 216,
            background: "rgba(255,255,255,0.5)",
            borderColor: C.border,
            transition: "width 220ms ease",
          }}
        >
          <div className="flex justify-end p-3">
            <button onClick={() => setCollapsed((value) => !value)} className="rounded-full p-2">
              {collapsed ? (
                <ChevronRight size={14} style={{ color: C.textSec }} />
              ) : (
                <ChevronLeft size={14} style={{ color: C.textSec }} />
              )}
            </button>
          </div>
          <nav className="space-y-1 px-3">
            {WORKSPACE_STEPS.map((step, index) => {
              const Icon = step.icon;
              const active = index === activeIndex;
              return (
                <Link
                  key={step.key}
                  href={step.path}
                  className="soft-hover flex items-center gap-3 rounded-2xl px-3 py-3"
                  style={{
                    background: active ? "rgba(244,219,227,0.72)" : "transparent",
                    border: `1px solid ${active ? "rgba(200,131,153,0.45)" : "transparent"}`,
                    color: active ? C.pinkStrong : C.textSec,
                  }}
                >
                  <Icon size={18} />
                  {!collapsed && <span className="text-sm font-medium">{step.label}</span>}
                  {!collapsed && (
                    <kbd className="ml-auto rounded-full px-2 py-0.5 text-[11px]" style={{ background: "rgba(255,255,255,0.72)", color: C.textSec }}>
                      {step.shortcut}
                    </kbd>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-118px)] flex-1 overflow-x-hidden">{children}</main>
      </div>

      <button
        onClick={() => setHelpOpen(true)}
        className="glass-card-strong soft-hover fixed bottom-20 right-4 z-30 hidden items-center gap-2 rounded-full px-4 py-2 text-xs sm:flex"
        style={{ color: C.textSec }}
      >
        <HelpCircle size={14} />
        什么是“互联网+”？
      </button>

      <div
        className="fixed bottom-0 left-0 right-0 hidden items-center gap-4 border-t px-6 py-2 md:flex"
        style={{
          background: "rgba(255,252,252,0.78)",
          borderColor: C.border,
          backdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => setShortcutsVisible((value) => !value)}
          className="flex items-center gap-1.5 text-xs"
          style={{ color: C.textSec }}
        >
          <Keyboard size={12} />
          快捷键
        </button>
        {shortcutsVisible && (
          <div className="flex items-center gap-4 overflow-x-auto">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.action} className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded-full px-2 py-0.5"
                      style={{ background: "rgba(255,255,255,0.82)", color: C.textSec }}
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
                <span style={{ color: C.textSec }}>{shortcut.action}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t md:hidden"
        style={{ background: "rgba(255,252,252,0.92)", borderColor: C.border }}
      >
        {WORKSPACE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const active = index === activeIndex;
          return (
            <Link
              key={step.key}
              href={step.path}
              className="relative flex flex-1 flex-col items-center gap-1 py-3 text-xs"
              style={{ color: active ? C.pinkStrong : C.textSec }}
            >
              <Icon size={18} />
              <span>{step.label}</span>
              {active && (
                <span className="absolute bottom-0 h-[2px] w-8 rounded-full" style={{ background: "var(--gradient-primary)" }} />
              )}
            </Link>
          );
        })}
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
