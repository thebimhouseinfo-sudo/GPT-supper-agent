'use strict'
// CX-02 / GSA2: source-executed harness response dedup regression.
// This measures GSA-controlled output only, not actual ChatGPT host token use.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const dir = path.join(__dirname, '../supabase/functions/gsa-mcp')
const catalogSource = fs.readFileSync(path.join(dir, 'harness-catalog.ts'), 'utf8')
const handlerSource = fs.readFileSync(path.join(dir, 'harness-skill-tools.ts'), 'utf8')
const rootSource = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8')
const parsed = ts.createSourceFile('harness-catalog.ts', catalogSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
assert.equal(parsed.parseDiagnostics.length, 0, 'catalog TypeScript must parse')
const translated = ts.transpileModule(catalogSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
})
assert.equal((translated.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0)
const mod = { exports: {} }
vm.runInNewContext(translated.outputText, { module: mod, exports: mod.exports }, { timeout: 2500 })
const { BASE_AGENT_HARNESS, ROLE_HARNESSES, ROLE_SKILLS, renderHarness } = mod.exports
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
