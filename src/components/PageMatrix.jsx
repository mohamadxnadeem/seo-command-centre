import StatusDot from './StatusDot'
import { AGENTS } from '../config/agents'

function scoreColor(score) {
  if (score == null) return 'var(--muted)'
  if (score >= 80) return 'var(--green)'
  if (score >= 50) return 'var(--gold)'
  return 'var(--red)'
}

export default function PageMatrix({ site, getPage, selectedPageId, onSelectPage }) {
  return (
    <div
      className="rounded-lg mt-4 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-syne font-bold text-[13px]" style={{ color: 'var(--white)' }}>
          Pages Matrix
        </span>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
          {site.pages.length} pages · {site.name}
        </span>
      </div>

      <div className="scroll-area" style={{ maxHeight: 360 }}>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr style={{ color: 'var(--muted)' }}>
              <Th className="text-left pl-4">Page</Th>
              <Th className="text-left">Target keyword</Th>
              <Th>Research</Th>
              <Th>Audit</Th>
              <Th>Updater</Th>
              <Th>Score</Th>
              <Th>Django</Th>
              <Th className="pr-4">GitHub</Th>
            </tr>
          </thead>
          <tbody>
            {site.pages.map((p) => {
              const st = getPage(site.id, p.id)
              const active = p.id === selectedPageId
              return (
                <tr
                  key={p.id}
                  onClick={() => onSelectPage(p.id)}
                  className="cursor-pointer"
                  style={{
                    borderTop: '1px solid var(--border)',
                    background: active ? 'var(--bg)' : 'transparent'
                  }}
                >
                  <td className="py-2 pl-4" style={{ color: 'var(--white)' }}>
                    {p.name}
                  </td>
                  <td className="py-2" style={{ color: 'var(--muted)' }}>
                    {p.primaryKw}
                  </td>
                  {AGENTS.map((a) => (
                    <td key={a.key} className="py-2 text-center">
                      <div className="flex justify-center">
                        <StatusDot status={st[a.key]?.status} color={a.color} size={9} />
                      </div>
                    </td>
                  ))}
                  <td className="py-2 text-center font-medium" style={{ color: scoreColor(st.score) }}>
                    {st.score == null ? '—' : st.score}
                  </td>
                  <td className="py-2 text-center">
                    {st.django?.status === 'done' ? (
                      <span style={{ color: 'var(--green)' }}>✓</span>
                    ) : st.django?.status === 'error' ? (
                      <span style={{ color: 'var(--red)' }}>✕</span>
                    ) : (
                      <span style={{ color: 'var(--border-light)' }}>—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-center">
                    {st.github?.url ? (
                      <a
                        href={st.github.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="underline"
                        style={{ color: 'var(--blue)' }}
                      >
                        {st.github.sha?.slice(0, 7)} ↗
                      </a>
                    ) : st.github?.status === 'error' ? (
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
  return (
    <th className={`py-2 font-normal text-[10px] uppercase tracking-widest text-center ${className}`}>
      {children}
    </th>
  )
}
