const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.join(__dirname,'../supabase/functions/gsa-mcp');
const pid = '01a0f051-4353-7bff-8edf-46be4b44fd2f';
const mod = import(pathToFileURL(path.join(root,'decision-fidelity.ts')).href);
const sha = 'a'.repeat(40);
function ref(id='DEC-001', sourceSha=sha, status='ACCEPTED', clauses=['METHOD','EXCEPTION-NO-BACKUP','RATIONALE'], superseded_by=null) {
  return {decision_id:id, source_path:'projects/'+pid+'/KNOWLEDGE/DECISIONS/'+id+'.md',
    source_sha:sourceSha,status,clauses,superseded_by};
}
function edge(id,clause,taskId='UA-01',precedence='COVERED',reason='Original accepted rule including negative exception') {
  return {source:id+'/'+clause,target:taskId,relationship:'DECISION_COVERAGE',
    precedence,reason,reread_condition:'BEFORE_REVISION_AND_REVIEW',evidence:['Human accepted original source']};
}
function doc(refs=[ref()],edges=[edge('DEC-001','METHOD'),edge('DEC-001','EXCEPTION-NO-BACKUP','UA-02'),edge('DEC-001','RATIONALE','UA-02')]) {
  return {project_id:pid,tasks:[{task_id:'UA-01'},{task_id:'UA-02'}],
    repository_discovery:{selected_source_evidence:refs.map(r=>'DECISION_REF:'+JSON.stringify(r))},
    planning_context:{relationship_assessment:edges}};
}
async function check(x){return (await mod).decisionFidelityError(x);}
test('backward-compatible Job without DEC',async()=>assert.equal(await check(doc([],[])),null));
test('valid original and negative exception',async()=>assert.equal(await check(doc()),null));
test('heading-only Plan missing exception blocked',async()=>{
  const x=doc();x.planning_context.relationship_assessment.splice(1,1);
  assert.match(await check(x),/COVERAGE_MISSING: DEC-001\/EXCEPTION-NO-BACKUP/);
});
test('speculative discussion is not accepted',async()=>{
  assert.match(await check(doc([ref('DEC-001',sha,'PROPOSED')])),/DECISION_NOT_ACCEPTED/);
});
test('cross-Project source denied',async()=>{
  const r=ref();r.source_path='projects/other/KNOWLEDGE/DECISIONS/DEC-001.md';
  assert.match(await check(doc([r])),/DECISION_SOURCE_INVALID/);
});
test('path traversal denied',async()=>{
  const r=ref();r.source_path='projects/'+pid+'/KNOWLEDGE/DECISIONS/../other.md';
  assert.match(await check(doc([r])),/DECISION_SOURCE_INVALID/);
});
test('path and DEC ID must match',async()=>{
  const r=ref();r.source_path='projects/'+pid+'/KNOWLEDGE/DECISIONS/DEC-999.md';
  assert.match(await check(doc([r])),/DECISION_SOURCE_INVALID/);
});
test('invalid blob SHA denied',async()=>{
  assert.match(await check(doc([ref('DEC-001','bad-sha')])),/DECISION_SOURCE_INVALID/);
});
test('invalid evidence JSON denied',async()=>{
  const x=doc();x.repository_discovery.selected_source_evidence=['DECISION_REF:{oops'];
  assert.match(await check(x),/DECISION_REF_JSON_INVALID/);
});
test('unknown decision in mapping denied',async()=>{
  const x=doc();x.planning_context.relationship_assessment[0].source='DEC-OTHER/METHOD';
  assert.match(await check(x),/DECISION_COVERAGE_UNKNOWN_CLAUSE/);
});
test('unknown clause in mapping denied',async()=>{
  const x=doc();x.planning_context.relationship_assessment[0].source='DEC-001/INVENTED';
  assert.match(await check(x),/DECISION_COVERAGE_UNKNOWN_CLAUSE/);
});
test('unknown Task in mapping denied',async()=>{
  const x=doc();x.planning_context.relationship_assessment[0].target='UA-MISSING';
  assert.match(await check(x),/DECISION_COVERAGE_UNKNOWN_TASK/);
});
test('CONTRADICTED does not PASS',async()=>{
  const x=doc();x.planning_context.relationship_assessment[0].precedence='CONTRADICTED';
  assert.match(await check(x),/DECISION_COVERAGE_NOT_PROVEN/);
});
test('MISSING does not PASS',async()=>{
  const x=doc();x.planning_context.relationship_assessment[0].precedence='MISSING';
  assert.match(await check(x),/DECISION_COVERAGE_NOT_PROVEN/);
});
test('empty explanation cannot PASS',async()=>{
  const x=doc();x.planning_context.relationship_assessment[0].reason=' ';
  assert.match(await check(x),/DECISION_COVERAGE_NOT_PROVEN/);
});
test('orphan DEC coverage without source denied',async()=>{
  assert.match(await check(doc([], [edge('DEC-001','METHOD')])),/DECISION_COVERAGE_ORPHAN/);
});
test('duplicate DEC ID denied',async()=>assert.match(await check(doc([ref(),ref()])),/DECISION_DUPLICATE_REF/));
test('duplicate clause mapping denied',async()=>{
  const x=doc();x.planning_context.relationship_assessment.push(edge('DEC-001','METHOD'));
  assert.match(await check(x),/DECISION_COVERAGE_DUPLICATE/);
});
test('two sequential corrections preserve old refs',async()=>{
  const old=ref('DEC-001',sha,'SUPERSEDED',undefined,'DEC-002');
  const mid=ref('DEC-002','b'.repeat(40),'SUPERSEDED',undefined,'DEC-003');
  const current=ref('DEC-003','c'.repeat(40));
  const x=doc([old,mid,current],[edge('DEC-001','METHOD'),edge('DEC-002','METHOD'),
    edge('DEC-003','METHOD'),edge('DEC-003','EXCEPTION-NO-BACKUP','UA-02'),edge('DEC-003','RATIONALE','UA-02')]);
  assert.equal(await check(x),null);
  assert.equal((await mod).decisionRevisionError(doc(),x),null);
});
test('supersession cycle denied',async()=>{
  const r=ref();r.status='SUPERSEDED';r.superseded_by='DEC-001';
  assert.match(await check(doc([r])),/DECISION_SUPERSESSION_CYCLE/);
});
test('unknown supersession target denied',async()=>{
  const r=ref();r.status='SUPERSEDED';r.superseded_by='DEC-999';
  assert.match(await check(doc([r])),/DECISION_SUPERSESSION_TARGET_MISSING/);
});
test('revision cannot erase source',async()=>{
  assert.match((await mod).decisionRevisionError(doc(),doc([],[])),/DECISION_REVISION_ERASES_SOURCE/);
});
test('revision cannot rewrite source SHA',async()=>{
  assert.match((await mod).decisionRevisionError(doc(),doc([ref('DEC-001','b'.repeat(40))])),/DECISION_REVISION_MUTATES_SOURCE/);
});
test('revision cannot revive old superseded source',async()=>{
  const r=ref();r.status='SUPERSEDED';r.superseded_by='DEC-002';
  assert.match((await mod).decisionRevisionError(doc([r]),doc()),/DECISION_REVISION_REWRITES_HISTORY/);
});
test('Plan revision remaps Task IDs while preserving original source',async()=>{
  const before=doc(),after=doc();after.tasks[1].task_id='UA-03';
  after.planning_context.relationship_assessment=after.planning_context.relationship_assessment.map(e=>
    e.target==='UA-02'?{...e,target:'UA-03'}:e);
  assert.equal((await mod).decisionRevisionError(before,after),null);
  assert.equal(await check(after),null);
});
test('normal repository relationship entries unaffected',async()=>{
  const x=doc();x.planning_context.relationship_assessment.push({source:'a',target:'b',
    relationship:'DEPENDS_ON',precedence:'a>b',reason:'observed repo relation'});
  assert.equal(await check(x),null);
});
test('Secretary optional progressive skill, not a new role',async()=>{
  const h=await import(pathToFileURL(path.join(root,'harness-catalog.ts')).href);
  const loader=fs.readFileSync(path.join(root,'harness-skill-tools.ts'),'utf8');
  assert.ok(h.RUNTIME_SKILLS.secretary.body.includes('Human'));
  assert.ok(h.ROLE_SKILLS.planner.includes('secretary'));
  assert.ok(!Object.keys(h.ROLE_HARNESSES).includes('secretary'));
  assert.ok(loader.includes("'critical-challenge','secretary'"));
});
test('existing public Zod schemas unchanged',async()=>{
  for(const name of ['job-prepare-tool.ts','job-revise-plan-tool.ts']){
    const s=fs.readFileSync(path.join(root,name),'utf8');
    assert.ok(!s.includes('decisionInputSchemas('));
    assert.ok(!s.includes('decision_refs:'));
    assert.ok(!s.includes('decision_coverage:'));
    assert.ok(s.includes('decisionFidelityError('));
  }
  const s=fs.readFileSync(path.join(root,'plan-review-record-tool.ts'),'utf8');
  assert.ok(s.includes('decisionFidelityError(current)'));
});
