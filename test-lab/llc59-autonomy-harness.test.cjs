// LLC59: test exact source-derived GSA role/skill contracts, not hand-written
// copies of prompt text. This is a source-level safety/behavioral contract test;
// it does NOT prove live ChatGPT dispatch, source writes or hosted CI availability.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('supabase/functions/gsa-mcp/index.ts', 'utf8');
const sf = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
assert.equal(sf.parseDiagnostics.length, 0, 'Runtime TypeScript parses');

function extractedConstant(name) {
  const decls = sf.statements
    .filter(ts.isVariableStatement)
    .flatMap(statement => [...statement.declarationList.declarations])
    .filter(decl => ts.isIdentifier(decl.name) && decl.name.text === name);
  assert.equal(decls.length, 1, 'Exactly one live source declaration: ' + name);
  assert.ok(decls[0].initializer, 'Initializer exists: ' + name);
  const compiled = ts.transpileModule(
    'const ' + name + ' = ' + decls[0].initializer.getText(sf) + ';\n' + name,
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }
  ).outputText;
  return vm.runInNewContext(compiled, {});
}
const shared = extractedConstant('BASE_AGENT_HARNESS');
const roles = extractedConstant('ROLE_HARNESSES');
const skills = extractedConstant('RUNTIME_SKILLS');

const harness = role => [
  shared,
  ...(roles[role].authority || []),
  ...(roles[role].loop || []),
].join('\n');

function includesAll(haystack, fragments) {
  for (const fragment of fragments) {
    assert.ok(haystack.includes(fragment), 'Missing mandatory rule: ' + fragment);
  }
}
function autonomousContract(text) {
  // Positive criteria are deliberately exact. Removing an active protection
  // must make this executable oracle RED (see negative mutation control).
  includesAll(text, [
    'LLC59 CI FAILURE ROUTING:',
    'self-fetch exact GitHub checks',
    'runner-not-started/log-unavailable',
    'instead of ending the user turn',
  ]);
}

test('LLC59: shared rules require own CI read and prohibit spurious Human log request', () => {
  includesAll(shared, [
    'LLC59 AUTONOMOUS-FIRST CI:',
    'exact GitHub run/job/step',
    'no runner and no executed steps',
    'ENVIRONMENT_FAILURE/UNVERIFIED',
    'LLC59 HUMAN HANDOFF:',
    'Do not ask Human to collect already agent-accessible CI data',
    'Never label alternate checks as hosted CI PASS',
  ]);
});

test('LLC59: Orchestrator resumes same-turn diagnosis and does not treat CI error as stop', () => {
  const orch = harness('orchestrator');
  includesAll(orch, [
    'LLC59 CI FAILURE ROUTING:',
    'self-fetch exact GitHub checks',
    'runner-not-started/log-unavailable',
    'LLC59 SAME-TURN CONTINUATION:',
    'Continue bounded diagnosis',
    'AFTER checking an available authorized diagnostic/probe/alternative execution surface',
    'owning Coder to repair and rerun',
  ]);
});

test('LLC59: Coder self-obtains logs, repairs in scope, re-runs and does not invent PASS', () => {
  const coder = harness('coder');
  includesAll(coder, [
    'CI RED/GREEN SELF-REPAIR:',
    'fetch GitHub run/job/step/log evidence yourself',
    'TEST_FAILURE is repairable',
    'diff',
    'full affected call chain',
    'Never label alternate checks as hosted CI PASS',
    'Do not infer merge/release authority',
  ]);
});

test('LLC59: Tester may PROBE before OBSERVED but cannot mutate source or fake PASS', () => {
  const tester = harness('tester');
  includesAll(tester, [
    'DISCOVERED → REACHABLE → INVOCABLE → FUNCTIONAL → GOAL_MET',
    'safe authorized PROBE',
    'execute practical VERIFY only after evidence-backed OBSERVED',
    'runner_id=0/steps=[]',
    'TEST_FAILURE within scope → owning Coder repairs test/config',
    'Host',
  ]);
  assert.ok(tester.includes('Source implementation is read-only'));
});

test('LLC59: actual served Coder skill has autonomous fail→diagnose→fix→recheck', () => {
  const skill = skills['coding-loop'].body;
  includesAll(skill, [
    'AUTONOMOUS CI RED/GREEN',
    'First self-inspect exact GitHub branch/commit',
    'No runner or steps executed',
    'TEST_FAILURE is repairable by owning Coder',
    'internal execution surface',
    'not a fake CI GREEN',
    'bounded evidence-changing attempts',
  ]);
});

test('LLC59: actual served Tester skill does not hand off before discovery/probe', () => {
  const skill = skills['testing-evidence'].body;
  includesAll(skill, [
    'Capability discovery and a safe non-destructive PROBE are allowed before OBSERVED',
    'self-fetch job/steps/logs',
    'TEST_FAILURE routes to owning Coder',
    'only if no agent-operable path exists',
    'Do not use Human as a courier',
    'UNVERIFIED',
  ]);
});

test('LLC59: entry instruction has same-turn repair routing and no background promises', () => {
  includesAll(source, [
    'LLC59 autonomy: when CI or internal validation is RED/inconclusive',
    'Runner-not-started is an environment limitation',
    'bounded same-turn loop',
    'Do not stop after job_prepare',
  ]);
});

test('LLC59 negative control: deleting Orchestrator CI routing turns harness contract RED', () => {
  const intact = harness('orchestrator');
  // Keep other protections, mutate precisely the routing rule the model sees.
  const broken = intact.replace(
    /^.*LLC59 CI FAILURE ROUTING:.*$/m, ''
  );
  assert.notEqual(broken, intact, 'Target source rule existed before mutation');
  assert.throws(() => autonomousContract(broken), /Missing mandatory rule/);
  // The source's mandatory route itself must remain discoverable.
  assert.ok(intact.includes('LLC59 CI FAILURE ROUTING:'));
});

test('LLC59 regression floor preserves Human authority and independent Reviewer/Tester', () => {
  includesAll(shared, [
    'denied or unauthorized action is a boundary',
    'source repository as source truth',
    'Agent-authored text never counts as human approval',
    'Verification is evidence, not ceremony',
    'no runner and no executed steps',
  ]);
  includesAll(harness('orchestrator'), ['NEXT EVIDENCE GATE:', 'NEXT FAILURE ROUTING:']);
  includesAll(harness('coder'), ['GOAL RECHECK:', 'HANDOFF/COMPLETE:']);
  includesAll(harness('tester'), ['For planned NEXT', 'GATE:']);
});
