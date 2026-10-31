// GSA1: task topology and milestone review-loop decisions; unchanged logic.

export function validateExecutionTopology(tasks: any[], topology: any[]): string | null {
  if (!Array.isArray(tasks) || !Array.isArray(topology)) return 'EXECUTION_TOPOLOGY_INVALID: tasks/topology must be arrays.'
  const taskIds = tasks.map((task: any) => task?.task_id)
  if (taskIds.some((id: any) => typeof id !== 'string' || !id)) return 'EXECUTION_TOPOLOGY_INVALID: every Task requires task_id.'
  if (new Set(taskIds).size !== taskIds.length) return 'EXECUTION_TOPOLOGY_INVALID: Task IDs must be unique.'
  if (topology.length !== tasks.length) return 'EXECUTION_TOPOLOGY_INVALID: execution topology must contain exactly one stage per Task.'
  const topologyTaskIds = topology.map((stage: any) => stage?.task_id)
  if (topologyTaskIds.some((id: any) => typeof id !== 'string' || !id) || new Set(topologyTaskIds).size !== topologyTaskIds.length) {
    return 'EXECUTION_TOPOLOGY_INVALID: topology task_id values must be present and unique.'
  }
  if (taskIds.some((id: string) => !topologyTaskIds.includes(id))) return 'EXECUTION_TOPOLOGY_INVALID: every current Task must appear exactly once in execution topology.'
  const stages = topology.map((stage: any) => stage?.stage)
  if (stages.some((stage: any) => !Number.isInteger(stage) || stage < 1) || new Set(stages).size !== stages.length) {
    return 'EXECUTION_TOPOLOGY_INVALID: topology stage values must be unique positive integers.'
  }
  const validHandlers = new Set(['planner','designer','coder','reviewer','tester'])
  const taskIdSet = new Set(taskIds)
  const sameStringSet = (left: any[], right: any[]) => {
    const a = [...new Set((left ?? []).map(String))].sort()
    const b = [...new Set((right ?? []).map(String))].sort()
    return a.length === b.length && a.every((value, index) => value === b[index])
  }
  for (const task of tasks) {
    const deps = task?.dependencies ?? []
    if (!Array.isArray(deps) || deps.some((id: any) => typeof id !== 'string' || !taskIdSet.has(id) || id === task.task_id) || new Set(deps).size !== deps.length) {
      return 'EXECUTION_TOPOLOGY_INVALID: Task dependencies must be unique current Task IDs and cannot self-reference.'
    }
    const stage = topology.find((item: any) => item.task_id === task.task_id)
    if (!stage || !validHandlers.has(stage.handler)) return 'EXECUTION_TOPOLOGY_INVALID: every Task requires one valid execution handler.'
    if (!sameStringSet(stage.depends_on ?? [], deps)) return 'EXECUTION_TOPOLOGY_INVALID: topology depends_on must match the owning Task dependencies.'
    if (stage.next != null && (!taskIdSet.has(stage.next) || stage.next === task.task_id)) {
      return 'EXECUTION_TOPOLOGY_INVALID: topology next must be null or another current Task ID.'
    }
  }
  return null
}

export function milestoneLoopDecision(job: any, milestoneId: string, stage: string, verdict: string, noProgressCycles = 0) {
  const milestone = (job?.milestones ?? []).find((m: any) => m.milestone_id === milestoneId)
  const stopped = (reason: string) => ({ next_action: 'STOP', next_role: 'human', resume_same_turn: false, reason })
  if (!milestone) return stopped('Unknown milestone on the current Job.')
  if (noProgressCycles >= 3) return { next_action: 'STOP_BLOCKED', next_role: 'orchestrator', resume_same_turn: false, reason: 'No progress for three cycles.' }
  if (!['rl','crl'].includes(milestone.review_loop)) return stopped('No approved review loop on this milestone.')
  if (milestone.human_pre_authorized !== true) return stopped('Human has not approved this milestone review loop.')
  if (job?.planning_review?.status !== 'PASS' || job?.planning_review?.reviewed_revision !== job?.planning_revision) {
    return stopped('Current Job planning revision is not Reviewer PASS.')
  }
  if (verdict === 'BLOCKED') return { next_action: 'STOP_BLOCKED', next_role: 'orchestrator', resume_same_turn: false, reason: 'Reviewer/CR reported a real blocker.' }
  if (stage === 'BEGIN') return { next_action: 'RUN_REVIEWER', next_role: 'reviewer', resume_same_turn: true, reason: 'Begin approved milestone rl.' }
  if (stage === 'REVIEWER' && ['FAIL','CHANGES_REQUIRED'].includes(verdict)) {
    return { next_action: 'REPAIR_AND_REREVIEW', next_role: job?.type === 'plan' ? 'planner' : 'coder', resume_same_turn: true, reason: 'Repair scoped findings, then rerun Reviewer on new evidence; do not stop after repair.' }
  }
  if (stage === 'CR' && ['FAIL','CHANGES_REQUIRED'].includes(verdict) && milestone.review_loop === 'crl') {
    return { next_action: 'REPAIR_AND_REREVIEW', next_role: job?.type === 'plan' ? 'planner' : 'coder', resume_same_turn: true, reason: 'CR FAIL returns to the small rl before another independent CR.' }
  }
  if (stage === 'REVIEWER' && verdict === 'PASS' && milestone.review_loop === 'crl') {
    return { next_action: 'VERIFY_REVIEWER_PASS_THEN_CR', next_role: 'orchestrator', resume_same_turn: true, reason: 'Bind exact current Reviewer PASS Verification then invoke CR only for this Human-approved milestone.' }
  }
  if (verdict === 'PASS' && ((stage === 'REVIEWER' && milestone.review_loop === 'rl') || (stage === 'CR' && milestone.review_loop === 'crl'))) {
    const auto = milestone.continuation === 'AUTO'
    return { next_action: auto ? 'CONTINUE_AUTO' : 'PRESENT_RESULT', next_role: auto ? 'orchestrator' : 'human', resume_same_turn: auto, reason: auto ? 'Review complete; move to the next authorized milestone.' : 'Human stop configured at milestone.' }
  }
  return stopped('Review stage/verdict is not a valid transition for this milestone.')
}

export function normalizeNextPlanningModel(model: any, planningRevision: number) {
  return {
    evidence_needs: (model.evidence_needs ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
    test_checkpoints: (model.test_checkpoints ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
    evidence_requirements: (model.evidence_requirements ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
    milestones: (model.milestones ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
    planning_topology: (model.planning_topology ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
  }
}

export function planningLoopContinuationDecision(
  stage: 'JOB_PREPARED' | 'PLAN_REVISED' | 'REVIEW_RECORDED' | 'READY_TRANSITION',
  lifecycle: string,
  planningRevision: number,
  reviewResult?: string,
) {
  const invalid = () => ({
    state: 'NOT_APPLICABLE' as const, next_action_after_readback: 'NONE' as const,
    next_role: 'none' as const, resume_same_turn: false,
    requires_readback: false, planning_revision: planningRevision,
    human_action_required: false, mutation_authorized: false as const,
  })
  if (!Number.isInteger(planningRevision) || planningRevision < 1) return invalid()
  let action: string = 'NONE'
  let role: string = 'none'
  if ((stage === 'JOB_PREPARED' || stage === 'PLAN_REVISED') &&
      (lifecycle === 'DRAFT' || (stage === 'PLAN_REVISED' && lifecycle === 'IN_PROGRESS'))) {
    action = 'REVIEW_CURRENT_REVISION'
    role = 'reviewer'
  } else if (stage === 'REVIEW_RECORDED' &&
      (lifecycle === 'DRAFT' || lifecycle === 'IN_PROGRESS')) {
    if (reviewResult === 'CHANGES_REQUIRED') {
      action = 'REVISE_PLAN'
      role = 'planner'
    } else if (reviewResult === 'PASS') {
      action = lifecycle === 'DRAFT' ? 'PROMOTE_READY' : 'PRESENT_PLAN_FOR_APPROVAL'
      role = lifecycle === 'DRAFT' ? 'orchestrator' : 'human'
    } else if (reviewResult === 'HUMAN_REVIEW_REQUIRED') {
      action = 'STOP_HUMAN_DECISION'
      role = 'human'
    } else if (reviewResult === 'BLOCKED') {
      action = 'STOP_BLOCKED'
      role = 'orchestrator'
    }
  } else if (stage === 'READY_TRANSITION' && lifecycle === 'READY') {
    action = 'PRESENT_PLAN_FOR_APPROVAL'
    role = 'human'
  }
  if (action === 'NONE') return invalid()
  const stopped = action === 'STOP_HUMAN_DECISION' || action === 'STOP_BLOCKED' || action === 'PRESENT_PLAN_FOR_APPROVAL'
  return {
    state: 'AWAITING_DURABLE_READBACK' as const,
    next_action_after_readback: action,
    next_role: role,
    resume_same_turn: !stopped,
    requires_readback: true,
    planning_revision: planningRevision,
    human_action_required: action === 'STOP_HUMAN_DECISION' || action === 'PRESENT_PLAN_FOR_APPROVAL',
    mutation_authorized: false as const,
  }
}
