'use strict'
// GSA4 A0 golden integration gate. This compares executable GSA3 source at the
// exact common base with the integrated six-package A0, not just test snapshots.
// GitHub CI checkout MUST retain base history; missing base is FAIL, never SKIP.
const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const {execFileSync} = require('node:child_process')
const ts = require('typescript')
const {loadSourceModule} = require('./helpers/harness-ts-loader.cjs')
const {registrationGraph, toolSource} = require('./helpers/gsa4-source-views.cjs')

const repoRoot = path.resolve(__dirname, '..')
const srcRoot = path.join(repoRoot, 'supabase/functions/gsa-mcp')
const pinnedBase = '6b352a3a1f9b791564b4e8b1682af875adf73da7'
const pathInRepo = f => 'supabase/functions/gsa-mcp/' + f
const current = f => fs.readFileSync(path.join(srcRoot, f), 'utf8')
function base(f) {
  return execFileSync('git', ['show', pinnedBase + ':' + pathInRepo(f)],
    {cwd:repoRoot, encoding:'utf8', maxBuffer:3*1024*1024})
}
function parsed(text, file) {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  assert.equal(ast.parseDiagnostics.length, 0, 'invalid TypeScript: ' + file)
  return ast
}
function functions(text, file) {
  const result = new Map()
  for (const s of parsed(text,file).statements) {
    if (!ts.isFunctionDeclaration(s) || !s.name) continue
    assert.ok(!result.has(s.name.text), file + ': duplicate function ' + s.name.text)
    result.set(s.name.text,s.getText().replace(/^export\s+/,''))
  }
  return result
}
function variableInitializers(text,file) {
  const result=new Map()
  for(const s of parsed(text,file).statements) {
    if(!ts.isVariableStatement(s)) continue
    for(const d of s.declarationList.declarations) {
      if(ts.isIdentifier(d.name) && d.initializer) result.set(d.name.text,d.initializer.getText())
    }
  }
  return result
}
function calls(text,file) {
  const ast=parsed(text,file), found=[]
  function visit(node) {
    if(ts.isCallExpression(node) &&
       ts.isPropertyAccessExpression(node.expression) &&
       node.expression.expression.getText(ast)==='server' &&
       node.expression.name.text==='registerTool' &&
       node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
      found.push([node.arguments[0].text,node.getText(ast)])
    }
    ts.forEachChild(node,visit)
  }
  visit(ast)
  return found
}
function baselineModule(source) {
  const compiled=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
  }}).outputText
  const module={exports:{}}
  vm.runInNewContext(compiled,{module,exports:module.exports,
    require:()=>{throw Error('GSA3 Harness baseline must have no imported dependencies')}},
    {timeout:3000})
  return module.exports
}
function harnessTools(catalog, auth=true) {
  const registrations = new Map()
  const handler = loadSourceModule('harness-skill-tools.ts')
  const chain = new Proxy(() => {}, {get:()=>chain,apply:()=>chain})
  const z = new Proxy({}, {get:()=>chain})
  handler.registerHarnessSkillTools({
    server:{registerTool:(name,definition,fn)=>{
      assert.ok(!registrations.has(name),'duplicate Harness registration '+name)
      registrations.set(name,{definition,fn})
    }},
    z, req:{}, AUTH_SCOPES:['gsa'],
    authContext:async()=>auth?{id:'source-parity'}:null,
    authError:()=>({isError:true,content:[{type:'text',text:'AUTH_REQUIRED'}]}),
    renderHarness:catalog.renderHarness,
    ROLE_HARNESSES:catalog.ROLE_HARNESSES,
    ROLE_SKILLS:catalog.ROLE_SKILLS,
    ROLE_HOST_SKILLS:catalog.ROLE_HOST_SKILLS,
    RUNTIME_SKILLS:catalog.RUNTIME_SKILLS,
  })
  assert.deepEqual([...registrations.keys()],['get_agent_harness','get_skill_catalog','load_skill'])
  return registrations
}
const groups = [
  ['run-execution-tools.ts','registerRunExecutionTools',5],
  ['project-setup-tools.ts','registerProjectSetupTools',6],
  ['checkpoint-tools.ts','registerCheckpointTools',3],
  ['evidence-repository-tools.ts','registerRepositoryEvidenceTools',3],
]

test('GSA3 vs A0 executable Harness responses: 8 Roles, DIRECT/JOB and 11 Skills are byte-identical',async()=>{
  const before=baselineModule(base('harness-catalog.ts'))
  const after=loadSourceModule('harness-catalog.ts')
  const roles=['orchestrator','planner','advisor','designer','coder','reviewer','critic_reviewer','tester']
  const skills=['debugging','critic-review','critical-challenge','job-planning',
    'coding-loop','delegation','planning-review','review-evidence','testing-evidence',
    'tester-lab','ui-coder-frontend']
  assert.deepEqual(Object.keys(before.ROLE_HARNESSES),roles)
  assert.deepEqual(Object.keys(after.ROLE_HARNESSES),roles)
  assert.deepEqual(Object.keys(before.RUNTIME_SKILLS),skills)
  assert.deepEqual(Object.keys(after.RUNTIME_SKILLS),skills)
  assert.equal(before.BASE_AGENT_HARNESS,after.BASE_AGENT_HARNESS)
  assert.equal(JSON.stringify(before.ROLE_SKILLS),JSON.stringify(after.ROLE_SKILLS))
  assert.equal(JSON.stringify(before.ROLE_HOST_SKILLS),JSON.stringify(after.ROLE_HOST_SKILLS))
  for(const role of roles) {
    assert.equal(JSON.stringify(before.ROLE_HARNESSES[role]),JSON.stringify(after.ROLE_HARNESSES[role]),role)
    for(const options of [undefined,{includeProgressiveSkills:false},{includeProgressiveSkills:true}])
      assert.equal(before.renderHarness(role,options),after.renderHarness(role,options),'render '+role)
  }
  for(const skill of skills.filter(s=>s!=='coding-loop')) assert.equal(JSON.stringify(before.RUNTIME_SKILLS[skill]),
    JSON.stringify(after.RUNTIME_SKILLS[skill]),'unchanged skill '+skill)
  // U-C is the only intentional skill-body change. Existing GSA3 instructions
  // must remain byte-for-byte identical when the scoped insertion is removed.
  const previous=before.RUNTIME_SKILLS['coding-loop'].body.split('\\n')
  const revised=after.RUNTIME_SKILLS['coding-loop'].body.split('\\n')
  const insertedFrom=revised.indexOf('ENGINEERING CONTEXT / SOLUTION CLARIFICATION (at Goal/Job-Pack design; not an approval gate)')
  const insertedUntil=revised.indexOf('ACT',insertedFrom+1)
  assert.ok(insertedFrom>=0 && insertedUntil>insertedFrom,'scoped U-C addition present')
  assert.deepEqual([...revised.slice(0,insertedFrom),...revised.slice(insertedUntil)],previous,
    'all preexisting coding-loop instructions remain byte-identical')
  assert.equal(before.RUNTIME_SKILLS['coding-loop'].description,after.RUNTIME_SKILLS['coding-loop'].description)
  const oldTools=harnessTools(before),newTools=harnessTools(after)
  for(const [name,args] of [
    ['get_skill_catalog',undefined],
    ...roles.flatMap(role=>['DIRECT','JOB'].map(mode=>['get_agent_harness',{role,mode}])),
    ...skills.map(name=>['load_skill',{name}]),
    ['get_agent_harness',{role:'not-a-role',mode:'JOB'}],
    ['load_skill',{name:'unknown'}],
  ]) {
    const a=await oldTools.get(name).fn(args)
    const b=await newTools.get(name).fn(args)
    if(name==='load_skill' && args.name==='coding-loop') {
      assert.equal(a.structuredContent.skill_text,before.RUNTIME_SKILLS['coding-loop'].body)
      assert.equal(b.structuredContent.skill_text,after.RUNTIME_SKILLS['coding-loop'].body)
      const expected={...b.structuredContent,skill_text:a.structuredContent.skill_text}
      assert.equal(JSON.stringify(a.structuredContent),JSON.stringify(expected),
        'only coding-loop payload text may differ')
      assert.equal(b.content[0].text,JSON.stringify(b.structuredContent),'JSON fallback remains exact')
    } else assert.equal(JSON.stringify(a),JSON.stringify(b),'public result '+name+':'+JSON.stringify(args))
  }
  const deniedBefore=harnessTools(before,false),deniedAfter=harnessTools(after,false)
  for(const [name,args] of [['get_agent_harness',{role:'coder',mode:'JOB'}],
    ['get_skill_catalog',undefined],['load_skill',{name:'coding-loop'}]]) {
    assert.equal(JSON.stringify(await deniedBefore.get(name).fn(args)),
      JSON.stringify(await deniedAfter.get(name).fn(args)),'denied result '+name)
  }
})

test('all 17 extracted Run/Project/Checkpoint/Evidence registration expressions equal pinned GSA3 exactly',()=>{
  for(const [file,entry,count] of groups) {
    const original=calls(base(file),'GSA3/'+file)
    const updated=calls(toolSource(file,entry),'A0/'+file)
    assert.equal(original.length,count,'base registrations: '+file)
    // U-B deliberately augments ONLY the extracted run_complete handler.
    // The other 16 A0 registrations remain byte-exact to GSA3.
    if(file==='run-execution-tools.ts'){
      assert.deepEqual(updated.filter(([name])=>name!=='run_complete'),
        original.filter(([name])=>name!=='run_complete'),
        'four unmodified Run registrations retain exact pinned GSA3 behavior')
      const completion=updated.find(([name])=>name==='run_complete')?.[1]
      assert.match(completion,/PLAN_CHANGE_RUN_COMPLETION_FENCED_OR_STALE_JOB/)
      assert.match(completion,/Independently reread CURRENT owning Job/)
    } else assert.deepEqual(updated,original,'schemas/handlers/error/result code drift: '+file)
    assert.deepEqual(registrationGraph(file,entry).names,original.map(([name])=>name),
      'registration order drift: '+file)
  }
})

test('all former index helper function bodies and schema initializers preserve GSA3 source',()=>{
  const old=base('index.ts'),now=current('index.ts')
  const origFuncs=functions(old,'GSA3 index.ts')
  const leaves=['index.ts','runtime-contract.ts','request-auth-bridge.ts','durable-record-io.ts',
    'run-dispatch-closure-guards.ts','evidence-validation.ts','checkpoint-evidence-gates.ts',
    'planning-schemas.ts','planning-preflight.ts','cursor-decisions.ts','project-manifest-scope.ts']
  const liveFuncs=new Map()
  const liveVars=new Map()
  for(const f of leaves) {
    const source=current(f)
    for(const [name,body] of functions(source,f)) {
      assert.ok(!liveFuncs.has(name),'duplicate index helper: '+name)
      liveFuncs.set(name,body)
    }
    for(const [name,initializer] of variableInitializers(source,f)) {
      assert.ok(!liveVars.has(name),'duplicate top-level variable: '+name)
      liveVars.set(name,initializer)
    }
  }
  for(const [name,body] of origFuncs) {
    assert.ok(liveFuncs.has(name),'GSA3 function missing after A0: '+name)
    assert.equal(liveFuncs.get(name),body,'GSA3 helper drift: '+name)
  }
  const originalVariables=variableInitializers(old,'GSA3 index.ts')
  const names=['EXECUTION_CONTRACT_VALUES','DEFAULT_EXECUTION_CONTRACT',
    'NEXT_MEMORY_NAMESPACE_VALUES','DEFAULT_NEXT_MEMORY_NAMESPACE',
    'EVIDENCE_NEED_SCHEMA','TEST_CHECKPOINT_SPEC_SCHEMA','EVIDENCE_REQUIREMENT_SCHEMA',
    'CRITERIA_BINDING_SCHEMA','MILESTONE_SCHEMA','PLANNING_TOPOLOGY_NODE_SCHEMA',
    'DURABLE_RECORD_SNAPSHOT_SCHEMA','PLANNING_LOOP_CONTINUATION_SCHEMA']
  for(const name of names) {
    assert.ok(originalVariables.has(name),'base initializer missing: '+name)
    assert.ok(liveVars.has(name),'new initializer missing: '+name)
    assert.equal(liveVars.get(name),originalVariables.get(name),'schema/constant drift: '+name)
  }
  assert.equal(liveFuncs.get('createServer'),origFuncs.get('createServer'),
    'request closure and registration composition must remain in original location')
})

test('GSA runtime TypeScript import graph is parseable, local imports exist, and no cycles introduced',()=>{
  const files=[]
  function walk(dir) {
    for(const f of fs.readdirSync(dir,{withFileTypes:true})) {
      const full=path.join(dir,f.name)
      if(f.isDirectory()) walk(full)
      else if(f.isFile() && f.name.endsWith('.ts'))
        files.push(path.relative(srcRoot,full).replaceAll('\\','/'))
    }
  }
  walk(srcRoot)
  const deps=new Map()
  for(const file of files) {
    const ast=parsed(current(file),file),imports=[]
    for(const node of ast.statements) {
      if(!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier))continue
      const name=node.moduleSpecifier.text
      if(!name.startsWith('./') && !name.startsWith('../'))continue
      let target=path.posix.normalize(path.posix.join(path.posix.dirname(file),name))
      if(!target.endsWith('.ts'))target+='.ts'
      assert.ok(!target.startsWith('../') && files.includes(target),
        file+' imports missing/out-of-scope TS module '+target)
      imports.push(target)
    }
    deps.set(file,imports)
  }
  const visiting=new Set(),visited=new Set()
  function traverse(file,chain=[]) {
    assert.ok(!visiting.has(file),'GSA import cycle: '+[...chain,file].join(' -> '))
    if(visited.has(file))return
    visiting.add(file)
    for(const child of deps.get(file))traverse(child,[...chain,file])
    visiting.delete(file);visited.add(file)
  }
  files.forEach(f=>traverse(f))
  assert.equal(visited.size,files.length,'all runtime .ts modules visited')
  for(const [file,entry] of groups.map(([f,e])=>[f,e]))
    assert.ok(registrationGraph(file,entry).names.length>0,'parent still reaches tools '+file)
})
