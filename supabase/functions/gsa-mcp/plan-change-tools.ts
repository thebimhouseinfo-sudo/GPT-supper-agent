// GSA1: bounded Job Plan Change and supersession tools.
export function registerPlanChangeTools(deps: any) {
 const { server, z, req, AUTH_SCOPES, authContext, authError, DEFAULT_NEXT_MEMORY_NAMESPACE, assessHumanPlanChangeJobs, jobExecutionContract, prepareHumanPlanChangeFenceDecision, prepareHumanPlanChangeIntent, prettyJson, recordNextMemoryNamespace, recordPath, resumeHumanPlanChangeIntent } = deps
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
      description: 'LLC58: prepare one deterministic CREATE per reviewed Plan revision. Reserve unique replacement Job IDs; requires PASS planning-review evidence. Only external authorized GitHub CREATE/readback makes it durable; no Job mutation is performed.',
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
        human_change_approval_ref: z.string().min(1).optional(),
        scope_selection: z.object({
          boundary: z.enum(['PLAN','PHASE']),
          phase: z.string().min(1).optional(),
          inventory_job_ids: z.array(z.string().uuid()).min(1),
        }).optional(),
        rebuild_job_packs: z.array(z.object({
          pack_key: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
          phase: z.string().min(1),
          depends_on_pack_keys: z.array(z.string()).default([]),
        })).optional(),
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
      if (decision.allowed && input.scope_selection) decision.external_steps.unshift(
        'Independently enumerate all current child Jobs in active Project Memory and verify inventory_job_ids exactly equals their IDs; every Job must have a current blob SHA. Read back the actual Human-approved changed Plan/Phase and bind human_change_approval_ref before relying on scope_selection.',
        'Do not dispatch rebuilt Jobs until every affected unfinished Job has durable RETIRED readback and all crossed dependencies have been re-reviewed.',
        'Shared/default/main/release/integration Git refs and history must remain intact; no branch deletion or automatic release.',
      )
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'job_plan_change_assess',
    {
      title: 'Assess Jobs affected by a Human-reviewed Plan change',
      description: 'Read-only LLC58 impact matrix. Distinguish KEEP, REVALIDATE, REPLACE, RETIRE and HUMAN_DECISION for durable Jobs; this tool never transitions Jobs, creates cursors or authorizes writes.',
      inputSchema: {
        project_id: z.string().uuid(),
        change_ref: z.string().min(1),
        reviewed_plan_sha: z.string().regex(/^[0-9a-f]{40}$/),
        scope_selection: z.object({
          boundary: z.enum(['PLAN','PHASE']),
          phase: z.string().min(1).optional(),
          inventory_job_ids: z.array(z.string().uuid()).min(1),
        }).optional(),
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
