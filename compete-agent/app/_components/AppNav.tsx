"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Zap,
} from "lucide-react";
import { C, SAMPLE_PROJECTS } from "./theme";

export function AppNav({
  showProjectSwitcher = false,
}: {
  showProjectSwitcher?: boolean;
}) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const currentProject = useMemo(() => {
    if (pathname?.includes("prototype")) return SAMPLE_PROJECTS[1].name;
    if (pathname?.includes("review")) return SAMPLE_PROJECTS[1].name;
    if (pathname?.includes("ppt")) return SAMPLE_PROJECTS[1].name;
    return SAMPLE_PROJECTS[0].name;
  }, [pathname]);

  const notifications = [
    "BP 第三章已生成，请补充市场验证数据。",
    "评审模拟得分提升到 81，建议开始整理答辩稿。",
    "原型脚手架新增了一组里程碑拆解。",
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b px-4 py-3 md:px-6"
      style={{
        background: "rgba(255, 251, 252, 0.78)",
        borderColor: C.border,
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Zap size={17} className="text-white" />
            </div>
            <div>
              <div className="gradient-text text-sm font-semibold">赛道官</div>
              <div className="text-xs" style={{ color: C.textSec }}>
                CompeteAgent
              </div>
            </div>
          </Link>

          {showProjectSwitcher && (
            <div className="relative ml-2 hidden sm:block">
              <button
                onClick={() => setProjectMenuOpen((value) => !value)}
                className="glass-card soft-hover flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                style={{ color: C.text }}
              >
                <span className="max-w-36 truncate">{currentProject}</span>
                <ChevronDown size={12} style={{ color: C.textSec }} />
              </button>
              {projectMenuOpen && (
                <div className="glass-card-strong absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-3xl p-2">
                  {SAMPLE_PROJECTS.map((project) => (
                    <Link
                      key={project.id}
                      href="/workspace/topic"
                      className="soft-hover block rounded-2xl px-4 py-3"
                      onClick={() => setProjectMenuOpen(false)}
                    >
                      <div className="text-sm font-medium" style={{ color: C.text }}>
                        {project.name}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: C.textSec }}>
                        {project.track}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/dashboard"
                    className="mt-1 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                    style={{ color: C.pinkStrong }}
                    onClick={() => setProjectMenuOpen(false)}
                  >
                    <LayoutDashboard size={14} />
                    管理全部项目
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setNotifOpen((value) => !value)}
              className="glass-card soft-hover relative flex h-10 w-10 items-center justify-center rounded-2xl"
            >
              <Bell size={16} style={{ color: C.textSec }} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ background: C.pinkStrong }} />
            </button>
            {notifOpen && (
              <div className="glass-card-strong absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span className="text-sm font-medium" style={{ color: C.text }}>
                    通知
                  </span>
                  <span className="text-xs" style={{ color: C.pinkStrong }}>
                    全部已读
                  </span>
                </div>
                {notifications.map((item) => (
                  <div
                    key={item}
                    className="px-4 py-3 text-sm"
                    style={{ borderBottom: "1px solid rgba(214,188,197,0.35)", color: C.textSec }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((value) => !value)}
              className="soft-hover flex items-center gap-2 rounded-full pl-1 pr-2 py-1"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                张
              </div>
            </button>
            {userMenuOpen && (
              <div className="glass-card-strong absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-3xl">
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div className="text-sm font-medium" style={{ color: C.text }}>
                    张同学
                  </div>
                  <div className="mt-1 text-xs" style={{ color: C.textSec }}>
                    zhang@scu.edu.cn
                  </div>
                </div>
                {[
                  { href: "/settings", label: "账户设置", icon: User },
                  { href: "/settings", label: "开发者设置", icon: Settings },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="soft-hover flex items-center gap-3 px-4 py-3 text-sm"
                    style={{ color: C.text }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Icon size={15} style={{ color: C.textSec }} />
                    {label}
                  </Link>
                ))}
                <Link
                  href="/"
                  className="soft-hover flex items-center gap-3 px-4 py-3 text-sm"
                  style={{ color: C.danger, borderTop: `1px solid ${C.border}` }}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LogOut size={15} />
                  退出登录
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
