import { useEffect, useMemo, useState } from 'react'
import { SITES } from './config/sites'
import { AGENTS } from './config/agents'
import { useAgent } from './hooks/useAgent'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import PageHeader from './components/PageHeader'
import AgentCard from './components/AgentCard'
import PageMatrix from './components/PageMatrix'
import GithubPanel from './components/GithubPanel'
import BackendPanel from './components/BackendPanel'
import AiPanel from './components/AiPanel'

const ENV = import.meta.env

// localStorage key per setting + the build-time env fallback.
const SETTING_DEFS = {
  githubToken: { ls: 'gh_token', env: ENV.VITE_GITHUB_TOKEN, def: '' },
  ctcRepo: { ls: 'ctc_repo', env: ENV.VITE_CTC_GITHUB_REPO, def: 'mohamadxnadeem/capetown-concierge' },
  sigmaRepo: { ls: 'sigma_repo', env: ENV.VITE_SIGMA_GITHUB_REPO, def: 'mohamadxnadeem/sigma-chauffeur' },
  branch: { ls: 'gh_branch', env: ENV.VITE_GITHUB_BRANCH, def: 'main' },
  djangoUrl: { ls: 'django_url', env: ENV.VITE_DJANGO_API_URL, def: 'https://web-production-1ab9.up.railway.app' },
  djangoToken: { ls: 'django_token', env: ENV.VITE_DJANGO_AUTH_TOKEN, def: '' },
  anthropicKey: { ls: 'anthropic_key', env: ENV.VITE_ANTHROPIC_API_KEY, def: '' }
}

function loadSettings() {
  const s = {}
  for (const [k, def] of Object.entries(SETTING_DEFS)) {
    s[k] = localStorage.getItem(def.ls) ?? def.env ?? def.def
  }
  return s
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [activeSiteId, setActiveSiteId] = useState('ctc')
  const [panel, setPanel] = useState(null) // 'github' | 'django' | 'ai' | null
  const [batchProgress, setBatchProgress] = useState(null)
  const [busy, setBusy] = useState(false)

  const site = SITES[activeSiteId]
  const [selectedPageId, setSelectedPageId] = useState(site.pages[0].id)
  const page = useMemo(
    () => site.pages.find((p) => p.id === selectedPageId) || site.pages[0],
    [site, selectedPageId]
  )

  const { getPage, run, runAll, pushDjango, pushGithub } = useAgent()
  const pageState = getPage(site.id, page.id)

  function setSetting(key, value) {
    const def = SETTING_DEFS[key]
    if (def) localStorage.setItem(def.ls, value)
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // When switching sites, select that site's first page.
  useEffect(() => {
    setSelectedPageId(SITES[activeSiteId].pages[0].id)
  }, [activeSiteId])

  const repoForSite = (s) => (s.id === 'ctc' ? settings.ctcRepo : settings.sigmaRepo)

  // ---- single-page push handlers ----
  const handlePushDjango = (s, p) =>
    pushDjango(s, p, settings.djangoUrl, settings.djangoToken).catch(() => {})
  const handlePushGithub = (s, p) =>
    pushGithub(s, p, repoForSite(s), settings.branch, settings.githubToken).catch(() => {})

  // ---- batch operations ----
  async function runAllPages() {
    if (busy) return
    setBusy(true)
    const pages = site.pages
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]
      setBatchProgress(`Running ${i + 1}/${pages.length} — ${p.name}`)
      setSelectedPageId(p.id)
      // eslint-disable-next-line no-await-in-loop
      await runAll(site, p)
      // eslint-disable-next-line no-await-in-loop
      await wait(600)
    }
    setBatchProgress(null)
    setBusy(false)
  }

  async function pushAllGithub() {
    if (busy) return
    setBusy(true)
    const pages = site.pages.filter((p) => getPage(site.id, p.id).json)
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]
      setBatchProgress(`Pushing GitHub ${i + 1}/${pages.length} — ${p.name}`)
      // eslint-disable-next-line no-await-in-loop
      await pushGithub(site, p, repoForSite(site), settings.branch, settings.githubToken).catch(() => {})
      // eslint-disable-next-line no-await-in-loop
      await wait(300)
    }
    setBatchProgress(null)
    setBusy(false)
  }

  async function pushAllDjango() {
    if (busy) return
    setBusy(true)
    const pages = site.pages.filter((p) => getPage(site.id, p.id).json)
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]
      setBatchProgress(`Pushing Django ${i + 1}/${pages.length} — ${p.name}`)
      // eslint-disable-next-line no-await-in-loop
      await pushDjango(site, p, settings.djangoUrl, settings.djangoToken).catch(() => {})
      // eslint-disable-next-line no-await-in-loop
      await wait(200)
    }
    setBatchProgress(null)
    setBusy(false)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <TopBar
        activeSiteId={activeSiteId}
        onSelectSite={setActiveSiteId}
        onToggleAi={() => setPanel(panel === 'ai' ? null : 'ai')}
        onToggleDjango={() => setPanel(panel === 'django' ? null : 'django')}
        onToggleGithub={() => setPanel(panel === 'github' ? null : 'github')}
        aiReady={!!settings.anthropicKey}
        djangoReady={!!settings.djangoToken}
        githubReady={!!settings.githubToken}
      />

      {panel === 'ai' && <AiPanel settings={settings} setSetting={setSetting} onClose={() => setPanel(null)} />}
      {panel === 'github' && (
        <GithubPanel settings={settings} setSetting={setSetting} onClose={() => setPanel(null)} />
      )}
      {panel === 'django' && (
        <BackendPanel settings={settings} setSetting={setSetting} onClose={() => setPanel(null)} />
      )}

      <div className="flex flex-1 min-h-0">
        <Sidebar
          site={site}
          selectedPageId={selectedPageId}
          onSelectPage={setSelectedPageId}
          getPage={getPage}
          onRunAllPages={runAllPages}
          onPushAllGithub={pushAllGithub}
          onPushAllDjango={pushAllDjango}
          batchProgress={batchProgress}
        />

        <main className="flex-1 min-w-0 scroll-area p-5">
          <KeywordBanner />

          <PageHeader
            site={site}
            page={page}
            pageState={pageState}
            onRunAll={() => runAll(site, page)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {AGENTS.map((agent) => (
              <AgentCard
                key={agent.key}
                agent={agent}
                agentState={pageState[agent.key]}
                pageState={pageState}
                isUpdater={agent.key === 'updater'}
                onRun={() => run(site, page, agent.key).catch(() => {})}
                onPushDjango={() => handlePushDjango(site, page)}
                onPushGithub={() => handlePushGithub(site, page)}
                pushBusy={pageState.django?.status === 'running' || pageState.github?.status === 'running'}
              />
            ))}
          </div>

          <PageMatrix
            site={site}
            getPage={getPage}
            selectedPageId={selectedPageId}
            onSelectPage={setSelectedPageId}
          />
        </main>
      </div>
    </div>
  )
}

function KeywordBanner() {
  return (
    <div
      className="rounded-lg px-4 py-2.5 mb-4 text-[11px] leading-relaxed flex items-start gap-2"
      style={{ background: 'var(--card)', border: '1px solid var(--border-light)', color: 'var(--text)' }}
    >
      <span style={{ color: 'var(--gold)' }}>◆</span>
      <span>
        <strong style={{ color: 'var(--green)' }}>CTC targets:</strong> luxury chauffeur, private chauffeur,
        airport transfer Cape Town. <strong style={{ color: 'var(--gold)' }}>Sigma targets:</strong> VIP
        chauffeur, chauffeur service, luxury airport transfer.{' '}
        <span style={{ color: 'var(--muted)' }}>
          Differentiated to prevent Google ranking them against each other.
        </span>
      </span>
    </div>
  )
}
