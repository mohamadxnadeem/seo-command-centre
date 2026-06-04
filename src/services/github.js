const GH = 'https://api.github.com'

// Read a Next.js file from GitHub
export async function readFile(repo, filePath, branch, token) {
  const res = await fetch(`${GH}/repos/${repo}/contents/${filePath}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
  })
  if (!res.ok) throw new Error(`Cannot read ${filePath} — ${res.status}. Check the filePath in sites config.`)
  const data = await res.json()
  return {
    content: decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))),
    sha: data.sha
  }
}

// Write updated content back and create a commit
export async function writeFile(repo, filePath, newContent, sha, commitMsg, branch, token) {
  const encoded = btoa(unescape(encodeURIComponent(newContent)))
  const res = await fetch(`${GH}/repos/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: commitMsg, content: encoded, sha, branch })
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
  const data = await res.json()
  return { commitUrl: data.commit.html_url, sha: data.commit.sha }
}

// Patch Next.js App Router metadata in a page.tsx file
export function patchMetadata(fileContent, titleTag, metaDescription) {
  let updated = fileContent
  // Replace title in metadata export
  updated = updated.replace(/(title:\s*['"`])([^'"`]*)(['"`])/g, `$1${titleTag}$3`)
  // Replace description in metadata export
  updated = updated.replace(/(description:\s*['"`])([^'"`]*)(['"`])/g, `$1${metaDescription}$3`)
  return updated
}

// List repo contents to detect App Router vs Pages Router
export async function detectStructure(repo, token) {
  try {
    const res = await fetch(`${GH}/repos/${repo}/contents/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const files = await res.json()
    if (!Array.isArray(files)) return 'app'
    return files.some(f => f.name === 'app') ? 'app' : 'pages'
  } catch { return 'app' }
}

// Fetch the most recent commit on a branch (used by the GitHub panel "Test Connection").
export async function getLastCommit(repo, branch, token) {
  const res = await fetch(`${GH}/repos/${repo}/commits/${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
  })
  if (!res.ok) throw new Error(`Cannot read repo ${repo} — ${res.status}`)
  const data = await res.json()
  return {
    sha: data.sha,
    message: data.commit?.message,
    author: data.commit?.author?.name,
    date: data.commit?.author?.date,
    url: data.html_url
  }
}
