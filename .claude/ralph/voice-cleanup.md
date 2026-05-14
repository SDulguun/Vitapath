# Ralph loop — voice cleanup

> A self-pacing autonomous loop that drives `npm run audit:voice` to
> zero violations.

The VitaPath v2 voice rules (HANDOFF.md §7) ban em dashes, exclamations,
emojis, the "AUM AI Agentic" tagline, and the literal `←` character in
user-facing copy. `scripts/audit-voice.mjs` mechanically flags the three
of these that can be detected without an AST. This file is the prompt
that turns the auditor into a Ralph Wiggum loop — Claude reads each
violation, edits the offending file using its judgment about the design
language, and re-runs until the audit exits 0.

## How to invoke

Inside Claude Code at the repo root, run:

```
/loop  → paste the prompt below
```

`/loop` (without an interval) lets the model self-pace — it sleeps
between iterations only when waiting for IO, otherwise tight-loops
until the audit is clean.

## The loop prompt

```
You are running the VitaPath voice-cleanup Ralph loop.

Goal: drive `npm run audit:voice` to exit 0.

Each iteration:
1. Run `npm run audit:voice`.
2. If exit 0, the loop is done. Stop and report what you changed.
3. If violations are reported:
   a. For each "file:line  [rule]" entry, read the file at that line.
   b. Decide whether the flagged character is genuinely user-facing
      copy or a false positive (e.g., a string used as a CSS class,
      a regex pattern, a hashmap key). Voice rules apply only to
      copy that ends up on screen for a user.
   c. For real violations, edit the file using the v2 voice rules:
      - Em dashes (—) in user copy become periods, commas, or colons.
        Pick the one that preserves rhythm — don't bulk-replace.
      - The "AUM AI Agentic" tagline should be deleted; footer is
        "Source on GitHub" only (see HANDOFF.md §7).
      - Literal `←` characters: replace the surrounding element with
        a <BackButton> from @/app/_components.
   d. For false positives, do not edit. The auditor is allowed to
      have a small noise budget.
4. After every batch of edits, re-run `npm run lint` and
   `npm run audit:voice`. Both must be clean before re-iterating.
5. If you've made 5 iterations without progress, stop and ask the
   user — there's a rule the auditor can't handle.

Voice rules cheat-sheet (HANDOFF.md §7):
  • No em dashes in user copy. Comments are fine.
  • No "not X, Y" rhetorical structures. The disclaimer regex
    "general dietary guidance, not medical advice" is the one
    pinned exception (tests/results.spec.ts:97).
  • No exclamation marks anywhere.
  • No emojis in product copy. Use inline SVG icons from
    app/_components/icons.tsx.
  • No "AUM AI Agentic capstone" tagline in rendered app.
  • No literal `←` character. Use <BackButton> with ChevronLeftIcon.
```

## Why this exists

The voice rules are documented but easy to forget when adding new
copy. A pre-commit hook would be too rigid (it'd block legitimate
work mid-flight); CI alone is too late (you've already shipped the
violation to a branch). The Ralph loop sits in between: a one-command
sweep that runs the auditor and a human-judgment editor in tandem,
clearing violations to zero without the developer having to context-
switch into voice-policing.

## Verification

Run `npm run audit:voice` directly to see the current state of
the codebase. It should exit 0 on `main`. If it doesn't, this loop
is the fastest path back to clean.
