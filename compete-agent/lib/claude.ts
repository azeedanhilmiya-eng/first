import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type CachedSystem = Array<{
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}>;

export function cachedSystem(parts: string[]): CachedSystem {
  // Cache every block so repeat calls (same rubric/prompt) hit the cache.
  return parts.map((text) => ({
    type: "text",
    text,
    cache_control: { type: "ephemeral" },
  }));
}
