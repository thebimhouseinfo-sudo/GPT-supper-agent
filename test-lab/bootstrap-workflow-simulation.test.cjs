'use strict'
// Source-bound Bootstrap workflow simulation using ACTUAL ephemeral document files.
// Reviewer/CR here are deterministic test doubles, not model-executed independent CRL.
const { test }=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const code=fs.readFileSync(path.join(__dirname,'../supabase/functions/gsa-mcp/bootstrap.ts'),'utf8')
const tree=ts.createSourceFile('bootstrap.ts',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
assert.equal(tree.parseDiagnostics.length,0)
const declaration=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='projectBootstrapChecklistDecision')
assert.ok(declaration)
const transpiled=ts.transpileModule(declaration.getText(tree).replace(/^export\s+/, ''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
const decide=vm.runInNewContext(transpiled+'\nprojectBootstrapChecklistDecision')
const copy=o=>JSON.parse(JSON.stringify(o))
function validatePlan(criteria,plan) {
 const goal=criteria.match(/^GOAL: (.+)$/m)?.[1]
 return Boolean(goal&&plan.includes('GOAL: '+goal)&&plan.includes('PHASE 1')&&plan.includes('ACCEPTANCE'))
}
function validateMilestones(plan,milestones) {
 return Boolean(validatePlan('GOAL: '+plan.match(/^GOAL: (.+)$/m)?.[1],plan)&&milestones.includes('PHASE 1')&&milestones.includes('M1:'))
}
function runScenario(kind,{preexisting=false,conflicting=false}={}) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gsa-checklist-'))
 const file=name=>path.join(dir,name)
 const write=(name,data)=>fs.writeFileSync(file(name),data)
 const read=name=>fs.readFileSync(file(name),'utf8')
 const exists=name=>fs.existsSync(file(name))
 const goal='Create a safe project Bootstrap flow'
 let humanTurns=0,criticCalls=0,reviewerCalls=0,steps=[],prev=null
 let ctx={project_context:kind,checklist:{},criteria_intake:{}}
 if(preexisting){
  write('CRITERIA.md','GOAL: '+goal+'\nHuman approved: YES\n')
  ctx.checklist.criteria={status:'PASS',observation:'Read Criteria: '+read('CRITERIA.md').trim()}
  ctx.criteria_intake.existing_approved=true
 }
 if(conflicting) {
  write('PLAN-A.md','GOAL: '+goal+'\nPHASE 1\nACCEPTANCE\n')
  write('PLAN-B.md','GOAL: Alternative product not approved\nPHASE 1\nACCEPTANCE\n')
  ctx.conflicts=[{item:'plan',candidates:['PLAN-A.md','PLAN-B.md'],unresolved:true,investigated:false}]
 }
 try{
  for(let step=0;step<18;step++){
   const output=decide({...ctx,previous_attempt:prev})
   steps.push(output.next_action)
   if(output.next_action==='BOOTSTRAP_READY'){
    assert.equal(output.completed,4)
    assert.ok(exists('CRITERIA.md')&&exists('PLAN.md')&&exists('MILESTONES.md')&&exists('SKILL.md'))
    assert.ok(validatePlan(read('CRITERIA.md'),read('PLAN.md')))
    assert.ok(validateMilestones(read('PLAN.md'),read('MILESTONES.md')))
    return {kind,steps,humanTurns,reviewerCalls,criticCalls,result:output.next_action}
   }
   assert.notEqual(output.next_action,'REPORT_BLOCKER','must progress on each completed action')
   prev={action:output.next_action,signature:output.progress_signature}
   switch(output.next_action){
    case 'INSPECT_CRITERIA':
      if(kind==='GREENFIELD'){
        ctx.checklist.criteria={status:'IN_PROGRESS'}
      }else throw Error('unplanned inspection')
      break
    case 'PREPARE_CRITERIA_DRAFT':
      write('CRITERIA.md','DRAFT\nGOAL: '+goal+'\n')
      ctx.checklist.criteria={status:'NEED_HUMAN',observation:'Draft Criteria needs Human decision'}
      break
    case 'ASK_HUMAN':
      humanTurns++
      if(output.next_item==='criteria'&&!preexisting){
        write('CRITERIA.md','GOAL: '+goal+'\nHuman approved: YES\n')
        ctx.checklist.criteria={status:'PASS',observation:'Read approved Criteria: '+read('CRITERIA.md').trim()}
      } else if(output.next_item==='criteria'&&preexisting){
        ctx.criteria_intake.human_update_choice='KEEP'
      } else if(output.next_item==='plan'&&conflicting){
        ctx.conflicts[0].unresolved=false
        write('PLAN.md',read('PLAN-A.md'))
      } else throw Error('unexpected Human interruption '+output.next_item)
      break
    case 'INVESTIGATE_SOURCES':
      assert.ok(exists('PLAN-A.md')&&exists('PLAN-B.md'))
      assert.notEqual(read('PLAN-A.md'),read('PLAN-B.md'))
      ctx.conflicts[0].investigated=true
      break
    case 'PLAN_CRL':
      if(!exists('PLAN.md'))write('PLAN.md','GOAL: '+goal+'\nPHASE 1\nACCEPTANCE\n')
      // two independently invoked fixture validators on real file content
      reviewerCalls++; assert.ok(validatePlan(read('CRITERIA.md'),read('PLAN.md')))
      criticCalls++; assert.ok(validatePlan(read('CRITERIA.md'),read('PLAN.md')))
      ctx.checklist.plan={status:'PASS',observation:'Reviewer+Critic test double verified '+read('PLAN.md')}
      break
    case 'MILESTONES_CRL':
      write('MILESTONES.md','PHASE 1\nM1: Goal covered\n')
      reviewerCalls++; assert.ok(validateMilestones(read('PLAN.md'),read('MILESTONES.md')))
      criticCalls++; assert.ok(validateMilestones(read('PLAN.md'),read('MILESTONES.md')))
      ctx.checklist.milestones={status:'PASS',observation:'Reviewer+Critic test double verified '+read('MILESTONES.md')}
      break
    case 'PREPARE_CODER_TESTER':
      write('SKILL.md','Coder skill: TypeScript; Tester skill: Node test')
      assert.ok(read('SKILL.md').includes('Tester'))
      ctx.checklist.capabilities={status:'PASS',observation:'Checked skill file '+read('SKILL.md')}
      break
    case 'VERIFY_EVIDENCE':
      throw Error('all PASS in test must already have observations')
    default:
      throw Error('unhandled action '+output.next_action)
   }
  }
  throw Error('bounded simulation failed to finish')
 } finally {fs.rmSync(dir,{recursive:true,force:true})}
}
test('Greenfield: draft Criteria, one Human approval then actual file Plan/Milestone/skill work',()=>{
 const r=runScenario('GREENFIELD')
 assert.equal(r.result,'BOOTSTRAP_READY')
 assert.equal(r.humanTurns,1)
 assert.equal(r.reviewerCalls,2)
 assert.equal(r.criticCalls,2)
})
test('Brownfield: retains Criteria, one update question, no fake approval or docs gate',()=>{
 const r=runScenario('BROWNFIELD',{preexisting:true})
 assert.equal(r.result,'BOOTSTRAP_READY')
 assert.equal(r.humanTurns,1)
 assert.equal(r.reviewerCalls,2)
 assert.equal(r.criticCalls,2)
})
test('Brownfield conflicting actual Plans: read competing files, Human picks, continue',()=>{
 const r=runScenario('BROWNFIELD',{preexisting:true,conflicting:true})
 assert.equal(r.result,'BOOTSTRAP_READY')
 assert.equal(r.humanTurns,2)
 assert.ok(r.steps.indexOf('INVESTIGATE_SOURCES')<r.steps.lastIndexOf('ASK_HUMAN'))
})
