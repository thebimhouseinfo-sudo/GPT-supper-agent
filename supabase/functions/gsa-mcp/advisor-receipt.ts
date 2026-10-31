// GSA1: keep the scoped Advisor receipt serializer and parser together.
const ADVISOR_RECEIPT_SCOPE_MAX = 512

export function formatAdvisorAdviceReceipt(baseline: string, scope: string, adviceRef: string): string | null {
  const valid = (value: string, max: number) => typeof value === 'string' && value.trim() === value &&
    value.length > 0 && value.length <= max && !/[\r\n|]/.test(value)
  if (!/^[0-9a-f]{40}$/.test(baseline) || !valid(scope, ADVISOR_RECEIPT_SCOPE_MAX) ||
      !valid(adviceRef, 300) || adviceRef === 'PENDING') return null
  return 'ADVISOR SIGNED: ADVISED | BASELINE=' + baseline + ' | SCOPE=' + scope + ' | ADVICE_REF=' + adviceRef
}

export function parseAdvisorAdviceReceipts(text: string) {
  const lines = text.split(/\r?\n/)
  const receipts: Array<{ baseline: string, scope: string, adviceRef: string, format: string }> = []
  let malformed = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!/^(?:-\s*)?ADVISOR SIGNED:\s*ADVISED\b/.test(line)) continue
    const oneLine = line.match(/^(?:-\s*)?ADVISOR SIGNED: ADVISED \| BASELINE=([0-9a-f]{40}) \| SCOPE=([^|\r\n]+) \| ADVICE_REF=([^|\r\n]+)$/)
    if (oneLine) {
      const [, baseline, scope, adviceRef] = oneLine
      if (!formatAdvisorAdviceReceipt(baseline, scope, adviceRef)) malformed = true
      else receipts.push({ baseline, scope, adviceRef, format: 'CANONICAL' })
      continue
    }
    if (!/^(?:-\s*)?ADVISOR SIGNED:\s*ADVISED\s+[—-]\s+\S/.test(line)) {
      malformed = true
      continue
    }
    const fields: Record<string, string> = {}
    let cursor = i + 1
    for (; cursor < lines.length && cursor <= i + 8; cursor++) {
      const row = lines[cursor]
      if (!/^\s{2,}-\s+/.test(row)) break
      const field = row.match(/^\s{2,}-\s+(advisor_baseline_sha|delta_scope|advice_reference):\s*(.+?)\s*$/)
      if (!field) break
      if (fields[field[1]] !== undefined) { malformed = true; break }
      let value = field[2].trim()
      const tick = String.fromCharCode(96)
      if (value.startsWith(tick) && value.endsWith(tick)) value = value.slice(1, -1)
      fields[field[1]] = value
    }
    i = cursor - 1
    if (!fields.advisor_baseline_sha || !fields.delta_scope || !fields.advice_reference ||
        !formatAdvisorAdviceReceipt(fields.advisor_baseline_sha, fields.delta_scope, fields.advice_reference))
      malformed = true
    else receipts.push({ baseline: fields.advisor_baseline_sha, scope: fields.delta_scope,
      adviceRef: fields.advice_reference, format: 'LEGACY_MARKDOWN' })
  }
  return { receipts, malformed }
}
