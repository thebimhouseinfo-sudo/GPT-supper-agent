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
const names = ['debugging','critic-review','critical-challenge','job-planning','coding-loop',
  'delegation','planning-review','review-evidence','testing-evidence','tester-lab','ui-coder-frontend']
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
test('GSA3 catalog keeps all 11 discoverable skills, exact names and source-owned bodies', async () => {
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
  const descriptionChars=result.structuredContent.skills.reduce((n,x)=>n+x.description.length,0)
  assert.ok(descriptionChars < 1100, 'catalog description payload must be smaller than GSA2 1558-char baseline')
  assert.ok(1558-descriptionChars >= 400)
  console.log('GSA3_SOURCE_CATALOG_PROXY '+JSON.stringify({
    gsa2_description_chars:1558,gsa3_description_chars:descriptionChars,
    saved_chars:1558-descriptionChars,host_model_tokens:'UNKNOWN'
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
