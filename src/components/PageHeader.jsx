// Info card for the currently selected page + the keyword-strategy notice banner.
export default function PageHeader({ site, page, pageState, onRunAll }) {
  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ color: site.color, border: `1px solid ${site.color}` }}
            >
              {page.cat}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {site.name}
            </span>
          </div>
          <h1 className="font-syne font-extrabold text-[22px] leading-tight" style={{ color: 'var(--white)' }}>
            {page.name}
          </h1>
          <a
            href={`${site.baseUrl}${page.path}`}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] hover:underline"
            style={{ color: 'var(--blue)' }}
          >
            {site.baseUrl}
            {page.path} ↗
          </a>

          <div className="flex flex-wrap gap-3 mt-3">
            <KwBlock label="Primary keyword" value={page.primaryKw} color={site.color} />
            <KwBlock label="Secondary" value={(page.secondary || []).join(' · ')} />
            <div>
              <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted)' }}>
                File path
              </div>
              <code className="text-[11px]" style={{ color: 'var(--text)' }}>
                {page.filePath}
              </code>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
            SEO Score
          </div>
          <div
            className="font-syne font-extrabold text-[34px] leading-none"
            style={{ color: scoreColor(pageState.score) }}
          >
            {pageState.score == null ? '—' : pageState.score}
          </div>
          <button
            onClick={onRunAll}
            className="mt-3 px-4 py-2 rounded-md text-[12px] font-semibold"
            style={{ background: 'var(--white)', color: 'var(--bg)' }}
          >
            Run All Agents
          </button>
        </div>
      </div>
    </div>
  )
}

function KwBlock({ label, value, color }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="text-[12px] truncate" style={{ color: color || 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

function scoreColor(score) {
  if (score == null) return 'var(--muted)'
  if (score >= 80) return 'var(--green)'
  if (score >= 50) return 'var(--gold)'
  return 'var(--red)'
}
