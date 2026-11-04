import { RUNTIME_SKILLS } from './harness-catalog.ts'
import { DEFAULT_NEXT_MEMORY_NAMESPACE, resolveExecutionContract, jobExecutionContract } from './runtime-contract.ts'
import { recordNextMemoryNamespace, verificationPath, parseDurableSnapshots, validateCompletedTaskRunSnapshots } from './durable-record-io.ts'

export function nextDispatchPreflightError(
  job: any,
  role: string,
  taskIds: string[],
  requestedPlanningRevision: number | null,
  jobRecordSha: string | null,
  currentJobRecordSha: string | null,
  completedTaskRunEntries: any[],
): string | null {
  if (jobExecutionContract(job) !== 'NEXT') return null
  if (!Number.isInteger(requestedPlanningRevision) || requestedPlanningRevision !== job.planning_revision) {
    return 'NEXT_DISPATCH_STALE_PLANNING_REVISION: dispatch planning_revision must equal the current Job planning_revision.'
  }
  if (!jobRecordSha || !currentJobRecordSha || !/^[0-9a-f]{40}$/.test(jobRecordSha) || !/^[0-9a-f]{40}$/.test(currentJobRecordSha) || jobRecordSha !== currentJobRecordSha) {
    return 'NEXT_DISPATCH_STALE_JOB_SHA: supplied Job snapshot SHA must equal the immediate current Job read-back SHA.'
  }
  const completedState = validateCompletedTaskRunSnapshots(job, completedTaskRunEntries)
  if (completedState.error) return 'NEXT_DISPATCH_PREREQUISITE_INVALID: ' + completedState.error
  for (const taskId of [...new Set(taskIds.filter(Boolean))]) {
    const task = (job.tasks ?? []).find((item: any) => item.task_id === taskId)
    const stage = (job.topology ?? []).find((item: any) => item.task_id === taskId)
    if (!task || !stage) return 'NEXT_DISPATCH_TASK_INVALID: dispatch Task is missing from the current Job/topology.'
    if (task.lifecycle === 'RETIRED') return 'NEXT_DISPATCH_TASK_RETIRED: Task ' + taskId + ' is not actionable after Plan change.'
    if (stage.handler !== role) return 'NEXT_DISPATCH_WRONG_ROLE: Task ' + taskId + ' belongs to ' + String(stage.handler) + ', not ' + role + '.'
    for (const dependencyId of task.dependencies ?? []) {
      if (!completedState.completed.has(dependencyId)) {
        return 'NEXT_DISPATCH_PREREQUISITE_BLOCKED: Task ' + taskId + ' requires completed Task ' + dependencyId + '.'
      }
    }
  }
  return null
}

export function resolveRequiredTaskSkills(job: any, taskIds: string[]) {
  const names = [...new Set(
    [...new Set(taskIds.filter(Boolean))]
      .flatMap((taskId: string) => {
        const task = (job.tasks ?? []).find((item: any) => item.task_id === taskId)
        return task?.required_skills ?? []
      })
      .filter((name: any) => typeof name === 'string' && name)
  )]
  const contexts: any[] = []
  for (const name of names) {
    const skill = RUNTIME_SKILLS[name]
    if (!skill) {
      return {
        names: [],
        contexts: [],
        error: 'NEXT_DISPATCH_REQUIRED_SKILL_UNKNOWN: required Task skill is not present in the runtime skill catalog: ' + name + '.',
      }
    }
    contexts.push({ name, description: skill.description, skill_text: skill.body })
  }
  return { names, contexts, error: null as string | null }
}

export function goalRecheckCoverageError(job: any, run: any, criteria: any[]): string | null {
  if (jobExecutionContract(job) !== 'NEXT') return null
  if (
    job.project_id !== run.project_id ||
    job.job_id !== run.job_id ||
    job.planning_revision !== run.planning_revision
  ) return 'GOAL_RECHECK_COVERAGE_REJECTED: Job/Run current planning revision mismatch.'

  const taskIds = [...new Set(
    [run.primary_task_id, ...(run.affected_task_refs ?? [])]
      .filter((id: any) => typeof id === 'string' && id)
  )]
  if (!taskIds.length) return 'GOAL_RECHECK_COVERAGE_REJECTED: NEXT Coder Run has no bound Task scope.'

  const expected = new Set<string>()
  for (const taskId of taskIds) {
    const task = (job.tasks ?? []).find((item: any) => item.task_id === taskId)
    const stage = (job.topology ?? []).find((item: any) => item.task_id === taskId)
    if (!task || !stage || stage.handler !== 'coder') {
      return 'GOAL_RECHECK_COVERAGE_REJECTED: Run Task scope is not current Coder-owned topology.'
    }
    for (const criterion of task.completion_criteria ?? []) {
      expected.add(taskId + '\u0000' + String(criterion))
    }
  }

  const provided = new Set<string>()
  for (const item of criteria ?? []) {
    if (typeof item?.task_id !== 'string' || !item.task_id) {
      return 'GOAL_RECHECK_COVERAGE_REJECTED: every NEXT criterion requires task_id.'
    }
    const key = item.task_id + '\u0000' + String(item.criterion ?? '')
    if (provided.has(key)) return 'GOAL_RECHECK_COVERAGE_REJECTED: duplicate Task criterion.'
    provided.add(key)
  }

  const missing = [...expected].filter((key) => !provided.has(key))
  const extra = [...provided].filter((key) => !expected.has(key))
  if (missing.length || extra.length) {
    return 'GOAL_RECHECK_COVERAGE_REJECTED: criteria must exactly cover every approved Task completion criterion in the Run scope.'
  }
  return null
}

export function validateRunVerificationSnapshot(snapshot: any, run: any, role: 'reviewer' | 'tester', terminalResult?: string | null) {
  const parsed = parseDurableSnapshots(snapshot ? [snapshot] : [], 'run_verification_snapshot')
  if (parsed.error || parsed.entries.length !== 1) {
    return { error: 'missing or invalid durable Run Verification snapshot.', ref: null, sha: null, record: null }
  }
  const entry = parsed.entries[0]
  const record = entry.record
  const executionContract = resolveExecutionContract(run?.execution_contract)
  const runMemoryNamespace = recordNextMemoryNamespace(run)
  const expectedKind = role === 'reviewer' ? 'REVIEW' : 'TEST'
  const expectedPath = typeof record?.verification_id === 'string'
    ? verificationPath(run.project_id, record.verification_id, executionContract ?? 'V2_STABLE', runMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
    : ''
  const nextRevisionMatches =
    executionContract !== 'NEXT' ||
    (record?.planning_revision === run.planning_revision && Number.isInteger(Number(run.planning_revision)))
  const resultMatches = !terminalResult || record?.result === terminalResult
  const successLike = ['PASS','PASS_RETEST_REQUIRED','OBSERVED'].includes(record?.result)
  const successEvidenceValid =
    !successLike ||
    (Array.isArray(record?.evidence_refs) && record.evidence_refs.some((ref: any) => typeof ref === 'string' && ref.trim()))
  const reviewerSuccessValid =
    role !== 'reviewer' ||
    !['PASS','PASS_RETEST_REQUIRED'].includes(record?.result) ||
    !(Array.isArray(record?.findings) && record.findings.some((item: any) => ['CRITICAL','IMPORTANT'].includes(item?.severity)))
  const testerSuccessValid =
    role !== 'tester' ||
    !successLike ||
    record?.failure_class == null
  const valid =
    executionContract != null &&
    entry.path === expectedPath &&
    record?.kind === expectedKind &&
    record?.project_id === run.project_id &&
    record?.job_id === run.job_id &&
    record?.run_id === run.run_id &&
    record?.task_id === (run.primary_task_id ?? null) &&
    record?.producer === role &&
    resolveExecutionContract(record?.execution_contract) === executionContract &&
    (executionContract !== 'NEXT' || (runMemoryNamespace != null && recordNextMemoryNamespace(record) === runMemoryNamespace)) &&
    record?.target_ref === run.target_ref &&
    record?.target_revision === run.target_revision &&
    nextRevisionMatches &&
    resultMatches &&
    successEvidenceValid &&
    reviewerSuccessValid &&
    testerSuccessValid
  if (!valid) {
    return { error: 'Run Verification does not match exact Run/role/planning revision/target/result or required success evidence semantics.', ref: null, sha: null, record: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record }
}

export function nextClosureCoverageError(job: any, runEntries: any[], verificationEntries: any[], completionEvidenceRefs: string[]): string | null {
  if (jobExecutionContract(job) !== 'NEXT') return null
  const completedState = validateCompletedTaskRunSnapshots(job, runEntries)
  if (completedState.error) return 'NEXT_CLOSURE_COVERAGE_REJECTED: ' + completedState.error

  const requiredStages = (job.topology ?? []).filter((stage: any) => ['reviewer','tester'].includes(stage.handler))
  for (const stage of requiredStages) {
    const runMatches = runEntries.filter((entry: any) =>
      entry.record?.primary_task_id === stage.task_id &&
      entry.record?.role === stage.handler
    )
    if (runMatches.length !== 1) {
      return 'NEXT_CLOSURE_COVERAGE_REJECTED: each Reviewer/Tester Task requires exactly one selected successful current-revision Run snapshot.'
    }
    const runEntry = runMatches[0]
    const run = runEntry.record
    const verificationMatches = verificationEntries.filter((entry: any) => entry.record?.run_id === run.run_id)
    if (verificationMatches.length !== 1) {
      return 'NEXT_CLOSURE_COVERAGE_REJECTED: each selected Reviewer/Tester Run requires exactly one durable matching Verification snapshot.'
    }
    const verificationEntry = verificationMatches[0]
    const verified = validateRunVerificationSnapshot(
      { path: verificationEntry.path, sha: verificationEntry.sha, record_text: verificationEntry.record_text },
      run,
      stage.handler,
      run.result,
    )
    if (verified.error) return 'NEXT_CLOSURE_COVERAGE_REJECTED: ' + verified.error
    if (!(completionEvidenceRefs ?? []).includes(runEntry.path) || !(completionEvidenceRefs ?? []).includes(verificationEntry.path)) {
      return 'NEXT_CLOSURE_COVERAGE_REJECTED: selected closure Run and Verification paths must be present in completion_evidence_refs.'
    }
  }
  return null
}

export function durableSnapshotReadbackSteps(snapshots: any[], label: string) {
  return (snapshots ?? []).map((snapshot: any) =>
    'Read back ' + label + ' at ' + snapshot.path + ' and require blob SHA=' + snapshot.sha + ' plus byte-identical record_text before the consequential persistence step.'
  )
}
