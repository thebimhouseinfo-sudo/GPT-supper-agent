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

  server.registerTool(
    'job_plan_change_fence_prepare',
    {
      title: 'Prepare exact-SHA affected Job Plan fence',
      description: 'LLC58: stop new Run/cursor writes before superseding a replaced READY or IN_PROGRESS Job. Prepared UPDATE only; external GitHub CAS/readback required.',
      inputSchema: {
        project_id:z.string().uuid(),job_id:z.string().uuid(),
        job_record_text:z.string().min(2),
        job_record_sha:z.string().regex(/^[0-9a-f]{40}$/),
        intent_record_text:z.string().min(2),
        intent_record_sha:z.string().regex(/^[0-9a-f]{40}$/),
        intent_memory_path:z.string().min(1),
      },
      outputSchema:{
        allowed:z.boolean(),reason:z.string(),
        operation:z.enum(['UPDATE','NONE']),
        job_memory_path:z.string(),
        expected_job_sha:z.string().nullable(),
        next_job_record_text:z.string().nullable(),
        mutation_authorized:z.boolean(),
        external_steps:z.array(z.string()),
      },
      securitySchemes:[{type:'oauth2',scopes:AUTH_SCOPES}],
      _meta:{securitySchemes:[{type:'oauth2',scopes:AUTH_SCOPES}]},
      annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
    } as any,
    async (input: any) => {
      const auth=await authContext(req)
      if (!auth) return authError(req,'Authentication required for Job Plan fence.')
      const decision=prepareHumanPlanChangeFenceDecision(input)
      let job:any
      try { job=JSON.parse(input.job_record_text) } catch { job={} }
      const contract=jobExecutionContract(job)
      const ns=recordNextMemoryNamespace(job)
      const path=contract ? recordPath(input.project_id,'JOBS',input.job_id,contract,
        ns ?? DEFAULT_NEXT_MEMORY_NAMESPACE) : ''
      const result={
        allowed:decision.allowed,reason:decision.reason,
        operation:decision.operation,
        job_memory_path:path,
        expected_job_sha:decision.allowed ? decision.expected_job_sha : null,
        next_job_record_text:decision.allowed ? prettyJson(decision.record) : null,
        mutation_authorized:false,
        external_steps:decision.allowed ? [
          'Read back exact immutable reviewed Plan intent and current Job SHA; authorize both paths under current PROJECT.md.',
          'If UPDATE, authorize_memory_mutation and write Job fence using the exact expected_job_sha; independently read back bytes/SHA.',
          'Only after fence readback, reconcile pending cursor, Run, Git HEAD/tree; then use intent-bound job_transition(SUPERSEDED or RETIRED).',
          'Do not dispatch or write source under a fenced Job in any chat; no background stop is implied.',
        ]:[],
      }
      return {structuredContent:result,content:[{type:'text',text:JSON.stringify(result)}]}
    },
  )

  server.registerTool(
    'job_plan_change_resume_evaluate',
    {
      title: 'Resume a reviewed multi-Job Plan Change from durable readback',
      description: 'LLC58 recovery evaluator; identifies the next safe action after interrupted Job supersession/replacement. Never authorizes mutation or transfers old PASS evidence.',
      inputSchema: {
        project_id: z.string().uuid(),
        intent_memory_path: z.string().min(1),
        intent_record_text: z.string().min(2),
        intent_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_job_snapshots: z.array(z.object({
          job_record_text: z.string().min(2),
          job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        })),
        activity: z.array(z.object({
          job_id: z.string().uuid(),
          cursor_state: z.enum(['ABSENT','STABLE','PENDING','UNKNOWN']),
          active_run_state: z.enum(['NONE','TERMINAL','ACTIVE','UNKNOWN']),
        })).default([]),
      },
      outputSchema: {
        allowed: z.boolean(), reason: z.string(),
        actions: z.array(z.any()), mutation_authorized: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Plan Change recovery.')
      const decision = resumeHumanPlanChangeIntent(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'job_plan_change_prepare',
    {
      title: 'Prepare immutable Human Plan Change reconciliation intent',
      description: 'LLC58: prepare one deterministic CREATE per reviewed Plan revision. Reserve unique replacement Job IDs; requires PASS planning-review evidence. Only external authorized GitHub CREATE/readback makes it durable; no Job mutation is performed.',
      inputSchema: {
        project_id: z.string().uuid(),
        change_ref: z.string().min(1),
        reviewed_plan_sha: z.string().regex(/^[0-9a-f]{40}$/),
        plan_job_record_text: z.string().min(2),
        plan_job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        plan_review_record_text: z.string().min(2),
        plan_review_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        plan_review_memory_path: z.string().min(1),
        work_branch: z.string().min(1),
        job_snapshots: z.array(z.object({
          job_record_text: z.string().min(2),
          job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          decision: z.enum(['KEEP','REVALIDATE','REPLACE','RETIRE','HUMAN_DECISION']),
          reason: z.string().min(1),
          retired_task_ids: z.array(z.string().min(1)).optional(),
          cursor_state: z.enum(['ABSENT','STABLE','PENDING','UNKNOWN']).optional(),
          active_run_state: z.enum(['NONE','TERMINAL','ACTIVE','UNKNOWN']).optional(),
        })).min(1),
        existing_intent_record_text: z.string().min(2).optional(),
        existing_intent_record_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
      },
      outputSchema: {
        allowed: z.boolean(), reason: z.string(),
        operation: z.enum(['CREATE','NONE']), intent_memory_path: z.string(),
        intent_record_text: z.string().nullable(),
        mutation_authorized: z.boolean(), external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Plan Change intent.')
      const decision = prepareHumanPlanChangeIntent(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'job_plan_change_assess',
    {
      title: 'Assess Jobs affected by a Human-reviewed Plan change',
      description: 'Read-only LLC58 impact matrix. Distinguish KEEP, REVALIDATE, REPLACE, RETIRE and HUMAN_DECISION for durable Jobs; this tool never transitions Jobs, creates cursors or authorizes writes.',
      inputSchema: {
        project_id: z.string().uuid(),
        change_ref: z.string().min(1),
        reviewed_plan_sha: z.string().regex(/^[0-9a-f]{40}$/),
        job_snapshots: z.array(z.object({
          job_record_text: z.string().min(2),
          job_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
          decision: z.enum(['KEEP','REVALIDATE','REPLACE','RETIRE','HUMAN_DECISION']),
          reason: z.string().min(1),
          retired_task_ids: z.array(z.string().min(1)).optional(),
          cursor_state: z.enum(['ABSENT','STABLE','PENDING','UNKNOWN']).optional(),
          active_run_state: z.enum(['NONE','TERMINAL','ACTIVE','UNKNOWN']).optional(),
        })).min(1),
      },
      outputSchema: {
        allowed: z.boolean(), reason: z.string(),
        decisions: z.array(z.any()), mutation_authorized: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Plan Change assessment.')
      const assessment = assessHumanPlanChangeJobs(input)
      return { structuredContent: assessment, content: [{ type: 'text', text: JSON.stringify(assessment) }] }
    },
  )

  server.registerTool(
    'execution_cursor_prepare',
    {
      title: 'Prepare a lightweight durable NEXT Job checkpoint cursor',
      description: 'Prepare one CREATE/UPDATE of a Job-owned GitHub Memory Repo cursor only at significant checkpoints or before consequential source mutation. No storage write occurs in MCP; caller must use exact GitHub CAS and readback.',
      inputSchema: {
        project_id: z.string().uuid(), job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        memory_namespace: z.enum(['PRODUCTION','TEST_LAB']),
        work_branch: z.string().min(1),
        observed_head_sha: z.string().regex(/^[0-9a-f]{40}$/),
        event: z.enum(['INITIALIZE','BEGIN_MUTATION','COMPLETE_MUTATION','RECORD_RETRY','SAVE_CHECKPOINT','RECORD_PAUSE']),
        checkpoint_id: z.string().optional(),
        operation_id: z.string().optional(), mutation_kind: z.enum(['FILE','TREE']).optional(),
        target_path: z.string().optional(),
        previous_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable().optional(),
        intended_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        observed_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        previous_tree_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        intended_tree_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        observed_tree_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        observed_parent_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        stalled_cycles: z.number().int().min(0).optional(),
        cursor_record_text: z.string().optional(),
        cursor_record_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
      },
      outputSchema: {
        allowed: z.boolean(), reason: z.string(),
        cursor_memory_path: z.string(), operation: z.enum(['CREATE','UPDATE','NONE']),
        expected_cursor_sha: z.string().nullable(),
        cursor_record_text: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Job cursor preparation.')
      const decision = prepareExecutionCursorDecision(input)
      const path = executionCursorPath(input.project_id, input.job_id, input.memory_namespace)
      const result = {
        allowed: decision.allowed, reason: decision.reason,
        cursor_memory_path: path,
        operation: decision.operation,
        expected_cursor_sha: decision.allowed ? (input.cursor_record_sha ?? null) : null,
        cursor_record_text: decision.allowed ? JSON.stringify(decision.record, null, 2) + '\n' : null,
        external_steps: decision.allowed
          ? [
            'Authorize the exact current PROJECT.md and target Memory Repo path.',
            'Use GitHub CREATE when expected_cursor_sha=null, else UPDATE with exact current cursor blob SHA.',
            'Read back exact cursor path, bytes and blob SHA before acting on the prepared result.',
            'For BEGIN_MUTATION, persist intent before an atomic FILE or multi-file TREE commit. For COMPLETE_MUTATION, independently verify Git HEAD, parent and intended blob/tree, then persist the checkpoint.',
            'For RECORD_RETRY, only after a fresh NOT_APPLIED snapshot; persist the retry counter with exact SHA before retrying. Maximum 2 retries.',
          ] : [],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'execution_cursor_resume_evaluate',
    {
      title: 'Recover a NEXT Job from one durable cursor snapshot',
      description: 'Read-only fresh-session cursor validation and lost-response recovery; no additional Job lifecycle, no write authorization, and no background worker.',
      inputSchema: {
        project_id: z.string().uuid(), job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        work_branch: z.string().min(1),
        cursor_memory_path: z.string().min(1),
        cursor_record_text: z.string().min(2),
        cursor_record_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_head_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable().optional(),
        current_tree_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
      },
      outputSchema: {
        disposition: z.string(), reason: z.string(), source_write_authorized: z.boolean(),
        next_action: z.string().optional(), operation_id: z.string().optional(),
        last_completed_checkpoint: z.string().optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Job cursor recovery.')
      const decision = resumeExecutionCursorDecision(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'execution_recovery_evaluate',
    {
      title: 'Evaluate a lost-response source mutation from authoritative Git readback',
      description: 'Read-only advisory for ChatGPT orchestration. Compare one pending source write with independently reread Git head/blob SHAs. Does not write, authorize a retry, or infer background progress.',
      inputSchema: {
        operation_id: z.string().min(1),
        expected_head_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_head_sha: z.string().regex(/^[0-9a-f]{40}$/),
        previous_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable(),
        intended_blob_sha: z.string().regex(/^[0-9a-f]{40}$/),
        current_blob_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable(),
      },
      outputSchema: {
        disposition: z.string(), next_action: z.string(), reason: z.string(), mutation_authorized: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for recovery evaluation.')
      const decision = sourceMutationRecoveryDecision(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'orchestration_progress_evaluate',
    {
      title: 'Bound same-turn orchestration progress',
      description: 'Read-only bounded-livelock evaluator. Caller supplies a fingerprint grounded in current durable Git/Job/Run evidence. No scheduler, Job lifecycle writes or autonomous continuation.',
      inputSchema: {
        job_lifecycle: z.enum(['DRAFT','READY','IN_PROGRESS','COMPLETED','CANCELLED','SUPERSEDED']),
        run_lifecycle: z.enum(['IN_PROGRESS','COMPLETED','FAILED','CANCELLED','SUPERSEDED']).nullable(),
        previous_fingerprint: z.string().nullable(),
        current_fingerprint: z.string().min(1),
        stalled_cycles: z.number().int().min(0),
        mutation_retry_count: z.number().int().min(0),
      },
      outputSchema: { disposition: z.string(), stalled_cycles: z.number(), reason: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for progress evaluation.')
      const decision = orchestrationProgressDecision(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'browser_ui_inspect',
    {
      title: 'Inspect rendered UI in browser',
      description: 'Internal GPT capability for Designer/UI inspection. Open a public runnable web UI in Vercel Sandbox with agent-browser and return accessibility snapshot, annotated screenshots, console output and page errors. Not a user-facing command.',
      inputSchema: {
        url: z.string().url(),
        viewports: z.array(z.object({
          width: z.number().int().min(320).max(1920),
          height: z.number().int().min(480).max(1440),
          label: z.string().max(40).optional(),
        })).max(3).optional(),
        evidence: z.object({
          persist: z.boolean(),
          label: z.string().min(1).max(80).optional(),
          expires_in: z.number().int().min(60).max(604800).optional(),
          bundle: z.object({
            project_id: z.string().min(1).max(240),
            repository: z.string().min(1).max(500),
            job_id: z.string().min(1).max(240),
            checkpoint_id: z.string().min(1).max(240),
            attempt_id: z.string().min(1).max(240),
            run_id: z.string().min(1).max(240),
            target_ref: z.string().max(500).optional(),
            target_revision: z.string().regex(/^[0-9a-f]{40}$/),
            privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']).optional(),
            result: z.string().max(80).optional(),
            limitations: z.array(z.string().max(500)).max(20).optional(),
          }).optional(),
        }).optional(),
      },
      outputSchema: {
        observed: z.boolean(),
        title: z.string(),
        url: z.string(),
        snapshot: z.string(),
        console: z.string(),
        page_errors: z.string(),
        screenshot_count: z.number().int(),
        evidence: z.array(z.object({
          artifact_id: z.string().optional(),
          label: z.string(),
          storage_path: z.string(),
          signed_url: z.string().url(),
          expires_at: z.string(),
          mime_type: z.string(),
          size_bytes: z.number().int().nonnegative().optional(),
          sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })).optional(),
        evidence_bundle: z.object({
          evidence_bundle_id: z.string().regex(/^[0-9a-f]{64}$/),
          backend: z.literal('PRIVATE_SUPABASE'),
          privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']),
          binding: z.object({
            project_id: z.string().min(1),
            repository: z.string().min(1),
            job_id: z.string().min(1),
            checkpoint_id: z.string().min(1),
            attempt_id: z.string().min(1),
            run_id: z.string().min(1),
            target_ref: z.string().nullable(),
            target_revision: z.string().min(1),
          }),
          manifest_path: z.string(),
          manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/),
          viewer_url: z.string().url(),
          target_revision: z.string(),
          artifact_count: z.number().int().positive().max(12),
          size_bytes: z.number().int().positive().max(50 * 1024 * 1024),
          immutable: z.literal(true),
          manifest_readback_verified: z.literal(true),
        }).optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ url, viewports, evidence }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to inspect UI.')
      try {
        const data = await callBrowserBridge(req, { mode: 'ui_inspect', url, viewports, ...(evidence ? { evidence } : {}) })
        const screenshots = Array.isArray(data.screenshots) ? data.screenshots : []
        const summary = {
          observed: true,
          title: String(data.title ?? ''),
          url: String(data.url ?? url),
          snapshot: String(data.snapshot ?? ''),
          console: String(data.console ?? ''),
          page_errors: String(data.page_errors ?? ''),
          screenshot_count: screenshots.length,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
          evidence_bundle: data.evidence_bundle ?? undefined,
        }
        const content: any[] = [{ type: 'text', text: JSON.stringify(summary) }]
        for (const shot of screenshots) {
          if (shot?.data) {
            content.push({
              type: 'image',
              data: String(shot.data),
              mimeType: String(shot.mimeType ?? 'image/png'),
            })
          }
        }
        return { structuredContent: summary, content }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          structuredContent: {
            observed: false,
            title: '',
            url,
            snapshot: '',
            console: '',
            page_errors: message,
            screenshot_count: 0,
            evidence: [],
          },
          content: [{ type: 'text', text: 'Browser UI inspection unavailable: ' + message }],
          isError: true,
        }
      }
    },
  )

  server.registerTool(
    'browser_test_flow',
    {
      title: 'Run basic browser test flow',
      description: 'Internal GPT capability for Tester. Execute one bounded non-destructive web-app flow in a Vercel Sandbox using semantic locators/CSS, then return step evidence, final snapshot, console/page errors and an annotated screenshot. Not a user-facing command.',
      inputSchema: {
        url: z.string().url(),
        viewport: z.object({
          width: z.number().int().min(320).max(1920),
          height: z.number().int().min(480).max(1440),
          label: z.string().max(40).optional(),
        }).optional(),
        stop_on_failure: z.boolean().optional(),
        evidence: z.object({
          persist: z.boolean(),
          label: z.string().min(1).max(80).optional(),
          expires_in: z.number().int().min(60).max(604800).optional(),
          bundle: z.object({
            project_id: z.string().min(1).max(240),
            repository: z.string().min(1).max(500),
            job_id: z.string().min(1).max(240),
            checkpoint_id: z.string().min(1).max(240),
            attempt_id: z.string().min(1).max(240),
            run_id: z.string().min(1).max(240),
            target_ref: z.string().max(500).optional(),
            target_revision: z.string().regex(/^[0-9a-f]{40}$/),
            privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']).optional(),
            result: z.string().max(80).optional(),
            limitations: z.array(z.string().max(500)).max(20).optional(),
          }).optional(),
        }).optional(),
        steps: z.array(z.object({
          action: z.enum(['click', 'fill', 'check', 'hover', 'select', 'press', 'wait_text', 'assert_text']),
          by: z.enum(['css', 'text', 'label', 'placeholder', 'testid', 'role']).optional(),
          target: z.string().max(500).optional(),
          name: z.string().max(300).optional(),
          value: z.string().max(4000).optional(),
        })).max(20),
      },
      outputSchema: {
        observed: z.boolean(),
        passed: z.boolean(),
        url: z.string(),
        initial_snapshot: z.string(),
        final_snapshot: z.string(),
        console: z.string(),
        page_errors: z.string(),
        steps: z.array(z.any()),
        screenshot_count: z.number().int(),
        evidence: z.array(z.object({
          artifact_id: z.string().optional(),
          label: z.string(),
          storage_path: z.string(),
          signed_url: z.string().url(),
          expires_at: z.string(),
          mime_type: z.string(),
          size_bytes: z.number().int().nonnegative().optional(),
          sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })).optional(),
        evidence_bundle: z.object({
          evidence_bundle_id: z.string().regex(/^[0-9a-f]{64}$/),
          backend: z.literal('PRIVATE_SUPABASE'),
          privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']),
          binding: z.object({
            project_id: z.string().min(1),
            repository: z.string().min(1),
            job_id: z.string().min(1),
            checkpoint_id: z.string().min(1),
            attempt_id: z.string().min(1),
            run_id: z.string().min(1),
            target_ref: z.string().nullable(),
            target_revision: z.string().min(1),
          }),
          manifest_path: z.string(),
          manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/),
          viewer_url: z.string().url(),
          target_revision: z.string(),
          artifact_count: z.number().int().positive().max(12),
          size_bytes: z.number().int().positive().max(50 * 1024 * 1024),
          immutable: z.literal(true),
          manifest_readback_verified: z.literal(true),
        }).optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ url, viewport, stop_on_failure, evidence, steps }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to run browser testing.')
      try {
        const data = await callBrowserBridge(req, {
          mode: 'test_flow',
          url,
          viewport,
          stop_on_failure,
          steps,
          ...(evidence ? { evidence } : {}),
        })
        const summary = {
          observed: true,
          passed: Boolean(data.passed),
          url: String(data.url ?? url),
          initial_snapshot: String(data.initial_snapshot ?? ''),
          final_snapshot: String(data.final_snapshot ?? ''),
          console: String(data.console ?? ''),
          page_errors: String(data.page_errors ?? ''),
          steps: Array.isArray(data.steps) ? data.steps : [],
          screenshot_count: data.screenshot?.data ? 1 : 0,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
          evidence_bundle: data.evidence_bundle ?? undefined,
        }
        const content: any[] = [{ type: 'text', text: JSON.stringify(summary) }]
        if (data.screenshot?.data) {
          content.push({
            type: 'image',
            data: String(data.screenshot.data),
            mimeType: String(data.screenshot.mimeType ?? 'image/png'),
          })
        }
        return { structuredContent: summary, content }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          structuredContent: {
            observed: false,
            passed: false,
            url,
            initial_snapshot: '',
            final_snapshot: '',
            console: '',
            page_errors: message,
            steps: [],
            screenshot_count: 0,
            evidence: [],
          },
          content: [{ type: 'text', text: 'Browser functional testing unavailable: ' + message }],
          isError: true,
        }
      }
    },
  )


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
        'ADVISOR SIGNED: PENDING',
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
          'Before writing approved Criteria: use canonical ADVISOR SIGNED: ADVISED | BASELINE=<sha> | SCOPE=<exact scope> | ADVICE_REF=<real reference> or accept saved indented Markdown legacy receipt unchanged. Validate structure with project_criteria_advice_check and independently read back Advisor message, Human decision and canonical Criteria SHA; never invent approval.',
          'Advisor stays inactive while brainstorming or editing DRAFT. Activate ONLY on explicit Human intent to finalize first Criteria or material WHAT/WHY change; advice delivery acknowledges ADVISOR SIGNED for revision/delta scope in the SAME CRITERIA.md. Human decides; Planner only then writes/readbacks approved changes. No fake Advisor signature.',
          'Project READY itself only reads metadata and never triggers Project setup writes or Job dispatch.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'project_criteria_advice_check',
    {
      title: 'Verify scoped Advisor advice before approved Criteria write',
      description: 'C31 READ ONLY. Parse same-file canonical or saved indented Markdown legacy Advisor receipts. Derive exact baseline/scope from receipt when optional caller values are absent. Structural match is not Advisor provenance, Human approval or write authorization.',
      inputSchema: {
        project_id: z.string().uuid(),
        criteria_path: z.string().min(1),
        criteria_current_sha: z.string(),
        criteria_text: z.string(),
        intent: z.enum(['DISCUSSION','DRAFT_EDIT','PLAN_OR_TASK_CHANGE','HUMAN_KEEP_CRITERIA','INITIAL_APPROVAL','MATERIAL_CHANGE']),
        advisor_baseline_sha: z.string().optional(),
        delta_scope: z.string().optional(),
        human_decision: z.enum(['PENDING','APPROVE','KEEP']).default('PENDING'),
        delivered_advice: z.object({
          baseline_sha: z.string(),
          scope: z.string(),
          advice_ref: z.string(),
          delivered_to_human: z.boolean(),
        }).optional(),
      },
      outputSchema: {
        status: z.string(), advisor_required: z.boolean(),
        criteria_write_prepared: z.literal(false), external_advice_check_required: z.boolean(),
        receipt_format: z.string().nullable(), receipt_baseline_sha: z.string().nullable(), receipt_scope: z.string().nullable(),
        next_action: z.enum(['INVOKE_TECHNICAL_ADVISOR','VERIFY_ADVICE_DELIVERY_THEN_CONTINUE_CRITERIA_WRITE','NONE']),
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
      const dispatchAdvisor = input.intent === 'INITIAL_APPROVAL' || input.intent === 'MATERIAL_CHANGE'
        ? ['ADVISOR_RECEIPT_MISSING_STALE_OR_OUT_OF_SCOPE', 'ADVISOR_SCOPE_MISSING',
           'ADVISOR_SCOPE_MISMATCH', 'ADVISOR_BASELINE_MISMATCH',
           'ADVISOR_BASELINE_SHA_MISSING', 'ADVISOR_BASELINE_SHA_INVALID',
           'ADVISOR_DELIVERY_EVIDENCE_INVALID'].includes(check.status)
        : false
      const out = { ...check,
        next_action: dispatchAdvisor ? 'INVOKE_TECHNICAL_ADVISOR' :
          check.status === 'SCOPED_ADVICE_REQUIRES_INDEPENDENT_READBACK'
            ? 'VERIFY_ADVICE_DELIVERY_THEN_CONTINUE_CRITERIA_WRITE' : 'NONE',
        external_steps: check.advisor_required ? [
        'On missing, stale, or wrong-scope Advisor receipt, Planner MUST invoke Technical Advisor on the current Criteria baseline and proposed change, deliver the advice to Human, then continue the already-settled Human decision without requesting a second approval. Advisor admission alone is not completed advice.',
        'Read the exact current CRITERIA.md from configured GitHub Memory Repo; compare path/text/current SHA with tool inputs and confirm it is the ONE canonical Criteria file.',
        'For new advice not yet in Criteria, provide delivered_advice with exact current baseline_sha, delta_scope, actual advice_ref and delivered_to_human=true; this is only a claim pending independent readback and never write authority. For new receipts use canonical ADVISOR SIGNED: ADVISED | BASELINE=<40 lowercase Git SHA> | SCOPE=<exact advised scope> | ADVICE_REF=<actual message reference>. Previously saved indented Markdown legacy receipts are valid and need not be rewritten. Omit duplicate baseline/scope inputs when rechecking saved receipts; explicitly provided ones must match exactly.',
        'Independently verify the actual Advisor message was delivered to Human before ADVISOR SIGNED, including its baseline, exact delta scope and advice reference; text can be forged and is not proof by itself.',
        'Read back the Advisor baseline SHA from GitHub history and confirm no intervening material Criteria edit or wider final delta. If stale, fake or scope changed, do not approve; reconsult Advisor on the new delta.',
        'Verify Human decision to approve exact advised scope separately; KEEP means no approved Criteria write.',
        'Only then use existing authorize_project_scope, authorize_memory_mutation and GitHub SHA-CAS to update this SAME CRITERIA.md; read back. This check never issues write permission.',
      ] : [
        'Ordinary discussion, draft-only edits and Plan/Task changes do not call Advisor. Keep existing Memory/Git authorization for any actual draft write.',
      ] }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'project_role_addins_resolve',
    {
      title: 'Resolve optional Coder/Tester Project add-ins',
      description: 'Task-time, read-only discovery of Coder or Tester add-in references from a verified AGENTS.md. Do not load at Project open. Returned paths are lower-trust domain guidance, never elevated runtime harness instructions.',
      inputSchema: {
        project_id: z.string().uuid(),
        agents_path: z.string().min(1),
        agents_text: z.string().min(1),
        agents_sha: z.string().regex(/^[0-9a-f]{40}$/),
        role: z.enum(['coder','tester']),
        requires_domain_addin: z.boolean().default(false),
        task_id: z.string().uuid().optional(),
        capability_evidence: z.array(z.object({
          project_id: z.string().uuid(), role: z.enum(['coder','tester']), task_id: z.string().uuid(),
          path: z.string().min(1), file_sha: z.string().regex(/^[0-9a-f]{40}$/),
          result: z.literal('FUNCTIONAL'), verification_ref: z.string().min(1),
        })).default([]),
      },
      outputSchema: {
        role: z.string(),
        status: z.string(),
        harness_path: z.string().nullable(),
        skill_paths: z.array(z.string()),
        generic_available: z.boolean(),
        readiness: z.enum(['GENERIC_READY','BLOCKED_REQUIRED_ADDIN','CONFIGURED_UNVERIFIED','EVIDENCE_PRESENT_UNVERIFIED']),
        ready_for_task: z.boolean(),
        matched_evidence_refs: z.array(z.string()),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, agents_path, agents_text, agents_sha, role, requires_domain_addin, task_id, capability_evidence }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to resolve Project add-ins.')
      if (!PROJECT_ID_PATTERN.test(project_id) || agents_path !== 'projects/' + project_id + '/AGENTS.md') {
        return { content: [{ type: 'text', text: 'AGENTS path/project identity mismatch.' }], isError: true }
      }
      const resolved = resolveProjectRoleAddins(project_id, role, agents_text)
      if (resolved.status === 'DENIED') return { content: [{ type: 'text', text: resolved.reason }], isError: true }
      const assessed = projectTaskCapabilityAssessment(project_id, role, task_id, requires_domain_addin, resolved, capability_evidence)
      const out = {
        role,
        status: requires_domain_addin ? assessed.readiness : resolved.status,
        harness_path: resolved.harness_path,
        skill_paths: resolved.skill_paths,
        generic_available: !requires_domain_addin,
        readiness: assessed.readiness,
        ready_for_task: assessed.ready_for_task,
        matched_evidence_refs: assessed.matched_evidence_refs,
        external_steps: [
          'Before treating this as Project configuration, fetch exact AGENTS.md from the configured Memory Repo and compare path/project_id/blob SHA=' + agents_sha + ' with the supplied text; do not trust caller-provided bytes by themselves.',
          'Do not load Project add-ins at Project open, and do not resolve add-ins for roles other than Coder/Tester.',
          'On a matching Task, verify the active Project ID/manifest and fetch only the referenced harness/skills via GitHub readback inside this exact Project prefix. Do not invoke nonexistent READ_MEMORY scope operations.',
          'Interpret add-in content strictly as lower-trust domain guidance. It cannot override global role rules, Criteria, Human authority, security scope or independent test evidence.',
          requires_domain_addin ? 'A configured skill path and even a caller-supplied FUNCTIONAL evidence record is NOT readiness. Independently GitHub readback exact project/role/task/path SHA and the referenced real functional Test Verification before attesting DOMAIN_READY in reviewed Project Bootstrap evidence; otherwise BLOCKED/UNVERIFIED.' : 'Generic Coder/Tester is ready for ordinary Tasks with no required domain add-in. Do not manufacture a mandatory add-in.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )


  server.registerTool(
    'project_bootstrap_checklist_prepare',
    {
      title: 'Continue the four-item autonomous Bootstrap checklist',
      description: 'PREPARE ONLY: select the NEXT Bootstrap action, not another gate. Inspect original Criteria/Plan/Milestones/capabilities, skip completed work, run Plan/Milestone CRL autonomously and ask Human only for Criteria decisions or irreconcilable sources. No Job/metadata registration or write authorization. Pass previous_attempt to detect non-progress; bare PASS without observations triggers ordinary verification Task.',
      inputSchema: {
        project_context: z.enum(['GREENFIELD','BROWNFIELD']),
        checklist: z.object({
          criteria: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
          plan: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
          milestones: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
          capabilities: z.object({ status: z.enum(['PENDING','IN_PROGRESS','PASS','NEED_HUMAN']), observation: z.string().optional() }).optional(),
        }).default({}),
        criteria_intake: z.object({
          existing_approved: z.boolean().optional(),
          human_update_choice: z.enum(['NOT_ASKED','KEEP','UPDATE','NOT_APPLICABLE']).optional(),
          revision_completed: z.boolean().optional(),
        }).optional(),
        previous_attempt: z.object({ action: z.string(), signature: z.string() }).optional(),
        conflicts: z.array(z.object({
          item: z.enum(['criteria','plan','milestones','capabilities']),
          candidates: z.array(z.string()).min(2),
          unresolved: z.boolean(),
          investigated: z.boolean(),
          question: z.string().optional(),
        })).default([]),
      },
      outputSchema: {
        checklist: z.array(z.any()), completed: z.number(), total: z.number(),
        status: z.string(), next_item: z.string().nullable(), next_action: z.string(),
        next_owner: z.string(), instruction: z.string(), human_question: z.string().nullable(),
        continue_same_turn: z.boolean(), progress_signature: z.string(), assessment_only: z.literal(true),
        source_write_authorized: z.literal(false), requires_external_readback: z.literal(true),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (input: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Bootstrap checklist.')
      const decision = projectBootstrapChecklistDecision(input)
      return { structuredContent: decision, content: [{ type: 'text', text: JSON.stringify(decision) }] }
    },
  )

  server.registerTool(
    'project_bootstrap_readiness_prepare',
    {
      title: 'Evaluate Project Bootstrap prerequisites without authorizing code',
      description: 'C30 PREPARE ONLY: assess four project-readiness conditions from existing documents: approved Criteria, reviewed aligned Plan, aligned Milestones, and Coder/Tester skills plus knowledge. No duplicate registration or Project Plan Job required. Independently verify evidence; never authorizes source writes.',
      inputSchema: {
        project_id: z.string().uuid(),
        criteria: CRITERIA_BINDING_SCHEMA.optional(),
        criteria_human_approved: z.boolean().default(false),
        criteria_current_blob_sha: z.string().optional(),
        plan: z.any().optional(),
        // Minimal four-part assessment; existing legacy Plan-shaped input remains supported.
        assessment: z.object({
          criteria: z.string(), plan: z.string(), milestones: z.string(),
          coder: z.string(), tester: z.string(),
        }).optional(),
        capabilities: z.array(z.any()).default([]),
        human_execution_approved: z.boolean().default(false),
      },
      outputSchema: {
        status: z.string(), detail: z.string(), bootstrapped: z.literal(false),
        source_write_authorized: z.literal(false), requires_external_readback: z.literal(true),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, criteria, criteria_human_approved, criteria_current_blob_sha, plan, assessment, capabilities, human_execution_approved }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required for Project Bootstrap readiness.')
      const prepared = projectBootstrapReadinessDecision(project_id, {
        criteria, criteria_human_approved, criteria_current_blob_sha, plan, assessment, capabilities, human_execution_approved,
      })
      const out = { ...prepared, external_steps: [
        'Read existing Criteria from source repository or Project Memory. If already Human-approved, reuse without duplication or Advisor. Draft/approve only when missing or inadequate.',
        'Independently review the existing or new Plan against Criteria. Do not demand a duplicate PROJECT_PLAN Job, SHA binding or topology registration solely for Bootstrap.',
        'Check that existing Milestones align with the reviewed Plan and form an actionable implementation sequence.',
        'Assess relevant Coder and Tester skills, knowledge and usable tools for the next work. An unfinished feature of the product is not a missing implementer skill; missing genuine capability remains NOT READY.',
        'Only after actual prerequisites can an authorized GSA consequential dispatch/write apply M5 guard and separately verify Human execution approval; this tool never permits code.',
        'After the four checks reach READY, proceed to normal planned work with existing Human execution approval and source-scope safeguards. Do not repeat Bootstrap per Task.',
      ] }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'project_branch_policy_prepare',
    {
      title: 'Prepare Human-approved Project Development Branch configuration',
      description: 'Admin function. PREPARE ONLY: update one OWNED repository branch policy in PROJECT.md. Callers must verify live Git branches, authorize Memory scope, write with exact SHA and read back. No GitHub branch is selected by default.',
      inputSchema: {
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().regex(/^[0-9a-f]{40}$/),
        repository_url: z.string().url(),
        development_branch: z.string().min(1),
        release_branch: z.string().nullable().optional(),
        human_confirmed: z.literal(true),
      },
      outputSchema: {
        memory_path: z.string(),
        expected_sha: z.string(),
        repository_url: z.string(),
        development_branch: z.string(),
        release_branch: z.string().nullable(),
        updated_manifest_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ memory_path, project_manifest_text, project_manifest_sha, repository_url, development_branch, release_branch, human_confirmed }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare branch policy.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed || !validProjectManifestPath(memory_path, parsed.project_id) || !human_confirmed)
        return { content: [{ type: 'text', text: 'Invalid Project identity/path or missing Human confirmation.' }], isError: true }
      const repo = normalizeGithubRepo(repository_url)
      const owned = parsed.repositories.find((r: any) => r.url.toLowerCase() === repo?.url.toLowerCase() && r.relation === 'OWNED')
      if (!repo || !owned || !validIntegrationBranch(development_branch) || (release_branch && !validIntegrationBranch(release_branch)))
        return { content: [{ type: 'text', text: 'Branch policy must target an OWNED repository with valid Git ref names.' }], isError: true }
      if (isRetiredSourceBranch(parsed.retired_branches, repo.url, development_branch) ||
          isRetiredSourceBranch(parsed.retired_branches, repo.url, release_branch))
        return { content: [{ type: 'text', text: 'BRANCH_RETIRED: a retired source branch cannot be selected as Development or Release Branch.' }], isError: true }
      const policies = parsed.branch_policies.map((p: any) => p.repository_url.toLowerCase() === repo.url.toLowerCase()
        ? { ...p, development_branch, release_branch: release_branch ?? null } : p)
      const header = project_manifest_text.split('\n')
      const frontEnd = header.indexOf('---', 1)
      if (frontEnd < 0) return { content: [{ type: 'text', text: 'Malformed Project front matter.' }], isError: true }
      // Keep one canonical branch mapping section; root fields are PRIMARY convenience only.
      let next = project_manifest_text.replace(/\n## Branch Policy[^\n]*\n[\s\S]*?(?=\n## |$)/, '')
      const primary = policies.find((p: any) => p.repository_url.toLowerCase() === parsed.primary_repo_url.toLowerCase())
      const lines = next.split('\n').filter((line: string) => !/^(development_branch|release_branch|integration_target|branch_policy_owner):/.test(line))
      const yamlEnd = lines.indexOf('---', 1)
      if (yamlEnd < 0) return { content: [{ type: 'text', text: 'Malformed Project front matter.' }], isError: true }
      lines.splice(yamlEnd, 0,
        'development_branch: ' + (primary?.development_branch ?? ''),
        'release_branch: ' + (primary?.release_branch ?? ''),
        'integration_target: ' + (primary?.development_branch ?? ''),
        'branch_policy_owner: HUMAN_CONFIRMED')
      next = lines.join('\n').trimEnd() +
        '\n\n## Branch Policy (Human-approved)\n' +
        policies.map((p: any) => {
          const entry = parsed.repositories.find((r: any) => r.url.toLowerCase() === p.repository_url.toLowerCase())
          if (!entry) throw new Error('Branch policy references an unregistered repository.')
          return '- ' + entry.role + ' | ' + p.repository_url + ' | development=' + (p.development_branch ?? '') +
            ' | release=' + (p.release_branch ?? '')
        }).join('\n') + '\n'
      const out = {
        memory_path, expected_sha: project_manifest_sha,
        repository_url: repo.url, development_branch, release_branch: release_branch ?? null,
        updated_manifest_text: next,
        external_steps: [
          'Verify this PROJECT.md was freshly fetched from the configured Memory Repo and SHA matches expected_sha; an input manifest/SHA is not trustworthy without GitHub readback.',
          'Verify the selected source repository belongs to this Project and both nonempty configured Git branches exist on live GitHub; never infer default/main.',
          'Verify Human actually approved this exact repo+branch change, not merely caller-supplied human_confirmed; reconcile affected active Jobs before switching integration target.',
          'Call authorize_project_scope(MUTATE_MEMORY) and authorize_memory_mutation(update) for this exact Project path.',
          'GitHub Memory Repo: update_file with expected_sha (CAS), then independently fetch/readback and compare exact selected branch policy.',
          'Never merge, deploy or write source merely because this configuration was prepared.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'project_open',
    {
      title: 'Open a GSA Project',
      description: 'Validate an exact PROJECT.md fetched from the configured Memory Repo.',
      inputSchema: {
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().min(7),
      },
      outputSchema: {
        project_id: z.string(),
        handle: z.string(),
        name: z.string(),
        lifecycle: z.string(),
        source_repository_url: z.string(),
        repository_mode: z.string(),
        repo_registry_status: z.string(),
        registered_repositories: z.array(z.object({ role: z.string(), relation: z.string(), url: z.string() })),
        branch_policy_status: z.string(),
        development_branch: z.string().nullable(),
        release_branch: z.string().nullable(),
        branch_policies: z.array(z.object({
          repository_url: z.string(), development_branch: z.string().nullable(),
          release_branch: z.string().nullable(), status: z.string(),
        })),
        memory_path: z.string(),
        project_manifest_sha: z.string(),
        openable: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ memory_path, project_manifest_text, project_manifest_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to open a Project.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed || !validProjectManifestPath(memory_path, parsed.project_id)) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      const result = {
        project_id: parsed.project_id,
        handle: projectHandle(parsed.project_id),
        name: parsed.name,
        lifecycle: parsed.lifecycle,
        source_repository_url: parsed.primary_repo_url,
        repository_mode: parsed.repo_mode,
        repo_registry_status: parsed.repo_registry_status,
        registered_repositories: parsed.repositories,
        development_branch: parsed.development_branch,
        release_branch: parsed.release_branch,
        branch_policy_status: parsed.branch_policy_status,
        branch_policies: parsed.branch_policies,
        memory_path,
        project_manifest_sha,
        openable: parsed.lifecycle !== 'ARCHIVED',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_status',
    {
      title: 'Show GSA Project status',
      description: 'Parse current PROJECT.md from Memory Repo.',
      inputSchema: { project_manifest_text: z.string().min(1), project_manifest_sha: z.string().min(7) },
      outputSchema: {
        project_id: z.string(),
        handle: z.string(),
        name: z.string(),
        lifecycle: z.string(),
        source_repository_url: z.string(),
        repository_mode: z.string(),
        repo_registry_status: z.string(),
        registered_repositories: z.array(z.object({ role: z.string(), relation: z.string(), url: z.string() })),
        branch_policy_status: z.string(),
        development_branch: z.string().nullable(),
        release_branch: z.string().nullable(),
        branch_policies: z.array(z.object({
          repository_url: z.string(), development_branch: z.string().nullable(),
          release_branch: z.string().nullable(), status: z.string(),
        })),
        project_manifest_sha: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ project_manifest_text, project_manifest_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to show Project status.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      const result = {
        project_id: parsed.project_id,
        handle: projectHandle(parsed.project_id),
        name: parsed.name,
        lifecycle: parsed.lifecycle,
        source_repository_url: parsed.primary_repo_url,
        repository_mode: parsed.repo_mode,
        repo_registry_status: parsed.repo_registry_status,
        registered_repositories: parsed.repositories,
        development_branch: parsed.development_branch,
        release_branch: parsed.release_branch,
        branch_policy_status: parsed.branch_policy_status,
        branch_policies: parsed.branch_policies,
        project_manifest_sha,
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  const transitionTool = (
    toolName: string,
    title: string,
    target: 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
    allowedFrom: string[],
  ) => {
    server.registerTool(
      toolName,
      {
        title,
        description: 'Return exact PROJECT.md replacement and require GitHub update_file with the current blob SHA.',
        inputSchema: {
          memory_path: z.string().min(1),
          project_manifest_text: z.string().min(1),
          project_manifest_sha: z.string().min(7),
        },
        outputSchema: {
          from: z.string(),
          to: z.string(),
          memory_path: z.string(),
          expected_sha: z.string(),
          updated_manifest_text: z.string(),
          external_steps: z.array(z.string()),
        },
        securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
        _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      } as any,
      async ({ memory_path, project_manifest_text, project_manifest_sha }: any) => {
        const auth = await authContext(req)
        if (!auth) return authError(req, 'Authentication required to change Project lifecycle.')
        const parsed = parseProjectManifest(project_manifest_text)
        if (!parsed || !validProjectManifestPath(memory_path, parsed.project_id)) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
        if (!allowedFrom.includes(parsed.lifecycle)) {
          return { content: [{ type: 'text', text: 'Lifecycle transition blocked from ' + parsed.lifecycle + ' to ' + target + '.' }], isError: true }
        }
        const tr = transitionProjectManifest(project_manifest_text, target)!
        const result = {
          from: parsed.lifecycle,
          to: target,
          memory_path,
          expected_sha: project_manifest_sha,
          updated_manifest_text: tr.next,
          external_steps: [
            'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=memory_path). Continue only on ALLOW.',
            'GitHub Memory Repo: update_file at memory_path using expected_sha exactly. A stale SHA failure must cause refetch/reconcile, never force overwrite.',
            'Fetch memory_path back and verify lifecycle=' + target + '.',
          ],
        }
        return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
      },
    )
  }

  transitionTool('project_pause', 'Pause a GSA Project', 'PAUSED', ['ACTIVE'])
  transitionTool('project_resume', 'Resume a GSA Project', 'ACTIVE', ['PAUSED'])
  transitionTool('project_archive', 'Archive a GSA Project', 'ARCHIVED', ['ACTIVE','PAUSED'])

  server.registerTool(
    'project_delete',
    {
      title: 'Delete GSA Project Memory',
      description: 'Delete all files under one projects/<project-id>/ prefix after explicit Human Gate. Source repo is never deleted.',
      inputSchema: {
        project_id: z.string().uuid(),
        confirmed: z.boolean(),
      },
      outputSchema: {
        allowed: z.boolean(),
        project_prefix: z.string(),
        reason: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, confirmed }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to delete Project Memory.')
      const prefix = 'projects/' + project_id + '/'
      if (!confirmed) {
        const result = {
          allowed: false,
          project_prefix: prefix,
          reason: 'Explicit human confirmation is required. Source repository will not be deleted.',
          external_steps: ['Show exact Project identity and source repository, then ask for explicit confirmation.'],
        }
        return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
      }
      const result = {
        allowed: true,
        project_prefix: prefix,
        reason: 'Human confirmed Project Memory deletion only.',
        external_steps: [
          'GitHub Memory Repo: enumerate every file under project_prefix.',
          'For each file, call authorize_memory_mutation(operation=delete, repository_full_name=configured Memory Repo, path=file path, human_gate_approved=true).',
          'Fetch current blob SHA immediately before each delete_file call.',
          'Delete each exact file path with its current SHA. Never delete outside project_prefix.',
          'Verify no files remain under project_prefix.',
          'Do not mutate or delete the source repository.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_agent_harness',
    {
      title: 'Load a GSA role harness',
      description: 'Load shared GSA operating rules plus one role contract. Then load only the returned suggested skills that are relevant to the current Run.',
      inputSchema: {
        role: z.enum(['orchestrator','planner','advisor','designer','coder','reviewer','critic_reviewer','tester']),
        mode: z.enum(['JOB','DIRECT_AGENT']).default('JOB'),
      },
      outputSchema: {
        role: z.string(),
        mode: z.string(),
        harness_text: z.string(),
        canonical_refs: z.array(z.string()),
        suggested_skills: z.array(z.string()),
        suggested_host_skills: z.array(z.string()),
        context_policy: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ role, mode }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to load a role harness.')
      const harness = renderHarness(role)
      if (!harness) return { content: [{ type: 'text', text: 'Unknown role harness.' }], isError: true }
      const result = {
        role,
        mode,
        harness_text: harness,
        canonical_refs: ROLE_HARNESSES[role].canonical_refs,
        suggested_skills: ROLE_SKILLS[role] ?? [],
        suggested_host_skills: ROLE_HOST_SKILLS[role] ?? [],
        context_policy: role === 'critic_reviewer'
          ? 'STATELESS_REVIEW_HUMAN_ONLY; ignore conversation history as evidence, reconstruct from durable records and live source only, and compare prior Reviewer verdict last.'
          : role === 'reviewer'
            ? 'ROLE_ISOLATED_EVIDENCE; review exact requirements + target/revision + source/durable evidence independently within current chat if needed; do not require a fresh Human chat.'
            : 'MINIMUM_SUFFICIENT_CONTEXT; load skill bodies progressively and prefer durable references plus selective live-source reads.',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_skill_catalog',
    {
      title: 'List GSA runtime skills',
      description: 'Return only skill names and descriptions for progressive disclosure. Load a full body with load_skill only when it is relevant.',
      inputSchema: {},
      outputSchema: {
        skills: z.array(z.object({ name: z.string(), description: z.string() })),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to list runtime skills.')
      const skills = Object.entries(RUNTIME_SKILLS).map(([name, skill]) => ({ name, description: skill.description }))
      return { structuredContent: { skills }, content: [{ type: 'text', text: JSON.stringify({ skills }) }] }
    },
  )

  server.registerTool(
    'load_skill',
    {
      title: 'Load one GSA runtime skill',
      description: 'Progressively load a task-specific GSA skill after its catalog entry or role suggestion is relevant.',
      inputSchema: {
        name: z.enum(['job-planning','coding-loop','debugging','delegation','planning-review','review-evidence','critic-review','testing-evidence','tester-lab','ui-coder-frontend','critical-challenge']),
      },
      outputSchema: {
        name: z.string(),
        description: z.string(),
        skill_text: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ name }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to load a runtime skill.')
      const skill = RUNTIME_SKILLS[name]
      if (!skill) return { content: [{ type: 'text', text: 'Unknown runtime skill.' }], isError: true }
      const result = { name, description: skill.description, skill_text: skill.body }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

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
    async ({ project_id, type, objective, scope, non_goals, execution_contract, plan_kind, criteria_binding, integration_branch, work_context, phase, milestone, relationship_scan_summary, job_sizing, brownfield_logic_review, relationship_assessment, repository_structure_evidence, selected_source_evidence, project_repository_mode, registered_repositories, working_repository_url, cross_repo_impact, product_workflow, temporary_ui, collected_ui_requirements, ui_update_pack_trigger, temporary_ui_human_approval, tasks, evidence_needs, test_checkpoints, evidence_requirements, milestones, planning_topology, completion_requirements, verification_requirements, review_triggers, replacement_context }: any) => {
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
      const jobId = replacement?.item?.replacement?.job_id ?? uuidv7()
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
          tasks: (current.tasks ?? []).map((task: any) => {
            const retire = target_lifecycle === 'RETIRED' || (planSupersession.action.retired_task_ids ?? []).includes(task.task_id)
            return retire && !['COMPLETED','CANCELLED','SUPERSEDED','RETIRED'].includes(task.lifecycle)
              ? { ...task, lifecycle: 'RETIRED', retired_by_plan_change_id: JSON.parse(plan_change_context.intent_record_text).change_id,
                  retired_reason: planSupersession.action.reason }
              : task
          }),
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
          'After terminal transition, read back lifecycle and Plan Change lineage; RETIRED must have a reason and no successor.',
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

  server.registerTool(
    'start_critic_review',
    {
      title: 'Start authorized Critic Reviewer',
      description: 'Independent CR after direct Human request OR Human-approved milestone crl after exact Reviewer PASS. Never trigger CR without either scope-bound authority.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        human_invoked: z.boolean().default(false),
        approved_milestone_id: z.string().optional(),
        milestone_reviewer_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
        prior_review_verification_ref: z.string().optional(),
      },
      outputSchema: {
        role: z.string(),
        allowed: z.boolean(),
        status: z.string(),
        context_policy: z.string(),
        project_id: z.string(),
        job_id: z.string(),
        planning_revision: z.number().nullable(),
        target_ref: z.string().nullable(),
        target_revision: z.string().nullable(),
        prior_review_verification_ref: z.string().nullable(),
        durable_inputs_only: z.boolean(),
        authorization_source: z.enum(['HUMAN_COMMAND','APPROVED_MILESTONE']),
        next_step: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, human_invoked, approved_milestone_id, milestone_reviewer_snapshot, target_ref, target_revision, prior_review_verification_ref }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to start Critic Reviewer.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      if (!jobExecutionContract(current)) return invalidExecutionContract()
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Critic review target does not match the supplied Job.' }], isError: true }
      }
      const milestoneError = human_invoked === true ? null :
        milestoneCrlEvidenceError(current, approved_milestone_id ?? null, milestone_reviewer_snapshot, target_revision)
      if (milestoneError) return { content: [{ type: 'text', text: milestoneError }], isError: true }
      const result = {
        role: 'critic_reviewer',
        allowed: true,
        status: human_invoked === true ? 'READY_FOR_STATELESS_REVIEW' : 'PENDING_MILESTONE_EVIDENCE_READBACK',
        context_policy: 'Same-chat invocation is explicitly allowed. Ignore all conversation history, including Planner/Reviewer reasoning visible in this chat, as review evidence. Reconstruct the target only from persisted Project/Job/Verification records plus live source truth. Form the independent verdict before reading prior Reviewer verdict.',
        project_id,
        job_id,
        planning_revision: current.planning_revision ?? null,
        target_ref: target_ref ?? current.repository_context?.working_repository_url ?? null,
        target_revision: target_revision ?? null,
        prior_review_verification_ref: prior_review_verification_ref ?? current.planning_review?.verification_ref ?? null,
        durable_inputs_only: true,
        authorization_source: human_invoked === true ? 'HUMAN_COMMAND' : 'APPROVED_MILESTONE',
        next_step: human_invoked === true
          ? 'Proceed with independent CR on the Human target; read durable evidence before verdict and compare prior Reviewer only afterwards.'
          : 'BEFORE CR: re-fetch current approved Job blob and confirm matching SHA/planning revision plus Human milestone crl authorization, re-fetch the supplied Reviewer PASS Verification by exact path/SHA and compare all matching fields. A supplied JSON snapshot alone does not authorize CR. Then execute independent CR and record its APPROVED_MILESTONE source, not human_invoked.',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'critic_review_record',
    {
      title: 'Record independent Critic Reviewer Verification',
      description: 'Persist CRITIC_REVIEW evidence only. Does not modify Job lifecycle or source.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        planning_revision: z.number().int().positive().optional(),
        human_invoked: z.boolean().default(false),
        approved_milestone_id: z.string().optional(),
        milestone_reviewer_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        result: z.enum(['PASS','PASS_WITH_FINDINGS','FAIL','BLOCKED']),
        findings: z.array(z.object({
          severity: z.enum(['CRITICAL','IMPORTANT','MINOR']),
          finding: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          suggested_followup: z.string().optional(),
        })).default([]),
        limitations: z.array(z.string()).default([]),
        prior_review_verification_ref: z.string().optional(),
        prior_review_comparison: z.object({
          compared_after_independent_verdict: z.literal(true),
          agreement: z.enum(['AGREE','PARTIAL_DISAGREEMENT','DISAGREE','NO_PRIOR_REVIEW']),
          notes: z.array(z.string()).default([]),
        }),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        job_mutated: z.boolean(),
        next_role: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, planning_revision, human_invoked, approved_milestone_id, milestone_reviewer_snapshot, result, findings, limitations, prior_review_verification_ref, prior_review_comparison, target_ref, target_revision }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to record Critic Review.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(current)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(current)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'CRITIC_REVIEW_REJECTED: NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      const milestoneError = human_invoked === true ? null : milestoneCrlEvidenceError(current, approved_milestone_id ?? null, milestone_reviewer_snapshot, target_revision)
      if (milestoneError) return { content: [{ type: 'text', text: milestoneError }], isError: true }
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Critic review target does not match the supplied Job.' }], isError: true }
      }
      if (planning_revision != null && current.planning_revision !== planning_revision) {
        return { content: [{ type: 'text', text: 'Critic review planning revision does not match the supplied Job snapshot.' }], isError: true }
      }
      if (result === 'PASS' && (findings ?? []).length > 0) {
        return { content: [{ type: 'text', text: 'Use PASS_WITH_FINDINGS when CR has findings.' }], isError: true }
      }
      if (result === 'PASS_WITH_FINDINGS' &&
          (!(findings ?? []).length || (findings ?? []).some((f: any) => ['CRITICAL','IMPORTANT'].includes(f.severity)))) {
        return { content: [{ type: 'text', text: 'CRITIC_REVIEW_FINDINGS_BLOCKING: important/critical CR findings require FAIL, and PASS_WITH_FINDINGS requires nonblocking findings.' }], isError: true }
      }
      const verificationId = uuidv7()
      const memoryPath = verificationPath(project_id, verificationId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const verification = {
        verification_id: verificationId,
        kind: 'CRITIC_REVIEW',
        project_id,
        job_id,
        planning_revision: planning_revision ?? current.planning_revision ?? null,
        producer: 'critic_reviewer',
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { memory_namespace: nextMemoryNamespace } : {}),
        human_invoked: human_invoked === true,
        authorization_source: human_invoked === true ? 'HUMAN_COMMAND' : 'APPROVED_MILESTONE',
        approved_milestone_id: human_invoked === true ? null : approved_milestone_id,
        milestone_reviewer_snapshot_ref: human_invoked === true ? null : milestone_reviewer_snapshot?.path,
        target_ref: target_ref ?? current.repository_context?.working_repository_url ?? null,
        target_revision: target_revision ?? null,
        result,
        findings: findings ?? [],
        limitations: limitations ?? [],
        prior_review_verification_ref: prior_review_verification_ref ?? current.planning_review?.verification_ref ?? null,
        prior_review_comparison,
        job_lifecycle_at_review: current.lifecycle,
        created_at: new Date().toISOString(),
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: memoryPath,
        verification_record_text: prettyJson(verification),
        job_mutated: false,
        next_role: human_invoked === true ? 'human' : 'orchestrator',
        external_steps: [
          ...(human_invoked === true ? [] : ['Re-fetch the exact current Job SHA from GitHub Memory Repo and confirm Human-approved milestone crl, then independently fetch the matching Reviewer PASS snapshot path/SHA before recording CR. Supplied snapshot JSON is not evidence by itself.']),
          'Persist verification_record_text at verification_memory_path after authorize_memory_mutation(create).',
          'Do not update the Job record or lifecycle from CR output.',
          ...(human_invoked === true
            ? ['Present the independent CR verdict to Human. Direct cr remains a one-shot review.']
            : [
                'After immutable CR Verification persistence and exact readback, re-fetch current Job and call milestone_loop_evaluate(stage=CR, verdict=' + (result === 'PASS_WITH_FINDINGS' ? 'PASS' : result) + ') on the approved milestone. PASS_WITH_FINDINGS is accepted only with nonblocking MINOR findings.',
                'Follow returned continuation in the SAME turn: CR FAIL -> correct Planner/Coder owner repairs -> fresh Reviewer PASS at exact source revision -> independent CR again. CR PASS advances only when authorized; BLOCKED/no progress stops. Never reuse old Reviewer PASS.',
              ]),
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'checkpoint_claim_prepare',
    {
      title: 'Prepare NEXT Tester checkpoint claim',
      description: 'NEXT-only deterministic checkpoint claim/lease preparation. The claim path is keyed by project/job/planning_revision/checkpoint_id and is the sole serialization point for the live lease token.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1),
        claimant_run_id: z.string().uuid(),
        claimant_run_record_text: z.string().min(2),
        claimant_run_record_sha: z.string().min(7),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        attempt_kind: z.enum(['TEST','RETEST']).default('TEST'),
        retest_of_verification_id: z.string().min(1).optional(),
        repair_goal_recheck_record_text: z.string().min(2).optional(),
        repair_goal_recheck_verification_ref: z.string().min(1).optional(),
        completed_task_run_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        prerequisite_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        prerequisite_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        lease_seconds: z.number().int().min(60).max(3600).default(900),
        current_claim_record_text: z.string().min(2).optional(),
        current_claim_record_sha: z.string().min(7).optional(),
      },
      outputSchema: {
        disposition: z.enum(['CLAIM','REUSE','ALREADY_SATISFIED']),
        claim_memory_path: z.string(),
        claim_operation: z.enum(['CREATE','UPDATE','NONE']),
        expected_claim_sha: z.string().nullable(),
        claim_record_text: z.string().nullable(),
        attempt_memory_path: z.string().nullable(),
        attempt_record_text: z.string().nullable(),
        attempt_id: z.string().nullable(),
        lease_token: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, checkpoint_id, claimant_run_id, claimant_run_record_text, claimant_run_record_sha, target_ref, target_revision, attempt_kind, retest_of_verification_id, repair_goal_recheck_record_text, repair_goal_recheck_verification_ref, completed_task_run_snapshots, prerequisite_claim_snapshots, prerequisite_verification_snapshots, lease_seconds, current_claim_record_text, current_claim_record_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to claim a NEXT checkpoint.')
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      if (job.project_id !== project_id || job.job_id !== job_id || jobExecutionContract(job) !== 'NEXT') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: owning Job must be the current NEXT Job.' }], isError: true }
      }
      const nextMemoryNamespace = recordNextMemoryNamespace(job)
      if (!nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: owning NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      let claimantRun: any
      try { claimantRun = JSON.parse(claimant_run_record_text) } catch {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: invalid claimant Tester Run JSON.' }], isError: true }
      }
      const claimantContract = resolveExecutionContract(claimantRun.execution_contract)
      if (
        claimantContract !== 'NEXT' ||
        claimantRun.project_id !== project_id ||
        claimantRun.job_id !== job_id ||
        claimantRun.run_id !== claimant_run_id ||
        claimantRun.role !== 'tester' ||
        claimantRun.lifecycle !== 'IN_PROGRESS' ||
        claimantRun.planning_revision !== job.planning_revision ||
        recordNextMemoryNamespace(claimantRun) !== nextMemoryNamespace ||
        (claimantRun.target_ref && claimantRun.target_ref !== target_ref) ||
        (claimantRun.target_revision && claimantRun.target_revision !== target_revision)
      ) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: claimant must be the current IN_PROGRESS NEXT Tester Run for this exact target.' }], isError: true }
      }
      if (!['READY','IN_PROGRESS'].includes(job.lifecycle)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: owning NEXT Job is not executable.' }], isError: true }
      }
      if (job.planning_review?.status !== 'PASS' || job.planning_review?.reviewed_revision !== job.planning_revision) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current NEXT planning revision is not Reviewer PASS.' }], isError: true }
      }
      const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpoint_id && item.planning_revision === job.planning_revision)
      if (!checkpoint) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: checkpoint is not part of the current planning revision.' }], isError: true }
      }
      const prerequisiteClaims = parseDurableSnapshots(prerequisite_claim_snapshots ?? [], 'prerequisite_claim_snapshots')
      if (prerequisiteClaims.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteClaims.error }], isError: true }
      const prerequisiteClaimError = validateClaimSnapshots(prerequisiteClaims.entries, 'prerequisite_claim_snapshots')
      if (prerequisiteClaimError) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteClaimError }], isError: true }
      const prerequisiteVerifications = parseDurableSnapshots(prerequisite_verification_snapshots ?? [], 'prerequisite_verification_snapshots')
      if (prerequisiteVerifications.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteVerifications.error }], isError: true }
      const prerequisiteVerificationError = validateVerificationSnapshots(prerequisiteVerifications.entries, 'prerequisite_verification_snapshots')
      if (prerequisiteVerificationError) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteVerificationError }], isError: true }
      const completedRuns = parseDurableSnapshots(completed_task_run_snapshots ?? [], 'completed_task_run_snapshots')
      if (completedRuns.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + completedRuns.error }], isError: true }
      const completedTaskState = validateCompletedTaskRunSnapshots(job, completedRuns.entries)
      if (completedTaskState.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + completedTaskState.error }], isError: true }
      const completedTaskIds = completedTaskState.completed
      if (checkpoint.boundary === 'BEFORE_NODE' && checkpoint.boundary_node_id && completedTaskIds.has(checkpoint.boundary_node_id)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_BOUNDARY_MISSED: BEFORE_NODE target is already durably completed: ' + checkpoint.boundary_node_id }], isError: true }
      }
      const runtimePrerequisiteIds = checkpointBoundaryPrerequisiteIds(job, checkpoint)
      for (const prerequisiteId of runtimePrerequisiteIds) {
        const prerequisiteCheckpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === prerequisiteId)
        if (prerequisiteCheckpoint) {
          const prerequisiteClaimMatches = prerequisiteClaims.entries.filter((entry: any) => {
            const item = entry.record
            return item?.kind === 'CHECKPOINT_CLAIM' &&
              item.project_id === project_id &&
              item.job_id === job_id &&
              item.planning_revision === job.planning_revision &&
              item.checkpoint_id === prerequisiteId &&
              entry.path === checkpointClaimPath(project_id, job_id, job.planning_revision, prerequisiteId, nextMemoryNamespace)
          })
          const prerequisiteClaim = prerequisiteClaimMatches.length === 1 ? prerequisiteClaimMatches[0].record : null
          const prerequisiteVerificationMatches = prerequisiteClaim
            ? prerequisiteVerifications.entries.filter((entry: any) =>
                entry.record?.verification_id === prerequisiteClaim.last_verification_id &&
                entry.path === verificationPath(project_id, prerequisiteClaim.last_verification_id, 'NEXT', nextMemoryNamespace)
              )
            : []
          const prerequisiteVerification = prerequisiteVerificationMatches.length === 1 ? prerequisiteVerificationMatches[0].record : null
          if (!checkpointVerificationApplicable(job, prerequisiteCheckpoint, prerequisiteClaim, prerequisiteVerification)) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_PREREQUISITE_BLOCKED: prerequisite checkpoint is not satisfied/applicable: ' + prerequisiteId }], isError: true }
          }
        } else if (!completedTaskIds.has(prerequisiteId)) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_PREREQUISITE_BLOCKED: prerequisite Task is not durably completed: ' + prerequisiteId }], isError: true }
        }
      }
      const claimPath = checkpointClaimPath(project_id, job_id, job.planning_revision, checkpoint_id, nextMemoryNamespace)
      let current: any = null
      if (current_claim_record_text) {
        if (!current_claim_record_sha) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim SHA is required with current claim text.' }], isError: true }
        try { current = JSON.parse(current_claim_record_text) } catch {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim JSON is invalid.' }], isError: true }
        }
        if (current.kind !== 'CHECKPOINT_CLAIM' || current.project_id !== project_id || current.job_id !== job_id || current.planning_revision !== job.planning_revision || current.checkpoint_id !== checkpoint_id) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim identity/revision mismatch.' }], isError: true }
        }
        if (current.state === 'ACTIVE' && !checkpointLeaseExpired(current)) {
          if (current.claimant_run_id === claimant_run_id && current.target_revision === target_revision) {
            const out = {
              disposition: 'REUSE',
              claim_memory_path: claimPath,
              claim_operation: 'NONE',
              expected_claim_sha: current_claim_record_sha,
              claim_record_text: null,
              attempt_memory_path: checkpointAttemptPath(project_id, current.attempt_id, nextMemoryNamespace),
              attempt_record_text: null,
              attempt_id: current.attempt_id,
              lease_token: current.lease_token,
              external_steps: [
                'Reuse the existing active attempt/token; do not create another claim or attempt record.',
                'Read the existing attempt record at attempt_memory_path before continuing Tester execution.',
              ],
            }
            return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
          }
          return { content: [{ type: 'text', text: 'CHECKPOINT_ALREADY_CLAIMED: another non-expired live lease owns this checkpoint revision.' }], isError: true }
        }
        if (['SATISFIED','OBSERVED'].includes(current.state) && attempt_kind === 'TEST') {
          const out = {
            disposition: 'ALREADY_SATISFIED',
            claim_memory_path: claimPath,
            claim_operation: 'NONE',
            expected_claim_sha: current_claim_record_sha,
            claim_record_text: null,
            attempt_memory_path: null,
            attempt_record_text: null,
            attempt_id: null,
            lease_token: null,
            external_steps: ['Use the current terminal claim plus its last_verification_id for evidence gating; do not create a duplicate TEST attempt.'],
          }
          return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
        }
        if (current.state === 'NEEDS_PLANNER_REVISION') {
          return { content: [{ type: 'text', text: 'CHECKPOINT_PLAN_REVISION_REQUIRED: PLAN_GAP/SPEC_GAP must be resolved by a new reviewed planning revision; do not RETEST this revision.' }], isError: true }
        }
        const reclaimingExpiredActive = current.state === 'ACTIVE' && checkpointLeaseExpired(current)
        if (reclaimingExpiredActive && current.attempt_kind !== attempt_kind) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_RECLAIM_REJECTED: expired lease reclaim must preserve the original attempt_kind.' }], isError: true }
        }
        if (attempt_kind === 'RETEST' && reclaimingExpiredActive) {
          if (current.target_revision !== target_revision || current.prior_verification_id !== retest_of_verification_id) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: expired RETEST reclaim must preserve the same Retest target and originating Verification.' }], isError: true }
          }
        } else if (attempt_kind === 'RETEST') {
          if (!current.retest_required || !retest_of_verification_id || current.last_verification_id !== retest_of_verification_id) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: RETEST must reference the terminal verification that requested Retest.' }], isError: true }
          }
          if (current.last_failure_class === 'PRODUCT_FAILURE') {
            const retestError = productFailureRetestValidationError(
              current,
              target_revision,
              retest_of_verification_id,
              repair_goal_recheck_record_text,
              repair_goal_recheck_verification_ref,
              project_id,
              job_id,
            )
            if (retestError) {
              return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: ' + retestError }], isError: true }
            }
          }
        } else if (current.state !== 'ACTIVE') {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: terminal/blocked checkpoint requires an explicit RETEST claim.' }], isError: true }
        }
      } else if (attempt_kind === 'RETEST') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: RETEST requires the current terminal claim record.' }], isError: true }
      }

      const attemptId = uuidv7()
      const leaseToken = uuidv7()
      const now = new Date()
      const expires = new Date(now.getTime() + Number(lease_seconds ?? 900) * 1000)
      const generation = Number(current?.generation ?? 0) + 1
      const claim = {
        kind: 'CHECKPOINT_CLAIM',
        project_id,
        job_id,
        execution_contract: 'NEXT',
        memory_namespace: nextMemoryNamespace,
        planning_revision: job.planning_revision,
        checkpoint_id,
        mode: checkpoint.mode,
        state: 'ACTIVE',
        generation,
        attempt_id: attemptId,
        attempt_kind,
        lease_token: leaseToken,
        claimant_run_id,
        lease_expires_at: expires.toISOString(),
        target_ref,
        target_revision,
        prior_verification_id: retest_of_verification_id ?? current?.last_verification_id ?? null,
        last_verification_id: current?.last_verification_id ?? null,
        last_result: current?.last_result ?? null,
        last_failure_class: current?.last_failure_class ?? null,
        last_target_revision: current?.last_target_revision ?? null,
        retest_required: false,
        updated_at: now.toISOString(),
      }
      const attempt = {
        kind: 'CHECKPOINT_ATTEMPT',
        attempt_id: attemptId,
        project_id,
        job_id,
        execution_contract: 'NEXT',
        memory_namespace: nextMemoryNamespace,
        planning_revision: job.planning_revision,
        checkpoint_id,
        mode: checkpoint.mode,
        attempt_kind,
        lease_token: leaseToken,
        claimant_run_id,
        target_ref,
        target_revision,
        state: 'STARTED',
        retest_of_verification_id: retest_of_verification_id ?? null,
        started_at: now.toISOString(),
      }
      const attemptPath = checkpointAttemptPath(project_id, attemptId, nextMemoryNamespace)
      const claimOperation = current ? 'UPDATE' : 'CREATE'
      const externalSteps = [
        'Immediately read back the claimant Tester Run from NEXT memory and require blob SHA equals claimant_run_record_sha plus role=tester, lifecycle=IN_PROGRESS, same project/job/run/target before any claim mutation.',
        claimOperation === 'CREATE'
          ? 'Call authorize_memory_mutation(create) for claim_memory_path, then create the deterministic claim record. Concurrent create failure means another claimant won; refetch instead of retrying blind.'
          : 'Immediately refetch claim_memory_path and require its blob SHA equals expected_claim_sha; authorize/update with exact SHA. Stale SHA means another claimant/reclaimer won.',
        'Read back the claim and require lease_token/attempt_id/generation exactly match this grant before creating the attempt child.',
        'Call authorize_memory_mutation(create) for attempt_memory_path and create attempt_record_text. Duplicate create means replay; read existing attempt and require the same lease_token.',
        ...durableSnapshotReadbackSteps(completed_task_run_snapshots ?? [], 'completed Task Run snapshot'),
        ...durableSnapshotReadbackSteps(prerequisite_claim_snapshots ?? [], 'prerequisite checkpoint claim snapshot'),
        ...durableSnapshotReadbackSteps(prerequisite_verification_snapshots ?? [], 'prerequisite checkpoint Verification snapshot'),
        'Task prerequisite completion is derived only from successful COMPLETED NEXT Run snapshots bound to the current planning_revision and expected topology handler.',
        'For MILESTONE_GATE and JOB_FINAL, runtime prerequisites are expanded from the current milestone/planning_topology; BEFORE_NODE is rejected once its boundary Task is already completed.',
        'Only the current durable lease token may produce terminal Tester Verification.',
        current?.last_failure_class === 'PRODUCT_FAILURE' && attempt_kind === 'RETEST' && current.state !== 'ACTIVE'
          ? 'Read back repair_goal_recheck_verification_ref and require it equals the supplied Goal Recheck for the repaired target revision before Tester execution.'
          : 'No additional repair Goal Recheck read-back is required for this claim/reclaim kind.',
      ]
      const out = {
        disposition: 'CLAIM',
        claim_memory_path: claimPath,
        claim_operation: claimOperation,
        expected_claim_sha: current_claim_record_sha ?? null,
        claim_record_text: prettyJson(claim),
        attempt_memory_path: attemptPath,
        attempt_record_text: prettyJson(attempt),
        attempt_id: attemptId,
        lease_token: leaseToken,
        external_steps: externalSteps,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'checkpoint_verification_prepare',
    {
      title: 'Prepare NEXT Tester checkpoint Verification',
      description: 'Prepare append-preserving TEST/RETEST Verification and the terminal deterministic claim update. Applicability requires the claim to finalize with the same attempt/token/verification id.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1),
        claim_record_text: z.string().min(2),
        claim_record_sha: z.string().min(7),
        tester_run_record_text: z.string().min(2),
        tester_run_record_sha: z.string().min(7),
        attempt_id: z.string().uuid(),
        lease_token: z.string().uuid(),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        result: z.enum(['PASS','FAIL','BLOCKED','OBSERVED','UNVERIFIED']),
        failure_class: z.enum(['PRODUCT_FAILURE','TEST_FAILURE','ENVIRONMENT_FAILURE','NOT_READY','INTEGRATION_NOT_READY','SPEC_GAP','PLAN_GAP']).optional(),
        evidence_refs: z.array(z.string()).default([]),
        evidence_bundle_attestation_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).max(8).default([]),
        measurements: z.array(z.object({ name: z.string().min(1), value: z.any() })).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        claim_memory_path: z.string(),
        expected_claim_sha: z.string(),
        next_claim_record_text: z.string(),
        route: z.enum(['CONTINUE','CODER_REPAIR_GOAL_RECHECK_RETEST','PLANNER_REVISION_SUPERSEDE','RETEST_WHEN_READY']),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, checkpoint_id, claim_record_text, claim_record_sha, tester_run_record_text, tester_run_record_sha, attempt_id, lease_token, target_ref, target_revision, result, failure_class, evidence_refs, evidence_bundle_attestation_snapshots, measurements, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare checkpoint Verification.')
      let job: any, claim: any
      try { job = JSON.parse(job_record_text); claim = JSON.parse(claim_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job/claim JSON.' }], isError: true }
      }
      if (job.project_id !== project_id || job.job_id !== job_id || jobExecutionContract(job) !== 'NEXT') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: owning Job must be the current NEXT Job.' }], isError: true }
      }
      const nextMemoryNamespace = recordNextMemoryNamespace(job)
      if (!nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: owning NEXT Job memory_namespace is invalid.' }], isError: true }
      }
      let testerRun: any
      try { testerRun = JSON.parse(tester_run_record_text) } catch {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: invalid Tester Run JSON.' }], isError: true }
      }
      if (
        resolveExecutionContract(testerRun.execution_contract) !== 'NEXT' ||
        testerRun.project_id !== project_id ||
        testerRun.job_id !== job_id ||
        testerRun.run_id !== claim.claimant_run_id ||
        testerRun.role !== 'tester' ||
        testerRun.lifecycle !== 'IN_PROGRESS' ||
        testerRun.planning_revision !== job.planning_revision ||
        recordNextMemoryNamespace(testerRun) !== nextMemoryNamespace
      ) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: Verification must be produced by the current IN_PROGRESS NEXT Tester Run that owns the lease.' }], isError: true }
      }
      const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpoint_id && item.planning_revision === job.planning_revision)
      if (!checkpoint) return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: checkpoint not in current planning revision.' }], isError: true }
      if (
        claim.kind !== 'CHECKPOINT_CLAIM' ||
        claim.project_id !== project_id ||
        claim.job_id !== job_id ||
        claim.planning_revision !== job.planning_revision ||
        claim.checkpoint_id !== checkpoint_id ||
        claim.state !== 'ACTIVE' ||
        claim.attempt_id !== attempt_id ||
        claim.lease_token !== lease_token ||
        recordNextMemoryNamespace(claim) !== nextMemoryNamespace
      ) {
        return { content: [{ type: 'text', text: 'STALE_CHECKPOINT_LEASE: claim/attempt/token is no longer the active lease.' }], isError: true }
      }
      if (checkpointLeaseExpired(claim)) {
        return { content: [{ type: 'text', text: 'STALE_CHECKPOINT_LEASE: lease expired; reclaim before producing Verification.' }], isError: true }
      }
      if (claim.target_revision !== target_revision || claim.target_ref !== target_ref) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: target revision/state differs from the claimed attempt.' }], isError: true }
      }
      const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')?.full_name ?? null
      if ((evidence_bundle_attestation_snapshots ?? []).length && !workingRepo) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: current Job working repository is unavailable for EvidenceBundle attestation validation.' }], isError: true }
      }
      const bundleKeys = new Set<string>()
      const validatedBundles: any[] = []
      const attestationRefs: any[] = []
      for (const snapshot of evidence_bundle_attestation_snapshots ?? []) {
        const attested = validateEvidenceBundleAttestationSnapshot(snapshot, {
          project_id,
          job_id,
          checkpoint_id,
          attempt_id,
          run_id: testerRun.run_id,
          target_ref,
          target_revision,
          repository_full_name: workingRepo!,
        })
        if (attested.error) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: ' + attested.error }], isError: true }
        }
        if (recordNextMemoryNamespace(attested.record) !== nextMemoryNamespace) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: EvidenceBundle attestation memory_namespace mismatch.' }], isError: true }
        }
        const bundle = attested.bundle
        const key = bundle.backend === 'PRIVATE_SUPABASE'
          ? 'PRIVATE:' + bundle.evidence_bundle_id
          : 'REPO:' + bundle.evidence_commit_sha + ':' + bundle.manifest_path
        if (bundleKeys.has(key)) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: duplicate EvidenceBundle attestation.' }], isError: true }
        }
        bundleKeys.add(key)
        validatedBundles.push(bundle)
        attestationRefs.push({ path: attested.ref, sha: attested.sha })
      }
      if (!['PASS','OBSERVED'].includes(result) && !failure_class) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: non-success result requires failure_class.' }], isError: true }
      }
      if (['PASS','OBSERVED'].includes(result) && failure_class) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: successful/observed evidence cannot carry a failure_class.' }], isError: true }
      }
      if (['PASS','OBSERVED'].includes(result) && !(evidence_refs ?? []).length && !validatedBundles.length && !(measurements ?? []).length) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: successful/observed result requires durable evidence bundle/ref or measurement.' }], isError: true }
      }
      if (result === 'OBSERVED' && !['MEASURE','PROBE'].includes(checkpoint.mode)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: OBSERVED is only valid for MEASURE/PROBE.' }], isError: true }
      }

      const verificationId = uuidv7()
      const outcome = checkpointVerificationOutcome(result, failure_class)
      const { successful, state, route, retestRequired, applicabilityStatus } = outcome
      const now = new Date().toISOString()
      const verification = {
        verification_id: verificationId,
        kind: claim.attempt_kind === 'RETEST' ? 'RETEST' : 'TEST',
        project_id,
        job_id,
        execution_contract: 'NEXT',
        memory_namespace: nextMemoryNamespace,
        planning_revision: job.planning_revision,
        checkpoint_id,
        attempt_id,
        attempt_kind: claim.attempt_kind,
        lease_token,
        mode: checkpoint.mode,
        target_ref,
        target_revision,
        run_id: testerRun.run_id,
        producer: 'tester',
        result,
        failure_class: failure_class ?? null,
        evidence_refs: evidence_refs ?? [],
        evidence_bundle_refs: validatedBundles,
        evidence_bundle_attestation_refs: attestationRefs,
        measurements: measurements ?? [],
        limitations: limitations ?? [],
        retest_of_verification_id: claim.prior_verification_id ?? null,
        applicability: {
          status: applicabilityStatus,
          planning_revision: job.planning_revision,
          checkpoint_id,
          evidence_need_ids: checkpoint.evidence_need_ids ?? [],
          target_revision,
        },
        route,
        created_at: now,
      }
      const nextClaim = {
        ...claim,
        state,
        lease_expires_at: null,
        last_verification_id: verificationId,
        last_result: result,
        last_failure_class: failure_class ?? null,
        last_target_revision: target_revision,
        retest_required: retestRequired,
        updated_at: now,
      }
      const verificationPathValue = verificationPath(project_id, verificationId, 'NEXT', nextMemoryNamespace)
      const claimPath = checkpointClaimPath(project_id, job_id, job.planning_revision, checkpoint_id, nextMemoryNamespace)
      const out = {
        verification_id: verificationId,
        verification_memory_path: verificationPathValue,
        verification_record_text: prettyJson(verification),
        claim_memory_path: claimPath,
        expected_claim_sha: claim_record_sha,
        next_claim_record_text: prettyJson(nextClaim),
        route,
        external_steps: [
          ...durableSnapshotReadbackSteps(evidence_bundle_attestation_snapshots ?? [], 'EvidenceBundle attestation snapshot'),
          'Immediately read back the Tester Run and require blob SHA equals tester_run_record_sha plus role=tester, lifecycle=IN_PROGRESS and run_id=claim.claimant_run_id.',
        'Immediately refetch claim_memory_path and require blob SHA, state=ACTIVE, attempt_id and lease_token still match this preparation. Stale/expired claim blocks persistence.',
          'Authorize/create verification_memory_path and persist verification_record_text append-only.',
          'Then authorize/update claim_memory_path with next_claim_record_text using expected_claim_sha exactly.',
          'If the claim update loses CAS, the Verification is orphaned/non-applicable because evidence gates require current claim.last_verification_id + attempt/token match. Refetch and reconcile; never treat the orphan as PASS.',
          successful
            ? 'The terminal claim can satisfy gates only after read-back proves last_verification_id points to this Verification.'
            : route === 'PLANNER_REVISION_SUPERSEDE'
              ? 'Route to Planner. A later reviewed planning_revision uses a different deterministic claim namespace and makes this revision non-applicable.'
              : route === 'CODER_REPAIR_GOAL_RECHECK_RETEST'
                ? 'Route to owning Coder repair. After exact Goal Recheck, claim RETEST against the repaired target revision; Tester must rerun original failing scenario plus impacted regressions, discover new defects, and repeat repair/retest for each reproducible within-scope failure until evidence-backed PASS or genuine blocker.'
                : 'Retest only after the blocking test/environment/integration condition is ready.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'checkpoint_gate_evaluate',
    {
      title: 'Evaluate NEXT checkpoint evidence gate',
      description: 'Read-only evidence applicability guard for NEXT Task, Milestone or Job targets. V2_STABLE always preserves the legacy path.',
      inputSchema: {
        job_record_text: z.string().min(2),
        target_kind: z.enum(['TASK','MILESTONE','JOB']),
        target_id: z.string().optional(),
        checkpoint_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        checkpoint_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
      },
      outputSchema: {
        allowed: z.boolean(),
        required_checkpoint_ids: z.array(z.string()),
        blocking: z.array(z.string()),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ job_record_text, target_kind, target_id, checkpoint_claim_snapshots, checkpoint_verification_snapshots }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to evaluate checkpoint gate.')
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const gate = evaluateNextEvidenceGate(job, checkpoint_claim_snapshots ?? [], checkpoint_verification_snapshots ?? [], { kind: target_kind, id: target_id ?? null })
      const out = {
        ...gate,
        external_steps: jobExecutionContract(job) === 'NEXT'
          ? [
              ...durableSnapshotReadbackSteps(checkpoint_claim_snapshots ?? [], 'checkpoint claim snapshot'),
              ...durableSnapshotReadbackSteps(checkpoint_verification_snapshots ?? [], 'checkpoint Verification snapshot'),
            ]
          : [],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'run_begin',
    {
      title: 'Begin a GSA Job Run',
      description: 'Create one attributed execution Run. Call get_agent_harness for the selected role before executing work.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        current_job_record_sha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
        planning_revision: z.number().int().positive().optional(),
        role: z.enum(['planner','designer','coder','reviewer','tester']),
        scope_claim: z.array(z.string()).min(1),
        primary_task_id: z.string().min(1).optional(),
        affected_task_refs: z.array(z.string()).default([]),
        parent_run_id: z.string().uuid().optional(),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
        input_refs: z.array(z.string()).default([]),
        checkpoint_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        checkpoint_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        completed_task_run_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        project_manifest_text: z.string().optional(),
        bootstrap_evidence: z.any().optional(),
      },
      outputSchema: {
        run_id: z.string(),
        handle: z.string(),
        memory_path: z.string(),
        run_record_text: z.string(),
        expected_job_sha: z.string().nullable(),
        required_skill_contexts: z.array(z.object({
          name: z.string(),
          description: z.string(),
          skill_text: z.string(),
        })),
        next_step: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, job_record_sha, current_job_record_sha, planning_revision, role, scope_claim, primary_task_id, affected_task_refs, parent_run_id, target_ref, target_revision, input_refs, checkpoint_claim_snapshots, checkpoint_verification_snapshots, completed_task_run_snapshots, project_manifest_text, bootstrap_evidence }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to begin a Run.')
      let owningJob: any
      try { owningJob = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid owning Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(owningJob)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(owningJob)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'NEXT_RUN_NAMESPACE_INVALID: owning Job memory_namespace is invalid.' }], isError: true }
      }
      if (owningJob.job_id !== job_id || owningJob.project_id !== project_id || !['READY','IN_PROGRESS'].includes(owningJob.lifecycle)) {
        return { content: [{ type: 'text', text: 'Owning Job identity/lifecycle mismatch.' }], isError: true }
      }
      if (owningJob.plan_change_pending) {
        return { content: [{ type:'text', text:'PLAN_CHANGE_PENDING_FENCE: Job is being reconciled with a newer reviewed Plan; do not start another Run.' }], isError:true }
      }
      if (role === 'coder') {
        const blocked = projectBootstrapExecutionError(project_id, project_manifest_text ?? '', bootstrap_evidence,
          owningJob.repository_context?.working_repository_url ?? null,
          owningJob.repository_context?.integration_branch ?? null)
        if (blocked) return { content: [{ type: 'text', text: blocked }], isError: true }
      }
      const currentTaskIds = new Set<string>((owningJob.tasks ?? []).filter((item: any) => item.lifecycle !== 'RETIRED').map((item: any) => item.task_id))
      if (executionContract === 'NEXT' && primary_task_id && !currentTaskIds.has(primary_task_id)) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REJECTED: primary_task_id is not a Task in the current planning revision.' }], isError: true }
      }
      if (executionContract === 'NEXT' && (affected_task_refs ?? []).some((id: string) => !currentTaskIds.has(id))) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REJECTED: every affected_task_ref must be a current Task in this planning revision.' }], isError: true }
      }
      if (executionContract === 'NEXT' && ['coder','designer','reviewer','tester'].includes(role) && (owningJob.tasks ?? []).length > 0 && !primary_task_id) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REQUIRED: NEXT execution must bind one current primary Task so role, prerequisite and evidence guards cannot be bypassed.' }], isError: true }
      }
      if (
        executionContract === 'NEXT' &&
        (owningJob.planning_review?.status !== 'PASS' || owningJob.planning_review?.reviewed_revision !== owningJob.planning_revision)
      ) {
        return { content: [{ type: 'text', text: 'NEXT_PLAN_REVIEW_PENDING: current NEXT planning revision is not Reviewer PASS; dispatch is blocked.' }], isError: true }
      }
      let resolvedRequiredSkills: any = { names: [], contexts: [], error: null }
      if (executionContract === 'NEXT') {
        const completedRuns = parseDurableSnapshots(completed_task_run_snapshots ?? [], 'completed_task_run_snapshots')
        if (completedRuns.error) {
          return { content: [{ type: 'text', text: 'NEXT_DISPATCH_PREREQUISITE_INVALID: ' + completedRuns.error }], isError: true }
        }
        const dispatchTaskIds = primary_task_id
          ? [primary_task_id, ...((affected_task_refs ?? []).filter((id: string) => id !== primary_task_id))]
          : []
        resolvedRequiredSkills = resolveRequiredTaskSkills(owningJob, dispatchTaskIds)
        if (resolvedRequiredSkills.error) {
          return { content: [{ type: 'text', text: resolvedRequiredSkills.error }], isError: true }
        }
        const dispatchError = nextDispatchPreflightError(
          owningJob,
          role,
          dispatchTaskIds,
          planning_revision ?? null,
          job_record_sha ?? null,
          current_job_record_sha ?? null,
          completedRuns.entries,
        )
        if (dispatchError) return { content: [{ type: 'text', text: dispatchError }], isError: true }
      }
      if (executionContract === 'NEXT' && primary_task_id) {
        const gatedTaskIds = new Set<string>([primary_task_id])
        if (['coder','designer'].includes(role)) {
          for (const id of affected_task_refs ?? []) gatedTaskIds.add(id)
        }
        for (const taskId of gatedTaskIds) {
          const gate = evaluateNextEvidenceGate(
            owningJob,
            checkpoint_claim_snapshots ?? [],
            checkpoint_verification_snapshots ?? [],
            { kind: 'TASK', id: taskId },
          )
          if (!gate.allowed) {
            return {
              content: [{
                type: 'text',
                text: 'EVIDENCE_REQUIREMENT_BLOCKED: Task ' + taskId + ': ' + gate.blocking.join('; '),
              }],
              isError: true,
            }
          }
        }
      }
      if (
        role === 'coder' &&
        target_ref &&
        owningJob.repository_context?.working_repository_url &&
        normalizeGithubRepo(target_ref)?.url &&
        normalizeGithubRepo(target_ref)?.url !== owningJob.repository_context.working_repository_url
      ) {
        return { content: [{ type: 'text', text: 'Coder target repository does not match the Job working repository.' }], isError: true }
      }
      if (uxFirstTemporaryUiGateRequired(owningJob, role)) {
        return {
          content: [{
            type: 'text',
            text: 'HUMAN_GATE_REQUIRED: UX_FIRST temporary UI contains user-facing provisional structure that is still REQUIRED_PENDING. Planner must obtain explicit Human approval and persist an approved Job planning revision before Coder may begin.',
          }],
          isError: true,
        }
      }
      const approvedReviewMilestones = role === 'reviewer' && primary_task_id
        ? (owningJob.milestones ?? []).filter((m: any) =>
            (m.node_ids ?? []).includes(primary_task_id) &&
            ['rl','crl'].includes(m.review_loop) && m.human_pre_authorized === true)
        : []
      if (approvedReviewMilestones.length > 1) {
        return { content: [{ type: 'text', text: 'MILESTONE_REVIEW_AMBIGUOUS: Reviewer Task belongs to more than one approved review milestone.' }], isError: true }
      }
      const runId = uuidv7()
      const now = new Date().toISOString()
      const record = {
        run_id: runId,
        handle: runHandle(runId),
        project_id,
        job_id,
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { planning_revision: owningJob.planning_revision, memory_namespace: nextMemoryNamespace } : {}),
        primary_task_id: primary_task_id ?? null,
        ...(role === 'reviewer' && approvedReviewMilestones.length === 1 ? { milestone_id: approvedReviewMilestones[0].milestone_id } : {}),
        affected_task_refs: affected_task_refs ?? [],
        parent_run_id: parent_run_id ?? null,
        role,
        target_ref: target_ref ?? null,
        target_revision: target_revision ?? null,
        scope_claim,
        input_refs: input_refs ?? [],
        loaded_skills: executionContract === 'NEXT' ? resolvedRequiredSkills.names : [],
        lifecycle: 'IN_PROGRESS',
        derived_condition: null,
        result: null,
        output_refs: [],
        verification_refs: [],
        handoff_ref: null,
        started_at: now,
        ended_at: null,
      }
      const path = recordPath(project_id, 'RUNS', runId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const result = {
        run_id: runId,
        handle: runHandle(runId),
        memory_path: path,
        run_record_text: prettyJson(record),
        expected_job_sha: executionContract === 'NEXT' ? (job_record_sha ?? null) : null,
        required_skill_contexts: executionContract === 'NEXT' ? resolvedRequiredSkills.contexts : [],
        next_step: (executionContract === 'NEXT' && resolvedRequiredSkills.contexts.length
          ? 'Required Task skills are already injected in required_skill_contexts. Apply them together with get_agent_harness(role=' + role + ') before execution.'
          : 'Load get_agent_harness(role=' + role + ') and execute its loop with minimum sufficient context.'),
        external_steps: [
          'Re-read current PROJECT.md and require lifecycle=ACTIVE before this consequential dispatch.',
          'The supplied owning Job snapshot has passed identity/lifecycle and UX_FIRST temporary-UI Human-Gate validation. Re-fetch it before persistence and require the same planning revision/state is still current.',
          ...(executionContract === 'NEXT'
            ? [
                'Immediately re-fetch the owning Job before Run persistence and require blob SHA=' + String(job_record_sha) + ' plus planning_revision=' + String(planning_revision) + '. A mismatch rejects dispatch as stale.',
                ...durableSnapshotReadbackSteps(completed_task_run_snapshots ?? [], 'completed prerequisite Task Run snapshot'),
                ...durableSnapshotReadbackSteps(checkpoint_claim_snapshots ?? [], 'checkpoint claim snapshot'),
                ...durableSnapshotReadbackSteps(checkpoint_verification_snapshots ?? [], 'checkpoint Verification snapshot'),
              ]
            : []),
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'GitHub Memory Repo: create_file at memory_path with run_record_text before role execution begins.',
          'For coder source writes, re-read Project lifecycle and live target revision immediately before the first write.',
          ...(role === 'coder' ? [
            'M5: independently read existing Criteria, reviewed Plan, Milestones and Coder/Tester readiness, as well as actual Human execution approval and configured Development Branch. Legacy proof readback applies only to legacy evidence; caller-supplied claims are not sufficient.',
            'Use authorize_project_scope(MUTATE_SOURCE) with the same evidence and target branch immediately before source write; do not bypass this via an alternate GSA-owned write route.',
          ] : []),
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'relationship_knowledge_prepare',
    {
      title: 'Prepare durable Project relationship knowledge',
      description: 'Prepare an existing KNOWLEDGE/ ARCHITECTURE_NOTE artifact for repo/subsystem relationship direction and reread conditions. This does not create a new record family.',
      inputSchema: {
        project_id: z.string().uuid(),
        title: z.string().min(1),
        source: z.string().min(1),
        target: z.string().min(1),
        relationship: z.string().min(1),
        precedence: z.string().min(1),
        reason: z.string().min(1),
        evidence: z.array(z.string()).default([]),
        reread_condition: z.string().min(1),
        depends_on: z.array(z.string()).default([]),
        approved_by_or_source: z.string().min(1),
      },
      outputSchema: {
        knowledge_id: z.string(),
        memory_path: z.string(),
        knowledge_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, title, source, target, relationship, precedence, reason, evidence, reread_condition, depends_on, approved_by_or_source }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare relationship knowledge.')
      const knowledgeId = uuidv7()
      const now = new Date().toISOString()
      const body = [
        '---',
        'knowledge_id: ' + knowledgeId,
        'project_id: ' + project_id,
        'kind: ARCHITECTURE_NOTE',
        'title: ' + JSON.stringify(title),
        'revision: 1',
        'validity: CURRENT',
        'depends_on: ' + JSON.stringify(depends_on ?? []),
        'approved_by_or_source: ' + JSON.stringify(approved_by_or_source),
        'updated_at: ' + now,
        '---',
        '',
        '# ' + title,
        '',
        '## Relationship',
        '- source: ' + source,
        '- target: ' + target,
        '- relationship: ' + relationship,
        '- precedence: ' + precedence,
        '',
        '## Reason',
        reason,
        '',
        '## Evidence',
        ...((evidence ?? []).length ? (evidence ?? []).map((x: string) => '- ' + x) : ['- none recorded']),
        '',
        '## Reread condition',
        reread_condition,
        '',
      ].join('\n')
      const path = knowledgePath(project_id, knowledgeId, title)
      const out = {
        knowledge_id: knowledgeId,
        memory_path: path,
        knowledge_record_text: body,
        external_steps: [
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist knowledge_record_text at memory_path in the configured Memory Repo.',
          'Read back the Knowledge artifact before treating the relationship as durable Project memory.',
          'When the reread condition becomes true, re-read the current source-of-truth side before downstream planning or implementation.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'goal_recheck_record',
    {
      title: 'Prepare Coder Goal Recheck evidence',
      description: 'Build append-preserving GOAL_RECHECK Verification from the Coder loop. Pass the exact current owning Run record plus its current Git blob SHA; execution_contract and the Verification namespace are derived from that Run, and persistence is gated on exact Run read-back. Does not independently prove success.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        run_record_text: z.string().min(2),
        run_record_sha: z.string().min(7),
        job_record_text: z.string().min(2).optional(),
        job_record_sha: z.string().min(7).optional(),
        task_id: z.string().uuid().optional(),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        criteria: z.array(z.object({
          task_id: z.string().uuid().optional(),
          criterion: z.string().min(1),
          result: z.enum(['MET','PARTIAL','NOT_MET','UNVERIFIED']),
          evidence: z.array(z.string()).default([]),
          limitation: z.string().optional(),
        })).min(1),
        scope_drift: z.array(z.string()).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        memory_path: z.string(),
        owning_run_memory_path: z.string(),
        expected_run_sha: z.string(),
        owning_job_memory_path: z.string().nullable(),
        expected_job_sha: z.string().nullable(),
        verification_record_text: z.string(),
        ready_for_success_handoff: z.boolean(),
        blocking_reasons: z.array(z.string()),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, job_id, run_id, run_record_text, run_record_sha, job_record_text, job_record_sha, task_id, target_ref, target_revision, criteria, scope_drift, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to persist Goal Recheck.')
      let owningRun: any
      try { owningRun = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid owning Run JSON.' }], isError: true }
      }
      if (!goalRecheckRunMatches(owningRun, project_id, job_id, run_id)) {
        return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: owning Run identity/role/lifecycle mismatch.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(owningRun.execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(owningRun)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: owning NEXT Run memory_namespace is invalid.' }], isError: true }
      }
      if (executionContract === 'NEXT' && (!owningRun.target_revision || owningRun.target_revision !== target_revision || owningRun.target_ref !== target_ref)) {
        return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: NEXT Goal Recheck must bind the exact Run target ref/revision.' }], isError: true }
      }
      let owningJob: any = null
      if (executionContract === 'NEXT') {
        if (!job_record_text || !job_record_sha) {
          return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: NEXT Goal Recheck requires the exact current Job snapshot and blob SHA.' }], isError: true }
        }
        try { owningJob = JSON.parse(job_record_text) } catch {
          return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: invalid owning Job JSON.' }], isError: true }
        }
        if (recordNextMemoryNamespace(owningJob) !== nextMemoryNamespace) {
          return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: owning Job/Run NEXT memory_namespace mismatch.' }], isError: true }
        }
        const coverageError = goalRecheckCoverageError(owningJob, owningRun, criteria ?? [])
        if (coverageError) return { content: [{ type: 'text', text: coverageError }], isError: true }
      }
      const verificationId = uuidv7()
      const blocking = criteria
        .filter((c: any) => c.result === 'NOT_MET')
        .map((c: any) => 'NOT_MET: ' + c.criterion)
      if ((scope_drift ?? []).length) blocking.push('Unresolved scope drift: ' + scope_drift.join('; '))
      const record = {
        verification_id: verificationId,
        kind: 'GOAL_RECHECK',
        project_id,
        job_id,
        task_id: task_id ?? null,
        run_id,
        target_ref,
        target_revision,
        producer: 'coder',
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { planning_revision: owningRun.planning_revision, memory_namespace: nextMemoryNamespace } : {}),
        result: blocking.length ? 'CHANGES_REQUIRED' : (criteria.some((c: any) => c.result === 'PARTIAL' || c.result === 'UNVERIFIED') ? 'PASS_RETEST_REQUIRED' : 'PASS'),
        limitations: limitations ?? [],
        evidence_refs: criteria.flatMap((c: any) => c.evidence ?? []),
        criteria,
        scope_drift: scope_drift ?? [],
        created_at: new Date().toISOString(),
      }
      const path = verificationPath(project_id, verificationId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const owningRunPath = recordPath(project_id, 'RUNS', run_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const owningJobPath = executionContract === 'NEXT' ? recordPath(project_id, 'JOBS', job_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) : null
      const result = {
        verification_id: verificationId,
        memory_path: path,
        owning_run_memory_path: owningRunPath,
        expected_run_sha: run_record_sha,
        owning_job_memory_path: owningJobPath,
        expected_job_sha: executionContract === 'NEXT' ? job_record_sha : null,
        verification_record_text: prettyJson(record),
        ready_for_success_handoff: blocking.length === 0,
        blocking_reasons: blocking,
        external_steps: [
          'Fetch the current owning Run at owning_run_memory_path immediately before Verification persistence.',
          'Require the fetched Run blob SHA to equal expected_run_sha exactly. Missing path or stale SHA blocks Goal Recheck persistence.',
          'Re-parse the fetched Run and require project_id/job_id/run_id, role=coder, lifecycle=IN_PROGRESS and resolved execution_contract to still match the supplied owning Run snapshot.',
          ...(executionContract === 'NEXT'
            ? [
                'Fetch the current owning Job at owning_job_memory_path immediately before Verification persistence.',
                'Require the fetched Job blob SHA to equal expected_job_sha exactly and planning_revision to remain ' + String(owningRun.planning_revision) + '.',
              ]
            : []),
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist this Verification record only after the owning Run read-back guard passes.',
          blocking.length ? 'Continue the Coder loop; do not claim success while blocking_reasons remain.' : 'If topology permits, proceed to required review/test/handoff or terminal Run completion.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'run_verification_record',
    {
      title: 'Prepare exact Reviewer/Tester Run Verification',
      description: 'Create an append-preserving REVIEW or TEST Verification bound to the exact current Reviewer/Tester Run and target revision. NEXT success closure must consume this durable record.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        run_record_text: z.string().min(2),
        run_record_sha: z.string().min(7),
        result: z.enum(['PASS','PASS_RETEST_REQUIRED','CHANGES_REQUIRED','BLOCKED','HUMAN_REVIEW_REQUIRED','FAIL','OBSERVED','UNVERIFIED']),
        findings: z.array(z.object({
          severity: z.enum(['CRITICAL','IMPORTANT','MINOR']),
          finding: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          required_change: z.string().optional(),
        })).default([]),
        coverage_summary: z.string().optional(),
        failure_class: z.enum(['PRODUCT_FAILURE','TEST_FAILURE','ENVIRONMENT_FAILURE','NOT_READY','INTEGRATION_NOT_READY','SPEC_GAP','PLAN_GAP']).optional(),
        evidence_refs: z.array(z.string()).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        memory_path: z.string(),
        owning_run_memory_path: z.string(),
        expected_run_sha: z.string(),
        verification_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, job_id, run_id, run_record_text, run_record_sha, result, findings, coverage_summary, failure_class, evidence_refs, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare Run Verification.')
      let run: any
      try { run = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: invalid Run JSON.' }], isError: true }
      }
      if (
        run.project_id !== project_id ||
        run.job_id !== job_id ||
        run.run_id !== run_id ||
        run.lifecycle !== 'IN_PROGRESS' ||
        !['reviewer','tester'].includes(run.role)
      ) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: Verification must bind the exact current IN_PROGRESS Reviewer/Tester Run.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(run.execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const nextMemoryNamespace = recordNextMemoryNamespace(run)
      if (executionContract === 'NEXT' && !nextMemoryNamespace) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: NEXT Run memory_namespace is invalid.' }], isError: true }
      }
      if (executionContract === 'NEXT' && (!run.target_ref || !run.target_revision || !Number.isInteger(Number(run.planning_revision)))) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: NEXT Verification requires exact target ref/revision and current planning revision.' }], isError: true }
      }

      const reviewerResults = new Set(['PASS','PASS_RETEST_REQUIRED','CHANGES_REQUIRED','BLOCKED','HUMAN_REVIEW_REQUIRED'])
      const testerResults = new Set(['PASS','PASS_RETEST_REQUIRED','FAIL','BLOCKED','OBSERVED','UNVERIFIED'])
      const allowed = run.role === 'reviewer' ? reviewerResults.has(result) : testerResults.has(result)
      if (!allowed) return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: result is not valid for role=' + run.role + '.' }], isError: true }

      const successLike = ['PASS','PASS_RETEST_REQUIRED','OBSERVED'].includes(result)
      if (successLike && !(evidence_refs ?? []).length) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: successful/observed Verification requires evidence_refs.' }], isError: true }
      }
      if (run.role === 'reviewer' && ['PASS','PASS_RETEST_REQUIRED'].includes(result) && (findings ?? []).some((item: any) => ['CRITICAL','IMPORTANT'].includes(item.severity))) {
        return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: Reviewer success cannot contain unresolved CRITICAL/IMPORTANT findings.' }], isError: true }
      }
      if (run.role === 'tester') {
        const needsFailureClass = ['FAIL','BLOCKED','UNVERIFIED'].includes(result)
        if (needsFailureClass && !failure_class) {
          return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: non-success Tester result requires failure_class.' }], isError: true }
        }
        if (successLike && failure_class) {
          return { content: [{ type: 'text', text: 'RUN_VERIFICATION_REJECTED: successful/observed Tester Verification cannot carry failure_class.' }], isError: true }
        }
      }

      const verificationId = uuidv7()
      const record = {
        verification_id: verificationId,
        kind: run.role === 'reviewer' ? 'REVIEW' : 'TEST',
        project_id,
        job_id,
        task_id: run.primary_task_id ?? null,
        ...(run.role === 'reviewer' && run.milestone_id ? { milestone_id: run.milestone_id } : {}),
        run_id,
        target_ref: run.target_ref ?? null,
        target_revision: run.target_revision ?? null,
        producer: run.role,
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { planning_revision: run.planning_revision, memory_namespace: nextMemoryNamespace } : {}),
        result,
        ...(run.role === 'reviewer' ? { findings: findings ?? [], coverage_summary: coverage_summary ?? null } : {}),
        ...(run.role === 'tester' ? { failure_class: failure_class ?? null } : {}),
        limitations: limitations ?? [],
        evidence_refs: evidence_refs ?? [],
        created_at: new Date().toISOString(),
      }
      const memoryPath = verificationPath(project_id, verificationId, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const runPath = recordPath(project_id, 'RUNS', run_id, executionContract, nextMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE)
      const out = {
        verification_id: verificationId,
        memory_path: memoryPath,
        owning_run_memory_path: runPath,
        expected_run_sha: run_record_sha,
        verification_record_text: prettyJson(record),
        external_steps: [
          'Fetch the current owning Run immediately before Verification persistence and require blob SHA=' + run_record_sha + '.',
          'Require the read-back Run identity/role/lifecycle/target/planning revision to remain byte-consistent with this Verification.',
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist verification_record_text append-only and read it back before Run completion.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

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
    async ({ project_id, job_id, run_id, role, run_record_text, run_record_sha, lifecycle, result, output_refs, verification_refs, goal_recheck_record_text, goal_recheck_verification_ref, goal_recheck_snapshot, job_record_text, job_record_sha, run_verification_snapshot, handoff }: any) => {
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
