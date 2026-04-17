import { NextResponse } from "next/server";
import { IdeationInput, runIdeation } from "@/agents/ideation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const input = IdeationInput.parse(body);
  const result = await runIdeation(input);
  return NextResponse.json(result);
}
