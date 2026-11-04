// GSA4 A0-R: relationship_knowledge_prepare registration extracted from run-execution-tools.ts.
export function registerRelationshipKnowledge(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, uuidv7, knowledgePath } = deps
  server.registerTool(
    'relationship_knowledge_prepare',
    {
      title: 'Prepare durable Project relationship knowledge',
      description: 'Prepare an existing KNOWLEDGE/ ARCHITECTURE_NOTE artifact for repo/subsystem relationship direction and reread conditions. This does not create a new record family.',
      inputSchema: {
        project_id: z.string().uuid(),
        title: z.string().min(1),
        source: z.string().min(1),
        target: z.string().min(1),
        relationship: z.string().min(1),
        precedence: z.string().min(1),
        reason: z.string().min(1),
        evidence: z.array(z.string()).default([]),
        reread_condition: z.string().min(1),
        depends_on: z.array(z.string()).default([]),
        approved_by_or_source: z.string().min(1),
      },
      outputSchema: {
        knowledge_id: z.string(),
        memory_path: z.string(),
        knowledge_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, title, source, target, relationship, precedence, reason, evidence, reread_condition, depends_on, approved_by_or_source }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare relationship knowledge.')
      const knowledgeId = uuidv7()
      const now = new Date().toISOString()
      const body = [
        '---',
        'knowledge_id: ' + knowledgeId,
        'project_id: ' + project_id,
        'kind: ARCHITECTURE_NOTE',
        'title: ' + JSON.stringify(title),
        'revision: 1',
        'validity: CURRENT',
        'depends_on: ' + JSON.stringify(depends_on ?? []),
        'approved_by_or_source: ' + JSON.stringify(approved_by_or_source),
        'updated_at: ' + now,
        '---',
        '',
        '# ' + title,
        '',
        '## Relationship',
        '- source: ' + source,
        '- target: ' + target,
        '- relationship: ' + relationship,
        '- precedence: ' + precedence,
        '',
        '## Reason',
        reason,
        '',
        '## Evidence',
        ...((evidence ?? []).length ? (evidence ?? []).map((x: string) => '- ' + x) : ['- none recorded']),
        '',
        '## Reread condition',
        reread_condition,
        '',
      ].join('\n')
      const path = knowledgePath(project_id, knowledgeId, title)
      const out = {
        knowledge_id: knowledgeId,
        memory_path: path,
        knowledge_record_text: body,
        external_steps: [
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist knowledge_record_text at memory_path in the configured Memory Repo.',
          'Read back the Knowledge artifact before treating the relationship as durable Project memory.',
          'When the reread condition becomes true, re-read the current source-of-truth side before downstream planning or implementation.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )
}
