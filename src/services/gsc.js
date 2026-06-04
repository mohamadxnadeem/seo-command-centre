// Frontend client for the GSC serverless proxy (/api/gsc).
// Works on the Vercel deployment (or `vercel dev`); a plain `vite dev` has no
// serverless functions, so GSC calls will 404 there.

async function call(action, payload) {
  const res = await fetch('/api/gsc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `GSC proxy ${res.status}`)
  return data
}

// Fetch ranking queries + index status for one page.
//   property: e.g. "sc-domain:capetown-concierge.co.za"
//   fullUrl:  e.g. "https://www.capetown-concierge.co.za/airport-transfers-cape-town"
export async function fetchPageGsc(property, fullUrl, days = 28) {
  const [sa, inspect] = await Promise.allSettled([
    call('searchanalytics', { property, page: fullUrl, days }),
    call('inspect', { property, url: fullUrl }),
  ])

  const result = { rows: [], index: null, errors: [] }
  if (sa.status === 'fulfilled') result.rows = sa.value.rows || []
  else result.errors.push(`rankings: ${sa.reason.message}`)
  if (inspect.status === 'fulfilled') result.index = inspect.value
  else result.errors.push(`index: ${inspect.reason.message}`)

  // Best (lowest) position among the ranking queries.
  const ranked = result.rows.filter((r) => r.position != null)
  result.top = ranked.length ? ranked.reduce((a, b) => (b.position < a.position ? b : a)) : null
  return result
}
