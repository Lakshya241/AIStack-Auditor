import { PRICING_DATA } from "../constants/pricingData";
import { computeMonthlySavings, computeYearlySavings } from "./calculations";
import type { ToolEntry, ToolName, PlanName } from "../../types/tool";
import type { Recommendation } from "../../types/recommendation";

/** Helper: get price per seat for a tool/plan from PRICING_DATA. Returns undefined if not found. */
function getPrice(tool: ToolName, plan: PlanName): number | undefined {
  const toolData = PRICING_DATA.find((t) => t.tool === tool);
  return toolData?.plans.find((p) => p.name === plan)?.pricePerSeat;
}

/** Helper: get all plans for a tool in order from PRICING_DATA. */
function getPlans(tool: ToolName) {
  return PRICING_DATA.find((t) => t.tool === tool)?.plans ?? [];
}

/**
 * Rule: ChatGPT Team with ≤ 2 seats → downgrade to Plus.
 * Req 2.2
 */
export function ruleTeamDowngrade(entries: ToolEntry[]): Recommendation[] {
  const results: Recommendation[] = [];
  for (const entry of entries) {
    if (entry.tool === "ChatGPT" && entry.plan === "Team" && entry.seats <= 2) {
      const currentPrice = getPrice("ChatGPT", "Team");
      const recommendedPrice = getPrice("ChatGPT", "Plus");
      if (currentPrice === undefined || recommendedPrice === undefined) continue;
      const monthly = computeMonthlySavings(currentPrice, recommendedPrice, entry.seats);
      if (monthly <= 0) continue;
      const yearly = computeYearlySavings(monthly);
      results.push({
        id: `team-downgrade-ChatGPT`,
        type: "downgrade",
        toolName: "ChatGPT",
        currentPlan: "Team",
        recommendedPlan: "Plus",
        currentPricePerSeat: currentPrice,
        recommendedPricePerSeat: recommendedPrice,
        monthlySavings: monthly,
        yearlySavings: yearly,
        explanation: `With only ${entry.seats} seat${entry.seats > 1 ? "s" : ""}, ChatGPT Plus ($${recommendedPrice}/seat) is more cost-effective than Team ($${currentPrice}/seat).`,
        isOverlap: false,
      });
    }
  }
  return results;
}

/**
 * Rule: Enterprise plan with < 5 seats → downgrade to next lower tier.
 * Req 2.3
 */
export function ruleEnterpriseDowngrade(entries: ToolEntry[]): Recommendation[] {
  const results: Recommendation[] = [];
  for (const entry of entries) {
    if (entry.plan !== "Enterprise" || entry.seats >= 5) continue;
    const plans = getPlans(entry.tool);
    const enterpriseIndex = plans.findIndex((p) => p.name === "Enterprise");
    if (enterpriseIndex <= 0) continue; // no lower plan
    const nextLowerPlan = plans[enterpriseIndex - 1];
    const currentPrice = getPrice(entry.tool, "Enterprise");
    const recommendedPrice = nextLowerPlan.pricePerSeat;
    if (currentPrice === undefined) continue;
    const monthly = computeMonthlySavings(currentPrice, recommendedPrice, entry.seats);
    if (monthly <= 0) continue;
    const yearly = computeYearlySavings(monthly);
    results.push({
      id: `enterprise-downgrade-${entry.tool}`,
      type: "downgrade",
      toolName: entry.tool,
      currentPlan: "Enterprise",
      recommendedPlan: nextLowerPlan.name,
      currentPricePerSeat: currentPrice,
      recommendedPricePerSeat: recommendedPrice,
      monthlySavings: monthly,
      yearlySavings: yearly,
      explanation: `With only ${entry.seats} seat${entry.seats > 1 ? "s" : ""}, ${entry.tool} ${nextLowerPlan.name} ($${recommendedPrice}/seat) is more cost-effective than Enterprise ($${currentPrice}/seat).`,
      isOverlap: false,
    });
  }
  return results;
}

/**
 * Rule: Paid plan with 1 seat where Free tier exists → switch to Free.
 * Req 2.7
 */
export function ruleFreeTier(entries: ToolEntry[]): Recommendation[] {
  const results: Recommendation[] = [];
  for (const entry of entries) {
    if (entry.seats !== 1) continue;
    const freePrice = getPrice(entry.tool, "Free");
    if (freePrice === undefined) continue; // no Free tier
    const currentPrice = getPrice(entry.tool, entry.plan);
    if (currentPrice === undefined || currentPrice === 0) continue; // already free
    // savings = user's current monthly spend for this entry
    const monthly = entry.monthlySpend;
    if (monthly <= 0) continue;
    const yearly = computeYearlySavings(monthly);
    results.push({
      id: `free-tier-${entry.tool}`,
      type: "free-tier",
      toolName: entry.tool,
      currentPlan: entry.plan,
      recommendedPlan: "Free",
      currentPricePerSeat: currentPrice,
      recommendedPricePerSeat: 0,
      monthlySavings: monthly,
      yearlySavings: yearly,
      explanation: `With only 1 seat, ${entry.tool} has a Free tier available that could eliminate your $${monthly}/month spend.`,
      isOverlap: false,
    });
  }
  return results;
}

/**
 * Rule: ChatGPT + Claude + Gemini simultaneously → single overlap recommendation.
 * Req 2.4
 */
export function ruleLLMOverlap(entries: ToolEntry[]): Recommendation[] {
  const chatgpt = entries.find((e) => e.tool === "ChatGPT");
  const claude = entries.find((e) => e.tool === "Claude");
  const gemini = entries.find((e) => e.tool === "Gemini");
  if (!chatgpt || !claude || !gemini) return [];

  // Savings = sum of monthly spend of the two tools with lower spend (keep the highest)
  const sorted = [chatgpt, claude, gemini].sort((a, b) => b.monthlySpend - a.monthlySpend);
  const toRemove = sorted.slice(1); // remove the two with lower spend
  const monthly = toRemove.reduce((sum, e) => sum + e.monthlySpend, 0);
  if (monthly <= 0) return [];
  const yearly = computeYearlySavings(monthly);

  return [
    {
      id: `llm-overlap-ChatGPT`,
      type: "overlap",
      toolName: "ChatGPT",
      currentPlan: chatgpt.plan,
      recommendedPlan: null,
      currentPricePerSeat: getPrice("ChatGPT", chatgpt.plan) ?? 0,
      recommendedPricePerSeat: null,
      monthlySavings: monthly,
      yearlySavings: yearly,
      explanation: `ChatGPT, Claude, and Gemini are all general-purpose LLM assistants. Consider consolidating to one tool to eliminate redundancy.`,
      isOverlap: true,
      overlappingTools: ["ChatGPT", "Claude", "Gemini"],
    },
  ];
}

/**
 * Rule: Cursor + GitHub Copilot → overlap, retain higher seat count.
 * Req 2.5
 */
export function ruleCursorCopilotOverlap(entries: ToolEntry[]): Recommendation[] {
  const cursor = entries.find((e) => e.tool === "Cursor");
  const copilot = entries.find((e) => e.tool === "GitHub Copilot");
  if (!cursor || !copilot) return [];

  // Retain the tool with higher seat count; if equal, retain Cursor
  const toRemove = cursor.seats >= copilot.seats ? copilot : cursor;
  const monthly = toRemove.monthlySpend;
  if (monthly <= 0) return [];
  const yearly = computeYearlySavings(monthly);
  const retain = toRemove === cursor ? copilot : cursor;

  return [
    {
      id: `cursor-copilot-overlap-${toRemove.tool}`,
      type: "overlap",
      toolName: toRemove.tool,
      currentPlan: toRemove.plan,
      recommendedPlan: null,
      currentPricePerSeat: getPrice(toRemove.tool, toRemove.plan) ?? 0,
      recommendedPricePerSeat: null,
      monthlySavings: monthly,
      yearlySavings: yearly,
      explanation: `Cursor and GitHub Copilot are both AI coding assistants. Consider retaining ${retain.tool} (${retain.seats} seats) and removing ${toRemove.tool}.`,
      isOverlap: true,
      overlappingTools: ["Cursor", "GitHub Copilot"],
    },
  ];
}

/**
 * Rule: Cursor + Windsurf → overlap, retain higher seat count.
 * Req 2.6
 */
export function ruleCursorWindsurfOverlap(entries: ToolEntry[]): Recommendation[] {
  const cursor = entries.find((e) => e.tool === "Cursor");
  const windsurf = entries.find((e) => e.tool === "Windsurf");
  if (!cursor || !windsurf) return [];

  // Retain the tool with higher seat count; if equal, retain Cursor
  const toRemove = cursor.seats >= windsurf.seats ? windsurf : cursor;
  const monthly = toRemove.monthlySpend;
  if (monthly <= 0) return [];
  const yearly = computeYearlySavings(monthly);
  const retain = toRemove === cursor ? windsurf : cursor;

  return [
    {
      id: `cursor-windsurf-overlap-${toRemove.tool}`,
      type: "overlap",
      toolName: toRemove.tool,
      currentPlan: toRemove.plan,
      recommendedPlan: null,
      currentPricePerSeat: getPrice(toRemove.tool, toRemove.plan) ?? 0,
      recommendedPricePerSeat: null,
      monthlySavings: monthly,
      yearlySavings: yearly,
      explanation: `Cursor and Windsurf are both AI IDE tools. Consider retaining ${retain.tool} (${retain.seats} seats) and removing ${toRemove.tool}.`,
      isOverlap: true,
      overlappingTools: ["Cursor", "Windsurf"],
    },
  ];
}
