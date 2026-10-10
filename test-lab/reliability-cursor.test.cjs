// Execute real runtime cursor helpers. Tests validate state/latency policy;
// GitHub CAS and live Project operations remain separate acceptance surfaces.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('supabase/functions/gsa-mcp/index.ts','utf8');
const parsed = ts.createSourceFile('index.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
function load(name,injected={}) {
  const decl=parsed.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name);
  assert.ok(decl,'Runtime function exists: '+name);
  const js=ts.transpileModule(decl.getText(parsed),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  return vm.runInContext(js+'\n'+name,vm.createContext({JSON,Number,String,Date,...injected}));
}
const namespace=job=>job?.memory_namespace==='TEST_LAB'?'TEST_LAB':job?.memory_namespace==='PRODUCTION'?'PRODUCTION':null;
const root=(project,contract,ns)=>'projects/'+project+(ns==='TEST_LAB'?'/TEST-LAB/NEXT':'');
const cursorPath=load('executionCursorPath',{executionMemoryRoot:root});
const recovery=load('sourceMutationRecoveryDecision');
const contract=job=>job?.execution_contract==null?'V2_STABLE':(['NEXT','V2_STABLE'].includes(job.execution_contract)?job.execution_contract:null);
const prepare=load('prepareExecutionCursorDecision',{recordNextMemoryNamespace:namespace,jobExecutionContract:contract});
const resume=load('resumeExecutionCursorDecision',{recordNextMemoryNamespace:namespace,executionCursorPath:cursorPath,sourceMutationRecoveryDecision:recovery});
const project='0fa72d63-17b4-4e28-84d9-231a17f5fe70';
const jobId='0ab83640-9e7f-4e59-9b92-a06f1b789013';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40),d='d'.repeat(40),cursorSha='e'.repeat(40);
const job={kind:'JOB',project_id:project,job_id:jobId,execution_contract:'NEXT',memory_namespace:'TEST_LAB',planning_revision:2,lifecycle:'IN_PROGRESS'};
const base={project_id:project,job_id:jobId,job_record_text:JSON.stringify(job),memory_namespace:'TEST_LAB',work_branch:'upgrade/gsa-reliability',observed_head_sha:a};
const start=()=>prepare({...base,event:'BEGIN_MUTATION',checkpoint_id:'PLAN_LOCKED',operation_id:'write-1',target_path:'src/feature.ts',previous_blob_sha:b,intended_blob_sha:c});
const snapshot=(record)=>({cursor_record_text:JSON.stringify(record),cursor_record_sha:cursorSha});
test('first meaningful write needs only one cursor CREATE (not separate initialization)',()=>{
  const r=start();assert.equal(r.allowed,true);assert.equal(r.operation,'CREATE');
  assert.equal(r.record.kind,'EXECUTION_CURSOR');assert.equal(r.record.version,1);
  assert.equal(r.record.state,'PENDING');assert.equal(r.record.pending_action.operation_id,'write-1');
  assert.equal(r.record.last_good_sha,a);
  assert.equal(cursorPath(project,jobId,'TEST_LAB'),`projects/${project}/TEST-LAB/NEXT/WORK/EXECUTION_CURSORS/${jobId}.json`);
  assert.equal(prepare({...base,event:'INITIALIZE',checkpoint_id:'PLAN_LOCKED'}).operation,'CREATE');
});
test('resume after chat interruption reads one durable pending intent',()=>{
  const r=start().record;
  const input={...base,...snapshot(r),cursor_memory_path:cursorPath(project,jobId,'TEST_LAB'),current_head_sha:a,current_blob_sha:b};
  assert.equal(resume(input).disposition,'NOT_APPLIED');
  assert.equal(resume({...input,current_head_sha:d,current_blob_sha:c}).disposition,'TARGET_STATE_PRESENT');
  assert.equal(resume({...input,current_head_sha:d,current_blob_sha:b}).disposition,'UNKNOWN_CONFLICT');
  assert.equal(resume(input).source_write_authorized,false);
  assert.equal(resume({...input,cursor_memory_path:'projects/x/WORK/EXECUTION_CURSORS/'+jobId+'.json'}).disposition,'STOP_AND_RECONCILE');
  assert.equal(resume({...input,job_record_text:JSON.stringify({...job,planning_revision:3})}).disposition,'STOP_AND_RECONCILE');
});
test('do not repeat pending mutation after lost response; finish requires commit ancestry',()=>{
  const pending=start().record;
  assert.equal(prepare({...base,...snapshot(pending),event:'BEGIN_MUTATION',operation_id:'write-1',target_path:'src/feature.ts',previous_blob_sha:b,intended_blob_sha:c}).reason,'PENDING_MUTATION_REQUIRES_RECONCILIATION');
  const fields={...base,...snapshot(pending),event:'COMPLETE_MUTATION',operation_id:'write-1',checkpoint_id:'CODE_COMPLETE',observed_head_sha:d,observed_blob_sha:c};
  assert.equal(prepare({...fields,observed_parent_sha:b}).reason,'PENDING_MUTATION_NOT_PROVEN');
  const good=prepare({...fields,observed_parent_sha:a});
  assert.equal(good.allowed,true);assert.equal(good.operation,'UPDATE');
  assert.equal(good.record.state,'STABLE');assert.equal(good.record.pending_action,null);
  assert.equal(good.record.last_operation_id,'write-1');
  assert.equal(good.record.last_completed_checkpoint,'CODE_COMPLETE');assert.equal(good.record.last_good_sha,d);
  assert.equal(resume({...base,...snapshot(good.record),cursor_memory_path:cursorPath(project,jobId,'TEST_LAB'),current_head_sha:d}).disposition,'RESUME_FROM_CHECKPOINT');
  assert.equal(resume({...base,...snapshot(good.record),cursor_memory_path:cursorPath(project,jobId,'TEST_LAB'),current_head_sha:a}).disposition,'STOP_AND_RECONCILE');
});
test('cursor preserves Job namespace/revision and does not rewrite V2_STABLE',()=>{
  assert.equal(prepare({...base,job_record_text:JSON.stringify({...job,execution_contract:'V2_STABLE'}),event:'INITIALIZE',checkpoint_id:'A'}).allowed,false);
  assert.equal(prepare({...base,memory_namespace:'PRODUCTION',event:'INITIALIZE',checkpoint_id:'A'}).reason,'CURSOR_NAMESPACE_MISMATCH');
  assert.equal(prepare({...base,job_record_text:JSON.stringify({...job,lifecycle:'COMPLETED'}),event:'INITIALIZE',checkpoint_id:'A'}).allowed,false);
  assert.equal(prepare({...base,job_record_text:JSON.stringify({...job,lifecycle:'READY'}),event:'BEGIN_MUTATION',checkpoint_id:'PLAN_LOCKED',operation_id:'w',target_path:'src/a.ts',previous_blob_sha:b,intended_blob_sha:c}).reason,'JOB_NOT_IN_PROGRESS');
  const stable=prepare({...base,event:'INITIALIZE',checkpoint_id:'PLAN_LOCKED'}).record;
  assert.equal(prepare({...base,...snapshot(stable),job_record_text:JSON.stringify({...job,planning_revision:3}),event:'SAVE_CHECKPOINT',checkpoint_id:'A'}).reason,'STALE_OR_INVALID_CURSOR');
});
test('idle tool calls do not require writes; only meaningful checkpoints and stop pause',()=>{
  const stable=prepare({...base,event:'INITIALIZE',checkpoint_id:'PLAN_LOCKED'}).record;
  assert.equal(prepare({...base,...snapshot(stable),event:'SAVE_CHECKPOINT',checkpoint_id:'PLAN_LOCKED'}).allowed,false);
  assert.equal(prepare({...base,...snapshot(stable),event:'RECORD_PAUSE',stalled_cycles:2}).allowed,false);
  const stop=prepare({...base,...snapshot(stable),event:'RECORD_PAUSE',stalled_cycles:3});
  assert.equal(stop.allowed,true);assert.equal(stop.record.stalled_cycles,3);
  assert.equal(prepare({...base,...snapshot(stop.record),event:'RECORD_PAUSE',stalled_cycles:3}).allowed,false);
  assert.equal(prepare({...base,...snapshot(stable),event:'SAVE_CHECKPOINT',checkpoint_id:'TESTER_PASS'}).allowed,true);
});
test('mutation negative control: invalid head ancestry fails checkpoint finalization',()=>{
  const p=start().record;
  const good=prepare({...base,...snapshot(p),event:'COMPLETE_MUTATION',operation_id:'write-1',checkpoint_id:'CODE_COMPLETE',observed_head_sha:d,observed_blob_sha:c,observed_parent_sha:a});
  assert.equal(good.allowed,true);
  assert.equal(prepare({...base,...snapshot(p),event:'COMPLETE_MUTATION',operation_id:'write-1',checkpoint_id:'CODE_COMPLETE',observed_head_sha:d,observed_blob_sha:c,observed_parent_sha:b}).reason,'PENDING_MUTATION_NOT_PROVEN');
});
test('rare retries are persisted before source retry and capped at two',()=>{
  const original=start().record;
  const retry1=prepare({...base,...snapshot(original),event:'RECORD_RETRY',operation_id:'write-1',observed_blob_sha:b});
  assert.equal(retry1.allowed,true);assert.equal(retry1.record.retry_count,1);
  const retry2=prepare({...base,...snapshot(retry1.record),event:'RECORD_RETRY',operation_id:'write-1',observed_blob_sha:b});
  assert.equal(retry2.allowed,true);assert.equal(retry2.record.retry_count,2);
  const denied=prepare({...base,...snapshot(retry2.record),event:'RECORD_RETRY',operation_id:'write-1',observed_blob_sha:b});
  assert.equal(denied.reason,'RETRY_BLOCKED_OR_EXHAUSTED');
  assert.equal(prepare({...base,...snapshot(original),event:'RECORD_RETRY',operation_id:'other'}).allowed,false);
  assert.equal(prepare({...base,...snapshot(original),event:'RECORD_RETRY',operation_id:'write-1',observed_blob_sha:c}).reason,'RETRY_BLOCKED_OR_EXHAUSTED');
  assert.equal(prepare({...base,...snapshot(original),observed_head_sha:d,event:'RECORD_RETRY',operation_id:'write-1',observed_blob_sha:b}).allowed,false);
});
test('one TREE intent covers a multi-file atomic commit without per-file cursor writes',()=>{
  const tree=start();
  assert.equal(tree.allowed,true);
  const original=prepare({...base,event:'BEGIN_MUTATION',mutation_kind:'TREE',checkpoint_id:'PLAN_LOCKED',operation_id:'batch-2files',previous_tree_sha:b,intended_tree_sha:c});
  assert.equal(original.allowed,true);assert.equal(original.record.pending_action.mutation_kind,'TREE');
  assert.equal(original.record.pending_action.target_path,undefined);
  const input={...base,...snapshot(original.record),cursor_memory_path:cursorPath(project,jobId,'TEST_LAB'),current_head_sha:a,current_tree_sha:b};
  assert.equal(resume(input).disposition,'NOT_APPLIED');
  assert.equal(resume({...input,current_head_sha:d,current_tree_sha:c}).disposition,'TARGET_STATE_PRESENT');
  assert.equal(resume({...input,current_head_sha:d,current_tree_sha:b}).disposition,'UNKNOWN_CONFLICT');
  // Same HEAD cannot yield a different tree: runtime reports UNKNOWN_CONFLICT,
  // which is fail-closed and explicitly routes to STOP_AND_RECONCILE.
  const inconsistent=resume({...input,current_tree_sha:d});
  assert.equal(inconsistent.disposition,'UNKNOWN_CONFLICT');
  assert.equal(inconsistent.reason,'INCONSISTENT_HEAD_AND_TREE');
  assert.equal(inconsistent.next_action,'STOP_AND_RECONCILE');
  assert.equal(inconsistent.source_write_authorized,false);
  assert.equal(prepare({...base,...snapshot(original.record),event:'COMPLETE_MUTATION',operation_id:'batch-2files',checkpoint_id:'CODE_COMPLETE',observed_head_sha:d,observed_parent_sha:a,observed_tree_sha:b}).reason,'PENDING_MUTATION_NOT_PROVEN');
  const success=prepare({...base,...snapshot(original.record),event:'COMPLETE_MUTATION',operation_id:'batch-2files',checkpoint_id:'CODE_COMPLETE',observed_head_sha:d,observed_parent_sha:a,observed_tree_sha:c});
  assert.equal(success.allowed,true);
  assert.equal(success.record.last_operation_id,'batch-2files');
  assert.equal(success.record.state,'STABLE');
});
test('new cursor tools are authenticated, read-only and not in the always-loaded default skills',()=>{
  for (const name of ['execution_cursor_prepare','execution_cursor_resume_evaluate']) {
    assert.match(source,new RegExp("server\\.registerTool\\(\\s*'"+name+"'"));
  }
  assert.match(source,/Authentication required for Job cursor preparation/);
  assert.match(source,/Authentication required for Job cursor recovery/);
  assert.match(source,/lazily persist one Job execution cursor on the first consequential atomic Git mutation/);
  assert.match(source,/execution_cursor_resume_evaluate decides last checkpoint or pending mutation/);
  assert.match(source,/No cursor round trips for ordinary tools/);
  const skills=source.slice(source.indexOf('const ROLE_SKILLS'),source.indexOf('const RUNTIME_SKILLS'));
  assert.match(skills,/coder:\s*\['coding-loop', 'delegation'\]/);
});

test('LLC58: cursor admission diagnoses identity, terminal, revision and legacy contract separately',()=>{
  const probe=(overrides, ids={})=>prepare({...base,...ids,job_record_text:JSON.stringify({...job,...overrides}),event:'INITIALIZE',checkpoint_id:'P'});
  assert.equal(probe({kind:'RUN'}).reason,'JOB_RECORD_KIND_INVALID');
  assert.equal(probe({project_id:'wrong-project'}).reason,'PROJECT_ID_MISMATCH');
  assert.equal(probe({job_id:'wrong-job'}).reason,'JOB_ID_MISMATCH');
  assert.equal(probe({execution_contract:'V2_STABLE'}).reason,'LEGACY_JOB_CURSOR_NOT_APPLICABLE');
  assert.equal(probe({execution_contract:null}).reason,'LEGACY_JOB_CURSOR_NOT_APPLICABLE');
  assert.equal(probe({execution_contract:'UNKNOWN'}).reason,'JOB_EXECUTION_CONTRACT_INCOMPATIBLE');
  assert.equal(probe({planning_revision:0}).reason,'JOB_PLAN_REVISION_INVALID');
  assert.equal(probe({planning_revision:'2'}).reason,'JOB_PLAN_REVISION_INVALID');
  for (const lifecycle of ['COMPLETED','CANCELLED','SUPERSEDED']) {
    assert.equal(probe({lifecycle}).reason,'JOB_LIFECYCLE_INVALID');
  }
  assert.equal(probe({}).allowed,true);
  assert.equal(probe({memory_namespace:'PRODUCTION'}).reason,'CURSOR_NAMESPACE_MISMATCH');
});
test('LLC58 negative control: historical default does not convert legacy Job into NEXT',()=>{
  const legacy=JSON.stringify({...job,execution_contract:'V2_STABLE',lifecycle:'IN_PROGRESS'});
  const denied=prepare({...base,job_record_text:legacy,event:'BEGIN_MUTATION',
    checkpoint_id:'P',operation_id:'do-not-write',target_path:'src/x',previous_blob_sha:b,intended_blob_sha:c});
  assert.equal(denied.allowed,false);
  assert.equal(denied.operation,'NONE');
  assert.equal(denied.reason,'LEGACY_JOB_CURSOR_NOT_APPLICABLE');
  assert.equal(denied.record,null);
});
