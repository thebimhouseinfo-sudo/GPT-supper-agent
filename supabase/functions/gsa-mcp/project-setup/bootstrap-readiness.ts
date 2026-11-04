// GSA4 A0-P: original project_bootstrap_readiness_prepare registration, relocated without handler changes.
export function registerProjectBootstrapReadinessPrepare(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, projectBootstrapReadinessDecision, CRITERIA_BINDING_SCHEMA } = deps
  server.registerTool(
    'project_bootstrap_readiness_prepare',
    {
      title: 'Evaluate Project Bootstrap prerequisites without authorizing code',
      description: 'C30 PREPARE ONLY: assess approved Criteria, reviewed Plan, aligned Milestones and next-Task Coder/Tester readiness. Existing reviewed source Plan is usable without duplicate PROJECT_PLAN Job; Proposal is not an extra Bootstrap gate. Independently verify evidence; never authorizes source writes.',
      inputSchema: {
        project_id: z.string().uuid(),
        criteria: CRITERIA_BINDING_SCHEMA.optional(),
        criteria_human_approved: z.boolean().default(false),
        criteria_current_blob_sha: z.string().optional(),
        plan: z.any().optional(),
        // Minimal four-part assessment; existing legacy Plan-shaped input remains supported.
        assessment: z.object({
          criteria: z.string(), plan: z.string(), milestones: z.string(),
          coder: z.string(), tester: z.string(),
        }).optional(),
        capabilities: z.array(z.any()).default([]),
        human_execution_approved: z.boolean().default(false),
      },
      outputSchema: {
        status: z.string(), detail: z.string(), bootstrapped: z.literal(false),
        source_write_authorized: z.literal(false), requires_external_readback: z.literal(true),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, criteria, criteria_human_approved, criteria_current_blob_sha, plan, assessment, capabilities, human_execution_approved }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Project Bootstrap readiness.')
      const prepared = projectBootstrapReadinessDecision(project_id, {
        criteria, criteria_human_approved, criteria_current_blob_sha, plan, assessment, capabilities, human_execution_approved,
      })
      const out = { ...prepared, external_steps: [
        'Read existing Criteria from source repository or Project Memory. If already Human-approved, reuse without duplication or Advisor. Draft/approve only when missing or inadequate.',
        'Independently review the existing or new Plan against Criteria. Do not demand a duplicate PROJECT_PLAN Job, SHA binding or topology registration solely for Bootstrap.',
        'Check that existing Milestones align with the reviewed Plan and form an actionable implementation sequence.',
        'Assess Coder/Tester skills and actual development/test access for the NEXT actionable Task(s), not all future milestones. An unimplemented product feature is not missing implementer skill; genuine missing next-Task capability remains NOT READY.',
        'Only after actual prerequisites can an authorized GSA consequential dispatch/write apply M5 guard and separately verify Human execution approval; this tool never permits code.',
        'After the four checks reach READY, proceed to normal planned work with existing Human execution approval and source-scope safeguards. Do not repeat Bootstrap per Task.',
      ] }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )
}
