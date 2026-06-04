export default function PageHeader({ site, page }) {
  if (!page) return null
  return (
    <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: site.color, border: `1px solid ${site.color}` }}>{page.cat}</span>
            <span
              className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ color: page.type === 'cms' ? 'var(--gold)' : 'var(--muted)', border: `1px solid ${page.type === 'cms' ? 'var(--gold)' : 'var(--border)'}` }}
            >
              {page.type === 'cms' ? 'CMS · Django' : 'File · GitHub'}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{site.name}</span>
          </div>
          <h1 className="font-syne font-extrabold text-[22px] leading-tight" style={{ color: 'var(--white)' }}>{page.name}</h1>
          <a href={`${site.baseUrl}${page.path}`} target="_blank" rel="noreferrer" className="text-[12px] hover:underline" style={{ color: 'var(--blue)' }}>
            {site.baseUrl}{page.path} ↗
          </a>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
            <Block label="Primary keyword" value={page.primaryKw} color={site.color} />
            {page.secondary?.length > 0 && <Block label="Secondary" value={page.secondary.join(' · ')} />}
            <Block label={page.type === 'cms' ? 'CMS source' : 'File'} value={page.type === 'cms' ? `${page.kind} #${page.cmsId}` : page.filePath} mono />
          </div>
        </div>
      </div>
    </div>
  )
}

function Block({ label, value, color, mono }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className={`text-[12px] truncate ${mono ? 'font-mono' : ''}`} style={{ color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}
