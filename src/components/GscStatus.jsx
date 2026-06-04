// Per-page Google Search Console status: index state + ranking keywords.
export default function GscStatus({ gsc, onRefresh }) {
  const status = gsc?.status

  return (
    <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--blue)' }}>Search Console</span>
        {gsc?.ranAt && <span className="text-[10px]" style={{ color: 'var(--muted)' }}>updated {new Date(gsc.ranAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        <div className="flex-1" />
        <button
          onClick={onRefresh}
          disabled={status === 'running'}
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold disabled:opacity-50"
          style={{ border: '1px solid var(--blue)', color: 'var(--blue)' }}
        >
          {status === 'running' ? 'Loading…' : status ? 'Refresh' : 'Load GSC'}
        </button>
      </div>

      {status === 'error' && (
        <div className="text-[11px]" style={{ color: 'var(--red)' }}>
          {gsc.error}
          {gsc.error?.includes('404') && (
            <span style={{ color: 'var(--muted)' }}> — the /api/gsc proxy only runs on the Vercel deployment (or `vercel dev`), not plain `npm run dev`.</span>
          )}
        </div>
      )}

      {!status && <div className="text-[11px]" style={{ color: 'var(--muted)' }}>Load index status &amp; the keywords this page ranks for.</div>}

      {status === 'done' && (
        <div className="flex flex-col gap-3">
          {/* Index + headline metric */}
          <div className="flex items-center gap-3 flex-wrap">
            <IndexBadge index={gsc.index} />
            {gsc.top ? (
              <div className="flex items-center gap-2">
                <span className="font-syne font-extrabold text-[20px]" style={{ color: posColor(gsc.top.position) }}>#{gsc.top.position}</span>
                <span className="text-[11px]" style={{ color: 'var(--muted)' }}>best avg position · “{gsc.top.query}”</span>
              </div>
            ) : (
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>No ranking queries in the last 28 days.</span>
            )}
            {gsc.index?.lastCrawl && (
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>last crawl {new Date(gsc.index.lastCrawl).toLocaleDateString()}</span>
            )}
          </div>

          {/* Ranking keywords table */}
          {gsc.rows?.length > 0 && (
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ color: 'var(--muted)' }}>
                  <th className="text-left font-normal py-1">Keyword (ranking)</th>
                  <th className="text-right font-normal">Pos</th>
                  <th className="text-right font-normal">Clicks</th>
                  <th className="text-right font-normal">Impr.</th>
                </tr>
              </thead>
              <tbody>
                {gsc.rows.slice(0, 10).map((r) => (
                  <tr key={r.query} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="py-1" style={{ color: 'var(--text)' }}>{r.query}</td>
                    <td className="text-right" style={{ color: posColor(r.position) }}>{r.position ?? '—'}</td>
                    <td className="text-right" style={{ color: 'var(--muted)' }}>{r.clicks ?? 0}</td>
                    <td className="text-right" style={{ color: 'var(--muted)' }}>{r.impressions ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {gsc.errors?.length > 0 && (
            <div className="text-[10px]" style={{ color: 'var(--red)' }}>{gsc.errors.join(' · ')}</div>
          )}
        </div>
      )}
    </div>
  )
}

function IndexBadge({ index }) {
  if (!index) return <Badge color="var(--muted)" text="Index: unknown" />
  const v = index.verdict
  if (v === 'PASS') return <Badge color="var(--green)" text={index.coverageState || 'Indexed'} />
  if (v === 'FAIL') return <Badge color="var(--red)" text={index.coverageState || 'Not indexed'} />
  return <Badge color="var(--gold)" text={index.coverageState || 'Needs attention'} />
}

function Badge({ color, text }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded" style={{ color, border: `1px solid ${color}` }}>
      ● {text}
    </span>
  )
}

function posColor(p) {
  if (p == null) return 'var(--muted)'
  if (p <= 3) return 'var(--green)'
  if (p <= 10) return 'var(--gold)'
  return 'var(--red)'
}
