// GSA1: Browser UI inspection and test-flow evidence tools.
export function registerBrowserTestTools(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError } = deps
  server.registerTool(
    'browser_ui_inspect',
    {
      title: 'Inspect rendered UI in browser',
      description: 'Internal GPT capability for Designer/UI inspection. Open a public runnable web UI in Vercel Sandbox with agent-browser and return accessibility snapshot, annotated screenshots, console output and page errors. Not a user-facing command.',
      inputSchema: {
        url: z.string().url(),
        viewports: z.array(z.object({
          width: z.number().int().min(320).max(1920),
          height: z.number().int().min(480).max(1440),
          label: z.string().max(40).optional(),
        })).max(3).optional(),
        evidence: z.object({
          persist: z.boolean(),
          label: z.string().min(1).max(80).optional(),
          expires_in: z.number().int().min(60).max(604800).optional(),
          bundle: z.object({
            project_id: z.string().min(1).max(240),
            repository: z.string().min(1).max(500),
            job_id: z.string().min(1).max(240),
            checkpoint_id: z.string().min(1).max(240),
            attempt_id: z.string().min(1).max(240),
            run_id: z.string().min(1).max(240),
            target_ref: z.string().max(500).optional(),
            target_revision: z.string().regex(/^[0-9a-f]{40}$/),
            privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']).optional(),
            result: z.string().max(80).optional(),
            limitations: z.array(z.string().max(500)).max(20).optional(),
          }).optional(),
        }).optional(),
      },
      outputSchema: {
        observed: z.boolean(),
        title: z.string(),
        url: z.string(),
        snapshot: z.string(),
        console: z.string(),
        page_errors: z.string(),
        screenshot_count: z.number().int(),
        evidence: z.array(z.object({
          artifact_id: z.string().optional(),
          label: z.string(),
          storage_path: z.string(),
          signed_url: z.string().url(),
          expires_at: z.string(),
          mime_type: z.string(),
          size_bytes: z.number().int().nonnegative().optional(),
          sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })).optional(),
        evidence_bundle: z.object({
          evidence_bundle_id: z.string().regex(/^[0-9a-f]{64}$/),
          backend: z.literal('PRIVATE_SUPABASE'),
          privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']),
          binding: z.object({
            project_id: z.string().min(1),
            repository: z.string().min(1),
            job_id: z.string().min(1),
            checkpoint_id: z.string().min(1),
            attempt_id: z.string().min(1),
            run_id: z.string().min(1),
            target_ref: z.string().nullable(),
            target_revision: z.string().min(1),
          }),
          manifest_path: z.string(),
          manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/),
          viewer_url: z.string().url(),
          target_revision: z.string(),
          artifact_count: z.number().int().positive().max(12),
          size_bytes: z.number().int().positive().max(50 * 1024 * 1024),
          immutable: z.literal(true),
          manifest_readback_verified: z.literal(true),
        }).optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ url, viewports, evidence }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to inspect UI.')
      try {
        const data = await callBrowserBridge(req, { mode: 'ui_inspect', url, viewports, ...(evidence ? { evidence } : {}) })
        const screenshots = Array.isArray(data.screenshots) ? data.screenshots : []
        const summary = {
          observed: true,
          title: String(data.title ?? ''),
          url: String(data.url ?? url),
          snapshot: String(data.snapshot ?? ''),
          console: String(data.console ?? ''),
          page_errors: String(data.page_errors ?? ''),
          screenshot_count: screenshots.length,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
          evidence_bundle: data.evidence_bundle ?? undefined,
        }
        const content: any[] = [{ type: 'text', text: JSON.stringify(summary) }]
        for (const shot of screenshots) {
          if (shot?.data) {
            content.push({
              type: 'image',
              data: String(shot.data),
              mimeType: String(shot.mimeType ?? 'image/png'),
            })
          }
        }
        return { structuredContent: summary, content }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          structuredContent: {
            observed: false,
            title: '',
            url,
            snapshot: '',
            console: '',
            page_errors: message,
            screenshot_count: 0,
            evidence: [],
          },
          content: [{ type: 'text', text: 'Browser UI inspection unavailable: ' + message }],
          isError: true,
        }
      }
    },
  )

  server.registerTool(
    'browser_test_flow',
    {
      title: 'Run basic browser test flow',
      description: 'Internal GPT capability for Tester. Execute one bounded non-destructive web-app flow in a Vercel Sandbox using semantic locators/CSS, then return step evidence, final snapshot, console/page errors and an annotated screenshot. Not a user-facing command.',
      inputSchema: {
        url: z.string().url(),
        viewport: z.object({
          width: z.number().int().min(320).max(1920),
          height: z.number().int().min(480).max(1440),
          label: z.string().max(40).optional(),
        }).optional(),
        stop_on_failure: z.boolean().optional(),
        evidence: z.object({
          persist: z.boolean(),
          label: z.string().min(1).max(80).optional(),
          expires_in: z.number().int().min(60).max(604800).optional(),
          bundle: z.object({
            project_id: z.string().min(1).max(240),
            repository: z.string().min(1).max(500),
            job_id: z.string().min(1).max(240),
            checkpoint_id: z.string().min(1).max(240),
            attempt_id: z.string().min(1).max(240),
            run_id: z.string().min(1).max(240),
            target_ref: z.string().max(500).optional(),
            target_revision: z.string().regex(/^[0-9a-f]{40}$/),
            privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']).optional(),
            result: z.string().max(80).optional(),
            limitations: z.array(z.string().max(500)).max(20).optional(),
          }).optional(),
        }).optional(),
        steps: z.array(z.object({
          action: z.enum(['click', 'fill', 'check', 'hover', 'select', 'press', 'wait_text', 'assert_text']),
          by: z.enum(['css', 'text', 'label', 'placeholder', 'testid', 'role']).optional(),
          target: z.string().max(500).optional(),
          name: z.string().max(300).optional(),
          value: z.string().max(4000).optional(),
        })).max(20),
      },
      outputSchema: {
        observed: z.boolean(),
        passed: z.boolean(),
        url: z.string(),
        initial_snapshot: z.string(),
        final_snapshot: z.string(),
        console: z.string(),
        page_errors: z.string(),
        steps: z.array(z.any()),
        screenshot_count: z.number().int(),
        evidence: z.array(z.object({
          artifact_id: z.string().optional(),
          label: z.string(),
          storage_path: z.string(),
          signed_url: z.string().url(),
          expires_at: z.string(),
          mime_type: z.string(),
          size_bytes: z.number().int().nonnegative().optional(),
          sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })).optional(),
        evidence_bundle: z.object({
          evidence_bundle_id: z.string().regex(/^[0-9a-f]{64}$/),
          backend: z.literal('PRIVATE_SUPABASE'),
          privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']),
          binding: z.object({
            project_id: z.string().min(1),
            repository: z.string().min(1),
            job_id: z.string().min(1),
            checkpoint_id: z.string().min(1),
            attempt_id: z.string().min(1),
            run_id: z.string().min(1),
            target_ref: z.string().nullable(),
            target_revision: z.string().min(1),
          }),
          manifest_path: z.string(),
          manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/),
          viewer_url: z.string().url(),
          target_revision: z.string(),
          artifact_count: z.number().int().positive().max(12),
          size_bytes: z.number().int().positive().max(50 * 1024 * 1024),
          immutable: z.literal(true),
          manifest_readback_verified: z.literal(true),
        }).optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ url, viewport, stop_on_failure, evidence, steps }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to run browser testing.')
      try {
        const data = await callBrowserBridge(req, {
          mode: 'test_flow',
          url,
          viewport,
          stop_on_failure,
          steps,
          ...(evidence ? { evidence } : {}),
        })
        const summary = {
          observed: true,
          passed: Boolean(data.passed),
          url: String(data.url ?? url),
          initial_snapshot: String(data.initial_snapshot ?? ''),
          final_snapshot: String(data.final_snapshot ?? ''),
          console: String(data.console ?? ''),
          page_errors: String(data.page_errors ?? ''),
          steps: Array.isArray(data.steps) ? data.steps : [],
          screenshot_count: data.screenshot?.data ? 1 : 0,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
          evidence_bundle: data.evidence_bundle ?? undefined,
        }
        const content: any[] = [{ type: 'text', text: JSON.stringify(summary) }]
        if (data.screenshot?.data) {
          content.push({
            type: 'image',
            data: String(data.screenshot.data),
            mimeType: String(data.screenshot.mimeType ?? 'image/png'),
          })
        }
        return { structuredContent: summary, content }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          structuredContent: {
            observed: false,
            passed: false,
            url,
            initial_snapshot: '',
            final_snapshot: '',
            console: '',
            page_errors: message,
            steps: [],
            screenshot_count: 0,
            evidence: [],
          },
          content: [{ type: 'text', text: 'Browser functional testing unavailable: ' + message }],
          isError: true,
        }
      }
    },
  )


  function validateRepositoryProbeSnapshot(
    snapshot: any,
    expected: {
      project_id: string
      job_id: string
      execution_contract: ExecutionContract
      memory_namespace?: NextMemoryNamespace | null
      repository_full_name: string
      target_ref: string
      target_revision: string
      evidence_ref: string
    },
  ) {
    if (!snapshot) return { error: 'EVIDENCE_REPO_DENY: PUBLISH requires a durable successful probe Verification snapshot.' }
    const parsed = parseDurableSnapshots([snapshot], 'binary_probe_verification_snapshot')
    if (parsed.error || parsed.entries.length !== 1) {
      return { error: 'EVIDENCE_REPO_DENY: invalid binary probe Verification snapshot.' }
    }
    const entry = parsed.entries[0]
    const record = entry.record
    const recordMemoryNamespace = recordNextMemoryNamespace(record)
    const expectedPath =
      typeof record?.verification_id === 'string'
        ? verificationPath(expected.project_id, record.verification_id, expected.execution_contract, recordMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
        : ''
    const repoMatches =
      String(record?.repository_full_name || '').toLowerCase() === expected.repository_full_name.toLowerCase()
    const valid =
      expectedPath === entry.path &&
      record?.kind === 'CAPABILITY_PROBE' &&
      record?.project_id === expected.project_id &&
      record?.job_id === expected.job_id &&
      resolveExecutionContract(record?.execution_contract) === expected.execution_contract &&
      (expected.execution_contract !== 'NEXT' || (recordMemoryNamespace != null && recordMemoryNamespace === expected.memory_namespace)) &&
      record?.producer === 'tester' &&
      record?.probe_id === 'PROBE-GIT-EVIDENCE-01' &&
      record?.capability === 'REPOSITORY_BINARY_EVIDENCE' &&
      record?.result === 'OBSERVED' &&
      repoMatches &&
      record?.target_ref === expected.target_ref &&
      record?.target_revision === expected.target_revision &&
      record?.evidence_ref === expected.evidence_ref &&
      record?.source_revision_unchanged === true &&
      record?.append_only_verified === true &&
      record?.manifest_readback_verified === true &&
      record?.artifact_readback_verified === true &&
      record?.automation_side_effects_observed === false &&
      record?.usable_as_product_evidence === false &&
      /^[0-9a-f]{40}$/.test(String(record?.evidence_commit_sha || ''))
    if (!valid) {
      return { error: 'EVIDENCE_REPO_DENY: probe Verification is not an exact successful PROBE-GIT-EVIDENCE-01 observation for this publication target.' }
    }
    return { error: null, ref: entry.path, sha: entry.sha, record }
  }


  registerRepositoryEvidenceTools({ server, z, req, AUTH_SCOPES, authContext, authError, verificationPath, uuidv7, normalizeGithubRepo, DURABLE_RECORD_SNAPSHOT_SCHEMA, jobExecutionContract, recordNextMemoryNamespace, resolveExecutionContract, prettyJson, DEFAULT_NEXT_MEMORY_NAMESPACE, parseProjectManifest, invalidExecutionContract, validateRepositoryProbeSnapshot })

  registerEvidenceBundleAttestationTool({ server, z, req, AUTH_SCOPES, authContext, authError, recordPath, verificationPath, uuidv7, sha256Utf8Text, normalizeGithubRepo, DURABLE_RECORD_SNAPSHOT_SCHEMA, jobExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, resolveExecutionContract, evidenceBundleRefValidationError, prettyJson, durableSnapshotReadbackSteps })

}
