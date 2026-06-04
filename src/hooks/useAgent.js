import { useState, useCallback, useRef } from 'react'
import { runAgent } from '../services/anthropic'
import { readFile, proposeFileChange } from '../services/github'
import { updateCmsSeo } from '../services/django'
import { fetchPageGsc } from '../services/gsc'
import { AGENT_BY_KEY, ACTION_PLAN_AGENT } from '../config/agents'

// Pull a JSON object out of model output (tolerates fences/prose).
export function parseJsonObject(text) {
  if (!text) return null
  let raw = text.trim()
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) raw = fence[1].trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

// Strip an accidental ```tsx fence the model may wrap a full file in.
function stripCodeFence(text) {
  const m = text.match(/```(?:tsx|ts|jsx|js)?\s*\n([\s\S]*?)\n```/)
  return m ? m[1] : text.trim()
}

const emptyAgent = () => ({ status: 'idle', output: '', error: null, ranAt: null })

export function useAgent() {
  const [pages, setPages] = useState({}) // pages[uid] = { update, audit }
  const [sites, setSites] = useState({}) // sites[siteId] = { social }
  const [reports, setReports] = useState({}) // reports[siteId] = { status, output, error, ranAt }
  const [gsc, setGsc] = useState({}) // gsc[uid] = { status, top, rows, index, errors, ranAt }
  const pagesRef = useRef(pages)
  pagesRef.current = pages

  const getPage = useCallback((uid) => {
    return (
      pagesRef.current[uid] || {
        update: { ...emptyAgent(), proposed: null, pr: null },
        audit: emptyAgent(),
      }
    )
  }, [])

  const getSocial = useCallback((siteId) => sites[siteId]?.social || emptyAgent(), [sites])

  const mutPage = useCallback((uid, fn) => {
    setPages((prev) => {
      const cur = prev[uid] || {
        update: { ...emptyAgent(), proposed: null, pr: null },
        audit: emptyAgent(),
      }
      return { ...prev, [uid]: fn(cur) }
    })
  }, [])

  // ---- Copywriting Audit (read-only) ----
  const runAudit = useCallback(
    async (site, page, gscData) => {
      const agent = AGENT_BY_KEY.audit
      mutPage(page.uid, (p) => ({ ...p, audit: { status: 'running', output: '', error: null, ranAt: null } }))
      try {
        const out = await runAgent(agent.system, agent.buildMessage({ site, page, gsc: gscData }), agent.tools)
        mutPage(page.uid, (p) => ({ ...p, audit: { status: 'done', output: out, error: null, ranAt: Date.now() } }))
        return out
      } catch (e) {
        mutPage(page.uid, (p) => ({ ...p, audit: { status: 'error', output: '', error: e.message, ranAt: Date.now() } }))
        throw e
      }
    },
    [mutPage]
  )

  // ---- Social Growth (read-only, site-level) ----
  const runSocial = useCallback(async (site) => {
    const agent = AGENT_BY_KEY.social
    setSites((prev) => ({ ...prev, [site.id]: { social: { status: 'running', output: '', error: null, ranAt: null } } }))
    try {
      const out = await runAgent(agent.system, agent.buildMessage({ site }), agent.tools)
      setSites((prev) => ({ ...prev, [site.id]: { social: { status: 'done', output: out, error: null, ranAt: Date.now() } } }))
      return out
    } catch (e) {
      setSites((prev) => ({ ...prev, [site.id]: { social: { status: 'error', output: '', error: e.message, ranAt: Date.now() } } }))
      throw e
    }
  }, [])

  // ---- Site Update: generate a proposed change (does NOT publish) ----
  const runUpdate = useCallback(
    async (site, page, instruction, settings) => {
      const agent = AGENT_BY_KEY.update
      mutPage(page.uid, (p) => ({
        ...p,
        update: { status: 'running', output: '', error: null, ranAt: null, proposed: null, pr: null },
      }))
      try {
        let ctx = { site, page, instruction }
        let original = null
        let sha = null
        if (page.type === 'static') {
          const f = await readFile(site.repo, page.filePath, site.branch, settings.githubToken)
          original = f.content
          sha = f.sha
          ctx.fileContent = original
        }
        const out = await runAgent(agent.system, agent.buildMessage(ctx), agent.tools)

        let proposed
        if (page.type === 'cms') {
          const fields = parseJsonObject(out)
          if (!fields) throw new Error('Could not parse the proposed CMS fields as JSON.')
          proposed = { type: 'cms', fields }
        } else {
          proposed = { type: 'static', original, sha, content: stripCodeFence(out) }
        }
        mutPage(page.uid, (p) => ({
          ...p,
          update: { status: 'done', output: out, error: null, ranAt: Date.now(), proposed, pr: null },
        }))
        return out
      } catch (e) {
        mutPage(page.uid, (p) => ({
          ...p,
          update: { ...p.update, status: 'error', error: e.message, ranAt: Date.now() },
        }))
        throw e
      }
    },
    [mutPage]
  )

  // ---- Site Update: publish the proposed change (PR for static, PATCH for CMS) ----
  const approveUpdate = useCallback(
    async (site, page, settings) => {
      const proposed = getPage(page.uid).update.proposed
      if (!proposed) throw new Error('Nothing to publish — run the Site Update agent first.')
      mutPage(page.uid, (p) => ({ ...p, update: { ...p.update, pr: { status: 'running' } } }))
      try {
        if (proposed.type === 'cms') {
          const result = await updateCmsSeo(settings.djangoUrl, settings.seoKey, page.kind, page.cmsId, proposed.fields)
          mutPage(page.uid, (p) => ({ ...p, update: { ...p.update, pr: { status: 'done', kind: 'cms', result, at: Date.now() } } }))
          return result
        }
        const title = `SEO [Site Update]: ${page.name} — ${site.name}`
        const body =
          `Automated SEO copy update generated by the SEO Command Centre.\n\n` +
          `**Page:** ${site.baseUrl}${page.path}\n**File:** \`${page.filePath}\`\n\nReview the diff before merging.`
        const r = await proposeFileChange(site.repo, page.filePath, proposed.content, site.branch, title, body, settings.githubToken)
        mutPage(page.uid, (p) => ({
          ...p,
          update: { ...p.update, pr: { status: 'done', kind: 'pr', url: r.prUrl, branch: r.branch, prError: r.prError, at: Date.now() } },
        }))
        return r
      } catch (e) {
        mutPage(page.uid, (p) => ({ ...p, update: { ...p.update, pr: { status: 'error', error: e.message, at: Date.now() } } }))
        throw e
      }
    },
    [getPage, mutPage]
  )

  // ---- Action plan: synthesise all audits into one prioritised plan ----
  const runActionPlan = useCallback(async (site, digest) => {
    if (!digest?.trim()) throw new Error('No audits yet — run the Copywriting Audit on some pages first.')
    setReports((prev) => ({ ...prev, [site.id]: { status: 'running', output: '', error: null, ranAt: null } }))
    try {
      const out = await runAgent(ACTION_PLAN_AGENT.system, ACTION_PLAN_AGENT.buildMessage(site, digest), [])
      setReports((prev) => ({ ...prev, [site.id]: { status: 'done', output: out, error: null, ranAt: Date.now() } }))
      return out
    } catch (e) {
      setReports((prev) => ({ ...prev, [site.id]: { status: 'error', output: '', error: e.message, ranAt: Date.now() } }))
      throw e
    }
  }, [])

  // ---- Google Search Console: rankings + index status per page ----
  const getGsc = useCallback((uid) => gsc[uid], [gsc])

  const loadGsc = useCallback(async (site, page, property) => {
    const fullUrl = `${site.baseUrl}${page.path}`
    setGsc((prev) => ({ ...prev, [page.uid]: { ...prev[page.uid], status: 'running' } }))
    try {
      const data = await fetchPageGsc(property, fullUrl)
      setGsc((prev) => ({ ...prev, [page.uid]: { status: 'done', ...data, ranAt: Date.now() } }))
      return data
    } catch (e) {
      setGsc((prev) => ({ ...prev, [page.uid]: { status: 'error', error: e.message, ranAt: Date.now() } }))
      throw e
    }
  }, [])

  return {
    pages, sites, reports, gsc,
    getPage, getSocial, getGsc,
    runAudit, runSocial, runUpdate, approveUpdate, runActionPlan, loadGsc,
  }
}
