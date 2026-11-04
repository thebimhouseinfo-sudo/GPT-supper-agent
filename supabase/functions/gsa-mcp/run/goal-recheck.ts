// GSA4 A0-R: goal_recheck_record registration extracted from run-execution-tools.ts.
export function registerGoalRecheck(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, DEFAULT_NEXT_MEMORY_NAMESPACE, invalidExecutionContract, recordNextMemoryNamespace, uuidv7, recordPath, prettyJson, goalRecheckRunMatches, resolveExecutionContract, goalRecheckCoverageError, verificationPath } = deps
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
}
