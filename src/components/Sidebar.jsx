import { useState, useMemo } from 'react'

const CATS = ['Main', 'Tours', 'Vehicles']

export default function Sidebar({ site, pages, selectedUid, onSelect, cmsLoading, cmsError, onAuditAll, batchProgress }) {
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = pages.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || (p.primaryKw || '').toLowerCase().includes(q)
    )
    return CATS.map((cat) => ({ cat, items: filtered.filter((p) => p.cat === cat) })).filter((g) => g.items.length)
  }, [pages, query])

  return (
    <aside className="flex flex-col shrink-0" style={{ width: 240, background: 'var(--card)', borderRight: '1px solid var(--border)' }}>
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
            <div className="px-1.5 mb-1 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{g.cat}</span>
              {g.cat !== 'Main' && cmsLoading && <span className="text-[9px]" style={{ color: 'var(--gold)' }}>loading…</span>}
            </div>
            {g.items.map((p) => {
              const active = p.uid === selectedUid
              return (
                <button
                  key={p.uid}
                  onClick={() => onSelect(p.uid)}
                  className="w-full text-left px-2 py-1.5 rounded-md mb-0.5 flex items-center gap-2"
                  style={{ background: active ? 'var(--bg)' : 'transparent', border: `1px solid ${active ? 'var(--border-light)' : 'transparent'}` }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] truncate" style={{ color: active ? 'var(--white)' : 'var(--text)' }}>{p.name}</span>
                    <span className="block text-[10px] truncate" style={{ color: 'var(--muted)' }}>{p.primaryKw}</span>
                  </span>
                  <span
                    className="text-[8px] uppercase tracking-wide px-1 py-0.5 rounded"
                    style={{ color: p.type === 'cms' ? 'var(--gold)' : 'var(--muted)', border: `1px solid ${p.type === 'cms' ? 'var(--gold)' : 'var(--border)'}` }}
                    title={p.type === 'cms' ? 'CMS-managed (Django)' : 'Static file (GitHub)'}
                  >
                    {p.type === 'cms' ? 'CMS' : 'FILE'}
                  </span>
                </button>
              )
            })}
          </div>
        ))}

        {cmsError && (
          <div className="px-2 py-2 text-[10px]" style={{ color: 'var(--red)' }}>
            Couldn't load CMS pages: {cmsError}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        {batchProgress && <div className="text-[10px]" style={{ color: '#34d399' }}>{batchProgress}</div>}
        <button
          onClick={onAuditAll}
          disabled={!!batchProgress}
          className="w-full py-1.5 rounded-md text-[11px] font-semibold disabled:opacity-50"
          style={{ border: '1px solid #34d399', color: '#34d399' }}
        >
          Audit all {pages.length} pages
        </button>
        <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
          {pages.filter((p) => p.type === 'static').length} file · {pages.filter((p) => p.type === 'cms').length} CMS
        </div>
      </div>
    </aside>
  )
}
