"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Code2,
  CreditCard,
  Save,
  ShieldCheck,
  Users,
  UserRound,
  WalletCards,
} from "lucide-react";
import { AppNav } from "@/app/_components/AppNav";
import { C } from "@/app/_components/theme";

const TABS = [
  { key: "account", label: "账户信息", icon: UserRound },
  { key: "team", label: "团队成员", icon: Users },
  { key: "usage", label: "用量与配额", icon: WalletCards },
  { key: "billing", label: "套餐计费", icon: CreditCard },
  { key: "developer", label: "开发者", icon: Code2 },
];

function SectionTitle({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold" style={{ color: C.text }}>
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: C.textSec }}>
        {desc}
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-[28px] p-5" style={{ background: "rgba(255,255,255,0.82)" }}>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [masked, setMasked] = useState(true);

  return (
    <div className="page-shell min-h-screen">
      <AppNav />

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-6">
        <div className="mb-5 flex items-center gap-2 text-sm" style={{ color: C.textSec }}>
          <Link href="/dashboard">仪表盘</Link>
          <ChevronRight size={14} />
          <span style={{ color: C.text }}>设置</span>
        </div>

        <section className="glass-card-strong animate-fade-up rounded-[34px] p-6 md:p-7">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong, border: `1px solid ${C.border}` }}>
                <ShieldCheck size={12} />
                账户与团队配置
              </div>
              <h1 className="text-[clamp(26px,4vw,40px)] font-semibold leading-[1.1]" style={{ color: C.text }}>
                把你的项目偏好、团队信息和配额
                <br />
                <span className="gradient-text">都收进一套稳定设置里</span>
              </h1>
            </div>

            <button className="pulse-glow soft-hover inline-flex items-center gap-2 rounded-[18px] px-4 py-3 text-sm text-white" style={{ background: "var(--gradient-primary)" }}>
              <Save size={14} />
              保存更改
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="soft-hover flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-sm"
                  style={{
                    background: activeTab === key ? "rgba(244,219,227,0.82)" : "rgba(255,255,255,0.65)",
                    color: activeTab === key ? C.pinkStrong : C.textSec,
                    border: `1px solid ${activeTab === key ? C.borderStrong : C.border}`,
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {activeTab === "account" && (
                <>
                  <SectionTitle title="账户信息" desc="这里先保留轻量资料设置，后续接入正式认证时可以无缝替换。" />

                  <Card>
                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] text-2xl font-semibold text-white" style={{ background: "var(--gradient-primary)" }}>
                        张
                      </div>
                      <div>
                        <div className="text-base font-semibold" style={{ color: C.text }}>
                          张明远
                        </div>
                        <div className="mt-1 text-sm" style={{ color: C.textSec }}>
                          zhang@scu.edu.cn · 四川大学 · 软件工程
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { label: "姓名", value: "张明远" },
                        { label: "学校", value: "四川大学" },
                        { label: "专业", value: "软件工程" },
                        { label: "年级", value: "大三" },
                        { label: "邮箱", value: "zhang@scu.edu.cn" },
                        { label: "联系电话", value: "暂未填写" },
                      ].map((item) => (
                        <label key={item.label} className="block">
                          <span className="mb-2 block text-xs" style={{ color: C.textSec }}>
                            {item.label}
                          </span>
                          <input
                            defaultValue={item.value}
                            className="w-full rounded-[18px] px-4 py-3 text-sm outline-none"
                            style={{ background: "rgba(255,255,255,0.74)", border: `1px solid ${C.border}`, color: C.text }}
                          />
                        </label>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {activeTab === "team" && (
                <>
                  <SectionTitle title="团队成员" desc="Figma 里的团队配置页已经接进来，后续可以直接接邀请流和角色权限。" />

                  <Card>
                    <div className="space-y-3">
                      {[
                        ["张明远", "队长 / 产品与后端", "zhang@scu.edu.cn"],
                        ["李晓茹", "前端与交互", "li@scu.edu.cn"],
                        ["王志强", "商业分析与路演", "wang@scu.edu.cn"],
                      ].map(([name, role, email]) => (
                        <div key={email} className="flex flex-col gap-3 rounded-[22px] p-4 md:flex-row md:items-center" style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${C.border}` }}>
                          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] text-sm font-semibold text-white" style={{ background: "var(--gradient-primary)" }}>
                            {name.slice(0, 1)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium" style={{ color: C.text }}>
                              {name}
                            </div>
                            <div className="mt-1 text-xs" style={{ color: C.textSec }}>
                              {email}
                            </div>
                          </div>
                          <span className="rounded-full px-3 py-1 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong }}>
                            {role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {activeTab === "usage" && (
                <>
                  <SectionTitle title="用量与配额" desc="这里先用轻量视觉代替图表库，保持页面清爽也更容易维护。" />

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      ["本月已用", "2,340 Token", C.pinkStrong],
                      ["剩余额度", "7,660 Token", C.success],
                      ["平均每日", "334 Token", C.warning],
                    ].map(([label, value, color]) => (
                      <Card key={String(label)}>
                        <div className="text-sm" style={{ color: C.textSec }}>
                          {label}
                        </div>
                        <div className="mt-2 text-3xl font-semibold" style={{ color: String(color) }}>
                          {value}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <div className="mb-4 text-sm font-medium" style={{ color: C.text }}>
                      模块消耗分布
                    </div>
                    <div className="space-y-4">
                      {[
                        ["立项", 18, C.warning],
                        ["BP", 42, C.pinkStrong],
                        ["原型", 14, C.success],
                        ["评审", 20, C.textSoft],
                        ["PPT", 6, C.blushStrong],
                      ].map(([label, value, color]) => (
                        <div key={String(label)}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span style={{ color: C.textSec }}>{label}</span>
                            <span style={{ color: C.text }}>{value}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(214,188,197,0.24)" }}>
                            <div className="h-full rounded-full" style={{ width: `${value}%`, background: String(color) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {activeTab === "billing" && (
                <>
                  <SectionTitle title="套餐计费" desc="先保留免费版和 Pro 的展示位，后面接支付时结构可以继续沿用。" />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <div className="mb-3 text-sm font-medium" style={{ color: C.text }}>
                        免费版
                      </div>
                      <div className="text-4xl font-semibold" style={{ color: C.text }}>
                        ¥0
                      </div>
                      <div className="mt-3 space-y-2 text-sm" style={{ color: C.textSec }}>
                        <p>10,000 Token / 月</p>
                        <p>最多 3 个项目</p>
                        <p>基础立项、BP、评审功能</p>
                      </div>
                    </Card>

                    <div className="gradient-border rounded-[28px] p-5">
                      <div className="mb-3 inline-flex rounded-full px-3 py-1 text-xs" style={{ background: "rgba(244,219,227,0.78)", color: C.pinkStrong }}>
                        推荐升级
                      </div>
                      <div className="text-4xl font-semibold gradient-text">¥39</div>
                      <div className="mt-3 space-y-2 text-sm" style={{ color: C.textSec }}>
                        <p>50,000 Token / 月</p>
                        <p>无限项目与完整工作台</p>
                        <p>优先生成队列与案例库访问</p>
                      </div>
                      <button className="pulse-glow soft-hover mt-5 rounded-[18px] px-4 py-3 text-sm text-white" style={{ background: "var(--gradient-primary)" }}>
                        升级为 Pro
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "developer" && (
                <>
                  <SectionTitle title="开发者" desc="这里放 API 密钥、Webhook 和通知设置，方便你后面继续扩后端能力。" />

                  <Card>
                    <div className="mb-3 text-sm font-medium" style={{ color: C.text }}>
                      API 密钥
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <div className="flex-1 rounded-[18px] px-4 py-3 font-mono text-sm" style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${C.border}`, color: C.text }}>
                        {masked ? "sk-compete-agent-••••••••••••••••" : "sk-compete-agent-demo-visible-key"}
                      </div>
                      <button
                        onClick={() => setMasked((value) => !value)}
                        className="soft-hover rounded-[18px] px-4 py-3 text-sm"
                        style={{ background: "rgba(255,255,255,0.76)", border: `1px solid ${C.border}`, color: C.textSec }}
                      >
                        {masked ? "显示" : "隐藏"}
                      </button>
                    </div>
                  </Card>

                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <Bell size={15} style={{ color: C.warning }} />
                      <div className="text-sm font-medium" style={{ color: C.text }}>
                        回调与通知
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs" style={{ color: C.textSec }}>
                          Webhook 地址
                        </span>
                        <input
                          defaultValue="https://your-server.com/webhook/compete-agent"
                          className="w-full rounded-[18px] px-4 py-3 text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.74)", border: `1px solid ${C.border}`, color: C.text }}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs" style={{ color: C.textSec }}>
                          告警邮箱
                        </span>
                        <input
                          defaultValue="zhang@scu.edu.cn"
                          className="w-full rounded-[18px] px-4 py-3 text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.74)", border: `1px solid ${C.border}`, color: C.text }}
                        />
                      </label>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
