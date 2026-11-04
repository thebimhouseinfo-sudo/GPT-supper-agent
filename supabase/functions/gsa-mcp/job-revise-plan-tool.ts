import { decisionFidelityError, decisionRevisionError } from './decision-fidelity.ts'
// GSA1-S6: Job revision, preserving exact handler and validation semantics.
export function registerJobRevisePlanTool(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, CRITERIA_BINDING_SCHEMA, PLANNING_LOOP_CONTINUATION_SCHEMA, EVIDENCE_NEED_SCHEMA, TEST_CHECKPOINT_SPEC_SCHEMA, EVIDENCE_REQUIREMENT_SCHEMA, MILESTONE_SCHEMA, PLANNING_TOPOLOGY_NODE_SCHEMA, projectCriteriaBindingError, normalizeNextPlanningModel, validateNextPlanningModel, validateExecutionTopology, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, prettyJson, planningLoopContinuationDecision, revisedJobIntegrationBranchError, recordPath, DEFAULT_NEXT_MEMORY_NAMESPACE, nextPlanSupersessionMatches } = deps
  server.registerTool(
    'job_revise_plan',
    {
      title: 'Revise a GSA Job plan',
      description: 'PREPARE ONLY: exact-SHA Planner plan revision. Persist/read back revised Job, then immediately re-run role-isolated planning Reviewer in SAME USER TURN. NEXT IN_PROGRESS supersession still requires originating Tester evidence.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        objective: z.string().min(1).optional(),
        scope: z.array(z.string()).optional(),
        non_goals: z.array(z.string()).optional(),
        work_context: z.enum(['NEW','BROWNFIELD']).optional(),
        phase: z.string().min(1).optional(),
        milestone: z.string().min(1).optional(),
        relationship_scan_summary: z.string().min(1).optional(),
        job_sizing: z.object({
          size: z.enum(['SMALL','MEDIUM','LARGE']),
          rationale: z.string().min(1),
          bounded_causal_chain: z.string().min(1),
          context_boundary: z.array(z.string()).min(1),
          independently_meaningful_completion: z.string().min(1),
          split_or_keep_reason: z.string().min(1),
        }).optional(),
        brownfield_logic_review: z.array(z.object({
          target: z.string().min(1),
          classification: z.enum(['CANONICAL','LEGACY','ACCIDENTAL','INCORRECT','UNKNOWN']),
          evidence: z.array(z.string()).min(1),
          implication: z.string().min(1),
        })).optional(),
        relationship_assessment: z.array(z.object({
          source: z.string().min(1),
          target: z.string().min(1),
          relationship: z.string().min(1),
          precedence: z.string().min(1),
          reason: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          reread_condition: z.string().min(1),
        })).optional(),
        repository_structure_evidence: z.array(z.string()).optional(),
        selected_source_evidence: z.array(z.string()).optional(),
        tasks: z.array(z.any()).optional(),
        topology: z.array(z.any()).optional(),
        evidence_needs: z.array(EVIDENCE_NEED_SCHEMA).optional(),
        test_checkpoints: z.array(TEST_CHECKPOINT_SPEC_SCHEMA).optional(),
        evidence_requirements: z.array(EVIDENCE_REQUIREMENT_SCHEMA).optional(),
        milestones: z.array(MILESTONE_SCHEMA).optional(),
        planning_topology: z.array(PLANNING_TOPOLOGY_NODE_SCHEMA).optional(),
        completion_requirements: z.array(z.string()).optional(),
        verification_requirements: z.array(z.string()).optional(),
        review_triggers: z.array(z.string()).optional(),
        criteria_binding: CRITERIA_BINDING_SCHEMA.optional(),
        integration_branch: z.string().optional(),
        revision_reason: z.string().min(1),
        superseding_verification_record_text: z.string().min(2).optional(),
        superseding_verification_ref: z.string().min(1).optional(),
        superseding_claim_record_text: z.string().min(2).optional(),
        superseding_claim_record_sha: z.string().min(7).optional(),
      },
      outputSchema: {
        memory_path: z.string(),
        expected_job_sha: z.string(),
        next_job_record_text: z.string(),
        planning_revision: z.number(),
        external_steps: z.array(z.string()),
        continuation: PLANNING_LOOP_CONTINUATION_SCHEMA,
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, job_record_sha, objective, scope, non_goals, work_context, phase, milestone, relationship_scan_summary, job_sizing, brownfield_logic_review, relationship_assessment, repository_structure_evidence, selected_source_evidence, tasks, topology, evidence_needs, test_checkpoints, evidence_requirements, milestones, planning_topology, completion_requirements, verification_requirements, review_triggers, criteria_binding, integration_branch, revision_reason, superseding_verification_record_text, superseding_verification_ref, superseding_claim_record_text, superseding_claim_record_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to revise a Job plan.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      if (current.plan_change_pending) {
        return { content:[{type:'text',text:'PLAN_CHANGE_PENDING_FENCE: revise the successor Plan, not a fenced Job.'}],isError:true }
      }
      const executionContract = jobExecutionContract(current)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(current)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'NEXT_JOB_NAMESPACE_INVALID: current Job memory_namespace is invalid.' }], isError: true }
      }
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Job identity mismatch.' }], isError: true }
      }
      const inProgressNextRevision = executionContract === 'NEXT' && current.lifecycle === 'IN_PROGRESS'
      const inProgressReviewRepair =
        inProgressNextRevision &&
        ['CHANGES_REQUIRED','HUMAN_REVIEW_REQUIRED'].includes(current.planning_review?.status) &&
        Boolean(current.superseding_verification_ref)
      const inProgressGapSupersession = inProgressNextRevision && !inProgressReviewRepair
      if (current.lifecycle !== 'DRAFT' && !inProgressNextRevision) {
        return { content: [{ type: 'text', text: 'Planner revision is allowed only for DRAFT Jobs or NEXT IN_PROGRESS supersession/review repair.' }], isError: true }
      }
      let supersedingVerification: any = null
      let supersedingClaim: any = null
      if (inProgressGapSupersession) {
        if (!superseding_verification_record_text || !superseding_verification_ref || !superseding_claim_record_text || !superseding_claim_record_sha) {
          return { content: [{ type: 'text', text: 'NEXT_PLAN_SUPERSESSION_REJECTED: first IN_PROGRESS supersession requires persisted PLAN_GAP/SPEC_GAP Verification plus its terminal checkpoint claim.' }], isError: true }
        }
        try {
          supersedingVerification = JSON.parse(superseding_verification_record_text)
          supersedingClaim = JSON.parse(superseding_claim_record_text)
        } catch {
          return { content: [{ type: 'text', text: 'NEXT_PLAN_SUPERSESSION_REJECTED: invalid superseding Verification/claim JSON.' }], isError: true }
        }
        const supersessionMatches = nextPlanSupersessionMatches(
          current,
          supersedingVerification,
          superseding_verification_ref,
          supersedingClaim,
          project_id,
          job_id,
        )
        if (!supersessionMatches) {
          return { content: [{ type: 'text', text: 'NEXT_PLAN_SUPERSESSION_REJECTED: Verification must be the current terminal PLAN_GAP/SPEC_GAP claim result for this planning revision.' }], isError: true }
        }
      } else if (inProgressReviewRepair && !current.superseding_verification_ref) {
        return { content: [{ type: 'text', text: 'NEXT_PLAN_SUPERSESSION_REJECTED: review-repair revision has no originating supersession evidence.' }], isError: true }
      }
      if (executionContract === 'NEXT' && tasks !== undefined && topology === undefined) {
        return { content: [{ type: 'text', text: 'NEXT_EXECUTION_TOPOLOGY_REBIND_REQUIRED: revising Tasks must resupply execution topology for the same planning revision.' }], isError: true }
      }
      const effectiveCriteria = criteria_binding ?? current.criteria_binding
      const criteriaErr = projectCriteriaBindingError(project_id, current.plan_kind ?? 'JOB', effectiveCriteria)
      if (criteriaErr) return { content: [{ type: 'text', text: criteriaErr }], isError: true }
      if (effectiveCriteria && projectCriteriaBindingError(project_id, 'PROJECT_PLAN', effectiveCriteria)) {
        return { content: [{ type: 'text', text: 'Current Criteria binding is malformed or belongs to another Project.' }], isError: true }
      }
      const branchError = revisedJobIntegrationBranchError(current, executionContract, integration_branch)
      if (branchError) return { content: [{ type: 'text', text: branchError }], isError: true }
      const effectiveIntegrationBranch = integration_branch === undefined ? current.repository_context?.integration_branch ?? null : integration_branch
      const nextRevision = Number(current.planning_revision ?? 0) + 1
      const hasCurrentNextPlanning = ['evidence_needs','test_checkpoints','evidence_requirements','milestones','planning_topology'].some((key) => (current[key] ?? []).length)
      const allNextPlanningSupplied = evidence_needs !== undefined && test_checkpoints !== undefined && evidence_requirements !== undefined && milestones !== undefined && planning_topology !== undefined
      if (executionContract === 'NEXT' && hasCurrentNextPlanning && !allNextPlanningSupplied) {
        return { content: [{ type: 'text', text: 'NEXT_PLANNING_REBIND_REQUIRED: every revision of a NEXT Job with active CP4 planning must explicitly resupply all CP4 planning collections for the new planning_revision.' }], isError: true }
      }
      const nextTasks = tasks ?? current.tasks
      const nextTopology = topology ?? current.topology
      const executionTopologyError = executionContract === 'NEXT' ? validateExecutionTopology(nextTasks ?? [], nextTopology ?? []) : null
      if (executionTopologyError) return { content: [{ type: 'text', text: executionTopologyError }], isError: true }
      const nextPlanning = normalizeNextPlanningModel({
        evidence_needs: evidence_needs ?? current.evidence_needs ?? [],
        test_checkpoints: test_checkpoints ?? current.test_checkpoints ?? [],
        evidence_requirements: evidence_requirements ?? current.evidence_requirements ?? [],
        milestones: milestones ?? current.milestones ?? [],
        planning_topology: planning_topology ?? current.planning_topology ?? [],
      }, nextRevision)
      const nextPlanningError = validateNextPlanningModel(executionContract, nextTasks, nextPlanning, nextRevision)
      if (nextPlanningError) return { content: [{ type: 'text', text: nextPlanningError }], isError: true }
      const next = {
        ...current,
        criteria_binding: effectiveCriteria ?? null,
        repository_context: {
          ...current.repository_context,
          integration_branch: effectiveIntegrationBranch,
        },
        objective: objective ?? current.objective,
        scope: scope ?? current.scope,
        non_goals: non_goals ?? current.non_goals,
        planning_context: {
          work_context: work_context ?? current.planning_context?.work_context ?? 'NEW',
          phase: phase ?? current.planning_context?.phase ?? 'UNSPECIFIED',
          milestone: milestone ?? current.planning_context?.milestone ?? 'UNSPECIFIED',
          relationship_scan_summary: relationship_scan_summary ?? current.planning_context?.relationship_scan_summary ?? 'UNSPECIFIED',
          job_sizing: job_sizing ?? current.planning_context?.job_sizing ?? null,
          brownfield_logic_review: brownfield_logic_review ?? current.planning_context?.brownfield_logic_review ?? [],
          relationship_assessment: relationship_assessment ?? current.planning_context?.relationship_assessment ?? [],
        },
        repository_discovery: {
          structure_evidence: repository_structure_evidence ?? current.repository_discovery?.structure_evidence ?? [],
          selected_source_evidence: selected_source_evidence ?? current.repository_discovery?.selected_source_evidence ?? [],
        },
        tasks: nextTasks,
        topology: nextTopology,
        evidence_needs: nextPlanning.evidence_needs,
        test_checkpoints: nextPlanning.test_checkpoints,
        evidence_requirements: nextPlanning.evidence_requirements,
        milestones: nextPlanning.milestones,
        planning_topology: nextPlanning.planning_topology,
        completion_requirements: completion_requirements ?? current.completion_requirements,
        verification_requirements: verification_requirements ?? current.verification_requirements,
        review_triggers: review_triggers ?? current.review_triggers,
        planning_revision: nextRevision,
        planning_review: { status: 'PENDING', reviewed_revision: null, verification_ref: null },
        supersedes_planning_revision: inProgressNextRevision ? current.planning_revision : current.supersedes_planning_revision ?? null,
        superseding_verification_ref: inProgressGapSupersession ? superseding_verification_ref : current.superseding_verification_ref ?? null,
        superseding_claim_sha: inProgressGapSupersession ? superseding_claim_record_sha : current.superseding_claim_sha ?? null,
        last_planning_revision_reason: revision_reason,
        updated_at: new Date().toISOString(),
      }
      const revisionDecisionError = decisionRevisionError(current, next)
      if (revisionDecisionError) return { content: [{ type: 'text', text: revisionDecisionError }], isError: true }
      const decisionError = decisionFidelityError(next)
      if (decisionError) return { content: [{ type: 'text', text: decisionError }], isError: true }
      const memoryPath = recordPath(project_id, 'JOBS', job_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const out = {
        memory_path: memoryPath,
        expected_job_sha: job_record_sha,
        next_job_record_text: prettyJson(next),
        planning_revision: nextRevision,
        continuation: planningLoopContinuationDecision('PLAN_REVISED', next.lifecycle, nextRevision),
        external_steps: [
          ...(effectiveIntegrationBranch ? [
            'C14A branch binding: independently re-read exact current PROJECT.md. Verify the selected working repository is OWNED and its Human-configured Development Branch equals repository_context.integration_branch=' + effectiveIntegrationBranch + '; reject implicit main/default, wrong repository or unconfigured policy.',
            'C14A branch binding: verify live GitHub branch ' + effectiveIntegrationBranch + ' exists in the exact selected working repository before any Job Memory mutation.',
          ] : []),
          'Fetch current Job immediately before update and require blob SHA equals expected_job_sha.',
          'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=memory_path).',
          'Update Job with next_job_record_text using expected_job_sha exactly; stale SHA requires refetch/reconcile.',
          'Read back the Job and verify the incremented planning_revision plus planning_review=PENDING, and repository_context.integration_branch equals the independently confirmed Development Branch (no fallback).',
          inProgressNextRevision
            ? 'The Job remains IN_PROGRESS but all further NEXT dispatch/checkpoint claims are blocked until Reviewer PASS binds to this exact superseding planning_revision. For first runtime supersession, read back the originating Verification and terminal claim (exact claim SHA) before updating the Job.'
            : 'The DRAFT Job remains non-executable until Reviewer PASS and READY transition.',
          'After the new plan revision is persisted and read back by exact SHA, follow continuation.next_action_after_readback=REVIEW_CURRENT_REVISION; load the role-isolated planning Reviewer in this SAME USER TURN (no Human request to continue).',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
