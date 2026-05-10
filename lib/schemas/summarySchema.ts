import { z } from "zod";

const recommendationSchema = z.object({
  id: z.string(),
  type: z.enum(["downgrade", "free-tier", "overlap"]),
  toolName: z.enum(["ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Gemini", "Windsurf"]),
  currentPlan: z.enum(["Free", "Plus", "Pro", "Team", "Teams", "Business", "Individual", "Enterprise"]),
  recommendedPlan: z
    .enum(["Free", "Plus", "Pro", "Team", "Teams", "Business", "Individual", "Enterprise"])
    .nullable(),
  currentPricePerSeat: z.number(),
  recommendedPricePerSeat: z.number().nullable(),
  monthlySavings: z.number(),
  yearlySavings: z.number(),
  explanation: z.string(),
  isOverlap: z.boolean(),
  overlappingTools: z
    .array(z.enum(["ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Gemini", "Windsurf"]))
    .optional(),
});

export const summaryRequestSchema = z.object({
  auditId: z.string().uuid(),
  recommendations: z.array(recommendationSchema),
  totalMonthlySavings: z.number(),
  totalYearlySavings: z.number(),
});

export type SummaryRequestInput = z.infer<typeof summaryRequestSchema>;
