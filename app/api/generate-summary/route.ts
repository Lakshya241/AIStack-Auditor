import { NextResponse } from "next/server";
import { summaryRequestSchema } from "../../../lib/schemas/summarySchema";
import { generateSummary } from "../../../lib/ai/client";
import { buildAuditPrompt, buildFallbackSummary } from "../../../lib/ai/prompts";
import type { AuditResult } from "../../../types/audit";
import type { SummaryResponseBody, ApiErrorResponse } from "../../../types/api";

/**
 * POST /api/generate-summary
 *
 * Accepts audit results, attempts to generate an AI summary via Claude,
 * falls back to a deterministic summary on Claude failure or timeout,
 * and returns 500 if both fail.
 *
 * Requirements: 6.1, 6.3, 6.4, 11.2, 11.5, 11.6
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ApiErrorResponse = {
      message: "Invalid JSON in request body",
      errors: [{ field: "body", message: "Request body must be valid JSON" }],
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Req 11.5: Validate request body against Zod schema
  const parseResult = summaryRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    const errorResponse: ApiErrorResponse = { message: "Validation failed", errors };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  const { recommendations, totalMonthlySavings, totalYearlySavings } = parseResult.data;

  // Build an AuditResult-like object to pass to prompt builders.
  // optimizationScore and engineVersion are not part of the request body,
  // so we use sensible defaults: score is derived from savings vs spend,
  // but since we don't have totalCurrentSpend here we default to 0 (unknown).
  // The prompt and fallback only use recommendations, totalMonthlySavings,
  // totalYearlySavings, and optimizationScore — we set score to 0 as a safe default.
  const auditResultForPrompt: AuditResult = {
    recommendations,
    totalMonthlySavings,
    totalYearlySavings,
    optimizationScore: 0,
    engineVersion: "1.0.0",
  };

  // Req 6.1, 6.4: Try Claude first; fall back to deterministic summary on failure/timeout
  let summary: string;

  try {
    const prompt = buildAuditPrompt(auditResultForPrompt);
    summary = await generateSummary(prompt);
  } catch (claudeError) {
    // Req 6.3: Claude failed — attempt deterministic fallback
    try {
      summary = buildFallbackSummary(auditResultForPrompt);
    } catch (fallbackError) {
      // Req 6.3, 11.2, 11.6: Both Claude and fallback failed — return 500
      console.error(
        "[POST /api/generate-summary] Claude error:",
        claudeError instanceof Error ? claudeError.message : claudeError
      );
      console.error(
        "[POST /api/generate-summary] Fallback error:",
        fallbackError instanceof Error ? fallbackError.message : fallbackError
      );
      const errorResponse: ApiErrorResponse = { message: "Summary generation failed" };
      return NextResponse.json(errorResponse, { status: 500 });
    }
  }

  const responseBody: SummaryResponseBody = { summary };
  return NextResponse.json(responseBody, { status: 200 });
}
