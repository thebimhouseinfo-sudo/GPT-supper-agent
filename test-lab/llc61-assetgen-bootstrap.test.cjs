'use strict'
// LLC61 follow-up: source-bound regression tests for fresh-start AssetGen bootstrap.
// Bootstrap is document preparation, not a source-write or Job-approval gate.
const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const vm=require('node:vm')
const ts=require('typescript')
const source=fs.readFileSync('supabase/functions/gsa-mcp/bootstrap.ts','utf8')
const tree=ts.createSourceFile('bootstrap.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
assert.equal(tree.parseDiagnostics.length,0)
const fn=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='projectBootstrapReadinessDecision')
assert.ok(fn)
const code=ts.transpileModule(fn.getText(tree).replace(/^export\\s+/,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
const decide=vm.runInNewContext(code+'\nprojectBootstrapReadinessDecision')
const project='11000000-0000-4000-8000-000000000061'
const valid={criteria:'PASS',plan:'PASS',milestones:'PASS',technical_proposal:'PASS',coder:'READY',tester:'READY'}
const check=(assessment,extra={})=>decide(project,{assessment,...extra})
test('AssetGen has a fresh start from five independently assessed preparation elements',()=>{
 const r=check(valid)
 assert.equal(r.status,'BOOTSTRAP_READY')
 assert.equal(r.source_write_authorized,false)
 assert.equal(r.bootstrapped,false)
})
test('Human Bootstrap approval is not a condition or source authorization',()=>{
 assert.equal(check(valid,{human_execution_approved:false}).status,'BOOTSTRAP_READY')
 assert.equal(check(valid,{human_execution_approved:true}).source_write_authorized,false)
})
test('old Task graph/SHA/Plan kind never becomes separate Bootstrap gate',()=>{
 const legacy={plan_kind:'JOB',planning_review:{status:'PENDING'},planning_revision:0,
  tasks:[{task_id:'TASK-07',dependencies:['missing'],lifecycle:'ACTIVE'}],
  milestones:[],criteria_binding:{criteria_blob_sha:'stale'}}
 assert.equal(check(valid,{plan:legacy,criteria_current_blob_sha:'bad'}).status,'BOOTSTRAP_READY')
})
test('all five preparation failures block readiness at the appropriate item',()=>{
 for(const [key,value,status] of [
  ['criteria','PENDING','CRITERIA_NOT_READY'],
  ['plan','PENDING','PLAN_NOT_READY'],
  ['milestones','PENDING','MILESTONES_NOT_READY'],
  ['technical_proposal','PENDING','TECHNICAL_PROPOSAL_NOT_READY'],
  ['coder','PENDING','CAPABILITY_NOT_READY'],
  ['tester','PENDING','CAPABILITY_NOT_READY'],
 ]) assert.equal(check({...valid,[key]:value}).status,status)
})
test('missing assessment cannot become READY',()=>assert.equal(check(undefined).status,'CRITERIA_NOT_READY'))
