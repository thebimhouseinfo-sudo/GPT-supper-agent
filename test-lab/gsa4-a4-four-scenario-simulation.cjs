'use strict'
// GSA4 behavioral *runtime-replay simulation*, not an independent LLM trial.
// Multiple mutable Job/Run/evidence events are fed through real current
// A2 -> A3 -> A4 functions for the SAME four workflows (FULL vs SELECTIVE).
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const {loadSourceModule}=require('./helpers/harness-ts-loader.cjs')

const ROOT=path.resolve(__dirname,'..')
const SOURCE=path.join(ROOT,'supabase/functions/gsa-mcp')
const catalog=loadSourceModule('harness-catalog.ts')
const indexSource=fs.readFileSync(path.join(SOURCE,'index.ts'),'utf8')
assert.ok(indexSource.includes("'stopchat_handoff_prepare'"),'Current runtime must provide stopchat handoff helper')
assert.ok(indexSource.includes('persist/read back only necessary cursor/Job/Verification state'),'Stopchat must retain safe checkpoint/readback guidance')
const locator=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/architecture/GSA4-A1-SOURCE-LOCATOR.json'),'utf8'))
const graph=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/architecture/GSA4-A3-REPAIR-EDGES.json'),'utf8'))
const REF='f065c3b47c1a541ea44d3f59aac8f7eeb3cb31c4'
const PROJECT='c2927684-543e-4b9d-ae4e-0150e9910f51'
const JOB='c2927684-543e-4b9d-ae4e-0150e9910f52'
const BLOB='a'.repeat(40)
const REVIEW='b'.repeat(40)

function executeSource(file,imports={}) {
  const sourceFile=path.join(SOURCE,file)
  const input=fs.readFileSync(sourceFile,'utf8')
  const ast=ts.createSourceFile(sourceFile,input,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length,0)
  const transpiled=ts.transpileModule(input,{fileName:sourceFile,compilerOptions:{
    target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true})
  assert.equal((transpiled.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0)
  const target={exports:{}}
  vm.runInNewContext(transpiled.outputText,{module:target,exports:target.exports,require(key){
    assert.ok(Object.hasOwn(imports,key),'Unapproved import '+key)
    return imports[key]
  }},{filename:sourceFile,timeout:2500})
  return target.exports
}
const compileA2=executeSource('task-context-recipe.ts',{'./harness-catalog.ts':catalog}).buildTaskContextRecipe
const compileA3=executeSource('repair-context-route.ts').buildRepairContextRoute
const compileA4=executeSource('selective-harness-preview.ts',{'./harness-catalog.ts':catalog}).previewSelectiveHarness
const plain=v=>JSON.parse(JSON.stringify(v))
const keys=obj=>Object.keys(obj??{})
function newState(){
  const job={kind:'JOB',project_id:PROJECT,job_id:JOB,lifecycle:'IN_PROGRESS',
    execution_contract:'NEXT',planning_revision:2,planning_review:{status:'PASS',reviewed_revision:2},
    planning_context:{phase:'implementation'},criteria_binding:{criteria_blob_sha:REVIEW},
    tasks:[{task_id:'repair',objective:'Fix current known source regression',
      scope:['runtime helper'],dependencies:[],required_skills:[],
      completion_criteria:['Reproduce RED and independently retest repaired HEAD'],lifecycle:'READY'}],
    topology:[{task_id:'repair',handler:'coder'}]}
  return {job,project_id:PROJECT,job_sha:BLOB,current_job_sha:BLOB,
    run:{project_id:PROJECT,job_id:JOB,role:'coder',primary_task_id:'repair',
      planning_revision:2,lifecycle:'IN_PROGRESS'},humanMessageType:'FOLLOWUP',
    role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',tool:'run_begin',
    stopchatRequested:false,freshChat:false,
    error:'NEXT_DISPATCH_STALE_JOB_SHA',classification:'PRODUCT_FAILURE',
    observed:true,failedRetest:false,hostAvailable:true,hadVerifiedRepro:true,
    expected:'Run must refuse stale Job SHA',actual:'Observed unexpected acceptance'}
}
function evaluate(state,arm){
  const a2=plain(compileA2({role:state.role,project_id:state.project_id,job:state.job,
    task_id:'repair',job_record_path:`projects/${PROJECT}/WORK/JOBS/${JOB}.json`,
    job_record_sha:state.job_sha,current_job_record_sha:state.current_job_sha,
    run:state.run,tool_names:[state.tool],source_locator:locator,
    source_locator_ref:REF,current_source_ref:REF}))
  const a3=plain(compileA3({source_ref:REF,locator_ref:REF,source_locator:locator,
    graph_ref:REF,repair_graph:graph,task_context:a2,required_task_id:'repair',
    failure:{classification:state.classification,observed:state.observed,
      error_code:state.error??undefined,tool_name:state.tool,
      reproduction_ref:state.hadVerifiedRepro?'test-lab/runtime-logic.test.cjs':undefined,
      expected:state.expected,actual:state.actual,
      target_revision:REF,failed_retest:state.failedRetest,
      host_test_available:state.hostAvailable}}))
  // A Human interruption MUST re-evaluate Role/workflow, never reuse the old
  // Coder-specific candidate just because the preceding step was Coder repair.
  const output=arm==='FULL'?{
    mode:'FULL',harness_text:catalog.renderHarness(state.role,{includeProgressiveSkills:false}),
    execution_authorized:false
  }:plain(compileA4({role:state.role,workflow:state.workflow,human_message_kind:state.human_message_kind,task_context:a2,
    repair_context:a3,current_source_ref:REF}))
  assert.equal(output.execution_authorized,false)
  // STOPCHAT is a chat-size checkpoint/handoff protocol, NOT a global
  // project cancellation. A2/A3 select task/source context and are not
  // themselves the STOPCHAT controller. Keep their raw route separately.
  const rawRouteDecision=a2.decision==='STOP'||a3.decision==='STOP'?'STOP':
    a3.decision==='PROBE'?'PROBE':
    a3.decision==='READ_MORE'||a2.decision==='READ_MORE'?'READ_MORE':'REVIEW_REFERENCES'
  const decision=state.stopchatRequested && !state.freshChat ? 'PREPARE_SAFE_HANDOFF' : rawRouteDecision
  return {role:state.role,workflow:state.workflow,decision,raw_route_decision:rawRouteDecision,mode:output.mode,
    harness_chars:output.harness_text?.length??0,
    harness_text:output.harness_text,task_codes:a2.findings.map(x=>x.code),
    repair_codes:a3.findings.map(x=>x.code),source_paths:a3.source_candidates.map(x=>x.path),
    regression_tests:a3.test_candidates.map(x=>x.path),source_covered:a3.source_candidates.length,
    h_can_authorize:false}
}
const scenarios=[
  {id:'S1_REAL_DEFECT_RETEST',title:'Coder repairs an observed runtime defect and initial retest fails',
    events:[
      {event:'RED_REPRODUCED',patch:s=>s,expected:'READ_MORE'},
      {event:'RETEST_FAILURE',patch:s=>{s.failedRetest=true;return s},expected:'READ_MORE',must:'FAILED_RETEST_EXPAND_CAUSAL_GRAPH'},
      {event:'INDEPENDENT_TESTER_HANDOFF',patch:s=>{s.role='tester';s.workflow='INDEPENDENT_RETEST';s.run={...s.run,role:'tester'};return s},
        expected:'READ_MORE',fallback:true},
    ]},
  {id:'S2_HUMAN_SCOPE_CHANGE',title:'Human changes acceptance while Coder is active',
    events:[
      {event:'CODER_REPAIR',patch:s=>s,expected:'READ_MORE'},
      {event:'NEW_HUMAN_MATERIAL_CHANGE',patch:s=>{s.humanMessageType='NEW_MATERIAL_SCOPE';s.job.plan_change_pending=true;
        s.job.planning_review={status:'PENDING',reviewed_revision:2};s.workflow='PLAN_SUPERSESSION';return s},
        expected:'STOP',must:'PLAN_CHANGE_PENDING',fallback:true},
      {event:'PLANNER_REVIEW_CURRENT_REVISION',patch:s=>{s.role='planner';s.run=undefined;s.workflow='PLAN_REVIEW';return s},
        expected:'STOP',fallback:true},
    ]},
  {id:'S3_CI_RUNNER_UNAVAILABLE',title:'CI runner has no executed steps; distinguish environment from source regression',
    events:[
      {event:'INITIAL_REPAIR',patch:s=>s,expected:'READ_MORE'},
      {event:'RUNNER_ID_ZERO_AND_NO_STEPS',patch:s=>{s.classification='ENVIRONMENT_FAILURE';s.hostAvailable=false;
        s.workflow='ENVIRONMENT_PROBE';s.observed=true;return s},expected:'PROBE',
        must:'HOST_PROBE_REQUIRED',fallback:true},
      {event:'TESTER_PROBE_HANDOFF',patch:s=>{s.role='tester';s.run={...s.run,role:'tester'};
        s.workflow='TESTER_PROBE';return s},expected:'PROBE',fallback:true},
    ]},
  {id:'S4_STOPCHAT_SAFE_HANDOFF_RESUME',title:'Human requests stopchat at context limit; checkpoint/handoff is prepared, then next chat revalidates before resume',
    events:[
      {event:'CODER_RUNNING',patch:s=>s,expected:'READ_MORE'},
      {event:'HUMAN_STOPCHAT',patch:s=>{s.humanMessageType='STOPCHAT';s.stopchatRequested=true;
        s.workflow='STOPCHAT_HANDOFF';return s},
        expected:'PREPARE_SAFE_HANDOFF',fallback:true,requirePolicy:'STOPCHAT'},
      {event:'FRESH_CHAT_REVALIDATION',patch:s=>{s.humanMessageType='RESUME_FROM_HANDOFF';
        s.stopchatRequested=false;s.freshChat=true;s.workflow='FRESH_CHAT_READBACK';
        s.role='orchestrator';s.run=undefined;s.current_job_sha=REVIEW;return s},
        expected:'READ_MORE',fallback:true,requirePolicy:'The explicitly opened Project'},
    ]},
]
const mandatory=['HUMAN EXECUTION APPROVAL','BRANCH AUTHORITY','REVIEW LOOP','STOPCHAT',
  'authorize_project_scope','On unknown Git write outcome',
  'NEXT source work','Agent-authored text never counts as human approval']
const artifact={schema:'gsa4-a4-four-scenario-replay/v3',model_calls:0,
  model_behavior_measured:false,simulation_kind:'DYNAMIC_REAL_GSA_FUNCTION_REPLAY',
  baseline_sha:REF,arms:{FULL:{},SELECTIVE:{}},scenarios:[],caveats:[
    'Real A2/A3/A4 TypeScript executed on a changing multi-turn synthetic Job/Run/Host state.',
    'Actions are assessed against a deterministic boundary oracle, not decisions from independent model instances.',
    'No product source edits, Host MCP calls, Git CAS mutations, actual model tokens or independent Tester took place.',
    'Full and selective model-facing behavioral equivalence is NOT demonstrated; further LLM A/B trials required.',
    'STOPCHAT action is a test-side Human-message protocol oracle; A2/A3 remain advisory and no real checkpoint or handoff was persisted.'
  ]}
for(const scenario of scenarios){
  const runs={}
  for(const arm of ['FULL','SELECTIVE']){
    const state=newState(),steps=[]
    for(const step of scenario.events){
      step.patch(state)
      const r=evaluate(state,arm)
      const oraclePass=r.decision===step.expected
      if(!oraclePass && !step.knownGap)assert.fail(scenario.id+'/'+arm+'/'+step.event+': expected '+step.expected+' observed '+r.decision)
      if(step.knownGap)assert.equal(oraclePass,false,'Known gap accidentally resolved; re-review test oracle')
      if(step.event==='HUMAN_STOPCHAT') {
        assert.equal(r.raw_route_decision,'READ_MORE', 'A2/A3 are source advisors, not stopchat router')
        assert.ok(indexSource.includes('Re-fetch current PROJECT.md'), 'Handoff must require current Memory readback')
        assert.ok(indexSource.includes('stopchat_handoff_prepare'), 'Handoff helper must exist')
      }
      if(step.event==='FRESH_CHAT_REVALIDATION') {
        assert.ok(r.task_codes.includes('JOB_SHA_REVALIDATE'), 'Fresh chat must recheck Job SHA')
        assert.equal(r.harness_text,catalog.renderHarness('orchestrator',{includeProgressiveSkills:false}))
      }
      if(step.must)assert.ok([...r.task_codes,...r.repair_codes].includes(step.must),
        scenario.id+'/'+arm+'/'+step.event+' lacks '+step.must)
      if(step.fallback&&arm==='SELECTIVE'){
        assert.equal(r.mode,'FULL_FALLBACK',scenario.id+'/'+step.event)
        assert.equal(r.harness_text,catalog.renderHarness(state.role,{includeProgressiveSkills:false}))
      }
      if(step.requirePolicy)assert.ok(r.harness_text.includes(step.requirePolicy))
      for(const required of mandatory)assert.ok(r.harness_text.includes(required),
        scenario.id+'/'+arm+'/'+step.event+' lost '+required)
      if(r.decision==='PROBE')assert.notEqual(r.decision,'REVIEW_REFERENCES')
      steps.push({event:step.event,role:r.role,mode:r.mode,decision:r.decision,
        raw_route_decision:r.raw_route_decision,
        expected_decision:step.expected,oracle_pass:oraclePass,
        known_gap:oraclePass?null:(step.knownGap??'UNEXPECTED'),
        task_findings:r.task_codes,repair_findings:r.repair_codes,
        sources:r.source_paths,tests:r.regression_tests,harness_chars:r.harness_chars})
    }
    runs[arm]=steps
  }
  assert.deepEqual(runs.FULL.map(x=>x.decision),runs.SELECTIVE.map(x=>x.decision))
  assert.deepEqual(runs.FULL.map(x=>x.sources),runs.SELECTIVE.map(x=>x.sources))
  assert.deepEqual(runs.FULL.map(x=>x.tests),runs.SELECTIVE.map(x=>x.tests))
  const saved=runs.FULL.reduce((n,x,i)=>n+x.harness_chars-runs.SELECTIVE[i].harness_chars,0)
  artifact.scenarios.push({id:scenario.id,title:scenario.title,steps:runs,previews_saved_chars:saved,
    source_set_parity:true,
    deterministic_boundary_oracle:runs.FULL.every(x=>x.oracle_pass)?'PASS':'FINDING',
    actual_model_parity:'UNVERIFIED'})
}
const all=artifact.scenarios.reduce((x,s)=>x+s.previews_saved_chars,0)
artifact.summary={scenarios:4,turns_per_arm:12,total_model_calls:0,
  deterministic_oracle_pass:artifact.scenarios.filter(x=>x.deterministic_boundary_oracle==='PASS').length,
  deterministic_oracle_findings:artifact.scenarios.filter(x=>x.deterministic_boundary_oracle==='FINDING').map(x=>x.id),
  source_set_parity_pass:4,
  selective_preview_saved_chars:all,actual_llm_equivalence:'UNVERIFIED'}
const out=process.argv[2]
if(out){const p=path.resolve(out);fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,JSON.stringify(artifact,null,2)+'\n')}
console.log('GSA4_A4_DYNAMIC_SCENARIO_SUMMARY '+JSON.stringify(artifact.summary))
for(const x of artifact.scenarios)console.log('GSA4_A4_DYNAMIC_SCENARIO '+JSON.stringify({
  id:x.id,steps:x.steps.SELECTIVE.map(x=>({event:x.event,mode:x.mode,decision:x.decision,
    findingCount:x.task_findings.length+x.repair_findings.length,raw_route:x.raw_route_decision,
    expected:x.expected_decision,known_gap:x.known_gap})),savedChars:x.previews_saved_chars}))
