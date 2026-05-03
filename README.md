# VitaPath

Personalized vitamin and supplement recommender. Take a short quiz, get
recommendations explained against real evidence, see an explainable health
score, get warned about risky interactions, and track your stack over time.

Capstone project for the AUM AI Agentic class (Spring 2026, Project 3).

## Method: spec-driven development

This repo uses a manual spec-driven workflow. The single source of truth for
what to build (and what counts as done) is **[`spec.json`](./spec.json)**.

For each goal in `spec.json`, in order:

1. Implement only that goal.
2. Run the goal's `verification.command`.
3. If it passes, flip the goal's `status` from `pending` to `passed` and commit.
4. Move to the next goal whose dependencies are all `passed`.

The full plan and rationale lives at
`~/.claude/plans/users-itsduku-downloads-project03-web-a-tender-blum.md`.

## Stack

Next.js 16 (App Router, TS) · Tailwind v4 · Supabase (Postgres + magic-link
auth) · Vercel · Vitest + Playwright.

## Claude Code integration

- **Skill**: `nutrition-domain` (`.claude/skills/nutrition-domain/`) — RDAs,
  contraindications, interactions. Used whenever editing `lib/engine/`.
- **MCP server**: `supplement-evidence` (`.claude/mcp/supplement-evidence/`) —
  exposes `get_supplement`, `list_studies`, `search_evidence` over stdio.
  Registered in `.mcp.json`. The server runs at dev/build time only; its
  curated JSON data is bundled for runtime citation lookups in production.

## Local development

```bash
npm install
cp .env.example .env.local      # fill in Supabase keys
npm run dev                     # http://localhost:3000
```

## Manual setup steps (one-time, can't be automated)

1. Create a free Supabase project at https://supabase.com — copy the URL +
   anon key + service role key into `.env.local`.
2. Create a Vercel project pointing at this repo and paste the same env vars
   into the Vercel dashboard.
3. (Optional) Inspect the MCP server with the official inspector:
   ```bash
   npm --prefix .claude/mcp/supplement-evidence install
   npm --prefix .claude/mcp/supplement-evidence run inspect
   ```

## License

MIT (course project).
