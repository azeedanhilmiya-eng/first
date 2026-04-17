"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  GitBranch,
  Mail,
  Sparkles,
  Zap,
} from "lucide-react";
import { C } from "../_components/theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const isSchoolEmail = email.endsWith(".edu.cn") || email.endsWith(".edu");
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="page-shell min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl gap-6 lg:grid-cols-2">
        <section className="glass-card-strong dot-grid-bg animate-fade-up relative overflow-hidden rounded-[36px] p-8 md:p-10">
          <div
            className="animate-float absolute left-10 top-10 h-44 w-44 rounded-full"
            style={{ background: "rgba(244,219,227,0.72)", filter: "blur(30px)" }}
          />
          <div
            className="animate-drift absolute bottom-10 right-10 h-56 w-56 rounded-full"
            style={{ background: "rgba(255,255,255,0.92)", filter: "blur(22px)" }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Link href="/" className="mb-10 inline-flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[22px]"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <div className="gradient-text text-xl font-semibold">赛道官</div>
                  <div className="text-xs" style={{ color: C.textSec }}>
                    CompeteAgent
                  </div>
                </div>
              </Link>

              <h1 className="mb-4 text-4xl font-semibold leading-tight" style={{ color: C.text }}>
                让登录也像作品的一部分，
                <br />
                <span className="gradient-text">轻一点，柔一点。</span>
              </h1>
              <p className="max-w-md text-sm leading-8" style={{ color: C.textSec }}>
                你可以用校园邮箱快速进入，也可以先跳过登录直接体验演示版本。这一页沿用了 Figma 的双栏结构，但换成了更柔和的白粉主题。
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {["立项选题", "BP 生成", "评审模拟", "答辩 PPT"].map((item) => (
                <span
                  key={item}
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: "rgba(255,255,255,0.82)",
                    border: `1px solid ${C.border}`,
                    color: C.textSec,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          className="glass-card-strong animate-fade-up rounded-[36px] p-6 md:p-8"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mx-auto max-w-md">
            {!sent ? (
              <>
                <div className="mb-8 flex rounded-full p-1" style={{ background: "rgba(244,219,227,0.58)" }}>
                  {(["login", "register"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setMode(tab)}
                      className="flex-1 rounded-full py-2 text-sm transition-all"
                      style={{
                        background: mode === tab ? "var(--gradient-primary)" : "transparent",
                        color: mode === tab ? "white" : C.textSec,
                      }}
                    >
                      {tab === "login" ? "登录" : "注册"}
                    </button>
                  ))}
                </div>

                <h2 className="mb-2 text-2xl font-semibold" style={{ color: C.text }}>
                  {mode === "login" ? "欢迎回来" : "创建账号"}
                </h2>
                <p className="mb-6 text-sm" style={{ color: C.textSec }}>
                  {mode === "login"
                    ? "输入邮箱，我们会发送一个免密登录链接。"
                    : "填写邮箱即可开始，无需单独设置密码。"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm" style={{ color: C.textSec }}>
                      邮箱地址
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: C.textSoft }}
                      />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="zhang@scu.edu.cn"
                        className="w-full rounded-[22px] py-3 pl-10 pr-4 text-sm outline-none"
                        style={{
                          background: "rgba(255,255,255,0.8)",
                          border: `1px solid ${isSchoolEmail ? "rgba(146,184,173,0.5)" : C.border}`,
                          color: C.text,
                        }}
                      />
                    </div>

                    <div className="mt-2 min-h-5 text-xs" style={{ color: isSchoolEmail ? C.success : C.textSec }}>
                      {isValidEmail && !isSchoolEmail ? (
                        <span className="inline-flex items-center gap-1.5">
                          <AlertCircle size={12} />
                          建议使用校园邮箱，以便后续领取更多免费额度。
                        </span>
                      ) : isSchoolEmail ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle size={12} />
                          已识别校园邮箱，可获得更多体验额度。
                        </span>
                      ) : (
                        "优先使用 .edu.cn / .edu 邮箱，后续做团队验证会更方便。"
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isValidEmail || loading}
                    className="pulse-glow soft-hover flex w-full items-center justify-center gap-2 rounded-[22px] py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        发送中…
                      </>
                    ) : (
                      <>
                        {mode === "login" ? "发送登录链接" : "发送注册链接"}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: C.border }} />
                  <span className="text-xs" style={{ color: C.textSec }}>
                    或使用第三方登录
                  </span>
                  <div className="h-px flex-1" style={{ background: C.border }} />
                </div>

                <div className="space-y-3">
                  <Link
                    href="/dashboard"
                    className="soft-hover flex items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.82)",
                      border: `1px solid ${C.border}`,
                      color: C.text,
                    }}
                  >
                    <GitBranch size={17} />
                    使用 GitHub 登录
                  </Link>
                  <Link
                    href="/dashboard"
                    className="soft-hover flex items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-sm"
                    style={{ background: "rgba(244,219,227,0.52)", color: C.textSec }}
                  >
                    <Sparkles size={16} />
                    跳过登录，查看演示版
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px]"
                  style={{ background: "rgba(146,184,173,0.18)", color: C.success }}
                >
                  <CheckCircle size={30} />
                </div>
                <h2 className="mb-2 text-2xl font-semibold" style={{ color: C.text }}>
                  邮件已发送
                </h2>
                <p className="mb-1 text-sm" style={{ color: C.textSec }}>
                  登录链接已发送至
                </p>
                <p className="mb-6 font-medium" style={{ color: C.pinkStrong }}>
                  {email}
                </p>
                <Link
                  href="/dashboard"
                  className="pulse-glow soft-hover inline-flex items-center gap-2 rounded-[22px] px-5 py-3 text-sm text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  查看演示 Dashboard
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
