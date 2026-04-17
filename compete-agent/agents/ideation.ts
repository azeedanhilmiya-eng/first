import { z } from "zod";
import { getLLM, MODEL } from "@/lib/llm";
import { loadRubric, rubricAsSystemText } from "@/lib/rubric";
import { IDEATION_SYSTEM } from "@/prompts/ideation";

export const IdeationInput = z.object({
  rubric: z.string().default("huliuwangjia"),
  track: z.string().describe("赛道，如 高教主赛道"),
  group: z.string().describe("组别，如 本科生创意组"),
  interests: z.string().describe("团队兴趣方向 / 专业背景"),
  capabilities: z.string().describe("团队现有能力：技术栈、已有资源"),
  time_budget_weeks: z.number().int().min(2).max(52),
  extra: z.string().optional(),
});
export type IdeationInput = z.infer<typeof IdeationInput>;

export const Candidate = z.object({
  title: z.string(),
  one_liner: z.string(),
  innovation: z.object({ score: z.number(), reason: z.string() }),
  feasibility: z.object({ score: z.number(), reason: z.string() }),
  business: z.object({ score: z.number(), reason: z.string() }),
  similar_awards: z.array(z.string()),
  mvp_scope: z.array(z.string()),
  risks: z.array(z.string()),
});

export const IdeationOutput = z.object({
  candidates: z.array(Candidate).length(3),
  recommendation: z.string(),
});
export type IdeationOutput = z.infer<typeof IdeationOutput>;

export async function runIdeation(input: IdeationInput): Promise<IdeationOutput> {
  const rubric = loadRubric(input.rubric);
  const system = [IDEATION_SYSTEM, rubricAsSystemText(rubric)].join("\n\n");

  const userPayload = {
    track: input.track,
    group: input.group,
    interests: input.interests,
    capabilities: input.capabilities,
    time_budget_weeks: input.time_budget_weeks,
    extra: input.extra ?? "",
  };

  const res = await getLLM().chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `以下是团队信息（JSON），请严格按规定 JSON schema 产出 3 个候选选题：\n${JSON.stringify(
          userPayload,
          null,
          2,
        )}`,
      },
    ],
  });

  const text = res.choices[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("LLM returned empty content");

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Ideation output not JSON: ${text.slice(0, 200)}`);
  }
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  return IdeationOutput.parse(parsed);
}
