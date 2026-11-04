import { sourceMutationRecoveryDecision } from './recovery-decisions.ts'
import { jobExecutionContract } from './runtime-contract.ts'
import type { NextMemoryNamespace } from './runtime-contract.ts'
import { recordNextMemoryNamespace, executionMemoryRoot } from './durable-record-io.ts'

export function executionCursorPath(projectId: string, jobId: string, namespace: NextMemoryNamespace) {
  return executionMemoryRoot(projectId, 'NEXT', namespace) +
    '/WORK/EXECUTION_CURSORS/' + jobId + '.json'
}

// Pure preflight. GitHub blob SHA compare-and-swap and independent readback are
// performed by the calling orchestrator, NOT by this request/response MCP.
export function prepareExecutionCursorDecision(input: any) {
  const validSha = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
  const block = (reason: string) => ({ allowed: false, reason, operation: 'NONE', record: null })
  let job: any, old: any = null
  try { job = JSON.parse(input.job_record_text) } catch { return block('INVALID_JOB_RECORD') }
  // LLC58: distinguish historical Job contract incompatibility from wrong identity
  // or terminal lifecycle. A V2_STABLE Job cannot acquire a NEXT cursor merely
  // because the production *creation default* is NEXT.
  if (!job || typeof job !== 'object' || Array.isArray(job) ||
      (job.kind != null && job.kind !== 'JOB'))
    return block('JOB_RECORD_KIND_INVALID')
  if (job.project_id !== input.project_id) return block('PROJECT_ID_MISMATCH')
  if (job.job_id !== input.job_id) return block('JOB_ID_MISMATCH')
  if (jobExecutionContract(job) === 'V2_STABLE') return block('LEGACY_JOB_CURSOR_NOT_APPLICABLE')
  if (job.execution_contract !== 'NEXT') return block('JOB_EXECUTION_CONTRACT_INCOMPATIBLE')
  if (!Number.isInteger(job.planning_revision) || job.planning_revision < 1)
    return block('JOB_PLAN_REVISION_INVALID')
  if (!['DRAFT','READY','IN_PROGRESS'].includes(job.lifecycle)) return block('JOB_LIFECYCLE_INVALID')
  if (job.plan_change_pending) return block('PLAN_CHANGE_PENDING_FENCE')
  const namespace = recordNextMemoryNamespace(job)
  if (!namespace || namespace !== input.memory_namespace) return block('CURSOR_NAMESPACE_MISMATCH')
  if (typeof input.work_branch !== 'string' || !input.work_branch.trim() ||
      !validSha(input.observed_head_sha)) return block('INVALID_BRANCH_OR_GIT_READBACK')
  if ((input.cursor_record_text == null) !== (input.cursor_record_sha == null)) return block('INCOMPLETE_CURSOR_SNAPSHOT')
  if (input.cursor_record_text != null) {
    if (!validSha(input.cursor_record_sha)) return block('INVALID_CURSOR_SHA')
    try { old = JSON.parse(input.cursor_record_text) } catch { return block('INVALID_CURSOR_JSON') }
    if (old?.kind !== 'EXECUTION_CURSOR' || old.version !== 1 ||
        old.project_id !== input.project_id || old.job_id !== input.job_id ||
        old.execution_contract !== 'NEXT' || old.memory_namespace !== namespace ||
        old.planning_revision !== job.planning_revision ||
        old.work_branch !== input.work_branch || !validSha(old.last_good_sha) ||
        !['STABLE','PENDING'].includes(old.state)) return block('STALE_OR_INVALID_CURSOR')
  }
  let next: any
  const event = input.event
  if ((event === 'BEGIN_MUTATION' || event === 'COMPLETE_MUTATION') &&
      job.lifecycle !== 'IN_PROGRESS') return block('JOB_NOT_IN_PROGRESS')
  if (event === 'INITIALIZE') {
    if (old) return block('CURSOR_ALREADY_EXISTS')
    if (!input.checkpoint_id?.trim()) return block('CHECKPOINT_ID_REQUIRED')
    next = {
      kind: 'EXECUTION_CURSOR', version: 1,
      project_id: input.project_id, job_id: input.job_id,
      execution_contract: 'NEXT', memory_namespace: namespace,
      planning_revision: job.planning_revision, work_branch: input.work_branch,
      state: 'STABLE', last_good_sha: input.observed_head_sha,
      last_completed_checkpoint: input.checkpoint_id,
      pending_action: null, last_operation_id: null, retry_count: 0, stalled_cycles: 0, progress_fingerprint: input.observed_head_sha,
    }
  } else if (event === 'BEGIN_MUTATION') {
    // First consequential mutation initializes PENDING in a single Memory write:
    // no separate INITIALIZE round trip or Job lifecycle transition required.
    if (old && old.state !== 'STABLE') return block('PENDING_MUTATION_REQUIRES_RECONCILIATION')
    if (old && input.observed_head_sha !== old.last_good_sha) return block('SOURCE_HEAD_ADVANCED_RECONCILE')
    if (!old && !input.checkpoint_id?.trim()) return block('INITIAL_CHECKPOINT_REQUIRED')
    const kind = input.mutation_kind ?? 'FILE'
    const fileIntentValid = kind === 'FILE' && input.target_path?.trim() &&
      !input.target_path.startsWith('/') && !input.target_path.split('/').includes('..') &&
      validSha(input.intended_blob_sha) &&
      (input.previous_blob_sha === null || validSha(input.previous_blob_sha)) &&
      input.intended_blob_sha !== input.previous_blob_sha
    const treeIntentValid = kind === 'TREE' && validSha(input.previous_tree_sha) &&
      validSha(input.intended_tree_sha) && input.previous_tree_sha !== input.intended_tree_sha
    if (!input.operation_id?.trim() || !(fileIntentValid || treeIntentValid))
      return block('INVALID_WRITE_INTENT')
    next = {
      ...(old ?? {
        kind: 'EXECUTION_CURSOR', version: 1,
        project_id: input.project_id, job_id: input.job_id,
        execution_contract: 'NEXT', memory_namespace: namespace,
        planning_revision: job.planning_revision, work_branch: input.work_branch,
        last_good_sha: input.observed_head_sha,
        last_completed_checkpoint: input.checkpoint_id,
        last_operation_id: null,
        progress_fingerprint: input.observed_head_sha,
      }),
      state: 'PENDING',
      pending_action: {
        operation_id: input.operation_id, mutation_kind: kind,
        expected_head_sha: old?.last_good_sha ?? input.observed_head_sha,
        ...(kind === 'TREE'
          ? { previous_tree_sha: input.previous_tree_sha, intended_tree_sha: input.intended_tree_sha }
          : { target_path: input.target_path, previous_blob_sha: input.previous_blob_sha,
              intended_blob_sha: input.intended_blob_sha }),
      }, retry_count: 0, stalled_cycles: 0,
    }
  } else if (!old) return block('CURSOR_NOT_PERSISTED')
  else if (event === 'COMPLETE_MUTATION') {
    const pending = old.pending_action
    if (old.state !== 'PENDING' || !pending ||
        !input.operation_id || input.operation_id !== pending.operation_id ||
        !input.checkpoint_id?.trim() ||
        input.observed_head_sha === pending.expected_head_sha ||
        !validSha(input.observed_parent_sha) ||
        input.observed_parent_sha !== pending.expected_head_sha ||
        (pending.mutation_kind === 'TREE'
          ? !validSha(input.observed_tree_sha) ||
            input.observed_tree_sha !== pending.intended_tree_sha
          : !validSha(input.observed_blob_sha) ||
            input.observed_blob_sha !== pending.intended_blob_sha))
      return block('PENDING_MUTATION_NOT_PROVEN')
    next = {
      ...old, state: 'STABLE', pending_action: null,
      last_operation_id: pending.operation_id,
      last_good_sha: input.observed_head_sha, last_completed_checkpoint: input.checkpoint_id,
      retry_count: 0, stalled_cycles: 0, progress_fingerprint: input.observed_head_sha,
    }
  } else if (event === 'RECORD_RETRY') {
    const p = old.pending_action
    const unchangedTarget = p?.mutation_kind === 'TREE'
      ? validSha(input.observed_tree_sha) && input.observed_tree_sha === p.previous_tree_sha
      : (input.observed_blob_sha === null || validSha(input.observed_blob_sha)) &&
        input.observed_blob_sha !== undefined && input.observed_blob_sha === p?.previous_blob_sha
    if (old.state !== 'PENDING' || !p ||
        input.operation_id !== p.operation_id ||
        input.observed_head_sha !== p.expected_head_sha ||
        !unchangedTarget ||
        !Number.isInteger(old.retry_count) || old.retry_count >= 2)
      return block('RETRY_BLOCKED_OR_EXHAUSTED')
    // Only after an independent NOT_APPLIED readback, and before a real
    // source retry. Extra durability cost occurs solely on failure recovery.
    next = { ...old, retry_count: old.retry_count + 1 }
  } else if (event === 'SAVE_CHECKPOINT') {
    if (old.state !== 'STABLE' || input.observed_head_sha !== old.last_good_sha ||
        !input.checkpoint_id?.trim() || input.checkpoint_id === old.last_completed_checkpoint)
      return block('CHECKPOINT_NOT_PROVEN_OR_UNCHANGED')
    next = { ...old, last_completed_checkpoint: input.checkpoint_id, stalled_cycles: 0 }
  } else if (event === 'RECORD_PAUSE') {
    if (!Number.isInteger(input.stalled_cycles) || input.stalled_cycles < 3 ||
        input.observed_head_sha !== old.last_good_sha) return block('PAUSE_NOT_PROVEN')
    if (old.stalled_cycles >= input.stalled_cycles) return block('PAUSE_ALREADY_RECORDED')
    next = { ...old, stalled_cycles: input.stalled_cycles }
  } else return block('UNKNOWN_CURSOR_EVENT')
  return { allowed: true, reason: 'PREPARED_NOT_PERSISTED',
    operation: old ? 'UPDATE' : 'CREATE', record: next }
}

// Restart consumes ONE immutable cursor snapshot plus fresh source readback;
// only pending intent needs target-blob inspection. No extra per-tool queries.
export function resumeExecutionCursorDecision(input: any) {
  const validSha = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
  const stop = (reason: string) => ({ disposition: 'STOP_AND_RECONCILE', reason, source_write_authorized: false })
  let job: any, cursor: any
  try { job = JSON.parse(input.job_record_text); cursor = JSON.parse(input.cursor_record_text) }
  catch { return stop('INVALID_DURABLE_RECORD') }
  if (!validSha(input.cursor_record_sha) || !validSha(input.current_head_sha) ||
      (job?.kind != null && job.kind !== 'JOB') || job.project_id !== input.project_id ||
      job.job_id !== input.job_id || job.execution_contract !== 'NEXT' ||
      cursor?.kind !== 'EXECUTION_CURSOR' || cursor.version !== 1 ||
      cursor.project_id !== job.project_id || cursor.job_id !== job.job_id ||
      cursor.execution_contract !== 'NEXT' ||
      cursor.memory_namespace !== recordNextMemoryNamespace(job) ||
      cursor.planning_revision !== job.planning_revision ||
      cursor.work_branch !== input.work_branch || !validSha(cursor.last_good_sha) ||
      !['STABLE','PENDING'].includes(cursor.state) ||
      input.cursor_memory_path !== executionCursorPath(job.project_id, job.job_id, cursor.memory_namespace))
    return stop('CURSOR_IDENTITY_OR_REVISION_MISMATCH')
  if (['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(job.lifecycle)) return stop('TERMINAL_JOB')
  if (cursor.state === 'STABLE') {
    if (cursor.pending_action != null || input.current_head_sha !== cursor.last_good_sha)
      return stop('SOURCE_ADVANCED_WITHOUT_DURABLE_INTENT')
    return { disposition: 'RESUME_FROM_CHECKPOINT', reason: cursor.last_completed_checkpoint,
      source_write_authorized: false }
  }
  const p = cursor.pending_action
  if (!p || !p.operation_id || !validSha(p.expected_head_sha) ||
      p.expected_head_sha !== cursor.last_good_sha ||
      !['FILE','TREE'].includes(p.mutation_kind ?? 'FILE'))
    return stop('INCOMPLETE_PENDING_INTENT_OR_READBACK')
  let decision: any
  if (p.mutation_kind === 'TREE') {
    if (!validSha(p.previous_tree_sha) || !validSha(p.intended_tree_sha) ||
        !validSha(input.current_tree_sha)) return stop('TREE_READBACK_REQUIRED')
    if (input.current_head_sha === p.expected_head_sha) {
      decision = input.current_tree_sha === p.previous_tree_sha
        ? { disposition: 'NOT_APPLIED', reason: 'UNCHANGED_AUTHORITATIVE_TREE', next_action: 'REAUTHORIZE_FROM_CURRENT_HEAD' }
        : { disposition: 'UNKNOWN_CONFLICT', reason: 'INCONSISTENT_HEAD_AND_TREE', next_action: 'STOP_AND_RECONCILE' }
    } else {
      decision = input.current_tree_sha === p.intended_tree_sha
        ? { disposition: 'TARGET_STATE_PRESENT', reason: 'EXPECTED_TREE_OBSERVED', next_action: 'RECONCILE_INTERVENING_COMMITS' }
        : { disposition: 'UNKNOWN_CONFLICT', reason: 'SOURCE_HEAD_OR_TREE_DIVERGED', next_action: 'STOP_AND_RECONCILE' }
    }
  } else {
    if (!p.target_path || !validSha(p.intended_blob_sha) ||
        !(p.previous_blob_sha === null || validSha(p.previous_blob_sha)) ||
        !(input.current_blob_sha === null || validSha(input.current_blob_sha)))
      return stop('FILE_READBACK_REQUIRED')
    decision = sourceMutationRecoveryDecision({
      operation_id: p.operation_id, expected_head_sha: p.expected_head_sha,
      current_head_sha: input.current_head_sha, previous_blob_sha: p.previous_blob_sha,
      intended_blob_sha: p.intended_blob_sha, current_blob_sha: input.current_blob_sha,
    })
  }
  // An unchanged target is not permission to write; reauthorize and read back first.
  return { disposition: decision.disposition, reason: decision.reason,
    next_action: decision.next_action, operation_id: p.operation_id,
    last_completed_checkpoint: cursor.last_completed_checkpoint, source_write_authorized: false }
}

// GSA Reliability: pure, read-only reconstruction helpers.
// Callers MUST obtain each input from independent authoritative Git readback.
// These decisions are NOT mutation authorization and are not a second lifecycle.
// LLC60: one typed, readback-gated *advisory* continuation after a planning
// tool's external GitHub Memory Repo writes. This is not a scheduler, a source
// mutation authorization, a substitute for a fresh Job SHA, or persisted state.
