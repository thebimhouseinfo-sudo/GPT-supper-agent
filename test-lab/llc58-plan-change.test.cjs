// LLC58: execute the real reviewed-Plan impact helper; this is a helper gate,
// NOT proof that Memory Repo CAS or multi-Job replacement has run in production.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const src = fs.readFileSync('supabase/functions/gsa-mcp/index.ts', 'utf8');
const sf = ts.createSourceFile('index.ts', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const decl = sf.statements.find(x => ts.isFunctionDeclaration(x) && x.name?.text === 'assessHumanPlanChangeJobs');
assert.ok(decl, 'Runtime helper exists');
const js = ts.transpileModule(decl.getText(sf), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const assess = vm.runInNewContext(js + '\nassessHumanPlanChangeJobs', {
  JSON, Number, String, Set,
  jobExecutionContract: job => job.execution_contract == null ? 'V2_STABLE' :
    (['NEXT','V2_STABLE'].includes(job.execution_contract) ? job.execution_contract : null),
});
const pid='0fa72d63-17b4-4e28-84d9-231a17f5fe70';
const idA='0ab83640-9e7f-4e59-9b92-a06f1b789013';
const idB='d521c5d8-5a9d-44c6-845f-9ef60dcd61aa';
const sha='a'.repeat(40);
const head={project_id:pid,change_ref:'MEMORY/PLAN/REV3',reviewed_plan_sha:sha};
const job=(id,lifecycle,contract='NEXT')=>JSON.stringify({
  kind:'JOB',project_id:pid,job_id:id,execution_contract:contract,
  lifecycle,planning_revision:2,
});
const row=(id,lifecycle,decision,extra={})=>({
  job_record_text:job(id,lifecycle),job_record_sha:sha,decision,
  reason:'Human reviewed Plan changes the Job scope',...extra,
});
function one(x){return assess({...head,job_snapshots:[x]});}
test('LLC58: untouched READY and IN_PROGRESS Jobs remain KEEP',()=>{
  const out=assess({...head,job_snapshots:[row(idA,'READY','KEEP'),row(idB,'IN_PROGRESS','KEEP')]});
  assert.equal(out.allowed,true);assert.equal(out.mutation_authorized,false);
  assert.equal(out.decisions[0].next_action,'KEEP_UNCHANGED');
  assert.equal(out.decisions[1].next_action,'KEEP_UNCHANGED');
});
test('LLC58: READY replacement requires supersession and NEW unique Job ID',()=>{
  const out=one(row(idA,'READY','REPLACE'));
  assert.equal(out.allowed,true);
  assert.equal(out.decisions[0].next_action,'SUPERSEDE_AND_CREATE_NEW_UNIQUE_JOB');
  assert.equal(out.decisions[0].old_evidence_applicable_to_new_job,false);
});
test('LLC58: active Run or unresolved cursor blocks IN_PROGRESS replacement',()=>{
  for(const [cursor,run,expected] of [
    ['PENDING','TERMINAL','RECONCILE_PENDING_CURSOR_BEFORE_SUPERSEDE'],
    ['UNKNOWN','TERMINAL','RECONCILE_PENDING_CURSOR_BEFORE_SUPERSEDE'],
    ['STABLE','ACTIVE','SETTLE_ACTIVE_RUN_BEFORE_SUPERSEDE'],
    ['STABLE','UNKNOWN','SETTLE_ACTIVE_RUN_BEFORE_SUPERSEDE'],
    ['STABLE','TERMINAL','SUPERSEDE_AND_CREATE_NEW_UNIQUE_JOB'],
    ['ABSENT','NONE','SUPERSEDE_AND_CREATE_NEW_UNIQUE_JOB'],
  ]){
    const out=one(row(idA,'IN_PROGRESS','REPLACE',{cursor_state:cursor,active_run_state:run}));
    assert.equal(out.allowed,true);
    assert.equal(out.decisions[0].next_action,expected);
  }
});
test('LLC58: terminal history cannot be replaced or reactivated',()=>{
  for(const lifecycle of ['COMPLETED','CANCELLED','SUPERSEDED']){
    assert.equal(one(row(idA,lifecycle,'REPLACE')).reason,'PLAN_CHANGE_TERMINAL_JOB_CANNOT_BE_REPLACED');
    assert.equal(one(row(idA,lifecycle,'KEEP')).allowed,true);
  }
});
test('LLC58: wrong Project, Job shape, duplicate records and missing source SHA fail closed',()=>{
  assert.equal(one({...row(idA,'READY','KEEP'),job_record_text:job(idA,'READY').replace(pid,idB)}).allowed,false);
  assert.equal(one({...row(idA,'READY','KEEP'),job_record_sha:'bad'}).allowed,false);
  assert.equal(assess({...head,job_snapshots:[row(idA,'READY','KEEP'),row(idA,'READY','REPLACE')]}).reason,'PLAN_CHANGE_DUPLICATE_JOB');
  assert.equal(assess({...head,reviewed_plan_sha:'bad',job_snapshots:[row(idA,'READY','KEEP')]}).allowed,false);
});
test('LLC58: legacy identity remains V2_STABLE and requires no NEXT conversion',()=>{
  const input=row(idA,'IN_PROGRESS','REVALIDATE',{job_record_text:job(idA,'IN_PROGRESS','V2_STABLE')});
  const out=one(input);
  assert.equal(out.allowed,true);
  assert.equal(out.decisions[0].execution_contract,'V2_STABLE');
  assert.equal(out.decisions[0].next_action,'REVALIDATE_DEPENDENCIES_AND_EVIDENCE');
});
test('LLC58 negative-control: assessment NEVER authorizes mutation',()=>{
  for(const decision of ['KEEP','REVALIDATE','REPLACE','HUMAN_DECISION']){
    const out=one(row(idA,'READY',decision));
    assert.equal(out.mutation_authorized,false);
  }
  assert.match(src,/server\.registerTool\(\s*'job_plan_change_assess'/);
});
