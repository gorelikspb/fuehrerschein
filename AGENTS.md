# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Static web application for practicing the German driving theory exam (Klasse B). No build step, no package manager, no backend. All state is browser localStorage.

### Running the dev server

```bash
cd /workspace/public && python3 -m http.server 8080
```

Open http://localhost:8080. Must use HTTP (not `file://`) because JS loads JSON via `fetch`.

### Key paths

- `public/` — all static assets (HTML, CSS, JS, JSON data)
- `public/data/` — question catalog JSON files (DE + RU)
- `functions/` — Cloudflare Pages edge functions (OG meta for Russian crawlers)

### Linting / Testing

No automated test suite or linter is configured in the repository. Code quality checks are manual (browser testing). If adding tooling, note that `package.json` is gitignored by design.

### Cloudflare Pages Functions

To test the edge middleware locally, install Wrangler and run:

```bash
npx wrangler pages dev public
```

This is optional; the core application works without it.
