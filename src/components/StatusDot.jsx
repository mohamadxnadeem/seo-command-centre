// Reusable status dot. status: idle | running | done | error
export default function StatusDot({ status, color, size = 9, title }) {
  const idle = '#162b1c'
  const red = '#f87171'
  let bg = idle
  let pulse = false
  if (status === 'running') {
    bg = color
    pulse = true
  } else if (status === 'done') {
    bg = color
  } else if (status === 'error') {
    bg = red
  }
  return (
    <span
      title={title || status}
      className={pulse ? 'dot-pulse' : ''}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        '--pulse-color': color,
        flex: '0 0 auto'
      }}
    />
  )
}
