// GSA1: bounded Job Plan Change and supersession tools.
export function registerPlanChangeTools(deps: any) {
 const { server, z, req, AUTH_SCOPES, authContext, authError, DEFAULT_NEXT_MEMORY_NAMESPACE, assessHumanPlanChangeJobs, jobExecutionContract, prepareHumanPlanChangeFenceDecision, prepareHumanPlanChangeIntent, prettyJson, recordNextMemoryNamespace, recordPath, resumeHumanPlanChangeIntent } = deps
  // Scope-wide U-B is an option on the existing LLC58 Plan Change surface,
  // not a new authority or lifecycle. Inventory/approval require Git readback.
  const SCOPE_CHANGE_SCHEMA = z.object({
    boundary: z.enum(['PLAN','PHASE']),
    plan_job_id: z.string().uuid(),
    phase_id: z.string().min(1).optional(),
    human_approval_ref: z.string().min(1),
    successor_job_count: z.number().int().min(1).max(16).default(1),
    inventory_job_ids: z.array(z.string().uuid()).min(1),
  })
  server.registerTool(
    'job_plan_change_fence_prepare',
    {
      title: 'Prepare exact-SHA affected Job Plan fence',
      description: 'LLC58: stop new Run/cursor writes before superseding a replaced READY or IN_PROGRESS Job. Prepared UPDATE only; external GitHub CAS/readback required.',
      inputSchema: {
        project_id:z.string().uuid(),job_id:z.string().uuid(),
        job_record_text:z.string().min(2),
        job_record_sha:z.string().regex(/^[0-9a-f]{40}$/),
        intent_record_text:z.string().min(2),
        intent_record_sha:z.string().regex(/^[0-9a-f]{40}$/),
        intent_memory_path:z.string().min(1),
      },
      outputSchema:{
        allowed:z.boolean(),reason:z.string(),
        operation:z.enum(['UPDATE','NONE']),
        job_memory_path:z.string(),
        expected_job_sha:z.string().nullable(),
        next_job_record_text:z.string().nullable(),
        mutation_authorized:z.boolean(),
        external_steps:z.array(z.string()),
      },
      securitySchemes:[{type:'oauth2',scopes:AUTH_SCOPES}],
      _meta:{securitySchemes:[{type:'oauth2',scopes:AUTH_SCOPES}]},
      annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
    } as any,
    async (input: any) => {
      const auth=await authContext(req)
      if (!auth) return authError(req,'Authentication required for Job Plan fence.')
      const decision=prepareHumanPlanChangeFenceDecision(input)
      let job:any
      try { job=JSON.parse(input.job_record_text) } catch { job={} }
      const contract=jobExecutionContract(job)
      const ns=recordNextMemoryNamespace(job)
      const path=contract ? recordPath(input.project_id,'JOBS',input.job_id,contract,
        ns ?? DEFAULT_NEXT_MEMORY_NAMESPACE) : ''
      const result={
        allowed:decision.allowed,reason:decision.reason,
        operation:decision.operation,
        job_memory_path:path,
        expected_job_sha:decision.allowed ? decision.expected_job_sha : null,
        next_job_record_text:decision.allowed ? prettyJson(decision.record) : null,
        mutation_authorized:false,
        external_steps:decision.allowed ? [
          'Read back exact immutable reviewed Plan intent and current Job SHA; authorize both paths under current PROJECT.md.',
          'If UPDATE, authorize_memory_mutation and write Job fence using the exact expected_job_sha; independently read back bytes/SHA.',
          'Only after fence readback, reconcile pending cursor, Run, Git HEAD/tree; then use intent-bound job_transition(SUPERSEDED or RETIRED).',
          'Do not dispatch or write source under a fenced Job in any chat; no background stop is implied.',
        ]:[],
      }
      return {structuredContent:result,content:[{type:'text',text:JSON.stringify(result)}]}
    },
  )

  server.registerTool(
    'job_plan_change_resume_evaluate',
    {
      title: 'Resume a reviewed multi-Job Plan Change from durable readback',
      description: 'LLC58 recovery evaluator; identifies the next safe action after interrupted Job supersession/replacement. Never authorizes mutation or transfers old PASS evidence.',
      inputSchema: {
        project_id: z.string().uuid(),
        intent_memory_path: z.string().min(1),
        intent_record_text: z.string().min(2),
        intent_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_job_snapshots: z.array(z.object({
          job_record_text: z.string().min(2),
          job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        })),
        activity: z.array(z.object({
          job_id: z.string().uuid(),
          cursor_state: z.enum(['ABSENT','STABLE','PENDING','UNKNOWN']),
          active_run_state: z.enum(['NONE','TERMINAL','ACTIVE','UNKNOWN']),
        })).default([]),
      },
      outputSchema: {
        allowed: z.boolean(), reason: z.string(),
        actions: z.array(z.any()), mutation_authorized: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Plan Change recovery.')
      const decision = resumeHumanPlanChangeIntent(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'job_plan_change_prepare',
    {
      title: 'Prepare immutable Human Plan Change reconciliation intent',
      description: 'LLC58/U-B: prepare one reviewed immutable Plan Change intent. Optional scope_change automatically RETIRES all unfinished Plan/Phase work plus dependent unfinished Jobs; requires verified Human approval and complete inventory readback. No mutation is performed.',
      inputSchema: {
        project_id: z.string().uuid(),
        change_ref: z.string().min(1),
        reviewed_plan_sha: z.string().regex(/^[0-9a-f]{40}$/),
        plan_job_record_text: z.string().min(2),
        plan_job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        plan_review_record_text: z.string().min(2),
        plan_review_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        plan_review_memory_path: z.string().min(1),
        work_branch: z.string().min(1),
        scope_change: SCOPE_CHANGE_SCHEMA.optional(),
        job_snapshots: z.array(z.object({
          job_record_text: z.string().min(2),
          job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          decision: z.enum(['KEEP','REVALIDATE','REPLACE','RETIRE','HUMAN_DECISION']).optional(),
          reason: z.string().min(1).optional(),
          retired_task_ids: z.array(z.string().min(1)).optional(),
          cursor_state: z.enum(['ABSENT','STABLE','PENDING','UNKNOWN']).optional(),
          active_run_state: z.enum(['NONE','TERMINAL','ACTIVE','UNKNOWN']).optional(),
        })).min(1),
        existing_intent_record_text: z.string().min(2).optional(),
        existing_intent_record_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
      },
      outputSchema: {
        allowed: z.boolean(), reason: z.string(),
        operation: z.enum(['CREATE','NONE']), intent_memory_path: z.string(),
        intent_record_text: z.string().nullable(),
        mutation_authorized: z.boolean(), external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Plan Change intent.')
      const decision = prepareHumanPlanChangeIntent(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'job_plan_change_assess',
    {
      title: 'Assess Jobs affected by a Human-reviewed Plan change',
      description: 'Read-only LLC58/U-B impact. Optional scope_change derives scope-wide RETIRE (including crossing dependencies), preserves completed/unchanged work; requires independent complete inventory and reviewed Human boundary. Never writes.',
      inputSchema: {
        project_id: z.string().uuid(),
        change_ref: z.string().min(1),
        reviewed_plan_sha: z.string().regex(/^[0-9a-f]{40}$/),
        scope_change: SCOPE_CHANGE_SCHEMA.optional(),
        job_snapshots: z.array(z.object({
          job_record_text: z.string().min(2),
          job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          decision: z.enum(['KEEP','REVALIDATE','REPLACE','RETIRE','HUMAN_DECISION']).optional(),
          reason: z.string().min(1).optional(),
          retired_task_ids: z.array(z.string().min(1)).optional(),
          cursor_state: z.enum(['ABSENT','STABLE','PENDING','UNKNOWN']).optional(),
          active_run_state: z.enum(['NONE','TERMINAL','ACTIVE','UNKNOWN']).optional(),
        })).min(1),
      },
      outputSchema: {
        allowed: z.boolean(), reason: z.string(),
        decisions: z.array(z.any()), mutation_authorized: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Plan Change assessment.')
      const assessment = assessHumanPlanChangeJobs(input)
      return { structuredContent: assessment, content: [{ type: 'text', text: JSON.stringify(assessment) }] }
    },
  )

}
