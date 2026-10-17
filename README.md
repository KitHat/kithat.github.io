# Nikita Khateev PE — business site

Static site for Nikita Khateev PE, an individual entrepreneur registered in the Republic of Armenia
that provides blockchain-engineering services to clients as an independent contractor.
The business page is plain HTML and CSS. GitHub Actions (`.github/workflows/pages.yml`) publishes it together with the
`splitwise/` app on every push to `master` of `KitHat/kithat.github.io` (Settings → Pages → Source: GitHub Actions).

## Editing

- `index.html` — all page content (services, experience, engagement terms, lead engineer, contact) and the JSON-LD business schema.
- `style.css` — design tokens (`:root`), light/dark themes, layout.
- `404.html` — not-found page.
- `favicon.svg` — tab icon.
- `.nojekyll` — tells GitHub Pages to serve files as-is, skipping Jekyll.

Open `index.html` in a browser to preview locally, or run `python3 -m http.server` in this folder.

## Custom domain

The site is served at https://khateev.com/ (custom domain set in Settings → Pages; the `CNAME` file in
this repo is managed by GitHub, keep it). DNS is hosted at Spaceship:

- `A @` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `AAAA @` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
- `CNAME www` → `kithat.github.io`
- `TXT _github-pages-challenge-KitHat` → verification code from github.com → Settings → Pages

Enforce HTTPS is switched on in Settings → Pages once GitHub has issued the certificate.

## Splitwise (`/splitwise/`)

A two-person expense splitter (Vite + TypeScript) backed by Supabase project `rgjwdmqgfyoifrgbpdna`
(org "Nikita Khateev", eu-central-1). Design: `docs/superpowers/specs/2026-10-17-splitwise-design.md`.

- One login user `splitwise@khateev.com`; signups are disabled; RLS allows only authenticated access.
- Change the password (run in a normal terminal, it prompts):
  `cd splitwise && node scripts/set-password.mjs`
- Local dev: `cd splitwise && npm i && npm run dev` (needs `.env.local`, see `.env.example`).
- Tests: `npm test`. Schema changes: add a file in `supabase/migrations/`, run `npx supabase db push`,
  then `npm run gen:types`.
- The database password lives in the macOS keychain: `security find-generic-password -a splitwise -s supabase-splitwise-db -w`.
- CI reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from repository Actions variables.
