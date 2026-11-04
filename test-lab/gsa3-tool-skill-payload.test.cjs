'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

// GSA3: source-executed tool/skill response check; NOT ChatGPT host token measurement.
const sourceDir = path.join(__dirname, '../supabase/functions/gsa-mcp')
const { loadSourceModule } = require('./helpers/harness-ts-loader.cjs')
function sourceModule(name) {
  return { exports: loadSourceModule(name), text: fs.readFileSync(path.join(sourceDir, name), 'utf8') }
}
const catalog = sourceModule('harness-catalog.ts')
const handlers = sourceModule('harness-skill-tools.ts')
const originalNames = ['debugging','critic-review','critical-challenge','job-planning','coding-loop',
  'delegation','planning-review','review-evidence','testing-evidence','tester-lab','ui-coder-frontend']
const names = [...originalNames,'secretary']
const roles = ['orchestrator','planner','advisor','designer','coder','reviewer','critic_reviewer','tester']
const { RUNTIME_SKILLS, ROLE_HARNESSES, ROLE_SKILLS, ROLE_HOST_SKILLS, renderHarness } = catalog.exports
const chain = new Proxy({}, { get: () => () => chain })
const z = new Proxy({}, { get: () => () => chain })

function setup(authorized=true) {
  const tools = {}
  handlers.exports.registerHarnessSkillTools({
    server: { registerTool: (name, definition, handler) => { tools[name] = { definition, handler } } },
    z, req: {}, AUTH_SCOPES: ['gsa'], authContext: async () => authorized ? { id: 'test-user' } : null,
    authError: () => ({ isError: true, content: [{type:'text',text:'AUTH_REQUIRED'}] }),
    renderHarness, ROLE_HARNESSES, ROLE_SKILLS, ROLE_HOST_SKILLS, RUNTIME_SKILLS
  })
  return tools
}
function exactFallback(result) {
  assert.ok(result.structuredContent)
  assert.equal(result.content.length, 1)
  assert.equal(result.content[0].type, 'text')
  assert.equal(result.content[0].text, JSON.stringify(result.structuredContent))
}
test('GSA3 original 11 skills remain unchanged; optional U-A Secretary is additive', async () => {
  assert.equal(JSON.stringify(Object.keys(RUNTIME_SKILLS)), JSON.stringify(names))
  const tools=setup()
  const result=await tools.get_skill_catalog.handler()
  exactFallback(result)
  assert.equal(JSON.stringify(result.structuredContent.skills.map(x=>x.name)), JSON.stringify(names))
  for (const item of result.structuredContent.skills) {
    assert.equal(item.description, RUNTIME_SKILLS[item.name].description)
    assert.ok(item.description.length > 30)
    assert.ok(RUNTIME_SKILLS[item.name].body.length > 80)
  }
  const descriptionChars=result.structuredContent.skills.filter(x=>originalNames.includes(x.name)).reduce((n,x)=>n+x.description.length,0)
  assert.ok(result.structuredContent.skills.find(x=>x.name==='secretary')?.description.length>30)
  assert.ok(descriptionChars < 1100, 'catalog description payload must be smaller than GSA2 1558-char baseline')
  assert.ok(1558-descriptionChars >= 400)
  console.log('GSA3_SOURCE_CATALOG_PROXY '+JSON.stringify({
    gsa2_description_chars:1558,gsa3_description_chars:descriptionChars,
    saved_chars:1558-descriptionChars,additive_ua_secretary_description_chars:RUNTIME_SKILLS.secretary.description.length,host_model_tokens:'UNKNOWN'
  }))
})
test('all load_skill tool bodies and metadata still delivered with identical JSON fallback', async () => {
  const tools=setup()
  for (const name of names) {
    const r=await tools.load_skill.handler({name})
    exactFallback(r)
    assert.equal(r.structuredContent.name,name)
    assert.equal(r.structuredContent.description,RUNTIME_SKILLS[name].description)
    assert.equal(r.structuredContent.skill_text,RUNTIME_SKILLS[name].body)
  }
  const bad=await tools.load_skill.handler({name:'not-a-skill'})
  assert.equal(bad.isError,true)
})
test('GSA2 tool-level Harness optimization, metadata and full role fallback remain intact', async () => {
  const tools=setup()
  for (const role of roles) {
    const r=await tools.get_agent_harness.handler({role,mode:'JOB'})
    exactFallback(r)
    assert.equal(r.structuredContent.harness_text,renderHarness(role,{includeProgressiveSkills:false}))
    assert.equal(JSON.stringify(r.structuredContent.suggested_skills),JSON.stringify(ROLE_SKILLS[role] ?? []))
    assert.equal(JSON.stringify(r.structuredContent.canonical_refs),JSON.stringify(ROLE_HARNESSES[role].canonical_refs))
    assert.equal(JSON.stringify(r.structuredContent.suggested_host_skills),JSON.stringify(ROLE_HOST_SKILLS[role] ?? []))
    assert.ok(renderHarness(role).includes('PROGRESSIVE SKILLS'))
  }
})
test('Critic skill removes only redundant consecutive source-reconstruction instruction', () => {
  const body=RUNTIME_SKILLS['critic-review'].body
  assert.match(body,/CR is an independent peer-review path only when Human invokes it/)
  assert.match(body,/Ignore conversation history as evidence/)
  assert.match(body,/durable Project Memory/)
  assert.match(body,/Do not read or rely on the prior Reviewer verdict until independent/)
  assert.match(body,/CR is read-only for source and Job state/)
  assert.match(body,/CR result never mutates Job lifecycle/)
  assert.doesNotMatch(body,/Reconstruct the target only from durable Project Memory/)
  assert.equal((body.match(/^\d+\. /gm)??[]).length,6)
})
test('negative authority: unauthenticated callers never obtain catalog, skill or harness', async () => {
  const tools=setup(false)
  for (const [name,args] of [['get_skill_catalog',undefined],['load_skill',{name:'coding-loop'}],
    ['get_agent_harness',{role:'coder',mode:'JOB'}]]) {
    const r=await tools[name].handler(args)
    assert.equal(r.isError,true)
    assert.equal(r.structuredContent,undefined)
  }
})


test('UC-01: engineering context is scoped to on-demand Coder skill, not every harness or catalog', async () => {
  const tools = setup()
  assert.ok(ROLE_SKILLS.coder.includes('coding-loop'))
  const role = await tools.get_agent_harness.handler({ role: 'coder', mode: 'JOB' })
  exactFallback(role)
  const catalogResponse = await tools.get_skill_catalog.handler()
  exactFallback(catalogResponse)
  const body = RUNTIME_SKILLS['coding-loop'].body
  assert.match(body, /ENGINEERING CONTEXT \/ SOLUTION CLARIFICATION/)
  assert.match(body, /actual approved Goal\/Tasks, complete accepted expert decisions and exceptions/)
  assert.match(body, /real host behavior, direct callers and affected contracts/)
  assert.match(body, /Coder owns ordinary software-engineering HOW/)
  assert.match(body, /Coder is not the Domain Expert/)
  assert.doesNotMatch(role.structuredContent.harness_text, /ENGINEERING CONTEXT \/ SOLUTION CLARIFICATION/)
  assert.doesNotMatch(JSON.stringify(catalogResponse.structuredContent), /complete accepted expert decisions and exceptions/)
  const loaded = await tools.load_skill.handler({ name: 'coding-loop' })
  exactFallback(loaded)
  assert.equal(loaded.structuredContent.skill_text, body)
})

test('UC-02: consequential clarification only, never routine interrogation or new gate', () => {
  const body = RUNTIME_SKILLS['coding-loop'].body
  assert.match(body, /Ask Human once, narrowly, only if an unresolved domain\/host\/operation choice/)
  assert.match(body, /cannot be determined from approved decisions or verified source/)
  assert.match(body, /do not re-ask answered facts, interview for routine coding choices or introduce an extra approval gate/)
  assert.match(body, /Mark material missing evidence UNKNOWN/)
  assert.ok(!Object.keys(ROLE_HARNESSES).includes('domain_expert'), 'no new specialist role')
})

test('UC-03: DEV source protections remain distinct from Human-owned operational artifacts', async () => {
  const body = RUNTIME_SKILLS['coding-loop'].body
  assert.match(body, /classify by phase and purpose, not file extension or creator/)
  assert.match(body, /DEV internal application source.*Git SHA\/CAS, branch, cursor, Reviewer and Tester contracts/)
  assert.match(body, /never relaxes source-write security/)
  assert.match(body, /OPERATION Human-owned deliverables.*Temp\/Custom Job JOB\.md, LISP\/Python scripts and DWG\/DOCX\/DWF\/DWT/)
  assert.match(body, /Open, Edit, Save, Load, Export and Import workflow/)
  assert.match(body, /Never impose an internal Run UUID, content hash, Registry entry, persistent identity, promotion or original source SHA/)
  assert.match(body, /an authorized revised same-name LISP may be reloaded/)
  assert.match(body, /consequential same-name collision or overwrite.*clarify that conflict once/)
  assert.match(body, /recoverable AutoCAD BAK is not equivalent to DWL\/DWL2 lock files/)
  assert.match(body, /OPERATION permissions are not waived/)
  assert.match(body, /stop on denied folders, files or program controls/)
  const denied = await setup(false).load_skill.handler({ name: 'coding-loop' })
  assert.equal(denied.isError, true)
  assert.equal(denied.structuredContent, undefined)
})
