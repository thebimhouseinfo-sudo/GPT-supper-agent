import { z } from 'npm:zod@^4.1.13'

export const EVIDENCE_NEED_SCHEMA = z.object({
  evidence_need_id: z.string().min(1),
  kind: z.enum(['EVIDENCE_NEED','UNKNOWN_RUNTIME_FACT']).default('EVIDENCE_NEED'),
  description: z.string().min(1),
  owner_task_id: z.string().min(1),
  required_by_task_ids: z.array(z.string().min(1)).min(1),
  checkpoint_id: z.string().min(1),
})

export const TEST_CHECKPOINT_SPEC_SCHEMA = z.object({
  checkpoint_id: z.string().min(1),
  mode: z.enum(['VERIFY','MEASURE','PROBE']),
  boundary: z.enum(['BEFORE_NODE','AFTER_NODE_SET','MILESTONE_GATE','JOB_FINAL']),
  prerequisite_node_ids: z.array(z.string().min(1)).default([]),
  boundary_node_id: z.string().min(1).optional(),
  milestone_id: z.string().min(1).optional(),
  evidence_need_ids: z.array(z.string().min(1)).default([]),
})

export const EVIDENCE_REQUIREMENT_SCHEMA = z.object({
  evidence_requirement_id: z.string().min(1),
  consumer_task_id: z.string().min(1),
  evidence_need_id: z.string().min(1),
  checkpoint_id: z.string().min(1),
})

export const CRITERIA_BINDING_SCHEMA = z.object({
  criteria_path: z.string().min(1),
  criteria_blob_sha: z.string().regex(/^[0-9a-f]{40}$/),
  approval_status: z.literal('APPROVED'),
})



/**
 * Bootstrap is a self-driving four-item checklist, NOT four extra approvals.
 * This pure coordinator routes the next action from evidence-backed observations.
 * The caller must inspect live documents/tools itself; this PREPARE result cannot
 * attest evidence, make Github writes, summon an Advisor or run other MCP tools.
 */

// M3: prepared, reviewable product Bootstrap evidence decision.
// This is not a second lifecycle or a source-write permission. M5 must check
// fresh immutable source/Memory snapshots and actual Human approval before dispatch.

// C31: one canonical Criteria file, one scoped acknowledgement after actual Advisor advice.
// This validates scope and document shape, not the origin of chat messages. A caller-supplied
// signature is not evidence that an Advisor actually advised Human; readback is mandatory.
// C31 shared writer/parser. Legacy Markdown is read, not rewritten.

// M5: reuse M3 Bootstrap assessment for the two GSA-owned consequential
// boundaries. This is a per-write evidence check, not a new Bootstrap lifecycle.
// GitHub evidence provenance and Human authorization must still be independently
// read back before the actual external GitHub source write.

export const MILESTONE_SCHEMA = z.object({
  milestone_id: z.string().min(1),
  name: z.string().min(1),
  node_ids: z.array(z.string().min(1)).min(1),
  gate_checkpoint_ids: z.array(z.string().min(1)).default([]),
  review_loop: z.enum(['none','rl','crl']).default('none'),
  human_pre_authorized: z.boolean().default(false),
  continuation: z.enum(['AUTO','HUMAN']).default('HUMAN'),
})

export const PLANNING_TOPOLOGY_NODE_SCHEMA = z.object({
  node_id: z.string().min(1),
  node_type: z.enum(['TASK','TEST_CHECKPOINT','MILESTONE_GATE']),
  depends_on: z.array(z.string().min(1)).default([]),
})

export const DURABLE_RECORD_SNAPSHOT_SCHEMA = z.object({
  path: z.string().min(1),
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  record_text: z.string().min(2),
})




export const PLANNING_LOOP_CONTINUATION_SCHEMA = z.object({
  state: z.enum(['AWAITING_DURABLE_READBACK', 'NOT_APPLICABLE']),
  next_action_after_readback: z.enum([
    'REVIEW_CURRENT_REVISION','REVISE_PLAN','PROMOTE_READY',
    'PRESENT_PLAN_FOR_APPROVAL','STOP_HUMAN_DECISION','STOP_BLOCKED','NONE',
  ]),
  next_role: z.enum(['reviewer','planner','orchestrator','human','none']),
  resume_same_turn: z.boolean(),
  requires_readback: z.boolean(),
  planning_revision: z.number().int().positive(),
  human_action_required: z.boolean(),
  mutation_authorized: z.literal(false),
})

// Product Criteria intake only; current GSA execution gates remain unchanged.
