# VitaPath — Project Handoff

> A self-contained snapshot so any teammate (or a fresh Claude Code
> session) can pick up where the previous account left off. Read top to
> bottom once, then jump around. Last updated **2026-05-14**.

---

## TL;DR

- **What:** Personalized vitamin and supplement recommender. Quiz →
  explainable health score → cited recommendations with safety warnings,
  budget tooling, share links.
- **Why:** AUM AI Agentic capstone (Spring 2026, Project 3, 35 % of
  grade). Demo in Week 16.
- **Stack:** Next.js 16 App Router (TypeScript), Tailwind v4, Supabase
  (Postgres + magic-link auth), Vercel.
- **Status:** 22 spec goals shipped. 14 / 14 Playwright e2e and 45 / 45
  vitest passing. Lighthouse mobile: Perf 88, A11y 95, Best Practices
  100, SEO 100 (see `docs/LIGHTHOUSE.md`).
- **GitHub:** [github.com/SDulguun/Vitapath](https://github.com/SDulguun/Vitapath)
- **Production:** [vitamin-chi.vercel.app](https://vitamin-chi.vercel.app)
- **Working directory on disk:** `~/Downloads/vitapath/`

---

## 1. Project identity

| | |
|---|---|
| **Name** | VitaPath |
| **Course** | AUM AI Agentic (Spring 2026) |
| **Project** | Project 3 — full-stack web app capstone, 35 % weight |
| **Demo deadline** | Week 16 of Spring 2026 |
| **Build method** | Spec-driven development (manual, no Ralph loop on the build itself) |
| **Source-of-truth file** | `spec.json` at repo root — 22 numbered goals, all `status: "passed"` |

## 2. Current state

- Branch `main`, all commits pushed to origin (public repo). Latest:
  `253381b goal 22: LLM "Why this for me?" expander on each RecCard`.
- See `git log --oneline` for the full history.

### Spec progress

| # | Goal | Status |
|---|---|---|
| 1 | Scaffold + first Vercel deploy | ✅ |
| 2 | Supabase schema + RLS + share-token RPC | ✅ |
| 3 | Magic-link auth, protected /history | ✅ |
| 4 | Zod schemas for nutrition-domain refs | ✅ |
| 5 | Headless MCP server verification | ✅ |
| 6 | 5-step quiz UI + localStorage draft + DB save | ✅ |
| 7 | Pure recommendation engine | ✅ |
| 8 | Explainable health score | ✅ |
| 9 | Safety / interaction checker | ✅ |
| 10 | Results page wiring engine end-to-end | ✅ |
| 11 | History + score-trend chart + deep-links | ✅ |
| 12 | Cost-optimized brand alternatives | ✅ |
| 13 | Shareable read-only `/r/[token]` | ✅ |
| 14 | Disclaimer + age/pregnancy gating | ✅ |
| 15 | README + architecture + final deploy | ✅ |
| 16 | Visual identity pass: OG image + landing hero + history sprig | ✅ |
| 17 | UX polish: loading skeletons + RecCard hover lift | ✅ |
| 18 | Migration 0002 share_tokens self-delete policy | ✅ |
| 19-21 | Ralph voice-cleanup loop + Lighthouse audit + HANDOFF trim | ✅ |
| 22 | LLM "Why this for me?" expander (Groq, server-grounded + cached) | ✅ |

## 3. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.4 (App Router, TypeScript, **Turbopack**) |
| UI | Tailwind CSS v4 (via `@import "tailwindcss"` + `@theme` tokens) |
| Fonts | `next/font/google` — **Fraunces** (serif) + **Inter** (sans) |
| Auth + DB | Supabase (Postgres + magic-link auth, RLS on every table) |
| Server client | `@supabase/ssr` + `@supabase/supabase-js` |
| Validation | Zod (engine refs, quiz schemas, server-action inputs) |
| Charts | Recharts (history trend chart only) |
| Tests | Vitest (engine + schemas) + Playwright (Chromium e2e) |
| Claude Code | Custom **nutrition-domain Skill** + **supplement-evidence MCP server** + **Ralph voice-cleanup loop** |
| Deploy | Vercel |

### Important Next.js 16 gotchas

1. `middleware.ts` was **renamed to `proxy.ts`** in Next 16.
2. `"use server"` files may **only export async functions**.
3. `cookies()` and `headers()` from `next/headers` are **async** — always `await`.
4. Next.js docs are bundled at `node_modules/next/dist/docs/`. Read those before adopting a pattern from older training data.

## 4. Repo layout (essentials)

Top-level only — the full tree is on GitHub.

```
vitapath/
├─ spec.json                    # 18 outcome-based goals
├─ .mcp.json                    # registers the supplement-evidence MCP server
├─ proxy.ts                     # auth + disclaimer gate (Next 16 middleware)
├─ docs/
│  ├─ HANDOFF.md                # ← this file
│  ├─ LIGHTHOUSE.md             # latest perf/a11y numbers
│  └─ email-template.html       # Supabase magic-link template
├─ .claude/
│  ├─ skills/nutrition-domain/  # Claude consults this when editing lib/engine/
│  ├─ mcp/supplement-evidence/  # stdio MCP server (curated supplements + studies)
│  └─ ralph/voice-cleanup.md    # autonomous voice-rule cleanup loop
├─ supabase/migrations/
│  ├─ 0001_init.sql             # tables + RLS + get_shared_result RPC
│  └─ 0002_share_tokens_delete.sql  # share_tokens_self_delete RLS policy
├─ scripts/
│  ├─ verify-db.mjs             # confirms DB schema + policies (Goal 2/18)
│  └─ audit-voice.mjs           # v2 voice-rule auditor (Ralph loop input)
├─ app/                         # routes + UI; design primitives in app/_components
├─ lib/engine/                  # pure recommendation engine — DO NOT REWRITE
├─ lib/{quiz,results,history,share,supabase}/  # route-scoped data + actions
└─ tests/                       # Playwright e2e specs
```

## 5. Local development

```bash
git clone https://github.com/SDulguun/Vitapath.git
cd Vitapath
npm install
cp .env.example .env.local        # fill in Supabase values
# Apply migrations once via Supabase dashboard → SQL Editor:
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_share_tokens_delete.sql
npm run verify:db                 # confirms DB state
npm run dev                       # → http://localhost:3000
```

### Required env vars (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # production: the Vercel URL
```

## 6. Tests + audits

```bash
npm test                # vitest: 45 cases under <300 ms
npm run test:e2e        # playwright chromium: 14 cases under <60 s
npm run audit:voice     # voice-rule auditor (Ralph loop input)
npm run verify:db       # asserts schema + RLS policy counts
```

E2e specs under `tests/`: `auth` (3), `quiz` (3), `results` (2),
`history` (1), `share` (1), `gating` (4) — 14 total.

MCP server manual check:

```bash
npm --prefix .claude/mcp/supplement-evidence run verify
```

## 7. Design system

Tokens live in `app/globals.css` inside `@theme { … }`. Touch that file
when palette / typography / motion changes — don't sprinkle hex values
elsewhere.

Palette (v2):

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F7F3EB` | Page background |
| `surface` | `#FFFFFF` | Cards |
| `surface-soft` | `#EEE8DC` | Sunken blocks / skeletons |
| `surface-sage` | `#E4EEE6` | Sage-tinted surfaces (hero, score zones) |
| `ink` / `ink-soft` / `ink-muted` | `#14201A` / `#354539` / `#677669` | Primary / secondary / tertiary text |
| `sage` / `sage-deep` / `sage-soft` | `#5A8068` / `#3D5E48` / `#D5E2D8` | Primary CTA + chips |
| `terracotta`, `amber`, `rose` (+ `-soft`) | warning severity (moderate / low / high) |
| `evidence`, `evidence-soft` | `#4E6F89`, `#D8E3ED` | Evidence cool accent |

Motion tokens: `--duration-fast` (160ms), `--duration-med` (280ms),
`--duration-slow` (520ms), plus `vp-fade-up`, `vp-fade-in`,
`vp-score-fill`, `vp-envelope-bob` keyframes. Reduced-motion globally
damped in `app/globals.css`.

### Voice rules (v2 §1.0)

- **No em dashes** in user-visible text. Comments are fine.
- **No "not X, Y"** rhetorical structures. The disclaimer regex
  `general dietary guidance, not medical advice` is the one pinned
  exception (tests/results.spec.ts:97).
- **No exclamation marks**. **No emojis** in product copy (use inline
  SVG icons).
- **No "AUM AI Agentic" tagline**. Footer is `Source on GitHub` only.
- **No literal `←` character.** Use `<BackButton>` with `ChevronLeftIcon`.

Enforced mechanically by `npm run audit:voice` (see §10).

### Component conventions

Shared primitives in `app/_components/` (barrel-exported via
`@/app/_components`). Page-specific components in
`app/<route>/_components/`. Server-first by default — client components
are listed in §9 of the README.

Buttons: `<Button>` for `<button>`; `buttonClasses(variant, size)` on
`<Link>` for link-styled-as-button.

## 8. Spec-driven workflow

The single source of truth for "what to build / what counts as done" is
`spec.json`. For new features:

1. Add a goal with id, outcome-based description, `depends_on`, and a
   `verification` block with a runnable command.
2. Implement only that goal.
3. Run the verification command.
4. If green, flip `status` to `passed` and commit with a `goal N:`
   message.
5. Move to the next goal whose dependencies are all `passed`.

## 9. Claude Code integration

### Skill — `.claude/skills/nutrition-domain/`

Loaded automatically. Encodes nutrition rules: RDAs, contraindications,
interactions, pregnancy gating. The `references/` JSON files are the
single source of truth — Claude reads them when editing `lib/engine/`.

### MCP server — `.claude/mcp/supplement-evidence/`

Local stdio MCP registered in `.mcp.json`. Exposes
`get_supplement(slug)`, `list_studies(slug)`,
`search_evidence(slug, concern)`. Dev-time only (Vercel can't host a
stdio server). Its `data/supplements.json` is also bundled at runtime
for citation display, so adding a supplement is one edit.

Preview tools:

```bash
npm --prefix .claude/mcp/supplement-evidence run inspect
```

### Ralph loop — `.claude/ralph/voice-cleanup.md`

Autonomous voice-rule cleanup. Pass the file's prompt to `/loop` —
Claude reads `npm run audit:voice` output, decides each flagged line is
a real violation or a false positive, edits the real ones, and loops
until exit 0. See §10 below.

### Anthropic auto-memory

`~/.claude/projects/-Users-itsduku-Downloads/memory/` holds three files
the user shares across sessions: profile, project context, spec-driven
workflow preference. A fresh session in this directory loads them via
the `MEMORY.md` index automatically.

## 10. Voice auditor + Ralph loop

`scripts/audit-voice.mjs` scans every `.tsx` under `app/` for v2 voice
violations (em dashes in user copy, the forbidden "AUM AI Agentic"
tagline, literal `←` characters). Comments are stripped before scanning
so docstrings and code comments stay untouched.

```bash
npm run audit:voice
# ✓ voice audit clean across 36 .tsx files
```

When violations appear, the Ralph loop at
`.claude/ralph/voice-cleanup.md` drives them to zero — passes the
prompt to `/loop`, Claude reads each flagged line, decides whether it's
a real violation or a false positive, edits as needed, and re-runs
until clean.

## 11. Auth + share infrastructure

### Magic-link flow

User submits at `/login` → server action calls
`signInWithOtp({ email, options: { emailRedirectTo, shouldCreateUser } })`.
`emailRedirectTo` is derived from request `Origin` →
`NEXT_PUBLIC_SITE_URL` → hardcoded prod fallback (the fix for the v2
§9 "localhost in production emails" bug).

Email link → `/auth/callback?code=...` (PKCE) or
`?token_hash=...&type=magiclink` (admin-minted test links) →
`app/auth/callback/route.ts` exchanges, redirects to `/history`.

`proxy.ts` refreshes the session cookie on every request and gates
`/history`, `/quiz/*`, `/results/*`.

### Disclaimer gate

`proxy.ts` redirects authed users from `/quiz/*` to `/disclaimer?next=...`
unless the `vitapath_disclaimer_v1` cookie is present. Accepting drops
the cookie (1-year expiry, SameSite=Lax).

### Sharing (`/r/[token]`)

- `createShareToken(quizId)` mints a 32-char base64url token; RLS gates
  ownership.
- `getSharedResult(token)` uses an anonymous Supabase client to call the
  `get_shared_result(text)` security-definer RPC. No auth required for
  read.
- `revokeShareToken(token)` issues a user-scoped DELETE — migration
  0002 added the `share_tokens_self_delete` RLS policy that authorizes
  this without the admin client.

## 12. Production deployment

### Supabase

1. SQL Editor → paste `supabase/migrations/0001_init.sql` → Run.
2. SQL Editor → paste `supabase/migrations/0002_share_tokens_delete.sql` → Run.
3. Project Settings → API → copy
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
4. Authentication → URL Configuration → Site URL =
   `https://vitamin-chi.vercel.app`; Redirect URLs include
   `https://vitamin-chi.vercel.app/auth/callback` and
   `http://localhost:3000/auth/callback`.
5. Authentication → Emails → Magic Link template → paste
   `docs/email-template.html`, subject `Sign in to VitaPath`.
6. Run `npm run verify:db`.

### Vercel

1. Import `github.com/SDulguun/Vitapath`.
2. Project Settings → Environment Variables (Production):
   the 3 Supabase vars + `NEXT_PUBLIC_SITE_URL=https://vitamin-chi.vercel.app`.
3. Push to `main` triggers redeploy.

### Smoke test

1. Sign in from prod URL — email link points at Vercel domain.
2. Sign in from `localhost:3000` (dev server) — email link points at
   localhost.
3. Sign in from prod on one device, open email on another — should
   land signed in.

## 13. Test contracts (DO NOT BREAK)

These data-testid + assertion patterns are pinned by the e2e suite.

| Surface | Stable testids |
|---|---|
| `/login` | `login-form`, `login-submit`, `login-error`, `login-sent`, `login-resend` |
| `/disclaimer` | `disclaimer-body`, `disclaimer-accept` |
| `/under-18` | `under-18-page` |
| `/quiz/[step]` | `quiz-form-{1..5}`, `quiz-back`, `quiz-next`, `quiz-error`, `quiz-loading`, `progress-step`, `stepper-name` |
| `/results` + `/r/[token]` | `score-section`, `score-value`, `score-contributions`, `warnings-section`, `warning-{kind}`, `rec-list`, `rec-{slug}`, `brand-name-{slug}`, `brand-price-{slug}`, `toggle-alt-{slug}`, `evidence-{slug}`, `budget-bar`, `share-*` |
| `/history` | `history-greeting`, `history-list`, `history-row-{id}`, `history-score-{id}`, `history-delta-up/down`, `trend-section`, `score-trend-chart`, `signout-button` |

### Pinned literal strings

- `tests/results.spec.ts:97` asserts
  `/general dietary guidance, not medical advice/i`. That substring must
  remain readable inside the results-page disclaimer block.
- `tests/auth.spec.ts:46` asserts the login button label
  `Send sign-in link`.

### Critical e2e flows that must keep working

- Magic-link round-trip via admin-minted `token_hash`.
- Quiz draft persists across refresh + back navigation.
- BudgetBar alternative-toggle changes price text without page reload.
- `/r/[token]` works in a fresh `browser.newContext()` (no cookies).
- Expired share token shows `share-expired` UI.

## 14. Out of scope — do NOT modify

- `lib/engine/*` (rules, score, interactions, alternatives, data, schemas, types) — surface differently, don't rewrite.
- `lib/quiz/schemas.ts` (per-step Zod).
- `supabase/migrations/000{1,2}_*.sql` — add new migrations, don't edit
  existing ones.
- `proxy.ts` gating behavior.
- `.claude/{skills,mcp}/` data — treated as read-only by the app.

If a future ask seems to require changing one of these, pause and
confirm.

## 15. Open TODOs

### Demo prep

- [ ] 60–90s walkthrough video: landing → quiz → results (alt-toggle,
      BudgetBar) → share dialog → history trend → sign out.
- [ ] Slide deck for the Week-16 in-class presentation. Cover
      spec-driven workflow, Skill, MCP, Ralph loop, redesign iteration,
      Lighthouse numbers.

### Code wishlist (none blocking the demo)

- [ ] Optional **LLM "Why this for me?"** feature on each rec
      (deferred; needs `ANTHROPIC_API_KEY` step).
- [ ] Logo PNG + envelope icon PNG at `/public/email/` so the email
      template can swap its text-only brand mark for real visuals.

## 16. Resuming on a new Claude Code session

1. Open `~/Downloads/vitapath/` in Claude Code.
2. Auto-memory at `~/.claude/projects/-Users-itsduku-Downloads/memory/`
   loads automatically (profile + project + workflow preference).
3. The `nutrition-domain` Skill + `supplement-evidence` MCP + Ralph
   voice-cleanup loop activate the moment Claude reads the project.
4. Drop this handoff doc into your first prompt — "we're picking up
   VitaPath; read docs/HANDOFF.md and tell me where I left off."

Voice + workflow rules a fresh Claude needs to know:

- Spec-driven workflow is the standing preference. Each new feature is
  a numbered goal in `spec.json`.
- Em-dash budget: zero in user copy, fine in code comments. Run
  `npm run audit:voice` before commits.
- Test contracts: see §13. Breaking them silently is the #1 cause of
  surprise failures.
- `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e` should
  all be clean before any commit ships.

## 17. References

| | |
|---|---|
| Production app | https://vitamin-chi.vercel.app |
| GitHub repo | https://github.com/SDulguun/Vitapath |
| Lighthouse numbers | `docs/LIGHTHOUSE.md` |
| Spec source-of-truth | `./spec.json` |
| Anthropic auto-memory | `~/.claude/projects/-Users-itsduku-Downloads/memory/` |
| Supabase project | `kqwmkaxldkigfvxxrsum.supabase.co` |
| User email | `s.dulguun1@aum.edu.mn` |
