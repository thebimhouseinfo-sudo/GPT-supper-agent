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
// Historical Job records have no kind discriminator; inject the real source
// compatibility predicate rather than a test-only approximation.
deps.isRecognizedJobRecordShape=load('isRecognizedJobRecordShape');
const assess=load('assessHumanPlanChangeJobs');
const prepare=load('prepareHumanPlanChangeIntent',{assessHumanPlanChangeJobs:assess});
const resume=load('resumeHumanPlanChangeIntent');
const validateSupersession=load('validatePlanChangeSupersession');
const prepareFence=load('prepareHumanPlanChangeFenceDecision');
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
const fenceInput=(job=old,currentSha=sha)=>({
  project_id:uid,job_id:oldId,job_record_text:JSON.stringify(job),
  job_record_sha:currentSha,intent_record_text:started().intent_record_text,
  intent_record_sha:sha,intent_memory_path:started().intent_memory_path,
});
const fencedJob=()=>prepareFence(fenceInput()).record;
const closedJob=intent=>({...fencedJob(),lifecycle:'SUPERSEDED',
  superseded_by_plan_change_id:intent.change_id,superseded_by_replacement_job_id:newId});
const snap=(j,hash=sha)=>({job_record_text:JSON.stringify(j),job_record_sha:hash});
const observed=(record,jobs,activity=[],currentShas={})=>resume({
  project_id:uid,intent_memory_path:started().intent_memory_path,
  intent_record_text:JSON.stringify(record),intent_record_sha:sha,
  current_job_snapshots:jobs.map(j=>snap(j,currentShas[j.job_id]??sha)),activity,
});
test('LLC58: original GSA Local Job and Planning Review legacy schema can start reviewed reconciliation',()=>{
  // Reproduces J-9067 structural facts without copying private Job contents:
  // missing kind, execution_contract and namespace on both historical records.
  const historicalPlan={...planJob};
  delete historicalPlan.kind;
  delete historicalPlan.execution_contract;
  delete historicalPlan.memory_namespace;
  const oldReview={...review};
  delete oldReview.execution_contract;
  delete oldReview.memory_namespace;
  const historicalJob={...old};
  delete historicalJob.kind;
  delete historicalJob.execution_contract;
  historicalJob.type='plan';
  const historicalRef=verifyPath(uid,reviewId,'V2_STABLE','PRODUCTION');
  historicalPlan.planning_review={...planJob.planning_review,verification_ref:historicalRef};
  const legacy=prepare({
    ...input,
    plan_job_record_text:JSON.stringify(historicalPlan),
    plan_review_record_text:JSON.stringify(oldReview),
    plan_review_memory_path:historicalRef,
    job_snapshots:[{...impacted,job_record_text:JSON.stringify(historicalJob)}],
  });
  assert.equal(legacy.allowed,true);
  const intent=JSON.parse(legacy.intent_record_text);
  assert.equal(intent.execution_contract,'V2_STABLE');
  assert.equal(intent.plan_review_ref,historicalRef);
  assert.equal(intent.actions[0].predecessor_execution_contract,'V2_STABLE');
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
test('LLC58: already-persisted intent is reused after predecessor becomes SUPERSEDED',()=>{
  const p=started();
  const closed=closedJob(JSON.parse(p.intent_record_text));
  const x=prepare({...input,job_snapshots:[{...impacted,job_record_text:JSON.stringify(closed)}],
    existing_intent_record_text:p.intent_record_text,existing_intent_record_sha:sha});
  assert.equal(x.allowed,true);
  assert.equal(x.operation,'NONE');
  assert.equal(x.intent_record_text,p.intent_record_text);
});
test('LLC58: fence predecessor before reconciling pending source cursor and active Runs',()=>{
  const intent=JSON.parse(started().intent_record_text);
  const unfenced=observed(intent,[old],[{job_id:oldId,cursor_state:'PENDING',active_run_state:'ACTIVE'}]);
  assert.equal(unfenced.actions[0].next_action,'FENCE_PREDECESSOR_BY_EXACT_SHA');
  const fence=prepareFence(fenceInput());
  assert.equal(fence.allowed,true);
  assert.equal(fence.operation,'UPDATE');
  assert.equal(fence.mutation_authorized,false);
  assert.equal(fence.record.plan_change_pending.original_job_sha,sha);
  assert.equal(fence.record.plan_change_pending.replacement_job_id,newId);
  const fenced=fence.record;
  const currentShas={[oldId]:'b'.repeat(40)};
  const pending=observed(intent,[fenced],[{job_id:oldId,cursor_state:'PENDING',active_run_state:'NONE'}],currentShas);
  assert.equal(pending.actions[0].next_action,'RECONCILE_PENDING_SOURCE_CURSOR');
  const running=observed(intent,[fenced],[{job_id:oldId,cursor_state:'STABLE',active_run_state:'ACTIVE'}],currentShas);
  assert.equal(running.actions[0].next_action,'SETTLE_ACTIVE_RUN');
  const ready=observed(intent,[fenced],[{job_id:oldId,cursor_state:'ABSENT',active_run_state:'NONE'}],currentShas);
  assert.equal(ready.actions[0].next_action,'SUPERSEDE_PREDECESSOR_BY_EXACT_SHA');
  assert.equal(ready.mutation_authorized,false);
  const retry=prepareFence(fenceInput(fenced,'b'.repeat(40)));
  assert.equal(retry.allowed,true);
  assert.equal(retry.operation,'NONE');
  assert.equal(prepareFence(fenceInput(old,'b'.repeat(40))).allowed,false);
});
test('LLC58: interrupt after supersession; deterministic reserved ID prevents duplicate Job',()=>{
  const i=JSON.parse(started().intent_record_text);
  const closed=closedJob(i);
  const none=observed(i,[closed]);
  assert.equal(none.actions[0].next_action,'CREATE_RESERVED_REPLACEMENT');
  assert.equal(none.actions[0].replacement_job_id,newId);
  const fresh={...old,job_id:newId,lifecycle:'DRAFT',replacement_of_job_id:oldId,plan_change_id:i.change_id};
  assert.equal(observed(i,[closed,fresh]).actions[0].next_action,'REVIEW_REPLACEMENT');
  assert.equal(observed(i,[closed,{...fresh,lifecycle:'READY'}]).actions[0].next_action,'REVALIDATE_DEPENDENCIES_BEFORE_DISPATCH');
});
test('LLC58: reject foreign replacement Job and terminal predecessor conflict',()=>{
  const i=JSON.parse(started().intent_record_text);
  const closed=closedJob(i);
  assert.equal(observed(i,[closed,{...old,job_id:newId,lifecycle:'DRAFT'}]).allowed,false);
  assert.equal(observed(i,[{...old,lifecycle:'COMPLETED'}]).allowed,false);
  assert.equal(resume({project_id:uid,intent_memory_path:'bad',intent_record_text:JSON.stringify(i),
    intent_record_sha:sha,current_job_snapshots:[snap(old)]}).allowed,false);
});

test('LLC58: exact reviewed Plan intent binds SUPERSEDED transition to source Job snapshot',()=>{
  const prepared=started();
  const intent=JSON.parse(prepared.intent_record_text);
  const baseline={
    project_id:uid,intent_record_text:prepared.intent_record_text,
    intent_record_sha:sha,intent_memory_path:prepared.intent_memory_path,
    predecessor_job:fencedJob(),predecessor_job_sha:'b'.repeat(40),
    cursor_state:'ABSENT',active_run_state:'NONE',
  };
  const pass=validateSupersession(baseline);
  assert.equal(pass.allowed,true);
  assert.equal(pass.action.predecessor_job_id,oldId);
  assert.equal(pass.action.replacement.job_id,newId);
  assert.equal(pass.mutation_authorized,false);
  for (const bad of [
    {...baseline,predecessor_job_sha:'invalid'},
    {...baseline,predecessor_job:{...fencedJob(),plan_change_pending:{...fencedJob().plan_change_pending,original_job_sha:'c'.repeat(40)}}},
    {...baseline,predecessor_job:{...fencedJob(),planning_revision:3}},
    {...baseline,predecessor_job:{...fencedJob(),lifecycle:'COMPLETED'}},
    {...baseline,predecessor_job:{...fencedJob(),job_id:newId}},
    {...baseline,predecessor_job:old},
    {...baseline,intent_memory_path:'projects/other/WORK/PLAN_RECONCILIATIONS/x.json'},
    {...baseline,cursor_state:'PENDING'},
    {...baseline,cursor_state:'UNKNOWN'},
    {...baseline,active_run_state:'ACTIVE'},
    {...baseline,active_run_state:'UNKNOWN'},
  ]) assert.equal(validateSupersession(bad).allowed,false);
  assert.equal(intent.actions[0].decision,'REPLACE');
});
test('LLC58: concurrent change to predecessor SHA blocks resume, unrelated supersession cannot masquerade as this Plan',()=>{
  const i=JSON.parse(started().intent_record_text);
  const changed={job_record_text:JSON.stringify(old),job_record_sha:'b'.repeat(40)};
  const stale=resume({
    project_id:uid,intent_memory_path:started().intent_memory_path,intent_record_text:JSON.stringify(i),
    intent_record_sha:sha,current_job_snapshots:[changed],
    activity:[{job_id:oldId,cursor_state:'ABSENT',active_run_state:'NONE'}],
  });
  assert.equal(stale.allowed,false);
  assert.equal(stale.reason,'PLAN_CHANGE_PREDECESSOR_SHA_DRIFT');
  assert.equal(observed(i,[{...old,lifecycle:'SUPERSEDED'}]).reason,
    'PLAN_CHANGE_PREDECESSOR_SUPERSESSION_LINEAGE_CONFLICT');
});
test('LLC58 test-validity: removing predecessor-SHA guard changes the negative result',()=>{
  const dec=sf.statements.find(x=>ts.isFunctionDeclaration(x) && x.name?.text==='validatePlanChangeSupersession');
  const real=dec.getText(sf);
  const needle='fence.original_job_sha !== a.predecessor_job_sha';
  assert.ok(real.includes(needle),'Mutation must target executed source guard, not an irrelevant string');
  const broken=real.replace(needle,'false');
  const js=ts.transpileModule(broken,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const mutant=vm.runInNewContext(js+'\nvalidatePlanChangeSupersession',deps);
  const prepared=started();
  const input={
    project_id:uid,intent_record_text:prepared.intent_record_text,intent_record_sha:sha,
    intent_memory_path:prepared.intent_memory_path,
    predecessor_job:{...fencedJob(),plan_change_pending:{...fencedJob().plan_change_pending,original_job_sha:'b'.repeat(40)}},
    predecessor_job_sha:'c'.repeat(40),
    cursor_state:'ABSENT',active_run_state:'NONE',
  };
  const valid=validateSupersession({...input,predecessor_job:fencedJob()});
  assert.equal(valid.allowed,true);
  assert.equal(validateSupersession(input).allowed,false);
  assert.equal(mutant(input).allowed,true,
    'Deliberately broken predicate would accept the stale Job; correct test must catch it');
});
test('LLC58: tool surface includes prepare, resume and governed replacement Job creation',()=>{
  for(const name of ['job_plan_change_assess','job_plan_change_prepare','job_plan_change_resume_evaluate'])
    assert.match(source,new RegExp("server\\.registerTool\\(\\s*'"+name+"'"));
  assert.match(source,/replacement_context: z\.object\(/);
  assert.match(source,/replacement_of_job_id: replacement\.predecessor\.job_id/);
});


// RETIRED is a real LLC58 decision (no replacement ID or child Job), not a Git branch status.
const retiredImpact = {...impacted,decision:'RETIRE',reason:'Reviewed Plan no longer needs this Job'};
const retirePrepared = () => prepare({...input,job_snapshots:[retiredImpact]});
const retireInput = (job=old,jobSha=sha) => {
  const prepared=retirePrepared();
  return {project_id:uid,job_id:oldId,job_record_text:JSON.stringify(job),
    job_record_sha:jobSha,intent_record_text:prepared.intent_record_text,
    intent_record_sha:sha,intent_memory_path:prepared.intent_memory_path};
};
const retireResume = (intent,jobs,activity=[]) => resume({
  project_id:uid,intent_memory_path:retirePrepared().intent_memory_path,
  intent_record_text:JSON.stringify(intent),intent_record_sha:sha,
  current_job_snapshots:jobs.map(j=>snap(j)),activity,
});
test('LLC58 RETIRE intent has no replacement and preserves reviewed Plan lineage',()=>{
  const p=retirePrepared();
  assert.equal(p.allowed,true);
  const intent=JSON.parse(p.intent_record_text);
  assert.equal(intent.actions.length,1);
  assert.equal(intent.actions[0].decision,'RETIRE');
  assert.equal(intent.actions[0].replacement,null);
  assert.equal(intent.actions[0].reason,retiredImpact.reason);
  assert.equal(intent.actions[0].old_evidence_applicable_to_new_job,false);
});
test('LLC58 RETIRE fence is exact-SHA, idempotent and carries null replacement',()=>{
  const p=retirePrepared();
  const fenced=prepareFence(retireInput());
  assert.equal(fenced.allowed,true);
  assert.equal(fenced.operation,'UPDATE');
  assert.equal(fenced.record.plan_change_pending.replacement_job_id,null);
  assert.equal(prepareFence(retireInput(fenced.record,'b'.repeat(40))).operation,'NONE');
  assert.equal(prepareFence(retireInput(old,'b'.repeat(40))).allowed,false);
  const i=JSON.parse(p.intent_record_text);
  assert.equal(retireResume(i,[old]).actions[0].next_action,'FENCE_PREDECESSOR_BY_EXACT_SHA');
  assert.equal(retireResume(i,[fenced.record],[{job_id:oldId,cursor_state:'PENDING',active_run_state:'NONE'}])
    .actions[0].next_action,'RECONCILE_PENDING_SOURCE_CURSOR');
  assert.equal(retireResume(i,[fenced.record],[{job_id:oldId,cursor_state:'STABLE',active_run_state:'ACTIVE'}])
    .actions[0].next_action,'SETTLE_ACTIVE_RUN');
  assert.equal(retireResume(i,[fenced.record],[{job_id:oldId,cursor_state:'ABSENT',active_run_state:'NONE'}])
    .actions[0].next_action,'RETIRE_PREDECESSOR_BY_EXACT_SHA');
});
test('LLC58 RETIRE cannot terminalize with pending cursor, active Run, missing fence or forged successor',()=>{
  const p=retirePrepared();
  const baseline={project_id:uid,intent_record_text:p.intent_record_text,intent_record_sha:sha,
    intent_memory_path:p.intent_memory_path,predecessor_job:prepareFence(retireInput()).record,
    predecessor_job_sha:'b'.repeat(40),cursor_state:'ABSENT',active_run_state:'NONE'};
  const matched=validateSupersession(baseline);
  assert.equal(matched.allowed,true);
  assert.equal(matched.action.decision,'RETIRE');
  assert.equal(matched.action.replacement,null);
  for(const bad of [
    {...baseline,cursor_state:'PENDING'},
    {...baseline,cursor_state:'UNKNOWN'},
    {...baseline,active_run_state:'ACTIVE'},
    {...baseline,active_run_state:'UNKNOWN'},
    {...baseline,predecessor_job:old},
    {...baseline,predecessor_job:{...baseline.predecessor_job,planning_revision:3}},
    {...baseline,predecessor_job:{...baseline.predecessor_job,lifecycle:'COMPLETED'}},
  ]) assert.equal(validateSupersession(bad).allowed,false);
  const forged=JSON.parse(p.intent_record_text);
  forged.actions[0].replacement={job_id:newId,handle:getHandle(newId)};
  assert.equal(validateSupersession({...baseline,intent_record_text:JSON.stringify(forged)}).allowed,false);
});
test('LLC58 RETIRED is terminal, resumes without creating replacement and checks matching reason',()=>{
  const i=JSON.parse(retirePrepared().intent_record_text);
  const closed={...prepareFence(retireInput()).record,lifecycle:'RETIRED',result:'RETIRED',
    retired_by_plan_change_id:i.change_id,retired_reason:retiredImpact.reason,
    retired_by_replacement_job_id:null};
  assert.equal(retireResume(i,[closed]).actions[0].next_action,'RETIRED_NO_REPLACEMENT');
  assert.equal(retireResume(i,[{...closed,retired_reason:'different'}]).allowed,false);
  assert.equal(retireResume(i,[{...closed,result:'PASS'}]).allowed,false);
  assert.equal(retireResume(i,[{...old,lifecycle:'COMPLETED'}]).allowed,false);
  assert.match(source,/target_lifecycle === 'RETIRED' \? 'RETIRED'/);
  assert.match(source,/RETIRE_REQUIRES_REVIEWED_PLAN_INTENT_AND_SETTLED_ACTIVITY/);
  assert.match(source,/NEXT_DISPATCH_TASK_RETIRED/);
});
test('LLC58 validates retirement Task scope, preserves existing REPLACE path',()=>{
  const work={...old,tasks:[{task_id:'A',lifecycle:'READY'},{task_id:'B',lifecycle:'IN_PROGRESS'}]};
  const payload={...impacted,job_record_text:JSON.stringify(work),
    retired_task_ids:['A']};
  const replaced=prepare({...input,job_snapshots:[payload]});
  assert.equal(replaced.allowed,true);
  assert.deepEqual(Array.from(JSON.parse(replaced.intent_record_text).actions[0].retired_task_ids),['A']);
  for(const taskIds of [['A','A'],['NOT_A_TASK']]){
    const blocked=prepare({...input,job_snapshots:[{...payload,retired_task_ids:taskIds}]});
    assert.equal(blocked.allowed,false);
  }
  assert.equal(prepare({...input,job_snapshots:[{...payload,decision:'KEEP'}]}).allowed,false);
});
