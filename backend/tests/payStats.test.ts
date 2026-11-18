import { describe, expect, it } from "vitest";
import { payStats } from "../src/domain/payStats.js";

describe("payStats", () => {
  it("summarises an odd number of salaries", () => {
    expect(payStats([300, 100, 200, 1000, 400])).toEqual({
      headcount: 5,
      min: 100,
      median: 300, // middle of 100, 200, 300, 400, 1000
      average: 400, // 2000 / 5
      max: 1000,
    });
  });

  it("uses the average of the two middle salaries when the count is even", () => {
    expect(payStats([100, 400, 200, 300]).median).toBe(250); // (200 + 300) / 2
  });

  it("handles a single salary", () => {
    expect(payStats([50_000])).toEqual({ headcount: 1, min: 50_000, median: 50_000, average: 50_000, max: 50_000 });
  });

  it("rounds the median and average to whole units", () => {
    const stats = payStats([100, 101]);

    expect(stats.median).toBe(101); // 100.5 rounds up
    expect(stats.average).toBe(101);
  });

  it("does not change the list it was given", () => {
    const amounts = [3, 1, 2];
    payStats(amounts);

    expect(amounts).toEqual([3, 1, 2]);
  });

  it("refuses an empty list", () => {
    expect(() => payStats([])).toThrow();
  });
});
