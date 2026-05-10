import type { ToolName, PlanName } from "./tool";

export type RecommendationType = "downgrade" | "free-tier" | "overlap";

export interface Recommendation {
  id: string;                       // deterministic: `${ruleId}-${toolName}`
  type: RecommendationType;
  toolName: ToolName;
  currentPlan: PlanName;
  recommendedPlan: PlanName | null; // null for overlap removals
  currentPricePerSeat: number;
  recommendedPricePerSeat: number | null;
  monthlySavings: number;           // USD, rounded to 2dp
  yearlySavings: number;            // monthlySavings * 12
  explanation: string;
  isOverlap: boolean;
  overlappingTools?: ToolName[];    // populated for overlap recommendations
}
