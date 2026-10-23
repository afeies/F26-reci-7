# Reflection

**Name / Andrew ID**: Alex Feies, afeies

**Recitation group members (Task 2):** Takeshi Koey, tkoey

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

The idempotence property (merging the output again changes nothing) only
killed `dropsLast`. It's still valid because the spec says the output is
already the smallest disjoint list, so merging it again must return the same
thing. It would catch a bug that compares each interval only to its
neighbour in the original sorted order. For example, `[1, 4], [2, 3], [3, 6]`
gives `[1, 4], [3, 6]`, which still overlap, so a second merge gives `[1, 6]`
and the property fails.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

`touchingNotMerged` was flaky with endpoints from a wide range (±1,000,000):
random intervals almost never touch, like `[1, 3]` and `[3, 5]`. Shrinking
the range to starts in [-20, 20] and lengths in [0, 10] fixed it.

Before:

```
  ~ touchingNotMerged  flaky: killed in 1/5 runs
```

After:

```
  ✔ touchingNotMerged  killed
```

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

```
  ✔ ignoresCounts  killed
      Counterexample: ["AAAAB","AAAAA"]
      AssertionError: expected 5 to be 4 // Object.is equality
```

The secret `AAAAB` has four A's, so the spec says at most four A's in the
guess `AAAAA` can be colored G or Y. The first four are green, so the last A
must be black. `ignoresCounts` colors it yellow just because A is in the
secret, crediting five A's instead of four.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

`buildPrompt` in `packages/core/src/session/compaction.ts` builds the compaction
prompt and wraps the user's instructions in a `<user-compaction-instructions>`
tag, picking a new tag name if the text already contains it.

- **Invariant:** the chosen tag's opening and closing markers each appear
  exactly once in the prompt, so the instructions can't break out of the tag.
- **Conditional:** if the instructions are empty or only whitespace, the
  prompt is the same as with no instructions.

Generator: strings built from pieces like `<user-compaction-instructions>`,
`</user-compaction-instructions-1>`, whitespace, and plain text, used for the
instructions, previous summary, and context. A naive `fc.string()` would
almost never produce a tag, so the renaming path would go untested.
