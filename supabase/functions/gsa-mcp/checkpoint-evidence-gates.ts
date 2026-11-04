import { requiredCheckpointIds } from './execution-guards.ts'
import { DEFAULT_NEXT_MEMORY_NAMESPACE, jobExecutionContract } from './runtime-contract.ts'
import { recordNextMemoryNamespace, sameNextMemoryNamespace, verificationPath, checkpointClaimPath, parseDurableSnapshots, validateClaimSnapshots, validateVerificationSnapshots } from './durable-record-io.ts'
import { checkpointVerificationApplicable } from './evidence-validation.ts'

export function evaluateNextEvidenceGate(job: any, claimSnapshots: any[], verificationSnapshots: any[], target: { kind: 'TASK' | 'MILESTONE' | 'JOB', id?: string | null }) {
  const executionContract = jobExecutionContract(job)
  if (executionContract !== 'NEXT') return { allowed: true, required_checkpoint_ids: [], blocking: [] as string[] }
  const nextMemoryNamespace = recordNextMemoryNamespace(job)
  if (!nextMemoryNamespace) return { allowed: false, required_checkpoint_ids: [], blocking: ['Current NEXT Job memory_namespace is invalid.'] }
  if (job.planning_review?.status !== 'PASS' || job.planning_review?.reviewed_revision !== job.planning_revision) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Current NEXT planning revision is not Reviewer PASS.'] }
  }
  const claimParsed = parseDurableSnapshots(claimSnapshots ?? [], 'checkpoint_claim_snapshots')
  if (claimParsed.error) return { allowed: false, required_checkpoint_ids: [], blocking: [claimParsed.error] }
  const claimSnapshotError = validateClaimSnapshots(claimParsed.entries, 'checkpoint_claim_snapshots')
  if (claimSnapshotError) return { allowed: false, required_checkpoint_ids: [], blocking: [claimSnapshotError] }
  const verificationParsed = parseDurableSnapshots(verificationSnapshots ?? [], 'checkpoint_verification_snapshots')
  if (verificationParsed.error) return { allowed: false, required_checkpoint_ids: [], blocking: [verificationParsed.error] }
  const verificationSnapshotError = validateVerificationSnapshots(verificationParsed.entries, 'checkpoint_verification_snapshots')
  if (verificationSnapshotError) return { allowed: false, required_checkpoint_ids: [], blocking: [verificationSnapshotError] }
  if (target.kind === 'TASK' && !(job.tasks ?? []).some((item: any) => item.task_id === target.id)) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Unknown NEXT Task target: ' + String(target.id ?? '')] }
  }
  if (target.kind === 'MILESTONE' && !(job.milestones ?? []).some((item: any) => item.milestone_id === target.id)) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Unknown NEXT Milestone target: ' + String(target.id ?? '')] }
  }
  const ids = requiredCheckpointIds(job, target)
  const blocking: string[] = []
  for (const checkpointId of ids) {
    const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpointId)
    if (!checkpoint) {
      blocking.push('Unknown required checkpoint: ' + checkpointId)
      continue
    }
    const matchingClaims = claimParsed.entries.filter((entry: any) => {
      const item = entry.record
      return item?.kind === 'CHECKPOINT_CLAIM' &&
        item.project_id === job.project_id &&
        item.job_id === job.job_id &&
        item.planning_revision === job.planning_revision &&
        item.checkpoint_id === checkpointId &&
        entry.path === checkpointClaimPath(job.project_id, job.job_id, job.planning_revision, checkpointId, nextMemoryNamespace)
    })
    if (matchingClaims.length !== 1) {
      blocking.push('Expected exactly one current deterministic checkpoint claim: ' + checkpointId)
      continue
    }
    const claim = matchingClaims[0].record
    const matchingVerifications = verificationParsed.entries.filter((entry: any) =>
      entry.record?.verification_id === claim.last_verification_id &&
      entry.path === verificationPath(job.project_id, claim.last_verification_id, 'NEXT', nextMemoryNamespace)
    )
    if (matchingVerifications.length !== 1 || !checkpointVerificationApplicable(job, checkpoint, claim, matchingVerifications[0].record)) {
      blocking.push('Mandatory checkpoint evidence is not applicable: ' + checkpointId)
    }
  }
  return { allowed: blocking.length === 0, required_checkpoint_ids: ids, blocking }
}

export function checkpointVerificationOutcome(result: string, failureClass?: string | null) {
  const successful = result === 'PASS' || result === 'OBSERVED'
  const plannerGap = ['PLAN_GAP','SPEC_GAP'].includes(failureClass ?? '')
  const productFailure = failureClass === 'PRODUCT_FAILURE'
  return {
    successful,
    plannerGap,
    productFailure,
    state: result === 'PASS' ? 'SATISFIED' : result === 'OBSERVED' ? 'OBSERVED' : plannerGap ? 'NEEDS_PLANNER_REVISION' : productFailure ? 'FAILED_PRODUCT' : 'BLOCKED',
    route: successful ? 'CONTINUE' : plannerGap ? 'PLANNER_REVISION_SUPERSEDE' : productFailure ? 'CODER_REPAIR_GOAL_RECHECK_RETEST' : 'RETEST_WHEN_READY',
    retestRequired: !successful && !plannerGap,
    applicabilityStatus: successful ? 'CANDIDATE' : 'NON_APPLICABLE',
  }
}

export function productFailureRetestValidationError(
  current: any,
  targetRevision: string,
  retestOfVerificationId: string | null | undefined,
  goalRecordText: string | null | undefined,
  goalVerificationRef: string | null | undefined,
  projectId: string,
  jobId: string,
) {
  if (!current?.retest_required || !retestOfVerificationId || current.last_verification_id !== retestOfVerificationId) {
    return 'RETEST must reference the terminal verification that requested Retest.'
  }
  if (current.last_target_revision === targetRevision) {
    return 'PRODUCT_FAILURE Retest requires a repaired target revision/state.'
  }
  if (!goalRecordText || !goalVerificationRef) {
    return 'PRODUCT_FAILURE Retest requires the repaired revision Goal Recheck.'
  }
  let goal: any
  try { goal = JSON.parse(goalRecordText) } catch {
    return 'invalid repair Goal Recheck JSON.'
  }
  const expectedGoalRef = verificationPath(projectId, goal.verification_id, 'NEXT', recordNextMemoryNamespace(current) ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
  const validGoal =
    goal.kind === 'GOAL_RECHECK' &&
    goal.execution_contract === 'NEXT' &&
    sameNextMemoryNamespace(current, goal) &&
    goal.project_id === projectId &&
    goal.job_id === jobId &&
    goal.target_revision === targetRevision &&
    ['PASS','PASS_RETEST_REQUIRED'].includes(goal.result) &&
    !(goal.criteria ?? []).some((item: any) => item.result === 'NOT_MET') &&
    !(goal.scope_drift ?? []).length &&
    goalVerificationRef === expectedGoalRef
  return validGoal ? null : 'repair Goal Recheck must match the repaired target revision and have no NOT_MET/scope drift.'
}

export function nextPlanSupersessionMatches(
  current: any,
  verification: any,
  verificationRef: string,
  claim: any,
  projectId: string,
  jobId: string,
) {
  const expectedVerificationRef = verificationPath(projectId, verification?.verification_id, 'NEXT', recordNextMemoryNamespace(current) ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
  return (
    ['TEST','RETEST'].includes(verification?.kind) &&
    verification?.execution_contract === 'NEXT' &&
    sameNextMemoryNamespace(current, verification) &&
    sameNextMemoryNamespace(current, claim) &&
    verification?.project_id === projectId &&
    verification?.job_id === jobId &&
    verification?.planning_revision === current?.planning_revision &&
    ['PLAN_GAP','SPEC_GAP'].includes(verification?.failure_class) &&
    verification?.route === 'PLANNER_REVISION_SUPERSEDE' &&
    verificationRef === expectedVerificationRef &&
    claim?.kind === 'CHECKPOINT_CLAIM' &&
    claim?.execution_contract === 'NEXT' &&
    claim?.project_id === projectId &&
    claim?.job_id === jobId &&
    claim?.planning_revision === current?.planning_revision &&
    claim?.state === 'NEEDS_PLANNER_REVISION' &&
    claim?.checkpoint_id === verification?.checkpoint_id &&
    claim?.last_failure_class === verification?.failure_class &&
    claim?.last_result === verification?.result &&
    claim?.last_verification_id === verification?.verification_id &&
    claim?.lease_token === verification?.lease_token &&
    claim?.attempt_id === verification?.attempt_id &&
    claim?.last_target_revision === verification?.target_revision
  )
}
