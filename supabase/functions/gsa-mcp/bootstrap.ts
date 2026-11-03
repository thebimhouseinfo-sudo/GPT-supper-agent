import { projectCriteriaBindingError } from './project-utils.ts'

// GSA1: Bootstrap checklist/readiness decisions, moved unchanged.

export function projectBootstrapChecklistDecision(input: any) {
  const mode = input?.project_context === 'GREENFIELD' ? 'GREENFIELD' : 'BROWNFIELD'
  const phases = [
    { id: 'criteria', label: 'Human-approved Criteria' },
    { id: 'plan', label: 'Plan consistent with Criteria' },
    { id: 'milestones', label: 'Milestones consistent with Plan' },
    { id: 'capabilities', label: 'Coder/Tester relevant skills and knowledge' },
  ]
  const statuses = new Set(['PENDING', 'IN_PROGRESS', 'PASS', 'NEED_HUMAN'])
  const snapshot = input?.checklist && typeof input.checklist === 'object' ? input.checklist : {}
  const list = phases.map((phase) => {
    const item = snapshot[phase.id]
    return {
      id: phase.id, label: phase.label,
      status: statuses.has(item?.status) ? item.status : 'PENDING',
      observation: typeof item?.observation === 'string' ? item.observation.trim().slice(0, 1000) : '',
    }
  })
  const criterion = input?.criteria_intake ?? {}
  const last = input?.previous_attempt ?? {}
  // This signature covers the observed checklist, not a manufactured Job/metadata registry.
  const signature = JSON.stringify({
    checklist: list.map(i => [i.id, i.status, i.observation]),
    choice: criterion.human_update_choice ?? null,
    revised: criterion.revision_completed === true,
    approved: criterion.existing_approved ?? null,
    conflicts: (input?.conflicts ?? []).map((c: any) => [c.item, c.unresolved, c.investigated, c.candidates]),
  })
  const confirmedExisting = mode === 'BROWNFIELD' && criterion.existing_approved === true
  const choice = criterion.human_update_choice ?? 'NOT_ASKED'
  const conflicts = Array.isArray(input?.conflicts) ? input.conflicts : []
  const next = list.find((item) => item.status !== 'PASS')
  const total = list.filter((item) => item.status === 'PASS').length
  const output = (active: string | null, action: string, owner: string,
    instruction: string, question: string | null = null) => {
    // A second attempt at exactly the same action with exactly the same
    // observations means no verified progress; stop, report the technical blocker,
    // and never invent a Human decision or spin through tool calls indefinitely.
    const stalled = action !== 'ASK_HUMAN' && action !== 'BOOTSTRAP_READY' &&
      last.action === action && last.signature === signature
    return {
      checklist: list, completed: total, total: list.length,
      status: stalled ? 'PAUSED_NO_PROGRESS' : action === 'BOOTSTRAP_READY'
        ? 'BOOTSTRAP_READY' : question ? 'NEED_HUMAN' : 'IN_PROGRESS',
      next_item: active, next_action: stalled ? 'REPORT_BLOCKER' : action,
      next_owner: stalled ? 'orchestrator' : owner,
      instruction: stalled
        ? 'This exact action produced no observed progress. Report the tool failure or inaccessible source; preserve PASS work. Do not ask Human to perform routine agent work or create an extra gate.'
        : instruction,
      human_question: stalled ? null : question,
      continue_same_turn: !stalled && !question && action !== 'BOOTSTRAP_READY',
      assessment_only: true, source_write_authorized: false,
      requires_external_readback: true, progress_signature: signature,
    }
  }
  // A missing intake assessment must not silently mean Human said KEEP.
  // Inspect the source evidence first; that is ordinary Bootstrap work.
  if (mode === 'BROWNFIELD' && list[0].status === 'PASS' && criterion.existing_approved === undefined)
    return output('criteria', 'INSPECT_CRITERIA_INTAKE', 'planner',
      'Read actual Criteria and approval to determine whether existing Human-approved Criteria is present. Do not assume KEEP, invent an approval or make Human register a reference.')
  if (mode === 'BROWNFIELD' && list[0].status === 'PASS' && criterion.existing_approved === false)
    return output('criteria', 'RECHECK_CRITERIA', 'planner',
      'A Criteria cannot be PASS and unapproved: inspect source and actual Human decision, then draft/review as necessary.')
  // Reuse approved brownfield Criteria without rewriting it, but ask its owner
  // ONCE about desired updates. KEEP permits legacy formatting without a gate.
  if (list[0].status === 'PASS' && confirmedExisting && choice === 'NOT_ASKED')
    return output('criteria', 'ASK_HUMAN', 'human',
      'Do not modify or reformat existing approved Criteria while awaiting its owner.',
      'Criteria hiện có đã được kiểm tra. Bạn có muốn cập nhật hoặc bổ sung gì không? Nếu không, tôi giữ nguyên và tự tiếp tục Bootstrap.')
  if (list[0].status === 'PASS' && confirmedExisting && choice === 'UPDATE' && criterion.revision_completed !== true)
    return output('criteria', 'PREPARE_CRITERIA_REVISION', 'planner',
      'Human requested a Criteria update. Draft changes grounded in current Criteria and source; discuss scope with Human. Activate Technical Advisor only after Human intends to finalize, before writing; then resume checklist automatically.')

  // Never announce READY with unexamined, conflicting source-of-truth evidence.
  const conflict = conflicts.find((c: any) => c && (c.item === next?.id || !next || list.some(item => item.id === c.item && item.status === 'PASS')) &&
    Array.isArray(c.candidates) && c.candidates.length >= 2 && c.unresolved === true)
  if (conflict) {
    if (conflict.investigated !== true)
      return output(conflict.item, 'INVESTIGATE_SOURCES', 'planner',
        'Inspect the conflicting original files, approved decisions, Git ancestry and related code. Do not guess which source is authoritative and do not ask Human until self-verification is exhausted.')
    const candidates = conflict.candidates.map((s: any) => String(s).slice(0, 120)).join(' / ')
    const question = typeof conflict.question === 'string' && conflict.question.trim() ?
      conflict.question.trim() : 'Không thể xác minh nguồn chuẩn giữa: ' + candidates + '. Bạn chọn nguồn nào làm chuẩn?'
    return output(conflict.item, 'ASK_HUMAN', 'human',
      'Summarize competing sources and verification attempts; preserve all sources until Human decides.', question)
  }

  // PASS without any concrete observation is not evidence. Reread the source
  // as a normal checklist Task (not a new mandatory receipt, SHA or approval).
  const unverified = list.find(item => item.status === 'PASS' && !item.observation)
  if (unverified)
    return output(unverified.id, 'VERIFY_EVIDENCE', 'orchestrator',
      'Independently reread the actual Criteria/Plan/Milestones or role capability for ' + unverified.label +
      ' and describe the observed source or test result; no special format or registration is required.')
  if (!next) return output(null, 'BOOTSTRAP_READY', 'orchestrator',
    'All four items have PASS with described observations. Caller reports are not independent verification; reread actual sources before announcing READY. Product source write still needs Human approval.')

  if (next.id === 'criteria') {
    if (next.status === 'NEED_HUMAN')
      return output('criteria', 'ASK_HUMAN', 'human',
        'Present the Criteria draft or precise missing product decision. Technical Advisor must advise before Human-approved Criteria is written, never for mere discussion.',
        next.observation || 'Bạn xác nhận Criteria dự thảo này hay muốn điều chỉnh mục tiêu sản phẩm?')
    if (next.status === 'PENDING')
      return output('criteria', 'INSPECT_CRITERIA', 'planner',
        mode === 'GREENFIELD'
          ? 'Gather Human product intent and draft Criteria together; do not infer approval.'
          : 'Search existing Criteria (source and Project Memory), product docs and code; inspect approval and usability. Preserve adequate approved Criteria even if legacy formatting. Ask Human about updates only once.')
    return output('criteria', 'PREPARE_CRITERIA_DRAFT', 'planner',
      'Finish evidence-grounded Criteria draft/proposed edits with Human; if Human keeps usable legacy Criteria, keep it unchanged. Ask for Human decision only when ready; Advisor advises only at final approval/change.')
  }
  if (next.status === 'NEED_HUMAN')
    return output(next.id, 'VERIFY_BLOCKER', 'planner',
      'Investigate the specific missing source or tool evidence once. Provide real conflicting candidate sources if Human must decide; otherwise report a technical blocker. Repeated unchanged VERIFY_BLOCKER becomes PAUSED_NO_PROGRESS, not an infinite loop.')
  if (next.id === 'plan')
    return output('plan', 'PLAN_CRL', 'planner',
      'Inspect existing Plan; keep it if reviewed and aligned with Criteria. Otherwise repair/create only necessary sections and run independent Reviewer and Critic Reviewer CRL until PASS. Human explicitly requested Bootstrap with CRL; this grants review of Plan/Milestones, NOT product code writes. When there is a valid Job use existing human_invoked CR for that Human-directed scope; without a Job run role-isolated DIRECT_AGENT reviews of real documents, without fabricating durable receipts or a duplicate Job.')
  if (next.id === 'milestones')
    return output('milestones', 'MILESTONES_CRL', 'planner',
      'Inspect Milestones against PASS Plan and keep valid ones; otherwise repair then Reviewer → Critic Reviewer CRL until PASS. Human Bootstrap request authorizes this review, not code execution. Without an existing Job use independent DIRECT_AGENT Critic Reviewer on actual documents; do not create a Job just to satisfy CR tooling or fabricate signed review evidence.')
  return output('capabilities', 'PREPARE_CODER_TESTER', 'orchestrator',
    'Inspect repository languages, existing skills, knowledge and working tools; add/test only genuinely missing Coder/Tester capability. Do not require product features to already exist. Do not invent a capability registration gate.')
}

export function projectBootstrapReadinessDecision(projectId: string, input: any) {
  const result = (status: string, detail: string) => ({
    status, detail, bootstrapped: false, source_write_authorized: false,
    requires_external_readback: true,
  })
  // Brownfield and new projects share four semantic readiness checks.
  // The caller must inspect original documents and capabilities; this PREPARE
  // result is not independent verification or source-write permission.
  // No duplicate Criteria, Project Plan Job or SHA registration is required.
  if (input?.assessment !== undefined) {
    const a = input.assessment
    if (a?.criteria !== 'APPROVED')
      return result('CRITERIA_NOT_READY', 'Criteria must reflect the Human-approved product intent. Existing approved source Criteria may be used in place.')
    if (a?.plan !== 'PASS')
      return result('PLAN_NOT_READY', 'Reviewer must confirm the existing or new Plan aligns with Criteria.')
    if (a?.milestones !== 'PASS')
      return result('MILESTONES_NOT_READY', 'Milestones must be coherent with the Plan and cover its intended outcomes.')
    if (a?.coder !== 'READY' || a?.tester !== 'READY')
      return result('CAPABILITY_NOT_READY', 'Coder and Tester need relevant skills, knowledge and usable implementation/test paths for upcoming work; unfinished product features are not prerequisites.')
    return result('BOOTSTRAP_READY', 'Four readiness checks passed as caller-provided assessment. Independently verify actual documents and capabilities before implementation; Human execution approval is separate.')
  }
  const c = input?.criteria
  if (!c || projectCriteriaBindingError(projectId, 'PROJECT_PLAN', c))
    return result('CRITERIA_BINDING_MISSING_OR_INVALID', 'Provide criteria: { criteria_path, criteria_blob_sha, approval_status: APPROVED } bound to this Project canonical CRITERIA.md. A prior capability-only Bootstrap snapshot is not this binding.')
  if (input?.criteria_human_approved !== true)
    return result('CRITERIA_HUMAN_APPROVAL_UNVERIFIED', 'Independently confirm existing Human Criteria approval; do not ask for a new approval merely because the caller omitted this confirmation field.')
  if (input?.criteria_current_blob_sha !== c.criteria_blob_sha)
    return result('CRITERIA_STALE_OR_UNVERIFIED', 'Read and verify current canonical Criteria GitHub SHA before any official Plan.')
  const plan = input?.plan
  if (!plan) return result('IMPLEMENTATION_PLAN_MISSING', 'No official Implementation Plan may be inferred from DRAFT or code.')
  // Brownfield source Plan documents may predate GSA's PROJECT_PLAN Job schema.
  // Reuse their independently reviewed Task/Milestone evidence; never require
  // creating a duplicate Job merely to satisfy metadata. Existing typed GSA
  // PROJECT_PLAN records must retain their exact Criteria binding checks.
  const sourcePlan = plan.plan_kind === undefined
  if ((!sourcePlan && plan.plan_kind !== 'PROJECT_PLAN') ||
      ((!sourcePlan || plan.criteria_binding !== undefined) &&
        (projectCriteriaBindingError(projectId, 'PROJECT_PLAN', plan.criteria_binding) ||
         plan.criteria_binding?.criteria_blob_sha !== c.criteria_blob_sha)))
    return result('PLAN_CRITERIA_MISMATCH',
      'Use an existing reviewed source Plan (without GSA Job metadata) or a PROJECT_PLAN with exact Criteria binding; do not create a duplicate Project Plan Job.')
  if (plan.planning_review?.status !== 'PASS' ||
      !Number.isInteger(plan.planning_revision) ||
      plan.planning_review?.reviewed_revision !== plan.planning_revision)
    return result('PLAN_REVIEW_PENDING', 'Independent current revision Reviewer PASS required.')
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : []
  if (tasks.length === 0 || tasks.some((t: any) => typeof t.task_id !== 'string' || !t.task_id ||
      !Array.isArray(t.completion_criteria) || t.completion_criteria.length === 0 ||
      t.completion_criteria.some((condition: any) => typeof condition !== 'string' || !condition.trim())))
    return result('PLAN_TASK_ACCEPTANCE_MISSING', 'Each implementation Task needs a meaningful completion condition.')
  // Assess the existing reviewed Plan dependencies; no separate lifecycle or approval gate.
  const taskIds = new Set(tasks.map((t: any) => t.task_id))
  if (taskIds.size !== tasks.length || tasks.some((t: any) => {
    const dependencies = t.dependencies ?? []
    return !Array.isArray(dependencies) || new Set(dependencies).size !== dependencies.length ||
      dependencies.some((id: any) => typeof id !== 'string' || !taskIds.has(id) || id === t.task_id)
  })) return result('PLAN_DEPENDENCIES_INVALID', 'Task dependencies must be unique, current, and non-self-referential.')
  const byTaskId = new Map(tasks.map((t: any) => [t.task_id, t]))
  const visiting = new Set<string>(), visited = new Set<string>()
  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    const task: any = byTaskId.get(id)
    if ((task.dependencies ?? []).some((dep: string) => hasCycle(dep))) return true
    visiting.delete(id)
    visited.add(id)
    return false
  }
  if (tasks.some((t: any) => hasCycle(t.task_id)))
    return result('PLAN_DEPENDENCIES_INVALID', 'Task dependency cycles cannot produce a ready implementation milestone.')
  const milestones = Array.isArray(plan.milestones) ? plan.milestones : []
  if (milestones.length === 0 ||
      new Set(milestones.map((m: any) => m.milestone_id)).size !== milestones.length ||
      milestones.some((m: any) => typeof m.milestone_id !== 'string' || !m.milestone_id ||
        (m.name !== undefined && (typeof m.name !== 'string' || !m.name.trim())) ||
        !Array.isArray(m.node_ids) || m.node_ids.length === 0 ||
        new Set(m.node_ids).size !== m.node_ids.length ||
        m.node_ids.some((id: string) => !taskIds.has(id))) ||
      tasks.some((t: any) => !milestones.some((m: any) => m.node_ids.includes(t.task_id))))
    return result('MILESTONES_NOT_READY', 'Milestones must cover actual Tasks with coherent dependencies and acceptance.')
  // Bootstrap checks implementer readiness only for the next executable Task
  // set; unfinished future product features do not block starting current work.
  const completed = new Set(tasks.filter((t: any) => t.lifecycle === 'COMPLETED')
    .map((t: any) => t.task_id))
  let upcoming: string[] = []
  for (const milestone of milestones) {
    const pending = milestone.node_ids.filter((taskId: string) => !completed.has(taskId))
    if (!pending.length) continue
    upcoming = pending.filter((taskId: string) =>
      (byTaskId.get(taskId)?.dependencies ?? []).every((dep: string) => completed.has(dep)))
    if (!upcoming.length)
      return result('PLAN_DEPENDENCIES_INVALID',
        'The first incomplete Milestone has no dependency-ready Task; inspect actual Task completion rather than inventing readiness.')
    break
  }
  const capability = Array.isArray(input?.capabilities) ? input.capabilities : []
  if (upcoming.some((taskId: string) => !capability.some((c: any) =>
    c.task_id === taskId && (c.readiness === 'GENERIC_READY' ||
      (c.readiness === 'DOMAIN_READY_VERIFIED' && c.evidence_verified === true)))))
    return result('CAPABILITY_NOT_READY',
      'Verify usable Coder/Tester development and test paths for the next executable Task(s), not all future Tasks or unfinished product functionality.')
  return result(input?.human_execution_approved === true
    ? 'BOOTSTRAP_EVIDENCE_READY_EXECUTION_APPROVAL_CLAIMED' : 'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING',
    'Prepared readiness only. M5 must independently verify immutable snapshots, source branch and actual Human approval before code; do not repeat Bootstrap on later normal Jobs.')
}
