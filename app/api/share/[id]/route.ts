import { NextResponse } from "next/server";
import { supabaseServerClient } from "../../../../lib/supabase/server";
import type { StoredAudit } from "../../../../types/audit";
import type { ShareResponseBody, ApiErrorResponse } from "../../../../types/api";

/**
 * GET /api/share/[id]
 *
 * Retrieves a persisted audit record from Supabase by UUID.
 * Returns the full StoredAudit payload on success, or 404 if not found.
 *
 * Requirements: 11.4, 11.5, 11.6
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  let data: Record<string, unknown> | null = null;

  try {
    const { data: row, error } = await supabaseServerClient
      .from("audits")
      .select("id, input, result, ai_summary, created_at")
      .eq("id", id)
      .single();

    if (error) {
      // PostgREST returns PGRST116 when no rows match — treat as 404
      if (error.code === "PGRST116") {
        const notFound: ApiErrorResponse = { message: "Audit not found" };
        return NextResponse.json(notFound, { status: 404 });
      }

      // Any other Supabase error is a 5xx — log and return 500
      console.error("[GET /api/share/:id] Supabase query failed:", error.message);
      const errorResponse: ApiErrorResponse = { message: "Internal server error" };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    data = row as Record<string, unknown>;
  } catch (err) {
    // Req 11.6: log unexpected server errors
    console.error("[GET /api/share/:id] Unexpected error:", err);
    const errorResponse: ApiErrorResponse = { message: "Internal server error" };
    return NextResponse.json(errorResponse, { status: 500 });
  }

  if (!data) {
    const notFound: ApiErrorResponse = { message: "Audit not found" };
    return NextResponse.json(notFound, { status: 404 });
  }

  // Map Supabase row to StoredAudit (snake_case → camelCase)
  const audit: StoredAudit = {
    id: data.id as string,
    input: data.input as StoredAudit["input"],
    result: data.result as StoredAudit["result"],
    aiSummary: (data.ai_summary as string | null) ?? null,
    createdAt: data.created_at as string,
  };

  const responseBody: ShareResponseBody = { audit };
  return NextResponse.json(responseBody, { status: 200 });
}
