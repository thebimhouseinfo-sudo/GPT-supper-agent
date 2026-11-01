// GSA1: Project Management registration, preserving existing tool schemas and handlers.
export function registerProjectManagementTools(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, readMemoryConfig, normalizeGithubRepo, uuidv7, safeProjectName, buildProjectManifest, projectHandle, validMemoryPath, renderProjectRepositoryManifest, parseProjectManifest, validProjectManifestPath } = deps
  server.registerTool(
    'project_list',
    {
      title: 'List GSA Projects',
      description: 'Handler for PROJECT list / ls using the configured GitHub Memory Repo.',
      inputSchema: {},
      outputSchema: {
        memory_repo_full_name: z.string().nullable(),
        default_branch: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to list Projects.')
      const { data } = await readMemoryConfig(auth)
      const result = {
        memory_repo_full_name: data?.memory_repo_full_name ?? null,
        default_branch: data?.default_branch ?? null,
        external_steps: data?.memory_repo_full_name ? [
          'GitHub: list/fetch directory projects/ in the configured Memory Repo at default_branch.',
          'For each direct project-id directory, fetch projects/<project-id>/PROJECT.md.',
          'Include ACTIVE and PAUSED. Hide ARCHIVED unless explicitly requested.',
          'Return Project name, lifecycle and short handle. Never guess duplicate/ambiguous targets.',
        ] : ['Memory Repo is not configured. Run SETTING -> Memory Repo first.'],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_create',
    {
      title: 'Create a GSA Project',
      description: 'Handler for PROJECT create / new. Project Memory is a single PROJECT.md file under projects/<uuid>/ in the configured Memory Repo.',
      inputSchema: {
        name: z.string().min(1),
        repository_url: z.string().url(),
        purpose: z.string().optional(),
      },
      outputSchema: {
        project_id: z.string(),
        handle: z.string(),
        project_name: z.string(),
        lifecycle: z.string(),
        source_repository_url: z.string(),
        memory_repo_full_name: z.string(),
        memory_path: z.string(),
        project_manifest_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ name, repository_url, purpose }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to create a Project.')
      const source = normalizeGithubRepo(repository_url)
      if (!source) return { content: [{ type: 'text', text: 'A canonical GitHub source repository URL is required.' }], isError: true }
      const { data, error } = await readMemoryConfig(auth)
      if (error || !data?.memory_repo_full_name) {
        return { content: [{ type: 'text', text: 'Memory Repo is not configured. Configure SETTING -> Memory Repo first.' }], isError: true }
      }
      const projectId = uuidv7()
      const cleanName = safeProjectName(name)
      const now = new Date().toISOString()
      const path = 'projects/' + projectId + '/PROJECT.md'
      const manifest = buildProjectManifest({
        projectId,
        name: cleanName,
        lifecycle: 'ACTIVE',
        repoUrl: source.url,
        purpose: purpose ?? null,
        createdAt: now,
        updatedAt: now,
      })
      const result = {
        project_id: projectId,
        handle: projectHandle(projectId),
        project_name: cleanName,
        lifecycle: 'ACTIVE',
        source_repository_url: source.url,
        memory_repo_full_name: data.memory_repo_full_name,
        memory_path: path,
        project_manifest_text: manifest,
        external_steps: [
          'GitHub source repo: verify repository_url is accessible. Read-only during Project creation.',
          'Memory Repo: scan existing projects/*/PROJECT.md and reject duplicate OWNED claim for the same source repo.',
          'Call authorize_memory_mutation(operation=create, repository_full_name=memory_repo_full_name, path=memory_path). Continue only on ALLOW.',
          'GitHub Memory Repo: create_file at memory_path on configured default branch with project_manifest_text.',
          'Fetch memory_path back and verify project_id, lifecycle=ACTIVE and source repo URL. Record returned blob SHA as current revision.',
          'Do not create empty directory placeholders; Git paths materialize only when records exist.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_register_repositories',
    {
      title: 'Register Project source repositories',
      description: 'Update one Project repository registry after explicit Human confirmation. Supports single- and multi-repo Projects.',
      inputSchema: {
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().min(7),
        human_confirmed: z.literal(true),
        repositories: z.array(z.object({
          role: z.enum(['PRIMARY','DEPENDENCY','SUPPORT','REFERENCE']),
          relation: z.enum(['OWNED','REFERENCED']),
          url: z.string().url(),
        })).min(1),
      },
      outputSchema: {
        repository_mode: z.string(),
        registered_repositories: z.array(z.object({ role: z.string(), relation: z.string(), url: z.string() })),
        memory_path: z.string(),
        expected_sha: z.string(),
        updated_manifest_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ memory_path, project_manifest_text, project_manifest_sha, human_confirmed, repositories }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to register Project repositories.')
      if (!human_confirmed) return { content: [{ type: 'text', text: 'Explicit Human confirmation is required.' }], isError: true }
      if (!validMemoryPath(memory_path)) return { content: [{ type: 'text', text: 'Invalid Project Memory path.' }], isError: true }
      let updated: string
      try {
        updated = renderProjectRepositoryManifest(project_manifest_text, repositories)!
      } catch (err) {
        return { content: [{ type: 'text', text: String(err) }], isError: true }
      }
      const parsed = parseProjectManifest(updated)
      if (!parsed || !validProjectManifestPath(memory_path, parsed.project_id)) return { content: [{ type: 'text', text: 'Updated PROJECT.md path/identity would be invalid.' }], isError: true }
      const result = {
        repository_mode: parsed.repo_mode,
        registered_repositories: parsed.repositories,
        memory_path,
        expected_sha: project_manifest_sha,
        updated_manifest_text: updated,
        external_steps: [
          'GitHub: verify every supplied repository URL is accessible and resolve its canonical identity.',
          'For every OWNED repository, scan other Project manifests and reject conflicting OWNED claims.',
          'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=memory_path).',
          'Update PROJECT.md with updated_manifest_text using expected_sha exactly; stale SHA requires refetch/reconcile.',
          'Read back PROJECT.md and verify repository_mode, PRIMARY repo and full registered repository set.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

}
