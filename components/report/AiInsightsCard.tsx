import React from "react";
import { Spinner } from "@/components/ui/Spinner";

export interface AiInsightsCardProps {
  summary: string | null;
  error: string | null;
  isLoading: boolean;
}

export function AiInsightsCard({
  summary,
  error,
  isLoading,
}: AiInsightsCardProps): React.ReactElement {
  if (error !== null) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-indigo-300 bg-indigo-50 p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-indigo-900">AI Insights</h2>

      {isLoading ? (
        <div className="flex items-center gap-2 text-indigo-700">
          <Spinner size="sm" />
          <span className="text-sm">Generating insights…</span>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-indigo-800">{summary}</p>
      )}
    </div>
  );
}
