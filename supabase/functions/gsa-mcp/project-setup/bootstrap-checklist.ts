// GSA4 A0-P: original project_bootstrap_checklist_prepare registration, relocated without handler changes.
export function registerProjectBootstrapChecklistPrepare(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, projectBootstrapChecklistDecision } = deps
  server.registerTool(
    'project_bootstrap_checklist_prepare',
    {
      title: 'Continue the five-item autonomous Bootstrap checklist',
      description: 'PREPARE ONLY: select the NEXT Bootstrap action, not another gate. Inspect original Criteria/Plan/Milestones/Technical Proposal/capabilities, skip completed work, run Plan/Milestone CRL autonomously and ask Human only for genuine unresolved product decisions or irreconcilable sources. No Job/metadata registration or write authorization. Pass previous_attempt to detect non-progress; bare PASS without observations triggers ordinary verification Task.',
      inputSchema: {
        project_context: z.enum(['GREENFIELD','BROWNFIELD']),
        checklist: z.object({
          criteria: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
          plan: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
          milestones: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
          technical_proposal: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
          capabilities: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
        }).default({}),
        criteria_intake: z.object({
          existing_approved: z.boolean().optional(),
          human_update_choice: z.enum(['NOT_ASKED','KEEP','UPDATE','NOT_APPLICABLE']).optional(),
          revision_completed: z.boolean().optional(),
        }).optional(),
        previous_attempt: z.object({ action: z.string(), signature: z.string() }).optional(),
        conflicts: z.array(z.object({
          item: z.enum(['criteria','plan','milestones','technical_proposal','capabilities']),
          candidates: z.array(z.string()).min(2),
          unresolved: z.boolean(),
          investigated: z.boolean(),
          question: z.string().optional(),
        })).default([]),
      },
      outputSchema: {
        checklist: z.array(z.any()), completed: z.number(), total: z.number(),
        status: z.string(), next_item: z.string().nullable(), next_action: z.string(),
        next_owner: z.string(), instruction: z.string(), human_question: z.string().nullable(),
        continue_same_turn: z.boolean(), progress_signature: z.string(), assessment_only: z.literal(true),
        source_write_authorized: z.literal(false), requires_external_readback: z.literal(true),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Bootstrap checklist.')
      const decision = projectBootstrapChecklistDecision(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )
}
