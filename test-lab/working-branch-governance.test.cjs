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
  'project-manifest-scope.ts','planning-preflight.ts',
]
const fn = new Set([
  'normalizeGithubRepo','validIntegrationBranch','isRetiredSourceBranch',
  'parseRetiredBranchRows','parseWorkingBranchRows','workingBranchWriteError','workingBranchTaskContractError',
  'workingBranchTransitionError','convergenceCompletionError',
  'parseProjectManifest','projectBootstrapExecutionError',
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
test('Cross-Job Convergence owner requires explicit Job-level DAG edge',()=>{
  const owner=approvedJob(),closure={
    ...approvedJob(),job_id:'job-two',linked_job_ids:['job-one'],
    tasks:[{task_id:'M03',convergence_task:true,dependencies:['M01'],
      incoming_branches:['task/m01']}],
  }
  const branch=record('task/m01','M01',{closure_owner_job_id:'job-two',
    development_head_sha:sha})
  assert.equal(h.workingBranchTaskContractError(branch,owner,closure,true),null)
  assert.match(h.workingBranchTaskContractError(branch,owner,
    {...closure,linked_job_ids:[]},true),/WORKING_BRANCH_JOB_DAG_INVALID/)
  assert.match(h.workingBranchTaskContractError(branch,owner,
    {...closure,job_id:'wrong'},true),/WORKING_BRANCH_CLOSURE_JOB_INVALID/)
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
  assert.match(stale.content[0].text,/WORKING_BRANCH_RECONCILIATION_REQUIRED/)
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
  const job={...approvedJob(),execution_contract:'NEXT',memory_namespace:'PRODUCTION'}
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
test('cross-Job convergence requires BOTH Job edge and Task dependency',()=>{
  const owner=approvedJob()
  const closure={
    ...approvedJob(),job_id:'job-two',linked_job_ids:['job-one'],
    tasks:[{task_id:'M03',convergence_task:true,dependencies:[],
      incoming_branches:['task/m01']}],
  }
  const branch=record('task/m01','M01',{closure_owner_job_id:'job-two',
    development_head_sha:sha})
  assert.match(h.workingBranchTaskContractError(branch,owner,closure,true),
    /WORKING_BRANCH_JOB_DAG_INVALID/)
  const valid={...closure,tasks:[{...closure.tasks[0],dependencies:['M01']}]}
  assert.equal(h.workingBranchTaskContractError(branch,owner,valid,true),null)
  assert.match(h.workingBranchTaskContractError(branch,owner,
    {...valid,linked_job_ids:[]},true),/WORKING_BRANCH_JOB_DAG_INVALID/)
})
