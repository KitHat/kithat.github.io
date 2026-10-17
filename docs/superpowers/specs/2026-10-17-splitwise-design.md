# Splitwise at khateev.com/splitwise — design

## Goal

A private two-person expense splitter at `https://khateev.com/splitwise/`, behind one shared
password, with data in Supabase and a typed, pleasant data layer.

Success: both participants open the page on a phone, enter the password once, add expenses
split in any proportion in USD, GEL or TRY, and always see who owes whom in each currency.

## Scope (v1)

- One group, exactly two members (seeded rows).
- Entries of two kinds:
  - **expense** — one member paid `amount`; the payer's own share is `payer_share` (0..1, default 0.5);
    the other member owes `amount - round(amount * payer_share)`.
  - **settlement** — one member paid the other back; stored with `payer_share = 0`
    (the whole amount counts toward the other member).
- Currencies: `USD`, `GEL`, `TRY`. Each entry has its own currency. No conversion:
  balances are computed and shown per currency; settlements are per currency.
- Add, edit and delete entries. List is newest first by `spent_on`, then `created_at`.

Out of scope: more groups or members, FX conversion, categories, receipts, notifications,
offline mode.

## Architecture

```
Browser (static, GitHub Pages)            Supabase
  splitwise/dist  ──supabase-js──▶  Auth (one user, bcrypt hash, signups off)
  src/db.ts (typed API)             Postgres: members, entries (RLS: authenticated only)
```

### Auth

- One Supabase Auth user `splitwise@khateev.com`. The email is a constant in the code; the
  login screen asks only for the password. Supabase stores the bcrypt hash.
- Sign-ups disabled in project auth settings.
- RLS is enabled on every table; policies allow all operations `to authenticated` only.
  The anon key is public by design and grants nothing on its own.
- The session is persisted by supabase-js (localStorage); an expired or missing session shows
  the login screen.
- The password is set by the owner via a local command run with `!`, never pasted into chat or
  committed.

### Database (`splitwise/supabase/migrations/`)

```sql
members (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  position smallint not null unique check (position in (1, 2))
)

entries (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('expense', 'settlement')),
  description text not null default '',
  amount      bigint not null check (amount > 0),      -- minor units (cents / tetri / kuruş)
  currency    text not null check (currency in ('USD', 'GEL', 'TRY')),
  paid_by     uuid not null references members(id),
  payer_share numeric(5,4) not null check (payer_share >= 0 and payer_share <= 1),
  spent_on    date not null default current_date,
  created_at  timestamptz not null default now(),
  check (kind = 'expense' or payer_share = 0)
)
```

Members are seeded by a migration with two names (editable later in the dashboard).
Types are generated with `supabase gen types typescript` into `src/database.types.ts`.

### Data layer (`splitwise/src/db.ts`)

The only module that imports supabase-js. Typed with the generated `Database` type.

- `signIn(password): Promise<void>` / `signOut()` / `getSession()` / `onAuthChange(cb)`
- `listMembers(): Promise<Member[]>`
- `listEntries(): Promise<Entry[]>`
- `addEntry(input: EntryInput): Promise<Entry>`
- `updateEntry(id, input: EntryInput): Promise<Entry>`
- `deleteEntry(id): Promise<void>`

Every function returns data or throws `DbError` with a human-readable message. The UI never
builds queries itself.

### Balance (`splitwise/src/balance.ts`)

Pure function `computeBalances(entries, members): Balance[]`. It returns one item per currency
with a non-zero net: `{ currency, debtor, creditor, amount }`. For each entry the non-payer owes
the payer `amount - round(amount * payer_share)`. Integers only, so there is no float drift.
Unit-tested with vitest.

### Money formatting (`splitwise/src/money.ts`)

All three currencies use 2 minor digits. `parseAmount("12.5") → 1250`,
`formatAmount(1250, 'GEL') → "12.50 ₾"`. Unit-tested.

### UI (`splitwise/src/`, vanilla TypeScript, no framework)

- **Login** — password field and button. A wrong password shows inline text under the field.
- **Home** — per-currency balance lines ("A owes B 40.00 $"), or "All settled". Below it, the
  entry list: date, description, amount, who paid, split. Tapping an entry edits it.
  Buttons: "Add expense", "Settle up", sign out.
- **Entry form** (expense) — amount, currency (remembers the last used one), description,
  payer, payer's share (slider plus number in %, default 50%), date. Save and delete.
- **Settle up form** — currency (prefilled from a non-zero balance), amount (prefilled with the
  debt), who pays whom.
- Styling reuses the design tokens from the main site's `style.css` (light and dark), and the
  layout is built for phones first.
- Errors: a network or RLS failure shows a toast and keeps the form contents. An auth error
  returns to login.

## Repo layout (in `KitHat/kithat.github.io`)

```
splitwise/
  package.json, tsconfig.json, vite.config.ts (base: '/splitwise/')
  index.html
  src/ main.ts, db.ts, database.types.ts, balance.ts, money.ts, ui/*.ts, style.css
  tests/ balance.test.ts, money.test.ts
  supabase/ config.toml, migrations/*.sql
  .env.example  (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
.github/workflows/pages.yml
```

## Deployment

- `.github/workflows/pages.yml` runs on push to `master`. It runs `npm ci && npm test && npm run build`
  in `splitwise/`, assembles `_site/` from the existing root files (`index.html`, `style.css`,
  `404.html`, `favicon.svg`, `robots.txt`, `CNAME`, `.nojekyll`) plus `splitwise/dist` →
  `_site/splitwise/`, then deploys with `actions/deploy-pages`. `docs/` and `print/` are not
  published.
- Supabase URL and anon key are passed as repository Actions variables (public values, but
  kept out of source).
- Settings → Pages source switches from "Deploy from branch" to "GitHub Actions". The custom
  domain stays.
- Migrations are applied manually with `supabase db push`.

## Setup steps that need the owner

1. `! supabase login` (browser auth).
2. Choose the members' names (default: "Никита", "Партнёр").
3. Set the password: `! node splitwise/scripts/set-password.mjs` (prompts locally; uses the service
   role key fetched by the CLI, which is never written to disk in the repo).

## Testing

- vitest unit tests for `balance.ts` and `money.ts` (rounding, settlements, multiple currencies,
  zero balance).
- Manual end-to-end check against the real project: the anon key without a session gets 0 rows or
  an error; after login, add, edit, delete and settle work; the deployed URL works on a phone.
