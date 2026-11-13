// GSA4 A0-R: run_complete registration extracted from run-execution-tools.ts.
import { parseProjectManifest } from '../project-manifest-scope.ts'
import { convergenceCompletionError } from '../branch-governance.ts'
export function registerRunComplete(deps: any) {
  const { server, z, req, AUTH_SCOPES, authContext, authError, DURABLE_RECORD_SNAPSHOT_SCHEMA, DEFAULT_NEXT_MEMORY_NAMESPACE, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, uuidv7, recordPath, prettyJson, durableSnapshotReadbackSteps, resolveExecutionContract, goalRecheckCoverageError, verificationPath, validateRunVerificationSnapshot, validateTesterEvidenceVerificationSnapshot, validateTesterEvidenceClaimSnapshot } = deps
  server.registerTool(
    'run_complete',
    {
      title: 'Complete a GSA Job Run',
      description: 'Prepare optional immutable Handoff plus terminal Run replacement. Persist referenced evidence/handoff first; update the Run last using exact blob SHA.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        role: z.enum(['planner','designer','coder','reviewer','tester']),
        run_record_text: z.string().min(2),
        run_record_sha: z.string().min(7),
        lifecycle: z.enum(['COMPLETED','FAILED','CANCELLED','SUPERSEDED']),
        result: z.string().optional(),
        output_refs: z.array(z.string()).default([]),
        verification_refs: z.array(z.string()).default([]),
        goal_recheck_record_text: z.string().min(2).optional(),
        goal_recheck_verification_ref: z.string().min(1).optional(),
        goal_recheck_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        job_record_text: z.string().min(2).optional(),
        job_record_sha: z.string().min(7).optional(),
        project_manifest_text: z.string().min(1).optional(),
        project_manifest_sha: z.string().regex(/^[a-f0-9]{40}$/).optional(),
        run_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        handoff: z.object({
          next_role: z.enum(['planner','designer','coder','reviewer','tester']),
          primary_task_id: z.string().min(1).optional(),
          target_ref: z.string().optional(),
          target_revision: z.string().optional(),
          completed_summary: z.string().min(1),
          remaining: z.array(z.string()).default([]),
          required_inputs: z.array(z.string()).default([]),
          tester_evidence_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
          tester_evidence_claim_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
          blocker_or_gate: z.string().optional(),
          expected_next_outcome: z.string().min(1),
        }).optional(),
      },
      outputSchema: {
        run_memory_path: z.string(),
        expected_run_sha: z.string(),
        terminal_run_record_text: z.string(),
        handoff_id: z.string().nullable(),
        handoff_memory_path: z.string().nullable(),
        handoff_record_text: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, run_id, role, run_record_text, run_record_sha, lifecycle, result, output_refs, verification_refs, goal_recheck_record_text, goal_recheck_verification_ref, goal_recheck_snapshot, job_record_text, job_record_sha, project_manifest_text, project_manifest_sha, run_verification_snapshot, handoff }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to complete a Run.')
      let current: any
      try { current = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Run JSON.' }], isError: true }
      }
      if (current.run_id !== run_id || current.project_id !== project_id || current.job_id !== job_id || current.role !== role || current.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'Run identity/lifecycle mismatch.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(current.execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(current)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'RUN_COMPLETION_BLOCKED: NEXT Run memory_namespace is invalid.' }], isError: true }
      }
      // U-B: a delayed successful callback cannot resurrect a superseded
      // Job or publish stale PASS after the Plan fence was committed. NEXT
      // successful Runs require an exact owning Job snapshot for ALL roles,
      // not only Coder. Failed/cancelled settlement remains possible.
      let owningNextJob: any = null
      if (lifecycle === 'COMPLETED' && executionContract === 'NEXT') {
        if (!job_record_text || !/^[0-9a-f]{40}$/.test(String(job_record_sha ?? ''))) {
          return { content:[{type:'text',text:'PLAN_CHANGE_RUN_COMPLETION_REQUIRES_CURRENT_JOB_SHA.'}],isError:true }
        }
        let owning: any
        try { owning = JSON.parse(job_record_text) }
        catch { return {content:[{type:'text',text:'PLAN_CHANGE_RUN_COMPLETION_JOB_JSON_INVALID.'}],isError:true} }
        if (owning.project_id !== project_id || owning.job_id !== job_id ||
            owning.plan_change_pending || !['READY','IN_PROGRESS'].includes(owning.lifecycle) ||
            owning.planning_revision !== current.planning_revision ||
            jobExecutionContract(owning) !== executionContract ||
            recordNextMemoryNamespace(owning) !== nextMemoryNamespace) {
          return {content:[{type:'text',text:'PLAN_CHANGE_RUN_COMPLETION_FENCED_OR_STALE_JOB.'}],isError:true}
        }
        owningNextJob = owning
      }
      // Enforce the reviewed Job's Task identity, not only the mutable Run
      // record flag: a stale or stripped convergence bit must never bypass M03.
      if (lifecycle === 'COMPLETED' && executionContract === 'NEXT') {
        const owningTask = owningNextJob?.tasks?.find((t: any) => t.task_id === current.primary_task_id)
        // Compare the durable Job and Run for every role: stripping the flag cannot
        // make a legacy non-Coder Convergence Run behave like an ordinary review.
        if (Boolean(owningTask?.convergence_task) !== Boolean(current.convergence_task) ||
            (owningTask?.convergence_task === true &&
             JSON.stringify(owningTask.incoming_branches ?? []) !== JSON.stringify(current.incoming_branches ?? []))) {
          return { content: [{ type: 'text', text: 'CONVERGENCE_TASK_BINDING_MISMATCH: current Run must match reviewed Job Convergence Task/incoming branches.' }], isError: true }
        }
        for (const taskId of [current.primary_task_id, ...(current.affected_task_refs ?? [])]) {
          const task = owningNextJob?.tasks?.find((t: any) => t.task_id === taskId)
          const stage = owningNextJob?.topology?.find((s: any) => s.task_id === taskId)
          if (task?.convergence_task === true && taskId !== current.primary_task_id) {
            return { content: [{ type: 'text', text: 'CONVERGENCE_PRIMARY_TASK_REQUIRED: Convergence Task must be the primary Run Task.' }], isError: true }
          }
          if (task?.convergence_task === true && (role !== 'coder' || stage?.handler !== 'coder')) {
            return { content: [{ type: 'text', text: 'CONVERGENCE_HANDLER_INVALID: Convergence Task must be Coder-owned.' }], isError: true }
          }
        }
      }
      // Convergence is a Task responsibility, not a background cleanup Job.
      // A task cannot complete successfully while any incoming branch is orphaned.
      if (role === 'coder' && lifecycle === 'COMPLETED' && current.convergence_task === true) {
        if (!handoff || !handoff.completed_summary) {
          return { content: [{ type: 'text', text: 'CONVERGENCE_DOWNSTREAM_HANDOFF_REQUIRED: downstream handoff must be prepared and persisted before Run closure.' }], isError: true }
        }
        const manifest = project_manifest_text && project_manifest_sha ? parseProjectManifest(project_manifest_text) : null
        if (!manifest || manifest.project_id !== project_id || manifest.lifecycle !== 'ACTIVE') {
          return { content: [{ type: 'text', text: 'CONVERGENCE_MANIFEST_REQUIRED: exact active Project manifest and blob SHA are required.' }], isError: true }
        }
        const closureError = convergenceCompletionError(manifest.working_branches, project_id, job_id,
          current.primary_task_id ?? '', current.incoming_branches ?? [],
          [...(owningNextJob?.linked_job_ids ?? []), ...(owningNextJob?.dependencies ?? [])])
        if (closureError) return { content: [{ type: 'text', text: closureError }], isError: true }
      }
      if (role === 'coder' && lifecycle === 'COMPLETED') {
        let goal: any = null
        let goalRef: string | null = null
        if (executionContract === 'NEXT') {
          const parsedGoal = parseDurableSnapshots(goal_recheck_snapshot ? [goal_recheck_snapshot] : [], 'goal_recheck_snapshot')
          if (parsedGoal.error || parsedGoal.entries.length !== 1) {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: NEXT completion requires one exact durable GOAL_RECHECK snapshot.' }], isError: true }
          }
          const entry = parsedGoal.entries[0]
          goal = entry.record
          goalRef = entry.path
          if (!job_record_text || !job_record_sha) {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: NEXT completion requires the exact current Job snapshot and blob SHA.' }], isError: true }
          }
          let owningJob: any
          try { owningJob = JSON.parse(job_record_text) } catch {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: invalid owning Job JSON.' }], isError: true }
          }
          if (
            owningJob.project_id !== project_id ||
            owningJob.job_id !== job_id ||
            owningJob.planning_revision !== current.planning_revision ||
            jobExecutionContract(owningJob) !== 'NEXT' ||
            recordNextMemoryNamespace(owningJob) !== nextMemoryNamespace
          ) {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: owning Job does not match the Run current NEXT planning revision.' }], isError: true }
          }
          const expectedGoalPath = typeof goal?.verification_id === 'string' ? verificationPath(project_id, goal.verification_id, 'NEXT', nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) : ''
          const coverageError = goalRecheckCoverageError(owningJob, current, goal?.criteria ?? [])
          if (entry.path !== expectedGoalPath || coverageError) {
            return { content: [{ type: 'text', text: coverageError ?? 'CODER_COMPLETION_BLOCKED: GOAL_RECHECK snapshot path mismatch.' }], isError: true }
          }
        } else {
          if (!goal_recheck_record_text || !goal_recheck_verification_ref) {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: exact GOAL_RECHECK record and its persisted verification ref are required for successful completion.' }], isError: true }
          }
          try { goal = JSON.parse(goal_recheck_record_text) } catch {
            return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: invalid GOAL_RECHECK JSON.' }], isError: true }
          }
          goalRef = goal_recheck_verification_ref
        }

        if (!goalRef || !(verification_refs ?? []).includes(goalRef)) {
          return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: GOAL_RECHECK verification ref must be included in verification_refs.' }], isError: true }
        }
        const revisionMatches = !current.target_revision || !goal.target_revision || current.target_revision === goal.target_revision
        const goalExecutionContract = resolveExecutionContract(goal.execution_contract)
        const expectedGoalPath = typeof goal.verification_id === 'string' ? verificationPath(project_id, goal.verification_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) : ''
        const persistedRefMatches = expectedGoalPath === goalRef
        const planningRevisionMatches = executionContract !== 'NEXT' || goal.planning_revision === current.planning_revision
        const namespaceMatches = executionContract !== 'NEXT' || recordNextMemoryNamespace(goal) === nextMemoryNamespace
        const goalMatches = goal.kind === 'GOAL_RECHECK' && goal.project_id === project_id && goal.job_id === job_id && goal.run_id === run_id && goalExecutionContract === executionContract && namespaceMatches && revisionMatches && persistedRefMatches && planningRevisionMatches
        const unresolvedNotMet = (goal.criteria ?? []).some((x: any) => x.result === 'NOT_MET')
        const unresolvedDrift = (goal.scope_drift ?? []).length > 0
        const acceptableResult = ['PASS','PASS_RETEST_REQUIRED'].includes(goal.result)
        if (!goalMatches || unresolvedNotMet || unresolvedDrift || !acceptableResult) {
          return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: Goal Recheck must match this Run/current planning revision/target, have exact criterion coverage, no NOT_MET/unresolved scope drift, and result PASS or PASS_RETEST_REQUIRED.' }], isError: true }
        }
      }
      if (
        executionContract === 'NEXT' &&
        ['reviewer','tester'].includes(role) &&
        lifecycle === 'COMPLETED' &&
        ['PASS','PASS_RETEST_REQUIRED'].includes(result ?? '')
      ) {
        const verified = validateRunVerificationSnapshot(run_verification_snapshot, current, role as 'reviewer' | 'tester', result ?? null)
        if (verified.error) {
          return { content: [{ type: 'text', text: 'RUN_COMPLETION_BLOCKED: ' + verified.error }], isError: true }
        }
        if (!(verification_refs ?? []).includes(verified.ref)) {
          return { content: [{ type: 'text', text: 'RUN_COMPLETION_BLOCKED: exact REVIEW/TEST Verification ref must be included in verification_refs.' }], isError: true }
        }
      }
      let handoffEvidenceBundles: any[] = []
      let handoffEvidenceAttestationRefs: any[] = []
      let handoffEvidenceVerificationRef: any = null
      let handoffEvidenceClaimRef: any = null
      const hasEvidenceVerification = Boolean(handoff?.tester_evidence_verification_snapshot)
      const hasEvidenceClaim = Boolean(handoff?.tester_evidence_claim_snapshot)
      if (hasEvidenceVerification !== hasEvidenceClaim) {
        return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: Tester evidence Handoff requires both the exact TEST/RETEST Verification snapshot and its current terminal checkpoint claim snapshot.' }], isError: true }
      }
      if (hasEvidenceVerification && hasEvidenceClaim) {
        if (
          executionContract !== 'NEXT' ||
          role !== 'tester' ||
          !current.target_revision ||
          !current.target_ref ||
          !Number.isInteger(Number(current.planning_revision))
        ) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: durable EvidenceBundle handoff requires the exact target-bound current-planning NEXT Tester Run.' }], isError: true }
        }
        const targetRef = handoff.target_ref ?? current.target_ref
        const targetRevision = handoff.target_revision ?? current.target_revision
        const verified = validateTesterEvidenceVerificationSnapshot(
          handoff.tester_evidence_verification_snapshot,
          {
            project_id,
            job_id,
            run_id,
            target_ref: targetRef,
            target_revision: targetRevision,
          },
        )
        if (verified.error) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: ' + verified.error }], isError: true }
        }
        if (recordNextMemoryNamespace(verified.record) !== nextMemoryNamespace) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: Tester evidence Verification memory_namespace mismatch.' }], isError: true }
        }
        const claimed = validateTesterEvidenceClaimSnapshot(
          handoff.tester_evidence_claim_snapshot,
          verified.record,
          {
            project_id,
            job_id,
            run_id,
            target_ref: targetRef,
            target_revision: targetRevision,
            planning_revision: Number(current.planning_revision),
          },
        )
        if (claimed.error) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: ' + claimed.error }], isError: true }
        }
        if (recordNextMemoryNamespace(claimed.record) !== nextMemoryNamespace) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: terminal checkpoint claim memory_namespace mismatch.' }], isError: true }
        }
        if (!(verification_refs ?? []).includes(verified.ref)) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: the exact applicable TEST/RETEST Verification ref must also be included in verification_refs.' }], isError: true }
        }
        handoffEvidenceBundles = verified.record.evidence_bundle_refs
        handoffEvidenceAttestationRefs = verified.record.evidence_bundle_attestation_refs
        handoffEvidenceVerificationRef = { path: verified.ref, sha: verified.sha }
        handoffEvidenceClaimRef = { path: claimed.ref, sha: claimed.sha }
      }
      const runPath = recordPath(project_id, 'RUNS', run_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      let handoffId: string | null = null
      let handoffPath: string | null = null
      let handoffText: string | null = null
      if (handoff) {
        handoffId = uuidv7()
        handoffPath = recordPath(project_id, 'HANDOFFS', handoffId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
        handoffText = prettyJson({
          handoff_id: handoffId,
          project_id,
          job_id,
          execution_contract: executionContract,
          ...(executionContract === 'NEXT' ? { memory_namespace: nextMemoryNamespace } : {}),
          source_run_id: run_id,
          next_role: handoff.next_role,
          primary_task_id: handoff.primary_task_id ?? null,
          target_ref: handoff.target_ref ?? current.target_ref ?? null,
          target_revision: handoff.target_revision ?? current.target_revision ?? null,
          completed_summary: handoff.completed_summary,
          remaining: handoff.remaining ?? [],
          required_inputs: handoff.required_inputs ?? [],
          evidence_bundle_refs: handoffEvidenceBundles,
          evidence_bundle_attestation_refs: handoffEvidenceAttestationRefs,
          evidence_verification_ref: handoffEvidenceVerificationRef,
          evidence_claim_ref: handoffEvidenceClaimRef,
          blocker_or_gate: handoff.blocker_or_gate ?? null,
          expected_next_outcome: handoff.expected_next_outcome,
          created_at: new Date().toISOString(),
        })
      }
      const terminal = {
        ...current,
        lifecycle,
        result: result ?? null,
        output_refs: output_refs ?? [],
        verification_refs: verification_refs ?? [],
        handoff_ref: handoffId,
        ended_at: new Date().toISOString(),
      }
      const externalSteps = [
        'Verify every output_ref and verification_ref already exists in durable storage before terminal Run update.',
        ...(lifecycle === 'COMPLETED' ? [
          'Independently reread the CURRENT owning Job at its contract-derived Memory path just before writing terminal Run. Reject any plan_change_pending, RETIRED/SUPERSEDED status, stale planning_revision or unexpected Job SHA; do not trust a callback-supplied snapshot.',
          ...(current.convergence_task === true ? ['Read back the exact PROJECT.md blob SHA and independently verify every incoming Working Branch disposition, closure evidence, physical ref state and handoff before completing convergence.'] : []),
          'Treat delayed completion after an exact-SHA Plan fence as stale, even when a previous Run verification or PASS result exists. Do not promote old evidence to new topology.',
        ] : []),
        ...durableSnapshotReadbackSteps(goal_recheck_snapshot ? [goal_recheck_snapshot] : [], 'Goal Recheck Verification snapshot'),
        ...durableSnapshotReadbackSteps(run_verification_snapshot ? [run_verification_snapshot] : [], 'Reviewer/Tester Run Verification snapshot'),
        ...durableSnapshotReadbackSteps(
          handoff?.tester_evidence_verification_snapshot ? [handoff.tester_evidence_verification_snapshot] : [],
          'Tester evidence Verification snapshot',
        ),
        ...durableSnapshotReadbackSteps(
          handoff?.tester_evidence_claim_snapshot ? [handoff.tester_evidence_claim_snapshot] : [],
          'terminal checkpoint claim snapshot',
        ),
      ]
      if (handoffPath) {
        externalSteps.push(
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=' + handoffPath + ') and persist handoff_record_text first.',
        )
      }
      externalSteps.push(
        'Fetch the current Run file immediately before update and require its blob SHA equals expected_run_sha.',
        'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=run_memory_path).',
        'GitHub Memory Repo: update the Run file with terminal_run_record_text using expected_run_sha exactly. On stale SHA, refetch/reconcile; never force overwrite.',
        'Read back terminal Run and any Handoff. Only then report the Run complete.',
      )
      const out = {
        run_memory_path: runPath,
        expected_run_sha: run_record_sha,
        terminal_run_record_text: prettyJson(terminal),
        handoff_id: handoffId,
        handoff_memory_path: handoffPath,
        handoff_record_text: handoffText,
        external_steps: externalSteps,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )
}
