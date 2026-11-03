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
        scope_rebuild_context: z.object({
          intent_record_text: z.string().min(2),
          intent_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          intent_memory_path: z.string().min(1),
          pack_key: z.string().min(1),
          job_snapshots: z.array(z.object({
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
    async ({ project_id, type, objective, scope, non_goals, execution_contract, plan_kind, criteria_binding, integration_branch, work_context, phase, milestone, relationship_scan_summary, job_sizing, brownfield_logic_review, relationship_assessment, repository_structure_evidence, selected_source_evidence, project_repository_mode, registered_repositories, working_repository_url, cross_repo_impact, product_workflow, temporary_ui, collected_ui_requirements, ui_update_pack_trigger, temporary_ui_human_approval, tasks, evidence_needs, test_checkpoints, evidence_requirements, milestones, planning_topology, completion_requirements, verification_requirements, review_triggers, replacement_context, scope_rebuild_context }: any) => {
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
      // U-B: a scope-wide rebuild has independent pack identity, never a
      // one-to-one inheritance of old PASS, Tasks, Milestones or old Run IDs.
      let scopeRebuild: any = null
      if (scope_rebuild_context) {
        if (replacement_context) return { content: [{ type:'text', text:'SCOPE_REBUILD_CANNOT_REPLACE_ONE_TO_ONE.' }], isError:true }
        let intent: any
        try { intent=JSON.parse(scope_rebuild_context.intent_record_text) }
        catch { return { content:[{type:'text',text:'SCOPE_REBUILD_INTENT_INVALID.'}],isError:true } }
        const expectedPath = executionMemoryRoot(project_id, intent?.execution_contract,
          intent?.memory_namespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) +
          '/WORK/PLAN_RECONCILIATIONS/' + intent?.change_id + '.json'
        const packs = intent?.rebuild_jobs
        const pack = Array.isArray(packs) ? packs.find((p: any) => p.pack_key === scope_rebuild_context.pack_key) : null
        if (intent?.kind !== 'PLAN_RECONCILIATION_INTENT' || intent.version !== 1 ||
            intent.project_id !== project_id || !intent.scope_selection ||
            !/^[0-9a-f]{40}$/.test(scope_rebuild_context.intent_record_sha) ||
            !/^[0-9a-f]{40}$/.test(intent.reviewed_plan_sha ?? '') ||
            scope_rebuild_context.intent_memory_path !== expectedPath ||
            !pack || !pack.job_id || packs.some((p: any) => p !== pack && p.job_id === pack.job_id) ||
            pack.phase !== phase || intent.work_branch !== integration_branch ||
            (intent.execution_contract !== executionContract) ||
            (executionContract === 'NEXT' && intent.memory_namespace !== nextMemoryNamespace)) {
          return { content:[{type:'text',text:'SCOPE_REBUILD_IDENTITY_OR_BRANCH_MISMATCH.'}],isError:true }
        }
        const oldIds = new Set((intent.actions ?? []).flatMap((a: any) => [
          a.predecessor_job_id, ...(a.historical_task_ids ?? []), ...(a.historical_milestone_ids ?? []),
        ]))
        if (oldIds.has(pack.job_id) || (tasks ?? []).some((t: any) => t.task_id && oldIds.has(t.task_id)) ||
            (milestones ?? []).some((m: any) => oldIds.has(m.milestone_id))) {
          return { content:[{type:'text',text:'SCOPE_REBUILD_MUST_USE_FRESH_IDS.'}],isError:true }
        }
        const dependencies = (pack.depends_on_pack_keys ?? []).map((key: string) =>
          packs.find((p: any) => p.pack_key === key)?.job_id)
        if (dependencies.some((id: any) => !id || id === pack.job_id ||
            !packs.some((p: any) => p.job_id === id))) {
          return { content:[{type:'text',text:'SCOPE_REBUILD_DEPENDENCY_INVALID.'}],isError:true }
        }
        // Every original Job must be in the supplied fresh exact-SHA readbacks.
        // No successor is creatable while a predecessor has an unfinished
        // retirement or a crossing dependent is awaiting independent review.
        const snapshots = new Map<string, any>()
        for (const snap of scope_rebuild_context.job_snapshots ?? []) {
          let job: any
          try { job = JSON.parse(snap.job_record_text) }
          catch { return { content:[{type:'text',text:'SCOPE_REBUILD_READBACK_INVALID.'}],isError:true } }
          if (!/^[0-9a-f]{40}$/.test(snap.job_record_sha ?? '') ||
              job.project_id !== project_id || !job.job_id ||
              snapshots.has(job.job_id)) {
            return { content:[{type:'text',text:'SCOPE_REBUILD_READBACK_INVALID.'}],isError:true }
          }
          snapshots.set(job.job_id, job)
        }
        const originals = intent.scope_selection.inventory_job_ids ?? []
        if (snapshots.size !== originals.length || originals.some((id: string) => !snapshots.has(id))) {
          return { content:[{type:'text',text:'SCOPE_REBUILD_INVENTORY_INCOMPLETE.'}],isError:true }
        }
        for (const action of intent.actions ?? []) {
          const current = snapshots.get(action.predecessor_job_id)
          if (!current) return { content:[{type:'text',text:'SCOPE_REBUILD_PREDECESSOR_MISSING.'}],isError:true }
          if (action.decision === 'RETIRE' &&
              (current.lifecycle !== 'RETIRED' ||
                current.retired_by_plan_change_id !== intent.change_id ||
                current.result !== 'RETIRED' ||
                current.retired_by_replacement_job_id != null)) {
            return { content:[{type:'text',text:'SCOPE_REBUILD_RETIREMENT_UNSETTLED.'}],isError:true }
          }
          if (action.decision === 'REVALIDATE' &&
              (current.plan_change_revalidated_by !== intent.change_id ||
                current.plan_change_pending ||
                current.planning_revision <= action.predecessor_planning_revision ||
                current.planning_review?.status !== 'PASS' ||
                current.planning_review?.reviewed_revision !== current.planning_revision)) {
            return { content:[{type:'text',text:'SCOPE_REBUILD_DEPENDENCY_UNREVIEWED.'}],isError:true }
          }
        }
        scopeRebuild = { intent, pack, dependencies }
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
      const jobId = scopeRebuild?.pack.job_id ?? replacement?.item?.replacement?.job_id ?? uuidv7()
      const now = new Date().toISOString()
      const normalizedTasks = tasks.map((task: any) => ({
        task_id: task.task_id || uuidv7(),
        objective: task.objective,
        scope: task.scope ?? [],
        dependencies: task.dependencies ?? [],
        required_skills: task.required_skills ?? [],
        completion_criteria: task.completion_criteria,
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
        ...(scopeRebuild ? {
          plan_change_id: scopeRebuild.intent.change_id,
          scope_rebuild: {
            pack_key: scopeRebuild.pack.pack_key,
            reviewed_plan_sha: scopeRebuild.intent.reviewed_plan_sha,
            intent_memory_path: scope_rebuild_context.intent_memory_path,
            dependency_job_ids: scopeRebuild.dependencies,
          },
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
        dependencies: scopeRebuild?.dependencies ?? [],
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
        linked_job_ids: replacement ? [replacement.predecessor.job_id] : [],
        created_at: now,
        updated_at: now,
      }
      const path = recordPath(project_id, 'JOBS', jobId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const externalSteps = [
        'Re-read current PROJECT.md and require lifecycle=ACTIVE before persisting the Job.',
        ...(integration_branch ? ['Verify this Job integration_branch equals the registered working repository Development Branch in exact current PROJECT.md, and that GitHub live branch exists. Readback must be independent of caller-provided input; do not use GitHub default.'] : []),
        ...(criteria_binding ? [
          'Fetch exact Project CRITERIA.md from the configured Memory Repo at criteria_binding.criteria_path; verify blob SHA=' + criteria_binding.criteria_blob_sha + ' and actual Human APPROVED content. An input approval_status flag is not reliable evidence by itself.',
          'Before Reviewer PASS or dependent code execution, re-read current Criteria/Project Memory and reconcile if revision has changed; only Human may change approved WHAT/WHY.',
        ] : []),
        'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path). Continue only on ALLOW.',
        'GitHub Memory Repo: create_file at memory_path with job_record_text.',
        'Fetch the new Job record back and verify job_id/project_id/lifecycle=DRAFT/planning_revision=1.',
      ]
      if (scopeRebuild) {
        externalSteps.unshift(
          'Read back exactly the current immutable Scope Plan intent (path, blob SHA and bytes) and verify Human-approved changed Plan/Phase boundary.',
          'Independently refetch every supplied original Job snapshot by exact SHA, enumerate real Runs/cursors and verify retired/REVALIDATE lineage before creating this pack; UNKNOWN/PENDING stays fenced.',
          'Use the reserved scope Job ID once; on target-path CREATE collision independently read back this Job and confirm exact scope_rebuild lineage. Never generate an alternative Job ID.',
          'Do not import historical PASS, old task/milestone IDs, Run evidence or old closure into this new DRAFT Job.',
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
