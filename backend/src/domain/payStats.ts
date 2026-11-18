export type PayStats = {
  headcount: number;
  min: number;
  median: number;
  average: number;
  max: number;
};

/**
 * Summary of a list of salaries (all in the same currency).
 * Median: the middle value, or the average of the two middle values when the count is even.
 * Median and average are rounded to whole currency units.
 */
export function payStats(amounts: number[]): PayStats {
  if (amounts.length === 0) throw new Error("payStats needs at least one salary");

  const sorted = [...amounts].sort((a, b) => a - b);
  const count = sorted.length;
  const middle = Math.floor(count / 2);
  const median = count % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const total = sorted.reduce((sum, amount) => sum + amount, 0);

  return {
    headcount: count,
    min: sorted[0],
    median: Math.round(median),
    average: Math.round(total / count),
    max: sorted[count - 1],
  };
}
