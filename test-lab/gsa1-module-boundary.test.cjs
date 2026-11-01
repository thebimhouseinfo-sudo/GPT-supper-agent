'use strict'
// R-01: source-bound module wiring guard. Runtime parity must be verified later.
const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const ts=require('typescript')
const root=path.join(__dirname,'../supabase/functions/gsa-mcp')
const index=fs.readFileSync(path.join(root,'index.ts'),'utf8')
const owners={
  'project-utils.ts':['knowledgePath','safeProjectName','validIntegrationBranch','isRetiredSourceBranch','parseRetiredBranchRows','resolveProjectCriteriaIntake','projectTaskCapabilityAssessment','projectCriteriaBindingError'],
  'record-handles.ts':['projectHandle','jobHandle','runHandle','uuidv7'],
  'advisor-receipt.ts':['formatAdvisorAdviceReceipt','parseAdvisorAdviceReceipts','projectCriteriaAdvisoryDecision'],
  'platform-utils.ts':['edgeFunctionSlug','normalizeGithubRepo'],
  'execution-guards.ts':['goalRecheckRunMatches','uxFirstTemporaryUiGateRequired','checkpointLeaseExpired','checkpointBoundaryPrerequisiteIds','requiredCheckpointIds'],
  'planning-guards.ts':['validateExecutionTopology','milestoneLoopDecision','normalizeNextPlanningModel','planningLoopContinuationDecision'],
  'bootstrap.ts':['projectBootstrapChecklistDecision','projectBootstrapReadinessDecision']
}
test('GSA1 extracted modules have TypeScript parseable syntax and unique exports',()=>{
  const claimed=new Set()
  for(const [file,names] of Object.entries(owners)){
    const text=fs.readFileSync(path.join(root,file),'utf8')
    const tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
    assert.equal(tree.parseDiagnostics.length,0,file+' parse error')
    for(const name of names){
      assert.ok(!claimed.has(name),'duplicated owner: '+name)
      claimed.add(name)
      assert.match(text,new RegExp('^export function '+name+'\\(','m'))
      assert.doesNotMatch(index,new RegExp('^function '+name+'\\(','m'))
      assert.match(index,new RegExp('\\b'+name+'\\b'))
    }
    assert.match(index,new RegExp("from './"+file.replace(/\./g,'\\.')+"'"))
  }
  assert.equal(ts.createSourceFile('index.ts',index,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS).parseDiagnostics.length,0)
})
test('GSA1-S2 Plan Change and Recovery modules are owned and imported without duplication',()=>{
  const recovery=fs.readFileSync(path.join(root,'recovery-decisions.ts'),'utf8')
  const planning=fs.readFileSync(path.join(root,'plan-change-decisions.ts'),'utf8')
  for(const [file,content] of [['recovery-decisions.ts',recovery],['plan-change-decisions.ts',planning]]){
    const ast=ts.createSourceFile(file,content,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
    assert.equal(ast.parseDiagnostics.length,0,file+' parse failure')
    assert.match(index,new RegExp("from './"+file.replace(/\./g,'\\.')+"'"))
  }
  for(const name of ['sourceMutationRecoveryDecision','orchestrationProgressDecision']){
    assert.match(recovery,new RegExp('^export function '+name+'\\(','m'))
    assert.doesNotMatch(index,new RegExp('^function '+name+'\\(','m'))
  }
  assert.match(planning,/^export function createPlanChangeDecisions\(/m)
  for(const name of ['isRecognizedJobRecordShape','assessHumanPlanChangeJobs',
    'prepareHumanPlanChangeIntent','prepareHumanPlanChangeFenceDecision',
    'validatePlanChangeSupersession','resumeHumanPlanChangeIntent']){
    assert.match(planning,new RegExp('^function '+name+'\\(','m'))
    assert.doesNotMatch(index,new RegExp('^function '+name+'\\(','m'))
  }
  assert.match(index,/createPlanChangeDecisions\(\{ jobExecutionContract,/)
})

test('MCP public tool names retain the pinned static-plus-transition order',()=>{
  const pinned=JSON.parse(fs.readFileSync(path.join(__dirname,'gsa1-tool-name-inventory.json'),'utf8'))
  const positions=[
    ...[...index.matchAll(/server\.registerTool\(\s*['"]([^'"]+)['"]/g)].map(m=>({name:m[1],pos:m.index})),
    ...[...index.matchAll(/transitionTool\(\s*'([^']+)'/g)].map(m=>({name:m[1],pos:m.index}))
  ]
  // Count delegated registrations at their exact entrypoint call positions.
  // Missing/duplicate module tool names or changed order must fail closed.
  const delegatedGroups=[
    ['registerRepositoryEvidenceTools','evidence-repository-tools.ts',[
      'evidence_repository_publish_prepare',
      'evidence_repository_publish_finalize',
      'evidence_repository_probe_verification_prepare']],
    ['registerEvidenceBundleAttestationTool','evidence-bundle-tool.ts',[
      'evidence_bundle_attestation_prepare']],
    ['registerProjectManagementTools','project-management-tools.ts',[
      'project_list',
      'project_create',
      'project_register_repositories']],
    ['registerProjectAuthorizationTools','project-auth-tools.ts',[
      'get_memory_repo_config',
      'set_memory_repo_config',
      'authorize_project_scope',
      'authorize_memory_mutation']]
  ]
  for(const [fn,file,expected] of delegatedGroups){
    const moduleSource=fs.readFileSync(path.join(root,file),'utf8')
    const ast=ts.createSourceFile(file,moduleSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
    assert.equal(ast.parseDiagnostics.length,0,file+' must parse')
    const matches=[...index.matchAll(new RegExp(fn+'\\(\\s*\\{','g'))]
    assert.equal(matches.length,1,fn+' must be invoked exactly once')
    const names=[...moduleSource.matchAll(/server\.registerTool\(\s*['"]([^'"]+)['"]/g)].map(m=>m[1])
    assert.deepEqual(names,expected,file+' tool inventory changed')
    assert.ok(index.includes("from './"+file+"'"),file+' import absent')
    names.forEach((name,i)=>positions.push({name,pos:matches[0].index+i/10000}))
  }
  const names=positions.sort((a,b)=>a.pos-b.pos).map(x=>x.name)
  assert.deepEqual(names,pinned.names)
  assert.equal(new Set(names).size,names.length)
  assert.equal(names.length,58)
})
