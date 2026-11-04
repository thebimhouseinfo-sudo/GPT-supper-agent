export function registerEvidencePublishFinalize(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, verificationPath, uuidv7, normalizeGithubRepo, DURABLE_RECORD_SNAPSHOT_SCHEMA, jobExecutionContract, recordNextMemoryNamespace, resolveExecutionContract, prettyJson, invalidExecutionContract, validateRepositoryProbeSnapshot } = deps
  server.registerTool(
    'evidence_repository_publish_finalize',
    {
      title: 'Finalize repository evidence publication',
      description: 'Validate immutable read-back for one prepared repository evidence PROBE or PUBLISH attempt. Fails closed on source drift, ref mismatch, non-append ancestry, probe-evidence mismatch or automation side effects.',
      inputSchema: {
        publication_mode: z.enum(['PROBE','PUBLISH']).default('PUBLISH'),
        probe_id: z.literal('PROBE-GIT-EVIDENCE-01').optional(),
        binary_probe_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        tester_run_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1).max(240),
        attempt_id: z.string().min(1).max(240),
        run_id: z.string().uuid(),
        repository_full_name: z.string().min(3),
        target_ref: z.string().min(1),
        target_revision: z.string().regex(/^[0-9a-f]{40}$/),
        source_ref_readback_revision: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_ref: z.string().min(1),
        expected_parent_sha: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_commit_sha: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_commit_parent_sha: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_ref_readback_head: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_prefix: z.string().min(1),
        manifest_path: z.string().min(1),
        manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/),
        human_openable_url: z.string().url(),
        artifact_count: z.number().int().min(1).max(12),
        size_bytes: z.number().int().positive().max(25 * 1024 * 1024),
        manifest_readback_verified: z.literal(true),
        artifact_readback_verified: z.literal(true),
        automation_side_effects_observed: z.literal(false),
      },
      outputSchema: {
        valid: z.boolean(),
        backend: z.literal('REPOSITORY_GIT'),
        publication_mode: z.enum(['PROBE','PUBLISH']),
        evidence_bundle_ref: z.any().nullable(),
        probe_observation: z.any().nullable(),
        evidence_bundle_attestation_id: z.string().nullable(),
        evidence_bundle_attestation_memory_path: z.string().nullable(),
        evidence_bundle_attestation_record_text: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (args: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to finalize repository evidence publication.')
      let job: any, testerRun: any
      try {
        job = JSON.parse(args.job_record_text)
        testerRun = JSON.parse(args.tester_run_record_text)
      } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: invalid Job/Tester Run JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(job)
      if (!executionContract) return invalidExecutionContract()
      if (executionContract !== 'NEXT') {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: CP6 repository evidence publication is NEXT-only.' }], isError: true }
      }
      const nextMemoryNamespace = recordNextMemoryNamespace(job)
      if (!nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      if (job.project_id !== args.project_id || job.job_id !== args.job_id || job.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: Job identity/lifecycle mismatch.' }], isError: true }
      }
      if (
        resolveExecutionContract(testerRun.execution_contract) !== 'NEXT' ||
        testerRun.project_id !== args.project_id ||
        testerRun.job_id !== args.job_id ||
        testerRun.run_id !== args.run_id ||
        testerRun.role !== 'tester' ||
        testerRun.lifecycle !== 'IN_PROGRESS' ||
        testerRun.target_ref !== args.target_ref ||
        testerRun.target_revision !== args.target_revision ||
        recordNextMemoryNamespace(testerRun) !== nextMemoryNamespace
      ) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: publication must belong to the current target-bound NEXT Tester Run.' }], isError: true }
      }
      const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')
      const requestedRepo = normalizeGithubRepo('https://github.com/' + String(args.repository_full_name || '').replace(/^https?:\/\/github\.com\//i, ''))
      if (!workingRepo || !requestedRepo || workingRepo.full_name.toLowerCase() !== requestedRepo.full_name.toLowerCase()) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: repository does not match the current Job working repository.' }], isError: true }
      }

      const requiredRef = 'gsa-evidence/' + args.project_id
      const mode = args.publication_mode === 'PROBE' ? 'PROBE' : 'PUBLISH'
      let probeVerification: any = null
      if (mode === 'PROBE') {
        if (args.probe_id !== 'PROBE-GIT-EVIDENCE-01') {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: PROBE mode requires PROBE-GIT-EVIDENCE-01.' }], isError: true }
        }
        if (args.binary_probe_verification_snapshot) {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: PROBE must not consume a prior probe Verification.' }], isError: true }
        }
        if (args.artifact_count !== 1 || args.size_bytes > 64 * 1024) {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: PROBE evidence must remain one bounded fixture <= 64 KiB.' }], isError: true }
        }
      } else {
        const validatedProbe = validateRepositoryProbeSnapshot(args.binary_probe_verification_snapshot, {
          project_id: args.project_id,
          job_id: args.job_id,
          execution_contract: executionContract,
          memory_namespace: nextMemoryNamespace,
          repository_full_name: args.repository_full_name,
          target_ref: args.target_ref,
          target_revision: args.target_revision,
          evidence_ref: requiredRef,
        })
        if (validatedProbe.error) {
          return { content: [{ type: 'text', text: validatedProbe.error.replace('EVIDENCE_REPO_DENY:', 'EVIDENCE_REPO_INVALID:') }], isError: true }
        }
        probeVerification = validatedProbe
      }

      if (args.source_ref_readback_revision !== args.target_revision) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: tested source revision moved.' }], isError: true }
      }
      if (args.evidence_commit_parent_sha !== args.expected_parent_sha) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: evidence commit is not append-only from expected parent.' }], isError: true }
      }
      if (args.evidence_ref_readback_head !== args.evidence_commit_sha) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: evidence ref read-back does not match evidence commit.' }], isError: true }
      }
      if (args.evidence_ref !== requiredRef) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: unexpected evidence ref.' }], isError: true }
      }
      const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
      const expectedPrefix = ['tests/gsa', args.project_id, clean(args.job_id), clean(args.checkpoint_id), clean(args.attempt_id)].join('/')
      if (String(args.evidence_prefix) !== expectedPrefix || !String(args.manifest_path).startsWith(expectedPrefix + '/')) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: evidence prefix/manifest path does not match project/job/checkpoint/attempt identity.' }], isError: true }
      }

      const bundleRef = {
        backend: 'REPOSITORY_GIT',
        publication_mode: mode,
        privacy_class: 'REPO_SAFE',
        binding: {
          project_id: args.project_id,
          repository: requestedRepo.full_name,
          job_id: args.job_id,
          checkpoint_id: args.checkpoint_id,
          attempt_id: args.attempt_id,
          run_id: args.run_id,
          target_ref: args.target_ref,
          target_revision: args.target_revision,
        },
        repository: requestedRepo.full_name,
        target_ref: args.target_ref,
        target_revision: args.target_revision,
        evidence_ref: args.evidence_ref,
        evidence_commit_sha: args.evidence_commit_sha,
        manifest_path: args.manifest_path,
        manifest_sha256: args.manifest_sha256,
        human_openable_url: args.human_openable_url,
        artifact_count: args.artifact_count,
        size_bytes: args.size_bytes,
        immutable: true,
        append_only_parent_sha: args.expected_parent_sha,
        manifest_readback_verified: true,
        artifact_readback_verified: true,
        automation_side_effects_observed: false,
        binary_probe_verification_ref: mode === 'PUBLISH' ? probeVerification.ref : null,
        binary_probe_verification_sha: mode === 'PUBLISH' ? probeVerification.sha : null,
      }
      const probeObservation = mode === 'PROBE' ? {
        project_id: args.project_id,
        job_id: args.job_id,
        execution_contract: executionContract,
        memory_namespace: nextMemoryNamespace,
        probe_id: 'PROBE-GIT-EVIDENCE-01',
        capability: 'REPOSITORY_BINARY_EVIDENCE',
        observed: true,
        repository_full_name: args.repository_full_name,
        target_ref: args.target_ref,
        target_revision: args.target_revision,
        evidence_ref: args.evidence_ref,
        evidence_commit_sha: args.evidence_commit_sha,
        append_only_parent_sha: args.expected_parent_sha,
        manifest_path: args.manifest_path,
        manifest_sha256: args.manifest_sha256,
        human_openable_url: args.human_openable_url,
        source_revision_unchanged: true,
        append_only_verified: true,
        manifest_readback_verified: true,
        artifact_readback_verified: true,
        automation_side_effects_observed: false,
        usable_as_product_evidence: false,
      } : null
      const attestationId = mode === 'PUBLISH' ? uuidv7() : null
      const attestationPath = attestationId
        ? verificationPath(args.project_id, attestationId, 'NEXT', nextMemoryNamespace)
        : null
      const attestation = mode === 'PUBLISH' ? {
        verification_id: attestationId,
        kind: 'EVIDENCE_BUNDLE',
        project_id: args.project_id,
        job_id: args.job_id,
        execution_contract: 'NEXT',
        memory_namespace: nextMemoryNamespace,
        producer: 'tester',
        result: 'PUBLISHED',
        planning_revision: job.planning_revision,
        checkpoint_id: args.checkpoint_id,
        attempt_id: args.attempt_id,
        run_id: args.run_id,
        target_ref: args.target_ref,
        target_revision: args.target_revision,
        repository_full_name: requestedRepo.full_name,
        backend: 'REPOSITORY_GIT',
        evidence_bundle_ref: bundleRef,
        publication_proof: {
          kind: 'REPOSITORY_PUBLISH_FINALIZE',
          evidence_ref: bundleRef.evidence_ref,
          evidence_commit_sha: bundleRef.evidence_commit_sha,
          manifest_path: bundleRef.manifest_path,
          manifest_sha256: bundleRef.manifest_sha256,
          manifest_readback_verified: true,
          artifact_readback_verified: true,
          automation_side_effects_observed: false,
          probe_verification_ref: bundleRef.binary_probe_verification_ref,
          probe_verification_sha: bundleRef.binary_probe_verification_sha,
        },
        created_at: new Date().toISOString(),
      } : null
      const result = {
        valid: true,
        backend: 'REPOSITORY_GIT' as const,
        publication_mode: mode,
        evidence_bundle_ref: mode === 'PUBLISH' ? bundleRef : null,
        probe_observation: probeObservation,
        evidence_bundle_attestation_id: attestationId,
        evidence_bundle_attestation_memory_path: attestationPath,
        evidence_bundle_attestation_record_text: attestation ? prettyJson(attestation) : null,
        external_steps: mode === 'PUBLISH' ? [
          'Authorize/create evidence_bundle_attestation_memory_path and persist evidence_bundle_attestation_record_text append-only.',
          'Read back that attestation and pass its exact {path, sha, record_text} snapshot to checkpoint_verification_prepare.',
          'Raw evidence_bundle_ref is presentation metadata only and cannot authorize TEST/RETEST PASS.',
        ] : [
          'Use evidence_repository_probe_verification_prepare to persist the capability probe observation before repository PUBLISH is considered available.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )
}
