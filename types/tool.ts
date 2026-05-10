export type ToolName =
  | "ChatGPT"
  | "Claude"
  | "Cursor"
  | "GitHub Copilot"
  | "Gemini"
  | "Windsurf";

export type PlanName =
  | "Free"
  | "Plus"
  | "Pro"
  | "Team"
  | "Teams"
  | "Business"
  | "Individual"
  | "Enterprise";

export interface ToolEntry {
  tool: ToolName;
  plan: PlanName;
  seats: number;          // 1–10,000
  monthlySpend: number;   // USD, ≥ 0, ≤ 1,000,000
  useCase?: string;       // max 500 chars
}

export interface PricingPlan {
  name: PlanName;
  pricePerSeat: number;   // USD per seat per month
}

export interface ToolPricing {
  tool: ToolName;
  plans: PricingPlan[];
}
