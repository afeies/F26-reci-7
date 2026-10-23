import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
// Fix: build the end as start + a length, so start <= end by construction.
// A small range makes overlapping, touching, and one-apart intervals common.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.nat({ max: 10 }))
  .map(([start, length]) => [start, start + length]);
const intervalList = fc.array(interval);

// Is point p inside some interval of the list?
function covers(intervals: readonly Interval[], p: number): boolean {
  return intervals.some(([s, e]) => s <= p && p <= e);
}

// Integers and half-integers across the generator's range, so gaps like
// 2 < x < 3 between [1, 2] and [3, 4] get sampled.
const samplePoints = Array.from({ length: 121 }, (_, i) => -25 + i / 2);

// Already-disjoint intervals: each starts at least 1 past the previous end.
// Returns the sorted list and a shuffled copy to use as input.
const disjointInput = fc
  .tuple(
    fc.integer({ min: -20, max: 20 }),
    fc.array(fc.tuple(fc.integer({ min: 1, max: 3 }), fc.nat({ max: 5 }))),
  )
  .map(([first, steps]) => {
    const sorted: Interval[] = [];
    let start = first;
    for (const [gap, length] of steps) {
      sorted.push([start, start + length]);
      start += length + gap;
    }
    return sorted;
  })
  .chain(sorted =>
    fc
      .shuffledSubarray(sorted, { minLength: sorted.length, maxLength: sorted.length })
      .map(input => ({ sorted, input })),
  );

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Add your properties here. Aim for at least one of each pattern:
  // invariant, algebraic, metamorphic, differential, conditional.

  // Pattern: invariant. The output is sorted, consecutive intervals neither overlap nor touch, and the input is not modified.
  it('returns sorted, separated intervals without modifying the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = structuredClone(xs);
        const out = mergeIntervals(xs);
        for (let i = 0; i + 1 < out.length; i++) {
          expect(out[i][1]).toBeLessThan(out[i + 1][0]);
        }
        expect(xs).toEqual(before);
      }),
    );
  });

  // Pattern: differential. A point is covered by the output exactly when it is covered by the input.
  it('covers exactly the same points as the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (const p of samplePoints) {
          expect(covers(out, p)).toBe(covers(xs, p));
        }
      }),
    );
  });

  // Pattern: algebraic. Merging is idempotent: merging an already-merged list changes nothing.
  it('is idempotent', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: metamorphic. Shuffling the input does not change the output.
  it('does not depend on input order', () => {
    const input = intervalList.chain(xs =>
      fc
        .shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length })
        .map(shuffled => ({ xs, shuffled })),
    );
    fc.assert(
      fc.property(input, ({ xs, shuffled }) => {
        expect(mergeIntervals(shuffled)).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: conditional. If the input is already disjoint (gaps between all intervals), the output is the input sorted.
  it('returns already-disjoint input sorted and otherwise unchanged', () => {
    // Targeted generator: disjointInput builds disjoint intervals directly.
    fc.assert(
      fc.property(disjointInput, ({ sorted, input }) => {
        expect(mergeIntervals(input)).toEqual(sorted);
      }),
    );
  });
});
