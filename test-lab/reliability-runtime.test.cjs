// Reliability tests: execute actual TypeScript runtime function declarations.
// This tests pure preflight behavior, NOT durable GitHub CAS or live host recovery.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('supabase/functions/gsa-mcp/index.ts', 'utf8');
const parsed = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
function runtimeFunction(name, transform = body => body) {
  const decl = parsed.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(decl, 'Expected real runtime function: ' + name);
  const js = ts.transpileModule(transform(decl.getText(parsed)), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText;
  const ctx = vm.createContext({ Number, String, Date, JSON });
  return vm.runInContext(js + '\n' + name, ctx);
}
const recover = runtimeFunction('sourceMutationRecoveryDecision');
const progress = runtimeFunction('orchestrationProgressDecision');
const a = 'a'.repeat(40), b = 'b'.repeat(40), c = 'c'.repeat(40), d = 'd'.repeat(40);
const base = {operation_id:'job-42-change-1',expected_head_sha:a,current_head_sha:a,previous_blob_sha:b,intended_blob_sha:c,current_blob_sha:b};
const call = (delta = {}) => recover({ ...base, ...delta });
const pbase = {job_lifecycle:'IN_PROGRESS',run_lifecycle:'IN_PROGRESS',previous_fingerprint:'s1',current_fingerprint:'s1',stalled_cycles:0,mutation_retry_count:0};

test('lost-response recovery only reports current target state, never mutation authorization', () => {
  assert.equal(call().disposition, 'NOT_APPLIED');
  assert.equal(call().mutation_authorized, false);
  assert.equal(call({current_blob_sha:c}).disposition, 'TARGET_STATE_PRESENT');
  assert.equal(call({current_blob_sha:c,current_head_sha:d}).next_action, 'RECONCILE_INTERVENING_COMMITS');
  assert.equal(call({current_blob_sha:b,current_head_sha:d}).disposition, 'UNKNOWN_CONFLICT');
  assert.equal(call({current_blob_sha:d}).disposition, 'UNKNOWN_CONFLICT');
  assert.equal(call({previous_blob_sha:c}).disposition, 'ALREADY_SATISFIED');
  assert.equal(call({operation_id:'  '}).disposition, 'UNKNOWN_CONFLICT');
});
test('deleted target uses null blob and still needs authoritative head', () => {
  assert.equal(call({previous_blob_sha:null,current_blob_sha:null}).disposition, 'NOT_APPLIED');
  assert.equal(call({previous_blob_sha:null,current_blob_sha:null,current_head_sha:d}).disposition, 'UNKNOWN_CONFLICT');
});
test('same-turn no-progress pause is derived after third repeated fingerprint', () => {
  let count=0;
  for(let i=0;i<3;i++){
    const result=progress({...pbase,stalled_cycles:count});
    count=result.stalled_cycles;
    assert.equal(result.disposition,i===2?'PAUSED_NO_PROGRESS':'CONTINUE');
  }
  assert.equal(progress({...pbase,stalled_cycles:2,current_fingerprint:'new-sha'}).stalled_cycles,0);
  assert.equal(progress({...pbase,mutation_retry_count:3}).disposition,'PAUSED_RETRY_EXHAUSTED');
});
test('Run FAILED terminal, Job cannot use FAILED; no lifecycle reactivation', () => {
  assert.equal(progress({...pbase,run_lifecycle:'FAILED'}).disposition,'TERMINAL');
  assert.equal(progress({...pbase,job_lifecycle:'FAILED'}).disposition,'BLOCKED');
  assert.equal(progress({...pbase,job_lifecycle:'COMPLETED'}).disposition,'TERMINAL');
  assert.equal(progress({...pbase,job_lifecycle:'SUPERSEDED'}).disposition,'TERMINAL');
  assert.equal(progress({...pbase,run_lifecycle:'CANCELLED'}).disposition,'TERMINAL');
});
test('negative mutation control: wrong APPLIED predicate must turn test RED', () => {
  const broken = runtimeFunction('sourceMutationRecoveryDecision', body =>
    body.replace('input.current_blob_sha === input.intended_blob_sha',
                 'input.current_blob_sha !== input.intended_blob_sha'));
  assert.throws(() => assert.equal(broken(base).disposition,'NOT_APPLIED'),assert.AssertionError);
});
test('negative mutation control: changing no-progress threshold must turn test RED', () => {
  const broken = runtimeFunction('orchestrationProgressDecision', body =>
    body.replace('stalled >= 3','stalled >= 99'));
  assert.throws(() => assert.equal(broken({...pbase,stalled_cycles:2}).disposition,'PAUSED_NO_PROGRESS'),assert.AssertionError);
});
test('registered recovery tools and auth guard are present on the served source', () => {
  for (const name of ['execution_recovery_evaluate','orchestration_progress_evaluate']) {
    assert.match(source,new RegExp("server\\.registerTool\\(\\s*'"+name+"'"));
  }
  assert.match(source,/Authentication required for recovery evaluation/);
  assert.match(source,/Authentication required for progress evaluation/);
});

test('debugging skill is opt-in and exposed by catalog/loader schema (static contract)', () => {
  assert.match(source,/['"]debugging['"]:\s*\{/);
  assert.match(source,/name:\s*z\.enum\(\['job-planning','coding-loop','debugging'/);
  assert.match(source,/For a reproducible nontrivial bug or failed hotfix retest, discover debugging/);
  const rolePart = source.slice(source.indexOf('const ROLE_SKILLS'), source.indexOf('const RUNTIME_SKILLS'));
  assert.match(rolePart,/coder:\s*\['coding-loop', 'delegation'\]/);
  assert.doesNotMatch(rolePart,/coder:\s*\[[^\]]*debugging/);
});
