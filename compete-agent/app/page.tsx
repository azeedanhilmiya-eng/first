"use client";

import { useState } from "react";
import type { IdeationOutput } from "@/agents/ideation";

export default function Home() {
  const [form, setForm] = useState({
    track: "高教主赛道",
    group: "本科生创意组",
    interests: "",
    capabilities: "",
    time_budget_weeks: 12,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdeationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ideation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult((await res.json()) as IdeationOutput);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>赛道官 · 立项助手</h1>
      <p style={{ color: "#9aa4bf", marginBottom: 32 }}>
        互联网+ 大学生创新创业大赛 —— 告诉我你的团队兴趣与能力，10 秒产出 3 个候选选题。
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
        <Field label="赛道">
          <input
            value={form.track}
            onChange={(e) => setForm({ ...form, track: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="组别">
          <input
            value={form.group}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="团队兴趣方向 / 专业背景">
          <textarea
            rows={3}
            placeholder="例：信工学院大二，对 AI Agent、教育科技感兴趣……"
            value={form.interests}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="现有能力 / 技术栈 / 资源">
          <textarea
            rows={3}
            placeholder="例：熟悉 Next.js + Python；队内 1 人美工；有校方实验室 GPU……"
            value={form.capabilities}
            onChange={(e) => setForm({ ...form, capabilities: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="可投入周数">
          <input
            type="number"
            min={2}
            max={52}
            value={form.time_budget_weeks}
            onChange={(e) =>
              setForm({ ...form, time_budget_weeks: Number(e.target.value) })
            }
            style={inputStyle}
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px",
            background: loading ? "#2a3656" : "#3b82f6",
            color: "white",
            border: 0,
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 16,
          }}
        >
          {loading ? "正在选题……" : "生成候选选题"}
        </button>
      </form>

      {error && (
        <pre style={{ color: "#f87171", marginTop: 24, whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      )}

      {result && (
        <section style={{ marginTop: 40 }}>
          <h2>3 个候选</h2>
          {result.candidates.map((c, i) => (
            <article
              key={i}
              style={{
                padding: 20,
                background: "#141a33",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {i + 1}. {c.title}
              </h3>
              <p style={{ color: "#c1c8e0" }}>{c.one_liner}</p>
              <Scores c={c} />
              {c.similar_awards.length > 0 && (
                <Block title="往届相似获奖" items={c.similar_awards} />
              )}
              <Block title="MVP 范围" items={c.mvp_scope} />
              <Block title="关键风险" items={c.risks} />
            </article>
          ))}
          <div
            style={{
              padding: 20,
              background: "#1a2550",
              borderRadius: 12,
              borderLeft: "4px solid #3b82f6",
            }}
          >
            <strong>推荐：</strong>
            {result.recommendation}
          </div>
        </section>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#9aa4bf", fontSize: 14 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "#141a33",
  border: "1px solid #2a3656",
  borderRadius: 8,
  color: "#e6e8ef",
  fontSize: 15,
  fontFamily: "inherit",
};

function Scores({
  c,
}: {
  c: IdeationOutput["candidates"][number];
}) {
  const rows: Array<[string, { score: number; reason: string }]> = [
    ["创新", c.innovation],
    ["可行", c.feasibility],
    ["商业", c.business],
  ];
  return (
    <div style={{ display: "grid", gap: 6, margin: "12px 0" }}>
      {rows.map(([name, v]) => (
        <div key={name} style={{ fontSize: 14 }}>
          <strong>{name}</strong> · {v.score}/10 — <span style={{ color: "#9aa4bf" }}>{v.reason}</span>
        </div>
      ))}
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ color: "#9aa4bf", fontSize: 13, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
