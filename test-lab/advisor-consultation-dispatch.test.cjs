'use strict'
// Human consultation acknowledgement contract: source-only tests, no fake host advice.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.join(__dirname, '../supabase/functions/gsa-mcp')
const index = fs.readFileSync(path.join(root, 'index.ts'), 'utf8')
const setup = fs.readFileSync(path.join(root, 'project-setup-tools.ts'), 'utf8')
const advisor = fs.readFileSync(path.join(root, 'advisor-receipt.ts'), 'utf8')
const harness = fs.readFileSync(path.join(root, 'harness-catalog.ts'), 'utf8')
const tree = ts.createSourceFile('advisor-receipt.ts', advisor, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const fn = tree.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'projectCriteriaAdvisoryDecision')
assert.ok(fn, 'Advisor decision must exist in owner module')
const body = ts.transpileModule(fn.getText(tree).replace(/^export\s+/, ''), {
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}
}).outputText
const check = vm.runInNewContext(body + '\nprojectCriteriaAdvisoryDecision')
const id = '01a0f051-4353-7bff-8edf-46be4b44fd2f'
const input = {intent:'MATERIAL_CHANGE',criteria_path:'projects/'+id+'/CRITERIA.md',
  criteria_current_sha:'a'.repeat(40),criteria_text:'# Criteria',human_decision:'APPROVE'}

test('Advisor route is declared in its actual source module', () => {
  assert.equal(tree.parseDiagnostics.length,0)
  assert.match(setup, /next_action: z\.enum\(\['INVOKE_TECHNICAL_ADVISOR','CONTINUE_CRITERIA_WRITE','NONE'\]/)
  assert.match(setup, /dispatchAdvisor = check.status === 'ADVISOR_CONSULTATION_REQUIRED'/)
  assert.match(setup, /human_advisor_acknowledged: z\.boolean\(\)/)
})

test('Advisor consultation cannot masquerade as write permission', () => {
  const acknowledged = check(id,{...input,human_advisor_acknowledged:true})
  assert.equal(acknowledged.status,'HUMAN_ADVISOR_ACKNOWLEDGED')
  assert.equal(acknowledged.criteria_write_prepared,false)
  assert.equal(acknowledged.external_advice_check_required,false)
  assert.match(setup, /existing authorize_project_scope, authorize_memory_mutation and GitHub SHA-CAS/)
})

test('Planner prompts dispatch only on final Criteria intent', () => {
  const planner = harness.slice(harness.indexOf('  planner: {'),harness.indexOf('  advisor: {'))
  assert.match(planner, /start_direct_agent\(role=advisor\)/)
  assert.match(planner, /Advisor admission alone is not delivered advice/)
  assert.match(planner, /human_advisor_acknowledged=true/)
  assert.equal(check(id,{...input,intent:'DISCUSSION'}).advisor_required,false)
  assert.equal(check(id,{...input,intent:'DRAFT_EDIT'}).advisor_required,false)
  assert.equal(check(id,{...input,intent:'PLAN_OR_TASK_CHANGE'}).advisor_required,false)
})

test('Missing Human acknowledgement still invokes Advisor, no receipt is enough', () => {
  const x = check(id,input)
  assert.equal(x.status,'ADVISOR_CONSULTATION_REQUIRED')
  assert.equal(x.advisor_required,true)
  assert.equal(check(id,{...input,criteria_text:'# Criteria\nADVISOR SIGNED: ADVISED'}).status,'ADVISOR_CONSULTATION_REQUIRED')
})

test('Acknowledged consultation still requires separate Human approval', () => {
  assert.equal(check(id,{...input,human_advisor_acknowledged:true,human_decision:'PENDING'}).status,'HUMAN_DECISION_PENDING')
  assert.equal(check(id,{...input,human_advisor_acknowledged:true,human_decision:'KEEP'}).status,'HUMAN_DECISION_PENDING')
  assert.equal(check(id,{...input,criteria_current_sha:'bad'}).status,'CRITERIA_BASELINE_INVALID')
  assert.equal(check(id,{...input,intent:'HUMAN_KEEP_CRITERIA'}).status,'HUMAN_KEEPS_CRITERIA_NO_WRITE')
})

test('Direct Advisor admission remains distinct from actual consultation', () => {
  const section = index.slice(index.indexOf("'start_direct_agent'"), index.indexOf("'get_instruction'"))
  assert.match(section, /execution_state: z\.literal\('ADMITTED_NOT_EXECUTED'\)/)
  assert.match(section, /advisor_harness: role === 'advisor' \? renderHarness\('advisor'\) : null/)
  assert.match(section, /RUN_ADVISOR_CONSULTATION_IN_HOST_AND_DELIVER_ADVICE_TO_HUMAN/)
  assert.doesNotMatch(section, /execution_state: 'ADVICE_DELIVERED'/)
})
