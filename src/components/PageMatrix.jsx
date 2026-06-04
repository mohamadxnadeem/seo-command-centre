import StatusDot from './StatusDot'

function posColor(p) {
  if (p == null) return 'var(--muted)'
  if (p <= 3) return 'var(--green)'
  if (p <= 10) return 'var(--gold)'
  return 'var(--red)'
}

export default function PageMatrix({ site, pages, getPage, getGsc, selectedUid, onSelect }) {
  return (
    <div className="rounded-lg mt-4 overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-syne font-bold text-[13px]" style={{ color: 'var(--white)' }}>Pages Matrix</span>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{pages.length} pages · {site.name}</span>
      </div>

      <div className="scroll-area" style={{ maxHeight: 340 }}>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr style={{ color: 'var(--muted)' }}>
              <Th className="text-left pl-4">Page</Th>
              <Th className="text-left">Type</Th>
              <Th>Indexed</Th>
              <Th>Best pos</Th>
              <Th>Update ●</Th>
              <Th>Audit ●</Th>
              <Th className="pr-4">Published</Th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => {
              const ps = getPage(p.uid)
              const g = getGsc?.(p.uid)
              const active = p.uid === selectedUid
              const pr = ps.update?.pr
              const indexed = g?.index?.verdict
              return (
                <tr key={p.uid} onClick={() => onSelect(p.uid)} className="cursor-pointer" style={{ borderTop: '1px solid var(--border)', background: active ? 'var(--bg)' : 'transparent' }}>
                  <td className="py-2 pl-4" style={{ color: 'var(--white)' }}>{p.name}</td>
                  <td className="py-2" style={{ color: p.type === 'cms' ? 'var(--gold)' : 'var(--muted)' }}>{p.type === 'cms' ? 'CMS' : 'FILE'}</td>
                  <td className="py-2 text-center">
                    {indexed === 'PASS' ? <span style={{ color: 'var(--green)' }}>✓</span>
                      : indexed === 'FAIL' ? <span style={{ color: 'var(--red)' }}>✕</span>
                      : indexed ? <span style={{ color: 'var(--gold)' }}>!</span>
                      : <span style={{ color: 'var(--border-light)' }}>—</span>}
                  </td>
                  <td className="py-2 text-center" style={{ color: posColor(g?.top?.position) }}>{g?.top ? `#${g.top.position}` : '—'}</td>
                  <td className="py-2 text-center"><div className="flex justify-center"><StatusDot status={ps.update?.status} color="#60a5fa" size={9} /></div></td>
                  <td className="py-2 text-center"><div className="flex justify-center"><StatusDot status={ps.audit?.status} color="#34d399" size={9} /></div></td>
                  <td className="py-2 pr-4 text-center">
                    {pr?.status === 'done' && pr.kind === 'pr' ? (
                      <a href={pr.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="underline" style={{ color: 'var(--blue)' }}>PR ↗</a>
                    ) : pr?.status === 'done' && pr.kind === 'cms' ? (
                      <span style={{ color: 'var(--green)' }}>✓ CMS</span>
                    ) : pr?.status === 'error' ? (
                      <span style={{ color: 'var(--red)' }}>✕</span>
                    ) : (
                      <span style={{ color: 'var(--border-light)' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, className = '' }) {
  return <th className={`py-2 font-normal text-[10px] uppercase tracking-widest text-center ${className}`}>{children}</th>
}
