// GSA1-S2: cohesive LLC58 Human Plan Change decision domain.
export function createPlanChangeDecisions(deps: {
  jobExecutionContract: any
  executionMemoryRoot: any
  uuidv7: any
  jobHandle: any
  recordNextMemoryNamespace: any
  verificationPath: any
  DEFAULT_NEXT_MEMORY_NAMESPACE: any
}) {
  const { jobExecutionContract, executionMemoryRoot, uuidv7, jobHandle, recordNextMemoryNamespace, verificationPath, DEFAULT_NEXT_MEMORY_NAMESPACE } = deps
function isRecognizedJobRecordShape(job: any): boolean {
  return job != null && typeof job === 'object' && !Array.isArray(job) &&
    (job.kind == null || job.kind === 'JOB') &&
    typeof job.project_id === 'string' && typeof job.job_id === 'string' &&
    jobExecutionContract(job) !== null &&
    Number.isInteger(job.planning_revision) && job.planning_revision >= 1 &&
    ['DRAFT','READY','IN_PROGRESS','COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(job.lifecycle)
}


/** U-B: scope boundary is read from the reviewed Plan, not a per-Job vote.
 * The supplied inventory must be independently compared to all current child
 * Jobs in Project Memory; this pure helper can only check supplied coverage. */
function resolveScopeWideAssessment(input: any) {
  const s = input.scope_selection
  if (s == null) return { allowed: true, snapshots: input.job_snapshots, scope: null }
  if (s.boundary !== 'PLAN' && s.boundary !== 'PHASE')
    return { allowed: false, reason: 'SCOPE_BOUNDARY_INVALID' }
  if ((s.boundary === 'PHASE' && (typeof s.phase !== 'string' || !s.phase.trim())) ||
      (s.boundary === 'PLAN' && s.phase != null))
    return { allowed: false, reason: 'SCOPE_PHASE_INVALID' }
  if (!Array.isArray(input.job_snapshots) || !input.job_snapshots.length ||
      !Array.isArray(s.inventory_job_ids) || !s.inventory_job_ids.length ||
      s.inventory_job_ids.some((id: any) => typeof id !== 'string' || !id) ||
      new Set(s.inventory_job_ids).size !== s.inventory_job_ids.length)
    return { allowed: false, reason: 'SCOPE_INVENTORY_REQUIRED' }
  const jobs: any[] = []
  const seen = new Set<string>()
  for (const snap of input.job_snapshots) {
    let job: any
    try { job = JSON.parse(snap.job_record_text) }
    catch { return { allowed: false, reason: 'SCOPE_JOB_JSON_INVALID' } }
    if (!isRecognizedJobRecordShape(job) || seen.has(job.job_id))
      return { allowed: false, reason: 'SCOPE_JOB_INVALID_OR_DUPLICATE' }
    if (s.boundary === 'PHASE' && (typeof job.planning_context?.phase !== 'string' ||
      !job.planning_context.phase.trim()))
      return { allowed: false, reason: 'SCOPE_JOB_PHASE_UNVERIFIED' }
    seen.add(job.job_id)
    jobs.push({ snap, job })
  }
  if (seen.size !== s.inventory_job_ids.length ||
      s.inventory_job_ids.some((id: string) => !seen.has(id)))
    return { allowed: false, reason: 'SCOPE_INVENTORY_INCOMPLETE' }
  const inBoundary = (job: any) => s.boundary === 'PLAN' || job.planning_context.phase === s.phase
  const unfinished = (job: any) => !['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(job.lifecycle)
  const affected = new Set(jobs.filter(({job}) => inBoundary(job) && unfinished(job))
    .map(({job}) => job.job_id))
  if (!affected.size) return { allowed: false, reason: 'SCOPE_NO_UNFINISHED_WORK' }
  const snapshots = jobs.map(({snap,job}) => {
    const outsideDependency = !inBoundary(job) && Array.isArray(job.dependencies) &&
      job.dependencies.some((dep: any) => affected.has(typeof dep === 'string' ? dep : dep?.job_id))
    const decision = inBoundary(job) && unfinished(job) ? 'RETIRE' :
      outsideDependency && unfinished(job) ? 'REVALIDATE' : 'KEEP'
    if (snap.decision != null && snap.decision !== decision)
      return { error: 'SCOPE_PER_JOB_DECISION_CONFLICT' }
    if (snap.retired_task_ids?.length && decision !== 'RETIRE')
      return { error: 'SCOPE_TASK_DECISION_CONFLICT' }
    return {
      ...snap, decision,
      reason: snap.reason || (decision === 'RETIRE' ? 'Retire unfinished work in reviewed changed scope' :
        decision === 'REVALIDATE' ? 'Cross-boundary dependency requires current-revision review' :
          'Preserve unaffected or completed historical work'),
      retired_task_ids: decision === 'RETIRE' ?
        (job.tasks ?? []).filter((task: any) =>
          !['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(task.lifecycle))
          .map((task: any) => task.task_id) : [],
    }
  })
  if (snapshots.some((snap: any) => snap.error))
    return { allowed: false, reason: snapshots.find((snap: any) => snap.error).error }
  return { allowed: true, snapshots, scope: {
    boundary: s.boundary, phase: s.boundary === 'PHASE' ? s.phase : null,
    inventory_job_ids: [...s.inventory_job_ids].sort(),
    affected_job_ids: [...affected].sort(),
  } }
}

function reserveScopeRebuildJobs(input: any, known: Set<string>) {
  const packs = input.rebuild_job_packs ?? []
  if (!Array.isArray(packs) || packs.some((p: any) =>
      !p || typeof p.pack_key !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(p.pack_key) ||
      typeof p.phase !== 'string' || !p.phase.trim() ||
      !Array.isArray(p.depends_on_pack_keys) ||
      p.depends_on_pack_keys.some((key: any) => typeof key !== 'string')))
    return null
  const keys = new Set(packs.map((p: any) => p.pack_key))
  if (keys.size !== packs.length) return null
  const graph = new Map(packs.map((p: any) => [p.pack_key, p.depends_on_pack_keys]))
  for (const p of packs) if (new Set(p.depends_on_pack_keys).size !== p.depends_on_pack_keys.length ||
      p.depends_on_pack_keys.includes(p.pack_key) ||
      p.depends_on_pack_keys.some((key: string) => !keys.has(key))) return null
  const done = new Set<string>(), visiting = new Set<string>()
  const walk = (key: string): boolean => {
    if (visiting.has(key)) return false
    if (done.has(key)) return true
    visiting.add(key)
    for (const dep of graph.get(key) ?? []) if (!walk(dep)) return false
    visiting.delete(key); done.add(key); return true
  }
  if ([...keys].some((key) => !walk(key))) return null
  const reserved: any[] = []
  for (const p of packs) {
    let id = uuidv7()
    for (let n = 0; known.has(id) && n < 4; n++) id = uuidv7()
    if (known.has(id)) return null
    known.add(id)
    reserved.push({ pack_key: p.pack_key, phase: p.phase, job_id: id,
      depends_on_pack_keys: p.depends_on_pack_keys })
  }
  return reserved
}

function assessHumanPlanChangeJobs(input: any) {
  const sha = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
  const reject = (reason: string) => ({ allowed: false, reason, decisions: [], mutation_authorized: false })
  if (!input?.project_id || !input?.change_ref || !sha(input?.reviewed_plan_sha))
    return reject('PLAN_CHANGE_REVIEWED_TARGET_REQUIRED')
  if (!Array.isArray(input.job_snapshots) || input.job_snapshots.length === 0)
    return reject('PLAN_CHANGE_JOB_SNAPSHOTS_REQUIRED')
  const scoped = input.scope_selection ? resolveScopeWideAssessment(input) : { allowed:true, snapshots: input.job_snapshots, scope:null }
  if (!scoped.allowed) return reject(scoped.reason)
  const ids = new Set<string>()
  const rows: any[] = []
  for (const item of scoped.snapshots) {
    let job: any
    try { job = JSON.parse(item.job_record_text) }
    catch { return reject('PLAN_CHANGE_JOB_JSON_INVALID') }
    if (!isRecognizedJobRecordShape(job) || job.project_id !== input.project_id || !job.job_id ||
        !sha(item.job_record_sha)) return reject('PLAN_CHANGE_JOB_IDENTITY_OR_SHA_INVALID')
    if (ids.has(job.job_id)) return reject('PLAN_CHANGE_DUPLICATE_JOB')
    ids.add(job.job_id)
    if (!['KEEP','REVALIDATE','REPLACE','RETIRE','HUMAN_DECISION'].includes(item.decision) ||
        typeof item.reason !== 'string' || !item.reason.trim())
      return reject('PLAN_CHANGE_DECISION_AND_REASON_REQUIRED')
    const lifecycle = job.lifecycle
    const retiredTaskIds = item.retired_task_ids ?? []
    if (!Array.isArray(retiredTaskIds) || retiredTaskIds.some((id: any) => typeof id !== 'string' || !id || !(job.tasks ?? []).some((task: any) => task.task_id === id)) ||
        new Set(retiredTaskIds).size !== retiredTaskIds.length ||
        (item.decision !== 'REPLACE' && item.decision !== 'RETIRE' && retiredTaskIds.length))
      return reject('PLAN_CHANGE_RETIRED_TASK_SCOPE_INVALID')
    if (!['DRAFT','READY','IN_PROGRESS','COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(lifecycle))
      return reject('PLAN_CHANGE_JOB_LIFECYCLE_INVALID')
    const oldContract = jobExecutionContract(job)
    if (!oldContract) return reject('PLAN_CHANGE_JOB_CONTRACT_INVALID')
    // Historical finished work is immutable. New follow-up work must use
    // a new Job, not reactivation or retrospective PASS reassignment.
    if (['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(lifecycle) &&
        !['KEEP','REVALIDATE'].includes(item.decision))
      return reject('PLAN_CHANGE_TERMINAL_JOB_CANNOT_BE_REPLACED')
    let nextAction = 'KEEP_UNCHANGED'
    if (item.decision === 'HUMAN_DECISION') nextAction = 'STOP_FOR_HUMAN_DECISION'
    else if (item.decision === 'REVALIDATE') nextAction = 'REVALIDATE_DEPENDENCIES_AND_EVIDENCE'
    else if (item.decision === 'REPLACE' || item.decision === 'RETIRE') {
      // A cursor/Run state is a readback claim, not an authorization. Any
      // unfinished or unknown activity blocks replacement until reconciled.
      if (lifecycle === 'IN_PROGRESS' &&
          (item.cursor_state !== 'STABLE' && item.cursor_state !== 'ABSENT'))
        nextAction = 'RECONCILE_PENDING_CURSOR_BEFORE_SUPERSEDE'
      else if (lifecycle === 'IN_PROGRESS' &&
          !['NONE','TERMINAL'].includes(item.active_run_state))
        nextAction = 'SETTLE_ACTIVE_RUN_BEFORE_SUPERSEDE'
      else nextAction = item.decision === 'RETIRE' ? 'RETIRE_WITHOUT_REPLACEMENT' : 'SUPERSEDE_AND_CREATE_NEW_UNIQUE_JOB'
    }
    rows.push({
      job_id: job.job_id, job_sha: item.job_record_sha,
      planning_revision: job.planning_revision, lifecycle,
      execution_contract: oldContract, decision: item.decision,
      reason: item.reason, next_action: nextAction,
      retired_task_ids: retiredTaskIds,
      ...(scoped.scope ? {
        scope_affected: scoped.scope.affected_job_ids.includes(job.job_id),
        historical_task_ids: (job.tasks ?? []).map((t: any) => t.task_id),
        historical_milestone_ids: (job.milestones ?? []).map((m: any) => m.milestone_id),
      } : {}),
      old_evidence_applicable_to_new_job: false,
    })
  }
  return {
    allowed: true, reason: 'ASSESSMENT_ONLY_REQUIRES_REVIEWED_PLAN_AND_FRESH_MEMORY_READBACK',
    decisions: rows, ...(scoped.scope ? { scope_selection: scoped.scope } : {}),
    mutation_authorized: false,
  }
}

// LLC58: immutable, deterministic-by-reviewed-Plan-revision reconciliation
// intent. Preparation is not durable: the caller must CREATE at the one
// expected Memory Repo path, then read back the full blob before ANY Job
// transition. No normal tool call or legacy Job requires this record.
function prepareHumanPlanChangeIntent(input: any) {
  const sha = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
  const deny = (reason: string) => ({
    allowed: false, reason, operation: 'NONE', intent_memory_path: '',
    intent_record_text: null, mutation_authorized: false, external_steps: [],
  })
  let planJob: any, verification: any
  try {
    planJob = JSON.parse(input.plan_job_record_text)
    verification = JSON.parse(input.plan_review_record_text)
  } catch { return deny('PLAN_CHANGE_PLAN_REVIEW_RECORD_INVALID') }
  if (!isRecognizedJobRecordShape(planJob) || planJob.type !== 'plan' ||
      planJob.project_id !== input.project_id ||
      !planJob.job_id || !sha(input.plan_job_record_sha) ||
      !Number.isInteger(planJob.planning_revision) || planJob.planning_revision < 1 ||
      !['READY','IN_PROGRESS','COMPLETED'].includes(planJob.lifecycle))
    return deny('PLAN_CHANGE_PLAN_JOB_INVALID')
  if (planJob.planning_review?.status !== 'PASS' ||
      planJob.planning_review?.reviewed_revision !== planJob.planning_revision)
    return deny('PLAN_CHANGE_REVIEW_NOT_PASSED')
  const contract = jobExecutionContract(planJob)
  if (!contract) return deny('PLAN_CHANGE_PLAN_CONTRACT_INVALID')
  const ns = recordNextMemoryNamespace(planJob)
  if (contract === 'NEXT' && !ns) return deny('PLAN_CHANGE_NAMESPACE_INVALID')
  const expectedRef = verificationPath(input.project_id, verification?.verification_id,
    contract, ns ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
  if (verification?.kind !== 'PLANNING_REVIEW' ||
      verification.project_id !== input.project_id ||
      verification.job_id !== planJob.job_id ||
      verification.planning_revision !== planJob.planning_revision ||
      verification.result !== 'PASS' || verification.producer !== 'reviewer' ||
      jobExecutionContract(verification) !== contract ||
      (contract === 'NEXT' && verification.memory_namespace !== ns) ||
      planJob.planning_review?.verification_ref !== expectedRef ||
      !sha(input.plan_review_record_sha) ||
      input.plan_review_memory_path !== expectedRef)
    return deny('PLAN_CHANGE_REVIEW_IDENTITY_OR_REF_MISMATCH')
  if (typeof input.work_branch !== 'string' || !input.work_branch.trim())
    return deny('PLAN_CHANGE_WORK_BRANCH_REQUIRED')
  // Path is stable across lost responses and independent of randomness;
  // duplicate CREATE is a collision to read/reconcile, never an overwrite.
  const changeId = planJob.job_id + '-r' + planJob.planning_revision
  const path = executionMemoryRoot(input.project_id, contract,
    ns ?? DEFAULT_NEXT_MEMORY_NAMESPACE) +
    '/WORK/PLAN_RECONCILIATIONS/' + changeId + '.json'
  if (input.existing_intent_record_text != null) {
    let old: any
    try { old = JSON.parse(input.existing_intent_record_text) }
    catch { return deny('PLAN_CHANGE_EXISTING_INTENT_INVALID') }
    const proposedScope = input.scope_selection == null ? null : {
      boundary: input.scope_selection.boundary,
      phase: input.scope_selection.boundary === 'PHASE' ? input.scope_selection.phase : null,
      inventory_job_ids: [...(input.scope_selection.inventory_job_ids ?? [])].sort(),
    }
    if (JSON.stringify(old.scope_selection && {
        boundary: old.scope_selection.boundary, phase: old.scope_selection.phase,
        inventory_job_ids: old.scope_selection.inventory_job_ids,
      } || null) !== JSON.stringify(proposedScope) ||
        JSON.stringify((old.rebuild_jobs ?? []).map((j: any) => ({
          pack_key: j.pack_key, phase: j.phase, depends_on_pack_keys: j.depends_on_pack_keys,
        }))) !== JSON.stringify(input.rebuild_job_packs ?? []))
      return deny('PLAN_CHANGE_EXISTING_SCOPE_OR_REBUILD_CONFLICT')
    if (!sha(input.existing_intent_record_sha) ||
        old?.kind !== 'PLAN_RECONCILIATION_INTENT' || old.version !== 1 ||
        old.project_id !== input.project_id || old.change_id !== changeId ||
        old.reviewed_plan_sha !== input.reviewed_plan_sha ||
        old.plan_review_ref !== expectedRef ||
        old.work_branch !== input.work_branch ||
        !Array.isArray(old.actions))
      return deny('PLAN_CHANGE_EXISTING_INTENT_CONFLICT')
    return {
      allowed: true, reason: 'EXISTING_INTENT_REUSE_REQUIRES_FRESH_READBACK',
      operation: 'NONE', intent_memory_path: path,
      intent_record_text: input.existing_intent_record_text,
      mutation_authorized: false,
      external_steps: ['Independently reread existing intent blob and all affected Job/Run/cursor state before resuming.'],
    }
  }
  // Existing durable intent wins over a freshly reclassified predecessor:
  // terminal SUPERSEDED Jobs are expected during interrupted resume.
  const impact = assessHumanPlanChangeJobs(input)
  if (!impact.allowed) return deny(impact.reason)
  if (impact.decisions.some((row: any) => row.decision === 'HUMAN_DECISION'))
    return deny('PLAN_CHANGE_HUMAN_DECISION_UNRESOLVED')
  const known = new Set(impact.decisions.map((row: any) => row.job_id))
  const rebuildJobs = impact.scope_selection ? reserveScopeRebuildJobs(input, known) : []
  if (!rebuildJobs) return deny('SCOPE_REBUILD_PACKS_INVALID')
  const actions = impact.decisions.map((row: any) => {
    let replacement: any = null
    if (row.decision === 'REPLACE') {
      let id = uuidv7()
      for (let k = 0; known.has(id) && k < 4; k++) id = uuidv7()
      if (known.has(id)) return null
      known.add(id)
      replacement = { job_id: id, handle: jobHandle(id) }
    }
    return {
      action_key: row.job_id + ':' + row.decision,
      predecessor_job_id: row.job_id, predecessor_job_sha: row.job_sha,
      predecessor_lifecycle: row.lifecycle,
      predecessor_planning_revision: row.planning_revision,
      predecessor_execution_contract: row.execution_contract,
      decision: row.decision, reason: row.reason,
      retired_task_ids: row.retired_task_ids,
      ...(impact.scope_selection ? {
        historical_task_ids: row.historical_task_ids,
        historical_milestone_ids: row.historical_milestone_ids,
      } : {}),
      initial_next_action: row.next_action,
      replacement,
      old_evidence_applicable_to_new_job: false,
    }
  })
  if (actions.some((x: any) => x === null)) return deny('PLAN_CHANGE_RESERVED_ID_COLLISION')
  const intent = {
    kind: 'PLAN_RECONCILIATION_INTENT', version: 1,
    project_id: input.project_id, change_id: changeId,
    plan_job_id: planJob.job_id, plan_job_revision: planJob.planning_revision,
    plan_job_sha: input.plan_job_record_sha,
    reviewed_plan_ref: input.change_ref, reviewed_plan_sha: input.reviewed_plan_sha,
    plan_review_ref: expectedRef, plan_review_blob_sha: input.plan_review_record_sha,
    execution_contract: contract,
    ...(contract === 'NEXT' ? { memory_namespace: ns } : {}),
    work_branch: input.work_branch,
    ...(impact.scope_selection ? {
      scope_selection: impact.scope_selection, rebuild_jobs: rebuildJobs,
    } : {}),
    actions, created_at: new Date().toISOString(),
  }
  return {
    allowed: true, reason: 'INTENT_PREPARED_NOT_PERSISTED',
    operation: 'CREATE', intent_memory_path: path,
    intent_record_text: JSON.stringify(intent, null, 2) + '\n',
    mutation_authorized: false,
    external_steps: [
      'Independently re-read Project, plan Job, PASS planning-review Verification, approved Plan target and every affected Job at exact blob SHAs.',
      'Authorize exact active Project and target Memory Repo path for CREATE.',
      'GitHub CREATE intent at deterministic path; on collision READ existing path and reconcile, NEVER overwrite.',
      'Independently read back exact intent bytes/blob SHA before any Run/Job lifecycle or replacement writes.',
      'Before SUPERSEDED or RETIRED, settle active Run and cursor PENDING with authoritative Git readback; use exact Job SHA CAS.',
      'RETIRE creates no replacement Job. Only REPLACE creates a reserved successor with the same immutable intent and exact readback.',
    ],
  }
}

// LLC58 recovery: decision comes from immutable Plan intent + *fresh* exact
// Job readbacks. Returning a next action is NEVER memory/source authorization.
// LLC58: safe supersession is an explicit, intent-bound Job transition,
// never an inferred consequence of a cursor rejection or default NEXT mode.
// Pure preflight only; memory path SHA/readback and absence of active Runs
// remain external authorization checks, not accepted as model assertions.
// LLC58: serialize an affected Job's reviewed Plan fence before settling
// its active Run/cursor and before terminal supersession. Only a real Job
// exact-SHA GitHub update + readback makes this effective across chats.
function prepareHumanPlanChangeFenceDecision(input: any) {
  const sha = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
  const reject = (reason: string) => ({ allowed: false, reason, operation: 'NONE',
    record: null, expected_job_sha: null, mutation_authorized: false })
  let intent: any, job: any
  try { intent=JSON.parse(input.intent_record_text); job=JSON.parse(input.job_record_text) }
  catch { return reject('PLAN_CHANGE_FENCE_RECORD_JSON_INVALID') }
  if (!sha(input.intent_record_sha) || !sha(input.job_record_sha) ||
      !isRecognizedJobRecordShape(job) || job.project_id !== input.project_id ||
      job.job_id !== input.job_id || intent?.kind !== 'PLAN_RECONCILIATION_INTENT' ||
      intent.version !== 1 || intent.project_id !== input.project_id ||
      !intent.change_id || !Array.isArray(intent.actions))
    return reject('PLAN_CHANGE_FENCE_IDENTITY_INVALID')
  const root=executionMemoryRoot(input.project_id,intent.execution_contract,
    intent.memory_namespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
  if (input.intent_memory_path !== root+'/WORK/PLAN_RECONCILIATIONS/'+intent.change_id+'.json')
    return reject('PLAN_CHANGE_FENCE_INTENT_PATH_MISMATCH')
  const matching=intent.actions.filter((a: any) => ['REPLACE','RETIRE','REVALIDATE'].includes(a.decision) &&
    a.predecessor_job_id === job.job_id)
  if (matching.length !== 1) return reject('PLAN_CHANGE_FENCE_ACTION_NOT_UNIQUE')
  const action=matching[0]
  if (action.predecessor_planning_revision !== job.planning_revision ||
      action.predecessor_lifecycle !== job.lifecycle ||
      action.predecessor_execution_contract !== jobExecutionContract(job) ||
      (action.decision === 'REPLACE' ? (!action.replacement?.job_id ||
      action.replacement.job_id === job.job_id ||
      action.replacement.handle !== jobHandle(action.replacement.job_id)) : action.replacement != null) ||
      !['DRAFT','READY','IN_PROGRESS'].includes(job.lifecycle))
    return reject('PLAN_CHANGE_FENCE_JOB_OR_REPLACEMENT_DRIFT')
  const expectedFence={
    change_id:intent.change_id,
    intent_memory_path:input.intent_memory_path,
    intent_record_sha:input.intent_record_sha,
    original_job_sha:action.predecessor_job_sha,
    replacement_job_id:action.replacement?.job_id ?? null,
    ...(action.decision === 'REVALIDATE' ? { dependency_revalidation: true } : {}),
  }
  if (job.plan_change_pending) {
    const existing=job.plan_change_pending
    if (Object.entries(expectedFence).some(([key, value]) => existing[key] !== value))
      return reject('PLAN_CHANGE_DIFFERENT_FENCE_ALREADY_PRESENT')
    return { allowed:true, reason:'EXISTING_PLAN_FENCE_REUSE_REQUIRES_READBACK',
      operation:'NONE', record:job, expected_job_sha:input.job_record_sha,
      mutation_authorized:false }
  }
  if (action.predecessor_job_sha !== input.job_record_sha)
    return reject('PLAN_CHANGE_FENCE_PREDECESSOR_SHA_DRIFT')
  return { allowed:true, reason:'PLAN_FENCE_PREPARED_NOT_PERSISTED',
    operation:'UPDATE', record:{ ...job, plan_change_pending: expectedFence,
      updated_at:new Date().toISOString() },
    expected_job_sha:input.job_record_sha, mutation_authorized:false }
}

function validatePlanChangeSupersession(input: any) {
  const sha = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
  const invalid = (reason: string) => ({ allowed: false, reason, action: null })
  let intent: any
  try { intent = JSON.parse(input.intent_record_text) }
  catch { return invalid('PLAN_CHANGE_INTENT_JSON_INVALID') }
  const old = input.predecessor_job
  if (!sha(input.intent_record_sha) || !sha(input.predecessor_job_sha) ||
      intent?.kind !== 'PLAN_RECONCILIATION_INTENT' ||
      intent.version !== 1 || intent.project_id !== input.project_id ||
      !intent.change_id || !Array.isArray(intent.actions) ||
      !isRecognizedJobRecordShape(old) || old.project_id !== input.project_id)
    return invalid('PLAN_CHANGE_SUPERSESSION_IDENTITY_INVALID')
  const expected = executionMemoryRoot(input.project_id, intent.execution_contract,
    intent.memory_namespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) +
    '/WORK/PLAN_RECONCILIATIONS/' + intent.change_id + '.json'
  if (input.intent_memory_path !== expected)
    return invalid('PLAN_CHANGE_SUPERSESSION_INTENT_PATH_INVALID')
  const matching = intent.actions.filter((a: any) =>
    ['REPLACE','RETIRE'].includes(a.decision) && a.predecessor_job_id === old.job_id)
  if (matching.length !== 1) return invalid('PLAN_CHANGE_TERMINAL_ACTION_NOT_UNIQUE')
  const a = matching[0]
  if (typeof a.reason !== 'string' || !a.reason.trim()) return invalid('PLAN_CHANGE_ACTION_REASON_REQUIRED')
  const fence=old.plan_change_pending
  if (!Array.isArray(a.retired_task_ids ?? []) || (a.retired_task_ids ?? []).some((id: any) =>
      typeof id !== 'string' || !(old.tasks ?? []).some((task: any) => task.task_id === id)) ||
      new Set(a.retired_task_ids ?? []).size !== (a.retired_task_ids ?? []).length)
    return invalid('PLAN_CHANGE_RETIRED_TASK_SCOPE_INVALID')
  if (!fence || fence.change_id !== intent.change_id ||
      fence.intent_memory_path !== input.intent_memory_path ||
      fence.intent_record_sha !== input.intent_record_sha ||
      fence.original_job_sha !== a.predecessor_job_sha ||
      fence.replacement_job_id !== (a.decision === 'RETIRE' ? null : a.replacement?.job_id))
    return invalid('PLAN_CHANGE_REQUIRED_FENCE_MISSING_OR_CONFLICTED')
  if (a.predecessor_lifecycle !== old.lifecycle ||
      a.predecessor_planning_revision !== old.planning_revision ||
      a.predecessor_execution_contract !== jobExecutionContract(old) ||
      (a.decision === 'REPLACE' ? (!a.replacement?.job_id || a.replacement.job_id === old.job_id ||
        a.replacement?.handle !== jobHandle(a.replacement.job_id)) : a.replacement != null))
    return invalid('PLAN_CHANGE_PREDECESSOR_DRIFT_OR_REPLACEMENT_INVALID')
  if (!['DRAFT','READY','IN_PROGRESS'].includes(old.lifecycle))
    return invalid('PLAN_CHANGE_PREDECESSOR_TERMINAL')
  if (intent.scope_selection) {
    if (a.decision !== 'RETIRE' ||
        !intent.scope_selection.affected_job_ids?.includes(old.job_id) ||
        !intent.scope_selection.inventory_job_ids?.includes(old.job_id) ||
        (intent.scope_selection.boundary === 'PHASE' &&
          old.planning_context?.phase !== intent.scope_selection.phase))
      return invalid('SCOPE_RETIREMENT_BOUNDARY_CONFLICT')
    const unfinishedIds = (old.tasks ?? []).filter((t: any) =>
      !['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(t.lifecycle))
      .map((t: any) => t.task_id)
    if (unfinishedIds.length !== (a.retired_task_ids ?? []).length ||
        unfinishedIds.some((id: string) => !a.retired_task_ids.includes(id)))
      return invalid('SCOPE_RETIREMENT_MUST_COVER_ALL_UNFINISHED_TASKS')
  }
  // UNKNOWN is as unsafe as ACTIVE/PENDING. Caller must independently
  // enumerate Runs and cursor and revalidate Git source HEAD before writing.
  if (!['ABSENT','STABLE'].includes(input.cursor_state))
    return invalid('PLAN_CHANGE_CURSOR_RECONCILIATION_REQUIRED')
  if (!['NONE','TERMINAL'].includes(input.active_run_state))
    return invalid('PLAN_CHANGE_ACTIVE_RUN_RECONCILIATION_REQUIRED')
  return { allowed: true, reason: 'EXACT_PREDECESSOR_ACTION_MATCH',
    action: a, mutation_authorized: false }
}

function resumeHumanPlanChangeIntent(input: any) {
  const sha = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
  const stop = (reason: string) => ({
    allowed: false, reason, actions: [], mutation_authorized: false,
  })
  let intent: any
  try { intent = JSON.parse(input.intent_record_text) }
  catch { return stop('PLAN_CHANGE_INTENT_JSON_INVALID') }
  if (!sha(input.intent_record_sha) || intent?.kind !== 'PLAN_RECONCILIATION_INTENT' ||
      intent.version !== 1 || intent.project_id !== input.project_id ||
      !Array.isArray(intent.actions) || !intent.actions.length ||
      !sha(intent.reviewed_plan_sha) || !sha(intent.plan_review_blob_sha))
    return stop('PLAN_CHANGE_INTENT_IDENTITY_OR_SHA_INVALID')
  const expected = executionMemoryRoot(input.project_id,
    intent.execution_contract, intent.memory_namespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) +
    '/WORK/PLAN_RECONCILIATIONS/' + intent.change_id + '.json'
  if (input.intent_memory_path !== expected) return stop('PLAN_CHANGE_INTENT_PATH_MISMATCH')
  if (!Array.isArray(input.current_job_snapshots)) return stop('PLAN_CHANGE_CURRENT_JOBS_REQUIRED')
  const jobs = new Map<string,any>()
  for (const s of input.current_job_snapshots) {
    let job: any
    try { job = JSON.parse(s.job_record_text) }
    catch { return stop('PLAN_CHANGE_CURRENT_JOB_JSON_INVALID') }
    if (!isRecognizedJobRecordShape(job) || job.project_id !== input.project_id ||
        !job.job_id || !sha(s.job_record_sha) || jobs.has(job.job_id))
      return stop('PLAN_CHANGE_CURRENT_JOB_INVALID_OR_DUPLICATE')
    jobs.set(job.job_id, { job, sha: s.job_record_sha })
  }
  const actions: any[] = [], seenOld = new Set<string>(), seenNew = new Set<string>()
  for (const a of intent.actions) {
    if (!a?.predecessor_job_id || seenOld.has(a.predecessor_job_id) ||
        !['KEEP','REVALIDATE','REPLACE','RETIRE'].includes(a.decision))
      return stop('PLAN_CHANGE_ACTION_INVALID_OR_DUPLICATE')
    seenOld.add(a.predecessor_job_id)
    const oldSnapshot = jobs.get(a.predecessor_job_id)
    if (!oldSnapshot) return stop('PLAN_CHANGE_PREDECESSOR_READBACK_MISSING')
    const old = oldSnapshot.job
    if (intent.scope_selection && (a.decision === 'RETIRE' ?
        !intent.scope_selection.affected_job_ids.includes(old.job_id) :
        intent.scope_selection.affected_job_ids.includes(old.job_id) && a.decision !== 'KEEP'))
      return stop('SCOPE_ACTION_BOUNDARY_CONFLICT')
    const alreadyRevised = a.decision === 'REVALIDATE' &&
      old.plan_change_revalidated_by === intent.change_id &&
      old.planning_revision > a.predecessor_planning_revision
    if ((!alreadyRevised && old.planning_revision !== a.predecessor_planning_revision) ||
        jobExecutionContract(old) !== a.predecessor_execution_contract)
      return stop('PLAN_CHANGE_PREDECESSOR_REVISION_OR_CONTRACT_DRIFT')
    let next = a.decision === 'KEEP' ? 'KEEP_UNCHANGED' :
      a.decision === 'REVALIDATE' ? 'REVALIDATE_DEPENDENCIES_AND_EVIDENCE' : ''
    if (a.decision === 'REVALIDATE') {
      const fence = old.plan_change_pending
      if (alreadyRevised) {
        if (fence) return stop('SCOPE_DEPENDENCY_REVALIDATION_FENCE_NOT_CLEARED')
        next = old.planning_review?.status === 'PASS' &&
          old.planning_review?.reviewed_revision === old.planning_revision ?
            'REVALIDATED_SCOPE_DEPENDENCY' : 'REVIEW_DEPENDENCY_REVALIDATION'
      } else if (!fence) {
        if (oldSnapshot.sha !== a.predecessor_job_sha)
          return stop('SCOPE_DEPENDENCY_PREDECESSOR_SHA_DRIFT')
        next = 'FENCE_DEPENDENT_JOB_BY_EXACT_SHA'
      } else {
        if (fence.change_id !== intent.change_id ||
            fence.intent_memory_path !== input.intent_memory_path ||
            fence.intent_record_sha !== input.intent_record_sha ||
            fence.original_job_sha !== a.predecessor_job_sha ||
            fence.replacement_job_id !== null || fence.dependency_revalidation !== true)
          return stop('SCOPE_DEPENDENCY_FENCE_CONFLICT')
        const live = (input.activity ?? []).find((x: any) => x.job_id === old.job_id)
        if (!live || !['ABSENT','STABLE','PENDING','UNKNOWN'].includes(live.cursor_state) ||
            !['NONE','TERMINAL','ACTIVE','UNKNOWN'].includes(live.active_run_state))
          next = 'REFETCH_ACTIVE_RUN_AND_CURSOR'
        else if (['PENDING','UNKNOWN'].includes(live.cursor_state))
          next = 'RECONCILE_PENDING_SOURCE_CURSOR'
        else if (['ACTIVE','UNKNOWN'].includes(live.active_run_state))
          next = 'SETTLE_ACTIVE_RUN'
        else next = 'REVISE_DEPENDENT_JOB_AND_REVIEW'
      }
    }
    if (a.decision === 'REPLACE' || a.decision === 'RETIRE') {
      const retiring = a.decision === 'RETIRE'
      const id = a.replacement?.job_id
      if (retiring ? a.replacement != null : (!id || id === a.predecessor_job_id || seenNew.has(id)))
        return stop('PLAN_CHANGE_REPLACEMENT_ID_INVALID_OR_DUPLICATE')
      if (!retiring) seenNew.add(id)
      const replacement = retiring ? null : jobs.get(id)?.job
      if (retiring && old.lifecycle === 'RETIRED') {
        if (old.result !== 'RETIRED' || old.retired_by_plan_change_id !== intent.change_id || old.retired_reason !== a.reason ||
            old.retired_by_replacement_job_id != null) return stop('PLAN_CHANGE_RETIREMENT_LINEAGE_CONFLICT')
        next = 'RETIRED_NO_REPLACEMENT'
      } else if (!retiring && old.lifecycle === 'SUPERSEDED') {
        if (old.superseded_by_plan_change_id !== intent.change_id ||
            old.superseded_by_replacement_job_id !== id)
          return stop('PLAN_CHANGE_PREDECESSOR_SUPERSESSION_LINEAGE_CONFLICT')
        if (!replacement) next = 'CREATE_RESERVED_REPLACEMENT'
        else if (replacement.replacement_of_job_id !== old.job_id ||
                 replacement.plan_change_id !== intent.change_id)
          return stop('PLAN_CHANGE_REPLACEMENT_LINEAGE_CONFLICT')
        else if (replacement.lifecycle === 'DRAFT') next = 'REVIEW_REPLACEMENT'
        else if (['READY','IN_PROGRESS','COMPLETED'].includes(replacement.lifecycle))
          next = 'REVALIDATE_DEPENDENCIES_BEFORE_DISPATCH'
        else return stop('PLAN_CHANGE_REPLACEMENT_TERMINAL_CONFLICT')
      } else if (['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(old.lifecycle)) {
        return stop('PLAN_CHANGE_PREDECESSOR_TERMINAL_CONFLICT')
      } else {
        const fence=old.plan_change_pending
        if (!fence) {
          if (oldSnapshot.sha !== a.predecessor_job_sha)
            return stop('PLAN_CHANGE_PREDECESSOR_SHA_DRIFT')
          next='FENCE_PREDECESSOR_BY_EXACT_SHA'
        } else {
          if (fence.change_id !== intent.change_id ||
              fence.intent_memory_path !== input.intent_memory_path ||
              fence.intent_record_sha !== input.intent_record_sha ||
              fence.original_job_sha !== a.predecessor_job_sha ||
              fence.replacement_job_id !== (retiring ? null : id))
            return stop('PLAN_CHANGE_PREDECESSOR_FENCE_CONFLICT')
          const live = (input.activity ?? []).find((x: any) => x.job_id === old.job_id)
        if (!live || !['ABSENT','STABLE','PENDING','UNKNOWN'].includes(live.cursor_state) ||
            !['NONE','TERMINAL','ACTIVE','UNKNOWN'].includes(live.active_run_state))
          next = 'REFETCH_ACTIVE_RUN_AND_CURSOR'
        else if (['PENDING','UNKNOWN'].includes(live.cursor_state))
          next = 'RECONCILE_PENDING_SOURCE_CURSOR'
        else if (['ACTIVE','UNKNOWN'].includes(live.active_run_state))
          next = 'SETTLE_ACTIVE_RUN'
        else next = retiring ? 'RETIRE_PREDECESSOR_BY_EXACT_SHA' : 'SUPERSEDE_PREDECESSOR_BY_EXACT_SHA'
        }
      }
    }
    actions.push({ action_key: a.action_key, job_id: old.job_id, decision: a.decision,
      replacement_job_id: a.replacement?.job_id ?? null, next_action: next })
  }
  if (intent.scope_selection) {
    const unsettled = actions.some((a) =>
      (a.decision === 'RETIRE' && a.next_action !== 'RETIRED_NO_REPLACEMENT') ||
      (a.decision === 'REVALIDATE' && a.next_action !== 'REVALIDATED_SCOPE_DEPENDENCY'))
    const packs = intent.rebuild_jobs ?? []
    if (!Array.isArray(packs) || new Set(packs.map((p: any) => p.job_id)).size !== packs.length)
      return stop('SCOPE_REBUILD_RESERVATIONS_INVALID')
    for (const pack of packs) {
      const snap = jobs.get(pack.job_id)
      if (!snap) {
        actions.push({ action_key: 'REBUILD:' + pack.pack_key, job_id: pack.job_id,
          decision: 'REBUILD', replacement_job_id: null,
          next_action: unsettled ? 'WAIT_SCOPE_RETIREMENT' : 'CREATE_RESERVED_SCOPE_JOB' })
        continue
      }
      const job = snap.job
      const deps = pack.depends_on_pack_keys.map((key: string) =>
        packs.find((p: any) => p.pack_key === key)?.job_id)
      if (job.plan_change_id !== intent.change_id ||
          job.scope_rebuild?.pack_key !== pack.pack_key ||
          job.scope_rebuild?.reviewed_plan_sha !== intent.reviewed_plan_sha ||
          job.planning_context?.phase !== pack.phase ||
          JSON.stringify(job.dependencies ?? []) !== JSON.stringify(deps) ||
          (job.lifecycle === 'DRAFT' && job.planning_review?.status === 'PASS'))
        return stop('SCOPE_REBUILD_JOB_LINEAGE_CONFLICT')
      actions.push({ action_key: 'REBUILD:' + pack.pack_key, job_id: pack.job_id,
        decision: 'REBUILD', replacement_job_id: null,
        next_action: unsettled ? 'WAIT_SCOPE_RETIREMENT' :
          job.lifecycle === 'DRAFT' ? 'REVIEW_REBUILD_JOB' :
          ['READY','IN_PROGRESS','COMPLETED'].includes(job.lifecycle) ?
            'REVALIDATE_SCOPE_DEPENDENCIES_BEFORE_DISPATCH' : 'SCOPE_REBUILD_TERMINAL_CONFLICT' })
    }
  }
  return { allowed: true, reason: 'FRESH_READBACK_RECONCILIATION_ONLY',
    actions, mutation_authorized: false }
}

  return { isRecognizedJobRecordShape, assessHumanPlanChangeJobs, prepareHumanPlanChangeIntent, prepareHumanPlanChangeFenceDecision, validatePlanChangeSupersession, resumeHumanPlanChangeIntent }
}
