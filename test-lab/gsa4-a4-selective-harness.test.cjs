'use strict'
// A4: pure source-executed selective Harness PREVIEW, not a runtime policy gate.
const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const root=path.resolve(__dirname,'..')
const base=path.join(root,'supabase/functions/gsa-mcp')
const {loadSourceModule}=require('./helpers/harness-ts-loader.cjs')
const catalog=loadSourceModule('harness-catalog.ts')
const readJSON=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))
const locator=readJSON('docs/architecture/GSA4-A1-SOURCE-LOCATOR.json')
const graph=readJSON('docs/architecture/GSA4-A3-REPAIR-EDGES.json')
const REVISION='977d11f3e702b9054171c82224ead5d9746f6408'
const PROJECT='c2927684-543e-4b9d-ae4e-0150e9910f51'
const JOB='c2927684-543e-4b9d-ae4e-0150e9910f52'
const BLOB='a'.repeat(40)

function compileCurrent(name,imports={}) {
  const file=path.join(base,name),source=fs.readFileSync(file,'utf8')
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length,0)
  const transpiled=ts.transpileModule(source,{fileName:file,compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true})
  assert.equal((transpiled.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0)
  const mod={exports:{}}
  vm.runInNewContext(transpiled.outputText,{module:mod,exports:mod.exports,require(spec){
    assert.ok(Object.hasOwn(imports,spec),'Unexpected import: '+spec)
    return imports[spec]
  }},{filename:file,timeout:2500})
  return mod.exports
}
const a2=compileCurrent('task-context-recipe.ts',{'./harness-catalog.ts':catalog}).buildTaskContextRecipe
const a3=compileCurrent('repair-context-route.ts').buildRepairContextRoute
const A4=compileCurrent('selective-harness-preview.ts',{'./harness-catalog.ts':catalog})
const {previewSelectiveHarness,A4_REPAIR_ONLY_OMITTED_DETAIL_LABELS,A4_REPAIR_MANDATORY_MARKERS}=A4
const plain=x=>JSON.parse(JSON.stringify(x))
function contexts(tool='run_begin',error='NEXT_DISPATCH_STALE_JOB_SHA'){
  const job={kind:'JOB',project_id:PROJECT,job_id:JOB,lifecycle:'IN_PROGRESS',
    execution_contract:'NEXT',planning_revision:1,planning_review:{status:'PASS',reviewed_revision:1},
    planning_context:{phase:'repair'},
    tasks:[{task_id:'repair',objective:'Diagnose and review approved product defect',scope:['source'],
      dependencies:[],completion_criteria:['Original failing test passes'],required_skills:[],lifecycle:'READY'}],
    topology:[{task_id:'repair',handler:'coder'}]}
  const task=plain(a2({project_id:PROJECT,job,task_id:'repair',role:'coder',
    job_record_path:'projects/'+PROJECT+'/WORK/JOBS/'+JOB+'.json',
    job_record_sha:BLOB,current_job_record_sha:BLOB,
    run:{project_id:PROJECT,job_id:JOB,role:'coder',primary_task_id:'repair',
      planning_revision:1,lifecycle:'IN_PROGRESS'},
    tool_names:[tool],source_locator:locator,
    source_locator_ref:REVISION,current_source_ref:REVISION}))
  const repair=plain(a3({source_ref:REVISION,locator_ref:REVISION,source_locator:locator,
    graph_ref:REVISION,repair_graph:graph,task_context:task,required_task_id:'repair',
    failure:{classification:'PRODUCT_FAILURE',observed:true,tool_name:tool,
      error_code:error??undefined,
      reproduction_ref:'Existing current repo test-lab regression fixture',
      target_revision:REVISION,expected:'Known accepted behavior',actual:'Observed failing product evidence',
      host_test_available:true}}))
  return {task_context:task,repair_context:repair}
}
const preview=(tool,error)=>
  plain(previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
    current_source_ref:REVISION,...contexts(tool,error)}))
const cases=[
  ['RUN','run_begin','NEXT_DISPATCH_STALE_JOB_SHA'],
  ['CURSOR','execution_cursor_prepare','PENDING_MUTATION_REQUIRES_RECONCILIATION'],
  ['CHECKPOINT','checkpoint_claim_prepare','CHECKPOINT_CLAIM_REJECTED'],
  ['EVIDENCE','evidence_repository_publish_finalize',null],
]

test('A4 literal exclusions are exactly four existing Shared planning/Bootstrap detail clauses',()=>{
  const lines=catalog.BASE_AGENT_HARNESS.split('\n').filter(x=>x.startsWith('- '))
  assert.equal(lines.length,49)
  assert.deepEqual(plain(A4_REPAIR_ONLY_OMITTED_DETAIL_LABELS),[
    'PLAN GOAL ANCHORS','PLANNER RL SHORTCUT',
    'BOOTSTRAP CHECKLIST COORDINATOR','LLC60 PLANNING CONTINUATION'])
  for(const label of A4_REPAIR_ONLY_OMITTED_DETAIL_LABELS) {
    assert.equal(lines.filter(x=>x.startsWith('- '+label+':')).length,1,label)
  }
  for(const marker of A4_REPAIR_MANDATORY_MARKERS)assert.ok(catalog.BASE_AGENT_HARNESS.includes(marker))
})

test('A4 + real A2/A3: four defect routes receive role-complete literal preview, not authorization',()=>{
  for(const [id,tool,error] of cases){
    const p=preview(tool,error)
    const full=catalog.renderHarness('coder',{includeProgressiveSkills:false})
    assert.equal(p.mode,'SELECTIVE_REPAIR_PREVIEW',id+': '+p.reason)
    assert.equal(p.execution_authorized,false)
    assert.equal(p.advisory_only,true)
    assert.ok(p.saved_chars>0)
    assert.equal(p.original_chars,full.length)
    assert.equal(p.selected_chars,p.harness_text.length)
    assert.equal(p.saved_chars,full.length-p.harness_text.length)
    assert.deepEqual(p.omitted_labels,plain(A4_REPAIR_ONLY_OMITTED_DETAIL_LABELS))
    for(const marker of A4_REPAIR_MANDATORY_MARKERS)assert.ok(p.harness_text.includes(marker),marker)
    for(const item of [...catalog.ROLE_HARNESSES.coder.authority,
      ...catalog.ROLE_HARNESSES.coder.loop,...catalog.ROLE_HARNESSES.coder.outputs])
      assert.ok(p.harness_text.includes(item),'lost coder rule '+item)
    for(const line of catalog.BASE_AGENT_HARNESS.split('\n').filter(x=>x.startsWith('- '))){
      const omit=A4_REPAIR_ONLY_OMITTED_DETAIL_LABELS.some(label=>line.startsWith('- '+label+':'))
      assert.equal(p.harness_text.includes(line),!omit, 'literal clause mismatch '+line.slice(0,60))
    }
  }
})

test('A4 unknown/other Roles and unknown workflow have full Harness fallback',()=>{
  for(const role of Object.keys(catalog.ROLE_HARNESSES)){
    const context=contexts()
    const p=plain(previewSelectiveHarness({role,workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
      current_source_ref:REVISION,...context}))
    if(role==='coder')assert.equal(p.mode,'SELECTIVE_REPAIR_PREVIEW')
    else {
      assert.equal(p.mode,'FULL_FALLBACK',role)
      assert.equal(p.harness_text,catalog.renderHarness(role,{includeProgressiveSkills:false}))
      assert.equal(p.saved_chars,0)
    }
  }
  const coderFull=catalog.renderHarness('coder',{includeProgressiveSkills:false})
  assert.equal(previewSelectiveHarness({role:'coder',workflow:'BOOTSTRAP',
    current_source_ref:REVISION,...contexts()}).harness_text,coderFull)
  assert.equal(previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
    current_source_ref:'b'.repeat(40),...contexts()}).harness_text,coderFull)
  assert.equal(previewSelectiveHarness({role:'unrecognized',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
    current_source_ref:REVISION,...contexts()}).mode,'INVALID_ROLE')
})

test('A4 respects blocked/stale Task and A3 routing: fallback to unchanged source text',()=>{
  const original=catalog.renderHarness('coder',{includeProgressiveSkills:false})
  const blocked=contexts();blocked.task_context.decision='STOP'
  blocked.task_context.findings.push({code:'JOB_NOT_CURRENT'})
  const c=plain(previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
    current_source_ref:REVISION,...blocked}))
  assert.equal(c.mode,'FULL_FALLBACK');assert.equal(c.harness_text,original)
  const stale=contexts();stale.repair_context.findings.push({code:'LOCATOR_REVISION_MISMATCH'})
  const s=plain(previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
    current_source_ref:REVISION,...stale}))
  assert.equal(s.mode,'FULL_FALLBACK')
  const empty=contexts();empty.repair_context.source_candidates=[]
  assert.equal(previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
    current_source_ref:REVISION,...empty}).mode,'FULL_FALLBACK')
})

test('A4 policy source drift or missing mandatory clauses fails CLOSED',()=>{
  const fake={...catalog,BASE_AGENT_HARNESS:catalog.BASE_AGENT_HARNESS+'\n- NEW RULE AFTER REVIEW: must not be discarded.'}
  fake.renderHarness=(role,options={})=>{
    const full=catalog.renderHarness(role,options)
    return full?full.replace(catalog.BASE_AGENT_HARNESS,fake.BASE_AGENT_HARNESS):null
  }
  const drift=compileCurrent('selective-harness-preview.ts',{'./harness-catalog.ts':fake})
  const p=plain(drift.previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
    current_source_ref:REVISION,...contexts()}))
  assert.equal(p.mode,'FULL_FALLBACK')
  assert.equal(p.saved_chars,0)
  assert.ok(p.harness_text.includes('NEW RULE AFTER REVIEW'))
  const removed={...catalog,BASE_AGENT_HARNESS:catalog.BASE_AGENT_HARNESS.replace(/- HUMAN EXECUTION APPROVAL:[^\n]*/, '')}
  removed.renderHarness=(role,options={})=>{
    const full=catalog.renderHarness(role,options)
    return full?full.replace(catalog.BASE_AGENT_HARNESS,removed.BASE_AGENT_HARNESS):null
  }
  const missing=compileCurrent('selective-harness-preview.ts',{'./harness-catalog.ts':removed})
  const m=plain(missing.previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
    current_source_ref:REVISION,...contexts()}))
  assert.equal(m.mode,'FULL_FALLBACK')
  assert.equal(m.saved_chars,0)
  assert.ok(m.missing_mandatory.includes('HUMAN EXECUTION APPROVAL'))
})

test('A4 + A3 measures exact real source/harness chars without inventing token or repair success',()=>{
  let full=0,select=0,sources=0
  for(const [id,tool,error] of cases){
    const ctx=contexts(tool,error)
    const p=plain(previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',human_message_kind:'SAME_APPROVED_TASK',
      current_source_ref:REVISION,...ctx}))
    full+=p.original_chars
    select+=p.selected_chars
    for(const entry of ctx.repair_context.source_candidates){
      const file=path.join(base,entry.path)
      assert.ok(file.startsWith(base+path.sep),id+' escapes repo')
      sources+=fs.readFileSync(file,'utf8').length
    }
  }
  const saved=full-select
  assert.ok(saved>0)
  assert.equal(full-select,saved)
  console.log('GSA4_A4_SOURCE_MEASUREMENT '+JSON.stringify({
    scenarios:cases.length,base_full_harness_chars:full,
    a4_selective_harness_chars:select,preview_harness_saved_chars:saved,
    a3_source_chars:sources,
    full_harness_plus_a3_source_chars:full+sources,
    a4_harness_plus_a3_source_chars:select+sources,
    model_tokens_measured:false,real_repair_success_measured:false,
    live_runtime_wiring:false
  }))
})

test('A4 does not change the existing eight Role/eleven Skill API contracts',()=>{
  assert.equal(Object.keys(catalog.ROLE_HARNESSES).length,8)
  assert.equal(Object.keys(catalog.RUNTIME_SKILLS).length,11)
  for(const role of Object.keys(catalog.ROLE_HARNESSES))
    assert.ok(catalog.renderHarness(role).includes(catalog.BASE_AGENT_HARNESS))
  assert.ok(fs.readFileSync(path.join(base,'harness-skill-tools.ts'),'utf8')
    .includes('renderHarness(role, { includeProgressiveSkills: false })'))
})


test('A4 fails closed when fresh Human message has not been classified',()=>{
  const x=contexts()
  const p=previewSelectiveHarness({role:'coder',workflow:'PRODUCT_DEFECT_REPAIR',
    current_source_ref:REVISION,...x})
  assert.equal(p.mode,'FULL_FALLBACK')
  assert.equal(p.saved_chars,0)
})
