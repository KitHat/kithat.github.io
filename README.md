# Nikita Khateev PE — business site

Static site for Nikita Khateev PE, an individual entrepreneur registered in the Republic of Armenia
that provides blockchain-engineering services to clients as an independent contractor.
Plain HTML and CSS, no build step. Served by GitHub Pages from the `main` branch root.

## Editing

- `index.html` — all page content (services, selected work, engagement terms, principal, contact) and the JSON-LD business schema.
- `style.css` — design tokens (`:root`), light/dark themes, layout.
- `404.html` — not-found page.
- `favicon.svg` — tab icon.
- `.nojekyll` — tells GitHub Pages to serve files as-is, skipping Jekyll.

Open `index.html` in a browser to preview locally, or run `python3 -m http.server` in this folder.

## Custom domain

In the repository settings, open **Pages → Custom domain**, enter the domain and save.
GitHub commits a `CNAME` file to this repo; keep it. Then point DNS at GitHub Pages:

- Apex domain (`example.com`): `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- Subdomain (`www.example.com`): `CNAME` record to `kithat.github.io`.

Once DNS resolves, tick **Enforce HTTPS**. After the domain is live, set the `url` field in the
JSON-LD block in `index.html` to the final address.
