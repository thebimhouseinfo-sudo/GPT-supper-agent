'use strict';
// Exact-source tests for the Planner critical challenge runtime skill.
// Prompt-contract evidence only; these tests do not prove LLM behavior in production.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync('supabase/functions/gsa-mcp/index.ts','utf8');
const sf=ts.createSourceFile('index.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
assert.equal(sf.parseDiagnostics.length,0,'Runtime source must parse');

function sourceConstant(name) {
 const decl=sf.statements.filter(ts.isVariableStatement)
   .flatMap(s=>[...s.declarationList.declarations])
   .filter(d=>ts.isIdentifier(d.name)&&d.name.text===name);
 assert.equal(decl.length,1,'exactly one '+name);
 const js=ts.transpileModule('module.exports='+decl[0].initializer.getText(sf)+';',{
   compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}
 }).outputText;
 return vm.runInNewContext(js,{module:{exports:null}});
}
const skills=sourceConstant('RUNTIME_SKILLS');
const roleSkills=sourceConstant('ROLE_SKILLS');
const roles=sourceConstant('ROLE_HARNESSES');
const id='critical-challenge';
function checkSkillContract(body){
 for(const fragment of [
  'SEPARATE GOAL FROM SOLUTION',
  'CHALLENGE THE KEY PREMISE',
  'CONFIRMED POSSIBLE',
  'CONFIRMED IMPOSSIBLE requires a bounded denial/proof',
  'UNKNOWN',
  'not impossible',
  'source patch is not proof',
  'maintenance',
  'no-build',
  'not Technical Advisor',
  'do not silently edit approved Criteria',
  'do not reflexively disagree',
  'GSA-side payload reduction'
 ]) assert.ok(body.toLowerCase().includes(fragment.toLowerCase()),'missing: '+fragment);
}
test('Planner is the only GSA role offered critical-challenge by default',()=>{
 assert.ok(roleSkills.planner.includes(id),'Planner default suggestion');
 for(const [role,list] of Object.entries(roleSkills)) {
   if(role!=='planner')assert.ok(!list.includes(id),'no additional gate or new role for '+role);
 }
 assert.ok(roles.planner.loop.join('\n').includes('CRITICAL CHALLENGE'));
 assert.ok(!roles.advisor.loop.join('\n').includes('SEPARATE GOAL FROM SOLUTION'));
});
test('critical-challenge is a loadable GSA runtime skill, not just an unconnected file',()=>{
 assert.ok(skills[id]);
 assert.ok(skills[id].description.includes('Planner'));
 checkSkillContract(skills[id].body);
 assert.ok(source.includes("'ui-coder-frontend','critical-challenge']"));
 assert.match(source,/Object\.entries\(RUNTIME_SKILLS\)/);
 assert.match(source,/const skill = RUNTIME_SKILLS\[name\]/);
});
test('Planner skill questions proposed HOW without usurping Human WHAT or activating Advisor',()=>{
 const s=skills[id].body;
 for(const text of ['Human-owned WHAT/WHY','Do not reflexively disagree','Only actual initial/material Criteria approval/change triggers Advisor','the final product choice to Human'])assert.ok(s.includes(text),text);
 assert.ok(!roleSkills.reviewer.includes(id));
 assert.ok(!roleSkills.critic_reviewer.includes(id));
});
test('negative control fails when evidence discipline is deliberately removed',()=>{
 const invalid=skills[id].body.replace('CONFIRMED IMPOSSIBLE requires a bounded denial/proof','CONFIRMED IMPOSSIBLE is a guess');
 assert.notEqual(invalid,skills[id].body);
 assert.throws(()=>checkSkillContract(invalid),assert.AssertionError);
});
test('negative control fails when default role wiring disappears',()=>{
 const invalid=roleSkills.planner.filter(s=>s!==id);
 assert.ok(!invalid.includes(id));
 assert.throws(()=>assert.ok(invalid.includes(id)),assert.AssertionError);
});
