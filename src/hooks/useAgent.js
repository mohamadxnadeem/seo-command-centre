import { useState, useCallback, useRef } from 'react'
import { runAgent } from '../services/anthropic'
import { readFile, writeFile, patchMetadata } from '../services/github'
import { pushToDjango } from '../services/django'
import { AGENT_BY_KEY } from '../config/agents'

// Parse "SCORE: 84/100" (or "84 / 100", "Score 84") out of the auditor output.
export function parseScore(text) {
  if (!text) return null
  const m =
    text.match(/score[^0-9]{0,12}(\d{1,3})\s*\/\s*100/i) ||
    text.match(/score[^0-9]{0,12}(\d{1,3})/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return n >= 0 && n <= 100 ? n : null
}

// Extract the JSON object from the Updater output (tolerates stray fences/prose).
export function parseUpdaterJson(text) {
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

const emptyAgent = () => ({ status: 'idle', output: '', error: null, ranAt: null })

const emptyPage = () => ({
  research: emptyAgent(),
  audit: emptyAgent(),
  updater: emptyAgent(),
  score: null,
  json: null,
  django: { status: 'idle', at: null, error: null },
  github: { status: 'idle', sha: null, url: null, at: null, error: null }
})

export function useAgent() {
  const [state, setState] = useState({}) // state[siteId][pageId] = {...}
  const stateRef = useRef(state)
  stateRef.current = state

  const getPage = useCallback((siteId, pageId) => {
    return stateRef.current?.[siteId]?.[pageId] || emptyPage()
  }, [])

  const mutate = useCallback((siteId, pageId, updater) => {
    setState((prev) => {
      const site = prev[siteId] || {}
      const page = site[pageId] || emptyPage()
      const next = updater(page)
      return { ...prev, [siteId]: { ...site, [pageId]: next } }
    })
  }, [])

  // Run a single agent (research | audit | updater) on a site/page.
  const run = useCallback(
    async (site, page, agentKey) => {
      const agent = AGENT_BY_KEY[agentKey]
      if (!agent) return
      mutate(site.id, page.id, (p) => ({
        ...p,
        [agentKey]: { status: 'running', output: '', error: null, ranAt: null }
      }))
      try {
        const out = await runAgent(agent.system, agent.buildMessage(site, page), agent.tools)
        mutate(site.id, page.id, (p) => {
          const patch = {
            ...p,
            [agentKey]: { status: 'done', output: out, error: null, ranAt: Date.now() }
          }
          if (agentKey === 'audit') patch.score = parseScore(out) ?? p.score
          if (agentKey === 'updater') patch.json = parseUpdaterJson(out)
          return patch
        })
        return out
      } catch (e) {
        mutate(site.id, page.id, (p) => ({
          ...p,
          [agentKey]: { status: 'error', output: '', error: e.message, ranAt: Date.now() }
        }))
        throw e
      }
    },
    [mutate]
  )

  // Fire all three agents for a page concurrently.
  const runAll = useCallback(
    async (site, page) => {
      await Promise.allSettled([
        run(site, page, 'research'),
        run(site, page, 'audit'),
        run(site, page, 'updater')
      ])
    },
    [run]
  )

  // Push the Updater JSON for a page to Django.
  const pushDjango = useCallback(
    async (site, page, apiUrl, token) => {
      const json = getPage(site.id, page.id).json
      if (!json) throw new Error('No Updater JSON for this page. Run the Updater agent first.')
      mutate(site.id, page.id, (p) => ({ ...p, django: { status: 'running', at: null, error: null } }))
      try {
        await pushToDjango(apiUrl, token, json)
        mutate(site.id, page.id, (p) => ({ ...p, django: { status: 'done', at: Date.now(), error: null } }))
      } catch (e) {
        mutate(site.id, page.id, (p) => ({ ...p, django: { status: 'error', at: Date.now(), error: e.message } }))
        throw e
      }
    },
    [getPage, mutate]
  )

  // Push the Updater JSON for a page to GitHub (patches metadata + commits).
  const pushGithub = useCallback(
    async (site, page, repo, branch, token) => {
      const json = getPage(site.id, page.id).json
      if (!json) throw new Error('No Updater JSON for this page. Run the Updater agent first.')
      const seo = json.seo || {}
      mutate(site.id, page.id, (p) => ({ ...p, github: { ...p.github, status: 'running', error: null } }))
      try {
        const { content, sha } = await readFile(repo, page.filePath, branch, token)
        const updated = patchMetadata(content, seo.title_tag || '', seo.meta_description || '')
        const commitMsg = `SEO [Updater]: ${page.name} → '${page.primaryKw}' — ${site.name}`
        const result = await writeFile(repo, page.filePath, updated, sha, commitMsg, branch, token)
        mutate(site.id, page.id, (p) => ({
          ...p,
          github: { status: 'done', sha: result.sha, url: result.commitUrl, at: Date.now(), error: null }
        }))
        return result
      } catch (e) {
        const msg = e.message?.includes('Cannot read')
          ? `File not found at ${page.filePath} — verify path in sites config`
          : e.message
        mutate(site.id, page.id, (p) => ({ ...p, github: { ...p.github, status: 'error', at: Date.now(), error: msg } }))
        throw e
      }
    },
    [getPage, mutate]
  )

  return { state, getPage, run, runAll, pushDjango, pushGithub }
}
