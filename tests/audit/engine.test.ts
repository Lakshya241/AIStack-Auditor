import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { runAudit } from "../../lib/audit/engine";
import { computeScore } from "../../lib/audit/calculations";
import { validToolArrayArb } from "../arbitraries";
import type { AuditResult, AuditError } from "../../types/audit";
import type { ToolEntry } from "../../types/tool";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Discriminate AuditEngineOutput: true when the result is an AuditError. */
function isError(output: AuditResult | AuditError): output is AuditError {
  return "code" in output;
}

/** Discriminate AuditEngineOutput: true when the result is an AuditResult. */
function isResult(output: AuditResult | AuditError): output is AuditResult {
  return "recommendations" in output;
}

// ---------------------------------------------------------------------------
// Property 1: Audit Engine Determinism
// Feature: aistack-auditor, Property 1
// **Validates: Requirements 2.8**
// ---------------------------------------------------------------------------
describe("Property 1: Audit Engine Determinism", () => {
  it("calling runAudit twice with the same valid input produces deeply equal results", () => {
    // Feature: aistack-auditor, Property 1: Audit Engine Determinism
    fc.assert(
      fc.property(validToolArrayArb, (tools) => {
        const input = { tools };
        const first = runAudit(input);
        const second = runAudit(input);

        // Both calls must agree on whether they produced a result or an error
        expect(isError(first)).toBe(isError(second));

        if (isResult(first) && isResult(second)) {
          // Recommendations must be identical in length and order
          expect(first.recommendations).toHaveLength(second.recommendations.length);
          for (let i = 0; i < first.recommendations.length; i++) {
            expect(first.recommendations[i]).toEqual(second.recommendations[i]);
          }
          // Savings figures must be identical
          expect(first.totalMonthlySavings).toBe(second.totalMonthlySavings);
          expect(first.totalYearlySavings).toBe(second.totalYearlySavings);
          // Optimization score must be identical
          expect(first.optimizationScore).toBe(second.optimizationScore);
          // Engine version must be identical
          expect(first.engineVersion).toBe(second.engineVersion);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Invalid Input Returns Error
// Feature: aistack-auditor, Property 7
// **Validates: Requirements 2.11**
// ---------------------------------------------------------------------------
describe("Property 7: Invalid Input Returns Error", () => {
  it("an array with at least one entry missing a required field returns INVALID_INPUT", () => {
    // Feature: aistack-auditor, Property 7: Invalid Input Returns Error
    //
    // Strategy: generate arrays where at least one entry is deliberately broken.
    // We inject an invalid entry (missing/wrong required fields) at a random position.
    const invalidEntryArb = fc.oneof(
      // missing tool
      fc.record({
        tool: fc.constant(undefined),
        plan: fc.constant("Plus" as const),
        seats: fc.integer({ min: 1, max: 10 }),
        monthlySpend: fc.float({ min: 0, max: 1000, noNaN: true }),
      }),
      // invalid tool name (not in the allowed set)
      fc.record({
        tool: fc.string({ minLength: 1, maxLength: 20 }).filter(
          (s) =>
            !["ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Gemini", "Windsurf"].includes(s)
        ),
        plan: fc.constant("Plus" as const),
        seats: fc.integer({ min: 1, max: 10 }),
        monthlySpend: fc.float({ min: 0, max: 1000, noNaN: true }),
      }),
      // invalid plan name
      fc.record({
        tool: fc.constant("ChatGPT" as const),
        plan: fc.string({ minLength: 1, maxLength: 20 }).filter(
          (s) =>
            !["Free", "Plus", "Pro", "Team", "Teams", "Business", "Individual", "Enterprise"].includes(s)
        ),
        seats: fc.integer({ min: 1, max: 10 }),
        monthlySpend: fc.float({ min: 0, max: 1000, noNaN: true }),
      }),
      // invalid seats (0 or negative)
      fc.record({
        tool: fc.constant("ChatGPT" as const),
        plan: fc.constant("Plus" as const),
        seats: fc.integer({ min: -1000, max: 0 }),
        monthlySpend: fc.float({ min: 0, max: 1000, noNaN: true }),
      }),
      // invalid monthlySpend (negative)
      fc.record({
        tool: fc.constant("ChatGPT" as const),
        plan: fc.constant("Plus" as const),
        seats: fc.integer({ min: 1, max: 10 }),
        monthlySpend: fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.01), noNaN: true }),
      })
    );

    fc.assert(
      fc.property(
        // 1–9 valid entries
        fc.array(
          fc.record({
            tool: fc.constantFrom(
              "ChatGPT" as const,
              "Claude" as const,
              "Cursor" as const,
              "GitHub Copilot" as const,
              "Gemini" as const,
              "Windsurf" as const
            ),
            plan: fc.constantFrom(
              "Free" as const,
              "Plus" as const,
              "Pro" as const,
              "Team" as const,
              "Teams" as const,
              "Business" as const,
              "Individual" as const,
              "Enterprise" as const
            ),
            seats: fc.integer({ min: 1, max: 10000 }),
            monthlySpend: fc.float({ min: 0, max: 1000000, noNaN: true }),
          }),
          { minLength: 0, maxLength: 8 }
        ),
        invalidEntryArb,
        fc.integer({ min: 0, max: 9 }),
        (validEntries, invalidEntry, insertPos) => {
          // Insert the invalid entry at a position within the array
          const pos = Math.min(insertPos, validEntries.length);
          const tools = [
            ...validEntries.slice(0, pos),
            invalidEntry,
            ...validEntries.slice(pos),
          ] as ToolEntry[];

          // Total length must be ≤ 10 to avoid TOO_MANY_ENTRIES masking INVALID_INPUT
          if (tools.length > 10) return;

          const output = runAudit({ tools });

          expect(isError(output)).toBe(true);
          if (isError(output)) {
            expect(output.code).toBe("INVALID_INPUT");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Oversized Input Returns Error
// Feature: aistack-auditor, Property 8
// **Validates: Requirements 2.12**
// ---------------------------------------------------------------------------
describe("Property 8: Oversized Input Returns Error", () => {
  it("any array of 11 or more tool entries returns TOO_MANY_ENTRIES without recommendations", () => {
    // Feature: aistack-auditor, Property 8: Oversized Input Returns Error
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            tool: fc.constantFrom(
              "ChatGPT" as const,
              "Claude" as const,
              "Cursor" as const,
              "GitHub Copilot" as const,
              "Gemini" as const,
              "Windsurf" as const
            ),
            plan: fc.constantFrom(
              "Free" as const,
              "Plus" as const,
              "Pro" as const,
              "Team" as const,
              "Teams" as const,
              "Business" as const,
              "Individual" as const,
              "Enterprise" as const
            ),
            seats: fc.integer({ min: 1, max: 10000 }),
            monthlySpend: fc.float({ min: 0, max: 1000000, noNaN: true }),
          }),
          { minLength: 11, maxLength: 50 }
        ),
        (tools) => {
          const output = runAudit({ tools });

          expect(isError(output)).toBe(true);
          if (isError(output)) {
            expect(output.code).toBe("TOO_MANY_ENTRIES");
          }
          // Must not produce any recommendations
          expect(isResult(output)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Required Example Tests (Requirements 12.2–12.6)
// ---------------------------------------------------------------------------

// Req 12.2: ChatGPT Team + 2 seats → $10.00/mo, $120.00/yr savings
describe("Req 12.2: ChatGPT Team 2 seats savings", () => {
  it("produces monthlySavings = $10.00 and yearlySavings = $120.00", () => {
    const output = runAudit({
      tools: [{ tool: "ChatGPT", plan: "Team", seats: 2, monthlySpend: 50 }],
    });

    expect(isResult(output)).toBe(true);
    if (isResult(output)) {
      const rec = output.recommendations.find((r) => r.type === "downgrade");
      expect(rec).toBeDefined();
      expect(rec!.monthlySavings).toBe(10.00);
      expect(rec!.yearlySavings).toBe(120.00);
    }
  });
});

// Req 12.3: ChatGPT + Claude + Gemini → overlap recommendation naming all three tools
describe("Req 12.3: LLM overlap names all three tools", () => {
  it("produces an overlap recommendation that names ChatGPT, Claude, and Gemini", () => {
    const output = runAudit({
      tools: [
        { tool: "ChatGPT", plan: "Plus",     seats: 1, monthlySpend: 20 },
        { tool: "Claude",  plan: "Pro",      seats: 1, monthlySpend: 20 },
        { tool: "Gemini",  plan: "Business", seats: 1, monthlySpend: 20 },
      ],
    });

    expect(isResult(output)).toBe(true);
    if (isResult(output)) {
      const overlap = output.recommendations.find((r) => r.isOverlap);
      expect(overlap).toBeDefined();
      expect(overlap!.overlappingTools).toContain("ChatGPT");
      expect(overlap!.overlappingTools).toContain("Claude");
      expect(overlap!.overlappingTools).toContain("Gemini");
    }
  });
});

// Req 12.4: computeScore(100, 25) === 75 and computeScore(0, 0) === 100
describe("Req 12.4: Optimization score formula", () => {
  it("computeScore(100, 25) returns 75", () => {
    expect(computeScore(100, 25)).toBe(75);
  });

  it("computeScore(0, 0) returns 100", () => {
    expect(computeScore(0, 0)).toBe(100);
  });
});

// Req 12.5: GitHub Copilot Individual 5 seats → empty recommendations array
describe("Req 12.5: No matching rules → empty recommendations", () => {
  it("GitHub Copilot Individual with 5 seats produces no recommendations", () => {
    const output = runAudit({
      tools: [{ tool: "GitHub Copilot", plan: "Individual", seats: 5, monthlySpend: 50 }],
    });

    expect(isResult(output)).toBe(true);
    if (isResult(output)) {
      expect(output.recommendations).toHaveLength(0);
    }
  });
});

// Req 12.6: All monetary values in recommendations are rounded to 2 decimal places
describe("Req 12.6: Monetary values rounded to 2 decimal places", () => {
  it("monthlySavings and yearlySavings in all recommendations have at most 2 decimal places", () => {
    // Use a concrete example that exercises the rounding path
    const output = runAudit({
      tools: [
        { tool: "ChatGPT", plan: "Team",     seats: 1, monthlySpend: 25 },
        { tool: "Claude",  plan: "Pro",      seats: 1, monthlySpend: 20 },
        { tool: "Gemini",  plan: "Business", seats: 1, monthlySpend: 20 },
      ],
    });

    expect(isResult(output)).toBe(true);
    if (isResult(output)) {
      for (const rec of output.recommendations) {
        const monthlyStr = rec.monthlySavings.toString();
        const yearlyStr = rec.yearlySavings.toString();

        const monthlyDecimals = monthlyStr.includes(".")
          ? monthlyStr.split(".")[1].length
          : 0;
        const yearlyDecimals = yearlyStr.includes(".")
          ? yearlyStr.split(".")[1].length
          : 0;

        expect(monthlyDecimals).toBeLessThanOrEqual(2);
        expect(yearlyDecimals).toBeLessThanOrEqual(2);
      }
    }
  });
});
