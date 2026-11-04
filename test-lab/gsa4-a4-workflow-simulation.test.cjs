'use strict'
// Real TypeScript function replay: 4 common GSA workflows, many sequential events.
// FULL and A4 receive identical changing synthetic Project/Job/Run messages.
// This is NOT a language-model behavior trial or external Git/Host write.
const {test}=require('node:test'), assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript')
const {loadSourceModule}=require('./helpers/harness-ts-loader.cjs')
const ROOT=path.resolve(__dirname,'..'), SRC=path.join(ROOT,'supabase/functions/gsa-mcp')
const catalog=loadSourceModule('harness-catalog.ts')
const locator=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/architecture/GSA4-A1-SOURCE-LOCATOR.json'),'utf8'))
const graph=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/architecture/GSA4-A3-REPAIR-EDGES.json'),'utf8'))
const PROJECT='c2927684-543e-4b9d-ae4e-0150e9910f51'
const JOB='c2927684-543e-4b9d-ae4e-0150e9910f52'
const HEAD='d0076b1c32f364dbec32d6be152f013ae40e252e',SHA='a'.repeat(40),OTHER='b'.repeat(40)
function load(file,imports={}){
  const full=path.join(SRC,file),src=fs.readFileSync(full,'utf8')
  const ast=ts.createSourceFile(full,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length,0)
  const compiled=ts.transpileModule(src,{fileName:full,compilerOptions:{
    target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true})
  assert.equal((compiled.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0)
  const m={exports:{}}
  vm.runInNewContext(compiled.outputText,{module:m,exports:m.exports,require(k){
    assert.ok(Object.hasOwn(imports,k),'Unexpected import '+k)
    return imports[k]
  }},{filename:full,timeout:2500})
  return m.exports
}
const a2=load('task-context-recipe.ts',{'./harness-catalog.ts':catalog}).buildTaskContextRecipe
const a3=load('repair-context-route.ts').buildRepairContextRoute
const a4=load('selective-harness-preview.ts',{'./harness-catalog.ts':catalog}).previewSelectiveHarness
const bootstrap=load('bootstrap.ts',{'./project-utils.ts':{
  projectCriteriaBindingError(){throw Error('Not called by four-status checklist')}
}}).projectBootstrapChecklistDecision
const plain=x=>JSON.parse(JSON.stringify(x))
const allShared=catalog.BASE_AGENT_HARNESS.split('\n').filter(s=>s.startsWith('- '))
const necessary=[
  'HUMAN EXECUTION APPROVAL','BRANCH AUTHORITY','CRITERIA CHANGE ORDER',
  'TECH ADVISOR CHECKPOINTS','LLC58 HUMAN PLAN CHANGE',
  'STOPCHAT','REVIEW LOOP','Agent-authored text never counts as human approval']
function fresh(){
  return {role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',
    human_message_kind:'SAME_APPROVED_TASK',
    project_id:PROJECT,job_sha:SHA,current_job_sha:SHA,tool:'run_begin',
    failure:'PRODUCT_FAILURE',observed:true,
    job:{kind:'JOB',project_id:PROJECT,job_id:JOB,lifecycle:'IN_PROGRESS',
      execution_contract:'NEXT',planning_revision:2,planning_review:{status:'PASS',reviewed_revision:2},
      planning_context:{phase:'implementation'},
      tasks:[{task_id:'repair',objective:'Fix verified product defect',scope:['run helper'],
        dependencies:[],completion_criteria:['RED and GREEN on reviewed target'],
        required_skills:[],lifecycle:'READY'}],
      topology:[{task_id:'repair',handler:'coder'}]},
    run:{project_id:PROJECT,job_id:JOB,role:'coder',primary_task_id:'repair',
      planning_revision:2,lifecycle:'IN_PROGRESS'}}
}
function evaluate(s,arm){
  const t=plain(a2({role:s.role,project_id:s.project_id,job:s.job,task_id:'repair',
    job_record_path:`projects/${PROJECT}/WORK/JOBS/${JOB}.json`,
    job_record_sha:s.job_sha,current_job_record_sha:s.current_job_sha,
    run:s.run,source_locator:locator,source_locator_ref:HEAD,current_source_ref:HEAD,
    tool_names:[s.tool]}))
  const r=plain(a3({source_ref:HEAD,locator_ref:HEAD,source_locator:locator,graph_ref:HEAD,
    repair_graph:graph,task_context:t,required_task_id:'repair',
    failure:{classification:s.failure,observed:s.observed,
      tool_name:s.tool,error_code:'NEXT_DISPATCH_STALE_JOB_SHA',
      target_revision:HEAD,reproduction_ref:'test-lab/runtime-logic.test.cjs',
      expected:'accepted guard behavior',actual:'observed failure',
      host_test_available:true}}))
  const p=arm==='FULL'?{mode:'FULL',harness_text:catalog.renderHarness(s.role,{includeProgressiveSkills:false}),
      execution_authorized:false}:
    plain(a4({role:s.role,workflow:s.workflow,human_message_kind:s.human_message_kind,
      current_source_ref:HEAD,task_context:t,repair_context:r}))
  const texts=p.harness_text
  assert.equal(p.execution_authorized,false)
  assert.equal(typeof texts,'string')
  for(const marker of necessary)assert.ok(texts.includes(marker),'missing '+marker)
  const codes=[...t.findings.map(x=>x.code),...r.findings.map(x=>x.code)]
  return {mode:p.mode,saved:catalog.renderHarness(s.role,{includeProgressiveSkills:false}).length-texts.length,
    codes,source:r.source_candidates.map(x=>x.path),tests:r.test_candidates.map(x=>x.path),
    decision:t.decision==='STOP'||r.decision==='STOP'?'STOP':r.decision==='PROBE'?'PROBE':'READ_MORE',
    text:texts}
}
function step(name,s,expect,opts={}){
  const full=evaluate(s,'FULL'),candidate=evaluate(s,'SELECTIVE')
  assert.equal(candidate.mode,expect,'A4 mode: '+name)
  assert.deepEqual(candidate.source,full.source,'A3 sources '+name)
  assert.deepEqual(candidate.tests,full.tests,'A3 regression tests '+name)
  if(opts.code)assert.ok(candidate.codes.includes(opts.code),name+' needs '+opts.code)
  if(opts.decision)assert.equal(candidate.decision,opts.decision,name)
  if(opts.must)for(const m of opts.must)assert.ok(candidate.text.includes(m),name+' lacks '+m)
  if(expect==='FULL_FALLBACK')assert.equal(candidate.text,full.text,name+' must restore byte-exact full text')
  if(expect==='SELECTIVE_REPAIR_PREVIEW'){
    assert.ok(candidate.saved>0,name+' selective saving missing')
    assert.equal(allShared.filter(line=>!candidate.text.includes(line)).length,4)
  }else assert.equal(candidate.saved,0)
  return {event:name,role:s.role,mode:candidate.mode,decision:candidate.decision,
    finding_codes:candidate.codes,source_count:candidate.source.length,
    source_parity:true,saved_chars:candidate.saved}
}
const cases=[]
test('S1 Bootstrap — existing valid Criteria, Plan, Milestones, Proposal and capabilities',()=>{
  const base={project_context:'BROWNFIELD',
    checklist:{criteria:{status:'PASS',observation:'existing approved source Criteria'},
      plan:{status:'PENDING'},milestones:{status:'PENDING'},capabilities:{status:'PENDING'}},
    criteria_intake:{existing_approved:true,human_update_choice:'NOT_ASKED'}}
  const logs=[]
  let result=plain(bootstrap(base))
  assert.equal(result.next_action,'PLAN_CRL')
  const s=fresh();s.role='planner';s.workflow='BOOTSTRAP';s.human_message_kind='BOOTSTRAP';s.run=undefined
  logs.push(step('BOOTSTRAP_INTAKE',s,'FULL_FALLBACK',{must:['BOOTSTRAP CHECKLIST COORDINATOR']}))
  result=plain(bootstrap(base));assert.equal(result.next_action,'PLAN_CRL')
  logs.push(step('CRITERIA_KEEP_PLAN_CRL',s,'FULL_FALLBACK',{must:['PLAN GOAL ANCHORS','PLANNER RL SHORTCUT']}))
  base.checklist.plan={status:'PASS',observation:'actual reviewed Plan PASS'}
  result=plain(bootstrap(base));assert.equal(result.next_action,'MILESTONES_CRL')
  logs.push(step('MILESTONES_CRL',s,'FULL_FALLBACK'))
  base.checklist.milestones={status:'PASS',observation:'actual milestone review PASS'}
  result=plain(bootstrap(base));assert.equal(result.next_action,'TECHNICAL_PROPOSAL_REVIEW')
  base.checklist.technical_proposal={status:'PASS',observation:'Feasible proposal matches Criteria and Plan'}
  result=plain(bootstrap(base));assert.equal(result.next_action,'PREPARE_CODER_TESTER')
  logs.push(step('CAPABILITIES_CHECK',s,'FULL_FALLBACK'))
  base.checklist.capabilities={status:'PASS',observation:'Coder and Tester capabilities verified'}
  result=plain(bootstrap(base));assert.equal(result.status,'BOOTSTRAP_READY')
  assert.equal(result.source_write_authorized,false)
  logs.push(step('BOOTSTRAP_READY_NO_PRODUCT_WRITE',s,'FULL_FALLBACK',
    {must:['HUMAN EXECUTION APPROVAL']}))
  cases.push({case:'BOOTSTRAP',events:logs,final_action:result.next_action,source_write_authorized:false})
})
test('S2 Coding — approved Task, bounded defect repair, failed retest and independent Reviewer',()=>{
  const s=fresh(),logs=[]
  s.workflow='PRODUCT_IMPLEMENTATION';s.human_message_kind='SAME_APPROVED_TASK'
  logs.push(step('ORDINARY_IMPLEMENTATION',s,'FULL_FALLBACK',{must:['NEXT source work']}))
  // A real plan approval cannot be inferred from this fixture: context recipe
  // remains advisory, and the separate M5+scope+Git-readback gate is unchanged.
  s.workflow='PRODUCT_DEFECT_REPAIR'
  logs.push(step('KNOWN_RED_REPAIR',s,'SELECTIVE_REPAIR_PREVIEW'))
  s.failure='ENVIRONMENT_FAILURE';logs.push(step('NO_CI_RUNNER',s,'FULL_FALLBACK'))
  s.failure='PRODUCT_FAILURE';s.role='reviewer';s.run={...s.run,role:'reviewer'}
  s.workflow='INDEPENDENT_REVIEW'
  logs.push(step('INDEPENDENT_REVIEW',s,'FULL_FALLBACK',{must:['REVIEW LOOP']}))
  cases.push({case:'CODING',events:logs})
})
test('S3 New feature/material UPDATE — stop stale Run and return Planner/Criteria change flow',()=>{
  const s=fresh(),logs=[]
  logs.push(step('EXISTING_REPAIR',s,'SELECTIVE_REPAIR_PREVIEW'))
  // Human introduces new product WHAT/WHY. Preserve existing source and
  // use the real A2 Plan fence, not an inferred Coder implementation grant.
  s.human_message_kind='MATERIAL_UPDATE';s.job.plan_change_pending=true
  logs.push(step('HUMAN_MATERIAL_UPDATE',s,'FULL_FALLBACK',
    {code:'PLAN_CHANGE_PENDING',decision:'STOP',must:['LLC58 HUMAN PLAN CHANGE','CRITERIA CHANGE ORDER']}))
  s.role='planner';s.workflow='PLAN_SUPERSESSION';s.run=undefined
  logs.push(step('PLANNER_IMPACT_REVIEW',s,'FULL_FALLBACK',
    {code:'PLAN_CHANGE_PENDING',decision:'STOP',must:['TECH ADVISOR CHECKPOINTS']}))
  s.job.plan_change_pending=false;s.job.planning_revision=3
  s.job.planning_review={status:'PENDING',reviewed_revision:2}
  logs.push(step('NEW_REVISION_NOT_REVIEWED',s,'FULL_FALLBACK',
    {code:'PLANNING_REVIEW_REVALIDATE'}))
  cases.push({case:'MATERIAL_UPDATE',events:logs,old_run_reusable:false})
})
test('S4 New refactor idea — first classify scope, never silently add unrelated refactor',()=>{
  const s=fresh(),logs=[]
  logs.push(step('CURRENT_REPAIR',s,'SELECTIVE_REPAIR_PREVIEW'))
  s.human_message_kind='REFACTOR'
  // Even if caller accidentally leaves workflow as PRODUCT_DEFECT_REPAIR,
  // a newly identified Human refactor idea must invalidate old A4 selection.
  logs.push(step('NEW_REFACTOR_IDEA_UNCLASSIFIED',s,'FULL_FALLBACK',
    {must:['Stay inside approved Job/Task/Run scope']}))
  s.workflow='REFACTOR_IMPACT_REVIEW';s.job.plan_change_pending=true
  logs.push(step('REFRACTOR_OUTSIDE_APPROVED_SCOPE',s,'FULL_FALLBACK',
    {code:'PLAN_CHANGE_PENDING',decision:'STOP'}))
  s.role='planner';s.run=undefined
  logs.push(step('PLANNER_CLASSIFIES_SCOPE_CHANGE',s,'FULL_FALLBACK',
    {must:['LLC58 HUMAN PLAN CHANGE']}))
  // Same-Task narrow maintenance may later resume only when fully checked;
  // a NEW IDEA request is not converted into a READY source write by A4.
  cases.push({case:'REFACTOR_IDEA',events:logs,execution_authorized:false})
})
test('A4 multi-workflow trace and non-mutation summary',()=>{
  assert.equal(cases.length,4)
  assert.equal(cases.reduce((n,c)=>n+c.events.length,0),17)
  for(const c of cases)assert.ok(c.events.every(e=>e.source_parity))
  const summary={schema:'gsa4-a4-bootstrap-coding-update-refactor/v1',
    scenario_count:cases.length,steps_per_arm:17,comparisons:34,
    deterministic_oracle_pass:4,source_parity_pass:4,
    model_calls:0,host_writes:0,model_equivalence:'UNVERIFIED',
    selective_harness_saved_chars:cases.flatMap(c=>c.events).reduce((n,e)=>n+e.saved_chars,0),
    cases:cases.map(c=>({name:c.case,events:c.events.map(x=>({
      event:x.event,mode:x.mode,decision:x.decision,saved:x.saved_chars}))}))}
  console.log('GSA4_A4_WORKFLOW_SIMULATION '+JSON.stringify(summary))
})
