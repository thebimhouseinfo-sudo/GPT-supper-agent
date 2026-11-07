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
  development_head_sha?: string | null
  reconciliation_plan?: string | null
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
  disposition?: 'MERGED' | 'RETIRED' | null
  final_head_sha?: string | null
  handoff_ref?: string | null
  review_ref?: string | null
  ci_ref?: string | null
  dependencies_verified_ref?: string | null
  integration_sha?: string | null
  merge_authorization_ref?: string | null
  preservation_ref?: string | null
  preservation_owner?: string | null
  preservation_reason?: string | null
  closure_evidence_ref?: string | null
  physical_ref?: 'PRESENT' | 'DELETED' | 'UNKNOWN'
}

const STATUSES = new Set(['PROPOSED','AUTHORIZED','ACTIVE','READY_FOR_HANDOFF','REVIEW','MERGED','RETIRED','CLOSED'])
const DISPOSITIONS = new Set(['MERGED','RETIRED'])
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
        (item.development_head_sha != null && !SHA.test(item.development_head_sha)) ||
        (item.reconciliation_plan != null && !requiredString(item.reconciliation_plan)) ||
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
        (item.review_ref != null && !requiredString(item.review_ref)) ||
        (item.ci_ref != null && !requiredString(item.ci_ref)) ||
        (item.dependencies_verified_ref != null && !requiredString(item.dependencies_verified_ref)) ||
        (item.integration_sha != null && !SHA.test(item.integration_sha)) ||
        (item.merge_authorization_ref != null && !requiredString(item.merge_authorization_ref)) ||
        (item.preservation_ref != null && !requiredString(item.preservation_ref)) ||
        (item.preservation_owner != null && !requiredString(item.preservation_owner)) ||
        (item.preservation_reason != null && !requiredString(item.preservation_reason)) ||
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
  const repo = normalizeGithubRepo(repoUrl)
  if (!repo || sourceBranch === developmentBranch || sourceBranch === releaseBranch)
    return 'SOURCE_BRANCH_INVALID: a Working Branch cannot replace Development or Release.'
  const record = branches.find(b => b.repository_url.toLowerCase() === repo.url.toLowerCase() && b.branch === sourceBranch)
  if (!record) return 'SOURCE_BRANCH_INVALID: Working Branch is not registered in the active Project.'
  if (!jobId || !taskId) return 'SOURCE_BRANCH_UNOWNED: Working Branch mutation requires the exact Job and Task.'
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
  if (!record.development_head_sha || !SHA.test(record.development_head_sha))
    return 'SOURCE_BRANCH_BASELINE_MISSING: exact authorized Development HEAD SHA is required.'
  if (record.base_sha !== record.development_head_sha && !record.reconciliation_plan)
    return 'SOURCE_BRANCH_RECONCILIATION_MISSING: divergent source base requires an approved reconciliation plan.'
  return null
}

export function workingBranchTransitionError(previous: WorkingBranch, next: WorkingBranch): string | null {
  if (previous.repository_url !== next.repository_url || previous.branch !== next.branch ||
      previous.project_id !== next.project_id || previous.owning_job_id !== next.owning_job_id ||
      previous.owning_task_id !== next.owning_task_id ||
      previous.owner !== next.owner ||
      previous.handoff_recipient !== next.handoff_recipient ||
      previous.purpose !== next.purpose ||
      JSON.stringify(previous.dependencies) !== JSON.stringify(next.dependencies) ||
      JSON.stringify(previous.deliverables) !== JSON.stringify(next.deliverables) ||
      JSON.stringify(previous.merge_conditions) !== JSON.stringify(next.merge_conditions) ||
      JSON.stringify(previous.retire_conditions) !== JSON.stringify(next.retire_conditions) ||
      previous.parent_development_branch !== next.parent_development_branch ||
      previous.base_sha !== next.base_sha ||
      (previous.development_head_sha && previous.development_head_sha !== next.development_head_sha) ||
      (previous.reconciliation_plan && previous.reconciliation_plan !== next.reconciliation_plan) ||
      previous.release_branch !== next.release_branch ||
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
  if (previous.disposition && previous.disposition !== next.disposition)
    return 'BRANCH_DISPOSITION_IMMUTABLE: merge/retire outcome is independent of KEEP preservation.'
  if (next.status === 'AUTHORIZED' && !next.authorization_ref)
    return 'BRANCH_AUTHORIZATION_REQUIRED: bind approved Job/Task evidence before activation.'
  if (next.status === 'READY_FOR_HANDOFF' && (!next.final_head_sha || !next.handoff_ref))
    return 'BRANCH_HANDOFF_REQUIRED: final SHA and handoff reference are required.'
  for (const key of ['final_head_sha','handoff_ref','review_ref','ci_ref','dependencies_verified_ref',
    'integration_sha','merge_authorization_ref','preservation_ref','preservation_owner',
    'preservation_reason','closure_evidence_ref'] as const) {
    if (previous[key] && next[key] !== previous[key])
      return 'BRANCH_EVIDENCE_IMMUTABLE: recorded review, SHA and handoff lineage cannot be erased.'
  }
  if (next.status === 'MERGED' && (!next.review_ref || !next.ci_ref ||
      !next.dependencies_verified_ref || !next.integration_sha || !next.merge_authorization_ref))
    return 'BRANCH_MERGE_GATES_MISSING: review, CI, dependency, integration SHA and merge authority required.'
  if (['MERGED','RETIRED'].includes(next.status) &&
      (next.disposition !== next.status || !next.final_head_sha ||
       !next.handoff_ref || !next.closure_evidence_ref))
    return 'BRANCH_DISPOSITION_EVIDENCE_REQUIRED: final SHA, handoff and evidence must be recorded.'
  // A pre-existing/forged MERGED record cannot skip original merge gates
  // merely by transitioning directly to CLOSED.
  if (next.status === 'CLOSED' && next.disposition === 'MERGED' &&
      (!next.review_ref || !next.ci_ref || !next.dependencies_verified_ref ||
       !next.integration_sha || !SHA.test(next.integration_sha) ||
       !next.merge_authorization_ref))
    return 'BRANCH_MERGE_GATES_MISSING: closed merged branch must retain review, CI, dependency, integration SHA and merge authority.'
  if (next.status === 'CLOSED' &&
      (!['MERGED','RETIRED'].includes(previous.status) ||
       !next.disposition || !next.handoff_ref || !next.closure_evidence_ref ||
       !next.final_head_sha || next.physical_ref == null || next.physical_ref === 'UNKNOWN' ||
       (next.physical_ref === 'PRESENT' &&
         (!next.preservation_ref || !next.preservation_owner || !next.preservation_reason))))
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
    // Convergence reads Project Memory state, not a replay of the transitions:
    // CLOSED/MERGED alone is not evidence that the guarded merge took place.
    if (b.status === 'CLOSED' && b.disposition === 'MERGED' &&
        (!b.review_ref || !b.ci_ref || !b.dependencies_verified_ref ||
         !b.integration_sha || !SHA.test(b.integration_sha) ||
         !b.merge_authorization_ref))
      return 'CONVERGENCE_MERGE_EVIDENCE_MISSING: ' + b.branch + ' lacks review, CI, dependency, integration SHA or merge authority.'
    if (b.status !== 'CLOSED' || !['MERGED','RETIRED'].includes(b.disposition ?? '') ||
        !b.final_head_sha || !b.handoff_ref || !b.closure_evidence_ref ||
        !b.physical_ref || b.physical_ref === 'UNKNOWN' ||
        (b.physical_ref === 'PRESENT' &&
          (!b.preservation_ref || !b.preservation_owner || !b.preservation_reason)))
      return 'CONVERGENCE_CLOSURE_PENDING: ' + b.branch + ' lacks verified closure/disposition/handoff/ref status.'
  }
  return null
}

/**
 * Task-DAG contract for a registered Working Branch. This validates exact
 * Job/Task identities and Plan topology; it never treats caller-supplied
 * record text or SHA as proof of a live GitHub readback.
 */
export function workingBranchTaskContractError(
  branch: WorkingBranch, ownerJob: any, closureJob: any, requireApproved: boolean,
  allowRetiredOwner = false,
): string | null {
  if (!ownerJob || ownerJob.project_id !== branch.project_id ||
      ownerJob.job_id !== branch.owning_job_id || !Array.isArray(ownerJob.tasks))
    return 'WORKING_BRANCH_OWNER_JOB_INVALID: Job record does not own Project/Task.'
  if (!closureJob || closureJob.project_id !== branch.project_id ||
      closureJob.job_id !== branch.closure_owner_job_id || !Array.isArray(closureJob.tasks))
    return 'WORKING_BRANCH_CLOSURE_JOB_INVALID: exact Closure Owner Job record is required.'
  const owningTask = ownerJob.tasks.find((t: any) =>
    t.task_id === branch.owning_task_id && (allowRetiredOwner || t.lifecycle !== 'RETIRED'))
  const closureTask = closureJob.tasks.find((t: any) =>
    t.task_id === branch.closure_owner_task_id && t.lifecycle !== 'RETIRED')
  if (!owningTask || !closureTask)
    return 'WORKING_BRANCH_TASK_INVALID: the owning and closure Tasks must exist in their current Job records.'
  if (branch.owning_job_id === branch.closure_owner_job_id) {
    // Accept direct or transitive Task DAG edges; ignore free-text claims.
    const known = new Map(ownerJob.tasks.map((t: any) => [t.task_id, t]))
    const pending = [...(closureTask.dependencies ?? [])]
    const visited = new Set<string>()
    let reachable = false
    while (pending.length) {
      const id = pending.pop()
      if (id === branch.owning_task_id) { reachable = true; break }
      if (typeof id !== 'string' || visited.has(id)) continue
      visited.add(id)
      const predecessor: any = known.get(id)
      if (predecessor) pending.push(...(predecessor.dependencies ?? []))
    }
    if (!reachable)
      return 'WORKING_BRANCH_TASK_DAG_INVALID: Convergence Task must depend on owning Task.'
  } else {
    const linked = [
      ...(closureJob.linked_job_ids ?? []),
      ...(closureJob.dependencies ?? []),
    ]
    if (!linked.some((dep: any) =>
      dep === ownerJob.job_id || dep?.job_id === ownerJob.job_id ||
      dep?.depends_on === ownerJob.job_id) ||
        !(closureTask.dependencies ?? []).includes(branch.owning_task_id))
      return 'WORKING_BRANCH_JOB_DAG_INVALID: cross-Job Convergence requires explicit Job and Task dependency edges.'
  }
  if (closureTask.convergence_task !== true)
    return 'WORKING_BRANCH_CONVERGENCE_UNDECLARED: Closure Owner Task must be marked as Convergence.'
  if (requireApproved) {
    for (const job of ownerJob === closureJob ? [ownerJob] : [ownerJob, closureJob]) {
      if (!['READY','IN_PROGRESS'].includes(job.lifecycle) ||
          job.planning_review?.status !== 'PASS' ||
          job.planning_review?.reviewed_revision !== job.planning_revision)
        return 'WORKING_BRANCH_JOB_UNREVIEWED: reviewed current Job revision required before branch authorization.'
    }
    if (!(closureTask.incoming_branches ?? []).includes(branch.branch))
      return 'WORKING_BRANCH_INCOMING_MISSING: Convergence Task must declare this incoming branch.'
    if (!branch.development_head_sha || !SHA.test(branch.development_head_sha))
      return 'WORKING_BRANCH_BASELINE_UNVERIFIED: exact Development HEAD SHA required for authorization.'
    if (branch.base_sha !== branch.development_head_sha && !branch.reconciliation_plan)
      return 'WORKING_BRANCH_RECONCILIATION_REQUIRED: diverged branch base requires reconciliation plan.'
  }
  return null
}
