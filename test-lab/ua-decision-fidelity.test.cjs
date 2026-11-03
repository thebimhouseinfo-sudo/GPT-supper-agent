'use strict';
// U-A source-contract regression. It verifies exact deployed guidance/routing,
// not authenticated Project Memory writes or model semantic compliance.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const catalog = fs.readFileSync('supabase/functions/gsa-mcp/harness-catalog.ts', 'utf8');
const preparedJob = fs.readFileSync('supabase/functions/gsa-mcp/job-prepare-tool.ts', 'utf8');
const tree = ts.createSourceFile('harness-catalog.ts', catalog, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
assert.equal(tree.parseDiagnostics.length, 0, 'current harness must parse as TypeScript');
function readConstant(name) {
  const nodes = tree.statements.filter(ts.isVariableStatement)
    .flatMap(n => [...n.declarationList.declarations])
    .filter(n => ts.isIdentifier(n.name) && n.name.text === name);
  assert.equal(nodes.length, 1, 'expected exact runtime constant: ' + name);
  const js = ts.transpileModule('module.exports = ' + nodes[0].initializer.getText(tree) + ';', {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
  }).outputText;
  return vm.runInNewContext(js, {module: {exports: null}});
}
const shared = readConstant('BASE_AGENT_HARNESS');
const roles = readConstant('ROLE_HARNESSES');
const roleSkills = readConstant('ROLE_SKILLS');
const skills = readConstant('RUNTIME_SKILLS');

test('DISCUSS is user-initiated conversation, not a Job, Run or admission gate', () => {
  assert.match(shared, /DISCUSS IS A HUMAN-INITIATED CONVERSATION STATE/);
  for (const keyword of ['no Discussion Job','no Run','no Bootstrap','no new Human Gate'])
    assert.ok(shared.includes(keyword), keyword);
  assert.match(preparedJob, /z\.enum\(\['plan','code','design','review'\]\)/);
  assert.doesNotMatch(preparedJob, /'discussion'/);
  assert.match(shared, /Do not invent a discussion type in job_prepare/);
});

test('Secretary is optional and accepts only explicit Human decisions with full provenance', () => {
  const body = skills['decision-secretary']?.body ?? '';
  assert.ok(body, 'must be available through progressive runtime skill catalog');
  for (const fragment of ['Human-initiated conversation state', 'Only an explicit accepted decision',
    'step-by-step algorithm', 'original Human wording', 'special cases and exceptions',
    'forbidden alternatives', 'superseded DEC IDs', 'GitHub CREATE/CAS',
    'independent readback', 'UNSAVED']) {
    assert.ok(body.includes(fragment), fragment);
  }
  for (const [role, names] of Object.entries(roleSkills)) {
    assert.ok(!names.includes('decision-secretary'), 'no mandatory Secretary on ' + role);
  }
  assert.match(shared, /PROPOSED\/UNRESOLVED dialogue is not an accepted Decision/);
});

test('Planner, Coder and Reviewer trace the original DEC and its negative exceptions', () => {
  const plan = roles.planner.loop.join('\n');
  const coder = roles.coder.loop.join('\n');
  const review = roles.reviewer.loop.join('\n');
  for (const phrase of ['DECISION FIDELITY:', 'complete original Project Memory Markdown',
    'selected_source_evidence', 'COVERED, MISSING, CONFLICT or FEASIBILITY'])
    assert.ok(plan.includes(phrase), phrase);
  assert.ok(skills['job-planning'].body.includes('Reference stable DEC IDs'));
  for (const phrase of ['EXPERT DECISION READBACK:', 'exceptions', 'forbidden alternatives'])
    assert.ok(coder.includes(phrase), phrase);
  for (const phrase of ['DECISION FIDELITY REVIEW:', 'independently fetch', 'negative exceptions',
    'CHANGES_REQUIRED', 'HUMAN_REVIEW_REQUIRED'])
    assert.ok(review.includes(phrase), phrase);
});

test('negative controls fail when accepted status or negative-exception coverage is removed', () => {
  const body = skills['decision-secretary'].body;
  const changed = body.replace('Only an explicit accepted decision', 'Any speculation');
  assert.notEqual(changed, body);
  assert.throws(() => assert.ok(changed.includes('Only an explicit accepted decision')), assert.AssertionError);
  const reviewer = roles.reviewer.loop.join('\n');
  const wrong = reviewer.replace('negative exceptions', 'topic summary');
  assert.notEqual(wrong, reviewer);
  assert.throws(() => assert.ok(wrong.includes('negative exceptions')), assert.AssertionError);
});
