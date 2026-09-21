# nikita-khateev — personal business site

Static site presenting Nikita Khateev's independent blockchain-engineering practice.
Plain HTML and CSS, no build step. Served by GitHub Pages from the `main` branch root.

## Editing

- `index.html` — all page content (services, selected work, about, contact).
- `style.css` — design tokens (`:root`), light/dark themes, layout.
- `404.html` — not-found page.
- `favicon.svg` — tab icon.
- `.nojekyll` — tells GitHub Pages to serve files as-is, skipping Jekyll.

Open `index.html` in a browser to preview locally, or run `python3 -m http.server` in this folder.

## Custom domain

In the repository settings, open **Pages → Custom domain**, enter the domain and save.
GitHub commits a `CNAME` file to this repo; keep it. Then point DNS at GitHub Pages:

- Apex domain (`example.com`): `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  (and optionally `AAAA` to `2606:4700:...` per GitHub docs).
- Subdomain (`www.example.com`): `CNAME` record to `kithat.github.io`.

Once DNS resolves, tick **Enforce HTTPS**.
