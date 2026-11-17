// A tiny random number generator that always produces the same numbers
// for the same starting seed (the "mulberry32" algorithm).
// We use it instead of Math.random() so the seed data is reproducible.
export function createRandom(seed: number) {
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // 0 <= n < 1
  }

  return {
    next,
    /** Whole number between min and max, both included. */
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    /** True with the given probability, e.g. 0.3 = 30% of the time. */
    chance: (probability: number) => next() < probability,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    /** Pick using weights, e.g. [["IN", 35], ["US", 25]]. */
    weighted: <T>(items: readonly (readonly [T, number])[]): T => {
      const total = items.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [item, weight] of items) {
        roll -= weight;
        if (roll < 0) return item;
      }
      return items[items.length - 1][0];
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
