// Explicitly limited helper-level regression suite: this does NOT prove live GitHub CAS or E2E.
// Run: npm install --no-save typescript@5.9.3 && node --test test-lab/runtime-logic.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('supabase/functions/gsa-mcp/index.ts', 'utf8');
const parsed = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
function load(name, injected = {}) {
  const node = parsed.statements.find(x => ts.isFunctionDeclaration(x) && x.name?.text === name);
  assert.ok(node, 'runtime function must exist: ' + name);
  const js = ts.transpileModule(node.getText(parsed), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const context = vm.createContext({ ...injected, Date, Set, Number, String, JSON, Array });
  return vm.runInContext(js + '\n' + name, context);
}
const resolveExecutionContract = load('resolveExecutionContract', { DEFAULT_EXECUTION_CONTRACT: 'V2_STABLE' });
const jobExecutionContract = load('jobExecutionContract', { resolveExecutionContract });
const leaseExpired = load('checkpointLeaseExpired');
const uxGate = load('uxFirstTemporaryUiGateRequired');
const checkpointOutcome = load('checkpointVerificationOutcome');
const prereqs = (job, entries) => ({ completed: new Set(entries.map(e => e.task)), error: null });
const dispatch = load('nextDispatchPreflightError', { jobExecutionContract, validateCompletedTaskRunSnapshots: prereqs });
const sha = 'a'.repeat(40);
const job = { execution_contract: 'NEXT', planning_revision: 7, tasks: [{task_id:'B', dependencies:['A']}], topology:[{task_id:'B',handler:'tester'}] };
function decision(j=job, role='tester', entries=[{task:'A'}], left=sha, right=sha, revision=7) {
  return dispatch(j,role,['B'],revision,left,right,entries);
}
test('legacy records remain V2_STABLE and unknown contracts reject', () => {
  assert.equal(resolveExecutionContract(undefined),'V2_STABLE');
  assert.equal(resolveExecutionContract('unrecognized'),null);
});
test('expired and live leases behave oppositely', () => {
  assert.equal(leaseExpired({ lease_expires_at:'2020-01-01T00:00:00Z' },Date.now()),true);
  assert.equal(leaseExpired({ lease_expires_at:'2099-01-01T00:00:00Z' },Date.now()),false);
});
test('temporary UI Human Gate blocks Coder only when approval is pending', () => {
  const j={product_workflow:'UX_FIRST',ui_strategy:{temporary_ui:['demo'],temporary_ui_human_approval:'REQUIRED_PENDING'}};
  assert.equal(uxGate(j,'coder'),true);
  assert.equal(uxGate(j,'tester'),false);
  assert.equal(uxGate({...j,ui_strategy:{...j.ui_strategy,temporary_ui_human_approval:'APPROVED'}},'coder'),false);
});
test('NEXT dispatch rejects absent/stale SHA, role, prerequisites and revision', () => {
  assert.equal(decision(),null);
  assert.match(decision(job,'tester',[{task:'A'}],null,null),/STALE_JOB_SHA/);
  assert.match(decision(job,'tester',[{task:'A'}],sha,'b'.repeat(40)),/STALE_JOB_SHA/);
  assert.match(decision(job,'tester',[]),/PREREQUISITE_BLOCKED/);
  assert.match(decision(job,'coder'),/WRONG_ROLE/);
  assert.match(decision(job,'tester',[{task:'A'}],sha,sha,6),/STALE_PLANNING_REVISION/);
  assert.equal(dispatch({...job,execution_contract:'V2_STABLE'},'coder',['B'],null,null,null,[]),null);
});
test('PRODUCT_FAILURE, PLAN_GAP and OBSERVED use distinct routes', () => {
  assert.equal(checkpointOutcome('FAIL','PRODUCT_FAILURE').state,'FAILED_PRODUCT');
  assert.equal(checkpointOutcome('FAIL','PLAN_GAP').state,'NEEDS_PLANNER_REVISION');
  assert.equal(checkpointOutcome('OBSERVED').state,'OBSERVED');
});
test('negative control: intentionally broken dispatch MUST make assertion fail', () => {
  const mutated = {...job,topology:[{task_id:'B',handler:'coder'}]};
  assert.throws(() => assert.equal(decision(mutated),null), assert.AssertionError);
});
test('two-writer CAS model allows one winner and rejects loser (MODEL ONLY)', () => {
  let durable=sha;
  const tryUpdate=(expected,next)=>{ if(expected!==durable)return false;durable=next;return true; };
  assert.equal(tryUpdate(sha,'b'.repeat(40)),true);
  assert.equal(tryUpdate(sha,'c'.repeat(40)),false);
  assert.equal(durable,'b'.repeat(40));
});
// M1 CRL: test exact runtime helpers, not a hand-written equivalent.
// These helper-level checks do NOT replace end-to-end persisted Reviewer/CR verification.
const crlRoute = load('milestoneLoopDecision');
const crlEvidence = load('milestoneCrlEvidenceError', { validMemoryPath: () => true });
const crlJob = {
  project_id: '00000000-0000-0000-0000-000000000001',
  job_id: '00000000-0000-0000-0000-000000000002',
  type: 'code', execution_contract: 'NEXT', lifecycle: 'IN_PROGRESS',
  planning_revision: 5, planning_review: {status:'PASS',reviewed_revision:5},
  milestones: [{milestone_id:'M1',node_ids:['task-A'],review_loop:'crl',human_pre_authorized:true,continuation:'AUTO'}],
};
function crl(stage,verdict,jobOverride=crlJob,noProgress=0) {
  return crlRoute(jobOverride,'M1',stage,verdict,noProgress);
}
test('M1 source TypeScript parses and CRL inner RL truly transitions in both directions', () => {
  assert.equal(parsed.parseDiagnostics.length,0);
  assert.equal(crl('BEGIN','NONE').next_action,'RUN_REVIEWER');
  assert.equal(crl('REVIEWER','FAIL').next_action,'REPAIR_AND_REREVIEW');
  assert.equal(crl('REVIEWER','PASS').next_action,'VERIFY_REVIEWER_PASS_THEN_CR');
  assert.equal(crl('CR','FAIL').next_action,'REPAIR_AND_REREVIEW');
  assert.equal(crl('CR','PASS').next_action,'CONTINUE_AUTO');
  assert.equal(crl('CR','BLOCKED').next_action,'STOP_BLOCKED');
  assert.equal(crl('CR','FAIL',crlJob,3).next_action,'STOP_BLOCKED');
});
test('M1 Planner-owned repairs go to Planner, Coder-owned repairs to Coder', () => {
  const plannerJob={...crlJob,type:'plan'};
  assert.equal(crl('CR','FAIL',plannerJob).next_role,'planner');
  assert.equal(crl('REVIEWER','FAIL',plannerJob).next_role,'planner');
  assert.equal(crl('CR','FAIL').next_role,'coder');
  assert.equal(crl('REVIEWER','FAIL').next_role,'coder');
});
test('M1 CRL never admits unapproved milestone or stale planning revision', () => {
  assert.equal(crl('BEGIN','NONE',{...crlJob,milestones:[]}).next_action,'STOP');
  assert.equal(crl('BEGIN','NONE',{...crlJob,milestones:[{...crlJob.milestones[0],human_pre_authorized:false}]}).next_action,'STOP');
  assert.equal(crl('BEGIN','NONE',{...crlJob,planning_review:{status:'PASS',reviewed_revision:4}}).next_action,'STOP');
});
function reviewSnapshot(changes={}) {
  return {path:'projects/'+crlJob.project_id+'/VERIFICATION/v.json',sha,
    record_text:JSON.stringify({
      kind:'REVIEW',result:'PASS',producer:'reviewer',project_id:crlJob.project_id,
      job_id:crlJob.job_id,planning_revision:5,milestone_id:'M1',target_revision:sha,...changes,
    })};
}
test('M1 CRL evidence is exact job/milestone/revision AND source SHA bound', () => {
  assert.equal(crlEvidence(crlJob,'M1',reviewSnapshot(),sha),null);
  assert.match(crlEvidence(crlJob,'M1',reviewSnapshot(),'b'.repeat(40)),/SOURCE_REVISION_MISMATCH/);
  assert.match(crlEvidence(crlJob,'M1',reviewSnapshot(),undefined),/SOURCE_REVISION_MISMATCH/);
  assert.match(crlEvidence(crlJob,'M1',reviewSnapshot({milestone_id:'M2'}),sha),/REVIEW_INVALID/);
  assert.match(crlEvidence(crlJob,'M1',reviewSnapshot({planning_revision:4}),sha),/REVIEW_INVALID/);
  assert.match(crlEvidence(crlJob,'M1',reviewSnapshot({result:'FAIL'}),sha),/REVIEW_INVALID/);
});
test('M1 negative control: removing source SHA comparison makes stale-evidence assertion RED', () => {
  const node=parsed.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text==='milestoneCrlEvidenceError');
  assert.ok(node);
  const good=node.getText(parsed);
  const mutant=good.replace('review.target_revision !== targetRevision','false');
  assert.notEqual(mutant,good,'mutation must alter the actual code');
  const js=ts.transpileModule(mutant,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const broken=vm.runInNewContext(js+'\nmilestoneCrlEvidenceError',{validMemoryPath:()=>true,JSON,String});
  assert.throws(()=>assert.match(broken(crlJob,'M1',reviewSnapshot(),'b'.repeat(40)),/SOURCE_REVISION_MISMATCH/),assert.AssertionError);
});
test('M1 source CR record routes preauthorized milestone via orchestrator, direct cr to Human', () => {
  const start=source.indexOf("'critic_review_record'");
  const end=source.indexOf("'checkpoint_claim_prepare'",start);
  assert.ok(start>0&&end>start);
  const route=source.slice(start,end);
  assert.match(route,/next_role:\s*human_invoked === true \? 'human' : 'orchestrator'/);
  assert.match(route,/milestone_loop_evaluate\(stage=CR/);
  assert.match(route,/After immutable CR Verification persistence and exact readback/);
  const runStart=source.indexOf("'run_begin'");
  const runEnd=source.indexOf("'relationship_knowledge_prepare'",runStart);
  assert.match(source.slice(runStart,runEnd),/milestone_id: approvedReviewMilestones\[0\]\.milestone_id/);
  const verifyStart=source.indexOf("'run_verification_record'");
  const verifyEnd=source.indexOf("'run_complete'",verifyStart);
  assert.match(source.slice(verifyStart,verifyEnd),/milestone_id: run\.milestone_id/);
});
