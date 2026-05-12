import React from "react";
import { Card } from "@/components/ui/Card";
import { ScoreBadge } from "./ScoreBadge";
import { formatUSD } from "@/lib/utils/currency";

export interface ReportHeaderProps {
  score: number;
  totalMonthlySavings: number;
  totalYearlySavings: number;
}

export function ReportHeader({
  score,
  totalMonthlySavings,
  totalYearlySavings,
}: ReportHeaderProps): React.ReactElement {
  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-gray-900">
          Optimization Score
        </h2>
        <ScoreBadge score={score} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Monthly Savings
          </span>
          <span className="text-xl font-bold text-gray-900">
            {formatUSD(totalMonthlySavings)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Yearly Savings
          </span>
          <span className="text-xl font-bold text-gray-900">
            {formatUSD(totalYearlySavings)}
          </span>
        </div>
      </div>
    </Card>
  );
}
