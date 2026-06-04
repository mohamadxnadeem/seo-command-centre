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
      const ok = await testDjangoConnection(settings.djangoUrl, settings.djangoToken)
      setResult(
        ok
          ? { ok: true, msg: '✓ Connected to Django API' }
          : { ok: false, msg: '✕ Django responded but not OK (check token / endpoint)' }
      )
    } catch (e) {
      setResult({ ok: false, msg: `✕ ${e.message}` })
    }
    setTesting(false)
  }

  return (
    <Panel title="Django Backend Configuration" onClose={onClose}>
      <Field
        label="API URL"
        value={settings.djangoUrl}
        onChange={(v) => setSetting('djangoUrl', v)}
      />
      <Field
        label="Auth Token"
        type="password"
        value={settings.djangoToken}
        placeholder="DRF token…"
        onChange={(v) => setSetting('djangoToken', v)}
      />

      <button
        onClick={test}
        disabled={testing}
        className="mt-1 px-4 py-2 rounded-md text-[12px] font-semibold disabled:opacity-40"
        style={{ background: 'var(--gold)', color: '#04140b' }}
      >
        {testing ? 'Testing…' : 'Test Connection'}
      </button>

      {result && (
        <div
          className="mt-2 text-[11px] p-2 rounded-md"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: result.ok ? 'var(--green)' : 'var(--red)'
          }}
        >
          {result.msg}
        </div>
      )}
    </Panel>
  )
}
