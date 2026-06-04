import { useState, useMemo } from 'react'

const CATS = ['Main', 'Tours', 'Vehicles']

function scoreColor(score) {
  if (score == null) return 'var(--muted)'
  if (score >= 80) return 'var(--green)'
  if (score >= 50) return 'var(--gold)'
  return 'var(--red)'
}

export default function Sidebar({
  site,
  selectedPageId,
  onSelectPage,
  getPage,
  onRunAllPages,
  onPushAllGithub,
  onPushAllDjango,
  batchProgress
}) {
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = site.pages.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.primaryKw.toLowerCase().includes(q)
    )
    return CATS.map((cat) => ({ cat, pages: filtered.filter((p) => p.cat === cat) })).filter(
      (g) => g.pages.length
    )
  }, [site, query])

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{ width: 230, background: 'var(--card)', borderRight: '1px solid var(--border)' }}
    >
      <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages…"
          className="w-full px-2.5 py-1.5 rounded-md text-[12px] outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      <div className="scroll-area flex-1 px-2 py-2">
        {grouped.map((g) => (
          <div key={g.cat} className="mb-3">
            <div
              className="px-1.5 mb-1 text-[10px] uppercase tracking-widest"
              style={{ color: 'var(--muted)' }}
            >
              {g.cat}
            </div>
            {g.pages.map((p) => {
              const st = getPage(site.id, p.id)
              const active = p.id === selectedPageId
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPage(p.id)}
                  className="w-full text-left px-2 py-1.5 rounded-md mb-0.5 flex items-center gap-2 transition-colors"
                  style={{
                    background: active ? 'var(--bg)' : 'transparent',
                    border: `1px solid ${active ? 'var(--border-light)' : 'transparent'}`
                  }}
                >
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-[12px] truncate"
                      style={{ color: active ? 'var(--white)' : 'var(--text)' }}
                    >
                      {p.name}
                    </span>
                    <span className="block text-[10px] truncate" style={{ color: 'var(--muted)' }}>
                      {p.primaryKw}
                    </span>
                  </span>
                  <span
                    className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      color: scoreColor(st.score),
                      border: `1px solid ${st.score == null ? 'var(--border)' : scoreColor(st.score)}`,
                      minWidth: 30,
                      textAlign: 'center'
                    }}
                  >
                    {st.score == null ? '—' : st.score}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Batch buttons */}
      <div className="p-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        {batchProgress && (
          <div className="text-[10px] mb-1" style={{ color: 'var(--gold)' }}>
            {batchProgress}
          </div>
        )}
        <button
          onClick={onRunAllPages}
          className="w-full py-2 rounded-md text-[12px] font-semibold transition-colors"
          style={{ background: 'var(--green)', color: '#04140b' }}
        >
          Run All {site.pages.length} Pages
        </button>
        <div className="flex gap-2">
          <button
            onClick={onPushAllGithub}
            className="flex-1 py-1.5 rounded-md text-[11px] font-medium"
            style={{ border: '1px solid var(--blue)', color: 'var(--blue)' }}
          >
            Push All → GitHub
          </button>
          <button
            onClick={onPushAllDjango}
            className="flex-1 py-1.5 rounded-md text-[11px] font-medium"
            style={{ border: '1px solid var(--gold)', color: 'var(--gold)' }}
          >
            Push All → Django
          </button>
        </div>
      </div>
    </aside>
  )
}
