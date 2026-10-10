// LLC58: real runtime helper smoke for durable multi-Job Plan Change intent.
// Pure helper execution is NOT GitHub CAS, REVIEW Verification persistence or
// actual Gsa-local acceptance. Those are separate release gates.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('supabase/functions/gsa-mcp/index.ts', 'utf8');
const sf = ts.createSourceFile('index.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const uid='0fa72d63-17b4-4e28-84d9-231a17f5fe70';
const planId='79a7c63d-9b84-4b4e-a290-6cd049513ec2';
const oldId='7cd8a327-3a87-4baf-981c-4a5f28b207d1';
const newId='1f7d0cc6-5f95-48f7-8a36-35cd330693a4';
const reviewId='b996d1f7-c1d1-42d3-bf40-389e3306d4ae';
const sha='a'.repeat(40);
const contract=j=>j.execution_contract==null?'V2_STABLE':(['NEXT','V2_STABLE'].includes(j.execution_contract)?j.execution_contract:null);
const ns=j=>j.memory_namespace==='TEST_LAB'?'TEST_LAB':j.memory_namespace==='PRODUCTION'?'PRODUCTION':null;
const root=(id,c,n)=>'projects/'+id+(c==='NEXT'&&n==='TEST_LAB'?'/TEST-LAB/NEXT':'');
const verifyPath=(id,vid,c,n)=>root(id,c,n)+'/VERIFICATION/'+vid+'.json';
const getHandle=id=>'J-'+id.replace(/-/g,'').slice(-4).toUpperCase();
const deps={JSON,Number,String,Date,Set,Map,uuidv7:()=>newId,jobHandle:getHandle,
  jobExecutionContract:contract,recordNextMemoryNamespace:ns,
  executionMemoryRoot:root,verificationPath:verifyPath,
  DEFAULT_NEXT_MEMORY_NAMESPACE:'PRODUCTION'};
function load(name,extra={}){
  const dec=sf.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name);
  assert.ok(dec,'Find exact runtime helper '+name);
  const js=ts.transpileModule(dec.getText(sf),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  return vm.runInNewContext(js+'\n'+name,{...deps,...extra});
}
const assess=load('assessHumanPlanChangeJobs');
const prepare=load('prepareHumanPlanChangeIntent',{assessHumanPlanChangeJobs:assess});
const resume=load('resumeHumanPlanChangeIntent');
const ref=verifyPath(uid,reviewId,'NEXT','PRODUCTION');
const planJob={kind:'JOB',project_id:uid,job_id:planId,type:'plan',
  execution_contract:'NEXT',memory_namespace:'PRODUCTION',lifecycle:'IN_PROGRESS',
  planning_revision:2,planning_review:{status:'PASS',reviewed_revision:2,verification_ref:ref}};
const review={kind:'PLANNING_REVIEW',verification_id:reviewId,project_id:uid,
  job_id:planId,execution_contract:'NEXT',memory_namespace:'PRODUCTION',
  planning_revision:2,result:'PASS',producer:'reviewer'};
const old={kind:'JOB',project_id:uid,job_id:oldId,execution_contract:'V2_STABLE',lifecycle:'READY',planning_revision:2};
const impacted={job_record_text:JSON.stringify(old),job_record_sha:sha,decision:'REPLACE',
  reason:'Human Plan R3 changes acceptance criteria',cursor_state:'ABSENT',active_run_state:'NONE'};
const input={project_id:uid,change_ref:'docs/plans/UAR-R3.md',reviewed_plan_sha:sha,
  plan_job_record_text:JSON.stringify(planJob),plan_job_record_sha:sha,
  plan_review_record_text:JSON.stringify(review),plan_review_record_sha:sha,
  plan_review_memory_path:ref,work_branch:'main',job_snapshots:[impacted]};
function started(){return prepare(input);}
const snap=j=>({job_record_text:JSON.stringify(j),job_record_sha:sha});
const observed=(record,jobs,activity=[])=>resume({
  project_id:uid,intent_memory_path:started().intent_memory_path,
  intent_record_text:JSON.stringify(record),intent_record_sha:sha,
  current_job_snapshots:jobs.map(snap),activity,
});
test('LLC58: reviewed Plan reserves one unique replacement in append-only deterministic intent',()=>{
  const r=started();
  assert.equal(r.allowed,true);
  assert.equal(r.operation,'CREATE');
  assert.equal(r.mutation_authorized,false);
  assert.equal(r.intent_memory_path,`projects/${uid}/WORK/PLAN_RECONCILIATIONS/${planId}-r2.json`);
  const intent=JSON.parse(r.intent_record_text);
  assert.equal(intent.kind,'PLAN_RECONCILIATION_INTENT');
  assert.equal(intent.plan_review_ref,ref);
  assert.equal(intent.plan_job_sha,sha);
  assert.equal(intent.actions[0].predecessor_job_id,oldId);
  assert.equal(intent.actions[0].replacement.job_id,newId);
  assert.equal(intent.actions[0].replacement.handle,getHandle(newId));
  assert.equal(intent.actions[0].old_evidence_applicable_to_new_job,false);
});
test('LLC58: malformed or non-PASS Reviewer evidence cannot mint replacement intent',()=>{
  assert.equal(prepare({...input,plan_review_record_text:JSON.stringify({...review,result:'CHANGES_REQUIRED'})}).allowed,false);
  assert.equal(prepare({...input,plan_job_record_text:JSON.stringify({...planJob,planning_review:{status:'PENDING'}})}).allowed,false);
  assert.equal(prepare({...input,plan_review_memory_path:'projects/other/VERIFICATIONS/'+reviewId+'.json'}).allowed,false);
  assert.equal(prepare({...input,plan_job_record_text:JSON.stringify({...planJob,project_id:'bad'})}).allowed,false);
});
test('LLC58: repeated intent prepare reconciles durable path and does not mint new ID',()=>{
  const p=started();
  const r=prepare({...input,existing_intent_record_text:p.intent_record_text,existing_intent_record_sha:sha});
  assert.equal(r.allowed,true);assert.equal(r.operation,'NONE');
  assert.equal(r.intent_record_text,p.intent_record_text);
  assert.equal(prepare({...input,reviewed_plan_sha:'b'.repeat(40),
    existing_intent_record_text:p.intent_record_text,existing_intent_record_sha:sha}).reason,
    'PLAN_CHANGE_EXISTING_INTENT_CONFLICT');
});
test('LLC58: interrupt before predecessor closure; settle cursor/Run rather than replace blindly',()=>{
  const i=JSON.parse(started().intent_record_text);
  const run=observed(i,[old],[{job_id:oldId,cursor_state:'PENDING',active_run_state:'NONE'}]);
  assert.equal(run.actions[0].next_action,'RECONCILE_PENDING_SOURCE_CURSOR');
  const running=observed(i,[old],[{job_id:oldId,cursor_state:'STABLE',active_run_state:'ACTIVE'}]);
  assert.equal(running.actions[0].next_action,'SETTLE_ACTIVE_RUN');
  const ready=observed(i,[old],[{job_id:oldId,cursor_state:'ABSENT',active_run_state:'NONE'}]);
  assert.equal(ready.actions[0].next_action,'SUPERSEDE_PREDECESSOR_BY_EXACT_SHA');
  assert.equal(ready.mutation_authorized,false);
});
test('LLC58: interrupt after supersession; deterministic reserved ID prevents duplicate Job',()=>{
  const i=JSON.parse(started().intent_record_text);
  const closed={...old,lifecycle:'SUPERSEDED'};
  const none=observed(i,[closed]);
  assert.equal(none.actions[0].next_action,'CREATE_RESERVED_REPLACEMENT');
  assert.equal(none.actions[0].replacement_job_id,newId);
  const fresh={...old,job_id:newId,lifecycle:'DRAFT',replacement_of_job_id:oldId,plan_change_id:i.change_id};
  assert.equal(observed(i,[closed,fresh]).actions[0].next_action,'REVIEW_REPLACEMENT');
  assert.equal(observed(i,[closed,{...fresh,lifecycle:'READY'}]).actions[0].next_action,'REVALIDATE_DEPENDENCIES_BEFORE_DISPATCH');
});
test('LLC58: reject foreign replacement Job and terminal predecessor conflict',()=>{
  const i=JSON.parse(started().intent_record_text);
  const closed={...old,lifecycle:'SUPERSEDED'};
  assert.equal(observed(i,[closed,{...old,job_id:newId,lifecycle:'DRAFT'}]).allowed,false);
  assert.equal(observed(i,[{...old,lifecycle:'COMPLETED'}]).allowed,false);
  assert.equal(resume({project_id:uid,intent_memory_path:'bad',intent_record_text:JSON.stringify(i),
    intent_record_sha:sha,current_job_snapshots:[snap(old)]}).allowed,false);
});
test('LLC58: tool surface includes prepare, resume and governed replacement Job creation',()=>{
  for(const name of ['job_plan_change_assess','job_plan_change_prepare','job_plan_change_resume_evaluate'])
    assert.match(source,new RegExp("server\\.registerTool\\(\\s*'"+name+"'"));
  assert.match(source,/replacement_context: z\.object\(/);
  assert.match(source,/replacement_of_job_id: replacement\.predecessor\.job_id/);
});
