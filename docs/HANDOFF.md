# VitaPath — Project Handoff

> A self-contained snapshot of the project so any teammate (or a fresh Claude
> Code session) can pick up where the previous account left off. Read top to
> bottom once, then jump around. Last updated **2026-05-14**.

---

## TL;DR

- **What:** Personalized vitamin and supplement recommender. Quiz →
  explainable health score → cited recommendations with safety warnings
  and budget tooling.
- **Why:** AUM AI Agentic capstone project (Spring 2026, Project 3, 35 % of
  the grade). Demo in Week 16.
- **Stack:** Next.js 16 App Router (TypeScript), Tailwind v4, Supabase
  (Postgres + magic-link auth), Vercel.
- **Status:** All 15 spec goals shipped (v1) + full design refresh (v1
  redesign + v2 voice/contrast/auth-fix iteration). 14 / 14 Playwright e2e
  passing, 45 / 45 vitest passing, lint + build clean.
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
| **Build method** | Spec-driven development (manual, no Ralph loop) |
| **Source-of-truth file** | `spec.json` at repo root — 15 numbered goals, all `status: "passed"` |

## 2. Current state

### Git

- Branch: `main` (no feature branches; flat history was the chosen workflow).
- Remote: `origin` → `https://github.com/SDulguun/Vitapath.git` (public repo).
- All commits pushed to origin. Last commit at the time of this handoff:
  `3f6aed4 feat(back-arrows): BackButton on /history, /disclaimer, /results, /under-18`.

### Recent commits (chronological, newest first)

```
3f6aed4 feat(back-arrows): BackButton on /history, /disclaimer, /results, /under-18
38b6b98 polish(motion-a11y): v2 final copy sweep
18ed59f chore(auth-email-template): docs/email-template.html + production setup README
0e05c2f refactor(quiz-steps): swap inline back for BackButton primitive + mobile stack
875084b refactor(signin): sage Card, envelope icon, success state per v2 §2.3
7a34b8c refactor(landing-disclaimer): v2 voice — new headline, AUM cut, em-dash sweep
17c5120 feat(component-library): v2 BackButton + Spinner + 4 new icons
f0a8546 fix(auth-redirect-config): derive emailRedirectTo from request Origin
a3d8e6f chore(design-tokens): v2 deeper palette + base typography
b0ff767 polish(motion-a11y): hero fade-up + focus-ring audit + mobile sticky actions
8803c91 refactor(history-share): sage trend + delta chips + ShareDialog modal
41b7cff refactor(rec-card-and-evidence): editorial rec card + EvidenceList grid
c938946 feat(budget-bar): cost calculator + bulk cheaper-picks toggle
cf212ea feat(warning-callouts): surface interaction engine on /results
169004a feat(score-gauge): animated semi-circular ScoreGauge
b66e12f refactor(quiz-steps): primitives + Stepper + mutual-exclusion + useSyncExternalStore
e8f89d0 refactor(landing-disclaimer): apply design system to entry pages
80af32e feat(component-library): app/_components primitives
ea59f30 chore(design-tokens): canonical @theme tokens + Fraunces/Inter fonts
cb1c331 goal 15: README + architecture diagram + final docs
… (goals 1-14 preceding)
```

### Spec progress

| # | Goal | Status |
|---|---|---|
| 1 | Scaffold + first Vercel deploy | ✅ passed |
| 2 | Supabase schema + RLS + share-token RPC | ✅ passed |
| 3 | Magic-link auth, protected /history | ✅ passed |
| 4 | Zod schemas for nutrition-domain refs | ✅ passed |
| 5 | Headless MCP server verification | ✅ passed |
| 6 | 5-step quiz UI + localStorage draft + DB save | ✅ passed |
| 7 | Pure recommendation engine | ✅ passed |
| 8 | Explainable health score | ✅ passed |
| 9 | Safety / interaction checker | ✅ passed |
| 10 | Results page wiring engine end-to-end | ✅ passed |
| 11 | History + score-trend chart + deep-links | ✅ passed |
| 12 | Cost-optimized brand alternatives | ✅ passed |
| 13 | Shareable read-only `/r/[token]` | ✅ passed |
| 14 | Disclaimer + age/pregnancy gating | ✅ passed |
| 15 | README + architecture + final deploy | ✅ passed |

## 3. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.4 (App Router, TypeScript, **Turbopack**) |
| UI | Tailwind CSS v4 (via `@import "tailwindcss"` and `@theme` tokens) |
| Fonts | `next/font/google` — **Fraunces** (serif) + **Inter** (sans) |
| Auth + DB | Supabase (Postgres + magic-link auth, RLS on every table) |
| Server client | `@supabase/ssr` + `@supabase/supabase-js` |
| Validation | Zod (engine refs, quiz schemas, server-action inputs) |
| Charts | Recharts (history trend chart only) |
| Tests | Vitest (engine + schemas) + Playwright (Chromium e2e) |
| Claude Code | Custom **nutrition-domain Skill** + **supplement-evidence MCP server** |
| Deploy | Vercel (production) |
| Source control | GitHub (public repo, single `main` branch) |

### Important Next.js 16 gotchas

1. `middleware.ts` was **renamed to `proxy.ts`** in Next 16. The file at the
   repo root is `proxy.ts`. Don't accidentally rename it back.
2. `"use server"` files may **only export async functions**. Don't try to
   export a const from a server action file — it silently kills all exports.
3. `cookies()` and `headers()` from `next/headers` are **async** — always
   `await` them.
4. The Next.js docs are bundled at
   `node_modules/next/dist/docs/`. Read those before adopting a pattern
   from older training data.

## 4. Repo layout

```
vitapath/
├─ spec.json                    # 15 outcome-based goals; flip status manually
├─ .mcp.json                    # registers the supplement-evidence MCP server
├─ proxy.ts                     # Next 16's renamed middleware (auth + disclaimer gate)
├─ vitest.config.ts             # @ alias config
├─ playwright.config.ts         # Chromium, single worker, dev server auto-start
├─ README.md
├─ docs/
│  ├─ HANDOFF.md                # ← this file
│  └─ email-template.html       # Supabase magic-link template (paste into dashboard)
├─ .claude/
│  ├─ skills/
│  │  └─ nutrition-domain/      # Claude consults this when editing lib/engine/
│  │     ├─ SKILL.md
│  │     └─ references/
│  │        ├─ nutrient_rdas.json
│  │        ├─ interactions.json
│  │        └─ contraindications.json
│  └─ mcp/
│     └─ supplement-evidence/   # stdio MCP server (curated supplements + studies)
│        ├─ src/index.ts
│        ├─ data/supplements.json
│        └─ verify.mjs
├─ supabase/
│  └─ migrations/
│     └─ 0001_init.sql          # tables + RLS + get_shared_result RPC
├─ scripts/
│  └─ verify-db.mjs             # confirms DB state (Goal 2 verification)
├─ app/
│  ├─ layout.tsx                # html/body root, font wiring
│  ├─ globals.css               # @theme tokens + base typography + keyframes
│  ├─ page.tsx                  # marketing/landing page (no /(marketing) group)
│  ├─ disclaimer/               # acknowledgement gate (+ server action)
│  ├─ under-18/                 # blocking page for age_band="13-18"
│  ├─ login/                    # magic-link sign-in (+ server action)
│  ├─ auth/
│  │  ├─ callback/route.ts      # handles both PKCE code + token_hash flows
│  │  └─ signout/route.ts       # signOut → redirect home
│  ├─ quiz/
│  │  ├─ [step]/page.tsx        # 5-step quiz, URL-routed
│  │  ├─ actions.ts             # saveQuiz server action
│  │  └─ _components/
│  │     └─ QuizStep.tsx        # client component with all 5 step forms
│  ├─ results/
│  │  ├─ page.tsx               # latest quiz
│  │  ├─ [id]/page.tsx          # specific quiz (RLS-scoped)
│  │  └─ _components/
│  │     ├─ ResultsView.tsx     # presentational
│  │     ├─ ResultsInteractive.tsx  # client state for BudgetBar + RecCards
│  │     ├─ RecCard.tsx
│  │     └─ ShareButton.tsx
│  ├─ history/
│  │  ├─ page.tsx
│  │  └─ _components/
│  │     └─ ScoreTrendChart.tsx
│  ├─ r/[token]/page.tsx        # public shareable read-only result
│  └─ _components/              # SHARED design-system primitives
│     ├─ index.ts               # barrel exports
│     ├─ Container.tsx
│     ├─ Eyebrow.tsx
│     ├─ Headings.tsx           # PageHeading + SectionHeading
│     ├─ Button.tsx             # exports buttonClasses() helper too
│     ├─ BackButton.tsx
│     ├─ Card.tsx               # 6 tones: default/sage/warning/caution/critical/evidence
│     ├─ Field.tsx              # Field + TextInput + Select
│     ├─ ProgressBar.tsx
│     ├─ Stepper.tsx
│     ├─ Disclosure.tsx         # native <details> wrapper
│     ├─ ScoreGauge.tsx         # animated semi-circular SVG arc
│     ├─ WarningCallouts.tsx
│     ├─ EvidenceList.tsx
│     ├─ BudgetBar.tsx          # client
│     ├─ ShareDialog.tsx        # client, native <dialog>
│     ├─ Spinner.tsx
│     ├─ icons.tsx              # 14 inline SVG icons
│     └─ _cx.ts                 # tiny class-name composer
├─ lib/
│  ├─ engine/                   # pure recommendation engine — DO NOT REWRITE
│  │  ├─ rules.ts               # 10 rules, recommend() dedupes + sorts
│  │  ├─ score.ts               # 16 score rules, computeScore() with contributions
│  │  ├─ interactions.ts        # checkInteractions() — 3 warning categories
│  │  ├─ alternatives.ts        # chooseAlternative() + getPrimaryBrand()
│  │  ├─ data.ts                # imports + Zod-validates the JSON files
│  │  ├─ schemas.ts             # all Zod schemas for engine + supplements
│  │  ├─ types.ts               # Recommendation, Rule
│  │  ├─ rules.test.ts
│  │  ├─ score.test.ts
│  │  ├─ interactions.test.ts
│  │  ├─ alternatives.test.ts
│  │  └─ schemas.test.ts
│  ├─ quiz/
│  │  ├─ schemas.ts             # per-step Zod schemas
│  │  └─ store.ts               # useSyncExternalStore for localStorage draft
│  ├─ results/data.ts
│  ├─ history/data.ts
│  ├─ share/
│  │  ├─ actions.ts             # createShareToken + revokeShareToken
│  │  └─ data.ts                # getSharedResult (anonymous read via RPC)
│  └─ supabase/
│     ├─ server.ts              # Server Component / Action client
│     ├─ client.ts              # Browser client
│     └─ admin.ts               # service-role; server-only
└─ tests/
   ├─ helpers/test-env.ts       # signInAs, adminClient, uniqueEmail
   ├─ auth.spec.ts
   ├─ quiz.spec.ts
   ├─ results.spec.ts
   ├─ history.spec.ts
   ├─ share.spec.ts
   └─ gating.spec.ts
```

## 5. Local development

```bash
# 1. Clone + install
git clone https://github.com/SDulguun/Vitapath.git
cd Vitapath
npm install

# 2. Pull env vars
cp .env.example .env.local
# Fill in your Supabase project values (see §11.1 for what each one does).

# 3. Apply the migration (one-time, manual via Supabase dashboard)
#    Supabase Dashboard → SQL Editor → paste supabase/migrations/0001_init.sql → Run

# 4. Verify the DB state
npm run verify:db

# 5. Run
npm run dev
# → http://localhost:3000
```

### Required env vars (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # used by tests + verify scripts
NEXT_PUBLIC_SITE_URL=http://localhost:3000      # production: your Vercel URL
```

## 6. Tests

### Vitest (engine + schemas)

```bash
npm test                       # one-shot
npm run test:watch             # watch mode
npm test -- engine/rules       # filter by name
```

Suites: `lib/engine/{schemas,rules,score,interactions,alternatives}.test.ts`.
Total: **45 cases**, runs in <300 ms.

### Playwright e2e

```bash
npm run test:e2e               # full suite (auto-starts dev server)
npm run test:e2e -- auth       # filter to a spec
```

Suites under `tests/`:

| Spec | Cases | What it covers |
|---|---|---|
| `auth.spec.ts` | 3 | Anon-to-login redirect, login form renders, full admin-minted magic-link round-trip with sign-out re-protection |
| `quiz.spec.ts` | 3 | Anon-to-login redirect, refresh + back-nav preserves draft, full 5-step walk + DB row assertion |
| `results.spec.ts` | 2 | Anon redirect, full quiz → score + cited recs + alt-toggle round-trip + DB sanity |
| `history.spec.ts` | 1 | After 2 quizzes → 2 rows + chart + deep-link to frozen result |
| `share.spec.ts` | 1 | Mint share link + visit in fresh BrowserContext + admin-inserted expired token shows expired state |
| `gating.spec.ts` | 4 | Disclaimer gate, accept flow drops cookie, age 13-18 routes to /under-18, pregnancy=yes → engine receives flag + folate row |

Total: **14 cases**, runs in <60 s.

### MCP server verification

```bash
npm --prefix .claude/mcp/supplement-evidence run verify
```

Headless check via `@modelcontextprotocol/sdk` — confirms the 3 tools are
advertised and the seeded data is reachable.

## 7. Design system

### Tokens

All design tokens live in `app/globals.css` inside `@theme { … }`. They
become Tailwind utilities automatically (v4 behavior). Touch this file
when palette / typography / motion needs changing — don't sprinkle
hex values elsewhere.

Palette (v2):

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F7F3EB` | Page background |
| `surface` | `#FFFFFF` | Cards |
| `surface-soft` | `#EEE8DC` | Sunken blocks |
| `surface-sage` | `#E4EEE6` | Sage-tinted surfaces (hero, score zones) |
| `ink` | `#14201A` | Primary text + headings |
| `ink-soft` | `#354539` | Secondary text |
| `ink-muted` | `#677669` | Tertiary, captions, eyebrows |
| `sage` | `#5A8068` | Primary CTA, accents |
| `sage-deep` | `#3D5E48` | Hover/pressed |
| `sage-soft` | `#D5E2D8` | Chips, subtle highlights |
| `terracotta` / `-soft` | `#B8654B` / `#F2DAD0` | Warning severity (moderate) |
| `amber` / `-soft` | `#B8854A` / `#F3E3CA` | Caution severity (low) |
| `rose` / `-soft` | `#963F3F` / `#EFD2D2` | Critical severity (high) |
| `evidence` / `-soft` | `#4E6F89` / `#D8E3ED` | Evidence cool accent |

### Voice rules (v2 §1.0)

Read this before changing any user-facing copy:

- **No em dashes** in user-visible text. Use periods, commas, or colons.
  Code comments may keep them.
- **No "not X, Y" rhetorical structures.** Write what the product *is*,
  not what it isn't. The phrase "general dietary guidance, not medical
  advice" is the **one** exempted occurrence — it's a fixed legal
  disclaimer pinned by `tests/results.spec.ts:97`.
- **No exclamation marks** anywhere.
- **No emojis** in product copy. Use inline SVG icons (see `icons.tsx`).
- **No "AUM AI Agentic capstone" tagline** in the rendered app. Footer
  is `Source on GitHub` only.
- **No literal `←` character.** Use `<BackButton>` with `ChevronLeftIcon`.

### Component conventions

- Shared primitives live in `app/_components/` and are imported via the
  barrel (`@/app/_components`).
- Page-specific components live in `app/<route>/_components/`
  (e.g. `app/quiz/_components/QuizStep.tsx`).
- **Server-first.** Every component is a Server Component unless it needs
  state, refs, or events. Current client components: `QuizStep`,
  `ResultsInteractive`, `RecCard`, `BudgetBar`, `ShareButton`,
  `ShareDialog`, `Spinner` (icon-shaped but uses `animate-spin`),
  `ScoreTrendChart`, `LoginPage`.
- Buttons: use `<Button>` for `<button>` elements; use the
  `buttonClasses(variant, size)` helper on `<Link>` when you need
  link-styled-as-button.

## 8. Spec-driven workflow

The single source of truth for "what to build, what counts as done" is
`spec.json` at the repo root. For new features:

1. Add a goal to `spec.json` with id, goal description (outcome-based),
   `depends_on: [...]`, and a `verification` block with a runnable
   command.
2. Implement only that goal.
3. Run the goal's verification command.
4. If green, flip the goal's `status` from `pending` → `passed` and
   commit with a `goal N:` message.
5. Move to the next goal whose dependencies are all `passed`.

The reference for this workflow lives at
`~/Downloads/spec driven development/` (outside this repo).

## 9. Claude Code integration

### Skill — `.claude/skills/nutrition-domain/`

Loaded automatically when working in this directory. Encodes the
nutrition rules: RDAs, contraindications, interactions, pregnancy gating.
The reference JSON files in `references/` are the single source of
truth — Claude reads them when editing `lib/engine/` so the code and
nutrition knowledge stay in sync.

**Invoke proactively** whenever editing files under `lib/engine/`.

### MCP server — `.claude/mcp/supplement-evidence/`

Local stdio MCP server registered in `.mcp.json`. Exposes:

- `get_supplement(slug)` — metadata only (name, dose, forms)
- `list_studies(slug)` — all cited studies for a supplement
- `search_evidence(slug, concern)` — filter studies by concern tag

It's a **dev-time tool** — Vercel can't host a stdio server. Its
`data/supplements.json` is the same file Next bundles for runtime
citation display, so adding a supplement is one edit.

To preview the tools manually:

```bash
npm --prefix .claude/mcp/supplement-evidence run inspect
```

### Anthropic auto-memory

The user has 3 memory files at `~/.claude/projects/-Users-itsduku-Downloads/memory/`:

- `user_profile.md` — AUM student, Mac with Apple Silicon, Anaconda Python 3.13.
- `project_vitapath_capstone.md` — this project's context for future sessions.
- `feedback_spec_driven_workflow.md` — user preference: use the spec-driven workflow for VitaPath and any future web app.

A fresh Claude session in this directory will pick these up automatically
via the `MEMORY.md` index file.

## 10. Auth + share infrastructure

### Magic-link flow

- User submits email at `/login` → server action calls
  `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo, shouldCreateUser: true } })`.
- `emailRedirectTo` is derived from `headers().get("origin")` →
  `NEXT_PUBLIC_SITE_URL` → hardcoded prod fallback. This is the **fix for
  the v2 §9 "localhost in production emails" bug** — see
  `app/login/actions.ts` and commit `f0a8546`.
- Email link points to `https://<domain>/auth/callback?code=<pkce>` (or
  `?token_hash=<>&type=magiclink` for admin-minted test links).
- `app/auth/callback/route.ts` exchanges the code/hash for a session and
  redirects to `/history`.
- `proxy.ts` (Next 16's middleware) refreshes the session cookie on every
  request and gates `/history`, `/quiz/*`, `/results/*`.

### Disclaimer gate

`proxy.ts` redirects authed users from `/quiz/*` to `/disclaimer?next=...`
if the `vitapath_disclaimer_v1` cookie isn't present. Accepting the
disclaimer sets the cookie (1-year expiry, SameSite=Lax).

### Sharing (`/r/[token]`)

- `lib/share/actions.ts::createShareToken(quizId)` generates a 32-char
  base64url token and inserts into `share_tokens` (RLS gates ownership).
- `lib/share/data.ts::getSharedResult(token)` uses an **anonymous**
  Supabase client to call the `get_shared_result(text)` security-definer
  RPC defined in `0001_init.sql`. No auth required for read.
- `lib/share/actions.ts::revokeShareToken(token)` — RLS-scoped SELECT
  confirms ownership, then DELETE runs via the admin client because
  `0001_init.sql` doesn't include a DELETE policy on `share_tokens` (out
  of scope per redesign brief §6 — would need migration 0002 to add one
  properly).

## 11. Production deployment

### 11.1 Supabase project setup

1. Create a free project at supabase.com.
2. SQL Editor → paste `supabase/migrations/0001_init.sql` → Run.
3. Copy 3 env vars from Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Run `npm run verify:db` to confirm tables + RLS + RPC are in place.

### 11.2 Supabase auth config (manual dashboard)

This is the **important half** of the auth redirect fix. Without these,
production emails will have `localhost:3000` links:

1. Authentication → **URL Configuration**:
   - **Site URL**: `https://vitamin-chi.vercel.app` (no trailing slash)
   - **Redirect URLs**: add all of
     - `https://vitamin-chi.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
     - `https://*.vercel.app/auth/callback` (if your plan allows
       wildcards)
2. Authentication → **Email Templates → Magic Link**:
   - **Subject**: `Sign in to VitaPath`
   - **Body**: paste the contents of `docs/email-template.html`. Save.
   - Repeat for *Confirm signup* if you use it.

### 11.3 Vercel

1. Import `github.com/SDulguun/Vitapath` into Vercel.
2. Project Settings → **Environment Variables → Production**:
   - All 4 from `.env.local`, with
     `NEXT_PUBLIC_SITE_URL=https://vitamin-chi.vercel.app`.
3. The repo is on `main`, so pushing to `main` triggers a redeploy.

### 11.4 Manual smoke test after dashboard changes

1. Sign in from `https://vitamin-chi.vercel.app/login`. Email link should
   point at the Vercel domain. Click on a phone — should land signed in.
2. Sign in from `localhost:3000` (`npm run dev`). Email link should point
   at `localhost:3000`. Click — should land signed in.
3. Sign in from prod on one device, open the email on a different
   device that's not running the dev server — should open prod cleanly.

## 12. Test contracts (DO NOT BREAK)

These data-testid + assertion patterns are pinned by the e2e suite.
Touching any rendering that owns them needs a careful test review.

### Stable testids

| Page / component | Testids |
|---|---|
| `/login` | `login-form`, `login-submit`, `login-error`, `login-sent`, `login-resend` |
| `/disclaimer` | `disclaimer-body`, `disclaimer-accept` |
| `/under-18` | `under-18-page` |
| `/quiz/[step]` | `quiz-form-{1..5}`, `quiz-back`, `quiz-next`, `quiz-error`, `quiz-loading`, `progress-step`, `stepper-name` |
| `/results` (and `/r/[token]` shared) | `score-section`, `score-value`, `score-contributions`, `warnings-section`, `warning-{kind}`, `warning-removed-chip-{slug}`, `warnings-low-disclosure`, `rec-list`, `rec-{slug}`, `brand-name-{slug}`, `brand-price-{slug}`, `toggle-alt-{slug}`, `evidence-{slug}`, `budget-bar`, `budget-total`, `budget-slider`, `budget-value`, `budget-over`, `cheaper-picks-toggle`, `share-button`, `share-link-box`, `share-url`, `share-copy`, `share-revoke`, `share-revoked`, `share-dialog`, `share-expired` (on `/r/[bad-token]`) |
| `/history` | `history-greeting`, `history-list`, `history-row-{id}`, `history-score-{id}`, `history-delta-up` / `history-delta-down`, `trend-section`, `score-trend-chart`, `signout-button` |

### Pinned literal substrings

- `tests/results.spec.ts:97` asserts the disclaimer regex
  `/general dietary guidance, not medical advice/i` — that exact substring
  must remain readable inside the results-page disclaimer block.
- `tests/auth.spec.ts:46` asserts the login button label
  `Send sign-in link`. Renaming requires a test update.

### Critical e2e flows that must keep working

- Magic-link round-trip via admin-minted `token_hash` (see
  `tests/helpers/test-env.ts::signInAs`).
- Quiz draft persists across refresh + back navigation.
- BudgetBar alternative-toggle changes price text **without page reload**
  (`results.spec.ts` asserts `page.url()` is unchanged).
- `/r/[token]` works in a fresh `browser.newContext()` (no cookies).
- Expired share token shows `share-expired` UI.

## 13. Out of scope — do NOT modify

Per the v1 redesign brief §6 (which carried into v2):

- All of `lib/engine/*` (rules, score, interactions, alternatives, data,
  schemas, types) — surface differently, don't rewrite.
- `lib/quiz/schemas.ts` (per-step Zod).
- `supabase/migrations/*` and the `get_shared_result` RPC.
- `proxy.ts` gating behavior.
- `.claude/` skill + MCP server (their data is treated as read-only by
  the app).
- The auth callback handler at `app/auth/callback/route.ts` — only
  touched once for v2 §9.

If a future ask seems to require changing one of these, pause and
confirm with the user first.

## 14. Open TODOs (left for the user)

### Dashboard configuration

- [ ] **Supabase Site URL** in Authentication → URL Configuration is
      currently `http://localhost:3000`. Change to
      `https://vitamin-chi.vercel.app`.
- [ ] **Supabase Redirect URLs** — add the production callback URL +
      `http://localhost:3000/auth/callback` to the allowlist.
- [ ] **Supabase Email Template → Magic Link** — paste
      `docs/email-template.html` (subject: `Sign in to VitaPath`).
- [ ] **Vercel Production env var** — ensure
      `NEXT_PUBLIC_SITE_URL=https://vitamin-chi.vercel.app` is set.
- [ ] After all four, run the manual 3-smoke-test sequence in §11.4.

### Code wishlist (none blocking the demo)

- [ ] Add a proper `share_tokens_self_delete` RLS policy in a new
      `supabase/migrations/0002_share_tokens_delete.sql` so
      `revokeShareToken` doesn't need the admin client. Currently does
      an RLS-scoped SELECT then admin DELETE.
- [ ] Hand-rolled logo PNG + envelope icon PNG at `/public/email/` so the
      email template can swap its text-only brand mark for real visuals.
      The HTML template comment notes how.
- [ ] Lighthouse audit on `/results` mobile. Targets: Performance ≥ 90,
      Accessibility ≥ 95. All practices are in place (next/font with
      `display: swap`, no client JS on landing, sage tokens pass AA, no
      animations during reduced-motion); just needs a manual run.

### Demo prep

- [ ] Re-record a 60–90s walkthrough video showing landing → quiz →
      results (with alt-toggle, BudgetBar) → share dialog → history
      trend → sign out.
- [ ] Slide deck for the Week-16 in-class presentation. Cover spec-driven
      workflow + Skill + MCP + redesign iteration.

## 15. Resuming on a new Claude Code session

If you start a fresh Claude session (different account, new machine,
etc.), the smoothest way to get back to productive work:

1. Open this directory (`~/Downloads/vitapath`) in Claude Code.
2. Auto-memory from `~/.claude/projects/-Users-itsduku-Downloads/memory/`
   will load automatically (project context + spec-driven workflow
   preference). If you're on a **different** account or machine, copy
   those three files over manually.
3. The `nutrition-domain` Skill in `.claude/skills/` and the MCP server
   in `.claude/mcp/supplement-evidence/` activate the moment Claude
   reads the project — no setup needed.
4. Drop this handoff doc into your first prompt and say "we're picking
   up VitaPath; read docs/HANDOFF.md and tell me where I left off."
5. The plan file from the original session lives at
   `~/.claude/plans/users-itsduku-downloads-project03-web-a-tender-blum.md`
   (only on the original machine — it's not in the repo). If you don't
   have it, this doc + `spec.json` cover the same ground.

### Voice + workflow rules a fresh Claude needs to know

- **Em-dash budget**: zero in user copy, fine in code comments.
- **Banned "not X, Y" pattern** in headlines.
- **Spec-driven workflow** (manual goal-by-goal verification, no Ralph
  loop) is the user's standing preference.
- **Test contracts**: see §12. Breaking them silently is the #1 cause of
  surprise failures.
- **`npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`**
  should all be clean before any commit ships.

## 16. References

| | |
|---|---|
| Production app | https://vitamin-chi.vercel.app |
| GitHub repo | https://github.com/SDulguun/Vitapath |
| Spec workflow reference | `~/Downloads/spec driven development/` (outside repo) |
| Spec source-of-truth | `./spec.json` |
| Initial plan file | `~/.claude/plans/users-itsduku-downloads-project03-web-a-tender-blum.md` |
| Anthropic auto-memory | `~/.claude/projects/-Users-itsduku-Downloads/memory/` |
| Supabase project | `kqwmkaxldkigfvxxrsum.supabase.co` |
| User email | `s.dulguun1@aum.edu.mn` |
