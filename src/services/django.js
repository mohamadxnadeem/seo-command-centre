export async function pushToDjango(apiUrl, token, payload) {
  const url = `${apiUrl.replace(/\/$/, '')}/api/seo/`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Django ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function testDjangoConnection(apiUrl, token) {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/`, {
    headers: { Authorization: `Token ${token}` }
  })
  return res.ok
}
