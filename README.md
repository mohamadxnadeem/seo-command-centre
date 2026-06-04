# SEO Command Centre

A dark-luxury command centre for running Claude AI agents that **research, audit, and directly update** two Next.js websites — [Cape Town Concierge](https://www.capetown-concierge.co.za) and [Sigma VIP](https://sigmachauffeur.vip) — via the GitHub REST API and a shared Django backend.

Built with **React 18 + Vite + Tailwind CSS**. Deploys to **Vercel**.

---

## 1. What this app does

For every page of both sites you can run three Claude agents (model `claude-sonnet-4-20250514`):

| # | Agent | Tools | What it does |
|---|-------|-------|--------------|
| 01 | **Market Research** | `web_search_20250305` | Finds the top-5 page-1 competitors, 3 content gaps, 3 long-tail keywords and the single #1 priority action for the page's primary keyword. |
| 02 | **SEO Auditor** | `web_search_20250305` | Fetches the live page, checks title/H1/meta/schema/content depth + Google ranking, scores it **/100**, and lists issues by severity with the top 3 fixes. |
| 03 | **Content Updater** | none | Generates optimised SEO content as **strict JSON** (title tag, meta description, H1, H2s, 120-word paragraph, schema). |

After the Updater runs you can:

- **Push to Django →** — POSTs the JSON to `/api/seo/` on the Django backend.
- **Push to GitHub → Live in 60s** — reads the page's `page.tsx`, patches the App-Router `metadata` (title + description), commits to `main`, and Vercel auto-deploys.

Both sites share the same page structure but **target different primary keywords** so Google never ranks them against each other (see the banner in the UI).

Batch operations let you run all 3 agents across every page, and bulk-push all completed pages to GitHub/Django.

---

## 2. Environment variables

All values are **also editable in the UI** (top-bar **AI / Django / GitHub** panels) and saved to `localStorage`. The env vars below are optional build-time defaults — copy `.env.example` to `.env` to use them.

| Variable | Purpose | Where to get it |
|----------|---------|-----------------|
| `VITE_DJANGO_API_URL` | Django backend base URL | Already set: `https://web-production-1ab9.up.railway.app` |
| `VITE_DJANGO_AUTH_TOKEN` | DRF token for the Django API | Django admin → Tokens, or `python manage.py drf_create_token <user>` |
| `VITE_GITHUB_TOKEN` | GitHub PAT (read + write repo contents) | See below |
| `VITE_CTC_GITHUB_REPO` | CTC repo | `mohamadxnadeem/capetown-concierge` |
| `VITE_SIGMA_GITHUB_REPO` | Sigma repo | `mohamadxnadeem/sigma-chauffeur` |
| `VITE_GITHUB_BRANCH` | Deploy branch | `main` |
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key (runs the agents) | See below |

### GitHub Personal Access Token

1. GitHub → **Settings → Developer settings → Personal access tokens**.
2. **Fine-grained token** (recommended): grant access to `capetown-concierge` and `sigma-chauffeur`, with **Repository contents → Read and write**. (A classic token with the `repo` scope also works.)
3. Copy the token (`ghp_…` / `github_pat_…`) into the **GitHub** panel or `VITE_GITHUB_TOKEN`.

### Anthropic API key

1. Go to <https://console.anthropic.com/settings/keys> and create a key (`sk-ant-…`).
2. Paste it into the **AI** panel in the top bar, or set `VITE_ANTHROPIC_API_KEY`.
3. The key is stored in your browser only and sent directly to the Anthropic API (browser-direct access header).

### Django auth token

The app sends `Authorization: Token <token>` to `POST /api/seo/`. Generate one in Django:

```bash
python manage.py drf_create_token <your-username>
```

Paste it into the **Django** panel or `VITE_DJANGO_AUTH_TOKEN`.

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

1. Pick a **site** (top-bar tabs) and a **page** (left sidebar, grouped Main / Tours / Vehicles).
2. On the page's three agent cards press **RUN** (or **Run All Agents** to fire all three at once).
   - **Research** and **Audit** stream a text report into the card.
   - **Audit** also sets the page's **/100 score** (shown in the sidebar, header and matrix).
   - **Updater** produces JSON and unlocks the two push buttons.
3. Press **Push to Django →** to save the JSON, or **Push to GitHub → Live in 60s** to commit the metadata change. The matrix shows the short commit SHA as a clickable link.
4. **Batch:** *Run All N Pages* (sidebar) runs every page sequentially with progress; *Push All → GitHub* / *Push All → Django* bulk-push every completed page.

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
