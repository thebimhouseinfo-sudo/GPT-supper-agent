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
  'project-utils.ts':['knowledgePath','safeProjectName','validIntegrationBranch','isRetiredSourceBranch','parseRetiredBranchRows'],
  'record-handles.ts':['projectHandle','jobHandle','runHandle','uuidv7'],
  'advisor-receipt.ts':['formatAdvisorAdviceReceipt','parseAdvisorAdviceReceipts','projectCriteriaAdvisoryDecision'],
  'platform-utils.ts':['edgeFunctionSlug','normalizeGithubRepo']
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
test('MCP tool registrations remain present at current pre-refactor source inventory',()=>{
  const names=[...index.matchAll(/server\.registerTool\(\s*['"]([^'"]+)['"]/g)].map(x=>x[1])
  assert.equal(names.length,56)
  assert.equal(new Set(names).size,names.length)
})
