import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'
import { knowledgePath, safeProjectName, validIntegrationBranch, isRetiredSourceBranch, parseRetiredBranchRows, resolveProjectCriteriaIntake, projectTaskCapabilityAssessment, projectCriteriaBindingError } from './project-utils.ts'
import { projectHandle, jobHandle, runHandle, uuidv7 } from './record-handles.ts'
import { formatAdvisorAdviceReceipt, parseAdvisorAdviceReceipts, projectCriteriaAdvisoryDecision } from './advisor-receipt.ts'
import { edgeFunctionSlug, normalizeGithubRepo } from './platform-utils.ts'
import { goalRecheckRunMatches, uxFirstTemporaryUiGateRequired, checkpointLeaseExpired, checkpointBoundaryPrerequisiteIds, requiredCheckpointIds } from './execution-guards.ts'
import { validateExecutionTopology, milestoneLoopDecision, normalizeNextPlanningModel, planningLoopContinuationDecision } from './planning-guards.ts'
import { projectBootstrapChecklistDecision, projectBootstrapReadinessDecision } from './bootstrap.ts'

import { BASE_AGENT_HARNESS, ROLE_HARNESSES, ROLE_SKILLS, ROLE_HOST_SKILLS, RUNTIME_SKILLS, renderHarness } from './harness-catalog.ts'

import { sourceMutationRecoveryDecision, orchestrationProgressDecision } from './recovery-decisions.ts'
import { createPlanChangeDecisions } from './plan-change-decisions.ts'
import { registerEvidenceBundleAttestationTool } from './evidence-bundle-tool.ts'
import { registerRepositoryEvidenceTools } from './evidence-repository-tools.ts'
import { registerProjectAuthorizationTools } from './project-auth-tools.ts'
import { registerProjectManagementTools } from './project-management-tools.ts'
import { registerProjectLifecycleTools } from './project-lifecycle-tools.ts'
import { registerProjectSetupTools } from './project-setup-tools.ts'
import { registerHarnessSkillTools } from './harness-skill-tools.ts'
import { registerJobPrepareTool } from './job-prepare-tool.ts'
import { registerJobTransitionTool } from './job-transition-tool.ts'
import { registerJobRevisePlanTool } from './job-revise-plan-tool.ts'
import { registerPlanReviewRecordTool } from './plan-review-record-tool.ts'
import { registerCriticReviewTools } from './critic-review-tools.ts'
import { registerCheckpointTools } from './checkpoint-tools.ts'
import { registerRunExecutionTools } from './run-execution-tools.ts'
import { registerPlanChangeTools } from './plan-change-tools.ts'
import { registerExecutionCursorTools } from './execution-cursor-tools.ts'
import { registerBrowserTestTools } from './browser-test-tools.ts'
import { registerSelftest } from './selftest.ts'
import { DEFAULT_NEXT_MEMORY_NAMESPACE, resolveExecutionContract, jobExecutionContract, invalidExecutionContract, runtimeSurface, jobCreationExecutionContractDefault, nextMemoryNamespaceForRequest } from './runtime-contract.ts'
import type { ExecutionContract, NextMemoryNamespace } from './runtime-contract.ts'
import { PROJECT_REF, AUTH_ISSUER, AUTH_SCOPES, edgeFunctionBase, mcpResource, resourceMetadata, challenge, authError, callBrowserBridge, authContext } from './request-auth-bridge.ts'
import { resolveNextMemoryNamespace, recordNextMemoryNamespace, executionMemoryRoot, recordPath, verificationPath, checkpointClaimPath, checkpointAttemptPath, parseDurableSnapshots, validateClaimSnapshots, validateVerificationSnapshots, validateCompletedTaskRunSnapshots } from './durable-record-io.ts'
import { nextDispatchPreflightError, resolveRequiredTaskSkills, goalRecheckCoverageError, validateRunVerificationSnapshot, nextClosureCoverageError, durableSnapshotReadbackSteps } from './run-dispatch-closure-guards.ts'
import { evidenceBundleRefValidationError, sha256Utf8Text, validateEvidenceBundleAttestationSnapshot, validateTesterEvidenceVerificationSnapshot, validateTesterEvidenceClaimSnapshot, checkpointVerificationApplicable } from './evidence-validation.ts'
import { evaluateNextEvidenceGate, checkpointVerificationOutcome, productFailureRetestValidationError, nextPlanSupersessionMatches } from './checkpoint-evidence-gates.ts'



const CUTOVER_INVENTORY_IDS = [
  'P3-C01','P3-C02','P3-C03','P3-C04','P3-C05','P3-C06','P3-C07','P3-C08',
  'P3-C09','P3-C10','P3-C11','P3-C12','P3-C13','P3-C14','P3-C15','P3-C16',
] as const

const CUTOVER_INVENTORY = [
  { id: 'P3-C01', owner: 'runtime path contract', disposition: 'REPLACE', production_target: 'NEXT memory_namespace=PRODUCTION resolves to projects/<project-id>.' },
  { id: 'P3-C02', owner: 'runtime path contract', disposition: 'REPLACE', production_target: 'Job/Run/Handoff/Attempt paths derive from the Job/Run memory_namespace.' },
  { id: 'P3-C03', owner: 'runtime verification contract', disposition: 'REPLACE', production_target: 'Verification paths derive from the owning record memory_namespace.' },
  { id: 'P3-C04', owner: 'checkpoint runtime', disposition: 'REPLACE', production_target: 'Checkpoint claim/attempt paths derive from the owning NEXT Job memory_namespace.' },
  { id: 'P3-C05', owner: 'Edge Function staging runtime', disposition: 'KEEP' },
  { id: 'P3-C06', owner: 'OAuth/resource routing', disposition: 'KEEP' },
  { id: 'P3-C07', owner: 'production runtime', disposition: 'KEEP' },
  { id: 'P3-C08', owner: 'execution-contract compatibility fence', disposition: 'KEEP' },
  { id: 'P3-C09', owner: 'Planner / Job creation contract', disposition: 'REPLACE', production_target: 'Production gsa-mcp defaults new Jobs to NEXT after that source is Human-approved and deployed; gsa-mcp-next staging keeps V2_STABLE default unless NEXT is explicit.' },
  { id: 'P3-C10', owner: 'runtime observability', disposition: 'REPLACE', production_target: 'Status/health report request surface, creation default, NEXT namespace and cutover readiness.' },
  { id: 'P3-C11', owner: 'regression suite', disposition: 'REPLACE', production_target: 'Selftest covers TEST_LAB and PRODUCTION namespace routing plus unresolved-inventory rejection.' },
  { id: 'P3-C12', owner: 'repository Test Lab', disposition: 'KEEP' },
  { id: 'P3-C13', owner: 'Supabase staging runtime ops', disposition: 'KEEP' },
  { id: 'P3-C14', owner: 'Memory Repo / Project control plane', disposition: 'KEEP' },
  { id: 'P3-C15', owner: 'compatibility fence / Memory Repo', disposition: 'KEEP' },
  { id: 'P3-C16', owner: 'correction governance / branch audit', disposition: 'REMOVE', retirement_evidence: 'Excluded alternate-line commit eb26729 is not imported; request-surface activation replaces its unconditional default-NEXT behavior.' },
] as const

const GSA_SOURCE_BUILD_ID = 'P3-J-7793-R2'

function cutoverInventoryError(inventory: readonly any[] = CUTOVER_INVENTORY): string | null {
  const expected = new Set<string>(CUTOVER_INVENTORY_IDS as readonly string[])
  const seen = new Set<string>()
  for (const item of inventory ?? []) {
    if (!item || typeof item.id !== 'string' || !expected.has(item.id) || seen.has(item.id)) {
      return 'CUTOVER_INVENTORY_UNRESOLVED: inventory ids must exactly match the reviewed P3 set with no duplicates.'
    }
    seen.add(item.id)
    if (typeof item.owner !== 'string' || !item.owner.trim()) {
      return 'CUTOVER_INVENTORY_UNRESOLVED: item ' + item.id + ' has unknown ownership.'
    }
    if (!['KEEP','REPLACE','REMOVE'].includes(item.disposition)) {
      return 'CUTOVER_INVENTORY_UNRESOLVED: item ' + item.id + ' has unresolved disposition.'
    }
    if (item.disposition === 'REPLACE' && (typeof item.production_target !== 'string' || !item.production_target.trim())) {
      return 'CUTOVER_INVENTORY_UNRESOLVED: REPLACE item ' + item.id + ' has no production target.'
    }
    if (item.disposition === 'REMOVE' && (typeof item.retirement_evidence !== 'string' || !item.retirement_evidence.trim())) {
      return 'CUTOVER_INVENTORY_UNRESOLVED: REMOVE item ' + item.id + ' has no retirement evidence.'
    }
  }
  if (seen.size !== expected.size || [...expected].some((id) => !seen.has(id))) {
    return 'CUTOVER_INVENTORY_UNRESOLVED: one or more reviewed P3 inventory rows are missing.'
  }
  return null
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2) + '\n'
}

const EVIDENCE_NEED_SCHEMA = z.object({
  evidence_need_id: z.string().min(1),
  kind: z.enum(['EVIDENCE_NEED','UNKNOWN_RUNTIME_FACT']).default('EVIDENCE_NEED'),
  description: z.string().min(1),
  owner_task_id: z.string().min(1),
  required_by_task_ids: z.array(z.string().min(1)).min(1),
  checkpoint_id: z.string().min(1),
})

const TEST_CHECKPOINT_SPEC_SCHEMA = z.object({
  checkpoint_id: z.string().min(1),
  mode: z.enum(['VERIFY','MEASURE','PROBE']),
  boundary: z.enum(['BEFORE_NODE','AFTER_NODE_SET','MILESTONE_GATE','JOB_FINAL']),
  prerequisite_node_ids: z.array(z.string().min(1)).default([]),
  boundary_node_id: z.string().min(1).optional(),
  milestone_id: z.string().min(1).optional(),
  evidence_need_ids: z.array(z.string().min(1)).default([]),
})

const EVIDENCE_REQUIREMENT_SCHEMA = z.object({
  evidence_requirement_id: z.string().min(1),
  consumer_task_id: z.string().min(1),
  evidence_need_id: z.string().min(1),
  checkpoint_id: z.string().min(1),
})

const CRITERIA_BINDING_SCHEMA = z.object({
  criteria_path: z.string().min(1),
  criteria_blob_sha: z.string().regex(/^[0-9a-f]{40}$/),
  approval_status: z.literal('APPROVED'),
})



/**
 * Bootstrap is a self-driving four-item checklist, NOT four extra approvals.
 * This pure coordinator routes the next action from evidence-backed observations.
 * The caller must inspect live documents/tools itself; this PREPARE result cannot
 * attest evidence, make Github writes, summon an Advisor or run other MCP tools.
 */

// M3: prepared, reviewable product Bootstrap evidence decision.
// This is not a second lifecycle or a source-write permission. M5 must check
// fresh immutable source/Memory snapshots and actual Human approval before dispatch.

// C31: one canonical Criteria file, one scoped acknowledgement after actual Advisor advice.
// This validates scope and document shape, not the origin of chat messages. A caller-supplied
// signature is not evidence that an Advisor actually advised Human; readback is mandatory.
// C31 shared writer/parser. Legacy Markdown is read, not rewritten.

// M5: reuse M3 Bootstrap assessment for the two GSA-owned consequential
// boundaries. This is a per-write evidence check, not a new Bootstrap lifecycle.
// GitHub evidence provenance and Human authorization must still be independently
// read back before the actual external GitHub source write.
function projectBootstrapExecutionError(projectId: string, manifestText: string, evidence: any,
  repositoryUrl: string | null, developmentBranch: string | null): string | null {
  if (!evidence) return 'BOOTSTRAP_REQUIRED: no approved Project Bootstrap evidence supplied.'
  if (evidence?.type === 'BOOTSTRAP_CAPABILITY_READINESS_EVIDENCE' &&
      String(evidence?.status ?? '').includes('SOURCE_EXECUTION_NOT_AUTHORIZED')) {
    return 'BOOTSTRAP_CAPABILITY_ONLY_CURRENT_PLAN_PROOF_REQUIRED: historical capability evidence is not a source-execution grant. Bind current approved Criteria, current reviewed Project Plan and compatible capabilities to new independently read-back proof of existing Human execution approval; preserve the old artifact as read-only evidence.'
  }
  const project = parseProjectManifest(manifestText)
  if (!project || project.project_id !== projectId || project.lifecycle !== 'ACTIVE')
    return 'BOOTSTRAP_PROJECT_INVALID: exact ACTIVE Project manifest required.'
  if (!repositoryUrl || !developmentBranch || !validIntegrationBranch(developmentBranch) ||
      !project.repositories.some((r: any) => r.relation === 'OWNED' &&
        normalizeGithubRepo(r.url)?.url === normalizeGithubRepo(repositoryUrl)?.url) ||
      project.branch_policies.find((p: any) => p.repository_url === normalizeGithubRepo(repositoryUrl)?.url)?.development_branch !== developmentBranch)
    return 'BOOTSTRAP_SOURCE_BRANCH_INVALID: source target must be the Human-configured Development Branch of an OWNED repository.'
  if (evidence?.assessment !== undefined) {
    const readiness = projectBootstrapReadinessDecision(projectId, evidence)
    if (readiness.status !== 'BOOTSTRAP_READY')
      return 'BOOTSTRAP_PREREQUISITE_BLOCKED: ' + readiness.status
    if (evidence.human_execution_approved !== true)
      return 'SOURCE_EXECUTION_HUMAN_APPROVAL_REQUIRED: Bootstrap readiness does not approve source execution.'
    // This tool validates input/scope only. Caller must independently read
    // source or Project Memory documents and Human execution approval.
    return null
  }
  const readiness = projectBootstrapReadinessDecision(projectId, evidence)
  if (readiness.status !== 'BOOTSTRAP_EVIDENCE_READY_EXECUTION_APPROVAL_CLAIMED')
    return 'BOOTSTRAP_PREREQUISITE_BLOCKED: ' + readiness.status
  const proof = evidence?.readback_proof
  if (!proof || proof.path !== 'projects/' + projectId + '/VERIFICATION/' + proof.name ||
      !/^[-a-zA-Z0-9_.]+\.json$/.test(String(proof.name || '')) ||
      !/^[0-9a-f]{40}$/.test(String(proof.sha || '')) ||
      !/^[0-9a-f]{40}$/.test(String(proof.criteria_sha || '')) ||
      proof.criteria_sha !== evidence.criteria_current_blob_sha ||
      !/^[0-9a-f]{40}$/.test(String(proof.reviewed_plan_sha || '')) ||
      typeof proof.human_approval_ref !== 'string' || !proof.human_approval_ref.trim())
    return 'BOOTSTRAP_READBACK_PROOF_REQUIRED: immutable reviewed Plan, approved Criteria and actual Human approval references are required.'
  // A supplied proof is not a GitHub readback. The orchestrator must re-fetch
  // its exact blob and independently establish provenance; do not call this a
  // completed source-write authorization without that external verification.
  return null
}

const MILESTONE_SCHEMA = z.object({
  milestone_id: z.string().min(1),
  name: z.string().min(1),
  node_ids: z.array(z.string().min(1)).min(1),
  gate_checkpoint_ids: z.array(z.string().min(1)).default([]),
  review_loop: z.enum(['none','rl','crl']).default('none'),
  human_pre_authorized: z.boolean().default(false),
  continuation: z.enum(['AUTO','HUMAN']).default('HUMAN'),
})

const PLANNING_TOPOLOGY_NODE_SCHEMA = z.object({
  node_id: z.string().min(1),
  node_type: z.enum(['TASK','TEST_CHECKPOINT','MILESTONE_GATE']),
  depends_on: z.array(z.string().min(1)).default([]),
})

const DURABLE_RECORD_SNAPSHOT_SCHEMA = z.object({
  path: z.string().min(1),
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  record_text: z.string().min(2),
})



function milestoneCrlEvidenceError(job: any, milestoneId: string | null, reviewerSnapshot: any, targetRevision?: string): string | null {
  const milestone = (job?.milestones ?? []).find((m: any) => m.milestone_id === milestoneId)
  if (!milestoneId || !milestone || milestone.review_loop !== 'crl' || milestone.human_pre_authorized !== true) {
    return 'CR_MILESTONE_UNAUTHORIZED: Human must have approved crl on this exact milestone.'
  }
  if (!['READY','IN_PROGRESS'].includes(job?.lifecycle) ||
      job?.planning_review?.status !== 'PASS' || job?.planning_review?.reviewed_revision !== job?.planning_revision) {
    return 'CR_MILESTONE_NOT_READY: current Job planning revision must have Reviewer PASS and be READY/IN_PROGRESS.'
  }
  if (!reviewerSnapshot?.path || !String(reviewerSnapshot.path).startsWith('projects/' + job.project_id + '/') || !validMemoryPath(reviewerSnapshot.path) || !/^[0-9a-f]{40}$/.test(String(reviewerSnapshot?.sha ?? ''))) {
    return 'CR_MILESTONE_REVIEW_MISSING: exact Reviewer PASS snapshot is required.'
  }
  let review: any
  try { review = JSON.parse(reviewerSnapshot.record_text) } catch { return 'CR_MILESTONE_REVIEW_INVALID: unreadable Reviewer snapshot.' }
  if (review.kind !== 'REVIEW' || review.result !== 'PASS' ||
      review.project_id !== job.project_id || review.job_id !== job.job_id ||
      review.planning_revision !== job.planning_revision ||
      review.milestone_id !== milestoneId || review.producer !== 'reviewer') {
    return 'CR_MILESTONE_REVIEW_INVALID: Reviewer PASS must match this Job/milestone/planning revision.'
  }
  if (job?.type === 'code' &&
      (!/^[0-9a-f]{40}$/.test(String(targetRevision ?? '')) ||
       review.target_revision !== targetRevision)) {
    return 'CR_MILESTONE_SOURCE_REVISION_MISMATCH: fresh Reviewer PASS must match exact target source revision.'
  }
  return null
}


function validateNextPlanningModel(executionContract: ExecutionContract, tasks: any[], model: any, planningRevision: number): string | null {
  const evidenceNeeds = model.evidence_needs ?? []
  const checkpoints = model.test_checkpoints ?? []
  const requirements = model.evidence_requirements ?? []
  const milestones = model.milestones ?? []
  const planningTopology = model.planning_topology ?? []
  const hasNextFields = evidenceNeeds.length || checkpoints.length || requirements.length || milestones.length || planningTopology.length

  if (executionContract === 'V2_STABLE') {
    return hasNextFields ? 'NEXT_PLANNING_FIELDS_REQUIRE_NEXT: V2_STABLE Jobs must keep CP4 planning collections empty.' : null
  }
  if (!hasNextFields) return null

  const taskIds = new Set(tasks.map((task: any) => task.task_id))
  const unique = (values: string[]) => new Set(values).size === values.length
  const evidenceNeedIds = evidenceNeeds.map((item: any) => item.evidence_need_id)
  const checkpointIds = checkpoints.map((item: any) => item.checkpoint_id)
  const milestoneIds = milestones.map((item: any) => item.milestone_id)
  const topologyIds = planningTopology.map((item: any) => item.node_id)
  if (!unique(evidenceNeedIds) || !unique(checkpointIds) || !unique(milestoneIds) || !unique(topologyIds)) {
    return 'NEXT_PLANNING_INVALID: EvidenceNeed, checkpoint, milestone and topology node IDs must be unique.'
  }
  const evidenceNeedSet = new Set(evidenceNeedIds)
  const checkpointSet = new Set(checkpointIds)
  const milestoneSet = new Set(milestoneIds)
  const knownNodeIds = new Set([...taskIds, ...checkpointIds])
  const checkpointById = new Map(checkpoints.map((item: any) => [item.checkpoint_id, item]))
  const evidenceNeedById = new Map(evidenceNeeds.map((item: any) => [item.evidence_need_id, item]))

  for (const item of evidenceNeeds) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: EvidenceNeed is not bound to the current planning revision.'
    if (!taskIds.has(item.owner_task_id) || !(item.required_by_task_ids ?? []).every((id: string) => taskIds.has(id)) || !checkpointSet.has(item.checkpoint_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceNeed owner/consumer/checkpoint references must resolve inside the current plan.'
    }
    const producer: any = checkpointById.get(item.checkpoint_id)
    if (!(producer?.evidence_need_ids ?? []).includes(item.evidence_need_id)) {
      return 'NEXT_PLANNING_INVALID: every EvidenceNeed must be declared as produced by its referenced checkpoint.'
    }
    for (const consumerTaskId of item.required_by_task_ids ?? []) {
      const hasRequirement = requirements.some((req: any) =>
        req.consumer_task_id === consumerTaskId &&
        req.evidence_need_id === item.evidence_need_id &&
        req.checkpoint_id === item.checkpoint_id
      )
      if (!hasRequirement) return 'NEXT_PLANNING_INVALID: every EvidenceNeed consumer must have a matching EvidenceRequirement.'
    }
  }
  for (const item of checkpoints) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: TestCheckpointSpec is not bound to the current planning revision.'
    if (!(item.evidence_need_ids ?? []).every((id: string) => evidenceNeedSet.has(id))) return 'NEXT_PLANNING_INVALID: checkpoint evidence_need_ids contain an unknown reference.'
    if (!(item.prerequisite_node_ids ?? []).every((id: string) => taskIds.has(id) || checkpointSet.has(id))) return 'NEXT_PLANNING_INVALID: checkpoint prerequisite_node_ids contain an unknown node.'
    if (item.boundary === 'BEFORE_NODE' && (!item.boundary_node_id || !taskIds.has(item.boundary_node_id))) return 'NEXT_PLANNING_INVALID: BEFORE_NODE requires a valid boundary_node_id.'
    if (item.boundary === 'AFTER_NODE_SET' && !(item.prerequisite_node_ids ?? []).length) return 'NEXT_PLANNING_INVALID: AFTER_NODE_SET requires prerequisite_node_ids.'
    if (item.boundary === 'MILESTONE_GATE' && (!item.milestone_id || !milestoneSet.has(item.milestone_id))) return 'NEXT_PLANNING_INVALID: MILESTONE_GATE requires a valid milestone_id.'
  }
  for (const item of requirements) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: EvidenceRequirement is not bound to the current planning revision.'
    if (!taskIds.has(item.consumer_task_id) || !evidenceNeedSet.has(item.evidence_need_id) || !checkpointSet.has(item.checkpoint_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceRequirement references must resolve to current tasks/evidence/checkpoints.'
    }
    const need: any = evidenceNeedById.get(item.evidence_need_id)
    if (need?.checkpoint_id !== item.checkpoint_id || !(need?.required_by_task_ids ?? []).includes(item.consumer_task_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceRequirement must match the EvidenceNeed producer checkpoint and declared consumer set.'
    }
  }
  for (const item of milestones) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: milestone is not bound to the current planning revision.'
    if (!(item.node_ids ?? []).every((id: string) => taskIds.has(id) || checkpointSet.has(id)) || !(item.gate_checkpoint_ids ?? []).every((id: string) => checkpointSet.has(id))) {
      return 'NEXT_PLANNING_INVALID: milestone node/gate references must resolve inside the current plan.'
    }
  }
  if ((checkpoints.length || milestones.length) && !planningTopology.length) return 'NEXT_PLANNING_INVALID: typed planning_topology is required when checkpoints or milestones exist.'
  for (const item of planningTopology) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: topology node is not bound to the current planning revision.'
    if (!knownNodeIds.has(item.node_id) || !(item.depends_on ?? []).every((id: string) => knownNodeIds.has(id))) return 'NEXT_PLANNING_INVALID: planning_topology contains an unknown node/reference.'
    if ((item.depends_on ?? []).includes(item.node_id) || !unique(item.depends_on ?? [])) return 'NEXT_PLANNING_INVALID: planning_topology dependencies must be unique and cannot self-reference.'
    if (item.node_type === 'TASK' && !taskIds.has(item.node_id)) return 'NEXT_PLANNING_INVALID: TASK topology node must reference a Task.'
    if (item.node_type === 'TEST_CHECKPOINT') {
      const checkpoint: any = checkpointById.get(item.node_id)
      if (!checkpoint || checkpoint.boundary === 'MILESTONE_GATE') return 'NEXT_PLANNING_INVALID: TEST_CHECKPOINT node must reference a non-milestone checkpoint.'
    }
    if (item.node_type === 'MILESTONE_GATE') {
      const checkpoint: any = checkpointById.get(item.node_id)
      if (!checkpoint || checkpoint.boundary !== 'MILESTONE_GATE') return 'NEXT_PLANNING_INVALID: MILESTONE_GATE node must reference a MILESTONE_GATE checkpoint.'
    }
  }
  for (const id of taskIds) if (!topologyIds.includes(id)) return 'NEXT_PLANNING_INVALID: every Task must appear in typed planning_topology.'
  for (const id of checkpointIds) if (!topologyIds.includes(id)) return 'NEXT_PLANNING_INVALID: every TestCheckpointSpec must appear in typed planning_topology.'

  const deps = new Map(planningTopology.map((item: any) => [item.node_id, item.depends_on ?? []]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const dep of (deps.get(id) as string[] ?? [])) if (hasCycle(dep)) return true
    visiting.delete(id)
    visited.add(id)
    return false
  }
  for (const id of topologyIds) if (hasCycle(id)) return 'NEXT_PLANNING_INVALID: planning_topology must be acyclic.'
  return null
}

// One small mutable source-of-progress record per NEXT Job. Not a Job/Run
// lifecycle and not the Tester CHECKPOINT_CLAIM serialization record.
// LLC58: read-only Planner classification of an explicit Human Plan Change.
// Job planning_revision is local to each Job; this assessment must never
// silently mutate historical records or grant source/memory write permission.
// A Job has not historically been required to serialize kind='JOB'.
// Legacy GSA V2 and some early NEXT records omit it. An explicit foreign
// kind remains invalid; contract and exact Project/Job identity remain the
// real durable admission boundary.
const { isRecognizedJobRecordShape, assessHumanPlanChangeJobs, prepareHumanPlanChangeIntent, prepareHumanPlanChangeFenceDecision, validatePlanChangeSupersession, resumeHumanPlanChangeIntent } = createPlanChangeDecisions({ jobExecutionContract, executionMemoryRoot, uuidv7, jobHandle, recordNextMemoryNamespace, verificationPath, DEFAULT_NEXT_MEMORY_NAMESPACE })

function executionCursorPath(projectId: string, jobId: string, namespace: NextMemoryNamespace) {
  return executionMemoryRoot(projectId, 'NEXT', namespace) +
    '/WORK/EXECUTION_CURSORS/' + jobId + '.json'
}

// Pure preflight. GitHub blob SHA compare-and-swap and independent readback are
// performed by the calling orchestrator, NOT by this request/response MCP.
function prepareExecutionCursorDecision(input: any) {
  const validSha = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
  const block = (reason: string) => ({ allowed: false, reason, operation: 'NONE', record: null })
  let job: any, old: any = null
  try { job = JSON.parse(input.job_record_text) } catch { return block('INVALID_JOB_RECORD') }
  // LLC58: distinguish historical Job contract incompatibility from wrong identity
  // or terminal lifecycle. A V2_STABLE Job cannot acquire a NEXT cursor merely
  // because the production *creation default* is NEXT.
  if (!job || typeof job !== 'object' || Array.isArray(job) ||
      (job.kind != null && job.kind !== 'JOB'))
    return block('JOB_RECORD_KIND_INVALID')
  if (job.project_id !== input.project_id) return block('PROJECT_ID_MISMATCH')
  if (job.job_id !== input.job_id) return block('JOB_ID_MISMATCH')
  if (jobExecutionContract(job) === 'V2_STABLE') return block('LEGACY_JOB_CURSOR_NOT_APPLICABLE')
  if (job.execution_contract !== 'NEXT') return block('JOB_EXECUTION_CONTRACT_INCOMPATIBLE')
  if (!Number.isInteger(job.planning_revision) || job.planning_revision < 1)
    return block('JOB_PLAN_REVISION_INVALID')
  if (!['DRAFT','READY','IN_PROGRESS'].includes(job.lifecycle)) return block('JOB_LIFECYCLE_INVALID')
  if (job.plan_change_pending) return block('PLAN_CHANGE_PENDING_FENCE')
  const namespace = recordNextMemoryNamespace(job)
  if (!namespace || namespace !== input.memory_namespace) return block('CURSOR_NAMESPACE_MISMATCH')
  if (typeof input.work_branch !== 'string' || !input.work_branch.trim() ||
      !validSha(input.observed_head_sha)) return block('INVALID_BRANCH_OR_GIT_READBACK')
  if ((input.cursor_record_text == null) !== (input.cursor_record_sha == null)) return block('INCOMPLETE_CURSOR_SNAPSHOT')
  if (input.cursor_record_text != null) {
    if (!validSha(input.cursor_record_sha)) return block('INVALID_CURSOR_SHA')
    try { old = JSON.parse(input.cursor_record_text) } catch { return block('INVALID_CURSOR_JSON') }
    if (old?.kind !== 'EXECUTION_CURSOR' || old.version !== 1 ||
        old.project_id !== input.project_id || old.job_id !== input.job_id ||
        old.execution_contract !== 'NEXT' || old.memory_namespace !== namespace ||
        old.planning_revision !== job.planning_revision ||
        old.work_branch !== input.work_branch || !validSha(old.last_good_sha) ||
        !['STABLE','PENDING'].includes(old.state)) return block('STALE_OR_INVALID_CURSOR')
  }
  let next: any
  const event = input.event
  if ((event === 'BEGIN_MUTATION' || event === 'COMPLETE_MUTATION') &&
      job.lifecycle !== 'IN_PROGRESS') return block('JOB_NOT_IN_PROGRESS')
  if (event === 'INITIALIZE') {
    if (old) return block('CURSOR_ALREADY_EXISTS')
    if (!input.checkpoint_id?.trim()) return block('CHECKPOINT_ID_REQUIRED')
    next = {
      kind: 'EXECUTION_CURSOR', version: 1,
      project_id: input.project_id, job_id: input.job_id,
      execution_contract: 'NEXT', memory_namespace: namespace,
      planning_revision: job.planning_revision, work_branch: input.work_branch,
      state: 'STABLE', last_good_sha: input.observed_head_sha,
      last_completed_checkpoint: input.checkpoint_id,
      pending_action: null, last_operation_id: null, retry_count: 0, stalled_cycles: 0, progress_fingerprint: input.observed_head_sha,
    }
  } else if (event === 'BEGIN_MUTATION') {
    // First consequential mutation initializes PENDING in a single Memory write:
    // no separate INITIALIZE round trip or Job lifecycle transition required.
    if (old && old.state !== 'STABLE') return block('PENDING_MUTATION_REQUIRES_RECONCILIATION')
    if (old && input.observed_head_sha !== old.last_good_sha) return block('SOURCE_HEAD_ADVANCED_RECONCILE')
    if (!old && !input.checkpoint_id?.trim()) return block('INITIAL_CHECKPOINT_REQUIRED')
    const kind = input.mutation_kind ?? 'FILE'
    const fileIntentValid = kind === 'FILE' && input.target_path?.trim() &&
      !input.target_path.startsWith('/') && !input.target_path.split('/').includes('..') &&
      validSha(input.intended_blob_sha) &&
      (input.previous_blob_sha === null || validSha(input.previous_blob_sha)) &&
      input.intended_blob_sha !== input.previous_blob_sha
    const treeIntentValid = kind === 'TREE' && validSha(input.previous_tree_sha) &&
      validSha(input.intended_tree_sha) && input.previous_tree_sha !== input.intended_tree_sha
    if (!input.operation_id?.trim() || !(fileIntentValid || treeIntentValid))
      return block('INVALID_WRITE_INTENT')
    next = {
      ...(old ?? {
        kind: 'EXECUTION_CURSOR', version: 1,
        project_id: input.project_id, job_id: input.job_id,
        execution_contract: 'NEXT', memory_namespace: namespace,
        planning_revision: job.planning_revision, work_branch: input.work_branch,
        last_good_sha: input.observed_head_sha,
        last_completed_checkpoint: input.checkpoint_id,
        last_operation_id: null,
        progress_fingerprint: input.observed_head_sha,
      }),
      state: 'PENDING',
      pending_action: {
        operation_id: input.operation_id, mutation_kind: kind,
        expected_head_sha: old?.last_good_sha ?? input.observed_head_sha,
        ...(kind === 'TREE'
          ? { previous_tree_sha: input.previous_tree_sha, intended_tree_sha: input.intended_tree_sha }
          : { target_path: input.target_path, previous_blob_sha: input.previous_blob_sha,
              intended_blob_sha: input.intended_blob_sha }),
      }, retry_count: 0, stalled_cycles: 0,
    }
  } else if (!old) return block('CURSOR_NOT_PERSISTED')
  else if (event === 'COMPLETE_MUTATION') {
    const pending = old.pending_action
    if (old.state !== 'PENDING' || !pending ||
        !input.operation_id || input.operation_id !== pending.operation_id ||
        !input.checkpoint_id?.trim() ||
        input.observed_head_sha === pending.expected_head_sha ||
        !validSha(input.observed_parent_sha) ||
        input.observed_parent_sha !== pending.expected_head_sha ||
        (pending.mutation_kind === 'TREE'
          ? !validSha(input.observed_tree_sha) ||
            input.observed_tree_sha !== pending.intended_tree_sha
          : !validSha(input.observed_blob_sha) ||
            input.observed_blob_sha !== pending.intended_blob_sha))
      return block('PENDING_MUTATION_NOT_PROVEN')
    next = {
      ...old, state: 'STABLE', pending_action: null,
      last_operation_id: pending.operation_id,
      last_good_sha: input.observed_head_sha, last_completed_checkpoint: input.checkpoint_id,
      retry_count: 0, stalled_cycles: 0, progress_fingerprint: input.observed_head_sha,
    }
  } else if (event === 'RECORD_RETRY') {
    const p = old.pending_action
    const unchangedTarget = p?.mutation_kind === 'TREE'
      ? validSha(input.observed_tree_sha) && input.observed_tree_sha === p.previous_tree_sha
      : (input.observed_blob_sha === null || validSha(input.observed_blob_sha)) &&
        input.observed_blob_sha !== undefined && input.observed_blob_sha === p?.previous_blob_sha
    if (old.state !== 'PENDING' || !p ||
        input.operation_id !== p.operation_id ||
        input.observed_head_sha !== p.expected_head_sha ||
        !unchangedTarget ||
        !Number.isInteger(old.retry_count) || old.retry_count >= 2)
      return block('RETRY_BLOCKED_OR_EXHAUSTED')
    // Only after an independent NOT_APPLIED readback, and before a real
    // source retry. Extra durability cost occurs solely on failure recovery.
    next = { ...old, retry_count: old.retry_count + 1 }
  } else if (event === 'SAVE_CHECKPOINT') {
    if (old.state !== 'STABLE' || input.observed_head_sha !== old.last_good_sha ||
        !input.checkpoint_id?.trim() || input.checkpoint_id === old.last_completed_checkpoint)
      return block('CHECKPOINT_NOT_PROVEN_OR_UNCHANGED')
    next = { ...old, last_completed_checkpoint: input.checkpoint_id, stalled_cycles: 0 }
  } else if (event === 'RECORD_PAUSE') {
    if (!Number.isInteger(input.stalled_cycles) || input.stalled_cycles < 3 ||
        input.observed_head_sha !== old.last_good_sha) return block('PAUSE_NOT_PROVEN')
    if (old.stalled_cycles >= input.stalled_cycles) return block('PAUSE_ALREADY_RECORDED')
    next = { ...old, stalled_cycles: input.stalled_cycles }
  } else return block('UNKNOWN_CURSOR_EVENT')
  return { allowed: true, reason: 'PREPARED_NOT_PERSISTED',
    operation: old ? 'UPDATE' : 'CREATE', record: next }
}

// Restart consumes ONE immutable cursor snapshot plus fresh source readback;
// only pending intent needs target-blob inspection. No extra per-tool queries.
function resumeExecutionCursorDecision(input: any) {
  const validSha = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
  const stop = (reason: string) => ({ disposition: 'STOP_AND_RECONCILE', reason, source_write_authorized: false })
  let job: any, cursor: any
  try { job = JSON.parse(input.job_record_text); cursor = JSON.parse(input.cursor_record_text) }
  catch { return stop('INVALID_DURABLE_RECORD') }
  if (!validSha(input.cursor_record_sha) || !validSha(input.current_head_sha) ||
      (job?.kind != null && job.kind !== 'JOB') || job.project_id !== input.project_id ||
      job.job_id !== input.job_id || job.execution_contract !== 'NEXT' ||
      cursor?.kind !== 'EXECUTION_CURSOR' || cursor.version !== 1 ||
      cursor.project_id !== job.project_id || cursor.job_id !== job.job_id ||
      cursor.execution_contract !== 'NEXT' ||
      cursor.memory_namespace !== recordNextMemoryNamespace(job) ||
      cursor.planning_revision !== job.planning_revision ||
      cursor.work_branch !== input.work_branch || !validSha(cursor.last_good_sha) ||
      !['STABLE','PENDING'].includes(cursor.state) ||
      input.cursor_memory_path !== executionCursorPath(job.project_id, job.job_id, cursor.memory_namespace))
    return stop('CURSOR_IDENTITY_OR_REVISION_MISMATCH')
  if (['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(job.lifecycle)) return stop('TERMINAL_JOB')
  if (cursor.state === 'STABLE') {
    if (cursor.pending_action != null || input.current_head_sha !== cursor.last_good_sha)
      return stop('SOURCE_ADVANCED_WITHOUT_DURABLE_INTENT')
    return { disposition: 'RESUME_FROM_CHECKPOINT', reason: cursor.last_completed_checkpoint,
      source_write_authorized: false }
  }
  const p = cursor.pending_action
  if (!p || !p.operation_id || !validSha(p.expected_head_sha) ||
      p.expected_head_sha !== cursor.last_good_sha ||
      !['FILE','TREE'].includes(p.mutation_kind ?? 'FILE'))
    return stop('INCOMPLETE_PENDING_INTENT_OR_READBACK')
  let decision: any
  if (p.mutation_kind === 'TREE') {
    if (!validSha(p.previous_tree_sha) || !validSha(p.intended_tree_sha) ||
        !validSha(input.current_tree_sha)) return stop('TREE_READBACK_REQUIRED')
    if (input.current_head_sha === p.expected_head_sha) {
      decision = input.current_tree_sha === p.previous_tree_sha
        ? { disposition: 'NOT_APPLIED', reason: 'UNCHANGED_AUTHORITATIVE_TREE', next_action: 'REAUTHORIZE_FROM_CURRENT_HEAD' }
        : { disposition: 'UNKNOWN_CONFLICT', reason: 'INCONSISTENT_HEAD_AND_TREE', next_action: 'STOP_AND_RECONCILE' }
    } else {
      decision = input.current_tree_sha === p.intended_tree_sha
        ? { disposition: 'TARGET_STATE_PRESENT', reason: 'EXPECTED_TREE_OBSERVED', next_action: 'RECONCILE_INTERVENING_COMMITS' }
        : { disposition: 'UNKNOWN_CONFLICT', reason: 'SOURCE_HEAD_OR_TREE_DIVERGED', next_action: 'STOP_AND_RECONCILE' }
    }
  } else {
    if (!p.target_path || !validSha(p.intended_blob_sha) ||
        !(p.previous_blob_sha === null || validSha(p.previous_blob_sha)) ||
        !(input.current_blob_sha === null || validSha(input.current_blob_sha)))
      return stop('FILE_READBACK_REQUIRED')
    decision = sourceMutationRecoveryDecision({
      operation_id: p.operation_id, expected_head_sha: p.expected_head_sha,
      current_head_sha: input.current_head_sha, previous_blob_sha: p.previous_blob_sha,
      intended_blob_sha: p.intended_blob_sha, current_blob_sha: input.current_blob_sha,
    })
  }
  // An unchanged target is not permission to write; reauthorize and read back first.
  return { disposition: decision.disposition, reason: decision.reason,
    next_action: decision.next_action, operation_id: p.operation_id,
    last_completed_checkpoint: cursor.last_completed_checkpoint, source_write_authorized: false }
}

// GSA Reliability: pure, read-only reconstruction helpers.
// Callers MUST obtain each input from independent authoritative Git readback.
// These decisions are NOT mutation authorization and are not a second lifecycle.
// LLC60: one typed, readback-gated *advisory* continuation after a planning
// tool's external GitHub Memory Repo writes. This is not a scheduler, a source
// mutation authorization, a substitute for a fresh Job SHA, or persisted state.

const PLANNING_LOOP_CONTINUATION_SCHEMA = z.object({
  state: z.enum(['AWAITING_DURABLE_READBACK', 'NOT_APPLICABLE']),
  next_action_after_readback: z.enum([
    'REVIEW_CURRENT_REVISION','REVISE_PLAN','PROMOTE_READY',
    'PRESENT_PLAN_FOR_APPROVAL','STOP_HUMAN_DECISION','STOP_BLOCKED','NONE',
  ]),
  next_role: z.enum(['reviewer','planner','orchestrator','human','none']),
  resume_same_turn: z.boolean(),
  requires_readback: z.boolean(),
  planning_revision: z.number().int().positive(),
  human_action_required: z.boolean(),
  mutation_authorized: z.literal(false),
})

// Product Criteria intake only; current GSA execution gates remain unchanged.



function buildProjectManifest(args: {
  projectId: string
  name: string
  lifecycle: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  repoUrl: string
  purpose?: string | null
  createdAt: string
  updatedAt: string
}) {
  const purpose = (args.purpose ?? '').replace(/\r?\n/g, ' ').trim()
  return [
    '---',
    'project_id: ' + args.projectId,
    'name: ' + args.name,
    'lifecycle: ' + args.lifecycle,
    'created_at: ' + args.createdAt,
    'updated_at: ' + args.updatedAt,
    'repo_mode: SINGLE',
    'repo_registry_status: CONFIRMED',
    'primary_repo_url: ' + args.repoUrl,
    'repo_relation: OWNED',
    'repo_url: ' + args.repoUrl,
    purpose ? 'purpose: ' + purpose : 'purpose:',
    '---',
    '',
    '# Project: ' + args.name,
    '',
    '## Repositories',
    '- PRIMARY | OWNED | ' + args.repoUrl,
    '',
    '## Runtime',
    '- Project Memory lives in the configured GSA Memory Repo.',
    '- Source truth lives in the registered Project repositories above.',
    '',
  ].join('\n')
}

// An optional, additive Project Memory contract. Branch retirement is not Git ref deletion.


function parseProjectManifest(text: string) {
  const values: Record<string, string> = {}
  for (const rawLine of text.split('\n')) {
    const idx = rawLine.indexOf(':')
    if (idx <= 0) continue
    const key = rawLine.slice(0, idx).trim()
    const value = rawLine.slice(idx + 1).trim()
    values[key] = value
  }
  const project_id = values.project_id ?? ''
  const name = values.name ?? ''
  const lifecycle = values.lifecycle ?? ''
  const legacyRepo = values.repo_url ?? ''
  const primary_repo_url = values.primary_repo_url || legacyRepo
  const purpose = values.purpose ?? ''
  const created_at = values.created_at ?? ''
  const updated_at = values.updated_at ?? ''
  if (!PROJECT_ID_PATTERN.test(project_id) || !name || !normalizeGithubRepo(primary_repo_url) || !['ACTIVE','PAUSED','ARCHIVED'].includes(lifecycle)) return null

  const repositories: Array<{ role: string; relation: string; url: string }> = []
  for (const rawLine of text.split('\n')) {
    const m = rawLine.match(/^\s*-\s*(PRIMARY|DEPENDENCY|SUPPORT|REFERENCE)\s*\|\s*(OWNED|REFERENCED)\s*\|\s*(https:\/\/github\.com\/[^\s]+)\s*$/i)
    if (m) repositories.push({ role: m[1].toUpperCase(), relation: m[2].toUpperCase(), url: m[3].replace(/\.git$/, '') })
  }
  if (!repositories.length) repositories.push({ role: 'PRIMARY', relation: 'OWNED', url: primary_repo_url })
  const dedup = [...new Map(repositories.map((r) => [r.url.toLowerCase(), r])).values()]
  const repo_mode = values.repo_mode === 'MULTI' || dedup.length > 1 ? 'MULTI' : 'SINGLE'
  const repo_registry_status = values.repo_registry_status || (values.repo_mode ? 'CONFIRMED' : 'LEGACY_UNASSESSED')
  const retired_branches = parseRetiredBranchRows(text)
  if (retired_branches === null) return null // malformed retirement rows fail closed
  // The flat fields are the legacy/single-PRIMARY shortcut; section rows support multi-repo Projects.
  // Unknown/invalid branch values are never replaced with GitHub's default branch.
  const branchRows = new Map<string, { repository_url: string; development_branch: string | null; release_branch: string | null }>()
  for (const line of text.split('\n')) {
    const row = line.match(/^\s*-\s*(?:PRIMARY|DEPENDENCY|SUPPORT|REFERENCE)\s*\|\s*(https:\/\/github\.com\/[^\s|]+)\s*\|\s*development=([^|\s]*)\s*\|\s*release=([^|\s]*)\s*$/i)
    if (!row) continue
    const normalized = normalizeGithubRepo(row[1])
    if (!normalized) continue
    branchRows.set(normalized.url.toLowerCase(), {
      repository_url: normalized.url,
      development_branch: validIntegrationBranch(row[2]) ? row[2] : null,
      release_branch: validIntegrationBranch(row[3]) ? row[3] : null,
    })
  }
  const branch_policies = dedup.map((repo) => {
    const key = repo.url.toLowerCase()
    const stored = branchRows.get(key)
    const dev = stored?.development_branch ??
      (repo.role === 'PRIMARY' && validIntegrationBranch(values.development_branch) ? values.development_branch : null)
    const release = stored?.release_branch ??
      (repo.role === 'PRIMARY' && validIntegrationBranch(values.release_branch) ? values.release_branch : null)
    const retiredConfigured = isRetiredSourceBranch(retired_branches, repo.url, dev) ||
      isRetiredSourceBranch(retired_branches, repo.url, release)
    return { repository_url: repo.url, development_branch: dev, release_branch: release,
      status: repo.relation === 'OWNED' ? (retiredConfigured ? 'RETIRED_BRANCH_CONFIGURED' : dev ? 'CONFIGURED' : 'UNCONFIGURED') : 'REFERENCE_ONLY' }
  })
  const primaryPolicy = branch_policies.find((p) => p.repository_url.toLowerCase() === primary_repo_url.toLowerCase())
  return {
    development_branch: primaryPolicy?.development_branch ?? null,
    release_branch: primaryPolicy?.release_branch ?? null,
    branch_policy_status: primaryPolicy?.status ?? 'UNCONFIGURED',
    branch_policies,
    retired_branches,
    project_id,
    name,
    lifecycle,
    repo_url: primary_repo_url,
    primary_repo_url,
    repo_mode,
    repo_registry_status,
    repositories: dedup,
    purpose,
    created_at,
    updated_at,
  }
}

function renderProjectRepositoryManifest(text: string, repositories: Array<{ role: string; relation: string; url: string }>) {
  const parsed = parseProjectManifest(text)
  if (!parsed) return null
  const normalized = repositories.map((r) => {
    const repo = normalizeGithubRepo(r.url)
    if (!repo) throw new Error('Invalid repository URL: ' + r.url)
    return { role: r.role.toUpperCase(), relation: r.relation.toUpperCase(), url: repo.url }
  })
  const primaries = normalized.filter((r) => r.role === 'PRIMARY')
  if (primaries.length !== 1) throw new Error('Exactly one PRIMARY repository is required.')
  const lines = text.split('\n')
  const out: string[] = []
  let inRepos = false
  let inserted = false
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line.startsWith('repo_mode:')) line = 'repo_mode: ' + (normalized.length > 1 ? 'MULTI' : 'SINGLE')
    else if (line.startsWith('repo_registry_status:')) line = 'repo_registry_status: CONFIRMED'
    else if (line.startsWith('primary_repo_url:')) line = 'primary_repo_url: ' + primaries[0].url
    else if (line.startsWith('repo_url:')) line = 'repo_url: ' + primaries[0].url

    if (line === '## Repositories') {
      out.push(line)
      for (const r of normalized) out.push('- ' + r.role + ' | ' + r.relation + ' | ' + r.url)
      inserted = true
      inRepos = true
      continue
    }
    if (inRepos) {
      if (line.startsWith('## ')) {
        inRepos = false
        out.push('')
        out.push(line)
      }
      continue
    }
    out.push(line)
  }
  if (!inserted) {
    out.push('', '## Repositories')
    for (const r of normalized) out.push('- ' + r.role + ' | ' + r.relation + ' | ' + r.url)
  }
  if (!out.some((l) => l.startsWith('repo_mode:'))) {
    const idx = out.indexOf('---', 1)
    if (idx > 0) out.splice(idx, 0,
      'repo_mode: ' + (normalized.length > 1 ? 'MULTI' : 'SINGLE'),
      'repo_registry_status: CONFIRMED',
      'primary_repo_url: ' + primaries[0].url
    )
  }
  return out.join('\n')
}

function transitionProjectManifest(text: string, target: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const parsed = parseProjectManifest(text)
  if (!parsed) return null
  const now = new Date().toISOString()
  const lines = text.split('\n').map((line) => {
    if (line.startsWith('lifecycle:')) return 'lifecycle: ' + target
    if (line.startsWith('updated_at:')) return 'updated_at: ' + now
    return line
  })
  return { parsed, next: lines.join('\n'), updated_at: now }
}

const PROJECT_ID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

function validMemoryPath(path: string) {
  if (typeof path !== 'string' || !path.startsWith('projects/') || path.includes('\\') || path.includes('%')) return false
  const segments = path.split('/')
  if (segments.length < 3 || !PROJECT_ID_PATTERN.test(segments[1])) return false
  return segments.slice(2).every((segment) =>
    segment !== '.' && segment !== '..' && /^[a-zA-Z0-9_.-]+$/.test(segment))
}

function validProjectManifestPath(path: string, projectId: string) {
  return PROJECT_ID_PATTERN.test(projectId) &&
    path === 'projects/' + projectId + '/PROJECT.md' && validMemoryPath(path)
}

// C14A: preserve an existing Job branch unless Planner explicitly rebinds it.
// The caller must independently verify the selected OWNED repository's Human-approved
// Development Branch and live Git ref against current PROJECT.md before persisting.
function revisedJobIntegrationBranchError(job: any, contract: ExecutionContract, requested: string | undefined): string | null {
  const effective = requested === undefined ? job?.repository_context?.integration_branch : requested
  if (effective != null && !validIntegrationBranch(effective)) {
    return 'DEVELOPMENT_BRANCH_INVALID: Job integration_branch must be a valid explicit Git ref.'
  }
  if (contract === 'NEXT' && (job?.type === 'code' || job?.plan_kind === 'PROJECT_PLAN') && !validIntegrationBranch(effective)) {
    return 'DEVELOPMENT_BRANCH_REQUIRED: NEXT code/Project Plans must bind the Human-configured Development Branch of the selected OWNED repository; never infer main/default.'
  }
  return null
}


function resolveProjectRoleAddins(projectId: string, role: 'coder' | 'tester', agentsText: string) {
  const expected = role === 'coder' ? '## Coder Add-in (optional)' : '## Tester Add-in (optional)'
  const lines = agentsText.split('\n')
  const start = lines.indexOf(expected)
  if (start < 0) return { status: 'NONE', harness_path: null as string | null, skill_paths: [] as string[], reason: 'No add-in section.' }
  const section: string[] = []
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) section.push(lines[i])
  const read = (field: string) => {
    const match = section.find((line) => line.startsWith('- ' + field + ':'))
    return match ? match.slice(('- ' + field + ':').length).trim() : 'none'
  }
  const harnessRaw = read('harness')
  const skillRaw = read('skills')
  const validate = (v: string) => v.startsWith('projects/' + projectId + '/') && validMemoryPath(v) &&
    v !== 'projects/' + projectId + '/AGENTS.md' && v !== 'projects/' + projectId + '/CRITERIA.md'
  const harnessPath = harnessRaw.toLowerCase() === 'none' ? null : harnessRaw
  const paths = skillRaw.toLowerCase() === 'none' ? [] : skillRaw.split(',').map((x) => x.trim()).filter(Boolean)
  if ((harnessPath && !validate(harnessPath)) || paths.some((p) => !validate(p))) {
    return { status: 'DENIED', harness_path: null, skill_paths: [], reason: 'Add-in path escapes active Project or references protected metadata.' }
  }
  return {
    status: harnessPath || paths.length ? 'READY' : 'NONE',
    harness_path: harnessPath, skill_paths: [...new Set(paths)],
    reason: harnessPath || paths.length ? 'Read-only Project add-in references; global harness retains authority.' : 'No optional Project add-in.',
  }
}

// M2: configured add-in paths are discovery evidence, never proof a Task is functional.

function projectScopeDecision(args: {
  project_manifest_text: string
  project_id: string
  operation: 'READ_EXTERNAL' | 'MUTATE_SOURCE' | 'MUTATE_MEMORY'
  target_repository_url?: string | null
  target_memory_path?: string | null
  user_directed_external_read?: boolean
}) {
  const parsed = parseProjectManifest(args.project_manifest_text)
  if (!parsed || parsed.project_id !== args.project_id) {
    return { allowed: false, mutation_allowed: false, scope: 'NONE', reason: 'Project identity mismatch.' }
  }
  const ownedRepos = new Set(parsed.repositories
    .filter((item: any) => item.relation === 'OWNED')
    .map((item: any) => normalizeGithubRepo(item.url)?.url)
    .filter(Boolean))
  const targetRepo = args.target_repository_url ? normalizeGithubRepo(args.target_repository_url)?.url : null

  if (args.operation === 'READ_EXTERNAL') {
    if (!targetRepo) return { allowed: false, mutation_allowed: false, scope: 'NONE', reason: 'A valid target repository is required.' }
    if (ownedRepos.has(targetRepo)) return { allowed: true, mutation_allowed: false, scope: 'ACTIVE_PROJECT_READ', reason: 'Read stays inside the active Project.' }
    if (args.user_directed_external_read === true) return { allowed: true, mutation_allowed: false, scope: 'EXPLICIT_EXTERNAL_READ', reason: 'Explicit external read is allowed without widening Project mutation scope.' }
    return { allowed: false, mutation_allowed: false, scope: 'NONE', reason: 'External read requires explicit Human reference.' }
  }

  if (parsed.lifecycle !== 'ACTIVE') {
    return { allowed: false, mutation_allowed: false, scope: 'NONE', reason: 'Project mutation requires lifecycle=ACTIVE.' }
  }
  if (args.operation === 'MUTATE_SOURCE') {
    const allowed = Boolean(targetRepo && ownedRepos.has(targetRepo))
    return {
      allowed,
      mutation_allowed: allowed,
      scope: allowed ? 'ACTIVE_PROJECT_SOURCE' : 'NONE',
      reason: allowed ? 'Source target is an OWNED repository of the active Project.' : 'Source target is outside the active Project OWNED repository set.',
    }
  }
  const expectedPrefix = 'projects/' + args.project_id + '/'
  const allowed = Boolean(args.target_memory_path && args.target_memory_path.startsWith(expectedPrefix) && validMemoryPath(args.target_memory_path))
  return {
    allowed,
    mutation_allowed: allowed,
    scope: allowed ? 'ACTIVE_PROJECT_MEMORY' : 'NONE',
    reason: allowed ? 'Memory target is inside the active Project path.' : 'Memory target is outside the active Project path.',
  }
}

async function readMemoryConfig(auth: any) {
  return auth.supabase
    .from('user_memory_config')
    .select('email, memory_repo_id, memory_repo_full_name, memory_repo_url, default_branch')
    .eq('user_id', auth.user.id)
    .maybeSingle()
}

function createServer(req: Request) {
  const server = new McpServer(
    { name: 'gpt-super-agent', version: '0.9.7' },
    {
      instructions: [
        'GPT Super Agent (GSA) runtime.',
        'BOOTSTRAP: follow fixed minimal steps with NO REASONING until Project READY; do not load planning or source context during Project open.',
        'STOPCHAT shortcut: independently re-read live Project, Job/Run/cursor and Git head; reconcile uncertain writes before safe stop, persist/readback only necessary state, then call stopchat_handoff_prepare. Its input is caller-reported, not verified by the helper; mark unresolved values UNVERIFIED. Fresh chat rechecks exact Git/Memory before authorized resume. No auto-run or background work.',
        'NEW HUMAN MESSAGE: current receiving Agent handles it, default Planner if none. LOW REASONING classify question vs action; answer questions; clarify missing material User decisions and confirm a thin skeleton before full planning. Explicit Direct Agent commands retain their routing.',
        'PLAN APPROVAL: automatically repair and re-review detailed planning until PASS, then present the plan and WAIT for explicit Human execution approval. Skeleton approval only permits planning; never auto-start new Job execution from READY.',
        'PLAN GOAL ANCHORS: write ## GOAL at the top of each new/revised plan file and ### GOAL immediately inside each Phase before Tasks; Reviewer checks all phase goals and Tasks against original Human-approved overall goal on every planning revision. No silent goal changes.',
        'PLANNER RL: recognize rl as a planning review-loop modifier in phrases planner rl, planner rl đi and planer rl. Reuse existing Planner→Reviewer→Planner repair same-turn loop until PASS or genuine Human decision/blocker/no-progress; review an identified chat draft directly without extra planning approval, but never claim GitHub persistence for an ephemeral plan. If no plan is identifiable, clarify its target. rl alone does not approve new source edits, merge or deploy.',
        'Supabase is config-only: authenticated GSA user -> one configured GitHub Memory Repo.',
        'The configured GitHub Memory Repo is the sole durable Project Memory/control plane.',
        'A GSA Project may own or reference multiple source repositories. PROJECT.md repository registry is the durable source of truth for Project repo topology.',
        'For Project Fresh Start/adoption, Planner maintains one canonical future-goal Criteria and minimal AGENTS.md; Human owns requirements, Technical Advisor gives independent read-only advice at Criteria approval/change checkpoints only, and Project READY never auto starts coding.',
        'ADMIN BRANCH POLICY: PROJECT.md persists per-repo Human-approved development_branch and release_branch; Project READY must display both or UNCONFIGURED. Planner/Coder may not infer source integration target from main/default. Use project_branch_policy_prepare, exact GitHub verification and CAS/readback before updating policy. Source writes/merges dependent on an unconfigured or stale branch are blocked; ordinary discussion/read/planning is not.',
        'For brownfield discovery, if live evidence suggests additional dependent/owned repos that are not registered, stop at a Human Gate and ask the user to confirm the Project repo set before finalizing planning.',
        'Every executable Job must identify one working repository. Even when only one repo is modified, Planner/Reviewer must inspect the registered Project repo map for cross-repo impact and record that assessment.',
        'Project source repositories remain separate source-code truth and are never silently used as the Memory Repo.',
        'The explicitly opened Project is the default operational frame. If the user starts discussing an unrelated Project without intentionally referencing it for current work, surface the mismatch before operational continuation.',
        'Before external Project reads or Project-owned source/Memory mutations, call authorize_project_scope with the exact current PROJECT.md. Explicit external read remains read-only and never widens mutation scope.',
        'All GSA memory writes are confined to the exact configured Memory Repo and paths under projects/<project-id>/.',
        'Never write GSA memory to any other repository. Fail closed on repo mismatch or path outside projects/<project-id>/.',
        'Use GitHub blob SHA optimistic concurrency for updates/deletes: fetch current file first, then update/delete with that exact SHA. Stale SHA must fail and trigger refetch/reconcile.',
        'User-facing fake CLI root is authoritative: PROJECT / DIRECT AGENT / SETTING / HELP. Root groups have no shortcuts.',
        'When user types gsa/ call get_cli_root and copy menu_text verbatim as the entire answer.',
        'Stable aliases: PROJECT list=ls, open=op, create=new, status=st, pause=pa, resume=rs, archive=ar, delete=rm; DIRECT AGENT planner=pl, advisor=advisor, designer=ds, coder=cd, reviewer=rv, critic reviewer=cr, tester=ts; SETTING GSA Account=acct, Memory Repo=repo; HELP instruction=guide, command help=help.',
        'Routing: ls/list->project_list; op/open->project_open; new/create->project_create; st/status->project_status; pa/pause->project_pause; rs/resume->project_resume; ar/archive->project_archive; rm/delete->project_delete.',
        'Direct Agent routing: pl/planner, advisor, ds/designer, cd/coder, rv/reviewer, ts/tester -> start_direct_agent. CR via explicit Human cr/crl OR preauthorized milestone crl with current Reviewer PASS; never globally auto CR.',
        'Durable Project work uses the Job runtime spine: Planner -> L0 orientation -> L1 decision context -> brownfield relationship/logic review when applicable -> meaningful Job sizing/context boundary -> job_prepare(DRAFT) -> automatic context-isolated planning review -> Planner revise/re-review loop until PASS or Human Gate -> job_transition(DRAFT->READY) -> present reviewed PASS plan -> await explicit Human execution approval -> execution Runs. Never stop the automatic review/repair loop before the plan is PASS; stop before execution until User authorizes it. Coder must self-review/repair ordinary in-scope findings and persist exact GOAL_RECHECK verification before a success handoff.',
        'Before any role execution in a durable Job, call get_agent_harness for that role and follow the returned harness_text as the runtime role contract. Critic Reviewer is HUMAN-INVOKED ONLY. It must operate stateless-by-contract: ignore conversation history as evidence and reconstruct the target from durable Project Memory, exact Job/revision, Verification artifacts and live source truth.',
        'Run records are stored under projects/<project-id>/WORK/RUNS/, Job records under WORK/JOBS/, Handoffs under WORK/HANDOFFS/, Verification under VERIFICATION/, and durable relationship/contract knowledge under KNOWLEDGE/. Use relationship_knowledge_prepare for evidence-backed precedence/reread relationships instead of inventing a new record family.',
        'Persist evidence/Verification/Handoff first and terminal Run update last. A terminal Run must never reference a record that was not persisted.',
        'Setting acct -> get_profile. Setting repo -> get_memory_repo_config or set_memory_repo_config.',
        'Internal browser QA: Designer may use browser_ui_inspect for rendered visual evidence; Tester may use browser_test_flow for bounded non-destructive functional verification. These are GPT tools, not user CLI commands.',
        'GitHub URLs are sufficient routing context; @GitHub is optional.',
        'Do not report a command complete until returned external_steps have been executed and verified through the GitHub connector.',
        'LLC59 autonomy: when CI or internal validation is RED/inconclusive, GSA must proactively use authorized GitHub connectors to inspect run/job/step/log evidence and check safe internal executable alternatives before involving Human. For real source/test defects Coder diagnoses, repairs and reruns in a bounded same-turn loop with Reviewer/Tester gates. Runner-not-started is an environment limitation, not a failing test; do not ask Human to paste unavailable or agent-readable logs.',
        'A tool result is an intermediate state unless it reaches an explicit stop condition. Within the same user turn, continue issuing the next required tool calls autonomously according to durable state/topology.',
        'Do not stop after job_prepare, job_revise_plan, plan_review_record, job_transition or run_complete merely because the call succeeded. Re-read the returned state and continue the role/tool chain until the current objective reaches READY/COMPLETED, a concrete Human Gate, or a real blocker/capability boundary.',
        'For planning work, one user request is expected to cover the complete same-turn loop: Planner discovery -> DRAFT -> planning Reviewer -> Planner repair if needed -> re-review -> DRAFT->READY. The MCP server does not call ChatGPT back; ChatGPT itself must perform each successive tool call in that turn.',
        'When a tool returns external_steps, next_role, handoff, pending review, or required transition, treat that as continuation instructions, not as a user-facing completion summary.',
      ].join(' '),
    },
  )

  server.registerTool(
    'get_cli_root',
    {
      title: 'Show GSA root menu',
      description: 'For gsa/ return menu_text verbatim. Do not translate, summarize, reflow or add commentary.',
      inputSchema: {},
      outputSchema: { menu_text: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to use GPT Super Agent.')
      const { data: memoryConfig } = await readMemoryConfig(auth)
      const memoryRepoName = memoryConfig?.memory_repo_full_name
        ? memoryConfig.memory_repo_full_name.split('/').pop() || memoryConfig.memory_repo_full_name
        : null
      const accountSummary = auth.user.id
      const memoryRepoSummary = memoryRepoName ?? 'Not configured'

      const menuText =
        'PROJECT — Manage Projects and their lifecycle.\n' +
        '  • list [ls] — List available Projects.\n' +
        '  • open [op] — Open a Project.\n' +
        '  • create [new] — Create a new Project.\n' +
        '  • status [st] — Show current Project status.\n' +
        '  • pause [pa] — Pause the active Project.\n' +
        '  • resume [rs] — Resume a paused Project.\n' +
        '  • archive [ar] — Archive without deleting source repo.\n' +
        '  • delete [rm] — Delete Project Memory after confirmation.\n\n' +
        'DIRECT AGENT — Call a specialist role directly.\n' +
        '  • planner [pl] — Plan scope, tasks and gates (rl = review/repair loop).\n' +
        '  • advisor — Technical advice to Human before Criteria approval/change.\n' +
        '  • designer [ds] — Define UI/UX and assets.\n' +
        '  • coder [cd] — Implement approved changes.\n' +
        '  • reviewer [rv] — Run context-isolated review.\n' +
        '  • critic reviewer [cr] — Human-only stateless peer review from durable evidence.\n' +
        '  • tester [ts] — Verify behavior and evidence.\n\n' +
        'SETTING — Manage GSA configuration.\n' +
        '  • GSA Account [acct] — ' + accountSummary + '\n' +
        '  • Memory Repo [repo] — ' + memoryRepoSummary + '\n\n' +
        'HELP — Usage reference.\n' +
        '  • instruction [guide] — Show GSA usage instructions.\n' +
        '  • command help [help] — Show commands and aliases.'

      return { structuredContent: { menu_text: menuText }, content: [{ type: 'text', text: menuText }] }
    },
  )

  server.registerTool(
    'get_runtime_status',
    {
      title: 'Get GSA runtime status',
      description: 'Verify authenticated GSA runtime and Memory Repo configuration state.',
      inputSchema: {},
      outputSchema: {
        phase: z.string(), mcp: z.string(), auth: z.string(), memory_repo: z.string(),
        source_build_id: z.string(), runtime_surface: z.string(), execution_contract_default: z.string(),
        next_memory_namespace: z.string(), cutover_ready: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to use GPT Super Agent.')
      const { data } = await readMemoryConfig(auth)
      const status = {
        phase: 'M2_AUTONOMOUS_SAME_TURN_ORCHESTRATION',
        mcp: 'SERVER_DEPLOYED',
        auth: 'AUTHENTICATED',
        memory_repo: data?.memory_repo_full_name ? 'CONFIGURED' : 'NOT_CONFIGURED',
        source_build_id: GSA_SOURCE_BUILD_ID,
        runtime_surface: runtimeSurface(req),
        execution_contract_default: jobCreationExecutionContractDefault(req),
        next_memory_namespace: nextMemoryNamespaceForRequest(req),
        cutover_ready: cutoverInventoryError() === null,
      }
      return { structuredContent: status, content: [{ type: 'text', text: JSON.stringify(status) }] }
    },
  )

  registerPlanChangeTools({ server, z, req, AUTH_SCOPES, authContext, authError, DEFAULT_NEXT_MEMORY_NAMESPACE, assessHumanPlanChangeJobs, jobExecutionContract, prepareHumanPlanChangeFenceDecision, prepareHumanPlanChangeIntent, prettyJson, recordNextMemoryNamespace, recordPath, resumeHumanPlanChangeIntent })

  registerExecutionCursorTools({ server, z, req, AUTH_SCOPES, authContext, authError, executionCursorPath, orchestrationProgressDecision, prepareExecutionCursorDecision, resumeExecutionCursorDecision, sourceMutationRecoveryDecision })

  registerBrowserTestTools({ server, z, req, AUTH_SCOPES, authContext, authError, callBrowserBridge })

  function validateRepositoryProbeSnapshot(
    snapshot: any,
    expected: {
      project_id: string
      job_id: string
      execution_contract: ExecutionContract
      memory_namespace?: NextMemoryNamespace | null
      repository_full_name: string
      target_ref: string
      target_revision: string
      evidence_ref: string
    },
  ) {
    if (!snapshot) return { error: 'EVIDENCE_REPO_DENY: PUBLISH requires a durable successful probe Verification snapshot.' }
    const parsed = parseDurableSnapshots([snapshot], 'binary_probe_verification_snapshot')
    if (parsed.error || parsed.entries.length !== 1) {
      return { error: 'EVIDENCE_REPO_DENY: invalid binary probe Verification snapshot.' }
    }
    const entry = parsed.entries[0]
    const record = entry.record
    const recordMemoryNamespace = recordNextMemoryNamespace(record)
    const expectedPath =
      typeof record?.verification_id === 'string'
        ? verificationPath(expected.project_id, record.verification_id, expected.execution_contract, recordMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
        : ''
    const repoMatches =
      String(record?.repository_full_name || '').toLowerCase() === expected.repository_full_name.toLowerCase()
    const valid =
      expectedPath === entry.path &&
      record?.kind === 'CAPABILITY_PROBE' &&
      record?.project_id === expected.project_id &&
      record?.job_id === expected.job_id &&
      resolveExecutionContract(record?.execution_contract) === expected.execution_contract &&
      (expected.execution_contract !== 'NEXT' || (recordMemoryNamespace != null && recordMemoryNamespace === expected.memory_namespace)) &&
      record?.producer === 'tester' &&
      record?.probe_id === 'PROBE-GIT-EVIDENCE-01' &&
      record?.capability === 'REPOSITORY_BINARY_EVIDENCE' &&
      record?.result === 'OBSERVED' &&
      repoMatches &&
      record?.target_ref === expected.target_ref &&
      record?.target_revision === expected.target_revision &&
      record?.evidence_ref === expected.evidence_ref &&
      record?.source_revision_unchanged === true &&
      record?.append_only_verified === true &&
      record?.manifest_readback_verified === true &&
      record?.artifact_readback_verified === true &&
      record?.automation_side_effects_observed === false &&
      record?.usable_as_product_evidence === false &&
      /^[0-9a-f]{40}$/.test(String(record?.evidence_commit_sha || ''))
    if (!valid) {
      return { error: 'EVIDENCE_REPO_DENY: probe Verification is not an exact successful PROBE-GIT-EVIDENCE-01 observation for this publication target.' }
    }
    return { error: null, ref: entry.path, sha: entry.sha, record }
  }


  registerRepositoryEvidenceTools({ server, z, req, AUTH_SCOPES, authContext, authError, verificationPath, uuidv7, normalizeGithubRepo, DURABLE_RECORD_SNAPSHOT_SCHEMA, jobExecutionContract, recordNextMemoryNamespace, resolveExecutionContract, prettyJson, DEFAULT_NEXT_MEMORY_NAMESPACE, parseProjectManifest, invalidExecutionContract, validateRepositoryProbeSnapshot })

  registerEvidenceBundleAttestationTool({ server, z, req, AUTH_SCOPES, authContext, authError, recordPath, verificationPath, uuidv7, sha256Utf8Text, normalizeGithubRepo, DURABLE_RECORD_SNAPSHOT_SCHEMA, jobExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, resolveExecutionContract, evidenceBundleRefValidationError, prettyJson, durableSnapshotReadbackSteps })

  server.registerTool(
    'get_profile',
    {
      title: 'Get connected GSA account',
      description: 'Return authenticated GSA account identity.',
      inputSchema: {},
      outputSchema: { user_id: z.string(), email: z.string().nullable() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }], 'openai/profile': true },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to read GSA account.')
      const result = { user_id: auth.user.id, email: auth.user.email ?? null }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  registerProjectAuthorizationTools({ server, z, req, AUTH_SCOPES, authContext, authError, normalizeGithubRepo, projectBootstrapExecutionError, projectScopeDecision, readMemoryConfig, validMemoryPath })

  registerProjectManagementTools({ server, z, req, AUTH_SCOPES, authContext, authError, readMemoryConfig, normalizeGithubRepo, uuidv7, safeProjectName, buildProjectManifest, projectHandle, validMemoryPath, renderProjectRepositoryManifest, parseProjectManifest, validProjectManifestPath })

  server.registerTool(
    'milestone_loop_evaluate',
    {
      title: 'Evaluate bounded milestone rl/crl next step',
      description: 'Read-only routing decision for Human-approved milestone review loops. Never performs source writes, invokes CR without independent evidence, creates a background task or replaces Job/Run Verifications.',
      inputSchema: {
        job_record_text: z.string().min(2),
        milestone_id: z.string().min(1),
        stage: z.enum(['BEGIN','REVIEWER','CR']),
        verdict: z.enum(['NONE','PASS','FAIL','CHANGES_REQUIRED','BLOCKED']).default('NONE'),
        no_progress_cycles: z.number().int().min(0).default(0),
      },
      outputSchema: {
        next_action: z.string(),
        next_role: z.string(),
        resume_same_turn: z.boolean(),
        reason: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ job_record_text, milestone_id, stage, verdict, no_progress_cycles }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for milestone routing.')
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job record.' }], isError: true }
      }
      const decision = milestoneLoopDecision(job, milestone_id, stage, verdict, no_progress_cycles)
      const out = {
        ...decision,
        external_steps: [
          'Re-fetch exact current Job/Plan from Project Memory and confirm planning revision plus Human milestone approval; this read-only helper does not prove caller-provided Job/Review evidence.',
          decision.next_action === 'VERIFY_REVIEWER_PASS_THEN_CR'
            ? 'Read back exact current Reviewer PASS Verification; call start_critic_review with Human-approved milestone + matching durable snapshot. Do not infer CR authority from planning PASS alone.'
            : 'Read back any required Reviewer/CR Verification and source revision before acting on a continuation; a response is not a persisted Verification or source-write permission.',
          decision.next_action === 'REPAIR_AND_REREVIEW'
            ? 'Coder/Planner repairs within approved scope, then reruns independent Reviewer. On CR FAIL the next CR may run only after new Reviewer PASS.'
            : 'Continue only when milestone AUTO is Human-approved and all related safety/permission gates are met; no background execution.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'stopchat_handoff_prepare',
    {
      title: 'Prepare a concise GSA stopchat handoff',
      description: 'Read-only presentation helper for an intentional stopchat. Does not save unverified progress or schedule background work. Reconcile pending writes/cursors and persist only actually necessary durable state BEFORE using the prepared handoff.',
      inputSchema: {
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().regex(/^[0-9a-f]{40}$/),
        selected_job_id: z.string().uuid().nullable().optional(),
        selected_milestone: z.string().nullable().optional(),
        source_commit_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable().optional(),
        criteria_revision: z.string().nullable().optional(),
        plan_revision: z.string().nullable().optional(),
        verified_progress: z.array(z.string()).default([]),
        uncertain_writes: z.array(z.string()).default([]),
        human_approvals: z.array(z.string()).default([]),
        blockers: z.array(z.string()).default([]),
        next_action: z.string().min(1),
      },
      outputSchema: {
        project_id: z.string(),
        handoff_text: z.string(),
        pending_reconciliation: z.boolean(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ memory_path, project_manifest_text, project_manifest_sha, selected_job_id, selected_milestone, source_commit_sha, criteria_revision, plan_revision, verified_progress, uncertain_writes, human_approvals, blockers, next_action }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for stopchat handoff.')
      // Validate the Git blob identity of supplied bytes BEFORE trusting manifest branch or approvals.
      // This is an integrity check only, not a substitute for independent GitHub readback.
      const manifestBytes = new TextEncoder().encode(project_manifest_text)
      const gitPrefix = new TextEncoder().encode('blob ' + manifestBytes.length + '\0')
      const gitBlob = new Uint8Array(gitPrefix.length + manifestBytes.length)
      gitBlob.set(gitPrefix)
      gitBlob.set(manifestBytes, gitPrefix.length)
      const actualManifestSha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', gitBlob)))
        .map((byte) => byte.toString(16).padStart(2, '0')).join('')
      if (actualManifestSha !== project_manifest_sha) {
        return { content: [{ type: 'text', text: 'STOPCHAT_MANIFEST_SHA_MISMATCH: caller-provided PROJECT.md bytes do not match claimed Git blob SHA.' }], isError: true }
      }
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed || !validProjectManifestPath(memory_path, parsed.project_id)) {
        return { content: [{ type: 'text', text: 'STOPCHAT_PROJECT_MISMATCH: exact active PROJECT.md is required.' }], isError: true }
      }
      const clean = (v: any) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, 500)
      const items = (values: any[], fallback: string) =>
        (values?.length ? values.map((v: any) => '- ' + clean(v)).join('\n') : '- ' + fallback)
      const pending = (uncertain_writes ?? []).length > 0
      const text = [
        'GSA stopchat — resume handoff (not execution authorization)', 'Evidence status: caller-supplied; independently re-check before relying on any field.', '',
        'Project: ' + clean(parsed.name) + ' [' + parsed.project_id + ']',
        'Source repository: ' + parsed.primary_repo_url,
        'Development Branch: ' + (parsed.development_branch ?? 'UNCONFIGURED'),
        'Release Branch: ' + (parsed.release_branch ?? 'NOT_CONFIGURED'),
        'Source commit (caller-reported; verify live): ' + (source_commit_sha ?? 'UNVERIFIED'),
        'Project Memory reference (caller-reported; recheck blob): ' + memory_path + ' @ ' + project_manifest_sha,
        'Criteria revision (caller-reported): ' + clean(criteria_revision || 'UNVERIFIED'),
        'Plan revision (caller-reported): ' + clean(plan_revision || 'UNVERIFIED'),
        'Selected Job: ' + clean(selected_job_id || 'NONE'),
        'Milestone: ' + clean(selected_milestone || 'NONE'), '',
        'Progress reported (not independently verified):', items(verified_progress, 'none supplied'), '',
        'Uncertain writes / reconcile before retry:', items(uncertain_writes, 'none reported'), '',
        'Human approvals reported (NOT verified; do not infer authority):', items(human_approvals, 'none supplied; do not infer approval'), '',
        'Blockers reported:', items(blockers, 'none reported'), '',
        'NEXT ACTION: ' + clean(next_action), '',
        'To resume in a fresh chat: open this GSA Project, read exact Project Memory and live source HEAD/Job evidence; confirm the requested next action and applicable Human scope. Never auto-run merely because a chat opened.',
      ].join('\n')
      const out = {
        project_id: parsed.project_id,
        handoff_text: text,
        pending_reconciliation: pending,
        external_steps: [
          'Stop at a safe boundary. When an active Job/pending source write exists, persist/read back only necessary cursor/Job/Verification state before sharing this handoff.',
          'Re-fetch current PROJECT.md from the configured Memory Repo and compare blob SHA=' + project_manifest_sha + ', source HEAD and any active Job/cursor before treating details as verified.',
          pending
            ? 'Uncertain writes exist. Re-read source blob/HEAD and durable cursor; never retry the write blindly. Clearly label any unresolved result UNVERIFIED.'
            : 'No uncertain writes were supplied; absence is caller-reported. Do not create a redundant checkpoint solely for stopchat.',
          'This tool is read-only; it does not validate caller-provided progress, approval, source HEAD or state. Verify actual Human authority and Git/Memory readback independently; it does not save state, close ChatGPT, create a Job, trigger background work or grant execution authority.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  registerProjectSetupTools({ server, z, req, AUTH_SCOPES, authContext, authError, parseProjectManifest, validProjectManifestPath, resolveProjectCriteriaIntake, projectCriteriaAdvisoryDecision, resolveProjectRoleAddins, projectTaskCapabilityAssessment, projectBootstrapChecklistDecision, projectBootstrapReadinessDecision, normalizeGithubRepo, formatAdvisorAdviceReceipt, parseAdvisorAdviceReceipts, projectCriteriaBindingError, validIntegrationBranch, CRITERIA_BINDING_SCHEMA, isRetiredSourceBranch, PROJECT_ID_PATTERN })

  registerProjectLifecycleTools({ server, z, req, AUTH_SCOPES, authContext, authError, parseProjectManifest, validProjectManifestPath, projectHandle, transitionProjectManifest })

  registerHarnessSkillTools({ server, z, req, AUTH_SCOPES, authContext, authError, renderHarness, ROLE_HARNESSES, ROLE_SKILLS, ROLE_HOST_SKILLS, RUNTIME_SKILLS })

  registerJobPrepareTool({ server, z, req, AUTH_SCOPES, authContext, authError, jobCreationExecutionContractDefault, CRITERIA_BINDING_SCHEMA, EVIDENCE_NEED_SCHEMA, TEST_CHECKPOINT_SPEC_SCHEMA, EVIDENCE_REQUIREMENT_SCHEMA, MILESTONE_SCHEMA, PLANNING_TOPOLOGY_NODE_SCHEMA, PLANNING_LOOP_CONTINUATION_SCHEMA, DEFAULT_NEXT_MEMORY_NAMESPACE, uuidv7, jobHandle, validIntegrationBranch, parseProjectManifest, projectCriteriaBindingError, planningLoopContinuationDecision, normalizeGithubRepo, renderHarness, jobExecutionContract, resolveExecutionContract, nextMemoryNamespaceForRequest, validateExecutionTopology, readMemoryConfig, invalidExecutionContract, cutoverInventoryError, executionMemoryRoot, normalizeNextPlanningModel, validateNextPlanningModel, recordPath, prettyJson })

  registerJobTransitionTool({ server, z, req, AUTH_SCOPES, authContext, authError, PLANNING_LOOP_CONTINUATION_SCHEMA, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, planningLoopContinuationDecision, prettyJson, recordPath, DEFAULT_NEXT_MEMORY_NAMESPACE })

  registerJobRevisePlanTool({ server, z, req, AUTH_SCOPES, authContext, authError, CRITERIA_BINDING_SCHEMA, PLANNING_LOOP_CONTINUATION_SCHEMA, EVIDENCE_NEED_SCHEMA, TEST_CHECKPOINT_SPEC_SCHEMA, EVIDENCE_REQUIREMENT_SCHEMA, MILESTONE_SCHEMA, PLANNING_TOPOLOGY_NODE_SCHEMA, projectCriteriaBindingError, normalizeNextPlanningModel, validateNextPlanningModel, validateExecutionTopology, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, prettyJson, planningLoopContinuationDecision, revisedJobIntegrationBranchError, recordPath, DEFAULT_NEXT_MEMORY_NAMESPACE })

  registerPlanReviewRecordTool({ server, z, req, AUTH_SCOPES, authContext, authError, PLANNING_LOOP_CONTINUATION_SCHEMA, jobExecutionContract, invalidExecutionContract, projectCriteriaBindingError, planningLoopContinuationDecision, prettyJson, verificationPath, recordPath, DEFAULT_NEXT_MEMORY_NAMESPACE, recordNextMemoryNamespace, validateExecutionTopology, validIntegrationBranch, validateNextPlanningModel, uuidv7 })

  registerCriticReviewTools({ DURABLE_RECORD_SNAPSHOT_SCHEMA, AUTH_SCOPES, authContext, authError, req, z, server, uuidv7, prettyJson, verificationPath, jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, DEFAULT_NEXT_MEMORY_NAMESPACE, milestoneCrlEvidenceError })

  registerCheckpointTools({ server, z, req, AUTH_SCOPES, authContext, authError, DURABLE_RECORD_SNAPSHOT_SCHEMA, checkpointLeaseExpired, checkpointBoundaryPrerequisiteIds, prettyJson, uuidv7, verificationPath, jobExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, durableSnapshotReadbackSteps, evaluateNextEvidenceGate, resolveExecutionContract, validateClaimSnapshots, validateVerificationSnapshots, validateCompletedTaskRunSnapshots, checkpointClaimPath, checkpointVerificationApplicable, checkpointAttemptPath, productFailureRetestValidationError, normalizeGithubRepo, validateEvidenceBundleAttestationSnapshot, checkpointVerificationOutcome })

  registerRunExecutionTools({ server, z, req, AUTH_SCOPES, authContext, authError, DURABLE_RECORD_SNAPSHOT_SCHEMA, DEFAULT_NEXT_MEMORY_NAMESPACE , jobExecutionContract, invalidExecutionContract, recordNextMemoryNamespace, projectBootstrapExecutionError, parseDurableSnapshots, resolveRequiredTaskSkills, nextDispatchPreflightError, evaluateNextEvidenceGate, normalizeGithubRepo, uxFirstTemporaryUiGateRequired, uuidv7, runHandle, recordPath, prettyJson, durableSnapshotReadbackSteps, knowledgePath, goalRecheckRunMatches, resolveExecutionContract, goalRecheckCoverageError, verificationPath, validateRunVerificationSnapshot, validateTesterEvidenceVerificationSnapshot, validateTesterEvidenceClaimSnapshot })

  server.registerTool(
    'start_direct_agent',
    {
      title: 'Start a Direct Agent',
      description: 'Handler for pl/advisor/ds/cd/rv/ts. CR uses the separate Human-only start_critic_review path. Direct work is ephemeral by default.',
      inputSchema: {
        role: z.enum(['planner','advisor','designer','coder','reviewer','tester']),
        objective: z.string().optional(),
        target_url: z.string().url().optional(),
      },
      outputSchema: {
        role: z.string(),
        mode: z.string(),
        ephemeral: z.boolean(),
        purpose: z.string(),
        source_write: z.boolean(),
        expected_output: z.string(),
        objective: z.string().nullable(),
        target_url: z.string().nullable(),
        execution_state: z.literal('ADMITTED_NOT_EXECUTED'),
        advisor_harness: z.string().nullable(),
        next_action: z.string(),
        rules: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ role, objective, target_url }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to start a Direct Agent.')
      const contracts: Record<string, { purpose: string; source_write: boolean; output: string }> = {
        planner: { purpose: 'Plan scope, tasks, dependencies and gates.', source_write: false, output: 'Plan / Project or Job proposal' },
        advisor: { purpose: 'Advise Human on feasibility and technical effects before Criteria approval/change.', source_write: false, output: 'Read-only technical advice' },
        designer: { purpose: 'Define UI/UX and asset requirements.', source_write: false, output: 'Design / Asset Requirement' },
        coder: { purpose: 'Implement approved source changes.', source_write: true, output: 'Source diff + Goal Recheck + evidence' },
        reviewer: { purpose: 'Run context-isolated review.', source_write: false, output: 'Findings + review result' },
        tester: { purpose: 'Verify behavior and evidence.', source_write: false, output: 'Test / Retest evidence' },
      }
      const contract = contracts[role]
      const result = {
        role,
        mode: 'DIRECT_AGENT',
        ephemeral: true,
        purpose: contract.purpose,
        source_write: contract.source_write,
        expected_output: contract.output,
        objective: objective ?? null,
        target_url: target_url ?? null,
        execution_state: 'ADMITTED_NOT_EXECUTED',
        advisor_harness: role === 'advisor' ? renderHarness('advisor') : null,
        next_action: role === 'advisor'
          ? 'RUN_ADVISOR_CONSULTATION_IN_HOST_AND_DELIVER_ADVICE_TO_HUMAN'
          : 'RUN_ROLE_IN_HOST',
        rules: [
          'Direct work is ephemeral by default.',
          'If target belongs to an existing owning Project, Project governance wins.',
          'Promotion to durable Project/Job state requires an explicit promotion packet.',
          role === 'reviewer' ? 'Reviewer is context-isolated and source read-only.' : 'Respect role authority and connected-app permissions.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_instruction',
    {
      title: 'Show GSA usage instructions',
      description: 'Handler for guide.',
      inputSchema: {},
      outputSchema: { instruction_text: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to read GSA instructions.')
      const instructionText = [
        'GSA usage',
        '1. Configure SETTING -> Memory Repo once using a private GitHub repository.',
        '2. Project Memory is stored only under projects/<project-id>/ in that repo.',
        '3. PROJECT create [new] binds a separate GitHub source repository to durable Project Memory.',
        '4. Paste GitHub URLs directly; @GitHub is optional.',
        '5. Updates use blob SHA optimistic concurrency; stale writes must refetch/reconcile.',
        '6. Supabase stores user configuration only, never Project/Job/Run memory.',
      ].join('\n')
      return { structuredContent: { instruction_text: instructionText }, content: [{ type: 'text', text: instructionText }] }
    },
  )

  server.registerTool(
    'get_command_help',
    {
      title: 'Show GSA command help',
      description: 'Handler for help.',
      inputSchema: { command: z.string().optional() },
      outputSchema: { help_text: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ command }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to read command help.')
      const helpText = command
        ? 'Command help requested for: ' + command + '. Use canonical aliases exactly.'
        : [
            'PROJECT: list[ls], open[op], create[new], status[st], pause[pa], resume[rs], archive[ar], delete[rm]',
            'DIRECT AGENT: planner[pl], designer[ds], coder[cd], reviewer[rv], critic reviewer[cr] (Human-only, stateless review), tester[ts]',
            'SETTING: GSA Account[acct], Memory Repo[repo]',
            'HELP: instruction[guide], command help[help]',
          ].join('\n')
      return { structuredContent: { help_text: helpText }, content: [{ type: 'text', text: helpText }] }
    },
  )

  return server
}

const root = new Hono()
const app = new Hono()

registerSelftest(app, { CUTOVER_INVENTORY, PROJECT_REF, buildProjectManifest, checkpointAttemptPath, checkpointClaimPath, checkpointVerificationApplicable, checkpointVerificationOutcome, cutoverInventoryError, edgeFunctionBase, evaluateNextEvidenceGate, evidenceBundleRefValidationError, goalRecheckCoverageError, jobCreationExecutionContractDefault, mcpResource, nextClosureCoverageError, nextDispatchPreflightError, nextMemoryNamespaceForRequest, nextPlanSupersessionMatches, parseProjectManifest, prettyJson, productFailureRetestValidationError, projectScopeDecision, recordPath, resolveExecutionContract, resolveNextMemoryNamespace, resolveRequiredTaskSkills, resourceMetadata, runtimeSurface, transitionProjectManifest, validMemoryPath, validateEvidenceBundleAttestationSnapshot, validateRunVerificationSnapshot, validateTesterEvidenceClaimSnapshot, verificationPath })

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'gpt-super-agent',
    phase: 'M2_AUTONOMOUS_SAME_TURN_ORCHESTRATION',
    oauth: true,
    source_build_id: GSA_SOURCE_BUILD_ID,
    runtime_surface: runtimeSurface(c.req.raw),
    execution_contract_default: jobCreationExecutionContractDefault(c.req.raw),
    next_memory_namespace: nextMemoryNamespaceForRequest(c.req.raw),
    cutover_ready: cutoverInventoryError() === null,
  }),
)

app.get('/.well-known/oauth-protected-resource', (c) =>
  c.json({ resource: mcpResource(c.req.raw), authorization_servers: [AUTH_ISSUER], scopes_supported: AUTH_SCOPES }),
)

app.all('/mcp', async (c) => {
  const authHeader = c.req.raw.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', error_description: 'Connect your GPT Super Agent account to continue.' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': challenge(c.req.raw, 'invalid_token', 'Connect your GPT Super Agent account to continue'),
          'Cache-Control': 'no-store',
        },
      },
    )
  }
  const transport = new WebStandardStreamableHTTPServerTransport()
  const server = createServer(c.req.raw)
  await server.connect(transport)
  const response = await transport.handleRequest(c.req.raw)
  // R-00: Opt-in size-only measurement. Do NOT store response bodies, do
  // NOT equate HTTP transport bytes to model input tokens. For streamed
  // responses only emit a count after successful completion, never a guessed
  // Content-Length. Default-off prevents production-side overhead.
  if (Deno.env.get('GSA_CONTEXT_METER_HEADERS') === '1') {
    // Labels are operator-provided non-sensitive identifiers, never extracted
    // from user payloads, sessions, request paths, or authentication headers.
    const rawRun = Deno.env.get('GSA_CONTEXT_RUN_ID') ?? ''
    const rawSha = Deno.env.get('GSA_CONTEXT_RUNTIME_SHA') ?? ''
    const runId = /^[a-zA-Z0-9_-]{1,64}$/.test(rawRun) ? rawRun : null
    const runtimeSha = /^[a-f0-9]{40}$/.test(rawSha) ? rawSha : null
    const sample = {
      metric: 'gsa-mcp-http-response-bytes', version: 1,
      run_id: runId, runtime_sha: runtimeSha,
      eligible_for_baseline: runId !== null && runtimeSha !== null,
      visibility: 'HOST_UNKNOWN', completeness: 'COMPLETE'
    }
    const len = response.headers.get('content-length')
    const headers = new Headers(response.headers)
    if (len !== null && /^\d+$/.test(len) && Number.isSafeInteger(Number(len))) {
      headers.set('X-GSA-Context-Proxy-Version', 'v1')
      headers.set('X-GSA-Context-Response-Bytes', len)
      headers.set('X-GSA-Context-Visibility', 'HOST_UNKNOWN')
      // Log a size-only sample for the Content-Length path as well.
      console.info(JSON.stringify({ ...sample, bytes: Number(len), source: 'CONTENT_LENGTH' }))
      return new Response(response.body, { status: response.status,
        statusText: response.statusText, headers })
    }
    if (response.body && response.status !== 204 && response.status !== 304) {
      let transferredBytes = 0
      const counter = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          transferredBytes += chunk.byteLength
          controller.enqueue(chunk)
        },
        flush() {
          // Only numerical transport metadata; no payload, user ID, URL or text.
          console.info(JSON.stringify({
            ...sample, bytes: transferredBytes, source: 'STREAM_COUNT'
          }))
        }
      })
      // Never set Content-Length for an unknown-sized stream; leave status and
      // all other headers unchanged. Cancellation/stream errors do not flush.
      return new Response(response.body.pipeThrough(counter), {
        status: response.status, statusText: response.statusText, headers
      })
    }
  }
  return response
})

root.route('/gsa-mcp', app)
root.route('/gsa-mcp-next', app)
root.route('/:slug{gsa-mcp-[a-z0-9-]+}', app) // Hono constrained first-segment parameter admits isolated staging slugs only
Deno.serve(root.fetch)
