// GSA1: Execution Cursor, recovery and orchestration progress tools.
export function registerExecutionCursorTools(deps: any) {
 const { server, z, req, AUTH_SCOPES, authContext, authError, executionCursorPath, orchestrationProgressDecision, prepareExecutionCursorDecision, resumeExecutionCursorDecision, sourceMutationRecoveryDecision } = deps
  server.registerTool(
    'execution_cursor_prepare',
    {
      title: 'Prepare a lightweight durable NEXT Job checkpoint cursor',
      description: 'Prepare one CREATE/UPDATE of a Job-owned GitHub Memory Repo cursor only at significant checkpoints or before consequential source mutation. No storage write occurs in MCP; caller must use exact GitHub CAS and readback.',
      inputSchema: {
        project_id: z.string().uuid(), job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        memory_namespace: z.enum(['PRODUCTION','TEST_LAB']),
        work_branch: z.string().min(1),
        observed_head_sha: z.string().regex(/^[0-9a-f]{40}$/),
        event: z.enum(['INITIALIZE','BEGIN_MUTATION','COMPLETE_MUTATION','RECORD_RETRY','SAVE_CHECKPOINT','RECORD_PAUSE']),
        checkpoint_id: z.string().optional(),
        operation_id: z.string().optional(), mutation_kind: z.enum(['FILE','TREE']).optional(),
        target_path: z.string().optional(),
        previous_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable().optional(),
        intended_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        observed_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        previous_tree_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        intended_tree_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        observed_tree_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        observed_parent_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        stalled_cycles: z.number().int().min(0).optional(),
        cursor_record_text: z.string().optional(),
        cursor_record_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
      },
      outputSchema: {
        allowed: z.boolean(), reason: z.string(),
        cursor_memory_path: z.string(), operation: z.enum(['CREATE','UPDATE','NONE']),
        expected_cursor_sha: z.string().nullable(),
        cursor_record_text: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Job cursor preparation.')
      const decision = prepareExecutionCursorDecision(input)
      const path = executionCursorPath(input.project_id, input.job_id, input.memory_namespace)
      const result = {
        allowed: decision.allowed, reason: decision.reason,
        cursor_memory_path: path,
        operation: decision.operation,
        expected_cursor_sha: decision.allowed ? (input.cursor_record_sha ?? null) : null,
        cursor_record_text: decision.allowed ? JSON.stringify(decision.record, null, 2) + '\n' : null,
        external_steps: decision.allowed
          ? [
            'Authorize the exact current PROJECT.md and target Memory Repo path.',
            'Use GitHub CREATE when expected_cursor_sha=null, else UPDATE with exact current cursor blob SHA.',
            'Read back exact cursor path, bytes and blob SHA before acting on the prepared result.',
            'For BEGIN_MUTATION, persist intent before an atomic FILE or multi-file TREE commit. For COMPLETE_MUTATION, independently verify Git HEAD, parent and intended blob/tree, then persist the checkpoint.',
            'For RECORD_RETRY, only after a fresh NOT_APPLIED snapshot; persist the retry counter with exact SHA before retrying. Maximum 2 retries.',
          ] : [],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'execution_cursor_resume_evaluate',
    {
      title: 'Recover a NEXT Job from one durable cursor snapshot',
      description: 'Read-only fresh-session cursor validation and lost-response recovery; no additional Job lifecycle, no write authorization, and no background worker.',
      inputSchema: {
        project_id: z.string().uuid(), job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        work_branch: z.string().min(1),
        cursor_memory_path: z.string().min(1),
        cursor_record_text: z.string().min(2),
        cursor_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_head_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable().optional(),
        current_tree_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
      },
      outputSchema: {
        disposition: z.string(), reason: z.string(), source_write_authorized: z.boolean(),
        next_action: z.string().optional(), operation_id: z.string().optional(),
        last_completed_checkpoint: z.string().optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Job cursor recovery.')
      const decision = resumeExecutionCursorDecision(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'execution_recovery_evaluate',
    {
      title: 'Evaluate a lost-response source mutation from authoritative Git readback',
      description: 'Read-only advisory for ChatGPT orchestration. Compare one pending source write with independently reread Git head/blob SHAs. Does not write, authorize a retry, or infer background progress.',
      inputSchema: {
        operation_id: z.string().min(1),
        expected_head_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_head_sha: z.string().regex(/^[0-9a-f]{40}$/),
        previous_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable(),
        intended_blob_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable(),
      },
      outputSchema: {
        disposition: z.string(), next_action: z.string(), reason: z.string(), mutation_authorized: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for recovery evaluation.')
      const decision = sourceMutationRecoveryDecision(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'orchestration_progress_evaluate',
    {
      title: 'Bound same-turn orchestration progress',
      description: 'Read-only bounded-livelock evaluator. Caller supplies a fingerprint grounded in current durable Git/Job/Run evidence. No scheduler, Job lifecycle writes or autonomous continuation.',
      inputSchema: {
        job_lifecycle: z.enum(['DRAFT','READY','IN_PROGRESS','COMPLETED','CANCELLED','SUPERSEDED']),
        run_lifecycle: z.enum(['IN_PROGRESS','COMPLETED','FAILED','CANCELLED','SUPERSEDED']).nullable(),
        previous_fingerprint: z.string().nullable(),
        current_fingerprint: z.string().min(1),
        stalled_cycles: z.number().int().min(0),
        mutation_retry_count: z.number().int().min(0),
      },
      outputSchema: { disposition: z.string(), stalled_cycles: z.number(), reason: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for progress evaluation.')
      const decision = orchestrationProgressDecision(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

}
