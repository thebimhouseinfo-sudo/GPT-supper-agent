// Explicitly limited helper-level regression suite: this does NOT prove live GitHub CAS or E2E.
// Run: npm install --no-save typescript@5.9.3 && node --test test-lab/runtime-logic.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('supabase/functions/gsa-mcp/index.ts', 'utf8');
const parsed = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const harnessSource = fs.readFileSync('supabase/functions/gsa-mcp/harness-catalog.ts','utf8');
const runSource = fs.readFileSync('supabase/functions/gsa-mcp/run-execution-tools.ts','utf8');
function load(name, injected = {}) {
  const owner = ['uxFirstTemporaryUiGateRequired','goalRecheckRunMatches','checkpointLeaseExpired','checkpointBoundaryPrerequisiteIds','requiredCheckpointIds'].includes(name)
    ? 'execution-guards.ts'
    : ['milestoneLoopDecision','validateExecutionTopology','normalizeNextPlanningModel','planningLoopContinuationDecision'].includes(name)
      ? 'planning-guards.ts'
      : ['projectCriteriaBindingError','parseRetiredBranchRows','isRetiredSourceBranch'].includes(name)
        ? 'project-utils.ts'
        : ['projectBootstrapReadinessDecision','projectBootstrapChecklistDecision'].includes(name)
          ? 'bootstrap.ts' : null;
  const ast = owner ? ts.createSourceFile(owner,
    fs.readFileSync('supabase/functions/gsa-mcp/'+owner,'utf8'),
    ts.ScriptTarget.Latest,true,ts.ScriptKind.TS) : parsed;
  const node = ast.statements.find(x => ts.isFunctionDeclaration(x) && x.name?.text === name);
  assert.ok(node, 'runtime function must exist: ' + name);
  const js = ts.transpileModule(node.getText(ast).replace(/^export\s+/, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
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
  const criticSource=fs.readFileSync('supabase/functions/gsa-mcp/critic-review-tools.ts','utf8');
  const start=criticSource.indexOf("'critic_review_record'");
  const end=criticSource.length;
  assert.ok(start>0&&end>start);
  const route=criticSource.slice(start,end);
  assert.match(route,/next_role:\s*human_invoked === true \? 'human' : 'orchestrator'/);
  assert.match(route,/milestone_loop_evaluate\(stage=CR/);
  assert.match(route,/After immutable CR Verification persistence and exact readback/);
  const runStart=runSource.indexOf("'run_begin'");
  const runEnd=runSource.indexOf("'relationship_knowledge_prepare'",runStart);
  assert.match(runSource.slice(runStart,runEnd),/milestone_id: approvedReviewMilestones\[0\]\.milestone_id/);
  const verifyStart=runSource.indexOf("'run_verification_record'");
  const verifyEnd=runSource.indexOf("'run_complete'",verifyStart);
  assert.match(runSource.slice(verifyStart,verifyEnd),/milestone_id: run\.milestone_id/);
});


// P0 CadGPT Bootstrap: source-extracted validators and contract regressions.
// Run against current source; this suite intentionally does NOT attest external GitHub evidence.
const criteriaBinding = load('projectCriteriaBindingError');
const bootstrapReadiness = load('projectBootstrapReadinessDecision', { projectCriteriaBindingError: criteriaBinding });
const cadProjectId='01a0d70c-9683-7324-9d3d-a8231a93c63b';
const cadPath='projects/'+cadProjectId+'/CRITERIA.md';
const cadSHA='d43f32b179a46007efb663591d260925f3cbbe06';
const cadRepo='https://github.com/thebimhouseinfo-sudo/Cadgpt';
const cadBranch='feature/core-function-v5';
const cadCriteria={criteria_path:cadPath,criteria_blob_sha:cadSHA,approval_status:'APPROVED'};
const cadPlan={
  plan_kind:'PROJECT_PLAN',criteria_binding:cadCriteria,planning_revision:1,
  planning_review:{status:'PASS',reviewed_revision:1},
  tasks:[{task_id:'T1',dependencies:[],completion_criteria:['Routing and ownership verified']}],
  milestones:[{milestone_id:'M2',node_ids:['T1']}]
};
const cadEvidence={
  criteria:cadCriteria,criteria_human_approved:true,criteria_current_blob_sha:cadSHA,
  plan:cadPlan,capabilities:[{task_id:'T1',readiness:'DOMAIN_READY_VERIFIED',evidence_verified:true}],
  human_execution_approved:true,
  readback_proof:{name:'BOOTSTRAP_CURRENT.json',path:'projects/'+cadProjectId+'/VERIFICATION/BOOTSTRAP_CURRENT.json',sha,
    criteria_sha:cadSHA,reviewed_plan_sha:sha,human_approval_ref:'human approved current reviewed Plan'}
};
const bootstrapExecution = load('projectBootstrapExecutionError', {
  projectBootstrapReadinessDecision: bootstrapReadiness,
  parseProjectManifest: () => ({project_id:cadProjectId,lifecycle:'ACTIVE',
    repositories:[{relation:'OWNED',url:cadRepo}],
    branch_policies:[{repository_url:cadRepo,development_branch:cadBranch}]}),
  normalizeGithubRepo:u=>({url:u}),validIntegrationBranch:b=>b===cadBranch
});
function admission(data) {
  return bootstrapExecution(cadProjectId,'verified manifest fixture',data,cadRepo,cadBranch);
}
test('P0 approved CadGPT Criteria + current replacement Project Plan + T1 capability are ready',()=>{
  assert.equal(bootstrapReadiness(cadProjectId,cadEvidence).status,
    'BOOTSTRAP_EVIDENCE_READY_EXECUTION_APPROVAL_CLAIMED');
  assert.equal(admission(cadEvidence),null);
  const cadT1={execution_contract:'NEXT',planning_revision:1,
    tasks:[{task_id:'T1',dependencies:[]}],topology:[{task_id:'T1',handler:'coder'}]};
  assert.equal(dispatch(cadT1,'coder',['T1'],1,sha,sha,[]),null);
});
test('P0 canonical Criteria binding, Human confirmation and SHA are separate fail-closed gates',()=>{
  assert.equal(bootstrapReadiness(cadProjectId,{...cadEvidence,criteria:undefined}).status,
    'CRITERIA_BINDING_MISSING_OR_INVALID');
  assert.equal(bootstrapReadiness(cadProjectId,{...cadEvidence,criteria_human_approved:false}).status,
    'CRITERIA_HUMAN_APPROVAL_UNVERIFIED');
  assert.equal(bootstrapReadiness(cadProjectId,{...cadEvidence,criteria_current_blob_sha:sha}).status,
    'CRITERIA_STALE_OR_UNVERIFIED');
  assert.equal(bootstrapReadiness(cadProjectId,{...cadEvidence,plan:{...cadPlan,plan_kind:'JOB'}}).status,
    'PLAN_CRITERIA_MISMATCH');
  assert.equal(bootstrapReadiness(cadProjectId,{...cadEvidence,capabilities:[]}).status,
    'CAPABILITY_NOT_READY');
  assert.equal(bootstrapReadiness(cadProjectId,{...cadEvidence,human_execution_approved:false}).status,
    'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING');
  assert.match(admission({...cadEvidence,readback_proof:null}),/BOOTSTRAP_READBACK_PROOF_REQUIRED/);
});
test('P0 historical M1 capability-only snapshot is NOT accepted as source approval',()=>{
  const old={type:'BOOTSTRAP_CAPABILITY_READINESS_EVIDENCE',
    status:'M1_CONFIGURED_AND_READBACK_VERIFIED; SOURCE_EXECUTION_NOT_AUTHORIZED',
    plan:{job_id:'01a15dd5-2189-703a-ab28-a58c4f4b07c5'}};
  assert.match(admission(old),/BOOTSTRAP_CAPABILITY_ONLY_CURRENT_PLAN_PROOF_REQUIRED/);
  assert.match(admission(null),/BOOTSTRAP_REQUIRED/);
});
test('P0 bootstrap negative control detects removing canonical current SHA check',()=>{
  const bootstrapAst=ts.createSourceFile('bootstrap.ts',fs.readFileSync('supabase/functions/gsa-mcp/bootstrap.ts','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const node=bootstrapAst.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text==='projectBootstrapReadinessDecision');
  assert.ok(node);
  const good=node.getText(bootstrapAst).replace(/^export\s+/, '');
  const mutant=good.replace('input?.criteria_current_blob_sha !== c.criteria_blob_sha','false');
  assert.notEqual(good,mutant);
  const js=ts.transpileModule(mutant,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const broken=vm.runInNewContext(js+'\nprojectBootstrapReadinessDecision',{projectCriteriaBindingError:criteriaBinding,JSON,Array,Set,Map,Number,String});
  assert.throws(() => assert.equal(broken(cadProjectId,{...cadEvidence,criteria_current_blob_sha:sha}).status,
    'CRITERIA_STALE_OR_UNVERIFIED'),assert.AssertionError);
});
test('P0 run_begin and handoff schema use Job-bound nonempty Task IDs, not UUID-only',()=>{
  const runStart=runSource.indexOf("'run_begin'");
  const runEnd=runSource.indexOf("'relationship_knowledge_prepare'",runStart);
  const runSource=runSource.slice(runStart,runEnd);
  assert.match(runSource,/primary_task_id:\s*z\.string\(\)\.min\(1\)\.optional\(\)/);
  const completionStart=runSource.indexOf("'run_complete'");
  const completion=runSource.slice(completionStart,completionStart+2500);
  assert.match(completion,/primary_task_id:\s*z\.string\(\)\.min\(1\)\.optional\(\)/);
  const taskCase={execution_contract:'NEXT',planning_revision:1,tasks:[{task_id:'T1',dependencies:[]}],topology:[{task_id:'T1',handler:'coder'}]};
  assert.match(dispatch(taskCase,'coder',['T2'],1,sha,sha,[]),/TASK_INVALID/);
  assert.match(dispatch(taskCase,'tester',['T1'],1,sha,sha,[]),/WRONG_ROLE/);
});


// M2 Planner harness: source-backed prompt contract, not a model-level behavioral guarantee.
function plannerHarnessSlice(text=harnessSource) {
  const h=text.indexOf('const ROLE_HARNESSES');
  const start=text.indexOf('  planner: {',h),end=text.indexOf('  advisor: {',start);
  assert.ok(start>h&&end>start,'role-bounded Planner harness must exist');
  return text.slice(start,end);
}
function validatePlannerContract(text=harnessSource) {
  const planner=plannerHarnessSlice(text);
  assert.match(planner,/CRITICAL CHALLENGE: before agreeing with a Human-proposed/);
  assert.match(planner,/underlying goal, test assumptions, challenge incorrect premises/);
  assert.match(planner,/CONFIRMED POSSIBLE/);
  assert.match(planner,/CONFIRMED IMPOSSIBLE only with evidence proving impossibility/);
  assert.match(planner,/UNKNOWN is NOT impossible/);
  assert.match(planner,/possible does not mean implemented/);
  assert.match(planner,/Reject invented commands \(for example gsa\/clear\)/);
  assert.match(planner,/Keep ordinary answers concise without forced three-label boilerplate/);
  assert.match(planner,/Never awaken Technical Advisor for normal challenge/);
  assert.match(planner,/Only explicit Human intent to approve first Criteria or change approved WHAT\/WHY activates Advisor/);
}
test('M2 Planner guidance covers evidence, impossible versus unknown and no Advisor overtrigger',()=>{
  validatePlannerContract();
});
test('M2 negative control: remove scoped feasibility check and contract test must RED',()=>{
  const broken=harnessSource.replace("CONFIRMED IMPOSSIBLE only with evidence proving impossibility","CONFIRMED IMPOSSIBLE with no evidence");
  assert.notEqual(broken,harnessSource,'mutation must actually hit source');
  assert.throws(()=>validatePlannerContract(broken),assert.AssertionError);
});
test('M2 Planner-only instructions do not leak into Advisor role',()=>{
  const src=harnessSource,index=src.indexOf('const ROLE_HARNESSES');
  const start=src.indexOf('  advisor: {',index);
  const end=src.indexOf('  designer: {',start);
  assert.ok(end>start);
  assert.doesNotMatch(src.slice(start,end),/CRITICAL CHALLENGE: before agreeing/);
});



// Branch retirement: executable regressions against source helpers, not a fabricated local reimplementation.
const validBranchName = (s) => typeof s === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.\\/-]*$/.test(s) && !s.includes('..');
const normalizeRepoForRetirementTest = (url) => /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(url) ? {url} : null;
const parseRetiredBranchRows = load('parseRetiredBranchRows', {
  validIntegrationBranch: validBranchName,
  normalizeGithubRepo: normalizeRepoForRetirementTest,
});
const isRetiredSourceBranch = load('isRetiredSourceBranch');
const parseProjectManifestWithRetirement = load('parseProjectManifest', {
  PROJECT_ID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  normalizeGithubRepo: normalizeRepoForRetirementTest,
  validIntegrationBranch: validBranchName,
  parseRetiredBranchRows,
  isRetiredSourceBranch,
});
const retirementRepo = 'https://github.com/org/repo';
const retirementRecord = '- ' + retirementRepo + ' | branch=old-feature | sha=' + sha + ' | status=RETIRED';
const retirementManifest = (branch='main', rows=retirementRecord) => [
  '---',
  'project_id: 00000000-0000-0000-0000-000000000001',
  'name: Branch retirement test',
  'lifecycle: ACTIVE',
  'repo_url: ' + retirementRepo,
  'development_branch: ' + branch,
  '---',
  '## Retired Branches (Human-approved)',
  rows,
].join('\n');

test('RETIRED is durable and cannot be selected as configured Development Branch', () => {
  const parsedOld = parseProjectManifestWithRetirement(retirementManifest('old-feature'));
  assert.equal(parsedOld.branch_policy_status, 'RETIRED_BRANCH_CONFIGURED');
  assert.equal(parsedOld.retired_branches.length, 1);
  assert.equal(isRetiredSourceBranch(parsedOld.retired_branches, retirementRepo, 'old-feature'), true);
  const parsedCurrent = parseProjectManifestWithRetirement(retirementManifest());
  assert.equal(parsedCurrent.branch_policy_status, 'CONFIGURED');
  assert.equal(isRetiredSourceBranch(parsedCurrent.retired_branches, retirementRepo, 'main'), false);
  const legacy = parseProjectManifestWithRetirement(retirementManifest().split('## Retired Branches')[0]);
  assert.equal(legacy.retired_branches.length, 0);
});

test('retirement record parser rejects duplicate or malformed rows instead of ignoring them', () => {
  assert.equal(parseRetiredBranchRows(retirementManifest('main', retirementRecord + '\n' + retirementRecord)), null);
  assert.equal(parseRetiredBranchRows(retirementManifest('main', '- ' + retirementRepo + ' | branch=old-feature | status=RETIRED')), null);
  assert.equal(parseProjectManifestWithRetirement(retirementManifest('main', '- ' + retirementRepo + ' | branch=old-feature | status=RETIRED')), null);
  assert.match(fs.readFileSync('supabase/functions/gsa-mcp/project-setup-tools.ts', 'utf8'), /BRANCH_RETIRED: a retired source branch cannot be selected as Development or Release Branch/);
});


test('every advertised runtime skill can pass the public load_skill input schema', () => {
  const skillObject = harnessSource.match(/const RUNTIME_SKILLS:[\s\S]*?=\s*\{([\s\S]*?)\n\}\n\n/);
  assert.ok(skillObject, 'runtime skill registry exists');
  const knownNames = [...skillObject[1].matchAll(/^\s{2}'?([a-z][a-z0-9-]+)'?:\s*\{\s*$/gm)].map(x=>x[1]);
  assert.ok(knownNames.includes('tester-lab'), 'tester-lab is a published runtime skill');
  const harnessToolsSource = fs.readFileSync('supabase/functions/gsa-mcp/harness-skill-tools.ts','utf8');
  const loaderBlock = harnessToolsSource.split("server.registerTool(\n    'load_skill',")[1]?.split("server.registerTool(")[0];
  assert.ok(loaderBlock, 'load_skill is registered');
  const allowed = loaderBlock.match(/name:\s*z\.enum\(\[([^\]]+)\]\)/);
  assert.ok(allowed, 'load_skill has a finite enum');
  const exposed = [...allowed[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
  assert.deepEqual(knownNames.filter(n=>!exposed.includes(n)), [], 'catalog/load_skill must have identical names');
});
