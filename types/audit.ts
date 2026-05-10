import type { ToolEntry } from "./tool";
import type { Recommendation } from "./recommendation";

export interface AuditInput {
  tools: ToolEntry[];
}

export interface AuditResult {
  recommendations: Recommendation[];
  totalMonthlySavings: number;
  totalYearlySavings: number;
  optimizationScore: number;        // 0–100
  engineVersion: string;            // matches PRICING_DATA_VERSION
}

export interface AuditError {
  code: "INVALID_INPUT" | "TOO_MANY_ENTRIES" | "MISSING_PRICING" | "ENGINE_ERROR";
  message: string;
  invalidEntryIndex?: number;
}

export type AuditEngineOutput = AuditResult | AuditError;

export interface StoredAudit {
  id: string;                       // UUID v4
  input: AuditInput;
  result: AuditResult;
  aiSummary: string | null;
  createdAt: string;                // ISO 8601
}
