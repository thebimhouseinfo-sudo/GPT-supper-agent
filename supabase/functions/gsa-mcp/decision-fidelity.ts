// U-A Decision Fidelity using ONLY the existing Job record fields.
// DECISION_REF entries live in repository_discovery.selected_source_evidence;
// DECISION_COVERAGE edges live in planning_context.relationship_assessment.
// No new public tool input or durable Job schema is introduced.
// Source correctness, Human acceptance, and GitHub CAS require independent evidence.
export type DecisionRef = {
  decision_id: string;
  source_path: string;
  source_sha: string;
  status: 'ACCEPTED' | 'SUPERSEDED';
  clauses: string[];
  superseded_by?: string | null;
};
type Relationship = {
  source?: string; target?: string; relationship?: string;
  precedence?: string; reason?: string;
};
export type LinkedJob = {
  project_id: string;
  repository_discovery?: {selected_source_evidence?: string[]};
  planning_context?: {relationship_assessment?: Relationship[]};
  tasks?: {task_id?: string}[];
};
export const DECISION_PREFIX = 'DECISION_REF:';
export const COVERAGE_RELATION = 'DECISION_COVERAGE';
const ID = /^DEC-[A-Za-z0-9][A-Za-z0-9-]*$/;
const CLAUSE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const SHA = /^[0-9a-f]{40}$/;

export function parseDecisionRefs(job: LinkedJob): { refs: DecisionRef[]; error: string | null } {
  const sourceEvidence = job.repository_discovery?.selected_source_evidence ?? [];
  if (!Array.isArray(sourceEvidence)) return {refs: [], error: 'DECISION_SOURCE_EVIDENCE_INVALID'};
  const refs: DecisionRef[] = [];
  for (const line of sourceEvidence) {
    if (typeof line !== 'string' || !line.startsWith(DECISION_PREFIX)) continue;
    let ref: any;
    try { ref = JSON.parse(line.slice(DECISION_PREFIX.length)); }
    catch { return {refs, error:'DECISION_REF_JSON_INVALID'}; }
    if (!ref || typeof ref !== 'object' || !ID.test(ref.decision_id ?? ''))
      return {refs,error:'DECISION_ID_INVALID'};
    const path = 'projects/' + job.project_id + '/KNOWLEDGE/DECISIONS/' + ref.decision_id + '.md';
    if (ref.source_path !== path || !SHA.test(ref.source_sha ?? ''))
      return {refs,error:'DECISION_SOURCE_INVALID: '+ref.decision_id};
    if (ref.status !== 'ACCEPTED' && ref.status !== 'SUPERSEDED')
      return {refs,error:'DECISION_NOT_ACCEPTED: '+ref.decision_id};
    if (!Array.isArray(ref.clauses) || !ref.clauses.length ||
      ref.clauses.some((v:any) => typeof v !== 'string' || !CLAUSE.test(v)) ||
      new Set(ref.clauses).size !== ref.clauses.length)
      return {refs,error:'DECISION_CLAUSES_INVALID: '+ref.decision_id};
    if (ref.status === 'ACCEPTED' && ref.superseded_by)
      return {refs,error:'DECISION_ACTIVE_SUPERSESSION_INVALID: '+ref.decision_id};
    if (refs.some((r) => r.decision_id === ref.decision_id))
      return {refs,error:'DECISION_DUPLICATE_REF: '+ref.decision_id};
    refs.push(ref as DecisionRef);
  }
  return {refs,error:null};
}

export function decisionFidelityError(job: LinkedJob): string | null {
  const parsed = parseDecisionRefs(job);
  if (parsed.error) return parsed.error;
  const refs = parsed.refs;
  const rows = (job.planning_context?.relationship_assessment ?? []).filter((r) => r?.relationship === COVERAGE_RELATION);
  if (!refs.length) return rows.length ? 'DECISION_COVERAGE_ORPHAN' : null;
  const map = new Map(refs.map((r) => [r.decision_id,r]));
  for (const ref of refs) {
    if (ref.status !== 'SUPERSEDED') continue;
    const visited = new Set([ref.decision_id]);
    let next: DecisionRef | undefined = ref;
    while (next?.status === 'SUPERSEDED') {
      const target=next.superseded_by;
      if (!target || visited.has(target)) return 'DECISION_SUPERSESSION_CYCLE: '+ref.decision_id;
      visited.add(target);
      next=map.get(target);
      if (!next) return 'DECISION_SUPERSESSION_TARGET_MISSING: '+ref.decision_id;
    }
  }
  const tasks = new Set((job.tasks ?? []).map((t)=>t.task_id).filter(Boolean));
  const seen = new Set<string>();
  for (const edge of rows) {
    const [id,clause,extra] = String(edge.source??'').split('/');
    const ref = map.get(id);
    if (!ref || extra !== undefined || !ref.clauses.includes(clause))
      return 'DECISION_COVERAGE_UNKNOWN_CLAUSE: '+String(edge.source);
    if(ref.status === 'SUPERSEDED') continue; // Retain source evidence, do not require obsolete Task.
    if (!tasks.has(edge.target)) return 'DECISION_COVERAGE_UNKNOWN_TASK: '+String(edge.target);
    const key=id+'/'+clause;
    if (seen.has(key)) return 'DECISION_COVERAGE_DUPLICATE: '+key;
    seen.add(key);
    if (edge.precedence !== 'COVERED' || !edge.reason?.trim())
      return 'DECISION_COVERAGE_NOT_PROVEN: '+key;
  }
  for(const ref of refs){
    if(ref.status !== 'ACCEPTED') continue;
    for(const clause of ref.clauses) {
      if (!seen.has(ref.decision_id+'/'+clause))
        return 'DECISION_COVERAGE_MISSING: '+ref.decision_id+'/'+clause;
    }
  }
  return null;
}

// Existing evidence is immutable: Plan revision may append a corrected Decision
// and preserve the original source reference. It must not rewrite old source.
export function decisionRevisionError(before: LinkedJob, after: LinkedJob): string | null {
  const b=parseDecisionRefs(before);
  const a=parseDecisionRefs(after);
  if(b.error) return b.error;
  if(a.error) return a.error;
  const next = new Map(a.refs.map((r)=>[r.decision_id,r]));
  for(const r of b.refs){
    const n=next.get(r.decision_id);
    if (!n) return 'DECISION_REVISION_ERASES_SOURCE: '+r.decision_id;
    if (n.source_path!==r.source_path || n.source_sha!==r.source_sha ||
        JSON.stringify(n.clauses)!==JSON.stringify(r.clauses))
      return 'DECISION_REVISION_MUTATES_SOURCE: '+r.decision_id;
    if(r.status==='SUPERSEDED' &&
       (n.status!=='SUPERSEDED'||n.superseded_by!==r.superseded_by))
      return 'DECISION_REVISION_REWRITES_HISTORY: '+r.decision_id;
    if(r.status==='ACCEPTED' && n.status==='SUPERSEDED' && !n.superseded_by)
      return 'DECISION_REVISION_MISSING_CORRECTION: '+r.decision_id;
  }
  // Task coverage is re-evaluated in each reviewed planning_revision. Git/CAS
  // retains old Plan records; valid Task renumbering does not freeze an old edge.
  // The accepted source, its full clauses and supersession ancestry remain immutable.
  return null;
}
