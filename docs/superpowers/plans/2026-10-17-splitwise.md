# Splitwise Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two-person, password-gated expense splitter at khateev.com/splitwise backed by Supabase.

**Architecture:** Static Vite + vanilla TS app in `splitwise/`, built by GitHub Actions and published
next to the existing static site. Supabase Auth (single user) + Postgres with RLS. All DB access goes
through the typed `src/db.ts`; balance math lives in the pure, tested `src/balance.ts`.

**Tech Stack:** Vite 5, TypeScript 5, @supabase/supabase-js 2, vitest, Supabase CLI, GitHub Pages (Actions).

**Spec:** `docs/superpowers/specs/2026-10-17-splitwise-design.md`

## Global Constraints

- Currencies: exactly `TRY` (default), `USD`, `EUR`, `GEL`; amounts stored as integer minor units (2 digits).
- Auth email constant: `splitwise@khateev.com`; signups disabled; RLS `to authenticated` on all tables.
- Vite `base: '/splitwise/'`.
- No secrets in the repo; anon key + URL come from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- Main site files untouched; `docs/` and `print/` not published.

## Review Focus

1. Non-50/50 split with odd amount (e.g. 1001 at 33.33%) — balance is integer, deterministic, sums correctly.
2. Settlement exactly equal to the debt — currency line disappears ("All settled").
3. Amount input with comma (`12,5`), spaces, or junk — parsed or rejected, never NaN stored.
4. Balances in several currencies at once — shown independently, never summed.
5. Anonymous request with the anon key — returns no rows (RLS), UI shows login.

---

### Task 1: Scaffold + money/balance core (TDD)

**Files:** Create `splitwise/{package.json,tsconfig.json,vite.config.ts,.env.example,.gitignore}`,
`splitwise/src/{types.ts,money.ts,balance.ts}`, `splitwise/tests/{money.test.ts,balance.test.ts}`

**Produces:**
- `type Currency = 'USD' | 'GEL' | 'TRY'`, `CURRENCIES: Currency[]`
- `parseAmount(input: string): number | null` — minor units, accepts `.` or `,`, >0, ≤2 decimals
- `formatAmount(minor: number, c: Currency): string`
- `computeBalances(entries: BalanceEntry[], memberIds: [string, string]): Balance[]`
  where `BalanceEntry = { amount, currency, paid_by, payer_share }`,
  `Balance = { currency, debtor, creditor, amount }`; owed = `amount - Math.round(amount * payer_share)`

- [ ] Write tests covering Review Focus 1–4 → run, fail → implement → run, pass → commit.

### Task 2: Supabase schema + project

**Files:** `splitwise/supabase/config.toml` (via `supabase init`), `splitwise/supabase/migrations/<ts>_init.sql`

- [ ] Migration: tables `members`, `entries` per spec, RLS enabled, policies `for all to authenticated using (true) with check (true)`, seed two members.
- [ ] `supabase projects create`, `supabase link`, `supabase db push`.
- [ ] Disable signups (Management API `PATCH /v1/projects/{ref}/config/auth` `disable_signup: true`).
- [ ] Verify: anon REST `GET /rest/v1/entries` returns `[]` (Review Focus 5). Commit.

### Task 3: Typed data layer

**Files:** `splitwise/src/database.types.ts` (generated), `splitwise/src/db.ts`

**Produces:** `signIn(password)`, `signOut()`, `getSession()`, `onAuthChange(cb)`, `listMembers()`,
`listEntries()`, `addEntry(input)`, `updateEntry(id, input)`, `deleteEntry(id)`, `class DbError`;
`Member`, `Entry`, `EntryInput` types derived from `Database`.

- [ ] `supabase gen types typescript --linked > src/database.types.ts`; write `db.ts`; `tsc --noEmit` passes. Commit.

### Task 4: UI

**Files:** `splitwise/index.html`, `splitwise/src/{main.ts,style.css}`, `splitwise/src/ui/{dom.ts,login.ts,home.ts,form.ts,toast.ts}`

- [ ] Login, home (balances + list), expense form, settle form, toast, sign out; reuse site tokens.
- [ ] `npm run build` passes; manual check with `vite dev` against real project. Commit.

### Task 5: Password script + deploy

**Files:** `splitwise/scripts/set-password.mjs`, `.github/workflows/pages.yml`, `README.md`

- [ ] Script: prompts for password (hidden), creates/updates auth user via Admin API using service key passed in env.
- [ ] Workflow: test, build, assemble `_site`, deploy-pages. Repo variables for URL/anon key.
- [ ] Switch Pages source to Actions (`gh api`), push, verify https://khateev.com/ and /splitwise/.
