# Führerschein Theorie (Klasse B)

Static practice site for the **German** driving theory exam (Class B). Topics, quiz, exam simulation, progress (localStorage). UI: **DE** or **RU** (`?lang=ru` or language toggle).

Question data is prebuilt under `public/data/` (DE + partial RU). Images load from official catalog URLs (Google Cloud Storage).

## Local preview

```bash
cd public
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) — use HTTP(S), not `file://` (JSON is loaded via `fetch`).

## Cloudflare Pages

| Setting | Value |
|--------|--------|
| Build command | *(none — static site)* |
| Build output directory | `public` |
| Root directory | `/` (repo root) |

Connect the GitHub repo; each push deploys `public/` as the site root.

## Repo contents

This repository is **deploy-only**: `public/`, `README.md`, `.gitignore`. Rebuild scripts and source JSON stay local (gitignored).

## Data

German questions are built from the open [yowmamasita/driving-theory](https://github.com/yowmamasita/driving-theory) catalog (Class B). Russian UI text uses the official TÜV/DEKRA question catalog translation where available.
