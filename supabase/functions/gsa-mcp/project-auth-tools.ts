export function registerProjectAuthorizationTools(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, normalizeGithubRepo, projectBootstrapExecutionError, projectScopeDecision, readMemoryConfig, validMemoryPath } = deps
  server.registerTool(
    'get_memory_repo_config',
    {
      title: 'Get GSA Memory Repo configuration',
      description: 'Read the authenticated user\'s configured GitHub Memory Repo.',
      inputSchema: {},
      outputSchema: {
        configured: z.boolean(),
        memory_repo_id: z.number().nullable(),
        memory_repo_full_name: z.string().nullable(),
        memory_repo_url: z.string().nullable(),
        default_branch: z.string().nullable(),
        gsa_account_email: z.string().nullable(),
        write_scope: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to read Memory Repo configuration.')
      const { data, error } = await readMemoryConfig(auth)
      if (error) return { content: [{ type: 'text', text: 'Failed to read Memory Repo configuration: ' + error.message }], isError: true }
      const result = {
        configured: Boolean(data?.memory_repo_full_name),
        memory_repo_id: data?.memory_repo_id ?? null,
        memory_repo_full_name: data?.memory_repo_full_name ?? null,
        memory_repo_url: data?.memory_repo_url ?? null,
        default_branch: data?.default_branch ?? null,
        gsa_account_email: data?.email ?? auth.user.email ?? null,
        write_scope: data?.memory_repo_full_name
          ? 'EXACT_CONFIGURED_REPO_AND_PROJECTS_PREFIX_ONLY'
          : 'NO_MEMORY_WRITE_UNTIL_CONFIGURED',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'set_memory_repo_config',
    {
      title: 'Set GSA Memory Repo configuration',
      description: 'Persist a verified private GitHub repository as this user\'s GSA Memory Repo. GitHub connector verification must happen before calling this tool.',
      inputSchema: {
        repository_url: z.string().url(),
        repository_id: z.number().int().positive(),
        repository_full_name: z.string().min(3),
        default_branch: z.string().min(1),
        visibility: z.literal('private'),
        push_verified: z.literal(true),
      },
      outputSchema: {
        saved: z.boolean(),
        memory_repo_id: z.number(),
        memory_repo_full_name: z.string(),
        memory_repo_url: z.string(),
        default_branch: z.string(),
        write_scope: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    } as any,
    async ({ repository_url, repository_id, repository_full_name, default_branch }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to configure Memory Repo.')
      const normalized = normalizeGithubRepo(repository_url)
      if (!normalized || normalized.full_name.toLowerCase() !== String(repository_full_name).toLowerCase()) {
        return { content: [{ type: 'text', text: 'Repository URL/full-name mismatch.' }], isError: true }
      }
      const payload = {
        user_id: auth.user.id,
        email: auth.user.email ?? '',
        memory_repo_id: repository_id,
        memory_repo_full_name: normalized.full_name,
        memory_repo_url: normalized.url,
        default_branch,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await auth.supabase
        .from('user_memory_config')
        .upsert(payload, { onConflict: 'user_id' })
        .select('memory_repo_id, memory_repo_full_name, memory_repo_url, default_branch')
        .single()
      if (error) return { content: [{ type: 'text', text: 'Failed to save Memory Repo configuration: ' + error.message }], isError: true }
      const result = {
        saved: true,
        memory_repo_id: Number(data.memory_repo_id),
        memory_repo_full_name: data.memory_repo_full_name,
        memory_repo_url: data.memory_repo_url,
        default_branch: data.default_branch,
        write_scope: 'EXACT_CONFIGURED_REPO_AND_PROJECTS_PREFIX_ONLY',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'authorize_project_scope',
    {
      title: 'Authorize active Project scope',
      description: 'Validate an exact active PROJECT.md against one external-read or Project-owned mutation target. External reads may be explicitly user-directed; mutation never widens beyond the active Project.',
      inputSchema: {
        project_id: z.string().uuid(),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().min(7),
        operation: z.enum(['READ_EXTERNAL','MUTATE_SOURCE','MUTATE_MEMORY']),
        target_repository_url: z.string().url().optional(),
        target_memory_path: z.string().min(1).optional(),
        user_directed_external_read: z.boolean().default(false),
        target_development_branch: z.string().optional(),
        target_source_branch: z.string().optional(),
        source_job_id: z.string().optional(),
        source_task_id: z.string().optional(),
        bootstrap_evidence: z.any().optional(),
      },
      outputSchema: {
        allowed: z.boolean(),
        mutation_allowed: z.boolean(),
        scope: z.string(),
        reason: z.string(),
        project_id: z.string(),
        project_manifest_sha: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, project_manifest_text, project_manifest_sha, operation, target_repository_url, target_memory_path, user_directed_external_read, target_development_branch, target_source_branch, source_job_id, source_task_id, bootstrap_evidence }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to authorize Project scope.')
      if (operation === 'MUTATE_SOURCE') {
        const blocked = target_source_branch && target_development_branch && target_source_branch !== target_development_branch
          ? 'SOURCE_BRANCH_AMBIGUOUS: conflicting source branch arguments.'
          : projectBootstrapExecutionError(project_id, project_manifest_text, bootstrap_evidence,
              target_repository_url ?? null, target_source_branch ?? target_development_branch ?? null,
              source_job_id && source_task_id ? { job_id: source_job_id, task_id: source_task_id } : null)
        if (blocked) {
          const denied = { allowed: false, mutation_allowed: false, scope: 'NONE', reason: blocked, project_id, project_manifest_sha,
            external_steps: ['Source mutation denied by Project ownership or development branch scope.'] }
          return { structuredContent: denied, content: [{ type: 'text', text: 'DENY: ' + blocked }] }
        }
      }
      const decision = projectScopeDecision({
        project_manifest_text,
        project_id,
        operation,
        target_repository_url: target_repository_url ?? null,
        target_memory_path: target_memory_path ?? null,
        user_directed_external_read,
      })
      const out = { ...decision, project_id, project_manifest_sha,
        external_steps: operation === 'MUTATE_SOURCE' ? [
          'This checks Project ownership/branch scope only; ALLOW does not authorize a Job execution or attest Human approval.',
          'Before executing a Job, independently verify its current reviewed Plan and real Human execution authorization; do not infer execution permission from Bootstrap or caller-provided boolean.',
          'Verify live target branch HEAD, registered owner Job/Task for any Working Branch, and exact current Project manifest; the configured Development Branch remains integration target. Never infer main/default.',
        ] : [] }
      return { structuredContent: out, content: [{ type: 'text', text: (decision.allowed ? 'ALLOW SCOPE (readback required): ' : 'DENY: ') + decision.reason }] }
    },
  )

  server.registerTool(
    'authorize_memory_mutation',
    {
      title: 'Authorize a GSA Memory Repo mutation',
      description: 'Mandatory guard before GSA writes/deletes Project Memory. Fails closed on wrong repo or path outside projects/<project-id>/.',
      inputSchema: {
        repository_full_name: z.string().min(3),
        path: z.string().min(1),
        operation: z.enum(['create', 'update', 'delete']),
        human_gate_approved: z.boolean().optional(),
      },
      outputSchema: {
        allowed: z.boolean(),
        reason: z.string(),
        configured_repo: z.string().nullable(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ repository_full_name, path, operation, human_gate_approved }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to authorize memory mutation.')
      const { data, error } = await readMemoryConfig(auth)
      if (error || !data?.memory_repo_full_name) {
        const result = { allowed: false, reason: 'Memory Repo is not configured.', configured_repo: null }
        return { structuredContent: result, content: [{ type: 'text', text: 'DENY: Memory Repo is not configured.' }] }
      }
      const sameRepo = data.memory_repo_full_name.toLowerCase() === String(repository_full_name).toLowerCase()
      const safePath = validMemoryPath(path)
      let allowed = sameRepo && safePath
      let reason = allowed ? 'Mutation is inside configured Memory Repo projects/ scope.' : 'Wrong repository or path outside projects/<project-id>/.'
      if (operation === 'delete' && human_gate_approved !== true) {
        allowed = false
        reason = 'Delete requires explicit Human Gate approval.'
      }
      const result = { allowed, reason, configured_repo: data.memory_repo_full_name }
      return { structuredContent: result, content: [{ type: 'text', text: (allowed ? 'ALLOW: ' : 'DENY: ') + reason }] }
    },
  )

}
