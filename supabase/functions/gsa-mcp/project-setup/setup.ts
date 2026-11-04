// GSA4 A0-P: original project_setup_prepare registration, relocated without handler changes.
export function registerProjectSetupPrepare(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, parseProjectManifest, validProjectManifestPath, resolveProjectCriteriaIntake } = deps
  server.registerTool(
    'project_setup_prepare',
    {
      title: 'Prepare minimal Project AGENTS and Criteria draft',
      description: 'Fresh Start/Adopt. PREPARE ONLY: create one generic AGENTS.md and one Criteria DRAFT in the active Project Memory. This does not approve Criteria, create a Job or change source.',
      inputSchema: {
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().regex(/^[0-9a-f]{40}$/),
        intake_mode: z.enum(['NEW','EXISTING']).default('NEW'),
        existing_criteria_state: z.enum(['PRESENT','ABSENT','UNKNOWN']).default('UNKNOWN'),
        observed_source_summary: z.string().optional(),
        source_criteria_drift: z.string().optional(),
        goal: z.string().optional(),
        use_class: z.enum(['PERSONAL','INTERNAL','COMMERCIAL','UNDECIDED']).default('UNDECIDED'),
        current_scale: z.string().optional(),
        committed_future_scale: z.string().optional(),
        environment: z.string().optional(),
        boundaries: z.array(z.string()).default([]),
      },
      outputSchema: {
        project_id: z.string(),
        agents_path: z.string(),
        criteria_path: z.string(),
        intake_disposition: z.enum(['CREATE_DRAFT_IF_ABSENT','READ_EXISTING_NO_WRITE','INSPECT_FIRST_NO_WRITE']),
        intake_review_text: z.string(),
        advisor_activation: z.literal('HUMAN_CRITERIA_INTENT_ONLY'),
        agents_template_text: z.string(),
        criteria_draft_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ memory_path, project_manifest_text, project_manifest_sha, intake_mode, existing_criteria_state, observed_source_summary, source_criteria_drift, goal, use_class, current_scale, committed_future_scale, environment, boundaries }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare Project setup.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed || !validProjectManifestPath(memory_path, parsed.project_id) || parsed.lifecycle !== 'ACTIVE') {
        return { content: [{ type: 'text', text: 'Fresh Start requires the exact ACTIVE Project manifest and canonical PROJECT.md path.' }], isError: true }
      }
      const safeLine = (v: any) => String(v || 'CHUA_CHOT').replace(/[\r\n]+/g, ' ').slice(0, 600)
      const intake = resolveProjectCriteriaIntake(intake_mode, existing_criteria_state, observed_source_summary ?? '')
      const root = 'projects/' + parsed.project_id + '/'
      const agentsPath = root + 'AGENTS.md'
      const criteriaPath = root + 'CRITERIA.md'
      const agentsTemplate = [
        '# GSA Project Agents — ' + safeLine(parsed.name), '',
        '> Generic GSA roles and security/approval rules always have precedence. This file declares only optional Project Coder/Tester domain add-ins; no duplicate global harness.', '',
        'Project ID: ' + parsed.project_id,
        'Source repository: ' + parsed.primary_repo_url,
        'Canonical Criteria: ' + criteriaPath, '',
        '## Coder Add-in (optional)',
        '- harness: none',
        '- skills: none', '',
        '## Tester Add-in (optional)',
        '- harness: none',
        '- skills: none', '',
        '## Policy',
        '- Optional add-in instructions must live inside this same Project Memory prefix.',
        '- Load add-ins lazily only for the matching role and Task; never at Project open.',
        '- Add-ins cannot override global GSA harness, Criteria, access rights, review/test evidence or Human approval.',
        '- Without add-ins Coder/Tester use generic skills, except when a Task explicitly needs domain-specific guidance.',
        '',
      ].join('\n')
      const criteriaDraft = intake.disposition === 'CREATE_DRAFT_IF_ABSENT' ? [
        '# Project Criteria — ' + safeLine(parsed.name), '',
        'Status: DRAFT (not Human-approved)',
        'Project ID: ' + parsed.project_id, '',
        '## GOAL',
        intake.source_derived ? 'CHUA_CHOT: source-derived product hypothesis; Human must confirm desired GOAL' : safeLine(goal), '',
        ...(intake.source_derived ? ['## Observed source (provisional; not product authority)', safeLine(observed_source_summary), '## Possible drift requiring Human decision', safeLine(source_criteria_drift), ''] : []),
        '## Product/use',
        'Use class: ' + use_class,
        'Current actual scale: ' + safeLine(current_scale),
        'Future scale actually committed by Human: ' + safeLine(committed_future_scale), '',
        '## Environment and trust boundaries',
        safeLine(environment), '',
        '## Constraints / intentionally not in scope',
        ...(boundaries?.length ? boundaries.map((x: any) => '- ' + safeLine(x)) : ['- CHUA_CHOT']), '',
        '## Acceptance',
        '- CHUA_CHOT: Planner must derive observable acceptance from Human GOAL.', '',
        '## Approval',
        'Human decision: PENDING',
        'Technical Advisor: INACTIVE until Human requests initial Criteria approval or material approved Criteria change.',
        'Advisor consultation: PENDING Human confirmation; no technical receipt required.',
        'Planner updates this SAME file on Human choice; do not auto-promote DRAFT, create Criteria V2 or infer approval from SHA.',
        '',
      ].join('\n') : ''
      const intakeReview = intake.review + (intake_mode === 'EXISTING' && source_criteria_drift ? ' Possible drift (provisional): ' + safeLine(source_criteria_drift) : '')
      const out = {
        project_id: parsed.project_id,
        agents_path: agentsPath,
        criteria_path: criteriaPath,
        intake_disposition: intake.disposition,
        intake_review_text: intakeReview,
        advisor_activation: 'HUMAN_CRITERIA_INTENT_ONLY' as const,
        agents_template_text: agentsTemplate,
        criteria_draft_text: criteriaDraft,
        external_steps: [
          'First re-read the exact PROJECT.md path from configured GitHub Memory Repo; SHA must match project_manifest_sha. This tool does not attest caller-provided manifest bytes.',
          'Independently read current canonical CRITERIA.md and source. Never trust caller-supplied ABSENT or source observations without checking GitHub; if Criteria exists, no setup Criteria write regardless of supplied state.',
          'Create AGENTS.md only when absent; create canonical Criteria DRAFT only if intake_disposition=CREATE_DRAFT_IF_ABSENT and GitHub independently confirms file absent. Each CREATE requires existing scope+memory authorization and exact readback. Otherwise do not write Criteria.',
          'For EXISTING with Criteria, inspect product-theory fit and compare actual source for achieved/missing/excess/drift; give Human a report, not an automatic Criteria edit. For EXISTING without Criteria, inspect source then draft a product hypothesis marked CHUA_CHOT; no code-derived approval.',
          'If Development Branch is unconfigured, Admin consults Human and prepares PROJECT.md branch configuration before dependent source writes; Project open/chat/discovery may continue.',
          'Before writing approved Criteria: activate Advisor only at Human first approval/material WHAT-WHY change, deliver technical tradeoffs, and ask Human to confirm they received consultation and APPROVE or KEEP. No ADVICE_REF, Advisor signature or proof reference. Normal Git SHA-CAS and Memory permissions remain.',
          'Advisor stays inactive during brainstorm, DRAFT, Plan, ordinary code and wording-only edits. After consultation Human acknowledgement is enough; Human decides; Planner only then performs authorized same-file CAS/readback.',
          'Project READY itself only reads metadata and never triggers Project setup writes or Job dispatch.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )
}
