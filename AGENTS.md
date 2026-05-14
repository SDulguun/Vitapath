<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Voice rules + Ralph loop

User-facing copy is governed by the v2 voice rules in `docs/HANDOFF.md` §7 — no em dashes, no exclamation marks, no emojis, no "AUM AI Agentic" tagline, no literal `←`. Code comments are exempt; only on-screen text is policed.

A mechanical auditor lives at `scripts/audit-voice.mjs` (run with `npm run audit:voice`). It scans every `.tsx` file under `app/` after stripping comments. The Ralph Wiggum loop that turns the auditor into an autonomous cleanup pass lives at `.claude/ralph/voice-cleanup.md` — pass that file's prompt to `/loop` to run it.

Before committing any change that adds user copy, run `npm run audit:voice` and resolve any flagged lines.
