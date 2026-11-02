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

const PROJECT_REF = 'fbyqktduoqlpbbtkghkf'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? `https://${PROJECT_REF}.supabase.co`
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const AUTH_ISSUER = `${SUPABASE_URL}/auth/v1`
const AUTH_SCOPES = ['email', 'profile']
const BROWSER_BRIDGE_URL = Deno.env.get('GSA_BROWSER_BRIDGE_URL') ?? 'https://gpt-supper-agent.vercel.app/api/browser'

const EXECUTION_CONTRACT_VALUES = ['V2_STABLE', 'NEXT'] as const
type ExecutionContract = typeof EXECUTION_CONTRACT_VALUES[number]
const DEFAULT_EXECUTION_CONTRACT: ExecutionContract = 'V2_STABLE'

const NEXT_MEMORY_NAMESPACE_VALUES = ['TEST_LAB', 'PRODUCTION'] as const
type NextMemoryNamespace = typeof NEXT_MEMORY_NAMESPACE_VALUES[number]
const DEFAULT_NEXT_MEMORY_NAMESPACE: NextMemoryNamespace = 'TEST_LAB'

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

function resolveExecutionContract(value: unknown): ExecutionContract | null {
  if (value == null || value === '') return DEFAULT_EXECUTION_CONTRACT
  return value === 'V2_STABLE' || value === 'NEXT' ? value : null
}

function jobExecutionContract(job: any): ExecutionContract | null {
  return resolveExecutionContract(job?.execution_contract)
}


function invalidExecutionContract() {
  return {
    content: [{ type: 'text' as const, text: 'Invalid execution_contract. Expected V2_STABLE or NEXT; missing defaults to V2_STABLE.' }],
    isError: true,
  }
}



function runtimeSurface(req: Request) {
  return edgeFunctionSlug(req) === 'gsa-mcp' ? 'PRODUCTION' as const : 'STAGING_NEXT' as const
}

function jobCreationExecutionContractDefault(req: Request): ExecutionContract {
  return runtimeSurface(req) === 'PRODUCTION' ? 'NEXT' : 'V2_STABLE'
}

function nextMemoryNamespaceForRequest(req: Request): NextMemoryNamespace {
  return runtimeSurface(req) === 'PRODUCTION' ? 'PRODUCTION' : 'TEST_LAB'
}

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

function edgeFunctionBase(req: Request) {
  // Resource identity is public HTTPS even when the edge gateway forwards an internal HTTP URL.
  // Never derive an OAuth protected resource origin from untrusted proxy/request origin.
  return `https://${PROJECT_REF}.supabase.co/functions/v1/${edgeFunctionSlug(req)}`
}

function mcpResource(req: Request) {
  return edgeFunctionBase(req) + '/mcp'
}

function resourceMetadata(req: Request) {
  return edgeFunctionBase(req) + '/.well-known/oauth-protected-resource'
}

function challenge(req: Request, error = 'invalid_token', description = 'Sign in to GPT Super Agent to continue') {
  return `Bearer resource_metadata="${resourceMetadata(req)}", scope="${AUTH_SCOPES.join(' ')}", error="${error}", error_description="${description}"`
}

function authError(req: Request, description: string) {
  return {
    content: [{ type: 'text' as const, text: description }],
    isError: true,
    _meta: { 'mcp/www_authenticate': [challenge(req, 'invalid_token', description)] },
  }
}

async function callBrowserBridge(req: Request, payload: Record<string, unknown>) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) throw new Error('Authentication required for browser QA.')

  const response = await fetch(BROWSER_BRIDGE_URL, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(110_000),
  })

  const text = await response.text()
  let data: any = null
  try { data = JSON.parse(text) } catch {
    throw new Error('Browser bridge returned invalid JSON (HTTP ' + response.status + ').')
  }

  if (!response.ok || !data?.ok) {
    throw new Error('Browser bridge failed: ' + String(data?.error ?? ('HTTP ' + response.status)))
  }

  return data
}

async function authContext(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { token, user: data.user, supabase }
}



function resolveNextMemoryNamespace(value: unknown, executionContract: ExecutionContract | null = 'NEXT'): NextMemoryNamespace | null {
  if (executionContract !== 'NEXT') return null
  if (value == null || value === '') return DEFAULT_NEXT_MEMORY_NAMESPACE
  return value === 'TEST_LAB' || value === 'PRODUCTION' ? value : null
}

function recordNextMemoryNamespace(record: any): NextMemoryNamespace | null {
  const executionContract = resolveExecutionContract(record?.execution_contract)
  return resolveNextMemoryNamespace(record?.memory_namespace, executionContract)
}

function sameNextMemoryNamespace(a: any, b: any) {
  const aContract = resolveExecutionContract(a?.execution_contract)
  const bContract = resolveExecutionContract(b?.execution_contract)
  if (aContract !== 'NEXT' || bContract !== 'NEXT') return aContract === bContract
  return recordNextMemoryNamespace(a) === recordNextMemoryNamespace(b)
}

function executionMemoryRoot(
  projectId: string,
  executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT,
  nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE,
) {
  if (executionContract !== 'NEXT') return 'projects/' + projectId
  return nextMemoryNamespace === 'PRODUCTION'
    ? 'projects/' + projectId
    : 'projects/' + projectId + '/TEST-LAB/NEXT'
}

function recordPath(
  projectId: string,
  family: 'JOBS' | 'RUNS' | 'HANDOFFS' | 'CHECKPOINT_ATTEMPTS',
  recordId: string,
  executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT,
  nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE,
) {
  return executionMemoryRoot(projectId, executionContract, nextMemoryNamespace) + '/WORK/' + family + '/' + recordId + '.json'
}

function verificationPath(
  projectId: string,
  verificationId: string,
  executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT,
  nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE,
) {
  return executionMemoryRoot(projectId, executionContract, nextMemoryNamespace) + '/VERIFICATION/' + verificationId + '.json'
}

function checkpointClaimPath(
  projectId: string,
  jobId: string,
  planningRevision: number,
  checkpointId: string,
  nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE,
) {
  return executionMemoryRoot(projectId, 'NEXT', nextMemoryNamespace) + '/WORK/CHECKPOINT_CLAIMS/' + jobId + '/r' + planningRevision + '/' + encodeURIComponent(checkpointId) + '.json'
}

function checkpointAttemptPath(projectId: string, attemptId: string, nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE) {
  return recordPath(projectId, 'CHECKPOINT_ATTEMPTS', attemptId, 'NEXT', nextMemoryNamespace)
}


function parseRecordTexts(texts: string[], label: string) {
  const records: any[] = []
  for (const text of texts ?? []) {
    try { records.push(JSON.parse(text)) } catch {
      return { records: [], error: label + ' contains invalid JSON.' }
    }
  }
  return { records, error: null as string | null }
}

function parseDurableSnapshots(snapshots: any[], label: string) {
  const entries: any[] = []
  for (const snapshot of snapshots ?? []) {
    if (!snapshot || typeof snapshot.path !== 'string' || !snapshot.path || typeof snapshot.sha !== 'string' || !/^[0-9a-f]{40}$/.test(snapshot.sha) || typeof snapshot.record_text !== 'string') {
      return { entries: [], error: label + ' contains an invalid durable snapshot envelope.' }
    }
    let record: any
    try { record = JSON.parse(snapshot.record_text) } catch {
      return { entries: [], error: label + ' contains invalid record JSON.' }
    }
    entries.push({ path: snapshot.path, sha: snapshot.sha, record_text: snapshot.record_text, record })
  }
  return { entries, error: null as string | null }
}

function validateClaimSnapshots(entries: any[], label: string) {
  for (const entry of entries) {
    const record = entry.record
    if (record?.kind !== 'CHECKPOINT_CLAIM' || record.execution_contract !== 'NEXT') return label + ' contains a non-NEXT checkpoint claim.'
    const memoryNamespace = recordNextMemoryNamespace(record)
    if (!memoryNamespace) return label + ' contains a NEXT checkpoint claim with invalid memory_namespace.'
    if (entry.path !== checkpointClaimPath(record.project_id, record.job_id, record.planning_revision, record.checkpoint_id, memoryNamespace)) {
      return label + ' path does not match the deterministic checkpoint claim path.'
    }
  }
  return null
}

function validateVerificationSnapshots(entries: any[], label: string) {
  for (const entry of entries) {
    const record = entry.record
    if (!['TEST','RETEST'].includes(record?.kind) || record.execution_contract !== 'NEXT' || typeof record.verification_id !== 'string') {
      return label + ' contains a non-NEXT TEST/RETEST Verification.'
    }
    const memoryNamespace = recordNextMemoryNamespace(record)
    if (!memoryNamespace) return label + ' contains a NEXT Verification with invalid memory_namespace.'
    if (entry.path !== verificationPath(record.project_id, record.verification_id, 'NEXT', memoryNamespace)) {
      return label + ' path does not match the deterministic Verification path.'
    }
  }
  return null
}

function validateCompletedTaskRunSnapshots(job: any, entries: any[]) {
  const completed = new Set<string>()
  const jobMemoryNamespace = recordNextMemoryNamespace(job)
  if (jobExecutionContract(job) === 'NEXT' && !jobMemoryNamespace) {
    return { completed, error: 'owning NEXT Job has invalid memory_namespace.' }
  }
  for (const entry of entries) {
    const run = entry.record
    const runMemoryNamespace = recordNextMemoryNamespace(run)
    if (
      resolveExecutionContract(run?.execution_contract) !== 'NEXT' ||
      !jobMemoryNamespace ||
      runMemoryNamespace !== jobMemoryNamespace ||
      run.project_id !== job.project_id ||
      run.job_id !== job.job_id ||
      run.planning_revision !== job.planning_revision ||
      run.lifecycle !== 'COMPLETED' ||
      !['PASS','PASS_RETEST_REQUIRED'].includes(run.result) ||
      typeof run.run_id !== 'string' ||
      typeof run.primary_task_id !== 'string'
    ) return { completed, error: 'completed_task_run_snapshots contains a Run that is not a successful current-revision same-namespace NEXT Task Run.' }
    if (entry.path !== recordPath(job.project_id, 'RUNS', run.run_id, 'NEXT', jobMemoryNamespace)) {
      return { completed, error: 'completed_task_run_snapshots path does not match the NEXT Run path.' }
    }
    const task = (job.tasks ?? []).find((item: any) => item.task_id === run.primary_task_id)
    const topology = (job.topology ?? []).find((item: any) => item.task_id === run.primary_task_id)
    if (!task || !topology || topology.handler !== run.role) {
      return { completed, error: 'completed_task_run_snapshots Run does not match the current Task/topology handler.' }
    }
    completed.add(run.primary_task_id)
  }
  return { completed, error: null as string | null }
}

function nextDispatchPreflightError(
  job: any,
  role: string,
  taskIds: string[],
  requestedPlanningRevision: number | null,
  jobRecordSha: string | null,
  currentJobRecordSha: string | null,
  completedTaskRunEntries: any[],
): string | null {
  if (jobExecutionContract(job) !== 'NEXT') return null
  if (!Number.isInteger(requestedPlanningRevision) || requestedPlanningRevision !== job.planning_revision) {
    return 'NEXT_DISPATCH_STALE_PLANNING_REVISION: dispatch planning_revision must equal the current Job planning_revision.'
  }
  if (!jobRecordSha || !currentJobRecordSha || !/^[0-9a-f]{40}$/.test(jobRecordSha) || !/^[0-9a-f]{40}$/.test(currentJobRecordSha) || jobRecordSha !== currentJobRecordSha) {
    return 'NEXT_DISPATCH_STALE_JOB_SHA: supplied Job snapshot SHA must equal the immediate current Job read-back SHA.'
  }
  const completedState = validateCompletedTaskRunSnapshots(job, completedTaskRunEntries)
  if (completedState.error) return 'NEXT_DISPATCH_PREREQUISITE_INVALID: ' + completedState.error
  for (const taskId of [...new Set(taskIds.filter(Boolean))]) {
    const task = (job.tasks ?? []).find((item: any) => item.task_id === taskId)
    const stage = (job.topology ?? []).find((item: any) => item.task_id === taskId)
    if (!task || !stage) return 'NEXT_DISPATCH_TASK_INVALID: dispatch Task is missing from the current Job/topology.'
    if (task.lifecycle === 'RETIRED') return 'NEXT_DISPATCH_TASK_RETIRED: Task ' + taskId + ' is not actionable after Plan change.'
    if (stage.handler !== role) return 'NEXT_DISPATCH_WRONG_ROLE: Task ' + taskId + ' belongs to ' + String(stage.handler) + ', not ' + role + '.'
    for (const dependencyId of task.dependencies ?? []) {
      if (!completedState.completed.has(dependencyId)) {
        return 'NEXT_DISPATCH_PREREQUISITE_BLOCKED: Task ' + taskId + ' requires completed Task ' + dependencyId + '.'
      }
    }
  }
  return null
}

function resolveRequiredTaskSkills(job: any, taskIds: string[]) {
  const names = [...new Set(
    [...new Set(taskIds.filter(Boolean))]
      .flatMap((taskId: string) => {
        const task = (job.tasks ?? []).find((item: any) => item.task_id === taskId)
        return task?.required_skills ?? []
      })
      .filter((name: any) => typeof name === 'string' && name)
  )]
  const contexts: any[] = []
  for (const name of names) {
    const skill = RUNTIME_SKILLS[name]
    if (!skill) {
      return {
        names: [],
        contexts: [],
        error: 'NEXT_DISPATCH_REQUIRED_SKILL_UNKNOWN: required Task skill is not present in the runtime skill catalog: ' + name + '.',
      }
    }
    contexts.push({ name, description: skill.description, skill_text: skill.body })
  }
  return { names, contexts, error: null as string | null }
}

function goalRecheckCoverageError(job: any, run: any, criteria: any[]): string | null {
  if (jobExecutionContract(job) !== 'NEXT') return null
  if (
    job.project_id !== run.project_id ||
    job.job_id !== run.job_id ||
    job.planning_revision !== run.planning_revision
  ) return 'GOAL_RECHECK_COVERAGE_REJECTED: Job/Run current planning revision mismatch.'

  const taskIds = [...new Set(
    [run.primary_task_id, ...(run.affected_task_refs ?? [])]
      .filter((id: any) => typeof id === 'string' && id)
  )]
  if (!taskIds.length) return 'GOAL_RECHECK_COVERAGE_REJECTED: NEXT Coder Run has no bound Task scope.'

  const expected = new Set<string>()
  for (const taskId of taskIds) {
    const task = (job.tasks ?? []).find((item: any) => item.task_id === taskId)
    const stage = (job.topology ?? []).find((item: any) => item.task_id === taskId)
    if (!task || !stage || stage.handler !== 'coder') {
      return 'GOAL_RECHECK_COVERAGE_REJECTED: Run Task scope is not current Coder-owned topology.'
    }
    for (const criterion of task.completion_criteria ?? []) {
      expected.add(taskId + '\u0000' + String(criterion))
    }
  }

  const provided = new Set<string>()
  for (const item of criteria ?? []) {
    if (typeof item?.task_id !== 'string' || !item.task_id) {
      return 'GOAL_RECHECK_COVERAGE_REJECTED: every NEXT criterion requires task_id.'
    }
    const key = item.task_id + '\u0000' + String(item.criterion ?? '')
    if (provided.has(key)) return 'GOAL_RECHECK_COVERAGE_REJECTED: duplicate Task criterion.'
    provided.add(key)
  }

  const missing = [...expected].filter((key) => !provided.has(key))
  const extra = [...provided].filter((key) => !expected.has(key))
  if (missing.length || extra.length) {
    return 'GOAL_RECHECK_COVERAGE_REJECTED: criteria must exactly cover every approved Task completion criterion in the Run scope.'
  }
  return null
}

function validateRunVerificationSnapshot(snapshot: any, run: any, role: 'reviewer' | 'tester', terminalResult?: string | null) {
  const parsed = parseDurableSnapshots(snapshot ? [snapshot] : [], 'run_verification_snapshot')
  if (parsed.error || parsed.entries.length !== 1) {
    return { error: 'missing or invalid durable Run Verification snapshot.', ref: null, sha: null, record: null }
  }
  const entry = parsed.entries[0]
  const record = entry.record
  const executionContract = resolveExecutionContract(run?.execution_contract)
  const runMemoryNamespace = recordNextMemoryNamespace(run)
  const expectedKind = role === 'reviewer' ? 'REVIEW' : 'TEST'
  const expectedPath = typeof record?.verification_id === 'string'
    ? verificationPath(run.project_id, record.verification_id, executionContract ?? 'V2_STABLE', runMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
    : ''
  const nextRevisionMatches =
    executionContract !== 'NEXT' ||
    (record?.planning_revision === run.planning_revision && Number.isInteger(Number(run.planning_revision)))
  const resultMatches = !terminalResult || record?.result === terminalResult
  const successLike = ['PASS','PASS_RETEST_REQUIRED','OBSERVED'].includes(record?.result)
  const successEvidenceValid =
    !successLike ||
    (Array.isArray(record?.evidence_refs) && record.evidence_refs.some((ref: any) => typeof ref === 'string' && ref.trim()))
  const reviewerSuccessValid =
    role !== 'reviewer' ||
    !['PASS','PASS_RETEST_REQUIRED'].includes(record?.result) ||
    !(Array.isArray(record?.findings) && record.findings.some((item: any) => ['CRITICAL','IMPORTANT'].includes(item?.severity)))
  const testerSuccessValid =
    role !== 'tester' ||
    !successLike ||
    record?.failure_class == null
  const valid =
    executionContract != null &&
    entry.path === expectedPath &&
    record?.kind === expectedKind &&
    record?.project_id === run.project_id &&
    record?.job_id === run.job_id &&
    record?.run_id === run.run_id &&
    record?.task_id === (run.primary_task_id ?? null) &&
    record?.producer === role &&
    resolveExecutionContract(record?.execution_contract) === executionContract &&
    (executionContract !== 'NEXT' || (runMemoryNamespace != null && recordNextMemoryNamespace(record) === runMemoryNamespace)) &&
    record?.target_ref === run.target_ref &&
    record?.target_revision === run.target_revision &&
    nextRevisionMatches &&
    resultMatches &&
    successEvidenceValid &&
    reviewerSuccessValid &&
    testerSuccessValid
  if (!valid) {
    return { error: 'Run Verification does not match exact Run/role/planning revision/target/result or required success evidence semantics.', ref: null, sha: null, record: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record }
}

function nextClosureCoverageError(job: any, runEntries: any[], verificationEntries: any[], completionEvidenceRefs: string[]): string | null {
  if (jobExecutionContract(job) !== 'NEXT') return null
  const completedState = validateCompletedTaskRunSnapshots(job, runEntries)
  if (completedState.error) return 'NEXT_CLOSURE_COVERAGE_REJECTED: ' + completedState.error

  const requiredStages = (job.topology ?? []).filter((stage: any) => ['reviewer','tester'].includes(stage.handler))
  for (const stage of requiredStages) {
    const runMatches = runEntries.filter((entry: any) =>
      entry.record?.primary_task_id === stage.task_id &&
      entry.record?.role === stage.handler
    )
    if (runMatches.length !== 1) {
      return 'NEXT_CLOSURE_COVERAGE_REJECTED: each Reviewer/Tester Task requires exactly one selected successful current-revision Run snapshot.'
    }
    const runEntry = runMatches[0]
    const run = runEntry.record
    const verificationMatches = verificationEntries.filter((entry: any) => entry.record?.run_id === run.run_id)
    if (verificationMatches.length !== 1) {
      return 'NEXT_CLOSURE_COVERAGE_REJECTED: each selected Reviewer/Tester Run requires exactly one durable matching Verification snapshot.'
    }
    const verificationEntry = verificationMatches[0]
    const verified = validateRunVerificationSnapshot(
      { path: verificationEntry.path, sha: verificationEntry.sha, record_text: verificationEntry.record_text },
      run,
      stage.handler,
      run.result,
    )
    if (verified.error) return 'NEXT_CLOSURE_COVERAGE_REJECTED: ' + verified.error
    if (!(completionEvidenceRefs ?? []).includes(runEntry.path) || !(completionEvidenceRefs ?? []).includes(verificationEntry.path)) {
      return 'NEXT_CLOSURE_COVERAGE_REJECTED: selected closure Run and Verification paths must be present in completion_evidence_refs.'
    }
  }
  return null
}

function durableSnapshotReadbackSteps(snapshots: any[], label: string) {
  return (snapshots ?? []).map((snapshot: any) =>
    'Read back ' + label + ' at ' + snapshot.path + ' and require blob SHA=' + snapshot.sha + ' plus byte-identical record_text before the consequential persistence step.'
  )
}

function evidenceBundleRefValidationError(
  bundle: any,
  expected: {
    project_id: string
    job_id: string
    checkpoint_id?: string | null
    attempt_id?: string | null
    run_id?: string | null
    target_ref?: string | null
    target_revision: string
    repository_full_name?: string | null
  },
) {
  if (!bundle || typeof bundle !== 'object') return 'evidence bundle ref must be an object.'
  const binding = bundle.binding
  if (!binding || typeof binding !== 'object') return 'evidence bundle ref is missing immutable binding.'
  const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '')
  if (!same(binding.project_id, expected.project_id) || !same(binding.job_id, expected.job_id)) return 'evidence bundle project/job binding mismatch.'
  if (expected.checkpoint_id != null && !same(binding.checkpoint_id, expected.checkpoint_id)) return 'evidence bundle checkpoint binding mismatch.'
  if (expected.attempt_id != null && !same(binding.attempt_id, expected.attempt_id)) return 'evidence bundle attempt binding mismatch.'
  if (expected.run_id != null && !same(binding.run_id, expected.run_id)) return 'evidence bundle Tester Run binding mismatch.'
  if (expected.target_ref != null && !same(binding.target_ref, expected.target_ref)) return 'evidence bundle target_ref binding mismatch.'
  if (!same(binding.target_revision, expected.target_revision)) return 'evidence bundle target_revision binding mismatch.'
  if (!/^[0-9a-f]{40}$/.test(String(binding.target_revision || ''))) return 'evidence bundle target_revision is not an exact Git SHA.'
  if (expected.repository_full_name) {
    if (String(binding.repository || '').toLowerCase() !== expected.repository_full_name.toLowerCase()) return 'evidence bundle repository binding mismatch.'
  }
  const artifactCount = Number(bundle.artifact_count || 0)
  const sizeBytes = Number(bundle.size_bytes || 0)
  if (!Number.isInteger(artifactCount) || artifactCount < 1 || artifactCount > 12) return 'evidence bundle artifact_count is outside the bounded range.'
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) return 'evidence bundle size_bytes is invalid.'

  if (bundle.backend === 'PRIVATE_SUPABASE') {
    const bundleId = String(bundle.evidence_bundle_id || '')
    if (!/^[0-9a-f]{64}$/.test(bundleId)) return 'private evidence bundle id is invalid.'
    if (String(bundle.manifest_path || '') !== 'db:gsa_evidence_bundles/' + bundleId) return 'private evidence manifest path is not bound to the bundle id.'
    if (!/^[0-9a-f]{64}$/.test(String(bundle.manifest_sha256 || ''))) return 'private evidence manifest hash is invalid.'
    if (!/^https?:\/\//i.test(String(bundle.viewer_url || '')) || !String(bundle.viewer_url).includes(encodeURIComponent(bundleId))) return 'private evidence viewer URL is not bound to the bundle id.'
    if (bundle.immutable !== true || bundle.manifest_readback_verified !== true) return 'private evidence bundle is not immutable/read-back verified.'
    if (bundle.target_revision !== expected.target_revision) return 'private evidence top-level target revision mismatch.'
    if (sizeBytes > 50 * 1024 * 1024) return 'private evidence bundle exceeds the 50 MiB bound.'
    return null
  }

  if (bundle.backend === 'REPOSITORY_GIT') {
    if (bundle.privacy_class !== 'REPO_SAFE' || bundle.publication_mode !== 'PUBLISH') return 'repository evidence must be a completed REPO_SAFE PUBLISH bundle.'
    if (bundle.evidence_ref !== 'gsa-evidence/' + expected.project_id) return 'repository evidence ref is outside the Project evidence namespace.'
    if (!/^[0-9a-f]{40}$/.test(String(bundle.evidence_commit_sha || ''))) return 'repository evidence commit is invalid.'
    if (!/^[0-9a-f]{64}$/.test(String(bundle.manifest_sha256 || ''))) return 'repository evidence manifest hash is invalid.'
    if (!String(bundle.manifest_path || '').startsWith('tests/gsa/' + expected.project_id + '/')) return 'repository evidence manifest path is outside the bounded prefix.'
    if (!/^https?:\/\//i.test(String(bundle.human_openable_url || '')) || !String(bundle.human_openable_url).includes(String(bundle.evidence_commit_sha))) return 'repository evidence Human link is not commit-pinned.'
    if (bundle.immutable !== true || bundle.manifest_readback_verified !== true || bundle.artifact_readback_verified !== true) return 'repository evidence read-back is incomplete.'
    if (bundle.automation_side_effects_observed !== false) return 'repository evidence automation isolation is not proven.'
    if (!/^[0-9a-f]{40}$/.test(String(bundle.append_only_parent_sha || ''))) return 'repository evidence append-only parent is invalid.'
    if (typeof bundle.binary_probe_verification_ref !== 'string' || !bundle.binary_probe_verification_ref) return 'repository evidence is missing durable probe Verification ref.'
    if (!/^[0-9a-f]{40}$/.test(String(bundle.binary_probe_verification_sha || ''))) return 'repository evidence is missing durable probe Verification SHA.'
    if (sizeBytes > 25 * 1024 * 1024) return 'repository evidence bundle exceeds the 25 MiB bound.'
    return null
  }

  return 'unknown evidence bundle backend.'
}

async function sha256Utf8Text(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, '0')).join('')
}

function validateEvidenceBundleAttestationSnapshot(
  snapshot: any,
  expected: {
    project_id: string
    job_id: string
    checkpoint_id: string
    attempt_id: string
    run_id: string
    target_ref: string
    target_revision: string
    repository_full_name: string
  },
) {
  const parsed = parseDurableSnapshots([snapshot], 'evidence_bundle_attestation_snapshot')
  if (parsed.error || parsed.entries.length !== 1) {
    return { error: 'invalid durable EvidenceBundle attestation snapshot.', ref: null, sha: null, record: null, bundle: null }
  }
  const entry = parsed.entries[0]
  const record = entry.record
  const recordMemoryNamespace = recordNextMemoryNamespace(record)
  const expectedPath =
    typeof record?.verification_id === 'string' && recordMemoryNamespace
      ? verificationPath(expected.project_id, record.verification_id, 'NEXT', recordMemoryNamespace)
      : ''
  const bundle = record?.evidence_bundle_ref
  const bundleError = evidenceBundleRefValidationError(bundle, expected)
  const publicationProof = record?.publication_proof
  const privateProofValid =
    record?.backend !== 'PRIVATE_SUPABASE' || (
      publicationProof?.kind === 'SUPABASE_MANIFEST_READBACK' &&
      publicationProof?.evidence_bundle_id === bundle?.evidence_bundle_id &&
      publicationProof?.manifest_path === bundle?.manifest_path &&
      publicationProof?.manifest_sha256 === bundle?.manifest_sha256 &&
      publicationProof?.row_readback_verified === true
    )
  const repositoryProofValid =
    record?.backend !== 'REPOSITORY_GIT' || (
      publicationProof?.kind === 'REPOSITORY_PUBLISH_FINALIZE' &&
      publicationProof?.evidence_ref === bundle?.evidence_ref &&
      publicationProof?.evidence_commit_sha === bundle?.evidence_commit_sha &&
      publicationProof?.manifest_path === bundle?.manifest_path &&
      publicationProof?.manifest_sha256 === bundle?.manifest_sha256 &&
      publicationProof?.manifest_readback_verified === true &&
      publicationProof?.artifact_readback_verified === true &&
      publicationProof?.automation_side_effects_observed === false &&
      publicationProof?.probe_verification_ref === bundle?.binary_probe_verification_ref &&
      publicationProof?.probe_verification_sha === bundle?.binary_probe_verification_sha
    )
  const valid =
    expectedPath === entry.path &&
    record?.kind === 'EVIDENCE_BUNDLE' &&
    record?.project_id === expected.project_id &&
    record?.job_id === expected.job_id &&
    resolveExecutionContract(record?.execution_contract) === 'NEXT' &&
    recordMemoryNamespace != null &&
    record?.producer === 'tester' &&
    record?.result === 'PUBLISHED' &&
    record?.checkpoint_id === expected.checkpoint_id &&
    record?.attempt_id === expected.attempt_id &&
    record?.run_id === expected.run_id &&
    record?.target_ref === expected.target_ref &&
    record?.target_revision === expected.target_revision &&
    String(record?.repository_full_name || '').toLowerCase() === expected.repository_full_name.toLowerCase() &&
    record?.backend === bundle?.backend &&
    privateProofValid &&
    repositoryProofValid &&
    !bundleError
  if (!valid) {
    return { error: 'EvidenceBundle attestation does not match the current checkpoint attempt/Tester Run/target.', ref: null, sha: null, record: null, bundle: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record, bundle }
}

function validateTesterEvidenceVerificationSnapshot(
  snapshot: any,
  expected: {
    project_id: string
    job_id: string
    run_id: string
    target_ref: string
    target_revision: string
  },
) {
  const parsed = parseDurableSnapshots([snapshot], 'tester_evidence_verification_snapshot')
  if (parsed.error || parsed.entries.length !== 1) {
    return { error: 'invalid durable TEST/RETEST Verification snapshot.', ref: null, sha: null, record: null }
  }
  const entry = parsed.entries[0]
  const record = entry.record
  const recordMemoryNamespace = recordNextMemoryNamespace(record)
  const expectedPath =
    typeof record?.verification_id === 'string' && recordMemoryNamespace
      ? verificationPath(expected.project_id, record.verification_id, 'NEXT', recordMemoryNamespace)
      : ''
  const valid =
    expectedPath === entry.path &&
    ['TEST','RETEST'].includes(record?.kind) &&
    resolveExecutionContract(record?.execution_contract) === 'NEXT' &&
    recordMemoryNamespace != null &&
    record?.producer === 'tester' &&
    record?.project_id === expected.project_id &&
    record?.job_id === expected.job_id &&
    record?.run_id === expected.run_id &&
    record?.target_ref === expected.target_ref &&
    record?.target_revision === expected.target_revision &&
    ['PASS','OBSERVED'].includes(record?.result) &&
    Array.isArray(record?.evidence_bundle_refs) &&
    record.evidence_bundle_refs.length > 0 &&
    Array.isArray(record?.evidence_bundle_attestation_refs) &&
    record.evidence_bundle_attestation_refs.length === record.evidence_bundle_refs.length &&
    record.evidence_bundle_attestation_refs.every((item: any) =>
      item &&
      typeof item.path === 'string' &&
      item.path.startsWith(executionMemoryRoot(expected.project_id, 'NEXT', recordMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) + '/VERIFICATION/') &&
      /^[0-9a-f]{40}$/.test(String(item.sha || ''))
    )
  if (!valid) {
    return { error: 'TEST/RETEST Verification is not the exact successful durable evidence record for this Tester Run/target.', ref: null, sha: null, record: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record }
}

function validateTesterEvidenceClaimSnapshot(
  snapshot: any,
  verification: any,
  expected: {
    project_id: string
    job_id: string
    run_id: string
    target_ref: string
    target_revision: string
    planning_revision: number
  },
) {
  const parsed = parseDurableSnapshots([snapshot], 'tester_evidence_claim_snapshot')
  if (parsed.error || parsed.entries.length !== 1) {
    return { error: 'invalid durable terminal checkpoint claim snapshot.', ref: null, sha: null, record: null }
  }
  const entry = parsed.entries[0]
  const claim = entry.record
  const claimMemoryNamespace = recordNextMemoryNamespace(claim)
  const expectedPath =
    typeof verification?.checkpoint_id === 'string' && Number.isInteger(Number(verification?.planning_revision)) && claimMemoryNamespace
      ? checkpointClaimPath(expected.project_id, expected.job_id, Number(verification.planning_revision), verification.checkpoint_id, claimMemoryNamespace)
      : ''
  const requiredState =
    verification?.result === 'PASS' ? 'SATISFIED' :
    verification?.result === 'OBSERVED' ? 'OBSERVED' :
    null
  const valid =
    expectedPath === entry.path &&
    claim?.kind === 'CHECKPOINT_CLAIM' &&
    claim?.execution_contract === 'NEXT' &&
    claimMemoryNamespace != null &&
    sameNextMemoryNamespace(claim, verification) &&
    claim?.project_id === expected.project_id &&
    claim?.job_id === expected.job_id &&
    claim?.planning_revision === expected.planning_revision &&
    verification?.planning_revision === expected.planning_revision &&
    claim?.checkpoint_id === verification?.checkpoint_id &&
    claim?.mode === verification?.mode &&
    claim?.state === requiredState &&
    claim?.claimant_run_id === expected.run_id &&
    claim?.last_verification_id === verification?.verification_id &&
    claim?.attempt_id === verification?.attempt_id &&
    claim?.attempt_kind === verification?.attempt_kind &&
    claim?.lease_token === verification?.lease_token &&
    claim?.target_ref === expected.target_ref &&
    claim?.target_revision === expected.target_revision &&
    claim?.last_target_revision === expected.target_revision &&
    claim?.last_result === verification?.result &&
    claim?.retest_required === false &&
    claim?.lease_expires_at == null &&
    verification?.applicability?.status === 'CANDIDATE' &&
    verification?.applicability?.planning_revision === expected.planning_revision &&
    verification?.applicability?.checkpoint_id === verification?.checkpoint_id &&
    verification?.applicability?.target_revision === expected.target_revision
  if (!valid) {
    return { error: 'terminal checkpoint claim does not currently make this TEST/RETEST Verification applicable.', ref: null, sha: null, record: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record: claim }
}

function checkpointVerificationApplicable(job: any, checkpoint: any, claim: any, verification: any) {
  if (!claim || !verification) return false
  if (claim.kind !== 'CHECKPOINT_CLAIM' || claim.execution_contract !== 'NEXT') return false
  const nextMemoryNamespace = recordNextMemoryNamespace(job)
  if (!nextMemoryNamespace) return false
  if (!sameNextMemoryNamespace(job, claim) || !sameNextMemoryNamespace(job, verification)) return false
  if (claim.project_id !== job.project_id || claim.job_id !== job.job_id || claim.planning_revision !== job.planning_revision || claim.checkpoint_id !== checkpoint.checkpoint_id) return false
  if (claim.mode !== checkpoint.mode || !['SATISFIED','OBSERVED'].includes(claim.state)) return false
  if (claim.last_verification_id !== verification.verification_id || claim.lease_token !== verification.lease_token || claim.attempt_id !== verification.attempt_id) return false
  if (!['TEST','RETEST'].includes(verification.kind) || verification.execution_contract !== 'NEXT' || verification.producer !== 'tester') return false
  if (verification.project_id !== job.project_id || verification.job_id !== job.job_id || verification.planning_revision !== job.planning_revision || verification.checkpoint_id !== checkpoint.checkpoint_id) return false
  if (verification.mode !== checkpoint.mode || verification.attempt_kind !== claim.attempt_kind || claim.last_result !== verification.result) return false
  if (verification.result === 'PASS' && claim.state !== 'SATISFIED') return false
  if (verification.result === 'OBSERVED' && claim.state !== 'OBSERVED') return false
  if (verification.applicability?.status !== 'CANDIDATE') return false
  if (verification.applicability?.planning_revision !== job.planning_revision || verification.applicability?.checkpoint_id !== checkpoint.checkpoint_id) return false
  if (claim.target_revision !== verification.target_revision || claim.last_target_revision !== verification.target_revision || verification.applicability?.target_revision !== verification.target_revision) return false
  const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')?.full_name ?? null
  const bundleRefs = verification.evidence_bundle_refs ?? []
  const attestationRefs = verification.evidence_bundle_attestation_refs ?? []
  if (bundleRefs.length !== attestationRefs.length) return false
  if (bundleRefs.length && !workingRepo) return false
  const attestationPaths = new Set<string>()
  for (const ref of attestationRefs) {
    if (
      !ref ||
      typeof ref.path !== 'string' ||
      !ref.path.startsWith(executionMemoryRoot(job.project_id, 'NEXT', nextMemoryNamespace) + '/VERIFICATION/') ||
      !/^[0-9a-f]{40}$/.test(String(ref.sha || '')) ||
      attestationPaths.has(ref.path)
    ) return false
    attestationPaths.add(ref.path)
  }
  for (const bundle of bundleRefs) {
    if (evidenceBundleRefValidationError(bundle, {
      project_id: job.project_id,
      job_id: job.job_id,
      checkpoint_id: checkpoint.checkpoint_id,
      attempt_id: claim.attempt_id,
      run_id: claim.claimant_run_id,
      target_ref: claim.target_ref,
      target_revision: verification.target_revision,
      repository_full_name: workingRepo,
    })) return false
  }
  const expectedEvidenceNeeds = checkpoint.evidence_need_ids ?? []
  const applicableEvidenceNeeds = verification.applicability?.evidence_need_ids ?? []
  if (!expectedEvidenceNeeds.every((id: string) => applicableEvidenceNeeds.includes(id))) return false
  if (checkpoint.mode === 'VERIFY') return verification.result === 'PASS'
  return ['PASS','OBSERVED'].includes(verification.result)
}



function evaluateNextEvidenceGate(job: any, claimSnapshots: any[], verificationSnapshots: any[], target: { kind: 'TASK' | 'MILESTONE' | 'JOB', id?: string | null }) {
  const executionContract = jobExecutionContract(job)
  if (executionContract !== 'NEXT') return { allowed: true, required_checkpoint_ids: [], blocking: [] as string[] }
  const nextMemoryNamespace = recordNextMemoryNamespace(job)
  if (!nextMemoryNamespace) return { allowed: false, required_checkpoint_ids: [], blocking: ['Current NEXT Job memory_namespace is invalid.'] }
  if (job.planning_review?.status !== 'PASS' || job.planning_review?.reviewed_revision !== job.planning_revision) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Current NEXT planning revision is not Reviewer PASS.'] }
  }
  const claimParsed = parseDurableSnapshots(claimSnapshots ?? [], 'checkpoint_claim_snapshots')
  if (claimParsed.error) return { allowed: false, required_checkpoint_ids: [], blocking: [claimParsed.error] }
  const claimSnapshotError = validateClaimSnapshots(claimParsed.entries, 'checkpoint_claim_snapshots')
  if (claimSnapshotError) return { allowed: false, required_checkpoint_ids: [], blocking: [claimSnapshotError] }
  const verificationParsed = parseDurableSnapshots(verificationSnapshots ?? [], 'checkpoint_verification_snapshots')
  if (verificationParsed.error) return { allowed: false, required_checkpoint_ids: [], blocking: [verificationParsed.error] }
  const verificationSnapshotError = validateVerificationSnapshots(verificationParsed.entries, 'checkpoint_verification_snapshots')
  if (verificationSnapshotError) return { allowed: false, required_checkpoint_ids: [], blocking: [verificationSnapshotError] }
  if (target.kind === 'TASK' && !(job.tasks ?? []).some((item: any) => item.task_id === target.id)) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Unknown NEXT Task target: ' + String(target.id ?? '')] }
  }
  if (target.kind === 'MILESTONE' && !(job.milestones ?? []).some((item: any) => item.milestone_id === target.id)) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Unknown NEXT Milestone target: ' + String(target.id ?? '')] }
  }
  const ids = requiredCheckpointIds(job, target)
  const blocking: string[] = []
  for (const checkpointId of ids) {
    const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpointId)
    if (!checkpoint) {
      blocking.push('Unknown required checkpoint: ' + checkpointId)
      continue
    }
    const matchingClaims = claimParsed.entries.filter((entry: any) => {
      const item = entry.record
      return item?.kind === 'CHECKPOINT_CLAIM' &&
        item.project_id === job.project_id &&
        item.job_id === job.job_id &&
        item.planning_revision === job.planning_revision &&
        item.checkpoint_id === checkpointId &&
        entry.path === checkpointClaimPath(job.project_id, job.job_id, job.planning_revision, checkpointId, nextMemoryNamespace)
    })
    if (matchingClaims.length !== 1) {
      blocking.push('Expected exactly one current deterministic checkpoint claim: ' + checkpointId)
      continue
    }
    const claim = matchingClaims[0].record
    const matchingVerifications = verificationParsed.entries.filter((entry: any) =>
      entry.record?.verification_id === claim.last_verification_id &&
      entry.path === verificationPath(job.project_id, claim.last_verification_id, 'NEXT', nextMemoryNamespace)
    )
    if (matchingVerifications.length !== 1 || !checkpointVerificationApplicable(job, checkpoint, claim, matchingVerifications[0].record)) {
      blocking.push('Mandatory checkpoint evidence is not applicable: ' + checkpointId)
    }
  }
  return { allowed: blocking.length === 0, required_checkpoint_ids: ids, blocking }
}

function checkpointVerificationOutcome(result: string, failureClass?: string | null) {
  const successful = result === 'PASS' || result === 'OBSERVED'
  const plannerGap = ['PLAN_GAP','SPEC_GAP'].includes(failureClass ?? '')
  const productFailure = failureClass === 'PRODUCT_FAILURE'
  return {
    successful,
    plannerGap,
    productFailure,
    state: result === 'PASS' ? 'SATISFIED' : result === 'OBSERVED' ? 'OBSERVED' : plannerGap ? 'NEEDS_PLANNER_REVISION' : productFailure ? 'FAILED_PRODUCT' : 'BLOCKED',
    route: successful ? 'CONTINUE' : plannerGap ? 'PLANNER_REVISION_SUPERSEDE' : productFailure ? 'CODER_REPAIR_GOAL_RECHECK_RETEST' : 'RETEST_WHEN_READY',
    retestRequired: !successful && !plannerGap,
    applicabilityStatus: successful ? 'CANDIDATE' : 'NON_APPLICABLE',
  }
}

function productFailureRetestValidationError(
  current: any,
  targetRevision: string,
  retestOfVerificationId: string | null | undefined,
  goalRecordText: string | null | undefined,
  goalVerificationRef: string | null | undefined,
  projectId: string,
  jobId: string,
) {
  if (!current?.retest_required || !retestOfVerificationId || current.last_verification_id !== retestOfVerificationId) {
    return 'RETEST must reference the terminal verification that requested Retest.'
  }
  if (current.last_target_revision === targetRevision) {
    return 'PRODUCT_FAILURE Retest requires a repaired target revision/state.'
  }
  if (!goalRecordText || !goalVerificationRef) {
    return 'PRODUCT_FAILURE Retest requires the repaired revision Goal Recheck.'
  }
  let goal: any
  try { goal = JSON.parse(goalRecordText) } catch {
    return 'invalid repair Goal Recheck JSON.'
  }
  const expectedGoalRef = verificationPath(projectId, goal.verification_id, 'NEXT', recordNextMemoryNamespace(current) ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
  const validGoal =
    goal.kind === 'GOAL_RECHECK' &&
    goal.execution_contract === 'NEXT' &&
    sameNextMemoryNamespace(current, goal) &&
    goal.project_id === projectId &&
    goal.job_id === jobId &&
    goal.target_revision === targetRevision &&
    ['PASS','PASS_RETEST_REQUIRED'].includes(goal.result) &&
    !(goal.criteria ?? []).some((item: any) => item.result === 'NOT_MET') &&
    !(goal.scope_drift ?? []).length &&
    goalVerificationRef === expectedGoalRef
  return validGoal ? null : 'repair Goal Recheck must match the repaired target revision and have no NOT_MET/scope drift.'
}

function nextPlanSupersessionMatches(
  current: any,
  verification: any,
  verificationRef: string,
  claim: any,
  projectId: string,
  jobId: string,
) {
  const expectedVerificationRef = verificationPath(projectId, verification?.verification_id, 'NEXT', recordNextMemoryNamespace(current) ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
  return (
    ['TEST','RETEST'].includes(verification?.kind) &&
    verification?.execution_contract === 'NEXT' &&
    sameNextMemoryNamespace(current, verification) &&
    sameNextMemoryNamespace(current, claim) &&
    verification?.project_id === projectId &&
    verification?.job_id === jobId &&
    verification?.planning_revision === current?.planning_revision &&
    ['PLAN_GAP','SPEC_GAP'].includes(verification?.failure_class) &&
    verification?.route === 'PLANNER_REVISION_SUPERSEDE' &&
    verificationRef === expectedVerificationRef &&
    claim?.kind === 'CHECKPOINT_CLAIM' &&
    claim?.execution_contract === 'NEXT' &&
    claim?.project_id === projectId &&
    claim?.job_id === jobId &&
    claim?.planning_revision === current?.planning_revision &&
    claim?.state === 'NEEDS_PLANNER_REVISION' &&
    claim?.checkpoint_id === verification?.checkpoint_id &&
    claim?.last_failure_class === verification?.failure_class &&
    claim?.last_result === verification?.result &&
    claim?.last_verification_id === verification?.verification_id &&
    claim?.lease_token === verification?.lease_token &&
    claim?.attempt_id === verification?.attempt_id &&
    claim?.last_target_revision === verification?.target_revision
  )
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

  registerBrowserTestTools({ server, z, req, AUTH_SCOPES, authContext, authError })

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

app.get('/selftest', (c) => {
  const now = new Date().toISOString()
  const projectId = uuidv7()
  const p3StagingRequest = new Request('https://example.supabase.co/functions/v1/gsa-mcp-next/selftest')
  const p3ProductionRequest = new Request('https://example.supabase.co/functions/v1/gsa-mcp/selftest')
  const p3PendingInventory = CUTOVER_INVENTORY.map((item: any) =>
    item.id === 'P3-C01' ? { ...item, disposition: 'PENDING' } : item
  )
  const manifest = buildProjectManifest({
    projectId,
    name: 'Selftest Project',
    lifecycle: 'ACTIVE',
    repoUrl: 'https://github.com/example/source',
    purpose: 'selftest',
    createdAt: now,
    updatedAt: now,
  })
  const parsed = parseProjectManifest(manifest)
  const paused = transitionProjectManifest(manifest, 'PAUSED')
  const resumed = paused ? transitionProjectManifest(paused.next, 'ACTIVE') : null
  const legacyJobId = uuidv7()
  const legacyRunId = uuidv7()
  const nextJobId = uuidv7()
  const nextRunId = uuidv7()
  const legacyCoderRun: { project_id: string; job_id: string; run_id: string; role: string; lifecycle: string; execution_contract?: ExecutionContract } = { project_id: projectId, job_id: legacyJobId, run_id: legacyRunId, role: 'coder', lifecycle: 'IN_PROGRESS' }
  const nextCoderRun = { project_id: projectId, job_id: nextJobId, run_id: nextRunId, role: 'coder', lifecycle: 'IN_PROGRESS', execution_contract: 'NEXT' }
  const checkpointId = 'CP-E29'
  const consumerTaskId = uuidv7()
  const evidenceNeedId = 'EN-E29'
  const verificationId = uuidv7()
  const attemptId = uuidv7()
  const leaseToken = uuidv7()
  const nextGateJob = {
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 3,
    planning_review: { status: 'PASS', reviewed_revision: 3 },
    tasks: [{ task_id: consumerTaskId }],
    evidence_needs: [{ evidence_need_id: evidenceNeedId, checkpoint_id: checkpointId, owner_task_id: consumerTaskId, required_by_task_ids: [consumerTaskId], planning_revision: 3 }],
    evidence_requirements: [{ evidence_requirement_id: 'ER-E29', consumer_task_id: consumerTaskId, evidence_need_id: evidenceNeedId, checkpoint_id: checkpointId, planning_revision: 3 }],
    test_checkpoints: [{ checkpoint_id: checkpointId, mode: 'VERIFY', boundary: 'BEFORE_NODE', boundary_node_id: consumerTaskId, prerequisite_node_ids: [], evidence_need_ids: [evidenceNeedId], planning_revision: 3 }],
    milestones: [],
  }
  const nextGateClaim = {
    kind: 'CHECKPOINT_CLAIM',
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 3,
    checkpoint_id: checkpointId,
    mode: 'VERIFY',
    state: 'SATISFIED',
    attempt_id: attemptId,
    attempt_kind: 'TEST',
    lease_token: leaseToken,
    target_revision: 'rev-b',
    last_verification_id: verificationId,
    last_result: 'PASS',
    last_target_revision: 'rev-b',
  }
  const nextGateVerification = {
    verification_id: verificationId,
    kind: 'TEST',
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 3,
    checkpoint_id: checkpointId,
    attempt_id: attemptId,
    attempt_kind: 'TEST',
    lease_token: leaseToken,
    mode: 'VERIFY',
    target_revision: 'rev-b',
    producer: 'tester',
    result: 'PASS',
    applicability: {
      status: 'CANDIDATE',
      planning_revision: 3,
      checkpoint_id: checkpointId,
      target_revision: 'rev-b',
      evidence_need_ids: [evidenceNeedId],
    },
  }
  const nextGateClaimSnapshot = {
    path: checkpointClaimPath(projectId, nextJobId, 3, checkpointId),
    sha: 'a'.repeat(40),
    record_text: prettyJson(nextGateClaim),
  }
  const nextGateVerificationSnapshot = {
    path: verificationPath(projectId, verificationId, 'NEXT'),
    sha: 'b'.repeat(40),
    record_text: prettyJson(nextGateVerification),
  }
  const nextTaskGatePass = evaluateNextEvidenceGate(nextGateJob, [nextGateClaimSnapshot], [nextGateVerificationSnapshot], { kind: 'TASK', id: consumerTaskId })
  const nextTaskGateMissing = evaluateNextEvidenceGate(nextGateJob, [], [], { kind: 'TASK', id: consumerTaskId })
  const nextTaskGateStale = evaluateNextEvidenceGate({ ...nextGateJob, planning_revision: 4, planning_review: { status: 'PASS', reviewed_revision: 4 } }, [nextGateClaimSnapshot], [nextGateVerificationSnapshot], { kind: 'TASK', id: consumerTaskId })
  const nextGateVerificationWrongNestedRevision = {
    ...nextGateVerification,
    applicability: { ...nextGateVerification.applicability, planning_revision: 2 },
  }
  const legacyGatePass = evaluateNextEvidenceGate({ project_id: projectId, job_id: legacyJobId, execution_contract: 'V2_STABLE' }, [], [], { kind: 'JOB', id: null })
  const cp7NoCheckpointTaskId = uuidv7()
  const cp7NoCheckpointGate = evaluateNextEvidenceGate(
    {
      project_id: projectId,
      job_id: uuidv7(),
      execution_contract: 'NEXT',
      planning_revision: 1,
      planning_review: { status: 'PASS', reviewed_revision: 1 },
      tasks: [{ task_id: cp7NoCheckpointTaskId }],
      evidence_needs: [],
      evidence_requirements: [],
      test_checkpoints: [],
      milestones: [],
      planning_topology: [{ node_id: cp7NoCheckpointTaskId, node_type: 'TASK', depends_on: [], planning_revision: 1 }],
    },
    [],
    [],
    { kind: 'TASK', id: cp7NoCheckpointTaskId },
  )
  const executionTopologyValid = validateExecutionTopology(
    [{ task_id: consumerTaskId, dependencies: [] }],
    [{ stage: 1, handler: 'coder', task_id: consumerTaskId, depends_on: [], next: null }],
  ) === null
  const executionTopologyStale = validateExecutionTopology(
    [{ task_id: consumerTaskId, dependencies: [] }],
    [{ stage: 1, handler: 'coder', task_id: uuidv7(), depends_on: [], next: null }],
  ) !== null
  const topologyDependencyGateJob = {
    ...nextGateJob,
    evidence_requirements: [],
    planning_topology: [
      { node_id: checkpointId, node_type: 'TEST_CHECKPOINT', depends_on: [], planning_revision: 3 },
      { node_id: consumerTaskId, node_type: 'TASK', depends_on: [checkpointId], planning_revision: 3 },
    ],
  }
  const topologyDependencyGateMissing = evaluateNextEvidenceGate(topologyDependencyGateJob, [], [], { kind: 'TASK', id: consumerTaskId })
  const topologyDependencyGatePass = evaluateNextEvidenceGate(topologyDependencyGateJob, [prettyJson(nextGateClaim)].map((record_text) => ({ path: checkpointClaimPath(projectId, nextJobId, 3, checkpointId), sha: 'a'.repeat(40), record_text })), [prettyJson(nextGateVerification)].map((record_text) => ({ path: verificationPath(projectId, verificationId, 'NEXT'), sha: 'b'.repeat(40), record_text })), { kind: 'TASK', id: consumerTaskId })
  const milestoneBoundaryPrereqs = checkpointBoundaryPrerequisiteIds(
    { milestones: [{ milestone_id: 'M-E29', node_ids: [consumerTaskId, checkpointId] }] },
    { checkpoint_id: checkpointId, boundary: 'MILESTONE_GATE', milestone_id: 'M-E29', prerequisite_node_ids: [] },
  )
  const jobFinalBoundaryPrereqs = checkpointBoundaryPrerequisiteIds(
    { planning_topology: [{ node_id: consumerTaskId }, { node_id: checkpointId }, { node_id: 'CP-FINAL' }] },
    { checkpoint_id: 'CP-FINAL', boundary: 'JOB_FINAL', prerequisite_node_ids: [] },
  )
  const cp6TargetRef = 'refs/heads/cp6-selftest'
  const cp6TargetRevision = 'c'.repeat(40)
  const cp6EvidenceCommit = 'd'.repeat(40)
  const cp6PrivateBundle = {
    evidence_bundle_id: 'e'.repeat(64),
    backend: 'PRIVATE_SUPABASE',
    privacy_class: 'PRIVATE_REQUIRED',
    binding: {
      project_id: projectId,
      repository: 'example/source',
      job_id: nextJobId,
      checkpoint_id: checkpointId,
      attempt_id: attemptId,
      run_id: nextRunId,
      target_ref: cp6TargetRef,
      target_revision: cp6TargetRevision,
    },
    manifest_path: 'db:gsa_evidence_bundles/' + 'e'.repeat(64),
    manifest_sha256: 'f'.repeat(64),
    viewer_url: 'https://example.test/evidence.html?bundle=' + 'e'.repeat(64),
    target_revision: cp6TargetRevision,
    artifact_count: 2,
    size_bytes: 2048,
    immutable: true,
    manifest_readback_verified: true,
  }
  const cp6RepoBundle = {
    backend: 'REPOSITORY_GIT',
    publication_mode: 'PUBLISH',
    privacy_class: 'REPO_SAFE',
    binding: {
      project_id: projectId,
      repository: 'example/source',
      job_id: nextJobId,
      checkpoint_id: checkpointId,
      attempt_id: attemptId,
      run_id: nextRunId,
      target_ref: cp6TargetRef,
      target_revision: cp6TargetRevision,
    },
    evidence_ref: 'gsa-evidence/' + projectId,
    evidence_commit_sha: cp6EvidenceCommit,
    manifest_path: 'tests/gsa/' + projectId + '/' + nextJobId + '/' + checkpointId.toLowerCase() + '/' + attemptId + '/manifest.json',
    manifest_sha256: 'a'.repeat(64),
    human_openable_url: 'https://github.com/example/source/blob/' + cp6EvidenceCommit + '/tests/gsa/manifest.json',
    artifact_count: 1,
    size_bytes: 1024,
    immutable: true,
    append_only_parent_sha: 'b'.repeat(40),
    manifest_readback_verified: true,
    artifact_readback_verified: true,
    automation_side_effects_observed: false,
    binary_probe_verification_ref: verificationPath(projectId, uuidv7(), 'NEXT'),
    binary_probe_verification_sha: '9'.repeat(40),
  }
  const cp6ExpectedBundleContext = {
    project_id: projectId,
    job_id: nextJobId,
    checkpoint_id: checkpointId,
    attempt_id: attemptId,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    repository_full_name: 'example/source',
  }
  const cp6ClaimWithBundle = {
    ...nextGateClaim,
    claimant_run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    last_target_revision: cp6TargetRevision,
  }
  const cp6AttestationRef = {
    path: verificationPath(projectId, uuidv7(), 'NEXT'),
    sha: '8'.repeat(40),
  }
  const cp6VerificationWithBundle = {
    ...nextGateVerification,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    evidence_bundle_refs: [cp6PrivateBundle],
    evidence_bundle_attestation_refs: [cp6AttestationRef],
    applicability: {
      ...nextGateVerification.applicability,
      target_revision: cp6TargetRevision,
    },
  }
  const cp6TerminalClaim = {
    ...cp6ClaimWithBundle,
    lease_expires_at: null,
    retest_required: false,
  }
  const cp6TerminalClaimSnapshot = {
    path: checkpointClaimPath(projectId, nextJobId, 3, checkpointId),
    sha: '5'.repeat(40),
    record_text: prettyJson(cp6TerminalClaim),
  }
  const cp6OrphanClaimSnapshot = {
    ...cp6TerminalClaimSnapshot,
    record_text: prettyJson({
      ...cp6TerminalClaim,
      last_verification_id: uuidv7(),
    }),
  }
  const cp6HandoffClaimExpected = {
    project_id: projectId,
    job_id: nextJobId,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    planning_revision: 3,
  }
  const cp6JobWithRepo = {
    ...nextGateJob,
    repository_context: { working_repository_url: 'https://github.com/example/source' },
  }
  const cp6ProductionJobWithRepo = {
    ...cp6JobWithRepo,
    memory_namespace: 'PRODUCTION',
  }
  const cp6ProductionClaimWithBundle = {
    ...cp6ClaimWithBundle,
    memory_namespace: 'PRODUCTION',
  }
  const cp6ProductionAttestationRef = {
    ...cp6AttestationRef,
    path: verificationPath(projectId, uuidv7(), 'NEXT', 'PRODUCTION'),
  }
  const cp6ProductionVerificationWithBundle = {
    ...cp6VerificationWithBundle,
    memory_namespace: 'PRODUCTION',
    evidence_bundle_attestation_refs: [cp6ProductionAttestationRef],
  }
  const cp6ProductionVerificationWithLabAttestation = {
    ...cp6ProductionVerificationWithBundle,
    evidence_bundle_attestation_refs: [{
      ...cp6ProductionAttestationRef,
      path: verificationPath(projectId, uuidv7(), 'NEXT', 'TEST_LAB'),
    }],
  }

  const cp6PrivateAttestationId = uuidv7()
  const cp6PrivateAttestation = {
    verification_id: cp6PrivateAttestationId,
    kind: 'EVIDENCE_BUNDLE',
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    producer: 'tester',
    result: 'PUBLISHED',
    planning_revision: 3,
    checkpoint_id: checkpointId,
    attempt_id: attemptId,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    repository_full_name: 'example/source',
    backend: 'PRIVATE_SUPABASE',
    evidence_bundle_ref: cp6PrivateBundle,
    publication_proof: {
      kind: 'SUPABASE_MANIFEST_READBACK',
      evidence_bundle_id: cp6PrivateBundle.evidence_bundle_id,
      manifest_path: cp6PrivateBundle.manifest_path,
      manifest_sha256: cp6PrivateBundle.manifest_sha256,
      row_readback_verified: true,
    },
  }
  const cp6PrivateAttestationSnapshot = {
    path: verificationPath(projectId, cp6PrivateAttestationId, 'NEXT'),
    sha: '7'.repeat(40),
    record_text: prettyJson(cp6PrivateAttestation),
  }
  const cp6BadPrivateAttestationSnapshot = {
    ...cp6PrivateAttestationSnapshot,
    record_text: prettyJson({
      ...cp6PrivateAttestation,
      publication_proof: {
        ...cp6PrivateAttestation.publication_proof,
        manifest_sha256: '0'.repeat(64),
      },
    }),
  }
  const cp6RepoAttestationId = uuidv7()
  const cp6RepoAttestation = {
    verification_id: cp6RepoAttestationId,
    kind: 'EVIDENCE_BUNDLE',
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    producer: 'tester',
    result: 'PUBLISHED',
    planning_revision: 3,
    checkpoint_id: checkpointId,
    attempt_id: attemptId,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    repository_full_name: 'example/source',
    backend: 'REPOSITORY_GIT',
    evidence_bundle_ref: cp6RepoBundle,
    publication_proof: {
      kind: 'REPOSITORY_PUBLISH_FINALIZE',
      evidence_ref: cp6RepoBundle.evidence_ref,
      evidence_commit_sha: cp6RepoBundle.evidence_commit_sha,
      manifest_path: cp6RepoBundle.manifest_path,
      manifest_sha256: cp6RepoBundle.manifest_sha256,
      manifest_readback_verified: true,
      artifact_readback_verified: true,
      automation_side_effects_observed: false,
      probe_verification_ref: cp6RepoBundle.binary_probe_verification_ref,
      probe_verification_sha: cp6RepoBundle.binary_probe_verification_sha,
    },
  }
  const cp6RepoAttestationSnapshot = {
    path: verificationPath(projectId, cp6RepoAttestationId, 'NEXT'),
    sha: '6'.repeat(40),
    record_text: prettyJson(cp6RepoAttestation),
  }
  const cp6BadRepoAttestationSnapshot = {
    ...cp6RepoAttestationSnapshot,
    record_text: prettyJson({
      ...cp6RepoAttestation,
      publication_proof: {
        ...cp6RepoAttestation.publication_proof,
        evidence_commit_sha: '1'.repeat(40),
      },
    }),
  }

  const cp7ProductFailureOutcome = checkpointVerificationOutcome('FAIL', 'PRODUCT_FAILURE')
  const cp7PlanGapOutcome = checkpointVerificationOutcome('FAIL', 'PLAN_GAP')
  const cp7RepairRevision = 'e'.repeat(40)
  const cp7RepairGoalId = uuidv7()
  const cp7RepairGoal = {
    verification_id: cp7RepairGoalId,
    kind: 'GOAL_RECHECK',
    execution_contract: 'NEXT',
    project_id: projectId,
    job_id: nextJobId,
    target_revision: cp7RepairRevision,
    result: 'PASS',
    criteria: [{ result: 'MET' }],
    scope_drift: [],
  }
  const cp7FailedProductClaim = {
    ...nextGateClaim,
    state: 'FAILED_PRODUCT',
    retest_required: true,
    last_failure_class: 'PRODUCT_FAILURE',
    last_result: 'FAIL',
    last_verification_id: verificationId,
    last_target_revision: cp6TargetRevision,
  }
  const cp7RepairGoalRef = verificationPath(projectId, cp7RepairGoalId, 'NEXT')
  const cp7ProductRetestAllowed =
    productFailureRetestValidationError(
      cp7FailedProductClaim,
      cp7RepairRevision,
      verificationId,
      prettyJson(cp7RepairGoal),
      cp7RepairGoalRef,
      projectId,
      nextJobId,
    ) === null
  const cp7ProductRetestSameTargetRejected =
    productFailureRetestValidationError(
      cp7FailedProductClaim,
      cp6TargetRevision,
      verificationId,
      prettyJson(cp7RepairGoal),
      cp7RepairGoalRef,
      projectId,
      nextJobId,
    ) !== null
  const cp7PlanGapVerificationId = uuidv7()
  const cp7PlanGapVerification = {
    ...nextGateVerification,
    verification_id: cp7PlanGapVerificationId,
    result: 'FAIL',
    failure_class: 'PLAN_GAP',
    route: 'PLANNER_REVISION_SUPERSEDE',
  }
  const cp7PlanGapClaim = {
    ...nextGateClaim,
    state: 'NEEDS_PLANNER_REVISION',
    last_failure_class: 'PLAN_GAP',
    last_result: 'FAIL',
    last_verification_id: cp7PlanGapVerificationId,
    last_target_revision: cp7PlanGapVerification.target_revision,
  }
  const cp7PlanGapVerificationRef = verificationPath(projectId, cp7PlanGapVerificationId, 'NEXT')
  const cp7PlanGapCurrent = { ...nextGateJob, lifecycle: 'IN_PROGRESS' }
  const cp7PlanGapSupersessionAccepted = nextPlanSupersessionMatches(
    cp7PlanGapCurrent,
    cp7PlanGapVerification,
    cp7PlanGapVerificationRef,
    cp7PlanGapClaim,
    projectId,
    nextJobId,
  )
  const cp7PlanGapSupersessionMismatchRejected = !nextPlanSupersessionMatches(
    cp7PlanGapCurrent,
    cp7PlanGapVerification,
    cp7PlanGapVerificationRef,
    { ...cp7PlanGapClaim, last_verification_id: uuidv7() },
    projectId,
    nextJobId,
  )
  const cp7PlannerSkill = RUNTIME_SKILLS['job-planning']?.body ?? ''
  const p0OwnedSourceScope = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'MUTATE_SOURCE',
    target_repository_url: 'https://github.com/example/source',
  })
  const p0ExternalSourceScope = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'MUTATE_SOURCE',
    target_repository_url: 'https://github.com/example/other',
  })
  const p0ExternalReadExplicit = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'READ_EXTERNAL',
    target_repository_url: 'https://github.com/example/other',
    user_directed_external_read: true,
  })
  const p0ExternalReadImplicit = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'READ_EXTERNAL',
    target_repository_url: 'https://github.com/example/other',
    user_directed_external_read: false,
  })
  const p0OwnedMemoryScope = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'MUTATE_MEMORY',
    target_memory_path: 'projects/' + projectId + '/WORK/JOBS/example.json',
  })
  const p0OtherMemoryScope = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'MUTATE_MEMORY',
    target_memory_path: 'projects/' + uuidv7() + '/WORK/JOBS/example.json',
  })
  const p0PausedMutationScope = projectScopeDecision({
    project_manifest_text: paused?.next ?? manifest,
    project_id: projectId,
    operation: 'MUTATE_SOURCE',
    target_repository_url: 'https://github.com/example/source',
  })
  const p0WrongProjectIdentity = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: uuidv7(),
    operation: 'MUTATE_SOURCE',
    target_repository_url: 'https://github.com/example/source',
  })
  const p1TaskA = uuidv7()
  const p1TaskB = uuidv7()
  const p1RunA = uuidv7()
  const p1DispatchJob = {
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    planning_review: { status: 'PASS', reviewed_revision: 7 },
    tasks: [
      { task_id: p1TaskA, dependencies: [] },
      { task_id: p1TaskB, dependencies: [p1TaskA] },
    ],
    topology: [
      { stage: 1, handler: 'coder', task_id: p1TaskA, depends_on: [], next: p1TaskB },
      { stage: 2, handler: 'tester', task_id: p1TaskB, depends_on: [p1TaskA], next: null },
    ],
  }
  const p1CompletedRun = {
    run_id: p1RunA,
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    primary_task_id: p1TaskA,
    role: 'coder',
    lifecycle: 'COMPLETED',
    result: 'PASS',
  }
  const p1CompletedEntry = {
    path: recordPath(projectId, 'RUNS', p1RunA, 'NEXT'),
    sha: '4'.repeat(40),
    record_text: prettyJson(p1CompletedRun),
    record: p1CompletedRun,
  }
  const p1JobSha = '5'.repeat(40)
  const p1DispatchValid = nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 7, p1JobSha, p1JobSha, [p1CompletedEntry])
  const p1WrongRole = nextDispatchPreflightError(p1DispatchJob, 'coder', [p1TaskB], 7, p1JobSha, p1JobSha, [p1CompletedEntry])
  const p1MissingPrerequisite = nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 7, p1JobSha, p1JobSha, [])
  const p1StaleRevision = nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 6, p1JobSha, p1JobSha, [p1CompletedEntry])
  const p1StaleJobSha = nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 7, p1JobSha, '6'.repeat(40), [p1CompletedEntry])
  const p1V2StableUnaffected = nextDispatchPreflightError({ ...p1DispatchJob, execution_contract: 'V2_STABLE' }, 'coder', [p1TaskB], 1, null, null, []) === null
  const p2UiTask = uuidv7()
  const p2UiJob = {
    ...p1DispatchJob,
    tasks: [{ task_id: p2UiTask, dependencies: [], required_skills: ['ui-coder-frontend'] }],
    topology: [{ stage: 1, handler: 'coder', task_id: p2UiTask, depends_on: [], next: null }],
  }
  const p2UiSkillResolution = resolveRequiredTaskSkills(p2UiJob, [p2UiTask])
  const p2UiDispatch = nextDispatchPreflightError(p2UiJob, 'coder', [p2UiTask], 7, p1JobSha, p1JobSha, [])
  const p2UnknownSkillResolution = resolveRequiredTaskSkills(
    { ...p2UiJob, tasks: [{ task_id: p2UiTask, dependencies: [], required_skills: ['missing-runtime-skill'] }] },
    [p2UiTask],
  )
  const p2GenericJob = { ...p2UiJob, tasks: [{ task_id: p2UiTask, dependencies: [], required_skills: [] }] }
  const p2GenericSkillResolution = resolveRequiredTaskSkills(p2GenericJob, [p2UiTask])
  const p2GenericCoderUnaffected = nextDispatchPreflightError(
    p2GenericJob,
    'coder',
    [p2UiTask],
    7,
    p1JobSha,
    p1JobSha,
    [],
  )

  const p2GoalTask = uuidv7()
  const p2GoalJob = {
    ...p1DispatchJob,
    tasks: [{
      task_id: p2GoalTask,
      dependencies: [],
      required_skills: [],
      completion_criteria: ['criterion A', 'criterion B'],
    }],
    topology: [{ stage: 1, handler: 'coder', task_id: p2GoalTask, depends_on: [], next: null }],
  }
  const p2GoalRun = {
    run_id: uuidv7(),
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    primary_task_id: p2GoalTask,
    affected_task_refs: [p2GoalTask],
    role: 'coder',
    lifecycle: 'IN_PROGRESS',
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
  }
  const p2GoalCompleteCoverage = goalRecheckCoverageError(p2GoalJob, p2GoalRun, [
    { task_id: p2GoalTask, criterion: 'criterion A', result: 'MET' },
    { task_id: p2GoalTask, criterion: 'criterion B', result: 'MET' },
  ])
  const p2GoalMissingCoverage = goalRecheckCoverageError(p2GoalJob, p2GoalRun, [
    { task_id: p2GoalTask, criterion: 'criterion A', result: 'MET' },
  ])

  const p2ReviewerTask = uuidv7()
  const p2TesterTask = uuidv7()
  const p2ReviewerRunId = uuidv7()
  const p2TesterRunId = uuidv7()
  const p2ClosureJob = {
    ...p1DispatchJob,
    tasks: [
      { task_id: p2ReviewerTask, dependencies: [], completion_criteria: ['review'] },
      { task_id: p2TesterTask, dependencies: [], completion_criteria: ['test'] },
    ],
    topology: [
      { stage: 1, handler: 'reviewer', task_id: p2ReviewerTask, depends_on: [], next: p2TesterTask },
      { stage: 2, handler: 'tester', task_id: p2TesterTask, depends_on: [], next: null },
    ],
  }
  const p2ReviewerRun = {
    run_id: p2ReviewerRunId,
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    primary_task_id: p2ReviewerTask,
    role: 'reviewer',
    lifecycle: 'COMPLETED',
    result: 'PASS',
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
  }
  const p2TesterRun = {
    run_id: p2TesterRunId,
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    primary_task_id: p2TesterTask,
    role: 'tester',
    lifecycle: 'COMPLETED',
    result: 'PASS',
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
  }
  const p2ReviewerRunEntry = {
    path: recordPath(projectId, 'RUNS', p2ReviewerRunId, 'NEXT'),
    sha: '8'.repeat(40),
    record_text: prettyJson(p2ReviewerRun),
    record: p2ReviewerRun,
  }
  const p2TesterRunEntry = {
    path: recordPath(projectId, 'RUNS', p2TesterRunId, 'NEXT'),
    sha: '9'.repeat(40),
    record_text: prettyJson(p2TesterRun),
    record: p2TesterRun,
  }
  const p2ReviewVerificationId = uuidv7()
  const p2TestVerificationId = uuidv7()
  const p2ReviewVerification = {
    verification_id: p2ReviewVerificationId,
    kind: 'REVIEW',
    project_id: projectId,
    job_id: nextJobId,
    task_id: p2ReviewerTask,
    run_id: p2ReviewerRunId,
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
    producer: 'reviewer',
    execution_contract: 'NEXT',
    planning_revision: 7,
    result: 'PASS',
    findings: [],
    evidence_refs: ['review-evidence'],
  }
  const p2TestVerification = {
    verification_id: p2TestVerificationId,
    kind: 'TEST',
    project_id: projectId,
    job_id: nextJobId,
    task_id: p2TesterTask,
    run_id: p2TesterRunId,
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
    producer: 'tester',
    execution_contract: 'NEXT',
    planning_revision: 7,
    result: 'PASS',
    failure_class: null,
    evidence_refs: ['test-evidence'],
  }
  const p2ReviewVerificationEntry = {
    path: verificationPath(projectId, p2ReviewVerificationId, 'NEXT'),
    sha: 'a'.repeat(40),
    record_text: prettyJson(p2ReviewVerification),
    record: p2ReviewVerification,
  }
  const p2TestVerificationEntry = {
    path: verificationPath(projectId, p2TestVerificationId, 'NEXT'),
    sha: 'b'.repeat(40),
    record_text: prettyJson(p2TestVerification),
    record: p2TestVerification,
  }
  const p2ClosureRefs = [
    p2ReviewerRunEntry.path,
    p2TesterRunEntry.path,
    p2ReviewVerificationEntry.path,
    p2TestVerificationEntry.path,
  ]
  const p2ClosureCoveragePass = nextClosureCoverageError(
    p2ClosureJob,
    [p2ReviewerRunEntry, p2TesterRunEntry],
    [p2ReviewVerificationEntry, p2TestVerificationEntry],
    p2ClosureRefs,
  )
  const p2ClosureMissingVerification = nextClosureCoverageError(
    p2ClosureJob,
    [p2ReviewerRunEntry, p2TesterRunEntry],
    [p2ReviewVerificationEntry],
    p2ClosureRefs,
  )
  const p2StaleReviewVerification = validateRunVerificationSnapshot(
    { ...p2ReviewVerificationEntry, record_text: prettyJson({ ...p2ReviewVerification, target_revision: '6'.repeat(40) }) },
    p2ReviewerRun,
    'reviewer',
    'PASS',
  )
  const p2EmptyEvidenceReviewVerification = validateRunVerificationSnapshot(
    { ...p2ReviewVerificationEntry, record_text: prettyJson({ ...p2ReviewVerification, evidence_refs: [] }) },
    p2ReviewerRun,
    'reviewer',
    'PASS',
  )
  const p2ImportantFindingReviewVerification = validateRunVerificationSnapshot(
    {
      ...p2ReviewVerificationEntry,
      record_text: prettyJson({
        ...p2ReviewVerification,
        findings: [{ severity: 'IMPORTANT', finding: 'unresolved', evidence: [] }],
      }),
    },
    p2ReviewerRun,
    'reviewer',
    'PASS',
  )
  const p2TesterFailureClassVerification = validateRunVerificationSnapshot(
    {
      ...p2TestVerificationEntry,
      record_text: prettyJson({ ...p2TestVerification, failure_class: 'PRODUCT_FAILURE' }),
    },
    p2TesterRun,
    'tester',
    'PASS',
  )
  const p2V2ClosureUnaffected = nextClosureCoverageError(
    { ...p2ClosureJob, execution_contract: 'V2_STABLE' },
    [],
    [],
    [],
  ) === null

  const checks = {
    uuidv7_shape: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(projectId),
    manifest_parse: Boolean(parsed && parsed.project_id === projectId && parsed.lifecycle === 'ACTIVE'),
    pause_transition: Boolean(paused && parseProjectManifest(paused.next)?.lifecycle === 'PAUSED'),
    resume_transition: Boolean(resumed && parseProjectManifest(resumed.next)?.lifecycle === 'ACTIVE'),
    memory_path_accept: validMemoryPath('projects/' + projectId + '/PROJECT.md'),
    memory_path_reject: !validMemoryPath('README.md') && !validMemoryPath('../projects/' + projectId + '/PROJECT.md'),
    p0_owned_source_scope_allowed: p0OwnedSourceScope.allowed && p0OwnedSourceScope.mutation_allowed,
    p0_external_source_mutation_rejected: !p0ExternalSourceScope.allowed && !p0ExternalSourceScope.mutation_allowed,
    p0_explicit_external_read_is_read_only: p0ExternalReadExplicit.allowed && !p0ExternalReadExplicit.mutation_allowed && p0ExternalReadExplicit.scope === 'EXPLICIT_EXTERNAL_READ',
    p0_implicit_external_read_rejected: !p0ExternalReadImplicit.allowed,
    p0_owned_memory_scope_allowed: p0OwnedMemoryScope.allowed && p0OwnedMemoryScope.mutation_allowed,
    p0_other_project_memory_rejected: !p0OtherMemoryScope.allowed,
    p0_paused_project_mutation_rejected: !p0PausedMutationScope.allowed,
    p0_wrong_project_identity_rejected: !p0WrongProjectIdentity.allowed,
    repo_normalization: normalizeGithubRepo('https://github.com/example/memory.git')?.full_name === 'example/memory',
    planner_harness_present: Boolean(renderHarness('planner')?.includes('ROLE LOOP')),
    p0_shared_harness_requires_project_scope_guard: BASE_AGENT_HARNESS.includes('authorize_project_scope'),
    p0_planner_traceability_guard: Boolean(renderHarness('planner')?.includes('owner/surface/evidence/disposition traceability')),
    p0_reviewer_runtime_invariant_check: Boolean(renderHarness('reviewer')?.includes('schema presence alone is not implementation proof')),
    p1_valid_next_dispatch_allowed: p1DispatchValid === null,
    p1_wrong_role_dispatch_rejected: Boolean(p1WrongRole?.includes('NEXT_DISPATCH_WRONG_ROLE')),
    p1_unmet_prerequisite_dispatch_rejected: Boolean(p1MissingPrerequisite?.includes('NEXT_DISPATCH_PREREQUISITE_BLOCKED')),
    p1_stale_planning_revision_rejected: Boolean(p1StaleRevision?.includes('NEXT_DISPATCH_STALE_PLANNING_REVISION')),
    p1_stale_job_sha_rejected: Boolean(p1StaleJobSha?.includes('NEXT_DISPATCH_STALE_JOB_SHA')),
    p1_v2_stable_dispatch_unchanged: p1V2StableUnaffected,
    p1_shared_harness_requires_exact_dispatch_state: BASE_AGENT_HARNESS.includes('exact current Job SHA and planning_revision'),
    p2_ui_coder_required_skill_context_injected:
      p2UiSkillResolution.error === null &&
      p2UiSkillResolution.names.includes('ui-coder-frontend') &&
      p2UiSkillResolution.contexts.some((item: any) => item.name === 'ui-coder-frontend' && item.skill_text.length > 0),
    p2_ui_coder_dispatch_allowed_with_runtime_injection: p2UiDispatch === null,
    p2_unknown_required_skill_rejected: Boolean(p2UnknownSkillResolution.error?.includes('NEXT_DISPATCH_REQUIRED_SKILL_UNKNOWN')),
    p2_generic_coder_unaffected_by_ui_skill:
      p2GenericSkillResolution.error === null &&
      p2GenericSkillResolution.names.length === 0 &&
      p2GenericCoderUnaffected === null,
    p2_goal_recheck_full_criterion_coverage_passes: p2GoalCompleteCoverage === null,
    p2_goal_recheck_missing_criterion_rejected: Boolean(p2GoalMissingCoverage?.includes('GOAL_RECHECK_COVERAGE_REJECTED')),
    p2_reviewer_tester_closure_coverage_passes: p2ClosureCoveragePass === null,
    p2_missing_durable_verification_blocks_closure: Boolean(p2ClosureMissingVerification?.includes('NEXT_CLOSURE_COVERAGE_REJECTED')),
    p2_stale_review_verification_rejected: Boolean(p2StaleReviewVerification.error),
    p2_empty_evidence_review_verification_rejected: Boolean(p2EmptyEvidenceReviewVerification.error),
    p2_important_finding_review_verification_rejected: Boolean(p2ImportantFindingReviewVerification.error),
    p2_tester_success_failure_class_rejected: Boolean(p2TesterFailureClassVerification.error),
    p2_v2_stable_closure_unchanged: p2V2ClosureUnaffected,
    p3_cutover_inventory_resolved: cutoverInventoryError() === null,
    p3_unresolved_cutover_inventory_rejected: Boolean(cutoverInventoryError(p3PendingInventory)?.includes('CUTOVER_INVENTORY_UNRESOLVED')),
    p3_staging_surface_detected: runtimeSurface(p3StagingRequest) === 'STAGING_NEXT',
    p3_production_surface_detected: runtimeSurface(p3ProductionRequest) === 'PRODUCTION',
    p3_staging_new_job_default_remains_v2: jobCreationExecutionContractDefault(p3StagingRequest) === 'V2_STABLE',
    p3_production_new_job_default_is_next: jobCreationExecutionContractDefault(p3ProductionRequest) === 'NEXT',
    p3_staging_next_namespace_is_test_lab: nextMemoryNamespaceForRequest(p3StagingRequest) === 'TEST_LAB',
    p3_production_next_namespace_is_production: nextMemoryNamespaceForRequest(p3ProductionRequest) === 'PRODUCTION',
    p3_historical_next_missing_namespace_defaults_test_lab: resolveNextMemoryNamespace(undefined, 'NEXT') === 'TEST_LAB',
    p3_production_next_job_path_outside_test_lab:
      recordPath(projectId, 'JOBS', uuidv7(), 'NEXT', 'PRODUCTION').startsWith('projects/' + projectId + '/WORK/JOBS/') &&
      !recordPath(projectId, 'JOBS', uuidv7(), 'NEXT', 'PRODUCTION').includes('/TEST-LAB/NEXT/'),
    p3_production_next_verification_path_outside_test_lab:
      verificationPath(projectId, uuidv7(), 'NEXT', 'PRODUCTION').startsWith('projects/' + projectId + '/VERIFICATION/') &&
      !verificationPath(projectId, uuidv7(), 'NEXT', 'PRODUCTION').includes('/TEST-LAB/NEXT/'),
    p3_staging_and_production_next_paths_are_separate:
      recordPath(projectId, 'JOBS', nextJobId, 'NEXT', 'TEST_LAB') !== recordPath(projectId, 'JOBS', nextJobId, 'NEXT', 'PRODUCTION'),
    p3_missing_execution_contract_still_v2_compatible: resolveExecutionContract(undefined) === 'V2_STABLE',
    coder_harness_goal_recheck: Boolean(renderHarness('coder')?.includes('GOAL RECHECK')),
    base_harness_denial_boundary: BASE_AGENT_HARNESS.includes('denied or unauthorized action'),
    progressive_skill_catalog: Boolean(RUNTIME_SKILLS['coding-loop'] && RUNTIME_SKILLS['delegation']),
    coder_skill_suggested: (ROLE_SKILLS.coder ?? []).includes('coding-loop'),
    ui_coder_frontend_catalog_present: Boolean(RUNTIME_SKILLS['ui-coder-frontend']),
    ui_coder_frontend_not_default: !(ROLE_SKILLS.coder ?? []).includes('ui-coder-frontend'),
    tester_modes_present: Boolean(renderHarness('tester')?.includes('VERIFY, MEASURE and PROBE') && RUNTIME_SKILLS['testing-evidence']?.body.includes('MEASURE: record an observed value/state')),
    tester_measure_no_threshold_guard: Boolean(RUNTIME_SKILLS['testing-evidence']?.body.includes('do not invent PASS/FAIL')),
    tester_readiness_ladder_present: Boolean(RUNTIME_SKILLS['testing-evidence']?.body.includes('DISCOVERED → REACHABLE → INVOCABLE → FUNCTIONAL → GOAL_MET')),
    tester_failure_classes_present: Boolean(RUNTIME_SKILLS['testing-evidence']?.body.includes('PRODUCT_FAILURE, TEST_FAILURE, ENVIRONMENT_FAILURE, NOT_READY, INTEGRATION_NOT_READY, SPEC_GAP, PLAN_GAP')),
    tester_retest_revision_bound: Boolean(RUNTIME_SKILLS['testing-evidence']?.body.includes('Bind Retest evidence to the exact target revision/state')),
    critic_harness_present: Boolean(renderHarness('critic_reviewer')?.includes('HUMAN AUTHORITY:')),
    critic_skill_suggested: (ROLE_SKILLS.critic_reviewer ?? []).includes('critic-review'),
    critic_human_authority_scoped: Boolean(renderHarness('critic_reviewer')?.includes('HUMAN AUTHORITY:') && renderHarness('critic_reviewer')?.includes('Human-preauthorized milestone crl')),
    critic_stateless_contract: Boolean(renderHarness('critic_reviewer')?.includes('Conversation history is non-authoritative')),
    ux_first_temp_ui_defaults_to_gate:
      uxFirstTemporaryUiGateRequired({ product_workflow: 'UX_FIRST', ui_strategy: { temporary_ui: [{ kind: 'temporary' }], temporary_ui_human_approval: 'REQUIRED_PENDING' } }, 'coder') &&
      !uxFirstTemporaryUiGateRequired({ product_workflow: 'UX_FIRST', ui_strategy: { temporary_ui: [{ kind: 'temporary' }], temporary_ui_human_approval: 'APPROVED' } }, 'coder') &&
      !uxFirstTemporaryUiGateRequired({ product_workflow: 'UX_FIRST', ui_strategy: { temporary_ui: [{ kind: 'temporary' }], temporary_ui_human_approval: 'REQUIRED_PENDING' } }, 'tester'),
    run_begin_requires_job_snapshot:
      p1DispatchValid === null &&
      Boolean(nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 7, null, null, [p1CompletedEntry])?.includes('NEXT_DISPATCH_STALE_JOB_SHA')),
    oauth_public_resource_canonical_on_internal_http:
      mcpResource(new Request('http://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp-next/mcp')) ===
      'https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp-next/mcp' &&
      resourceMetadata(new Request('http://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp/mcp')).startsWith('https://'),
    job_record_path_shape: recordPath(projectId, 'JOBS', uuidv7()).startsWith('projects/' + projectId + '/WORK/JOBS/'),
    next_job_path_isolated: recordPath(projectId, 'JOBS', uuidv7(), 'NEXT').startsWith('projects/' + projectId + '/TEST-LAB/NEXT/WORK/JOBS/'),
    next_verification_path_isolated: verificationPath(projectId, uuidv7(), 'NEXT').startsWith('projects/' + projectId + '/TEST-LAB/NEXT/VERIFICATION/'),
    next_checkpoint_claim_path_deterministic: checkpointClaimPath(projectId, nextJobId, 3, 'CP 1') === checkpointClaimPath(projectId, nextJobId, 3, 'CP 1') && checkpointClaimPath(projectId, nextJobId, 3, 'CP 1').includes('/TEST-LAB/NEXT/WORK/CHECKPOINT_CLAIMS/'),
    next_checkpoint_attempt_path_isolated: checkpointAttemptPath(projectId, uuidv7()).includes('/TEST-LAB/NEXT/WORK/CHECKPOINT_ATTEMPTS/'),
    checkpoint_lease_expiry_guard: checkpointLeaseExpired({ lease_expires_at: new Date(Date.now() - 1000).toISOString() }) && !checkpointLeaseExpired({ lease_expires_at: new Date(Date.now() + 60_000).toISOString() }),
    cp5_task_gate_accepts_current_applicable_evidence: nextTaskGatePass.allowed,
    cp5_task_gate_blocks_missing_evidence: !nextTaskGateMissing.allowed && nextTaskGateMissing.blocking.length === 1,
    cp5_task_gate_rejects_stale_revision_evidence: !nextTaskGateStale.allowed,
    cp5_v2_gate_preserves_legacy_path: legacyGatePass.allowed,
    cp7_next_no_checkpoint_dispatch_allowed: cp7NoCheckpointGate.allowed && cp7NoCheckpointGate.required_checkpoint_ids.length === 0,
    cp7_ui_coder_frontend_remains_opt_in: Boolean(RUNTIME_SKILLS['ui-coder-frontend']) && !(ROLE_SKILLS.coder ?? []).includes('ui-coder-frontend'),
    cp7_ui_coder_frontend_handoff_requires_explicit_load:
      cp7PlannerSkill.includes('required_skills=[ui-coder-frontend]') &&
      cp7PlannerSkill.includes('explicitly name ui-coder-frontend in the handoff') &&
      cp7PlannerSkill.includes('run_begin resolves and injects the full required skill context at dispatch') &&
      Boolean(RUNTIME_SKILLS['ui-coder-frontend']) &&
      !(ROLE_SKILLS.coder ?? []).includes('ui-coder-frontend'),
    cp7_product_failure_routes_to_repair_retest:
      cp7ProductFailureOutcome.state === 'FAILED_PRODUCT' &&
      cp7ProductFailureOutcome.route === 'CODER_REPAIR_GOAL_RECHECK_RETEST' &&
      cp7ProductFailureOutcome.retestRequired === true,
    cp7_product_failure_retest_requires_repaired_goal:
      cp7ProductRetestAllowed && cp7ProductRetestSameTargetRejected,
    cp7_plan_gap_routes_to_supersession:
      cp7PlanGapOutcome.state === 'NEEDS_PLANNER_REVISION' &&
      cp7PlanGapOutcome.route === 'PLANNER_REVISION_SUPERSEDE' &&
      cp7PlanGapOutcome.retestRequired === false,
    cp7_plan_gap_supersession_requires_terminal_claim:
      cp7PlanGapSupersessionAccepted && cp7PlanGapSupersessionMismatchRejected,
    cp5_orphan_verification_not_applicable: !checkpointVerificationApplicable(nextGateJob, nextGateJob.test_checkpoints[0], { ...nextGateClaim, last_verification_id: uuidv7() }, nextGateVerification),
    cp5_execution_topology_validator_accepts_coherent_plan: executionTopologyValid,
    cp5_execution_topology_validator_rejects_stale_task_mapping: executionTopologyStale,
    cp5_typed_checkpoint_dependency_blocks_task_without_evidence: !topologyDependencyGateMissing.allowed,
    cp5_typed_checkpoint_dependency_opens_with_applicable_evidence: topologyDependencyGatePass.allowed,
    cp5_nested_applicability_revision_mismatch_rejected: !checkpointVerificationApplicable(nextGateJob, nextGateJob.test_checkpoints[0], nextGateClaim, nextGateVerificationWrongNestedRevision),
    cp5_milestone_boundary_expands_runtime_prereqs: milestoneBoundaryPrereqs.includes(consumerTaskId) && !milestoneBoundaryPrereqs.includes(checkpointId),
    cp5_job_final_boundary_expands_runtime_prereqs: jobFinalBoundaryPrereqs.includes(consumerTaskId) && jobFinalBoundaryPrereqs.includes(checkpointId) && !jobFinalBoundaryPrereqs.includes('CP-FINAL'),
    cp6_private_bundle_accepts_exact_binding: evidenceBundleRefValidationError(cp6PrivateBundle, cp6ExpectedBundleContext) === null,
    cp6_private_bundle_rejects_stale_revision: evidenceBundleRefValidationError({ ...cp6PrivateBundle, target_revision: '1'.repeat(40) }, cp6ExpectedBundleContext) !== null,
    cp6_private_bundle_rejects_wrong_attempt: evidenceBundleRefValidationError({ ...cp6PrivateBundle, binding: { ...cp6PrivateBundle.binding, attempt_id: uuidv7() } }, cp6ExpectedBundleContext) !== null,
    cp6_private_bundle_rejects_oversize: evidenceBundleRefValidationError({ ...cp6PrivateBundle, size_bytes: 51 * 1024 * 1024 }, cp6ExpectedBundleContext) !== null,
    cp6_repo_bundle_accepts_immutable_publish: evidenceBundleRefValidationError(cp6RepoBundle, cp6ExpectedBundleContext) === null,
    cp6_repo_bundle_rejects_private_class: evidenceBundleRefValidationError({ ...cp6RepoBundle, privacy_class: 'PRIVATE_REQUIRED' }, cp6ExpectedBundleContext) !== null,
    cp6_repo_bundle_rejects_mutable_evidence: evidenceBundleRefValidationError({ ...cp6RepoBundle, immutable: false }, cp6ExpectedBundleContext) !== null,
    cp6_repo_bundle_rejects_automation_side_effects: evidenceBundleRefValidationError({ ...cp6RepoBundle, automation_side_effects_observed: true }, cp6ExpectedBundleContext) !== null,
    cp6_repo_bundle_requires_probe_sha: evidenceBundleRefValidationError({ ...cp6RepoBundle, binary_probe_verification_sha: null }, cp6ExpectedBundleContext) !== null,
    cp6_private_attestation_accepts_authenticated_proof: validateEvidenceBundleAttestationSnapshot(cp6PrivateAttestationSnapshot, cp6ExpectedBundleContext).error === null,
    cp6_private_attestation_rejects_manifest_proof_mismatch: validateEvidenceBundleAttestationSnapshot(cp6BadPrivateAttestationSnapshot, cp6ExpectedBundleContext).error !== null,
    cp6_repo_attestation_accepts_finalize_proof: validateEvidenceBundleAttestationSnapshot(cp6RepoAttestationSnapshot, cp6ExpectedBundleContext).error === null,
    cp6_repo_attestation_rejects_commit_proof_mismatch: validateEvidenceBundleAttestationSnapshot(cp6BadRepoAttestationSnapshot, cp6ExpectedBundleContext).error !== null,
    cp6_checkpoint_bundle_is_applicable_when_exact: checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], cp6ClaimWithBundle, cp6VerificationWithBundle),
    p3_production_checkpoint_bundle_attestation_is_applicable: checkpointVerificationApplicable(cp6ProductionJobWithRepo, cp6ProductionJobWithRepo.test_checkpoints[0], cp6ProductionClaimWithBundle, cp6ProductionVerificationWithBundle),
    p3_production_checkpoint_bundle_rejects_test_lab_attestation_path: !checkpointVerificationApplicable(cp6ProductionJobWithRepo, cp6ProductionJobWithRepo.test_checkpoints[0], cp6ProductionClaimWithBundle, cp6ProductionVerificationWithLabAttestation),
    cp6_checkpoint_bundle_rejects_missing_attestation_ref: !checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], cp6ClaimWithBundle, { ...cp6VerificationWithBundle, evidence_bundle_attestation_refs: [] }),
    cp6_checkpoint_bundle_rejects_retest_attempt_mismatch: !checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], { ...cp6ClaimWithBundle, attempt_id: uuidv7() }, cp6VerificationWithBundle),
    cp6_handoff_claim_accepts_current_terminal_verification: validateTesterEvidenceClaimSnapshot(cp6TerminalClaimSnapshot, cp6VerificationWithBundle, cp6HandoffClaimExpected).error === null,
    cp6_handoff_claim_rejects_orphan_verification: validateTesterEvidenceClaimSnapshot(cp6OrphanClaimSnapshot, cp6VerificationWithBundle, cp6HandoffClaimExpected).error !== null,
    edge_function_external_path: edgeFunctionBase(new Request('https://example.supabase.co/functions/v1/gsa-mcp-next/mcp')) === `https://${PROJECT_REF}.supabase.co/functions/v1/gsa-mcp-next`,
    edge_function_runtime_path: edgeFunctionBase(new Request('https://example.supabase.co/gsa-mcp-next/mcp')) === `https://${PROJECT_REF}.supabase.co/functions/v1/gsa-mcp-next`,
    execution_contract_missing_is_stable: resolveExecutionContract(undefined) === 'V2_STABLE',
    execution_contract_stable_is_stable: resolveExecutionContract('V2_STABLE') === 'V2_STABLE',
    execution_contract_next_is_next: resolveExecutionContract('NEXT') === 'NEXT',
    execution_contract_invalid_rejected: resolveExecutionContract('UNKNOWN') === null,
    goal_recheck_legacy_run_identity_valid: goalRecheckRunMatches(legacyCoderRun, projectId, legacyJobId, legacyRunId),
    goal_recheck_next_run_identity_valid: goalRecheckRunMatches(nextCoderRun, projectId, nextJobId, nextRunId),
    goal_recheck_wrong_run_identity_rejected: !goalRecheckRunMatches(nextCoderRun, projectId, nextJobId, legacyRunId),
    goal_recheck_wrong_role_rejected: !goalRecheckRunMatches({ ...nextCoderRun, role: 'reviewer' }, projectId, nextJobId, nextRunId),
    goal_recheck_legacy_run_contract_stable: resolveExecutionContract(legacyCoderRun.execution_contract) === 'V2_STABLE',
    goal_recheck_next_run_contract_next: resolveExecutionContract(nextCoderRun.execution_contract) === 'NEXT',
    goal_recheck_invalid_run_contract_rejected: resolveExecutionContract('UNKNOWN') === null,
    goal_recheck_legacy_run_path_unchanged: recordPath(projectId, 'RUNS', legacyRunId, resolveExecutionContract(legacyCoderRun.execution_contract) ?? 'V2_STABLE').startsWith('projects/' + projectId + '/WORK/RUNS/'),
    goal_recheck_next_run_path_isolated: recordPath(projectId, 'RUNS', nextRunId, resolveExecutionContract(nextCoderRun.execution_contract) ?? 'V2_STABLE').startsWith('projects/' + projectId + '/TEST-LAB/NEXT/WORK/RUNS/'),
    goal_recheck_stable_verification_path_unchanged: verificationPath(projectId, uuidv7(), resolveExecutionContract(legacyCoderRun.execution_contract) ?? 'V2_STABLE').startsWith('projects/' + projectId + '/VERIFICATION/'),
    goal_recheck_next_verification_path_isolated: verificationPath(projectId, uuidv7(), resolveExecutionContract(nextCoderRun.execution_contract) ?? 'V2_STABLE').startsWith('projects/' + projectId + '/TEST-LAB/NEXT/VERIFICATION/'),
  }
  const pass = Object.values(checks).every(Boolean)
  return c.json({ pass, checks })
})

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
