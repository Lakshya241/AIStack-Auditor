import { z } from "zod";

export const leadSchema = z.object({
  email: z.string().email(),
  company: z.string().min(1),
  role: z.string().min(1),
  teamSize: z.number().int().min(1).max(10000),
  auditId: z.string().uuid(),
});

export type LeadInput = z.infer<typeof leadSchema>;
