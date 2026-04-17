import OpenAI from "openai";

// codeflow.asia 等 OpenAI 兼容代理的 base URL 示例：https://codeflow.asia/v1
// 默认走官方 https://api.openai.com/v1
const baseURL = process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL;

export const MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";

export const llm = new OpenAI({
  apiKey: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL,
});
