// Vercel serverless function: Google Search Console proxy.
//
// Keeps the service-account credentials server-side. The browser app calls
// POST /api/gsc with { action, property, page, url, days }.
//
// Required env var (set in Vercel → Settings → Environment Variables):
//   GSC_SERVICE_ACCOUNT_JSON  — the full JSON of a Google Cloud service-account
//                               key that has the "Search Console API" enabled and
//                               has been added as a Full/Owner user on each GSC property.
//
// Actions:
//   searchanalytics → the queries (keywords) a page ranks for, with avg position
//   inspect         → index status for a URL (URL Inspection API)

import crypto from 'crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

let cachedToken = null // { token, exp }

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, exp: now + 3600, iat: now })
  )
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  signer.end()
  const signature = signer.sign(sa.private_key).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwt = `${header}.${claim}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Token exchange failed: ' + JSON.stringify(data))
  cachedToken = { token: data.access_token, exp: now + (data.expires_in || 3600) }
  return cachedToken.token
}

function isoDaysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON
  if (!raw) {
    res.status(500).json({ error: 'GSC_SERVICE_ACCOUNT_JSON env var is not set on the server.' })
    return
  }

  let sa
  try {
    sa = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    res.status(500).json({ error: 'GSC_SERVICE_ACCOUNT_JSON is not valid JSON.' })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { action, property, page, url, days = 28 } = body
  if (!property) {
    res.status(400).json({ error: 'Missing "property" (e.g. sc-domain:example.com)' })
    return
  }

  try {
    const token = await getAccessToken(sa)
    const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    if (action === 'searchanalytics') {
      const apiUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`
      const query = {
        startDate: isoDaysAgo(days),
        endDate: isoDaysAgo(1),
        dimensions: ['query'],
        rowLimit: 10,
        dataState: 'all',
      }
      if (page) {
        query.dimensionFilterGroups = [{ filters: [{ dimension: 'page', operator: 'equals', expression: page }] }]
      }
      const r = await fetch(apiUrl, { method: 'POST', headers: authHeader, body: JSON.stringify(query) })
      const data = await r.json()
      if (!r.ok) {
        res.status(r.status).json({ error: data.error?.message || 'GSC error', detail: data })
        return
      }
      const rows = (data.rows || []).map((row) => ({
        query: row.keys?.[0],
        position: row.position != null ? Math.round(row.position * 10) / 10 : null,
        clicks: row.clicks,
        impressions: row.impressions,
      }))
      res.status(200).json({ rows })
      return
    }

    if (action === 'inspect') {
      if (!url) {
        res.status(400).json({ error: 'Missing "url" to inspect' })
        return
      }
      const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ inspectionUrl: url, siteUrl: property }),
      })
      const data = await r.json()
      if (!r.ok) {
        res.status(r.status).json({ error: data.error?.message || 'GSC error', detail: data })
        return
      }
      const idx = data.inspectionResult?.indexStatusResult || {}
      res.status(200).json({
        verdict: idx.verdict, // PASS | NEUTRAL | FAIL
        coverageState: idx.coverageState, // e.g. "Submitted and indexed"
        lastCrawl: idx.lastCrawlTime || null,
        robotsTxtState: idx.robotsTxtState,
        indexingState: idx.indexingState,
      })
      return
    }

    res.status(400).json({ error: `Unknown action "${action}"` })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
