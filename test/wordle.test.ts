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

const wordFrom = (letters: string) =>
  fc
    .array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 })
    .map((cs) => cs.join(''));

// Step 1: a generator for five-letter uppercase words.
const word = fc.oneof(wordFrom('ABC'), wordFrom(ALPHABET));

// How many times `letter` appears in `word`.
function countLetter(word: string, letter: string): number {
  return [...word].filter((c) => c === letter).length;
}

// How many copies of `letter` in the guess were credited (colored G or Y).
function countCredited(guess: string, colors: string[], letter: string): number {
  let total = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === letter && colors[i] !== 'B') total++;
  }
  return total;
}

describe('matchGuess', () => {
  it('returns exactly five colors', () => {
    expect(matchGuess('APPLE', 'ALLEY')).toHaveLength(5);
  });
  it('only uses the colors G, Y, B', () => {
    for (const color of matchGuess('APPLE', 'ALLEY')) {
      expect(['G', 'Y', 'B']).toContain(color);
    }
  });
  // Pattern: conditional. If the guess equals the secret, every color is green.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, (secret) => {
        expect(matchGuess(secret, secret)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: invariant. Each guess letter L is credited (G or Y) exactly min(#L in guess, #L in secret) times.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const colors = matchGuess(secret, guess);
        for (const L of new Set(guess)) {
          expect(countCredited(guess, colors, L)).toBe(
            Math.min(countLetter(guess, L), countLetter(secret, L)),
          );
        }
      }),
    );
  });

  // Pattern: conditional. Position i is green exactly when guess[i] === secret[i].
  it('marks exactly the matching positions green', () => {
    // Targeted generator: copy chosen positions of the secret into the guess.
    const input = fc
      .tuple(word, word, fc.array(fc.boolean(), { minLength: 5, maxLength: 5 }))
      .map(([secret, other, copy]) => ({
        secret,
        guess: [...other].map((c, i) => (copy[i] ? secret[i] : c)).join(''),
      }));
    fc.assert(
      fc.property(input, ({ secret, guess }) => {
        const colors = matchGuess(secret, guess);
        for (let i = 0; i < 5; i++) {
          expect(colors[i] === 'G').toBe(guess[i] === secret[i]);
        }
      }),
    );
  });

  // Pattern: conditional. If no guess letter appears in the secret, every color is black.
  it('marks letters missing from the secret black', () => {
    // Targeted generator: build the guess only from letters absent from the secret.
    const input = word.chain((secret) => {
      const absent = [...ALPHABET].filter((c) => !secret.includes(c)).join('');
      return wordFrom(absent).map((guess) => ({ secret, guess }));
    });
    fc.assert(
      fc.property(input, ({ secret, guess }) => {
        expect(matchGuess(secret, guess)).toEqual(['B', 'B', 'B', 'B', 'B']);
      }),
    );
  });

  // Pattern: metamorphic. Renaming letters consistently in both words does not change the result.
  it('is unchanged by consistently renaming letters', () => {
    const perm = fc.shuffledSubarray([...ALPHABET], { minLength: 26 });
    fc.assert(
      fc.property(word, word, perm, (secret, guess, p) => {
        const rename = (s: string) =>
          [...s].map((c) => p[ALPHABET.indexOf(c)]).join('');
        expect(matchGuess(rename(secret), rename(guess))).toEqual(
          matchGuess(secret, guess),
        );
      }),
    );
  });
});
