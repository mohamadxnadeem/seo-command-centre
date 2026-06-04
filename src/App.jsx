import { useEffect, useMemo, useState, useCallback } from 'react'
import { SITES, staticPageToEntry, cmsItemToEntry } from './config/sites'
import { AGENTS } from './config/agents'
import { listCollection } from './services/django'
import { useAgent } from './hooks/useAgent'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import PageHeader from './components/PageHeader'
import AgentCard from './components/AgentCard'
import PageMatrix from './components/PageMatrix'
import GithubPanel from './components/GithubPanel'
import BackendPanel from './components/BackendPanel'
import AiPanel from './components/AiPanel'
import ReportView from './components/ReportView'

const ENV = import.meta.env
const SETTING_DEFS = {
  githubToken: { ls: 'gh_token', env: ENV.VITE_GITHUB_TOKEN, def: '' },
  ctcRepo: { ls: 'ctc_repo', env: ENV.VITE_CTC_GITHUB_REPO, def: 'mohamadxnadeem/capetown-concierge' },
  sigmaRepo: { ls: 'sigma_repo', env: ENV.VITE_SIGMA_GITHUB_REPO, def: 'mohamadxnadeem/sigma-chauffeur' },
  branch: { ls: 'gh_branch', env: ENV.VITE_GITHUB_BRANCH, def: 'main' },
  djangoUrl: { ls: 'django_url', env: ENV.VITE_DJANGO_API_URL, def: 'https://web-production-1ab9.up.railway.app' },
  seoKey: { ls: 'seo_key', env: ENV.VITE_SEO_UPDATE_KEY, def: '' },
  anthropicKey: { ls: 'anthropic_key', env: ENV.VITE_ANTHROPIC_API_KEY, def: '' },
}

function loadSettings() {
  const s = {}
  for (const [k, def] of Object.entries(SETTING_DEFS)) s[k] = localStorage.getItem(def.ls) ?? def.env ?? def.def
  return s
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [activeSiteId, setActiveSiteId] = useState('ctc')
  const [panel, setPanel] = useState(null)
  const [cmsPages, setCmsPages] = useState({}) // cmsPages[siteId] = entries[]
  const [cmsState, setCmsState] = useState({ loading: false, error: null })
  const [selectedUid, setSelectedUid] = useState(null)
  const [instructions, setInstructions] = useState({}) // instructions[uid] = text
  const [batchProgress, setBatchProgress] = useState(null)

  const [reportOpen, setReportOpen] = useState(false)
  const { pages: pagesState, reports, getPage, getSocial, runAudit, runSocial, runUpdate, approveUpdate, runActionPlan } = useAgent()

  const baseSite = SITES[activeSiteId]
  const site = useMemo(
    () => ({ ...baseSite, repo: activeSiteId === 'ctc' ? settings.ctcRepo : settings.sigmaRepo, branch: settings.branch }),
    [baseSite, activeSiteId, settings.ctcRepo, settings.sigmaRepo, settings.branch]
  )

  const staticEntries = useMemo(() => baseSite.staticPages.map((p) => staticPageToEntry(baseSite, p)), [baseSite])
  const pages = useMemo(() => [...staticEntries, ...(cmsPages[activeSiteId] || [])], [staticEntries, cmsPages, activeSiteId])

  const selectedPage = useMemo(() => pages.find((p) => p.uid === selectedUid) || pages[0], [pages, selectedUid])

  function setSetting(key, value) {
    const def = SETTING_DEFS[key]
    if (def) localStorage.setItem(def.ls, value)
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Load CMS collections (Tours/Vehicles) from the live API when the site changes.
  const loadCms = useCallback(async () => {
    setCmsState({ loading: true, error: null })
    try {
      const all = []
      for (const col of baseSite.collections) {
        // eslint-disable-next-line no-await-in-loop
        const raw = await listCollection(settings.djangoUrl, col.listPath)
        raw.forEach((item) => all.push(cmsItemToEntry(baseSite, col, item)))
      }
      setCmsPages((prev) => ({ ...prev, [activeSiteId]: all }))
      setCmsState({ loading: false, error: null })
    } catch (e) {
      setCmsState({ loading: false, error: e.message })
    }
  }, [baseSite, activeSiteId, settings.djangoUrl])

  useEffect(() => {
    setSelectedUid(staticEntries[0]?.uid || null)
    if (!cmsPages[activeSiteId]) loadCms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSiteId])

  const setInstruction = (uid, text) => setInstructions((prev) => ({ ...prev, [uid]: text }))

  // Run the Copywriting Audit across every page, sequentially.
  async function runAuditAll() {
    if (batchProgress) return
    const list = pages
    for (let i = 0; i < list.length; i++) {
      setBatchProgress(`Auditing ${i + 1}/${list.length} — ${list[i].name}`)
      setSelectedUid(list[i].uid)
      // eslint-disable-next-line no-await-in-loop
      await runAudit(site, list[i]).catch(() => {})
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500))
    }
    setBatchProgress(null)
  }

  const socialState = getSocial(activeSiteId)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <TopBar
        activeSiteId={activeSiteId}
        onSelectSite={setActiveSiteId}
        onToggleAi={() => setPanel(panel === 'ai' ? null : 'ai')}
        onToggleDjango={() => setPanel(panel === 'django' ? null : 'django')}
        onToggleGithub={() => setPanel(panel === 'github' ? null : 'github')}
        onToggleReport={() => setReportOpen((v) => !v)}
        reportOpen={reportOpen}
        aiReady={!!settings.anthropicKey}
        djangoReady={!!settings.seoKey}
        githubReady={!!settings.githubToken}
      />

      {panel === 'ai' && <AiPanel settings={settings} setSetting={setSetting} onClose={() => setPanel(null)} />}
      {panel === 'github' && <GithubPanel settings={settings} setSetting={setSetting} onClose={() => setPanel(null)} />}
      {panel === 'django' && <BackendPanel settings={settings} setSetting={setSetting} onClose={() => setPanel(null)} />}

      <div className="flex flex-1 min-h-0">
        <Sidebar
          site={site}
          pages={pages}
          selectedUid={selectedPage?.uid}
          onSelect={setSelectedUid}
          cmsLoading={cmsState.loading}
          cmsError={cmsState.error}
          onAuditAll={runAuditAll}
          batchProgress={batchProgress}
        />

        <main className="flex-1 min-w-0 scroll-area p-5">
          {reportOpen ? (
            <ReportView
              site={site}
              entries={pages}
              pagesState={pagesState}
              report={reports[activeSiteId]}
              onGenerate={(digest) => runActionPlan(site, digest).catch(() => {})}
              onClose={() => setReportOpen(false)}
            />
          ) : (
          <>
          <KeywordBanner />
          <PageHeader site={site} page={selectedPage} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {AGENTS.map((agent) => {
              if (agent.scope === 'site') {
                return (
                  <AgentCard
                    key={agent.key}
                    agent={agent}
                    agentState={socialState}
                    page={null}
                    onRun={() => runSocial(site).catch(() => {})}
                  />
                )
              }
              const ps = selectedPage ? getPage(selectedPage.uid) : null
              const agentState = ps?.[agent.key]
              return (
                <AgentCard
                  key={agent.key}
                  agent={agent}
                  agentState={agentState}
                  page={selectedPage}
                  instruction={instructions[selectedPage?.uid]}
                  onInstructionChange={(t) => setInstruction(selectedPage.uid, t)}
                  onRun={() => {
                    if (!selectedPage) return
                    if (agent.key === 'update') runUpdate(site, selectedPage, instructions[selectedPage.uid] || '', settings).catch(() => {})
                    else runAudit(site, selectedPage).catch(() => {})
                  }}
                  onApprove={() => selectedPage && approveUpdate(site, selectedPage, settings).catch(() => {})}
                />
              )
            })}
          </div>

          <PageMatrix site={site} pages={pages} getPage={getPage} selectedUid={selectedPage?.uid} onSelect={setSelectedUid} />
          </>
          )}
        </main>
      </div>
    </div>
  )
}

function KeywordBanner() {
  return (
    <div className="rounded-lg px-4 py-2.5 mb-4 text-[11px] leading-relaxed flex items-start gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border-light)', color: 'var(--text)' }}>
      <span style={{ color: 'var(--gold)' }}>◆</span>
      <span>
        <strong style={{ color: 'var(--green)' }}>CTC targets:</strong> luxury chauffeur, private chauffeur, airport transfer Cape Town.{' '}
        <strong style={{ color: 'var(--gold)' }}>Sigma targets:</strong> VIP chauffeur, chauffeur service, luxury airport transfer.{' '}
        <span style={{ color: 'var(--muted)' }}>Differentiated to prevent Google ranking them against each other.</span>{' '}
        Static pages → GitHub PR · Tours/Vehicles → Django CMS.
      </span>
    </div>
  )
}
