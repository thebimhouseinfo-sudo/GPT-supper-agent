'use strict'
// U-D source-executed contract and negative controls. These prove the current
// GSA tool/role modules, NOT independent model/host review or a committed approval.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { loadSourceModule } = require('./helpers/harness-ts-loader.cjs')
const root = path.join(__dirname, '../supabase/functions/gsa-mcp')
const source = fs.readFileSync(path.join(root, 'critic-review-tools.ts'), 'utf8')
const parsed = ts.createSourceFile('critic-review-tools.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
assert.equal(parsed.parseDiagnostics.length, 0, 'real Critic TS must parse')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
})
assert.equal((compiled.diagnostics ?? []).filter(x => x.category === ts.DiagnosticCategory.Error).length, 0)
const moduleObject = { exports: {} }
vm.runInNewContext(compiled.outputText,
  { module: moduleObject, exports: moduleObject.exports, Date, Set, Map, JSON },
  { filename: 'critic-review-tools.ts', timeout: 2500 })
const { registerCriticReviewTools, preCodeTechnicalError } = moduleObject.exports
const { ROLE_HARNESSES, RUNTIME_SKILLS, ROLE_SKILLS, renderHarness } = loadSourceModule('harness-catalog.ts')
const p = '11111111-1111-4111-8111-111111111111'
const j = '22222222-2222-4222-8222-222222222222'
const revision = 'a'.repeat(40)
const differentRevision = 'b'.repeat(40)
const project = { project_id: p, job_id: j, planning_revision: 1,
  lifecycle: 'IN_PROGRESS', repository_context: { working_repository_url: 'https://github.com/example/project' } }
const job_record_text = JSON.stringify(project)
const findings = [{ severity: 'IMPORTANT', finding: 'Missing existing caller evidence',
  evidence: ['src/entry.ts'], suggested_followup: 'Repair one related-Task Markdown proposal' }]
const comparison = { compared_after_independent_verdict: true,
  agreement: 'NO_PRIOR_REVIEW', notes: [] }
const chain = new Proxy({}, { get: () => () => chain })
const z = new Proxy({}, { get: () => () => chain })
const clone = x => JSON.parse(JSON.stringify(x))

function setup() {
  const handlers = {}
  registerCriticReviewTools({
    z, DURABLE_RECORD_SNAPSHOT_SCHEMA: chain,
    server: { registerTool: (name, definition, handler) => { handlers[name] = { definition, handler } } },
    AUTH_SCOPES: ['scope'], authContext: async () => ({ id: 'authorized' }),
    authError: () => ({ isError: true, content: [{ type: 'text', text: 'AUTH_REQUIRED' }] }),
    req: {}, uuidv7: () => '33333333-3333-4333-8333-333333333333',
    prettyJson: value => JSON.stringify(value),
    verificationPath: () => 'projects/' + p + '/VERIFICATION/review.json',
    jobExecutionContract: job => job.job_id === j ? 'LEGACY' : null,
    invalidExecutionContract: () => ({ isError: true }),
    recordNextMemoryNamespace: () => null, DEFAULT_NEXT_MEMORY_NAMESPACE: 'projects',
    milestoneCrlEvidenceError: () => null,
  })
  return handlers
}
function inventory(tasks = ['UD-01','UD-02']) {
  return {
    proposal_ref: 'docs/precode/goal-ud.md', proposal_revision: revision,
    related_task_ids: [...tasks], reviewed_task_ids: [...tasks],
    items: [{
      path: 'src/entry.ts', action: 'MODIFY', task_ids: [...tasks],
      functions: ['EXISTING executeGoal'],
      callers: ['EXISTING application-command -> executeGoal'],
      interfaces: ['EXISTING executeGoal(Input) -> Output'],
      dependencies: ['src/existing.ts'],
      source_evidence: ['pinned source: src/entry.ts#executeGoal'],
    }],
    duplication_assessment: 'NO_UNRESOLVED_DUPLICATION',
    complexity_assessment: 'PROPORTIONATE',
  }
}
const request = (review, result='PASS') => ({
  project_id: p, job_id: j, job_record_text, planning_revision: 1,
  human_invoked: true, review_focus: 'PRE_CODE_TECHNICAL',
  result, findings: result === 'FAIL' ? findings : [],
  limitations: [], prior_review_comparison: comparison,
  target_ref: review?.proposal_ref ?? 'docs/precode/goal-ud.md',
  target_revision: 'product-source-revision',
  pre_code_review: review,
})
function error(result, expected) {
  assert.equal(result.isError, true, 'missing evidence must reject claimed Critic PASS')
  assert.match(result.content[0].text, expected)
}
test('UD-01: loaded Coder skill describes one cohesive Markdown proposal and compact small Task', async () => {
  const skill = RUNTIME_SKILLS['coding-loop'].body
  const rendered = renderHarness('coder', { includeProgressiveSkills: false })
  for (const term of ['PRE_CODE_TECHNICAL', 'ONE descriptive Markdown proposal', 'related Tasks',
    'CREATE | MODIFY | REUSE_AS_IS | KEEP | REMOVE', 'EXISTING versus PROPOSED',
    'functions', 'callers', 'interfaces', 'input/output', 'dependencies', 'host',
    'small independent Task uses a short subsection', 'no new Job, Registry, service, gate',
    'No application code before necessary review completion'])
    assert.ok(skill.includes(term), 'missing Coder guidance: ' + term)
  assert.ok(rendered.includes('U-D PRE-CODE:'))
  assert.ok(ROLE_SKILLS.coder.includes('coding-loop'), 'pre-code remains progressive')
  assert.equal(preCodeTechnicalError(inventory(['SMALL-T1'])), null)
})
test('UD-02: existing CR admission and PRE_CODE_TECHNICAL focus, no Planning Reviewer substitute', async () => {
  const tools = setup()
  assert.deepEqual(Object.keys(tools), ['start_critic_review', 'critic_review_record'])
  const start = await tools.start_critic_review.handler({
    project_id: p, job_id: j, job_record_text,
    human_invoked: true, review_focus: 'PRE_CODE_TECHNICAL',
  })
  assert.equal(start.structuredContent.authorization_source, 'HUMAN_COMMAND')
  assert.equal(start.structuredContent.review_focus, 'PRE_CODE_TECHNICAL')
  assert.match(RUNTIME_SKILLS['critic-review'].body, /PRE_CODE_TECHNICAL \(U-D\)/)
  assert.match(RUNTIME_SKILLS['critic-review'].body, /Planning Reviewer/)
  assert.ok(renderHarness('critic_reviewer').includes('U-D PRE_CODE_TECHNICAL'))
})
test('UD-03: valid whole-related Critic PASS yields reviewed inventory only in existing Verification', async () => {
  const tools = setup(), review = inventory()
  const result = await tools.critic_review_record.handler(request(review))
  assert.ok(!result.isError)
  const actual = JSON.parse(result.structuredContent.verification_record_text)
  assert.equal(actual.kind, 'CRITIC_REVIEW')
  assert.equal(actual.review_focus, 'PRE_CODE_TECHNICAL')
  assert.equal(actual.result, 'PASS')
  assert.equal(actual.proposal_revision, revision)
  assert.deepEqual(actual.reviewed_task_ids, ['UD-01','UD-02'])
  assert.equal(actual.reviewed_inventory[0].path, 'src/entry.ts')
  assert.equal(result.structuredContent.job_mutated, false)
  assert.match(result.structuredContent.external_steps.join(' '), /exact readback/)
})
test('negative: missing caller or interface blocks PRE_CODE_TECHNICAL PASS', async () => {
  const tools = setup()
  for (const [field, expected] of [['callers',/PRE_CODE_CALLER_UNDOCUMENTED/],
    ['interfaces',/PRE_CODE_INTERFACE_UNDOCUMENTED/],
    ['functions',/PRE_CODE_FUNCTION_UNDOCUMENTED/],
    ['source_evidence',/PRE_CODE_SOURCE_EVIDENCE_MISSING/]]) {
    const bad = inventory(); bad.items[0][field] = []
    assert.match(preCodeTechnicalError(bad), expected)
    error(await tools.critic_review_record.handler(request(bad)), expected)
  }
})
test('negative: partial Task coverage, duplicate files or cyclic dependencies block PASS', async () => {
  const tools = setup()
  const bad = inventory(); bad.reviewed_task_ids = ['UD-01']
  error(await tools.critic_review_record.handler(request(bad)), /PRE_CODE_WHOLE_TASK_REVIEW_MISSING/)
  const absent = inventory(); absent.items[0].task_ids = ['UD-01']
  error(await tools.critic_review_record.handler(request(absent)), /PRE_CODE_TASK_WITHOUT_FILE_COVERAGE/)
  const duplicate = inventory(); duplicate.items.push(clone(duplicate.items[0]))
  error(await tools.critic_review_record.handler(request(duplicate)), /PRE_CODE_FILE_OWNER_DUPLICATED_OR_INVALID/)
  const cycle = inventory()
  cycle.items[0].dependencies = ['src/extra.ts']
  cycle.items.push({...clone(cycle.items[0]), path:'src/extra.ts', dependencies:['src/entry.ts']})
  error(await tools.critic_review_record.handler(request(cycle)), /PRE_CODE_DEPENDENCY_CYCLE/)
})
test('negative: duplicate functionality, oversized architecture or Host risk rejects PASS', async () => {
  const tools = setup()
  const duplicated = inventory(); duplicated.duplication_assessment = 'CHANGES_REQUIRED'
  error(await tools.critic_review_record.handler(request(duplicated)), /PRE_CODE_DUPLICATED_FUNCTIONALITY_UNRESOLVED/)
  const oversized = inventory(); oversized.complexity_assessment = 'CHANGES_REQUIRED'
  error(await tools.critic_review_record.handler(request(oversized)), /PRE_CODE_DISPROPORTIONATE_COMPLEXITY/)
  const host = inventory(); host.complexity_assessment = 'HUMAN_ESCALATION'
  error(await tools.critic_review_record.handler(request(host)), /PRE_CODE_DISPROPORTIONATE_HOST_RISK/)
  assert.match(RUNTIME_SKILLS['critic-review'].body, /A second DWG in the same AutoCAD process is not crash isolation/)
})
test('UD-02 loop: CHANGES_REQUIRED existing FAIL -> corrected proposal -> independently reviewed PASS', async () => {
  const tools = setup()
  const old = inventory(); old.items[0].callers = []
  const failed = await tools.critic_review_record.handler(request(old, 'FAIL'))
  assert.ok(!failed.isError)
  const failedRecord = JSON.parse(failed.structuredContent.verification_record_text)
  assert.equal(failedRecord.result, 'FAIL')
  assert.equal(failedRecord.reviewed_inventory, undefined)
  assert.match(failed.structuredContent.external_steps.join(' '), /CHANGES_REQUIRED/)
  const repaired = inventory(); repaired.proposal_revision = differentRevision
  const passed = await tools.critic_review_record.handler(request(repaired))
  assert.ok(!passed.isError)
  const persisted = JSON.parse(passed.structuredContent.verification_record_text)
  assert.equal(persisted.proposal_revision, differentRevision)
  assert.ok(persisted.reviewed_inventory.length > 0)
  assert.equal(persisted.reviewed_inventory[0].callers.length, 1)
  assert.notEqual(persisted.proposal_revision, failedRecord.proposal_revision)
})
test('No code before review: real Coder contract requires CR readback; mutation turns oracle RED', () => {
  const coder = RUNTIME_SKILLS['coding-loop'].body + renderHarness('coder')
  const critic = RUNTIME_SKILLS['critic-review'].body + renderHarness('critic_reviewer')
  const check = text => {
    for (const term of ['No application code before necessary review completion',
      'immutable CRITIC_REVIEW Verification persistence', 'CHANGES_REQUIRED maps to the existing Critic FAIL'])
      assert.ok(text.includes(term), 'lost blocking pre-code instruction: '+term)
  }
  check(coder)
  const mutated = coder.replace('No application code before necessary review completion', '')
  assert.throws(() => check(mutated), /lost blocking pre-code instruction/)
  assert.match(critic, /no new CR authority|SAME Human cr\/crl/i)
  assert.match(critic, /Only after independent PASS\/PASS_WITH_FINDINGS/)
})
test('No new Tool/Role/gate: ordinary Critic remains backward compatible', async () => {
  const tools = setup()
  assert.deepEqual(Object.keys(tools), ['start_critic_review','critic_review_record'])
  assert.deepEqual(Object.keys(ROLE_HARNESSES), [
    'orchestrator','planner','advisor','designer','coder','reviewer','critic_reviewer','tester'])
  assert.equal(Object.keys(RUNTIME_SKILLS).length, 12)
  const result = await tools.critic_review_record.handler({
    project_id:p,job_id:j,job_record_text,planning_revision:1,human_invoked:true,
    result:'PASS', findings:[], limitations:[],prior_review_comparison:comparison,
  })
  assert.ok(!result.isError)
  const record = JSON.parse(result.structuredContent.verification_record_text)
  assert.equal(record.review_focus, undefined)
  assert.equal(record.reviewed_inventory, undefined)
  assert.equal(record.kind, 'CRITIC_REVIEW')
})
