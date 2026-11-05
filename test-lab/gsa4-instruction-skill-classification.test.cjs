'use strict'
// GSA4-CLS mandatory Role/Workflow contracts and progressive method separation.
// SOURCE-EXECUTED assertions only: NOT proof that model autonomously reads/writes,
// that GitHub DEC persistence happened, or that a live U-F dispatch guard exists.
const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {loadSourceModule} = require('./helpers/harness-ts-loader.cjs')
const root = path.join(__dirname, '../supabase/functions/gsa-mcp')
const roles=['orchestrator','planner','advisor','designer','coder','reviewer','critic_reviewer','tester']
const catalog=loadSourceModule('harness-catalog.ts')
const handlerSource=loadSourceModule('harness-skill-tools.ts')
const {ROLE_HARNESSES,ROLE_SKILLS,ROLE_HOST_SKILLS,RUNTIME_SKILLS,BASE_AGENT_HARNESS,renderHarness}=catalog
const chain=new Proxy({},{get:()=>()=>chain})
const z=new Proxy({},{get:()=>()=>chain})
function tools(authorized=true) {
  const t={}
  handlerSource.registerHarnessSkillTools({
    server:{registerTool:(name,definition,handler)=>{t[name]={definition,handler}}},
    z, req:{}, AUTH_SCOPES:['gsa'], authContext:async()=>authorized?{id:'test-user'}:null,
    authError:()=>({isError:true,content:[{type:'text',text:'AUTH_REQUIRED'}]}),
    ROLE_HARNESSES,ROLE_SKILLS,ROLE_HOST_SKILLS,RUNTIME_SKILLS,renderHarness
  })
  return t
}
function exact(r) {
  assert.ok(r.structuredContent)
  assert.equal(r.content[0].text,JSON.stringify(r.structuredContent))
}
test('CLS-00: 8 independently entered Roles receive universal accepted-decision duty WITHOUT Secretary Skill',async()=>{
  assert.deepEqual(Object.keys(ROLE_HARNESSES),roles)
  assert.equal(Object.keys(RUNTIME_SKILLS).length,13)
  assert.match(BASE_AGENT_HARNESS,/GSA4-CLS ACCEPTED PROJECT DECISION \(ALL ROLES\)/)
  assert.match(BASE_AGENT_HARNESS,/WHAT\/WHY\/HOW/)
  assert.match(BASE_AGENT_HARNESS,/forbidden alternatives/)
  assert.match(BASE_AGENT_HARNESS,/NOT_SAVED/)
  assert.match(BASE_AGENT_HARNESS,/Read-only Roles gain no Memory\/source-write right/)
  const t=tools()
  for(const role of roles){
    const r=await t.get_agent_harness.handler({role,mode:'JOB'})
    exact(r)
    assert.equal(r.structuredContent.harness_text,renderHarness(role,{includeProgressiveSkills:false}))
    assert.match(r.structuredContent.harness_text,/GSA4-CLS ACCEPTED PROJECT DECISION \(ALL ROLES\)/,role)
    assert.doesNotMatch(r.structuredContent.harness_text,/# Decision Secretary — On Demand/,role)
    assert.equal(JSON.stringify(r.structuredContent.suggested_skills),JSON.stringify(ROLE_SKILLS[role]??[]))
  }
})
test('CLS-01: accepted decision accountability vs optional method and host permissions',async()=>{
  const shared=renderHarness('reviewer',{includeProgressiveSkills:false})
  assert.match(shared,/Human explicitly accepts or corrects a concrete decision for the identified active Project/)
  assert.match(shared,/do not reduce it to a topic summary/)
  assert.match(shared,/Do not create a Decision or Discussion Job for brainstorming/)
  assert.match(shared,/only after authorized Project Memory DEC persistence and independent exact path\/blob-SHA readback/)
  assert.match(shared,/Read-only Roles gain no Memory\/source-write right/)
  for(const role of ['planner','orchestrator']){
    assert.match(renderHarness(role,{includeProgressiveSkills:false}),/GSA4-CLS (?:PLANNER DECISION OWNER|DECISION HANDOFF OWNER)/)
  }
  const t=tools()
  const load=await t.load_skill.handler({name:'secretary'})
  exact(load)
  assert.match(load.structuredContent.skill_text,/SUPERSEDES/)
  assert.match(load.structuredContent.skill_text,/authorize_memory_mutation/)
  assert.doesNotMatch(renderHarness('planner',{includeProgressiveSkills:false}),/# Decision Secretary — On Demand/)
})
test('CLS-02: U-D source-changing descriptive proposal remains Coder duty while CR is authorization-gated',()=>{
  const r=renderHarness('coder',{includeProgressiveSkills:false})
  assert.match(r,/GSA4-CLS PRE-CODE BP-05/)
  assert.match(r,/application-source changes/)
  assert.match(r,/BEFORE any applicable source write/)
  assert.match(r,/even without coding-loop Skill/)
  assert.match(r,/Independent PRE_CODE_TECHNICAL Critic may run ONLY on direct Human cr\/crl or exact Human-preauthorized milestone/)
  assert.match(r,/no new global Critic gate/)
  assert.doesNotMatch(r,/# Coding Loop/)
  assert.match(RUNTIME_SKILLS['coding-loop'].body,/CREATE \| MODIFY \| REUSE_AS_IS \| KEEP \| REMOVE/)
  const critic=renderHarness('critic_reviewer',{includeProgressiveSkills:false})
  assert.match(critic,/GSA4-CLS U-D CR SUBJECT/)
  assert.match(critic,/GENERAL Critic Verification cannot prove PRE_CODE completion/)
  assert.match(critic,/prior Reviewer verdict is examined LAST/)
  assert.match(RUNTIME_SKILLS['critic-review'].body,/PRE_CODE_TECHNICAL \(U-D\)/)
})
test('CLS-03: no-Skill Coder and Orchestrator know U-F 3-cycle stop; Host UNVERIFIED is not counted',()=>{
  const coder=renderHarness('coder',{includeProgressiveSkills:false})
  const orc=renderHarness('orchestrator',{includeProgressiveSkills:false})
  assert.match(coder,/GSA4-CLS U-F SAME-DEFECT LIMIT/)
  assert.match(coder,/THIRD/)
  assert.match(coder,/STOP ordinary patch #4/)
  assert.match(coder,/incomplete history cannot justify an unexamined retry/)
  assert.match(orc,/GSA4-CLS U-F DEFECT STOP/)
  assert.match(orc,/Three complete same-defect PRODUCT_FAILURE cycles STOP ordinary patch #4/)
  assert.match(orc,/Host UNVERIFIED or incomplete history/)
  assert.match(RUNTIME_SKILLS['debugging'].body,/FIRST/)
  // Explicitly disallow claiming a mechanical guard from Role text alone.
  const pureHelper=fs.readFileSync(path.join(root,'harness/skills/retest-history.ts'),'utf8')
  assert.match(pureHelper,/advisory_only: true/)
  assert.match(pureHelper,/history_complete: boolean/)
})
test('CLS-04: DEV and user-owned OPERATION scope retained without unconditional CAD Skill',()=>{
  const s=renderHarness('coder',{includeProgressiveSkills:false})
  assert.match(s,/GSA4-CLS DEV\/OPERATION AUTHORITY/)
  assert.match(s,/internal source, Project Memory and Job\/Run control records retain existing Git branch\/SHA-CAS\/cursor permissions/)
  assert.match(s,/Human\/Host-owned operational files/)
  assert.match(s,/denied Host operations/)
  assert.match(RUNTIME_SKILLS['coding-loop'].body,/DEV \/ OPERATION ARTIFACTS/)
})
test('CLS-05: unchanged 8-Role+13-Skill tool contracts, optional body and required NEXT UI Skill path',async()=>{
  const t=tools()
  const catalogResponse=await t.get_skill_catalog.handler()
  exact(catalogResponse)
  assert.equal(catalogResponse.structuredContent.skills.length,13)
  for(const role of roles){
    const r=await t.get_agent_harness.handler({role,mode:'DIRECT_AGENT'})
    exact(r)
    assert.equal(r.structuredContent.harness_text,renderHarness(role,{includeProgressiveSkills:false}))
  }
  const none=await t.load_skill.handler({name:'not-registered'})
  assert.equal(none.isError,true)
  const denied=await tools(false).get_agent_harness.handler({role:'planner',mode:'JOB'})
  assert.equal(denied.isError,true)
  const prepare=fs.readFileSync(path.join(root,'job-prepare-tool.ts'),'utf8')
  assert.match(prepare,/required_skills: z\.array\(z\.enum\(\['ui-coder-frontend'\]\)\)/)
  const begin=fs.readFileSync(path.join(root,'run/run-begin.ts'),'utf8')
  assert.match(begin,/required_skill_contexts/)
  const preview=fs.readFileSync(path.join(root,'selective-harness-preview.ts'),'utf8')
  assert.match(preview,/NOT wired|not wired|read-only preview/i)
})
test('CLS-06: GENERAL CR focus is caller-controlled; guard may NOT be falsely claimed',()=>{
  const source=fs.readFileSync(path.join(root,'critic-review-tools.ts'),'utf8')
  assert.match(source,/review_focus: z\.enum\(\['GENERAL','PRE_CODE_TECHNICAL'\]\)\.optional\(\)/)
  assert.match(source,/if \(review_focus === 'PRE_CODE_TECHNICAL' && \['PASS','PASS_WITH_FINDINGS'\]\.includes\(result\)\)/)
  assert.match(source,/preCodeTechnicalError\(pre_code_review\)/)
  // No durable trusted completion-consumer binding can be inferred from optional focus.
  assert.match(renderHarness('critic_reviewer',{includeProgressiveSkills:false}),/caller-provided review_focus\/target_ref do not authenticate subject/)
})
