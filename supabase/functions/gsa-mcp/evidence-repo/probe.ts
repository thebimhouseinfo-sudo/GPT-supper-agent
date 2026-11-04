export function registerEvidenceProbe(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, verificationPath, uuidv7, jobExecutionContract, recordNextMemoryNamespace, resolveExecutionContract, prettyJson, DEFAULT_NEXT_MEMORY_NAMESPACE, invalidExecutionContract } = deps
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
