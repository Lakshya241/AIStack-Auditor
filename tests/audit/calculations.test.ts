import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeMonthlySavings,
  computeYearlySavings,
  computeScore,
  aggregateSavings,
} from "../../lib/audit/calculations";
import type { Recommendation } from "../../types/recommendation";

// Helper to build a minimal Recommendation for testing
function makeRec(monthlySavings: number, yearlySavings: number): Recommendation {
  return {
    id: "test-rec",
    type: "downgrade",
    toolName: "ChatGPT",
    currentPlan: "Team",
    recommendedPlan: "Plus",
    currentPricePerSeat: 25,
    recommendedPricePerSeat: 20,
    monthlySavings,
    yearlySavings,
    explanation: "test",
    isOverlap: false,
  };
}

// Feature: aistack-auditor, Property 9: Savings Aggregation Invariant
// **Validates: Requirements 3.3, 3.4**
describe("Property 9: Savings Aggregation Invariant", () => {
  it("totalMonthlySavings equals sum of monthlySavings across all recommendations", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            monthlySavings: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (items) => {
          const recs = items.map((item) =>
            makeRec(item.monthlySavings, item.monthlySavings * 12)
          );
          const { totalMonthlySavings, totalYearlySavings } = aggregateSavings(recs);

          const expectedMonthly = Math.round(
            recs.reduce((sum, r) => sum + r.monthlySavings, 0) * 100
          ) / 100;
          const expectedYearly = Math.round(
            recs.reduce((sum, r) => sum + r.yearlySavings, 0) * 100
          ) / 100;

          expect(totalMonthlySavings).toBeCloseTo(expectedMonthly, 2);
          expect(totalYearlySavings).toBeCloseTo(expectedYearly, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: aistack-auditor, Property 10: Monetary Value Invariants
describe("Property 10: Monetary Value Invariants", () => {
  it("yearlySavings equals monthlySavings * 12, both rounded to 2dp, monthlySavings > 0", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(100000), noNaN: true }),
        fc.integer({ min: 1, max: 10000 }),
        (currentPrice, recommendedPrice, seats) => {
          // Only test when current > recommended (positive savings)
          fc.pre(currentPrice > recommendedPrice);

          const monthly = computeMonthlySavings(currentPrice, recommendedPrice, seats);
          const yearly = computeYearlySavings(monthly);

          // monthlySavings must be > 0
          expect(monthly).toBeGreaterThan(0);

          // yearlySavings must equal monthlySavings * 12
          expect(yearly).toBeCloseTo(monthly * 12, 2);

          // Both must have at most 2 decimal places
          const monthlyStr = monthly.toString();
          const yearlyStr = yearly.toString();
          const monthlyDecimals = monthlyStr.includes(".") ? monthlyStr.split(".")[1].length : 0;
          const yearlyDecimals = yearlyStr.includes(".") ? yearlyStr.split(".")[1].length : 0;
          expect(monthlyDecimals).toBeLessThanOrEqual(2);
          expect(yearlyDecimals).toBeLessThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: aistack-auditor, Property 11: Optimization Score Formula and Range
describe("Property 11: Optimization Score Formula and Range", () => {
  it("required example: computeScore(100, 25) === 75", () => {
    expect(computeScore(100, 25)).toBe(75);
  });

  it("required example: computeScore(0, 0) === 100", () => {
    expect(computeScore(0, 0)).toBe(100);
  });

  it("score is always an integer between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(1000000), noNaN: true }),
        (totalCurrentSpend, totalMonthlySavings) => {
          const score = computeScore(totalCurrentSpend, totalMonthlySavings);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
          expect(Number.isInteger(score)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("score formula: clamp(round((1 - savings/spend) * 100), 0, 100) when spend > 0", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(1000000), noNaN: true }),
        (totalCurrentSpend, totalMonthlySavings) => {
          const score = computeScore(totalCurrentSpend, totalMonthlySavings);
          const raw = (1 - totalMonthlySavings / totalCurrentSpend) * 100;
          const expected = Math.max(0, Math.min(100, Math.round(raw)));
          expect(score).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("score is 100 when totalCurrentSpend is 0", () => {
    expect(computeScore(0, 0)).toBe(100);
    expect(computeScore(0, 100)).toBe(100);
  });
});
