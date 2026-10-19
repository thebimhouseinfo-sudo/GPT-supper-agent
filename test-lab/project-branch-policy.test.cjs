'use strict'
// Source-derived behavior tests for approved Criteria 14A and M1 trust-boundary negatives.
// Execute with: NODE_PATH=<typescript module directory> node --test test-lab/project-branch-policy.test.cjs
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/index.ts'), 'utf8')
const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const parseErrors = ast.parseDiagnostics.filter(d => d.category === ts.DiagnosticCategory.Error)
assert.equal(parseErrors.length, 0, parseErrors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; '))

const names = [
  'normalizeGithubRepo', 'validMemoryPath', 'validProjectManifestPath',
  'validIntegrationBranch', 'revisedJobIntegrationBranchError', 'parseProjectManifest', 'resolveProjectRoleAddins', 'projectCriteriaBindingError', 'milestoneCrlEvidenceError', 'milestoneLoopDecision',
  'edgeFunctionSlug', 'runtimeSurface', 'nextMemoryNamespaceForRequest', 'jobCreationExecutionContractDefault'
]
const extracted = []
for (const node of ast.statements) {
  if (ts.isFunctionDeclaration(node) && names.includes(node.name?.text)) extracted.push(node.getText(ast))
  if (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === 'PROJECT_ID_PATTERN')) extracted.push(node.getText(ast))
}
for (const name of names) assert.ok(extracted.some(x => x.includes('function ' + name + '(')), 'Missing runtime function: ' + name)
assert.ok(extracted.some(x => x.includes('PROJECT_ID_PATTERN')))

const code = ts.transpileModule(extracted.join('\n\n') + '\n' +
  'globalThis.__tested = { ' + names.join(', ') + ' }', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText
const sandbox = { URL, console }
vm.runInNewContext(code, sandbox, { timeout: 2000 })
const h = sandbox.__tested
const id = '01a0f051-4353-7bff-8edf-46be4b44fd2f'
const repo = 'https://github.com/thebimhouseinfo-sudo/GPT-supper-agent'
const fixture = (front = '', rows = '- PRIMARY | OWNED | ' + repo, branches = '') =>
  '---\nproject_id: ' + id + '\nname: GSA\nlifecycle: ACTIVE\n' +
  'primary_repo_url: ' + repo + '\nrepo_url: ' + repo +
  '\nrepo_mode: SINGLE\nrepo_registry_status: CONFIRMED\n' + front +
  '\n---\n\n# Project: GSA\n\n## Repositories\n' + rows +
  '\n\n## Runtime\n- Source truth is Git\n' + branches

test('M1: canonical project path only; dot, invalid UUID, encoding, foreign project blocked', () => {
  assert.equal(h.validMemoryPath('projects/' + id + '/PROJECT.md'), true)
  assert.equal(h.validMemoryPath('projects/' + id + '/WORK/JOBS/job.json'), true)
  for (const p of [
    'projects/' + id + '/../other/PROJECT.md',
    'projects/' + id + '/./PROJECT.md',
    'projects/------------------------------------/PROJECT.md',
    'projects/' + id + '/%2e%2e/PROJECT.md',
    'projects/' + id + '/WORK\\JOBS\\foo.json',
    'projects/' + id + '/',
    'projects/' + id + '//foo',
    '../projects/' + id + '/PROJECT.md'
  ]) assert.equal(h.validMemoryPath(p), false, p)
  assert.equal(h.validProjectManifestPath('projects/' + id + '/PROJECT.md', id), true)
  assert.equal(h.validProjectManifestPath('projects/' + id + '/AGENTS.md', id), false)
  assert.equal(h.validProjectManifestPath('projects/' + id + '/PROJECT.md', '01a0d70c-9683-7324-9d3d-a8231a93c63b'), false)
})

test('C14A: real GSA development branch and release branch are parsed independently', () => {
  const p = h.parseProjectManifest(fixture(
    'development_branch: upgrade/gsa-refactor\nrelease_branch: main\nintegration_target: upgrade/gsa-refactor',
    '- PRIMARY | OWNED | ' + repo,
    '\n## Branch Policy (Human-approved)\n- PRIMARY | ' + repo + ' | development=upgrade/gsa-refactor | release=main\n'
  ))
  assert.equal(p.development_branch, 'upgrade/gsa-refactor')
  assert.equal(p.release_branch, 'main')
  assert.equal(p.branch_policy_status, 'CONFIGURED')
  assert.equal(p.branch_policies.length, 1)
})

test('C14A negative: unconfigured never falls back to main / GitHub default', () => {
  const p = h.parseProjectManifest(fixture())
  assert.equal(p.development_branch, null)
  assert.equal(p.release_branch, null)
  assert.equal(p.branch_policy_status, 'UNCONFIGURED')
})

test('C14A: multi-repository mappings do not leak across repositories', () => {
  const child = 'https://github.com/thebimhouseinfo-sudo/child-repo'
  const p = h.parseProjectManifest(fixture(
    'development_branch: upgrade/gsa-refactor\nrelease_branch: main',
    '- PRIMARY | OWNED | ' + repo + '\n- DEPENDENCY | OWNED | ' + child,
    '\n## Branch Policy (Human-approved)\n- PRIMARY | ' + repo +
    ' | development=upgrade/gsa-refactor | release=main\n- DEPENDENCY | ' + child +
    ' | development=feature/child | release=stable\n'
  ))
  assert.equal(p.repo_mode, 'MULTI')
  assert.equal(p.branch_policies.length, 2)
  assert.equal(p.branch_policies[0].development_branch, 'upgrade/gsa-refactor')
  assert.equal(p.branch_policies[1].development_branch, 'feature/child')
  assert.equal(p.branch_policies[1].release_branch, 'stable')
})

test('C14A: invalid/missing configured branch is UNCONFIGURED, not rewritten as main', () => {
  const bad = ['../main', 'branch..evil', '/foo', 'foo//bar', 'main.lock', 'foo\\bar', '', '.git/HEAD']
  for (const name of bad) assert.equal(h.validIntegrationBranch(name), false, name)
  assert.equal(h.validIntegrationBranch('upgrade/gsa-refactor'), true)
  const p = h.parseProjectManifest(fixture('development_branch: ../wrong\nrelease_branch: main'))
  assert.equal(p.development_branch, null)
  assert.equal(p.branch_policy_status, 'UNCONFIGURED')
})

test('C14A revision binding: missing, retained, newly supplied and malformed refs', () => {
  const nextCode = { type: 'code', plan_kind: 'JOB', repository_context: { integration_branch: null } }
  const existing = { ...nextCode, repository_context: { integration_branch: 'upgrade/gsa-refactor' } }
  assert.match(h.revisedJobIntegrationBranchError(nextCode, 'NEXT', undefined), /DEVELOPMENT_BRANCH_REQUIRED/)
  assert.equal(h.revisedJobIntegrationBranchError(nextCode, 'NEXT', 'upgrade/gsa-refactor'), null)
  assert.equal(h.revisedJobIntegrationBranchError(existing, 'NEXT', undefined), null)
  assert.match(h.revisedJobIntegrationBranchError(existing, 'NEXT', '../main'), /DEVELOPMENT_BRANCH_INVALID/)
  assert.match(h.revisedJobIntegrationBranchError(existing, 'NEXT', ''), /DEVELOPMENT_BRANCH_INVALID/)
  assert.match(h.revisedJobIntegrationBranchError({ ...nextCode, plan_kind: 'PROJECT_PLAN', type: 'plan' }, 'NEXT', undefined), /DEVELOPMENT_BRANCH_REQUIRED/)
  assert.equal(h.revisedJobIntegrationBranchError(nextCode, 'V2_STABLE', undefined), null, 'legacy behavior must remain')
  assert.equal(h.revisedJobIntegrationBranchError({ ...nextCode, type: 'plan' }, 'NEXT', undefined), null, 'non-Project Plan not forcibly rebound')
})

test('C14A job_revise_plan consumes and persists branch with external project/live-ref/readback gates', () => {
  const revise = source.slice(source.indexOf("'job_revise_plan',"), source.indexOf("'plan_review_record',"))
  assert.match(revise, /integration_branch: z\.string\(\)\.optional\(\)/)
  assert.match(revise, /criteria_binding, integration_branch, revision_reason/)
  assert.match(revise, /revisedJobIntegrationBranchError\(current, executionContract, integration_branch\)/)
  assert.match(revise, /integration_branch: effectiveIntegrationBranch/)
  assert.match(revise, /Human-configured Development Branch equals repository_context\.integration_branch/)
  assert.match(revise, /verify live GitHub branch/)
  assert.match(revise, /Read back the Job and verify.*repository_context\.integration_branch/)
  assert.match(revise, /planningLoopContinuationDecision\('PLAN_REVISED'/)
})

test('Contract: READY and status expose branch config; Admin requires owned repo and Git verification', () => {
  const open = source.slice(source.indexOf("'project_open',"), source.indexOf("'project_status',"))
  const status = source.slice(source.indexOf("'project_status',"), source.indexOf('const transitionTool ='))
  const prepare = source.slice(source.indexOf("'project_branch_policy_prepare',"), source.indexOf("'project_open',"))
  assert.match(open, /branch_policy_status: parsed\.branch_policy_status/)
  assert.match(open, /validProjectManifestPath\(memory_path, parsed\.project_id\)/)
  assert.match(status, /branch_policies: parsed\.branch_policies/)
  assert.match(prepare, /repo\.url\.toLowerCase\(\)/)
  assert.match(prepare, /r\.relation === 'OWNED'/)
  assert.match(prepare, /Verify the selected source repository/)
  assert.match(prepare, /human_confirmed: z\.literal\(true\)/)
  assert.match(prepare, /readback/)
})

test('M2: role-scoped addins are lazy path references, not trusted harness overrides', () => {
  const nl = String.fromCharCode(10)
  const agents = [
    '# GSA Project Agents',
    '## Coder Add-in (optional)',
    '- harness: projects/' + id + '/ADDINS/coder/harness.md',
    '- skills: projects/' + id + '/SKILLS/coder/visual-lisp.md, projects/' + id + '/SKILLS/coder/host-api.md',
    '## Tester Add-in (optional)',
    '- harness: projects/' + id + '/ADDINS/tester/harness.md',
    '- skills: none',
    '## Policy',
    'Never override the global harness',
  ].join(nl)
  const coder = h.resolveProjectRoleAddins(id, 'coder', agents)
  assert.equal(coder.status, 'READY')
  assert.equal(coder.skill_paths.length, 2)
  assert.ok(coder.harness_path.endsWith('/ADDINS/coder/harness.md'))
  const tester = h.resolveProjectRoleAddins(id, 'tester', agents)
  assert.equal(tester.status, 'READY')
  assert.equal(tester.skill_paths.length, 0)
  assert.ok(tester.harness_path.endsWith('/ADDINS/tester/harness.md'))
  const other = h.resolveProjectRoleAddins('01a0d70c-9683-7324-9d3d-a8231a93c63b', 'coder', agents)
  assert.equal(other.status, 'DENIED')
})

test('M2: empty optional addin keeps generic; traversal never becomes a skill', () => {
  const nl = String.fromCharCode(10)
  const ok = ['## Coder Add-in (optional)', '- harness: none', '- skills: none'].join(nl)
  assert.equal(h.resolveProjectRoleAddins(id, 'coder', ok).status, 'NONE')
  const bad = ['## Coder Add-in (optional)', '- harness: projects/' + id + '/../foreign/AGENTS.md', '- skills: none'].join(nl)
  assert.equal(h.resolveProjectRoleAddins(id, 'coder', bad).status, 'DENIED')
  const foreign = ['## Coder Add-in (optional)', '- harness: projects/' + id + '/CRITERIA.md', '- skills: none'].join(nl)
  assert.equal(h.resolveProjectRoleAddins(id, 'coder', foreign).status, 'DENIED')
})

test('M1/M3/M4: read-only Advisor, one Criteria, STOPCHAT and GOAL-first contract exist', () => {
  const roleMap = source.slice(source.indexOf('const ROLE_HARNESSES'), source.indexOf('const ROLE_SKILLS'))
  assert.ok(roleMap.includes('advisor: {'))
  assert.ok(roleMap.includes('Never act as Reviewer/CR'))
  assert.ok(roleMap.includes('GOAL FIRST'))
  const startup = source.slice(source.indexOf("'project_setup_prepare',"), source.indexOf("'project_role_addins_resolve',"))
  assert.ok(startup.includes('AGENTS.md'))
  assert.ok(startup.includes('Status: DRAFT'))
  assert.ok(startup.includes('CHUA_CHOT'))
  assert.ok(startup.toLowerCase().includes('same criteria.md'))
  const base = source.slice(source.indexOf('const BASE_AGENT_HARNESS'), source.indexOf('const ROLE_HARNESSES'))
  assert.ok(base.includes('STOPCHAT'))
  assert.ok(base.includes('PROJECT ADDINS'))
  assert.ok(base.includes('CRITERIA CHANGE ORDER'))
  assert.ok(base.includes('BRANCH AUTHORITY'))
})

test('M3: new Project Plan must bind exact Human-approved Criteria file and SHA', () => {
  const correct = { criteria_path: 'projects/' + id + '/CRITERIA.md', criteria_blob_sha: 'a'.repeat(40), approval_status: 'APPROVED' }
  assert.equal(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', correct), null)
  assert.ok(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', null))
  assert.ok(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', { ...correct, approval_status: 'DRAFT' }))
  assert.ok(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', { ...correct, criteria_blob_sha: 'bad' }))
  assert.ok(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', { ...correct, criteria_path: 'projects/' + id + '/OTHER.md' }))
  assert.ok(h.projectCriteriaBindingError('01a0d70c-9683-7324-9d3d-a8231a93c63b', 'PROJECT_PLAN', correct))
  assert.equal(h.projectCriteriaBindingError(id, 'JOB', null), null, 'Unrelated legacy/small Jobs must still work')
})

test('M3: Project Plan preparation and planning Reviewer preserve exact Criteria binding', () => {
  const create = source.slice(source.indexOf("'job_prepare',"), source.indexOf("'job_revise_plan',"))
  const revise = source.slice(source.indexOf("'job_revise_plan',"), source.indexOf("'plan_review_record',"))
  const review = source.slice(source.indexOf("'plan_review_record',"), source.indexOf("'start_critic_review',"))
  assert.ok(create.includes('plan_kind'))
  assert.ok(create.includes('criteria_binding: criteria_binding ?? null'))
  assert.ok(revise.includes('criteria_binding: effectiveCriteria ?? null'))
  assert.ok(review.includes('projectCriteriaBindingError'))
  assert.ok(review.includes('criteria_binding: current.criteria_binding ?? null'))
  assert.ok(review.includes('Reviewer independently fetches approved Criteria revision'))
})

test('M4: CRL requires approved milestone, current planning PASS and exact Reviewer PASS', () => {
  const review = { kind: 'REVIEW', result: 'PASS', producer: 'reviewer', project_id: id,
    job_id: '01a0f05c-3567-73d0-8a65-90da7ebbd324', planning_revision: 2, milestone_id: 'm1' }
  const job = { project_id: id, job_id: review.job_id, lifecycle: 'IN_PROGRESS', planning_revision: 2,
    planning_review: { status: 'PASS', reviewed_revision: 2 },
    milestones: [{ milestone_id: 'm1', review_loop: 'crl', human_pre_authorized: true }] }
  const snap = { path: 'projects/' + id + '/VERIFICATION/x.json', sha: 'a'.repeat(40), record_text: JSON.stringify(review) }
  assert.equal(h.milestoneCrlEvidenceError(job, 'm1', snap), null)
  assert.ok(h.milestoneCrlEvidenceError(job, 'unknown', snap))
  assert.ok(h.milestoneCrlEvidenceError({ ...job, milestones: [{ milestone_id: 'm1', review_loop: 'rl', human_pre_authorized: true }] }, 'm1', snap))
  assert.ok(h.milestoneCrlEvidenceError({ ...job, milestones: [{ milestone_id: 'm1', review_loop: 'crl', human_pre_authorized: false }] }, 'm1', snap))
  assert.ok(h.milestoneCrlEvidenceError({ ...job, planning_review: { status: 'CHANGES_REQUIRED', reviewed_revision: 2 } }, 'm1', snap))
  assert.ok(h.milestoneCrlEvidenceError(job, 'm1', { ...snap, sha: 'bad' }))
  assert.ok(h.milestoneCrlEvidenceError(job, 'm1', { ...snap, record_text: JSON.stringify({ ...review, result: 'FAIL' }) }))
  assert.ok(h.milestoneCrlEvidenceError(job, 'm1', { ...snap, record_text: JSON.stringify({ ...review, planning_revision: 1 }) }))
})

test('M4: Human CR fallback and milestone invocation record distinct provenance', () => {
  const start = source.slice(source.indexOf("'start_critic_review',"), source.indexOf("'critic_review_record',"))
  const record = source.slice(source.indexOf("'critic_review_record',"), source.indexOf("'run_begin',"))
  assert.ok(start.includes('human_invoked === true'))
  assert.ok(start.includes('milestoneCrlEvidenceError'))
  assert.ok(start.includes('PENDING_MILESTONE_EVIDENCE_READBACK'))
  assert.ok(record.includes("'APPROVED_MILESTONE'"))
  assert.ok(record.includes('Re-fetch the exact current Job SHA'))
  assert.ok(source.includes("review_loop: z.enum(['none','rl','crl'])"))
})

test('M4 loop: Reviewer FAIL repairs then re-reviews; CR FAIL returns to rl before CR again', () => {
  const job = { planning_revision: 3, planning_review: { status: 'PASS', reviewed_revision: 3 },
    milestones: [{ milestone_id: 'm', review_loop: 'crl', human_pre_authorized: true, continuation: 'AUTO' }] }
  const choose = (stage, result, tries = 0) => h.milestoneLoopDecision(job, 'm', stage, result, tries)
  assert.equal(choose('BEGIN', 'NONE').next_action, 'RUN_REVIEWER')
  assert.equal(choose('REVIEWER', 'CHANGES_REQUIRED').next_action, 'REPAIR_AND_REREVIEW')
  assert.equal(choose('REVIEWER', 'PASS').next_action, 'VERIFY_REVIEWER_PASS_THEN_CR')
  assert.equal(choose('CR', 'FAIL').next_action, 'REPAIR_AND_REREVIEW')
  assert.equal(choose('CR', 'PASS').next_action, 'CONTINUE_AUTO')
  assert.equal(choose('CR', 'FAIL', 3).next_action, 'STOP_BLOCKED')
  assert.equal(choose('CR', 'BLOCKED').resume_same_turn, false)
  assert.equal(h.milestoneLoopDecision({ ...job, milestones: [{ milestone_id: 'm', review_loop: 'crl', human_pre_authorized: false, continuation: 'AUTO' }] }, 'm', 'REVIEWER', 'PASS').next_action, 'STOP')
})

test('M4 loop: rl never starts CR and Human milestone continuation stops on PASS', () => {
  const job = { planning_revision: 1, planning_review: { status: 'PASS', reviewed_revision: 1 },
    milestones: [{ milestone_id: 'm', review_loop: 'rl', human_pre_authorized: true, continuation: 'HUMAN' }] }
  const d = h.milestoneLoopDecision(job, 'm', 'REVIEWER', 'PASS')
  assert.equal(d.next_action, 'PRESENT_RESULT')
  assert.equal(d.resume_same_turn, false)
  assert.equal(h.milestoneLoopDecision({ ...job, milestones: [{ ...job.milestones[0], continuation: 'AUTO' }] }, 'm', 'REVIEWER', 'PASS').next_action, 'CONTINUE_AUTO')
  assert.equal(h.milestoneLoopDecision(job, 'm', 'CR', 'PASS').next_action, 'STOP')
  assert.equal(h.milestoneLoopDecision({ ...job, planning_review: { status: 'CHANGES_REQUIRED', reviewed_revision: 1 } }, 'm', 'BEGIN', 'NONE').next_action, 'STOP')
})

test('M6: isolated staging slugs never inherit production execution or Memory namespace', () => {
  const req = (slug) => ({ url: 'https://example.supabase.co/functions/v1/' + slug + '/health' })
  const prod = req('gsa-mcp')
  const oldStage = req('gsa-mcp-next')
  const newStage = req('gsa-mcp-refactor-stage')
  const unknown = req('unrelated-service')
  assert.equal(h.edgeFunctionSlug(prod), 'gsa-mcp')
  assert.equal(h.runtimeSurface(prod), 'PRODUCTION')
  assert.equal(h.nextMemoryNamespaceForRequest(prod), 'PRODUCTION')
  assert.equal(h.jobCreationExecutionContractDefault(prod), 'NEXT')
  for (const r of [oldStage, newStage, unknown]) {
    assert.equal(h.runtimeSurface(r), 'STAGING_NEXT')
    assert.equal(h.nextMemoryNamespaceForRequest(r), 'TEST_LAB')
    assert.equal(h.jobCreationExecutionContractDefault(r), 'V2_STABLE')
  }
  assert.equal(h.edgeFunctionSlug(newStage), 'gsa-mcp-refactor-stage')
  assert.equal(h.edgeFunctionSlug(unknown), 'gsa-mcp-invalid')
  // Routing itself is exercised against Hono in the separate live-matcher test below.
})

test('M6: deployed Hono matcher serves exact production and isolated staging slugs only', async () => {
  const { Hono } = require('hono')
  const root = new Hono()
  const app = new Hono()
  app.get('/health', (c) => c.text('ROUTE_OK'))
  const paths = [...source.matchAll(/^\s*root\.route\('([^']+)', app\)/gm)].map(m => m[1])
  assert.equal(paths.length, 3, 'Production, legacy staging and restricted dynamic staging path must be registered')
  for (const p of paths) root.route(p, app)
  for (const slug of ['gsa-mcp', 'gsa-mcp-next', 'gsa-mcp-refactor-stage', 'gsa-mcp-test-123']) {
    const response = await root.request('https://example.supabase.co/' + slug + '/health')
    assert.equal(response.status, 200, 'Route must be reachable: ' + slug)
    assert.equal(await response.text(), 'ROUTE_OK')
  }
  for (const slug of ['unrelated-service', 'gsa-mcp-UPPER', 'not-gsa-mcp-refactor-stage']) {
    const response = await root.request('https://example.supabase.co/' + slug + '/health')
    assert.equal(response.status, 404, 'Unrelated slugs must not get GSA staging routes: ' + slug)
  }
})

test('M4: Critic harness and selftest recognize milestone Human preauthorization without generic CR auto-dispatch', () => {
  const critic = source.slice(source.indexOf('  critic_reviewer: {'), source.indexOf('  tester: {'))
  assert.ok(critic.includes('HUMAN AUTHORITY:'))
  assert.ok(critic.includes('Human-preauthorized milestone crl'))
  assert.ok(critic.includes('persisted current Reviewer PASS'))
  assert.ok(!critic.includes('must never auto-dispatch this role'))
  assert.ok(source.includes('critic_human_authority_scoped:'))
  assert.ok(source.includes('critic_harness_present:'))
  assert.ok(source.includes('Orchestrator may continue an approved AUTO milestone'))
})
