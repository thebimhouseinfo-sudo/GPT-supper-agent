import { validIntegrationBranch, isRetiredSourceBranch, parseRetiredBranchRows } from './project-utils.ts'
import { normalizeGithubRepo } from './platform-utils.ts'
import { parseWorkingBranchRows } from './branch-governance.ts'
import type { ExecutionContract } from './runtime-contract.ts'

export function buildProjectManifest(args: {
  projectId: string
  name: string
  lifecycle: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  repoUrl: string
  purpose?: string | null
  createdAt: string
  updatedAt: string
}) {
  const purpose = (args.purpose ?? '').replace(/\r?\n/g, ' ').trim()
  return [
    '---',
    'project_id: ' + args.projectId,
    'name: ' + args.name,
    'lifecycle: ' + args.lifecycle,
    'created_at: ' + args.createdAt,
    'updated_at: ' + args.updatedAt,
    'repo_mode: SINGLE',
    'repo_registry_status: CONFIRMED',
    'primary_repo_url: ' + args.repoUrl,
    'repo_relation: OWNED',
    'repo_url: ' + args.repoUrl,
    purpose ? 'purpose: ' + purpose : 'purpose:',
    '---',
    '',
    '# Project: ' + args.name,
    '',
    '## Repositories',
    '- PRIMARY | OWNED | ' + args.repoUrl,
    '',
    '## Runtime',
    '- Project Memory lives in the configured GSA Memory Repo.',
    '- Source truth lives in the registered Project repositories above.',
    '',
  ].join('\n')
}

// An optional, additive Project Memory contract. Branch retirement is not Git ref deletion.


export function parseProjectManifest(text: string) {
  const values: Record<string, string> = {}
  for (const rawLine of text.split('\n')) {
    const idx = rawLine.indexOf(':')
    if (idx <= 0) continue
    const key = rawLine.slice(0, idx).trim()
    const value = rawLine.slice(idx + 1).trim()
    values[key] = value
  }
  const project_id = values.project_id ?? ''
  const name = values.name ?? ''
  const lifecycle = values.lifecycle ?? ''
  const legacyRepo = values.repo_url ?? ''
  const primary_repo_url = values.primary_repo_url || legacyRepo
  const purpose = values.purpose ?? ''
  const created_at = values.created_at ?? ''
  const updated_at = values.updated_at ?? ''
  if (!PROJECT_ID_PATTERN.test(project_id) || !name || !normalizeGithubRepo(primary_repo_url) || !['ACTIVE','PAUSED','ARCHIVED'].includes(lifecycle)) return null

  const repositories: Array<{ role: string; relation: string; url: string }> = []
  for (const rawLine of text.split('\n')) {
    const m = rawLine.match(/^\s*-\s*(PRIMARY|DEPENDENCY|SUPPORT|REFERENCE)\s*\|\s*(OWNED|REFERENCED)\s*\|\s*(https:\/\/github\.com\/[^\s]+)\s*$/i)
    if (m) repositories.push({ role: m[1].toUpperCase(), relation: m[2].toUpperCase(), url: m[3].replace(/\.git$/, '') })
  }
  if (!repositories.length) repositories.push({ role: 'PRIMARY', relation: 'OWNED', url: primary_repo_url })
  const dedup = [...new Map(repositories.map((r) => [r.url.toLowerCase(), r])).values()]
  const repo_mode = values.repo_mode === 'MULTI' || dedup.length > 1 ? 'MULTI' : 'SINGLE'
  const repo_registry_status = values.repo_registry_status || (values.repo_mode ? 'CONFIRMED' : 'LEGACY_UNASSESSED')
  const retired_branches = parseRetiredBranchRows(text)
  if (retired_branches === null) return null // malformed retirement rows fail closed
  const working_branches = parseWorkingBranchRows(text)
  if (working_branches === null) return null // malformed Working Branch rows fail closed
  // The flat fields are the legacy/single-PRIMARY shortcut; section rows support multi-repo Projects.
  // Unknown/invalid branch values are never replaced with GitHub's default branch.
  const branchRows = new Map<string, { repository_url: string; development_branch: string | null; release_branch: string | null }>()
  for (const line of text.split('\n')) {
    const row = line.match(/^\s*-\s*(?:PRIMARY|DEPENDENCY|SUPPORT|REFERENCE)\s*\|\s*(https:\/\/github\.com\/[^\s|]+)\s*\|\s*development=([^|\s]*)\s*\|\s*release=([^|\s]*)\s*$/i)
    if (!row) continue
    const normalized = normalizeGithubRepo(row[1])
    if (!normalized) continue
    branchRows.set(normalized.url.toLowerCase(), {
      repository_url: normalized.url,
      development_branch: validIntegrationBranch(row[2]) ? row[2] : null,
      release_branch: validIntegrationBranch(row[3]) ? row[3] : null,
    })
  }
  const branch_policies = dedup.map((repo) => {
    const key = repo.url.toLowerCase()
    const stored = branchRows.get(key)
    const dev = stored?.development_branch ??
      (repo.role === 'PRIMARY' && validIntegrationBranch(values.development_branch) ? values.development_branch : null)
    const release = stored?.release_branch ??
      (repo.role === 'PRIMARY' && validIntegrationBranch(values.release_branch) ? values.release_branch : null)
    const retiredConfigured = isRetiredSourceBranch(retired_branches, repo.url, dev) ||
      isRetiredSourceBranch(retired_branches, repo.url, release)
    return { repository_url: repo.url, development_branch: dev, release_branch: release,
      status: repo.relation === 'OWNED' ? (retiredConfigured ? 'RETIRED_BRANCH_CONFIGURED' : dev ? 'CONFIGURED' : 'UNCONFIGURED') : 'REFERENCE_ONLY' }
  })
  const primaryPolicy = branch_policies.find((p) => p.repository_url.toLowerCase() === primary_repo_url.toLowerCase())
  return {
    development_branch: primaryPolicy?.development_branch ?? null,
    release_branch: primaryPolicy?.release_branch ?? null,
    branch_policy_status: primaryPolicy?.status ?? 'UNCONFIGURED',
    branch_policies,
    retired_branches,
    working_branches,
    project_id,
    name,
    lifecycle,
    repo_url: primary_repo_url,
    primary_repo_url,
    repo_mode,
    repo_registry_status,
    repositories: dedup,
    purpose,
    created_at,
    updated_at,
  }
}

export function renderProjectRepositoryManifest(text: string, repositories: Array<{ role: string; relation: string; url: string }>) {
  const parsed = parseProjectManifest(text)
  if (!parsed) return null
  const normalized = repositories.map((r) => {
    const repo = normalizeGithubRepo(r.url)
    if (!repo) throw new Error('Invalid repository URL: ' + r.url)
    return { role: r.role.toUpperCase(), relation: r.relation.toUpperCase(), url: repo.url }
  })
  const primaries = normalized.filter((r) => r.role === 'PRIMARY')
  if (primaries.length !== 1) throw new Error('Exactly one PRIMARY repository is required.')
  const lines = text.split('\n')
  const out: string[] = []
  let inRepos = false
  let inserted = false
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line.startsWith('repo_mode:')) line = 'repo_mode: ' + (normalized.length > 1 ? 'MULTI' : 'SINGLE')
    else if (line.startsWith('repo_registry_status:')) line = 'repo_registry_status: CONFIRMED'
    else if (line.startsWith('primary_repo_url:')) line = 'primary_repo_url: ' + primaries[0].url
    else if (line.startsWith('repo_url:')) line = 'repo_url: ' + primaries[0].url

    if (line === '## Repositories') {
      out.push(line)
      for (const r of normalized) out.push('- ' + r.role + ' | ' + r.relation + ' | ' + r.url)
      inserted = true
      inRepos = true
      continue
    }
    if (inRepos) {
      if (line.startsWith('## ')) {
        inRepos = false
        out.push('')
        out.push(line)
      }
      continue
    }
    out.push(line)
  }
  if (!inserted) {
    out.push('', '## Repositories')
    for (const r of normalized) out.push('- ' + r.role + ' | ' + r.relation + ' | ' + r.url)
  }
  if (!out.some((l) => l.startsWith('repo_mode:'))) {
    const idx = out.indexOf('---', 1)
    if (idx > 0) out.splice(idx, 0,
      'repo_mode: ' + (normalized.length > 1 ? 'MULTI' : 'SINGLE'),
      'repo_registry_status: CONFIRMED',
      'primary_repo_url: ' + primaries[0].url
    )
  }
  return out.join('\n')
}

export function transitionProjectManifest(text: string, target: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const parsed = parseProjectManifest(text)
  if (!parsed) return null
  const now = new Date().toISOString()
  const lines = text.split('\n').map((line) => {
    if (line.startsWith('lifecycle:')) return 'lifecycle: ' + target
    if (line.startsWith('updated_at:')) return 'updated_at: ' + now
    return line
  })
  return { parsed, next: lines.join('\n'), updated_at: now }
}

export const PROJECT_ID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

export function validMemoryPath(path: string) {
  if (typeof path !== 'string' || !path.startsWith('projects/') || path.includes('\\') || path.includes('%')) return false
  const segments = path.split('/')
  if (segments.length < 3 || !PROJECT_ID_PATTERN.test(segments[1])) return false
  return segments.slice(2).every((segment) =>
    segment !== '.' && segment !== '..' && /^[a-zA-Z0-9_.-]+$/.test(segment))
}

export function validProjectManifestPath(path: string, projectId: string) {
  return PROJECT_ID_PATTERN.test(projectId) &&
    path === 'projects/' + projectId + '/PROJECT.md' && validMemoryPath(path)
}

// C14A: preserve an existing Job branch unless Planner explicitly rebinds it.
// The caller must independently verify the selected OWNED repository's Human-approved
// Development Branch and live Git ref against current PROJECT.md before persisting.
export function revisedJobIntegrationBranchError(job: any, contract: ExecutionContract, requested: string | undefined): string | null {
  const effective = requested === undefined ? job?.repository_context?.integration_branch : requested
  if (effective != null && !validIntegrationBranch(effective)) {
    return 'DEVELOPMENT_BRANCH_INVALID: Job integration_branch must be a valid explicit Git ref.'
  }
  if (contract === 'NEXT' && (job?.type === 'code' || job?.plan_kind === 'PROJECT_PLAN') && !validIntegrationBranch(effective)) {
    return 'DEVELOPMENT_BRANCH_REQUIRED: NEXT code/Project Plans must bind the Human-configured Development Branch of the selected OWNED repository; never infer main/default.'
  }
  return null
}


export function resolveProjectRoleAddins(projectId: string, role: 'coder' | 'tester', agentsText: string) {
  const expected = role === 'coder' ? '## Coder Add-in (optional)' : '## Tester Add-in (optional)'
  const lines = agentsText.split('\n')
  const start = lines.indexOf(expected)
  if (start < 0) return { status: 'NONE', harness_path: null as string | null, skill_paths: [] as string[], reason: 'No add-in section.' }
  const section: string[] = []
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) section.push(lines[i])
  const read = (field: string) => {
    const match = section.find((line) => line.startsWith('- ' + field + ':'))
    return match ? match.slice(('- ' + field + ':').length).trim() : 'none'
  }
  const harnessRaw = read('harness')
  const skillRaw = read('skills')
  const validate = (v: string) => v.startsWith('projects/' + projectId + '/') && validMemoryPath(v) &&
    v !== 'projects/' + projectId + '/AGENTS.md' && v !== 'projects/' + projectId + '/CRITERIA.md'
  const harnessPath = harnessRaw.toLowerCase() === 'none' ? null : harnessRaw
  const paths = skillRaw.toLowerCase() === 'none' ? [] : skillRaw.split(',').map((x) => x.trim()).filter(Boolean)
  if ((harnessPath && !validate(harnessPath)) || paths.some((p) => !validate(p))) {
    return { status: 'DENIED', harness_path: null, skill_paths: [], reason: 'Add-in path escapes active Project or references protected metadata.' }
  }
  return {
    status: harnessPath || paths.length ? 'READY' : 'NONE',
    harness_path: harnessPath, skill_paths: [...new Set(paths)],
    reason: harnessPath || paths.length ? 'Read-only Project add-in references; global harness retains authority.' : 'No optional Project add-in.',
  }
}

// M2: configured add-in paths are discovery evidence, never proof a Task is functional.

export function projectScopeDecision(args: {
  project_manifest_text: string
  project_id: string
  operation: 'READ_EXTERNAL' | 'MUTATE_SOURCE' | 'MUTATE_MEMORY'
  target_repository_url?: string | null
  target_memory_path?: string | null
  user_directed_external_read?: boolean
}) {
  const parsed = parseProjectManifest(args.project_manifest_text)
  if (!parsed || parsed.project_id !== args.project_id) {
    return { allowed: false, mutation_allowed: false, scope: 'NONE', reason: 'Project identity mismatch.' }
  }
  const ownedRepos = new Set(parsed.repositories
    .filter((item: any) => item.relation === 'OWNED')
    .map((item: any) => normalizeGithubRepo(item.url)?.url)
    .filter(Boolean))
  const targetRepo = args.target_repository_url ? normalizeGithubRepo(args.target_repository_url)?.url : null

  if (args.operation === 'READ_EXTERNAL') {
    if (!targetRepo) return { allowed: false, mutation_allowed: false, scope: 'NONE', reason: 'A valid target repository is required.' }
    if (ownedRepos.has(targetRepo)) return { allowed: true, mutation_allowed: false, scope: 'ACTIVE_PROJECT_READ', reason: 'Read stays inside the active Project.' }
    if (args.user_directed_external_read === true) return { allowed: true, mutation_allowed: false, scope: 'EXPLICIT_EXTERNAL_READ', reason: 'Explicit external read is allowed without widening Project mutation scope.' }
    return { allowed: false, mutation_allowed: false, scope: 'NONE', reason: 'External read requires explicit Human reference.' }
  }

  if (parsed.lifecycle !== 'ACTIVE') {
    return { allowed: false, mutation_allowed: false, scope: 'NONE', reason: 'Project mutation requires lifecycle=ACTIVE.' }
  }
  if (args.operation === 'MUTATE_SOURCE') {
    const allowed = Boolean(targetRepo && ownedRepos.has(targetRepo))
    return {
      allowed,
      mutation_allowed: allowed,
      scope: allowed ? 'ACTIVE_PROJECT_SOURCE' : 'NONE',
      reason: allowed ? 'Source target is an OWNED repository of the active Project.' : 'Source target is outside the active Project OWNED repository set.',
    }
  }
  const expectedPrefix = 'projects/' + args.project_id + '/'
  const allowed = Boolean(args.target_memory_path && args.target_memory_path.startsWith(expectedPrefix) && validMemoryPath(args.target_memory_path))
  return {
    allowed,
    mutation_allowed: allowed,
    scope: allowed ? 'ACTIVE_PROJECT_MEMORY' : 'NONE',
    reason: allowed ? 'Memory target is inside the active Project path.' : 'Memory target is outside the active Project path.',
  }
}
