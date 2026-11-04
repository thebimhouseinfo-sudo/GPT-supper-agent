import { DEFAULT_EXECUTION_CONTRACT, DEFAULT_NEXT_MEMORY_NAMESPACE, resolveExecutionContract, jobExecutionContract } from './runtime-contract.ts'
import type { ExecutionContract, NextMemoryNamespace } from './runtime-contract.ts'

export function resolveNextMemoryNamespace(value: unknown, executionContract: ExecutionContract | null = 'NEXT'): NextMemoryNamespace | null {
  if (executionContract !== 'NEXT') return null
  if (value == null || value === '') return DEFAULT_NEXT_MEMORY_NAMESPACE
  return value === 'TEST_LAB' || value === 'PRODUCTION' ? value : null
}

export function recordNextMemoryNamespace(record: any): NextMemoryNamespace | null {
  const executionContract = resolveExecutionContract(record?.execution_contract)
  return resolveNextMemoryNamespace(record?.memory_namespace, executionContract)
}

export function sameNextMemoryNamespace(a: any, b: any) {
  const aContract = resolveExecutionContract(a?.execution_contract)
  const bContract = resolveExecutionContract(b?.execution_contract)
  if (aContract !== 'NEXT' || bContract !== 'NEXT') return aContract === bContract
  return recordNextMemoryNamespace(a) === recordNextMemoryNamespace(b)
}

export function executionMemoryRoot(
  projectId: string,
  executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT,
  nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE,
) {
  if (executionContract !== 'NEXT') return 'projects/' + projectId
  return nextMemoryNamespace === 'PRODUCTION'
    ? 'projects/' + projectId
    : 'projects/' + projectId + '/TEST-LAB/NEXT'
}

export function recordPath(
  projectId: string,
  family: 'JOBS' | 'RUNS' | 'HANDOFFS' | 'CHECKPOINT_ATTEMPTS',
  recordId: string,
  executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT,
  nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE,
) {
  return executionMemoryRoot(projectId, executionContract, nextMemoryNamespace) + '/WORK/' + family + '/' + recordId + '.json'
}

export function verificationPath(
  projectId: string,
  verificationId: string,
  executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT,
  nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE,
) {
  return executionMemoryRoot(projectId, executionContract, nextMemoryNamespace) + '/VERIFICATION/' + verificationId + '.json'
}

export function checkpointClaimPath(
  projectId: string,
  jobId: string,
  planningRevision: number,
  checkpointId: string,
  nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE,
) {
  return executionMemoryRoot(projectId, 'NEXT', nextMemoryNamespace) + '/WORK/CHECKPOINT_CLAIMS/' + jobId + '/r' + planningRevision + '/' + encodeURIComponent(checkpointId) + '.json'
}

export function checkpointAttemptPath(projectId: string, attemptId: string, nextMemoryNamespace: NextMemoryNamespace = DEFAULT_NEXT_MEMORY_NAMESPACE) {
  return recordPath(projectId, 'CHECKPOINT_ATTEMPTS', attemptId, 'NEXT', nextMemoryNamespace)
}


export function parseRecordTexts(texts: string[], label: string) {
  const records: any[] = []
  for (const text of texts ?? []) {
    try { records.push(JSON.parse(text)) } catch {
      return { records: [], error: label + ' contains invalid JSON.' }
    }
  }
  return { records, error: null as string | null }
}

export function parseDurableSnapshots(snapshots: any[], label: string) {
  const entries: any[] = []
  for (const snapshot of snapshots ?? []) {
    if (!snapshot || typeof snapshot.path !== 'string' || !snapshot.path || typeof snapshot.sha !== 'string' || !/^[0-9a-f]{40}$/.test(snapshot.sha) || typeof snapshot.record_text !== 'string') {
      return { entries: [], error: label + ' contains an invalid durable snapshot envelope.' }
    }
    let record: any
    try { record = JSON.parse(snapshot.record_text) } catch {
      return { entries: [], error: label + ' contains invalid record JSON.' }
    }
    entries.push({ path: snapshot.path, sha: snapshot.sha, record_text: snapshot.record_text, record })
  }
  return { entries, error: null as string | null }
}

export function validateClaimSnapshots(entries: any[], label: string) {
  for (const entry of entries) {
    const record = entry.record
    if (record?.kind !== 'CHECKPOINT_CLAIM' || record.execution_contract !== 'NEXT') return label + ' contains a non-NEXT checkpoint claim.'
    const memoryNamespace = recordNextMemoryNamespace(record)
    if (!memoryNamespace) return label + ' contains a NEXT checkpoint claim with invalid memory_namespace.'
    if (entry.path !== checkpointClaimPath(record.project_id, record.job_id, record.planning_revision, record.checkpoint_id, memoryNamespace)) {
      return label + ' path does not match the deterministic checkpoint claim path.'
    }
  }
  return null
}

export function validateVerificationSnapshots(entries: any[], label: string) {
  for (const entry of entries) {
    const record = entry.record
    if (!['TEST','RETEST'].includes(record?.kind) || record.execution_contract !== 'NEXT' || typeof record.verification_id !== 'string') {
      return label + ' contains a non-NEXT TEST/RETEST Verification.'
    }
    const memoryNamespace = recordNextMemoryNamespace(record)
    if (!memoryNamespace) return label + ' contains a NEXT Verification with invalid memory_namespace.'
    if (entry.path !== verificationPath(record.project_id, record.verification_id, 'NEXT', memoryNamespace)) {
      return label + ' path does not match the deterministic Verification path.'
    }
  }
  return null
}

export function validateCompletedTaskRunSnapshots(job: any, entries: any[]) {
  const completed = new Set<string>()
  const jobMemoryNamespace = recordNextMemoryNamespace(job)
  if (jobExecutionContract(job) === 'NEXT' && !jobMemoryNamespace) {
    return { completed, error: 'owning NEXT Job has invalid memory_namespace.' }
  }
  for (const entry of entries) {
    const run = entry.record
    const runMemoryNamespace = recordNextMemoryNamespace(run)
    if (
      resolveExecutionContract(run?.execution_contract) !== 'NEXT' ||
      !jobMemoryNamespace ||
      runMemoryNamespace !== jobMemoryNamespace ||
      run.project_id !== job.project_id ||
      run.job_id !== job.job_id ||
      run.planning_revision !== job.planning_revision ||
      run.lifecycle !== 'COMPLETED' ||
      !['PASS','PASS_RETEST_REQUIRED'].includes(run.result) ||
      typeof run.run_id !== 'string' ||
      typeof run.primary_task_id !== 'string'
    ) return { completed, error: 'completed_task_run_snapshots contains a Run that is not a successful current-revision same-namespace NEXT Task Run.' }
    if (entry.path !== recordPath(job.project_id, 'RUNS', run.run_id, 'NEXT', jobMemoryNamespace)) {
      return { completed, error: 'completed_task_run_snapshots path does not match the NEXT Run path.' }
    }
    const task = (job.tasks ?? []).find((item: any) => item.task_id === run.primary_task_id)
    const topology = (job.topology ?? []).find((item: any) => item.task_id === run.primary_task_id)
    if (!task || !topology || topology.handler !== run.role) {
      return { completed, error: 'completed_task_run_snapshots Run does not match the current Task/topology handler.' }
    }
    completed.add(run.primary_task_id)
  }
  return { completed, error: null as string | null }
}
