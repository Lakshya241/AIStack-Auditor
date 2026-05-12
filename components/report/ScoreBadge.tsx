import React from "react";

export interface ScoreBadgeProps {
  score: number; // 0–100
}

function getScoreVariant(score: number): { label: string; className: string } {
  if (score >= 80) {
    return { label: "Good", className: "bg-green-100 text-green-700" };
  } else if (score >= 50) {
    return { label: "Fair", className: "bg-yellow-100 text-yellow-700" };
  } else {
    return { label: "Poor", className: "bg-red-100 text-red-700" };
  }
}

export function ScoreBadge({ score }: ScoreBadgeProps): React.ReactElement {
  const { label, className } = getScoreVariant(score);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        className,
      ].join(" ")}
      aria-label={`Optimization score: ${score} — ${label}`}
    >
      <span className="text-base font-bold">{score}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}
