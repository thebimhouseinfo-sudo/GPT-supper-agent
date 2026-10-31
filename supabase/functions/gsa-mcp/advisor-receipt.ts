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

export function projectCriteriaAdvisoryDecision(projectId: string, input: any) {
  const reject = (status: string, receipt?: any) => ({
    status, advisor_required: true, criteria_write_prepared: false,
    external_advice_check_required: true,
    receipt_format: receipt?.format ?? null,
    receipt_baseline_sha: receipt?.baseline ?? null,
    receipt_scope: receipt?.scope ?? null,
  })
  const intent = input?.intent
  if (['DISCUSSION','DRAFT_EDIT','PLAN_OR_TASK_CHANGE'].includes(intent))
    return { ...reject('ADVISOR_NOT_REQUIRED'), advisor_required: false, external_advice_check_required: false }
  if (intent === 'HUMAN_KEEP_CRITERIA')
    return { ...reject('HUMAN_KEEPS_CRITERIA_NO_WRITE'), advisor_required: false, external_advice_check_required: false }
  if (!['INITIAL_APPROVAL','MATERIAL_CHANGE'].includes(intent)) return reject('CRITERIA_INTENT_INVALID')
  if (input?.criteria_path !== 'projects/' + projectId + '/CRITERIA.md' ||
      !/^[0-9a-f]{40}$/.test(String(input?.criteria_current_sha ?? '')) ||
      typeof input?.criteria_text !== 'string') return reject('CRITERIA_BASELINE_INVALID')
  // A new consultation is not yet in the canonical Criteria file. Accept a
  // proposed scoped receipt as *untrusted evidence for external verification*,
  // never as authority to write. Requiring it to exist in the OLD Criteria file
  // made a legitimate first revision impossible to complete.
  const proposed = input?.delivered_advice
  if (proposed !== undefined) {
    const baseline = String(proposed?.baseline_sha ?? '')
    const scope = String(proposed?.scope ?? '')
    const adviceRef = String(proposed?.advice_ref ?? '')
    const receiptLine = formatAdvisorAdviceReceipt(baseline, scope, adviceRef)
    if (!receiptLine || proposed?.delivered_to_human !== true ||
        baseline !== input.criteria_current_sha ||
        scope !== input.delta_scope ||
        input?.human_decision !== 'APPROVE')
      return reject('ADVISOR_DELIVERY_EVIDENCE_INVALID')
    return {
      status: 'SCOPED_ADVICE_REQUIRES_INDEPENDENT_READBACK',
      advisor_required: true, criteria_write_prepared: false,
      external_advice_check_required: true, receipt_format: 'PROPOSED_CANONICAL',
      receipt_baseline_sha: baseline, receipt_scope: scope,
    }
  }
  const parsed = parseAdvisorAdviceReceipts(input.criteria_text)
  if (parsed.malformed || parsed.receipts.length !== 1)
    return reject('ADVISOR_RECEIPT_MISSING_STALE_OR_OUT_OF_SCOPE')
  const receipt = parsed.receipts[0]
  const baseline = input.advisor_baseline_sha ?? receipt.baseline
  const scope = input.delta_scope === undefined ? receipt.scope : input.delta_scope
  if (baseline === undefined || baseline === null || baseline === '')
    return reject('ADVISOR_BASELINE_SHA_MISSING', receipt)
  if (!/^[0-9a-f]{40}$/.test(String(baseline))) return reject('ADVISOR_BASELINE_SHA_INVALID', receipt)
  if (typeof scope !== 'string' || !scope.trim()) return reject('ADVISOR_SCOPE_MISSING', receipt)
  if (scope.length > ADVISOR_RECEIPT_SCOPE_MAX) return reject('ADVISOR_SCOPE_TOO_LONG', receipt)
  if (baseline !== receipt.baseline) return reject('ADVISOR_BASELINE_MISMATCH', receipt)
  if (scope !== receipt.scope) return reject('ADVISOR_SCOPE_MISMATCH', receipt)
  if (input?.human_decision !== 'APPROVE') return reject('HUMAN_DECISION_PENDING', receipt)
  return {
    status: 'SCOPED_ADVICE_REQUIRES_INDEPENDENT_READBACK',
    advisor_required: true, criteria_write_prepared: false,
    external_advice_check_required: true, receipt_format: receipt.format,
    receipt_baseline_sha: receipt.baseline, receipt_scope: receipt.scope,
  }
}
