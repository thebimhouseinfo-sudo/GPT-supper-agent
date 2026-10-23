'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const ts=require('typescript')
const vm=require('node:vm')
const source=fs.readFileSync('supabase/functions/gsa-mcp/index.ts','utf8')
const tree=ts.createSourceFile('index.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
assert.equal(tree.parseDiagnostics.length,0,'runtime must parse')
const f=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='projectBootstrapChecklistDecision')
assert.ok(f,'bootstrap coordinator exists in runtime')
const fn=ts.transpileModule(f.getText(tree),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
const route=vm.runInNewContext(fn+'\nprojectBootstrapChecklistDecision')
const PASS={status:'PASS'}
const IN_PROGRESS={status:'IN_PROGRESS'}
const NEED_HUMAN={status:'NEED_HUMAN'}
const complete={criteria:PASS,plan:PASS,milestones:PASS,capabilities:PASS}
const b=(checklist={},rest={})=>route({project_context:'BROWNFIELD',checklist,...rest})
const g=(checklist={},rest={})=>route({project_context:'GREENFIELD',checklist,...rest})
const keep={existing_approved:true,human_update_choice:'KEEP'}

test('greenfield starts Criteria investigation with no invented PASS or Job gate',()=>{
 const d=g()
 assert.equal(d.next_action,'INSPECT_CRITERIA')
 assert.equal(d.human_question,null)
 assert.equal(d.continue_same_turn,true)
 assert.equal(d.completed,0)
 assert.equal(d.total,4)
 assert.equal(d.source_write_authorized,false)
})
test('brownfield approved Criteria asks owner once before changing anything',()=>{
 const d=b({criteria:PASS},{criteria_intake:{existing_approved:true}})
 assert.equal(d.next_action,'ASK_HUMAN')
 assert.match(d.human_question,/cập nhật/)
 assert.equal(d.continue_same_turn,false)
 const next=b({criteria:PASS},{criteria_intake:keep})
 assert.equal(next.next_action,'PLAN_CRL')
 assert.equal(next.human_question,null)
})
test('retained legacy Criteria is not reformatted or blocked',()=>{
 const x=b({criteria:PASS,plan:PASS},{criteria_intake:keep})
 assert.equal(x.next_action,'MILESTONES_CRL')
 assert.equal(x.completed,2)
 assert.equal(x.checklist[0].status,'PASS')
})
test('Human update request produces draft then Advisor only before Criteria write',()=>{
 const x=b({criteria:PASS},{criteria_intake:{existing_approved:true,human_update_choice:'UPDATE'}})
 assert.equal(x.next_action,'PREPARE_CRITERIA_REVISION')
 assert.match(x.instruction,/Technical Advisor/)
 assert.equal(x.next_owner,'planner')
 assert.equal(x.human_question,null)
})
test('greenfield Criteria draft requires Human, but not premature Advisor activation',()=>{
 const x=g({criteria:{...NEED_HUMAN,observation:'Chọn GOAL nào?'}})
 assert.equal(x.next_action,'ASK_HUMAN')
 assert.equal(x.human_question,'Chọn GOAL nào?')
})
test('Plan auto CRL instead of Human approval',()=>{
 const x=b({criteria:PASS,plan:IN_PROGRESS},{criteria_intake:keep})
 assert.equal(x.next_action,'PLAN_CRL')
 assert.match(x.instruction,/Critic Reviewer/)
 assert.equal(x.continue_same_turn,true)
})
test('Milestones auto CRL without restarting Plan',()=>{
 const x=b({criteria:PASS,plan:PASS,milestones:IN_PROGRESS},{criteria_intake:keep})
 assert.equal(x.next_action,'MILESTONES_CRL')
 assert.equal(x.completed,2)
})
test('Coder Tester capability preparation is automatic, not extra metadata gate',()=>{
 const x=b({criteria:PASS,plan:PASS,milestones:PASS},{criteria_intake:keep})
 assert.equal(x.next_action,'PREPARE_CODER_TESTER')
 assert.match(x.instruction,/skills/)
 assert.equal(x.human_question,null)
})
test('conflicting Plans are investigated before Human interruption',()=>{
 const conflict={item:'plan',candidates:['Plan A','Plan B'],unresolved:true,investigated:false}
 const x=b({criteria:PASS,plan:IN_PROGRESS},{criteria_intake:keep,conflicts:[conflict]})
 assert.equal(x.next_action,'INVESTIGATE_SOURCES')
 assert.equal(x.human_question,null)
 assert.equal(x.continue_same_turn,true)
})
test('irreconcilable, investigated Plan conflict reports alternatives and asks Human',()=>{
 const conflict={item:'plan',candidates:['Plan A','Plan B'],unresolved:true,investigated:true}
 const x=b({criteria:PASS,plan:IN_PROGRESS},{criteria_intake:keep,conflicts:[conflict]})
 assert.equal(x.next_action,'ASK_HUMAN')
 assert.match(x.human_question,/Plan A/)
 assert.match(x.human_question,/Plan B/)
 assert.equal(x.status,'NEED_HUMAN')
})
test('a reported NEED_HUMAN in coding capability is not accepted without evidence',()=>{
 const x=b({criteria:PASS,plan:PASS,milestones:PASS,capabilities:NEED_HUMAN},{criteria_intake:keep})
 assert.equal(x.next_action,'VERIFY_BLOCKER')
 assert.equal(x.human_question,null)
})
test('complete checklist prepares READY, but never source authorization',()=>{
 const x=b(complete,{criteria_intake:keep})
 assert.equal(x.next_action,'BOOTSTRAP_READY')
 assert.equal(x.status,'BOOTSTRAP_READY')
 assert.equal(x.completed,4)
 assert.equal(x.continue_same_turn,false)
 assert.equal(x.source_write_authorized,false)
 assert.equal(x.requires_external_readback,true)
})
test('runtime exposes coordinator tool and self-driving bootstrap harness',()=>{
 assert.match(source,/'project_bootstrap_checklist_prepare'/)
 assert.match(source,/follow next_action immediately in the SAME TURN/)
 assert.match(source,/TASK operation, never an additional Bootstrap gate/)
 const guide=fs.readFileSync('skills/gsa-job-runtime/SKILL.md','utf8')
 assert.match(guide,/Autonomous Bootstrap checklist/)
 assert.match(guide,/run[s]? \*\*CRL\*\*/)
})
