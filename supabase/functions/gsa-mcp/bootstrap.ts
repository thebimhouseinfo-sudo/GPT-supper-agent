
// GSA1: Bootstrap checklist/readiness decisions, moved unchanged.

export function projectBootstrapChecklistDecision(input: any) {
  const mode = input?.project_context === 'GREENFIELD' ? 'GREENFIELD' : 'BROWNFIELD'
  const phases = [
    { id: 'criteria', label: 'Valid Criteria aligned with the project GOAL' },
    { id: 'plan', label: 'Plan consistent with Criteria' },
    { id: 'milestones', label: 'Milestones consistent with Plan' },
    { id: 'technical_proposal', label: 'Technical Proposal consistent with Criteria and Plan' },
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
        ? 'This exact action produced no observed progress. Report the tool failure or inaccessible source; preserve PASS work. Do not ask Human to perform routine agent work or create a Bootstrap approval gate.'
        : instruction,
      human_question: stalled ? null : question,
      continue_same_turn: !stalled && !question && action !== 'BOOTSTRAP_READY',
      assessment_only: true, source_write_authorized: false,
      requires_external_readback: true, progress_signature: signature,
    }
  }
  // Existing valid work remains PASS; no separate Human Bootstrap approval is required.
  // Requested Criteria revisions still follow the ordinary Criteria editing workflow.
  if (list[0].status === 'PASS' && confirmedExisting && choice === 'UPDATE' && criterion.revision_completed !== true)
    return output('criteria', 'PREPARE_CRITERIA_REVISION', 'planner',
      'Human requested a Criteria update. Prepare the requested revision and review it using the normal Criteria workflow.')

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
        'Request Human input only for an actual unresolved product GOAL or WHAT/WHY decision. Do not require a separate Human Bootstrap approval.',
        next.observation || 'Cần làm rõ yêu cầu sản phẩm nào để hoàn thiện Criteria?')
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
      'Inspect existing Plan against Criteria and actual project state. For brownfield inventory old Tasks/Jobs, migrate them into appropriate Plan positions and reconcile their true status. Retain reviewed, aligned Plan; otherwise repair/create necessary sections and run independent Reviewer and Critic Reviewer CRL until PASS. Human explicitly requested Bootstrap with CRL; this grants review of Plan/Milestones, NOT product code writes. When there is a valid Job use existing human_invoked CR for that Human-directed scope; without a Job run role-isolated DIRECT_AGENT reviews of real documents, without fabricating durable receipts or a duplicate Job.')
  if (next.id === 'milestones')
    return output('milestones', 'MILESTONES_CRL', 'planner',
      'Inspect Milestones against PASS Plan and keep valid ones; otherwise repair then Reviewer → Critic Reviewer CRL until PASS. Human Bootstrap request authorizes this review, not code execution. Without an existing Job use independent DIRECT_AGENT Critic Reviewer on actual documents; do not create a Job just to satisfy CR tooling or fabricate signed review evidence.')
  if (next.id === 'technical_proposal')
    return output('technical_proposal', 'TECHNICAL_PROPOSAL_REVIEW', 'planner',
      'Inspect or prepare a feasible Technical Proposal consistent with Criteria and Plan; review issues until PASS. No product source implementation in Bootstrap.')
  return output('capabilities', 'PREPARE_CODER_TESTER', 'orchestrator',
    'Inspect repository languages, existing skills, knowledge and working tools; add/test only genuinely missing Coder/Tester capability. Do not require product features to already exist. Do not invent a capability registration gate.')
}

export function projectBootstrapReadinessDecision(_projectId: string, input: any) {
  // PREPARE ONLY: bootstrap does not authorize Coder Runs or source mutation.
  // Actual documents and capabilities must be independently examined before
  // declaring each item PASS. Do not require Job metadata, SHA or graph schemas.
  const result = (status: string, detail: string) => ({
    status, detail, bootstrapped: false, source_write_authorized: false,
    requires_external_readback: true,
  })
  const a = input?.assessment ?? {}
  if (a.criteria !== 'PASS' && a.criteria !== 'APPROVED')
    return result('CRITERIA_NOT_READY', 'Inspect or prepare valid project Criteria.')
  if (a.plan !== 'PASS')
    return result('PLAN_NOT_READY', 'Align the Plan with Criteria and actual project work, including brownfield tasks.')
  if (a.milestones !== 'PASS')
    return result('MILESTONES_NOT_READY', 'Align Milestones with the Plan.')
  if (a.technical_proposal !== 'PASS')
    return result('TECHNICAL_PROPOSAL_NOT_READY', 'Verify Technical Proposal feasibility and alignment.')
  if (a.coder !== 'READY' || a.tester !== 'READY')
    return result('CAPABILITY_NOT_READY', 'Prepare relevant Coder and Tester skills, knowledge and tools.')
  return result('BOOTSTRAP_READY', 'All five preparation checks are complete. No separate Human Bootstrap approval is required.')
}
