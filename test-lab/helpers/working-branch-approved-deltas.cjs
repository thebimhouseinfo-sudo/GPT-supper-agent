'use strict'
// GSA4 Branch Governance repair: narrow, exact, approved implementation hunks.
// A normalization MUST remove EACH expected delta exactly once and nothing else.
// After normalization legacy GSA3/GSA4 pinned checks still execute unchanged.
const assert=require('node:assert/strict')
const APPROVED={
  "run/run-begin.ts": [
    {
      "remove": [],
      "add": [
        "        source_branch: z.string().optional(),"
      ]
    },
    {
      "remove": [
        "    async ({ project_id, job_id, job_record_text, job_record_sha, current_job_record_sha, planning_revision, role, scope_claim, primary_task_id, affected_task_refs, parent_run_id, target_ref, target_revision, input_refs, checkpoint_claim_snapshots, checkpoint_verification_snapshots, completed_task_run_snapshots, project_manifest_text, bootstrap_evidence }: any) => {"
      ],
      "add": [
        "    async ({ project_id, job_id, job_record_text, job_record_sha, current_job_record_sha, planning_revision, role, scope_claim, primary_task_id, affected_task_refs, parent_run_id, target_ref, target_revision, source_branch, input_refs, checkpoint_claim_snapshots, checkpoint_verification_snapshots, completed_task_run_snapshots, project_manifest_text, bootstrap_evidence }: any) => {"
      ]
    },
    {
      "remove": [
        "          owningJob.repository_context?.integration_branch ?? null)"
      ],
      "add": [
        "          source_branch ?? owningJob.repository_context?.integration_branch ?? null,",
        "          primary_task_id ? { job_id, task_id: primary_task_id } : null)"
      ]
    },
    {
      "remove": [],
      "add": [
        "        ...(source_branch ? { source_branch } : {}),",
        "        ...(owningJob.tasks?.some((t: any) => t.task_id === primary_task_id && t.convergence_task === true) ? {",
        "          convergence_task: true,",
        "          incoming_branches: owningJob.tasks?.find((t: any) => t.task_id === primary_task_id)?.incoming_branches ?? [],",
        "        } : {}),"
      ]
    },
    {
      "remove": [
        "          'For coder source writes, re-read Project lifecycle and live target revision immediately before the first write.',"
      ],
      "add": [
        "          'For coder source writes, re-read Project lifecycle, registered Working Branch ownership (when applicable) and live source branch HEAD immediately before the first write.',"
      ]
    }
  ],
  "run/complete.ts": [
    {
      "remove": [],
      "add": [
        "import { parseProjectManifest } from '../project-manifest-scope.ts'",
        "import { convergenceCompletionError } from '../branch-governance.ts'"
      ]
    },
    {
      "remove": [],
      "add": [
        "        project_manifest_text: z.string().min(1).optional(),",
        "        project_manifest_sha: z.string().regex(/^[a-f0-9]{40}$/).optional(),"
      ]
    },
    {
      "remove": [
        "    async ({ project_id, job_id, run_id, role, run_record_text, run_record_sha, lifecycle, result, output_refs, verification_refs, goal_recheck_record_text, goal_recheck_verification_ref, goal_recheck_snapshot, job_record_text, job_record_sha, run_verification_snapshot, handoff }: any) => {"
      ],
      "add": [
        "    async ({ project_id, job_id, run_id, role, run_record_text, run_record_sha, lifecycle, result, output_refs, verification_refs, goal_recheck_record_text, goal_recheck_verification_ref, goal_recheck_snapshot, job_record_text, job_record_sha, project_manifest_text, project_manifest_sha, run_verification_snapshot, handoff }: any) => {"
      ]
    },
    {
      "remove": [],
      "add": [
        "      let owningNextJob: any = null"
      ]
    },
    {
      "remove": [],
      "add": [
        "        owningNextJob = owning"
      ]
    },
    {
      "remove": [],
      "add": [
        "      // Enforce the reviewed Job's Task identity, not only the mutable Run",
        "      // record flag: a stale or stripped convergence bit must never bypass M03.",
        "      if (role === 'coder' && lifecycle === 'COMPLETED' && executionContract === 'NEXT') {",
        "        const owningTask = owningNextJob?.tasks?.find((t: any) => t.task_id === current.primary_task_id)",
        "        if (Boolean(owningTask?.convergence_task) !== Boolean(current.convergence_task) ||",
        "            (owningTask?.convergence_task === true &&",
        "             JSON.stringify(owningTask.incoming_branches ?? []) !== JSON.stringify(current.incoming_branches ?? []))) {",
        "          return { content: [{ type: 'text', text: 'CONVERGENCE_TASK_BINDING_MISMATCH: current Run must match reviewed Job Convergence Task/incoming branches.' }], isError: true }",
        "        }",
        "      }",
        "      // Convergence is a Task responsibility, not a background cleanup Job.",
        "      // A task cannot complete successfully while any incoming branch is orphaned.",
        "      if (role === 'coder' && lifecycle === 'COMPLETED' && current.convergence_task === true) {",
        "        if (!handoff || !handoff.completed_summary) {",
        "          return { content: [{ type: 'text', text: 'CONVERGENCE_DOWNSTREAM_HANDOFF_REQUIRED: downstream handoff must be prepared and persisted before Run closure.' }], isError: true }",
        "        }",
        "        const manifest = project_manifest_text && project_manifest_sha ? parseProjectManifest(project_manifest_text) : null",
        "        if (!manifest || manifest.project_id !== project_id || manifest.lifecycle !== 'ACTIVE') {",
        "          return { content: [{ type: 'text', text: 'CONVERGENCE_MANIFEST_REQUIRED: exact active Project manifest and blob SHA are required.' }], isError: true }",
        "        }",
        "        const closureError = convergenceCompletionError(manifest.working_branches, project_id, job_id,",
        "          current.primary_task_id ?? '', current.incoming_branches ?? [],",
        "          [...(owningNextJob?.linked_job_ids ?? []), ...(owningNextJob?.dependencies ?? [])])",
        "        if (closureError) return { content: [{ type: 'text', text: closureError }], isError: true }",
        "      }"
      ]
    },
    {
      "remove": [],
      "add": [
        "          ...(current.convergence_task === true ? ['Read back the exact PROJECT.md blob SHA and independently verify every incoming Working Branch disposition, closure evidence, physical ref state and handoff before completing convergence.'] : []),"
      ]
    }
  ],
  "project-manifest-scope.ts": [
    {
      "remove": [],
      "add": [
        "import { parseWorkingBranchRows } from './branch-governance.ts'"
      ]
    },
    {
      "remove": [],
      "add": [
        "  const working_branches = parseWorkingBranchRows(text)",
        "  if (working_branches === null) return null // malformed Working Branch rows fail closed"
      ]
    },
    {
      "remove": [],
      "add": [
        "    working_branches,"
      ]
    }
  ]
}
function normalizeWorkingBranchDelta(file,source){
 const hunks=APPROVED[file]
 assert.ok(hunks, 'no approved Working Branch delta for: '+file)
 let normalized=source
 for(let i=hunks.length-1;i>=0;i--){
  const h=hunks[i]
  const added=h.add.join('\n')+'\n'
  const removed=h.remove.length?h.remove.join('\n')+'\n':''
  assert.ok(h.add.length,'unexpected empty approved insertion for '+file+'/'+i)
  assert.equal(normalized.split(added).length,2,file+'/'+i+': expected exact Working Branch change once')
  normalized=normalized.replace(added,removed)
 }
 return normalized
}
module.exports={normalizeWorkingBranchDelta,APPROVED}
