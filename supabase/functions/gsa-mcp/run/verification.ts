// GSA4 A0-R: run_verification_record registration extracted from run-execution-tools.ts.
export function registerRunVerification(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, DEFAULT_NEXT_MEMORY_NAMESPACE, invalidExecutionContract, recordNextMemoryNamespace, uuidv7, recordPath, prettyJson, resolveExecutionContract, verificationPath } = deps
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
}
