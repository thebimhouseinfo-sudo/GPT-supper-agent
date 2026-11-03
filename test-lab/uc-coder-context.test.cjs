'use strict'
// U-C: source-executed Coder skill contract; policy assertions do not prove model compliance.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const dir = path.join(__dirname, '../supabase/functions/gsa-mcp')
function moduleFrom(name) {
  const source = fs.readFileSync(path.join(dir, name), 'utf8')
  const parsed = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  assert.equal(parsed.parseDiagnostics.length, 0)
  const out = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  })
  assert.equal((out.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0)
  const mod = { exports: {} }
  vm.runInNewContext(out.outputText, { module: mod, exports: mod.exports }, { timeout: 2500 })
  return mod.exports
}
const catalog = moduleFrom('harness-catalog.ts')
const { registerHarnessSkillTools } = moduleFrom('harness-skill-tools.ts')
const chain = new Proxy({}, { get: () => () => chain })
const z = new Proxy({}, { get: () => () => chain })
function getTools(authorized = true) {
  const tools = {}
  registerHarnessSkillTools({
    server: { registerTool: (name, definition, handler) => { tools[name] = handler } },
    z, req: {}, AUTH_SCOPES: ['gsa'],
    authContext: async () => authorized ? { id: 'test' } : null,
    authError: () => ({ isError: true, content: [{type: 'text', text: 'AUTH_REQUIRED'}] }),
    ...catalog,
  })
  return tools
}
const skill = catalog.RUNTIME_SKILLS['coding-loop'].body

test('UC-01: existing Coder skill is loaded on demand, not added to bundled role text', async () => {
  assert.deepEqual(Array.from(catalog.ROLE_SKILLS.coder), ['coding-loop','delegation'])
  const tools = getTools()
  const r = await tools.get_agent_harness({ role: 'coder', mode: 'JOB' })
  assert.deepEqual(Array.from(r.structuredContent.suggested_skills), ['coding-loop','delegation'])
  assert.doesNotMatch(r.structuredContent.harness_text, /ARTIFACT OWNERSHIP:/)
  const listed = await tools.get_skill_catalog()
  const entry = listed.structuredContent.skills.find(x => x.name === 'coding-loop')
  assert.ok(entry)
  assert.equal(entry.skill_text, undefined)
  const loaded = await tools.load_skill({ name: 'coding-loop' })
  assert.equal(loaded.structuredContent.skill_text, skill)
  assert.equal(loaded.content[0].text, JSON.stringify(loaded.structuredContent))
})
test('UC-02: domain questions are exceptional; implementation HOW remains Coder-owned', () => {
  assert.match(skill, /approved professional\/domain outcome and actual host behavior/)
  assert.match(skill, /Choose routine implementation HOW independently/)
  assert.match(skill, /only for a specific consequential operational\/domain\/host decision still missing/)
  assert.match(skill, /Do not re-ask answered facts/)
  assert.match(skill, /Do not.*new approval gate/)
})
test('UC-03: source CAS remains DEV; Human deliverables retain approved native workflows', () => {
  assert.match(skill, /DEV internal source, Git SHA\/CAS, Job cursor/)
  assert.match(skill, /source authorization, compare-and-swap and readback/)
  assert.match(skill, /OPERATION Human-owned outputs such as Temp\/Custom Job, JOB.md, LISP\/scripts, CAD\/DWG\/DOCX/)
  assert.match(skill, /Preserve approved deliverable names and native Open\/Edit\/Save\/Load\/Export\/Import\/reload/)
  assert.match(skill, /do not require a persistent UUID, hash, internal registry or promotion/)
  assert.match(skill, /unless the approved contract explicitly demands it/)
})
test('UC-03 negative: host BAK and DWL are not interchangeable', () => {
  assert.match(skill, /BAK backups, DWL\/DWL2 lock files, caches and Run artifacts/)
  assert.match(skill, /do not equate their lifecycles/)
  assert.match(skill, /identity collisions only when a real unresolved collision materially changes/)
})
test('existing source security and role scope stay authoritative', () => {
  assert.match(catalog.ROLE_HARNESSES.coder.authority.join(' '), /Implement only approved Project-owned source/)
  assert.match(catalog.ROLE_HARNESSES.coder.loop.join(' '), /DEVELOPMENT BRANCH/)
  assert.match(skill, /For NEXT consequential source commits/)
  assert.match(skill, /Never mutate when the intent was only prepared but not read back/)
  assert.equal(Object.keys(catalog.RUNTIME_SKILLS).length, 11)
})
test('negative permission: unauthenticated skill/harness calls fail', async () => {
  const tools = getTools(false)
  for (const [name, args] of [
    ['get_skill_catalog', undefined],
    ['load_skill', { name: 'coding-loop' }],
    ['get_agent_harness', { role: 'coder', mode: 'JOB' }],
  ]) {
    const result = await tools[name](args)
    assert.equal(result.isError, true)
    assert.equal(result.structuredContent, undefined)
  }
})
