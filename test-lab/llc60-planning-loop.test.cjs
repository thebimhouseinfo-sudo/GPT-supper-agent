// LLC60: exact source-derived, model-only routing checks. This suite does
// NOT execute external GitHub CAS/readback, live ChatGPT tool dispatch, or
// authenticated GSA Job workflows; those require real Project acceptance.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('supabase/functions/gsa-mcp/planning-guards.ts', 'utf8');
const runtimeSource = fs.readFileSync('supabase/functions/gsa-mcp/index.ts', 'utf8');
const harnessSource = fs.readFileSync('supabase/functions/gsa-mcp/harness-catalog.ts', 'utf8');
const harnessAst = ts.createSourceFile('harness-catalog.ts', harnessSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const sf = ts.createSourceFile('planning-guards.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
assert.equal(sf.parseDiagnostics.length, 0, 'Exact GSA runtime source parses');
const functionDecl = sf.statements.find(s => ts.isFunctionDeclaration(s) &&
  s.name?.text === 'planningLoopContinuationDecision');
assert.ok(functionDecl, 'LLC60 runtime source declares a deterministic planning continuation decision');

function loadDecision(sourceFunction = functionDecl.getText(sf)) {
  const js = ts.transpileModule(sourceFunction, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  return vm.runInNewContext(js + '\nplanningLoopContinuationDecision', { Number, exports: {} });
}
const decide = loadDecision();

function assertRoute(input, wantAction, wantRole, wantContinue = true) {
  const d = decide(...input);
  assert.equal(d.next_action_after_readback, wantAction, JSON.stringify(input));
  assert.equal(d.next_role, wantRole);
  assert.equal(d.resume_same_turn, wantContinue);
  assert.equal(d.human_action_required, ['STOP_HUMAN_DECISION','PRESENT_PLAN_FOR_APPROVAL'].includes(wantAction));
  assert.equal(d.state, 'AWAITING_DURABLE_READBACK');
  assert.equal(d.requires_readback, true);
  assert.equal(d.mutation_authorized, false);
  assert.equal(d.planning_revision, input[2]);
  return d;
}
function toolBody(name) {
  const ownerSource = name === 'job_prepare' ? fs.readFileSync('supabase/functions/gsa-mcp/job-prepare-tool.ts', 'utf8') : name === 'job_transition' ? fs.readFileSync('supabase/functions/gsa-mcp/job-transition-tool.ts', 'utf8') : name === 'job_revise_plan' ? fs.readFileSync('supabase/functions/gsa-mcp/job-revise-plan-tool.ts', 'utf8') : runtimeSource;
  const start = ownerSource.indexOf("  server.registerTool(\n    '" + name + "'");
  assert.ok(start >= 0, 'Live tool registered: ' + name);
  const end = ownerSource.indexOf('\n  server.registerTool(', start + 10);
  assert.ok(end > start || name === 'job_prepare' || name === 'job_transition' || name === 'job_revise_plan', 'Next tool boundary for ' + name);
  return ownerSource.slice(start, end > start ? end : undefined);
}
function constantBody(name) {
  const decls = harnessAst.statements.filter(ts.isVariableStatement)
    .flatMap(x => [...x.declarationList.declarations])
    .filter(x => ts.isIdentifier(x.name) && x.name.text === name);
  assert.equal(decls.length, 1, name + ' source definition must be unique');
  const compiled = ts.transpileModule(
    'const ' + name + ' = ' + decls[0].initializer.getText(harnessAst) + ';\n' + name,
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }
  ).outputText;
  return vm.runInNewContext(compiled, {exports: {}});
}
const shared = constantBody('BASE_AGENT_HARNESS');
const roles = constantBody('ROLE_HARNESSES');
const skills = constantBody('RUNTIME_SKILLS');

test('Plan GOAL anchors are served to Planner and planning Reviewer and documented for every Phase', () => {
  const plan = roles.planner.loop.join('\n');
  const review = roles.reviewer.loop.join('\n');
  const all = [String(shared), plan, review, skills['job-planning'].body, skills['planning-review'].body];
  for (const contract of all) {
    assert.match(contract, /## GOAL/, 'global goal anchor in runtime role or skill');
    assert.match(contract, /### GOAL/, 'per-Phase goal anchor in runtime role or skill');
  }
  assert.match(review, /CHANGES_REQUIRED/);
  assert.match(review, /HUMAN_REVIEW_REQUIRED/);
  assert.match(skills['planning-review'].body, /Human-approved goals/);
  const canonical = fs.readFileSync('docs/architecture/AGENT-HARNESSES.md', 'utf8');
  const plannerDoc = fs.readFileSync('docs/architecture/PLANNER-SCOPE-AND-UIUX.md', 'utf8');
  const runtimeSkill = fs.readFileSync('skills/gsa-job-runtime/SKILL.md', 'utf8');
  for (const doc of [canonical, plannerDoc, runtimeSkill]) {
    assert.match(doc, /## GOAL/);
    assert.match(doc, /### GOAL/);
  }
});

test('rl is a Planner review-loop modifier, never a source or merge authorization', () => {
  const rules = String(shared);
  assert.match(rules, /PLANNER RL SHORTCUT/);
  for (const example of ['planner rl', 'planner rl đi', 'planer rl']) assert.ok(rules.includes(example));
  assert.match(rules, /rl never grants source edits, Job execution, merge or deploy/);
  assert.match(rules, /including a draft discussed in chat/);
  assert.match(rules, /ephemeral drafts receive bounded same-turn review without falsely claiming persisted verification/);
  assert.match(rules, /HUMAN EXECUTION APPROVAL/);
  assert.match(runtimeSource, /'PLANNER RL: recognize rl as a planning review-loop modifier/);
  assert.match(runtimeSource, /planner \[pl\].*rl = review\/repair loop/);
  assert.match(roles.orchestrator.loop.join('\n'), /CHANGES_REQUIRED routes back to Planner/);
  const doc = fs.readFileSync('docs/architecture/AGENT-HARNESSES.md', 'utf8');
  assert.match(doc, /### `rl` — explicit Planner review-loop shortcut/);
});

test('LLC60 initial DRAFT and successive reviewed Plan revisions automatically route to Reviewer', () => {
  assertRoute(['JOB_PREPARED','DRAFT',1], 'REVIEW_CURRENT_REVISION','reviewer');
  assertRoute(['PLAN_REVISED','DRAFT',2], 'REVIEW_CURRENT_REVISION','reviewer');
  assertRoute(['PLAN_REVISED','DRAFT',3], 'REVIEW_CURRENT_REVISION','reviewer');
  assertRoute(['PLAN_REVISED','IN_PROGRESS',4], 'REVIEW_CURRENT_REVISION','reviewer');
});

test('LLC60 CHANGES_REQUIRED always returns to Planner within same turn and new revision', () => {
  for (const state of ['DRAFT','IN_PROGRESS']) {
    assertRoute(['REVIEW_RECORDED',state,1,'CHANGES_REQUIRED'],'REVISE_PLAN','planner');
    assertRoute(['REVIEW_RECORDED',state,2,'CHANGES_REQUIRED'],'REVISE_PLAN','planner');
  }
});

test('LLC60 PASS DRAFT promotes READY then stops for Human execution approval; superseding NEXT also stops', () => {
  assertRoute(['REVIEW_RECORDED','DRAFT',3,'PASS'],'PROMOTE_READY','orchestrator');
  assertRoute(['READY_TRANSITION','READY',3],'PRESENT_PLAN_FOR_APPROVAL','human',false);
  assertRoute(['REVIEW_RECORDED','IN_PROGRESS',3,'PASS'],'PRESENT_PLAN_FOR_APPROVAL','human',false);
});

test('LLC60 Human gate and concrete blocker stop loop rather than repeat attempts', () => {
  assertRoute(['REVIEW_RECORDED','DRAFT',2,'HUMAN_REVIEW_REQUIRED'],
    'STOP_HUMAN_DECISION','human',false);
  assertRoute(['REVIEW_RECORDED','DRAFT',2,'BLOCKED'],
    'STOP_BLOCKED','orchestrator',false);
});

test('LLC60 invalid/terminal stages cannot authorize a continuation or mutation', () => {
  for (const input of [
    ['JOB_PREPARED','READY',1],
    ['PLAN_REVISED','COMPLETED',2],
    ['REVIEW_RECORDED','COMPLETED',3,'PASS'],
    ['REVIEW_RECORDED','DRAFT',2,'UNDEFINED'],
    ['READY_TRANSITION','DRAFT',2],
    ['READY_TRANSITION','READY',0],
  ]) {
    const d = decide(...input);
    assert.equal(d.state, 'NOT_APPLICABLE', JSON.stringify(input));
    assert.equal(d.next_action_after_readback, 'NONE');
    assert.equal(d.resume_same_turn, false);
    assert.equal(d.requires_readback, false);
    assert.equal(d.mutation_authorized, false);
  }
});

test('LLC60 tool outputs expose typed continuation only after external persistence', () => {
  const cases = [
    ['job_prepare', 'JOB_PREPARED'],
    ['job_revise_plan','PLAN_REVISED'],
    ['plan_review_record','REVIEW_RECORDED'],
    ['job_transition','READY_TRANSITION'],
  ];
  for (const [name,stage] of cases) {
    const body = toolBody(name);
    assert.ok(body.includes('PLANNING_LOOP_CONTINUATION_SCHEMA'),
      name + ' must register structured continuation output');
    assert.ok(body.includes("planningLoopContinuationDecision('" + stage + "'"),
      name + ' must use real runtime router, not prose-only instructions');
    assert.ok(body.includes('external_steps:') || body.includes('external_steps: '),
      name + ' still requires external steps');
    assert.ok(body.includes('readback') || body.includes('Read back'),
      name + ' must demand persistent readback');
  }
  const review = toolBody('plan_review_record');
  assert.ok(review.includes('next_role: nextRole'));
  assert.ok(review.includes('const nextRole = continuation.next_role'));
  assert.ok(review.indexOf('Persist verification_record_text first') <
    review.indexOf('Update Job planning_review with reviewed_job_record_text'),
    'Review evidence must be persisted before reviewed Job update');
});

test('LLC60 role-isolated planning Reviewer same turn does not become a new Human chat', () => {
  const orchestrator = roles.orchestrator.loop.join('\n');
  const planner = roles.planner.loop.join('\n');
  const reviewer = roles.reviewer.loop.join('\n');
  const planSkill = skills['job-planning'].body;
  const reviewSkill = skills['planning-review'].body;
  for (const text of [String(shared),orchestrator,planner,reviewer,planSkill,reviewSkill]) {
    assert.match(text,/SAME USER TURN|SAME USER TURN|same Human chat\/turn|same Human chat/);
  }
  assert.match(orchestrator,/next_action_after_readback/);
  assert.match(planner,/job_revise_plan/);
  assert.match(reviewer,/Planning-review is role-isolated/);
  assert.match(reviewSkill,/fresh Human chat is NOT required/);
  const canonical = fs.readFileSync('docs/architecture/AGENT-HARNESSES.md','utf8');
  const jobRuntime = fs.readFileSync('skills/gsa-job-runtime/SKILL.md','utf8');
  assert.match(canonical,/planning review.*SAME USER TURN/i);
  assert.match(canonical,/same.chat.*independent.*evidence|independent.*evidence.*same.chat/i);
  assert.match(jobRuntime,/same.chat.*independent.*evidence|independent.*evidence.*same.chat/i);
  assert.doesNotMatch(source,/FRESH_CHAT_CONTEXT_ISOLATED/);
});

test('LLC60 model-only: 2 fixable reviews reach READY without any Human continue', () => {
  let revision = 1;
  const trace = [];
  for (const verdict of ['CHANGES_REQUIRED','CHANGES_REQUIRED','PASS']) {
    const prepared = decide(revision === 1 ? 'JOB_PREPARED' : 'PLAN_REVISED','DRAFT',revision);
    trace.push(prepared.next_action_after_readback);
    assert.equal(prepared.resume_same_turn,true);
    // MODEL ONLY: the external persistence/readback must be completed before
    // proceeding. We assert the safety contract, not fabricate GitHub proof.
    assert.equal(prepared.requires_readback,true);
    const reviewed = decide('REVIEW_RECORDED','DRAFT',revision,verdict);
    trace.push(reviewed.next_action_after_readback);
    if (verdict === 'CHANGES_REQUIRED') {
      assert.equal(reviewed.next_role,'planner');
      revision++;
    } else {
      assert.equal(reviewed.next_action_after_readback,'PROMOTE_READY');
      trace.push(decide('READY_TRANSITION','READY',revision).next_action_after_readback);
    }
  }
  assert.equal(trace.join(' -> '),[
    'REVIEW_CURRENT_REVISION','REVISE_PLAN',
    'REVIEW_CURRENT_REVISION','REVISE_PLAN',
    'REVIEW_CURRENT_REVISION','PROMOTE_READY','PRESENT_PLAN_FOR_APPROVAL',
  ].join(' -> '));
});

test('LLC60 negative control: removing CHANGES_REQUIRED routing makes known-bad RED', () => {
  const original = functionDecl.getText(sf);
  const needle = "if (reviewResult === 'CHANGES_REQUIRED')";
  assert.ok(original.includes(needle),'Mutation must target executed source branch');
  const mutant = loadDecision(original.replace(needle, "if (reviewResult === 'UNREACHABLE_MUTANT')"));
  const good = decide('REVIEW_RECORDED','DRAFT',2,'CHANGES_REQUIRED');
  const bad = mutant('REVIEW_RECORDED','DRAFT',2,'CHANGES_REQUIRED');
  assert.equal(good.next_action_after_readback,'REVISE_PLAN');
  assert.notEqual(bad.next_action_after_readback,'REVISE_PLAN');
});

test('LLC60 negative control: removing PASS→READY route fails the oracle', () => {
  const original = functionDecl.getText(sf);
  const needle = "action = lifecycle === 'DRAFT' ? 'PROMOTE_READY' : 'PRESENT_PLAN_FOR_APPROVAL'";
  assert.ok(original.includes(needle),'Mutation targets live PASS branch');
  const mutant = loadDecision(original.replace(needle,"action = 'PRESENT_PLAN_FOR_APPROVAL'"));
  assert.equal(decide('REVIEW_RECORDED','DRAFT',3,'PASS').next_action_after_readback,'PROMOTE_READY');
  assert.notEqual(mutant('REVIEW_RECORDED','DRAFT',3,'PASS').next_action_after_readback,'PROMOTE_READY');
});

test('Shared intake contracts: discussion and skeleton approval cannot authorize source write', () => {
  const rules = String(shared);
  const keys = [
    'NO REASONING / FIXED STEPS',
    'LOW REASONING / CLASSIFY',
    'LOW REASONING / CLARIFY',
    'LOW REASONING / SKELETON',
    'FULL REASONING only after direction/skeleton is confirmed',
    'HUMAN EXECUTION APPROVAL',
    'INTERRUPT / NEW MESSAGE',
  ];
  for (const key of keys) assert.ok(rules.includes(key), 'Missing shared behavior: ' + key);
  assert.ok(rules.indexOf(keys[1]) < rules.indexOf(keys[3]), 'Clarification must precede planning');
  assert.match(rules,/Skeleton approval permits detailed planning only/);
  assert.match(rules,/Begin source-changing or other consequential Job execution only after the Human explicitly approves/);
  assert.match(rules,/default to Planner/);
  assert.match(rules,/Handoff only for a real capability\/authority mismatch/);
  assert.doesNotMatch(rules,/automatic source write on mere agreement/i);
  assert.match(roles.orchestrator.authority.join(' '),/Human execution approval.*explicit stop/);
});

test('LLC60 negative control: READY continuation must not auto-dispatch without Human execution approval', () => {
  const original = functionDecl.getText(sf);
  const needle = "action = 'PRESENT_PLAN_FOR_APPROVAL'";
  assert.ok(original.includes(needle),'Mutation targets exact READY branch');
  const mutant = loadDecision(original.replace(needle, "action = 'CONTINUE_JOB_TOPOLOGY'"));
  const approved = decide('READY_TRANSITION','READY',3);
  assert.equal(approved.resume_same_turn,false);
  assert.equal(approved.human_action_required,true);
  assert.equal(approved.next_action_after_readback,'PRESENT_PLAN_FOR_APPROVAL');
  assert.notEqual(mutant('READY_TRANSITION','READY',3).next_action_after_readback,'PRESENT_PLAN_FOR_APPROVAL');
});
