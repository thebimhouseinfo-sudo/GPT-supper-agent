// GSA4 A0-P: original project_branch_policy_prepare registration, relocated without handler changes.
export function registerProjectBranchPolicyPrepare(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, parseProjectManifest, validProjectManifestPath, normalizeGithubRepo, validIntegrationBranch, isRetiredSourceBranch } = deps
  server.registerTool(
    'project_branch_policy_prepare',
    {
      title: 'Prepare Human-approved Project Development Branch configuration',
      description: 'Admin function. PREPARE ONLY: update one OWNED repository branch policy in PROJECT.md. Callers must verify live Git branches, authorize Memory scope, write with exact SHA and read back. No GitHub branch is selected by default.',
      inputSchema: {
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().regex(/^[0-9a-f]{40}$/),
        repository_url: z.string().url(),
        development_branch: z.string().min(1),
        release_branch: z.string().nullable().optional(),
        human_confirmed: z.literal(true),
      },
      outputSchema: {
        memory_path: z.string(),
        expected_sha: z.string(),
        repository_url: z.string(),
        development_branch: z.string(),
        release_branch: z.string().nullable(),
        updated_manifest_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ memory_path, project_manifest_text, project_manifest_sha, repository_url, development_branch, release_branch, human_confirmed }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare branch policy.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed || !validProjectManifestPath(memory_path, parsed.project_id) || !human_confirmed)
        return { content: [{ type: 'text', text: 'Invalid Project identity/path or missing Human confirmation.' }], isError: true }
      const repo = normalizeGithubRepo(repository_url)
      const owned = parsed.repositories.find((r: any) => r.url.toLowerCase() === repo?.url.toLowerCase() && r.relation === 'OWNED')
      if (!repo || !owned || !validIntegrationBranch(development_branch) || (release_branch && !validIntegrationBranch(release_branch)))
        return { content: [{ type: 'text', text: 'Branch policy must target an OWNED repository with valid Git ref names.' }], isError: true }
      if (isRetiredSourceBranch(parsed.retired_branches, repo.url, development_branch) ||
          isRetiredSourceBranch(parsed.retired_branches, repo.url, release_branch))
        return { content: [{ type: 'text', text: 'BRANCH_RETIRED: a retired source branch cannot be selected as Development or Release Branch.' }], isError: true }
      const policies = parsed.branch_policies.map((p: any) => p.repository_url.toLowerCase() === repo.url.toLowerCase()
        ? { ...p, development_branch, release_branch: release_branch ?? null } : p)
      const header = project_manifest_text.split('\n')
      const frontEnd = header.indexOf('---', 1)
      if (frontEnd < 0) return { content: [{ type: 'text', text: 'Malformed Project front matter.' }], isError: true }
      // Keep one canonical branch mapping section; root fields are PRIMARY convenience only.
      let next = project_manifest_text.replace(/\n## Branch Policy[^\n]*\n[\s\S]*?(?=\n## |$)/, '')
      const primary = policies.find((p: any) => p.repository_url.toLowerCase() === parsed.primary_repo_url.toLowerCase())
      const lines = next.split('\n').filter((line: string) => !/^(development_branch|release_branch|integration_target|branch_policy_owner):/.test(line))
      const yamlEnd = lines.indexOf('---', 1)
      if (yamlEnd < 0) return { content: [{ type: 'text', text: 'Malformed Project front matter.' }], isError: true }
      lines.splice(yamlEnd, 0,
        'development_branch: ' + (primary?.development_branch ?? ''),
        'release_branch: ' + (primary?.release_branch ?? ''),
        'integration_target: ' + (primary?.development_branch ?? ''),
        'branch_policy_owner: HUMAN_CONFIRMED')
      next = lines.join('\n').trimEnd() +
        '\n\n## Branch Policy (Human-approved)\n' +
        policies.map((p: any) => {
          const entry = parsed.repositories.find((r: any) => r.url.toLowerCase() === p.repository_url.toLowerCase())
          if (!entry) throw new Error('Branch policy references an unregistered repository.')
          return '- ' + entry.role + ' | ' + p.repository_url + ' | development=' + (p.development_branch ?? '') +
            ' | release=' + (p.release_branch ?? '')
        }).join('\n') + '\n'
      const out = {
        memory_path, expected_sha: project_manifest_sha,
        repository_url: repo.url, development_branch, release_branch: release_branch ?? null,
        updated_manifest_text: next,
        external_steps: [
          'Verify this PROJECT.md was freshly fetched from the configured Memory Repo and SHA matches expected_sha; an input manifest/SHA is not trustworthy without GitHub readback.',
          'Verify the selected source repository belongs to this Project and both nonempty configured Git branches exist on live GitHub; never infer default/main.',
          'Verify Human actually approved this exact repo+branch change, not merely caller-supplied human_confirmed; reconcile affected active Jobs before switching integration target.',
          'Call authorize_project_scope(MUTATE_MEMORY) and authorize_memory_mutation(update) for this exact Project path.',
          'GitHub Memory Repo: update_file with expected_sha (CAS), then independently fetch/readback and compare exact selected branch policy.',
          'Never merge, deploy or write source merely because this configuration was prepared.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )
}
