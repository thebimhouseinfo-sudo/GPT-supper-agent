// GSA4 A2: read-only context reference selection over the existing Job/Task/Run.
// This module deliberately does NOT register a tool, grant authority, alter a
// Run, or change get_agent_harness/load_skill/required_skill_contexts.
import { ROLE_HARNESSES, ROLE_SKILLS, RUNTIME_SKILLS } from './harness-catalog.ts'

type ContextAction = 'STOP' | 'READ_MORE' | 'REVIEW_REFERENCES'
type Ref = { kind: string; path: string; revision: string | null; reason: string; trust: 'REQUIRES_READBACK' }
type Finding = { code: string; action: 'STOP' | 'READ_MORE'; reason: string; owner: string }
type ToolOwner = { name: string; owner: string; facade: string }
type Locator = { schema: string; tool_owners: ToolOwner[]; basis_a0_merge?: string }
type Input = {
  role: string
  project_id: string
  job: any
  task_id?: string | null
  job_record_path?: string | null
  job_record_sha?: string | null
  current_job_record_sha?: string | null
  run?: any
  tool_names?: string[]
  source_locator?: Locator
  source_locator_ref?: string | null
  current_source_ref?: string | null
  knowledge_refs?: Array<{ path: string; sha: string; validity?: string; depends_on?: string[] }>
  requires_domain_addin?: boolean
}
const validSha = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
const validProjectId = (v: unknown) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v)
const safeOwner = (v: unknown) => typeof v === 'string' &&
  /^[A-Za-z0-9_./-]+\.ts$/.test(v) && !v.startsWith('/') &&
  !v.split('/').some((x) => x === '.' || x === '..' || !x)
const nonempty = (v: unknown) => typeof v === 'string' && v.trim().length > 0
const arrayOfStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => nonempty(x)) : []
const unique = (v: string[]) => [...new Set(v)]
const EXECUTION_ROLES = new Set(['planner', 'designer', 'coder', 'reviewer', 'tester'])

/**
 * Compile an advisory context plan from durable-record snapshots.
 *
 * All snapshots, SHA strings, locator contents and Knowledge candidates are
 * caller-provided. This function CANNOT independently prove Git readback,
 * approval, current Run status or Human authority. Thus no result is an
 * execution permit, and all returned refs require independent verification.
 */
export function buildTaskContextRecipe(input: Input) {
  const findings: Finding[] = []
  const stop = (code: string, reason: string, owner = 'orchestrator') =>
    findings.push({ code, action: 'STOP', reason, owner })
  const read = (code: string, reason: string, owner = 'current_agent') =>
    findings.push({ code, action: 'READ_MORE', reason, owner })
  const refs: Ref[] = []
  const addRef = (kind: string, path: unknown, revision: unknown, reason: string) => {
    if (!nonempty(path)) return
    refs.push({ kind, path: String(path), revision: typeof revision === 'string' ? revision : null,
      reason, trust: 'REQUIRES_READBACK' })
  }
  const role = input?.role
  const job = input?.job
  const projectId = input?.project_id
  const taskId = input?.task_id ?? null
  if (!Object.hasOwn(ROLE_HARNESSES, role)) stop('ROLE_UNKNOWN', 'No matching existing GSA role contract.')
  if (!validProjectId(projectId) || !job || typeof job !== 'object' || Array.isArray(job) ||
      job.project_id !== projectId || !nonempty(job.job_id)) {
    stop('JOB_IDENTITY_UNVERIFIED', 'Current Project and owning Job identity must be read from authoritative Project Memory.')
  }
  if (!Array.isArray(job?.tasks)) {
    read('JOB_TASKS_UNAVAILABLE', 'Task list must be read from the current durable Job.', 'planner')
  }
  if (job?.lifecycle === 'RETIRED' || job?.lifecycle === 'SUPERSEDED' ||
      job?.lifecycle === 'ARCHIVED') {
    stop('JOB_NOT_CURRENT', 'Retired/superseded/archived Job cannot authorize new execution.')
  }
  if (job?.plan_change_pending) {
    stop('PLAN_CHANGE_PENDING', 'Current Job has a pending Plan reconciliation; follow existing recovery process.')
  }

  const snapshotSha = input?.job_record_sha
  const currentSha = input?.current_job_record_sha
  if (!validSha(snapshotSha) || !validSha(currentSha) || snapshotSha !== currentSha) {
    read('JOB_SHA_REVALIDATE', 'Read back the current Job Git blob SHA; supplied SHA values cannot prove freshness.')
  }
  if (typeof input?.job_record_path === 'string' && input.job_record_path.trim() &&
      validProjectId(projectId) &&
      input.job_record_path.startsWith('projects/' + projectId + '/') &&
      !input.job_record_path.split('/').includes('..')) {
    addRef('JOB', input.job_record_path, snapshotSha, 'Owning Job, current planning revision and acceptance criteria')
  } else {
    read('JOB_PATH_MISSING', 'Locate current canonical Job record inside the owning Project prefix.')
  }
  if (job?.execution_contract === 'NEXT' &&
      (!Number.isInteger(job.planning_revision) || job.planning_revision < 1)) {
    stop('PLANNING_REVISION_UNKNOWN', 'NEXT Job must have a current durable planning revision.')
  }
  if (job?.execution_contract === 'NEXT' &&
      (job?.planning_review?.status !== 'PASS' ||
       job.planning_review.reviewed_revision !== job.planning_revision)) {
    read('PLANNING_REVIEW_REVALIDATE', 'Read current planning Reviewer result; packet cannot waive Plan gate.', 'planner')
  }

  const task = (Array.isArray(job?.tasks) ? job.tasks : []).find((t: any) => t?.task_id === taskId)
  if (taskId && !task) stop('TASK_NOT_IN_CURRENT_JOB', 'Selected Task does not exist in the current owning Job.', 'planner')
  if (task?.lifecycle === 'RETIRED') stop('TASK_RETIRED', 'Retired Task may not be dispatched.', 'planner')
  if (!taskId && EXECUTION_ROLES.has(role) && job?.execution_contract === 'NEXT') {
    read('TASK_BINDING_REQUIRED', 'Resolve exact NEXT primary Task before starting a role Run.')
  }
  if (task && (!nonempty(task.objective) ||
      !Array.isArray(task.completion_criteria) || !arrayOfStrings(task.completion_criteria).length)) {
    read('TASK_ACCEPTANCE_MISSING', 'Find current objective and observable completion criteria; ask Planner when absent.', 'planner')
  }
  const stage = (Array.isArray(job?.topology) ? job.topology : []).find((t: any) => t?.task_id === taskId)
  if (task && job?.execution_contract === 'NEXT' && !stage) {
    read('TASK_TOPOLOGY_MISSING', 'Read current reviewed Task topology before dispatch.', 'planner')
  } else if (task && stage && EXECUTION_ROLES.has(role) && stage.handler !== role) {
    read('TASK_HANDLER_MISMATCH', 'Current Task topology assigns another handler; do not treat this context packet as a Run dispatch.', 'orchestrator')
  }
  const run = input?.run
  if (run) {
    if (run.lifecycle !== 'IN_PROGRESS') {
      read('RUN_LIFECYCLE_REVALIDATE', 'Read current active Run lifecycle; old/closed Run context cannot justify execution.')
    }
    if (run.project_id !== projectId || run.job_id !== job?.job_id ||
        run.role !== role || (taskId && run.primary_task_id !== taskId) ||
        (job?.execution_contract === 'NEXT' && run.planning_revision !== job.planning_revision)) {
      stop('RUN_IDENTITY_MISMATCH', 'Run/Job/Role/Task/revision must refer to the same authoritative execution.')
    }
  } else {
    read('RUN_OR_DISPATCH_UNVERIFIED', 'Confirm current Run/dispatch or planning-only context; never infer executable scope.', 'orchestrator')
  }

  if (validProjectId(projectId) && job?.project_id === projectId) {
    addRef('PROJECT', 'projects/' + projectId + '/PROJECT.md', null,
      'Project lifecycle, repository registry and configured integration branch')
    addRef('CRITERIA', 'projects/' + projectId + '/CRITERIA.md',
      job?.criteria_binding?.criteria_blob_sha,
      'Applicable approved product WHAT/WHY; read when required by current Task/gate')
  }
  const planningPhase = job?.planning_context?.phase
  const phase = nonempty(run?.lifecycle) ? String(run.lifecycle) :
    nonempty(planningPhase) ? String(planningPhase) : 'UNKNOWN'
  const objective = nonempty(task?.objective) ? String(task.objective) : null
  const completionCriteria = arrayOfStrings(task?.completion_criteria)
  const requiredSkills = unique(arrayOfStrings(task?.required_skills))
  const suggestedSkills = unique(arrayOfStrings(ROLE_SKILLS[role]))
  const skillRefs: Array<{ name: string; source: 'TASK_REQUIRED' | 'ROLE_SUGGESTED'; mode: 'LOAD_IF_RELEVANT' | 'CHECK_RUN_INJECTION' }> = []
  for (const name of requiredSkills) {
    // Current durable job_prepare Task schema admits only this name. Any other
    // name is a schema/Plan-change matter, not an inferred new capability.
    if (name !== 'ui-coder-frontend' || !Object.hasOwn(RUNTIME_SKILLS, name)) {
      read('TASK_SKILL_NOT_DECLARED_IN_SCHEMA', 'Required Task Skill is not admitted by current job_prepare and runtime catalog: ' + name, 'planner')
      continue
    }
    skillRefs.push({ name, source: 'TASK_REQUIRED', mode: 'CHECK_RUN_INJECTION' })
  }
  for (const name of suggestedSkills) {
    if (Object.hasOwn(RUNTIME_SKILLS, name) && !requiredSkills.includes(name)) {
      skillRefs.push({ name, source: 'ROLE_SUGGESTED', mode: 'LOAD_IF_RELEVANT' })
    }
  }
  if (input?.requires_domain_addin) {
    read('PROJECT_ADDIN_PROOF_REQUIRED',
      'Use project_role_addins_resolve and independently re-read AGENTS.md, add-in source SHA and functional Verification; path/evidence claims never grant readiness.',
      'orchestrator')
  }
  const knowledgeRefs: Ref[] = []
  for (const k of Array.isArray(input?.knowledge_refs) ? input.knowledge_refs : []) {
    if (!nonempty(k?.path) || !k.path.startsWith('projects/' + projectId + '/KNOWLEDGE/') ||
        !validSha(k?.sha) || k?.validity !== 'CURRENT') {
      read('KNOWLEDGE_REVALIDATE', 'Knowledge candidate lacks matching Project prefix, current validity or blob SHA.')
      continue
    }
    knowledgeRefs.push({ kind: 'KNOWLEDGE', path: k.path, revision: k.sha,
      reason: 'Current Project relationship/domain Knowledge; verify depends_on and supersession',
      trust: 'REQUIRES_READBACK' })
  }
  const sourceRefs: Array<{ tool: string; owner: string; facade: string; current_ref: string; trust: 'REQUIRES_READBACK' }> = []
  const tools = unique(arrayOfStrings(input?.tool_names))
  if (tools.length) {
    const loc = input?.source_locator
    if (!loc || loc.schema !== 'gsa4-a1-source-locator/v1' ||
        !Array.isArray(loc.tool_owners) ||
        !nonempty(input?.source_locator_ref) ||
        !validSha(input?.current_source_ref) ||
        input.source_locator_ref !== input.current_source_ref) {
      read('SOURCE_LOCATOR_REVALIDATE',
        'Fetch A1 locator and current target source at the same revision before selecting source owners.')
    } else {
      for (const name of tools) {
        const owner = loc.tool_owners.find((x) => x?.name === name)
        if (!owner || !safeOwner(owner.owner) || !safeOwner(owner.facade)) {
          read('SOURCE_OWNER_UNKNOWN', 'A1 index lacks requested tool ' + name + '; search live source.')
          continue
        }
        sourceRefs.push({ tool: name, owner: owner.owner, facade: owner.facade,
          current_ref: input.current_source_ref as string, trust: 'REQUIRES_READBACK' })
      }
    }
  }
  if (role === 'coder') read('CODER_WRITE_GATE_REQUIRES_LIVE_READBACK',
    'M5 Human approval, approved Criteria/Plan/Milestones, current branch, scope permission and current Git revision must be independently verified before any write.',
    'orchestrator')
  if (role === 'critic_reviewer') read('CR_HUMAN_AUTHORIZATION_REQUIRES_READBACK',
    'Critic Reviewer requires actual Human invocation or approved CRL milestone; never inferred from Job type.',
    'human')

  const decision: ContextAction = findings.some((x) => x.action === 'STOP') ? 'STOP' :
    findings.length ? 'READ_MORE' : 'REVIEW_REFERENCES'
  return {
    schema: 'gsa4-a2-task-context-recipe/v1' as const,
    advisory_only: true as const,
    execution_authorized: false as const,
    decision,
    identity: { project_id: projectId ?? null, job_id: job?.job_id ?? null,
      task_id: taskId, role, phase, planning_revision: job?.planning_revision ?? null,
      job_sha: validSha(snapshotSha) ? snapshotSha : null },
    work_position: { role, current_task: taskId, objective, specialty: 'NOT_INFERRED_FROM_TITLE' as const },
    task_context: { objective, scope: arrayOfStrings(task?.scope),
      dependencies: arrayOfStrings(task?.dependencies), completion_criteria: completionCriteria },
    required_reads: refs,
    knowledge_candidates: knowledgeRefs,
    skills: skillRefs,
    source_candidates: sourceRefs,
    findings,
    handoff: [
      'Load get_agent_harness for the actual Role; retain mandatory Shared policy.',
      'Check current Job/Task/Run, Project lifecycle and source/knowledge SHA with live readback.',
      'Use run_begin.required_skill_contexts without loading an injected Skill twice.',
      'If source/acceptance/authority changes, recompile context and READ_MORE/ASK/STOP.',
      'Reviewer and Tester independently reconstruct acceptance, changed SHA and evidence.',
    ],
  }
}
