import { describe, it, expect } from "vitest";
import { PRICING_DATA, PRICING_DATA_VERSION } from "../../lib/constants/pricingData";

describe("PRICING_DATA_VERSION", () => {
  it("matches semver format", () => {
    expect(PRICING_DATA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("PRICING_DATA", () => {
  it("contains all 6 tools", () => {
    const toolNames = PRICING_DATA.map((t) => t.tool);
    expect(toolNames).toContain("ChatGPT");
    expect(toolNames).toContain("Claude");
    expect(toolNames).toContain("Cursor");
    expect(toolNames).toContain("GitHub Copilot");
    expect(toolNames).toContain("Gemini");
    expect(toolNames).toContain("Windsurf");
    expect(PRICING_DATA).toHaveLength(6);
  });

  it("ChatGPT has 4 plans with correct prices", () => {
    const chatgpt = PRICING_DATA.find((t) => t.tool === "ChatGPT");
    expect(chatgpt?.plans).toHaveLength(4);
    expect(chatgpt?.plans.find((p) => p.name === "Free")?.pricePerSeat).toBe(0);
    expect(chatgpt?.plans.find((p) => p.name === "Plus")?.pricePerSeat).toBe(20);
    expect(chatgpt?.plans.find((p) => p.name === "Team")?.pricePerSeat).toBe(25);
    expect(chatgpt?.plans.find((p) => p.name === "Enterprise")?.pricePerSeat).toBe(60);
  });

  it("Claude has 4 plans with correct prices", () => {
    const claude = PRICING_DATA.find((t) => t.tool === "Claude");
    expect(claude?.plans).toHaveLength(4);
    expect(claude?.plans.find((p) => p.name === "Free")?.pricePerSeat).toBe(0);
    expect(claude?.plans.find((p) => p.name === "Pro")?.pricePerSeat).toBe(20);
    expect(claude?.plans.find((p) => p.name === "Team")?.pricePerSeat).toBe(25);
    expect(claude?.plans.find((p) => p.name === "Enterprise")?.pricePerSeat).toBe(60);
  });

  it("Cursor has 3 plans with correct prices", () => {
    const cursor = PRICING_DATA.find((t) => t.tool === "Cursor");
    expect(cursor?.plans).toHaveLength(3);
    expect(cursor?.plans.find((p) => p.name === "Free")?.pricePerSeat).toBe(0);
    expect(cursor?.plans.find((p) => p.name === "Pro")?.pricePerSeat).toBe(20);
    expect(cursor?.plans.find((p) => p.name === "Business")?.pricePerSeat).toBe(40);
  });

  it("GitHub Copilot has 4 plans with correct prices", () => {
    const copilot = PRICING_DATA.find((t) => t.tool === "GitHub Copilot");
    expect(copilot?.plans).toHaveLength(4);
    expect(copilot?.plans.find((p) => p.name === "Free")?.pricePerSeat).toBe(0);
    expect(copilot?.plans.find((p) => p.name === "Individual")?.pricePerSeat).toBe(10);
    expect(copilot?.plans.find((p) => p.name === "Business")?.pricePerSeat).toBe(19);
    expect(copilot?.plans.find((p) => p.name === "Enterprise")?.pricePerSeat).toBe(39);
  });

  it("Gemini has 3 plans with correct prices", () => {
    const gemini = PRICING_DATA.find((t) => t.tool === "Gemini");
    expect(gemini?.plans).toHaveLength(3);
    expect(gemini?.plans.find((p) => p.name === "Free")?.pricePerSeat).toBe(0);
    expect(gemini?.plans.find((p) => p.name === "Business")?.pricePerSeat).toBe(20);
    expect(gemini?.plans.find((p) => p.name === "Enterprise")?.pricePerSeat).toBe(30);
  });

  it("Windsurf has 3 plans with correct prices", () => {
    const windsurf = PRICING_DATA.find((t) => t.tool === "Windsurf");
    expect(windsurf?.plans).toHaveLength(3);
    expect(windsurf?.plans.find((p) => p.name === "Free")?.pricePerSeat).toBe(0);
    expect(windsurf?.plans.find((p) => p.name === "Pro")?.pricePerSeat).toBe(15);
    expect(windsurf?.plans.find((p) => p.name === "Teams")?.pricePerSeat).toBe(35);
  });

  it("no plan has a negative price", () => {
    for (const tool of PRICING_DATA) {
      for (const plan of tool.plans) {
        expect(plan.pricePerSeat).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
