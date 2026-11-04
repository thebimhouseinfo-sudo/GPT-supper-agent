'use strict'
const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const vm=require('node:vm')
const ts=require('typescript')
const ledger=fs.readFileSync('docs/process/GSA-WORKFLOW-LESSONS-LEDGER.md','utf8')
const source=fs.readFileSync('supabase/functions/gsa-mcp/bootstrap.ts','utf8')
const ast=ts.createSourceFile('bootstrap.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
const decl=ast.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='projectBootstrapReadinessDecision')
assert.ok(decl,'current Bootstrap validator must exist')
const code=ts.transpileModule(decl.getText(ast).replace(/^export\s+/,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
const pid='0fa72d63-17b4-4e28-84d9-231a17f5fe70'
const sha='a'.repeat(40)
const binding={criteria_path:'projects/'+pid+'/CRITERIA.md',criteria_blob_sha:sha,approval_status:'APPROVED'}
const checkBinding=(_pid,_kind,c)=>!c||c.criteria_blob_sha!==sha?'INVALID':null
const validate=vm.runInNewContext(code+'\nprojectBootstrapReadinessDecision',{projectCriteriaBindingError:checkBinding})
const task='design'
const sourcePlan={planning_revision:1,planning_review:{status:'PASS',reviewed_revision:1},
  tasks:[{task_id:task,completion_criteria:['Testable']}],
  milestones:[{milestone_id:'m1',node_ids:[task]}]}
const base={criteria:binding,criteria_human_approved:true,criteria_current_blob_sha:sha,
  plan:sourcePlan,capabilities:[{task_id:task,readiness:'GENERIC_READY'}],human_execution_approved:true}

test('LLC61 ledger is distinct: prior WL-034 and WL-035 remain unique',()=>{
  assert.equal((ledger.match(/^\| WL-034 \|/gm)||[]).length,1)
  assert.equal((ledger.match(/^\| WL-035 \|/gm)||[]).length,1)
  assert.equal((ledger.match(/^## LLC61 —/gm)||[]).length,1)
  assert.match(ledger,/ROOT_CAUSE_UNVERIFIED \/ NO_RUNTIME_FIX/)
  assert.match(ledger,/PLAN_CRITERIA_MISMATCH/)
  assert.match(ledger,/BOOTSTRAP_REQUIRED/)
})

test('LLC61 positive: existing reviewed source Plan can pass current four-check Bootstrap assessment',()=>{
  const outcome=validate(pid,base)
  assert.match(outcome.status,/BOOTSTRAP_READY/)
  assert.equal(outcome.source_write_authorized,false,'PREPARE never grants code-write authority')
})

test('LLC61 negatives: genuinely stale Criteria or a mismatched typed PROJECT_PLAN cannot pass',()=>{
  assert.equal(validate(pid,{...base,criteria_current_blob_sha:'b'.repeat(40)}).status,'CRITERIA_STALE_OR_UNVERIFIED')
  assert.equal(validate(pid,{...base,plan:{...sourcePlan,plan_kind:'PROJECT_PLAN',
    criteria_binding:{...binding,criteria_blob_sha:'b'.repeat(40)}}}).status,'PLAN_CRITERIA_MISMATCH')
  assert.equal(validate(pid,{...base,criteria_human_approved:false}).status,'CRITERIA_HUMAN_APPROVAL_UNVERIFIED')
  assert.equal(validate(pid,{...base,human_execution_approved:false}).source_write_authorized,false)
})
