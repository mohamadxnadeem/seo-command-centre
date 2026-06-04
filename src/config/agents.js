// Web search tool definition shared by the research + audit agents.
export const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 5
}

// Agent colours used across the UI for status dots and accents.
export const AGENT_COLORS = {
  research: '#c9982a', // gold
  audit: '#34d399', // emerald
  updater: '#60a5fa' // blue
}

// Build the per-page user message for each agent given the active site + page.
function siteContext(site) {
  return `Site: ${site.name} (${site.domain})\nBase URL: ${site.baseUrl}`
}

export const AGENTS = [
  {
    id: 'research',
    code: '01',
    key: 'research',
    name: 'Market Research Agent',
    color: AGENT_COLORS.research,
    tools: [WEB_SEARCH_TOOL],
    system:
      'You are an SEO market research specialist for luxury chauffeur and private tour services in Cape Town, South Africa targeting HNWI international clients from the US, UK, and Middle East. Be specific, name actual URLs, give immediately actionable insights.',
    buildMessage: (site, page) =>
      `${siteContext(site)}\n\n` +
      `Page: ${page.name} — ${site.baseUrl}${page.path}\n` +
      `Primary keyword: "${page.primaryKw}"\n` +
      `Secondary keywords: ${(page.secondary || []).map((k) => `"${k}"`).join(', ')}\n\n` +
      `Using web search, deliver a concise market research brief for this page:\n` +
      `1. Search Google for the primary keyword and identify the top 5 page-1 competitors, naming their actual URLs.\n` +
      `2. Identify 3 content gaps this page should fill versus those competitors.\n` +
      `3. Suggest 3 long-tail keyword opportunities.\n` +
      `4. State the single #1 priority action to rank this page.\n\n` +
      `Format with clear headers. Be specific and actionable.`
  },
  {
    id: 'audit',
    code: '02',
    key: 'audit',
    name: 'SEO Auditor Agent',
    color: AGENT_COLORS.audit,
    tools: [WEB_SEARCH_TOOL],
    system:
      'You are a senior technical SEO auditor for luxury chauffeur and private tour websites in Cape Town, South Africa serving HNWI international clients. You are rigorous, evidence-based, and you cite exactly what you find on the live page. Be specific and actionable.',
    buildMessage: (site, page) =>
      `${siteContext(site)}\n\n` +
      `Page to audit: ${site.baseUrl}${page.path}\n` +
      `Primary keyword: "${page.primaryKw}"\n` +
      `Secondary keywords: ${(page.secondary || []).map((k) => `"${k}"`).join(', ')}\n\n` +
      `Using web search, fetch the live page and audit it:\n` +
      `1. Check the title tag, H1, meta description, schema markup, and content depth.\n` +
      `2. Search Google for the primary keyword and estimate this page's ranking position.\n` +
      `3. Check indexation with a "site:${site.domain}" style search.\n\n` +
      `Then output, in this exact order:\n` +
      `- SCORE: a single number out of 100, computed as title (20) + H1 (20) + meta description (15) + content depth (25) + Google ranking (20). Put it on its own line as "SCORE: NN/100".\n` +
      `- A breakdown of the 5 score components.\n` +
      `- A list of ALL issues, each tagged with severity: Critical / High / Medium.\n` +
      `- TOP 3 FIXES: the three most impactful specific fixes.`
  },
  {
    id: 'updater',
    code: '03',
    key: 'updater',
    name: 'Content Updater Agent',
    color: AGENT_COLORS.updater,
    tools: [],
    system:
      'You are an elite SEO copywriter for luxury chauffeur and private tour services in Cape Town, South Africa targeting HNWI international clients from the US, UK, and Middle East. You write in a premium, confident, understated-luxury tone. You output ONLY valid JSON — no markdown fences, no commentary, no explanation. Just the JSON object.',
    buildMessage: (site, page) =>
      `${siteContext(site)}\n\n` +
      `Generate optimised SEO content for this page.\n` +
      `Site id: "${site.id}"\n` +
      `Page id: "${page.id}"\n` +
      `Page path: "${page.path}"\n` +
      `Primary keyword: "${page.primaryKw}"\n` +
      `Secondary keywords: ${(page.secondary || []).map((k) => `"${k}"`).join(', ')}\n\n` +
      `Return ONLY a JSON object with EXACTLY this structure (no markdown, no prose):\n` +
      `{\n` +
      `  "site": "${site.id}",\n` +
      `  "page_id": "${page.id}",\n` +
      `  "page_path": "${page.path}",\n` +
      `  "seo": {\n` +
      `    "title_tag": "under 60 chars, includes primary keyword",\n` +
      `    "meta_description": "under 155 chars, includes keyword, ends with WhatsApp CTA",\n` +
      `    "h1": "naturally includes primary keyword, premium tone",\n` +
      `    "h2_subheadings": ["targets secondary kw 1", "targets secondary kw 2", "targets secondary kw 3"],\n` +
      `    "seo_paragraph": "120 words, naturally weaves primary + secondary keywords, premium confident tone"\n` +
      `  },\n` +
      `  "schema": {\n` +
      `    "type": "TouristTrip or Service or LocalBusiness depending on page type",\n` +
      `    "json_ld": {}\n` +
      `  }\n` +
      `}`
  }
]

export const AGENT_BY_KEY = AGENTS.reduce((acc, a) => {
  acc[a.key] = a
  return acc
}, {})
