import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
// const word = ...

describe('matchGuess', () => {
  it('returns exactly five colors', () => {
    expect(matchGuess('APPLE', 'ALLEY')).toHaveLength(5);
  });
  it('only uses the colors G, Y, B', () => {
    for (const color of matchGuess('APPLE', 'ALLEY')) {
      expect(['G', 'Y', 'B']).toContain(color);
    }
  });
  it.todo('guessing the secret gives all greens');
  it.todo('never credits a letter more times than the secret contains it');
});
