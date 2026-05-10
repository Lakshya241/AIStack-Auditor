import { roundToTwoDP } from "../utils/currency";
import type { Recommendation } from "../../types/recommendation";

/**
 * Computes monthly savings for a plan downgrade recommendation.
 * Formula: (currentPricePerSeat - recommendedPricePerSeat) * seats
 */
export function computeMonthlySavings(
  currentPricePerSeat: number,
  recommendedPricePerSeat: number,
  seats: number
): number {
  return roundToTwoDP((currentPricePerSeat - recommendedPricePerSeat) * seats);
}

/**
 * Computes yearly savings from monthly savings.
 * Formula: monthlySavings * 12
 */
export function computeYearlySavings(monthlySavings: number): number {
  return roundToTwoDP(monthlySavings * 12);
}

/**
 * Computes the optimization score (0–100).
 * Formula: clamp(round((1 - totalMonthlySavings / totalCurrentSpend) * 100), 0, 100)
 * Returns 100 when totalCurrentSpend is 0.
 */
export function computeScore(
  totalCurrentSpend: number,
  totalMonthlySavings: number
): number {
  if (totalCurrentSpend === 0) return 100;
  const raw = (1 - totalMonthlySavings / totalCurrentSpend) * 100;
  const rounded = Math.round(raw);
  return Math.max(0, Math.min(100, rounded));
}

/**
 * Aggregates total monthly and yearly savings across all recommendations.
 */
export function aggregateSavings(recommendations: Recommendation[]): {
  totalMonthlySavings: number;
  totalYearlySavings: number;
} {
  const totalMonthlySavings = roundToTwoDP(
    recommendations.reduce((sum, r) => sum + r.monthlySavings, 0)
  );
  const totalYearlySavings = roundToTwoDP(
    recommendations.reduce((sum, r) => sum + r.yearlySavings, 0)
  );
  return { totalMonthlySavings, totalYearlySavings };
}
