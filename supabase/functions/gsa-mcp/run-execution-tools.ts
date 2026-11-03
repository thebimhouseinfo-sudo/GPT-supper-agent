// GSA1: cohesive Run Execution registrations (begin, knowledge, goal, verification, completion).
export function registerRunExecutionTools(deps: any) {
 const { server, z, req, AUTH_SCOPES, authContext, authError, DURABLE_RECORD_SNAPSHOT_SCHEMA, DEFAULT_NEXT_MEMORY_NAMESPACE, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, projectBootstrapExecutionError, parseDurableSnapshots, resolveRequiredTaskSkills, nextDispatchPreflightError, evaluateNextEvidenceGate, normalizeGithubRepo, uxFirstTemporaryUiGateRequired, uuidv7, runHandle, recordPath, prettyJson, durableSnapshotReadbackSteps, knowledgePath, goalRecheckRunMatches, resolveExecutionContract, goalRecheckCoverageError, verificationPath, validateRunVerificationSnapshot, validateTesterEvidenceVerificationSnapshot, validateTesterEvidenceClaimSnapshot } = deps
  server.registerTool(
    'run_begin',
    {
      title: 'Begin a GSA Job Run',
      description: 'Create one attributed execution Run. Call get_agent_harness for the selected role before executing work.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        current_job_record_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        planning_revision: z.number().int().positive().optional(),
        role: z.enum(['planner','designer','coder','reviewer','tester']),
        scope_claim: z.array(z.string()).min(1),
        primary_task_id: z.string().min(1).optional(),
        affected_task_refs: z.array(z.string()).default([]),
        parent_run_id: z.string().uuid().optional(),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
        input_refs: z.array(z.string()).default([]),
        checkpoint_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        checkpoint_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        completed_task_run_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        project_manifest_text: z.string().optional(),
        bootstrap_evidence: z.any().optional(),
      },
      outputSchema: {
        run_id: z.string(),
        handle: z.string(),
        memory_path: z.string(),
        run_record_text: z.string(),
        expected_job_sha: z.string().nullable(),
        required_skill_contexts: z.array(z.object({
          name: z.string(),
          description: z.string(),
          skill_text: z.string(),
        })),
        next_step: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, job_record_sha, current_job_record_sha, planning_revision, role, scope_claim, primary_task_id, affected_task_refs, parent_run_id, target_ref, target_revision, input_refs, checkpoint_claim_snapshots, checkpoint_verification_snapshots, completed_task_run_snapshots, project_manifest_text, bootstrap_evidence }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to begin a Run.')
      let owningJob: any
      try { owningJob = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid owning Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(owningJob)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(owningJob)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'NEXT_RUN_NAMESPACE_INVALID: owning Job memory_namespace is invalid.' }], isError: true }
      }
      if (owningJob.job_id !== job_id || owningJob.project_id !== project_id || !['READY','IN_PROGRESS'].includes(owningJob.lifecycle)) {
        return { content: [{ type: 'text', text: 'Owning Job identity/lifecycle mismatch.' }], isError: true }
      }
      if (owningJob.plan_change_pending) {
        return { content: [{ type:'text', text:'PLAN_CHANGE_PENDING_FENCE: Job is being reconciled with a newer reviewed Plan; do not start another Run.' }], isError:true }
      }
      if (role === 'coder') {
        const blocked = projectBootstrapExecutionError(project_id, project_manifest_text ?? '', bootstrap_evidence,
          owningJob.repository_context?.working_repository_url ?? null,
          owningJob.repository_context?.integration_branch ?? null)
        if (blocked) return { content: [{ type: 'text', text: blocked }], isError: true }
      }
      const currentTaskIds = new Set<string>((owningJob.tasks ?? []).filter((item: any) => item.lifecycle !== 'RETIRED').map((item: any) => item.task_id))
      if (executionContract === 'NEXT' && primary_task_id && !currentTaskIds.has(primary_task_id)) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REJECTED: primary_task_id is not a Task in the current planning revision.' }], isError: true }
      }
      if (executionContract === 'NEXT' && (affected_task_refs ?? []).some((id: string) => !currentTaskIds.has(id))) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REJECTED: every affected_task_ref must be a current Task in this planning revision.' }], isError: true }
      }
      if (executionContract === 'NEXT' && ['coder','designer','reviewer','tester'].includes(role) && (owningJob.tasks ?? []).length > 0 && !primary_task_id) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REQUIRED: NEXT execution must bind one current primary Task so role, prerequisite and evidence guards cannot be bypassed.' }], isError: true }
      }
      if (
        executionContract === 'NEXT' &&
        (owningJob.planning_review?.status !== 'PASS' || owningJob.planning_review?.reviewed_revision !== owningJob.planning_revision)
      ) {
        return { content: [{ type: 'text', text: 'NEXT_PLAN_REVIEW_PENDING: current NEXT planning revision is not Reviewer PASS; dispatch is blocked.' }], isError: true }
      }
      let resolvedRequiredSkills: any = { names: [], contexts: [], error: null }
      if (executionContract === 'NEXT') {
        const completedRuns = parseDurableSnapshots(completed_task_run_snapshots ?? [], 'completed_task_run_snapshots')
        if (completedRuns.error) {
          return { content: [{ type: 'text', text: 'NEXT_DISPATCH_PREREQUISITE_INVALID: ' + completedRuns.error }], isError: true }
        }
        const dispatchTaskIds = primary_task_id
          ? [primary_task_id, ...((affected_task_refs ?? []).filter((id: string) => id !== primary_task_id))]
          : []
        resolvedRequiredSkills = resolveRequiredTaskSkills(owningJob, dispatchTaskIds)
        if (resolvedRequiredSkills.error) {
          return { content: [{ type: 'text', text: resolvedRequiredSkills.error }], isError: true }
        }
        const dispatchError = nextDispatchPreflightError(
          owningJob,
          role,
          dispatchTaskIds,
          planning_revision ?? null,
          job_record_sha ?? null,
          current_job_record_sha ?? null,
          completedRuns.entries,
        )
        if (dispatchError) return { content: [{ type: 'text', text: dispatchError }], isError: true }
      }
      if (executionContract === 'NEXT' && primary_task_id) {
        const gatedTaskIds = new Set<string>([primary_task_id])
        if (['coder','designer'].includes(role)) {
          for (const id of affected_task_refs ?? []) gatedTaskIds.add(id)
        }
        for (const taskId of gatedTaskIds) {
          const gate = evaluateNextEvidenceGate(
            owningJob,
            checkpoint_claim_snapshots ?? [],
            checkpoint_verification_snapshots ?? [],
            { kind: 'TASK', id: taskId },
          )
          if (!gate.allowed) {
            return {
              content: [{
                type: 'text',
                text: 'EVIDENCE_REQUIREMENT_BLOCKED: Task ' + taskId + ': ' + gate.blocking.join('; '),
              }],
              isError: true,
            }
          }
        }
      }
      if (
        role === 'coder' &&
        target_ref &&
        owningJob.repository_context?.working_repository_url &&
        normalizeGithubRepo(target_ref)?.url &&
        normalizeGithubRepo(target_ref)?.url !== owningJob.repository_context.working_repository_url
      ) {
        return { content: [{ type: 'text', text: 'Coder target repository does not match the Job working repository.' }], isError: true }
      }
      if (uxFirstTemporaryUiGateRequired(owningJob, role)) {
        return {
          content: [{
            type: 'text',
            text: 'HUMAN_GATE_REQUIRED: UX_FIRST temporary UI contains user-facing provisional structure that is still REQUIRED_PENDING. Planner must obtain explicit Human approval and persist an approved Job planning revision before Coder may begin.',
          }],
          isError: true,
        }
      }
      const approvedReviewMilestones = role === 'reviewer' && primary_task_id
        ? (owningJob.milestones ?? []).filter((m: any) =>
            (m.node_ids ?? []).includes(primary_task_id) &&
            ['rl','crl'].includes(m.review_loop) && m.human_pre_authorized === true)
        : []
      if (approvedReviewMilestones.length > 1) {
        return { content: [{ type: 'text', text: 'MILESTONE_REVIEW_AMBIGUOUS: Reviewer Task belongs to more than one approved review milestone.' }], isError: true }
      }
      const runId = uuidv7()
      const now = new Date().toISOString()
      const record = {
        run_id: runId,
        handle: runHandle(runId),
        project_id,
        job_id,
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { planning_revision: owningJob.planning_revision, memory_namespace: nextMemoryNamespace } : {}),
        primary_task_id: primary_task_id ?? null,
        ...(role === 'reviewer' && approvedReviewMilestones.length === 1 ? { milestone_id: approvedReviewMilestones[0].milestone_id } : {}),
        affected_task_refs: affected_task_refs ?? [],
        parent_run_id: parent_run_id ?? null,
        role,
        target_ref: target_ref ?? null,
        target_revision: target_revision ?? null,
        scope_claim,
        input_refs: input_refs ?? [],
        loaded_skills: executionContract === 'NEXT' ? resolvedRequiredSkills.names : [],
        lifecycle: 'IN_PROGRESS',
        derived_condition: null,
        result: null,
        output_refs: [],
        verification_refs: [],
        handoff_ref: null,
        started_at: now,
        ended_at: null,
      }
      const path = recordPath(project_id, 'RUNS', runId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const result = {
        run_id: runId,
        handle: runHandle(runId),
        memory_path: path,
        run_record_text: prettyJson(record),
        expected_job_sha: executionContract === 'NEXT' ? (job_record_sha ?? null) : null,
        required_skill_contexts: executionContract === 'NEXT' ? resolvedRequiredSkills.contexts : [],
        next_step: (executionContract === 'NEXT' && resolvedRequiredSkills.contexts.length
          ? 'Required Task skills are already injected in required_skill_contexts. Apply them together with get_agent_harness(role=' + role + ') before execution.'
          : 'Load get_agent_harness(role=' + role + ') and execute its loop with minimum sufficient context.'),
        external_steps: [
          'Re-read current PROJECT.md and require lifecycle=ACTIVE before this consequential dispatch.',
          'The supplied owning Job snapshot has passed identity/lifecycle and UX_FIRST temporary-UI Human-Gate validation. Re-fetch it before persistence and require the same planning revision/state is still current.',
          ...(executionContract === 'NEXT'
            ? [
                'Immediately re-fetch the owning Job before Run persistence and require blob SHA=' + String(job_record_sha) + ' plus planning_revision=' + String(planning_revision) + '. A mismatch rejects dispatch as stale.',
                ...durableSnapshotReadbackSteps(completed_task_run_snapshots ?? [], 'completed prerequisite Task Run snapshot'),
                ...durableSnapshotReadbackSteps(checkpoint_claim_snapshots ?? [], 'checkpoint claim snapshot'),
                ...durableSnapshotReadbackSteps(checkpoint_verification_snapshots ?? [], 'checkpoint Verification snapshot'),
              ]
            : []),
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'GitHub Memory Repo: create_file at memory_path with run_record_text before role execution begins.',
          'For coder source writes, re-read Project lifecycle and live target revision immediately before the first write.',
          ...(role === 'coder' ? [
            'M5: independently read existing Criteria, reviewed Plan, Milestones and Coder/Tester readiness, as well as actual Human execution approval and configured Development Branch. Legacy proof readback applies only to legacy evidence; caller-supplied claims are not sufficient.',
            'Use authorize_project_scope(MUTATE_SOURCE) with the same evidence and target branch immediately before source write; do not bypass this via an alternate GSA-owned write route.',
          ] : []),
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'relationship_knowledge_prepare',
    {
      title: 'Prepare durable Project relationship knowledge',
      description: 'Prepare an existing KNOWLEDGE/ ARCHITECTURE_NOTE artifact for repo/subsystem relationship direction and reread conditions. This does not create a new record family.',
      inputSchema: {
        project_id: z.string().uuid(),
        title: z.string().min(1),
        source: z.string().min(1),
        target: z.string().min(1),
        relationship: z.string().min(1),
        precedence: z.string().min(1),
        reason: z.string().min(1),
        evidence: z.array(z.string()).default([]),
        reread_condition: z.string().min(1),
        depends_on: z.array(z.string()).default([]),
        approved_by_or_source: z.string().min(1),
      },
      outputSchema: {
        knowledge_id: z.string(),
        memory_path: z.string(),
        knowledge_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, title, source, target, relationship, precedence, reason, evidence, reread_condition, depends_on, approved_by_or_source }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare relationship knowledge.')
      const knowledgeId = uuidv7()
      const now = new Date().toISOString()
      const body = [
        '---',
        'knowledge_id: ' + knowledgeId,
        'project_id: ' + project_id,
        'kind: ARCHITECTURE_NOTE',
        'title: ' + JSON.stringify(title),
        'revision: 1',
        'validity: CURRENT',
        'depends_on: ' + JSON.stringify(depends_on ?? []),
        'approved_by_or_source: ' + JSON.stringify(approved_by_or_source),
        'updated_at: ' + now,
        '---',
        '',
        '# ' + title,
        '',
        '## Relationship',
        '- source: ' + source,
        '- target: ' + target,
        '- relationship: ' + relationship,
        '- precedence: ' + precedence,
        '',
        '## Reason',
        reason,
        '',
        '## Evidence',
        ...((evidence ?? []).length ? (evidence ?? []).map((x: string) => '- ' + x) : ['- none recorded']),
        '',
        '## Reread condition',
        reread_condition,
        '',
      ].join('\n')
      const path = knowledgePath(project_id, knowledgeId, title)
      const out = {
        knowledge_id: knowledgeId,
        memory_path: path,
        knowledge_record_text: body,
        external_steps: [
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist knowledge_record_text at memory_path in the configured Memory Repo.',
          'Read back the Knowledge artifact before treating the relationship as durable Project memory.',
          'When the reread condition becomes true, re-read the current source-of-truth side before downstream planning or implementation.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'goal_recheck_record',
    {
      title: 'Prepare Coder Goal Recheck evidence',
      description: 'Build append-preserving GOAL_RECHECK Verification from the Coder loop. Pass the exact current owning Run record plus its current Git blob SHA; execution_contract and the Verification namespace are derived from that Run, and persistence is gated on exact Run read-back. Does not independently prove success.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        run_record_text: z.string().min(2),
        run_record_sha: z.string().min(7),
        job_record_text: z.string().min(2).optional(),
        job_record_sha: z.string().min(7).optional(),
        task_id: z.string().min(1).optional(),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        criteria: z.array(z.object({
          task_id: z.string().min(1).optional(),
          criterion: z.string().min(1),
          result: z.enum(['MET','PARTIAL','NOT_MET','UNVERIFIED']),
          evidence: z.array(z.string()).default([]),
          limitation: z.string().optional(),
        })).min(1),
        scope_drift: z.array(z.string()).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        memory_path: z.string(),
        owning_run_memory_path: z.string(),
        expected_run_sha: z.string(),
        owning_job_memory_path: z.string().nullable(),
        expected_job_sha: z.string().nullable(),
        verification_record_text: z.string(),
        ready_for_success_handoff: z.boolean(),
        blocking_reasons: z.array(z.string()),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, job_id, run_id, run_record_text, run_record_sha, job_record_text, job_record_sha, task_id, target_ref, target_revision, criteria, scope_drift, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to persist Goal Recheck.')
      let owningRun: any
      try { owningRun = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid owning Run JSON.' }], isError: true }
      }
      if (!goalRecheckRunMatches(owningRun, project_id, job_id, run_id)) {
        return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: owning Run identity/role/lifecycle mismatch.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(owningRun.execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(owningRun)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: owning NEXT Run memory_namespace is invalid.' }], isError: true }
      }
      if (executionContract === 'NEXT' && (!owningRun.target_revision || owningRun.target_revision !== target_revision || owningRun.target_ref !== target_ref)) {
        return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: NEXT Goal Recheck must bind the exact Run target ref/revision.' }], isError: true }
      }
      let owningJob: any = null
      if (executionContract === 'NEXT') {
        if (!job_record_text || !job_record_sha) {
          return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: NEXT Goal Recheck requires the exact current Job snapshot and blob SHA.' }], isError: true }
        }
        try { owningJob = JSON.parse(job_record_text) } catch {
          return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: invalid owning Job JSON.' }], isError: true }
        }
        if (recordNextMemoryNamespace(owningJob) !== nextMemoryNamespace) {
          return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: owning Job/Run NEXT memory_namespace mismatch.' }], isError: true }
        }
        const coverageError = goalRecheckCoverageError(owningJob, owningRun, criteria ?? [])
        if (coverageError) return { content: [{ type: 'text', text: coverageError }], isError: true }
      }
      const verificationId = uuidv7()
      const blocking = criteria
        .filter((c: any) => c.result === 'NOT_MET')
        .map((c: any) => 'NOT_MET: ' + c.criterion)
      if ((scope_drift ?? []).length) blocking.push('Unresolved scope drift: ' + scope_drift.join('; '))
      const record = {
        verification_id: verificationId,
        kind: 'GOAL_RECHECK',
        project_id,
        job_id,
        task_id: task_id ?? null,
        run_id,
        target_ref,
        target_revision,
        producer: 'coder',
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { planning_revision: owningRun.planning_revision, memory_namespace: nextMemoryNamespace } : {}),
        result: blocking.length ? 'CHANGES_REQUIRED' : (criteria.some((c: any) => c.result === 'PARTIAL' || c.result === 'UNVERIFIED') ? 'PASS_RETEST_REQUIRED' : 'PASS'),
        limitations: limitations ?? [],
        evidence_refs: criteria.flatMap((c: any) => c.evidence ?? []),
        criteria,
        scope_drift: scope_drift ?? [],
        created_at: new Date().toISOString(),
      }
      const path = verificationPath(project_id, verificationId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const owningRunPath = recordPath(project_id, 'RUNS', run_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const owningJobPath = executionContract === 'NEXT' ? recordPath(project_id, 'JOBS', job_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) : null
      const result = {
        verification_id: verificationId,
        memory_path: path,
        owning_run_memory_path: owningRunPath,
        expected_run_sha: run_record_sha,
        owning_job_memory_path: owningJobPath,
        expected_job_sha: executionContract === 'NEXT' ? job_record_sha : null,
        verification_record_text: prettyJson(record),
        ready_for_success_handoff: blocking.length === 0,
        blocking_reasons: blocking,
        external_steps: [
          'Fetch the current owning Run at owning_run_memory_path immediately before Verification persistence.',
          'Require the fetched Run blob SHA to equal expected_run_sha exactly. Missing path or stale SHA blocks Goal Recheck persistence.',
          'Re-parse the fetched Run and require project_id/job_id/run_id, role=coder, lifecycle=IN_PROGRESS and resolved execution_contract to still match the supplied owning Run snapshot.',
          ...(executionContract === 'NEXT'
            ? [
                'Fetch the current owning Job at owning_job_memory_path immediately before Verification persistence.',
                'Require the fetched Job blob SHA to equal expected_job_sha exactly and planning_revision to remain ' + String(owningRun.planning_revision) + '.',
              ]
            : []),
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist this Verification record only after the owning Run read-back guard passes.',
          blocking.length ? 'Continue the Coder loop; do not claim success while blocking_reasons remain.' : 'If topology permits, proceed to required review/test/handoff or terminal Run completion.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'run_verification_record',
    {
      title: 'Prepare exact Reviewer/Tester Run Verification',
      description: 'Create an append-preserving REVIEW or TEST Verification bound to the exact current Reviewer/Tester Run and target revision. NEXT success closure must consume this durable record.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        run_record_text: z.string().min(2),
        run_record_sha: z.string().min(7),
        result: z.enum(['PASS','PASS_RETEST_REQUIRED','CHANGES_REQUIRED','BLOCKED','HUMAN_REVIEW_REQUIRED','FAIL','OBSERVED','UNVERIFIED']),
        findings: z.array(z.object({
          severity: z.enum(['CRITICAL','IMPORTANT','MINOR']),
          finding: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          required_change: z.string().optional(),
        })).default([]),
        coverage_summary: z.string().optional(),
        failure_class: z.enum(['PRODUCT_FAILURE','TEST_FAILURE','ENVIRONMENT_FAILURE','NOT_READY','INTEGRATION_NOT_READY','SPEC_GAP','PLAN_GAP']).optional(),
        evidence_refs: z.array(z.string()).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        memory_path: z.string(),
        owning_run_memory_path: z.string(),
        expected_run_sha: z.string(),
        verification_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, job_id, run_id, run_record_text, run_record_sha, result, findings, coverage_summary, failure_class, evidence_refs, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare Run Verification.')
      let run: any
      try { run = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: invalid Run JSON.' }], isError: true }
      }
      if (
        run.project_id !== project_id ||
        run.job_id !== job_id ||
        run.run_id !== run_id ||
        run.lifecycle !== 'IN_PROGRESS' ||
        !['reviewer','tester'].includes(run.role)
      ) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: Verification must bind the exact current IN_PROGRESS Reviewer/Tester Run.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(run.execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(run)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: NEXT Run memory_namespace is invalid.' }], isError: true }
      }
      if (executionContract === 'NEXT' && (!run.target_ref || !run.target_revision || !Number.isInteger(Number(run.planning_revision)))) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: NEXT Verification requires exact target ref/revision and current planning revision.' }], isError: true }
      }

      const reviewerResults = new Set(['PASS','PASS_RETEST_REQUIRED','CHANGES_REQUIRED','BLOCKED','HUMAN_REVIEW_REQUIRED'])
      const testerResults = new Set(['PASS','PASS_RETEST_REQUIRED','FAIL','BLOCKED','OBSERVED','UNVERIFIED'])
      const allowed = run.role === 'reviewer' ? reviewerResults.has(result) : testerResults.has(result)
      if (!allowed) return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: result is not valid for role=' + run.role + '.' }], isError: true }

      const successLike = ['PASS','PASS_RETEST_REQUIRED','OBSERVED'].includes(result)
      if (successLike && !(evidence_refs ?? []).length) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: successful/observed Verification requires evidence_refs.' }], isError: true }
      }
      if (run.role === 'reviewer' && ['PASS','PASS_RETEST_REQUIRED'].includes(result) && (findings ?? []).some((item: any) => ['CRITICAL','IMPORTANT'].includes(item.severity))) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: Reviewer success cannot contain unresolved CRITICAL/IMPORTANT findings.' }], isError: true }
      }
      if (run.role === 'tester') {
        const needsFailureClass = ['FAIL','BLOCKED','UNVERIFIED'].includes(result)
        if (needsFailureClass && !failure_class) {
          return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: non-success Tester result requires failure_class.' }], isError: true }
        }
        if (successLike && failure_class) {
          return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: successful/observed Tester Verification cannot carry failure_class.' }], isError: true }
        }
      }

      const verificationId = uuidv7()
      const record = {
        verification_id: verificationId,
        kind: run.role === 'reviewer' ? 'REVIEW' : 'TEST',
        project_id,
        job_id,
        task_id: run.primary_task_id ?? null,
        ...(run.role === 'reviewer' && run.milestone_id ? { milestone_id: run.milestone_id } : {}),
        run_id,
        target_ref: run.target_ref ?? null,
        target_revision: run.target_revision ?? null,
        producer: run.role,
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { planning_revision: run.planning_revision, memory_namespace: nextMemoryNamespace } : {}),
        result,
        ...(run.role === 'reviewer' ? { findings: findings ?? [], coverage_summary: coverage_summary ?? null } : {}),
        ...(run.role === 'tester' ? { failure_class: failure_class ?? null } : {}),
        limitations: limitations ?? [],
        evidence_refs: evidence_refs ?? [],
        created_at: new Date().toISOString(),
      }
      const memoryPath = verificationPath(project_id, verificationId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const runPath = recordPath(project_id, 'RUNS', run_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const out = {
        verification_id: verificationId,
        memory_path: memoryPath,
        owning_run_memory_path: runPath,
        expected_run_sha: run_record_sha,
        verification_record_text: prettyJson(record),
        external_steps: [
          'Fetch the current owning Run immediately before Verification persistence and require blob SHA=' + run_record_sha + '.',
          'Require the read-back Run identity/role/lifecycle/target/planning revision to remain byte-consistent with this Verification.',
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist verification_record_text append-only and read it back before Run completion.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'run_complete',
    {
      title: 'Complete a GSA Job Run',
      description: 'Prepare optional immutable Handoff plus terminal Run replacement. Persist referenced evidence/handoff first; update the Run last using exact blob SHA.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        role: z.enum(['planner','designer','coder','reviewer','tester']),
        run_record_text: z.string().min(2),
        run_record_sha: z.string().min(7),
        lifecycle: z.enum(['COMPLETED','FAILED','CANCELLED','SUPERSEDED']),
        result: z.string().optional(),
        output_refs: z.array(z.string()).default([]),
        verification_refs: z.array(z.string()).default([]),
        goal_recheck_record_text: z.string().min(2).optional(),
        goal_recheck_verification_ref: z.string().min(1).optional(),
        goal_recheck_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        job_record_text: z.string().min(2).optional(),
        job_record_sha: z.string().min(7).optional(),
        run_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        handoff: z.object({
          next_role: z.enum(['planner','designer','coder','reviewer','tester']),
          primary_task_id: z.string().min(1).optional(),
          target_ref: z.string().optional(),
          target_revision: z.string().optional(),
          completed_summary: z.string().min(1),
          remaining: z.array(z.string()).default([]),
          required_inputs: z.array(z.string()).default([]),
          tester_evidence_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
          tester_evidence_claim_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
          blocker_or_gate: z.string().optional(),
          expected_next_outcome: z.string().min(1),
        }).optional(),
      },
      outputSchema: {
        run_memory_path: z.string(),
        expected_run_sha: z.string(),
        terminal_run_record_text: z.string(),
        handoff_id: z.string().nullable(),
        handoff_memory_path: z.string().nullable(),
        handoff_record_text: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, run_id, role, run_record_text, run_record_sha, lifecycle, result, output_refs, verification_refs, goal_recheck_record_text, goal_recheck_verification_ref, goal_recheck_snapshot, job_record_text, job_record_sha, run_verification_snapshot, handoff }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to complete a Run.')
      let current: any
      try { current = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Run JSON.' }], isError: true }
      }
      if (current.run_id !== run_id || current.project_id !== project_id || current.job_id !== job_id || current.role !== role || current.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'Run identity/lifecycle mismatch.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(current.execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(current)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'RUN_COMPLETION_BLOCKED: NEXT Run memory_namespace is invalid.' }], isError: true }
      }
      if (role === 'coder' && lifecycle === 'COMPLETED') {
        let goal: any = null
        let goalRef: string | null = null
        if (executionContract === 'NEXT') {
          const parsedGoal = parseDurableSnapshots(goal_recheck_snapshot ? [goal_recheck_snapshot] : [], 'goal_recheck_snapshot')
          if (parsedGoal.error || parsedGoal.entries.length !== 1) {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: NEXT completion requires one exact durable GOAL_RECHECK snapshot.' }], isError: true }
          }
          const entry = parsedGoal.entries[0]
          goal = entry.record
          goalRef = entry.path
          if (!job_record_text || !job_record_sha) {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: NEXT completion requires the exact current Job snapshot and blob SHA.' }], isError: true }
          }
          let owningJob: any
          try { owningJob = JSON.parse(job_record_text) } catch {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: invalid owning Job JSON.' }], isError: true }
          }
          if (
            owningJob.project_id !== project_id ||
            owningJob.job_id !== job_id ||
            owningJob.planning_revision !== current.planning_revision ||
            jobExecutionContract(owningJob) !== 'NEXT' ||
            recordNextMemoryNamespace(owningJob) !== nextMemoryNamespace
          ) {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: owning Job does not match the Run current NEXT planning revision.' }], isError: true }
          }
          const expectedGoalPath = typeof goal?.verification_id === 'string' ? verificationPath(project_id, goal.verification_id, 'NEXT', nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) : ''
          const coverageError = goalRecheckCoverageError(owningJob, current, goal?.criteria ?? [])
          if (entry.path !== expectedGoalPath || coverageError) {
            return { content: [{ type: 'text', text: coverageError ?? 'CODER_COMPLETION_BLOCKED: GOAL_RECHECK snapshot path mismatch.' }], isError: true }
          }
        } else {
          if (!goal_recheck_record_text || !goal_recheck_verification_ref) {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: exact GOAL_RECHECK record and its persisted verification ref are required for successful completion.' }], isError: true }
          }
          try { goal = JSON.parse(goal_recheck_record_text) } catch {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: invalid GOAL_RECHECK JSON.' }], isError: true }
          }
          goalRef = goal_recheck_verification_ref
        }

        if (!goalRef || !(verification_refs ?? []).includes(goalRef)) {
          return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: GOAL_RECHECK verification ref must be included in verification_refs.' }], isError: true }
        }
        const revisionMatches = !current.target_revision || !goal.target_revision || current.target_revision === goal.target_revision
        const goalExecutionContract = resolveExecutionContract(goal.execution_contract)
        const expectedGoalPath = typeof goal.verification_id === 'string' ? verificationPath(project_id, goal.verification_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) : ''
        const persistedRefMatches = expectedGoalPath === goalRef
        const planningRevisionMatches = executionContract !== 'NEXT' || goal.planning_revision === current.planning_revision
        const namespaceMatches = executionContract !== 'NEXT' || recordNextMemoryNamespace(goal) === nextMemoryNamespace
        const goalMatches = goal.kind === 'GOAL_RECHECK' && goal.project_id === project_id && goal.job_id === job_id && goal.run_id === run_id && goalExecutionContract === executionContract && namespaceMatches && revisionMatches && persistedRefMatches && planningRevisionMatches
        const unresolvedNotMet = (goal.criteria ?? []).some((x: any) => x.result === 'NOT_MET')
        const unresolvedDrift = (goal.scope_drift ?? []).length > 0
        const acceptableResult = ['PASS','PASS_RETEST_REQUIRED'].includes(goal.result)
        if (!goalMatches || unresolvedNotMet || unresolvedDrift || !acceptableResult) {
          return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: Goal Recheck must match this Run/current planning revision/target, have exact criterion coverage, no NOT_MET/unresolved scope drift, and result PASS or PASS_RETEST_REQUIRED.' }], isError: true }
        }
      }
      if (
        executionContract === 'NEXT' &&
        ['reviewer','tester'].includes(role) &&
        lifecycle === 'COMPLETED' &&
        ['PASS','PASS_RETEST_REQUIRED'].includes(result ?? '')
      ) {
        const verified = validateRunVerificationSnapshot(run_verification_snapshot, current, role as 'reviewer' | 'tester', result ?? null)
        if (verified.error) {
          return { content: [{ type: 'text', text: 'RUN_COMPLETION_BLOCKED: ' + verified.error }], isError: true }
        }
        if (!(verification_refs ?? []).includes(verified.ref)) {
          return { content: [{ type: 'text', text: 'RUN_COMPLETION_BLOCKED: exact REVIEW/TEST Verification ref must be included in verification_refs.' }], isError: true }
        }
      }
      let handoffEvidenceBundles: any[] = []
      let handoffEvidenceAttestationRefs: any[] = []
      let handoffEvidenceVerificationRef: any = null
      let handoffEvidenceClaimRef: any = null
      const hasEvidenceVerification = Boolean(handoff?.tester_evidence_verification_snapshot)
      const hasEvidenceClaim = Boolean(handoff?.tester_evidence_claim_snapshot)
      if (hasEvidenceVerification !== hasEvidenceClaim) {
        return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: Tester evidence Handoff requires both the exact TEST/RETEST Verification snapshot and its current terminal checkpoint claim snapshot.' }], isError: true }
      }
      if (hasEvidenceVerification && hasEvidenceClaim) {
        if (
          executionContract !== 'NEXT' ||
          role !== 'tester' ||
          !current.target_revision ||
          !current.target_ref ||
          !Number.isInteger(Number(current.planning_revision))
        ) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: durable EvidenceBundle handoff requires the exact target-bound current-planning NEXT Tester Run.' }], isError: true }
        }
        const targetRef = handoff.target_ref ?? current.target_ref
        const targetRevision = handoff.target_revision ?? current.target_revision
        const verified = validateTesterEvidenceVerificationSnapshot(
          handoff.tester_evidence_verification_snapshot,
          {
            project_id,
            job_id,
            run_id,
            target_ref: targetRef,
            target_revision: targetRevision,
          },
        )
        if (verified.error) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: ' + verified.error }], isError: true }
        }
        if (recordNextMemoryNamespace(verified.record) !== nextMemoryNamespace) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: Tester evidence Verification memory_namespace mismatch.' }], isError: true }
        }
        const claimed = validateTesterEvidenceClaimSnapshot(
          handoff.tester_evidence_claim_snapshot,
          verified.record,
          {
            project_id,
            job_id,
            run_id,
            target_ref: targetRef,
            target_revision: targetRevision,
            planning_revision: Number(current.planning_revision),
          },
        )
        if (claimed.error) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: ' + claimed.error }], isError: true }
        }
        if (recordNextMemoryNamespace(claimed.record) !== nextMemoryNamespace) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: terminal checkpoint claim memory_namespace mismatch.' }], isError: true }
        }
        if (!(verification_refs ?? []).includes(verified.ref)) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: the exact applicable TEST/RETEST Verification ref must also be included in verification_refs.' }], isError: true }
        }
        handoffEvidenceBundles = verified.record.evidence_bundle_refs
        handoffEvidenceAttestationRefs = verified.record.evidence_bundle_attestation_refs
        handoffEvidenceVerificationRef = { path: verified.ref, sha: verified.sha }
        handoffEvidenceClaimRef = { path: claimed.ref, sha: claimed.sha }
      }
      const runPath = recordPath(project_id, 'RUNS', run_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      let handoffId: string | null = null
      let handoffPath: string | null = null
      let handoffText: string | null = null
      if (handoff) {
        handoffId = uuidv7()
        handoffPath = recordPath(project_id, 'HANDOFFS', handoffId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
        handoffText = prettyJson({
          handoff_id: handoffId,
          project_id,
          job_id,
          execution_contract: executionContract,
          ...(executionContract === 'NEXT' ? { memory_namespace: nextMemoryNamespace } : {}),
          source_run_id: run_id,
          next_role: handoff.next_role,
          primary_task_id: handoff.primary_task_id ?? null,
          target_ref: handoff.target_ref ?? current.target_ref ?? null,
          target_revision: handoff.target_revision ?? current.target_revision ?? null,
          completed_summary: handoff.completed_summary,
          remaining: handoff.remaining ?? [],
          required_inputs: handoff.required_inputs ?? [],
          evidence_bundle_refs: handoffEvidenceBundles,
          evidence_bundle_attestation_refs: handoffEvidenceAttestationRefs,
          evidence_verification_ref: handoffEvidenceVerificationRef,
          evidence_claim_ref: handoffEvidenceClaimRef,
          blocker_or_gate: handoff.blocker_or_gate ?? null,
          expected_next_outcome: handoff.expected_next_outcome,
          created_at: new Date().toISOString(),
        })
      }
      const terminal = {
        ...current,
        lifecycle,
        result: result ?? null,
        output_refs: output_refs ?? [],
        verification_refs: verification_refs ?? [],
        handoff_ref: handoffId,
        ended_at: new Date().toISOString(),
      }
      const externalSteps = [
        'Verify every output_ref and verification_ref already exists in durable storage before terminal Run update.',
        ...durableSnapshotReadbackSteps(goal_recheck_snapshot ? [goal_recheck_snapshot] : [], 'Goal Recheck Verification snapshot'),
        ...durableSnapshotReadbackSteps(run_verification_snapshot ? [run_verification_snapshot] : [], 'Reviewer/Tester Run Verification snapshot'),
        ...durableSnapshotReadbackSteps(
          handoff?.tester_evidence_verification_snapshot ? [handoff.tester_evidence_verification_snapshot] : [],
          'Tester evidence Verification snapshot',
        ),
        ...durableSnapshotReadbackSteps(
          handoff?.tester_evidence_claim_snapshot ? [handoff.tester_evidence_claim_snapshot] : [],
          'terminal checkpoint claim snapshot',
        ),
      ]
      if (handoffPath) {
        externalSteps.push(
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=' + handoffPath + ') and persist handoff_record_text first.',
        )
      }
      externalSteps.push(
        'Fetch the current Run file immediately before update and require its blob SHA equals expected_run_sha.',
        'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=run_memory_path).',
        'GitHub Memory Repo: update the Run file with terminal_run_record_text using expected_run_sha exactly. On stale SHA, refetch/reconcile; never force overwrite.',
        'Read back terminal Run and any Handoff. Only then report the Run complete.',
      )
      const out = {
        run_memory_path: runPath,
        expected_run_sha: run_record_sha,
        terminal_run_record_text: prettyJson(terminal),
        handoff_id: handoffId,
        handoff_memory_path: handoffPath,
        handoff_record_text: handoffText,
        external_steps: externalSteps,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
