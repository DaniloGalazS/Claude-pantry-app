import Anthropic from "@anthropic-ai/sdk";

// This client should only be used on the server side
export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  return new Anthropic({
    apiKey,
  });
}

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
