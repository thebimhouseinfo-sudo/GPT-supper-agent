import { validIntegrationBranch } from './project-utils.ts'
import { normalizeGithubRepo } from './platform-utils.ts'

// Optional, additive Project Memory records. Existing Projects without this
// section keep their approved Development/Release branch behavior unchanged.
export type WorkingBranch = {
  repository_url: string
  branch: string
  project_id: string
  owning_job_id: string
  owning_task_id: string
  purpose: string
  parent_development_branch: string
  release_branch: string
  base_sha: string
  integration_target: string
  dependencies: string[]
  owner: string
  authorization_ref?: string | null
  handoff_recipient: string
  closure_owner_job_id: string
  closure_owner_task_id: string
  deliverables: string[]
  merge_conditions: string[]
  retire_conditions: string[]
  status: 'PROPOSED' | 'AUTHORIZED' | 'ACTIVE' | 'READY_FOR_HANDOFF' | 'REVIEW' | 'MERGED' | 'RETIRED' | 'CLOSED'
  disposition?: 'MERGED' | 'RETIRED' | 'KEEP' | null
  final_head_sha?: string | null
  handoff_ref?: string | null
  closure_evidence_ref?: string | null
  physical_ref?: 'PRESENT' | 'DELETED' | 'UNKNOWN'
}

const STATUSES = new Set(['PROPOSED','AUTHORIZED','ACTIVE','READY_FOR_HANDOFF','REVIEW','MERGED','RETIRED','CLOSED'])
const DISPOSITIONS = new Set(['MERGED','RETIRED','KEEP'])
const SHA = /^[a-f0-9]{40}$/i
const requiredString = (v: unknown) => typeof v === 'string' && v.trim().length > 0
const strings = (v: unknown) => Array.isArray(v) && v.every(requiredString)

export function parseWorkingBranchRows(manifestText: string): WorkingBranch[] | null {
  const rows: WorkingBranch[] = []
  const seen = new Set<string>()
  let section = false
  for (const line of manifestText.split('\n')) {
    if (/^## /.test(line)) {
      section = /^## Working Branches(?:\s|$)/.test(line)
      continue
    }
    if (!section || !/^\s*-\s*/.test(line)) continue
    let item: any
    try { item = JSON.parse(line.replace(/^\s*-\s*/, '')) } catch { return null }
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const repo = normalizeGithubRepo(item.repository_url)
    if (!repo || repo.url !== item.repository_url ||
        !validIntegrationBranch(item.branch) ||
        !validIntegrationBranch(item.parent_development_branch) ||
        !validIntegrationBranch(item.release_branch) ||
        !validIntegrationBranch(item.integration_target) ||
        item.integration_target !== item.parent_development_branch ||
        !SHA.test(item.base_sha ?? '') ||
        !requiredString(item.project_id) ||
        !requiredString(item.owning_job_id) ||
        !requiredString(item.owning_task_id) ||
        !requiredString(item.purpose) ||
        !requiredString(item.owner) ||
        (item.authorization_ref != null && !requiredString(item.authorization_ref)) ||
        !requiredString(item.handoff_recipient) ||
        !requiredString(item.closure_owner_job_id) ||
        !requiredString(item.closure_owner_task_id) ||
        !strings(item.dependencies) ||
        !strings(item.deliverables) ||
        !strings(item.merge_conditions) ||
        !strings(item.retire_conditions) ||
        !STATUSES.has(item.status) ||
        (item.disposition != null && !DISPOSITIONS.has(item.disposition)) ||
        (item.final_head_sha != null && !SHA.test(item.final_head_sha)) ||
        (item.handoff_ref != null && !requiredString(item.handoff_ref)) ||
        (item.closure_evidence_ref != null && !requiredString(item.closure_evidence_ref)) ||
        (item.physical_ref != null && !['PRESENT','DELETED','UNKNOWN'].includes(item.physical_ref))) return null
    const key = repo.url.toLowerCase() + '|' + item.branch
    if (seen.has(key)) return null
    seen.add(key)
    rows.push(item as WorkingBranch)
  }
  return rows
}

export function workingBranchWriteError(
  branches: WorkingBranch[], projectId: string, repoUrl: string, sourceBranch: string,
  developmentBranch: string, releaseBranch: string | null, jobId?: string | null, taskId?: string | null,
): string | null {
  if (!jobId || !taskId) return 'SOURCE_BRANCH_UNOWNED: Working Branch mutation requires the exact Job and Task.'
  const repo = normalizeGithubRepo(repoUrl)
  if (!repo || sourceBranch === developmentBranch || sourceBranch === releaseBranch)
    return 'SOURCE_BRANCH_INVALID: a Working Branch cannot replace Development or Release.'
  const record = branches.find(b => b.repository_url.toLowerCase() === repo.url.toLowerCase() && b.branch === sourceBranch)
  if (!record) return 'SOURCE_BRANCH_INVALID: Working Branch is not registered in the active Project.'
  if (record.project_id !== projectId || record.owning_job_id !== jobId ||
      record.owning_task_id !== taskId)
    return 'SOURCE_BRANCH_OWNERSHIP_INVALID: Job/Task/Project does not own the registered branch.'
  if (record.parent_development_branch !== developmentBranch ||
      record.integration_target !== developmentBranch || record.release_branch !== releaseBranch)
    return 'SOURCE_BRANCH_STALE: registered integration/release mapping differs from current Project policy.'
  if (!['AUTHORIZED','ACTIVE'].includes(record.status))
    return 'SOURCE_BRANCH_LIFECYCLE_BLOCKED: branch must be AUTHORIZED or ACTIVE for source mutation.'
  if (!record.authorization_ref)
    return 'SOURCE_BRANCH_AUTHORIZATION_MISSING: approved Job/Task authorization ref is required.'
  return null
}

export function workingBranchTransitionError(previous: WorkingBranch, next: WorkingBranch): string | null {
  if (previous.repository_url !== next.repository_url || previous.branch !== next.branch ||
      previous.project_id !== next.project_id || previous.owning_job_id !== next.owning_job_id ||
      previous.owning_task_id !== next.owning_task_id ||
      previous.parent_development_branch !== next.parent_development_branch ||
      previous.integration_target !== next.integration_target ||
      previous.closure_owner_job_id !== next.closure_owner_job_id ||
      previous.closure_owner_task_id !== next.closure_owner_task_id)
    return 'BRANCH_IDENTITY_IMMUTABLE: registration, ownership and integration ancestry cannot silently change.'
  const allowed: Record<string,string[]> = {
    PROPOSED: ['AUTHORIZED'], AUTHORIZED: ['ACTIVE','RETIRED'], ACTIVE: ['READY_FOR_HANDOFF','RETIRED'],
    READY_FOR_HANDOFF: ['REVIEW','RETIRED'], REVIEW: ['MERGED','RETIRED'],
    MERGED: ['CLOSED'], RETIRED: ['CLOSED'], CLOSED: [],
  }
  if (!allowed[previous.status]?.includes(next.status))
    return 'BRANCH_TRANSITION_INVALID: transition is not permitted.'
  if (previous.authorization_ref && previous.authorization_ref !== next.authorization_ref)
    return 'BRANCH_AUTHORIZATION_IMMUTABLE: existing approval lineage cannot be rewritten.'
  if (next.status === 'AUTHORIZED' && !next.authorization_ref)
    return 'BRANCH_AUTHORIZATION_REQUIRED: bind approved Job/Task evidence before activation.'
  if (next.status === 'READY_FOR_HANDOFF' && (!next.final_head_sha || !next.handoff_ref))
    return 'BRANCH_HANDOFF_REQUIRED: final SHA and handoff reference are required.'
  if (['MERGED','RETIRED'].includes(next.status) &&
      (next.disposition !== next.status || !next.final_head_sha ||
       !next.handoff_ref || !next.closure_evidence_ref))
    return 'BRANCH_DISPOSITION_EVIDENCE_REQUIRED: final SHA, handoff and evidence must be recorded.'
  if (next.status === 'CLOSED' &&
      (!['MERGED','RETIRED'].includes(previous.status) ||
       !next.disposition || !next.handoff_ref || !next.closure_evidence_ref ||
       !next.final_head_sha || next.physical_ref == null))
    return 'BRANCH_CLOSURE_UNVERIFIED: disposition, handoff, evidence and Git ref state required.'
  return null
}

export function convergenceCompletionError(
  branches: WorkingBranch[], projectId: string, jobId: string, taskId: string,
  incoming: string[],
): string | null {
  if (!Array.isArray(incoming) || incoming.length === 0 || new Set(incoming).size !== incoming.length)
    return 'CONVERGENCE_INCOMING_INVALID: explicitly list unique incoming Working Branch names.'
  const owned = branches.filter(b => b.project_id === projectId &&
    b.closure_owner_job_id === jobId && b.closure_owner_task_id === taskId)
  if (owned.length !== incoming.length ||
      incoming.some(name => !owned.some(b => b.branch === name)))
    return 'CONVERGENCE_ORPHAN_BRANCH: incoming and closure-owned branch sets must match.'
  for (const b of owned) {
    if (b.status !== 'CLOSED' || !['MERGED','RETIRED','KEEP'].includes(b.disposition ?? '') ||
        !b.final_head_sha || !b.handoff_ref || !b.closure_evidence_ref ||
        !b.physical_ref || b.physical_ref === 'UNKNOWN')
      return 'CONVERGENCE_CLOSURE_PENDING: ' + b.branch + ' lacks verified closure/disposition/handoff/ref status.'
  }
  return null
}
