// GSA4 A0: Source-preserving checkpoint registration extraction.
export function registerCheckpointClaimTool(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, DURABLE_RECORD_SNAPSHOT_SCHEMA, checkpointLeaseExpired, checkpointBoundaryPrerequisiteIds, prettyJson, uuidv7, verificationPath, jobExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, durableSnapshotReadbackSteps, evaluateNextEvidenceGate, resolveExecutionContract, validateClaimSnapshots, validateVerificationSnapshots, validateCompletedTaskRunSnapshots, checkpointClaimPath, checkpointVerificationApplicable, checkpointAttemptPath, productFailureRetestValidationError, normalizeGithubRepo, validateEvidenceBundleAttestationSnapshot, checkpointVerificationOutcome } = deps
  server.registerTool(
    'checkpoint_claim_prepare',
    {
      title: 'Prepare NEXT Tester checkpoint claim',
      description: 'NEXT-only deterministic checkpoint claim/lease preparation. The claim path is keyed by project/job/planning_revision/checkpoint_id and is the sole serialization point for the live lease token.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1),
        claimant_run_id: z.string().uuid(),
        claimant_run_record_text: z.string().min(2),
        claimant_run_record_sha: z.string().min(7),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        attempt_kind: z.enum(['TEST','RETEST']).default('TEST'),
        retest_of_verification_id: z.string().min(1).optional(),
        repair_goal_recheck_record_text: z.string().min(2).optional(),
        repair_goal_recheck_verification_ref: z.string().min(1).optional(),
        completed_task_run_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        prerequisite_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        prerequisite_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        lease_seconds: z.number().int().min(60).max(3600).default(900),
        current_claim_record_text: z.string().min(2).optional(),
        current_claim_record_sha: z.string().min(7).optional(),
      },
      outputSchema: {
        disposition: z.enum(['CLAIM','REUSE','ALREADY_SATISFIED']),
        claim_memory_path: z.string(),
        claim_operation: z.enum(['CREATE','UPDATE','NONE']),
        expected_claim_sha: z.string().nullable(),
        claim_record_text: z.string().nullable(),
        attempt_memory_path: z.string().nullable(),
        attempt_record_text: z.string().nullable(),
        attempt_id: z.string().nullable(),
        lease_token: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, checkpoint_id, claimant_run_id, claimant_run_record_text, claimant_run_record_sha, target_ref, target_revision, attempt_kind, retest_of_verification_id, repair_goal_recheck_record_text, repair_goal_recheck_verification_ref, completed_task_run_snapshots, prerequisite_claim_snapshots, prerequisite_verification_snapshots, lease_seconds, current_claim_record_text, current_claim_record_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to claim a NEXT checkpoint.')
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      if (job.project_id !== project_id || job.job_id !== job_id || jobExecutionContract(job) !== 'NEXT') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: owning Job must be the current NEXT Job.' }], isError: true }
      }
      const nextMemoryNamespace = recordNextMemoryNamespace(job)
      if (!nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: owning NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      let claimantRun: any
      try { claimantRun = JSON.parse(claimant_run_record_text) } catch {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: invalid claimant Tester Run JSON.' }], isError: true }
      }
      const claimantContract = resolveExecutionContract(claimantRun.execution_contract)
      if (
        claimantContract !== 'NEXT' ||
        claimantRun.project_id !== project_id ||
        claimantRun.job_id !== job_id ||
        claimantRun.run_id !== claimant_run_id ||
        claimantRun.role !== 'tester' ||
        claimantRun.lifecycle !== 'IN_PROGRESS' ||
        claimantRun.planning_revision !== job.planning_revision ||
        recordNextMemoryNamespace(claimantRun) !== nextMemoryNamespace ||
        (claimantRun.target_ref && claimantRun.target_ref !== target_ref) ||
        (claimantRun.target_revision && claimantRun.target_revision !== target_revision)
      ) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: claimant must be the current IN_PROGRESS NEXT Tester Run for this exact target.' }], isError: true }
      }
      if (!['READY','IN_PROGRESS'].includes(job.lifecycle)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: owning NEXT Job is not executable.' }], isError: true }
      }
      if (job.planning_review?.status !== 'PASS' || job.planning_review?.reviewed_revision !== job.planning_revision) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current NEXT planning revision is not Reviewer PASS.' }], isError: true }
      }
      const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpoint_id && item.planning_revision === job.planning_revision)
      if (!checkpoint) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: checkpoint is not part of the current planning revision.' }], isError: true }
      }
      const prerequisiteClaims = parseDurableSnapshots(prerequisite_claim_snapshots ?? [], 'prerequisite_claim_snapshots')
      if (prerequisiteClaims.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteClaims.error }], isError: true }
      const prerequisiteClaimError = validateClaimSnapshots(prerequisiteClaims.entries, 'prerequisite_claim_snapshots')
      if (prerequisiteClaimError) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteClaimError }], isError: true }
      const prerequisiteVerifications = parseDurableSnapshots(prerequisite_verification_snapshots ?? [], 'prerequisite_verification_snapshots')
      if (prerequisiteVerifications.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteVerifications.error }], isError: true }
      const prerequisiteVerificationError = validateVerificationSnapshots(prerequisiteVerifications.entries, 'prerequisite_verification_snapshots')
      if (prerequisiteVerificationError) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteVerificationError }], isError: true }
      const completedRuns = parseDurableSnapshots(completed_task_run_snapshots ?? [], 'completed_task_run_snapshots')
      if (completedRuns.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + completedRuns.error }], isError: true }
      const completedTaskState = validateCompletedTaskRunSnapshots(job, completedRuns.entries)
      if (completedTaskState.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + completedTaskState.error }], isError: true }
      const completedTaskIds = completedTaskState.completed
      if (checkpoint.boundary === 'BEFORE_NODE' && checkpoint.boundary_node_id && completedTaskIds.has(checkpoint.boundary_node_id)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_BOUNDARY_MISSED: BEFORE_NODE target is already durably completed: ' + checkpoint.boundary_node_id }], isError: true }
      }
      const runtimePrerequisiteIds = checkpointBoundaryPrerequisiteIds(job, checkpoint)
      for (const prerequisiteId of runtimePrerequisiteIds) {
        const prerequisiteCheckpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === prerequisiteId)
        if (prerequisiteCheckpoint) {
          const prerequisiteClaimMatches = prerequisiteClaims.entries.filter((entry: any) => {
            const item = entry.record
            return item?.kind === 'CHECKPOINT_CLAIM' &&
              item.project_id === project_id &&
              item.job_id === job_id &&
              item.planning_revision === job.planning_revision &&
              item.checkpoint_id === prerequisiteId &&
              entry.path === checkpointClaimPath(project_id, job_id, job.planning_revision, prerequisiteId, nextMemoryNamespace)
          })
          const prerequisiteClaim = prerequisiteClaimMatches.length === 1 ? prerequisiteClaimMatches[0].record : null
          const prerequisiteVerificationMatches = prerequisiteClaim
            ? prerequisiteVerifications.entries.filter((entry: any) =>
                entry.record?.verification_id === prerequisiteClaim.last_verification_id &&
                entry.path === verificationPath(project_id, prerequisiteClaim.last_verification_id, 'NEXT', nextMemoryNamespace)
              )
            : []
          const prerequisiteVerification = prerequisiteVerificationMatches.length === 1 ? prerequisiteVerificationMatches[0].record : null
          if (!checkpointVerificationApplicable(job, prerequisiteCheckpoint, prerequisiteClaim, prerequisiteVerification)) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_PREREQUISITE_BLOCKED: prerequisite checkpoint is not satisfied/applicable: ' + prerequisiteId }], isError: true }
          }
        } else if (!completedTaskIds.has(prerequisiteId)) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_PREREQUISITE_BLOCKED: prerequisite Task is not durably completed: ' + prerequisiteId }], isError: true }
        }
      }
      const claimPath = checkpointClaimPath(project_id, job_id, job.planning_revision, checkpoint_id, nextMemoryNamespace)
      let current: any = null
      if (current_claim_record_text) {
        if (!current_claim_record_sha) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim SHA is required with current claim text.' }], isError: true }
        try { current = JSON.parse(current_claim_record_text) } catch {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim JSON is invalid.' }], isError: true }
        }
        if (current.kind !== 'CHECKPOINT_CLAIM' || current.project_id !== project_id || current.job_id !== job_id || current.planning_revision !== job.planning_revision || current.checkpoint_id !== checkpoint_id) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim identity/revision mismatch.' }], isError: true }
        }
        if (current.state === 'ACTIVE' && !checkpointLeaseExpired(current)) {
          if (current.claimant_run_id === claimant_run_id && current.target_revision === target_revision) {
            const out = {
              disposition: 'REUSE',
              claim_memory_path: claimPath,
              claim_operation: 'NONE',
              expected_claim_sha: current_claim_record_sha,
              claim_record_text: null,
              attempt_memory_path: checkpointAttemptPath(project_id, current.attempt_id, nextMemoryNamespace),
              attempt_record_text: null,
              attempt_id: current.attempt_id,
              lease_token: current.lease_token,
              external_steps: [
                'Reuse the existing active attempt/token; do not create another claim or attempt record.',
                'Read the existing attempt record at attempt_memory_path before continuing Tester execution.',
              ],
            }
            return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
          }
          return { content: [{ type: 'text', text: 'CHECKPOINT_ALREADY_CLAIMED: another non-expired live lease owns this checkpoint revision.' }], isError: true }
        }
        if (['SATISFIED','OBSERVED'].includes(current.state) && attempt_kind === 'TEST') {
          const out = {
            disposition: 'ALREADY_SATISFIED',
            claim_memory_path: claimPath,
            claim_operation: 'NONE',
            expected_claim_sha: current_claim_record_sha,
            claim_record_text: null,
            attempt_memory_path: null,
            attempt_record_text: null,
            attempt_id: null,
            lease_token: null,
            external_steps: ['Use the current terminal claim plus its last_verification_id for evidence gating; do not create a duplicate TEST attempt.'],
          }
          return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
        }
        if (current.state === 'NEEDS_PLANNER_REVISION') {
          return { content: [{ type: 'text', text: 'CHECKPOINT_PLAN_REVISION_REQUIRED: PLAN_GAP/SPEC_GAP must be resolved by a new reviewed planning revision; do not RETEST this revision.' }], isError: true }
        }
        const reclaimingExpiredActive = current.state === 'ACTIVE' && checkpointLeaseExpired(current)
        if (reclaimingExpiredActive && current.attempt_kind !== attempt_kind) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_RECLAIM_REJECTED: expired lease reclaim must preserve the original attempt_kind.' }], isError: true }
        }
        if (attempt_kind === 'RETEST' && reclaimingExpiredActive) {
          if (current.target_revision !== target_revision || current.prior_verification_id !== retest_of_verification_id) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: expired RETEST reclaim must preserve the same Retest target and originating Verification.' }], isError: true }
          }
        } else if (attempt_kind === 'RETEST') {
          if (!current.retest_required || !retest_of_verification_id || current.last_verification_id !== retest_of_verification_id) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: RETEST must reference the terminal verification that requested Retest.' }], isError: true }
          }
          if (current.last_failure_class === 'PRODUCT_FAILURE') {
            const retestError = productFailureRetestValidationError(
              current,
              target_revision,
              retest_of_verification_id,
              repair_goal_recheck_record_text,
              repair_goal_recheck_verification_ref,
              project_id,
              job_id,
            )
            if (retestError) {
              return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: ' + retestError }], isError: true }
            }
          }
        } else if (current.state !== 'ACTIVE') {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: terminal/blocked checkpoint requires an explicit RETEST claim.' }], isError: true }
        }
      } else if (attempt_kind === 'RETEST') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: RETEST requires the current terminal claim record.' }], isError: true }
      }

      const attemptId = uuidv7()
      const leaseToken = uuidv7()
      const now = new Date()
      const expires = new Date(now.getTime() + Number(lease_seconds ?? 900) * 1000)
      const generation = Number(current?.generation ?? 0) + 1
      const claim = {
        kind: 'CHECKPOINT_CLAIM',
        project_id,
        job_id,
        execution_contract: 'NEXT',
        memory_namespace: nextMemoryNamespace,
        planning_revision: job.planning_revision,
        checkpoint_id,
        mode: checkpoint.mode,
        state: 'ACTIVE',
        generation,
        attempt_id: attemptId,
        attempt_kind,
        lease_token: leaseToken,
        claimant_run_id,
        lease_expires_at: expires.toISOString(),
        target_ref,
        target_revision,
        prior_verification_id: retest_of_verification_id ?? current?.last_verification_id ?? null,
        last_verification_id: current?.last_verification_id ?? null,
        last_result: current?.last_result ?? null,
        last_failure_class: current?.last_failure_class ?? null,
        last_target_revision: current?.last_target_revision ?? null,
        retest_required: false,
        updated_at: now.toISOString(),
      }
      const attempt = {
        kind: 'CHECKPOINT_ATTEMPT',
        attempt_id: attemptId,
        project_id,
        job_id,
        execution_contract: 'NEXT',
        memory_namespace: nextMemoryNamespace,
        planning_revision: job.planning_revision,
        checkpoint_id,
        mode: checkpoint.mode,
        attempt_kind,
        lease_token: leaseToken,
        claimant_run_id,
        target_ref,
        target_revision,
        state: 'STARTED',
        retest_of_verification_id: retest_of_verification_id ?? null,
        started_at: now.toISOString(),
      }
      const attemptPath = checkpointAttemptPath(project_id, attemptId, nextMemoryNamespace)
      const claimOperation = current ? 'UPDATE' : 'CREATE'
      const externalSteps = [
        'Immediately read back the claimant Tester Run from NEXT memory and require blob SHA equals claimant_run_record_sha plus role=tester, lifecycle=IN_PROGRESS, same project/job/run/target before any claim mutation.',
        claimOperation === 'CREATE'
          ? 'Call authorize_memory_mutation(create) for claim_memory_path, then create the deterministic claim record. Concurrent create failure means another claimant won; refetch instead of retrying blind.'
          : 'Immediately refetch claim_memory_path and require its blob SHA equals expected_claim_sha; authorize/update with exact SHA. Stale SHA means another claimant/reclaimer won.',
        'Read back the claim and require lease_token/attempt_id/generation exactly match this grant before creating the attempt child.',
        'Call authorize_memory_mutation(create) for attempt_memory_path and create attempt_record_text. Duplicate create means replay; read existing attempt and require the same lease_token.',
        ...durableSnapshotReadbackSteps(completed_task_run_snapshots ?? [], 'completed Task Run snapshot'),
        ...durableSnapshotReadbackSteps(prerequisite_claim_snapshots ?? [], 'prerequisite checkpoint claim snapshot'),
        ...durableSnapshotReadbackSteps(prerequisite_verification_snapshots ?? [], 'prerequisite checkpoint Verification snapshot'),
        'Task prerequisite completion is derived only from successful COMPLETED NEXT Run snapshots bound to the current planning_revision and expected topology handler.',
        'For MILESTONE_GATE and JOB_FINAL, runtime prerequisites are expanded from the current milestone/planning_topology; BEFORE_NODE is rejected once its boundary Task is already completed.',
        'Only the current durable lease token may produce terminal Tester Verification.',
        current?.last_failure_class === 'PRODUCT_FAILURE' && attempt_kind === 'RETEST' && current.state !== 'ACTIVE'
          ? 'Read back repair_goal_recheck_verification_ref and require it equals the supplied Goal Recheck for the repaired target revision before Tester execution.'
          : 'No additional repair Goal Recheck read-back is required for this claim/reclaim kind.',
      ]
      const out = {
        disposition: 'CLAIM',
        claim_memory_path: claimPath,
        claim_operation: claimOperation,
        expected_claim_sha: current_claim_record_sha ?? null,
        claim_record_text: prettyJson(claim),
        attempt_memory_path: attemptPath,
        attempt_record_text: prettyJson(attempt),
        attempt_id: attemptId,
        lease_token: leaseToken,
        external_steps: externalSteps,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
