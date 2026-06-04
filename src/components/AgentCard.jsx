import StatusDot from './StatusDot'
import DiffView from './DiffView'

function timeStr(ts) {
  return ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null
}

export default function AgentCard({
  agent,
  agentState,
  page,
  onRun,
  instruction,
  onInstructionChange,
  onApprove,
}) {
  const st = agentState?.status || 'idle'
  const running = st === 'running'
  const isUpdate = agent.key === 'update'
  const isSocial = agent.scope === 'site'
  const proposed = agentState?.proposed
  const pr = agentState?.pr

  const runLabel = isUpdate ? 'GENERATE' : 'RUN'

  return (
    <div className="rounded-lg flex flex-col" style={{ background: 'var(--card)', border: '1px solid var(--border)', minHeight: 300 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <StatusDot status={st} color={agent.color} size={10} />
        <span className="text-[10px] tracking-widest" style={{ color: agent.color }}>AGENT {agent.code}</span>
        <span className="flex-1 text-[12px] font-medium truncate" style={{ color: 'var(--white)' }}>{agent.name}</span>
        {isSocial && <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>site</span>}
        <button
          onClick={onRun}
          disabled={running || (isUpdate && !instruction?.trim())}
          className="px-3 py-1 rounded-md text-[11px] font-semibold disabled:opacity-40"
          style={{ background: running ? 'var(--bg)' : agent.color, color: running ? agent.color : '#04140b', border: `1px solid ${agent.color}` }}
        >
          {running ? '…' : runLabel}
        </button>
      </div>

      {/* Instruction input (Site Update only) */}
      {isUpdate && (
        <div className="px-3 pt-3">
          <textarea
            value={instruction || ''}
            onChange={(e) => onInstructionChange(e.target.value)}
            placeholder={page?.type === 'cms'
              ? 'e.g. Rewrite the meta description to emphasise private, no-shared-groups, end with WhatsApp CTA'
              : 'e.g. Make the H1 more premium and update the meta title to target the primary keyword'}
            rows={3}
            className="w-full px-2.5 py-2 rounded-md text-[11px] outline-none resize-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
      )}

      {/* Output */}
      <div className="scroll-area flex-1 p-3" style={{ maxHeight: 300 }}>
        {st === 'idle' && (
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {isUpdate ? 'Describe a change, then GENERATE a proposal.' : isSocial ? 'Run a growth + creator-outreach brief for this brand.' : 'Run a live copy audit for this page.'}
          </div>
        )}
        {running && <div className="text-[11px]" style={{ color: agent.color }}>Working{agent.tools?.length ? ' + web search' : ''}…</div>}
        {agentState?.error && <div className="text-[11px] whitespace-pre-wrap" style={{ color: 'var(--red)' }}>{agentState.error}</div>}

        {/* Proposed change preview (Site Update) */}
        {isUpdate && proposed && st === 'done' && (
          <div className="mb-2">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: agent.color }}>
              {proposed.type === 'cms' ? 'Proposed CMS fields' : 'Proposed diff'}
            </div>
            {proposed.type === 'cms' ? (
              <div className="flex flex-col gap-1.5">
                {Object.entries(proposed.fields).map(([k, v]) => (
                  <div key={k} className="text-[11px]">
                    <span style={{ color: 'var(--muted)' }}>{k}: </span>
                    <span style={{ color: 'var(--text)' }}>{String(v).slice(0, 300)}</span>
                  </div>
                ))}
              </div>
            ) : proposed.original != null ? (
              <DiffView original={proposed.original} proposed={proposed.content} />
            ) : (
              <pre className="text-[10px] whitespace-pre-wrap leading-snug" style={{ color: 'var(--text)' }}>
                {proposed.content.slice(0, 4000)}{proposed.content.length > 4000 ? '\n…(truncated preview)' : ''}
              </pre>
            )}
          </div>
        )}

        {/* Read-only agent output */}
        {!isUpdate && agentState?.output && (
          <pre className="text-[11px] whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text)' }}>{agentState.output}</pre>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
        {isUpdate && proposed && (
          <div className="mb-2">
            <button
              onClick={onApprove}
              disabled={pr?.status === 'running'}
              className="w-full py-1.5 rounded-md text-[11px] font-semibold disabled:opacity-50"
              style={{ background: agent.color, color: '#04140b' }}
            >
              {pr?.status === 'running'
                ? 'Publishing…'
                : proposed.type === 'cms'
                ? 'Approve → Apply to CMS'
                : 'Approve → Open PR'}
            </button>
            <PrStatus pr={pr} />
          </div>
        )}
        <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--muted)' }}>
          <span>{agentState?.ranAt ? `ran ${timeStr(agentState.ranAt)}` : 'not run'}</span>
          {st === 'done' && <span style={{ color: agent.color }}>✓</span>}
          {st === 'error' && <span style={{ color: 'var(--red)' }}>✕</span>}
        </div>
      </div>
    </div>
  )
}

function PrStatus({ pr }) {
  if (!pr || pr.status === 'running') return null
  if (pr.status === 'error') return <div className="text-[10px] mt-1" style={{ color: 'var(--red)' }}>{pr.error}</div>
  if (pr.kind === 'cms') {
    return (
      <div className="text-[10px] mt-1" style={{ color: 'var(--green)' }}>
        ✓ Applied to CMS · #{pr.result?.id} · {pr.result?.updated?.join(', ')} · {timeStr(pr.at)}
      </div>
    )
  }
  // pr kind
  return (
    <div className="text-[10px] mt-1" style={{ color: 'var(--green)' }}>
      ✓ {pr.prError ? 'Branch pushed' : 'PR opened'} ·{' '}
      <a href={pr.url} target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--blue)' }}>
        {pr.prError ? 'open PR ↗' : 'view PR ↗'}
      </a>
      {pr.prError && <span style={{ color: 'var(--muted)' }}> (grant token PR scope to auto-open)</span>}
    </div>
  )
}
