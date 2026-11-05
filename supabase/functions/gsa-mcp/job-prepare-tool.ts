import { decisionFidelityError, DECISION_PREFIX } from './decision-fidelity.ts'
// GSA1: Job creation tool retains original schema and handler.
export function registerJobPrepareTool(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, jobCreationExecutionContractDefault, CRITERIA_BINDING_SCHEMA, EVIDENCE_NEED_SCHEMA, TEST_CHECKPOINT_SPEC_SCHEMA, EVIDENCE_REQUIREMENT_SCHEMA, MILESTONE_SCHEMA, PLANNING_TOPOLOGY_NODE_SCHEMA, PLANNING_LOOP_CONTINUATION_SCHEMA, DEFAULT_NEXT_MEMORY_NAMESPACE, uuidv7, jobHandle, validIntegrationBranch, parseProjectManifest, projectCriteriaBindingError, planningLoopContinuationDecision, normalizeGithubRepo, renderHarness, jobExecutionContract, resolveExecutionContract, nextMemoryNamespaceForRequest, validateExecutionTopology, readMemoryConfig, invalidExecutionContract, cutoverInventoryError, executionMemoryRoot, normalizeNextPlanningModel, validateNextPlanningModel, recordPath, prettyJson } = deps
  server.registerTool(
    'job_prepare',
    {
      title: 'Prepare a durable GSA Job',
      description: 'PREPARE ONLY: create a DRAFT Job record, NOT planning completion. Caller must persist/read back the Job and follow continuation to planning Reviewer in the SAME USER TURN. NEXT supports revision-bound planning evidence; V2_STABLE keeps these collections empty.',
      inputSchema: {
        project_id: z.string().uuid(),
        type: z.enum(['plan','code','design','review']),
        objective: z.string().min(1),
        scope: z.array(z.string()).min(1),
        non_goals: z.array(z.string()).default([]),
        execution_contract: z.enum(['V2_STABLE','NEXT']).default(jobCreationExecutionContractDefault(req)),
        plan_kind: z.enum(['PROJECT_PLAN','JOB']).default('JOB'),
        integration_branch: z.string().optional(),
        criteria_binding: CRITERIA_BINDING_SCHEMA.optional(),
        work_context: z.enum(['NEW','BROWNFIELD']),
        phase: z.string().min(1),
        milestone: z.string().min(1),
        relationship_scan_summary: z.string().min(1),
        job_sizing: z.object({
          size: z.enum(['SMALL','MEDIUM','LARGE']),
          rationale: z.string().min(1),
          bounded_causal_chain: z.string().min(1),
          context_boundary: z.array(z.string()).min(1),
          independently_meaningful_completion: z.string().min(1),
          split_or_keep_reason: z.string().min(1),
        }),
        brownfield_logic_review: z.array(z.object({
          target: z.string().min(1),
          classification: z.enum(['CANONICAL','LEGACY','ACCIDENTAL','INCORRECT','UNKNOWN']),
          evidence: z.array(z.string()).min(1),
          implication: z.string().min(1),
        })).default([]),
        relationship_assessment: z.array(z.object({
          source: z.string().min(1),
          target: z.string().min(1),
          relationship: z.string().min(1),
          precedence: z.string().min(1),
          reason: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          reread_condition: z.string().min(1),
        })).default([]),
        repository_structure_evidence: z.array(z.string()).min(1),
        selected_source_evidence: z.array(z.string()).default([]),
        project_repository_mode: z.enum(['SINGLE','MULTI']),
        registered_repositories: z.array(z.string().url()).min(1),
        working_repository_url: z.string().url(),
        cross_repo_impact: z.array(z.object({
          repository_url: z.string().url(),
          impact: z.enum(['NONE','READ_ONLY_CONTRACT_CHECK','COORDINATED_CHANGE_REQUIRED','UNKNOWN']),
          reason: z.string().min(1),
        })).min(1),
        product_workflow: z.enum(['UI_FIRST','UX_FIRST']).optional(),
        temporary_ui: z.array(z.string()).default([]),
        collected_ui_requirements: z.array(z.string()).default([]),
        ui_update_pack_trigger: z.string().optional(),
        temporary_ui_human_approval: z.enum(['NOT_REQUIRED','REQUIRED_PENDING','APPROVED']).optional(),
        tasks: z.array(z.object({
          task_id: z.string().optional(),
          objective: z.string().min(1),
          scope: z.array(z.string()).default([]),
          dependencies: z.array(z.string()).default([]),
          required_skills: z.array(z.enum(['ui-coder-frontend'])).default([]),
          completion_criteria: z.array(z.string()).min(1),
          convergence_task: z.boolean().default(false),
          incoming_branches: z.array(z.string()).default([]),
        })).min(1),
        evidence_needs: z.array(EVIDENCE_NEED_SCHEMA).default([]),
        test_checkpoints: z.array(TEST_CHECKPOINT_SPEC_SCHEMA).default([]),
        evidence_requirements: z.array(EVIDENCE_REQUIREMENT_SCHEMA).default([]),
        milestones: z.array(MILESTONE_SCHEMA).default([]),
        planning_topology: z.array(PLANNING_TOPOLOGY_NODE_SCHEMA).default([]),
        completion_requirements: z.array(z.string()).min(1),
        verification_requirements: z.array(z.string()).default([]),
        review_triggers: z.array(z.string()).default([]),
        // Optional LLC58 replacement: only a durable reviewed Plan intent may
        // reserve a preallocated replacement Job ID.
        // U-B: fresh, non-1:1 topology after the entire reviewed scope is
        // settled. Reuse the immutable LLC58 intent, not another control plane.
        scope_change_context: z.object({
          intent_record_text: z.string().min(2),
          intent_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          intent_memory_path: z.string().min(1),
          reviewed_plan_sha: z.string().regex(/^[0-9a-f]{40}$/),
          successor_job_id: z.string().uuid(),
          retired_job_snapshots: z.array(z.object({
            job_record_text: z.string().min(2),
            job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          })).min(1),
        }).optional(),
        replacement_context: z.object({
          intent_record_text: z.string().min(2),
          intent_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          intent_memory_path: z.string().min(1),
          predecessor_job_record_text: z.string().min(2),
          predecessor_job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        }).optional(),
      },
      outputSchema: {
        job_id: z.string(),
        handle: z.string(),
        memory_path: z.string(),
        job_record_text: z.string(),
        external_steps: z.array(z.string()),
        continuation: PLANNING_LOOP_CONTINUATION_SCHEMA,
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, type, objective, scope, non_goals, execution_contract, plan_kind, criteria_binding, integration_branch, work_context, phase, milestone, relationship_scan_summary, job_sizing, brownfield_logic_review, relationship_assessment, repository_structure_evidence, selected_source_evidence, project_repository_mode, registered_repositories, working_repository_url, cross_repo_impact, product_workflow, temporary_ui, collected_ui_requirements, ui_update_pack_trigger, temporary_ui_human_approval, tasks, evidence_needs, test_checkpoints, evidence_requirements, milestones, planning_topology, completion_requirements, verification_requirements, review_triggers, replacement_context, scope_change_context }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare a Job.')
      const { data } = await readMemoryConfig(auth)
      if (!data?.memory_repo_full_name) return { content: [{ type: 'text', text: 'Memory Repo is not configured.' }], isError: true }
      const normalizedRegistered = (registered_repositories ?? []).map((u: string) => normalizeGithubRepo(u)?.url).filter(Boolean)
      const normalizedWorking = normalizeGithubRepo(working_repository_url)?.url
      if (!normalizedWorking || !normalizedRegistered.includes(normalizedWorking)) {
        return { content: [{ type: 'text', text: 'Working repository must be one of the registered Project repositories.' }], isError: true }
      }
      const impactUrls = new Set((cross_repo_impact ?? []).map((x: any) => normalizeGithubRepo(x.repository_url)?.url).filter(Boolean))
      const missingImpact = normalizedRegistered.filter((u: string) => !impactUrls.has(u))
      if (missingImpact.length) {
        return { content: [{ type: 'text', text: 'Cross-repo impact assessment must cover every registered repository: ' + missingImpact.join(', ') }], isError: true }
      }
      if (project_repository_mode === 'MULTI' && normalizedRegistered.length < 2) {
        return { content: [{ type: 'text', text: 'MULTI Project requires at least two registered repositories.' }], isError: true }
      }
      if (work_context === 'BROWNFIELD' && !(brownfield_logic_review ?? []).length) {
        return { content: [{ type: 'text', text: 'BROWNFIELD_PLANNING_INCOMPLETE: relevant existing logic review evidence is required before preparing the Job.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = executionContract === 'NEXT' ? nextMemoryNamespaceForRequest(req) : null
      if (executionContract === 'NEXT' && nextMemoryNamespace === 'PRODUCTION') {
        const cutoverError = cutoverInventoryError()
        if (cutoverError) return { content: [{ type: 'text', text: cutoverError }], isError: true }
      }
      let scopeNew: any = null
      if (scope_change_context) {
        if (replacement_context) return { content:[{type:'text',text:'SCOPE_CHANGE_AND_ONE_TO_ONE_REPLACEMENT_CONFLICT.'}],isError:true }
        let intent: any
        try { intent = JSON.parse(scope_change_context.intent_record_text) }
        catch { return { content:[{type:'text',text:'SCOPE_CHANGE_INTENT_JSON_INVALID.'}],isError:true } }
        const intentPath = executionMemoryRoot(project_id, intent?.execution_contract,
          intent?.memory_namespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) +
          '/WORK/PLAN_RECONCILIATIONS/' + intent?.change_id + '.json'
        const retireActions = Array.isArray(intent?.actions)
          ? intent.actions.filter((a: any) => a.decision === 'RETIRE') : []
        const valid = intent?.kind === 'PLAN_RECONCILIATION_INTENT' && intent.version === 1 &&
          intent.project_id === project_id && intent.scope_change &&
          intent.reviewed_plan_sha === scope_change_context.reviewed_plan_sha &&
          /^[0-9a-f]{40}$/.test(scope_change_context.intent_record_sha) &&
          scope_change_context.intent_memory_path === intentPath &&
          retireActions.length > 0 &&
          Array.isArray(intent.scope_change.successor_job_ids) &&
          intent.scope_change.successor_job_ids.includes(scope_change_context.successor_job_id) &&
          retireActions.length === scope_change_context.retired_job_snapshots.length
        if (!valid) return { content:[{type:'text',text:'SCOPE_CHANGE_REVIEWED_INTENT_OR_COMPLETE_RETIREMENT_REQUIRED.'}],isError:true }
        const olderIds = new Set<string>()
        const observed = new Set<string>()
        for (const snapshot of scope_change_context.retired_job_snapshots) {
          let old: any
          try { old = JSON.parse(snapshot.job_record_text) }
          catch { return {content:[{type:'text',text:'SCOPE_CHANGE_RETIRED_JOB_JSON_INVALID.'}],isError:true} }
          const action = retireActions.find((a: any) => a.predecessor_job_id === old.job_id)
          if (!action || observed.has(old.job_id) || old.project_id !== project_id ||
              old.lifecycle !== 'RETIRED' || old.result !== 'RETIRED' ||
              old.retired_by_plan_change_id !== intent.change_id ||
              !/^[0-9a-f]{40}$/.test(snapshot.job_record_sha) ||
              (action.retired_task_ids ?? []).some((id: string) =>
                !(old.tasks ?? []).some((t: any) => t.task_id === id && t.lifecycle === 'RETIRED')) ||
              (old.tasks ?? []).some((t: any) => !['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(t.lifecycle)) ||
              (old.milestones ?? []).some((m: any) => {
                const related = (old.tasks ?? []).filter((t: any) => (m.node_ids ?? []).includes(t.task_id))
                const done = related.length > 0
                  ? related.every((t: any) => t.lifecycle === 'COMPLETED')
                  : m.lifecycle === 'COMPLETED' || m.status === 'PASS' || m.result === 'PASS'
                return !done && m.lifecycle !== 'RETIRED'
              }))
            return {content:[{type:'text',text:'SCOPE_CHANGE_RETIREMENT_LINEAGE_OR_TASKS_INCOMPLETE.'}],isError:true}
          observed.add(old.job_id)
          olderIds.add(old.job_id)
          for (const task of old.tasks ?? []) olderIds.add(task.task_id)
          for (const milestone of old.milestones ?? []) olderIds.add(milestone.milestone_id)
          for (const node of old.planning_topology ?? []) olderIds.add(node.node_id)
        }
        const successorId = scope_change_context.successor_job_id
        const newIds = [
          successorId, ...(tasks ?? []).map((t: any) => t.task_id),
          ...(milestones ?? []).map((m: any) => m.milestone_id),
          ...(planning_topology ?? []).map((n: any) => n.node_id),
        ]
        if (!successorId || olderIds.has(successorId) ||
            (tasks ?? []).some((t: any) => !t.task_id) ||
            (milestones ?? []).length === 0 ||
            newIds.some((id: any) => !id || olderIds.has(id)))
          return {content:[{type:'text',text:'SCOPE_CHANGE_FRESH_JOB_TASK_MILESTONE_TOPOLOGY_IDS_REQUIRED.'}],isError:true}
        scopeNew = { intent, successorId, predecessors:[...observed] }
      }
      let replacement: any = null
      if (replacement_context) {
        let intent: any, predecessor: any
        try {
          intent = JSON.parse(replacement_context.intent_record_text)
          predecessor = JSON.parse(replacement_context.predecessor_job_record_text)
        } catch {
          return { content: [{ type: 'text', text: 'PLAN_REPLACEMENT_INVALID_RECORD: intent and predecessor must be valid JSON.' }], isError: true }
        }
        const sha = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
        const expectedPath = executionMemoryRoot(project_id, intent?.execution_contract,
          intent?.memory_namespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) +
          '/WORK/PLAN_RECONCILIATIONS/' + intent?.change_id + '.json'
        const matches = intent?.kind === 'PLAN_RECONCILIATION_INTENT' && intent.version === 1 &&
          intent.project_id === project_id &&
          intent.work_branch && intent.plan_job_id &&
          sha(replacement_context.intent_record_sha) &&
          replacement_context.intent_memory_path === expectedPath &&
          predecessor?.kind === 'JOB' && predecessor.project_id === project_id &&
          predecessor.lifecycle === 'SUPERSEDED' &&
          sha(replacement_context.predecessor_job_record_sha)
        const item = matches && Array.isArray(intent.actions) ? intent.actions.find((a: any) =>
          a.decision === 'REPLACE' && a.predecessor_job_id === predecessor.job_id &&
          a.replacement?.job_id && a.replacement?.handle === jobHandle(a.replacement.job_id)
        ) : null
        if (!item || item.predecessor_execution_contract !== jobExecutionContract(predecessor) ||
            predecessor.superseded_by_plan_change_id !== intent.change_id ||
            predecessor.superseded_by_replacement_job_id !== item.replacement.job_id) {
          return { content: [{ type: 'text', text: 'PLAN_REPLACEMENT_NOT_AUTHORIZED: requires exact reviewed intent and SUPERSEDED predecessor readback.' }], isError: true }
        }
        replacement = { intent, predecessor, item }
      }
      if (((type === 'code') || (plan_kind === 'PROJECT_PLAN')) &&
          resolveExecutionContract(execution_contract) === 'NEXT' &&
          !validIntegrationBranch(integration_branch)) {
        return { content: [{ type: 'text', text: 'DEVELOPMENT_BRANCH_REQUIRED: new NEXT code/Project Plans must bind the Human-configured Development Branch for the selected OWNED repository; read PROJECT.md, never infer default/main.' }], isError: true }
      }
      const criteriaError = projectCriteriaBindingError(project_id, plan_kind, criteria_binding)
      if (criteriaError) return { content: [{ type: 'text', text: criteriaError }], isError: true }
      if (criteria_binding && projectCriteriaBindingError(project_id, 'PROJECT_PLAN', criteria_binding)) {
        return { content: [{ type: 'text', text: 'Provided Criteria binding is invalid for this Project.' }], isError: true }
      }
      const jobId = scopeNew?.successorId ?? replacement?.item?.replacement?.job_id ?? uuidv7()
      const now = new Date().toISOString()
      const normalizedTasks = tasks.map((task: any) => ({
        task_id: task.task_id || uuidv7(),
        objective: task.objective,
        scope: task.scope ?? [],
        dependencies: task.dependencies ?? [],
        required_skills: task.required_skills ?? [],
        completion_criteria: task.completion_criteria,
        convergence_task: task.convergence_task === true,
        incoming_branches: task.incoming_branches ?? [],
        lifecycle: 'READY',
      }))
      const topology = normalizedTasks.map((task: any, index: number) => ({
        stage: index + 1,
        handler: type === 'design' ? 'designer' : type === 'review' ? 'reviewer' : index === 0 ? 'coder' : 'coder',
        task_id: task.task_id,
        depends_on: task.dependencies,
        next: index + 1 < normalizedTasks.length ? normalizedTasks[index + 1].task_id : null,
      }))
      const executionTopologyError = executionContract === 'NEXT' ? validateExecutionTopology(normalizedTasks, topology) : null
      if (executionTopologyError) return { content: [{ type: 'text', text: executionTopologyError }], isError: true }
      const nextPlanning = normalizeNextPlanningModel({ evidence_needs, test_checkpoints, evidence_requirements, milestones, planning_topology }, 1)
      const nextPlanningError = validateNextPlanningModel(executionContract, normalizedTasks, nextPlanning, 1)
      if (nextPlanningError) return { content: [{ type: 'text', text: nextPlanningError }], isError: true }
      const record = {
        kind: 'JOB',
        job_id: jobId,
        handle: jobHandle(jobId),
        ...(scopeNew ? {
          scope_supersession_id: scopeNew.intent.change_id,
          scope_human_approval_ref: scopeNew.intent.scope_change.human_approval_ref,
          scope_reviewed_plan_sha: scopeNew.intent.reviewed_plan_sha,
          scope_predecessor_job_ids: scopeNew.predecessors,
        } : {}),
        ...(replacement ? {
          // Include full immutable ID in the displayed name: a four-char
          // handle alone is not globally collision-free.
          display_name: objective + ' / Plan ' + replacement.intent.change_id +
            ' / ' + jobHandle(jobId) + ' [' + jobId + ']',
          replacement_of_job_id: replacement.predecessor.job_id,
          plan_change_id: replacement.intent.change_id,
        } : {}),
        project_id,
        type,
        plan_kind: plan_kind ?? 'JOB',
        criteria_binding: criteria_binding ?? null,
        objective,
        scope,
        non_goals,
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { memory_namespace: nextMemoryNamespace } : {}),
        planning_context: {
          work_context,
          phase,
          ...(scopeNew ? { phase_revision_ref: scopeNew.intent.change_id } : {}),
          milestone,
          relationship_scan_summary,
          job_sizing,
          brownfield_logic_review: brownfield_logic_review ?? [],
          relationship_assessment: relationship_assessment ?? [],
        },
        repository_discovery: {
          structure_evidence: repository_structure_evidence,
          selected_source_evidence: selected_source_evidence ?? [],
        },
        repository_context: {
          project_repository_mode,
          registered_repositories: normalizedRegistered,
          working_repository_url: normalizedWorking,
          integration_branch: integration_branch ?? null,
          cross_repo_impact: cross_repo_impact ?? [],
        },
        product_workflow: product_workflow ?? null,
        ui_strategy: product_workflow === 'UX_FIRST' ? {
          temporary_ui: temporary_ui ?? [],
          collected_ui_requirements: collected_ui_requirements ?? [],
          ui_update_pack_trigger: ui_update_pack_trigger ?? null,
          temporary_ui_human_approval: temporary_ui_human_approval ?? ((temporary_ui ?? []).length ? 'REQUIRED_PENDING' : 'NOT_REQUIRED'),
          temporary_ui_policy: 'MINIMUM_EXECUTION_SCAFFOLD_REUSE_CURRENT_SHELL_PROVISIONAL_HUMAN_APPROVAL_FOR_MATERIAL_INTERACTION_CHOICES',
        } : null,
        tasks: normalizedTasks,
        topology,
        evidence_needs: nextPlanning.evidence_needs,
        test_checkpoints: nextPlanning.test_checkpoints,
        evidence_requirements: nextPlanning.evidence_requirements,
        milestones: nextPlanning.milestones,
        planning_topology: nextPlanning.planning_topology,
        dependencies: [],
        completion_requirements,
        verification_requirements,
        review_triggers,
        planning_revision: 1,
        planning_review: {
          status: 'PENDING',
          reviewed_revision: null,
          verification_ref: null,
        },
        lifecycle: 'DRAFT',
        result: null,
        linked_job_ids: scopeNew ? scopeNew.predecessors : replacement ? [replacement.predecessor.job_id] : [],
        created_at: now,
        updated_at: now,
      }
      const decisionError = decisionFidelityError(record)
      if (decisionError) return { content: [{ type: 'text', text: decisionError }], isError: true }
      const path = recordPath(project_id, 'JOBS', jobId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const externalSteps = [
        'Re-read current PROJECT.md and require lifecycle=ACTIVE before persisting the Job.',
        ...((record.repository_discovery.selected_source_evidence ?? []).some((x: string) => x.startsWith(DECISION_PREFIX)) ? [
          'Read each DECISION_REF full source at pinned Git SHA from authorized Project Memory. Check actual Human acceptance, full method, rationale, negative exceptions and supersession before Git CAS Job CREATE/readback. The caller metadata and structural validation are not proof of Human consent.',
        ] : []),
        ...(integration_branch ? ['Verify this Job integration_branch equals the registered working repository Development Branch in exact current PROJECT.md, and that GitHub live branch exists. Readback must be independent of caller-provided input; do not use GitHub default.'] : []),
        ...(criteria_binding ? [
          'Fetch exact Project CRITERIA.md from the configured Memory Repo at criteria_binding.criteria_path; verify blob SHA=' + criteria_binding.criteria_blob_sha + ' and actual Human APPROVED content. An input approval_status flag is not reliable evidence by itself.',
          'Before Reviewer PASS or dependent code execution, re-read current Criteria/Project Memory and reconcile if revision has changed; only Human may change approved WHAT/WHY.',
        ] : []),
        'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path). Continue only on ALLOW.',
        'GitHub Memory Repo: create_file at memory_path with job_record_text.',
        'Fetch the new Job record back and verify job_id/project_id/lifecycle=DRAFT/planning_revision=1.',
      ]
      if (scopeNew) {
        externalSteps.unshift(
          'Independently read the immutable Plan Change intent and COMPLETE retired predecessors at exact paths/SHAs before CREATE. Caller-supplied snapshots are not mutation authority.',
          'Verify the new Job/Task/Milestone/topology identities are fresh against the complete old scope and bind to the reviewed replacement Plan; no old PASS/Verification is inherited.',
          'Check the deterministic successor_job_id path is absent before CREATE; on duplicate/lost response, read and reconcile, never mint a second Job ID.',
          'Preserve unchanged work and Git refs. Re-review this fresh Job/Plan revision before any dispatch.',
        )
      }
      if (replacement) {
        externalSteps.unshift(
          'Read back exact immutable Plan Change intent path + blob SHA and the SUPERSEDED predecessor Job path + blob SHA. Never trust caller-provided JSON alone.',
          'Before CREATE, check target replacement Job path is absent. If it already exists, read/reconcile matching identity; never create a second replacement ID.',
          'Preserve historical predecessor Run/Verification evidence. Do not copy historical PASS to this replacement Job.',
        )
      }
      if ((relationship_assessment ?? []).length) {
        externalSteps.push('For each durable precedence/reread relationship discovered by planning, call relationship_knowledge_prepare and persist/read-back the resulting existing KNOWLEDGE/ ARCHITECTURE_NOTE before relying on it in later Jobs.')
      }
      externalSteps.push(
        'After DRAFT persistence and exact readback, follow continuation.next_action_after_readback=REVIEW_CURRENT_REVISION in this SAME USER TURN. Switch to the role-isolated planning Reviewer (no new Human chat). Do not report planning completion to the user yet.',
        'Do not modify source during Planner Job persistence.',
      )
      const result = {
        job_id: jobId,
        handle: jobHandle(jobId),
        memory_path: path,
        job_record_text: prettyJson(record),
        external_steps: externalSteps,
        continuation: planningLoopContinuationDecision('JOB_PREPARED', 'DRAFT', 1),
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

}
