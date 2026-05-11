import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  ruleTeamDowngrade,
  ruleEnterpriseDowngrade,
  ruleLLMOverlap,
  ruleCursorCopilotOverlap,
  ruleCursorWindsurfOverlap,
  ruleFreeTier,
} from "../../lib/audit/rules";
import { PRICING_DATA } from "../../lib/constants/pricingData";
import type { ToolEntry, ToolName, PlanName } from "../../types/tool";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal ToolEntry with sensible defaults. */
function makeEntry(overrides: Partial<ToolEntry> & { tool: ToolName; plan: PlanName }): ToolEntry {
  return {
    seats: 1,
    monthlySpend: 20,
    ...overrides,
  };
}

/** Return the pricePerSeat for a given tool/plan from PRICING_DATA, or throw. */
function getPrice(tool: ToolName, plan: PlanName): number {
  const toolData = PRICING_DATA.find((t) => t.tool === tool);
  if (!toolData) throw new Error(`Tool not found: ${tool}`);
  const planData = toolData.plans.find((p) => p.name === plan);
  if (!planData) throw new Error(`Plan not found: ${plan} for ${tool}`);
  return planData.pricePerSeat;
}

/** All tools that have an Enterprise plan in PRICING_DATA. */
const enterpriseTools = PRICING_DATA.filter((t) =>
  t.plans.some((p) => p.name === "Enterprise")
).map((t) => t.tool);

/** All tools that have a Free plan in PRICING_DATA. */
const freeTools = PRICING_DATA.filter((t) =>
  t.plans.some((p) => p.name === "Free")
).map((t) => t.tool);

// ---------------------------------------------------------------------------
// Property 2: ChatGPT Team Downgrade Savings Formula
// Feature: aistack-auditor, Property 2
// **Validates: Requirements 2.2, 3.1, 3.2**
// ---------------------------------------------------------------------------
describe("Property 2: ChatGPT Team Downgrade Savings Formula", () => {
  it("for any seat count n in [1,2], monthlySavings = 5*n and yearlySavings = monthlySavings*12", () => {
    // Feature: aistack-auditor, Property 2
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }),
        (seats) => {
          const entry = makeEntry({ tool: "ChatGPT", plan: "Team", seats, monthlySpend: seats * 25 });
          const recs = ruleTeamDowngrade([entry]);

          // Must produce exactly one downgrade recommendation
          expect(recs).toHaveLength(1);
          const rec = recs[0];

          const teamPrice = getPrice("ChatGPT", "Team");   // 25
          const plusPrice = getPrice("ChatGPT", "Plus");   // 20
          const expectedMonthly = (teamPrice - plusPrice) * seats; // 5 * seats

          expect(rec.monthlySavings).toBeCloseTo(expectedMonthly, 2);
          expect(rec.yearlySavings).toBeCloseTo(rec.monthlySavings * 12, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces no recommendation when seats > 2", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10000 }),
        (seats) => {
          const entry = makeEntry({ tool: "ChatGPT", plan: "Team", seats, monthlySpend: seats * 25 });
          const recs = ruleTeamDowngrade([entry]);
          expect(recs).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Enterprise Downgrade Rule
// Feature: aistack-auditor, Property 3
// **Validates: Requirements 2.3, 3.1**
// ---------------------------------------------------------------------------
describe("Property 3: Enterprise Downgrade Rule", () => {
  it("for any enterprise tool with seats in [1,4], produces downgrade with correct savings", () => {
    // Feature: aistack-auditor, Property 3
    fc.assert(
      fc.property(
        fc.constantFrom(...(enterpriseTools as ToolName[])),
        fc.integer({ min: 1, max: 4 }),
        (tool, seats) => {
          const entry = makeEntry({ tool, plan: "Enterprise", seats, monthlySpend: seats * 60 });
          const recs = ruleEnterpriseDowngrade([entry]);

          // Must produce exactly one downgrade recommendation
          expect(recs).toHaveLength(1);
          const rec = recs[0];

          // Determine next lower plan from PRICING_DATA
          const toolData = PRICING_DATA.find((t) => t.tool === tool)!;
          const enterpriseIndex = toolData.plans.findIndex((p) => p.name === "Enterprise");
          const nextLowerPlan = toolData.plans[enterpriseIndex - 1];

          const enterprisePrice = getPrice(tool, "Enterprise");
          const nextLowerPrice = nextLowerPlan.pricePerSeat;
          const expectedMonthly = (enterprisePrice - nextLowerPrice) * seats;

          expect(rec.monthlySavings).toBeCloseTo(expectedMonthly, 2);
          expect(rec.recommendedPlan).toBe(nextLowerPlan.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces no recommendation when seats >= 5", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(enterpriseTools as ToolName[])),
        fc.integer({ min: 5, max: 10000 }),
        (tool, seats) => {
          const entry = makeEntry({ tool, plan: "Enterprise", seats, monthlySpend: seats * 60 });
          const recs = ruleEnterpriseDowngrade([entry]);
          expect(recs).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: LLM Overlap Detection
// Feature: aistack-auditor, Property 4
// **Validates: Requirements 2.4**
// ---------------------------------------------------------------------------
describe("Property 4: LLM Overlap Detection", () => {
  it("any stack with ChatGPT, Claude, and Gemini produces exactly one overlap rec naming all three", () => {
    // Feature: aistack-auditor, Property 4
    const paidPlanArb = fc.constantFrom<PlanName>("Plus", "Pro", "Team", "Business", "Enterprise");

    fc.assert(
      fc.property(
        // ChatGPT entry
        fc.record({
          plan: fc.constantFrom<PlanName>("Plus", "Team", "Enterprise"),
          seats: fc.integer({ min: 1, max: 100 }),
          monthlySpend: fc.float({ min: 1, max: 10000, noNaN: true }),
        }),
        // Claude entry
        fc.record({
          plan: fc.constantFrom<PlanName>("Pro", "Team", "Enterprise"),
          seats: fc.integer({ min: 1, max: 100 }),
          monthlySpend: fc.float({ min: 1, max: 10000, noNaN: true }),
        }),
        // Gemini entry
        fc.record({
          plan: fc.constantFrom<PlanName>("Business", "Enterprise"),
          seats: fc.integer({ min: 1, max: 100 }),
          monthlySpend: fc.float({ min: 1, max: 10000, noNaN: true }),
        }),
        (chatgptData, claudeData, geminiData) => {
          const entries: ToolEntry[] = [
            makeEntry({ tool: "ChatGPT", ...chatgptData }),
            makeEntry({ tool: "Claude", ...claudeData }),
            makeEntry({ tool: "Gemini", ...geminiData }),
          ];

          const recs = ruleLLMOverlap(entries);

          // Must produce exactly one overlap recommendation
          expect(recs).toHaveLength(1);
          const rec = recs[0];

          expect(rec.isOverlap).toBe(true);
          expect(rec.overlappingTools).toContain("ChatGPT");
          expect(rec.overlappingTools).toContain("Claude");
          expect(rec.overlappingTools).toContain("Gemini");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces no overlap recommendation when any of the three tools is missing", () => {
    fc.assert(
      fc.property(
        // Pick a subset of the three tools (missing at least one)
        fc.constantFrom(
          ["ChatGPT", "Claude"] as ToolName[],
          ["ChatGPT", "Gemini"] as ToolName[],
          ["Claude", "Gemini"] as ToolName[],
          ["ChatGPT"] as ToolName[],
          ["Claude"] as ToolName[],
          ["Gemini"] as ToolName[]
        ),
        (tools) => {
          const entries: ToolEntry[] = tools.map((tool) =>
            makeEntry({ tool, plan: "Pro", monthlySpend: 20 })
          );
          const recs = ruleLLMOverlap(entries);
          expect(recs).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: IDE Tool Overlap Retention Rule
// Feature: aistack-auditor, Property 5
// **Validates: Requirements 2.5, 2.6**
// ---------------------------------------------------------------------------
describe("Property 5: IDE Tool Overlap Retention Rule", () => {
  describe("Cursor + GitHub Copilot", () => {
    it("when Cursor has more seats, GitHub Copilot is removed (Cursor retained)", () => {
      // Feature: aistack-auditor, Property 5
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (cursorSeats, copilotSeats) => {
            fc.pre(cursorSeats !== copilotSeats);

            const cursor = makeEntry({ tool: "Cursor", plan: "Pro", seats: cursorSeats, monthlySpend: cursorSeats * 20 });
            const copilot = makeEntry({ tool: "GitHub Copilot", plan: "Business", seats: copilotSeats, monthlySpend: copilotSeats * 19 });
            const recs = ruleCursorCopilotOverlap([cursor, copilot]);

            expect(recs).toHaveLength(1);
            const rec = recs[0];
            expect(rec.isOverlap).toBe(true);

            const higherSeatTool: ToolName = cursorSeats > copilotSeats ? "Cursor" : "GitHub Copilot";
            const lowerSeatTool: ToolName = cursorSeats > copilotSeats ? "GitHub Copilot" : "Cursor";

            // The tool recommended for removal is the one with fewer seats
            expect(rec.toolName).toBe(lowerSeatTool);
            // The explanation should mention retaining the higher-seat tool
            expect(rec.explanation).toContain(higherSeatTool);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Cursor + Windsurf", () => {
    it("when seat counts differ, the tool with fewer seats is removed", () => {
      // Feature: aistack-auditor, Property 5
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (cursorSeats, windsurfSeats) => {
            fc.pre(cursorSeats !== windsurfSeats);

            const cursor = makeEntry({ tool: "Cursor", plan: "Pro", seats: cursorSeats, monthlySpend: cursorSeats * 20 });
            const windsurf = makeEntry({ tool: "Windsurf", plan: "Pro", seats: windsurfSeats, monthlySpend: windsurfSeats * 15 });
            const recs = ruleCursorWindsurfOverlap([cursor, windsurf]);

            expect(recs).toHaveLength(1);
            const rec = recs[0];
            expect(rec.isOverlap).toBe(true);

            const higherSeatTool: ToolName = cursorSeats > windsurfSeats ? "Cursor" : "Windsurf";
            const lowerSeatTool: ToolName = cursorSeats > windsurfSeats ? "Windsurf" : "Cursor";

            // The tool recommended for removal is the one with fewer seats
            expect(rec.toolName).toBe(lowerSeatTool);
            // The explanation should mention retaining the higher-seat tool
            expect(rec.explanation).toContain(higherSeatTool);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  it("produces no overlap recommendation when neither IDE pair is present", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (seats) => {
          // Only Cursor alone — no Copilot or Windsurf
          const entries: ToolEntry[] = [
            makeEntry({ tool: "Cursor", plan: "Pro", seats, monthlySpend: seats * 20 }),
          ];
          expect(ruleCursorCopilotOverlap(entries)).toHaveLength(0);
          expect(ruleCursorWindsurfOverlap(entries)).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Free-Tier Recommendation
// Feature: aistack-auditor, Property 6
// **Validates: Requirements 2.7**
// ---------------------------------------------------------------------------
describe("Property 6: Free-Tier Recommendation", () => {
  it("for any tool with a Free plan, a paid 1-seat entry produces a free-tier rec with monthlySavings = monthlySpend", () => {
    // Feature: aistack-auditor, Property 6
    fc.assert(
      fc.property(
        fc.constantFrom(...(freeTools as ToolName[])),
        fc.float({ min: Math.fround(0.01), max: 1000000, noNaN: true }),
        (tool, monthlySpend) => {
          // Find a paid plan for this tool
          const toolData = PRICING_DATA.find((t) => t.tool === tool)!;
          const paidPlans = toolData.plans.filter((p) => p.pricePerSeat > 0);
          if (paidPlans.length === 0) return; // skip tools with no paid plans (shouldn't happen)

          const paidPlan = paidPlans[0].name as PlanName;
          const entry = makeEntry({ tool, plan: paidPlan, seats: 1, monthlySpend });

          const recs = ruleFreeTier([entry]);

          // Must produce exactly one free-tier recommendation
          expect(recs).toHaveLength(1);
          const rec = recs[0];

          expect(rec.type).toBe("free-tier");
          expect(rec.recommendedPlan).toBe("Free");
          // monthlySavings must equal the user's submitted monthlySpend
          expect(rec.monthlySavings).toBeCloseTo(monthlySpend, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces no free-tier recommendation when seats > 1", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(freeTools as ToolName[])),
        fc.integer({ min: 2, max: 10000 }),
        fc.float({ min: Math.fround(0.01), max: 1000000, noNaN: true }),
        (tool, seats, monthlySpend) => {
          const toolData = PRICING_DATA.find((t) => t.tool === tool)!;
          const paidPlans = toolData.plans.filter((p) => p.pricePerSeat > 0);
          if (paidPlans.length === 0) return;

          const paidPlan = paidPlans[0].name as PlanName;
          const entry = makeEntry({ tool, plan: paidPlan, seats, monthlySpend });

          const recs = ruleFreeTier([entry]);
          expect(recs).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces no free-tier recommendation when monthlySpend is 0", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(freeTools as ToolName[])),
        (tool) => {
          const toolData = PRICING_DATA.find((t) => t.tool === tool)!;
          const paidPlans = toolData.plans.filter((p) => p.pricePerSeat > 0);
          if (paidPlans.length === 0) return;

          const paidPlan = paidPlans[0].name as PlanName;
          const entry = makeEntry({ tool, plan: paidPlan, seats: 1, monthlySpend: 0 });

          const recs = ruleFreeTier([entry]);
          expect(recs).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
