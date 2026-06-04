// Build a digest of all completed audits (input to the action-plan synthesis).
export function buildAuditDigest(entries, pagesState) {
  const chunks = []
  for (const e of entries) {
    const audit = pagesState[e.uid]?.audit
    if (audit?.status === 'done' && audit.output) {
      chunks.push(
        `## ${e.name} (${e.path}) [${e.type === 'cms' ? 'CMS' : 'file'}]\n` +
          `Primary keyword: ${e.primaryKw}\n\n${audit.output.trim()}\n`
      )
    }
  }
  return chunks.join('\n---\n\n')
}

export function countAudits(entries, pagesState) {
  return entries.filter((e) => pagesState[e.uid]?.audit?.status === 'done').length
}

// Assemble the full exportable Markdown report.
export function buildReportMarkdown(site, entries, pagesState, actionPlan) {
  const date = new Date().toLocaleString()
  const digest = buildAuditDigest(entries, pagesState)
  const updates = entries
    .map((e) => {
      const pr = pagesState[e.uid]?.update?.pr
      if (pr?.status === 'done' && pr.kind === 'pr') return `- ${e.name}: PR → ${pr.url}`
      if (pr?.status === 'done' && pr.kind === 'cms') return `- ${e.name}: applied to CMS (#${pr.result?.id})`
      return null
    })
    .filter(Boolean)

  return (
    `# SEO & Copy Report — ${site.name}\n\n` +
    `*Site:* ${site.baseUrl}  \n*Generated:* ${date}\n\n` +
    `## Site Action Plan\n\n${actionPlan?.trim() || '_Not generated yet — click "Generate site action plan"._'}\n\n` +
    (updates.length ? `## Published changes\n\n${updates.join('\n')}\n\n` : '') +
    `## Per-page audits\n\n${digest || '_No audits run yet._'}\n`
  )
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
