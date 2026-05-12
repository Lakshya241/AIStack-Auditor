import { GoogleGenerativeAI } from "@google/generative-ai";

const TIMEOUT_MS = 10_000;
const MODEL = "gemini-1.5-flash";

/**
 * Generates a summary string from the given prompt using the Google Gemini API.
 * Throws if the API call fails or does not respond within 10 seconds.
 */
export async function generateSummary(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini API request timed out after 10 seconds")), TIMEOUT_MS)
  );

  const apiPromise = model.generateContent(prompt);

  const response = await Promise.race([apiPromise, timeoutPromise]);

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini API");
  }

  const firstCandidate = response.candidates[0];
  if (!firstCandidate.content?.parts || firstCandidate.content.parts.length === 0) {
    throw new Error("No text content in Gemini API response");
  }

  const textPart = firstCandidate.content.parts.find(
    (part) => "text" in part && typeof part.text === "string"
  );

  if (!textPart || !("text" in textPart)) {
    throw new Error("No text found in Gemini API response");
  }

  return textPart.text;
}
