// GSA4 A0-R: run_begin registration extracted from run-execution-tools.ts.
export function registerRunBegin(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, DURABLE_RECORD_SNAPSHOT_SCHEMA, DEFAULT_NEXT_MEMORY_NAMESPACE, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, projectBootstrapExecutionError, parseDurableSnapshots, resolveRequiredTaskSkills, nextDispatchPreflightError, evaluateNextEvidenceGate, normalizeGithubRepo, uxFirstTemporaryUiGateRequired, uuidv7, runHandle, recordPath, prettyJson, durableSnapshotReadbackSteps } = deps
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
        source_branch: z.string().optional(),
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
    async ({ project_id, job_id, job_record_text, job_record_sha, current_job_record_sha, planning_revision, role, scope_claim, primary_task_id, affected_task_refs, parent_run_id, target_ref, target_revision, source_branch, input_refs, checkpoint_claim_snapshots, checkpoint_verification_snapshots, completed_task_run_snapshots, project_manifest_text, bootstrap_evidence }: any) => {
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
          source_branch ?? owningJob.repository_context?.integration_branch ?? null,
          primary_task_id ? { job_id, task_id: primary_task_id } : null)
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
        // A legacy or forged reviewed Job must not dispatch a non-Coder Convergence Task,
        // including one carried through affected_task_refs rather than the primary Task.
        for (const taskId of dispatchTaskIds) {
          const task = (owningJob.tasks ?? []).find((item: any) => item.task_id === taskId)
          const stage = (owningJob.topology ?? []).find((item: any) => item.task_id === taskId)
          if (task?.convergence_task === true && (role !== 'coder' || stage?.handler !== 'coder')) {
            return { content: [{ type: 'text', text: 'CONVERGENCE_HANDLER_INVALID: Convergence Task must be Coder-owned.' }], isError: true }
          }
        }
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
        ...(source_branch ? { source_branch } : {}),
        ...(owningJob.tasks?.some((t: any) => t.task_id === primary_task_id && t.convergence_task === true) ? {
          convergence_task: true,
          incoming_branches: owningJob.tasks?.find((t: any) => t.task_id === primary_task_id)?.incoming_branches ?? [],
        } : {}),
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
          'For coder source writes, re-read Project lifecycle, registered Working Branch ownership (when applicable) and live source branch HEAD immediately before the first write.',
          ...(role === 'coder' ? [
            'Independently read the current Job Plan, planning-review evidence and actual Human execution approval for this Job before code. Bootstrap checklist status is not execution authorization; caller-supplied claims are not sufficient.',
            'Use authorize_project_scope(MUTATE_SOURCE) to check current Project-owned repository and development branch before source write; do not infer Human execution approval from scope ALLOW.',
          ] : []),
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )
}
