import { validIntegrationBranch, isRetiredSourceBranch } from './project-utils.ts'
import { normalizeGithubRepo } from './platform-utils.ts'
import type { ExecutionContract } from './runtime-contract.ts'
import { parseProjectManifest, validMemoryPath } from './project-manifest-scope.ts'
import { workingBranchWriteError } from './branch-governance.ts'

// Compatibility name retained for existing callers. This checks Project and
// development-branch scope ONLY. Bootstrap cannot grant or revoke code execution.
// Job lifecycle, planning review, scoped Human authorization and run evidence are
// separate execution-phase responsibilities.
export function projectBootstrapExecutionError(projectId: string, manifestText: string, _unusedBootstrapEvidence: any,
  repositoryUrl: string | null, sourceBranch: string | null,
  sourceOwner?: { job_id: string; task_id: string } | null): string | null {
  const project = parseProjectManifest(manifestText)
  if (!project || project.project_id !== projectId || project.lifecycle !== 'ACTIVE')
    return 'SOURCE_PROJECT_INVALID: exact ACTIVE Project manifest required.'
  const repo = repositoryUrl ? normalizeGithubRepo(repositoryUrl) : null
  const policy = project.branch_policies.find((p: any) => p.repository_url === repo?.url)
  if (!repo || !sourceBranch || !validIntegrationBranch(sourceBranch) ||
      !project.repositories.some((r: any) => r.relation === 'OWNED' && normalizeGithubRepo(r.url)?.url === repo.url) ||
      !policy || policy.status !== 'CONFIGURED' || !policy.development_branch)
    return 'SOURCE_BRANCH_INVALID: an OWNED repository with an active configured Development Branch is required.'
  if (isRetiredSourceBranch(project.retired_branches, repo.url, sourceBranch))
    return 'SOURCE_BRANCH_RETIRED: retired branches cannot receive source mutations.'
  if (sourceBranch === policy.development_branch) return null
  // Working Branches are authorized per Job/Task; Development remains their
  // integration target and main is never a source-write fallback.
  return workingBranchWriteError(project.working_branches, projectId, repo.url,
    sourceBranch, policy.development_branch, policy.release_branch,
    sourceOwner?.job_id, sourceOwner?.task_id)
}

export function milestoneCrlEvidenceError(job: any, milestoneId: string | null, reviewerSnapshot: any, targetRevision?: string): string | null {
  const milestone = (job?.milestones ?? []).find((m: any) => m.milestone_id === milestoneId)
  if (!milestoneId || !milestone || milestone.review_loop !== 'crl' || milestone.human_pre_authorized !== true) {
    return 'CR_MILESTONE_UNAUTHORIZED: Human must have approved crl on this exact milestone.'
  }
  if (!['READY','IN_PROGRESS'].includes(job?.lifecycle) ||
      job?.planning_review?.status !== 'PASS' || job?.planning_review?.reviewed_revision !== job?.planning_revision) {
    return 'CR_MILESTONE_NOT_READY: current Job planning revision must have Reviewer PASS and be READY/IN_PROGRESS.'
  }
  if (!reviewerSnapshot?.path || !String(reviewerSnapshot.path).startsWith('projects/' + job.project_id + '/') || !validMemoryPath(reviewerSnapshot.path) || !/^[0-9a-f]{40}$/.test(String(reviewerSnapshot?.sha ?? ''))) {
    return 'CR_MILESTONE_REVIEW_MISSING: exact Reviewer PASS snapshot is required.'
  }
  let review: any
  try { review = JSON.parse(reviewerSnapshot.record_text) } catch { return 'CR_MILESTONE_REVIEW_INVALID: unreadable Reviewer snapshot.' }
  if (review.kind !== 'REVIEW' || review.result !== 'PASS' ||
      review.project_id !== job.project_id || review.job_id !== job.job_id ||
      review.planning_revision !== job.planning_revision ||
      review.milestone_id !== milestoneId || review.producer !== 'reviewer') {
    return 'CR_MILESTONE_REVIEW_INVALID: Reviewer PASS must match this Job/milestone/planning revision.'
  }
  if (job?.type === 'code' &&
      (!/^[0-9a-f]{40}$/.test(String(targetRevision ?? '')) ||
       review.target_revision !== targetRevision)) {
    return 'CR_MILESTONE_SOURCE_REVISION_MISMATCH: fresh Reviewer PASS must match exact target source revision.'
  }
  return null
}


export function validateNextPlanningModel(executionContract: ExecutionContract, tasks: any[], model: any, planningRevision: number): string | null {
  const evidenceNeeds = model.evidence_needs ?? []
  const checkpoints = model.test_checkpoints ?? []
  const requirements = model.evidence_requirements ?? []
  const milestones = model.milestones ?? []
  const planningTopology = model.planning_topology ?? []
  const hasNextFields = evidenceNeeds.length || checkpoints.length || requirements.length || milestones.length || planningTopology.length

  if (executionContract === 'V2_STABLE') {
    return hasNextFields ? 'NEXT_PLANNING_FIELDS_REQUIRE_NEXT: V2_STABLE Jobs must keep CP4 planning collections empty.' : null
  }
  if (!hasNextFields) return null

  const taskIds = new Set(tasks.map((task: any) => task.task_id))
  const unique = (values: string[]) => new Set(values).size === values.length
  const evidenceNeedIds = evidenceNeeds.map((item: any) => item.evidence_need_id)
  const checkpointIds = checkpoints.map((item: any) => item.checkpoint_id)
  const milestoneIds = milestones.map((item: any) => item.milestone_id)
  const topologyIds = planningTopology.map((item: any) => item.node_id)
  if (!unique(evidenceNeedIds) || !unique(checkpointIds) || !unique(milestoneIds) || !unique(topologyIds)) {
    return 'NEXT_PLANNING_INVALID: EvidenceNeed, checkpoint, milestone and topology node IDs must be unique.'
  }
  const evidenceNeedSet = new Set(evidenceNeedIds)
  const checkpointSet = new Set(checkpointIds)
  const milestoneSet = new Set(milestoneIds)
  const knownNodeIds = new Set([...taskIds, ...checkpointIds])
  const checkpointById = new Map(checkpoints.map((item: any) => [item.checkpoint_id, item]))
  const evidenceNeedById = new Map(evidenceNeeds.map((item: any) => [item.evidence_need_id, item]))

  for (const item of evidenceNeeds) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: EvidenceNeed is not bound to the current planning revision.'
    if (!taskIds.has(item.owner_task_id) || !(item.required_by_task_ids ?? []).every((id: string) => taskIds.has(id)) || !checkpointSet.has(item.checkpoint_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceNeed owner/consumer/checkpoint references must resolve inside the current plan.'
    }
    const producer: any = checkpointById.get(item.checkpoint_id)
    if (!(producer?.evidence_need_ids ?? []).includes(item.evidence_need_id)) {
      return 'NEXT_PLANNING_INVALID: every EvidenceNeed must be declared as produced by its referenced checkpoint.'
    }
    for (const consumerTaskId of item.required_by_task_ids ?? []) {
      const hasRequirement = requirements.some((req: any) =>
        req.consumer_task_id === consumerTaskId &&
        req.evidence_need_id === item.evidence_need_id &&
        req.checkpoint_id === item.checkpoint_id
      )
      if (!hasRequirement) return 'NEXT_PLANNING_INVALID: every EvidenceNeed consumer must have a matching EvidenceRequirement.'
    }
  }
  for (const item of checkpoints) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: TestCheckpointSpec is not bound to the current planning revision.'
    if (!(item.evidence_need_ids ?? []).every((id: string) => evidenceNeedSet.has(id))) return 'NEXT_PLANNING_INVALID: checkpoint evidence_need_ids contain an unknown reference.'
    if (!(item.prerequisite_node_ids ?? []).every((id: string) => taskIds.has(id) || checkpointSet.has(id))) return 'NEXT_PLANNING_INVALID: checkpoint prerequisite_node_ids contain an unknown node.'
    if (item.boundary === 'BEFORE_NODE' && (!item.boundary_node_id || !taskIds.has(item.boundary_node_id))) return 'NEXT_PLANNING_INVALID: BEFORE_NODE requires a valid boundary_node_id.'
    if (item.boundary === 'AFTER_NODE_SET' && !(item.prerequisite_node_ids ?? []).length) return 'NEXT_PLANNING_INVALID: AFTER_NODE_SET requires prerequisite_node_ids.'
    if (item.boundary === 'MILESTONE_GATE' && (!item.milestone_id || !milestoneSet.has(item.milestone_id))) return 'NEXT_PLANNING_INVALID: MILESTONE_GATE requires a valid milestone_id.'
  }
  for (const item of requirements) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: EvidenceRequirement is not bound to the current planning revision.'
    if (!taskIds.has(item.consumer_task_id) || !evidenceNeedSet.has(item.evidence_need_id) || !checkpointSet.has(item.checkpoint_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceRequirement references must resolve to current tasks/evidence/checkpoints.'
    }
    const need: any = evidenceNeedById.get(item.evidence_need_id)
    if (need?.checkpoint_id !== item.checkpoint_id || !(need?.required_by_task_ids ?? []).includes(item.consumer_task_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceRequirement must match the EvidenceNeed producer checkpoint and declared consumer set.'
    }
  }
  for (const item of milestones) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: milestone is not bound to the current planning revision.'
    if (!(item.node_ids ?? []).every((id: string) => taskIds.has(id) || checkpointSet.has(id)) || !(item.gate_checkpoint_ids ?? []).every((id: string) => checkpointSet.has(id))) {
      return 'NEXT_PLANNING_INVALID: milestone node/gate references must resolve inside the current plan.'
    }
  }
  if ((checkpoints.length || milestones.length) && !planningTopology.length) return 'NEXT_PLANNING_INVALID: typed planning_topology is required when checkpoints or milestones exist.'
  for (const item of planningTopology) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: topology node is not bound to the current planning revision.'
    if (!knownNodeIds.has(item.node_id) || !(item.depends_on ?? []).every((id: string) => knownNodeIds.has(id))) return 'NEXT_PLANNING_INVALID: planning_topology contains an unknown node/reference.'
    if ((item.depends_on ?? []).includes(item.node_id) || !unique(item.depends_on ?? [])) return 'NEXT_PLANNING_INVALID: planning_topology dependencies must be unique and cannot self-reference.'
    if (item.node_type === 'TASK' && !taskIds.has(item.node_id)) return 'NEXT_PLANNING_INVALID: TASK topology node must reference a Task.'
    if (item.node_type === 'TEST_CHECKPOINT') {
      const checkpoint: any = checkpointById.get(item.node_id)
      if (!checkpoint || checkpoint.boundary === 'MILESTONE_GATE') return 'NEXT_PLANNING_INVALID: TEST_CHECKPOINT node must reference a non-milestone checkpoint.'
    }
    if (item.node_type === 'MILESTONE_GATE') {
      const checkpoint: any = checkpointById.get(item.node_id)
      if (!checkpoint || checkpoint.boundary !== 'MILESTONE_GATE') return 'NEXT_PLANNING_INVALID: MILESTONE_GATE node must reference a MILESTONE_GATE checkpoint.'
    }
  }
  for (const id of taskIds) if (!topologyIds.includes(id)) return 'NEXT_PLANNING_INVALID: every Task must appear in typed planning_topology.'
  for (const id of checkpointIds) if (!topologyIds.includes(id)) return 'NEXT_PLANNING_INVALID: every TestCheckpointSpec must appear in typed planning_topology.'

  const deps = new Map(planningTopology.map((item: any) => [item.node_id, item.depends_on ?? []]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const dep of (deps.get(id) as string[] ?? [])) if (hasCycle(dep)) return true
    visiting.delete(id)
    visited.add(id)
    return false
  }
  for (const id of topologyIds) if (hasCycle(id)) return 'NEXT_PLANNING_INVALID: planning_topology must be acyclic.'
  return null
}
