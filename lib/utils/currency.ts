/**
 * Rounds a number to two decimal places using half-up rounding.
 */
export function roundToTwoDP(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a number as a USD currency string (e.g., "$1,234.56").
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
