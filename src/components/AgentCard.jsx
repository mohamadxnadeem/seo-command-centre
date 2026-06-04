import StatusDot from './StatusDot'

function timeAgo(ts) {
  if (!ts) return null
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AgentCard({ agent, agentState, onRun, isUpdater, pageState, onPushDjango, onPushGithub, pushBusy }) {
  const st = agentState?.status || 'idle'
  const running = st === 'running'

  return (
    <div
      className="rounded-lg flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', minHeight: 280 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <StatusDot status={st} color={agent.color} size={10} />
        <span className="text-[10px] tracking-widest" style={{ color: agent.color }}>
          AGENT {agent.code}
        </span>
        <span className="flex-1 text-[12px] font-medium truncate" style={{ color: 'var(--white)' }}>
          {agent.name}
        </span>
        <button
          onClick={onRun}
          disabled={running}
          className="px-3 py-1 rounded-md text-[11px] font-semibold transition-colors"
          style={{
            background: running ? 'var(--bg)' : agent.color,
            color: running ? agent.color : '#04140b',
            border: `1px solid ${agent.color}`,
            opacity: running ? 0.7 : 1,
            cursor: running ? 'default' : 'pointer'
          }}
        >
          {running ? 'RUNNING…' : 'RUN'}
        </button>
      </div>

      {/* Output */}
      <div className="scroll-area flex-1 p-3" style={{ maxHeight: 320 }}>
        {st === 'idle' && (
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
            Idle. Press RUN to execute on this page.
          </div>
        )}
        {running && (
          <div className="text-[11px]" style={{ color: agent.color }}>
            Working… querying Claude{agent.tools.length ? ' + web search' : ''}.
          </div>
        )}
        {agentState?.error && (
          <div className="text-[11px] whitespace-pre-wrap" style={{ color: 'var(--red)' }}>
            {agentState.error}
          </div>
        )}
        {agentState?.output && (
          <pre
            className="text-[11px] whitespace-pre-wrap leading-relaxed"
            style={{ color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}
          >
            {agentState.output}
          </pre>
        )}
      </div>

      {/* Footer: timestamp + push buttons */}
      <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
        {isUpdater && (
          <div className="flex flex-col gap-1.5 mb-2">
            <div className="flex gap-2">
              <button
                onClick={onPushDjango}
                disabled={!pageState?.json || pushBusy}
                className="flex-1 py-1.5 rounded-md text-[11px] font-semibold disabled:opacity-40"
                style={{ border: '1px solid var(--gold)', color: 'var(--gold)' }}
              >
                Push to Django →
              </button>
              <button
                onClick={onPushGithub}
                disabled={!pageState?.json || pushBusy}
                className="flex-1 py-1.5 rounded-md text-[11px] font-semibold disabled:opacity-40"
                style={{ border: '1px solid var(--blue)', color: 'var(--blue)' }}
              >
                Push to GitHub → Live in 60s
              </button>
            </div>
            <PushStatus pageState={pageState} />
          </div>
        )}
        <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--muted)' }}>
          <span>{agentState?.ranAt ? `last run ${timeAgo(agentState.ranAt)}` : 'never run'}</span>
          {st === 'done' && <span style={{ color: agent.color }}>✓ done</span>}
          {st === 'error' && <span style={{ color: 'var(--red)' }}>✕ error</span>}
        </div>
      </div>
    </div>
  )
}

function PushStatus({ pageState }) {
  if (!pageState) return null
  const dj = pageState.django
  const gh = pageState.github
  return (
    <div className="flex flex-col gap-0.5 text-[10px]">
      {dj?.status === 'running' && <span style={{ color: 'var(--gold)' }}>Django: pushing…</span>}
      {dj?.status === 'done' && (
        <span style={{ color: 'var(--green)' }}>
          ✓ Saved to Django · {new Date(dj.at).toLocaleTimeString()}
        </span>
      )}
      {dj?.status === 'error' && <span style={{ color: 'var(--red)' }}>Django: {dj.error}</span>}

      {gh?.status === 'running' && <span style={{ color: 'var(--blue)' }}>GitHub: committing…</span>}
      {gh?.status === 'done' && (
        <span style={{ color: 'var(--green)' }}>
          ✓ Committed{' '}
          <a href={gh.url} target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--blue)' }}>
            {gh.sha?.slice(0, 7)} ↗
          </a>{' '}
          · Vercel auto-deploying…
        </span>
      )}
      {gh?.status === 'error' && <span style={{ color: 'var(--red)' }}>GitHub: {gh.error}</span>}
    </div>
  )
}
