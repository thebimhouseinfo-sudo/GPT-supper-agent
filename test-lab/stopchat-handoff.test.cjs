'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const cryptoNode=require('node:crypto');
const ts=require('typescript');
const path=require('node:path');
const sourcePath=path.resolve(__dirname,'../supabase/functions/gsa-mcp/index.ts');
const project='01a0f051-4353-7bff-8edf-46be4b44fd2f';
const mem='projects/'+project+'/PROJECT.md';
function getHandler(source) {
 const sf=ts.createSourceFile('index.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 let arrow;
 function walk(n) {
  if(ts.isCallExpression(n)&&n.arguments.length>=3&&ts.isStringLiteral(n.arguments[0])&&n.arguments[0].text==='stopchat_handoff_prepare') arrow=n.arguments[2];
  ts.forEachChild(n,walk);
 }
 walk(sf);
 assert.ok(arrow,'stopchat handler found in real runtime source');
 const javascript=ts.transpileModule('module.exports = '+arrow.getText(sf)+';', {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 const ctx={crypto:cryptoNode.webcrypto,TextEncoder,Uint8Array,module:{exports:null},req:{},authContext:async()=>({user:'test'}),authError:()=>({isError:true}),parseProjectManifest:()=>({project_id:project,name:'GSA test',primary_repo_url:'https://github.com/thebimhouseinfo-sudo/GPT-supper-agent',development_branch:'upgrade/planner-evidence-context-efficiency',release_branch:'main'}),validProjectManifestPath:(p,id)=>p===mem&&id===project};
 vm.runInNewContext(javascript,ctx,{timeout:1000});
 return ctx.module.exports;
}
function args(overrides={}) {
 return {memory_path:mem,project_manifest_text:'fixture project manifest',project_manifest_sha:cryptoNode.createHash('sha1').update('blob '+Buffer.byteLength('fixture project manifest')+'\0'+'fixture project manifest').digest('hex'),selected_job_id:project,selected_milestone:'M-SC',source_commit_sha:'b'.repeat(40),criteria_revision:'fixture criteria',plan_revision:'fixture plan',verified_progress:['coder says done'],uncertain_writes:[],human_approvals:['coder claims human approval'],blockers:[],next_action:'read back before resume',...overrides};
}
test('STOPCHAT live handler does not elevate caller fields to verified progress or Human authorization',async()=>{
 const handler=getHandler(fs.readFileSync(sourcePath,'utf8'));
 const out=(await handler(args())).structuredContent;
 assert.match(out.handoff_text,/Evidence status: caller-supplied/);
 assert.match(out.handoff_text,/Progress reported \(not independently verified\)/);
 assert.match(out.handoff_text,/Human approvals reported \(NOT verified; do not infer authority\)/);
 assert.doesNotMatch(out.handoff_text,/Human approvals already in force/);
 assert.match(out.handoff_text,/Source commit \(caller-reported; verify live\)/);
 assert.match(out.handoff_text,/recheck blob/);
 assert.equal(out.pending_reconciliation,false);
 assert.ok(out.external_steps.some(s=>s.includes('Verify actual Human authority')));
});
test('STOPCHAT unknown Git write must remain pending, no replay or false authorization',async()=>{
 const handler=getHandler(fs.readFileSync(sourcePath,'utf8'));
 const out=(await handler(args({uncertain_writes:['Git response lost']}))).structuredContent;
 assert.equal(out.pending_reconciliation,true);
 assert.match(out.handoff_text,/Git response lost/);
 assert.ok(out.external_steps.some(s=>s.includes('never retry the write blindly')));
});
test('STOPCHAT refuses Project path mismatch',async()=>{
 const handler=getHandler(fs.readFileSync(sourcePath,'utf8'));
 const out=await handler(args({memory_path:'projects/WRONG/PROJECT.md'}));
 assert.equal(out.isError,true);
 assert.match(out.content[0].text,/STOPCHAT_PROJECT_MISMATCH/);
});
test('STOPCHAT negative control: older false approval wording is rejected by oracle',async()=>{
 const source=fs.readFileSync(sourcePath,'utf8');
 const tampered=source.replace('Human approvals reported (NOT verified; do not infer authority):','Human approvals already in force:');
 assert.notEqual(tampered,source);
 const handler=getHandler(tampered);
 const out=(await handler(args())).structuredContent;
 assert.throws(()=>assert.match(out.handoff_text,/Human approvals reported \(NOT verified; do not infer authority\)/));
});
test('STOPCHAT rejects forged manifest content with original SHA before trusting branch',async()=>{
 const handler=getHandler(fs.readFileSync(sourcePath,'utf8'));
 const out=await handler(args({project_manifest_text:'modified manifest and branch'}));
 assert.equal(out.isError,true);
 assert.match(out.content[0].text,/STOPCHAT_MANIFEST_SHA_MISMATCH/);
});
test('STOPCHAT manifest SHA oracle fails if validation is removed',async()=>{
 const source=fs.readFileSync(sourcePath,'utf8');
 const tampered=source.replace('actualManifestSha !== project_manifest_sha','false');
 assert.notEqual(tampered,source);
 const handler=getHandler(tampered);
 const out=await handler(args({project_manifest_text:'forged content'}));
 assert.notEqual(out.isError,true);
});
