import * as fc from "fast-check";
import type { ToolEntry } from "../types/tool";

export const toolNameArb = fc.constantFrom(
  "ChatGPT" as const,
  "Claude" as const,
  "Cursor" as const,
  "GitHub Copilot" as const,
  "Gemini" as const,
  "Windsurf" as const
);

export const planNameArb = fc.constantFrom(
  "Free" as const,
  "Plus" as const,
  "Pro" as const,
  "Team" as const,
  "Teams" as const,
  "Business" as const,
  "Individual" as const,
  "Enterprise" as const
);

export const toolEntryArb: fc.Arbitrary<ToolEntry> = fc.record({
  tool: toolNameArb,
  plan: planNameArb,
  seats: fc.integer({ min: 1, max: 10000 }),
  monthlySpend: fc.float({ min: 0, max: 1000000, noNaN: true }),
  useCase: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
});

export const validToolArrayArb = fc.array(toolEntryArb, { minLength: 1, maxLength: 10 });
