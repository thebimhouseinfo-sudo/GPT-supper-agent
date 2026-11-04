'use strict'
// Source-derived behavior tests for approved Criteria 14A and M1 trust-boundary negatives.
// Execute with: NODE_PATH=<typescript module directory> node --test test-lab/project-branch-policy.test.cjs
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/index.ts'), 'utf8')
const harnessSource = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/harness-catalog.ts'), 'utf8')
const setupSource = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/project-setup-tools.ts'), 'utf8')
const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const parseErrors = ast.parseDiagnostics.filter(d => d.category === ts.DiagnosticCategory.Error)
assert.equal(parseErrors.length, 0, parseErrors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; '))

const names = [
  'parseRetiredBranchRows', 'isRetiredSourceBranch', 'normalizeGithubRepo', 'validMemoryPath', 'validProjectManifestPath',
  'validIntegrationBranch', 'revisedJobIntegrationBranchError', 'parseProjectManifest', 'resolveProjectRoleAddins', 'projectCriteriaBindingError', 'milestoneCrlEvidenceError', 'milestoneLoopDecision',
  'resolveProjectCriteriaIntake', 'projectTaskCapabilityAssessment', 'projectBootstrapReadinessDecision',
  'formatAdvisorAdviceReceipt', 'parseAdvisorAdviceReceipts', 'projectCriteriaAdvisoryDecision', 'projectBootstrapExecutionError',
  'edgeFunctionSlug', 'runtimeSurface', 'nextMemoryNamespaceForRequest', 'jobCreationExecutionContractDefault'
]
const extracted = []
const sources = [ast, ...['project-utils.ts','platform-utils.ts','advisor-receipt.ts','planning-guards.ts','bootstrap.ts','runtime-contract.ts','planning-preflight.ts','project-manifest-scope.ts'].map(file =>
  ts.createSourceFile(file,
    fs.readFileSync(path.join(__dirname,'../supabase/functions/gsa-mcp/',file),'utf8'),
    ts.ScriptTarget.Latest,true,ts.ScriptKind.TS))]
for (const owner of sources) {
  assert.equal(owner.parseDiagnostics.length, 0, owner.fileName + ' syntax')
  for (const node of owner.statements) {
    if (ts.isFunctionDeclaration(node) && names.includes(node.name?.text))
      extracted.push(node.getText(owner).replace(/^export\s+/, ''))
    if (ts.isVariableStatement(node) && node.declarationList.declarations.some(d =>
      ['PROJECT_ID_PATTERN','ADVISOR_RECEIPT_SCOPE_MAX'].includes(d.name.getText(owner))))
      extracted.push(node.getText(owner))
  }
}
for (const name of names) assert.ok(extracted.some(x => x.includes('function ' + name + '(')), 'Missing runtime function: ' + name)
assert.ok(extracted.some(x => x.includes('PROJECT_ID_PATTERN')))

const code = ts.transpileModule(extracted.join('\n\n') + '\n' +
  'globalThis.__tested = { ' + names.join(', ') + ' }', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText
const sandbox = { URL, console }
vm.runInNewContext(code, sandbox, { timeout: 2000 })
const h = sandbox.__tested
const id = '01a0f051-4353-7bff-8edf-46be4b44fd2f'
const repo = 'https://github.com/thebimhouseinfo-sudo/GPT-supper-agent'
const fixture = (front = '', rows = '- PRIMARY | OWNED | ' + repo, branches = '') =>
  '---\nproject_id: ' + id + '\nname: GSA\nlifecycle: ACTIVE\n' +
  'primary_repo_url: ' + repo + '\nrepo_url: ' + repo +
  '\nrepo_mode: SINGLE\nrepo_registry_status: CONFIRMED\n' + front +
  '\n---\n\n# Project: GSA\n\n## Repositories\n' + rows +
  '\n\n## Runtime\n- Source truth is Git\n' + branches

test('M1: canonical project path only; dot, invalid UUID, encoding, foreign project blocked', () => {
  assert.equal(h.validMemoryPath('projects/' + id + '/PROJECT.md'), true)
  assert.equal(h.validMemoryPath('projects/' + id + '/WORK/JOBS/job.json'), true)
  for (const p of [
    'projects/' + id + '/../other/PROJECT.md',
    'projects/' + id + '/./PROJECT.md',
    'projects/------------------------------------/PROJECT.md',
    'projects/' + id + '/%2e%2e/PROJECT.md',
    'projects/' + id + '/WORK\\JOBS\\foo.json',
    'projects/' + id + '/',
    'projects/' + id + '//foo',
    '../projects/' + id + '/PROJECT.md'
  ]) assert.equal(h.validMemoryPath(p), false, p)
  assert.equal(h.validProjectManifestPath('projects/' + id + '/PROJECT.md', id), true)
  assert.equal(h.validProjectManifestPath('projects/' + id + '/AGENTS.md', id), false)
  assert.equal(h.validProjectManifestPath('projects/' + id + '/PROJECT.md', '01a0d70c-9683-7324-9d3d-a8231a93c63b'), false)
})

test('C14A: real GSA development branch and release branch are parsed independently', () => {
  const p = h.parseProjectManifest(fixture(
    'development_branch: upgrade/gsa-refactor\nrelease_branch: main\nintegration_target: upgrade/gsa-refactor',
    '- PRIMARY | OWNED | ' + repo,
    '\n## Branch Policy (Human-approved)\n- PRIMARY | ' + repo + ' | development=upgrade/gsa-refactor | release=main\n'
  ))
  assert.equal(p.development_branch, 'upgrade/gsa-refactor')
  assert.equal(p.release_branch, 'main')
  assert.equal(p.branch_policy_status, 'CONFIGURED')
  assert.equal(p.branch_policies.length, 1)
})

test('C14A negative: unconfigured never falls back to main / GitHub default', () => {
  const p = h.parseProjectManifest(fixture())
  assert.equal(p.development_branch, null)
  assert.equal(p.release_branch, null)
  assert.equal(p.branch_policy_status, 'UNCONFIGURED')
})

test('C14A: multi-repository mappings do not leak across repositories', () => {
  const child = 'https://github.com/thebimhouseinfo-sudo/child-repo'
  const p = h.parseProjectManifest(fixture(
    'development_branch: upgrade/gsa-refactor\nrelease_branch: main',
    '- PRIMARY | OWNED | ' + repo + '\n- DEPENDENCY | OWNED | ' + child,
    '\n## Branch Policy (Human-approved)\n- PRIMARY | ' + repo +
    ' | development=upgrade/gsa-refactor | release=main\n- DEPENDENCY | ' + child +
    ' | development=feature/child | release=stable\n'
  ))
  assert.equal(p.repo_mode, 'MULTI')
  assert.equal(p.branch_policies.length, 2)
  assert.equal(p.branch_policies[0].development_branch, 'upgrade/gsa-refactor')
  assert.equal(p.branch_policies[1].development_branch, 'feature/child')
  assert.equal(p.branch_policies[1].release_branch, 'stable')
})

test('C14A: invalid/missing configured branch is UNCONFIGURED, not rewritten as main', () => {
  const bad = ['../main', 'branch..evil', '/foo', 'foo//bar', 'main.lock', 'foo\\bar', '', '.git/HEAD']
  for (const name of bad) assert.equal(h.validIntegrationBranch(name), false, name)
  assert.equal(h.validIntegrationBranch('upgrade/gsa-refactor'), true)
  const p = h.parseProjectManifest(fixture('development_branch: ../wrong\nrelease_branch: main'))
  assert.equal(p.development_branch, null)
  assert.equal(p.branch_policy_status, 'UNCONFIGURED')
})

test('C14A revision binding: missing, retained, newly supplied and malformed refs', () => {
  const nextCode = { type: 'code', plan_kind: 'JOB', repository_context: { integration_branch: null } }
  const existing = { ...nextCode, repository_context: { integration_branch: 'upgrade/gsa-refactor' } }
  assert.match(h.revisedJobIntegrationBranchError(nextCode, 'NEXT', undefined), /DEVELOPMENT_BRANCH_REQUIRED/)
  assert.equal(h.revisedJobIntegrationBranchError(nextCode, 'NEXT', 'upgrade/gsa-refactor'), null)
  assert.equal(h.revisedJobIntegrationBranchError(existing, 'NEXT', undefined), null)
  assert.match(h.revisedJobIntegrationBranchError(existing, 'NEXT', '../main'), /DEVELOPMENT_BRANCH_INVALID/)
  assert.match(h.revisedJobIntegrationBranchError(existing, 'NEXT', ''), /DEVELOPMENT_BRANCH_INVALID/)
  assert.match(h.revisedJobIntegrationBranchError({ ...nextCode, plan_kind: 'PROJECT_PLAN', type: 'plan' }, 'NEXT', undefined), /DEVELOPMENT_BRANCH_REQUIRED/)
  assert.equal(h.revisedJobIntegrationBranchError(nextCode, 'V2_STABLE', undefined), null, 'legacy behavior must remain')
  assert.equal(h.revisedJobIntegrationBranchError({ ...nextCode, type: 'plan' }, 'NEXT', undefined), null, 'non-Project Plan not forcibly rebound')
})

test('C14A job_revise_plan consumes and persists branch with external project/live-ref/readback gates', () => {
  const revise = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/job-revise-plan-tool.ts'), 'utf8').split("'job_revise_plan',")[1]
  assert.match(revise, /integration_branch: z\.string\(\)\.optional\(\)/)
  assert.match(revise, /criteria_binding, integration_branch, revision_reason/)
  assert.match(revise, /revisedJobIntegrationBranchError\(current, executionContract, integration_branch\)/)
  assert.match(revise, /integration_branch: effectiveIntegrationBranch/)
  assert.match(revise, /Human-configured Development Branch equals repository_context\.integration_branch/)
  assert.match(revise, /verify live GitHub branch/)
  assert.match(revise, /Read back the Job and verify.*repository_context\.integration_branch/)
  assert.match(revise, /planningLoopContinuationDecision\('PLAN_REVISED'/)
})

test('Contract: READY and status expose branch config; Admin requires owned repo and Git verification', () => {
  const lifecycleSource = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/project-lifecycle-tools.ts'), 'utf8')
  const open = lifecycleSource.slice(lifecycleSource.indexOf("'project_open',"), lifecycleSource.indexOf("'project_status',"))
  const status = lifecycleSource.slice(lifecycleSource.indexOf("'project_status',"), lifecycleSource.indexOf('const transitionTool ='))
  const prepare = setupSource.slice(setupSource.indexOf("'project_branch_policy_prepare',"))
  assert.match(open, /branch_policy_status: parsed\.branch_policy_status/)
  assert.match(open, /validProjectManifestPath\(memory_path, parsed\.project_id\)/)
  assert.match(status, /branch_policies: parsed\.branch_policies/)
  assert.match(prepare, /repo\.url\.toLowerCase\(\)/)
  assert.match(prepare, /r\.relation === 'OWNED'/)
  assert.match(prepare, /Verify the selected source repository/)
  assert.match(prepare, /human_confirmed: z\.literal\(true\)/)
  assert.match(prepare, /readback/)
})

test('M2: role-scoped addins are lazy path references, not trusted harness overrides', () => {
  const nl = String.fromCharCode(10)
  const agents = [
    '# GSA Project Agents',
    '## Coder Add-in (optional)',
    '- harness: projects/' + id + '/ADDINS/coder/harness.md',
    '- skills: projects/' + id + '/SKILLS/coder/visual-lisp.md, projects/' + id + '/SKILLS/coder/host-api.md',
    '## Tester Add-in (optional)',
    '- harness: projects/' + id + '/ADDINS/tester/harness.md',
    '- skills: none',
    '## Policy',
    'Never override the global harness',
  ].join(nl)
  const coder = h.resolveProjectRoleAddins(id, 'coder', agents)
  assert.equal(coder.status, 'READY')
  assert.equal(coder.skill_paths.length, 2)
  assert.ok(coder.harness_path.endsWith('/ADDINS/coder/harness.md'))
  const tester = h.resolveProjectRoleAddins(id, 'tester', agents)
  assert.equal(tester.status, 'READY')
  assert.equal(tester.skill_paths.length, 0)
  assert.ok(tester.harness_path.endsWith('/ADDINS/tester/harness.md'))
  const other = h.resolveProjectRoleAddins('01a0d70c-9683-7324-9d3d-a8231a93c63b', 'coder', agents)
  assert.equal(other.status, 'DENIED')
})

test('M2: empty optional addin keeps generic; traversal never becomes a skill', () => {
  const nl = String.fromCharCode(10)
  const ok = ['## Coder Add-in (optional)', '- harness: none', '- skills: none'].join(nl)
  assert.equal(h.resolveProjectRoleAddins(id, 'coder', ok).status, 'NONE')
  const bad = ['## Coder Add-in (optional)', '- harness: projects/' + id + '/../foreign/AGENTS.md', '- skills: none'].join(nl)
  assert.equal(h.resolveProjectRoleAddins(id, 'coder', bad).status, 'DENIED')
  const foreign = ['## Coder Add-in (optional)', '- harness: projects/' + id + '/CRITERIA.md', '- skills: none'].join(nl)
  assert.equal(h.resolveProjectRoleAddins(id, 'coder', foreign).status, 'DENIED')
})


test('M2: ordinary Coder/Tester Task uses generic capability without domain add-in', () => {
  for (const role of ['coder','tester']) {
    const r = h.projectTaskCapabilityAssessment(id, role, undefined, false, { status: 'NONE', harness_path: null, skill_paths: [] })
    assert.equal(r.readiness, 'GENERIC_READY')
    assert.equal(r.ready_for_task, true)
  }
})

test('M2: configured paths alone never satisfy required domain functionality', () => {
  const task = '01a154a5-d049-7c4a-b758-d55600d4fcd0'
  const path = 'projects/' + id + '/SKILLS/coder/autolisp.md'
  const refs = { status: 'READY', harness_path: null, skill_paths: [path] }
  const empty = h.projectTaskCapabilityAssessment(id,'coder',task,true,{ status:'NONE',harness_path:null,skill_paths: [] })
  assert.equal(empty.readiness,'BLOCKED_REQUIRED_ADDIN')
  const notChecked = h.projectTaskCapabilityAssessment(id,'coder',task,true,refs)
  assert.equal(notChecked.readiness,'CONFIGURED_UNVERIFIED')
  assert.equal(notChecked.ready_for_task,false)
  const evidence = { project_id:id, role:'coder', task_id:task, path, file_sha:'a'.repeat(40),
    result:'FUNCTIONAL', verification_ref:'projects/' + id + '/VERIFICATION/functional-test.json' }
  for (const altered of [{ ...evidence, role:'tester' }, { ...evidence, project_id:'01a0d70c-9683-7324-9d3d-a8231a93c63b' },
    { ...evidence, task_id:'01a154a5-d049-7c4a-b758-d55600d4fcd1' },
    { ...evidence, path:'projects/' + id + '/SKILLS/coder/other.md' }, { ...evidence, file_sha:'invalid' },
    { ...evidence, result:'UNVERIFIED' },{ ...evidence, verification_ref:'projects/foreign/VERIFICATION/test.json' }]) {
    assert.equal(h.projectTaskCapabilityAssessment(id,'coder',task,true,refs,[altered]).ready_for_task,false)
    assert.equal(h.projectTaskCapabilityAssessment(id,'coder',task,true,refs,[altered]).readiness,'CONFIGURED_UNVERIFIED')
  }
  const supplied = h.projectTaskCapabilityAssessment(id,'coder',task,true,refs,[evidence])
  assert.equal(supplied.readiness,'EVIDENCE_PRESENT_UNVERIFIED')
  assert.equal(supplied.ready_for_task,false,'claim without independent GitHub and functional readback must not grant execution')
})

test('M2: tool exposes capability evidence as non-authoritative discovery only', () => {
  const tool = setupSource.slice(setupSource.indexOf("'project_role_addins_resolve',"),setupSource.indexOf("'project_bootstrap_checklist_prepare',"))
  assert.match(tool,/projectTaskCapabilityAssessment\(project_id, role, task_id/)
  assert.match(tool,/ready_for_task: assessed\.ready_for_task/)
  assert.match(tool,/Independently GitHub readback exact project\/role\/task\/path SHA/)
  assert.match(tool,/configured skill path and even a caller-supplied FUNCTIONAL evidence record/)
  assert.match(tool,/generic_available: !requires_domain_addin/)
})

test('M1/M3/M4: read-only Advisor, one Criteria, STOPCHAT and GOAL-first contract exist', () => {
  const roleMap = harnessSource.slice(harnessSource.indexOf('const ROLE_HARNESSES'), harnessSource.indexOf('const ROLE_SKILLS'))
  assert.ok(roleMap.includes('advisor: {'))
  assert.ok(roleMap.includes('Never act as Reviewer/CR'))
  assert.ok(roleMap.includes('GOAL FIRST'))
  const startup = setupSource.slice(setupSource.indexOf("'project_setup_prepare',"), setupSource.indexOf("'project_role_addins_resolve',"))
  assert.ok(startup.includes('AGENTS.md'))
  assert.ok(startup.includes('Status: DRAFT'))
  assert.ok(startup.includes('CHUA_CHOT'))
  assert.ok(startup.toLowerCase().includes('same criteria.md'))
  const base = harnessSource.slice(harnessSource.indexOf('const BASE_AGENT_HARNESS'), harnessSource.indexOf('const ROLE_HARNESSES'))
  assert.ok(base.includes('STOPCHAT'))
  assert.ok(base.includes('PROJECT ADDINS'))
  assert.ok(base.includes('CRITERIA CHANGE ORDER'))
  assert.ok(base.includes('BRANCH AUTHORITY'))
})


test('C30: NEW can draft; EXISTING Criteria presence never overwrites canonical product theory', () => {
  const fresh = h.resolveProjectCriteriaIntake('NEW', 'UNKNOWN', '')
  assert.equal(fresh.disposition, 'CREATE_DRAFT_IF_ABSENT')
  assert.equal(fresh.source_derived, false)
  const existing = h.resolveProjectCriteriaIntake('EXISTING', 'PRESENT', 'Already has code and source')
  assert.equal(existing.disposition, 'READ_EXISTING_NO_WRITE')
  assert.match(existing.review, /desired product|intended product/)
  assert.match(existing.review, /missing, excess and drift/)
  const unknown = h.resolveProjectCriteriaIntake('EXISTING', 'UNKNOWN', 'some code')
  assert.equal(unknown.disposition, 'INSPECT_FIRST_NO_WRITE')
  assert.match(unknown.review, /inspect/)
})

test('C30: EXISTING without Criteria must inspect code before a provisional draft', () => {
  const noEvidence = h.resolveProjectCriteriaIntake('EXISTING', 'ABSENT', '')
  assert.equal(noEvidence.disposition, 'INSPECT_FIRST_NO_WRITE')
  assert.match(noEvidence.review, /actual source/)
  const withEvidence = h.resolveProjectCriteriaIntake('EXISTING', 'ABSENT', 'Functional MVP implements X')
  assert.equal(withEvidence.disposition, 'INSPECT_FIRST_NO_WRITE')
  assert.equal(withEvidence.source_derived, true)
  assert.match(withEvidence.review, /source code/)
  assert.match(withEvidence.review, /Human/)
})

test('M1 setup routes independently validated Criteria states and Advisor remains intent-only', () => {
  const setup = setupSource.slice(setupSource.indexOf("'project_setup_prepare',"), setupSource.indexOf("'project_role_addins_resolve',"))
  assert.match(setup, /intake_mode: z\.enum\(\['NEW','EXISTING'\]\)/)
  assert.match(setup, /existing_criteria_state: z\.enum\(\['PRESENT','ABSENT','UNKNOWN'\]\)/)
  assert.match(setup, /intake_disposition: z\.enum/)
  assert.match(setup, /resolveProjectCriteriaIntake\(intake_mode, existing_criteria_state/)
  assert.match(setup, /intake\.disposition === 'CREATE_DRAFT_IF_ABSENT'/)
  assert.match(setup, /source-derived product hypothesis; Human must confirm/)
  assert.match(setup, /GitHub independently confirms file absent/)
  assert.match(setup, /Advisor consultation: PENDING/)
  assert.match(setup, /advisor_activation: 'HUMAN_CRITERIA_INTENT_ONLY'/)
  assert.match(setup, /No ADVICE_REF/)
  const base = harnessSource.slice(harnessSource.indexOf('const BASE_AGENT_HARNESS'), harnessSource.indexOf('const ROLE_HARNESSES'))
  assert.match(base, /explicit Human intent/)
  assert.match(base, /not approval/)
  const advisor = harnessSource.slice(harnessSource.indexOf('  advisor: {'), harnessSource.indexOf('  designer: {'))
  assert.match(advisor, /only Human intent/)
  assert.match(advisor, /Do not activate on draft completion/)
})


test('M4 C31: Human acknowledgement, not a technical receipt, unlocks Advisor checkpoint only', () => {
  const input = { intent: 'MATERIAL_CHANGE', criteria_path: 'projects/' + id + '/CRITERIA.md',
    criteria_current_sha: 'b'.repeat(40), criteria_text: '# Criteria',
    human_decision: 'APPROVE' }
  const decide = p => h.projectCriteriaAdvisoryDecision(id, { ...input, ...p })
  const first = decide({})
  assert.equal(first.status, 'ADVISOR_CONSULTATION_REQUIRED')
  assert.equal(first.advisor_required, true)
  assert.equal(first.criteria_write_prepared, false)
  assert.equal(first.external_advice_check_required, false)
  const ack = decide({ human_advisor_acknowledged: true })
  assert.equal(ack.status, 'HUMAN_ADVISOR_ACKNOWLEDGED')
  assert.equal(ack.advisor_required, false)
  assert.equal(ack.criteria_write_prepared, false, 'Acknowledgement never issues write permission')
  assert.equal(ack.external_advice_check_required, false)
  assert.equal(decide({ human_advisor_acknowledged: true, human_decision: 'PENDING' }).status, 'HUMAN_DECISION_PENDING')
  assert.equal(decide({ human_advisor_acknowledged: true, human_decision: 'KEEP' }).status, 'HUMAN_DECISION_PENDING')
  assert.equal(decide({ human_advisor_acknowledged: true, delta_scope: 'new human decision' }).status, 'HUMAN_ADVISOR_ACKNOWLEDGED')
  for (const intent of ['DISCUSSION','DRAFT_EDIT','PLAN_OR_TASK_CHANGE']) {
    assert.equal(decide({ intent }).advisor_required, false)
  }
  assert.equal(decide({ intent: 'HUMAN_KEEP_CRITERIA' }).status, 'HUMAN_KEEPS_CRITERIA_NO_WRITE')
  assert.equal(decide({ criteria_path: 'projects/' + id + '/CRITERIA-V2.md' }).status, 'CRITERIA_BASELINE_INVALID')
  assert.equal(decide({ criteria_current_sha: 'bad' }).status, 'CRITERIA_BASELINE_INVALID')
  assert.equal(decide({ intent: 'INVALID' }).status, 'CRITERIA_INTENT_INVALID')
})

test('M4 C31: read-only Advisor check preserves existing GitHub authorization and CAS', () => {
  const tool = setupSource.slice(setupSource.indexOf("'project_criteria_advice_check',"), setupSource.indexOf("'project_role_addins_resolve',"))
  assert.match(tool, /readOnlyHint: true/)
  assert.match(tool, /criteria_write_prepared: z\.literal\(false\)/)
  assert.match(tool, /human_advisor_acknowledged: z\.boolean\(\)/)
  assert.match(tool, /existing authorize_project_scope, authorize_memory_mutation and GitHub SHA-CAS/)
  assert.match(tool, /this SAME CRITERIA.md/)
  assert.doesNotMatch(tool, /delivered_advice: z\.object/)
  assert.ok(!tool.includes('GitHub update_file('))
})

test('M4 C31: role prompts invoke Advisor only for Criteria intent, then ask Human', () => {
  const roles = harnessSource.slice(harnessSource.indexOf('const ROLE_HARNESSES'), harnessSource.indexOf('const ROLE_SKILLS'))
  const planner = roles.slice(roles.indexOf('  planner: {'), roles.indexOf('  advisor: {'))
  const advisor = roles.slice(roles.indexOf('  advisor: {'), roles.indexOf('  designer: {'))
  assert.match(planner, /Advisor INACTIVE during brainstorm/)
  assert.match(planner, /Only explicit Human intent to approve first Criteria or change approved WHAT\/WHY/)
  assert.match(planner, /start_direct_agent\(role=advisor\)/)
  assert.match(planner, /Advisor admission alone is not delivered advice/)
  assert.match(planner, /human_advisor_acknowledged=true/)
  assert.match(planner, /Do not re-ask Human for an identical documented choice/)
  assert.doesNotMatch(planner, /formatAdvisorAdviceReceipt/)
  assert.match(advisor, /return control to Human and Planner/)
  assert.match(advisor, /No signed receipt or message-reference verification/)
  assert.match(advisor, /End Advisor activity immediately/)
  const harnessToolsSource = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/harness-skill-tools.ts'), 'utf8')
  const exposed = harnessToolsSource.slice(harnessToolsSource.indexOf("'get_agent_harness',"), harnessToolsSource.indexOf("'get_skill_catalog',"))
  assert.match(exposed, /'advisor'/)
  // GSA2 keeps advisor role entry, but the role's duplicate skill hints are
  // removed only when this same response exposes the authoritative skill list.
  assert.match(exposed, /renderHarness\(role, \{ includeProgressiveSkills: false \}\)/)
  assert.match(exposed, /suggested_skills:\s*ROLE_SKILLS\[role\]/)
  assert.equal((roles.match(/advisor: \{/g) || []).length, 1)
})

test('C30 M3: official Plan cannot precede Human-approved, current canonical Criteria', () => {
  const sha = 'a'.repeat(40)
  const criteria = { criteria_path:'projects/' + id + '/CRITERIA.md',
    criteria_blob_sha:sha, approval_status:'APPROVED' }
  const task='01a154b5-1a8c-7c31-ad7e-927e27c658ce'
  const plan = { plan_kind:'PROJECT_PLAN', criteria_binding:criteria, planning_revision:3,
    planning_review:{status:'PASS',reviewed_revision:3},
    tasks:[{task_id:task, completion_criteria:['observable output']}],
    milestones:[{milestone_id:'m1',node_ids:[task]}] }
  const cap=[{task_id:task,readiness:'GENERIC_READY'}]
  const input={criteria,criteria_human_approved:true,criteria_current_blob_sha:sha,plan,capabilities:cap}
  const status=x=>h.projectBootstrapReadinessDecision(id,x).status
  assert.equal(status({}), 'CRITERIA_BINDING_MISSING_OR_INVALID')
  assert.equal(status({...input,criteria_human_approved:false}), 'CRITERIA_HUMAN_APPROVAL_UNVERIFIED')
  assert.equal(status({...input,criteria:{...criteria,criteria_path:'projects/' + id + '/NOT-CRITERIA.md'}}),'CRITERIA_BINDING_MISSING_OR_INVALID')
  assert.equal(status({...input,criteria_current_blob_sha:'b'.repeat(40)}),'CRITERIA_STALE_OR_UNVERIFIED')
  assert.equal(status({...input,plan:undefined}),'IMPLEMENTATION_PLAN_MISSING')
  assert.equal(status({...input,plan:{...plan,criteria_binding:{...criteria,criteria_blob_sha:'b'.repeat(40)}}}),'PLAN_CRITERIA_MISMATCH')
  assert.equal(status({...input,plan:{...plan,planning_review:{status:'PENDING',reviewed_revision:3}}}),'PLAN_REVIEW_PENDING')
  assert.equal(status({...input,plan:{...plan,planning_review:{status:'PASS',reviewed_revision:2}}}),'PLAN_REVIEW_PENDING')
  assert.equal(status({...input,plan:{...plan,tasks:[{task_id:task,completion_criteria:[]}]}}),'PLAN_TASK_ACCEPTANCE_MISSING')
  assert.equal(status({...input,capabilities:[]}), 'CAPABILITY_NOT_READY')
  assert.equal(status({...input,capabilities:[{task_id:task,readiness:'CONFIGURED_UNVERIFIED'}]}),'CAPABILITY_NOT_READY')
  assert.equal(status({...input,capabilities:[{task_id:task,readiness:'DOMAIN_READY_VERIFIED',evidence_verified:false}]}),'CAPABILITY_NOT_READY')
  assert.equal(status({...input,capabilities:[{task_id:task,readiness:'DOMAIN_READY_VERIFIED',evidence_verified:true}]}),'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING')
  assert.equal(status({...input,plan:{...plan,milestones:[]}}),'MILESTONES_NOT_READY')
  assert.equal(status({...input,plan:{...plan,milestones:[{milestone_id:'m1',node_ids:['unknown-task']}]}}),'MILESTONES_NOT_READY')
  const pending=h.projectBootstrapReadinessDecision(id,input)
  assert.equal(pending.status,'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING')
  assert.equal(pending.bootstrapped,false,'caller-supplied artifacts are not independently verified')
  assert.equal(pending.source_write_authorized,false)
  const claimed=h.projectBootstrapReadinessDecision(id,{...input,human_execution_approved:true})
  assert.equal(claimed.status,'BOOTSTRAP_EVIDENCE_READY_EXECUTION_APPROVAL_CLAIMED')
  assert.equal(claimed.source_write_authorized,false,'self-claimed Human approval is not a code gate')
})

test('M3: invalid, duplicate and cyclic reviewed Task dependencies cannot certify Bootstrap', () => {
  const sha = 'a'.repeat(40)
  const criteria = { criteria_path: 'projects/' + id + '/CRITERIA.md',
    criteria_blob_sha: sha, approval_status: 'APPROVED' }
  const a = '01a154b5-1a8c-7c31-ad7e-927e27c658ce'
  const b = '01a154b5-1a8c-7c31-ad7e-927e27c658cf'
  const tasks = [
    { task_id: a, dependencies: [], completion_criteria: ['produce artifact'] },
    { task_id: b, dependencies: [a], completion_criteria: ['verify artifact'] },
  ]
  const plan = { plan_kind: 'PROJECT_PLAN', criteria_binding: criteria,
    planning_revision: 3, planning_review: { status: 'PASS', reviewed_revision: 3 },
    tasks, milestones: [{ milestone_id: 'm1', name: 'Outcome', node_ids: [a, b] }] }
  const input = { criteria, criteria_human_approved: true, criteria_current_blob_sha: sha, plan,
    capabilities: [a, b].map(task_id => ({ task_id, readiness: 'GENERIC_READY' })) }
  const status = patch => h.projectBootstrapReadinessDecision(id, { ...input, plan: { ...plan, ...patch } }).status
  assert.equal(status({}), 'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING')
  assert.equal(status({ tasks: [tasks[0], { ...tasks[1], dependencies: ['unknown'] }] }), 'PLAN_DEPENDENCIES_INVALID')
  assert.equal(status({ tasks: [tasks[0], { ...tasks[1], dependencies: [b] }] }), 'PLAN_DEPENDENCIES_INVALID')
  assert.equal(status({ tasks: [tasks[0], { ...tasks[1], dependencies: [a, a] }] }), 'PLAN_DEPENDENCIES_INVALID')
  assert.equal(status({ tasks: [tasks[0], { ...tasks[1], dependencies: 'bad' }] }), 'PLAN_DEPENDENCIES_INVALID')
  assert.equal(status({ tasks: [{ ...tasks[0], dependencies: [b] }, tasks[1]] }), 'PLAN_DEPENDENCIES_INVALID')
  assert.equal(status({ tasks: [tasks[0], { ...tasks[1], task_id: a }] }), 'PLAN_DEPENDENCIES_INVALID')
  assert.equal(status({ tasks: [tasks[0], { ...tasks[1], completion_criteria: ['  '] }] }), 'PLAN_TASK_ACCEPTANCE_MISSING')
  assert.equal(status({ milestones: [{ milestone_id: 'm1', node_ids: [a, a] }] }), 'MILESTONES_NOT_READY')
  assert.equal(status({ milestones: [{ milestone_id: 'm1', node_ids: [a, b] }, { milestone_id: 'm1', node_ids: [a] }] }), 'MILESTONES_NOT_READY')
  assert.equal(h.projectBootstrapReadinessDecision(id, { ...input, human_execution_approved: true }).source_write_authorized, false)
})

test('M3: read-only Bootstrap preflight never authorizes code or duplicates Job lifecycle', () => {
  const tool=setupSource.slice(setupSource.indexOf("'project_bootstrap_readiness_prepare',"),setupSource.indexOf("'project_branch_policy_prepare',"))
  assert.match(tool,/source_write_authorized: z.literal\(false\)/)
  assert.match(tool,/readOnlyHint: true/)
  assert.match(tool,/separately verify Human execution approval/)
  assert.match(tool,/After the four checks reach READY/)
})

test('M3: new Project Plan must bind exact Human-approved Criteria file and SHA', () => {
  const correct = { criteria_path: 'projects/' + id + '/CRITERIA.md', criteria_blob_sha: 'a'.repeat(40), approval_status: 'APPROVED' }
  assert.equal(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', correct), null)
  assert.ok(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', null))
  assert.ok(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', { ...correct, approval_status: 'DRAFT' }))
  assert.ok(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', { ...correct, criteria_blob_sha: 'bad' }))
  assert.ok(h.projectCriteriaBindingError(id, 'PROJECT_PLAN', { ...correct, criteria_path: 'projects/' + id + '/OTHER.md' }))
  assert.ok(h.projectCriteriaBindingError('01a0d70c-9683-7324-9d3d-a8231a93c63b', 'PROJECT_PLAN', correct))
  assert.equal(h.projectCriteriaBindingError(id, 'JOB', null), null, 'Unrelated legacy/small Jobs must still work')
})

test('M3: Project Plan preparation and planning Reviewer preserve exact Criteria binding', () => {
  const jobPrepareSource = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/job-prepare-tool.ts'), 'utf8')
  const create = jobPrepareSource.slice(jobPrepareSource.indexOf("'job_prepare',"))
  const revise = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/job-revise-plan-tool.ts'), 'utf8').split("'job_revise_plan',")[1]
  const review = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/plan-review-record-tool.ts'), 'utf8').split("'plan_review_record',")[1]
  assert.ok(create.includes('plan_kind'))
  assert.ok(create.includes('criteria_binding: criteria_binding ?? null'))
  assert.ok(revise.includes('criteria_binding: effectiveCriteria ?? null'))
  assert.ok(review.includes('projectCriteriaBindingError'))
  assert.ok(review.includes('criteria_binding: current.criteria_binding ?? null'))
  assert.ok(review.includes('Reviewer independently fetches approved Criteria revision'))
})

test('M4: CRL requires approved milestone, current planning PASS and exact Reviewer PASS', () => {
  const review = { kind: 'REVIEW', result: 'PASS', producer: 'reviewer', project_id: id,
    job_id: '01a0f05c-3567-73d0-8a65-90da7ebbd324', planning_revision: 2, milestone_id: 'm1' }
  const job = { project_id: id, job_id: review.job_id, lifecycle: 'IN_PROGRESS', planning_revision: 2,
    planning_review: { status: 'PASS', reviewed_revision: 2 },
    milestones: [{ milestone_id: 'm1', review_loop: 'crl', human_pre_authorized: true }] }
  const snap = { path: 'projects/' + id + '/VERIFICATION/x.json', sha: 'a'.repeat(40), record_text: JSON.stringify(review) }
  assert.equal(h.milestoneCrlEvidenceError(job, 'm1', snap), null)
  assert.ok(h.milestoneCrlEvidenceError(job, 'unknown', snap))
  assert.ok(h.milestoneCrlEvidenceError({ ...job, milestones: [{ milestone_id: 'm1', review_loop: 'rl', human_pre_authorized: true }] }, 'm1', snap))
  assert.ok(h.milestoneCrlEvidenceError({ ...job, milestones: [{ milestone_id: 'm1', review_loop: 'crl', human_pre_authorized: false }] }, 'm1', snap))
  assert.ok(h.milestoneCrlEvidenceError({ ...job, planning_review: { status: 'CHANGES_REQUIRED', reviewed_revision: 2 } }, 'm1', snap))
  assert.ok(h.milestoneCrlEvidenceError(job, 'm1', { ...snap, sha: 'bad' }))
  assert.ok(h.milestoneCrlEvidenceError(job, 'm1', { ...snap, record_text: JSON.stringify({ ...review, result: 'FAIL' }) }))
  assert.ok(h.milestoneCrlEvidenceError(job, 'm1', { ...snap, record_text: JSON.stringify({ ...review, planning_revision: 1 }) }))
})

test('M4: Human CR fallback and milestone invocation record distinct provenance', () => {
  const criticSource = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/critic-review-tools.ts'),'utf8')
  const start = criticSource.slice(criticSource.indexOf("'start_critic_review',"), criticSource.indexOf("'critic_review_record',"))
  const record = criticSource.slice(criticSource.indexOf("'critic_review_record',"))
  assert.ok(start.includes('human_invoked === true'))
  assert.ok(start.includes('milestoneCrlEvidenceError'))
  assert.ok(start.includes('PENDING_MILESTONE_EVIDENCE_READBACK'))
  assert.ok(record.includes("'APPROVED_MILESTONE'"))
  assert.ok(record.includes('Re-fetch the exact current Job SHA'))
  assert.ok(fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/planning-schemas.ts'),'utf8').includes("review_loop: z.enum(['none','rl','crl'])"))
})

test('M4 loop: Reviewer FAIL repairs then re-reviews; CR FAIL returns to rl before CR again', () => {
  const job = { planning_revision: 3, planning_review: { status: 'PASS', reviewed_revision: 3 },
    milestones: [{ milestone_id: 'm', review_loop: 'crl', human_pre_authorized: true, continuation: 'AUTO' }] }
  const choose = (stage, result, tries = 0) => h.milestoneLoopDecision(job, 'm', stage, result, tries)
  assert.equal(choose('BEGIN', 'NONE').next_action, 'RUN_REVIEWER')
  assert.equal(choose('REVIEWER', 'CHANGES_REQUIRED').next_action, 'REPAIR_AND_REREVIEW')
  assert.equal(choose('REVIEWER', 'PASS').next_action, 'VERIFY_REVIEWER_PASS_THEN_CR')
  assert.equal(choose('CR', 'FAIL').next_action, 'REPAIR_AND_REREVIEW')
  assert.equal(choose('CR', 'PASS').next_action, 'CONTINUE_AUTO')
  assert.equal(choose('CR', 'FAIL', 3).next_action, 'STOP_BLOCKED')
  assert.equal(choose('CR', 'BLOCKED').resume_same_turn, false)
  assert.equal(h.milestoneLoopDecision({ ...job, milestones: [{ milestone_id: 'm', review_loop: 'crl', human_pre_authorized: false, continuation: 'AUTO' }] }, 'm', 'REVIEWER', 'PASS').next_action, 'STOP')
})

test('M4 loop: rl never starts CR and Human milestone continuation stops on PASS', () => {
  const job = { planning_revision: 1, planning_review: { status: 'PASS', reviewed_revision: 1 },
    milestones: [{ milestone_id: 'm', review_loop: 'rl', human_pre_authorized: true, continuation: 'HUMAN' }] }
  const d = h.milestoneLoopDecision(job, 'm', 'REVIEWER', 'PASS')
  assert.equal(d.next_action, 'PRESENT_RESULT')
  assert.equal(d.resume_same_turn, false)
  assert.equal(h.milestoneLoopDecision({ ...job, milestones: [{ ...job.milestones[0], continuation: 'AUTO' }] }, 'm', 'REVIEWER', 'PASS').next_action, 'CONTINUE_AUTO')
  assert.equal(h.milestoneLoopDecision(job, 'm', 'CR', 'PASS').next_action, 'STOP')
  assert.equal(h.milestoneLoopDecision({ ...job, planning_review: { status: 'CHANGES_REQUIRED', reviewed_revision: 1 } }, 'm', 'BEGIN', 'NONE').next_action, 'STOP')
})


test('M6: historical CadGPT receipt does not become an extra consultation proof gate', () => {
  const cadId = '01a0d70c-9683-7324-9d3d-a8231a93c63b'
  const baseline = '8'.repeat(40)
  const scope = 'INITIAL_APPROVAL — complete CadGPT Criteria scope, formerly captured in a long receipt'
  const receipt = [
    '## Approval', '- Human decision: APPROVE — after advice.',
    '- ADVISOR SIGNED: ADVISED — historic Advisor acknowledgement.',
    '  - advisor_baseline_sha: ' + baseline,
    '  - delta_scope: ' + scope,
    '  - advice_reference: historic-CadGPT-consultation',
  ].join('\n')
  const input = { criteria_path:'projects/'+cadId+'/CRITERIA.md', criteria_current_sha:'9'.repeat(40),
    criteria_text: receipt, intent:'INITIAL_APPROVAL',human_decision:'APPROVE' }
  assert.equal(h.projectCriteriaAdvisoryDecision(cadId,input).status,'ADVISOR_CONSULTATION_REQUIRED')
  const acknowledged = { ...input, human_advisor_acknowledged:true }
  assert.equal(h.projectCriteriaAdvisoryDecision(cadId,acknowledged).status,'HUMAN_ADVISOR_ACKNOWLEDGED')
  assert.equal(h.projectCriteriaAdvisoryDecision(cadId,{...acknowledged,delta_scope:'Newly confirmed scope'}).status,'HUMAN_ADVISOR_ACKNOWLEDGED')
  assert.equal(h.projectCriteriaAdvisoryDecision(cadId,{...acknowledged,human_decision:'PENDING'}).status,'HUMAN_DECISION_PENDING')
})

test('M6: legacy receipt parser stays readable but does not authorize Criteria writes', () => {
  const baseline = 'a'.repeat(40), scope = 'Old advisory scope', adviceRef = 'historic conversation'
  const line = h.formatAdvisorAdviceReceipt(baseline,scope,adviceRef)
  assert.equal(line, 'ADVISOR SIGNED: ADVISED | BASELINE='+baseline+' | SCOPE='+scope+' | ADVICE_REF='+adviceRef)
  const parsed = h.parseAdvisorAdviceReceipts('## Approval\n'+line)
  assert.equal(parsed.malformed,false)
  assert.equal(parsed.receipts.length,1)
  assert.equal(parsed.receipts[0].scope,scope)
  const input = {criteria_path:'projects/'+id+'/CRITERIA.md',criteria_current_sha:'b'.repeat(40),
    criteria_text:line,intent:'MATERIAL_CHANGE',human_decision:'APPROVE'}
  assert.equal(h.projectCriteriaAdvisoryDecision(id,input).status,'ADVISOR_CONSULTATION_REQUIRED')
  assert.equal(h.projectCriteriaAdvisoryDecision(id,{...input,human_advisor_acknowledged:true}).status,'HUMAN_ADVISOR_ACKNOWLEDGED')
  assert.equal(h.projectCriteriaAdvisoryDecision(id,{...input,human_advisor_acknowledged:true}).criteria_write_prepared,false)
  assert.equal(h.formatAdvisorAdviceReceipt(baseline,'scope | injection',adviceRef),null)
})

test('M6: Advisor and Planner prompts share minimal Human acknowledgement contract', () => {
  const planner = harnessSource.slice(harnessSource.indexOf('  planner: {'),harnessSource.indexOf('  advisor: {'))
  const advisor = harnessSource.slice(harnessSource.indexOf('  advisor: {'),harnessSource.indexOf('  designer: {'))
  const check = setupSource.slice(setupSource.indexOf("'project_criteria_advice_check',"),setupSource.indexOf("'project_role_addins_resolve',"))
  assert.ok(planner.includes('human_advisor_acknowledged=true'))
  assert.ok(planner.includes('project_criteria_advice_check'))
  assert.ok(advisor.includes('No signed receipt or message-reference verification'))
  assert.ok(check.includes('No Advisor receipt'))
  assert.ok(check.includes('criteria_write_prepared: z.literal(false)'))
  assert.ok(!check.includes('delivered_advice: z.object'))
})

test('M5: Coder and source-write boundaries must consume Project Bootstrap evidence', () => {
  const manifest = fixture(
    'development_branch: upgrade/gsa-refactor\nrelease_branch: main\nintegration_target: upgrade/gsa-refactor',
    '- PRIMARY | OWNED | ' + repo,
    '\n## Branch Policy (Human-approved)\n- PRIMARY | ' + repo + ' | development=upgrade/gsa-refactor | release=main'
  )
  const sha = 'a'.repeat(40)
  const criteria = { criteria_path: 'projects/' + id + '/CRITERIA.md',
    criteria_blob_sha: sha, approval_status: 'APPROVED' }
  const task = '01a154b5-1a8c-7c31-ad7e-927e27c658ce'
  const plan = { plan_kind: 'PROJECT_PLAN', criteria_binding: criteria,
    planning_revision: 1, planning_review: { status: 'PASS', reviewed_revision: 1 },
    tasks: [{ task_id: task, dependencies: [], completion_criteria: ['observable acceptance'] }],
    milestones: [{ milestone_id: 'm1', node_ids: [task] }] }
  const proof = {
    path: 'projects/' + id + '/VERIFICATION/bootstrap-proof.json',
    name: 'bootstrap-proof.json', sha: 'b'.repeat(40),
    criteria_sha: sha, reviewed_plan_sha: 'c'.repeat(40),
    human_approval_ref: 'human-reviewed-plan-message'
  }
  const evidence = {
    criteria, criteria_human_approved: true, criteria_current_blob_sha: sha, plan,
    capabilities: [{ task_id: task, readiness: 'GENERIC_READY' }],
    human_execution_approved: true, readback_proof: proof
  }
  const guard = (e, branch = 'upgrade/gsa-refactor', targetRepo = repo, currentManifest = manifest) =>
    h.projectBootstrapExecutionError(id, currentManifest, e, targetRepo, branch)
  assert.equal(guard(evidence), null, 'Prepared only: actual GitHub readback is a separate mandatory step')
  assert.match(guard(undefined), /BOOTSTRAP_REQUIRED/)
  assert.match(guard({}), /BOOTSTRAP_PROJECT_INVALID|BOOTSTRAP_PREREQUISITE_BLOCKED/)
  assert.match(guard(evidence, 'main'), /BOOTSTRAP_SOURCE_BRANCH_INVALID/)
  assert.match(guard(evidence, 'upgrade/gsa-refactor', 'https://github.com/other/wrong'), /BOOTSTRAP_SOURCE_BRANCH_INVALID/)
  assert.match(guard(evidence, 'upgrade/gsa-refactor', repo, ''), /BOOTSTRAP_PROJECT_INVALID/)
  assert.match(guard({ ...evidence, human_execution_approved: false }), /BOOTSTRAP_PREREQUISITE_BLOCKED/)
  assert.match(guard({ ...evidence, criteria_human_approved: false }), /BOOTSTRAP_PREREQUISITE_BLOCKED/)
  assert.match(guard({ ...evidence, plan: { ...plan, planning_review: { status: 'CHANGES_REQUIRED', reviewed_revision: 1 } } }), /BOOTSTRAP_PREREQUISITE_BLOCKED/)
  assert.match(guard({ ...evidence, capabilities: [] }), /BOOTSTRAP_PREREQUISITE_BLOCKED/)
  assert.match(guard({ ...evidence, plan: { ...plan, milestones: [] } }), /BOOTSTRAP_PREREQUISITE_BLOCKED/)
  assert.match(guard({ ...evidence, readback_proof: null }), /BOOTSTRAP_READBACK_PROOF_REQUIRED/)
  assert.match(guard({ ...evidence, readback_proof: { ...proof, criteria_sha: 'd'.repeat(40) } }), /BOOTSTRAP_READBACK_PROOF_REQUIRED/)
  assert.match(guard({ ...evidence, readback_proof: { ...proof, sha: 'bad' } }), /BOOTSTRAP_READBACK_PROOF_REQUIRED/)
  assert.match(guard({ ...evidence, readback_proof: { ...proof, human_approval_ref: '' } }), /BOOTSTRAP_READBACK_PROOF_REQUIRED/)
})

test('M5: both GSA-owned source mutation and Coder dispatch fail closed; unrelated roles remain intact', () => {
  const authSource = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/project-auth-tools.ts'), 'utf8')
  const scope = authSource.slice(authSource.indexOf("'authorize_project_scope',"), authSource.indexOf("'authorize_memory_mutation',"))
  assert.match(scope, /operation === 'MUTATE_SOURCE'/)
  assert.match(scope, /projectBootstrapExecutionError/)
  assert.match(scope, /allowed: false, mutation_allowed: false/)
  const runSource = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/run-execution-tools.ts'), 'utf8')
  const begin = runSource.slice(runSource.indexOf("'run_begin',"), runSource.indexOf("'relationship_knowledge_prepare',"))
  assert.match(begin, /role === 'coder'/)
  assert.match(begin, /projectBootstrapExecutionError/)
  assert.match(begin, /if \(blocked\) return \{ content:/)
  assert.match(begin, /independently read existing Criteria/)
  assert.match(begin, /same evidence and target branch immediately before source write/)
  assert.ok(!begin.includes("role === 'tester' && projectBootstrapExecutionError"))
  assert.ok(!begin.includes("role === 'planner' && projectBootstrapExecutionError"))
})

test('M6: isolated staging slugs never inherit production execution or Memory namespace', () => {
  const req = (slug) => ({ url: 'https://example.supabase.co/functions/v1/' + slug + '/health' })
  const prod = req('gsa-mcp')
  const oldStage = req('gsa-mcp-next')
  const newStage = req('gsa-mcp-refactor-stage')
  const unknown = req('unrelated-service')
  assert.equal(h.edgeFunctionSlug(prod), 'gsa-mcp')
  assert.equal(h.runtimeSurface(prod), 'PRODUCTION')
  assert.equal(h.nextMemoryNamespaceForRequest(prod), 'PRODUCTION')
  assert.equal(h.jobCreationExecutionContractDefault(prod), 'NEXT')
  for (const r of [oldStage, newStage, unknown]) {
    assert.equal(h.runtimeSurface(r), 'STAGING_NEXT')
    assert.equal(h.nextMemoryNamespaceForRequest(r), 'TEST_LAB')
    assert.equal(h.jobCreationExecutionContractDefault(r), 'V2_STABLE')
  }
  assert.equal(h.edgeFunctionSlug(newStage), 'gsa-mcp-refactor-stage')
  assert.equal(h.edgeFunctionSlug(unknown), 'gsa-mcp-invalid')
  // Routing itself is exercised against Hono in the separate live-matcher test below.
})

test('M6: deployed Hono matcher serves exact production and isolated staging slugs only', async () => {
  const { Hono } = require('hono')
  const root = new Hono()
  const app = new Hono()
  app.get('/health', (c) => c.text('ROUTE_OK'))
  const paths = [...source.matchAll(/^\s*root\.route\('([^']+)', app\)/gm)].map(m => m[1])
  assert.equal(paths.length, 3, 'Production, legacy staging and restricted dynamic staging path must be registered')
  for (const p of paths) root.route(p, app)
  for (const slug of ['gsa-mcp', 'gsa-mcp-next', 'gsa-mcp-refactor-stage', 'gsa-mcp-test-123']) {
    const response = await root.request('https://example.supabase.co/' + slug + '/health')
    assert.equal(response.status, 200, 'Route must be reachable: ' + slug)
    assert.equal(await response.text(), 'ROUTE_OK')
  }
  for (const slug of ['unrelated-service', 'gsa-mcp-UPPER', 'not-gsa-mcp-refactor-stage']) {
    const response = await root.request('https://example.supabase.co/' + slug + '/health')
    assert.equal(response.status, 404, 'Unrelated slugs must not get GSA staging routes: ' + slug)
  }
})

test('M4: Critic harness and selftest recognize milestone Human preauthorization without generic CR auto-dispatch', () => {
  const critic = harnessSource.slice(harnessSource.indexOf('  critic_reviewer: {'), harnessSource.indexOf('  tester: {'))
  assert.ok(critic.includes('HUMAN AUTHORITY:'))
  assert.ok(critic.includes('Human-preauthorized milestone crl'))
  assert.ok(critic.includes('persisted current Reviewer PASS'))
  assert.ok(!critic.includes('must never auto-dispatch this role'))
  const selftestSource = fs.readFileSync('supabase/functions/gsa-mcp/selftest.ts', 'utf8')
  assert.ok(selftestSource.includes('critic_human_authority_scoped:'))
  assert.ok(selftestSource.includes('critic_harness_present:'))
  assert.ok(harnessSource.includes('Orchestrator may continue an approved AUTO milestone'))
})

test('Brownfield four-check Bootstrap adopts approved existing source docs without registration gates', () => {
  const assessment = {criteria:'APPROVED',plan:'PASS',milestones:'PASS',coder:'READY',tester:'READY'}
  const ready = h.projectBootstrapReadinessDecision(id,{assessment})
  assert.equal(ready.status,'BOOTSTRAP_READY')
  assert.equal(ready.bootstrapped,false,'PREPARE is not independent verification')
  assert.equal(ready.source_write_authorized,false)
  for(const [key,value,status] of [
    ['criteria','DRAFT','CRITERIA_NOT_READY'],
    ['plan','PENDING','PLAN_NOT_READY'],
    ['milestones','MISSING','MILESTONES_NOT_READY'],
    ['coder','UNVERIFIED','CAPABILITY_NOT_READY'],
    ['tester','UNVERIFIED','CAPABILITY_NOT_READY'],
  ]) assert.equal(h.projectBootstrapReadinessDecision(id,{assessment:{...assessment,[key]:value}}).status,status)
  const sourceReview = h.resolveProjectCriteriaIntake('EXISTING','ABSENT','docs/CRITERIA.md approved')
  assert.equal(sourceReview.disposition,'READ_EXISTING_NO_WRITE','no duplicate Project Memory Criteria')
  const missing = h.resolveProjectCriteriaIntake('EXISTING','ABSENT','')
  assert.equal(missing.disposition,'INSPECT_FIRST_NO_WRITE')
})

test('M5 four-check ready is separate from Human execution and branch scope', () => {
  const assessment = {criteria:'APPROVED',plan:'PASS',milestones:'PASS',coder:'READY',tester:'READY'}
  const evidence={assessment,human_execution_approved:true}
  const manifest = fixture(['development_branch: upgrade/gsa-refactor','release_branch: main','integration_target: upgrade/gsa-refactor'].join(String.fromCharCode(10)), '- PRIMARY | OWNED | ' + repo, ['', '## Branch Policy (Human-approved)', '- PRIMARY | ' + repo + ' | development=upgrade/gsa-refactor | release=main'].join(String.fromCharCode(10)))
  const g=(x,branch='upgrade/gsa-refactor')=>h.projectBootstrapExecutionError(id,manifest,x,repo,branch)
  assert.equal(g(evidence),null,'shape/scope only, external readback remains mandatory')
  assert.match(g({...evidence,human_execution_approved:false}),/SOURCE_EXECUTION_HUMAN_APPROVAL_REQUIRED/)
  assert.match(g({...evidence,assessment:{...assessment,coder:'UNVERIFIED'}}),/CAPABILITY_NOT_READY/)
  assert.match(g(evidence,'main'),/BOOTSTRAP_SOURCE_BRANCH_INVALID/)
  assert.match(g(undefined),/BOOTSTRAP_REQUIRED/)
})


test('M6 NEXT Goal Recheck supports exact Job-owned readable Task IDs; cannot bypass membership', () => {
  const runTools = fs.readFileSync('supabase/functions/gsa-mcp/run-execution-tools.ts','utf8')
  const criteriaSchema = runTools.slice(runTools.indexOf("'goal_recheck_record',"),runTools.indexOf("'run_verification_record',"))
  const occurrences = criteriaSchema.match(/^\s*task_id: z\.string\(\)\.min\(1\)\.optional\(\),/gm) || []
  assert.equal(occurrences.length,2, 'owning Task and criteria Task use nonempty IDs')
  assert.doesNotMatch(criteriaSchema,/^\s*task_id: z\.string\(\)\.uuid\(\)/m)
  const setup = setupSource.slice(setupSource.indexOf("'project_role_addins_resolve',"),setupSource.indexOf("'project_bootstrap_checklist_prepare',"))
  assert.match(setup,/task_id: z\.string\(\)\.min\(1\)\.optional\(\)/)
  assert.match(setup,/task_id: z\.string\(\)\.min\(1\)/)
  const found = ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='goalRecheckCoverageError')
  assert.ok(found)
  const js=ts.transpileModule(found.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
  const check=vm.runInNewContext(js+'\ngoalRecheckCoverageError', { jobExecutionContract: job=>job.execution_contract })
  const criterion='Human confirmation and decision sufficient'
  const j={execution_contract:'NEXT',project_id:id,job_id:'reviewed-job',
    planning_revision:1,tasks:[{task_id:'ADVISOR-FIX',completion_criteria:[criterion]}],
    topology:[{task_id:'ADVISOR-FIX',handler:'coder'}]}
  const r={project_id:id,job_id:'reviewed-job',planning_revision:1,primary_task_id:'ADVISOR-FIX',affected_task_refs:[]}
  assert.equal(check(j,r,[{task_id:'ADVISOR-FIX',criterion}]),null)
  assert.match(check(j,r,[{task_id:'UNRELATED',criterion}]),/criteria must exactly cover/)
  assert.match(check(j,r,[{task_id:'',criterion}]),/every NEXT criterion requires task_id/)
  assert.match(check(j,r,[{task_id:'ADVISOR-FIX',criterion},{task_id:'ADVISOR-FIX',criterion}]),/duplicate Task criterion/)
  assert.match(check(j,{...r,primary_task_id:'WRONG'},[{task_id:'WRONG',criterion}]),/not current Coder-owned topology/)
  assert.equal(check({...j,tasks:[{task_id:'T-1',completion_criteria:[criterion]}],
    topology:[{task_id:'T-1',handler:'coder'}]},
    {...r,primary_task_id:'T-1'},[{task_id:'T-1',criterion}]),null)
})

test('M5 brownfield existing reviewed source Plan and Milestones bootstrap without duplicate PROJECT_PLAN or future capabilities', () => {
  const criteria={criteria_path:'projects/'+id+'/CRITERIA.md',criteria_blob_sha:'a'.repeat(40),approval_status:'APPROVED'}
  // Product source Plan: reviewed, not a fabricated GSA Project Plan Job.
  const plan={planning_revision:2,planning_review:{status:'PASS',reviewed_revision:2},
    tasks:[
      {task_id:'MAC-M2',lifecycle:'READY',dependencies:[],completion_criteria:['Mac implementation']},
      {task_id:'MAC-M3',lifecycle:'READY',dependencies:['MAC-M2'],completion_criteria:['Mac integration']},
      {task_id:'WIN-M6',lifecycle:'READY',dependencies:['MAC-M3'],completion_criteria:['Future Windows build']}
    ],
    milestones:[{milestone_id:'M2',node_ids:['MAC-M2','MAC-M3']},
      {milestone_id:'M6',node_ids:['WIN-M6']}]}
  const evidence={criteria,criteria_human_approved:true,criteria_current_blob_sha:criteria.criteria_blob_sha,
    plan,capabilities:[{task_id:'MAC-M2',readiness:'GENERIC_READY'}],human_execution_approved:false}
  const ready=h.projectBootstrapReadinessDecision(id,evidence)
  assert.equal(ready.status,'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING')
  assert.equal(ready.source_write_authorized,false)
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,human_execution_approved:true}).status,
    'BOOTSTRAP_EVIDENCE_READY_EXECUTION_APPROVAL_CLAIMED')
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,capabilities:[]}).status,'CAPABILITY_NOT_READY')
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,capabilities:[{task_id:'WIN-M6',readiness:'GENERIC_READY'}]}).status,'CAPABILITY_NOT_READY')
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,criteria_human_approved:false}).status,'CRITERIA_HUMAN_APPROVAL_UNVERIFIED')
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,criteria_current_blob_sha:'b'.repeat(40)}).status,'CRITERIA_STALE_OR_UNVERIFIED')
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,plan:{...plan,planning_review:{status:'PENDING',reviewed_revision:1}}}).status,'PLAN_REVIEW_PENDING')
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,plan:{...plan,plan_kind:'PROJECT_PLAN'}}).status,'PLAN_CRITERIA_MISMATCH')
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,plan:{...plan,plan_kind:'JOB'}}).status,'PLAN_CRITERIA_MISMATCH')
  const withBinding={...plan,plan_kind:'PROJECT_PLAN',criteria_binding:criteria}
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,plan:withBinding}).status,'BOOTSTRAP_EVIDENCE_READY_HUMAN_EXECUTION_PENDING')
  const futureOnly={...plan,tasks:plan.tasks.map(t=>({...t,lifecycle:t.task_id==='MAC-M2'?'COMPLETED':t.lifecycle}))}
  assert.equal(h.projectBootstrapReadinessDecision(id,{...evidence,plan:futureOnly}).status,'CAPABILITY_NOT_READY',
    'After MAC-M2 completion, next MAC-M3 requires newly verified capability')
})

test('M5 four-check Bootstrap accepts existing Criteria, Plan, Milestones and Proposal without a fifth gate', () => {
  const assessment={criteria:'APPROVED',plan:'PASS',milestones:'PASS',coder:'READY',tester:'READY'}
  const ok=h.projectBootstrapReadinessDecision(id,{assessment,proposal:'Already reviewed detailed proposal'})
  assert.equal(ok.status,'BOOTSTRAP_READY')
  assert.equal(ok.bootstrapped,false,'prepare-only, independently verify before code')
  assert.equal(ok.source_write_authorized,false)
  assert.equal(h.projectBootstrapReadinessDecision(id,{assessment:{...assessment,tester:'UNVERIFIED'}}).status,
    'CAPABILITY_NOT_READY')
})
