import { decisionFidelityError, DECISION_PREFIX } from './decision-fidelity.ts'
// GSA1-S6: Planning Reviewer record, preserving current verification and continuation contract.
export function registerPlanReviewRecordTool(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, PLANNING_LOOP_CONTINUATION_SCHEMA, jobExecutionContract, invalidExecutionContract, projectCriteriaBindingError, planningLoopContinuationDecision, prettyJson, verificationPath, recordPath, DEFAULT_NEXT_MEMORY_NAMESPACE, recordNextMemoryNamespace, validateExecutionTopology, validIntegrationBranch, validateNextPlanningModel, uuidv7 } = deps
  server.registerTool(
    'plan_review_record',
    {
      title: 'Record planning review for one exact Job revision',
      description: 'PREPARE ONLY: Reviewer planning Verification plus reviewed Job update. Persist/read back both; then in SAME USER TURN follow continuation: CHANGES_REQUIRED→Planner revise→Reviewer, PASS DRAFT→READY, PASS NEXT IN_PROGRESS→resume. Do not end after a review result.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        planning_revision: z.number().int().positive(),
        result: z.enum(['PASS','CHANGES_REQUIRED','HUMAN_REVIEW_REQUIRED','BLOCKED']),
        findings: z.array(z.object({
          severity: z.enum(['CRITICAL','IMPORTANT','MINOR']),
          finding: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          required_change: z.string().min(1),
        })).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        job_memory_path: z.string(),
        expected_job_sha: z.string(),
        reviewed_job_record_text: z.string(),
        next_role: z.string(),
        external_steps: z.array(z.string()),
        continuation: PLANNING_LOOP_CONTINUATION_SCHEMA,
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, job_record_sha, planning_revision, result, findings, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to record planning review.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(current)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(current)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      const reviewableLifecycle = current.lifecycle === 'DRAFT' || (executionContract === 'NEXT' && current.lifecycle === 'IN_PROGRESS')
      if (current.job_id !== job_id || current.project_id !== project_id || !reviewableLifecycle || current.planning_revision !== planning_revision) {
        return { content: [{ type: 'text', text: 'Planning review target does not match the current reviewable planning revision.' }], isError: true }
      }
      if (!(current.repository_discovery?.structure_evidence ?? []).length) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: repository structure evidence is required before planning review.' }], isError: true }
      }
      if (!current.planning_context?.job_sizing?.size || !(current.planning_context?.job_sizing?.context_boundary ?? []).length) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: V2 Job sizing and context boundary evidence are required before planning review.' }], isError: true }
      }
      if (!current.planning_context?.relationship_scan_summary) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: relationship mapping summary is required before planning review.' }], isError: true }
      }
      if (current.planning_context?.work_context === 'BROWNFIELD' && !(current.planning_context?.brownfield_logic_review ?? []).length) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: brownfield logic review evidence is required before planning review.' }], isError: true }
      }
      if (current.repository_context?.integration_branch &&
          !validIntegrationBranch(current.repository_context.integration_branch)) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: configured Job integration branch is malformed.' }], isError: true }
      }
      const criteriaErr = projectCriteriaBindingError(project_id, current.plan_kind ?? 'JOB', current.criteria_binding)
      if (criteriaErr) return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: ' + criteriaErr }], isError: true }
      if (executionContract === 'NEXT') {
        const executionTopologyError = validateExecutionTopology(current.tasks ?? [], current.topology ?? [])
        if (executionTopologyError) return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: ' + executionTopologyError }], isError: true }
      }
      const cp4PlanningError = validateNextPlanningModel(executionContract, current.tasks ?? [], {
        evidence_needs: current.evidence_needs ?? [],
        test_checkpoints: current.test_checkpoints ?? [],
        evidence_requirements: current.evidence_requirements ?? [],
        milestones: current.milestones ?? [],
        planning_topology: current.planning_topology ?? [],
      }, planning_revision)
      if (cp4PlanningError) return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: ' + cp4PlanningError }], isError: true }
      if (result === 'PASS') {
        const decisionError = decisionFidelityError(current)
        if (decisionError) return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: ' + decisionError }], isError: true }
      }
      if (result === 'PASS' && (findings ?? []).some((f: any) => ['CRITICAL','IMPORTANT'].includes(f.severity))) {
        return { content: [{ type: 'text', text: 'PASS cannot contain unresolved CRITICAL/IMPORTANT planning findings.' }], isError: true }
      }
      const verificationId = uuidv7()
      const verificationMemoryPath = verificationPath(project_id, verificationId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const verification = {
        verification_id: verificationId,
        kind: 'PLANNING_REVIEW',
        project_id,
        job_id,
        planning_revision,
        producer: 'reviewer',
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { memory_namespace: nextMemoryNamespace } : {}),
        result,
        findings: findings ?? [],
        limitations: limitations ?? [],
        repository_structure_evidence: current.repository_discovery.structure_evidence,
        selected_source_evidence: current.repository_discovery.selected_source_evidence ?? [],
        planning_context: current.planning_context ?? null,
        criteria_binding: current.criteria_binding ?? null,
        created_at: new Date().toISOString(),
      }
      const reviewedJob = {
        ...current,
        planning_review: {
          status: result,
          reviewed_revision: planning_revision,
          verification_ref: verificationMemoryPath,
        },
        updated_at: new Date().toISOString(),
      }
      const jobMemoryPath = recordPath(project_id, 'JOBS', job_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const continuation = planningLoopContinuationDecision('REVIEW_RECORDED', current.lifecycle, planning_revision, result)
      const nextRole = continuation.next_role
      const steps = [
        ...(current.repository_context?.integration_branch ? [
          'Reviewer verifies current Project Memory Development Branch for the working repository equals the bound Job integration_branch, and the live GitHub branch exists. No implicit main/default or cross-repo branch.',
        ] : []),
        ...(current.criteria_binding ? [
          'Reviewer independently fetches approved Criteria revision at exact configured path/blob SHA and compares Overall/Phase GOAL coverage before accepting a Project Plan. Historical source code alone is not Criteria approval.',
        ] : []),
        ...(result === 'PASS' ? [
          'Reviewer must discover the current authorized Project Memory DEC index even when the Job contains no DECISION_REF. Compare all applicable Human-accepted decisions and exceptions with the current Job/Phase/Milestone/Task; a missing reference or unresolved contradiction disallows PASS. Preserve readback proof.',
        ] : []),
        ...((current.repository_discovery?.selected_source_evidence ?? []).some((x: string) => x.startsWith(DECISION_PREFIX)) ? [
          'Reviewer independently reads exact original DEC source_sha/path, complete Human accepted method/rationale and all exceptions, and validates each existing relationship_assessment DECISION_COVERAGE edge against the full source; structural validation alone is not sufficient for PASS.',
        ] : []),
        'Persist verification_record_text first at verification_memory_path after authorize_memory_mutation(create).',
        'Fetch current Job and require blob SHA still equals expected_job_sha and planning_revision still matches.',
        'Read back persisted planning-review Verification by exact path/SHA and require project, Job, planning_revision and result match before changing Job.',
        'Update Job planning_review with reviewed_job_record_text using expected_job_sha exactly.',
        'Read back the updated Job and Verification; only then follow continuation.next_action_after_readback in the SAME USER TURN. A prepared or failed write does not activate next_role.',
      ]
      if (result === 'PASS') {
        steps.push(
          current.lifecycle === 'DRAFT'
            ? 'Immediately promote DRAFT→READY with job_transition using this planning-review Verification reference, then present the reviewed PASS plan to Human for explicit execution approval. Do not ask the user to manually request review.'
            : 'NEXT IN_PROGRESS superseding plan now has Reviewer PASS: present it for explicit Human execution approval and STOP. Do not automatically resume dispatch; old-revision claims/verifications remain non-applicable.',
        )
      } else if (result === 'CHANGES_REQUIRED') {
        steps.push(
          current.lifecycle === 'DRAFT'
            ? 'In this SAME USER TURN, switch to Planner with the findings. Revise the DRAFT Job using job_revise_plan, then immediately switch back to Reviewer. Do not report a final plan yet.'
            : 'In this SAME USER TURN, switch to Planner with the findings. Revise the superseding NEXT IN_PROGRESS plan, preserving its originating supersession evidence, then immediately switch back to Reviewer.',
        )
      } else if (result === 'HUMAN_REVIEW_REQUIRED') {
        steps.push(
          current.lifecycle === 'DRAFT'
            ? 'Pause only for the specific material Human decision; after Human resolution, Planner revises/persists and re-review is required.'
            : 'Pause only for the specific material Human decision; after resolution, Planner continues the same NEXT superseding planning-review loop without requiring a duplicate Tester gap finding.',
        )
      } else {
        steps.push('Report the concrete blocker because the planning-review loop cannot progress.')
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: verificationMemoryPath,
        verification_record_text: prettyJson(verification),
        job_memory_path: jobMemoryPath,
        expected_job_sha: job_record_sha,
        reviewed_job_record_text: prettyJson(reviewedJob),
        next_role: nextRole,
        external_steps: steps,
        continuation,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
