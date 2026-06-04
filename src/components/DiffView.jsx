import { useMemo } from 'react'
import { lineDiff, collapseDiff, diffStats } from '../lib/diff'

export default function DiffView({ original, proposed }) {
  const { rows, stats } = useMemo(() => {
    const full = lineDiff(original || '', proposed || '')
    return { rows: collapseDiff(full, 2), stats: diffStats(full) }
  }, [original, proposed])

  return (
    <div>
      <div className="flex items-center gap-3 mb-1 text-[10px]">
        <span style={{ color: 'var(--green)' }}>+{stats.add}</span>
        <span style={{ color: 'var(--red)' }}>−{stats.del}</span>
        <span style={{ color: 'var(--muted)' }}>changed lines</span>
      </div>
      <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {rows.map((r, i) => {
          if (r.t === 'gap') {
            return (
              <div key={i} className="px-2 py-0.5 text-[10px] text-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                {r.text}
              </div>
            )
          }
          const styles =
            r.t === 'add'
              ? { background: 'rgba(22,160,90,0.14)', color: 'var(--green)', sign: '+' }
              : r.t === 'del'
              ? { background: 'rgba(248,113,113,0.12)', color: 'var(--red)', sign: '−' }
              : { background: 'transparent', color: 'var(--muted)', sign: ' ' }
          return (
            <pre
              key={i}
              className="px-2 py-px text-[10px] whitespace-pre-wrap leading-snug"
              style={{ background: styles.background, color: styles.color, margin: 0 }}
            >
              <span style={{ opacity: 0.6, userSelect: 'none' }}>{styles.sign} </span>
              {r.text || ' '}
            </pre>
          )
        })}
      </div>
    </div>
  )
}
