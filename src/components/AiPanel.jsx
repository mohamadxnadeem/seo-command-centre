import { Panel, Field } from './GithubPanel'

// Anthropic API key configuration (claude-sonnet-4-20250514 + web_search).
export default function AiPanel({ settings, setSetting, onClose }) {
  return (
    <Panel title="Anthropic AI Configuration" onClose={onClose}>
      <Field
        label="Anthropic API Key"
        type="password"
        value={settings.anthropicKey}
        placeholder="sk-ant-…"
        onChange={(v) => setSetting('anthropicKey', v)}
      />
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Model: <code style={{ color: 'var(--text)' }}>claude-sonnet-4-20250514</code> with the{' '}
        <code style={{ color: 'var(--text)' }}>web_search_20250305</code> tool. Get a key at{' '}
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="underline"
          style={{ color: 'var(--blue)' }}
        >
          console.anthropic.com
        </a>
        . The key is stored in your browser localStorage only and sent directly to the Anthropic API.
      </p>
    </Panel>
  )
}
