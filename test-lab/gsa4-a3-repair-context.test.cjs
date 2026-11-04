'use strict'
// GSA4 A3: source-executes the REAL pure TypeScript repair-route code and
// confirms actual A0 caller/consumer edges without mutating a repository.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const repo = path.resolve(__dirname, '..')
const sourceRoot = path.join(repo,'supabase/functions/gsa-mcp')
const sha = 'e0eb5eddd661548681d865bc1ba6046a701e2a58'
const graph = JSON.parse(fs.readFileSync(path.join(repo,'docs/architecture/GSA4-A3-REPAIR-EDGES.json'), 'utf8'))
const locator = JSON.parse(fs.readFileSync(path.join(repo,'docs/architecture/GSA4-A1-SOURCE-LOCATOR.json'), 'utf8'))

function sourceExec(name, imports={}) {
  const file = path.join(sourceRoot,name)
  const src = fs.readFileSync(file,'utf8')
  const ast = ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length,0,name+' parse errors')
  const output = ts.transpileModule(src,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2022},reportDiagnostics:true})
  assert.equal((output.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0)
  const mod={exports:{}}
  vm.runInNewContext(output.outputText,{module:mod,exports:mod.exports,
    require:specifier=>{
      assert.ok(Object.hasOwn(imports,specifier),'unexpected runtime source import '+specifier)
      return imports[specifier]
    }},{filename:file,timeout:2500})
  return mod.exports
}
const buildRepairContextRoute=sourceExec('repair-context-route.ts').buildRepairContextRoute
assert.equal(typeof buildRepairContextRoute,'function')
const {loadSourceModule}=require('./helpers/harness-ts-loader.cjs')
const buildTaskContextRecipe=sourceExec('task-context-recipe.ts',{
  './harness-catalog.ts':loadSourceModule('harness-catalog.ts')
}).buildTaskContextRecipe

const PROJECT='c2927684-543e-4b9d-ae4e-0150e9910f51'
const JOB='c2927684-543e-4b9d-ae4e-0150e9910f52'
const JOB_SHA='a'.repeat(40)
function taskContext(){
  const job={kind:'JOB',project_id:PROJECT,job_id:JOB,lifecycle:'IN_PROGRESS',
    execution_contract:'NEXT',planning_revision:1,
    planning_review:{status:'PASS',reviewed_revision:1},
    planning_context:{phase:'repair'},
    tasks:[{task_id:'repair',objective:'Repair failing GSA source assertion',scope:['run admission'],
      dependencies:[],required_skills:[],completion_criteria:['Observed test regression corrected'],lifecycle:'READY'}],
    topology:[{task_id:'repair',handler:'coder'}]}
  return buildTaskContextRecipe({role:'coder',project_id:PROJECT,job,task_id:'repair',
    job_record_path:'projects/'+PROJECT+'/WORK/JOBS/'+JOB+'.json',
    job_record_sha:JOB_SHA,current_job_record_sha:JOB_SHA,
    run:{project_id:PROJECT,job_id:JOB,role:'coder',primary_task_id:'repair',
      planning_revision:1,lifecycle:'IN_PROGRESS'}})
}
function input(override={}){
  return {failure:{classification:'PRODUCT_FAILURE',observed:true,
    tool_name:'run_begin',error_code:'NEXT_DISPATCH_STALE_JOB_SHA',
    reproduction_ref:'test-lab/runtime-logic.test.cjs / captured failing assertion',
    expected:'Matching Job SHA should permit the preflight condition',actual:'Job readback SHA differs',
    target_revision:sha,host_test_available:true},
    source_ref:sha,locator_ref:sha,source_locator:locator,
    graph_ref:sha,repair_graph:graph,task_context:taskContext(),
    required_task_id:'repair',...override}
}
const plain=x=>JSON.parse(JSON.stringify(x))
const codes=x=>x.findings.map(y=>y.code)
const paths=x=>x.source_candidates.map(y=>y.path)

test('A3 graph references only actual A0 source symbols, owning consumers and real regression files',()=>{
  assert.equal(graph.schema,'gsa4-a3-repair-edges/v1')
  assert.equal(graph.advisory_only,true)
  assert.ok(graph.edges.length>=10)
  for(const e of graph.edges){
    assert.match(e.from,/^[A-Za-z0-9_./-]+\.ts$/)
    assert.match(e.to,/^[A-Za-z0-9_./-]+\.ts$/)
    const from=fs.readFileSync(path.join(sourceRoot,e.from),'utf8')
    const to=fs.readFileSync(path.join(sourceRoot,e.to),'utf8')
    assert.ok(from.includes(e.symbol),'missing actual caller '+e.from+'→'+e.symbol)
    assert.match(to,new RegExp('\\b(?:export\\s+)?(?:async\\s+)?function\\s+'+e.symbol+'\\b'),
      'target function missing: '+e.to+'/'+e.symbol)
    for(const p of e.tests??[])assert.ok(fs.existsSync(path.join(repo,p)),p)
  }
})

test('A3 finds real source owner and relevant callers without claiming verified root or authorization',()=>{
  const result=plain(buildRepairContextRoute(input()))
  assert.equal(result.schema,'gsa4-a3-repair-context/v1')
  assert.equal(result.repair_authorized,false)
  assert.equal(result.test_pass_claimed,false)
  assert.equal(result.root_cause_confirmed,false)
  assert.equal(result.decision,'READ_MORE') // A2 still requires Human/M5 live source recheck.
  assert.ok(paths(result).includes('run-dispatch-closure-guards.ts'))
  assert.ok(paths(result).includes('run/run-begin.ts'))
  assert.ok(paths(result).includes('durable-record-io.ts'))
  assert.ok(result.test_candidates.some(t=>t.path==='test-lab/runtime-logic.test.cjs'))
  assert.ok(result.source_candidates.every(x=>x.root_cause_proven===false && x.trust==='VERIFY_CURRENT_BLOB'))
})

test('A3 classifies environment failure as PROBE, never auto repair',()=>{
  const x=input({failure:{classification:'ENVIRONMENT_FAILURE',observed:true,host_test_available:false,
    tool_name:'run_begin'}})
  const res=plain(buildRepairContextRoute(x))
  assert.equal(res.decision,'PROBE')
  assert.ok(codes(res).includes('HOST_PROBE_REQUIRED'))
  assert.ok(codes(res).includes('HOST_UNAVAILABLE'))
  assert.equal(res.repair_authorized,false)
})
test('A3 stops on missing accepted specification, A2 blocked task and stale source refs',()=>{
  const spec=plain(buildRepairContextRoute(input({failure:{classification:'SPEC_GAP',observed:true,tool_name:'run_begin'}})))
  assert.equal(spec.decision,'STOP')
  assert.ok(codes(spec).includes('SPEC_DECISION_REQUIRED'))
  const blocked=input()
  blocked.task_context={...blocked.task_context,decision:'STOP'}
  const b=plain(buildRepairContextRoute(blocked))
  assert.equal(b.decision,'STOP')
  assert.ok(codes(b).includes('TASK_CONTEXT_BLOCKED'))
  const stale=input({locator_ref:'b'.repeat(40)})
  const s=plain(buildRepairContextRoute(stale))
  assert.equal(s.decision,'STOP')
  assert.ok(codes(s).includes('LOCATOR_REVISION_MISMATCH'))
  assert.deepEqual(s.source_candidates,[])
})
test('A3 does not invent a root owner for unknown unobserved failures',()=>{
  const x=input({failure:{classification:'UNKNOWN',observed:false}})
  const r=plain(buildRepairContextRoute(x))
  assert.equal(r.decision,'READ_MORE')
  assert.ok(codes(r).includes('FAILURE_NOT_OBSERVED'))
  assert.ok(codes(r).includes('NO_INITIAL_OWNER'))
  assert.equal(r.source_candidates.length,0)
  assert.equal(r.root_cause_confirmed,false)
})
test('A3 expands call/consumer coverage on repeated failed retest',()=>{
  const f={...input().failure,tool_name:'checkpoint_verification_prepare',error_code:'CHECKPOINT_CLAIM_REJECTED'}
  const first=plain(buildRepairContextRoute(input({failure:f})))
  const second=plain(buildRepairContextRoute(input({failure:{...f,failed_retest:true}})))
  assert.ok(paths(second).includes('checkpoint/verification-gate.ts'))
  assert.ok(paths(second).includes('evidence-validation.ts'))
  assert.ok(codes(second).includes('FAILED_RETEST_EXPAND_CAUSAL_GRAPH'))
  assert.ok(paths(second).length>=paths(first).length)
  assert.ok(second.review_and_retest.some(s=>s.includes('Independent Reviewer')))
})
test('A3 traces evidence publish callback into root composition rather than assuming leaf root cause',()=>{
  const x=input({failure:{...input().failure,
    tool_name:'evidence_repository_publish_finalize',error_code:undefined}})
  const r=plain(buildRepairContextRoute(x))
  assert.ok(paths(r).includes('evidence-repo/publish-finalize.ts'))
  assert.ok(paths(r).includes('index.ts')) // validateRepositoryProbeSnapshot is inside createServer
  assert.ok(r.source_candidates.some(s=>s.reasons.some(x=>x.includes('validateRepositoryProbeSnapshot'))))
})
test('A3 rejects malformed graph, forged traversal paths and absent Task identity',()=>{
  const graphFake=JSON.parse(JSON.stringify(graph))
  graphFake.edges[0].to='../secrets.ts'
  const r=plain(buildRepairContextRoute(input({repair_graph:graphFake})))
  assert.ok(codes(r).includes('GRAPH_EDGE_INVALID'))
  assert.ok(!paths(r).includes('../secrets.ts'))
  const missing=plain(buildRepairContextRoute(input({task_context:undefined,required_task_id:'repair'})))
  assert.ok(codes(missing).includes('TASK_CONTEXT_REVALIDATE'))
  assert.equal(missing.repair_authorized,false)
  const wrong=plain(buildRepairContextRoute(input({required_task_id:'other-task'})))
  assert.ok(codes(wrong).includes('TASK_ID_MISMATCH'))
  assert.equal(wrong.decision,'STOP')
})
test('A3 never mutates current error/Task/graph evidence or invokes extra MCP tools',()=>{
  const x=input()
  const before=JSON.stringify(x)
  const result=plain(buildRepairContextRoute(x))
  assert.equal(JSON.stringify(x),before)
  assert.equal(result.repair_authorized,false)
  assert.equal(Object.hasOwn(result,'new_mcp_tool'),false)
  assert.equal(Object.hasOwn(result,'mutation_authorized'),false)
})
