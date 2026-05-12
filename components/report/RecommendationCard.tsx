import React from "react";
import { Card, Badge } from "@/components/ui";
import { formatUSD } from "@/lib/utils/currency";
import type { Recommendation } from "@/types/recommendation";

export interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({
  recommendation,
}: RecommendationCardProps): React.ReactElement {
  const {
    toolName,
    currentPlan,
    recommendedPlan,
    currentPricePerSeat,
    recommendedPricePerSeat,
    monthlySavings,
    yearlySavings,
    explanation,
    isOverlap,
    type,
  } = recommendation;

  const showPriceSideBy =
    (type === "downgrade" || type === "free-tier") &&
    recommendedPricePerSeat !== null;

  return (
    <Card>
      {/* Header row: tool name + overlap badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">{toolName}</h3>
          {isOverlap && <Badge variant="overlap">Overlap</Badge>}
        </div>

        {/* Savings summary */}
        <div className="text-right shrink-0">
          <p className="text-sm text-gray-500">Monthly savings</p>
          <p className="text-lg font-bold text-green-600">
            {formatUSD(monthlySavings)}
          </p>
          <p className="text-xs text-gray-400">
            {formatUSD(yearlySavings)}/yr
          </p>
        </div>
      </div>

      {/* Plan info */}
      <div className="mt-4">
        {showPriceSideBy ? (
          /* Side-by-side price/seat comparison for downgrade & free-tier */
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-md bg-gray-50 p-3 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Current plan
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {currentPlan}
              </p>
              <p className="text-sm text-gray-600">
                {formatUSD(currentPricePerSeat)}
                <span className="text-xs text-gray-400">/seat</span>
              </p>
            </div>

            {/* Arrow */}
            <div className="text-gray-400 text-lg" aria-hidden="true">
              →
            </div>

            <div className="flex-1 rounded-md bg-green-50 p-3 text-center">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                Recommended plan
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {recommendedPlan ?? "Remove"}
              </p>
              <p className="text-sm text-green-700">
                {formatUSD(recommendedPricePerSeat!)}
                <span className="text-xs text-green-500">/seat</span>
              </p>
            </div>
          </div>
        ) : (
          /* Simple plan display for overlap removals */
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs text-gray-500">Current plan: </span>
              <span className="text-sm font-medium text-gray-800">
                {currentPlan}
              </span>
            </div>
            {recommendedPlan && (
              <>
                <span className="text-gray-300" aria-hidden="true">
                  →
                </span>
                <div>
                  <span className="text-xs text-gray-500">
                    Recommended action:{" "}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {recommendedPlan}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Explanation */}
      <p className="mt-4 text-sm text-gray-600 leading-relaxed">{explanation}</p>
    </Card>
  );
}
