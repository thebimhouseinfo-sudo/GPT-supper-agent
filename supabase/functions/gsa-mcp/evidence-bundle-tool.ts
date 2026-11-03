export function registerEvidenceBundleAttestationTool(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, recordPath, verificationPath, uuidv7, sha256Utf8Text, normalizeGithubRepo, DURABLE_RECORD_SNAPSHOT_SCHEMA, jobExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, resolveExecutionContract, evidenceBundleRefValidationError, prettyJson, durableSnapshotReadbackSteps } = deps
  server.registerTool(
    'evidence_bundle_attestation_prepare',
    {
      title: 'Prepare durable EvidenceBundle publication attestation',
      description: 'Validate one already-persisted PRIVATE_SUPABASE EvidenceBundle against authenticated manifest storage and the active NEXT Tester Run, then prepare an append-only EVIDENCE_BUNDLE attestation. Repository PUBLISH emits the same attestation directly from evidence_repository_publish_finalize.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1),
        attempt_id: z.string().uuid(),
        tester_run_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA,
        backend: z.literal('PRIVATE_SUPABASE'),
        private_bundle_ref: z.any(),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        evidence_bundle_ref: z.any(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({
      project_id, job_id, job_record_text, checkpoint_id, attempt_id,
      tester_run_snapshot, backend, private_bundle_ref,
    }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare EvidenceBundle attestation.')

      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: invalid Job JSON.' }], isError: true }
      }
      if (
        job.project_id !== project_id ||
        job.job_id !== job_id ||
        jobExecutionContract(job) !== 'NEXT' ||
        job.lifecycle !== 'IN_PROGRESS'
      ) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: owning Job must be the current IN_PROGRESS NEXT Job.' }], isError: true }
      }
      const nextMemoryNamespace = recordNextMemoryNamespace(job)
      if (!nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: NEXT Job memory_namespace is invalid.' }], isError: true }
      }

      const runParsed = parseDurableSnapshots([tester_run_snapshot], 'tester_run_snapshot')
      if (runParsed.error || runParsed.entries.length !== 1) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: invalid Tester Run snapshot.' }], isError: true }
      }
      const runEntry = runParsed.entries[0]
      const testerRun = runEntry.record
      if (
        runEntry.path !== recordPath(project_id, 'RUNS', testerRun?.run_id, 'NEXT', nextMemoryNamespace) ||
        resolveExecutionContract(testerRun?.execution_contract) !== 'NEXT' ||
        testerRun?.project_id !== project_id ||
        testerRun?.job_id !== job_id ||
        testerRun?.role !== 'tester' ||
        testerRun?.lifecycle !== 'IN_PROGRESS' ||
        testerRun?.planning_revision !== job.planning_revision ||
        recordNextMemoryNamespace(testerRun) !== nextMemoryNamespace ||
        typeof testerRun?.target_ref !== 'string' ||
        !/^[0-9a-f]{40}$/.test(String(testerRun?.target_revision || ''))
      ) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: bundle must belong to the exact current IN_PROGRESS NEXT Tester Run and exact Git target revision.' }], isError: true }
      }

      const checkpoint = (job.test_checkpoints ?? []).find((item: any) =>
        item.checkpoint_id === checkpoint_id && item.planning_revision === job.planning_revision
      )
      if (!checkpoint) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: checkpoint is not part of the current plan revision.' }], isError: true }
      }
      const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')?.full_name ?? null
      if (!workingRepo) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: current Job working repository is unavailable.' }], isError: true }
      }

      const expected = {
        project_id,
        job_id,
        checkpoint_id,
        attempt_id,
        run_id: testerRun.run_id,
        target_ref: testerRun.target_ref,
        target_revision: testerRun.target_revision,
        repository_full_name: workingRepo,
      }

      const bundle = private_bundle_ref
      let publicationProof: any = null
      const bundleError = evidenceBundleRefValidationError(bundle, expected)
      if (bundleError || bundle?.backend !== 'PRIVATE_SUPABASE') {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: ' + (bundleError || 'private bundle backend mismatch.') }], isError: true }
      }

      const { data, error } = await auth.supabase
        .from('gsa_evidence_bundles')
        .select('manifest_json,manifest_sha256')
        .eq('user_id', auth.user.id)
        .eq('evidence_bundle_id', bundle.evidence_bundle_id)
        .limit(1)
        .maybeSingle()
      if (error || !data) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: authenticated private manifest row was not found.' }], isError: true }
      }
      const manifestText = String(data.manifest_json || '')
      const manifestSha = String(data.manifest_sha256 || '').toLowerCase()
      const computedSha = await sha256Utf8Text(manifestText)
      if (
        manifestSha !== computedSha ||
        manifestSha !== String(bundle.manifest_sha256 || '').toLowerCase()
      ) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: private manifest SHA/read-back mismatch.' }], isError: true }
      }

      let manifest: any
      try { manifest = JSON.parse(manifestText) } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: persisted private manifest JSON is invalid.' }], isError: true }
      }
      const manifestBinding = manifest?.binding ?? {}
      const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '')
      const bindingMatches =
        manifest?.schema_version === 1 &&
        manifest?.backend === 'PRIVATE_SUPABASE' &&
        manifest?.evidence_bundle_id === bundle.evidence_bundle_id &&
        manifest?.privacy_class === bundle.privacy_class &&
        manifest?.manifest_path === bundle.manifest_path &&
        same(manifestBinding.project_id, expected.project_id) &&
        String(manifestBinding.repository || '').toLowerCase() === workingRepo.toLowerCase() &&
        same(manifestBinding.job_id, expected.job_id) &&
        same(manifestBinding.checkpoint_id, expected.checkpoint_id) &&
        same(manifestBinding.attempt_id, expected.attempt_id) &&
        same(manifestBinding.run_id, expected.run_id) &&
        same(manifestBinding.target_ref, expected.target_ref) &&
        same(manifestBinding.target_revision, expected.target_revision)
      const artifacts = Array.isArray(manifest?.artifacts) ? manifest.artifacts : []
      const artifactBytes = artifacts.reduce((sum: number, item: any) => sum + Number(item?.size_bytes || 0), 0)
      const expectedSize = artifactBytes + new TextEncoder().encode(manifestText).byteLength
      const artifactsValid =
        artifacts.length === bundle.artifact_count &&
        artifacts.length >= 1 &&
        artifacts.length <= 12 &&
        artifacts.every((item: any) =>
          item?.mime_type === 'image/png' &&
          Number.isInteger(Number(item?.size_bytes)) &&
          Number(item.size_bytes) > 0 &&
          Number(item.size_bytes) <= 5 * 1024 * 1024 &&
          /^[0-9a-f]{64}$/.test(String(item?.sha256 || ''))
        )
      if (!bindingMatches || !artifactsValid || expectedSize !== bundle.size_bytes) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: persisted private manifest does not exactly match bundle identity/artifacts.' }], isError: true }
      }
      publicationProof = {
        kind: 'SUPABASE_MANIFEST_READBACK',
        evidence_bundle_id: bundle.evidence_bundle_id,
        manifest_path: bundle.manifest_path,
        manifest_sha256: computedSha,
        authenticated_user_id: auth.user.id,
        row_readback_verified: true,
      }

      const verificationId = uuidv7()
      const path = verificationPath(project_id, verificationId, 'NEXT', nextMemoryNamespace)
      const record = {
        verification_id: verificationId,
        kind: 'EVIDENCE_BUNDLE',
        project_id,
        job_id,
        execution_contract: 'NEXT',
        memory_namespace: nextMemoryNamespace,
        producer: 'tester',
        result: 'PUBLISHED',
        planning_revision: job.planning_revision,
        checkpoint_id,
        attempt_id,
        run_id: testerRun.run_id,
        target_ref: testerRun.target_ref,
        target_revision: testerRun.target_revision,
        repository_full_name: workingRepo,
        backend: 'PRIVATE_SUPABASE',
        evidence_bundle_ref: bundle,
        publication_proof: publicationProof,
        created_at: new Date().toISOString(),
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: path,
        verification_record_text: prettyJson(record),
        evidence_bundle_ref: bundle,
        external_steps: [
          ...durableSnapshotReadbackSteps([tester_run_snapshot], 'Tester Run snapshot'),
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=verification_memory_path).',
          'Persist verification_record_text append-only and read it back byte-identically with its Git blob SHA.',
          'Only the exact read-back {path,sha,record_text} snapshot may be passed to checkpoint_verification_prepare.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
