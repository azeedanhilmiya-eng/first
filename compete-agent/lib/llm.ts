import OpenAI from "openai";

export const MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";

let _client: OpenAI | null = null;

/** 懒加载客户端：构建时不触发 OpenAI SDK 对 env 的强校验，仅运行时真实调用才要 key。 */
export function getLLM(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LLM_API_KEY 未配置。请在 Vercel Settings → Environment Variables 添加 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL。",
    );
  }
  _client = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL,
  });
  return _client;
}
