# Nikita Khateev PE — business site

Static site for Nikita Khateev PE, an individual entrepreneur registered in the Republic of Armenia
that provides blockchain-engineering services to clients as an independent contractor.
Plain HTML and CSS, no build step. Served by GitHub Pages from the `master` branch root of the `KitHat/kithat.github.io` repository (https://kithat.github.io/).

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
