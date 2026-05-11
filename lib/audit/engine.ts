import type { AuditInput, AuditEngineOutput, AuditResult, AuditError } from "../../types/audit";
import type { ToolEntry, ToolName, PlanName } from "../../types/tool";
import {
  ruleTeamDowngrade,
  ruleEnterpriseDowngrade,
  ruleFreeTier,
  ruleLLMOverlap,
  ruleCursorCopilotOverlap,
  ruleCursorWindsurfOverlap,
} from "./rules";
import { aggregateSavings, computeScore } from "./calculations";
import { PRICING_DATA, PRICING_DATA_VERSION } from "../constants/pricingData";

// Valid tool names and plan names sourced from PRICING_DATA / domain types
const VALID_TOOL_NAMES: ReadonlySet<string> = new Set<ToolName>([
  "ChatGPT",
  "Claude",
  "Cursor",
  "GitHub Copilot",
  "Gemini",
  "Windsurf",
]);

const VALID_PLAN_NAMES: ReadonlySet<string> = new Set<PlanName>([
  "Free",
  "Plus",
  "Pro",
  "Team",
  "Teams",
  "Business",
  "Individual",
  "Enterprise",
]);

/**
 * Validates a single ToolEntry. Returns an error message string if invalid, or null if valid.
 */
function validateEntry(entry: unknown, index: number): string | null {
  if (entry === null || typeof entry !== "object") {
    return `Entry at index ${index} is not a valid object`;
  }

  const e = entry as Record<string, unknown>;

  // Validate tool name
  if (typeof e.tool !== "string" || !VALID_TOOL_NAMES.has(e.tool)) {
    return `Entry at index ${index} has an invalid or missing tool name`;
  }

  // Validate plan name
  if (typeof e.plan !== "string" || !VALID_PLAN_NAMES.has(e.plan)) {
    return `Entry at index ${index} has an invalid or missing plan name`;
  }

  // Validate seats: must be an integer between 1 and 10000
  if (
    typeof e.seats !== "number" ||
    !Number.isInteger(e.seats) ||
    e.seats < 1 ||
    e.seats > 10000
  ) {
    return `Entry at index ${index} has an invalid seats value (must be an integer between 1 and 10000)`;
  }

  // Validate monthlySpend: must be a finite number between 0 and 1000000
  if (
    typeof e.monthlySpend !== "number" ||
    !Number.isFinite(e.monthlySpend) ||
    e.monthlySpend < 0 ||
    e.monthlySpend > 1000000
  ) {
    return `Entry at index ${index} has an invalid monthlySpend value (must be a number between 0 and 1,000,000)`;
  }

  // Validate optional useCase
  if (e.useCase !== undefined && (typeof e.useCase !== "string" || e.useCase.length > 500)) {
    return `Entry at index ${index} has an invalid useCase (must be a string of at most 500 characters)`;
  }

  return null;
}

/**
 * Checks whether the given tool/plan combination exists in PRICING_DATA.
 * Returns true if found, false if missing.
 */
function isPricingAvailable(tool: ToolName, plan: PlanName): boolean {
  const toolData = PRICING_DATA.find((t) => t.tool === tool);
  if (!toolData) return false;
  return toolData.plans.some((p) => p.name === plan);
}

/**
 * runAudit — pure audit engine function.
 *
 * Given an AuditInput, validates the input, runs all rules, aggregates savings,
 * computes the optimization score, and returns an AuditResult or AuditError.
 *
 * Requirements: 2.1, 2.8, 2.9, 2.10, 2.11, 2.12, 13.3
 */
export function runAudit(input: AuditInput): AuditEngineOutput {
  try {
    // --- Input validation ---

    // Check that input and tools array exist
    if (
      input === null ||
      input === undefined ||
      typeof input !== "object" ||
      !Array.isArray(input.tools)
    ) {
      const error: AuditError = {
        code: "INVALID_INPUT",
        message: "Input must be an object with a tools array",
      };
      return error;
    }

    const { tools } = input;

    // Req 2.12: too many entries
    if (tools.length > 10) {
      const error: AuditError = {
        code: "TOO_MANY_ENTRIES",
        message: `Input contains ${tools.length} entries; maximum allowed is 10`,
      };
      return error;
    }

    // Req 2.11: validate each entry
    for (let i = 0; i < tools.length; i++) {
      const validationError = validateEntry(tools[i], i);
      if (validationError !== null) {
        const error: AuditError = {
          code: "INVALID_INPUT",
          message: validationError,
          invalidEntryIndex: i,
        };
        return error;
      }
    }

    // At this point all entries are structurally valid; cast to ToolEntry[]
    const validEntries = tools as ToolEntry[];

    // Req 10.6: check that every tool/plan combination referenced exists in PRICING_DATA
    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i];
      if (!isPricingAvailable(entry.tool, entry.plan)) {
        const error: AuditError = {
          code: "MISSING_PRICING",
          message: `No pricing data found for ${entry.tool} / ${entry.plan}`,
          invalidEntryIndex: i,
        };
        return error;
      }
    }

    // --- Run all rules ---
    const recommendations = [
      ...ruleTeamDowngrade(validEntries),
      ...ruleEnterpriseDowngrade(validEntries),
      ...ruleFreeTier(validEntries),
      ...ruleLLMOverlap(validEntries),
      ...ruleCursorCopilotOverlap(validEntries),
      ...ruleCursorWindsurfOverlap(validEntries),
    ];

    // --- Aggregate savings ---
    const { totalMonthlySavings, totalYearlySavings } = aggregateSavings(recommendations);

    // --- Compute optimization score ---
    const totalCurrentSpend = validEntries.reduce((sum, e) => sum + e.monthlySpend, 0);
    const optimizationScore = computeScore(totalCurrentSpend, totalMonthlySavings);

    // --- Build result ---
    const result: AuditResult = {
      recommendations,
      totalMonthlySavings,
      totalYearlySavings,
      optimizationScore,
      engineVersion: PRICING_DATA_VERSION,
    };

    return result;
  } catch (err) {
    // Req 2.10 / design: wrap unexpected errors as ENGINE_ERROR
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred in the audit engine";
    const error: AuditError = {
      code: "ENGINE_ERROR",
      message,
    };
    return error;
  }
}
