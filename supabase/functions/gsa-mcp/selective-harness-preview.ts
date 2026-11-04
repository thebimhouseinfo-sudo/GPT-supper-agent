// GSA4 A4 EXPERIMENT — read-only literal-preserving Harness selection.
//
// This module is NOT wired to get_agent_harness, renderHarness, run_begin or
// any GSA MCP tool. It NEVER grants authority, permission, execution, merge,
// approval or a review/verification PASS.
//
// A4 conservatively removes a few exact planner/bootstrap *detail clauses*
// from an explicitly identified Coder defect-repair context only, while
// leaving Human/Criteria/branch gates, plan-change rules, CAS/recovery,
// source safety, Reviewer/Tester and role instructions byte-for-byte intact.
// Unknown phases/roles or unverified provenance fall back to the FULL Harness.
import { BASE_AGENT_HARNESS, renderHarness, ROLE_HARNESSES } from './harness-catalog.ts'

type PreviewInput = {
  role: string
  workflow: string
  // An explicitly classified NEW Human message invalidates stale repair-only
  // context. Caller must still independently classify/read the true message.
  human_message_kind?: 'SAME_APPROVED_TASK' | 'BOOTSTRAP' | 'NEW_FEATURE' | 'MATERIAL_UPDATE' | 'REFACTOR' | 'QUESTION' | 'UNKNOWN'
  task_context?: {
    schema: string
    advisory_only: boolean
    execution_authorized: boolean
    decision?: string
    identity?: { role?: string; task_id?: string | null; phase?: string }
    findings?: Array<{code?: string}>
  }
  repair_context?: {
    schema: string
    advisory_only: boolean
    repair_authorized: boolean
    test_pass_claimed?: boolean
    root_cause_confirmed: boolean
    classification?: string
    decision?: string
    source_ref?: string | null
    source_candidates?: unknown[]
    findings?: Array<{code?: string}>
  }
  current_source_ref?: string
  // A caller supplied these fields; this pure module cannot verify any of
  // them against Git, current Project Memory, Host permissions or approvals.
}
const SHA = /^[0-9a-f]{40}$/
const safeTask = (v: unknown) => typeof v === 'string' && v.trim().length > 0

// EXACT original labels from harness/shared.ts, intentionally not reworded.
// These four clauses instruct Planner/Orchestrator on *how* to perform
// planning/Bootstrap, not how to authorize or execute a Coder repair.
// All cross-role and boundary policy clauses remain in the output.
export const A4_REPAIR_ONLY_OMITTED_DETAIL_LABELS = [
  'PLAN GOAL ANCHORS',
  'PLANNER RL SHORTCUT',
  'BOOTSTRAP CHECKLIST COORDINATOR',
  'LLC60 PLANNING CONTINUATION',
] as const

// Critical source-unchanged rules required before a preview may be offered.
// Mandatory rules are not restricted to this list; ALL non-omitted clauses
// survive in original order without edits. This list is an extra fail-closed
// guard against accidental broad policy filtering.
export const A4_REPAIR_MANDATORY_MARKERS = [
  'HUMAN EXECUTION APPROVAL',
  'TECH ADVISOR CHECKPOINTS',
  'CRITERIA CHANGE ORDER',
  'BRANCH AUTHORITY',
  'STOPCHAT',
  'REVIEW LOOP',
  'PROJECT ADDINS',
  'authorize_project_scope',
  'A denied or unauthorized action',
  'NEXT source work',
  'On restart, read the single durable cursor',
  'On unknown Git write outcome',
  'LLC58 HUMAN PLAN CHANGE',
  'LLC59 AUTONOMOUS-FIRST CI',
  'NEXT dispatch requires',
  'NEXT success closure requires',
  'Agent-authored text never counts as human approval',
  'Verification is evidence',
] as const

function originalFull(role: string) {
  return renderHarness(role, {includeProgressiveSkills:false})
}

export function previewSelectiveHarness(input: PreviewInput) {
  const role = input?.role
  const original = originalFull(role)
  if (!original) return {
    schema:'gsa4-a4-selective-harness-preview/v1' as const,
    mode:'INVALID_ROLE' as const, advisory_only:true as const,
    execution_authorized:false as const, reason:'Unknown current GSA Role',
    harness_text:null, original_chars:0, selected_chars:0, saved_chars:0,
    omitted_labels:[] as string[], missing_mandatory:[] as string[],
  }
  const t=input?.task_context
  const r=input?.repair_context
  const wanted =
    role==='coder' && input?.workflow==='PRODUCT_DEFECT_REPAIR' &&
    (input.human_message_kind===undefined || input.human_message_kind==='SAME_APPROVED_TASK') &&
    t?.schema==='gsa4-a2-task-context-recipe/v1' &&
    t.advisory_only===true && t.execution_authorized===false &&
    t.decision!=='STOP' &&
    t.identity?.role==='coder' && safeTask(t.identity.task_id) &&
    r?.schema==='gsa4-a3-repair-context/v1' &&
    r.advisory_only===true && r.repair_authorized===false &&
    r.test_pass_claimed===false && r.root_cause_confirmed===false &&
    r.classification==='PRODUCT_FAILURE' && r.decision!=='STOP' &&
    SHA.test(input?.current_source_ref??'') &&
    r.source_ref===input.current_source_ref &&
    Array.isArray(r.source_candidates) && r.source_candidates.length>0 &&
    ![...(Array.isArray(t.findings)?t.findings:[]),
      ...(Array.isArray(r.findings)?r.findings:[])].some(x=>
        x?.code==='TASK_ID_MISMATCH' || x?.code==='JOB_IDENTITY_UNVERIFIED' ||
        x?.code==='RUN_IDENTITY_MISMATCH' || x?.code==='ROLE_UNKNOWN' ||
        x?.code==='JOB_NOT_CURRENT' || x?.code==='TASK_CONTEXT_BLOCKED' ||
        x?.code==='SOURCE_LOCATOR_UNAVAILABLE' ||
        x?.code==='LOCATOR_REVISION_MISMATCH' ||
        x?.code==='REPAIR_GRAPH_REVISION_MISMATCH' ||
        x?.code==='PLAN_CHANGE_PENDING' || x?.code==='TASK_RETIRED' ||
        x?.code==='TASK_NOT_IN_CURRENT_JOB' ||
        x?.code==='RUN_LIFECYCLE_REVALIDATE' ||
        x?.code==='PLANNING_REVIEW_REVALIDATE' ||
        x?.code==='JOB_SHA_REVALIDATE' ||
        x?.code==='TASK_HANDLER_MISMATCH' ||
        x?.code==='SOURCE_LOCATOR_REVALIDATE' ||
        x?.code==='PRODUCT_TARGET_REVALIDATE' ||
        x?.code==='SPEC_DECISION_REQUIRED')
  if (!wanted) return {
    schema:'gsa4-a4-selective-harness-preview/v1' as const,
    mode:'FULL_FALLBACK' as const, advisory_only:true as const,
    execution_authorized:false as const,
    reason:'No source-consistent Coder defect-repair context; keep complete GSA3 Harness',
    harness_text:original,original_chars:original.length,
    selected_chars:original.length,saved_chars:0,
    omitted_labels:[] as string[], missing_mandatory:[] as string[],
  }
  const lines=BASE_AGENT_HARNESS.split('\n')
  const originalTextLines=lines.filter(x=>x.startsWith('- '))
  const omitted:string[]=[]
  const retained=lines.filter(line=>{
    for(const label of A4_REPAIR_ONLY_OMITTED_DETAIL_LABELS){
      if(line.startsWith('- '+label+':')){
        omitted.push(label)
        return false
      }
    }
    return true
  })
  // Keep a complete, stable original clause classification; an insertion,
  // rename or duplicate of a previously audited candidate fails CLOSED.
  const originalPolicyLineCount=49
  const goodOmissions=omitted.length===A4_REPAIR_ONLY_OMITTED_DETAIL_LABELS.length &&
    new Set(omitted).size===omitted.length &&
    originalTextLines.length===originalPolicyLineCount &&
    original.includes(BASE_AGENT_HARNESS)
  const sharedSelected=retained.join('\n')
  const candidate=original.replace(BASE_AGENT_HARNESS,sharedSelected)
  const mandatoryMissing=A4_REPAIR_MANDATORY_MARKERS.filter(x=>!candidate.includes(x))
  const roleIsPresent=ROLE_HARNESSES[role].authority.every(x=>candidate.includes(x)) &&
    ROLE_HARNESSES[role].loop.every(x=>candidate.includes(x)) &&
    ROLE_HARNESSES[role].outputs.every(x=>candidate.includes(x))
  if(!goodOmissions || mandatoryMissing.length || !roleIsPresent ||
      candidate.length>=original.length){
    return {
      schema:'gsa4-a4-selective-harness-preview/v1' as const,
      mode:'FULL_FALLBACK' as const,advisory_only:true as const,
      execution_authorized:false as const,
      reason:'Policy line inventory, mandatory clause or complete Role text changed; fail closed',
      harness_text:original,original_chars:original.length,
      selected_chars:original.length,saved_chars:0,
      omitted_labels:[] as string[],missing_mandatory:[...mandatoryMissing],
    }
  }
  return {
    schema:'gsa4-a4-selective-harness-preview/v1' as const,
    mode:'SELECTIVE_REPAIR_PREVIEW' as const, advisory_only:true as const,
    execution_authorized:false as const,
    reason:'Existing literal Shared clauses filtered only for verified-shape repair preview; human approval is STILL mandatory',
    harness_text:candidate,original_chars:original.length,
    selected_chars:candidate.length,saved_chars:original.length-candidate.length,
    omitted_labels:omitted,missing_mandatory:[] as string[],
  }
}
