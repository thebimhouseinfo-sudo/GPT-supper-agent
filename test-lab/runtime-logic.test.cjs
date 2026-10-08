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
