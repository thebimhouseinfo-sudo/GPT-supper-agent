'use strict'
// U-E -> U-F cross-track contract: consumes the ACTUAL frozen U-E S1-S4 oracle
// and ACTUAL U-F assessment implementation. This test is SIMULATED evidence,
// NOT a connected Host Test, persisted Git CAS readback or blind-Designer proof.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const oracle = JSON.parse(fs.readFileSync(
  path.join(__dirname,'scenarios/tester/UE-S1-S4-ORACLES.json'),'utf8'))
const modPath = path.join(__dirname,'../supabase/functions/gsa-mcp/harness/skills/retest-history.ts')
const compiled = ts.transpileModule(fs.readFileSync(modPath,'utf8'),{
  fileName:modPath,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  reportDiagnostics:true})
assert.equal((compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0)
const mod={exports:{}}
vm.runInNewContext(compiled.outputText,{module:mod,exports:mod.exports},
  {filename:modPath,timeout:2500})
const {assessDefectRetests,defectIdentity,advancedDefectReport}=mod.exports
assert.equal(oracle.schema,'ue-oracle-v1')
const scenarios=new Map(oracle.scenarios.map(s=>[s.id,s]))
const revs=['b','c','d','e'].map(x=>x.repeat(40))
function origin(id,surface='SIMULATED') {
  const s=scenarios.get(id)
  assert.ok(s,'U-E frozen scenario is required: '+id)
  return {
    project_id:'integration-ue-uf-fixture',
    original_failure_ref:'fixture:ue-'+id+'-original-failure',
    original_revision:'a'.repeat(40),
    actual_error:'SIMULATED_'+id+'_USER_TRIGGER_FAILURE',
    user_visible_symptom:s.negative,
    original_reproduction:s.entrypoint,
    required_surface:surface,
  }
}
function cycle(base,i,result='FAIL',overrides={}) {
  const rev=revs[i]
  const t={producer:'tester',run_id:'tester-'+i,verification_ref:'fixture:ue-uf-test-'+i,
    verification_readback_sha:(i+1).toString(16).repeat(40),
    target_revision:rev,result,
    ...(result==='FAIL'?{failure_class:'PRODUCT_FAILURE'}:{}),
    original_trigger_replayed:true,affected_regressions_replayed:true,
    execution_surface:'SIMULATED',
    evidence_refs:[base.original_failure_ref,'fixture:ue-frozen-oracle-'+i],
    tested_at:'2026-11-04T0'+(i+1)+':00:00Z',
    scenario_seed_ref:'test-lab/scenarios/tester/UE-S1-S4-ORACLES.json#'+
      base.actual_error.slice(10,12)}
  return {
    origin:base,job_id:'job-'+i,chat_id:'chat-'+i,bug_title:'renamed-'+i,
    patch:{coder_role:'coder',coder_run_id:'coder-'+i,authorization_ref:'fixture:authorized-'+i,
      revision:rev,goal_recheck_ref:'fixture:goal-'+i,goal_recheck_revision:rev},
    tester:{...t,...overrides}
  }
}
function assess(base,attempts) {
  // A simulated fixture only. history_complete is NOT evidence of Git readback.
  return assessDefectRetests({origin:base,attempts,history_complete:true,
    history_evidence_refs:['fixture:not-a-real-project-memory-readback']})
}

test('cross-track fixture preserves U-E S1-S4 original triggers and mock/Host boundary',()=>{
  assert.deepEqual([...scenarios.keys()],['S1','S2','S3','S4'])
  for(const s of scenarios.values()) {
    assert.ok(s.entrypoint && s.negative && s.positive && s.boundary_profiles.length)
    assert.equal(origin(s.id).original_reproduction,s.entrypoint)
  }
  assert.match(oracle.mock_boundary,/synthetic/i)
  assert.match(oracle.source_independence,/UNVERIFIED/)
  assert.ok(oracle.evidence_rules.some(s=>/Mock PASS does not/.test(s)))
})

test('U-E S1 user entrypoint: only independent Tester replay may close a synthetic defect',()=>{
  const o=origin('S1')
  const p=assess(o,[cycle(o,0,'PASS')])
  assert.equal(p.status,'CLOSED_BY_TESTER')
  assert.equal(p.failed_cycles,0)
  assert.equal(p.advisory_only,true)
  assert.equal(p.ordinary_fourth_patch_allowed,false)
  const bad=assess(o,[cycle(o,0,'FAIL',{producer:'coder'})])
  assert.equal(bad.failed_cycles,0)
  assert.notEqual(bad.status,'CLOSED_BY_TESTER')
})

test('U-E S2 sequential save/reopen: incomplete original-trigger replay never certifies PASS',()=>{
  const o=origin('S2')
  assert.match(o.original_reproduction,/Save -> Reopen/)
  const r=assess(o,[cycle(o,0,'PASS',{original_trigger_replayed:false})])
  assert.equal(r.failed_cycles,0)
  assert.equal(r.status,'AWAIT_TESTER')
  assert.ok(r.excluded.some(e=>e.reason==='INDEPENDENT_TESTER_REPLAY_OR_READBACK_NOT_PROVEN'))
})

test('U-E S3 duplicate/two-chat scenario: three independent simulated retest failures escalate without resetting across Jobs',()=>{
  const s=scenarios.get('S3')
  assert.match(s.negative,/double-spawn/)
  assert.ok(s.criteria.some(x=>x.includes('conflicting CAD')))
  const o=origin('S3')
  const a=[cycle(o,0),cycle(o,1),cycle(o,2)]
  assert.equal(defectIdentity(a[0].origin),defectIdentity(a[2].origin))
  const r=assess(o,a)
  assert.equal(r.failed_cycles,3)
  assert.equal(r.status,'ROOT_CAUSE_REQUIRED')
  assert.equal(r.ordinary_repair_may_be_considered,false)
  assert.equal(r.ordinary_fourth_patch_allowed,false)
  assert.equal(r.debugging_skill,'debugging')
  const report=advancedDefectReport({origin:o,assessment:r,
    causal_events:[{step:'User click -> unexpected second CAD child',expected:s.positive,
      observed:s.negative,evidence_refs:['fixture:ue-S3'],diverged:true,child_flow:'duplicate-child'}],
    unknowns:['No authenticated GSA or native CAD execution has occurred']})
  assert.match(report,/unexpected second CAD child/)
  assert.match(report,/No authenticated GSA or native CAD execution/)
})

test('U-E S4 cancel/late ACK: simulated result cannot satisfy a REAL_HOST retest',()=>{
  const s=scenarios.get('S4')
  assert.match(s.negative,/late-ACK/)
  const o=origin('S4','REAL_HOST')
  const r=assess(o,[cycle(o,0,'FAIL')])
  assert.equal(r.failed_cycles,0)
  assert.equal(r.status,'AWAIT_TESTER')
  assert.notEqual(r.status,'ROOT_CAUSE_REQUIRED')
  assert.equal(r.advisory_only,true)
})

test('cross-track invariant: missing verifiable readback keeps U-F as READ_HISTORY',()=>{
  const o=origin('S3')
  const r=assessDefectRetests({origin:o,attempts:[cycle(o,0)],history_complete:false,
    history_evidence_refs:[]})
  assert.equal(r.status,'READ_HISTORY')
  assert.equal(r.history_complete,false)
  assert.equal(r.ordinary_fourth_patch_allowed,false)
})
