import { parseProjectManifest, validProjectManifestPath } from '../project-manifest-scope.ts'
import { parseWorkingBranchRows, workingBranchTransitionError } from '../branch-governance.ts'
import { normalizeGithubRepo } from '../platform-utils.ts'

function replaceBranchRow(text: string, next: any, updating: boolean): string | null {
  const lines = text.split('\n')
  const marker = lines.findIndex(s => s === '## Working Branches')
  if (marker < 0) {
    if (updating) return null
    return text.trimEnd() + '\n\n## Working Branches\n- ' + JSON.stringify(next) + '\n'
  }
  let end = marker + 1
  while (end < lines.length && !lines[end].startsWith('## ')) end++
  if (updating) {
    for (let i = marker + 1; i < end; i++) {
      if (!/^\s*-\s*/.test(lines[i])) continue
      let entry: any
      try { entry = JSON.parse(lines[i].replace(/^\s*-\s*/, '')) } catch { return null }
      if (entry?.repository_url === next.repository_url && entry?.branch === next.branch) {
        lines[i] = '- ' + JSON.stringify(next)
        return lines.join('\n')
      }
    }
    return null
  }
  lines.splice(end, 0, '- ' + JSON.stringify(next))
  return lines.join('\n')
}

// PREPARE ONLY. GitHub branch creation, Job authority, CAS Project Memory
// persistence, exact HEAD/ref checks and deletion are distinct operations.
export function registerWorkingBranchTools(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError } = deps
  server.registerTool(
    'working_branch_prepare',
    {
      title: 'Prepare task-owned Working Branch registration/transition',
      description: 'PREPARE ONLY: add or transition a Working Branch record in the existing Project Manifest. No source mutation, branch creation, merge, deletion or deployment occurs.',
      inputSchema: {
        project_id: z.string().uuid(),
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().regex(/^[a-f0-9]{40}$/),
        action: z.enum(['REGISTER','TRANSITION']),
        branch_record: z.any(),
      },
      outputSchema: {
        memory_path: z.string(),
        expected_sha: z.string(),
        updated_manifest_text: z.string(),
        branch: z.string(),
        status: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, memory_path, project_manifest_text, project_manifest_sha, action, branch_record }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare Working Branch update.')
      const project = parseProjectManifest(project_manifest_text)
      if (!project || project.project_id !== project_id || project.lifecycle !== 'ACTIVE' ||
          !validProjectManifestPath(memory_path, project_id))
        return { content: [{ type: 'text', text: 'WORKING_BRANCH_PROJECT_INVALID: exact ACTIVE Project Manifest/path required.' }], isError: true }
      const candidates = parseWorkingBranchRows('## Working Branches\n- ' + JSON.stringify(branch_record))
      if (!candidates || candidates.length !== 1)
        return { content: [{ type: 'text', text: 'WORKING_BRANCH_RECORD_INVALID: incomplete or malformed branch contract.' }], isError: true }
      const next = candidates[0]
      const repo = normalizeGithubRepo(next.repository_url)
      const policy = project.branch_policies.find(p => p.repository_url === repo?.url)
      if (next.project_id !== project_id || !policy || policy.status !== 'CONFIGURED' ||
          !policy.development_branch ||
          !project.repositories.some(r => r.url === repo?.url && r.relation === 'OWNED') ||
          next.branch === policy.development_branch || next.branch === policy.release_branch ||
          next.parent_development_branch !== policy.development_branch ||
          next.integration_target !== policy.development_branch ||
          next.release_branch !== policy.release_branch ||
          project.retired_branches.some(r => r.repository_url === repo?.url && r.branch === next.branch))
        return { content: [{ type: 'text', text: 'WORKING_BRANCH_SCOPE_INVALID: branch must belong to an OWNED Project repo and current Development/Release policy.' }], isError: true }
      const existing = project.working_branches.find(b =>
        b.repository_url === next.repository_url && b.branch === next.branch)
      if (action === 'REGISTER' ? Boolean(existing) || next.status !== 'PROPOSED' :
          !existing || Boolean(workingBranchTransitionError(existing, next)))
        return { content: [{ type: 'text', text: action === 'REGISTER'
          ? 'WORKING_BRANCH_DUPLICATE_OR_STATUS_INVALID: registration begins PROPOSED.'
          : 'WORKING_BRANCH_TRANSITION_INVALID: missing registered branch or invalid lifecycle/evidence.' }], isError: true }
      const updated = replaceBranchRow(project_manifest_text, next, action === 'TRANSITION')
      if (!updated || !parseProjectManifest(updated))
        return { content: [{ type: 'text', text: 'WORKING_BRANCH_MANIFEST_INVALID: proposed record cannot be serialized safely.' }], isError: true }
      const out = {
        memory_path, expected_sha: project_manifest_sha, updated_manifest_text: updated,
        branch: next.branch, status: next.status,
        external_steps: [
          'Independently fetch PROJECT.md from configured Memory Repo and confirm its exact current blob SHA before persistence; this prepare response is not a saved record.',
          'Check the owning Job/Task and dependency DAG against the exact reviewed Job revision; verify the development and release branch policy. No additional Human approval is invented for individual branches.',
          'For AUTHORIZED/ACTIVE check current GitHub ref, base SHA, task authorization and source scope; never infer a branch is live from a Manifest row.',
          'For MERGED/RETIRED/CLOSED independently verify final source/target SHAs, review/CI, handoff, disposition, dependent Tasks and physical Git ref state. Honor Human KEEP decisions.',
          'Call authorize_project_scope(MUTATE_MEMORY) and authorize_memory_mutation(update), then GitHub update_file with exact blob SHA (CAS). Read back Project Manifest and the record; a prepared transition is not closure.',
          'Source writes, Development integration merge, Main release merge, Git ref deletion and deployment require their separate existing authorities.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )
}
