// GSA1: pure record display handles, moved unchanged from index.ts.

export function projectHandle(projectId: string) {
  return 'P-' + projectId.replace(/-/g, '').slice(-4).toUpperCase()
}

export function jobHandle(jobId: string) {
  return 'J-' + jobId.replace(/-/g, '').slice(-4).toUpperCase()
}

export function runHandle(runId: string) {
  return 'R-' + runId.replace(/-/g, '').slice(-4).toUpperCase()
}
