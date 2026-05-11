import { NextResponse } from "next/server";
import { auditRequestSchema } from "../../../lib/schemas/auditSchema";
import { runAudit } from "../../../lib/audit/engine";
import { supabaseServerClient } from "../../../lib/supabase/server";
import { generateUUID } from "../../../lib/utils/uuid";
import type { AuditResult, AuditError } from "../../../types/audit";
import type { AuditResponseBody, ApiErrorResponse } from "../../../types/api";

/**
 * POST /api/audit
 *
 * Validates the request body, runs the deterministic audit engine,
 * persists the result to Supabase, and returns the audit summary.
 *
 * Requirements: 11.1, 11.5, 11.6, 11.7
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
  const parseResult = auditRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    const errorResponse: ApiErrorResponse = { message: "Validation failed", errors };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  const { tools } = parseResult.data;

  // Run the deterministic audit engine
  const engineOutput = runAudit({ tools });

  // Discriminate AuditError from AuditResult
  if ("code" in engineOutput) {
    const auditError = engineOutput as AuditError;
    const is4xx =
      auditError.code === "INVALID_INPUT" || auditError.code === "TOO_MANY_ENTRIES";

    if (!is4xx) {
      // 5xx engine error — log server-side per Req 11.6
      console.error("[POST /api/audit] Engine error:", auditError.code, auditError.message);
    }

    const errorResponse: ApiErrorResponse = { message: auditError.message };
    return NextResponse.json(errorResponse, { status: is4xx ? 400 : 500 });
  }

  const auditResult = engineOutput as AuditResult;

  // Generate a UUID v4 for this audit record
  const auditId = generateUUID();

  // Persist audit record to Supabase
  const { error: supabaseError } = await supabaseServerClient
    .from("audits")
    .insert({
      id: auditId,
      input: { tools },
      result: auditResult,
      ai_summary: null,
    });

  if (supabaseError) {
    // Req 11.1, 11.6: log and return 503 on persistence failure
    console.error("[POST /api/audit] Supabase write failed:", supabaseError.message);
    const errorResponse: ApiErrorResponse = {
      message: "Audit could not be saved. Please try again.",
    };
    return NextResponse.json(errorResponse, { status: 503 });
  }

  // Return the audit summary — AI summary is generated separately
  const responseBody: AuditResponseBody = {
    auditId,
    recommendations: auditResult.recommendations,
    totalMonthlySavings: auditResult.totalMonthlySavings,
    totalYearlySavings: auditResult.totalYearlySavings,
    optimizationScore: auditResult.optimizationScore,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
