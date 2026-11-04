// GSA4 A0-P: original project_criteria_advice_check registration, relocated without handler changes.
export function registerProjectCriteriaAdviceCheck(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, projectCriteriaAdvisoryDecision } = deps
  server.registerTool(
    'project_criteria_advice_check',
    {
      title: 'Check Human Advisor consultation acknowledgement for Criteria',
      description: 'C31 READ ONLY. Advisor only at Human initial Criteria approval/material WHAT-WHY change; Human acknowledgement + decision suffice, no technical receipt. Write authorization remains separate.',
      inputSchema: {
        project_id: z.string().uuid(),
        criteria_path: z.string().min(1),
        criteria_current_sha: z.string(),
        criteria_text: z.string(),
        intent: z.enum(['DISCUSSION','DRAFT_EDIT','PLAN_OR_TASK_CHANGE','HUMAN_KEEP_CRITERIA','INITIAL_APPROVAL','MATERIAL_CHANGE']),
        delta_scope: z.string().optional(),
        human_decision: z.enum(['PENDING','APPROVE','KEEP']).default('PENDING'),
        human_advisor_acknowledged: z.boolean().default(false),
      },
      outputSchema: {
        status: z.string(), advisor_required: z.boolean(),
        criteria_write_prepared: z.literal(false), external_advice_check_required: z.boolean(),
        receipt_format: z.string().nullable(), receipt_baseline_sha: z.string().nullable(), receipt_scope: z.string().nullable(),
        next_action: z.enum(['INVOKE_TECHNICAL_ADVISOR','CONTINUE_CRITERIA_WRITE','NONE']),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Criteria advice check.')
      const check = projectCriteriaAdvisoryDecision(input.project_id, input)
      const dispatchAdvisor = check.status === 'ADVISOR_CONSULTATION_REQUIRED'
      const acknowledged = check.status === 'HUMAN_ADVISOR_ACKNOWLEDGED'
      const out = { ...check,
        next_action: dispatchAdvisor ? 'INVOKE_TECHNICAL_ADVISOR' :
          acknowledged ? 'CONTINUE_CRITERIA_WRITE' : 'NONE',
        external_steps: dispatchAdvisor ? [
          'Planner MUST invoke Technical Advisor only at first Criteria approval or material WHAT-WHY change; explain feasibility, hidden costs, risks and simpler alternatives. Role admission alone is not delivered advice.',
          'Ask Human to confirm they received the advice and choose APPROVE or KEEP. Do not invent their acknowledgement, demand a message reference or ask again after an explicit confirmed choice.',
          'After actual Human acknowledgement, call this read-only check with human_advisor_acknowledged=true and their decision.',
        ] : acknowledged ? [
          'Human acknowledged advice and approved their Criteria decision. No Advisor receipt, message reference, signature or independent delivery proof required.',
          'This tool does not authorize writes. Verify the Human confirmation and approval; use existing authorize_project_scope, authorize_memory_mutation and GitHub SHA-CAS to update this SAME CRITERIA.md, then read back.',
        ] : [
          'Discussion, DRAFT, Plan/Task and Human KEEP do not trigger Advisor. If consultation was acknowledged but Human has not approved, await their decision; do not write Criteria.',
        ] }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )
}
