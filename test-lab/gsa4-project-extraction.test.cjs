'use strict'
// GSA4 A0-P: source parity with explicitly reviewed Bootstrap-v5 tool contract deltas and executable registration/auth checks.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { spawnSync } = require('node:child_process')
const ts = require('typescript')

const root = path.resolve(__dirname, '../supabase/functions/gsa-mcp')
const parent = path.join(root, 'project-setup-tools.ts')
const baseSHA = '6b352a3a1f9b791564b4e8b1682af875adf73da7'
const repoPath = 'supabase/functions/gsa-mcp/project-setup-tools.ts'
const expected = [
  {
    "name": "project_setup_prepare",
    "file": "setup.ts",
    "fn": "registerProjectSetupPrepare",
    "length": 8248,
    "hash": "1588fcc1",
    "auth": "Authentication required to prepare Project setup."
  },
  {
    "name": "project_criteria_advice_check",
    "file": "criteria-advice.ts",
    "fn": "registerProjectCriteriaAdviceCheck",
    "length": 3459,
    "hash": "ceef7867",
    "auth": "Authentication required for Criteria advice check."
  },
  {
    "name": "project_role_addins_resolve",
    "file": "role-addins.ts",
    "fn": "registerProjectRoleAddinsResolve",
    "length": 4405,
    "hash": "d7f7937c",
    "auth": "Authentication required to resolve Project add-ins."
  },
  {
    "name": "project_bootstrap_checklist_prepare",
    "file": "bootstrap-checklist.ts",
    "fn": "registerProjectBootstrapChecklistPrepare",
    "length": 3257,
    "hash": "12258be8",
    "auth": "Authentication required for Bootstrap checklist."
  },
  {
    "name": "project_bootstrap_readiness_prepare",
    "file": "bootstrap-readiness.ts",
    "fn": "registerProjectBootstrapReadinessPrepare",
    "length": 3576,
    "hash": "bef97a0a",
    "auth": "Authentication required for Project Bootstrap readiness."
  },
  {
    "name": "project_branch_policy_prepare",
    "file": "branch-policy.ts",
    "fn": "registerProjectBranchPolicyPrepare",
    "length": 5876,
    "hash": "26732bfd",
    "auth": "Authentication required to prepare branch policy."
  }
]

const read = p => fs.readFileSync(p, 'utf8')
const facade = read(parent)
function fnv32(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h.toString(16).padStart(8, '0')
}
function srcBlock(src) {
  const pos = src.indexOf('  server.registerTool(')
  assert.ok(pos >= 0, 'missing registration')
  const end = src.lastIndexOf('\n}')
  assert.ok(end > pos, 'missing module function terminator')
  return src.slice(pos, end).trimEnd()
}
function parseTS(file, src) {
  const ast = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length, 0, file + ' TypeScript parse errors')
}
test('A0-P facade and leaves preserve six tools, owner order, and exact original source', () => {
  parseTS(parent, facade)
  assert.equal([...facade.matchAll(/\bserver\.registerTool\(/g)].length, 0)
  assert.deepEqual(
    [...facade.matchAll(/^  (registerProject\w+)\(deps\)$/gm)].map(m => m[1]),
    expected.map(e => e.fn),
    'facade registration order changed',
  )
  let total = 0
  for (const e of expected) {
    const leafPath = path.join(root, 'project-setup', e.file)
    const src = read(leafPath)
    parseTS(leafPath, src)
    assert.ok(facade.includes("import { " + e.fn + " } from './project-setup/" + e.file + "'"))
    assert.ok(src.includes('export function ' + e.fn + '(deps: any)'))
    const tools = [...src.matchAll(/\bserver\.registerTool\(\s*['"]([^'"]+)['"]/g)].map(m => m[1])
    assert.deepEqual(tools, [e.name], 'registration ownership drift: ' + e.file)
    total += tools.length
    const block = srcBlock(src)
    assert.equal(block.length, e.length, 'moved code length drift: ' + e.file)
    assert.equal(fnv32(block), e.hash, 'moved code differs from original pinned GSA3 source: ' + e.file)
    assert.notEqual(fnv32(block + ' '), e.hash, 'mutation oracle must fail closed')
  }
  assert.equal(total, 6)
})
function loadCode(src, file, cache) {
  if (cache.has(file)) return cache.get(file)
  const transpiled = ts.transpileModule(src, {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  })
  assert.equal((transpiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, file + ' transpilation error')
  const mod = { exports: {} }
  cache.set(file, mod.exports)
  const requireRelative = specifier => {
    assert.ok(specifier.startsWith('./'), 'unexpected external dependency: ' + specifier)
    const target = path.resolve(path.dirname(file), specifier)
    assert.ok(target.startsWith(root + path.sep), 'import escaped gsa-mcp root')
    return loadCode(read(target), target, cache)
  }
  vm.runInNewContext(transpiled.outputText, {
    module: mod, exports: mod.exports, require: requireRelative, console,
  }, { filename: file, timeout: 2000 })
  return mod.exports
}
function loadNew() {
  return loadCode(facade, parent, new Map()).registerProjectSetupTools
}
function loadOriginal(src) {
  return loadCode(src, path.join(root, '__original_project_setup_tools.ts'), new Map()).registerProjectSetupTools
}
const z = new Proxy(function schema() { return z }, {
  get() { return z },
  apply() { return z },
})
const projectId = '11111111-1111-4111-8111-111111111111'
const repoUrl = 'https://github.com/acme/example'
function makeDeps(authenticated, overrides = {}) {
  const registered = new Map()
  const deps = {
    server: { registerTool(name, schema, callback) {
      assert.ok(!registered.has(name), 'duplicate MCP registration: ' + name)
      registered.set(name, { schema, callback })
    } },
    z, req: { marker: 'test' }, AUTH_SCOPES: ['test.read'],
    authContext: async () => authenticated ? { sub: 'test-user' } : null,
    authError: (_req, message) => ({ content: [{ type: 'text', text: message }], isError: true }),
    parseProjectManifest: () => null,
    validProjectManifestPath: () => true,
    resolveProjectCriteriaIntake: () => ({ disposition: 'CREATE_DRAFT_IF_ABSENT', review: 'test-intake', source_derived: false }),
    projectCriteriaAdvisoryDecision: () => ({ status: 'ADVISOR_CONSULTATION_REQUIRED', advisor_required: true }),
    resolveProjectRoleAddins: () => ({ status: 'DENIED', reason: 'fixture add-in denial' }),
    projectTaskCapabilityAssessment: () => ({ readiness: 'GENERIC_READY', ready_for_task: true, matched_evidence_refs: [] }),
    projectBootstrapChecklistDecision: () => ({ status: 'FIXTURE_CHECKLIST', next_action: 'INSPECT' }),
    projectBootstrapReadinessDecision: () => ({ status: 'FIXTURE_READINESS', bootstrapped: false, source_write_authorized: false }),
    normalizeGithubRepo: () => ({ url: repoUrl }),
    formatAdvisorAdviceReceipt: () => '',
    parseAdvisorAdviceReceipts: () => [],
    projectCriteriaBindingError: () => null,
    validIntegrationBranch: () => true,
    CRITERIA_BINDING_SCHEMA: z,
    isRetiredSourceBranch: () => false,
    PROJECT_ID_PATTERN: /^[0-9a-f-]{36}$/,
    ...overrides,
  }
  return { deps, registered }
}
function register(loader, authenticated, overrides = {}) {
  const obj = makeDeps(authenticated, overrides)
  loader(obj.deps)
  assert.deepEqual([...obj.registered.keys()], expected.map(e => e.name))
  return obj.registered
}
function serial(value) {
  return JSON.parse(JSON.stringify(value))
}
function getCaseInputs() {
  return [
    {},
    { project_id: projectId, agents_path: 'projects/' + projectId + '/AGENTS.md', agents_text: '', role: 'coder' },
    { project_id: projectId, memory_path: 'projects/' + projectId + '/PROJECT.md', project_manifest_text: '---\n---' },
  ]
}
test('A0-P registration is executable; missing-auth errors stay exact across all six tools', async () => {
  const registered = register(loadNew(), false)
  for (const e of expected) {
    const result = await registered.get(e.name).callback({})
    assert.equal(result.isError, true, e.name)
    assert.equal(result.content[0].text, e.auth, e.name)
  }
})
test('A0-P malformed identity, Role add-in denial, Advisor and Bootstrap behaviors remain reachable', async () => {
  const r = register(loadNew(), true)
  const setup = await r.get('project_setup_prepare').callback({})
  assert.equal(setup.isError, true)
  assert.equal(setup.content[0].text, 'Fresh Start requires the exact ACTIVE Project manifest and canonical PROJECT.md path.')
  const role = await r.get('project_role_addins_resolve').callback({
    project_id: projectId, agents_path: 'projects/' + projectId + '/AGENTS.md', role: 'coder',
  })
  assert.equal(role.isError, true)
  assert.equal(role.content[0].text, 'fixture add-in denial')
  const branch = await r.get('project_branch_policy_prepare').callback({})
  assert.equal(branch.isError, true)
  assert.equal(branch.content[0].text, 'Invalid Project identity/path or missing Human confirmation.')
  const advisor = await r.get('project_criteria_advice_check').callback({ project_id: projectId })
  assert.equal(advisor.structuredContent.next_action, 'INVOKE_TECHNICAL_ADVISOR')
  assert.equal(advisor.content[0].text, JSON.stringify(advisor.structuredContent))
  const checklist = await r.get('project_bootstrap_checklist_prepare').callback({})
  assert.equal(checklist.structuredContent.status, 'FIXTURE_CHECKLIST')
  const readiness = await r.get('project_bootstrap_readiness_prepare').callback({ project_id: projectId })
  assert.equal(readiness.structuredContent.status, 'FIXTURE_READINESS')
  assert.equal(readiness.structuredContent.source_write_authorized, false)
})
test('A0-P retired branch is still rejected before PROJECT.md mutation', async () => {
  const manifest = {
    project_id: projectId, lifecycle: 'ACTIVE', name: 'Fixture', primary_repo_url: repoUrl,
    repositories: [{ url: repoUrl, relation: 'OWNED', role: 'PRIMARY' }],
    branch_policies: [{ repository_url: repoUrl, development_branch: 'dev', release_branch: null }],
    retired_branches: [],
  }
  const registered = register(loadNew(), true, {
    parseProjectManifest: () => manifest,
    isRetiredSourceBranch: () => true,
  })
  const result = await registered.get('project_branch_policy_prepare').callback({
    memory_path: 'projects/' + projectId + '/PROJECT.md',
    project_manifest_text: '---\nproject_id: ' + projectId + '\n---\n',
    repository_url: repoUrl, development_branch: 'retired', release_branch: null,
    human_confirmed: true,
  })
  assert.equal(result.isError, true)
  assert.equal(result.content[0].text, 'BRANCH_RETIRED: a retired source branch cannot be selected as Development or Release Branch.')
})
const baseline = spawnSync('git', ['show', baseSHA + ':' + repoPath], {
  cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
})
const baselineSource = baseline.status === 0 && baseline.stdout.includes('registerProjectSetupTools') ? baseline.stdout : null
test('A0-P original GSA3 vs extracted runtime source/response parity (when base history exists)', {
  skip: baselineSource ? false : 'exact base commit unavailable in checkout history; original blocks pinned by fingerprints above',
}, async () => {
  const oldLoader = loadOriginal(baselineSource)
  const newLoader = loadNew()
  for (const auth of [false, true]) {
    const before = register(oldLoader, auth)
    const after = register(newLoader, auth)
    for (const e of expected) {
      assert.equal(before.get(e.name).schema.title, after.get(e.name).schema.title)
      assert.equal(before.get(e.name).schema.description, after.get(e.name).schema.description)
      assert.deepEqual(serial(before.get(e.name).schema.annotations), serial(after.get(e.name).schema.annotations))
      assert.deepEqual(serial(before.get(e.name).schema.securitySchemes), serial(after.get(e.name).schema.securitySchemes))
      for (const input of getCaseInputs()) {
        const oldResult = await before.get(e.name).callback(input)
        const newResult = await after.get(e.name).callback(input)
        assert.deepEqual(serial(newResult), serial(oldResult), e.name + ' response differs at auth=' + auth)
      }
    }
  }
})
