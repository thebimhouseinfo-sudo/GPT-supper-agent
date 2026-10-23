'use strict'
// GSA host-managed scenario-tester registration and self-continuing test-repair routing.
// This checks source/contract semantics; it does not claim that the external ChatGPT Skill was loaded.
const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const ts=require('typescript')
const vm=require('node:vm')
const source=fs.readFileSync('supabase/functions/gsa-mcp/index.ts','utf8')
const runtimeGuide=fs.readFileSync('skills/gsa-job-runtime/SKILL.md','utf8')
const ast=ts.createSourceFile('index.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
assert.equal(ast.parseDiagnostics.length,0,'source must parse')
function decl(name) {
 const x=ast.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations])
   .filter(d=>ts.isIdentifier(d.name)&&d.name.text===name)
 assert.equal(x.length,1,'declaration exists: '+name)
 const js=ts.transpileModule('const '+name+' = '+x[0].initializer.getText(ast)+';\n'+name,{
   compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
 return vm.runInNewContext(js,{})
}
function func(name){
 const f=ast.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name)
 assert.ok(f,'function exists: '+name)
 const js=ts.transpileModule(f.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
 return vm.runInNewContext(js+'\n'+name,{})
}
const native=decl('ROLE_SKILLS')
const host=decl('ROLE_HOST_SKILLS')
const skills=decl('RUNTIME_SKILLS')
const roles=decl('ROLE_HARNESSES')
const checkpoint=func('checkpointVerificationOutcome')
test('Tester suggests native testing-evidence and references actual host-installed scenario-tester by name only',()=>{
 assert.deepEqual(Array.from(native.tester),['testing-evidence'])
 assert.deepEqual(Array.from(host.tester),['scenario-tester'])
 assert.equal(skills['scenario-tester'],undefined,'never duplicate the installed user skill in GSA runtime body')
 assert.ok(skills['testing-evidence'])
})
test('host skill names are exposed separately and never masquerade as native load_skill bodies',()=>{
 assert.match(source,/suggested_host_skills: z\.array\(z\.string\(\)\)/)
 assert.match(source,/suggested_host_skills: ROLE_HOST_SKILLS\[role\] \?\? \[\]/)
 const loadStart=source.indexOf("'load_skill',")
 assert.ok(loadStart>0)
 const loadEnd=source.indexOf("'job_prepare',",loadStart)
 const load=source.slice(loadStart,loadEnd)
 assert.doesNotMatch(load,/scenario-tester/)
})
test('Tester and Orchestrator must attempt genuine host skill activation, no fake loaded claim',()=>{
 const tester=roles.tester.loop.join('\n')
 const orch=roles.orchestrator.loop.join('\n')
 assert.match(tester,/ChatGPT-installed scenario-tester/)
 assert.match(tester,/SCENARIO_SKILL_NOT_LOADED/)
 assert.match(orch,/host-managed scenario-tester/)
 assert.match(orch,/NOT_LOADED/)
 assert.match(runtimeGuide,/ChatGPT, not GSA, owns/)
 assert.match(runtimeGuide,/UNVERIFIED/)
})
test('test failure goes Coder repair Goal Recheck RETEST; new bug loops instead of concluding',()=>{
 const a=checkpoint('FAIL','PRODUCT_FAILURE')
 assert.equal(a.route,'CODER_REPAIR_GOAL_RECHECK_RETEST')
 assert.equal(a.successful,false)
 assert.equal(a.retestRequired,true)
 const b=checkpoint('FAIL','PRODUCT_FAILURE')
 assert.equal(b.route,'CODER_REPAIR_GOAL_RECHECK_RETEST')
 const c=checkpoint('PASS')
 assert.equal(c.route,'CONTINUE')
 assert.equal(c.successful,true)
 assert.match(roles.orchestrator.loop.join('\n'),/Continue after every tool\/result in SAME TURN/)
 assert.match(roles.coder.loop.join('\n'),/SCENARIO REPAIR/)
 assert.match(roles.tester.loop.join('\n'),/look for newly exposed defects/)
})
test('infrastructure failure is not misrouted to product Coder or made PASS',()=>{
 const env=checkpoint('BLOCKED','ENVIRONMENT_FAILURE')
 assert.equal(env.route,'RETEST_WHEN_READY')
 assert.equal(env.successful,false)
 assert.match(runtimeGuide,/UNVERIFIED/)
})
test('new skills do not replace Human source execution authority or Tester read-only scope',()=>{
 assert.match(roles.tester.authority.join(' '),/Source implementation is read-only/)
 assert.match(roles.coder.authority.join(' '),/approved Project-owned source/)
 assert.match(roles.orchestrator.authority.join(' '),/SCENARIO TEST-REPAIR OWNER/)
 assert.match(runtimeGuide,/No merge\/deploy permission/)
})
