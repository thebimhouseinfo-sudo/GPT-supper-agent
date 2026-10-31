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
