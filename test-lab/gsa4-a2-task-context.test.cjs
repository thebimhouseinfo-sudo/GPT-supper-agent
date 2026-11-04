'use strict'
// Pure A2 Task context is a reference packet, NOT an execution/permission gate.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { loadSourceModule } = require('./helpers/harness-ts-loader.cjs')
const repoRoot = path.resolve(__dirname, '..')
const sourcePath = path.join(repoRoot, 'supabase/functions/gsa-mcp/task-context-recipe.ts')
const source = fs.readFileSync(sourcePath, 'utf8')
const parsed = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
assert.equal(parsed.parseDiagnostics.length, 0, 'real A2 TypeScript must parse')
const compiled = ts.transpileModule(source, { fileName: sourcePath,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true })
assert.equal((compiled.diagnostics || []).filter(x => x.category === ts.DiagnosticCategory.Error).length, 0)
const mod = { exports: {} }
vm.runInNewContext(compiled.outputText,
  { module: mod, exports: mod.exports, require: spec => {
    assert.equal(spec, './harness-catalog.ts', 'A2 can only load current actual role/skill catalog')
    return loadSourceModule('harness-catalog.ts')
  } },
  { filename: sourcePath, timeout: 2500 })
const buildTaskContextRecipe = mod.exports.buildTaskContextRecipe
assert.equal(typeof buildTaskContextRecipe, 'function')
const locator = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/architecture/GSA4-A1-SOURCE-LOCATOR.json'), 'utf8'))
const PROJECT='c2927684-543e-4b9d-ae4e-0150e9910f51'
const JOB='c2927684-543e-4b9d-ae4e-0150e9910f52'
const sha='a'.repeat(40)
const bsha='b'.repeat(40)
const gitRef='1476e8c6597ede29a690a730ae5e6886d8485704'
const makeJob=()=>({
  kind:'JOB', project_id:PROJECT, job_id:JOB, lifecycle:'READY', execution_contract:'NEXT',
  planning_revision:2, planning_review:{status:'PASS',reviewed_revision:2},
  planning_context:{phase:'implementation'},
  tasks:[
    {task_id:'backend',objective:'Change run admission MCP guard',scope:['backend guard'],dependencies:[],
      completion_criteria:['MCP deny regression observed'],required_skills:[],lifecycle:'READY'},
    {task_id:'ui',objective:'Implement an accessible frontend panel',scope:['UI component'],dependencies:[],
      completion_criteria:['Keyboard focus and viewport behavior observed'],
      required_skills:['ui-coder-frontend'],lifecycle:'READY'},
  ],
  topology:[{task_id:'backend',handler:'coder'},{task_id:'ui',handler:'coder'}],
  repository_context:{integration_branch:'upgrade/gsa-context-efficiency'},
})
const makeInput=(task='backend')=>({
  role:'coder',project_id:PROJECT,job:makeJob(),task_id:task,
  job_record_path:'projects/'+PROJECT+'/WORK/JOBS/'+JOB+'.json',
  job_record_sha:sha,current_job_record_sha:sha,
  run:{project_id:PROJECT,job_id:JOB,role:'coder',primary_task_id:task,planning_revision:2,lifecycle:'IN_PROGRESS'},
  source_locator:locator,source_locator_ref:gitRef,current_source_ref:gitRef,
  tool_names:task==='backend'?['run_begin','checkpoint_claim_prepare']:[],
})
const asPlain=x=>JSON.parse(JSON.stringify(x))
const codes=x=>x.findings.map(y=>y.code)

test('A2 derives different work context from two actual Job Tasks for SAME Coder Role',()=>{
  const backend=asPlain(buildTaskContextRecipe(makeInput('backend')))
  const ui=asPlain(buildTaskContextRecipe(makeInput('ui')))
  assert.equal(backend.schema,'gsa4-a2-task-context-recipe/v1')
  assert.equal(backend.advisory_only,true)
  assert.equal(backend.execution_authorized,false)
  assert.equal(backend.identity.role,'coder')
  assert.equal(ui.identity.role,'coder')
  assert.equal(backend.task_context.objective,'Change run admission MCP guard')
  assert.equal(ui.task_context.objective,'Implement an accessible frontend panel')
  assert.ok(backend.skills.some(s=>s.name==='coding-loop'&&s.source==='ROLE_SUGGESTED'))
  assert.ok(!backend.skills.some(s=>s.name==='ui-coder-frontend'))
  assert.deepEqual(ui.skills.filter(s=>s.source==='TASK_REQUIRED').map(s=>s.name),['ui-coder-frontend'])
  assert.ok(ui.skills.every(s=>!('skill_text' in s)), 'A2 never duplicates injected Skill bodies')
  assert.deepEqual(backend.source_candidates.map(s=>s.tool),['run_begin','checkpoint_claim_prepare'])
  assert.ok(backend.source_candidates.every(s=>s.trust==='REQUIRES_READBACK'))
  assert.ok(codes(backend).includes('CODER_WRITE_GATE_REQUIRES_LIVE_READBACK'))
})

test('A2 does not authorize stale Job, unknown Task or mismatched Run',()=>{
  const stale=makeInput();stale.current_job_record_sha=bsha
  assert.ok(codes(asPlain(buildTaskContextRecipe(stale))).includes('JOB_SHA_REVALIDATE'))
  const absent=makeInput();absent.task_id='not-a-task'
  assert.equal(buildTaskContextRecipe(absent).decision,'STOP')
  const run=makeInput();run.run={...run.run,planning_revision:3}
  const result=asPlain(buildTaskContextRecipe(run))
  assert.equal(result.decision,'STOP')
  assert.ok(codes(result).includes('RUN_IDENTITY_MISMATCH'))
  const retired=makeInput();retired.job.lifecycle='SUPERSEDED'
  assert.ok(codes(asPlain(buildTaskContextRecipe(retired))).includes('JOB_NOT_CURRENT'))
})

test('A2 fails closed on unsupported Skill, unverified domain add-ins and knowledge',()=>{
  const input=makeInput()
  input.job.tasks[0].required_skills=['invented-hvac-runtime-skill']
  input.requires_domain_addin=true
  input.knowledge_refs=[
    {path:'projects/'+PROJECT+'/KNOWLEDGE/k-x.md',sha:bsha,validity:'CURRENT',depends_on:[]},
    {path:'projects/unrelated/KNOWLEDGE/k.md',sha:bsha,validity:'CURRENT'},
  ]
  const result=asPlain(buildTaskContextRecipe(input))
  assert.ok(codes(result).includes('TASK_SKILL_NOT_DECLARED_IN_SCHEMA'))
  assert.ok(codes(result).includes('PROJECT_ADDIN_PROOF_REQUIRED'))
  assert.ok(codes(result).includes('KNOWLEDGE_REVALIDATE'))
  assert.equal(result.knowledge_candidates.length,1)
  assert.equal(result.knowledge_candidates[0].trust,'REQUIRES_READBACK')
  assert.equal(result.execution_authorized,false)
})

test('A2 refuses stale A1 locator and retains mandatory Role/Project readback',()=>{
  const input=makeInput()
  input.current_source_ref='deadbeef'
  const result=asPlain(buildTaskContextRecipe(input))
  assert.ok(codes(result).includes('SOURCE_LOCATOR_REVALIDATE'))
  assert.equal(result.source_candidates.length,0)
  assert.ok(result.required_reads.some(r=>r.kind==='PROJECT'))
  assert.ok(result.required_reads.some(r=>r.kind==='CRITERIA'))
  assert.ok(result.handoff.some(s=>s.includes('get_agent_harness')))
  assert.ok(result.handoff.some(s=>s.includes('Reviewer and Tester independently')))
})

test('A2 Critic Reviewer is never auto-authorized; malformed Job does not crash',()=>{
  const input=makeInput()
  input.role='critic_reviewer'; input.run=undefined
  const cr=asPlain(buildTaskContextRecipe(input))
  assert.equal(cr.execution_authorized,false)
  assert.ok(codes(cr).includes('CR_HUMAN_AUTHORIZATION_REQUIRES_READBACK'))
  const malformed=makeInput();malformed.job.tasks={unexpected:true};malformed.job.topology={}
  const m=asPlain(buildTaskContextRecipe(malformed))
  assert.ok(codes(m).includes('JOB_TASKS_UNAVAILABLE'))
  assert.ok(codes(m).includes('TASK_NOT_IN_CURRENT_JOB'))
})

test('A2 is pure, read-only and cannot change input snapshots or current Tool registry',()=>{
  const input=makeInput()
  const before=JSON.stringify(input)
  const result=asPlain(buildTaskContextRecipe(input))
  assert.equal(JSON.stringify(input),before)
  assert.equal(result.execution_authorized,false)
  assert.equal(Object.hasOwn(result,'authorization'),false)
  assert.equal(Object.hasOwn(result,'new_mcp_tools'),false)
})

test('A2 rejects forged locator paths, invalid Git SHA and wrong Project record prefix',()=>{
  const input=makeInput()
  input.source_locator=JSON.parse(JSON.stringify(locator))
  const entry=input.source_locator.tool_owners.find(x=>x.name==='run_begin')
  assert.ok(entry)
  entry.owner='../other-repo/secret.ts'
  const injected=asPlain(buildTaskContextRecipe(input))
  assert.ok(codes(injected).includes('SOURCE_OWNER_UNKNOWN'))
  assert.ok(injected.source_candidates.every(x=>x.tool!=='run_begin'))
  input.current_source_ref='not-a-commit'
  input.source_locator_ref='not-a-commit'
  assert.ok(codes(asPlain(buildTaskContextRecipe(input))).includes('SOURCE_LOCATOR_REVALIDATE'))
  input.job_record_path='projects/other-project/WORK/JOBS/malicious.json'
  const wrong=asPlain(buildTaskContextRecipe(input))
  assert.ok(codes(wrong).includes('JOB_PATH_MISSING'))
  assert.ok(!wrong.required_reads.some(x=>x.kind==='JOB'))
})
test('A2 refuses non-current Run as sufficient execution context',()=>{
  const input=makeInput()
  input.run.lifecycle='COMPLETED'
  const result=asPlain(buildTaskContextRecipe(input))
  assert.ok(codes(result).includes('RUN_LIFECYCLE_REVALIDATE'))
  assert.equal(result.execution_authorized,false)
})
