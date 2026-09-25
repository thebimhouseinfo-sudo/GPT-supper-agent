import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'

const PROJECT_REF = 'fbyqktduoqlpbbtkghkf'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? `https://${PROJECT_REF}.supabase.co`
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const MCP_RESOURCE = `${SUPABASE_URL}/functions/v1/gsa-mcp/mcp`
const RESOURCE_METADATA = `${SUPABASE_URL}/functions/v1/gsa-mcp/.well-known/oauth-protected-resource`
const AUTH_ISSUER = `${SUPABASE_URL}/auth/v1`
const AUTH_SCOPES = ['email', 'profile']

function challenge(error = 'invalid_token', description = 'Sign in to GPT Super Agent to continue') {
  return `Bearer resource_metadata="${RESOURCE_METADATA}", scope="${AUTH_SCOPES.join(' ')}", error="${error}", error_description="${description}"`
}

function authError(description: string) {
  return {
    content: [{ type: 'text' as const, text: description }],
    isError: true,
    _meta: { 'mcp/www_authenticate': [challenge('invalid_token', description)] },
  }
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

function uuidv7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let ts = BigInt(Date.now())
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number(ts & 0xffn)
    ts >>= 8n
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join('-')
}

function projectHandle(projectId: string) {
  return 'P-' + projectId.replace(/-/g, '').slice(-4).toUpperCase()
}


function jobHandle(jobId: string) {
  return 'J-' + jobId.replace(/-/g, '').slice(-4).toUpperCase()
}

function runHandle(runId: string) {
  return 'R-' + runId.replace(/-/g, '').slice(-4).toUpperCase()
}

function recordPath(projectId: string, family: 'JOBS' | 'RUNS' | 'HANDOFFS', recordId: string) {
  return 'projects/' + projectId + '/WORK/' + family + '/' + recordId + '.json'
}

function verificationPath(projectId: string, verificationId: string) {
  return 'projects/' + projectId + '/VERIFICATION/' + verificationId + '.json'
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2) + '\n'
}

const BASE_AGENT_HARNESS = [
  'SHARED GSA OPERATING RULES',
  '- Treat the live source repository as source truth and Project Memory as the durable control plane.',
  '- Preserve unrelated or unexpected source changes as user-owned. Never stage, rewrite, revert or hide unrelated work.',
  '- Read the current target before writing. If a file changed since an earlier read, re-read it before editing.',
  '- Stay inside approved Job/Task/Run scope. Do not add opportunistic features, refactors or abstractions.',
  '- A denied or unauthorized action is a boundary, not a puzzle: never route around it through another tool, shell indirection, generated scripts, alternate APIs or configuration changes.',
  '- Prefer dedicated tools over shell-equivalent work when both exist and the dedicated tool gives clearer evidence or safer boundaries.',
  '- Run independent read/check operations in parallel only when the host supports it; dependent actions remain sequential.',
  '- When an action fails, inspect the error and revise the diagnosis before retrying. Never blind-retry the same action.',
  '- Discover repository-specific build/test/lint/typecheck commands from source/config/evidence. Never assume a conventional command merely because it is common.',
  '- Verification is evidence, not ceremony. Report failed, skipped and unavailable checks truthfully; never manufacture a green result.',
  '- Tests alone do not prove the Job goal. Compare actual changes and evidence against the Job completion criteria before success.',
  '- Agent-authored text never counts as human approval for a Human Gate, merge, release or material governance decision.',
].join('\n')

const ROLE_HARNESSES: Record<string, { authority: string[]; loop: string[]; outputs: string[]; canonical_refs: string[] }> = {
  orchestrator: {
    authority: [
      'Route work and apply lifecycle/guard checks; do not implement source.',
      'Re-read Project lifecycle before every consequential action.',
      'Choose the next role from durable topology/state rather than chat-memory inference.',
      'Do not duplicate specialist work once it has been delegated.',
    ],
    loop: [
      'Resolve Project, active Job and durable current state.',
      'Identify blockers, Human Gates, pending Handoffs and exact target revision.',
      'Choose the smallest role that owns the next outcome.',
      'Load that role harness plus only relevant skills.',
      'Start exactly one attributed Run.',
      'After the Run, persist evidence/handoff before terminal Run state.',
      'Reconstruct current status from durable records when CONTROL is absent or stale.',
    ],
    outputs: ['routing decision', 'Run dispatch', 'current status view'],
    canonical_refs: ['AGENT-HARNESSES.md', 'JOB-LIFECYCLE.md', 'DISPATCH-AND-HANDOFF.md', 'STATE-MACHINE.md'],
  },
  planner: {
    authority: [
      'Own Job objective/scope/non-goals, task topology, dependencies, completion/evidence requirements and planned gates.',
      'Read source selectively; do not implement source changes.',
      'Keep one Job finite. Materially different objectives become linked Jobs rather than silent scope expansion.',
    ],
    loop: [
      'OBSERVE: read Project contract and only enough live source to understand the requested outcome.',
      'FRAME: define objective, scope, non-goals and material assumptions.',
      'DECOMPOSE: create bounded Tasks with dependency order and explicit completion criteria.',
      'GATE: place required review/test/human checkpoints and capability requirements.',
      'CHECK: verify every Task contributes to the finite objective and no important acceptance condition is orphaned.',
      'PERSIST: create the durable Job only after the plan is internally consistent.',
    ],
    outputs: ['durable Job record', 'task topology', 'completion/evidence requirements'],
    canonical_refs: ['AGENT-HARNESSES.md', 'JOB-LIFECYCLE.md', 'EXECUTION-AND-REVIEW.md', 'CORE-RECORD-CONTRACTS.md'],
  },
  designer: {
    authority: [
      'Own visual interpretation, UI/UX coverage and Asset Requirements.',
      'Source implementation is read-only.',
      'Do not silently change product behavior or architecture.',
    ],
    loop: [
      'OBSERVE: load approved scope, product constraints and relevant current UI evidence.',
      'MODEL: identify states, devices, interactions and missing design decisions.',
      'SPECIFY: define behavior-neutral visual/interaction contract and asset requirements.',
      'COVERAGE CHECK: verify required states/devices are addressed and unresolved product decisions are surfaced.',
      'HANDOFF: return separately attributed design/asset outputs without source implementation.',
    ],
    outputs: ['design contract', 'Asset Requirement', 'design coverage evidence'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md'],
  },
  coder: {
    authority: [
      'Implement only approved Project-owned source within Job/Task/Run scope.',
      'Refine implementation HOW without silently changing approved objective, product behavior or contracts.',
      'Do not infer merge/release authority.',
      'A source-changing Run must have an explicit scope claim.',
    ],
    loop: [
      'OBSERVE: inspect live source, existing conventions and exact target revision before writing.',
      'PLAN NEXT ACTION: choose the smallest bounded edit sequence that can satisfy the current criteria.',
      'IMPLEMENT: make only scope-traceable source changes.',
      'INSPECT RESULT: read the actual diff/changed files; check for scope drift, test weakening, commented-out behavior, accidental generated files and secret leakage.',
      'VERIFY: run available repository-specific objective checks when capability is OBSERVED.',
      'GOAL RECHECK: map every completion criterion to MET/PARTIAL/NOT_MET/UNVERIFIED using actual diff/evidence.',
      'ADAPT: if a gap is fixable within scope, diagnose and loop. Material scope/contract/authority gaps stop and route instead of being invented away.',
      'HANDOFF/COMPLETE: persist evidence and any required Handoff first; terminal Run update is last.',
    ],
    outputs: ['source diff', 'Goal Recheck', 'evidence', 'handoff when another role is required'],
    canonical_refs: ['AGENT-HARNESSES.md', 'CODER-GOAL-RECHECK.md', 'EXECUTION-AND-REVIEW.md', 'STATE-MACHINE.md'],
  },
  reviewer: {
    authority: [
      'Context-isolated fresh-chat review of an exact target/revision.',
      'Source implementation is read-only; findings only, never repair source.',
      'Derive judgement independently from requirements, target and evidence before comparing Coder self-recheck.',
      'Prefer silence over speculative low-confidence findings.',
    ],
    loop: [
      'GROUND: resolve exact target revision and applicable requirements without prior-chat reasoning.',
      'INSPECT: read actual diff/changed files plus evidence; do not review only the post-change snapshot when removed behavior matters.',
      'TRACE: check correctness across changed boundaries, tests and mechanically sensitive paths.',
      'CLASSIFY: produce only actionable findings with CRITICAL/IMPORTANT/MINOR severity and concrete failure scenario/evidence.',
      'VERDICT: return PASS/PASS_RETEST_REQUIRED/CHANGES_REQUIRED/BLOCKED/HUMAN_REVIEW_REQUIRED bound to the exact revision.',
      'ROUTE: send findings back to owning work without modifying source.',
    ],
    outputs: ['review Verification record', 'findings', 'revision-bound result'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md', 'DISPATCH-AND-HANDOFF.md'],
  },
  tester: {
    authority: [
      'Source implementation is read-only.',
      'Execute practical tests only with OBSERVED capability; otherwise prepare Human Retest steps.',
      'A merely SURFACE_PRESENT tool cannot justify PASS evidence.',
    ],
    loop: [
      'GROUND: resolve exact target revision and observable acceptance behavior.',
      'CAPABILITY: determine which checks can actually be executed in this environment.',
      'EXECUTE: run practical verification only for OBSERVED capabilities; otherwise create precise Human Retest steps.',
      'INTERPRET: distinguish product failure, test-harness failure and environment limitation.',
      'RECORD: persist reproducible evidence and limitations.',
      'ROUTE: send failures causally to the active owning work.',
    ],
    outputs: ['TEST/RETEST Verification record', 'reproducible evidence', 'limitations'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md', 'STATE-MACHINE.md'],
  },
}

const ROLE_SKILLS: Record<string, string[]> = {
  orchestrator: ['delegation'],
  planner: ['job-planning', 'delegation'],
  designer: ['delegation'],
  coder: ['coding-loop', 'delegation'],
  reviewer: ['review-evidence'],
  tester: ['testing-evidence'],
}

const RUNTIME_SKILLS: Record<string, { description: string; body: string }> = {
  'job-planning': {
    description: 'Turn a user objective into one finite durable Job with bounded Tasks, dependencies, gates and acceptance evidence.',
    body: [
      '# Job Planning',
      'Use this skill only for durable Project work.',
      '',
      '1. Read the Project purpose and the exact user objective.',
      '2. Inspect only enough live source to avoid planning from false assumptions.',
      '3. State objective, scope and non-goals separately.',
      '4. Break work into Tasks that each have an observable completion criterion.',
      '5. Add dependencies only when one Task genuinely needs another Task output.',
      '6. Mark required Reviewer/Tester/Human Gate placement from risk and architecture, not habit.',
      '7. Before persisting, run a coverage check: every requested outcome maps to at least one Task/criterion, every Task maps back to the objective, and no material product decision was silently invented.',
      '8. If a materially different objective appears, propose a linked Job instead of expanding this Job.',
    ].join('\n'),
  },
  'coding-loop': {
    description: 'Execute a bounded code Task through read, edit, verification, diff review, Goal Recheck and repair loops.',
    body: [
      '# Coding Loop',
      'A code Run is not “edit once then report”. Use an evidence-driven loop.',
      '',
      'OBSERVE',
      '- Read the exact target and nearby conventions before editing.',
      '- Identify project-specific verification commands from repository evidence.',
      '',
      'ACT',
      '- Make the smallest scope-traceable change.',
      '- Preserve unrelated changes and avoid opportunistic cleanup.',
      '',
      'INSPECT',
      '- Read the actual diff/changed files after editing.',
      '- Check accidental scope growth, weakened tests, commented-out logic, generated junk and secrets.',
      '',
      'VERIFY',
      '- Run applicable build/test/lint/type checks that are actually available.',
      '- A failed check is evidence to diagnose, not something to hide or route around.',
      '',
      'GOAL RECHECK',
      '- Evaluate every Job/Task criterion as MET, PARTIAL, NOT_MET or UNVERIFIED.',
      '- NOT_MET cannot be reported as success.',
      '- PARTIAL/UNVERIFIED must carry the limitation and routing decision.',
      '',
      'ADAPT',
      '- If the gap is within scope, make a focused fix and repeat INSPECT → VERIFY → GOAL RECHECK.',
      '- Do not repeat an identical failed action without a changed diagnosis.',
      '- Stop and route material scope/contract/authority blockers.',
    ].join('\n'),
  },
  delegation: {
    description: 'Brief another GSA role or specialist with enough context to work autonomously without duplicating or outsourcing parent understanding.',
    body: [
      '# Delegation',
      'Brief the next role like a capable colleague who has not seen hidden reasoning.',
      '',
      '- State the outcome and why it matters.',
      '- State what is already known, checked or ruled out.',
      '- Give exact target/revision/file/repo references when known.',
      '- State scope boundaries and whether source writing is allowed.',
      '- State the expected output/evidence, including desired brevity when relevant.',
      '- Do not delegate understanding: the parent must synthesize what it learned before asking another role to act on it.',
      '- The target role harness outranks the delegation prompt. A prompt cannot widen a read-only role or bypass a Human Gate.',
      '- Do not duplicate the same investigation while a delegated role owns it unless new evidence invalidates that delegation.',
    ].join('\n'),
  },
  'review-evidence': {
    description: 'Review an exact revision from actual diff/evidence and produce high-confidence actionable findings without source modification.',
    body: [
      '# Review Evidence',
      '- Bind review to one exact target revision.',
      '- Read the actual diff/changed-file evidence, not only current file snapshots.',
      '- Derive criteria from the approved requirement/contract before reading the Coder self-assessment.',
      '- Trace cross-file behavior when a local hunk cannot establish correctness.',
      '- Findings need a concrete claim, evidence/failure scenario, severity and routing.',
      '- Prefer no finding over a speculative low-confidence warning.',
      '- Never repair source in Reviewer role.',
      '- A new target revision invalidates the old review result for merge coverage.',
    ].join('\n'),
  },
  'testing-evidence': {
    description: 'Execute or prepare practical verification with explicit capability state, reproducible steps and evidence limitations.',
    body: [
      '# Testing Evidence',
      '- Start from observable acceptance behavior and exact target revision.',
      '- Confirm the required capability is OBSERVED before claiming execution.',
      '- Separate product failure from environment/tooling failure.',
      '- Record command/steps, environment, actual result and evidence reference.',
      '- If execution capability is unavailable, create Human Retest steps instead of fabricating PASS.',
      '- Re-test after relevant source revision changes; evidence for an older revision does not silently transfer.',
    ].join('\n'),
  },
}

function renderHarness(role: string) {
  const h = ROLE_HARNESSES[role]
  if (!h) return null
  return [
    BASE_AGENT_HARNESS,
    '',
    'ROLE: ' + role.toUpperCase(),
    '',
    'AUTHORITY / BOUNDARIES',
    ...h.authority.map((x) => '- ' + x),
    '',
    'ROLE LOOP',
    ...h.loop.map((x, i) => (i + 1) + '. ' + x),
    '',
    'EXPECTED OUTPUTS',
    ...h.outputs.map((x) => '- ' + x),
    '',
    'PROGRESSIVE SKILLS',
    ...(ROLE_SKILLS[role] ?? []).map((x) => '- ' + x + ': load only when relevant to the current Run.'),
  ].join('\n')
}

function normalizeGithubRepo(input: string) {
  try {
    const url = new URL(input)
    if (url.hostname !== 'github.com') return null
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/')
    if (parts.length < 2 || !parts[0] || !parts[1]) return null
    const owner = parts[0]
    const name = parts[1].replace(/\.git$/, '')
    return {
      full_name: owner + '/' + name,
      url: 'https://github.com/' + owner + '/' + name,
    }
  } catch {
    return null
  }
}

function safeProjectName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').slice(0,120)
}

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
    'repo_relation: OWNED',
    'repo_url: ' + args.repoUrl,
    purpose ? 'purpose: ' + purpose : 'purpose:',
    '---',
    '',
    '# Project: ' + args.name,
    '',
    '## Repository',
    '- OWNED: ' + args.repoUrl,
    '',
    '## Runtime',
    '- Project Memory lives in the configured GSA Memory Repo.',
    '- Source truth lives in the repository above.',
    '',
  ].join('\n')
}

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
  const repo_url = values.repo_url ?? ''
  const purpose = values.purpose ?? ''
  const created_at = values.created_at ?? ''
  const updated_at = values.updated_at ?? ''
  if (!project_id || !name || !repo_url || !['ACTIVE','PAUSED','ARCHIVED'].includes(lifecycle)) return null
  return { project_id, name, lifecycle, repo_url, purpose, created_at, updated_at }
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

function validMemoryPath(path: string) {
  return /^projects\/[0-9a-fA-F-]{36}\//.test(path)
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
    { name: 'gpt-super-agent', version: '0.5.0' },
    {
      instructions: [
        'GPT Super Agent (GSA) runtime.',
        'Supabase is config-only: authenticated GSA user -> one configured GitHub Memory Repo.',
        'The configured GitHub Memory Repo is the sole durable Project Memory/control plane.',
        'Project source repositories remain separate source-code truth and are never silently used as the Memory Repo.',
        'All GSA memory writes are confined to the exact configured Memory Repo and paths under projects/<project-id>/.',
        'Never write GSA memory to any other repository. Fail closed on repo mismatch or path outside projects/<project-id>/.',
        'Use GitHub blob SHA optimistic concurrency for updates/deletes: fetch current file first, then update/delete with that exact SHA. Stale SHA must fail and trigger refetch/reconcile.',
        'User-facing fake CLI root is authoritative: PROJECT / DIRECT AGENT / SETTING / HELP. Root groups have no shortcuts.',
        'When user types gsa/ call get_cli_root and copy menu_text verbatim as the entire answer.',
        'Stable aliases: PROJECT list=ls, open=op, create=new, status=st, pause=pa, resume=rs, archive=ar, delete=rm; DIRECT AGENT planner=pl, designer=ds, coder=cd, reviewer=rv, tester=ts; SETTING GSA Account=acct, Memory Repo=repo; HELP instruction=guide, command help=help.',
        'Routing: ls/list->project_list; op/open->project_open; new/create->project_create; st/status->project_status; pa/pause->project_pause; rs/resume->project_resume; ar/archive->project_archive; rm/delete->project_delete.',
        'Direct Agent routing: pl/planner, ds/designer, cd/coder, rv/reviewer, ts/tester -> start_direct_agent.',
        'Durable Project work uses the Job runtime spine: Planner -> job_prepare -> run_begin(role) -> role execution loop -> run_complete; Coder must additionally persist GOAL_RECHECK verification before a success handoff.',
        'Before any role execution in a durable Job, call get_agent_harness for that role and follow the returned harness_text as the runtime role contract.',
        'Run records are stored under projects/<project-id>/WORK/RUNS/, Job records under WORK/JOBS/, Handoffs under WORK/HANDOFFS/, and Verification under VERIFICATION/.',
        'Persist evidence/Verification/Handoff first and terminal Run update last. A terminal Run must never reference a record that was not persisted.',
        'Setting acct -> get_profile. Setting repo -> get_memory_repo_config or set_memory_repo_config.',
        'GitHub URLs are sufficient routing context; @GitHub is optional.',
        'Do not report a command complete until returned external_steps have been executed and verified through the GitHub connector.',
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
      if (!auth) return authError('Authentication required to use GPT Super Agent.')

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
        '  • planner [pl] — Plan scope, tasks and gates.\n' +
        '  • designer [ds] — Define UI/UX and assets.\n' +
        '  • coder [cd] — Implement approved changes.\n' +
        '  • reviewer [rv] — Run context-isolated review.\n' +
        '  • tester [ts] — Verify behavior and evidence.\n\n' +
        'SETTING — Manage GSA configuration.\n' +
        '  • GSA Account [acct] — Show authenticated GSA account.\n' +
        '  • Memory Repo [repo] — View/configure GSA Memory repository.\n\n' +
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
      outputSchema: { phase: z.string(), mcp: z.string(), auth: z.string(), memory_repo: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to use GPT Super Agent.')
      const { data } = await readMemoryConfig(auth)
      const status = {
        phase: 'M2_AGENT_RUNTIME_V2',
        mcp: 'SERVER_DEPLOYED',
        auth: 'AUTHENTICATED',
        memory_repo: data?.memory_repo_full_name ? 'CONFIGURED' : 'NOT_CONFIGURED',
      }
      return { structuredContent: status, content: [{ type: 'text', text: JSON.stringify(status) }] }
    },
  )

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
      if (!auth) return authError('Authentication required to read GSA account.')
      const result = { user_id: auth.user.id, email: auth.user.email ?? null }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_memory_repo_config',
    {
      title: 'Get GSA Memory Repo configuration',
      description: 'Read the authenticated user\'s configured GitHub Memory Repo.',
      inputSchema: {},
      outputSchema: {
        configured: z.boolean(),
        memory_repo_id: z.number().nullable(),
        memory_repo_full_name: z.string().nullable(),
        memory_repo_url: z.string().nullable(),
        default_branch: z.string().nullable(),
        gsa_account_email: z.string().nullable(),
        write_scope: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to read Memory Repo configuration.')
      const { data, error } = await readMemoryConfig(auth)
      if (error) return { content: [{ type: 'text', text: 'Failed to read Memory Repo configuration: ' + error.message }], isError: true }
      const result = {
        configured: Boolean(data?.memory_repo_full_name),
        memory_repo_id: data?.memory_repo_id ?? null,
        memory_repo_full_name: data?.memory_repo_full_name ?? null,
        memory_repo_url: data?.memory_repo_url ?? null,
        default_branch: data?.default_branch ?? null,
        gsa_account_email: data?.email ?? auth.user.email ?? null,
        write_scope: data?.memory_repo_full_name
          ? 'EXACT_CONFIGURED_REPO_AND_PROJECTS_PREFIX_ONLY'
          : 'NO_MEMORY_WRITE_UNTIL_CONFIGURED',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'set_memory_repo_config',
    {
      title: 'Set GSA Memory Repo configuration',
      description: 'Persist a verified private GitHub repository as this user\'s GSA Memory Repo. GitHub connector verification must happen before calling this tool.',
      inputSchema: {
        repository_url: z.string().url(),
        repository_id: z.number().int().positive(),
        repository_full_name: z.string().min(3),
        default_branch: z.string().min(1),
        visibility: z.literal('private'),
        push_verified: z.literal(true),
      },
      outputSchema: {
        saved: z.boolean(),
        memory_repo_id: z.number(),
        memory_repo_full_name: z.string(),
        memory_repo_url: z.string(),
        default_branch: z.string(),
        write_scope: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    } as any,
    async ({ repository_url, repository_id, repository_full_name, default_branch }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to configure Memory Repo.')
      const normalized = normalizeGithubRepo(repository_url)
      if (!normalized || normalized.full_name.toLowerCase() !== String(repository_full_name).toLowerCase()) {
        return { content: [{ type: 'text', text: 'Repository URL/full-name mismatch.' }], isError: true }
      }
      const payload = {
        user_id: auth.user.id,
        email: auth.user.email ?? '',
        memory_repo_id: repository_id,
        memory_repo_full_name: normalized.full_name,
        memory_repo_url: normalized.url,
        default_branch,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await auth.supabase
        .from('user_memory_config')
        .upsert(payload, { onConflict: 'user_id' })
        .select('memory_repo_id, memory_repo_full_name, memory_repo_url, default_branch')
        .single()
      if (error) return { content: [{ type: 'text', text: 'Failed to save Memory Repo configuration: ' + error.message }], isError: true }
      const result = {
        saved: true,
        memory_repo_id: Number(data.memory_repo_id),
        memory_repo_full_name: data.memory_repo_full_name,
        memory_repo_url: data.memory_repo_url,
        default_branch: data.default_branch,
        write_scope: 'EXACT_CONFIGURED_REPO_AND_PROJECTS_PREFIX_ONLY',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'authorize_memory_mutation',
    {
      title: 'Authorize a GSA Memory Repo mutation',
      description: 'Mandatory guard before GSA writes/deletes Project Memory. Fails closed on wrong repo or path outside projects/<project-id>/.',
      inputSchema: {
        repository_full_name: z.string().min(3),
        path: z.string().min(1),
        operation: z.enum(['create', 'update', 'delete']),
        human_gate_approved: z.boolean().optional(),
      },
      outputSchema: {
        allowed: z.boolean(),
        reason: z.string(),
        configured_repo: z.string().nullable(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ repository_full_name, path, operation, human_gate_approved }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to authorize memory mutation.')
      const { data, error } = await readMemoryConfig(auth)
      if (error || !data?.memory_repo_full_name) {
        const result = { allowed: false, reason: 'Memory Repo is not configured.', configured_repo: null }
        return { structuredContent: result, content: [{ type: 'text', text: 'DENY: Memory Repo is not configured.' }] }
      }
      const sameRepo = data.memory_repo_full_name.toLowerCase() === String(repository_full_name).toLowerCase()
      const safePath = validMemoryPath(path)
      let allowed = sameRepo && safePath
      let reason = allowed ? 'Mutation is inside configured Memory Repo projects/ scope.' : 'Wrong repository or path outside projects/<project-id>/.'
      if (operation === 'delete' && human_gate_approved !== true) {
        allowed = false
        reason = 'Delete requires explicit Human Gate approval.'
      }
      const result = { allowed, reason, configured_repo: data.memory_repo_full_name }
      return { structuredContent: result, content: [{ type: 'text', text: (allowed ? 'ALLOW: ' : 'DENY: ') + reason }] }
    },
  )

  server.registerTool(
    'project_list',
    {
      title: 'List GSA Projects',
      description: 'Handler for PROJECT list / ls using the configured GitHub Memory Repo.',
      inputSchema: {},
      outputSchema: {
        memory_repo_full_name: z.string().nullable(),
        default_branch: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to list Projects.')
      const { data } = await readMemoryConfig(auth)
      const result = {
        memory_repo_full_name: data?.memory_repo_full_name ?? null,
        default_branch: data?.default_branch ?? null,
        external_steps: data?.memory_repo_full_name ? [
          'GitHub: list/fetch directory projects/ in the configured Memory Repo at default_branch.',
          'For each direct project-id directory, fetch projects/<project-id>/PROJECT.md.',
          'Include ACTIVE and PAUSED. Hide ARCHIVED unless explicitly requested.',
          'Return Project name, lifecycle and short handle. Never guess duplicate/ambiguous targets.',
        ] : ['Memory Repo is not configured. Run SETTING -> Memory Repo first.'],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_create',
    {
      title: 'Create a GSA Project',
      description: 'Handler for PROJECT create / new. Project Memory is a single PROJECT.md file under projects/<uuid>/ in the configured Memory Repo.',
      inputSchema: {
        name: z.string().min(1),
        repository_url: z.string().url(),
        purpose: z.string().optional(),
      },
      outputSchema: {
        project_id: z.string(),
        handle: z.string(),
        project_name: z.string(),
        lifecycle: z.string(),
        source_repository_url: z.string(),
        memory_repo_full_name: z.string(),
        memory_path: z.string(),
        project_manifest_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ name, repository_url, purpose }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to create a Project.')
      const source = normalizeGithubRepo(repository_url)
      if (!source) return { content: [{ type: 'text', text: 'A canonical GitHub source repository URL is required.' }], isError: true }
      const { data, error } = await readMemoryConfig(auth)
      if (error || !data?.memory_repo_full_name) {
        return { content: [{ type: 'text', text: 'Memory Repo is not configured. Configure SETTING -> Memory Repo first.' }], isError: true }
      }
      const projectId = uuidv7()
      const cleanName = safeProjectName(name)
      const now = new Date().toISOString()
      const path = 'projects/' + projectId + '/PROJECT.md'
      const manifest = buildProjectManifest({
        projectId,
        name: cleanName,
        lifecycle: 'ACTIVE',
        repoUrl: source.url,
        purpose: purpose ?? null,
        createdAt: now,
        updatedAt: now,
      })
      const result = {
        project_id: projectId,
        handle: projectHandle(projectId),
        project_name: cleanName,
        lifecycle: 'ACTIVE',
        source_repository_url: source.url,
        memory_repo_full_name: data.memory_repo_full_name,
        memory_path: path,
        project_manifest_text: manifest,
        external_steps: [
          'GitHub source repo: verify repository_url is accessible. Read-only during Project creation.',
          'Memory Repo: scan existing projects/*/PROJECT.md and reject duplicate OWNED claim for the same source repo.',
          'Call authorize_memory_mutation(operation=create, repository_full_name=memory_repo_full_name, path=memory_path). Continue only on ALLOW.',
          'GitHub Memory Repo: create_file at memory_path on configured default branch with project_manifest_text.',
          'Fetch memory_path back and verify project_id, lifecycle=ACTIVE and source repo URL. Record returned blob SHA as current revision.',
          'Do not create empty directory placeholders; Git paths materialize only when records exist.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
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
      if (!auth) return authError('Authentication required to open a Project.')
      if (!validMemoryPath(memory_path)) return { content: [{ type: 'text', text: 'Invalid Project Memory path.' }], isError: true }
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      const result = {
        project_id: parsed.project_id,
        handle: projectHandle(parsed.project_id),
        name: parsed.name,
        lifecycle: parsed.lifecycle,
        source_repository_url: parsed.repo_url,
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
        project_manifest_sha: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ project_manifest_text, project_manifest_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to show Project status.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      const result = {
        project_id: parsed.project_id,
        handle: projectHandle(parsed.project_id),
        name: parsed.name,
        lifecycle: parsed.lifecycle,
        source_repository_url: parsed.repo_url,
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
        if (!auth) return authError('Authentication required to change Project lifecycle.')
        if (!validMemoryPath(memory_path)) return { content: [{ type: 'text', text: 'Invalid Project Memory path.' }], isError: true }
        const parsed = parseProjectManifest(project_manifest_text)
        if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
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
      if (!auth) return authError('Authentication required to delete Project Memory.')
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
        role: z.enum(['orchestrator','planner','designer','coder','reviewer','tester']),
        mode: z.enum(['JOB','DIRECT_AGENT']).default('JOB'),
      },
      outputSchema: {
        role: z.string(),
        mode: z.string(),
        harness_text: z.string(),
        canonical_refs: z.array(z.string()),
        suggested_skills: z.array(z.string()),
        context_policy: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ role, mode }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to load a role harness.')
      const harness = renderHarness(role)
      if (!harness) return { content: [{ type: 'text', text: 'Unknown role harness.' }], isError: true }
      const result = {
        role,
        mode,
        harness_text: harness,
        canonical_refs: ROLE_HARNESSES[role].canonical_refs,
        suggested_skills: ROLE_SKILLS[role] ?? [],
        context_policy: role === 'reviewer'
          ? 'FRESH_CHAT_CONTEXT_ISOLATED; load exact requirements + target/revision + evidence only.'
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
      if (!auth) return authError('Authentication required to list runtime skills.')
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
        name: z.enum(['job-planning','coding-loop','delegation','review-evidence','testing-evidence']),
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
      if (!auth) return authError('Authentication required to load a runtime skill.')
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
      description: 'Planner finalization tool. Builds one finite Job record after the Planner harness has produced an approved plan.',
      inputSchema: {
        project_id: z.string().uuid(),
        type: z.enum(['plan','code','design','review']),
        objective: z.string().min(1),
        scope: z.array(z.string()).min(1),
        non_goals: z.array(z.string()).default([]),
        tasks: z.array(z.object({
          task_id: z.string().optional(),
          objective: z.string().min(1),
          scope: z.array(z.string()).default([]),
          dependencies: z.array(z.string()).default([]),
          completion_criteria: z.array(z.string()).min(1),
        })).min(1),
        completion_requirements: z.array(z.string()).min(1),
        verification_requirements: z.array(z.string()).default([]),
        review_triggers: z.array(z.string()).default([]),
      },
      outputSchema: {
        job_id: z.string(),
        handle: z.string(),
        memory_path: z.string(),
        job_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, type, objective, scope, non_goals, tasks, completion_requirements, verification_requirements, review_triggers }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to prepare a Job.')
      const { data } = await readMemoryConfig(auth)
      if (!data?.memory_repo_full_name) return { content: [{ type: 'text', text: 'Memory Repo is not configured.' }], isError: true }
      const jobId = uuidv7()
      const now = new Date().toISOString()
      const normalizedTasks = tasks.map((task: any) => ({
        task_id: task.task_id || uuidv7(),
        objective: task.objective,
        scope: task.scope ?? [],
        dependencies: task.dependencies ?? [],
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
      const record = {
        job_id: jobId,
        handle: jobHandle(jobId),
        project_id,
        type,
        objective,
        scope,
        non_goals,
        tasks: normalizedTasks,
        topology,
        dependencies: [],
        completion_requirements,
        verification_requirements,
        review_triggers,
        planning_revision: 1,
        lifecycle: 'READY',
        result: null,
        linked_job_ids: [],
        created_at: now,
        updated_at: now,
      }
      const path = recordPath(project_id, 'JOBS', jobId)
      const result = {
        job_id: jobId,
        handle: jobHandle(jobId),
        memory_path: path,
        job_record_text: prettyJson(record),
        external_steps: [
          'Re-read current PROJECT.md and require lifecycle=ACTIVE before persisting the Job.',
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path). Continue only on ALLOW.',
          'GitHub Memory Repo: create_file at memory_path with job_record_text.',
          'Fetch the new Job record back and verify job_id/project_id/lifecycle=READY.',
          'Do not modify source during Planner Job persistence.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
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
        role: z.enum(['planner','designer','coder','reviewer','tester']),
        scope_claim: z.array(z.string()).min(1),
        primary_task_id: z.string().uuid().optional(),
        affected_task_refs: z.array(z.string()).default([]),
        parent_run_id: z.string().uuid().optional(),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
        input_refs: z.array(z.string()).default([]),
      },
      outputSchema: {
        run_id: z.string(),
        handle: z.string(),
        memory_path: z.string(),
        run_record_text: z.string(),
        next_step: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, role, scope_claim, primary_task_id, affected_task_refs, parent_run_id, target_ref, target_revision, input_refs }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to begin a Run.')
      const runId = uuidv7()
      const now = new Date().toISOString()
      const record = {
        run_id: runId,
        handle: runHandle(runId),
        project_id,
        job_id,
        primary_task_id: primary_task_id ?? null,
        affected_task_refs: affected_task_refs ?? [],
        parent_run_id: parent_run_id ?? null,
        role,
        target_ref: target_ref ?? null,
        target_revision: target_revision ?? null,
        scope_claim,
        input_refs: input_refs ?? [],
        lifecycle: 'IN_PROGRESS',
        derived_condition: null,
        result: null,
        output_refs: [],
        verification_refs: [],
        handoff_ref: null,
        started_at: now,
        ended_at: null,
      }
      const path = recordPath(project_id, 'RUNS', runId)
      const result = {
        run_id: runId,
        handle: runHandle(runId),
        memory_path: path,
        run_record_text: prettyJson(record),
        next_step: 'Load get_agent_harness(role=' + role + ') and execute its loop with minimum sufficient context.',
        external_steps: [
          'Re-read current PROJECT.md and require lifecycle=ACTIVE before this consequential dispatch.',
          'Read the owning Job and require it is READY or IN_PROGRESS and the selected Task/scope is valid.',
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'GitHub Memory Repo: create_file at memory_path with run_record_text before role execution begins.',
          'For coder source writes, re-read Project lifecycle and live target revision immediately before the first write.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'goal_recheck_record',
    {
      title: 'Prepare Coder Goal Recheck evidence',
      description: 'Build append-preserving GOAL_RECHECK Verification from the Coder loop. Does not independently prove success.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        task_id: z.string().uuid().optional(),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        criteria: z.array(z.object({
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
        verification_record_text: z.string(),
        ready_for_success_handoff: z.boolean(),
        blocking_reasons: z.array(z.string()),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, job_id, run_id, task_id, target_ref, target_revision, criteria, scope_drift, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to persist Goal Recheck.')
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
        result: blocking.length ? 'CHANGES_REQUIRED' : (criteria.some((c: any) => c.result === 'PARTIAL' || c.result === 'UNVERIFIED') ? 'PASS_RETEST_REQUIRED' : 'PASS'),
        limitations: limitations ?? [],
        evidence_refs: criteria.flatMap((c: any) => c.evidence ?? []),
        criteria,
        scope_drift: scope_drift ?? [],
        created_at: new Date().toISOString(),
      }
      const path = verificationPath(project_id, verificationId)
      const result = {
        verification_id: verificationId,
        memory_path: path,
        verification_record_text: prettyJson(record),
        ready_for_success_handoff: blocking.length === 0,
        blocking_reasons: blocking,
        external_steps: [
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist this Verification record before terminal Run update.',
          blocking.length ? 'Continue the Coder loop; do not claim success while blocking_reasons remain.' : 'If topology permits, proceed to required review/test/handoff or terminal Run completion.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
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
        handoff: z.object({
          next_role: z.enum(['planner','designer','coder','reviewer','tester']),
          primary_task_id: z.string().uuid().optional(),
          target_ref: z.string().optional(),
          target_revision: z.string().optional(),
          completed_summary: z.string().min(1),
          remaining: z.array(z.string()).default([]),
          required_inputs: z.array(z.string()).default([]),
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
    async ({ project_id, job_id, run_id, role, run_record_text, run_record_sha, lifecycle, result, output_refs, verification_refs, handoff }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to complete a Run.')
      let current: any
      try { current = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Run JSON.' }], isError: true }
      }
      if (current.run_id !== run_id || current.project_id !== project_id || current.job_id !== job_id || current.role !== role || current.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'Run identity/lifecycle mismatch.' }], isError: true }
      }
      const runPath = recordPath(project_id, 'RUNS', run_id)
      let handoffId: string | null = null
      let handoffPath: string | null = null
      let handoffText: string | null = null
      if (handoff) {
        handoffId = uuidv7()
        handoffPath = recordPath(project_id, 'HANDOFFS', handoffId)
        handoffText = prettyJson({
          handoff_id: handoffId,
          project_id,
          job_id,
          source_run_id: run_id,
          next_role: handoff.next_role,
          primary_task_id: handoff.primary_task_id ?? null,
          target_ref: handoff.target_ref ?? current.target_ref ?? null,
          target_revision: handoff.target_revision ?? current.target_revision ?? null,
          completed_summary: handoff.completed_summary,
          remaining: handoff.remaining ?? [],
          required_inputs: handoff.required_inputs ?? [],
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
      description: 'Handler for pl/ds/cd/rv/ts. Direct work is ephemeral by default.',
      inputSchema: {
        role: z.enum(['planner','designer','coder','reviewer','tester']),
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
        rules: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ role, objective, target_url }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to start a Direct Agent.')
      const contracts: Record<string, { purpose: string; source_write: boolean; output: string }> = {
        planner: { purpose: 'Plan scope, tasks, dependencies and gates.', source_write: false, output: 'Plan / Project or Job proposal' },
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
      if (!auth) return authError('Authentication required to read GSA instructions.')
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
      if (!auth) return authError('Authentication required to read command help.')
      const helpText = command
        ? 'Command help requested for: ' + command + '. Use canonical aliases exactly.'
        : [
            'PROJECT: list[ls], open[op], create[new], status[st], pause[pa], resume[rs], archive[ar], delete[rm]',
            'DIRECT AGENT: planner[pl], designer[ds], coder[cd], reviewer[rv], tester[ts]',
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
  const checks = {
    uuidv7_shape: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(projectId),
    manifest_parse: Boolean(parsed && parsed.project_id === projectId && parsed.lifecycle === 'ACTIVE'),
    pause_transition: Boolean(paused && parseProjectManifest(paused.next)?.lifecycle === 'PAUSED'),
    resume_transition: Boolean(resumed && parseProjectManifest(resumed.next)?.lifecycle === 'ACTIVE'),
    memory_path_accept: validMemoryPath('projects/' + projectId + '/PROJECT.md'),
    memory_path_reject: !validMemoryPath('README.md') && !validMemoryPath('../projects/' + projectId + '/PROJECT.md'),
    repo_normalization: normalizeGithubRepo('https://github.com/example/memory.git')?.full_name === 'example/memory',
    planner_harness_present: Boolean(renderHarness('planner')?.includes('EXECUTION LOOP')),
    coder_harness_goal_recheck: Boolean(renderHarness('coder')?.includes('GOAL RECHECK')),
    base_harness_denial_boundary: BASE_AGENT_HARNESS.includes('denied or unauthorized action'),
    progressive_skill_catalog: Boolean(RUNTIME_SKILLS['coding-loop'] && RUNTIME_SKILLS['delegation']),
    coder_skill_suggested: (ROLE_SKILLS.coder ?? []).includes('coding-loop'),
    job_record_path_shape: recordPath(projectId, 'JOBS', uuidv7()).startsWith('projects/' + projectId + '/WORK/JOBS/'),
  }
  const pass = Object.values(checks).every(Boolean)
  return c.json({ pass, checks })
})

app.get('/health', (c) =>
  c.json({ ok: true, service: 'gpt-super-agent', phase: 'M2_AGENT_RUNTIME_V2', oauth: true }),
)

app.get('/.well-known/oauth-protected-resource', (c) =>
  c.json({ resource: MCP_RESOURCE, authorization_servers: [AUTH_ISSUER], scopes_supported: AUTH_SCOPES }),
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
          'WWW-Authenticate': challenge('invalid_token', 'Connect your GPT Super Agent account to continue'),
          'Cache-Control': 'no-store',
        },
      },
    )
  }
  const transport = new WebStandardStreamableHTTPServerTransport()
  const server = createServer(c.req.raw)
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

root.route('/gsa-mcp', app)
Deno.serve(root.fetch)
