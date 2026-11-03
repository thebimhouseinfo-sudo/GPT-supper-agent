// U-B / BP-03: source-executed scope-wide supersession and negative controls.
// These tests do NOT claim external Memory Repo CAS, live host or Git side effects.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

const source=fs.readFileSync('supabase/functions/gsa-mcp/plan-change-decisions.ts','utf8');
const sf=ts.createSourceFile('plan-change-decisions.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const declaration=sf.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='createPlanChangeDecisions');
assert.ok(declaration,'load real Plan Change factory');
const js=ts.transpileModule(declaration.getText(sf),{compilerOptions:{
  target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None
}}).outputText;
const factory=vm.runInNewContext(js+'\ncreatePlanChangeDecisions',{JSON,Array,Number,String,Set,Map,Date,exports:{}});
const P='0fa72d63-17b4-4e28-84d9-231a17f5fe70';
const planId='79a7c63d-9b84-4b4e-a290-6cd049513ec2';
const ids=[
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
];
const packs=[
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
];
const sha='a'.repeat(40);
const sha2='b'.repeat(40);
const reviewId='30000000-0000-4000-8000-000000000001';
const root=(id,contract,ns)=>'projects/'+id+(contract==='NEXT'&&ns==='TEST_LAB'?'/TEST-LAB/NEXT':'');
const vpath=(id,vid,contract,ns)=>root(id,contract,ns)+'/VERIFICATION/'+vid+'.json';
const contract=j=>j.execution_contract??'V2_STABLE';
const namespace=j=>j.memory_namespace??'PRODUCTION';
const skill=(reserved=packs)=>{
  let i=0;
  return factory({jobExecutionContract:contract,executionMemoryRoot:root,
    uuidv7:()=>reserved[i++],jobHandle:id=>'J-'+id.slice(-4),
    recordNextMemoryNamespace:namespace,verificationPath:vpath,
    DEFAULT_NEXT_MEMORY_NAMESPACE:'PRODUCTION'});
};
const J=(id,lifecycle,phase,extra={})=>({
  kind:'JOB',project_id:P,job_id:id,execution_contract:'NEXT',memory_namespace:'PRODUCTION',
  lifecycle,planning_revision:2,planning_context:{phase},
  tasks:[{task_id:'T-'+id.slice(-1),lifecycle:'READY'}],
  milestones:[{milestone_id:'M-'+id.slice(-1),lifecycle:'READY'}],dependencies:[],...extra,
});
const old=[
  J(ids[0],'READY','ALPHA',{tasks:[
    {task_id:'T-COMPLETED',lifecycle:'COMPLETED'},{task_id:'T-OPEN',lifecycle:'READY'}],
    milestones:[{milestone_id:'M-DONE',lifecycle:'COMPLETED'},{milestone_id:'M-OPEN',lifecycle:'READY'}]}),
  J(ids[1],'IN_PROGRESS','ALPHA'),
  J(ids[2],'COMPLETED','ALPHA',{tasks:[{task_id:'T-HIST',lifecycle:'COMPLETED'}]}),
  J(ids[3],'READY','BETA',{dependencies:[ids[1]]}),
  J(ids[4],'READY','BETA'),
];
const snapshots=jobs=>jobs.map(job=>({job_record_text:JSON.stringify(job),job_record_sha:sha,
  cursor_state:job.lifecycle==='IN_PROGRESS'?'PENDING':'ABSENT',
  active_run_state:job.lifecycle==='IN_PROGRESS'?'UNKNOWN':'NONE'}));
const ref=vpath(P,reviewId,'NEXT','PRODUCTION');
const plan={...J(planId,'IN_PROGRESS','ROOT'),type:'plan',
  planning_review:{status:'PASS',reviewed_revision:2,verification_ref:ref}};
const review={kind:'PLANNING_REVIEW',verification_id:reviewId,project_id:P,job_id:planId,
  execution_contract:'NEXT',memory_namespace:'PRODUCTION',planning_revision:2,
  result:'PASS',producer:'reviewer'};
const scope={boundary:'PHASE',phase:'ALPHA',inventory_job_ids:ids};
const packSpecs=[
  {pack_key:'A',phase:'ALPHA',depends_on_pack_keys:[]},
  {pack_key:'B',phase:'BETA',depends_on_pack_keys:['A']},
];
const common={
  project_id:P,change_ref:'docs/plans/U-B-reviewed.md',reviewed_plan_sha:sha,
  plan_job_record_text:JSON.stringify(plan),plan_job_record_sha:sha,
  plan_review_record_text:JSON.stringify(review),plan_review_record_sha:sha,
  plan_review_memory_path:ref,work_branch:'upgrade/gsa-context-efficiency',
  human_change_approval_ref:'APPROVED-HUMAN-CHANGE-U-B-M02',
  job_snapshots:snapshots(old),scope_selection:scope,rebuild_job_packs:packSpecs,
};
const snap=job=>({job_record_text:JSON.stringify(job),job_record_sha:
  job.plan_change_pending || job.lifecycle==='RETIRED' || job.plan_change_revalidated_by ? sha2 : sha});
const prepareScope=()=>skill().prepareHumanPlanChangeIntent(common);
function makeResume(intent,jobs,activity=[]){
  return skill().resumeHumanPlanChangeIntent({project_id:P,
    intent_record_text:JSON.stringify(intent),intent_record_sha:sha,
    intent_memory_path:root(P,'NEXT','PRODUCTION')+
      '/WORK/PLAN_RECONCILIATIONS/'+intent.change_id+'.json',
    current_job_snapshots:jobs.map(snap),activity});
}
test('U-B Phase: all unfinished affected Jobs retired, completed history KEEP, crossing dependent REVALIDATE',()=>{
  const r=skill().assessHumanPlanChangeJobs(common);
  assert.equal(r.allowed,true);
  assert.deepEqual(Array.from(r.decisions,d=>d.decision),['RETIRE','RETIRE','KEEP','REVALIDATE','KEEP']);
  assert.deepEqual(Array.from(r.decisions[0].retired_task_ids),['T-OPEN']);
  assert.equal(r.decisions[2].old_evidence_applicable_to_new_job,false);
  assert.deepEqual(Array.from(r.scope_selection.affected_job_ids),[ids[0],ids[1]]);
});
test('U-B transitive cross-Phase dependency invalidates unfinished consumers without rewriting history',()=>{
  const chain=old.map(j=>j.job_id===ids[4]?{...j,dependencies:[ids[3]]}:j);
  const result=skill().assessHumanPlanChangeJobs({...common,job_snapshots:snapshots(chain)});
  assert.equal(result.allowed,true);
  assert.equal(result.decisions[4].decision,'REVALIDATE');
  assert.deepEqual(Array.from(result.scope_selection.dependent_job_ids),[ids[3],ids[4]]);
});
test('U-B whole Plan affects all unfinished Jobs, never retires completed',()=>{
  const result=skill().assessHumanPlanChangeJobs({...common,scope_selection:{
    boundary:'PLAN',inventory_job_ids:ids}});
  assert.equal(result.allowed,true);
  assert.deepEqual(Array.from(result.decisions,d=>d.decision),[
    'RETIRE','RETIRE','KEEP','RETIRE','RETIRE']);
});
test('U-B inventory absence, wrong phase, per-Job override and wrong Project fail closed',()=>{
  const s=skill();
  assert.equal(s.assessHumanPlanChangeJobs({...common,scope_selection:{
    ...scope,inventory_job_ids:ids.slice(0,4)}}).reason,'SCOPE_INVENTORY_INCOMPLETE');
  assert.equal(s.assessHumanPlanChangeJobs({...common,scope_selection:{
    boundary:'PHASE',phase:'NOT_PRESENT',inventory_job_ids:ids}}).allowed,false);
  assert.equal(s.assessHumanPlanChangeJobs({...common,job_snapshots:[
    {...snapshots(old)[0],decision:'KEEP'},...snapshots(old).slice(1)]}).reason,
    'SCOPE_PER_JOB_DECISION_CONFLICT');
  assert.equal(s.assessHumanPlanChangeJobs({...common,project_id:ids[0]}).allowed,false);
  assert.equal(s.prepareHumanPlanChangeIntent({...common,human_change_approval_ref:''}).reason,
    'SCOPE_HUMAN_APPROVED_CHANGE_REQUIRED');
});
test('U-B immutable intent reserves unique rebuilt Job IDs, idempotent replay and graph validation',()=>{
  const s=skill(),prepared=s.prepareHumanPlanChangeIntent(common);
  assert.equal(prepared.operation,'CREATE');assert.equal(prepared.mutation_authorized,false);
  const intent=JSON.parse(prepared.intent_record_text);
  assert.equal(intent.actions.filter(x=>x.decision==='RETIRE').length,2);
  assert.deepEqual(intent.rebuild_jobs.map(x=>x.job_id),packs);
  assert.equal(intent.rebuild_jobs[1].depends_on_pack_keys[0],'A');
  const replay=skill().prepareHumanPlanChangeIntent({...common,
    existing_intent_record_text:prepared.intent_record_text,existing_intent_record_sha:sha});
  assert.equal(replay.operation,'NONE');assert.equal(replay.allowed,true);
  assert.equal(skill().prepareHumanPlanChangeIntent({...common,
    rebuild_job_packs:[{pack_key:'A',phase:'ALPHA',depends_on_pack_keys:['A']}]}).reason,
    'SCOPE_REBUILD_PACKS_INVALID');
  assert.equal(skill().prepareHumanPlanChangeIntent({...common,
    rebuild_job_packs:[{pack_key:'A',phase:'ALPHA',depends_on_pack_keys:['B']},
      {pack_key:'B',phase:'BETA',depends_on_pack_keys:['A']}]}).allowed,false);
  assert.equal(skill().prepareHumanPlanChangeIntent({...common,
    scope_selection:{...scope,inventory_job_ids:ids.slice(1)}}).allowed,false);
});
test('U-B fence, unknown/PENDING Run and cursor block retirement and scope rebuild',()=>{
  const s=skill(),prepared=s.prepareHumanPlanChangeIntent(common);
  const intent=JSON.parse(prepared.intent_record_text);
  const intentPath=prepared.intent_memory_path;
  const fence=(job)=>s.prepareHumanPlanChangeFenceDecision({
    project_id:P,job_id:job.job_id,job_record_text:JSON.stringify(job),
    job_record_sha:sha,intent_record_text:prepared.intent_record_text,
    intent_record_sha:sha,intent_memory_path:intentPath});
  const begin=makeResume(intent,old);
  assert.equal(begin.actions[0].next_action,'FENCE_PREDECESSOR_BY_EXACT_SHA');
  assert.equal(begin.actions[3].next_action,'FENCE_DEPENDENT_JOB_BY_EXACT_SHA');
  assert.equal(begin.actions.length,7,JSON.stringify({begin,scope:intent.scope_selection,rebuild:intent.rebuild_jobs}));
  assert.equal(begin.actions[5].next_action,'WAIT_SCOPE_RETIREMENT');
  const fA=fence(old[0]),fB=fence(old[1]),fD=fence(old[3]);
  assert.equal(fA.allowed,true);assert.equal(fB.allowed,true);
  assert.equal(fD.record.plan_change_pending.dependency_revalidation,true);
  const pending=makeResume(intent,[fA.record,fB.record,old[2],fD.record,old[4]],
    [{job_id:ids[0],cursor_state:'ABSENT',active_run_state:'NONE'},
      {job_id:ids[1],cursor_state:'PENDING',active_run_state:'UNKNOWN'},
      {job_id:ids[3],cursor_state:'STABLE',active_run_state:'ACTIVE'}]);
  assert.equal(pending.actions[1].next_action,'RECONCILE_PENDING_SOURCE_CURSOR');
  assert.equal(pending.actions[3].next_action,'SETTLE_ACTIVE_RUN');
  assert.equal(pending.actions[5].next_action,'WAIT_SCOPE_RETIREMENT');
  const bad=s.validatePlanChangeSupersession({project_id:P,
    intent_record_text:prepared.intent_record_text,intent_record_sha:sha,
    intent_memory_path:intentPath,predecessor_job:fB.record,predecessor_job_sha:sha2,
    cursor_state:'PENDING',active_run_state:'UNKNOWN'});
  assert.equal(bad.allowed,false);
  const safe=s.validatePlanChangeSupersession({project_id:P,
    intent_record_text:prepared.intent_record_text,intent_record_sha:sha,
    intent_memory_path:intentPath,predecessor_job:fB.record,predecessor_job_sha:sha2,
    cursor_state:'ABSENT',active_run_state:'NONE'});
  assert.equal(safe.allowed,true);
  const retired=(job)=>({...job,lifecycle:'RETIRED',result:'RETIRED',
    retired_by_plan_change_id:intent.change_id,retired_reason:
      intent.actions.find(a=>a.predecessor_job_id===job.job_id).reason,
    retired_by_replacement_job_id:null});
  const reviewedDependent={...old[3],planning_revision:3,plan_change_pending:null,
    plan_change_revalidated_by:intent.change_id,
    planning_review:{status:'PASS',reviewed_revision:3}};
  const ready=makeResume(intent,[retired(fA.record),retired(fB.record),
    old[2],reviewedDependent,old[4]]);
  assert.equal(ready.allowed,true);
  assert.equal(ready.actions[5].next_action,'CREATE_RESERVED_SCOPE_JOB');
  const forged={...intent,actions:intent.actions.map(a=>a.predecessor_job_id===ids[0]?
    {...a,decision:'KEEP'}:a)};
  assert.equal(makeResume(forged,old).reason,'SCOPE_ACTION_BOUNDARY_CONFLICT');
});
test('U-B no phantom Run RETIRED; delayed NEXT completions, scope review and fresh IDs are guarded',()=>{
  const runs=fs.readFileSync('supabase/functions/gsa-mcp/run-execution-tools.ts','utf8');
  const prepare=fs.readFileSync('supabase/functions/gsa-mcp/job-prepare-tool.ts','utf8');
  const revise=fs.readFileSync('supabase/functions/gsa-mcp/job-revise-plan-tool.ts','utf8');
  const transition=fs.readFileSync('supabase/functions/gsa-mcp/job-transition-tool.ts','utf8');
  assert.match(runs,/RUN_STALE_OR_FENCED/);
  assert.match(runs,/SCOPE_REVALIDATION_REVIEW_PENDING/);
  assert.match(runs,/CANCELLED_RUN_CANNOT_HANDOFF/);
  assert.doesNotMatch(runs,/lifecycle: z\.enum\(\['COMPLETED','FAILED','CANCELLED','SUPERSEDED','RETIRED'\]/);
  assert.match(prepare,/SCOPE_REBUILD_RETIREMENT_UNSETTLED/);
  assert.match(prepare,/SCOPE_REBUILD_MUST_USE_FRESH_IDS/);
  assert.match(revise,/SCOPE_REVALIDATION_FENCE_OR_ACTIVITY_UNSETTLED/);
  assert.match(transition,/milestones: \(current\.milestones \?\? \[\]\)\.map/);
});
