'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.join(__dirname, '../supabase/functions/gsa-mcp')
const files = [
  'platform-utils.ts','project-utils.ts','branch-governance.ts',
  'project-manifest-scope.ts','planning-preflight.ts','planning-guards.ts',
]
const fn = new Set([
  'normalizeGithubRepo','validIntegrationBranch','isRetiredSourceBranch',
  'parseRetiredBranchRows','parseWorkingBranchRows','workingBranchWriteError','workingBranchTaskContractError','linksUpstreamJob',
  'workingBranchTransitionError','convergenceCompletionError',
  'parseProjectManifest','projectBootstrapExecutionError','validateExecutionTopology',
])
const vars = new Set(['PROJECT_ID_PATTERN','STATUSES','DISPOSITIONS','SHA','requiredString','strings'])
const snippets = []
for (const file of files) {
  const src = fs.readFileSync(path.join(root,file),'utf8')
  const ast = ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length,0,file + ' syntax')
  for (const node of ast.statements) {
    if (ts.isFunctionDeclaration(node) && fn.has(node.name?.text)) {
      snippets.push(node.getText(ast).replace(/^export\s+/, ''))
    } else if (ts.isVariableStatement(node) &&
      node.declarationList.declarations.some(d => vars.has(d.name.getText(ast)))) {
      snippets.push(node.getText(ast).replace(/^export\s+/, ''))
    }
  }
}
const compiled = ts.transpileModule(snippets.join('\n\n') +
  '\nglobalThis.__tested = { ' + [...fn].join(', ') + ' };', {
  compilerOptions:{ target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS },
}).outputText
const box={URL,console}
vm.runInNewContext(compiled,box,{timeout:3000})
const h=box.__tested
const id='01a0f051-4353-7bff-8edf-46be4b44fd2f'
const repo='https://github.com/thebimhouseinfo-sudo/GPT-supper-agent'
const dev='upgrade/gsa-context-efficiency'
const sha='a'.repeat(40)
const bsha='b'.repeat(40)
const csha='c'.repeat(40)
const record=(branch, task, changes={})=>({
  repository_url:repo,branch,project_id:id,owning_job_id:'job-one',
  owning_task_id:task,purpose:'Task-owned parallel experiment',
  parent_development_branch:dev,release_branch:'main',base_sha:sha,
  development_head_sha:sha,
  integration_target:dev,dependencies:[],owner:'coder',handoff_recipient:'M03',
  closure_owner_job_id:'job-one',closure_owner_task_id:'M03',
  deliverables:['code','evidence'],merge_conditions:['review','CI'],retire_conditions:['not selected'],
  status:'ACTIVE',authorization_ref:'projects/'+id+'/WORK/JOBS/job-one.json',
  ...changes
})
const manifest=(rows=[],retired='')=>
  '---\nproject_id: '+id+'\nname: GSA\nlifecycle: ACTIVE\n'+
  'primary_repo_url: '+repo+'\nrepo_url: '+repo+'\nrepo_mode: SINGLE\n'+
  'development_branch: '+dev+'\nrelease_branch: main\n---\n\n'+
  '## Repositories\n- PRIMARY | OWNED | '+repo+'\n\n'+
  '## Branch Policy (Human-approved)\n- PRIMARY | '+repo+' | development='+dev+' | release=main\n'+
  retired+'\n## Working Branches\n'+rows.map(r=>'- '+JSON.stringify(r)).join('\n')+'\n'
const auth=(text,branch,task='M01',job='job-one')=>
  h.projectBootstrapExecutionError(id,text,null,repo,branch,{job_id:job,task_id:task})
const closed=(branch,task,keep=false)=>record(branch,task,{
  status:'CLOSED',disposition:'MERGED',final_head_sha:sha,
  handoff_ref:'H/M03',closure_evidence_ref:'V/closure',
  review_ref:'V/review',ci_ref:'V/CI',dependencies_verified_ref:'V/dag',
  integration_sha:csha,merge_authorization_ref:'AUTH/merge',
  physical_ref:keep?'PRESENT':'DELETED',
  ...(keep?{preservation_ref:'HUMAN_KEEP',preservation_owner:'Human',
    preservation_reason:'Preserve verified control experiment'}:{}),
})

test('existing Projects keep Development branch behavior, without Working Branch registration',()=>{
  const m=manifest([])
  assert.equal(h.parseProjectManifest(m).working_branches.length,0)
  assert.equal(h.projectBootstrapExecutionError(id,m,null,repo,dev),null)
  assert.match(auth(m,'experiment/unknown'),/SOURCE_BRANCH_INVALID/)
  assert.match(auth(m,'main'),/SOURCE_BRANCH_INVALID/)
})
test('M01 and M02 can mutate distinct authorized Working Branches concurrently',()=>{
  const a=record('task/m01','M01'),b=record('task/m02','M02')
  const m=manifest([a,b])
  assert.equal(auth(m,a.branch,'M01'),null)
  assert.equal(auth(m,b.branch,'M02'),null)
  assert.match(auth(m,a.branch,'M02'),/SOURCE_BRANCH_OWNERSHIP_INVALID/)
  assert.match(auth(m,a.branch,'M01','wrong-job'),/SOURCE_BRANCH_OWNERSHIP_INVALID/)
  assert.match(h.projectBootstrapExecutionError(id,m,null,repo,a.branch),/SOURCE_BRANCH_UNOWNED/)
})
test('unapproved, stale, wrong-repo and closed source branches are rejected',()=>{
  const a=record('task/a','M01',{authorization_ref:null})
  assert.match(auth(manifest([a]),a.branch),/SOURCE_BRANCH_AUTHORIZATION_MISSING/)
  const stale=record('task/a','M01',{parent_development_branch:'old/dev',integration_target:'old/dev'})
  assert.match(auth(manifest([stale]),stale.branch),/SOURCE_BRANCH_STALE/)
  const done=closed('task/a','M01')
  assert.match(auth(manifest([done]),done.branch),/SOURCE_BRANCH_LIFECYCLE_BLOCKED/)
  assert.match(h.projectBootstrapExecutionError(id,manifest([record('task/a','M01')]),null,
    'https://github.com/other/repo','task/a',{job_id:'job-one',task_id:'M01'}),/SOURCE_BRANCH_INVALID/)
})
test('malformed, duplicate or invalid branch registrations fail closed',()=>{
  const a=record('task/a','M01')
  assert.equal(h.parseProjectManifest(manifest([a,a])),null)
  assert.equal(h.parseProjectManifest(manifest([a]).replace('## Working Branches','## Working Branches\n- {not-json}')),null)
  assert.equal(h.parseProjectManifest(manifest([record('main','M01',{branch:'../bad'})])),null)
})
test('a Human-retired branch cannot be reactivated for source writes',()=>{
  const m=manifest([record('task/a','M01')],
    '\n## Retired Branches\n- '+repo+' | branch=task/a | sha='+sha+' | status=RETIRED\n')
  assert.match(auth(m,'task/a'),/SOURCE_BRANCH_RETIRED/)
})
test('branch transition respects authorization, handoff and merge gates',()=>{
  const proposed=record('task/a','M01',{status:'PROPOSED',authorization_ref:null})
  const unauthorized={...proposed,status:'AUTHORIZED'}
  assert.match(h.workingBranchTransitionError(proposed,unauthorized),/BRANCH_AUTHORIZATION_REQUIRED/)
  const authorized={...unauthorized,authorization_ref:'V/approved-task'}
  assert.equal(h.workingBranchTransitionError(proposed,authorized),null)
  const active={...authorized,status:'ACTIVE'}
  assert.equal(h.workingBranchTransitionError(authorized,active),null)
  assert.match(h.workingBranchTransitionError(active,{...active,status:'READY_FOR_HANDOFF'}),/BRANCH_HANDOFF_REQUIRED/)
  const handed={...active,status:'READY_FOR_HANDOFF',handoff_ref:'H/M03',final_head_sha:sha}
  assert.equal(h.workingBranchTransitionError(active,handed),null)
  const review={...handed,status:'REVIEW'}
  assert.equal(h.workingBranchTransitionError(handed,review),null)
  const merge={...review,status:'MERGED',disposition:'MERGED',closure_evidence_ref:'V/closure'}
  assert.match(h.workingBranchTransitionError(review,merge),/BRANCH_MERGE_GATES_MISSING/)
  const verified={...merge,review_ref:'V/review',ci_ref:'V/CI',
    dependencies_verified_ref:'V/dag',integration_sha:csha,merge_authorization_ref:'AUTH/merge'}
  assert.equal(h.workingBranchTransitionError(review,verified),null)
  assert.equal(h.workingBranchTransitionError(verified,{...verified,status:'CLOSED',physical_ref:'DELETED'}),null)
})
test('Retire preserves unsuccessful experiment evidence; Human KEEP requires explicit reason',()=>{
  const active=record('task/a','M01')
  const retired={...active,status:'RETIRED',disposition:'RETIRED',
    final_head_sha:sha,handoff_ref:'H/M03',closure_evidence_ref:'V/retire'}
  assert.equal(h.workingBranchTransitionError(active,retired),null)
  assert.match(h.workingBranchTransitionError(retired,{...retired,status:'CLOSED',physical_ref:'PRESENT'}),/BRANCH_CLOSURE_UNVERIFIED/)
  assert.equal(h.workingBranchTransitionError(retired,{...retired,status:'CLOSED',
    physical_ref:'PRESENT',preservation_ref:'HUMAN_KEEP',
    preservation_owner:'Human',preservation_reason:'Keep control history'}),null)
  assert.match(h.workingBranchTransitionError(retired,{...retired,status:'CLOSED',disposition:'MERGED',
    physical_ref:'DELETED'}),/BRANCH_DISPOSITION_IMMUTABLE/)
  assert.match(h.workingBranchTransitionError(retired,{...retired,status:'ACTIVE'}),/BRANCH_TRANSITION_INVALID/)
})
test('M03 completion requires all incoming branches closed with evidence and exact set',()=>{
  const a=closed('task/m01','M01'),b=closed('task/m02','M02',true)
  assert.equal(h.convergenceCompletionError([a,b],id,'job-one','M03',['task/m01','task/m02']),null)
  assert.match(h.convergenceCompletionError([a,b],id,'job-one','M03',['task/m01']),/CONVERGENCE_ORPHAN_BRANCH/)
  assert.match(h.convergenceCompletionError([a,record('task/m02','M02')],id,'job-one','M03',['task/m01','task/m02']),/CONVERGENCE_CLOSURE_PENDING/)
  assert.match(h.convergenceCompletionError([a,b],id,'job-one','M03',['task/m01','task/m01']),/CONVERGENCE_INCOMING_INVALID/)
})
test('M03 rejects a forged CLOSED/MERGED branch missing any merge gate evidence',()=>{
  const valid=closed('task/m01','M01')
  assert.equal(h.convergenceCompletionError([valid],id,'job-one','M03',['task/m01']),null)
  for (const field of ['review_ref','ci_ref','dependencies_verified_ref',
    'integration_sha','merge_authorization_ref']) {
    const forged={...valid}
    delete forged[field]
    // These evidence fields are optional in the manifest schema to support
    // earlier lifecycle phases; M03 must still fail CLOSED/MERGED.
    assert.equal(h.parseProjectManifest(manifest([forged])).working_branches.length,1,field)
    assert.match(h.convergenceCompletionError([forged],id,'job-one','M03',['task/m01']),
      /CONVERGENCE_MERGE_EVIDENCE_MISSING/,field)
  }
})
test('MERGED to CLOSED rejects incomplete merge proof without penalizing RETIRED',()=>{
  const good=closed('task/m01','M01')
  for (const field of ['review_ref','ci_ref','dependencies_verified_ref',
    'integration_sha','merge_authorization_ref']) {
    const forged={...good}
    delete forged[field]
    assert.match(h.workingBranchTransitionError({...forged,status:'MERGED'},forged),
      /BRANCH_MERGE_GATES_MISSING/,field)
  }
  const retired=record('task/m02','M02',{
    status:'CLOSED',disposition:'RETIRED',final_head_sha:sha,
    handoff_ref:'H/M03',closure_evidence_ref:'V/retire',physical_ref:'DELETED',
  })
  assert.equal(h.convergenceCompletionError([retired],id,'job-one','M03',['task/m02']),null)
})

test('source interfaces bind branch owner, Convergence ownership and independent release',()=>{
  const read=p=>fs.readFileSync(path.join(root,p),'utf8')
  const authSource=read('project-auth-tools.ts')
  const runSource=read('run/run-begin.ts')
  const completion=read('run/complete.ts')
  const prepare=read('project-setup/working-branch.ts')
  const tools=read('project-setup-tools.ts')
  assert.match(authSource,/target_source_branch/)
  assert.match(authSource,/source_job_id/)
  assert.match(runSource,/source_branch \?\? owningJob\.repository_context\?\.integration_branch/)
  assert.match(runSource,/convergence_task:/)
  assert.match(completion,/convergenceCompletionError/)
  assert.match(completion,/CONVERGENCE_DOWNSTREAM_HANDOFF_REQUIRED/)
  assert.match(prepare,/workingBranchTransitionError/)
  assert.match(prepare,/authorize_memory_mutation/)
  assert.match(tools,/registerWorkingBranchTools\(deps\)/)
  assert.match(read('job-prepare-tool.ts'),/linked_job_ids: scopeNew \?/)
  assert.match(read('job-revise-plan-tool.ts'),/linked_job_ids: linked_job_ids \?\? current\.linked_job_ids/)
  assert.match(completion,/owningNextJob\?\.linked_job_ids/)
  assert.doesNotMatch(prepare,/merge_pull_request\(/)
})

const approvedJob = () => ({
  job_id: 'job-one', project_id: id, lifecycle: 'READY', planning_revision: 1,
  planning_review: {status:'PASS',reviewed_revision:1},
  tasks: [
    {task_id:'M01',dependencies:[],lifecycle:'READY'},
    {task_id:'M02',dependencies:[],lifecycle:'READY'},
    {task_id:'M03',dependencies:['M01','M02'],convergence_task:true,
      incoming_branches:['task/m01','task/m02'],lifecycle:'READY'},
  ],
})
test('Working Branch authorization uses reviewed Job/Task DAG and exact baseline reconciliation',()=>{
  const job=approvedJob(), branch=record('task/m01','M01',{development_head_sha:sha})
  assert.equal(h.workingBranchTaskContractError(branch,job,job,true),null)
  assert.match(h.workingBranchTaskContractError(branch,
    {...job,planning_review:{status:'PENDING'}},job,true),/WORKING_BRANCH_JOB_UNREVIEWED/)
  const withoutIncoming={...job,tasks:job.tasks.map(t=>
    t.task_id==='M03'?{...t,incoming_branches:[]}:t)}
  assert.match(h.workingBranchTaskContractError(branch,withoutIncoming,withoutIncoming,true),
    /WORKING_BRANCH_INCOMING_MISSING/)
  const disconnected={...job,tasks:job.tasks.map(t=>
    t.task_id==='M03'?{...t,dependencies:['M02']}:t)}
  assert.match(h.workingBranchTaskContractError(branch,disconnected,disconnected,true),
    /WORKING_BRANCH_TASK_DAG_INVALID/)
  assert.match(h.workingBranchTaskContractError({...branch,development_head_sha:null},job,job,true),
    /WORKING_BRANCH_BASELINE_UNVERIFIED/)
  assert.match(h.workingBranchTaskContractError({...branch,development_head_sha:bsha},job,job,true),
    /WORKING_BRANCH_RECONCILIATION_REQUIRED/)
  assert.equal(h.workingBranchTaskContractError({...branch,development_head_sha:bsha,
    reconciliation_plan:'Rebase against verified current Development HEAD'},job,job,true),null)
})
test('Cross-Job Convergence uses a Job link and in-Job Task topology, not a foreign Task dependency',()=>{
  const owner={...approvedJob(),tasks:[{task_id:'M01',dependencies:[],lifecycle:'READY'}]}
  const closure={
    ...approvedJob(),job_id:'job-two',linked_job_ids:['job-one'],
    tasks:[{task_id:'M03',convergence_task:true,dependencies:[],
      incoming_branches:['task/m01'],lifecycle:'READY'}],
  }
  const topology=[{stage:1,handler:'coder',task_id:'M03',depends_on:[],next:null}]
  const branch=record('task/m01','M01',{closure_owner_job_id:'job-two',
    development_head_sha:sha})
  assert.equal(h.validateExecutionTopology(closure.tasks,topology),null)
  assert.equal(h.workingBranchTaskContractError(branch,owner,closure,true),null)
  assert.match(h.workingBranchTaskContractError(branch,owner,
    {...closure,linked_job_ids:[]},true),/WORKING_BRANCH_JOB_DAG_INVALID/)
  assert.match(h.workingBranchTaskContractError(branch,owner,
    {...closure,linked_job_ids:['other-job']},true),/WORKING_BRANCH_JOB_DAG_INVALID/)
  const foreign={...closure,tasks:[{...closure.tasks[0],dependencies:['M01']}]}
  assert.match(h.validateExecutionTopology(foreign.tasks,
    [{...topology[0],depends_on:['M01']}]),/EXECUTION_TOPOLOGY_INVALID/,
    'NEXT Task dependencies cannot refer to a different Job')
  assert.match(h.workingBranchTaskContractError(branch,owner,foreign,true),
    /WORKING_BRANCH_CROSS_JOB_TASK_DEPENDENCY_INVALID/)
  assert.match(h.workingBranchTaskContractError(branch,owner,
    {...closure,job_id:'wrong'},true),/WORKING_BRANCH_CLOSURE_JOB_INVALID/)
})
test('M03 cross-Job completion checks current Job link plus upstream handoff/evidence',()=>{
  const incoming={...closed('task/m01','M01'),closure_owner_job_id:'job-two'}
  assert.equal(h.convergenceCompletionError([incoming],id,'job-two','M03',
    ['task/m01'],['job-one']),null)
  assert.match(h.convergenceCompletionError([incoming],id,'job-two','M03',
    ['task/m01']),/CONVERGENCE_UPSTREAM_JOB_UNLINKED/)
  assert.match(h.convergenceCompletionError([incoming],id,'job-two','M03',
    ['task/m01'],['another-job']),/CONVERGENCE_UPSTREAM_JOB_UNLINKED/)
  assert.match(h.convergenceCompletionError([{...incoming,handoff_ref:null}],
    id,'job-two','M03',['task/m01'],['job-one']),/CONVERGENCE_CLOSURE_PENDING/)
  assert.match(h.convergenceCompletionError([{...incoming,review_ref:null}],
    id,'job-two','M03',['task/m01'],['job-one']),/CONVERGENCE_MERGE_EVIDENCE_MISSING/)
  assert.equal(h.convergenceCompletionError([
    {...incoming,disposition:'RETIRED',review_ref:null,ci_ref:null,
      dependencies_verified_ref:null,integration_sha:null,merge_authorization_ref:null}
  ],id,'job-two','M03',['task/m01'],['job-one']),null,
    'retired upstream work still needs a handoff but not merge-only evidence')
})
function loadRealRuntimeModule(file, cache=new Map()) {
  const absolute=path.resolve(root,file)
  assert.ok(absolute.startsWith(root+path.sep))
  if (cache.has(absolute)) return cache.get(absolute).exports
  const content=fs.readFileSync(absolute,'utf8')
  const js=ts.transpileModule(content,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
  }}).outputText
  const module={exports:{}}
  cache.set(absolute,module)
  vm.runInNewContext(js,{module,exports:module.exports,URL,console,require:specifier=>{
    assert.ok(specifier.startsWith('.'),'outside GSA source import denied')
    return loadRealRuntimeModule(path.resolve(path.dirname(absolute),specifier),cache)
  }},{filename:absolute,timeout:2000})
  return module.exports
}
test('real job_prepare persists upstream Job links without foreign Task dependencies',async()=>{
  const {registerJobPrepareTool}=loadRealRuntimeModule('job-prepare-tool.ts')
  let handler
  let z;z=new Proxy(function(){return z},{get:()=>z,apply:()=>z})
  const upstreamId='01a00000-0000-7000-8000-000000000001'
  const newId='01a00000-0000-7000-8000-000000000002'
  registerJobPrepareTool({
    server:{registerTool:(name,schema,fn)=>{if(name==='job_prepare')handler=fn}},
    z,req:{},AUTH_SCOPES:[],authContext:async()=>({user_id:'tester'}),
    authError:(_req,message)=>({isError:true,content:[{type:'text',text:message}]}),
    CRITERIA_BINDING_SCHEMA:z,EVIDENCE_NEED_SCHEMA:z,TEST_CHECKPOINT_SPEC_SCHEMA:z,
    EVIDENCE_REQUIREMENT_SCHEMA:z,MILESTONE_SCHEMA:z,PLANNING_TOPOLOGY_NODE_SCHEMA:z,
    PLANNING_LOOP_CONTINUATION_SCHEMA:z,
    readMemoryConfig:async()=>({data:{memory_repo_full_name:'thebimhouseinfo-sudo/GSA-Projects'}}),
    normalizeGithubRepo:h.normalizeGithubRepo,
    resolveExecutionContract:v=>v,nextMemoryNamespaceForRequest:()=> 'TEST_LAB',
    jobCreationExecutionContractDefault:()=> 'NEXT',uuidv7:()=>newId,
    validIntegrationBranch:h.validIntegrationBranch,
    projectCriteriaBindingError:()=>null,
    validateExecutionTopology:h.validateExecutionTopology,
    normalizeNextPlanningModel:()=>({evidence_needs:[],test_checkpoints:[],
      evidence_requirements:[],milestones:[],planning_topology:[]}),
    validateNextPlanningModel:()=>null,
    jobHandle:()=> 'J-TEST',recordPath:()=> 'TEST/JOBS/'+newId+'.json',
    prettyJson:JSON.stringify,
    planningLoopContinuationDecision:()=>({next_action_after_readback:'REVIEW_CURRENT_REVISION'}),
  })
  assert.equal(typeof handler,'function')
  const args={
    project_id:id,type:'code',objective:'Cross-Job M03 Convergence',
    scope:['Handoff from reviewed upstream Job'],non_goals:[],
    execution_contract:'NEXT',plan_kind:'JOB',integration_branch:dev,
    work_context:'NEW',phase:'CONVERGENCE',milestone:'M03',
    relationship_scan_summary:'A reviewed upstream Job produces an incoming branch',
    job_sizing:{size:'SMALL'},brownfield_logic_review:[],relationship_assessment:[],
    repository_structure_evidence:['Scoped GSA repository'],
    selected_source_evidence:[],project_repository_mode:'SINGLE',
    registered_repositories:[repo],working_repository_url:repo,
    cross_repo_impact:[{repository_url:repo,impact:'NONE',reason:'Single repo'}],
    tasks:[{task_id:'M03',objective:'Integrate and close incoming Working Branch',
      dependencies:[],scope:[],required_skills:[],
      completion_criteria:['All incoming branches have verified dispositions'],
      convergence_task:true,incoming_branches:['task/m01']}],
    evidence_needs:[],test_checkpoints:[],evidence_requirements:[],
    milestones:[],planning_topology:[],completion_requirements:['M03 finished'],
    verification_requirements:[],review_triggers:[],linked_job_ids:[upstreamId],
  }
  const good=await handler(args)
  assert.equal(good.isError,undefined)
  const job=JSON.parse(good.structuredContent.job_record_text)
  assert.equal(job.lifecycle,'DRAFT')
  assert.equal(job.planning_review.status,'PENDING',
    'upstream linkage never substitutes for planning Reviewer PASS')
  assert.deepEqual(Array.from(job.linked_job_ids),[upstreamId])
  assert.deepEqual(Array.from(job.tasks[0].dependencies),[])
  assert.equal(h.validateExecutionTopology(job.tasks,job.topology),null)
  const bad=await handler({...args,tasks:[{...args.tasks[0],dependencies:['M01']}]})
  assert.match(bad.content[0].text,/EXECUTION_TOPOLOGY_INVALID/)
  const duplicate=await handler({...args,linked_job_ids:[upstreamId,upstreamId]})
  assert.match(duplicate.content[0].text,/JOB_UPSTREAM_LINK_INVALID/)
  const invalidReview=await handler({...args,type:'review'})
  assert.match(invalidReview.content[0].text,/CONVERGENCE_HANDLER_INVALID/,
    'real job_prepare must never create a Reviewer-owned Convergence Task')
  const ordinaryReview=await handler({...args,type:'review',
    tasks:[{...args.tasks[0],convergence_task:false,incoming_branches:undefined}]})
  assert.equal(ordinaryReview.isError,undefined,
    'ordinary non-Convergence Reviewer Job remains valid')
})

test('prepare tool rejects duplicate active Task branch and validates authorization snapshots',async()=>{
  const {registerWorkingBranchTools}=loadRealRuntimeModule('project-setup/working-branch.ts')
  let handler
  let z;z=new Proxy(function(){return z},{get:()=>z,apply:()=>z})
  registerWorkingBranchTools({
    server:{registerTool:(name,config,fn)=>{if(name==='working_branch_prepare')handler=fn}},
    z,req:{},AUTH_SCOPES:[],authContext:async()=>({user_id:'tester'}),
    authError:(_req,message)=>({isError:true,content:[{type:'text',text:message}]}),
  })
  assert.equal(typeof handler,'function')
  const job=approvedJob()
  const base={
    project_id:id,memory_path:'projects/'+id+'/PROJECT.md',
    project_manifest_sha:sha,job_record_text:JSON.stringify(job),
    job_record_sha:sha,
  }
  const a=record('task/m01','M01',{status:'PROPOSED',authorization_ref:null})
  const first=await handler({...base,action:'REGISTER',branch_record:a,
    project_manifest_text:manifest([])})
  assert.equal(first.isError,undefined)
  assert.equal(first.structuredContent.status,'PROPOSED')
  const duplicate=await handler({...base,action:'REGISTER',
    branch_record:{...a,branch:'task/m01-duplicate'},
    project_manifest_text:first.structuredContent.updated_manifest_text})
  assert.match(duplicate.content[0].text,/WORKING_BRANCH_TASK_ALREADY_OWNED/)
  const b=record('task/m02','M02',{status:'PROPOSED',authorization_ref:null})
  const parallel=await handler({...base,action:'REGISTER',branch_record:b,
    project_manifest_text:first.structuredContent.updated_manifest_text})
  assert.equal(parallel.isError,undefined)
  const nowAuthorized={...a,status:'AUTHORIZED',authorization_ref:'V/reviewed-task',
    development_head_sha:sha}
  const accepted=await handler({...base,action:'TRANSITION',
    branch_record:nowAuthorized,
    project_manifest_text:first.structuredContent.updated_manifest_text})
  assert.equal(accepted.isError,undefined)
  assert.equal(accepted.structuredContent.status,'AUTHORIZED')
  const stale=await handler({...base,action:'TRANSITION',
    branch_record:{...nowAuthorized,development_head_sha:bsha},
    project_manifest_text:first.structuredContent.updated_manifest_text})
  assert.match(stale.content[0].text,/WORKING_BRANCH_TRANSITION_INVALID/,
    'A registered Development HEAD is immutable; transition may not silently replace its authorization baseline')
})

test('Cancelled owning Task may retire its existing branch; closure still requires Convergence Owner',async()=>{
  const job=approvedJob(), retiredOwner={...job,tasks:job.tasks.map(t=>
    t.task_id==='M01'?{...t,lifecycle:'RETIRED'}:t)}
  const a=record('task/m01','M01',{development_head_sha:sha})
  assert.match(h.workingBranchTaskContractError(a,retiredOwner,retiredOwner,false),
    /WORKING_BRANCH_TASK_INVALID/)
  assert.equal(h.workingBranchTaskContractError(a,retiredOwner,retiredOwner,false,true),null)
  const {registerWorkingBranchTools}=loadRealRuntimeModule('project-setup/working-branch.ts')
  let handler;let z;z=new Proxy(function(){return z},{get:()=>z,apply:()=>z})
  registerWorkingBranchTools({server:{registerTool:(name,schema,fn)=>handler=fn},
    z,req:{},AUTH_SCOPES:[],authContext:async()=>({user_id:'tester'}),
    authError:(_req,text)=>({isError:true,content:[{type:'text',text}]}),
  })
  const retired={...a,status:'RETIRED',disposition:'RETIRED',
    final_head_sha:sha,handoff_ref:'H/M03',closure_evidence_ref:'V/retirement'}
  const result=await handler({
    project_id:id,memory_path:'projects/'+id+'/PROJECT.md',
    project_manifest_text:manifest([a]),project_manifest_sha:sha,
    action:'TRANSITION',branch_record:retired,
    job_record_text:JSON.stringify(retiredOwner),job_record_sha:sha,
  })
  assert.equal(result.isError,undefined,'cancelled Task must still be able to retire existing branch')
  assert.equal(result.structuredContent.status,'RETIRED')
})

test('real Run completion cannot strip Convergence Task flag or bypass orphan branch closure',async()=>{
  const {registerRunComplete}=loadRealRuntimeModule('run/complete.ts')
  let handler;let z;z=new Proxy(function(){return z},{get:()=>z,apply:()=>z})
  registerRunComplete({
    server:{registerTool:(name,schema,fn)=>{assert.equal(name,'run_complete');handler=fn}},
    z,req:{},AUTH_SCOPES:[],DURABLE_RECORD_SNAPSHOT_SCHEMA:z,
    authContext:async()=>({user_id:'tester'}),
    authError:(_req,text)=>({isError:true,content:[{type:'text',text}]}),
    resolveExecutionContract:x=>x,recordNextMemoryNamespace:r=>r.memory_namespace,
    jobExecutionContract:j=>j.execution_contract,
    parseDurableSnapshots:()=>({error:null,entries:[]}),
  })
  const job={...approvedJob(),execution_contract:'NEXT',memory_namespace:'PRODUCTION',
    topology:[
      {stage:1,handler:'coder',task_id:'M01',depends_on:[],next:'M02'},
      {stage:2,handler:'coder',task_id:'M02',depends_on:[],next:'M03'},
      {stage:3,handler:'coder',task_id:'M03',depends_on:['M01','M02'],next:null},
    ]}
  const run={project_id:id,job_id:'job-one',run_id:'run-one',role:'coder',
    lifecycle:'IN_PROGRESS',execution_contract:'NEXT',
    memory_namespace:'PRODUCTION',planning_revision:1,
    primary_task_id:'M03',convergence_task:true,
    incoming_branches:['task/m01','task/m02']}
  const args={project_id:id,job_id:'job-one',run_id:'run-one',role:'coder',
    run_record_sha:sha,job_record_text:JSON.stringify(job),job_record_sha:sha,
    lifecycle:'COMPLETED',result:'PASS',output_refs:[],verification_refs:[],
    handoff:{completed_summary:'verified downstream handoff',next_role:'reviewer'}}
  const call=async(r,extra={})=>handler({...args,run_record_text:JSON.stringify(r),...extra})
  const spoof=await call({...run,convergence_task:false})
  assert.match(spoof.content[0].text,/CONVERGENCE_TASK_BINDING_MISMATCH/)
  const spoofNames=await call({...run,incoming_branches:['task/m01']})
  assert.match(spoofNames.content[0].text,/CONVERGENCE_TASK_BINDING_MISMATCH/)
  const noHandoff=await call(run,{handoff:null})
  assert.match(noHandoff.content[0].text,/CONVERGENCE_DOWNSTREAM_HANDOFF_REQUIRED/)
  const noManifest=await call(run)
  assert.match(noManifest.content[0].text,/CONVERGENCE_MANIFEST_REQUIRED/)
  const open=await call(run,{project_manifest_text:manifest([
    closed('task/m01','M01'),record('task/m02','M02')]),
    project_manifest_sha:sha})
  assert.match(open.content[0].text,/CONVERGENCE_CLOSURE_PENDING/)
  const allClosed=await call(run,{project_manifest_text:manifest([
    closed('task/m01','M01'),closed('task/m02','M02')]),
    project_manifest_sha:sha})
  assert.match(allClosed.content[0].text,/CODER_COMPLETION_BLOCKED/,
    'After passing Convergence closure, ordinary Coder Goal Recheck guard must still apply')
})


test('FIR-01 rejects non-Coder Convergence ownership in the shared NEXT topology validator',()=>{
  const task={task_id:'M03',dependencies:[],convergence_task:true,
    incoming_branches:['task/m01']}
  const stage=handler=>({stage:1,handler,task_id:'M03',depends_on:[],next:null})
  for(const role of ['planner','designer','reviewer','tester']){
    assert.match(h.validateExecutionTopology([task],[stage(role)]),
      /CONVERGENCE_HANDLER_INVALID/,role)
  }
  assert.equal(h.validateExecutionTopology([task],[stage('coder')]),null)
  assert.equal(h.validateExecutionTopology(
    [{...task,convergence_task:false}],[stage('reviewer')]),null)
})

test('FIR-01 real job_revise_plan rejects a non-Coder Convergence topology',async()=>{
  const {registerJobRevisePlanTool}=loadRealRuntimeModule('job-revise-plan-tool.ts')
  let handler;let z;z=new Proxy(function(){return z},{get:()=>z,apply:()=>z})
  registerJobRevisePlanTool({
    server:{registerTool:(name,schema,fn)=>{if(name==='job_revise_plan')handler=fn}},
    z,req:{},AUTH_SCOPES:[],CRITERIA_BINDING_SCHEMA:z,
    PLANNING_LOOP_CONTINUATION_SCHEMA:z,EVIDENCE_NEED_SCHEMA:z,TEST_CHECKPOINT_SPEC_SCHEMA:z,
    EVIDENCE_REQUIREMENT_SCHEMA:z,MILESTONE_SCHEMA:z,PLANNING_TOPOLOGY_NODE_SCHEMA:z,
    authContext:async()=>({user_id:'tester'}),
    authError:(_req,message)=>({isError:true,content:[{type:'text',text:message}]}),
    jobExecutionContract:j=>j.execution_contract,recordNextMemoryNamespace:j=>j.memory_namespace,
    projectCriteriaBindingError:()=>null,revisedJobIntegrationBranchError:()=>null,
    validateExecutionTopology:h.validateExecutionTopology,
    normalizeNextPlanningModel:()=>({evidence_needs:[],test_checkpoints:[],
      evidence_requirements:[],milestones:[],planning_topology:[]}),
    validateNextPlanningModel:()=>null,recordPath:()=> 'TEST/JOBS/job-one.json',
    planningLoopContinuationDecision:()=>({next_action_after_readback:'REVIEW_CURRENT_REVISION'}),
    prettyJson:JSON.stringify,
  })
  assert.equal(typeof handler,'function')
  const current={...approvedJob(),lifecycle:'DRAFT',execution_contract:'NEXT',
    memory_namespace:'TEST_LAB',plan_kind:'JOB',criteria_binding:null,
    repository_context:{integration_branch:dev},
    tasks:[{task_id:'M03',dependencies:[],convergence_task:true,
      incoming_branches:['task/m01'],lifecycle:'READY'}],
    topology:[{stage:1,handler:'coder',task_id:'M03',depends_on:[],next:null}]}
  const invalidTopology=[{...current.topology[0],handler:'reviewer'}]
  const bad=await handler({project_id:id,job_id:'job-one',
    job_record_text:JSON.stringify(current),job_record_sha:sha,
    topology:invalidTopology,revision_reason:'FIR-01 negative real-handler regression'})
  assert.match(bad.content[0].text,/CONVERGENCE_HANDLER_INVALID/)
})

test('FIR-01 real run_begin rejects legacy non-Coder Convergence including affected Tasks',async()=>{
  const {registerRunBegin}=loadRealRuntimeModule('run/run-begin.ts')
  const {nextDispatchPreflightError}=loadRealRuntimeModule('run-dispatch-closure-guards.ts')
  let handler;let z;z=new Proxy(function(){return z},{get:()=>z,apply:()=>z})
  registerRunBegin({
    server:{registerTool:(name,schema,fn)=>{if(name==='run_begin')handler=fn}},
    z,req:{},AUTH_SCOPES:[],DURABLE_RECORD_SNAPSHOT_SCHEMA:z,
    authContext:async()=>({user_id:'tester'}),
    authError:(_req,message)=>({isError:true,content:[{type:'text',text:message}]}),
    jobExecutionContract:j=>j.execution_contract,recordNextMemoryNamespace:j=>j.memory_namespace,
    parseDurableSnapshots:()=>({error:null,entries:[]}),
    resolveRequiredTaskSkills:()=>({names:[],contexts:[],error:null}),
    nextDispatchPreflightError,evaluateNextEvidenceGate:()=>({allowed:true,blocking:[]}),
    uxFirstTemporaryUiGateRequired:()=>false,normalizeGithubRepo:h.normalizeGithubRepo,
    projectBootstrapExecutionError:()=>null,
    uuidv7:()=> '01a00000-0000-7000-8000-000000000009',
    runHandle:()=> 'R-TEST',recordPath:()=> 'TEST/RUNS/new.json',
    prettyJson:JSON.stringify,durableSnapshotReadbackSteps:()=>[],
  })
  const plain={task_id:'M01',dependencies:[],lifecycle:'READY'}
  const converge={task_id:'M03',dependencies:[],lifecycle:'READY',
    convergence_task:true,incoming_branches:['task/m01']}
  const reviewed={job_id:'job-one',project_id:id,lifecycle:'READY',
    execution_contract:'NEXT',memory_namespace:'TEST_LAB',planning_revision:1,
    planning_review:{status:'PASS',reviewed_revision:1},
    tasks:[plain,converge],topology:[
      {stage:1,handler:'reviewer',task_id:'M01',depends_on:[],next:'M03'},
      {stage:2,handler:'reviewer',task_id:'M03',depends_on:[],next:null},
    ]}
  const args={project_id:id,job_id:'job-one',job_record_text:JSON.stringify(reviewed),
    job_record_sha:sha,current_job_record_sha:sha,planning_revision:1,role:'reviewer',
    primary_task_id:'M03',scope_claim:['read-only'],target_ref:repo,
    target_revision:sha,affected_task_refs:[]}
  const badPrimary=await handler(args)
  assert.match(badPrimary.content[0].text,/CONVERGENCE_HANDLER_INVALID/)
  const badAffected=await handler({...args,primary_task_id:'M01',
    affected_task_refs:['M03']})
  assert.match(badAffected.content[0].text,/CONVERGENCE_HANDLER_INVALID/)
  const good=await handler({...args,primary_task_id:'M01',affected_task_refs:[]})
  assert.equal(good.isError,undefined,'ordinary Reviewer dispatch must remain valid')
})

test('FIR-01 real run_complete fails closed for legacy non-Coder Convergence and forged flags',async()=>{
  const {registerRunComplete}=loadRealRuntimeModule('run/complete.ts')
  let handler;let z;z=new Proxy(function(){return z},{get:()=>z,apply:()=>z})
  registerRunComplete({
    server:{registerTool:(name,schema,fn)=>{if(name==='run_complete')handler=fn}},
    z,req:{},AUTH_SCOPES:[],DURABLE_RECORD_SNAPSHOT_SCHEMA:z,
    authContext:async()=>({user_id:'tester'}),
    authError:(_req,message)=>({isError:true,content:[{type:'text',text:message}]}),
    resolveExecutionContract:x=>x,recordNextMemoryNamespace:r=>r.memory_namespace,
    jobExecutionContract:j=>j.execution_contract,
    parseDurableSnapshots:()=>({error:null,entries:[]}),
    validateRunVerificationSnapshot:()=>({error:null,ref:'V/reviewer'}),
    recordPath:()=> 'TEST/RUNS/run-one.json',
    prettyJson:JSON.stringify,uuidv7:()=> '01a00000-0000-7000-8000-000000000009',
    durableSnapshotReadbackSteps:()=>[],
  })
  const task={task_id:'M03',dependencies:[],convergence_task:true,
    incoming_branches:['task/m01'],lifecycle:'READY'}
  const job={job_id:'job-one',project_id:id,lifecycle:'READY',
    execution_contract:'NEXT',memory_namespace:'PRODUCTION',planning_revision:1,
    tasks:[task],topology:[{stage:1,handler:'reviewer',task_id:'M03',
      depends_on:[],next:null}]}
  const run={project_id:id,job_id:'job-one',run_id:'run-one',role:'reviewer',
    lifecycle:'IN_PROGRESS',execution_contract:'NEXT',memory_namespace:'PRODUCTION',
    planning_revision:1,primary_task_id:'M03',convergence_task:true,
    incoming_branches:['task/m01'],target_ref:repo,target_revision:sha}
  const args={project_id:id,job_id:'job-one',run_id:'run-one',role:'reviewer',
    run_record_sha:sha,job_record_text:JSON.stringify(job),job_record_sha:sha,
    lifecycle:'COMPLETED',result:'PASS',output_refs:[],verification_refs:['V/reviewer'],
    run_verification_snapshot:{path:'V/reviewer',sha,record_text:'{}'}}
  const call=(r,changes={})=>handler({...args,...changes,run_record_text:JSON.stringify(r)})
  const invalid=await call(run)
  assert.match(invalid.content[0].text,/CONVERGENCE_HANDLER_INVALID/)
  const stripped=await call({...run,convergence_task:false})
  assert.match(stripped.content[0].text,/CONVERGENCE_TASK_BINDING_MISMATCH/)
  const changedNames=await call({...run,incoming_branches:['task/forged']})
  assert.match(changedNames.content[0].text,/CONVERGENCE_TASK_BINDING_MISMATCH/)
  const failed=await call(run,{lifecycle:'FAILED',result:'FAIL',
    verification_refs:[],run_verification_snapshot:undefined})
  assert.equal(failed.isError,undefined,'failed Runs can still settle without fake closure')
})

test('branch purpose, owner and merge/retire contracts remain immutable across lifecycle',()=>{
  const a=record('task/m01','M01',{status:'ACTIVE'})
  const next={...a,status:'READY_FOR_HANDOFF',handoff_ref:'H/M03',final_head_sha:sha}
  assert.equal(h.workingBranchTransitionError(a,next),null)
  const mutated={
    purpose:'Unauthorized replacement scope',
    owner:'different operator',
    dependencies:['new unexpected dependency'],
    deliverables:['different output'],
    merge_conditions:['skip CI'],
    retire_conditions:['hide findings'],
  }
  for(const [key,value] of Object.entries(mutated)){
    assert.match(h.workingBranchTransitionError(a,{...next,[key]:value}),
      /BRANCH_IDENTITY_IMMUTABLE/,key+' must be immutable')
  }
})
test('cross-Job convergence requires upstream Job link and forbids foreign Task dependency',()=>{
  const owner=approvedJob()
  const closure={
    ...approvedJob(),job_id:'job-two',linked_job_ids:['job-one'],
    tasks:[{task_id:'M03',convergence_task:true,dependencies:[],
      incoming_branches:['task/m01']}],
  }
  const branch=record('task/m01','M01',{closure_owner_job_id:'job-two',
    development_head_sha:sha})
  assert.equal(h.workingBranchTaskContractError(branch,owner,closure,true),null)
  const invalid={...closure,tasks:[{...closure.tasks[0],dependencies:['M01']}]}
  assert.match(h.workingBranchTaskContractError(branch,owner,invalid,true),
    /WORKING_BRANCH_CROSS_JOB_TASK_DEPENDENCY_INVALID/)
  assert.match(h.workingBranchTaskContractError(branch,owner,
    {...closure,linked_job_ids:[]},true),/WORKING_BRANCH_JOB_DAG_INVALID/)
})

test('source guard denies registered branch without verified baseline and divergence plan',()=>{
  const branch=record('task/m01','M01')
  assert.equal(auth(manifest([branch]),branch.branch,'M01'),null)
  assert.match(auth(manifest([{...branch,development_head_sha:null}]),branch.branch,'M01'),
    /SOURCE_BRANCH_BASELINE_MISSING/)
  assert.match(auth(manifest([{...branch,development_head_sha:bsha}]),branch.branch,'M01'),
    /SOURCE_BRANCH_RECONCILIATION_MISSING/)
  assert.equal(auth(manifest([{...branch,development_head_sha:bsha,
    reconciliation_plan:'Reviewed integration reconciliation'}]),branch.branch,'M01'),null)
})

test('retirement ledger blocks activation but does not orphan registered branch cleanup',async()=>{
  const {registerWorkingBranchTools}=loadRealRuntimeModule('project-setup/working-branch.ts')
  let handler;let z;z=new Proxy(function(){return z},{get:()=>z,apply:()=>z})
  registerWorkingBranchTools({server:{registerTool:(name,schema,fn)=>handler=fn},
    z,req:{},AUTH_SCOPES:[],authContext:async()=>({user_id:'tester'}),
    authError:(_req,text)=>({isError:true,content:[{type:'text',text}]}),
  })
  const a=record('task/m01','M01')
  const retired={...a,status:'RETIRED',disposition:'RETIRED',
    final_head_sha:sha,handoff_ref:'H/M03',closure_evidence_ref:'V/retired'}
  const retiredSection='\n## Retired Branches\n- '+repo+
    ' | branch=task/m01 | sha='+sha+' | status=RETIRED\n'
  const job=approvedJob()
  const params={
    project_id:id,memory_path:'projects/'+id+'/PROJECT.md',
    project_manifest_sha:sha,job_record_text:JSON.stringify(job),job_record_sha:sha,
    project_manifest_text:manifest([a],retiredSection),
  }
  const denied=await handler({...params,action:'REGISTER',
    branch_record:{...a,status:'PROPOSED'}})
  assert.match(denied.content[0].text,/WORKING_BRANCH_SCOPE_INVALID/)
  const closing=await handler({...params,action:'TRANSITION',branch_record:retired})
  assert.equal(closing.isError,undefined,
    'Human-retired existing source branch must still reach terminal cleanup')
  assert.equal(closing.structuredContent.status,'RETIRED')
  assert.match(auth(params.project_manifest_text,'task/m01'),/SOURCE_BRANCH_RETIRED/,
    'retired branch remains unwritable during cleanup')
})
