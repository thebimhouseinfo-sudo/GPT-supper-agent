// GSA4 A3: pure, read-only failure-to-source/retest context routing.
// No MCP registration, source mutation, authorization, retry runner or PASS verdict.
type FailureKind = 'PRODUCT_FAILURE' | 'ENVIRONMENT_FAILURE' | 'SPEC_GAP' | 'UNKNOWN'
type Decision = 'STOP' | 'PROBE' | 'READ_MORE' | 'REVIEW_REFERENCES'
type SourceCandidate = { path: string; reasons: string[]; trust: 'VERIFY_CURRENT_BLOB'; root_cause_proven: false }
type Finding = { code: string; action: 'STOP' | 'PROBE' | 'READ_MORE'; reason: string }
type A1 = {
  schema: string
  tool_owners: Array<{ name: string; owner: string; facade: string }>
  error_routes: Array<{ code: string; owner: string; related: string[]; tests: string[] }>
  tests_by_area?: Record<string, string[]>
}
type A3 = {
  schema: string
  edges: Array<{ from: string; to: string; symbol: string; relation: string; tests: string[] }>
}
type Input = {
  failure: {
    classification: FailureKind
    observed: boolean
    error_code?: string
    tool_name?: string
    expected?: string
    actual?: string
    reproduction_ref?: string
    target_revision?: string
    failed_retest?: boolean
    host_test_available?: boolean
  }
  source_ref: string
  locator_ref: string
  source_locator: A1
  graph_ref: string
  repair_graph: A3
  task_context?: {
    schema: string
    advisory_only: boolean
    execution_authorized: boolean
    decision: string
    identity?: { role?: string; task_id?: string | null; project_id?: string; job_id?: string }
  }
  required_task_id?: string
  initial_test_refs?: string[]
}
const sha = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
const string = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
const sourcePath = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_./-]+\.ts$/.test(value) &&
  !value.startsWith('/') && !value.split('/').some(x => !x || x === '.' || x === '..')
const testPath = (value: unknown): value is string =>
  typeof value === 'string' && /^test-lab\/[A-Za-z0-9_./-]+\.test\.cjs$/.test(value) &&
  !value.split('/').some(x => !x || x === '.' || x === '..')
const failKinds = new Set<FailureKind>(['PRODUCT_FAILURE','ENVIRONMENT_FAILURE','SPEC_GAP','UNKNOWN'])

/**
 * Returns only candidate READ/PROBE/STOP instructions, never evidence of
 * approval, ownership of the true root cause, or completed verification.
 * Inputs are untrusted snapshots even when caller-provided revision strings match.
 */
export function buildRepairContextRoute(input: Input) {
  const findings: Finding[] = []
  const stop = (code: string, reason: string) => findings.push({ code, action:'STOP' as const, reason })
  const more = (code: string, reason: string) => findings.push({ code, action:'READ_MORE' as const, reason })
  const probe = (code: string, reason: string) => findings.push({ code, action:'PROBE' as const, reason })
  const sources = new Map<string, Set<string>>()
  const tests = new Set<string>()
  const addSource = (path: unknown, reason: string) => {
    if (!sourcePath(path)) {
      more('INVALID_SOURCE_OWNER', 'Owner path is invalid/stale; search actual current source rather than following it.')
      return
    }
    if (!sources.has(path)) sources.set(path, new Set())
    sources.get(path)?.add(reason)
  }
  const addTest = (path: unknown) => {
    if (testPath(path)) tests.add(path)
    else more('INVALID_TEST_REF', 'A test reference is invalid/stale; locate current test in the repository.')
  }
  const f = input?.failure
  const kind = f?.classification
  if (!f || !failKinds.has(kind)) stop('FAILURE_CLASSIFICATION_REQUIRED','Use a known test failure classification before considering product repair.')
  if (!f?.observed) more('FAILURE_NOT_OBSERVED','Read real test/Host evidence first; paper output is not a reproduced product defect.')
  if (!sha(input?.source_ref) || input.source_ref !== input?.locator_ref) {
    stop('LOCATOR_REVISION_MISMATCH','Re-fetch A1 locator at exact current source commit before following ownership pointers.')
  }
  if (!sha(input?.source_ref) || input.source_ref !== input?.graph_ref) {
    stop('REPAIR_GRAPH_REVISION_MISMATCH','Re-fetch A3 graph at exact current source commit before following cross-module edges.')
  }
  if (!input?.source_locator || input.source_locator.schema !== 'gsa4-a1-source-locator/v1' ||
      !Array.isArray(input.source_locator.tool_owners) ||
      !Array.isArray(input.source_locator.error_routes)) {
    stop('SOURCE_LOCATOR_UNAVAILABLE','A1 source locator is missing/malformed.')
  }
  if (!input?.repair_graph || input.repair_graph.schema !== 'gsa4-a3-repair-edges/v1' ||
      !Array.isArray(input.repair_graph.edges) || input.repair_graph.edges.length > 64) {
    stop('REPAIR_GRAPH_UNAVAILABLE','A3 relationship graph is missing/malformed or unbounded.')
  }
  const a2 = input?.task_context
  if (!a2 || a2.schema !== 'gsa4-a2-task-context-recipe/v1' ||
      a2.advisory_only !== true || a2.execution_authorized !== false) {
    more('TASK_CONTEXT_REVALIDATE','Build/read the current A2 Job/Task context before assigning a repair scope.')
  } else {
    if (a2.decision === 'STOP') stop('TASK_CONTEXT_BLOCKED','A2 found a blocking Job/Task/Run condition.')
    if (a2.decision !== 'REVIEW_REFERENCES') {
      more('TASK_CONTEXT_READ_MORE','Resolve current A2 missing references/approval context independently.')
    }
    if (a2.identity?.role !== 'coder') {
      more('CODER_ROLE_REVALIDATE','A3 repair source navigation is advisory; verify the actual assignee Role.')
    }
    if (input.required_task_id && a2.identity?.task_id !== input.required_task_id) {
      stop('TASK_ID_MISMATCH','A2 Task does not match the requested repair Task.')
    }
  }
  if (kind === 'ENVIRONMENT_FAILURE') {
    probe('HOST_PROBE_REQUIRED','Test runner/Host capability failure is not a source-code defect. Perform an authorized bounded probe; UNVERIFIED until observable.')
  } else if (kind === 'SPEC_GAP') {
    stop('SPEC_DECISION_REQUIRED','Expected behavior or acceptance is missing/contradictory; ask Planner/Human rather than guessing a fix.')
  } else if (kind === 'UNKNOWN') {
    more('ROOT_CLASSIFICATION_REQUIRED','Classify observed failure from source/Host evidence before choosing product repair.')
  } else if (kind === 'PRODUCT_FAILURE') {
    if (!f.observed || !string(f.reproduction_ref) || !string(f.expected) || !string(f.actual)) {
      more('PRODUCT_REPRO_REQUIRED','Require a known-bad reproducible failure with expected/actual and evidence reference.')
    }
    if (!sha(f.target_revision) || f.target_revision !== input?.source_ref) {
      more('PRODUCT_TARGET_REVALIDATE','Read exact tested target revision and source ref before proposing a product diff.')
    }
  }
  if (f?.host_test_available === false) {
    probe('HOST_UNAVAILABLE','Host cannot be verified; never label an unobserved result PASS or issue an automatic product fix.')
  }
  if (f?.failed_retest) {
    more('FAILED_RETEST_EXPAND_CAUSAL_GRAPH','A failed retest requires fresh evidence, widened caller/consumer reading and an independent retest on changed source.')
  }
  // Never turn an observed error emitter into an asserted root cause.
  const a1 = input?.source_locator
  const validA1 = sha(input?.source_ref) && input.locator_ref === input.source_ref &&
    a1?.schema === 'gsa4-a1-source-locator/v1' &&
    Array.isArray(a1.tool_owners) && Array.isArray(a1.error_routes)
  const validGraph = sha(input?.source_ref) && input.graph_ref === input.source_ref &&
    input?.repair_graph?.schema === 'gsa4-a3-repair-edges/v1' &&
    Array.isArray(input.repair_graph.edges) && input.repair_graph.edges.length <= 64

  if (validA1 && string(f?.error_code)) {
    const route = a1.error_routes.find(r=>r?.code === f.error_code)
    if (route) {
      addSource(route.owner, 'A1_ERROR_EMITTER_CANDIDATE:' + f.error_code)
      for (const p of Array.isArray(route.related) ? route.related : []) addSource(p, 'A1_RELATED_DEPENDENCY')
      for (const t of Array.isArray(route.tests) ? route.tests : []) addTest(t)
    } else more('ERROR_ROUTE_UNKNOWN','Exact error token is not indexed; inspect real error emission and callers without inferring a root cause.')
  }
  if (validA1 && string(f?.tool_name)) {
    const t = a1.tool_owners.find(x => x?.name === f.tool_name)
    if (!t) more('TOOL_OWNER_UNKNOWN','Requested MCP tool is not mapped by A1; search current registration graph.')
    else {
      addSource(t.owner, 'A1_TOOL_HANDLER:' + f.tool_name)
      addSource(t.facade, 'A1_REGISTRATION_FACADE')
      const area = t.owner.startsWith('run/') ? 'run' :
        t.owner.startsWith('checkpoint/') ? 'checkpoint' :
        t.owner.startsWith('evidence-repo/') ? 'evidence' :
        t.owner.startsWith('project-setup/') ? 'project' : null
      if (area && Array.isArray(a1.tests_by_area?.[area])) {
        for (const p of a1.tests_by_area?.[area] ?? []) addTest(p)
      }
    }
  }
  for (const t of Array.isArray(input?.initial_test_refs) ? input.initial_test_refs : []) addTest(t)
  if (sources.size === 0) more('NO_INITIAL_OWNER','Provide exact known error/tool or independently search current repository to locate the failure.')

  // Read the minimum one-hop producer/consumer neighborhood first.
  // On failed retest include a second hop; nothing here authorizes edits.
  if (validGraph && validA1 && sources.size > 0) {
    const edges = input.repair_graph.edges
    const seeds = new Set(sources.keys())
    const depth = f?.failed_retest ? 2 : 1
    let frontier = new Set(seeds)
    for (let i=0;i<depth;i++) {
      const next = new Set<string>()
      for (const edge of edges) {
        if (!sourcePath(edge?.from) || !sourcePath(edge?.to)) {
          more('GRAPH_EDGE_INVALID','A3 graph includes invalid source paths; verify current graph before use.')
          continue
        }
        if (frontier.has(edge.from) || frontier.has(edge.to)) {
          const neighbor = frontier.has(edge.from) ? edge.to : edge.from
          if (!sources.has(neighbor)) next.add(neighbor)
          addSource(neighbor, 'A3_' + (edge.relation || 'DEP') + '_CANDIDATE:' + edge.symbol)
          for (const test of Array.isArray(edge.tests) ? edge.tests : []) addTest(test)
        }
      }
      frontier = next
      if (!frontier.size) break
    }
  }
  const candidates: SourceCandidate[] = [...sources].map(([path,reasons]) => ({
    path, reasons:[...reasons], trust:'VERIFY_CURRENT_BLOB', root_cause_proven:false,
  }))
  const stopRequired = findings.some(x => x.action === 'STOP')
  const probeRequired = findings.some(x => x.action === 'PROBE')
  const readRequired = findings.some(x => x.action === 'READ_MORE')
  const decision: Decision = stopRequired ? 'STOP' :
    probeRequired ? 'PROBE' : readRequired ? 'READ_MORE' : 'REVIEW_REFERENCES'
  return {
    schema:'gsa4-a3-repair-context/v1' as const,
    advisory_only:true as const,
    repair_authorized:false as const,
    test_pass_claimed:false as const,
    root_cause_confirmed:false as const,
    decision, classification:failKinds.has(kind) ? kind : 'UNKNOWN',
    source_ref:sha(input?.source_ref) ? input.source_ref : null,
    source_candidates:candidates,
    test_candidates:[...tests].map(path=>({path,trust:'VERIFY_TEST_ORACLE_AND_EXECUTION' as const})),
    findings,
    review_and_retest:[
      'Independently verify current Job/Task/Run, Human approval, M5/branch/scope and exact Git source SHA before any Coder write.',
      'Classify source vs Host vs specification; actual error emitter is not proof of root cause.',
      'Reproduce known-bad RED on exact original revision; inspect caller/consumer dependencies and accepted expected behavior.',
      'Prepare a scoped diff only under existing source-write authority; do not automatically retry an unknown Git write.',
      'Independent Reviewer checks exact new SHA, affected contracts and negative tests; Tester re-runs original repro and related regressions.',
      'A failed retest triggers bounded causal expansion and new evidence; absent Host remains UNVERIFIED, never automatic PASS.',
    ],
  }
}
