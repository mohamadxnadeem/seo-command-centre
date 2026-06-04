# SEO Command Centre

A dark-luxury command centre for running Claude AI agents that **research, audit, and directly update** two Next.js websites — [Cape Town Concierge](https://www.capetown-concierge.co.za) and [Sigma VIP](https://sigmachauffeur.vip) — via the GitHub REST API and a shared Django backend.

Built with **React 18 + Vite + Tailwind CSS**. Deploys to **Vercel**.

---

## 1. What this app does

There are three Claude agents (model `claude-sonnet-4-20250514`):

| # | Agent | Scope | Tools | What it does |
|---|-------|-------|-------|--------------|
| 01 | **Site Update** | page | none | You type an instruction; it edits the page and proposes the change. **Static pages** → edits the `page.tsx` and **opens a GitHub PR** for your review. **CMS pages** (Tours/Vehicles) → drafts `meta_title`/`meta_description`/`body` and, on approval, `PATCH`es the Django CMS. |
| 02 | **Copywriting Audit** | page | `web_search` | Reads the live page copy and returns a blunt critique + the top 3 rewrites (current vs improved). Read-only. |
| 03 | **Social Growth** | site | `web_search` | Channel plan, content hooks, traffic plays, and a list of **real creators/influencers to collaborate with** (handles/URLs). Read-only. |

### Two kinds of pages

- **Static pages** — real `app/.../page.tsx` files in the site repo. SEO lives in the `metadata` export → updated via **GitHub PR** (you approve & merge → Vercel deploys).
- **Dynamic pages (Tours & Vehicles)** — content lives in the **Django CMS** (`Experience` / `Carsforhire` models) and is served by `[slug]` routes. These are loaded live from `/api/experiences/all/` + `/api/cars-for-hire/all/`, and updated via the authenticated CMS SEO endpoints (`X-SEO-Key`).

Both sites **target different primary keywords** so Google never ranks them against each other (see the banner in the UI).

### Backend requirement

The CMS update path needs the companion PR on **`why-cpt-backend`** (branch `seo/cms-seo-update-endpoint`) merged, and `SEO_UPDATE_KEY` set as an env var on the server. It adds `PATCH /api/experiences/<id>/seo/` and `PATCH /api/cars-for-hire/<id>/seo/`.

---

## 2. Environment variables

All values are **also editable in the UI** (top-bar **AI / Django / GitHub** panels) and saved to `localStorage`. The env vars below are optional build-time defaults — copy `.env.example` to `.env` to use them.

| Variable | Purpose | Where to get it |
|----------|---------|-----------------|
| `VITE_DJANGO_API_URL` | Django backend base URL | Already set: `https://web-production-1ab9.up.railway.app` |
| `VITE_SEO_UPDATE_KEY` | Shared secret for the CMS SEO endpoints (`X-SEO-Key`) | Must match `SEO_UPDATE_KEY` set on the Django server |
| `VITE_GITHUB_TOKEN` | GitHub PAT (Contents + Pull requests: read & write) | See below |
| `VITE_CTC_GITHUB_REPO` | CTC repo | `mohamadxnadeem/capetown-concierge` |
| `VITE_SIGMA_GITHUB_REPO` | Sigma repo | `mohamadxnadeem/sigma-chauffeur` |
| `VITE_GITHUB_BRANCH` | Deploy branch | `main` |
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key (runs the agents) | See below |

### GitHub Personal Access Token

1. GitHub → **Settings → Developer settings → Personal access tokens**.
2. **Fine-grained token** (recommended): grant access to `capetown-concierge`, `sigma-chauffeur` (and `why-cpt-backend` if you want PRs opened there too), with **Repository contents → Read and write** *and* **Pull requests → Read and write** (so the Site Update agent can open PRs automatically; without it, the app still pushes a branch and gives you a compare link).
3. Copy the token (`github_pat_…`) into the **GitHub** panel or `VITE_GITHUB_TOKEN`.

### Anthropic API key

1. Go to <https://console.anthropic.com/settings/keys> and create a key (`sk-ant-…`).
2. Paste it into the **AI** panel in the top bar, or set `VITE_ANTHROPIC_API_KEY`.
3. The key is stored in your browser only and sent directly to the Anthropic API (browser-direct access header).

### SEO update key (Django CMS)

The app sends `X-SEO-Key: <key>` to the CMS SEO endpoints. Set the same value as the `SEO_UPDATE_KEY` environment variable on the Django/Railway server, then paste it into the **Django** panel or `VITE_SEO_UPDATE_KEY`.

---

## 3. Run locally

```bash
npm install
npm run dev
```

Open the printed URL (default <http://localhost:5173>). Then:

1. Open the **AI** panel → paste your Anthropic key.
2. Open the **GitHub** panel → paste your PAT → **Test Connection**.
3. Open the **Django** panel → confirm URL/token → **Test Connection**.

---

## 4. Deploy to Vercel

1. Push this repo to GitHub and **Import Project** in Vercel.
2. Vercel auto-detects Vite (`vercel.json` is included: build `npm run build`, output `dist`, SPA rewrites).
3. (Optional) add the env vars from section 2 under **Settings → Environment Variables**. They are only build-time defaults — secrets can instead be entered at runtime in the UI panels.
4. Deploy. The SPA rewrite serves `index.html` for all routes.

> **Note:** Anthropic, GitHub and Django are all called directly from the browser, so no serverless functions are required. Tokens entered in the UI never leave the browser except to those three APIs.

---

## 5. Using each agent

1. Pick a **site** (top-bar tabs) and a **page** (left sidebar, grouped Main / Tours / Vehicles; pages are tagged `FILE` or `CMS`). Tours/Vehicles load live from the Django API.
2. **Site Update (01):** type an instruction → **GENERATE**. The agent proposes the change (full file for `FILE` pages, fields for `CMS` pages). Review it, then **Approve → Open PR** (static) or **Approve → Apply to CMS** (dynamic). Nothing goes live until you approve — and static edits land as a PR you still have to merge.
3. **Copywriting Audit (02):** **RUN** to get a live copy critique + top 3 rewrites.
4. **Social Growth (03):** **RUN** (site-level) for a growth/traffic plan + real creators to collaborate with.
5. The **Pages Matrix** tracks Update/Audit status per page and links the opened PR / shows ✓ CMS once published.

---

## File structure

```
seo-command-centre/
├── package.json · vite.config.js · tailwind.config.js · postcss.config.js
├── index.html · vercel.json · .env.example · README.md
├── public/favicon.svg
└── src/
    ├── main.jsx · App.jsx · index.css
    ├── config/   → sites.js, agents.js
    ├── services/ → anthropic.js, github.js, django.js
    ├── hooks/    → useAgent.js
    └── components/→ TopBar, Sidebar, PageHeader, AgentCard,
                     PageMatrix, BackendPanel, GithubPanel, AiPanel, StatusDot
```
