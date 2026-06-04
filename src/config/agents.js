// Web search tool (server-side tool executed by the Anthropic API).
export const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 5,
}

export const AGENT_COLORS = {
  update: '#60a5fa', // blue
  audit: '#34d399', // emerald
  social: '#c9982a', // gold
}

const LUX_CONTEXT =
  'These are luxury chauffeur & private-tour brands in Cape Town, South Africa, serving HNWI international clients from the US, UK, and Middle East. Tone is premium, confident, understated.'

function pageLine(site, page) {
  return `Site: ${site.name} (${site.domain})\nPage: ${page.name} — ${site.baseUrl}${page.path}\nPrimary keyword: "${page.primaryKw}"` +
    (page.secondary?.length ? `\nSecondary: ${page.secondary.map((k) => `"${k}"`).join(', ')}` : '')
}

// Format live Google Search Console data into a prompt block (if available).
export function gscSummary(gsc) {
  if (!gsc || gsc.status !== 'done') return ''
  const idx = gsc.index
    ? `Index status: ${gsc.index.coverageState || gsc.index.verdict || 'unknown'}`
    : 'Index status: unknown'
  const kws = (gsc.rows || [])
    .slice(0, 10)
    .map((r) => `  - "${r.query}": position ${r.position ?? '—'}, ${r.clicks || 0} clicks, ${r.impressions || 0} impressions`)
    .join('\n')
  return (
    `LIVE GOOGLE SEARCH CONSOLE DATA (last 28 days) — use this REAL data, not guesses:\n` +
    `${idx}\n` +
    `Keywords this page already ranks for:\n${kws || '  (none in range)'}\n\n` +
    `Priorities to weigh: flag the page if it is NOT indexed; call out "money" keywords stuck on ` +
    `page 2 (positions 11–20) as the biggest quick-win opportunities; note keywords with high ` +
    `impressions but low clicks (title/meta problem).\n\n`
  )
}

export const AGENTS = [
  {
    id: 'update',
    code: '01',
    key: 'update',
    name: 'Site Update Agent',
    color: AGENT_COLORS.update,
    needsInstruction: true, // shows an instruction textarea
    scope: 'page',
    // tools chosen per-run (none — it edits code/content directly)
    tools: [],
    system:
      `You are a senior Next.js (App Router) engineer and SEO copywriter. ${LUX_CONTEXT}\n\n` +
      'You make precise, requested edits to a page. You NEVER change layout, structure, imports, components, or styling unless explicitly asked — you only change the copy/SEO the instruction targets. ' +
      'For a source FILE you return the COMPLETE updated file verbatim with your change applied — no markdown fences, no commentary, no diff markers, just the raw file. ' +
      'For a CMS record you return ONLY a JSON object of the fields to update.',
    // ctx = { site, page, instruction, fileContent }
    buildMessage: (ctx) => {
      const { site, page, instruction, fileContent } = ctx
      if (page.type === 'cms') {
        const cur = page.seo || {}
        return (
          `${pageLine(site, page)}\n\n` +
          `This is a CMS-managed ${page.kind === 'car' ? 'vehicle' : 'tour'} page. Current SEO fields:\n` +
          `- meta_title: ${JSON.stringify(cur.meta_title)}\n` +
          `- meta_description: ${JSON.stringify(cur.meta_description)}\n` +
          `- highlight: ${JSON.stringify(cur.highlight)}\n` +
          `- short_description: ${JSON.stringify(cur.short_description)}\n\n` +
          `INSTRUCTION:\n${instruction}\n\n` +
          `Return ONLY a JSON object containing the fields to change (subset of: meta_title [<=60 chars], ` +
          `meta_description [<=160 chars, end with a WhatsApp CTA], title, short_description [<=300], highlight [<=300], body [HTML]). ` +
          `Do not include unchanged fields. No markdown, no commentary.`
        )
      }
      // static page → full file edit
      const fence = '```'
      return (
        `${pageLine(site, page)}\n\n` +
        `INSTRUCTION:\n${instruction}\n\n` +
        `Here is the current source of ${page.filePath}:\n\n` +
        `${fence}tsx\n${fileContent}\n${fence}\n\n` +
        `Apply the instruction and return the COMPLETE updated file content only — raw, no fences, no explanation.`
      )
    },
  },

  {
    id: 'audit',
    code: '02',
    key: 'audit',
    name: 'Copywriting Audit Agent',
    color: AGENT_COLORS.audit,
    scope: 'page',
    tools: [WEB_SEARCH_TOOL],
    system:
      `You are an elite conversion copywriter and brand-voice auditor. ${LUX_CONTEXT}\n\n` +
      'You audit the actual copy on a live page and give blunt, specific, actionable feedback to make it convert better and read more premium. You quote the real copy you find.',
    // ctx = { site, page, gsc }
    buildMessage: (ctx) => {
      const { site, page, gsc } = ctx
      return (
        `${pageLine(site, page)}\n\n` +
        gscSummary(gsc) +
        `Use web search to read the live page, then audit its COPY (not technical SEO):\n` +
        `1. Headline & hook — is it compelling for HNWI travellers? Quote it.\n` +
        `2. Clarity, tone & brand voice — does it feel premium/understated or generic?\n` +
        `3. Persuasion & trust — proof, specificity, objection handling.\n` +
        `4. Calls to action — clear, confident, well-placed?\n\n` +
        `Then give:\n` +
        `- OVERALL: a one-line verdict + a /10 copy score.\n` +
        `- TOP 3 REWRITES: for each, show the current copy and your improved version.\n` +
        `Be specific and quote real text from the page.`
      )
    },
  },

  {
    id: 'social',
    code: '03',
    key: 'social',
    name: 'Social Growth Agent',
    color: AGENT_COLORS.social,
    scope: 'site', // operates at the brand/site level
    tools: [WEB_SEARCH_TOOL],
    system:
      `You are a social media growth strategist specialising in luxury travel and chauffeur brands. ${LUX_CONTEXT}\n\n` +
      'You give concrete, current, platform-specific growth plays and you name real creators/influencers with their actual handles or URLs. You prioritise driving qualified traffic to the website.',
    // ctx = { site }
    buildMessage: (ctx) => {
      const { site } = ctx
      return (
        `Brand: ${site.name} (${site.domain}) — ${site.baseUrl}\n\n` +
        `Using web search where helpful, deliver a social growth + outreach brief:\n` +
        `1. CHANNEL PLAN: the 2 highest-leverage platforms for this brand and what to post (formats, cadence, angle).\n` +
        `2. CONTENT HOOKS: 5 specific post/reel ideas tailored to luxury Cape Town travel that drive website traffic.\n` +
        `3. TRAFFIC PLAYS: 3 concrete tactics to convert social attention into site visits & enquiries.\n` +
        `4. CREATOR OUTREACH: identify 5 real creators/influencers (Cape Town travel, luxury lifestyle, or relevant niches) to collaborate with — give their actual handle/URL, follower size if known, and a one-line reason + suggested collab.\n\n` +
        `Be specific and current. Name real accounts.`
      )
    },
  },
]

export const AGENT_BY_KEY = AGENTS.reduce((acc, a) => {
  acc[a.key] = a
  return acc
}, {})

// Synthesis pass: turns all per-page copy audits into one prioritised site plan.
export const ACTION_PLAN_AGENT = {
  system:
    `You are a senior SEO & conversion strategist. ${LUX_CONTEXT}\n\n` +
    'You are given a set of per-page copy/SEO audits for one website. Synthesise them into a single, prioritised ACTION PLAN. ' +
    'Output clean GitHub-flavoured Markdown only. Be specific, reference real pages, and rank by impact.',
  buildMessage: (site, digest) =>
    `Website: ${site.name} (${site.domain}) — ${site.baseUrl}\n\n` +
    `Here are the per-page audits:\n\n${digest}\n\n` +
    `Produce a Markdown report with these sections:\n` +
    `1. **Executive summary** — 3-4 sentences on the overall state of the site's copy/SEO.\n` +
    `2. **Priority actions** — a ranked list (highest impact first). For each: the page, the issue, the recommended fix, and an Impact (High/Med/Low) + Effort (High/Med/Low) tag.\n` +
    `3. **Quick wins** — 3-5 changes that take minutes but matter.\n` +
    `4. **Per-page next step** — one line per page with its single most important action.\n` +
    `Keep it tight and actionable.`,
}

