import { NextResponse } from "next/server";
import { leadSchema } from "../../../lib/schemas/leadSchema";
import { supabaseServerClient } from "../../../lib/supabase/server";
import { resendClient } from "../../../lib/resend/client";
import { buildConfirmationEmail } from "../../../lib/resend/templates";
import type { LeadResponseBody, ApiErrorResponse } from "../../../types/api";

/**
 * POST /api/leads
 *
 * Validates lead fields, writes the lead record to Supabase, triggers a
 * Resend confirmation email (silently logging failures), and returns the
 * shareable report URL.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 7.8, 11.3, 11.5, 11.6
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

  // Req 7.8, 11.5: Validate all lead fields against the Zod schema
  const parseResult = leadSchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    const errorResponse: ApiErrorResponse = { message: "Validation failed", errors };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  const { email, company, role, teamSize, auditId } = parseResult.data;

  // Req 7.2: Write lead record to Supabase
  const { error: supabaseError } = await supabaseServerClient
    .from("leads")
    .insert({
      audit_id: auditId,
      email,
      company,
      role,
      team_size: teamSize,
    });

  if (supabaseError) {
    // Req 7.6, 11.6: Log the error and return 500; do NOT send email
    console.error("[POST /api/leads] Supabase write failed:", supabaseError.message);
    const errorResponse: ApiErrorResponse = {
      message: "Failed to save your information. Please try again.",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }

  // Construct the shareable report URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const reportUrl = `${appUrl}/report/${auditId}`;

  // Req 7.4: Trigger confirmation email via Resend
  // Req 7.7: Log Resend errors silently — do not surface to the user
  try {
    const { subject, html } = buildConfirmationEmail(email, reportUrl);
    const { error: resendError } = await resendClient.emails.send({
      from: "AIStack Auditor <noreply@aistack-auditor.com>",
      to: email,
      subject,
      html,
    });

    if (resendError) {
      console.error("[POST /api/leads] Resend delivery failed:", resendError.message);
    }
  } catch (err) {
    console.error("[POST /api/leads] Resend unexpected error:", err);
  }

  // Req 7.5: Return success with the shareable report URL
  const responseBody: LeadResponseBody = {
    success: true,
    reportUrl,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
