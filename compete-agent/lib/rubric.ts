import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

export interface Rubric {
  competition: string;
  tracks: string[];
  groups: string[];
  dimensions: Array<{
    key: string;
    name: string;
    weight: number;
    focus: string[];
  }>;
  judge_personas: Array<{
    name: string;
    tone: string;
    typical_questions: string[];
  }>;
}

export function loadRubric(name: string): Rubric {
  const path = join(process.cwd(), "data", "rubrics", `${name}.yaml`);
  return YAML.parse(readFileSync(path, "utf8")) as Rubric;
}

export function rubricAsSystemText(r: Rubric): string {
  const dims = r.dimensions
    .map((d) => `- ${d.name}（${d.weight}%）：${d.focus.join("；")}`)
    .join("\n");
  return `【${r.competition} 评审维度】\n${dims}`;
}
