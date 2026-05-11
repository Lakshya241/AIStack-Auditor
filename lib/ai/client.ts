import Anthropic from "@anthropic-ai/sdk";

const TIMEOUT_MS = 10_000;
const MODEL = "claude-3-haiku-20240307";

/**
 * Generates a summary string from the given prompt using the Anthropic Claude API.
 * Throws if the API call fails or does not respond within 10 seconds.
 */
export async function generateSummary(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Claude API request timed out after 10 seconds")), TIMEOUT_MS)
  );

  const apiPromise = client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const response = await Promise.race([apiPromise, timeoutPromise]);

  const firstContent = response.content[0];
  if (!firstContent || firstContent.type !== "text") {
    throw new Error("Unexpected response format from Claude API");
  }

  return firstContent.text;
}
