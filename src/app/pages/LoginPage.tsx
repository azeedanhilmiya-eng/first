import { useState } from "react";
import { useNavigate } from "react-router";
import { Zap, Mail, ArrowRight, Github, AlertCircle, CheckCircle, Sparkles } from "lucide-react";

const C = {
  bg: "#0B1020", card: "#141A33", border: "#2A3656",
  text: "#E6E8EF", textSec: "#9AA4BF",
  blue: "#3B82F6", purple: "#8B5CF6", green: "#10B981",
};

function GradientOrb() {
  return (
    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0B1020" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <circle cx="150" cy="150" r="120" fill="url(#orbGrad)" />
      <circle cx="150" cy="150" r="80" stroke="url(#ringGrad)" strokeWidth="1" fill="none" strokeDasharray="4 8" />
      <circle cx="150" cy="150" r="55" stroke="url(#ringGrad)" strokeWidth="1" fill="none" opacity="0.6" />
      {/* Hex nodes on ring */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 150 + 80 * Math.cos(rad);
        const y = 150 + 80 * Math.sin(rad);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill="#141A33" stroke="url(#ringGrad)" strokeWidth="1.5" />
            <circle cx={x} cy={y} r="2" fill="url(#ringGrad)" />
          </g>
        );
      })}
      {/* Center icon */}
      <g transform="translate(135, 130)">
        <polygon points="15,0 28,8 28,22 15,30 2,22 2,8" stroke="url(#ringGrad)" strokeWidth="1.5" fill="rgba(59,130,246,0.1)" />
        <polygon points="15,7 22,11 22,19 15,23 8,19 8,11" stroke="url(#ringGrad)" strokeWidth="1" fill="rgba(139,92,246,0.2)" />
      </g>
      {/* Sparkle dots */}
      {[[50, 60], [240, 80], [70, 230], [230, 240], [30, 150], [260, 150]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#3B82F6" opacity="0.5" />
      ))}
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const isSchoolEmail = email.endsWith(".edu.cn") || email.endsWith(".edu");
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: C.bg }}
    >
      {/* Left: Brand Story (hidden on mobile, shown on desktop; on mobile shown as top section) */}
      <div
        className="md:w-1/2 flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden dot-grid-bg"
        style={{ minHeight: "45vh" }}
      >
        {/* Gradient orb */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 opacity-60">
            <GradientOrb />
          </div>
        </div>

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-xl gradient-text">赛道官</div>
              <div className="text-xs" style={{ color: C.textSec, fontFamily: "Inter" }}>CompeteAgent</div>
            </div>
          </div>

          <h2 className="mb-3" style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: C.text }}>
            你的 AI 参赛教练
          </h2>
          <p className="max-w-xs mx-auto mb-8 leading-relaxed" style={{ color: C.textSec, fontSize: 14 }}>
            从选题立项到路演答辩，全程陪跑。已帮助 <strong style={{ color: C.text }}>20+ 团队</strong> 冲击国家级竞赛奖项。
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {["立项选题", "BP 生成", "代码脚手架", "评审模拟", "PPT 大纲"].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full text-xs"
                style={{ background: `${C.blue}18`, border: `1px solid ${C.blue}30`, color: C.blue }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          {!sent ? (
            <>
              {/* Mode Toggle */}
              <div className="flex rounded-xl p-1 mb-8" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      background: mode === m ? "linear-gradient(135deg, #3B82F6, #8B5CF6)" : "transparent",
                      color: mode === m ? "white" : C.textSec,
                    }}
                  >
                    {m === "login" ? "登录" : "注册"}
                  </button>
                ))}
              </div>

              <h2 className="mb-2" style={{ fontSize: 22, fontWeight: 700, color: C.text }}>
                {mode === "login" ? "欢迎回来" : "创建账号"}
              </h2>
              <p className="mb-6 text-sm" style={{ color: C.textSec }}>
                {mode === "login" ? "输入邮箱，我们发送一个免密登录链接" : "填写邮箱即可开始，无需设置密码"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: C.textSec }}>
                    邮箱地址
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textSec }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="zhang@scu.edu.cn"
                      className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all text-sm"
                      style={{
                        background: C.card,
                        border: `1px solid ${isValidEmail && !isSchoolEmail ? C.border : isSchoolEmail ? C.green : C.border}`,
                        color: C.text,
                      }}
                    />
                    {isSchoolEmail && (
                      <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.green }} />
                    )}
                  </div>

                  {/* Campus email hint */}
                  <div className="flex items-start gap-2 mt-2">
                    {isValidEmail && !isSchoolEmail ? (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: C.yellow }}>
                        <AlertCircle size={12} />
                        建议使用校园邮箱（xxx.edu.cn）以解锁更多免费额度
                      </div>
                    ) : isSchoolEmail ? (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: C.green }}>
                        <CheckCircle size={12} />
                        已识别校园邮箱，可获得双倍免费 Token 额度
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: C.textSec }}>
                        优先使用校园邮箱（.edu.cn / .edu），享双倍免费额度
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isValidEmail || loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: C.border }} />
                <span className="text-xs" style={{ color: C.textSec }}>或使用第三方登录</span>
                <div className="flex-1 h-px" style={{ background: C.border }} />
              </div>

              {/* Third-party */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center justify-center gap-3 py-3 rounded-xl text-sm transition-all hover:bg-white/5"
                  style={{ border: `1px solid ${C.border}`, color: C.text }}
                >
                  <Github size={18} />
                  使用 GitHub 登录
                </button>
                <button
                  disabled
                  className="flex items-center justify-center gap-3 py-3 rounded-xl text-sm cursor-not-allowed relative"
                  style={{ border: `1px solid ${C.border}30`, color: C.textSec + "60" }}
                >
                  <div className="w-4 h-4 rounded-sm flex items-center justify-center"
                    style={{ background: `${C.textSec}40` }}>
                    <span className="text-[10px]">微</span>
                  </div>
                  微信登录
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSec }}>
                    即将支持
                  </span>
                </button>
              </div>

              {/* Demo shortcut */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
                  style={{ color: C.textSec }}
                >
                  跳过登录，查看演示版 →
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `${C.green}18`, border: `1px solid ${C.green}30` }}>
                <CheckCircle size={32} style={{ color: C.green }} />
              </div>
              <h2 className="mb-2" style={{ fontSize: 22, fontWeight: 700, color: C.text }}>
                邮件已发送！
              </h2>
              <p className="mb-1 text-sm" style={{ color: C.textSec }}>
                登录链接已发送至
              </p>
              <p className="font-medium mb-6" style={{ color: C.blue }}>{email}</p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: C.textSec }}>
                请检查你的邮箱（包括垃圾邮件文件夹），点击链接即可登录，链接 15 分钟内有效。
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm mx-auto transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
              >
                <Sparkles size={16} />
                查看演示 Dashboard
              </button>
              <button
                onClick={() => setSent(false)}
                className="block mx-auto mt-3 text-xs transition-opacity hover:opacity-70"
                style={{ color: C.textSec }}
              >
                重新发送
              </button>
            </div>
          )}

          <p className="mt-8 text-xs text-center" style={{ color: C.textSec }}>
            使用即代表同意{" "}
            <a href="#" className="underline underline-offset-2" style={{ color: C.blue }}>服务条款</a>
            {" "}与{" "}
            <a href="#" className="underline underline-offset-2" style={{ color: C.blue }}>隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
}
