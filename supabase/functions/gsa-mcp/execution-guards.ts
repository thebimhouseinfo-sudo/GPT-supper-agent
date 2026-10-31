// GSA1: execution preconditions, kept together and unchanged.

export function goalRecheckRunMatches(run: any, projectId: string, jobId: string, runId: string) {
  return run?.project_id === projectId &&
    run?.job_id === jobId &&
    run?.run_id === runId &&
    run?.role === 'coder' &&
    run?.lifecycle === 'IN_PROGRESS'
}

export function uxFirstTemporaryUiGateRequired(job: any, role: string): boolean {
  return role === 'coder' &&
    job?.product_workflow === 'UX_FIRST' &&
    Array.isArray(job?.ui_strategy?.temporary_ui) &&
    job.ui_strategy.temporary_ui.length > 0 &&
    job.ui_strategy?.temporary_ui_human_approval === 'REQUIRED_PENDING'
}

export function checkpointLeaseExpired(claim: any, nowMs = Date.now()) {
  const expires = Date.parse(String(claim?.lease_expires_at ?? ''))
  return !Number.isFinite(expires) || expires <= nowMs
}

export function checkpointBoundaryPrerequisiteIds(job: any, checkpoint: any) {
  const ids = new Set<string>(checkpoint.prerequisite_node_ids ?? [])
  if (checkpoint.boundary === 'MILESTONE_GATE') {
    const milestone = (job.milestones ?? []).find((item: any) => item.milestone_id === checkpoint.milestone_id)
    for (const id of milestone?.node_ids ?? []) if (id !== checkpoint.checkpoint_id) ids.add(id)
  }
  if (checkpoint.boundary === 'JOB_FINAL') {
    for (const node of job.planning_topology ?? []) {
      if (node.node_id !== checkpoint.checkpoint_id) ids.add(node.node_id)
    }
  }
  return [...ids]
}

export function requiredCheckpointIds(job: any, target: { kind: 'TASK' | 'MILESTONE' | 'JOB', id?: string | null }) {
  if (target.kind === 'TASK') {
    const ids = new Set<string>((job.evidence_requirements ?? [])
      .filter((item: any) => item.consumer_task_id === target.id)
      .map((item: any) => item.checkpoint_id))
    const checkpointIds = new Set<string>((job.test_checkpoints ?? []).map((item: any) => item.checkpoint_id))
    const topologyNode = (job.planning_topology ?? []).find((item: any) => item.node_id === target.id && item.node_type === 'TASK')
    for (const dependencyId of topologyNode?.depends_on ?? []) {
      if (checkpointIds.has(dependencyId)) ids.add(dependencyId)
    }
    return [...ids]
  }
  if (target.kind === 'MILESTONE') {
    const milestone = (job.milestones ?? []).find((item: any) => item.milestone_id === target.id)
    return [...new Set<string>(milestone?.gate_checkpoint_ids ?? [])]
  }
  return [...new Set<string>((job.test_checkpoints ?? []).map((item: any) => item.checkpoint_id))]
}
