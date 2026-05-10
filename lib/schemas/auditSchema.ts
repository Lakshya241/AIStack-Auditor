import { z } from "zod";

export const toolEntrySchema = z.object({
  tool: z.enum(["ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Gemini", "Windsurf"]),
  plan: z.enum(["Free", "Plus", "Pro", "Team", "Teams", "Business", "Individual", "Enterprise"]),
  seats: z.number().int().min(1).max(10000),
  monthlySpend: z.number().min(0).max(1000000),
  useCase: z.string().max(500).optional(),
});

export const auditRequestSchema = z.object({
  tools: z.array(toolEntrySchema).min(1).max(10),
});

export type AuditRequestInput = z.infer<typeof auditRequestSchema>;
export type ToolEntryInput = z.infer<typeof toolEntrySchema>;
