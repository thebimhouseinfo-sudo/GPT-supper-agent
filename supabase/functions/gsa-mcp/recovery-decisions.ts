export function sourceMutationRecoveryDecision(input: {
  operation_id: string
  expected_head_sha: string
  current_head_sha: string
  previous_blob_sha: string | null
  intended_blob_sha: string
  current_blob_sha: string | null
}) {
  const sha = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v)
  const validPrevious = input.previous_blob_sha === null || sha(input.previous_blob_sha)
  const validCurrent = input.current_blob_sha === null || sha(input.current_blob_sha)
  if (!input.operation_id?.trim() || !sha(input.expected_head_sha) || !sha(input.current_head_sha) ||
      !validPrevious || !validCurrent || !sha(input.intended_blob_sha)) {
    return { disposition: 'UNKNOWN_CONFLICT', next_action: 'STOP_AND_RECONCILE', reason: 'INVALID_OR_UNPROVEN_READBACK', mutation_authorized: false }
  }
  // A Git commit SHA identifies a tree. A target blob cannot change while
  // the current commit SHA remains equal to the expected pre-write commit.
  if (input.current_head_sha === input.expected_head_sha) {
    if (input.current_blob_sha !== input.previous_blob_sha) {
      return { disposition: 'UNKNOWN_CONFLICT', next_action: 'STOP_AND_RECONCILE', reason: 'INCONSISTENT_HEAD_AND_BLOB_READBACK', mutation_authorized: false }
    }
    if (input.current_blob_sha === input.intended_blob_sha) {
      return { disposition: 'ALREADY_SATISFIED', next_action: 'RECHECK_DEPENDENCIES', reason: 'NO_CONTENT_CHANGE', mutation_authorized: false }
    }
    return { disposition: 'NOT_APPLIED', next_action: 'REAUTHORIZE_FROM_CURRENT_HEAD', reason: 'UNCHANGED_AUTHORITATIVE_TARGET', mutation_authorized: false }
  }
  if (input.current_blob_sha === input.intended_blob_sha) {
    // Desired bytes are present, but authorship/ancestry is not yet proven.
    return { disposition: 'TARGET_STATE_PRESENT', next_action: 'RECONCILE_INTERVENING_COMMITS', reason: 'EXPECTED_TARGET_BLOB_OBSERVED', mutation_authorized: false }
  }
  return { disposition: 'UNKNOWN_CONFLICT', next_action: 'STOP_AND_RECONCILE', reason: 'SOURCE_HEAD_OR_BLOB_DIVERGED', mutation_authorized: false }
}

// Counts only caller-observed durable state changes. A completed MCP request is
// not progress. PAUSED_NO_PROGRESS is an orchestration result, not Job/Run state.
export function orchestrationProgressDecision(input: {
  job_lifecycle: string
  run_lifecycle: string | null
  previous_fingerprint: string | null
  current_fingerprint: string
  stalled_cycles: number
  mutation_retry_count: number
}) {
  const jobTerminals = ['COMPLETED','CANCELLED','SUPERSEDED','RETIRED']
  const runTerminals = ['COMPLETED','FAILED','CANCELLED','SUPERSEDED']
  const jobStates = ['DRAFT','READY','IN_PROGRESS',...jobTerminals]
  const runStates = ['IN_PROGRESS',...runTerminals]
  if (!jobStates.includes(input.job_lifecycle) ||
      (input.run_lifecycle !== null && !runStates.includes(input.run_lifecycle)) ||
      !input.current_fingerprint || !Number.isInteger(input.stalled_cycles) ||
      input.stalled_cycles < 0 || !Number.isInteger(input.mutation_retry_count) || input.mutation_retry_count < 0) {
    return { disposition: 'BLOCKED', stalled_cycles: 0, reason: 'INVALID_DURABLE_STATE' }
  }
  if (jobTerminals.includes(input.job_lifecycle)) {
    return { disposition: 'JOB_TERMINAL', stalled_cycles: input.stalled_cycles, reason: 'DO_NOT_REOPEN_TERMINAL_JOB' }
  }
  if (input.run_lifecycle !== null && runTerminals.includes(input.run_lifecycle)) {
    // Do not retry this Run. Its nonterminal parent Job may dispatch a new
    // correctly attributed Run after checking durable topology and evidence.
    return { disposition: 'RUN_TERMINAL', stalled_cycles: input.stalled_cycles, reason: 'ROUTE_NEXT_FROM_DURABLE_JOB_TOPOLOGY' }
  }
  const stalled = input.previous_fingerprint === input.current_fingerprint
    ? input.stalled_cycles + 1 : 0
  if (input.mutation_retry_count > 2) {
    return { disposition: 'PAUSED_RETRY_EXHAUSTED', stalled_cycles: stalled, reason: 'BOUNDED_MUTATION_RETRY' }
  }
  if (stalled >= 3) {
    return { disposition: 'PAUSED_NO_PROGRESS', stalled_cycles: stalled, reason: 'THREE_DURABLE_NO_PROGRESS_CYCLES' }
  }
  return { disposition: 'CONTINUE', stalled_cycles: stalled, reason: stalled === 0 ? 'FINGERPRINT_CHANGED' : 'AWAIT_DURABLE_PROGRESS' }
}

