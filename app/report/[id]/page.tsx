import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServerClient } from "@/lib/supabase/server";
import type { StoredAudit } from "@/types/audit";
import type { Recommendation } from "@/types/recommendation";
import { formatUSD } from "@/lib/utils/currency";
import { ReportHeader } from "@/components/report/ReportHeader";
import { RecommendationCard } from "@/components/report/RecommendationCard";
import { AiInsightsCard } from "@/components/report/AiInsightsCard";
import { LeadSection } from "@/components/report/LeadSection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportPageProps {
  params: { id: string };
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchAudit(id: string): Promise<StoredAudit | null> {
  try {
    const { data: row, error } = await supabaseServerClient
      .from("audits")
      .select("id, input, result, ai_summary, created_at")
      .eq("id", id)
      .single();

    if (error) {
      // PGRST116 = no rows found — not an unexpected error
      if (error.code !== "PGRST116") {
        console.error("[ReportPage] Supabase query failed:", error.message);
      }
      return null;
    }

    if (!row) return null;

    // Map snake_case Supabase columns → camelCase StoredAudit
    const audit: StoredAudit = {
      id: row.id as string,
      input: row.input as StoredAudit["input"],
      result: row.result as StoredAudit["result"],
      aiSummary: (row.ai_summary as string | null) ?? null,
      createdAt: row.created_at as string,
    };

    return audit;
  } catch (err) {
    console.error("[ReportPage] Unexpected error fetching audit:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Open Graph metadata (Requirements 8.5)
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const audit = await fetchAudit(params.id);

  if (!audit) {
    return {
      title: "Report Not Found — AIStack Auditor",
    };
  }

  const { totalMonthlySavings, optimizationScore } = audit.result;
  const savingsFormatted = formatUSD(totalMonthlySavings);
  // Strip the leading "$" so the OG title reads "Save $X/mo" naturally
  const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/report/${audit.id}`;

  return {
    title: `AIStack Auditor Report — Save ${savingsFormatted}/mo`,
    description: `Optimization score: ${optimizationScore}/100. View your AI spending audit.`,
    openGraph: {
      title: `AIStack Auditor Report — Save ${savingsFormatted}/mo`,
      description: `Optimization score: ${optimizationScore}/100. View your AI spending audit.`,
      url: canonicalUrl,
    },
  };
}

// ---------------------------------------------------------------------------
// Recommendation sorting (Requirements 5.3)
// Descending monthly savings, then ascending tool name A–Z
// ---------------------------------------------------------------------------

function sortRecommendations(recommendations: Recommendation[]): Recommendation[] {
  return [...recommendations].sort((a, b) => {
    if (b.monthlySavings !== a.monthlySavings) {
      return b.monthlySavings - a.monthlySavings;
    }
    return a.toolName.localeCompare(b.toolName);
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ReportPage({
  params,
}: ReportPageProps): Promise<React.ReactElement> {
  const audit = await fetchAudit(params.id);

  // Requirements 8.4: call notFound() for missing ID, query failure, or parse failure
  if (!audit) {
    notFound();
  }

  const { result, aiSummary, id } = audit;
  const { recommendations, totalMonthlySavings, totalYearlySavings, optimizationScore } =
    result;

  const sorted = sortRecommendations(recommendations);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your AI Stack Audit</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your optimization opportunities below.
          </p>
        </div>

        {/* Score + savings summary (Requirements 5.2, 8.3) */}
        <ReportHeader
          score={optimizationScore}
          totalMonthlySavings={totalMonthlySavings}
          totalYearlySavings={totalYearlySavings}
        />

        {/* Recommendation cards (Requirements 5.1, 5.2, 5.3) */}
        <section aria-label="Recommendations">
          {sorted.length === 0 ? (
            // Requirements 5.2: no-recommendations message
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
              <p className="text-base font-medium text-green-800">
                Your stack is already well-optimized — no savings opportunities were identified.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sorted.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          )}
        </section>

        {/* AI Insights (Requirements 6.5, 8.3) */}
        <AiInsightsCard
          summary={aiSummary}
          error={null}
          isLoading={false}
        />

        {/* Lead capture / confirmation (Requirements 7.1, 7.5, 8.2) */}
        <section aria-label="Get your report">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Get your shareable report link
            </h2>
            <LeadSection auditId={id} />
          </div>
        </section>
      </div>
    </main>
  );
}
