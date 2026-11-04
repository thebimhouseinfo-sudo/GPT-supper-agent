'use strict'
// LLC61: deterministic current-runtime validation of AssetGen-shaped evidence.
// This cannot reproduce remote GSA Memory readback, source approvals or Host auth.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const read = file => fs.readFileSync('supabase/functions/gsa-mcp/' + file, 'utf8')
function extract(source, name) {
  const tree = ts.createSourceFile(name + '.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  assert.equal(tree.parseDiagnostics.length, 0)
  const fn = tree.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === name)
  assert.ok(fn, name + ' must exist')
  return ts.transpileModule(fn.getText(tree).replace(/^export\s+/, ''), {
    compilerOptions: {target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.None}
  }).outputText
}
const js = extract(read('project-utils.ts'),'projectCriteriaBindingError') + '\n' +
  extract(read('bootstrap.ts'),'projectBootstrapReadinessDecision') +
  '\nprojectBootstrapReadinessDecision'
const decide = vm.runInNewContext(js)
const project = '11000000-0000-4000-8000-000000000061'
const criteriaSha = 'd102ec550d8255720a8a8d4ef64efa9f80cdfa63'
const binding = {criteria_path:'projects/' + project + '/CRITERIA.md',
  criteria_blob_sha:criteriaSha, approval_status:'APPROVED'}
const plan = {planning_revision:1,planning_review:{status:'PASS',reviewed_revision:1},
  tasks:[{task_id:'NEXT-TASK',completion_criteria:['Verify the expected implementation'],dependencies:[]}],
  milestones:[{milestone_id:'M1',name:'First milestone',node_ids:['NEXT-TASK']}]}
const input = overrides => ({criteria:binding,criteria_human_approved:true,
  criteria_current_blob_sha:criteriaSha,plan,capabilities:[{task_id:'NEXT-TASK',readiness:'GENERIC_READY'}],
  ...overrides})
test('LLC61 reproduction: typed Project Plan with absent canonical binding yields original mismatch', () => {
  const result = decide(project,input({plan:{...plan,plan_kind:'PROJECT_PLAN',criteria_source_sha:criteriaSha}}))
  assert.equal(result.status,'PLAN_CRITERIA_MISMATCH')
  assert.equal(result.source_write_authorized,false)
  assert.equal(result.requires_external_readback,true)
})
test('LLC61 positive: source-reviewed brownfield Plan remains eligible without duplicate PROJECT_PLAN Job', () => {
  const result=decide(project,input())
  assert.equal(result.status,'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING')
  assert.equal(result.bootstrapped,false)
  assert.equal(result.source_write_authorized,false)
})
test('LLC61 typed Plan needs exact canonical binding, not an unverified source Criteria SHA field', () => {
  const result=decide(project,input({plan:{...plan,plan_kind:'PROJECT_PLAN',criteria_binding:binding}}))
  assert.equal(result.status,'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING')
  const mismatch=decide(project,input({plan:{...plan,plan_kind:'PROJECT_PLAN',
    criteria_binding:{...binding,criteria_blob_sha:'a'.repeat(40)}}}))
  assert.equal(mismatch.status,'PLAN_CRITERIA_MISMATCH')
})
test('LLC61 missing/mismatched Criteria and Human approval cannot be inferred', () => {
  assert.equal(decide(project,input({criteria:undefined})).status,'CRITERIA_BINDING_MISSING_OR_INVALID')
  assert.equal(decide(project,input({criteria_current_blob_sha:'b'.repeat(40)})).status,'CRITERIA_STALE_OR_UNVERIFIED')
  assert.equal(decide(project,input({criteria_human_approved:false})).status,'CRITERIA_HUMAN_APPROVAL_UNVERIFIED')
  assert.equal(decide(project,input({capabilities:[]})).status,'CAPABILITY_NOT_READY')
})
test('LLC61 checklist advisory READY never grants source write, including claimed Human execution approval', () => {
  const r=decide(project,input({human_execution_approved:true}))
  assert.equal(r.status,'BOOTSTRAP_EVIDENCE_READY_EXECUTION_APPROVAL_CLAIMED')
  assert.equal(r.source_write_authorized,false)
  const checklist=decide(project,{assessment:{criteria:'APPROVED',plan:'PASS',milestones:'PASS',coder:'READY',tester:'READY'}})
  assert.equal(checklist.status,'BOOTSTRAP_READY')
  assert.equal(checklist.source_write_authorized,false)
})
