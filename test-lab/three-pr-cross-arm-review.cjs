'use strict'
/* Independent exact-source cross-arm review. NO competitor branch mutation.
 * Reproduces a specific U-B semantic disagreement on two pinned Git refs.
 * Reads and transpiles the real classifyScopeWidePlanChange function.
 * CI success = probe completed, not unconditional approval of either arm.
 */
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const control='ade7fcdf71bb0273594edc390424c8d8c605c37c'
const candidate='b9df63862e3a7368b5ea91b7f545520a887844e1'
const SHA='a'.repeat(40)
const pid='22222222-2222-4222-8222-222222222221'
const plan='22222222-2222-4222-8222-222222222222'
const A='22222222-2222-4222-8222-222222222223'
const B='22222222-2222-4222-8222-222222222224'
const taskA='TASK-A'
function load(root) {
  const file=path.join(root,'supabase/functions/gsa-mcp/plan-change-decisions.ts')
  const source=fs.readFileSync(file,'utf8')
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length,0)
  const fn=ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text==='assessScopeWidePlanChange')
  assert.ok(fn,'U-B classifier missing '+file)
  const compiled=ts.transpileModule(fn.getText(ast),{fileName:file,compilerOptions:{
    target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},reportDiagnostics:true})
  assert.equal((compiled.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0)
  const context={
    isRecognizedJobRecordShape:j=>j?.kind==='JOB'&&typeof j.job_id==='string',
    jobExecutionContract:j=>j.execution_contract,
    JSON,Set,Array,Number,String,
  }
  return vm.runInNewContext(compiled.outputText+'; assessScopeWidePlanChange',context,{timeout:3500})
}
function input(variant) {
  const a={kind:'JOB',project_id:pid,job_id:A,lifecycle:'READY',
    execution_contract:'NEXT',planning_revision:1,
    planning_context:{phase:'ALPHA'},tasks:[{task_id:taskA,lifecycle:'READY'}]}
  const reference=variant==='node_id_object'?{node_id:taskA}:variant==='task_id_object'?{task_id:taskA}:taskA
  const b={kind:'JOB',project_id:pid,job_id:B,lifecycle:'READY',
    execution_contract:'NEXT',planning_revision:1,
    planning_context:{phase:'BETA'},tasks:[{task_id:'TASK-B',lifecycle:'READY'}],
    dependencies:[reference]}
  return {
    project_id:pid,change_ref:'reviewed-plan-change',reviewed_plan_sha:SHA,
    scope_change:{boundary:'PHASE',plan_job_id:plan,phase_id:'ALPHA',
      human_approval_ref:'human-approved-change-evidence',
      inventory_job_ids:[A,B],plan_member_job_ids:[A],
      successor_job_count:1},
    job_snapshots:[a,b].map(job=>({job_record_text:JSON.stringify(job),
      job_record_sha:SHA,cursor_state:'ABSENT',active_run_state:'NONE'})),
  }
}
const paths={control:process.argv[2],candidate:process.argv[3]}
assert.ok(paths.control&&paths.candidate,'pass two checked-out sources')
const results={}
for(const [arm,root] of Object.entries(paths)){
  const classify=load(root)
  results[arm]={ref:arm==='control'?control:candidate,cases:{}}
  for(const variant of ['string','task_id_object','node_id_object']){
    const r=JSON.parse(JSON.stringify(classify(input(variant))))
    assert.equal(r.allowed,true,'fixture rejected in '+arm+' '+variant+': '+r.reason)
    assert.equal(r.mutation_authorized,false)
    const decision=r.decisions.find(x=>x.job_id===B)
    assert.ok(decision)
    results[arm].cases[variant]={
      dependent_job_decision:decision.decision,
      cross_boundary_dependency:decision.cross_boundary_dependency,
      retiring_job_ids:r.scope_summary.retiring_job_ids,
    }
  }
}
for(const arm of ['control','candidate']){
  assert.equal(results[arm].cases.string.dependent_job_decision,'RETIRE')
  assert.equal(results[arm].cases.task_id_object.dependent_job_decision,'RETIRE')
}
assert.equal(results.control.cases.node_id_object.dependent_job_decision,'RETIRE')
assert.equal(results.candidate.cases.node_id_object.dependent_job_decision,'KEEP')
const summary={schema:'gsa3-gsa4-independent-cross-arm/v1',
  candidate_regression:'NODE_ID_DEPENDENCY_OMITTED_FROM_SCOPE_RETIREMENT',
  model_calls:0,host_memory_cas_tested:false,
  refs:{control,candidate},
  results,
  disposition:'CANDIDATE_U_B_OBJECT_NODE_ID_GAP_NEEDS_REPAIR_OR_SCHEMA_PROOF'}
console.log('GSA3_GSA4_INDEPENDENT_CROSS_ARM '+JSON.stringify(summary))
if(process.argv[4]){
  const file=path.resolve(process.argv[4])
  fs.mkdirSync(path.dirname(file),{recursive:true})
  fs.writeFileSync(file,JSON.stringify(summary,null,2)+'\n')
}
