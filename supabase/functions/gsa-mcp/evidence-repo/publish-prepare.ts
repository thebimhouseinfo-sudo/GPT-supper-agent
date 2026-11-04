export function registerEvidencePublishPrepare(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, normalizeGithubRepo, DURABLE_RECORD_SNAPSHOT_SCHEMA, jobExecutionContract, recordNextMemoryNamespace, parseProjectManifest, invalidExecutionContract, validateRepositoryProbeSnapshot } = deps
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
}
