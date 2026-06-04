import { useState } from 'react'
import { testDjangoConnection } from '../services/django'
import { Panel, Field } from './GithubPanel'

export default function BackendPanel({ settings, setSetting, onClose }) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)

  async function test() {
    setTesting(true)
    setResult(null)
    try {
      const ok = await testDjangoConnection(settings.djangoUrl)
      setResult(ok ? { ok: true, msg: '✓ Reached Django API (/api/experiences/all/)' } : { ok: false, msg: '✕ Django reachable but endpoint not OK' })
    } catch (e) {
      setResult({ ok: false, msg: `✕ ${e.message}` })
    }
    setTesting(false)
  }

  return (
    <Panel title="Django CMS Configuration" onClose={onClose}>
      <Field label="API URL" value={settings.djangoUrl} onChange={(v) => setSetting('djangoUrl', v)} />
      <Field
        label="SEO Update Key (X-SEO-Key)"
        type="password"
        value={settings.seoKey}
        placeholder="matches SEO_UPDATE_KEY on the server"
        onChange={(v) => setSetting('seoKey', v)}
      />
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        The SEO key is sent as <code style={{ color: 'var(--text)' }}>X-SEO-Key</code> to the CMS update endpoints
        (<code style={{ color: 'var(--text)' }}>/api/experiences/&lt;id&gt;/seo/</code> and{' '}
        <code style={{ color: 'var(--text)' }}>/api/cars-for-hire/&lt;id&gt;/seo/</code>). It must match the{' '}
        <code style={{ color: 'var(--text)' }}>SEO_UPDATE_KEY</code> env var on the Django server. Tours &amp; Vehicles
        are loaded live from this API.
      </p>

      <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }} />
      <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--blue)' }}>Google Search Console</div>
      <Field label="CTC property" value={settings.ctcGscProperty} onChange={(v) => setSetting('ctcGscProperty', v)} />
      <Field label="Sigma property" value={settings.sigmaGscProperty} onChange={(v) => setSetting('sigmaGscProperty', v)} />
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Domain properties use <code style={{ color: 'var(--text)' }}>sc-domain:example.com</code>; URL-prefix properties use the full URL.
        Rankings + index status come from a serverless proxy that needs <code style={{ color: 'var(--text)' }}>GSC_SERVICE_ACCOUNT_JSON</code> set on Vercel.
      </p>

      <button
        onClick={test}
        disabled={testing}
        className="mt-1 px-4 py-2 rounded-md text-[12px] font-semibold disabled:opacity-40"
        style={{ background: 'var(--gold)', color: '#04140b' }}
      >
        {testing ? 'Testing…' : 'Test Connection'}
      </button>

      {result && (
        <div className="mt-2 text-[11px] p-2 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: result.ok ? 'var(--green)' : 'var(--red)' }}>
          {result.msg}
        </div>
      )}
    </Panel>
  )
}
