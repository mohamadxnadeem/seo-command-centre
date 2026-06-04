// The Anthropic API key is supplied from the UI (localStorage key: anthropic_key)
// or from the VITE_ANTHROPIC_API_KEY build-time env var. Calling the API directly
// from the browser requires the dangerous-direct-browser-access header.
export function getAnthropicKey() {
  return (
    localStorage.getItem('anthropic_key') ||
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    ''
  )
}

export async function runAgent(system, userMsg, tools = []) {
  const apiKey = getAnthropicKey()
  if (!apiKey) {
    throw new Error('No Anthropic API key set. Add it in the AI panel (top bar) before running agents.')
  }

  const messages = [{ role: 'user', content: userMsg }]
  let output = ''
  for (let i = 0; i < 8; i++) {
    const body = { model: 'claude-sonnet-4-20250514', max_tokens: 1000, system, messages }
    if (tools.length) body.tools = tools
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    messages.push({ role: 'assistant', content: data.content })
    output += data.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
    if (data.stop_reason === 'end_turn') break
    const tools_ = data.content.filter(b => b.type === 'tool_use')
    if (!tools_.length) break
    // Server-side tools (web_search) are executed by the API itself; if the model
    // emits a client tool_use we acknowledge it so the loop can continue.
    messages.push({
      role: 'user',
      content: tools_.map(t => ({ type: 'tool_result', tool_use_id: t.id, content: t.content ? JSON.stringify(t.content) : 'completed' }))
    })
  }
  return output
}
