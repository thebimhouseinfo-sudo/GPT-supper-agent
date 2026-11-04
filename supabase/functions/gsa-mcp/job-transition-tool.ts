// GSA1-S6: Job lifecycle transition, original contract preserved.
export function registerJobTransitionTool(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, PLANNING_LOOP_CONTINUATION_SCHEMA, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, planningLoopContinuationDecision, prettyJson, recordPath, DEFAULT_NEXT_MEMORY_NAMESPACE, DURABLE_RECORD_SNAPSHOT_SCHEMA, evaluateNextEvidenceGate, nextClosureCoverageError, validatePlanChangeSupersession, durableSnapshotReadbackSteps } = deps
  server.registerTool(
    'job_transition',
    {
      title: 'Transition a durable GSA Job',
      description: 'PREPARE ONLY: authorized exact-SHA Job lifecycle transition. DRAFT→READY requires persisted current-revision PASS planning review. After READY update/readback, follow continuation to current Job topology rather than asking Human to say continue.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        target_lifecycle: z.enum(['READY','IN_PROGRESS','COMPLETED','CANCELLED','SUPERSEDED','RETIRED']),
        result: z.enum(['PASS','PASS_RETEST_REQUIRED','CANCELLED','SUPERSEDED','RETIRED']).optional(),
        completion_evidence_refs: z.array(z.string()).default([]),
        planning_review_verification_ref: z.string().optional(),
        checkpoint_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        checkpoint_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        completed_task_run_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        closure_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        plan_change_context: z.object({
          intent_record_text: z.string().min(2),
          intent_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          intent_memory_path: z.string().min(1),
          cursor_state: z.enum(['ABSENT','STABLE','PENDING','UNKNOWN']),
          active_run_state: z.enum(['NONE','TERMINAL','ACTIVE','UNKNOWN']),
        }).optional(),
      },
      outputSchema: {
        memory_path: z.string(),
        expected_job_sha: z.string(),
        next_job_record_text: z.string(),
        external_steps: z.array(z.string()),
        continuation: PLANNING_LOOP_CONTINUATION_SCHEMA.optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, job_record_sha, target_lifecycle, result, completion_evidence_refs, planning_review_verification_ref, checkpoint_claim_snapshots, checkpoint_verification_snapshots, completed_task_run_snapshots, closure_verification_snapshots, plan_change_context }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to transition a Job.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
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
      const allowed =
        (current.lifecycle === 'DRAFT' && ['READY','CANCELLED','SUPERSEDED','RETIRED'].includes(target_lifecycle)) ||
        (current.lifecycle === 'READY' && ['IN_PROGRESS','CANCELLED','SUPERSEDED','RETIRED'].includes(target_lifecycle)) ||
        (current.lifecycle === 'IN_PROGRESS' && ['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(target_lifecycle))
      if (!allowed) {
        return { content: [{ type: 'text', text: 'Invalid Job lifecycle transition: ' + current.lifecycle + ' → ' + target_lifecycle }], isError: true }
      }
      if (current.plan_change_pending && !(['SUPERSEDED','RETIRED'].includes(target_lifecycle) && plan_change_context)) {
        return { content:[{ type:'text',text:'PLAN_CHANGE_PENDING_FENCE: only intent-bound SUPERSEDED is allowed.' }],isError:true }
      }
      if (target_lifecycle === 'READY') {
        if (!planning_review_verification_ref) {
          return { content: [{ type: 'text', text: 'DRAFT→READY requires a PASS planning-review Verification reference.' }], isError: true }
        }
        if (current.planning_review?.status !== 'PASS' || current.planning_review?.reviewed_revision !== current.planning_revision) {
          return { content: [{ type: 'text', text: 'Current planning revision is not marked PASS by planning review.' }], isError: true }
        }
        if (current.planning_review?.verification_ref !== planning_review_verification_ref) {
          return { content: [{ type: 'text', text: 'Planning review Verification reference mismatch.' }], isError: true }
        }
      }
      if (target_lifecycle === 'COMPLETED') {
        if (!['PASS','PASS_RETEST_REQUIRED'].includes(result ?? '')) {
          return { content: [{ type: 'text', text: 'Completed Job requires result PASS or PASS_RETEST_REQUIRED.' }], isError: true }
        }
        if (!(completion_evidence_refs ?? []).length) {
          return { content: [{ type: 'text', text: 'Completed Job requires at least one durable completion evidence reference.' }], isError: true }
        }
        if (executionContract === 'NEXT') {
          if (current.planning_review?.status !== 'PASS' || current.planning_review?.reviewed_revision !== current.planning_revision) {
            return { content: [{ type: 'text', text: 'NEXT_JOB_COMPLETION_BLOCKED: current planning revision is not Reviewer PASS.' }], isError: true }
          }
          const gate = evaluateNextEvidenceGate(
            current,
            checkpoint_claim_snapshots ?? [],
            checkpoint_verification_snapshots ?? [],
            { kind: 'JOB', id: null },
          )
          if (!gate.allowed) {
            return {
              content: [{
                type: 'text',
                text: 'NEXT_JOB_COMPLETION_BLOCKED: mandatory checkpoint/evidence gate is unsatisfied. PASS_RETEST_REQUIRED cannot bypass it. ' + gate.blocking.join('; '),
              }],
              isError: true,
            }
          }
          const completedRuns = parseDurableSnapshots(completed_task_run_snapshots ?? [], 'completed_task_run_snapshots')
          if (completedRuns.error) {
            return { content: [{ type: 'text', text: 'NEXT_JOB_COMPLETION_BLOCKED: ' + completedRuns.error }], isError: true }
          }
          const closureVerifications = parseDurableSnapshots(closure_verification_snapshots ?? [], 'closure_verification_snapshots')
          if (closureVerifications.error) {
            return { content: [{ type: 'text', text: 'NEXT_JOB_COMPLETION_BLOCKED: ' + closureVerifications.error }], isError: true }
          }
          const coverageError = nextClosureCoverageError(
            current,
            completedRuns.entries,
            closureVerifications.entries,
            completion_evidence_refs ?? [],
          )
          if (coverageError) {
            return { content: [{ type: 'text', text: coverageError }], isError: true }
          }
        }
      }
      if (plan_change_context && !['SUPERSEDED','RETIRED'].includes(target_lifecycle)) {
        return { content: [{ type: 'text', text: 'PLAN_CHANGE_CONTEXT_ONLY_FOR_SUPERSEDED_OR_RETIRED.' }], isError: true }
      }
      const planSupersession = plan_change_context ? validatePlanChangeSupersession({
        ...plan_change_context,
        project_id, predecessor_job: current,
        predecessor_job_sha: job_record_sha,
      }) : null
      if (planSupersession && !planSupersession.allowed) {
        return { content: [{ type: 'text', text: planSupersession.reason }], isError: true }
      }
      if (target_lifecycle === 'RETIRED' && result != null && result !== 'RETIRED') {
        return { content: [{ type: 'text', text: 'RETIRE_RESULT_MUST_MATCH_LIFECYCLE.' }], isError: true }
      }
      if (target_lifecycle === 'RETIRED' && (!planSupersession?.allowed || planSupersession.action.decision !== 'RETIRE')) {
        return { content: [{ type: 'text', text: 'RETIRE_REQUIRES_REVIEWED_PLAN_INTENT_AND_SETTLED_ACTIVITY.' }], isError: true }
      }
      if (planSupersession?.allowed && planSupersession.action.decision !== (target_lifecycle === 'RETIRED' ? 'RETIRE' : 'REPLACE')) {
        return { content: [{ type: 'text', text: 'PLAN_CHANGE_TERMINAL_DECISION_MISMATCH.' }], isError: true }
      }
      const next = {
        ...current,
        ...(planSupersession?.allowed && target_lifecycle === 'SUPERSEDED' ? {
          superseded_by_plan_change_id: JSON.parse(plan_change_context.intent_record_text).change_id,
          superseded_by_replacement_job_id: planSupersession.action.replacement.job_id,
        } : {}),
        ...(planSupersession?.allowed && target_lifecycle === 'RETIRED' ? {
          retired_by_plan_change_id: JSON.parse(plan_change_context.intent_record_text).change_id,
          retired_reason: planSupersession.action.reason,
          retired_at: new Date().toISOString(),
          retired_by_replacement_job_id: null,
        } : {}),
        ...(['SUPERSEDED','RETIRED'].includes(target_lifecycle) && planSupersession?.allowed ? {
          // Preserve completed Tasks and their evidence; retire EVERY unfinished
          // Task in the reviewed scope (legacy partial REPLACE remains unchanged).
          tasks: (current.tasks ?? []).map((task: any) => {
            const retire = target_lifecycle === 'RETIRED' || (planSupersession.action.retired_task_ids ?? []).includes(task.task_id)
            return retire && !['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(task.lifecycle)
              ? { ...task, lifecycle: 'RETIRED', retired_by_plan_change_id: JSON.parse(plan_change_context.intent_record_text).change_id,
                  retired_reason: planSupersession.action.reason }
              : task
          }),
          // NEXT milestone records are planning nodes, not an independent
          // lifecycle engine. Record scoped retirement without overwriting
          // completed milestone/Task history or historical PASS evidence.
          ...(target_lifecycle === 'RETIRED' ? {
            milestones: (current.milestones ?? []).map((milestone: any) => {
              const related = (current.tasks ?? []).filter((task: any) =>
                (milestone.node_ids ?? []).includes(task.task_id))
              const completed = related.length > 0
                ? related.every((task: any) => task.lifecycle === 'COMPLETED')
                : (milestone.lifecycle === 'COMPLETED' || milestone.status === 'PASS' || milestone.result === 'PASS')
              return completed ? milestone : {
                ...milestone, lifecycle: 'RETIRED',
                retired_by_plan_change_id: JSON.parse(plan_change_context.intent_record_text).change_id,
                retired_reason: planSupersession.action.reason,
              }
            }),
          } : {}),
        } : {}),
        lifecycle: target_lifecycle,
        result: target_lifecycle === 'RETIRED' ? 'RETIRED' : result ?? current.result ?? null,
        completion_evidence_refs: completion_evidence_refs ?? current.completion_evidence_refs ?? [],
        updated_at: new Date().toISOString(),
      }
      const memoryPath = recordPath(project_id, 'JOBS', job_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const externalSteps = [
        'Re-read current PROJECT.md and require lifecycle=ACTIVE before a consequential Job transition.',
        'Verify the current Job file blob SHA still equals expected_job_sha. On mismatch, refetch/reconcile; never force overwrite.',
      ]
      if (planSupersession?.allowed) {
        externalSteps.push(
          'Independently read exact persisted Plan Change intent, require its blob SHA equals plan_change_context.intent_record_sha and bytes match before ANY Job transition.',
          'Independently enumerate active Runs and Job cursor; require no ACTIVE/UNKNOWN Runs and no PENDING/UNKNOWN source mutation.',
          'Independently confirm current source HEAD/tree and dependencies are consistent with the reviewed Plan; do not trust cursor_state/active_run_state caller assertions.',
          'After terminal transition, read back lifecycle, every unfinished Task/Milestone retirement and Plan Change lineage; RETIRED must have a reason and no successor.',
          'A delayed successful Run callback must not bypass the Plan fence. Preserve completed historical results; never promote old PASS to fresh Job/Task work.',
        )
      }
      if (target_lifecycle === 'COMPLETED') {
        externalSteps.push('Verify every completion_evidence_ref already exists and applies to the current accepted target revision before Job completion.')
        if (executionContract === 'NEXT') {
          externalSteps.push(
            ...durableSnapshotReadbackSteps(checkpoint_claim_snapshots ?? [], 'checkpoint claim snapshot'),
            ...durableSnapshotReadbackSteps(checkpoint_verification_snapshots ?? [], 'checkpoint Verification snapshot'),
            ...durableSnapshotReadbackSteps(completed_task_run_snapshots ?? [], 'closure Task Run snapshot'),
            ...durableSnapshotReadbackSteps(closure_verification_snapshots ?? [], 'closure REVIEW/TEST Verification snapshot'),
          )
        }
      }
      externalSteps.push(
        'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=memory_path).',
        'GitHub Memory Repo: update the Job file with next_job_record_text using expected_job_sha exactly.',
        'Read back the Job and verify the target lifecycle/result before reporting the Job transition complete.',
        ...(target_lifecycle === 'READY' ? ['After exact READY readback, follow continuation.next_action_after_readback=PRESENT_PLAN_FOR_APPROVAL: show the reviewed PASS plan and STOP. Await explicit Human execution approval before any Job execution Run.'] : []),
      )
      const out = {
        memory_path: memoryPath,
        expected_job_sha: job_record_sha,
        next_job_record_text: prettyJson(next),
        external_steps: externalSteps,
        ...(target_lifecycle === 'READY' ? { continuation: planningLoopContinuationDecision('READY_TRANSITION', 'READY', next.planning_revision) } : {}),
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

}
