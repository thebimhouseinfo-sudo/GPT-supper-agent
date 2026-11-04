// U-D: validates completeness of the supplied PRE_CODE_TECHNICAL review evidence.
// This does not prove source truth or grant source-write authority; independent
// Critic inspection and existing Human/Job/Run/CAS rules remain mandatory.
export function preCodeTechnicalError(review: any): string | null {
  if (!review || typeof review !== 'object') return 'PRE_CODE_REVIEW_MISSING'
  if (typeof review.proposal_ref !== 'string' || !review.proposal_ref.trim() ||
      typeof review.proposal_revision !== 'string' || !/^[a-f0-9]{40}$/i.test(review.proposal_revision))
    return 'PRE_CODE_PROPOSAL_REF_OR_SHA_MISSING'
  const strings = (v: any): v is string[] =>
    Array.isArray(v) && v.length > 0 && v.every((x: any) => typeof x === 'string' && !!x.trim())
  const related = review.related_task_ids, checked = review.reviewed_task_ids
  if (!strings(related) || !strings(checked) || new Set(related).size !== related.length ||
      new Set(checked).size !== checked.length || related.length !== checked.length ||
      related.some((id: string) => !checked.includes(id)))
    return 'PRE_CODE_WHOLE_TASK_REVIEW_MISSING'
  if (!Array.isArray(review.items) || review.items.length === 0)
    return 'PRE_CODE_INVENTORY_MISSING'
  const paths = new Set<string>(), taskCoverage = new Set<string>()
  const actions = ['CREATE','MODIFY','REUSE_AS_IS','KEEP','REMOVE']
  for (const item of review.items) {
    if (!item || typeof item.path !== 'string' || !item.path.trim() ||
        paths.has(item.path) || !actions.includes(item.action))
      return 'PRE_CODE_FILE_OWNER_DUPLICATED_OR_INVALID'
    paths.add(item.path)
    if (!strings(item.task_ids) || item.task_ids.some((id: string) => !related.includes(id)))
      return 'PRE_CODE_FILE_TASK_BINDING_INVALID'
    item.task_ids.forEach((id: string) => taskCoverage.add(id))
    if (!strings(item.functions)) return 'PRE_CODE_FUNCTION_UNDOCUMENTED: ' + item.path
    if (!strings(item.callers)) return 'PRE_CODE_CALLER_UNDOCUMENTED: ' + item.path
    if (!strings(item.interfaces)) return 'PRE_CODE_INTERFACE_UNDOCUMENTED: ' + item.path
    if (!strings(item.source_evidence)) return 'PRE_CODE_SOURCE_EVIDENCE_MISSING: ' + item.path
    if (!Array.isArray(item.dependencies) ||
        item.dependencies.some((dep: any) => typeof dep !== 'string'))
      return 'PRE_CODE_DEPENDENCIES_INVALID: ' + item.path
  }
  if (related.some((id: string) => !taskCoverage.has(id)))
    return 'PRE_CODE_TASK_WITHOUT_FILE_COVERAGE'
  const lookup = new Map<string, any>(review.items.map((item: any) => [item.path, item]))
  const visiting = new Set<string>(), visited = new Set<string>()
  const cycle = (path: string): boolean => {
    if (visiting.has(path)) return true
    if (visited.has(path)) return false
    visiting.add(path)
    for (const dep of lookup.get(path)?.dependencies ?? []) {
      if (lookup.has(dep) && cycle(dep)) return true
    }
    visiting.delete(path); visited.add(path)
    return false
  }
  if ([...lookup.keys()].some(path => cycle(path))) return 'PRE_CODE_DEPENDENCY_CYCLE'
  if (review.duplication_assessment !== 'NO_UNRESOLVED_DUPLICATION')
    return 'PRE_CODE_DUPLICATED_FUNCTIONALITY_UNRESOLVED'
  if (review.complexity_assessment !== 'PROPORTIONATE')
    return review.complexity_assessment === 'HUMAN_ESCALATION'
      ? 'PRE_CODE_DISPROPORTIONATE_HOST_RISK'
      : 'PRE_CODE_DISPROPORTIONATE_COMPLEXITY'
  return null
}

// GSA1-S7: Critic dispatch and review record registration.
export function registerCriticReviewTools(deps: any) {
  const { DURABLE_RECORD_SNAPSHOT_SCHEMA, AUTH_SCOPES, authContext, authError, req, z, server, uuidv7, prettyJson, verificationPath, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, DEFAULT_NEXT_MEMORY_NAMESPACE, milestoneCrlEvidenceError } = deps
  const PRE_CODE_REVIEW_SCHEMA = z.object({
    proposal_ref: z.string().min(1),
    proposal_revision: z.string().regex(/^[a-f0-9]{40}$/i),
    related_task_ids: z.array(z.string().min(1)).min(1),
    reviewed_task_ids: z.array(z.string().min(1)).min(1),
    items: z.array(z.object({
      path: z.string().min(1),
      action: z.enum(['CREATE','MODIFY','REUSE_AS_IS','KEEP','REMOVE']),
      task_ids: z.array(z.string().min(1)).min(1),
      functions: z.array(z.string()).min(1),
      callers: z.array(z.string()).min(1),
      interfaces: z.array(z.string()).min(1),
      dependencies: z.array(z.string()).default([]),
      source_evidence: z.array(z.string()).min(1),
    })).min(1),
    duplication_assessment: z.enum(['NO_UNRESOLVED_DUPLICATION','CHANGES_REQUIRED']),
    complexity_assessment: z.enum(['PROPORTIONATE','CHANGES_REQUIRED','HUMAN_ESCALATION']),
  })
  server.registerTool(
    'start_critic_review',
    {
      title: 'Start authorized Critic Reviewer',
      description: 'Independent CR after direct Human request OR Human-approved milestone crl after exact Reviewer PASS. Never trigger CR without either scope-bound authority.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        human_invoked: z.boolean().default(false),
        approved_milestone_id: z.string().optional(),
        milestone_reviewer_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
        review_focus: z.enum(['GENERAL','PRE_CODE_TECHNICAL']).optional(),
        prior_review_verification_ref: z.string().optional(),
      },
      outputSchema: {
        role: z.string(),
        allowed: z.boolean(),
        status: z.string(),
        context_policy: z.string(),
        project_id: z.string(),
        job_id: z.string(),
        planning_revision: z.number().nullable(),
        target_ref: z.string().nullable(),
        target_revision: z.string().nullable(),
        prior_review_verification_ref: z.string().nullable(),
        durable_inputs_only: z.boolean(),
        authorization_source: z.enum(['HUMAN_COMMAND','APPROVED_MILESTONE']),
        review_focus: z.string().optional(),
        next_step: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, human_invoked, approved_milestone_id, milestone_reviewer_snapshot, target_ref, target_revision, prior_review_verification_ref, review_focus }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to start Critic Reviewer.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      if (!jobExecutionContract(current)) return invalidExecutionContract()
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Critic review target does not match the supplied Job.' }], isError: true }
      }
      const milestoneError = human_invoked === true ? null :
        milestoneCrlEvidenceError(current, approved_milestone_id ?? null, milestone_reviewer_snapshot, target_revision)
      if (milestoneError) return { content: [{ type: 'text', text: milestoneError }], isError: true }
      const result = {
        role: 'critic_reviewer',
        allowed: true,
        status: human_invoked === true ? 'READY_FOR_STATELESS_REVIEW' : 'PENDING_MILESTONE_EVIDENCE_READBACK',
        context_policy: 'Same-chat invocation is explicitly allowed. Ignore all conversation history, including Planner/Reviewer reasoning visible in this chat, as review evidence. Reconstruct the target only from persisted Project/Job/Verification records plus live source truth. Form the independent verdict before reading prior Reviewer verdict.',
        project_id,
        job_id,
        planning_revision: current.planning_revision ?? null,
        target_ref: target_ref ?? current.repository_context?.working_repository_url ?? null,
        target_revision: target_revision ?? null,
        prior_review_verification_ref: prior_review_verification_ref ?? current.planning_review?.verification_ref ?? null,
        durable_inputs_only: true,
        authorization_source: human_invoked === true ? 'HUMAN_COMMAND' : 'APPROVED_MILESTONE',
        ...(review_focus === 'PRE_CODE_TECHNICAL' ? { review_focus } : {}),
        next_step: human_invoked === true
          ? 'Proceed with independent CR on the Human target; read durable evidence before verdict and compare prior Reviewer only afterwards.'
          : 'BEFORE CR: re-fetch current approved Job blob and confirm matching SHA/planning revision plus Human milestone crl authorization, re-fetch the supplied Reviewer PASS Verification by exact path/SHA and compare all matching fields. A supplied JSON snapshot alone does not authorize CR. Then execute independent CR and record its APPROVED_MILESTONE source, not human_invoked.',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'critic_review_record',
    {
      title: 'Record independent Critic Reviewer Verification',
      description: 'Persist CRITIC_REVIEW evidence only. Does not modify Job lifecycle or source.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        planning_revision: z.number().int().positive().optional(),
        human_invoked: z.boolean().default(false),
        approved_milestone_id: z.string().optional(),
        milestone_reviewer_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        result: z.enum(['PASS','PASS_WITH_FINDINGS','FAIL','BLOCKED']),
        findings: z.array(z.object({
          severity: z.enum(['CRITICAL','IMPORTANT','MINOR']),
          finding: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          suggested_followup: z.string().optional(),
        })).default([]),
        limitations: z.array(z.string()).default([]),
        prior_review_verification_ref: z.string().optional(),
        prior_review_comparison: z.object({
          compared_after_independent_verdict: z.literal(true),
          agreement: z.enum(['AGREE','PARTIAL_DISAGREEMENT','DISAGREE','NO_PRIOR_REVIEW']),
          notes: z.array(z.string()).default([]),
        }),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
        review_focus: z.enum(['GENERAL','PRE_CODE_TECHNICAL']).optional(),
        pre_code_review: PRE_CODE_REVIEW_SCHEMA.optional(),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        job_mutated: z.boolean(),
        next_role: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, planning_revision, human_invoked, approved_milestone_id, milestone_reviewer_snapshot, result, findings, limitations, prior_review_verification_ref, prior_review_comparison, target_ref, target_revision, review_focus, pre_code_review }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to record Critic Review.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(current)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(current)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'CRITIC_REVIEW_REJECTED: NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      const milestoneError = human_invoked === true ? null : milestoneCrlEvidenceError(current, approved_milestone_id ?? null, milestone_reviewer_snapshot, target_revision)
      if (milestoneError) return { content: [{ type: 'text', text: milestoneError }], isError: true }
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Critic review target does not match the supplied Job.' }], isError: true }
      }
      if (planning_revision != null && current.planning_revision !== planning_revision) {
        return { content: [{ type: 'text', text: 'Critic review planning revision does not match the supplied Job snapshot.' }], isError: true }
      }
      if (result === 'PASS' && (findings ?? []).length > 0) {
        return { content: [{ type: 'text', text: 'Use PASS_WITH_FINDINGS when CR has findings.' }], isError: true }
      }
      if (result === 'PASS_WITH_FINDINGS' &&
          (!(findings ?? []).length || (findings ?? []).some((f: any) => ['CRITICAL','IMPORTANT'].includes(f.severity)))) {
        return { content: [{ type: 'text', text: 'CRITIC_REVIEW_FINDINGS_BLOCKING: important/critical CR findings require FAIL, and PASS_WITH_FINDINGS requires nonblocking findings.' }], isError: true }
      }
      // Only an explicitly PRE_CODE_TECHNICAL PASS needs a complete corrected
      // inventory. Existing general CR calls, FAIL and BLOCKED remain compatible.
      if (review_focus === 'PRE_CODE_TECHNICAL' && ['PASS','PASS_WITH_FINDINGS'].includes(result)) {
        const reviewError = preCodeTechnicalError(pre_code_review)
        if (reviewError) return { content: [{ type: 'text', text: reviewError }], isError: true }
        if (target_ref && pre_code_review.proposal_ref !== target_ref)
          return { content: [{ type: 'text', text: 'PRE_CODE_PROPOSAL_TARGET_MISMATCH' }], isError: true }
      }
      const verificationId = uuidv7()
      const memoryPath = verificationPath(project_id, verificationId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const verification = {
        verification_id: verificationId,
        kind: 'CRITIC_REVIEW',
        project_id,
        job_id,
        planning_revision: planning_revision ?? current.planning_revision ?? null,
        producer: 'critic_reviewer',
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { memory_namespace: nextMemoryNamespace } : {}),
        human_invoked: human_invoked === true,
        authorization_source: human_invoked === true ? 'HUMAN_COMMAND' : 'APPROVED_MILESTONE',
        approved_milestone_id: human_invoked === true ? null : approved_milestone_id,
        milestone_reviewer_snapshot_ref: human_invoked === true ? null : milestone_reviewer_snapshot?.path,
        target_ref: target_ref ?? current.repository_context?.working_repository_url ?? null,
        target_revision: target_revision ?? null,
        ...(review_focus === 'PRE_CODE_TECHNICAL' ? {
          review_focus: 'PRE_CODE_TECHNICAL',
          proposal_ref: pre_code_review?.proposal_ref ?? target_ref ?? null,
          proposal_revision: pre_code_review?.proposal_revision ?? null,
          reviewed_task_ids: pre_code_review?.reviewed_task_ids ?? [],
          // Inventory is ONLY trusted after CR PASS, immutable persistence and readback.
          ...(['PASS','PASS_WITH_FINDINGS'].includes(result) ? {
            reviewed_inventory: pre_code_review.items,
            duplication_assessment: pre_code_review.duplication_assessment,
            complexity_assessment: pre_code_review.complexity_assessment,
          } : {}),
        } : {}),
        result,
        findings: findings ?? [],
        limitations: limitations ?? [],
        prior_review_verification_ref: prior_review_verification_ref ?? current.planning_review?.verification_ref ?? null,
        prior_review_comparison,
        job_lifecycle_at_review: current.lifecycle,
        created_at: new Date().toISOString(),
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: memoryPath,
        verification_record_text: prettyJson(verification),
        job_mutated: false,
        next_role: human_invoked === true ? 'human' : 'orchestrator',
        external_steps: [
          ...(human_invoked === true ? [] : ['Re-fetch the exact current Job SHA from GitHub Memory Repo and confirm Human-approved milestone crl, then independently fetch the matching Reviewer PASS snapshot path/SHA before recording CR. Supplied snapshot JSON is not evidence by itself.']),
          'Persist verification_record_text at verification_memory_path after authorize_memory_mutation(create).',
          'Do not update the Job record or lifecycle from CR output.',
          ...(human_invoked === true
            ? ['Present the independent CR verdict to Human. Direct cr remains a one-shot review.']
            : [
                'After immutable CR Verification persistence and exact readback, re-fetch current Job and call milestone_loop_evaluate(stage=CR, verdict=' + (result === 'PASS_WITH_FINDINGS' ? 'PASS' : result) + ') on the approved milestone. PASS_WITH_FINDINGS is accepted only with nonblocking MINOR findings.',
                'Follow returned continuation in the SAME turn: CR FAIL -> correct Planner/Coder owner repairs -> fresh Reviewer PASS at exact source revision -> independent CR again. CR PASS advances only when authorized; BLOCKED/no progress stops. Never reuse old Reviewer PASS.',
              ]),
        ],
      }
      if (review_focus === 'PRE_CODE_TECHNICAL') {
        out.external_steps.push(
          ['PASS','PASS_WITH_FINDINGS'].includes(result)
            ? 'PRE_CODE_TECHNICAL: after CR Verification exact readback at the reviewed proposal SHA, Coder may use reviewed_inventory as reference; existing authorization and Job/Run/CAS rules still govern writes.'
            : 'PRE_CODE_TECHNICAL CHANGES_REQUIRED/HUMAN_ESCALATION: correct the SAME related-Task proposal and obtain a new independent CR, or route genuine disproportionate Host risk to Human; no reviewed inventory is authorized.'
        )
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
