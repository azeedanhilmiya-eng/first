import { NextResponse } from "next/server";
import { IdeationInput, runIdeation } from "@/agents/ideation";
import { DEMO_IDEATION } from "@/agents/ideation-demo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const input = IdeationInput.parse(body);

  if (!process.env.ANTHROPIC_API_KEY) {
    // 演示模式：未配置 API Key 时返回固定样例，方便无 key 部署预览
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ...DEMO_IDEATION, _demo: true });
  }

  const result = await runIdeation(input);
  return NextResponse.json(result);
}
