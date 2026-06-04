// Minimal dependency-free line diff (LCS-based). Returns a list of
// { t: 'ctx' | 'add' | 'del', text } rows.
export function lineDiff(a = '', b = '') {
  const aL = a.split('\n')
  const bL = b.split('\n')
  const n = aL.length
  const m = bL.length

  // LCS length table.
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = aL[i] === bL[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const out = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (aL[i] === bL[j]) {
      out.push({ t: 'ctx', text: aL[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ t: 'del', text: aL[i] })
      i++
    } else {
      out.push({ t: 'add', text: bL[j] })
      j++
    }
  }
  while (i < n) out.push({ t: 'del', text: aL[i++] })
  while (j < m) out.push({ t: 'add', text: bL[j++] })
  return out
}

// Collapse long runs of unchanged context to keep the view readable.
// Keeps `pad` context lines around each change; replaces the rest with a marker.
export function collapseDiff(rows, pad = 2) {
  const keep = new Array(rows.length).fill(false)
  rows.forEach((r, idx) => {
    if (r.t !== 'ctx') {
      for (let k = Math.max(0, idx - pad); k <= Math.min(rows.length - 1, idx + pad); k++) keep[k] = true
    }
  })
  const result = []
  let hidden = 0
  rows.forEach((r, idx) => {
    if (keep[idx]) {
      if (hidden > 0) {
        result.push({ t: 'gap', text: `… ${hidden} unchanged line${hidden === 1 ? '' : 's'} …` })
        hidden = 0
      }
      result.push(r)
    } else {
      hidden++
    }
  })
  if (hidden > 0) result.push({ t: 'gap', text: `… ${hidden} unchanged line${hidden === 1 ? '' : 's'} …` })
  return result
}

export function diffStats(rows) {
  let add = 0
  let del = 0
  for (const r of rows) {
    if (r.t === 'add') add++
    else if (r.t === 'del') del++
  }
  return { add, del }
}
