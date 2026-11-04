'use strict'
/**
 * GSA4 navigation benchmark — source-executed, reproducible, NOT an LLM repair
 * benchmark. It uses the SAME four observed GSA product code-path signals and
 * the SAME full-file read proxy at every architecture version.
 *
 * GSA3: baseline files from pinned git SHA. A0: current physically split files,
 * no index. A1: current A1 index. A1+A2: actual A2 recipe. A1+A2+A3: actual
 * A3 source/producer/consumer traversal. A3/A2 inputs are synthetic fixtures.
 *
 * Git grep or JSON lookups are local search, not agent/tool-network latency.
 * No code is changed; no product fixes are performed or inferred.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { execFileSync } = require('node:child_process')
const ts = require('typescript')
const { performance } = require('node:perf_hooks')
const { loadSourceModule } = require('./helpers/harness-ts-loader.cjs')

const ROOT = path.resolve(__dirname, '..')
const TSROOT = 'supabase/functions/gsa-mcp'
const BASE = '0b5cf875402c7735e1ef573ab95df5858c6ac5e8'
const head = git(['rev-parse', 'HEAD']).trim()
const locator = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/architecture/GSA4-A1-SOURCE-LOCATOR.json'), 'utf8'))
const graph = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/architecture/GSA4-A3-REPAIR-EDGES.json'), 'utf8'))
const PROJECT = 'c2927684-543e-4b9d-ae4e-0150e9910f51'
const JOB = 'c2927684-543e-4b9d-ae4e-0150e9910f52'
const SHA40 = 'a'.repeat(40)

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding:'utf8', maxBuffer: 16 * 1024 * 1024 })
}
function srcAt(rel, original) {
  assert.match(rel, /^[A-Za-z0-9_./-]+\.ts$/)
  assert.ok(!rel.startsWith('/') && !rel.split('/').some(x => !x || x === '.' || x === '..'))
  const full = TSROOT + '/' + rel
  return original ? git(['show', BASE + ':' + full]) : fs.readFileSync(path.join(ROOT,full), 'utf8')
}
function realTest(pathRef) {
  assert.match(pathRef, /^test-lab\/[A-Za-z0-9_./-]+\.test\.cjs$/)
  assert.ok(!pathRef.split('/').some(x => !x || x === '.' || x === '..'))
  return fs.existsSync(path.join(ROOT,pathRef))
}
function realSourceFactory(sourceFile, imports={}) {
  const file = path.join(ROOT,TSROOT,sourceFile)
  const source = fs.readFileSync(file,'utf8')
  const parsed = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
  assert.equal(parsed.parseDiagnostics.length,0)
  const output = ts.transpileModule(source,{fileName:file,compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true})
  assert.equal((output.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0)
  const mod={exports:{}}
  vm.runInNewContext(output.outputText,{module:mod,exports:mod.exports,require:specifier=>{
    assert.ok(Object.hasOwn(imports,specifier),'Unwanted benchmark code import: '+specifier)
    return imports[specifier]
  }},{filename:file,timeout:2500})
  return mod.exports
}
const buildA2 = realSourceFactory('task-context-recipe.ts',{
  './harness-catalog.ts':loadSourceModule('harness-catalog.ts') }).buildTaskContextRecipe
const buildA3 = realSourceFactory('repair-context-route.ts').buildRepairContextRoute
assert.equal(typeof buildA2,'function')
assert.equal(typeof buildA3,'function')

function makeContext(toolName) {
  const job={
    kind:'JOB',project_id:PROJECT,job_id:JOB,lifecycle:'IN_PROGRESS',
    execution_contract:'NEXT',planning_revision:1,
    planning_review:{status:'PASS',reviewed_revision:1},planning_context:{phase:'repair'},
    tasks:[{task_id:'repair',objective:'Diagnose current GSA error path',scope:['source navigation only'],
      dependencies:[],required_skills:[],completion_criteria:['Confirm source and test owners'],lifecycle:'READY'}],
    topology:[{task_id:'repair',handler:'coder'}],
  }
  return JSON.parse(JSON.stringify(buildA2({project_id:PROJECT,job,task_id:'repair',role:'coder',
    job_record_path:'projects/'+PROJECT+'/WORK/JOBS/'+JOB+'.json',
    job_record_sha:SHA40,current_job_record_sha:SHA40,
    run:{project_id:PROJECT,job_id:JOB,role:'coder',primary_task_id:'repair',
      planning_revision:1,lifecycle:'IN_PROGRESS'},
    source_locator:locator,source_locator_ref:head,current_source_ref:head,
    tool_names:[toolName],
  })))
}
const cases=[
  {id:'RUN_STALE_JOB_SHA',tool:'run_begin',error:'NEXT_DISPATCH_STALE_JOB_SHA',
    original:['index.ts','run-execution-tools.ts'],
    current:['run-dispatch-closure-guards.ts','run/run-begin.ts','durable-record-io.ts'],
    originalToken:'NEXT_DISPATCH_STALE_JOB_SHA',currentToken:'NEXT_DISPATCH_STALE_JOB_SHA',
    repro:'test-lab/runtime-logic.test.cjs'},
  {id:'CURSOR_PENDING_MUTATION',tool:'execution_cursor_prepare',
    error:'PENDING_MUTATION_REQUIRES_RECONCILIATION',
    original:['index.ts','execution-cursor-tools.ts'],
    current:['cursor-decisions.ts','recovery-decisions.ts','execution-cursor-tools.ts'],
    originalToken:'PENDING_MUTATION_REQUIRES_RECONCILIATION',
    currentToken:'PENDING_MUTATION_REQUIRES_RECONCILIATION',
    repro:'test-lab/reliability-cursor.test.cjs'},
  {id:'CHECKPOINT_CLAIM_REJECTED',tool:'checkpoint_claim_prepare',
    error:'CHECKPOINT_CLAIM_REJECTED',
    original:['checkpoint-tools.ts','index.ts'],
    current:['checkpoint/claim.ts','checkpoint-evidence-gates.ts','evidence-validation.ts'],
    originalToken:'CHECKPOINT_CLAIM_REJECTED',currentToken:'CHECKPOINT_CLAIM_REJECTED',
    repro:'test-lab/gsa4-checkpoint-extraction.test.cjs'},
  {id:'EVIDENCE_FINALIZE_CALLBACK',tool:'evidence_repository_publish_finalize',
    error:null,
    original:['evidence-repository-tools.ts','index.ts'],
    current:['evidence-repo/publish-finalize.ts','index.ts'],
    originalToken:'validateRepositoryProbeSnapshot',currentToken:'validateRepositoryProbeSnapshot',
    repro:'test-lab/gsa4-evidence-extraction.test.cjs'},
]
function safeUnique(v) { return [...new Set(v)].sort() }
function searchOriginal(c, original) {
  const ref = original ? BASE : null
  // Both strategies have exactly the same failure label and tool name.
  const args=['grep','-l','-F','-e',c.tool]
  if (c.error) args.push('-e',c.error)
  if (ref) args.push(ref)
  args.push('--',TSROOT+'/')
  const result=git(args)
  const matches=result.split('\n').filter(Boolean).map(v=>{
    const full = original ? v.slice(v.indexOf(':')+1) : v
    return full.slice(TSROOT.length+1)
  }).filter(x=>x.endsWith('.ts'))
  assert.ok(matches.length,c.id+' grep must find real source on '+(original?'GSA3':'A0'))
  return {paths:safeUnique(matches),metadataChars:result.length,lookupOperations:1,
    testRefs:[],method:'GIT_GREP_RELEVANT_FULL_FILES'}
}
function fromA1(c) {
  const tool=locator.tool_owners.find(x=>x.name===c.tool)
  assert.ok(tool,'A1 tool '+c.tool)
  const route=c.error ? locator.error_routes.find(x=>x.code===c.error) : null
  const paths=[tool.owner,tool.facade,...(route?[route.owner,...route.related]:[])]
  const testRefs=route?.tests ?? []
  const selection={tool,route:route??null}
  return {paths:safeUnique(paths),metadataChars:JSON.stringify(selection).length,
    lookupOperations:1,testRefs,method:'A1_SELECTED_OWNER_REF'}
}
function fromA2(c, a1) {
  const packet=makeContext(c.tool)
  assert.equal(packet.execution_authorized,false)
  assert.equal(packet.advisory_only,true)
  const paths=[...a1.paths,...packet.source_candidates.map(x=>x.owner)]
  return {paths:safeUnique(paths),metadataChars:a1.metadataChars+JSON.stringify(packet).length,
    lookupOperations:2,testRefs:a1.testRefs,
    method:'A1_PLUS_EXECUTED_A2_REFERENCE_RECIPE',packet}
}
function fromA3(c,a2) {
  const packet=JSON.parse(JSON.stringify(buildA3({
    source_ref:head,locator_ref:head,source_locator:locator,
    graph_ref:head,repair_graph:graph,
    task_context:a2.packet,required_task_id:'repair',
    failure:{classification:'PRODUCT_FAILURE',observed:true,
      error_code:c.error??undefined,tool_name:c.tool,
      expected:'Bounded expected diagnostic behavior',
      actual:'Observed targeted failure signal',
      reproduction_ref:c.repro,target_revision:head,host_test_available:true},
  })))
  assert.equal(packet.repair_authorized,false)
  assert.equal(packet.test_pass_claimed,false)
  assert.equal(packet.root_cause_confirmed,false)
  assert.notEqual(packet.decision,'STOP','A3 must not invent STOP for a same-revision synthetic fixture')
  return {paths:safeUnique(packet.source_candidates.map(x=>x.path)),
    metadataChars:a2.metadataChars+JSON.stringify(packet).length,
    lookupOperations:3,testRefs:packet.test_candidates.map(x=>x.path),
    method:'A1_PLUS_A2_PLUS_EXECUTED_A3_CAUSAL_ROUTER',
    warningFindings:packet.findings.map(x=>x.code)}
}
function measure(candidate, expected, original) {
  const start=performance.now()
  let fullSourceChars=0
  for(const p of candidate.paths)fullSourceChars+=srcAt(p,original).length
  const elapsed=performance.now()-start
  const needed=safeUnique(expected)
  const missing=needed.filter(p=>!candidate.paths.includes(p))
  for(const t of candidate.testRefs)assert.ok(realTest(t),'Test missing: '+t)
  return {
    method:candidate.method,source_paths:candidate.paths,
    full_source_chars:fullSourceChars,source_file_reads:candidate.paths.length,
    metadata_chars:candidate.metadataChars,
    model_input_proxy_chars:fullSourceChars+candidate.metadataChars,
    lookup_operations: candidate.lookupOperations,
    required_diagnostic_sources:needed,
    coverage_count:needed.length-missing.length,coverage_total:needed.length,
    coverage_fraction:(needed.length-missing.length)/needed.length,
    missing_diagnostic_sources:missing,
    proposed_test_refs:safeUnique(candidate.testRefs),
    local_read_elapsed_ms:Math.round(elapsed*1000)/1000,
    ...(candidate.warningFindings?{advisory_findings:candidate.warningFindings}:{}),
  }
}
assert.equal(locator.schema,'gsa4-a1-source-locator/v1')
assert.equal(graph.schema,'gsa4-a3-repair-edges/v1')
git(['cat-file','-e',BASE+'^{commit}'])
const measured=[]
for(const c of cases){
  const old=searchOriginal(c,true)
  const split=searchOriginal(c,false)
  const a1=fromA1(c)
  const a2=fromA2(c,a1)
  const a3=fromA3(c,a2)
  const sourceBefore=srcAt(c.original[0],true)
  const currentExpectedFile = c.id==='EVIDENCE_FINALIZE_CALLBACK'?'index.ts':c.current[0]
  const sourceAfter=srcAt(currentExpectedFile,false)
  assert.ok(c.original.some(p=>srcAt(p,true).includes(c.originalToken)),
    'baseline target not present: '+c.id)
  assert.ok(c.current.some(p=>srcAt(p,false).includes(c.currentToken)),
    'current target not present: '+c.id)
  assert.ok(sourceBefore.length>0&&sourceAfter.length>0)
  measured.push({id:c.id,tool:c.tool,error_code:c.error,fixture_source:'REAL_EXISTING_CODE_PATH',
    no_introduced_product_defect:true,
    strategies:{
      GSA3:measure(old,c.original,true),
      A0:measure(split,c.current,false),
      A1:measure(a1,c.current,false),
      A1_A2:measure(a2,c.current,false),
      A1_A2_A3:measure(a3,c.current,false),
    }})
}
const strategies=['GSA3','A0','A1','A1_A2','A1_A2_A3']
const summary=Object.fromEntries(strategies.map(s=>{
  const v=measured.map(x=>x.strategies[s])
  return [s,{full_source_chars:v.reduce((a,b)=>a+b.full_source_chars,0),
    metadata_chars:v.reduce((a,b)=>a+b.metadata_chars,0),
    model_input_proxy_chars:v.reduce((a,b)=>a+b.model_input_proxy_chars,0),
    source_file_reads:v.reduce((a,b)=>a+b.source_file_reads,0),
    lookup_operations:v.reduce((a,b)=>a+b.lookup_operations,0),
    required_diagnostic_sources_covered:v.reduce((a,b)=>a+b.coverage_count,0),
    required_diagnostic_sources_total:v.reduce((a,b)=>a+b.coverage_total,0),
    scenarios_complete:v.filter(x=>x.coverage_count===x.coverage_total).length,
    local_read_elapsed_ms:v.reduce((a,b)=>a+b.local_read_elapsed_ms,0)}]
}))
const report={
  schema:'gsa4-navigation-benchmark/v1',benchmark_ref:head,gsa3_baseline:BASE,
  methodology:'GIT_GREP_VS_A1_INDEX_VS_EXECUTED_A2_A3; SAME_SIGNALS; ACTUAL_CODE; WHOLE_FILE_READ_PROXY',
  source_changes:false,repair_mutations_executed:false,independent_agent_repair_rounds:null,
  model_tokens_measured:false,host_network_latency_measured:false,real_root_cause_identified:false,
  source_test_suite_result:'CHECK_SEPARATE_NODE_CI',scenarios:measured,summary,
  caveats:[
    'Fixtures are real, existing code-path diagnostic signals, NOT four independently reproduced new bugs.',
    'A3 and A2 are source-executed on synthetic Job/Task context; not wired into actual Host Agent runs.',
    'Metadata chars model returned candidate packet size; not evidence an LLM received that content.',
    'Full source characters assume an agent opens each selected file completely, no symbol-range truncation.',
    'Grep/search and JSON lookups run LOCALLY; tool/network latency and Agent decisions not measured.',
    'Required paths are independently frozen diagnostic coverage targets, not proven minimal root-cause sets.',
    'Overhead of test source text is excluded consistently; test candidates and source coverage reported separately.',
    'Without real fix→review→retest traces, do not claim the winner on bug-repair speed or correctness.',
  ],
}
const destination=process.argv[2]||''
if(destination){
  const out=path.resolve(destination)
  fs.mkdirSync(path.dirname(out),{recursive:true})
  fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')
}
console.log('GSA4_BENCHMARK_SUMMARY '+JSON.stringify({ref:head,scenarios:cases.length,summary}))
for(const c of measured) console.log('GSA4_BENCHMARK_CASE '+JSON.stringify({id:c.id,
  source:strategies.map(s=>({strategy:s,chars:c.strategies[s].full_source_chars,
    coverage:c.strategies[s].coverage_count+'/'+c.strategies[s].coverage_total}))}))
assert.equal(measured.length,4)
assert.ok(strategies.every(s=>summary[s].full_source_chars>0))
