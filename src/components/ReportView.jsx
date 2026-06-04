import { useState, useMemo } from 'react'
import { buildAuditDigest, buildReportMarkdown, countAudits, downloadText } from '../lib/report'

export default function ReportView({ site, entries, pagesState, report, onGenerate, onClose }) {
  const [copied, setCopied] = useState(false)
  const auditCount = countAudits(entries, pagesState)
  const planStatus = report?.status

  const markdown = useMemo(
    () => buildReportMarkdown(site, entries, pagesState, report?.output),
    [site, entries, pagesState, report]
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const auditedEntries = entries.filter((e) => pagesState[e.uid]?.audit?.status === 'done')

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h1 className="font-syne font-extrabold text-[20px]" style={{ color: 'var(--white)' }}>Report — {site.name}</h1>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{auditCount} of {entries.length} pages audited</span>
        <div className="flex-1" />
        <button
          onClick={() => onGenerate(buildAuditDigest(entries, pagesState))}
          disabled={planStatus === 'running' || auditCount === 0}
          className="px-3 py-1.5 rounded-md text-[12px] font-semibold disabled:opacity-40"
          style={{ background: 'var(--green)', color: '#04140b' }}
        >
          {planStatus === 'running' ? 'Synthesising…' : 'Generate site action plan'}
        </button>
        <button onClick={copy} className="px-3 py-1.5 rounded-md text-[12px] font-medium" style={{ border: '1px solid var(--border-light)', color: 'var(--text)' }}>
          {copied ? '✓ Copied' : 'Copy Markdown'}
        </button>
        <button onClick={() => downloadText(`seo-report-${site.id}.md`, markdown)} className="px-3 py-1.5 rounded-md text-[12px] font-medium" style={{ border: '1px solid var(--border-light)', color: 'var(--text)' }}>
          Download .md
        </button>
        <button onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px]" style={{ color: 'var(--muted)' }}>Close ✕</button>
      </div>

      {auditCount === 0 && (
        <div className="rounded-lg p-4 mb-4 text-[12px]" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          Run the <strong style={{ color: 'var(--text)' }}>Copywriting Audit</strong> on some pages first (or use “Audit all pages” in the sidebar). The action plan synthesises those audits.
        </div>
      )}

      {/* Action plan */}
      <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border-light)' }}>
        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--green)' }}>Site Action Plan</div>
        {planStatus === 'error' && <div className="text-[11px]" style={{ color: 'var(--red)' }}>{report.error}</div>}
        {planStatus === 'running' && <div className="text-[11px]" style={{ color: 'var(--green)' }}>Reading all audits and prioritising…</div>}
        {report?.output ? (
          <pre className="text-[12px] whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text)' }}>{report.output}</pre>
        ) : planStatus !== 'running' ? (
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>Not generated yet.</div>
        ) : null}
      </div>

      {/* Per-page audits */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-2.5 text-[10px] uppercase tracking-widest" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
          Per-page audits ({auditedEntries.length})
        </div>
        <div className="scroll-area" style={{ maxHeight: 480 }}>
          {auditedEntries.length === 0 && <div className="p-4 text-[11px]" style={{ color: 'var(--muted)' }}>No audits yet.</div>}
          {auditedEntries.map((e) => (
            <details key={e.uid} style={{ borderTop: '1px solid var(--border)' }}>
              <summary className="px-4 py-2 cursor-pointer text-[12px] flex items-center gap-2" style={{ color: 'var(--white)' }}>
                <span className="flex-1">{e.name}</span>
                <span className="text-[10px]" style={{ color: e.type === 'cms' ? 'var(--gold)' : 'var(--muted)' }}>{e.type === 'cms' ? 'CMS' : 'FILE'}</span>
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{e.path}</span>
              </summary>
              <pre className="px-4 pb-3 text-[11px] whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text)' }}>{pagesState[e.uid].audit.output}</pre>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
