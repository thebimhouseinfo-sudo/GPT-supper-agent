// U-B: executable source-bound tests for Plan/Phase retirement and fencing.
// Direct Agent source test only: not durable Git CAS, Human approval, or host E2E.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const read = (name) => fs.readFileSync('supabase/functions/gsa-mcp/' + name, 'utf8');
const fidelityExports={};
vm.runInNewContext(ts.transpileModule(read('decision-fidelity.ts'),
  {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,
  {exports:fidelityExports,JSON,Date,Array,Set,Map,Number,String});
const sha = 'a'.repeat(40), fencedSha='b'.repeat(40);
const pid='11000000-0000-4000-8000-000000000001';
const planId='11000000-0000-4000-8000-000000000002';
const reviewId='11000000-0000-4000-8000-000000000003';
const a='11000000-0000-4000-8000-000000000004';
const b='11000000-0000-4000-8000-000000000005';
const c='11000000-0000-4000-8000-000000000006';
const d='11000000-0000-4000-8000-000000000007';
const e='11000000-0000-4000-8000-000000000008';
const unrelated='11000000-0000-4000-8000-000000000014';
const successor='11000000-0000-4000-8000-000000000009';
const tDone='11000000-0000-4000-8000-000000000010';
const tOpen='11000000-0000-4000-8000-000000000011';
const tB='11000000-0000-4000-8000-000000000012';
const tE='11000000-0000-4000-8000-000000000013';
const toJS = (source) => ts.transpileModule(source.replace(/^export function /m,'function '),
  {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const root=(id,contract,ns)=>'projects/'+id+(contract==='NEXT'&&ns==='TEST_LAB'?'/TEST-LAB/NEXT':'');
const contract=j=>j?.execution_contract==null?'V2_STABLE':(['NEXT','V2_STABLE'].includes(j.execution_contract)?j.execution_contract:null);
const ns=j=>['TEST_LAB','PRODUCTION'].includes(j?.memory_namespace)?j.memory_namespace:null;
const path=(id,kind,id2,con,n)=>root(id,con,n)+'/'+kind+'/'+id2+'.json';
const verification=(id,v,con,n)=>root(id,con,n)+'/VERIFICATION/'+v+'.json';
const deps={JSON,Date,Number,String,Array,Set,Map,uuidv7:()=>successor,
  jobHandle:id=>'J-'+id.slice(-4).toUpperCase(),
  jobExecutionContract:contract,recordNextMemoryNamespace:ns,
  executionMemoryRoot:root,verificationPath:verification,
  DEFAULT_NEXT_MEMORY_NAMESPACE:'PRODUCTION'};
const planChangeFactory = vm.runInNewContext(toJS(read('plan-change-decisions.ts'))+
  '\ncreatePlanChangeDecisions', {...deps});
const api=planChangeFactory(deps);
const old=(id,phase,lifecycle,tasks=[],dependencies=[])=>({
  kind:'JOB',project_id:pid,job_id:id,execution_contract:'NEXT',memory_namespace:'PRODUCTION',
  planning_revision:2,lifecycle,planning_context:{phase},
  tasks,dependencies,
  milestones:tasks.map((t,i)=>({milestone_id:id+'-M'+i,node_ids:[t.task_id],
    ...(t.lifecycle==='COMPLETED'?{lifecycle:'COMPLETED',result:'PASS'}:{})})),
});
const retiredMilestones=job=>(job.milestones??[]).map(m=>{
  const related=(job.tasks??[]).filter(t=>(m.node_ids??[]).includes(t.task_id));
  return related.length>0 && related.every(t=>t.lifecycle==='COMPLETED')
    ? m : {...m,lifecycle:'RETIRED'};
});
const jobs=[
  old(a,'A','READY',[{task_id:tDone,lifecycle:'COMPLETED',result:'PASS',verification_ref:'historical'},
    {task_id:tOpen,lifecycle:'READY'}]),
  old(b,'B','IN_PROGRESS',[{task_id:tB,lifecycle:'IN_PROGRESS'}],[{job_id:a}]),
  old(c,'B','READY',[{task_id:'C1',lifecycle:'READY'}]),
  old(d,'A','COMPLETED',[{task_id:'D1',lifecycle:'COMPLETED',result:'PASS'}]),
  old(e,'A','DRAFT',[{task_id:tE,lifecycle:'WAITING'}]),
  old(unrelated,'A','READY',[{task_id:'U1',lifecycle:'READY'}]),
];
const reviewRef=verification(pid,reviewId,'NEXT','PRODUCTION');
const planJob={kind:'JOB',project_id:pid,job_id:planId,type:'plan',execution_contract:'NEXT',
  memory_namespace:'PRODUCTION',lifecycle:'IN_PROGRESS',planning_revision:3,
  planning_review:{status:'PASS',reviewed_revision:3,verification_ref:reviewRef}};
const review={kind:'PLANNING_REVIEW',verification_id:reviewId,project_id:pid,job_id:planId,
  execution_contract:'NEXT',memory_namespace:'PRODUCTION',planning_revision:3,
  result:'PASS',producer:'reviewer'};
const snapshots=jobs.map(job=>({job_record_text:JSON.stringify(job),job_record_sha:sha}));
const scope={boundary:'PHASE',phase_id:'A',plan_job_id:planId,
  human_approval_ref:'human-approved-plan-r3',inventory_job_ids:jobs.map(j=>j.job_id),
  plan_member_job_ids:[a,b,c,d,e]};
const base={project_id:pid,change_ref:'docs/reviewed-plan-r3.md',reviewed_plan_sha:sha,
  plan_job_record_text:JSON.stringify(planJob),plan_job_record_sha:sha,
  plan_review_record_text:JSON.stringify(review),plan_review_record_sha:sha,
  plan_review_memory_path:reviewRef,work_branch:'upgrade/gsa-context-efficiency',
  scope_change:scope,job_snapshots:snapshots};
const intentReady=()=>api.prepareHumanPlanChangeIntent(base);
const fence=(intent,job,hash=sha)=>api.prepareHumanPlanChangeFenceDecision({
  project_id:pid,job_id:job.job_id,job_record_text:JSON.stringify(job),job_record_sha:hash,
  intent_record_text:JSON.stringify(intent),intent_record_sha:sha,intent_memory_path:intentReady().intent_memory_path,
});
const resume=(intent,live,activity=[])=>api.resumeHumanPlanChangeIntent({
  project_id:pid,intent_record_text:JSON.stringify(intent),intent_record_sha:sha,
  intent_memory_path:intentReady().intent_memory_path,
  current_job_snapshots:live.map(job=>({job_record_text:JSON.stringify(job),
    job_record_sha:job.plan_change_pending?fencedSha:sha})),activity,
});
function stubZ(){const chain=new Proxy(function(){return chain},{
  get:()=>chain,apply:()=>chain});
  return new Proxy({}, {get:()=>chain});
}
function register(file,fn,depsExtra={}){
  const handlers=new Map();
  const js=toJS(read(file));
  const init=vm.runInNewContext(js+'\n'+fn,{JSON,Date,Array,Set,Map,Number,String,exports:{},
    require:(name)=>{
      assert.equal(name,'./decision-fidelity.ts','U-B source registration may import only the reviewed U-A decision helper');
      return fidelityExports;
    }});
  const schema=stubZ().object({});
  init({...deps,...depsExtra,z:stubZ(),req:{},AUTH_SCOPES:[],
    DURABLE_RECORD_SNAPSHOT_SCHEMA:schema,PLANNING_LOOP_CONTINUATION_SCHEMA:schema,
    CRITERIA_BINDING_SCHEMA:schema,EVIDENCE_NEED_SCHEMA:schema,
    TEST_CHECKPOINT_SPEC_SCHEMA:schema,EVIDENCE_REQUIREMENT_SCHEMA:schema,
    MILESTONE_SCHEMA:schema,PLANNING_TOPOLOGY_NODE_SCHEMA:schema,
    authContext:async()=>({user_id:'test'}),
    server:{registerTool:(name,definition,handler)=>handlers.set(name,handler)},
    authError:()=>({isError:true}),prettyJson:o=>JSON.stringify(o),
    recordPath:path,durableSnapshotReadbackSteps:()=>[]});
  return handlers;
}
test('UB-01: PHASE selection retires all unfinished plus transitive crossing, keeps completed and unaffected',()=>{
  const impact=api.assessHumanPlanChangeJobs(base);
  assert.equal(impact.allowed,true,impact.reason);
  const by=new Map(impact.decisions.map(r=>[r.job_id,r]));
  assert.deepEqual([...impact.scope_summary.retiring_job_ids].sort(),[a,b,e].sort());
  assert.deepEqual([...impact.scope_summary.cross_boundary_job_ids],[b]);
  assert.deepEqual([...impact.scope_summary.completed_outcome_job_ids],[d]);
  assert.equal(by.get(a).decision,'RETIRE');
  assert.deepEqual(Array.from(by.get(a).retired_task_ids),[tOpen]);
  assert.equal(by.get(b).next_action,'RECONCILE_PENDING_CURSOR_BEFORE_SUPERSEDE');
  assert.equal(by.get(c).decision,'KEEP');
  assert.equal(by.get(d).decision,'KEEP');
  assert.equal(by.get(d).completed_outcome_review_required,true);
  assert.equal(by.get(unrelated).decision,'KEEP',
    'Unrelated Plan with the SAME phase label must survive reviewed Phase change');
  assert.equal(impact.mutation_authorized,false);
});
test('UB-01: whole PLAN boundary retires every unfinished, including formerly unaffected phase',()=>{
  const plan={...scope,boundary:'PLAN'};delete plan.phase_id;
  const r=api.assessHumanPlanChangeJobs({...base,scope_change:plan});
  assert.equal(r.allowed,true,r.reason);
  assert.deepEqual([...r.scope_summary.retiring_job_ids].sort(),[a,b,c,e].sort());
  assert.equal(r.decisions.find(x=>x.job_id===unrelated).decision,'KEEP');
});
test('UB-01 negative: wrong approved scope, missing job, mismatched Project/sha and per-Job overrides fail closed',()=>{
  const make=s=>api.assessHumanPlanChangeJobs({...base,...s});
  assert.equal(make({scope_change:{...scope,human_approval_ref:''}}).allowed,false);
  assert.equal(make({scope_change:{...scope,phase_id:null}}).allowed,false);
  assert.equal(make({scope_change:{...scope,plan_member_job_ids:undefined}}).allowed,false);
  assert.equal(make({scope_change:{...scope,plan_member_job_ids:[a,a]}}).allowed,false);
  assert.equal(make({scope_change:{...scope,plan_member_job_ids:[a,'foreign']}}).allowed,false);
  assert.equal(make({job_snapshots:snapshots.slice(1)}).allowed,false);
  assert.equal(make({scope_change:{...scope,inventory_job_ids:[a,a,b,c,d]}}).allowed,false);
  assert.equal(make({job_snapshots:[{...snapshots[0],job_record_sha:'bad'},...snapshots.slice(1)]}).allowed,false);
  assert.equal(make({job_snapshots:[{...snapshots[0],decision:'KEEP'},...snapshots.slice(1)]}).allowed,false);
  assert.equal(make({job_snapshots:[{...snapshots[0],job_record_text:JSON.stringify({...jobs[0],project_id:'foreign'})},...snapshots.slice(1)]}).allowed,false);
});
test('UB-02: immutable intent contains full scope and idempotent retry never mints replacements',()=>{
  const p=intentReady();assert.equal(p.allowed,true,p.reason);
  assert.equal(p.operation,'CREATE');
  const i=JSON.parse(p.intent_record_text);
  assert.equal(i.scope_change.human_approval_ref,scope.human_approval_ref);
  assert.equal(i.scope_change.successor_job_count,1);
  assert.deepEqual(Array.from(i.scope_change.plan_member_job_ids).sort(),[a,b,c,d,e].sort());
  assert.deepEqual(Array.from(i.scope_change.successor_job_ids),[successor]);
  assert.deepEqual(Array.from(i.scope_change.retiring_job_ids).sort(),[a,b,e].sort());
  assert.equal(i.actions.filter(a=>a.decision==='RETIRE').length,3);
  assert.equal(i.actions.filter(a=>a.decision==='REPLACE').length,0);
  assert.ok(i.actions.every(a=>a.replacement===null&&a.old_evidence_applicable_to_new_job===false));
  const again=api.prepareHumanPlanChangeIntent({...base,
    existing_intent_record_text:p.intent_record_text,existing_intent_record_sha:sha});
  assert.equal(again.allowed,true);
  assert.equal(again.operation,'NONE');
  assert.equal(again.intent_record_text,p.intent_record_text);
  const conflict=api.prepareHumanPlanChangeIntent({...base,
    scope_change:{...scope,human_approval_ref:'another-approval'},
    existing_intent_record_text:p.intent_record_text,existing_intent_record_sha:sha});
  assert.equal(conflict.allowed,false);
  assert.equal(api.prepareHumanPlanChangeIntent({...base,
    scope_change:{...scope,successor_job_count:2},
    existing_intent_record_text:p.intent_record_text,existing_intent_record_sha:sha}).allowed,false);
  assert.equal(api.assessHumanPlanChangeJobs({...base,
    scope_change:{...scope,successor_job_count:0}}).allowed,false);
});
test('UB-03: fence before unknown/pending Run/cursor, then stable permits only exact lineage',()=>{
  const i=JSON.parse(intentReady().intent_record_text);
  const fA=fence(i,jobs[0]);const fB=fence(i,jobs[1]);const fE=fence(i,jobs[4]);
  assert.equal(fA.allowed,true);assert.equal(fB.allowed,true);assert.equal(fE.allowed,true);
  const updated=[fA.record,fB.record,jobs[2],jobs[3],fE.record,jobs[5]];
  const pending=resume(i,updated,[{job_id:b,cursor_state:'PENDING',active_run_state:'ACTIVE'}]);
  assert.equal(pending.allowed,true);
  assert.equal(pending.actions.find(a=>a.job_id===b).next_action,'RECONCILE_PENDING_SOURCE_CURSOR');
  const unknown=resume(i,updated,[{job_id:b,cursor_state:'STABLE',active_run_state:'UNKNOWN'}]);
  assert.equal(unknown.actions.find(a=>a.job_id===b).next_action,'SETTLE_ACTIVE_RUN');
  const stable=resume(i,updated,[a,b,e].map(job_id=>({job_id,cursor_state:'STABLE',active_run_state:'NONE'})));
  assert.equal(stable.actions.find(x=>x.job_id===b).next_action,'RETIRE_PREDECESSOR_BY_EXACT_SHA');
  assert.equal(stable.scope_ready_for_new_topology,false);
  const context={project_id:pid,intent_record_text:JSON.stringify(i),
    intent_record_sha:sha,intent_memory_path:intentReady().intent_memory_path,
    predecessor_job:fA.record,predecessor_job_sha:fencedSha,
    cursor_state:'STABLE',active_run_state:'NONE'};
  assert.equal(api.validatePlanChangeSupersession(context).allowed,true);
  assert.equal(api.validatePlanChangeSupersession({...context,cursor_state:'PENDING'}).allowed,false);
  assert.equal(api.validatePlanChangeSupersession({...context,active_run_state:'UNKNOWN'}).allowed,false);
  const omitted={...i,actions:i.actions.map(action=>action.predecessor_job_id===a
    ? {...action,retired_task_ids:[]} : action)};
  assert.equal(api.validatePlanChangeSupersession({...context,intent_record_text:JSON.stringify(omitted)}).allowed,false);
  assert.equal(fence(i,fA.record,fencedSha).operation,'NONE');
});
test('UB-02: retirement is idempotent and scope reports fresh topology only after all affected jobs retire',()=>{
  const i=JSON.parse(intentReady().intent_record_text);
  const retired=jobs.map(job=>{
    const action=i.actions.find(a=>a.predecessor_job_id===job.job_id);
    if(action.decision!=='RETIRE')return job;
    const old=fence(i,job).record;
    return {...old,lifecycle:'RETIRED',result:'RETIRED',
      retired_by_plan_change_id:i.change_id,retired_reason:action.reason,
      retired_by_replacement_job_id:null,
      tasks:old.tasks.map(t=>t.lifecycle==='COMPLETED'?t:{...t,lifecycle:'RETIRED'}),
      milestones:retiredMilestones(job)};
  });
  const r=resume(i,retired);
  assert.equal(r.allowed,true,r.reason);
  assert.equal(r.scope_ready_for_new_topology,true);
  assert.equal(r.next_scope_action,'CREATE_FRESH_REVIEWED_TOPOLOGY');
  assert.ok(r.actions.filter(a=>a.decision==='RETIRE')
    .every(a=>a.next_action==='RETIRED_NO_REPLACEMENT'));
  assert.equal(resume(i,retired.map(j=>j.job_id===a?{...j,retired_reason:'forged'}:j)).allowed,false);
  const zombie=retired.map(j=>j.job_id===a?{...j,milestones:jobs[0].milestones}:j);
  assert.equal(resume(i,zombie).reason,'SCOPE_CHANGE_TERMINAL_TASK_OR_MILESTONE_ZOMBIE');
  const zombieTask=retired.map(j=>j.job_id===a?{...j,
    tasks:[j.tasks[0],{...j.tasks[1],lifecycle:'READY'}]}:j);
  assert.equal(resume(i,zombieTask).allowed,false);
  assert.equal(resume({...i,scope_change:{...i.scope_change,inventory_job_ids:[a]}},retired).allowed,false);
});
test('UB-02: Job transition retires unfinished milestone/Task, keeps historical completed PASS',async()=>{
  const i=JSON.parse(intentReady().intent_record_text);
  const old=fence(i,jobs[0]).record;
  const handler=register('job-transition-tool.ts','registerJobTransitionTool',{
    validatePlanChangeSupersession:api.validatePlanChangeSupersession
  }).get('job_transition');
  const r=await handler({project_id:pid,job_id:a,job_record_text:JSON.stringify(old),
    job_record_sha:fencedSha,target_lifecycle:'RETIRED',result:'RETIRED',
    plan_change_context:{intent_record_text:JSON.stringify(i),intent_record_sha:sha,
      intent_memory_path:intentReady().intent_memory_path,cursor_state:'STABLE',active_run_state:'NONE'}});
  assert.equal(r.isError,undefined,JSON.stringify(r));
  const result=JSON.parse(r.structuredContent.next_job_record_text);
  assert.equal(result.lifecycle,'RETIRED');
  assert.equal(result.tasks[0].lifecycle,'COMPLETED');
  assert.equal(result.tasks[0].verification_ref,'historical');
  assert.equal(result.tasks[1].lifecycle,'RETIRED');
  assert.equal(result.milestones[0].lifecycle,'COMPLETED');
  assert.equal(result.milestones[0].result,'PASS');
  assert.equal(result.milestones[1].lifecycle,'RETIRED');
  // A stale milestone PASS with an unfinished Task must not survive retirement.
  const conflicted={...old,milestones:old.milestones.map(m=>
    m.node_ids.includes(tOpen)?{...m,status:'PASS'}:m)};
  const stale=await handler({project_id:pid,job_id:a,job_record_text:JSON.stringify(conflicted),
    job_record_sha:fencedSha,target_lifecycle:'RETIRED',result:'RETIRED',
    plan_change_context:{intent_record_text:JSON.stringify(i),intent_record_sha:sha,
      intent_memory_path:intentReady().intent_memory_path,cursor_state:'STABLE',active_run_state:'NONE'}});
  assert.equal(stale.isError,undefined,JSON.stringify(stale));
  const staleRecord=JSON.parse(stale.structuredContent.next_job_record_text);
  assert.equal(staleRecord.milestones[1].lifecycle,'RETIRED');
  assert.equal(result.retired_by_replacement_job_id,null);
});
test('UB-03: delayed NEXT Run success after fence is rejected; safe cancellation still allowed',async()=>{
  const handler=register('run/complete.ts','registerRunComplete',{
    resolveExecutionContract:v=>v==null?'V2_STABLE':v
  }).get('run_complete');
  const run={project_id:pid,job_id:a,run_id:reviewId,role:'planner',lifecycle:'IN_PROGRESS',
    execution_contract:'NEXT',memory_namespace:'PRODUCTION',planning_revision:2};
  const payload={project_id:pid,job_id:a,run_id:reviewId,role:'planner',
    run_record_text:JSON.stringify(run),run_record_sha:sha,lifecycle:'COMPLETED',
    output_refs:[],verification_refs:[]};
  const missing=await handler(payload);
  assert.equal(missing.isError,true);
  assert.match(missing.content[0].text,/PLAN_CHANGE_RUN_COMPLETION_REQUIRES_CURRENT_JOB_SHA/);
  const blocked=await handler({...payload,job_record_text:JSON.stringify(fence(JSON.parse(intentReady().intent_record_text),jobs[0]).record),job_record_sha:fencedSha});
  assert.equal(blocked.isError,true);
  assert.match(blocked.content[0].text,/PLAN_CHANGE_RUN_COMPLETION_FENCED_OR_STALE_JOB/);
  const good=await handler({...payload,job_record_text:JSON.stringify(jobs[0]),job_record_sha:sha});
  assert.equal(good.isError,undefined,JSON.stringify(good));
  assert.equal(JSON.parse(good.structuredContent.terminal_run_record_text).lifecycle,'COMPLETED');
  const cancelled=await handler({...payload,lifecycle:'CANCELLED'});
  assert.equal(cancelled.isError,undefined);
});
test('UB-03: no Run.RETIRED, git deletion or uncontrolled alternate runtime surface',()=>{
  for(const name of ['job-transition-tool.ts','run/complete.ts','plan-change-decisions.ts']){
    assert.doesNotMatch(read(name),/run.*lifecycle\s*:\s*['"]RETIRED['"]/i);
  }
  assert.match(read('plan-change-decisions.ts'),/Do not delete Git refs/);
  assert.match(read('run/complete.ts'),/plan_change_pending/);
  assert.match(read('job-prepare-tool.ts'),/scope_change_context/);
});

test('UB-02: reserved successor is enforced in existing Job preparation; retry cannot allocate another',async()=>{
  const i=JSON.parse(intentReady().intent_record_text);
  const retired=jobs.filter(j=>[a,b,e].includes(j.job_id)).map(job=>{
    const action=i.actions.find(a=>a.predecessor_job_id===job.job_id);
    return {...job,lifecycle:'RETIRED',result:'RETIRED',
      retired_by_plan_change_id:i.change_id,retired_reason:action.reason,
      tasks:job.tasks.map(t=>t.lifecycle==='COMPLETED'?t:{...t,lifecycle:'RETIRED'}),
      milestones:retiredMilestones(job)};
  });
  const handlers=register('job-prepare-tool.ts','registerJobPrepareTool',{
    readMemoryConfig:async()=>({data:{memory_repo_full_name:'owner/memory'}}),
    normalizeGithubRepo:u=>({url:u}),jobCreationExecutionContractDefault:()=> 'NEXT',
    resolveExecutionContract:v=>v, nextMemoryNamespaceForRequest:()=> 'PRODUCTION',
    validIntegrationBranch:()=>true,projectCriteriaBindingError:()=>null,
    cutoverInventoryError:()=>null,validateExecutionTopology:()=>null,
    normalizeNextPlanningModel:(model,revision)=>Object.fromEntries(
      ['evidence_needs','test_checkpoints','evidence_requirements','milestones','planning_topology']
        .map(k=>[k,model[k]??[]])),
    validateNextPlanningModel:()=>null,
    planningLoopContinuationDecision:()=>({next_action_after_readback:'REVIEW_CURRENT_REVISION'}),
  });
  const handler=handlers.get('job_prepare');
  const taskId='11000000-0000-4000-8000-000000000020';
  const milestoneId='11000000-0000-4000-8000-000000000021';
  const context={
    intent_record_text:JSON.stringify(i),intent_record_sha:sha,
    intent_memory_path:intentReady().intent_memory_path,reviewed_plan_sha:sha,
    successor_job_id:successor,
    retired_job_snapshots:retired.map(j=>({job_record_text:JSON.stringify(j),job_record_sha:fencedSha})),
  };
  const payload={project_id:pid,type:'code',objective:'Fresh reviewed scope plan',scope:['new scope'],
    non_goals:[],execution_contract:'NEXT',plan_kind:'JOB',work_context:'BROWNFIELD',
    phase:'A-new',milestone:'new milestone',relationship_scan_summary:'scanned',
    job_sizing:{size:'SMALL'},brownfield_logic_review:[{target:'old',classification:'CANONICAL'}],
    project_repository_mode:'SINGLE',registered_repositories:['https://github.com/owner/repo'],
    working_repository_url:'https://github.com/owner/repo',
    cross_repo_impact:[{repository_url:'https://github.com/owner/repo',impact:'NONE',reason:'same repo'}],
    repository_structure_evidence:['reviewed'],
    integration_branch:'upgrade/gsa-context-efficiency',
    tasks:[{task_id:taskId,objective:'fresh',scope:[],dependencies:[],completion_criteria:['done']}],
    milestones:[{milestone_id:milestoneId,node_ids:[taskId]}],
    planning_topology:[{node_id:taskId,node_type:'TASK',depends_on:[]}],
    completion_requirements:['fresh'],verification_requirements:[],review_triggers:[],
    scope_change_context:context};
  const okay=await handler(payload);
  assert.equal(okay.isError,undefined,JSON.stringify(okay));
  assert.equal(okay.structuredContent?.job_id,successor);
  const created=JSON.parse(okay.structuredContent.job_record_text);
  assert.equal(created.lifecycle,'DRAFT');
  assert.equal(created.planning_review.status,'PENDING');
  assert.deepEqual(Array.from(created.scope_predecessor_job_ids).sort(),[a,b,e].sort());
  assert.equal(created.scope_supersession_id,i.change_id);
  const unreserved=await handler({...payload,scope_change_context:{...context,
    successor_job_id:'11000000-0000-4000-8000-000000000099'}});
  assert.equal(unreserved.isError,true);
  assert.match(unreserved.content[0].text,/SCOPE_CHANGE_REVIEWED_INTENT_OR_COMPLETE_RETIREMENT_REQUIRED/);
  const unfinished=await handler({...payload,scope_change_context:{...context,
    retired_job_snapshots:context.retired_job_snapshots.slice(1)}});
  assert.equal(unfinished.isError,true);
  const oldId=await handler({...payload,tasks:[{...payload.tasks[0],task_id:tOpen}]});
  assert.equal(oldId.isError,true);
  const zombieSnapshot={...retired[0],milestones:jobs[0].milestones};
  const zombies=await handler({...payload,scope_change_context:{...context,
    retired_job_snapshots:[{...context.retired_job_snapshots[0],
      job_record_text:JSON.stringify(zombieSnapshot)},...context.retired_job_snapshots.slice(1)]}});
  assert.equal(zombies.isError,true);
});
test('UB-03 high-risk mutation negative control: removing Task-coverage guard turns a forged intent falsely green',()=>{
  const i=JSON.parse(intentReady().intent_record_text);
  const f=fence(i,jobs[0]).record;
  const broken={...i,actions:i.actions.map(action=>action.predecessor_job_id===a
    ? {...action,retired_task_ids:[]} : action)};
  const context={project_id:pid,intent_record_text:JSON.stringify(broken),intent_record_sha:sha,
    intent_memory_path:intentReady().intent_memory_path,
    predecessor_job:f,predecessor_job_sha:fencedSha,
    cursor_state:'ABSENT',active_run_state:'NONE'};
  assert.equal(api.validatePlanChangeSupersession(context).allowed,false);
  const src=read('plan-change-decisions.ts');
  const pattern=/expectedRetired.length !== \(a.retired_task_ids \?\? \[\]\).length \|\|\s*expectedRetired.some\(\(id: string\) => !a.retired_task_ids.includes\(id\)\)/;
  assert.match(src,pattern);
  const mutantSource=src.replace(pattern,'false');
  const mutantFactory=vm.runInNewContext(toJS(mutantSource)+'\ncreatePlanChangeDecisions',deps);
  const mutant=mutantFactory(deps);
  assert.equal(mutant.validatePlanChangeSupersession(context).allowed,true,
    'The actual Task coverage guard is what rejects the forged intent');
});


test('UB-01 compatibility: historical cross-Phase node_id dependency retires downstream Job',()=>{
  // Source and current schema generate string dependencies; externally
  // persisted old Job snapshots may contain object-shaped task/node refs.
  // Under-inclusive closure must not keep dependent unfinished work alive.
  const variant=jobs.map(job=>job.job_id===b?{...job,dependencies:[{node_id:tOpen}]}:job);
  const impact=api.assessHumanPlanChangeJobs({...base,
    job_snapshots:variant.map(job=>({job_record_text:JSON.stringify(job),job_record_sha:sha}))});
  assert.equal(impact.allowed,true,impact.reason);
  const downstream=impact.decisions.find(x=>x.job_id===b);
  assert.equal(downstream.decision,'RETIRE');
  assert.equal(downstream.cross_boundary_dependency,true);
  assert.ok(impact.scope_summary.retiring_job_ids.includes(b));
  assert.equal(impact.mutation_authorized,false);
});
