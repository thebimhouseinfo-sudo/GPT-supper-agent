import { normalizeGithubRepo } from './platform-utils.ts'

// GSA1: pure project name and branch validation, extracted without behavior changes.
export function safeProjectName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').slice(0,120)
}

export function validIntegrationBranch(name: string) {
  return typeof name === 'string' && name.length > 0 && name.length <= 128 &&
    !name.startsWith('/') && !name.endsWith('/') && !name.endsWith('.lock') &&
    !name.includes('..') && !name.includes('//') && !name.includes('@{') &&
    /^[A-Za-z0-9][A-Za-z0-9_.\/-]*$/.test(name) &&
    name.split('/').every((segment) => segment !== '.' && segment !== '..' && !segment.startsWith('.'))
}

export function knowledgePath(projectId: string, knowledgeId: string, slug: string) {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'knowledge'
  return 'projects/' + projectId + '/KNOWLEDGE/' + knowledgeId + '-' + safeSlug + '.md'
}

export function isRetiredSourceBranch(rows: Array<{ repository_url: string; branch: string }>, repositoryUrl: string, branch: string | null | undefined): boolean {
  return !!branch && rows.some((row) => row.repository_url.toLowerCase() === repositoryUrl.toLowerCase() && row.branch === branch)
}

export function parseRetiredBranchRows(text: string): Array<{ repository_url: string; branch: string; sha: string }> | null {
  const rows: Array<{ repository_url: string; branch: string; sha: string }> = []
  const seen = new Set<string>()
  let inSection = false
  for (const line of text.split('\n')) {
    if (/^## /.test(line)) {
      inSection = /^## Retired Branches(?:\s|$)/.test(line)
      continue
    }
    if (!inSection || !/^\s*-\s*/.test(line)) continue
    const match = line.match(/^\s*-\s*(https:\/\/github\.com\/[^\s|]+)\s*\|\s*branch=([^\s|]+)\s*\|\s*sha=([a-f0-9]{40})\s*\|\s*status=RETIRED\s*$/i)
    if (!match || !validIntegrationBranch(match[2])) return null
    const repo = normalizeGithubRepo(match[1])
    if (!repo) return null
    const key = repo.url.toLowerCase() + '|' + match[2]
    if (seen.has(key)) return null
    seen.add(key)
    rows.push({ repository_url: repo.url, branch: match[2], sha: match[3].toLowerCase() })
  }
  return rows
}

export function resolveProjectCriteriaIntake(mode: 'NEW' | 'EXISTING', state: 'PRESENT' | 'ABSENT' | 'UNKNOWN', observedSource: string) {
  const observed = typeof observedSource === 'string' && observedSource.trim().length > 0
  if (mode === 'NEW') return { disposition: 'CREATE_DRAFT_IF_ABSENT' as const, source_derived: false, review: 'NEW: ask Human for desired GOAL, WHAT/WHY and acceptance before Criteria approval; do not create an Implementation Plan or code.' }
  if (state === 'PRESENT') return { disposition: 'READ_EXISTING_NO_WRITE' as const, source_derived: false, review: 'EXISTING with Criteria: validate with Human that the existing Criteria describes the intended product (not just design/code); compare actual source for achieved, missing, excess and drift. Source is evidence, not approval.' + (observed ? ' Source observation (independent read required): ' + observedSource.slice(0, 600) : ' Source comparison UNVERIFIED until inspection.') }
  if (state === 'UNKNOWN') return { disposition: 'INSPECT_FIRST_NO_WRITE' as const, source_derived: false, review: 'EXISTING: inspect canonical Criteria in Project Memory before preparing anything. Never overwrite or infer approval.' }
  if (!observed) return { disposition: 'INSPECT_FIRST_NO_WRITE' as const, source_derived: true, review: 'EXISTING without Criteria: first read actual source/docs; draft Criteria only if none exists.' }
  if (/CRITERIA(?:\.md)?/i.test(observedSource)) return { disposition: 'READ_EXISTING_NO_WRITE' as const, source_derived: true, review: 'EXISTING with source Criteria: independently inspect it and actual Human approval. Reuse an approved source document without duplicate Project Memory registration; if draft or unapproved, use the existing approval process.' }
  return { disposition: 'INSPECT_FIRST_NO_WRITE' as const, source_derived: true, review: 'EXISTING source code is not evidence that a Criteria file exists. Inspect project documents first; create a Criteria draft only if genuinely absent, then obtain Human approval.' }
}

export function projectTaskCapabilityAssessment(projectId: string, role: 'coder' | 'tester', taskId: string | undefined,
  requiresDomain: boolean, resolved: any, evidence: any[] = []) {
  if (!requiresDomain) return { readiness: 'GENERIC_READY', ready_for_task: true, matched_evidence_refs: [] as string[] }
  const paths = [...(resolved.harness_path ? [resolved.harness_path] : []), ...(resolved.skill_paths ?? [])]
  if (resolved.status === 'DENIED' || !paths.length) return {
    readiness: 'BLOCKED_REQUIRED_ADDIN', ready_for_task: false, matched_evidence_refs: [] as string[],
  }
  // A caller-supplied test result is not an authenticated, independently read-back Verification.
  // Keep the state non-ready even if all claims match. Orchestrator must read back actual
  // skill files and functional probe evidence before M3/M5 may accept capability readiness.
  const matches = taskId && paths.every((path: string) => evidence.some((e: any) =>
    e.project_id === projectId && e.role === role && e.task_id === taskId &&
    e.path === path && /^[0-9a-f]{40}$/.test(String(e.file_sha ?? '')) &&
    e.result === 'FUNCTIONAL' && typeof e.verification_ref === 'string' &&
    e.verification_ref.startsWith('projects/' + projectId + '/VERIFICATION/')))
  return {
    readiness: matches ? 'EVIDENCE_PRESENT_UNVERIFIED' : 'CONFIGURED_UNVERIFIED',
    ready_for_task: false,
    matched_evidence_refs: matches ? [...new Set(paths.map((p: string) => evidence.find((e: any) => e.path === p && e.project_id === projectId && e.role === role && e.task_id === taskId)?.verification_ref).filter(Boolean))] : [],
  }
}

export function projectCriteriaBindingError(projectId: string, planKind: string, binding: any): string | null {
  if (planKind !== 'PROJECT_PLAN') return null
  if (!binding || binding.criteria_path !== 'projects/' + projectId + '/CRITERIA.md' ||
      !/^[0-9a-f]{40}$/.test(String(binding.criteria_blob_sha || '')) ||
      binding.approval_status !== 'APPROVED') {
    return 'PROJECT_CRITERIA_NOT_BOUND: a Project Plan requires approved Project CRITERIA.md exact blob SHA, not an AI draft or source default.'
  }
  return null
}
