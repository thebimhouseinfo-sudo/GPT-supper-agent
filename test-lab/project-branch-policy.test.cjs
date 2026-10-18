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
  'validIntegrationBranch', 'parseProjectManifest', 'resolveProjectRoleAddins'
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
