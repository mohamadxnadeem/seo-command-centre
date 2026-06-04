import { SITE_LIST } from '../config/sites'
import StatusDot from './StatusDot'

export default function TopBar({
  activeSiteId,
  onSelectSite,
  onToggleDjango,
  onToggleGithub,
  onToggleAi,
  onToggleReport,
  reportOpen,
  djangoReady,
  githubReady,
  aiReady
}) {
  return (
    <header
      className="flex items-center gap-1 px-4 shrink-0"
      style={{ height: 57, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mr-4">
        <div
          className="font-syne font-extrabold text-[15px] tracking-tight"
          style={{ color: 'var(--white)' }}
        >
          SEO<span style={{ color: 'var(--green)' }}>·</span>COMMAND
        </div>
      </div>

      {/* Site tabs */}
      <div className="flex items-center gap-1">
        {SITE_LIST.map((s) => {
          const active = s.id === activeSiteId
          return (
            <button
              key={s.id}
              onClick={() => onSelectSite(s.id)}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center gap-2"
              style={{
                background: active ? 'var(--bg)' : 'transparent',
                border: `1px solid ${active ? s.color : 'transparent'}`,
                color: active ? 'var(--white)' : 'var(--muted)'
              }}
            >
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }}
              />
              {s.name}
            </button>
          )
        })}
      </div>

      <div className="flex-1" />

      {/* Config buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleReport}
          className="px-3 py-1.5 rounded-md text-[12px] font-semibold"
          style={{
            border: `1px solid var(--green)`,
            color: reportOpen ? '#04140b' : 'var(--green)',
            background: reportOpen ? 'var(--green)' : 'transparent',
          }}
        >
          ▤ Report
        </button>
        <ConfigButton label="AI" ok={aiReady} onClick={onToggleAi} />
        <ConfigButton label="Django" ok={djangoReady} onClick={onToggleDjango} />
        <ConfigButton label="GitHub" ok={githubReady} onClick={onToggleGithub} />

        <div
          className="flex items-center gap-2 ml-2 px-2.5 py-1 rounded-md"
          style={{ border: '1px solid var(--border)' }}
        >
          <StatusDot status="done" color="var(--green)" size={8} />
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            LIVE
          </span>
        </div>
      </div>
    </header>
  )
}

function ConfigButton({ label, ok, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-2 transition-colors"
      style={{
        border: '1px solid var(--border)',
        color: 'var(--text)',
        background: 'var(--bg)'
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: ok ? 'var(--green)' : 'var(--border-light)',
          display: 'inline-block'
        }}
      />
      {label}
    </button>
  )
}
