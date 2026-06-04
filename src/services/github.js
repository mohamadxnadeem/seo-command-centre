const GH = 'https://api.github.com'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
}

// Read a file from GitHub. Returns { content, sha }.
export async function readFile(repo, filePath, branch, token) {
  const res = await fetch(`${GH}/repos/${repo}/contents/${encodeFilePath(filePath)}?ref=${branch}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`Cannot read ${filePath} — ${res.status}. Check the filePath in sites config.`)
  const data = await res.json()
  return {
    content: decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))),
    sha: data.sha,
  }
}

// Encode path segments but keep the slashes.
function encodeFilePath(p) {
  return p.split('/').map(encodeURIComponent).join('/')
}

// Patch Next.js App Router metadata (title + description, incl. openGraph/twitter copies).
export function patchMetadata(fileContent, titleTag, metaDescription) {
  let updated = fileContent
  if (titleTag) updated = updated.replace(/(title:\s*['"`])([^'"`]*)(['"`])/g, `$1${titleTag}$3`)
  if (metaDescription) updated = updated.replace(/(description:\s*['"`])([^'"`]*)(['"`])/g, `$1${metaDescription}$3`)
  return updated
}

// Detect App Router vs Pages Router.
export async function detectStructure(repo, token) {
  try {
    const res = await fetch(`${GH}/repos/${repo}/contents/`, { headers: authHeaders(token) })
    const files = await res.json()
    if (!Array.isArray(files)) return 'app'
    return files.some((f) => f.name === 'app') ? 'app' : 'pages'
  } catch {
    return 'app'
  }
}

export async function getLastCommit(repo, branch, token) {
  const res = await fetch(`${GH}/repos/${repo}/commits/${branch}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`Cannot read repo ${repo} — ${res.status}`)
  const data = await res.json()
  return {
    sha: data.sha,
    message: data.commit?.message,
    date: data.commit?.author?.date,
    url: data.html_url,
  }
}

// ---- PR flow: commit an updated file to a new branch and open a PR ----

async function getRefSha(repo, branch, token) {
  const res = await fetch(`${GH}/repos/${repo}/git/refs/heads/${branch}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`Cannot read branch ${branch} — ${res.status}`)
  return (await res.json()).object.sha
}

async function createBranch(repo, newBranch, fromSha, token) {
  const res = await fetch(`${GH}/repos/${repo}/git/refs`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: fromSha }),
  })
  // 422 = already exists; that's fine, we'll commit onto it.
  if (!res.ok && res.status !== 422) throw new Error(`Cannot create branch — ${res.status}: ${await res.text()}`)
}

async function commitFile(repo, filePath, newContent, sha, message, branch, token) {
  const encoded = btoa(unescape(encodeURIComponent(newContent)))
  const res = await fetch(`${GH}/repos/${repo}/contents/${encodeFilePath(filePath)}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: encoded, sha, branch }),
  })
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e.message)
  }
  const data = await res.json()
  return { commitUrl: data.commit.html_url, sha: data.commit.sha }
}

async function openPullRequest(repo, head, base, title, body, token) {
  const res = await fetch(`${GH}/repos/${repo}/pulls`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, head, base, body }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    const err = new Error(e.message || `PR failed — ${res.status}`)
    err.status = res.status
    throw err
  }
  return (await res.json()).html_url
}

// High-level: edit a file on a new branch + open a PR.
// If the token lacks PR permission, falls back to returning a compare URL.
export async function proposeFileChange(repo, filePath, newContent, baseBranch, title, body, token) {
  const baseSha = await getRefSha(repo, baseBranch, token)
  const branch = `seo/${slugify(filePath)}-${Date.now().toString(36)}`
  await createBranch(repo, branch, baseSha, token)

  // get the file's sha on the new branch
  const cur = await fetch(`${GH}/repos/${repo}/contents/${encodeFilePath(filePath)}?ref=${branch}`, {
    headers: authHeaders(token),
  })
  if (!cur.ok) throw new Error(`Cannot read ${filePath} on ${branch} — ${cur.status}`)
  const fileSha = (await cur.json()).sha

  const commit = await commitFile(repo, filePath, newContent, fileSha, title, branch, token)

  const compareUrl = `https://github.com/${repo}/compare/${baseBranch}...${branch}?expand=1`
  try {
    const prUrl = await openPullRequest(repo, branch, baseBranch, title, body, token)
    return { branch, prUrl, commitUrl: commit.commitUrl, sha: commit.sha }
  } catch (e) {
    // Token may lack "Pull requests: write" — return the compare link so the
    // user can open the PR manually. The branch + commit already exist.
    return { branch, prUrl: compareUrl, commitUrl: commit.commitUrl, sha: commit.sha, prError: e.message }
  }
}

function slugify(s) {
  return s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40)
}
