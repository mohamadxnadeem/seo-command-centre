import { useState } from 'react'
import { detectStructure, getLastCommit } from '../services/github'

export default function GithubPanel({ settings, setSetting, onClose }) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)

  async function test() {
    setTesting(true)
    setResult(null)
    const repos = [
      { label: 'CTC', repo: settings.ctcRepo },
      { label: 'Sigma', repo: settings.sigmaRepo }
    ]
    const out = []
    for (const r of repos) {
      try {
        const structure = await detectStructure(r.repo, settings.githubToken)
        const commit = await getLastCommit(r.repo, settings.branch, settings.githubToken)
        out.push({
          ok: true,
          label: r.label,
          repo: r.repo,
          structure,
          commit: `${commit.sha.slice(0, 7)} — ${(commit.message || '').split('\n')[0]}`
        })
      } catch (e) {
        out.push({ ok: false, label: r.label, repo: r.repo, error: e.message })
      }
    }
    setResult(out)
    setTesting(false)
  }

  return (
    <Panel title="GitHub Configuration" onClose={onClose}>
      <Field
        label="GitHub Personal Access Token"
        type="password"
        value={settings.githubToken}
        placeholder="ghp_…"
        onChange={(v) => setSetting('githubToken', v)}
      />
      <Field
        label="CTC Repository"
        value={settings.ctcRepo}
        onChange={(v) => setSetting('ctcRepo', v)}
      />
      <Field
        label="Sigma Repository"
        value={settings.sigmaRepo}
        onChange={(v) => setSetting('sigmaRepo', v)}
      />
      <Field label="Branch" value={settings.branch} onChange={(v) => setSetting('branch', v)} />

      <button
        onClick={test}
        disabled={testing || !settings.githubToken}
        className="mt-1 px-4 py-2 rounded-md text-[12px] font-semibold disabled:opacity-40"
        style={{ background: 'var(--blue)', color: '#04140b' }}
      >
        {testing ? 'Testing…' : 'Test Connection'}
      </button>

      {result && (
        <div className="mt-3 flex flex-col gap-2">
          {result.map((r) => (
            <div
              key={r.label}
              className="text-[11px] p-2 rounded-md"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              {r.ok ? (
                <span style={{ color: 'var(--green)' }}>
                  ✓ {r.label} connected · {r.repo} · {r.structure} router · last: {r.commit}
                </span>
              ) : (
                <span style={{ color: 'var(--red)' }}>
                  ✕ {r.label} ({r.repo}): {r.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

export function Panel({ title, onClose, children }) {
  return (
    <div
      className="px-4 py-4"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-syne font-bold text-[13px]" style={{ color: 'var(--white)' }}>
          {title}
        </span>
        <button onClick={onClose} className="text-[12px]" style={{ color: 'var(--muted)' }}>
          Close ✕
        </button>
      </div>
      <div className="flex flex-col gap-2.5 max-w-2xl">{children}</div>
    </div>
  )
}

export function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 rounded-md text-[12px] outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </label>
  )
}
