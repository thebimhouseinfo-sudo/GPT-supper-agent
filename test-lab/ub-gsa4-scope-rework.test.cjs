'use strict'
// U-B GSA4 source-bound acceptance and negative controls; not durable CAS/Host E2E.
const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const vm=require('node:vm')
const ts=require('typescript')
const dir='supabase/functions/gsa-mcp/'
function exportedFactory(file,name){
  const src=fs.readFileSync(dir+file,'utf8')
  const ast=ts.createSourceFile(file,src,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length,0,'source parses: '+file)
  const f=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)
  assert.ok(f,name+' must be exported')
  const js=ts.transpileModule(f.getText(ast).replace(/^export\s+/,''),{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
  return vm.runInNewContext(js+'\n'+name,{Date,JSON,Set,Map,Array,String,Number},{timeout:3000})
}
const pid='0fa72d63-17b4-4e28-84d9-231a17f5fe70'
const planId='79a7c63d-9b84-4b4e-a290-6cd049513ec2'
const reviewId='b996d1f7-c1d1-42d3-bf40-389e3306d4ae'
const A='0ab83640-9e7f-4e59-9b92-a06f1b789013'
const B='d521c5d8-5a9d-44c6-845f-9ef60dcd61aa'
const C='0e14b94f-672a-4fd0-93e5-b8052ce95861'
const D='f374b17c-0d0b-46c6-8134-bd352b4a1021'
const E='2d109d1c-7005-4ba1-95a8-6d350ab51a19'
const U='2d109d1c-7005-4ba1-95a8-6d350ab51a20'
const successor1='1f7d0cc6-5f95-48f7-8a36-35cd330693a4'
const successor2='1f7d0cc6-5f95-48f7-8a36-35cd330693a5'
const sha='a'.repeat(40),intentSha='b'.repeat(40)
const contract=j=>['NEXT','V2_STABLE'].includes(j.execution_contract)?j.execution_contract:'V2_STABLE'
const namespace=j=>j.memory_namespace??null
const root=(id,c,n)=>'projects/'+id+(c==='NEXT'&&n==='TEST_LAB'?'/TEST-LAB/NEXT':'')
const pathFor=(id,vid,c,n)=>root(id,c,n)+'/VERIFICATION/'+vid+'.json'
const handle=id=>'J-'+id.replace(/-/g,'').slice(-4).toUpperCase()
let counter=0
const ids=[successor1,successor2]
const domain=exportedFactory('plan-change-decisions.ts','createPlanChangeDecisions')({
 jobExecutionContract:contract,executionMemoryRoot:root,recordNextMemoryNamespace:namespace,
 uuidv7:()=>ids[counter++]??'a64eb73d-106f-4a3f-a330-621b9da389ef',
 jobHandle:handle,verificationPath:pathFor,DEFAULT_NEXT_MEMORY_NAMESPACE:'PRODUCTION'
})
const makeJob=(id,lifecycle,phase,opts={})=>({
 kind:'JOB',project_id:pid,job_id:id,type:'code',execution_contract:'NEXT',
 memory_namespace:'PRODUCTION',planning_revision:1,lifecycle,
 planning_context:{phase},tasks:[{task_id:id+'-T',lifecycle:'READY'}],
 milestones:[{milestone_id:id+'-M',node_ids:[id+'-T'],lifecycle:'READY'}],...opts
})
const jobs=[
 makeJob(A,'IN_PROGRESS','A',{tasks:[{task_id:A+'-DONE',lifecycle:'COMPLETED'},{task_id:A+'-T',lifecycle:'READY'}]}),
 makeJob(B,'READY','B',{dependencies:[A+'-T']}),
 makeJob(C,'READY','B'),
 makeJob(D,'COMPLETED','A',{tasks:[{task_id:D+'-T',lifecycle:'COMPLETED'}],
  milestones:[{milestone_id:D+'-M',node_ids:[D+'-T'],lifecycle:'COMPLETED'}]}),
 makeJob(E,'READY','A'),makeJob(U,'READY','A')]
const inventory=jobs.map(j=>j.job_id),members=[A,C,D,E]
const scope={boundary:'PHASE',plan_job_id:planId,phase_id:'A',
 human_approval_ref:'HUMAN-APPROVED-PLAN-R2',successor_job_count:2,
 inventory_job_ids:inventory,plan_member_job_ids:members}
const snapshot=j=>({job_record_text:JSON.stringify(j),job_record_sha:sha,
  cursor_state:'ABSENT',active_run_state:'NONE'})
const reviewRef=pathFor(pid,reviewId,'NEXT','PRODUCTION')
const planJob={kind:'JOB',type:'plan',project_id:pid,job_id:planId,
 execution_contract:'NEXT',memory_namespace:'PRODUCTION',lifecycle:'READY',
 planning_revision:2,planning_review:{status:'PASS',reviewed_revision:2,verification_ref:reviewRef}}
const review={kind:'PLANNING_REVIEW',project_id:pid,job_id:planId,verification_id:reviewId,
 execution_contract:'NEXT',memory_namespace:'PRODUCTION',planning_revision:2,
 result:'PASS',producer:'reviewer'}
const input=()=>({project_id:pid,change_ref:'docs/PLAN-R2.md',reviewed_plan_sha:sha,
 scope_change:{...scope,inventory_job_ids:[...inventory],plan_member_job_ids:[...members]},
 job_snapshots:jobs.map(snapshot),plan_job_record_text:JSON.stringify(planJob),
 plan_job_record_sha:sha,plan_review_record_text:JSON.stringify(review),
 plan_review_record_sha:sha,plan_review_memory_path:reviewRef,
 work_branch:'upgrade/gsa-context-efficiency'})
const plain=x=>JSON.parse(JSON.stringify(x))

test('UB-01 PHASE: transitive unfinished dependents retire; completed and unrelated are preserved',()=>{
 const out=domain.assessHumanPlanChangeJobs(input())
 assert.equal(out.allowed,true,out.reason)
 assert.equal(out.mutation_authorized,false)
 assert.deepEqual(plain(out.scope_summary.retiring_job_ids),[A,B,E].sort())
 assert.deepEqual(plain(out.scope_summary.cross_boundary_job_ids),[B])
 assert.deepEqual(plain(out.scope_summary.completed_outcome_job_ids),[D])
 const d=new Map(out.decisions.map(x=>[x.job_id,x]))
 assert.equal(d.get(A).decision,'RETIRE')
 assert.deepEqual(plain(d.get(A).retired_task_ids),[A+'-T'])
 for(const x of [C,D,U])assert.equal(d.get(x).decision,'KEEP')
 assert.equal(d.get(D).completed_outcome_review_required,true)
})
test('UB-01 PLAN: all unfinished Plan members retire, but nonmember stays',()=>{
 const x=input();x.scope_change={...x.scope_change,boundary:'PLAN'};delete x.scope_change.phase_id
 const out=domain.assessScopeWidePlanChange(x)
 assert.equal(out.allowed,true,out.reason)
 assert.deepEqual(plain(out.scope_summary.retiring_job_ids),[A,B,C,E].sort())
 assert.equal(out.decisions.find(x=>x.job_id===U).decision,'KEEP')
})
test('UB-01 negatives: incomplete inventory, approval, phase mapping and caller override fail closed',()=>{
 let x=input();x.scope_change.inventory_job_ids=x.scope_change.inventory_job_ids.slice(1)
 assert.equal(domain.assessHumanPlanChangeJobs(x).allowed,false)
 x=input();x.scope_change.human_approval_ref=''
 assert.equal(domain.assessHumanPlanChangeJobs(x).allowed,false)
 x=input();x.job_snapshots[0].job_record_text=JSON.stringify({...jobs[0],planning_context:{}})
 assert.equal(domain.assessHumanPlanChangeJobs(x).reason,'SCOPE_CHANGE_PHASE_MAPPING_INCOMPLETE')
 x=input();x.job_snapshots[0].decision='KEEP'
 assert.equal(domain.assessHumanPlanChangeJobs(x).reason,'SCOPE_CHANGE_PER_JOB_DECISION_CONFLICT')
 x=input();x.job_snapshots[0].cursor_state='PENDING'
 assert.equal(domain.assessHumanPlanChangeJobs(x).decisions.find(y=>y.job_id===A).next_action,
  'RECONCILE_PENDING_CURSOR_BEFORE_SUPERSEDE')
})
test('UB-02 reviewed immutable intent reserves fresh non-1:1 successor IDs and survives retries',()=>{
 counter=0
 const first=domain.prepareHumanPlanChangeIntent(input())
 assert.equal(first.allowed,true,first.reason)
 assert.equal(first.operation,'CREATE')
 assert.equal(first.mutation_authorized,false)
 const intent=JSON.parse(first.intent_record_text)
 assert.deepEqual(plain(intent.scope_change.successor_job_ids),ids)
 assert.equal(intent.actions.filter(x=>x.decision==='RETIRE').length,3)
 assert.equal(intent.actions.filter(x=>x.decision==='REPLACE').length,0)
 const again=domain.prepareHumanPlanChangeIntent({...input(),existing_intent_record_text:first.intent_record_text,
  existing_intent_record_sha:intentSha})
 assert.equal(again.allowed,true,again.reason)
 assert.equal(again.operation,'NONE')
 assert.equal(again.intent_record_text,first.intent_record_text)
 const drift=input();drift.scope_change.successor_job_count=3
 assert.equal(domain.prepareHumanPlanChangeIntent({...drift,existing_intent_record_text:first.intent_record_text,
  existing_intent_record_sha:intentSha}).reason,'PLAN_CHANGE_EXISTING_INTENT_CONFLICT')
 assert.equal(domain.prepareHumanPlanChangeIntent({...input(),scope_change:{...scope,plan_job_id:A}}).reason,
  'SCOPE_CHANGE_PLAN_JOB_MISMATCH')
})
test('UB-02 fence and terminal transitions require reviewed immutable intent and settled cursor/Run',()=>{
 counter=0
 const prepared=domain.prepareHumanPlanChangeIntent(input())
 const intent=JSON.parse(prepared.intent_record_text)
 const ctx={project_id:pid,job_id:A,job_record_text:JSON.stringify(jobs[0]),job_record_sha:sha,
  intent_record_text:prepared.intent_record_text,intent_record_sha:intentSha,
  intent_memory_path:prepared.intent_memory_path}
 const fence=domain.prepareHumanPlanChangeFenceDecision(ctx)
 assert.equal(fence.allowed,true,fence.reason)
 assert.equal(fence.record.plan_change_pending.change_id,intent.change_id)
 const term={project_id:pid,predecessor_job:fence.record,predecessor_job_sha:sha,
  intent_record_text:prepared.intent_record_text,intent_record_sha:intentSha,
  intent_memory_path:prepared.intent_memory_path,cursor_state:'ABSENT',active_run_state:'NONE'}
 assert.equal(domain.validatePlanChangeSupersession(term).allowed,true)
 assert.equal(domain.validatePlanChangeSupersession({...term,cursor_state:'PENDING'}).allowed,false)
 assert.equal(domain.validatePlanChangeSupersession({...term,active_run_state:'ACTIVE'}).allowed,false)
 const missing={...fence.record,plan_change_pending:null}
 assert.equal(domain.validatePlanChangeSupersession({...term,predecessor_job:missing}).allowed,false)
 const partial={...fence.record,tasks:[...fence.record.tasks,{task_id:'UNLISTED',lifecycle:'READY'}]}
 assert.equal(domain.validatePlanChangeSupersession({...term,predecessor_job:partial}).reason,
  'SCOPE_CHANGE_UNFINISHED_TASK_COVERAGE_MISMATCH')
})
test('UB-02 resume refuses zombie unfinished milestones; complete retirement can create fresh topology',()=>{
 counter=0
 const prep=domain.prepareHumanPlanChangeIntent(input())
 const intent=JSON.parse(prep.intent_record_text)
 const retired=jobs.map(j=>{
  const action=intent.actions.find(a=>a.predecessor_job_id===j.job_id)
  if(action.decision!=='RETIRE')return j
  return {...j,lifecycle:'RETIRED',result:'RETIRED',retired_by_plan_change_id:intent.change_id,
   retired_reason:action.reason,retired_by_replacement_job_id:null,
   tasks:j.tasks.map(t=>t.lifecycle==='COMPLETED'?t:{...t,lifecycle:'RETIRED'}),
   milestones:j.milestones.map(m=>({...m,lifecycle:'RETIRED'}))}
 })
 const args={project_id:pid,intent_record_text:prep.intent_record_text,
  intent_record_sha:intentSha,intent_memory_path:prep.intent_memory_path,
  current_job_snapshots:retired.map(snapshot),activity:[]}
 const good=domain.resumeHumanPlanChangeIntent(args)
 assert.equal(good.allowed,true,good.reason)
 assert.equal(good.scope_ready_for_new_topology,true)
 assert.equal(good.next_scope_action,'CREATE_FRESH_REVIEWED_TOPOLOGY')
 const corrupt=retired.map(j=>j.job_id===A?{...j,milestones:jobs[0].milestones}:j)
 assert.equal(domain.resumeHumanPlanChangeIntent({...args,current_job_snapshots:corrupt.map(snapshot)}).reason,
  'SCOPE_CHANGE_TERMINAL_TASK_OR_MILESTONE_ZOMBIE')
 assert.equal(domain.resumeHumanPlanChangeIntent({...args,current_job_snapshots:retired.slice(1).map(snapshot)}).reason,
  'SCOPE_CHANGE_INVENTORY_OR_ACTION_DRIFT')
})

function register(file,name,deps){
 const handlers=new Map()
 const fn=exportedFactory(file,name)
 const chain=new Proxy(function(){return chain},{get:()=>chain,apply:()=>chain})
 const z=new Proxy({}, {get:()=>chain})
 const stubSchema=chain
 fn({server:{registerTool:(n,_def,h)=>handlers.set(n,h)},z,req:{},
   AUTH_SCOPES:[],DURABLE_RECORD_SNAPSHOT_SCHEMA:stubSchema,
   authContext:async()=>({id:'test'}),authError:()=>({isError:true}),
   ...deps})
 return handlers
}
test('UB-03 late NEXT Run completion is denied for any role on pending/stale/terminal Job',async()=>{
 const out=register('run/complete.ts','registerRunComplete',{
  resolveExecutionContract:c=>['NEXT','V2_STABLE'].includes(c)?c:null,
  recordNextMemoryNamespace:namespace,jobExecutionContract:contract,
  recordPath:(_p,kind,id)=>kind+'/'+id,prettyJson:x=>JSON.stringify(x),
  durableSnapshotReadbackSteps:()=>[],DEFAULT_NEXT_MEMORY_NAMESPACE:'PRODUCTION'
 }).get('run_complete')
 assert.equal(typeof out,'function')
 const run={run_id:reviewId,project_id:pid,job_id:A,role:'planner',
  lifecycle:'IN_PROGRESS',execution_contract:'NEXT',memory_namespace:'PRODUCTION',planning_revision:1}
 const args={project_id:pid,job_id:A,run_id:reviewId,role:'planner',
  run_record_text:JSON.stringify(run),run_record_sha:sha,lifecycle:'COMPLETED',result:'PASS',
  output_refs:[],verification_refs:[]}
 const rejected=await out(args)
 assert.match(rejected.content[0].text,/REQUIRES_CURRENT_JOB_SHA/)
 const owner=jobs[0]
 const accepted=await out({...args,job_record_text:JSON.stringify(owner),job_record_sha:sha})
 assert.ok(accepted.structuredContent,'legal current Job can settle this planner Run')
 assert.equal(JSON.parse(accepted.structuredContent.terminal_run_record_text).lifecycle,'COMPLETED')
 for(const bad of [
   {...owner,plan_change_pending:{change_id:'new-plan'}},
   {...owner,lifecycle:'RETIRED'},
   {...owner,planning_revision:2},
   {...owner,memory_namespace:'TEST_LAB'},
 ]) {
   const res=await out({...args,job_record_text:JSON.stringify(bad),job_record_sha:sha})
   assert.equal(res.isError,true)
   assert.match(res.content[0].text,/PLAN_CHANGE_RUN_COMPLETION_FENCED_OR_STALE_JOB/)
 }
 const failedSettlement=await out({...args,lifecycle:'FAILED',job_record_text:null,job_record_sha:null})
 assert.ok(failedSettlement.structuredContent,'failed/cancelled settlement remains possible')
})

test('UB-04 fresh successor preserves non-1:1 intent lineage, requires complete retiring evidence and fresh identifiers',async()=>{
 counter=0
 const prepared=domain.prepareHumanPlanChangeIntent(input())
 assert.equal(prepared.allowed,true,prepared.reason)
 const intent=JSON.parse(prepared.intent_record_text)
 const retired=jobs.filter(j=>intent.actions.find(a=>a.predecessor_job_id===j.job_id).decision==='RETIRE')
   .map(j=>{
     const action=intent.actions.find(a=>a.predecessor_job_id===j.job_id)
     return {...j,lifecycle:'RETIRED',result:'RETIRED',retired_by_plan_change_id:intent.change_id,
       tasks:j.tasks.map(t=>t.lifecycle==='COMPLETED'?t:{...t,lifecycle:'RETIRED'}),
       milestones:j.milestones.map(m=>({...m,lifecycle:'RETIRED'}))}
   })
 const registerJob=register('job-prepare-tool.ts','registerJobPrepareTool',{
   readMemoryConfig:async()=>({data:{memory_repo_full_name:'someowner/memory'}}),
   normalizeGithubRepo:u=>({url:u}),
   resolveExecutionContract:c=>['NEXT','V2_STABLE'].includes(c)?c:null,
   jobCreationExecutionContractDefault:()=> 'NEXT',
   nextMemoryNamespaceForRequest:()=> 'PRODUCTION',
   jobHandle:handle,uuidv7:()=> 'fresh-id-unused',
   validIntegrationBranch:()=>true,projectCriteriaBindingError:()=>null,
   cutoverInventoryError:()=>null,validateExecutionTopology:()=>null,
   normalizeNextPlanningModel:(x)=>x,validateNextPlanningModel:()=>null,
   recordPath:(_p,collection,id)=>collection+'/'+id,
   executionMemoryRoot:root,jobExecutionContract:contract,
   planningLoopContinuationDecision:()=>({next_action_after_readback:'REVIEW_CURRENT_REVISION'}),
   prettyJson:x=>JSON.stringify(x),DEFAULT_NEXT_MEMORY_NAMESPACE:'PRODUCTION'
 }).get('job_prepare')
 assert.equal(typeof registerJob,'function')
 const ctx={intent_record_text:prepared.intent_record_text,intent_record_sha:intentSha,
   intent_memory_path:prepared.intent_memory_path,reviewed_plan_sha:sha,
   successor_job_id:successor1,retired_job_snapshots:retired.map(snapshot)}
 const url='https://github.com/thebimhouseinfo-sudo/GPT-supper-agent'
 const draft={project_id:pid,type:'code',objective:'New reviewed work',
   scope:['fresh'],non_goals:[],execution_contract:'NEXT',plan_kind:'JOB',
   integration_branch:'upgrade/gsa-context-efficiency',work_context:'NEW',
   phase:'A',milestone:'m1',relationship_scan_summary:'No other callers',
   job_sizing:{size:'SMALL',rationale:'bounded'},brownfield_logic_review:[],
   relationship_assessment:[],repository_structure_evidence:['known'],
   project_repository_mode:'SINGLE',registered_repositories:[url],
   working_repository_url:url,cross_repo_impact:[{repository_url:url,impact:'NONE'}],
   tasks:[{task_id:'NEW-T',objective:'new',completion_criteria:['Pass']}],
   milestones:[{milestone_id:'NEW-M',name:'new',node_ids:['NEW-T']}],
   // A canonical TASK topology node has the SAME identity as its owning Task.
   planning_topology:[{node_id:'NEW-T',node_type:'TASK'}],
   evidence_needs:[],test_checkpoints:[],evidence_requirements:[],
   completion_requirements:['Pass'],
   scope_change_context:ctx}
 const good=await registerJob(draft)
 assert.ok(good.structuredContent,'valid scope descendant must produce DRAFT Job: '+good.content?.[0]?.text)
 const job=JSON.parse(good.structuredContent.job_record_text)
 assert.equal(job.job_id,successor1)
 assert.equal(job.scope_supersession_id,intent.change_id)
 assert.deepEqual(plain(job.scope_predecessor_job_ids).sort(),[A,B,E].sort())
 assert.equal(job.planning_review.status,'PENDING')
 assert.equal(job.lifecycle,'DRAFT')
 assert.equal(job.tasks[0].task_id,'NEW-T')
 assert.equal(job.planning_topology[0].node_id,'NEW-T')
 assert.equal(good.structuredContent.external_steps.some(s=>s.includes('independently reread immutable Plan intent')),false)
 assert.equal(good.structuredContent.external_steps.some(s=>s.includes('Independently reread immutable Plan intent')),true)
 const incomplete=await registerJob({...draft,scope_change_context:{...ctx,
   retired_job_snapshots:ctx.retired_job_snapshots.slice(1)}})
 assert.equal(incomplete.isError,true)
 assert.match(incomplete.content[0].text,/SCOPE_CHANGE_REVIEWED_INTENT_OR_COMPLETE_RETIREMENT_REQUIRED/)
 const reused=await registerJob({...draft,tasks:[{task_id:A+'-T',objective:'old',completion_criteria:['x']}]})
 assert.equal(reused.isError,true)
 assert.match(reused.content[0].text,/SCOPE_CHANGE_FRESH_JOB_TASK_MILESTONE_TOPOLOGY_IDS_REQUIRED/)
 const stale=await registerJob({...draft,scope_change_context:{...ctx,intent_record_sha:'wrong'}})
 assert.equal(stale.isError,true)
 const oneToOne=await registerJob({...draft,replacement_context:{intent_record_text:'{}'}})
 assert.equal(oneToOne.isError,true)
 assert.match(oneToOne.content[0].text,/SCOPE_CHANGE_AND_ONE_TO_ONE_REPLACEMENT_CONFLICT/)
})
