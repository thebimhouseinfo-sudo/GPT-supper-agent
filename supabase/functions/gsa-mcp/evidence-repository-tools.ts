export function registerRepositoryEvidenceTools(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, verificationPath, uuidv7, normalizeGithubRepo, DURABLE_RECORD_SNAPSHOT_SCHEMA, jobExecutionContract, recordNextMemoryNamespace, resolveExecutionContract, prettyJson, DEFAULT_NEXT_MEMORY_NAMESPACE, parseProjectManifest, invalidExecutionContract, validateRepositoryProbeSnapshot } = deps
  server.registerTool(
    'evidence_repository_publish_prepare',
    {
      title: 'Prepare bounded repository evidence publication',
      description: 'Authorize one bounded repository evidence PROBE or REPO_SAFE PUBLISH attempt against the active Project OWNED working repo. Returns a fail-closed Git publication contract; it does not mutate Git itself.',
      inputSchema: {
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().min(7),
        job_record_text: z.string().min(2),
        repository_full_name: z.string().min(3),
        job_id: z.string().uuid(),
        checkpoint_id: z.string().min(1).max(240),
        attempt_id: z.string().min(1).max(240),
        run_id: z.string().uuid(),
        target_ref: z.string().min(1).max(500),
        target_revision: z.string().regex(/^[0-9a-f]{40}$/),
        privacy_class: z.literal('REPO_SAFE'),
        evidence_ref: z.string().min(1).max(240),
        expected_evidence_ref_head: z.string().regex(/^[0-9a-f]{40}$/).nullable(),
        automation_isolation_verified: z.literal(true),
        automation_evidence_refs: z.array(z.string().min(1)).min(1),
        publication_mode: z.enum(['PROBE','PUBLISH']).default('PUBLISH'),
        probe_id: z.literal('PROBE-GIT-EVIDENCE-01').optional(),
        binary_probe_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        artifacts: z.array(z.object({
          label: z.string().min(1).max(100),
          mime_type: z.literal('image/png'),
          size_bytes: z.number().int().positive().max(5 * 1024 * 1024),
          sha256: z.string().regex(/^[0-9a-f]{64}$/),
        })).min(1).max(12),
      },
      outputSchema: {
        allowed: z.boolean(),
        reason: z.string(),
        publication_mode: z.enum(['PROBE','PUBLISH']),
        probe_id: z.string().nullable(),
        evidence_ref: z.string(),
        evidence_prefix: z.string(),
        expected_parent_sha: z.string(),
        force_allowed: z.literal(false),
        max_bundle_bytes: z.number().int(),
        manifest: z.any(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({
      project_manifest_text, project_manifest_sha, job_record_text, repository_full_name,
      job_id, checkpoint_id, attempt_id, run_id, target_ref, target_revision,
      evidence_ref, expected_evidence_ref_head, automation_evidence_refs,
      publication_mode, probe_id, binary_probe_verification_snapshot, artifacts,
    }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to authorize repository evidence publication.')
      const project = parseProjectManifest(project_manifest_text)
      if (!project || project.lifecycle !== 'ACTIVE') {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: Project must be ACTIVE.' }], isError: true }
      }
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(job)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(job)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      if (job.project_id !== project.project_id || job.job_id !== job_id || job.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: Job identity/lifecycle mismatch.' }], isError: true }
      }
      const requested = normalizeGithubRepo('https://github.com/' + repository_full_name.replace(/^https?:\/\/github\.com\//i, ''))
      if (!requested) return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: invalid repository.' }], isError: true }
      const owned = project.repositories.find((item: any) => item.relation === 'OWNED' && normalizeGithubRepo(item.url)?.full_name.toLowerCase() === requested.full_name.toLowerCase())
      const working = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')
      if (!owned || !working || working.full_name.toLowerCase() !== requested.full_name.toLowerCase()) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: repository is not the active Project OWNED working repository.' }], isError: true }
      }
      if (!project_manifest_sha || target_ref === evidence_ref) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: evidence ref must be separate from the tested source ref.' }], isError: true }
      }
      const requiredRef = 'gsa-evidence/' + project.project_id
      if (evidence_ref !== requiredRef) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: evidence ref must equal ' + requiredRef }], isError: true }
      }

      const mode = publication_mode === 'PROBE' ? 'PROBE' : 'PUBLISH'
      let probeVerification: any = null
      if (mode === 'PROBE') {
        if (probe_id !== 'PROBE-GIT-EVIDENCE-01') {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: PROBE mode requires PROBE-GIT-EVIDENCE-01.' }], isError: true }
        }
        if (binary_probe_verification_snapshot) {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: PROBE establishes capability and must not consume a prior probe Verification.' }], isError: true }
        }
        if (
          artifacts.length !== 1 ||
          Number(artifacts[0]?.size_bytes || 0) > 64 * 1024 ||
          !String(artifacts[0]?.label || '').toLowerCase().startsWith('probe-git-evidence-01')
        ) {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: PROBE requires one synthetic probe-git-evidence-01 artifact <= 64 KiB.' }], isError: true }
        }
      } else {
        const validatedProbe = validateRepositoryProbeSnapshot(binary_probe_verification_snapshot, {
          project_id: project.project_id,
          job_id,
          execution_contract: executionContract,
          memory_namespace: nextMemoryNamespace,
          repository_full_name: requested.full_name,
          target_ref,
          target_revision,
          evidence_ref: requiredRef,
        })
        if (validatedProbe.error) {
          return { content: [{ type: 'text', text: validatedProbe.error }], isError: true }
        }
        probeVerification = validatedProbe
      }

      const totalBytes = artifacts.reduce((sum: number, item: any) => sum + Number(item.size_bytes || 0), 0)
      const maxBundleBytes = 25 * 1024 * 1024
      if (totalBytes > maxBundleBytes) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: repository evidence bundle exceeds 25 MiB.' }], isError: true }
      }
      const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
      const prefix = ['tests/gsa', project.project_id, clean(job_id), clean(checkpoint_id), clean(attempt_id)].join('/')
      if (!prefix || prefix.includes('..')) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: invalid evidence prefix.' }], isError: true }
      }
      const expectedParent = expected_evidence_ref_head || target_revision
      const manifest = {
        schema_version: 1,
        backend: 'REPOSITORY_GIT',
        privacy_class: 'REPO_SAFE',
        publication_mode: mode,
        probe_id: mode === 'PROBE' ? 'PROBE-GIT-EVIDENCE-01' : null,
        binding: {
          project_id: project.project_id,
          memory_namespace: nextMemoryNamespace,
          repository: requested.full_name,
          job_id,
          checkpoint_id,
          attempt_id,
          run_id,
          target_ref,
          target_revision,
        },
        evidence_ref,
        expected_parent_sha: expectedParent,
        force_allowed: false,
        automation_isolation: {
          verified: true,
          evidence_refs: automation_evidence_refs,
        },
        binary_capability: {
          observed: mode === 'PUBLISH',
          verification_ref: mode === 'PUBLISH' ? probeVerification.ref : null,
          verification_sha: mode === 'PUBLISH' ? probeVerification.sha : null,
        },
        artifacts,
      }
      const result = {
        allowed: true,
        reason: mode === 'PROBE'
          ? 'Bounded synthetic repository evidence capability probe authorized.'
          : 'Bounded REPO_SAFE evidence publication authorized by exact durable probe Verification.',
        publication_mode: mode,
        probe_id: mode === 'PROBE' ? 'PROBE-GIT-EVIDENCE-01' : null,
        evidence_ref,
        evidence_prefix: prefix,
        expected_parent_sha: expectedParent,
        force_allowed: false as const,
        max_bundle_bytes: maxBundleBytes,
        manifest,
        external_steps: [
          'Re-fetch Project, Job, tested source ref and evidence ref immediately before mutation; deny on lifecycle/scope/revision drift.',
          'Require tested source ref still resolves to target_revision exactly.',
          'If evidence ref exists, require its live head equals expected_evidence_ref_head and create the new evidence commit with that exact head as parent.',
          'If evidence ref does not exist, require expected_evidence_ref_head=null and bootstrap the first evidence commit with target_revision as parent.',
          'Create only artifact blobs plus manifest.json below evidence_prefix. Do not modify any path outside that prefix.',
          'Create the evidence commit with parent == expected_parent_sha exactly.',
          'Move only evidence_ref using a non-force/fast-forward ref update. force=true and non-fast-forward updates are forbidden.',
          'Read back evidence_ref and immutable commit/blob contents; verify hashes and source ref immutability.',
          'Verify no CI, preview deploy, release or source workflow was triggered by the evidence ref update. If isolation is not proven, treat repository routing as unavailable and use PRIVATE_REQUIRED/private backend.',
          mode === 'PROBE'
            ? 'Finalize this PROBE, then create/persist its CAPABILITY_PROBE Verification before any PUBLISH attempt.'
            : 'Immediately re-read the binary probe Verification snapshot before mutation; its path/SHA/record must still be the exact snapshot authorized above.',
          'Call evidence_repository_publish_finalize with observed read-back values before referencing repository evidence from Verification/Handoff.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

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

  server.registerTool(
    'evidence_repository_probe_verification_prepare',
    {
      title: 'Prepare durable repository evidence capability probe Verification',
      description: 'Convert one successfully finalized PROBE-GIT-EVIDENCE-01 observation into an append-only CAPABILITY_PROBE Verification record. Persist and read back this exact record before any repository PUBLISH attempt.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        repository_full_name: z.string().min(3),
        target_ref: z.string().min(1),
        target_revision: z.string().regex(/^[0-9a-f]{40}$/),
        probe_finalize_result_text: z.string().min(2),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, job_id, job_record_text, repository_full_name, target_ref, target_revision, probe_finalize_result_text }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare repository probe Verification.')
      let job: any, finalized: any
      try {
        job = JSON.parse(job_record_text)
        finalized = JSON.parse(probe_finalize_result_text)
      } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_PROBE_VERIFICATION_REJECTED: invalid Job/finalize JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(job)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(job)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'EVIDENCE_PROBE_VERIFICATION_REJECTED: NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      if (job.project_id !== project_id || job.job_id !== job_id || job.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'EVIDENCE_PROBE_VERIFICATION_REJECTED: Job identity/lifecycle mismatch.' }], isError: true }
      }
      const observation = finalized?.probe_observation
      const repoMatches = String(observation?.repository_full_name || '').toLowerCase() === String(repository_full_name).toLowerCase()
      const valid =
        finalized?.valid === true &&
        finalized?.backend === 'REPOSITORY_GIT' &&
        finalized?.publication_mode === 'PROBE' &&
        finalized?.evidence_bundle_ref == null &&
        observation?.project_id === project_id &&
        observation?.job_id === job_id &&
        resolveExecutionContract(observation?.execution_contract) === executionContract &&
        (executionContract !== 'NEXT' || observation?.memory_namespace === nextMemoryNamespace) &&
        observation?.probe_id === 'PROBE-GIT-EVIDENCE-01' &&
        observation?.capability === 'REPOSITORY_BINARY_EVIDENCE' &&
        observation?.observed === true &&
        repoMatches &&
        observation?.target_ref === target_ref &&
        observation?.target_revision === target_revision &&
        observation?.evidence_ref === 'gsa-evidence/' + project_id &&
        observation?.source_revision_unchanged === true &&
        observation?.append_only_verified === true &&
        observation?.manifest_readback_verified === true &&
        observation?.artifact_readback_verified === true &&
        observation?.automation_side_effects_observed === false &&
        observation?.usable_as_product_evidence === false &&
        /^[0-9a-f]{40}$/.test(String(observation?.evidence_commit_sha || ''))
      if (!valid) {
        return { content: [{ type: 'text', text: 'EVIDENCE_PROBE_VERIFICATION_REJECTED: finalized result is not an exact successful bounded repository evidence probe observation.' }], isError: true }
      }

      const verificationId = uuidv7()
      const memoryPath = verificationPath(project_id, verificationId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const verification = {
        verification_id: verificationId,
        kind: 'CAPABILITY_PROBE',
        project_id,
        job_id,
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { memory_namespace: nextMemoryNamespace } : {}),
        producer: 'tester',
        probe_id: 'PROBE-GIT-EVIDENCE-01',
        capability: 'REPOSITORY_BINARY_EVIDENCE',
        result: 'OBSERVED',
        repository_full_name,
        target_ref,
        target_revision,
        evidence_ref: observation.evidence_ref,
        evidence_commit_sha: observation.evidence_commit_sha,
        append_only_parent_sha: observation.append_only_parent_sha,
        manifest_path: observation.manifest_path,
        manifest_sha256: observation.manifest_sha256,
        human_openable_url: observation.human_openable_url,
        source_revision_unchanged: true,
        append_only_verified: true,
        manifest_readback_verified: true,
        artifact_readback_verified: true,
        automation_side_effects_observed: false,
        usable_as_product_evidence: false,
        created_at: new Date().toISOString(),
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: memoryPath,
        verification_record_text: prettyJson(verification),
        external_steps: [
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=verification_memory_path).',
          'Persist verification_record_text append-only at verification_memory_path.',
          'Read back the persisted probe Verification and pass its exact {path, sha, record_text} durable snapshot to repository PUBLISH prepare/finalize.',
          'Any missing/stale/mismatched probe snapshot keeps repository PUBLISH fail-closed.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
