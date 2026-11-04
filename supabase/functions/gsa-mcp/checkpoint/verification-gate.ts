// GSA4 A0: Source-preserving checkpoint registration extraction.
export function registerCheckpointVerificationGateTools(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, DURABLE_RECORD_SNAPSHOT_SCHEMA, checkpointLeaseExpired, checkpointBoundaryPrerequisiteIds, prettyJson, uuidv7, verificationPath, jobExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, durableSnapshotReadbackSteps, evaluateNextEvidenceGate, resolveExecutionContract, validateClaimSnapshots, validateVerificationSnapshots, validateCompletedTaskRunSnapshots, checkpointClaimPath, checkpointVerificationApplicable, checkpointAttemptPath, productFailureRetestValidationError, normalizeGithubRepo, validateEvidenceBundleAttestationSnapshot, checkpointVerificationOutcome } = deps
  server.registerTool(
    'checkpoint_verification_prepare',
    {
      title: 'Prepare NEXT Tester checkpoint Verification',
      description: 'Prepare append-preserving TEST/RETEST Verification and the terminal deterministic claim update. Applicability requires the claim to finalize with the same attempt/token/verification id.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1),
        claim_record_text: z.string().min(2),
        claim_record_sha: z.string().min(7),
        tester_run_record_text: z.string().min(2),
        tester_run_record_sha: z.string().min(7),
        attempt_id: z.string().uuid(),
        lease_token: z.string().uuid(),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        result: z.enum(['PASS','FAIL','BLOCKED','OBSERVED','UNVERIFIED']),
        failure_class: z.enum(['PRODUCT_FAILURE','TEST_FAILURE','ENVIRONMENT_FAILURE','NOT_READY','INTEGRATION_NOT_READY','SPEC_GAP','PLAN_GAP']).optional(),
        evidence_refs: z.array(z.string()).default([]),
        evidence_bundle_attestation_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).max(8).default([]),
        measurements: z.array(z.object({ name: z.string().min(1), value: z.any() })).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        claim_memory_path: z.string(),
        expected_claim_sha: z.string(),
        next_claim_record_text: z.string(),
        route: z.enum(['CONTINUE','CODER_REPAIR_GOAL_RECHECK_RETEST','PLANNER_REVISION_SUPERSEDE','RETEST_WHEN_READY']),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, checkpoint_id, claim_record_text, claim_record_sha, tester_run_record_text, tester_run_record_sha, attempt_id, lease_token, target_ref, target_revision, result, failure_class, evidence_refs, evidence_bundle_attestation_snapshots, measurements, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare checkpoint Verification.')
      let job: any, claim: any
      try { job = JSON.parse(job_record_text); claim = JSON.parse(claim_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job/claim JSON.' }], isError: true }
      }
      if (job.project_id !== project_id || job.job_id !== job_id || jobExecutionContract(job) !== 'NEXT') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: owning Job must be the current NEXT Job.' }], isError: true }
      }
      const nextMemoryNamespace = recordNextMemoryNamespace(job)
      if (!nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: owning NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      let testerRun: any
      try { testerRun = JSON.parse(tester_run_record_text) } catch {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: invalid Tester Run JSON.' }], isError: true }
      }
      if (
        resolveExecutionContract(testerRun.execution_contract) !== 'NEXT' ||
        testerRun.project_id !== project_id ||
        testerRun.job_id !== job_id ||
        testerRun.run_id !== claim.claimant_run_id ||
        testerRun.role !== 'tester' ||
        testerRun.lifecycle !== 'IN_PROGRESS' ||
        testerRun.planning_revision !== job.planning_revision ||
        recordNextMemoryNamespace(testerRun) !== nextMemoryNamespace
      ) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: Verification must be produced by the current IN_PROGRESS NEXT Tester Run that owns the lease.' }], isError: true }
      }
      const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpoint_id && item.planning_revision === job.planning_revision)
      if (!checkpoint) return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: checkpoint not in current planning revision.' }], isError: true }
      if (
        claim.kind !== 'CHECKPOINT_CLAIM' ||
        claim.project_id !== project_id ||
        claim.job_id !== job_id ||
        claim.planning_revision !== job.planning_revision ||
        claim.checkpoint_id !== checkpoint_id ||
        claim.state !== 'ACTIVE' ||
        claim.attempt_id !== attempt_id ||
        claim.lease_token !== lease_token ||
        recordNextMemoryNamespace(claim) !== nextMemoryNamespace
      ) {
        return { content: [{ type: 'text', text: 'STALE_CHECKPOINT_LEASE: claim/attempt/token is no longer the active lease.' }], isError: true }
      }
      if (checkpointLeaseExpired(claim)) {
        return { content: [{ type: 'text', text: 'STALE_CHECKPOINT_LEASE: lease expired; reclaim before producing Verification.' }], isError: true }
      }
      if (claim.target_revision !== target_revision || claim.target_ref !== target_ref) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: target revision/state differs from the claimed attempt.' }], isError: true }
      }
      const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')?.full_name ?? null
      if ((evidence_bundle_attestation_snapshots ?? []).length && !workingRepo) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: current Job working repository is unavailable for EvidenceBundle attestation validation.' }], isError: true }
      }
      const bundleKeys = new Set<string>()
      const validatedBundles: any[] = []
      const attestationRefs: any[] = []
      for (const snapshot of evidence_bundle_attestation_snapshots ?? []) {
        const attested = validateEvidenceBundleAttestationSnapshot(snapshot, {
          project_id,
          job_id,
          checkpoint_id,
          attempt_id,
          run_id: testerRun.run_id,
          target_ref,
          target_revision,
          repository_full_name: workingRepo!,
        })
        if (attested.error) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: ' + attested.error }], isError: true }
        }
        if (recordNextMemoryNamespace(attested.record) !== nextMemoryNamespace) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: EvidenceBundle attestation memory_namespace mismatch.' }], isError: true }
        }
        const bundle = attested.bundle
        const key = bundle.backend === 'PRIVATE_SUPABASE'
          ? 'PRIVATE:' + bundle.evidence_bundle_id
          : 'REPO:' + bundle.evidence_commit_sha + ':' + bundle.manifest_path
        if (bundleKeys.has(key)) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: duplicate EvidenceBundle attestation.' }], isError: true }
        }
        bundleKeys.add(key)
        validatedBundles.push(bundle)
        attestationRefs.push({ path: attested.ref, sha: attested.sha })
      }
      if (!['PASS','OBSERVED'].includes(result) && !failure_class) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: non-success result requires failure_class.' }], isError: true }
      }
      if (['PASS','OBSERVED'].includes(result) && failure_class) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: successful/observed evidence cannot carry a failure_class.' }], isError: true }
      }
      if (['PASS','OBSERVED'].includes(result) && !(evidence_refs ?? []).length && !validatedBundles.length && !(measurements ?? []).length) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: successful/observed result requires durable evidence bundle/ref or measurement.' }], isError: true }
      }
      if (result === 'OBSERVED' && !['MEASURE','PROBE'].includes(checkpoint.mode)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: OBSERVED is only valid for MEASURE/PROBE.' }], isError: true }
      }

      const verificationId = uuidv7()
      const outcome = checkpointVerificationOutcome(result, failure_class)
      const { successful, state, route, retestRequired, applicabilityStatus } = outcome
      const now = new Date().toISOString()
      const verification = {
        verification_id: verificationId,
        kind: claim.attempt_kind === 'RETEST' ? 'RETEST' : 'TEST',
        project_id,
        job_id,
        execution_contract: 'NEXT',
        memory_namespace: nextMemoryNamespace,
        planning_revision: job.planning_revision,
        checkpoint_id,
        attempt_id,
        attempt_kind: claim.attempt_kind,
        lease_token,
        mode: checkpoint.mode,
        target_ref,
        target_revision,
        run_id: testerRun.run_id,
        producer: 'tester',
        result,
        failure_class: failure_class ?? null,
        evidence_refs: evidence_refs ?? [],
        evidence_bundle_refs: validatedBundles,
        evidence_bundle_attestation_refs: attestationRefs,
        measurements: measurements ?? [],
        limitations: limitations ?? [],
        retest_of_verification_id: claim.prior_verification_id ?? null,
        applicability: {
          status: applicabilityStatus,
          planning_revision: job.planning_revision,
          checkpoint_id,
          evidence_need_ids: checkpoint.evidence_need_ids ?? [],
          target_revision,
        },
        route,
        created_at: now,
      }
      const nextClaim = {
        ...claim,
        state,
        lease_expires_at: null,
        last_verification_id: verificationId,
        last_result: result,
        last_failure_class: failure_class ?? null,
        last_target_revision: target_revision,
        retest_required: retestRequired,
        updated_at: now,
      }
      const verificationPathValue = verificationPath(project_id, verificationId, 'NEXT', nextMemoryNamespace)
      const claimPath = checkpointClaimPath(project_id, job_id, job.planning_revision, checkpoint_id, nextMemoryNamespace)
      const out = {
        verification_id: verificationId,
        verification_memory_path: verificationPathValue,
        verification_record_text: prettyJson(verification),
        claim_memory_path: claimPath,
        expected_claim_sha: claim_record_sha,
        next_claim_record_text: prettyJson(nextClaim),
        route,
        external_steps: [
          ...durableSnapshotReadbackSteps(evidence_bundle_attestation_snapshots ?? [], 'EvidenceBundle attestation snapshot'),
          'Immediately read back the Tester Run and require blob SHA equals tester_run_record_sha plus role=tester, lifecycle=IN_PROGRESS and run_id=claim.claimant_run_id.',
        'Immediately refetch claim_memory_path and require blob SHA, state=ACTIVE, attempt_id and lease_token still match this preparation. Stale/expired claim blocks persistence.',
          'Authorize/create verification_memory_path and persist verification_record_text append-only.',
          'Then authorize/update claim_memory_path with next_claim_record_text using expected_claim_sha exactly.',
          'If the claim update loses CAS, the Verification is orphaned/non-applicable because evidence gates require current claim.last_verification_id + attempt/token match. Refetch and reconcile; never treat the orphan as PASS.',
          successful
            ? 'The terminal claim can satisfy gates only after read-back proves last_verification_id points to this Verification.'
            : route === 'PLANNER_REVISION_SUPERSEDE'
              ? 'Route to Planner. A later reviewed planning_revision uses a different deterministic claim namespace and makes this revision non-applicable.'
              : route === 'CODER_REPAIR_GOAL_RECHECK_RETEST'
                ? 'Route to owning Coder repair. After exact Goal Recheck, claim RETEST against the repaired target revision; Tester must rerun original failing scenario plus impacted regressions, discover new defects, and repeat repair/retest for each reproducible within-scope failure until evidence-backed PASS or genuine blocker.'
                : 'Retest only after the blocking test/environment/integration condition is ready.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'checkpoint_gate_evaluate',
    {
      title: 'Evaluate NEXT checkpoint evidence gate',
      description: 'Read-only evidence applicability guard for NEXT Task, Milestone or Job targets. V2_STABLE always preserves the legacy path.',
      inputSchema: {
        job_record_text: z.string().min(2),
        target_kind: z.enum(['TASK','MILESTONE','JOB']),
        target_id: z.string().optional(),
        checkpoint_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        checkpoint_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
      },
      outputSchema: {
        allowed: z.boolean(),
        required_checkpoint_ids: z.array(z.string()),
        blocking: z.array(z.string()),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ job_record_text, target_kind, target_id, checkpoint_claim_snapshots, checkpoint_verification_snapshots }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to evaluate checkpoint gate.')
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const gate = evaluateNextEvidenceGate(job, checkpoint_claim_snapshots ?? [], checkpoint_verification_snapshots ?? [], { kind: target_kind, id: target_id ?? null })
      const out = {
        ...gate,
        external_steps: jobExecutionContract(job) === 'NEXT'
          ? [
              ...durableSnapshotReadbackSteps(checkpoint_claim_snapshots ?? [], 'checkpoint claim snapshot'),
              ...durableSnapshotReadbackSteps(checkpoint_verification_snapshots ?? [], 'checkpoint Verification snapshot'),
            ]
          : [],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
