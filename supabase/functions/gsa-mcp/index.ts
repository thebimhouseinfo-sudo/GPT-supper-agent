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
import { EVIDENCE_NEED_SCHEMA, TEST_CHECKPOINT_SPEC_SCHEMA, EVIDENCE_REQUIREMENT_SCHEMA, CRITERIA_BINDING_SCHEMA, MILESTONE_SCHEMA, PLANNING_TOPOLOGY_NODE_SCHEMA, DURABLE_RECORD_SNAPSHOT_SCHEMA, PLANNING_LOOP_CONTINUATION_SCHEMA } from './planning-schemas.ts'
import { projectBootstrapExecutionError, milestoneCrlEvidenceError, validateNextPlanningModel } from './planning-preflight.ts'
import { executionCursorPath, prepareExecutionCursorDecision, resumeExecutionCursorDecision } from './cursor-decisions.ts'
import { buildProjectManifest, parseProjectManifest, renderProjectRepositoryManifest, transitionProjectManifest, PROJECT_ID_PATTERN, validMemoryPath, validProjectManifestPath, revisedJobIntegrationBranchError, resolveProjectRoleAddins, projectScopeDecision } from './project-manifest-scope.ts'



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
