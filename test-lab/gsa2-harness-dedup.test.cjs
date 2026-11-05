'use strict'
// CX-02 / GSA2: source-executed harness response dedup regression.
// This measures GSA-controlled output only, not actual ChatGPT host token use.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const dir = path.join(__dirname, '../supabase/functions/gsa-mcp')
const catalogSource = fs.readFileSync(path.join(dir, 'harness-catalog.ts'), 'utf8')
const handlerSource = fs.readFileSync(path.join(dir, 'harness-skill-tools.ts'), 'utf8')
const rootSource = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8')
const { loadSourceModule } = require('./helpers/harness-ts-loader.cjs')
const { normalizeCodingSkillSource } = require('./helpers/three-pr-approved-deltas.cjs')
const { normalizeUFInitializer } = require('./helpers/uf-approved-skill-deltas.cjs')
const { BASE_AGENT_HARNESS, ROLE_HARNESSES, ROLE_SKILLS, renderHarness } = loadSourceModule('harness-catalog.ts')
const roles = ['orchestrator', 'planner', 'advisor', 'designer', 'coder', 'reviewer', 'critic_reviewer', 'tester']

test('only redundant skill hints are removed from the bundled response', () => {
  for (const role of roles) {
    assert.ok(ROLE_HARNESSES[role], role + ' must exist')
    const complete = renderHarness(role)
    const compact = renderHarness(role, { includeProgressiveSkills: false })
    const suffix = '\n\nPROGRESSIVE SKILLS' +
      (ROLE_SKILLS[role] ?? []).map(name => '\n- ' + name + ': load only when relevant to the current Run.').join('')
    assert.equal(compact + suffix, complete, role + ': ONLY duplicated response metadata may be removed')
    assert.equal(renderHarness(role, { includeProgressiveSkills: true }), complete)
    assert.ok(compact.startsWith(BASE_AGENT_HARNESS + '\n\nROLE: ' + role.toUpperCase()))
    assert.ok(compact.includes('\nAUTHORITY / BOUNDARIES\n'))
    assert.ok(compact.includes('\nROLE LOOP\n'))
    assert.ok(compact.includes('\nEXPECTED OUTPUTS\n'))
    for (const required of [
      'HUMAN EXECUTION APPROVAL', 'BRANCH AUTHORITY', 'TECH ADVISOR CHECKPOINTS',
      'REVIEW LOOP', 'STOPCHAT', 'authorize_project_scope', 'execution_cursor_prepare',
    ]) assert.ok(compact.includes(required), role + ': required shared rule missing: ' + required)
  }
})

test('role metadata and independent entrypoints are unchanged', () => {
  assert.equal(renderHarness('not_a_role'), null)
  assert.equal(renderHarness('not_a_role', { includeProgressiveSkills: false }), null)
  assert.match(handlerSource, /renderHarness\(role, \{ includeProgressiveSkills: false \}\)/)
  assert.match(handlerSource, /suggested_skills:\s*ROLE_SKILLS\[role\]/)
  assert.match(handlerSource, /suggested_host_skills:\s*ROLE_HOST_SKILLS\[role\]/)
  assert.match(handlerSource, /structuredContent: result, content: \[\{ type: 'text', text: JSON\.stringify\(result\) \}\]/)
  assert.match(handlerSource, /if \(!auth\) return authError\(req, 'Authentication required to load a role harness\.'\)/)
  assert.match(rootSource, /role === 'advisor' \? renderHarness\('advisor'\) : null/)
  assert.match(rootSource, /import \{ BASE_AGENT_HARNESS, ROLE_HARNESSES, ROLE_SKILLS, ROLE_HOST_SKILLS, RUNTIME_SKILLS, renderHarness \} from '\.\/harness-catalog\.ts'/)
})

test('measured source-response reduction is strictly the duplicate skill list, not role text', () => {
  const samples = roles.map(role => {
    const original = renderHarness(role)
    const compact = renderHarness(role, { includeProgressiveSkills: false })
    return {
      role,
      original_chars: original.length,
      candidate_chars: compact.length,
      saved_chars: original.length - compact.length,
      original_utf8_bytes: Buffer.byteLength(original, 'utf8'),
      candidate_utf8_bytes: Buffer.byteLength(compact, 'utf8'),
    }
  })
  assert.equal(samples.length, 8)
  assert.ok(samples.every(x => x.saved_chars >= '\n\nPROGRESSIVE SKILLS'.length))
  const totals = samples.reduce((x, y) => ({
    original_chars: x.original_chars + y.original_chars,
    candidate_chars: x.candidate_chars + y.candidate_chars,
    saved_chars: x.saved_chars + y.saved_chars,
    original_utf8_bytes: x.original_utf8_bytes + y.original_utf8_bytes,
    candidate_utf8_bytes: x.candidate_utf8_bytes + y.candidate_utf8_bytes,
  }), { original_chars: 0, candidate_chars: 0, saved_chars: 0, original_utf8_bytes: 0, candidate_utf8_bytes: 0 })
  assert.equal(totals.saved_chars, totals.original_chars - totals.candidate_chars)
  assert.ok(totals.saved_chars > 0)
  console.log('GSA2_SOURCE_RESPONSE_PROXY ' + JSON.stringify({
    measurement: 'SOURCE_EXECUTED_INDIVIDUAL_ROLE_TEXT_ONLY',
    host_model_input_tokens: 'UNKNOWN',
    identical_workload_runner_comparison: 'NOT_YET_OBSERVED',
    samples, totals,
  }))
})

test('GSA4 A0 exact literals preserved after normalizing explicit U-A and U-E deltas', () => {
  // Frozen from 6b352a3a1f9b791564b4e8b1682af875adf73da7, before physical extraction.
  // Fingerprints are computed from exact TypeScript initializer text (including newlines).
  function fnv64(s) {
    let hash = 0xcbf29ce484222325n
    for (let i = 0; i < s.length; i++) {
      hash = BigInt.asUintN(64, (hash ^ BigInt(s.charCodeAt(i))) * 0x100000001b3n)
    }
    return hash.toString(16).padStart(16, '0')
  }
  function declarationInitializer(file, name) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    assert.equal(ast.parseDiagnostics.length, 0, file + ' must parse')
    const declarations = ast.statements.filter(ts.isVariableStatement)
      .flatMap(s => [...s.declarationList.declarations])
      .filter(d => ts.isIdentifier(d.name) && d.name.text === name)
    assert.equal(declarations.length, 1, name + ' declaration exists exactly once in ' + file)
    return declarations[0].initializer.getText(ast)
  }
  // U-E changes only one Tester scenario hint, one existing Tester evidence sentence,
  // and appends one suggested skill. Restore pinned historical lines before hashing;
  // every unrelated byte remains checked against the original GSA3 fingerprints.
  const historicalUESourceLines = {
    testerHarness: "      'SCENARIO DISCOVERY: prefer the ChatGPT-installed scenario-tester named in suggested_host_skills (not GSA load_skill). Activate/read the actual host skill through an available ChatGPT Skills surface and confirm availability before claiming it was loaded. If not exposed, mark SCENARIO_SKILL_NOT_LOADED, use available testing-evidence only for supported checks and report any uncovered scenario testing as UNVERIFIED. Every repaired revision requires independent Tester rerun of the failing scenario plus impacted passing regressions; look for newly exposed defects, then repeat Tester → Coder → Goal Recheck → Tester until truly PASS or blocked.',",
    testingEvidenceSkill: "      '- PRODUCT_FAILURE: owning Coder repair → exact Goal Recheck for the repaired target → RETEST; same-target Retest is rejected. Tester reruns the failing case and impacted regression matrix. For renewed scenario discovery, invoke the *real* ChatGPT-installed scenario-tester when host availability is confirmed; otherwise mark that coverage UNVERIFIED. Repeat repairs for every within-scope new defect until complete or genuinely blocked.',",
  }
  const hashes = {
    'harness/shared.ts': ['BASE_AGENT_HARNESS', '9746b3061be44cb4'],
    'harness/roles/orchestrator.ts': ['orchestratorHarness', '3c848c01485082f5'],
    'harness/roles/planner.ts': ['plannerHarness', 'c2f8aae581a49ddb'],
    'harness/roles/advisor.ts': ['advisorHarness', '3f3a9b9c771d5829'],
    'harness/roles/designer.ts': ['designerHarness', '7f2bd7dac6889e78'],
    'harness/roles/coder.ts': ['coderHarness', '62ddc891d73b2119'],
    'harness/roles/reviewer.ts': ['reviewerHarness', '05eae8d37351aca9'],
    'harness/roles/critic_reviewer.ts': ['critic_reviewerHarness', '6fc1163ef1c87365'],
    'harness/roles/tester.ts': ['testerHarness', '94d3059a420ded83'],
    'harness/skills/debugging.ts': ['debuggingSkill', '0651a03a3d44eb6a'],
    'harness/skills/critic-review.ts': ['criticReviewSkill', '677983e7d2b00d9a'],
    'harness/skills/critical-challenge.ts': ['criticalChallengeSkill', 'c21c14865ac48584'],
    'harness/skills/job-planning.ts': ['jobPlanningSkill', '70ebb16a8b7e98c8'],
    'harness/skills/coding-loop.ts': ['codingLoopSkill', 'b3fae2ed6ac72e1c'],
    'harness/skills/delegation.ts': ['delegationSkill', 'a3dcb65cddef4908'],
    'harness/skills/planning-review.ts': ['planningReviewSkill', '55c6fa608f72ff5a'],
    'harness/skills/review-evidence.ts': ['reviewEvidenceSkill', '49d8f7a2dbf4760d'],
    'harness/skills/testing-evidence.ts': ['testingEvidenceSkill', 'b5195853a1ddf00b'],
    'harness/skills/tester-lab.ts': ['testerLabSkill', 'afce8f0b9d1caa88'],
    'harness/skills/ui-coder-frontend.ts': ['uiCoderFrontendSkill', 'ac9853bdf04f3ac6'],
    'harness-catalog.ts': ['ROLE_SKILLS', '0d05b22107d15b13'],
  }
  for (const [file, [name, expected]] of Object.entries(hashes)) {
    const initializer = declarationInitializer(file, name)
    const uaRole = ['plannerHarness','coderHarness','reviewerHarness'].includes(name)
    let normalizedRole = uaRole ? initializer.replace(/^      'U-A (?:DECISIONS|CODER|REVIEWER):[^\n]*\n/gm, '') : initializer
    if (uaRole) assert.notEqual(normalizedRole, initializer, 'U-A clause must be exactly present for '+name)
    // GSA4-CLS source-only classification repair is strictly additive to the
    // always-loaded Shared/Role strings. Restore those exact additions before
    // comparing every original pinned initializer byte/hash against GSA3.
    const clsCount=(normalizedRole.match(/^\s*'(?:- )?GSA4-CLS [^\n]*$/gm)??[]).length
    const expectedCLS={BASE_AGENT_HARNESS:1,plannerHarness:1,orchestratorHarness:2,coderHarness:3,critic_reviewerHarness:1}
    assert.equal(clsCount, expectedCLS[name]??0, 'unexpected GSA4-CLS source delta: '+name)
    normalizedRole=normalizedRole.replace(/^\s*'(?:- )?GSA4-CLS [^\n]*\n/gm,'')
    if (historicalUESourceLines[name]) {
      const matcher = name === 'testerHarness'
        ? /^      'SCENARIO DISCOVERY:[^\n]*$/m
        : /^      '- PRODUCT_FAILURE:[^\n]*$/m
      assert.match(normalizedRole,matcher,'U-E exact scope: '+name)
      normalizedRole = normalizedRole.replace(matcher,historicalUESourceLines[name])
    }
    const normalized = name === 'ROLE_SKILLS'
      ? normalizedRole.replace(", 'secretary'", '').replace(", 'simulate'", '')
      : normalizedRole
    const normalizedUF = normalizeUFInitializer(name, normalized)
    const original = name === 'codingLoopSkill' ? normalizeCodingSkillSource(normalizedUF) : normalizedUF
    assert.equal(fnv64(original), expected, name + ' differs from GSA3 baseline (approved U-C delta exempted by exact-byte oracle)')
  }
  assert.equal(fnv64(declarationInitializer('harness-catalog.ts', 'ROLE_HOST_SKILLS')),
    '3afe197634894634', 'host Skill suggestion mapping changed')
  const facade = ts.createSourceFile('harness-catalog.ts', catalogSource,
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const renderer = facade.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'renderHarness')
  assert.ok(renderer, 'public renderHarness remains in the facade')
  assert.equal(fnv64(renderer.getText(facade)), '641a2319574c160b',
    'renderHarness text must remain identical to GSA3')
  const expectedRoles = ['orchestrator','planner','advisor','designer','coder','reviewer','critic_reviewer','tester']
  const expectedSkills = ['debugging','critic-review','critical-challenge','job-planning','coding-loop',
    'delegation','planning-review','review-evidence','testing-evidence','tester-lab','ui-coder-frontend']
  const live = loadSourceModule('harness-catalog.ts')
  assert.equal(JSON.stringify(Object.keys(live.ROLE_HARNESSES)), JSON.stringify(expectedRoles))
  assert.equal(JSON.stringify(Object.keys(live.RUNTIME_SKILLS)), JSON.stringify([...expectedSkills,'secretary','simulate']))
  assert.ok(live.RUNTIME_SKILLS.secretary.body.includes('Human'))
  assert.equal(JSON.stringify(Object.keys(live.ROLE_SKILLS)), JSON.stringify(expectedRoles))
})
