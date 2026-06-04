// Django backend service.
// The dynamic Tours/Vehicles content lives in the CMS (Experience / Carsforhire).
// List endpoints are public GETs; SEO updates go to the authenticated
// /seo/ endpoints added by the SEO Command Centre backend PR (gated by X-SEO-Key).

function base(apiUrl) {
  return apiUrl.replace(/\/$/, '')
}

// Fetch all items for a collection (experiences or cars). Returns the raw array.
export async function listCollection(apiUrl, listPath) {
  const res = await fetch(`${base(apiUrl)}${listPath}`)
  if (!res.ok) throw new Error(`Django ${res.status} fetching ${listPath}: ${await res.text()}`)
  const data = await res.json()
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

// PATCH SEO fields on a CMS record.
//   kind: 'experience' | 'car'
//   id: numeric CMS id
//   fields: subset of { meta_title, meta_description, title, short_description, highlight, body }
export async function updateCmsSeo(apiUrl, seoKey, kind, id, fields) {
  const path = kind === 'car' ? `/api/cars-for-hire/${id}/seo/` : `/api/experiences/${id}/seo/`
  const res = await fetch(`${base(apiUrl)}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-SEO-Key': seoKey },
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error(`Django ${res.status}: ${await res.text()}`)
  return res.json()
}

// Connection test — hits a known public GET endpoint.
export async function testDjangoConnection(apiUrl) {
  try {
    const res = await fetch(`${base(apiUrl)}/api/experiences/all/`)
    return res.ok
  } catch {
    return false
  }
}
