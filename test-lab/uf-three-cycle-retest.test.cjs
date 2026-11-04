'use strict'
// U-F independent Tester fixture; does not import U-E or claim live Host success.
const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const src = path.join(__dirname, '../supabase/functions/gsa-mcp/harness/skills/retest-history.ts')
const source = fs.readFileSync(src,'utf8')
const compiled = ts.transpileModule(source, {fileName:src, compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true})
assert.equal((compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0)
const mod = {exports:{}}
vm.runInNewContext(compiled.outputText,{module:mod,exports:mod.exports},
  {filename:src,timeout:2500})
const {defectIdentity,assessDefectRetests,advancedDefectReport}=mod.exports
const same = x=>JSON.parse(JSON.stringify(x))
const original = {project_id:'project-a', original_failure_ref:'projects/project-a/WORK/VERIFICATIONS/first-fail.json',
  original_revision:'a'.repeat(40),actual_error:'ERR_TIMEOUT on user open',
  user_visible_symptom:'Dialog freezes when pressing Open',
  original_reproduction:'Click Open on sample drawing after reconnect',
  required_surface:'SIMULATED'}
const revisions=['b','c','d','e'].map(x=>x.repeat(40))
function cycle(i,result='FAIL',opts={}) {
  const rev=revisions[i]
  return {origin:original,job_id:'job-'+i,chat_id:'chat-'+i,bug_title:'Ticket rename '+i,
    patch:{coder_role:'coder',coder_run_id:'coder-'+i,revision:rev,
      authorization_ref:'memory:authorized-patch-'+i,goal_recheck_ref:'memory:goal-'+i,
      goal_recheck_revision:rev},
    tester:{producer:'tester',run_id:'tester-'+i,
      verification_ref:'projects/project-a/WORK/VERIFICATIONS/retest-'+i+'.json',
      verification_readback_sha:(i+1).toString(16).repeat(40),
      target_revision:rev,result, failure_class:result==='FAIL'?'PRODUCT_FAILURE':undefined,
      original_trigger_replayed:true,affected_regressions_replayed:true,
      execution_surface:'SIMULATED',scenario_seed_ref:'fixtures/uf-origin-scenario',
      evidence_refs:[original.original_failure_ref,'tester:replay-'+i],
      tested_at:'2026-11-04T0'+(i+1)+':00:00Z'},
    ...opts}
}
const evalCycles=(cycles,opts={})=>same(assessDefectRetests({
  origin:original,attempts:cycles,history_complete:true,
  history_evidence_refs:['memory:all-project-verifications-readback'],
  ...opts}))
test('UF-01 same defect identity ignores chat/Job and bug-title rename',()=>{
  assert.equal(defectIdentity(cycle(0).origin),defectIdentity(cycle(1).origin))
  assert.equal(evalCycles([cycle(0),cycle(1)]).failed_cycles,2)
})
test('1 failed full cycle permits another authorized ordinary repair (not automatic grant)',()=>{
  const r=evalCycles([cycle(0)])
  assert.equal(r.failed_cycles,1)
  assert.equal(r.status,'CONTINUE_REPAIR')
  assert.equal(r.ordinary_repair_may_be_considered,true)
  assert.equal(r.ordinary_fourth_patch_allowed,false)
})
test('2 failed cycles retain their exact revisions and evidence',()=>{
  const r=evalCycles([cycle(0),cycle(1)])
  assert.equal(r.failed_cycles,2)
  assert.equal(r.completed[0].patch.revision,revisions[0])
  assert.equal(r.completed[1].tester.verification_ref,cycle(1).tester.verification_ref)
  assert.equal(r.status,'CONTINUE_REPAIR')
})
test('3 independently failed cycles stop fourth ordinary patch and select existing debugging skill',()=>{
  const r=evalCycles([cycle(0),cycle(1),cycle(2)])
  assert.equal(r.failed_cycles,3)
  assert.equal(r.status,'ROOT_CAUSE_REQUIRED')
  assert.equal(r.ordinary_repair_may_be_considered,false)
  assert.equal(r.ordinary_fourth_patch_allowed,false)
  assert.equal(r.debugging_skill,'debugging')
  assert.equal(r.advanced_report_required,true)
})
test('Host UNVERIFIED and environment failure never count as product FAIL',()=>{
  const blocked=cycle(1,'UNVERIFIED')
  blocked.tester.failure_class='ENVIRONMENT_FAILURE'
  const r=evalCycles([cycle(0),blocked])
  assert.equal(r.failed_cycles,1)
  assert.equal(r.status,'AWAIT_TESTER')
  assert.ok(r.excluded.some(x=>x.reason==='UNVERIFIED_NOT_PRODUCT_FAILURE'))
  const fake=cycle(2)
  fake.tester.failure_class='TEST_FAILURE'
  assert.equal(evalCycles([fake]).failed_cycles,0)
})
test('new chat, new Job, name change do not reset 3-cycle history',()=>{
  const attempts=[cycle(0),cycle(1),cycle(2)]
  attempts[2].chat_id='another-session'
  attempts[2].job_id='brand-new-job'
  attempts[2].bug_title='NEW ERROR TITLE'
  assert.equal(evalCycles(attempts).status,'ROOT_CAUSE_REQUIRED')
})
test('different defect with similar title does not inherit failed count',()=>{
  const other=cycle(2)
  other.origin={...original,original_failure_ref:'other-original-failing-verification',
    original_reproduction:'Different click sequence'}
  other.tester.evidence_refs=[other.origin.original_failure_ref,'different-retest']
  const r=evalCycles([cycle(0),cycle(1),other])
  assert.equal(r.failed_cycles,2)
  assert.equal(r.status,'CONTINUE_REPAIR')
})
test('Coder selftest PASS cannot close a defect when independent Tester FAIL',()=>{
  const x=cycle(0)
  x.patch.selftest_result='PASS'
  assert.equal(evalCycles([x]).status,'CONTINUE_REPAIR')
  assert.equal(evalCycles([x]).failed_cycles,1)
  const untrusted=cycle(1,'PASS')
  untrusted.tester.producer='coder'
  assert.equal(evalCycles([untrusted]).status,'AWAIT_TESTER')
})
test('No fourth ordinary patch even when an extra attempt is supplied',()=>{
  const r=evalCycles([cycle(0),cycle(1),cycle(2),cycle(3)])
  assert.equal(r.failed_cycles,4)
  assert.equal(r.status,'ROOT_CAUSE_REQUIRED')
  assert.equal(r.ordinary_fourth_patch_allowed,false)
})
test('no double counting multiple Tester verifications for the same patch',()=>{
  const x=cycle(0),repeat=same(x)
  repeat.tester.verification_ref='memory:second-rerun-same-revision'
  assert.equal(evalCycles([x,repeat]).failed_cycles,1)
})
test('unverified insufficient Host surface cannot close the issue',()=>{
  const x=cycle(0,'PASS')
  x.origin={...original,required_surface:'REAL_HOST'}
  const r=assessDefectRetests({origin:x.origin, attempts:[x], history_complete:true,
    history_evidence_refs:['memory:all']})
  assert.equal(r.failed_cycles,0)
  assert.equal(r.status,'AWAIT_TESTER')
})
test('missing complete Project Memory readback blocks a fresh-chat reset or patch',()=>{
  const r=evalCycles([cycle(0)],{history_complete:false})
  assert.equal(r.status,'READ_HISTORY')
  assert.equal(r.ordinary_repair_may_be_considered,false)
})
test('unauthorized, missing Goal Recheck, self-Tester or revision mismatch not counted',()=>{
  const a=cycle(0);a.patch.authorization_ref=''
  const b=cycle(1);b.patch.goal_recheck_revision='wrong'
  const c=cycle(2);c.tester.run_id=c.patch.coder_run_id
  const d=cycle(3);d.tester.target_revision='wrong'
  const r=evalCycles([a,b,c,d])
  assert.equal(r.failed_cycles,0)
  assert.equal(r.status,'AWAIT_TESTER')
  assert.equal(r.excluded.length,4)
})
test('conflicting PASS/FAIL at the same revision requires reconciliation',()=>{
  const x=cycle(0), y=cycle(0,'PASS')
  y.tester.verification_ref='memory:contradiction'
  assert.equal(evalCycles([x,y]).status,'RECONCILE')
})
test('independent Tester PASS can close before three failed cycles, not by CI green',()=>{
  const r=evalCycles([cycle(0),cycle(1,'PASS')])
  assert.equal(r.failed_cycles,1)
  assert.equal(r.status,'CLOSED_BY_TESTER')
})
test('early evidenced architectural/race divergence can trigger root-cause route',()=>{
  const r=evalCycles([cycle(0)],{early_escalation_evidence:['Host trace: concurrent callback ordering']})
  assert.equal(r.failed_cycles,1)
  assert.equal(r.status,'ROOT_CAUSE_REQUIRED')
})
test('advanced report preserves original repro, three revisions, evidence, causal timeline and unknowns',()=>{
  const assessment=evalCycles([cycle(0),cycle(1),cycle(2)])
  const report=advancedDefectReport({origin:original,assessment,
    causal_events:[{step:'click',expected:'dispatch',observed:'dispatch',evidence_refs:['trace:1'],diverged:false},
      {step:'queue',child_flow:'callback-2',wait_or_state:'after reconnect',expected:'queued once',
       observed:'queued twice',evidence_refs:['trace:2'],diverged:true}],
    hypotheses:[{cause:'duplicate reconnect callback',confidence:'MEDIUM',
      supporting_evidence:['trace:2'],distinguishing_experiment:'disable callback on reconnect'}],
    proposed_correction:'Guard callback registration once per session',
    regression_plan:['Original Open trigger','Reconnect and cancel stress'],
    unknowns:['Real Host confirmation']})
  for(const expected of [original.original_reproduction,revisions[0],revisions[1],revisions[2],
    'trace:2','First evidenced divergent event: queue','MEDIUM',
    'distinguish: disable callback','Real Host confirmation','no automatic patch'])
    assert.ok(report.includes(expected),expected)
})
test('when first divergent event has no evidence, report never invents root cause',()=>{
  const report=advancedDefectReport({origin:original,assessment:evalCycles([cycle(0),cycle(1),cycle(2)]),
    causal_events:[{step:'Host',expected:'A',observed:'B',evidence_refs:[],diverged:true}]})
  assert.match(report,/First evidenced divergent event: UNKNOWN/)
})
test('source contract keeps GSA4 and U-E independent; no new MCP tool or DB',()=>{
  const debug=fs.readFileSync(path.join(__dirname,'../supabase/functions/gsa-mcp/harness/skills/debugging.ts'),'utf8')
  assert.ok(debug.includes('debuggingSkill'))
  assert.ok(!source.includes('registerTool('))
  assert.ok(!source.includes('scenario-tester') && !source.includes('simulate.skill'))
})
