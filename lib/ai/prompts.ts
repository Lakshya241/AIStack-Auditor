import type { AuditResult } from "../../types/audit";
import { formatUSD } from "../utils/currency";

/**
 * Builds a prompt asking Claude to write an 80–120 word summary of the audit results.
 */
export function buildAuditPrompt(result: AuditResult): string {
  const { recommendations, totalMonthlySavings, totalYearlySavings, optimizationScore } = result;

  const recommendationLines = recommendations
    .map(
      (r, i) =>
        `${i + 1}. ${r.toolName} (${r.type}): ${r.explanation} — saves ${formatUSD(r.monthlySavings)}/month`
    )
    .join("\n");

  const recommendationSection =
    recommendations.length > 0
      ? `Recommendations:\n${recommendationLines}`
      : "No specific recommendations — the stack is already well-optimized.";

  return `You are an AI spending analyst. Write a concise, professional summary of the following AI tool audit results in exactly 80–120 words. Focus on the key findings, potential savings, and optimization score. Do not make product recommendations that contradict the audit findings below.

Optimization Score: ${optimizationScore}/100
Total Monthly Savings Potential: ${formatUSD(totalMonthlySavings)}/month
Total Yearly Savings Potential: ${formatUSD(totalYearlySavings)}/year

${recommendationSection}

Write the summary now (80–120 words):`;
}

/**
 * Builds a deterministic fallback summary when the Claude API is unavailable.
 */
export function buildFallbackSummary(result: AuditResult): string {
  const count = result.recommendations.length;
  const savings = formatUSD(result.totalMonthlySavings);
  if (count === 0) {
    return `Your AI stack is well-optimized with a score of ${result.optimizationScore}/100. No redundancies or savings opportunities were identified.`;
  }
  return `We identified ${count} optimization ${count === 1 ? "opportunity" : "opportunities"} in your AI stack, with potential savings of ${savings}/month ($${formatUSD(result.totalYearlySavings)}/year). Your current optimization score is ${result.optimizationScore}/100.`;
}
