'use strict'
// GSA4 A0: source-executed checkpoint tool extraction; no live GitHub CAS or host is simulated.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const ownerDir = path.resolve(__dirname, '../supabase/functions/gsa-mcp')
const claimText = fs.readFileSync(path.join(ownerDir, 'checkpoint/claim.ts'), 'utf8')
const verificationText = fs.readFileSync(path.join(ownerDir, 'checkpoint/verification-gate.ts'), 'utf8')
const parentText = fs.readFileSync(path.join(ownerDir, 'checkpoint-tools.ts'), 'utf8')

function registryBody(text) {
  const start = text.indexOf('\n  server.registerTool(')
  const end = text.lastIndexOf('\n}')
  assert.ok(start >= 0 && end > start, 'source-owned registration body is present')
  return text.slice(start + 1, end)
}
const originalHeader = "// GSA1-S7: Cohesive Checkpoint claim, verification and gate registrations.\nexport function registerCheckpointTools(deps: any) {\n  const { server, z, req, AUTH_SCOPES, authContext, authError, DURABLE_RECORD_SNAPSHOT_SCHEMA, checkpointLeaseExpired, checkpointBoundaryPrerequisiteIds, prettyJson, uuidv7, verificationPath, jobExecutionContract, recordNextMemoryNamespace, parseDurableSnapshots, durableSnapshotReadbackSteps, evaluateNextEvidenceGate, resolveExecutionContract, validateClaimSnapshots, validateVerificationSnapshots, validateCompletedTaskRunSnapshots, checkpointClaimPath, checkpointVerificationApplicable, checkpointAttemptPath, productFailureRetestValidationError, normalizeGithubRepo, validateEvidenceBundleAttestationSnapshot, checkpointVerificationOutcome } = deps"
function gitBlobSha(text) {
  return crypto.createHash('sha1')
    .update('blob ' + Buffer.byteLength(text) + '\0' + text).digest('hex')
}
test('byte-identical original registrations, schemas, negative guards, and order', () => {
  const rebuilt = originalHeader + '\n' + registryBody(claimText) + '\n' +
    registryBody(verificationText) + '\n}\n'
  assert.equal(gitBlobSha(rebuilt), 'f7fb5b0dd9202ce6725d2c720c9ab0746992c2af')
  assert.deepEqual([...rebuilt.matchAll(/server\.registerTool\(\s*'([^']+)'/g)].map(x => x[1]),
    ['checkpoint_claim_prepare', 'checkpoint_verification_prepare', 'checkpoint_gate_evaluate'])
  assert.match(parentText, /registerCheckpointClaimTool\(deps\)[\s\S]*registerCheckpointVerificationGateTools\(deps\)/)
  assert.equal((claimText.match(/server\.registerTool\(/g) || []).length, 1)
  assert.equal((verificationText.match(/server\.registerTool\(/g) || []).length, 2)
})

function loadModule(relative, cache = new Map()) {
  if (cache.has(relative)) return cache.get(relative)
  const source = fs.readFileSync(path.join(ownerDir, relative), 'utf8')
  const parsed = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  assert.equal(parsed.parseDiagnostics.length, 0, 'TypeScript syntax: ' + relative)
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true
  })
  assert.equal((output.diagnostics || []).filter(x => x.category === ts.DiagnosticCategory.Error).length, 0)
  const mod = { exports: {} }
  cache.set(relative, mod.exports)
  vm.runInNewContext(output.outputText, {
    module: mod, exports: mod.exports, Date, Set, JSON,
    require(request) {
      assert.ok(request.startsWith('.'), 'module loads stay relative')
      const next = path.posix.normalize(path.posix.join(path.posix.dirname(relative), request))
      assert.ok(!next.startsWith('..'), 'module imports remain within gsa-mcp')
      return loadModule(next, cache)
    }
  }, { timeout: 2500, filename: relative })
  return mod.exports
}
const registerCheckpointTools = loadModule('checkpoint-tools.ts').registerCheckpointTools
function loadRuntimeFunction(name, injected = {}) {
  for (const file of ['index.ts', 'checkpoint-evidence-gates.ts', 'durable-record-io.ts',
    'evidence-validation.ts', 'execution-guards.ts']) {
    const filename = path.join(ownerDir, file)
    if (!fs.existsSync(filename)) continue
    const source = fs.readFileSync(filename, 'utf8')
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const fn = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name && node.name.text === name)
    if (!fn) continue
    const body = fn.getText(parsed).replace(/^export\s+/, '')
    const js = ts.transpileModule(body + '\nmodule.exports = ' + name, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
    }).outputText
    const context = { module: { exports: {} }, Date, Number, Set, Map, JSON, Array, String, ...injected }
    vm.runInNewContext(js, context, { timeout: 2500, filename: file })
    return context.module.exports
  }
  assert.fail('expected real runtime function: ' + name)
}
const p = 'project-a', j = 'job-a', ns = 'scope-a', cp = 'CP-1', run = 'tester-run-a'
const claimPath = (project, job, revision, checkpoint, space) =>
  ['claim', project, job, revision, checkpoint, space].join('/')
const verificationPath = (project, id, contract, space) =>
  ['verification', project, id, contract, space].join('/')
const recordPath = (project, type, id, contract, space) =>
  ['record', project, type, id, contract, space].join('/')
const memoryNs = record => record && record.memory_namespace || null
const jobContract = record => record && record.execution_contract || 'V2_STABLE'
const resolvedContract = value => value === 'NEXT' || value === 'V2_STABLE' ? value : null
const helpers = {
  recordNextMemoryNamespace: memoryNs,
  sameNextMemoryNamespace: (a, b) => memoryNs(a) != null && memoryNs(a) === memoryNs(b),
  jobExecutionContract: jobContract, resolveExecutionContract: resolvedContract,
  checkpointClaimPath: claimPath, verificationPath, recordPath
}
const parseDurableSnapshots = loadRuntimeFunction('parseDurableSnapshots')
const validateClaimSnapshots = loadRuntimeFunction('validateClaimSnapshots', helpers)
const validateVerificationSnapshots = loadRuntimeFunction('validateVerificationSnapshots', helpers)
const validateCompletedTaskRunSnapshots = loadRuntimeFunction('validateCompletedTaskRunSnapshots', helpers)
const checkpointLeaseExpired = loadRuntimeFunction('checkpointLeaseExpired')
const checkpointBoundaryPrerequisiteIds = loadRuntimeFunction('checkpointBoundaryPrerequisiteIds')
const requiredCheckpointIds = loadRuntimeFunction('requiredCheckpointIds')
const checkpointVerificationApplicable = loadRuntimeFunction('checkpointVerificationApplicable', {
  ...helpers, normalizeGithubRepo: () => null,
  evidenceBundleRefValidationError: () => null, executionMemoryRoot: () => 'root'
})
const checkpointVerificationOutcome = loadRuntimeFunction('checkpointVerificationOutcome')
const evaluateNextEvidenceGate = loadRuntimeFunction('evaluateNextEvidenceGate', {
  ...helpers, parseDurableSnapshots, validateClaimSnapshots, validateVerificationSnapshots,
  requiredCheckpointIds, checkpointVerificationApplicable
})
const chain = new Proxy(() => chain, { get: () => chain, apply: () => chain })
const z = new Proxy({}, { get: () => chain })
function makeJob() {
  return {
    project_id: p, job_id: j, execution_contract: 'NEXT', memory_namespace: ns,
    lifecycle: 'READY', planning_revision: 7,
    planning_review: { status: 'PASS', reviewed_revision: 7 },
    tasks: [{ task_id: 'TASK-1' }],
    evidence_requirements: [{ consumer_task_id: 'TASK-1', checkpoint_id: cp }],
    test_checkpoints: [{
      checkpoint_id: cp, planning_revision: 7, mode: 'VERIFY',
      boundary: 'AFTER_NODE', evidence_need_ids: ['E-1']
    }]
  }
}
function makeTester() {
  return {
    project_id: p, job_id: j, run_id: run, role: 'tester', lifecycle: 'IN_PROGRESS',
    execution_contract: 'NEXT', memory_namespace: ns,
    planning_revision: 7, target_ref: 'main', target_revision: 'rev-new'
  }
}
function setup(authorized = true) {
  const registry = new Map()
  let counter = 0
  const deps = {
    server: { registerTool(name, definition, handler) {
      assert.ok(!registry.has(name), 'no duplicate MCP tools')
      registry.set(name, { definition, handler })
    } },
    z, req: {}, AUTH_SCOPES: ['gsa'],
    authContext: async () => authorized ? { user: 'tester' } : null,
    authError: (_, message) => ({ content: [{ type: 'text', text: message }], isError: true }),
    DURABLE_RECORD_SNAPSHOT_SCHEMA: chain,
    checkpointLeaseExpired, checkpointBoundaryPrerequisiteIds,
    prettyJson: value => JSON.stringify(value, null, 2),
    uuidv7: () => 'test-id-' + (++counter),
    verificationPath, jobExecutionContract: jobContract, recordNextMemoryNamespace: memoryNs,
    parseDurableSnapshots, durableSnapshotReadbackSteps: () => [],
    evaluateNextEvidenceGate, resolveExecutionContract: resolvedContract,
    validateClaimSnapshots, validateVerificationSnapshots, validateCompletedTaskRunSnapshots,
    checkpointClaimPath: claimPath, checkpointVerificationApplicable,
    checkpointAttemptPath: (project, attempt, space) => ['attempt', project, attempt, space].join('/'),
    productFailureRetestValidationError: () => 'PRODUCT_FAILURE Retest requires repaired revision Goal Recheck.',
    normalizeGithubRepo: input => input ? { full_name: 'team/repo' } : null,
    validateEvidenceBundleAttestationSnapshot: () => ({ error: 'stale EvidenceBundle attestation' }),
    checkpointVerificationOutcome
  }
  registerCheckpointTools(deps)
  return registry
}
function fixture() {
  const job = makeJob()
  const tester = makeTester()
  return {
    project_id: p, job_id: j, job_record_text: JSON.stringify(job), checkpoint_id: cp,
    claimant_run_id: run, claimant_run_record_text: JSON.stringify(tester),
    claimant_run_record_sha: 'a'.repeat(40), target_ref: 'main',
    target_revision: 'rev-new', attempt_kind: 'TEST',
    lease_seconds: 900, completed_task_run_snapshots: [], prerequisite_claim_snapshots: [],
    prerequisite_verification_snapshots: []
  }
}
function fallback(reply) {
  assert.ok(reply.structuredContent)
  assert.equal(reply.content[0].text, JSON.stringify(reply.structuredContent))
}
function reject(reply, fragment) {
  assert.equal(reply.isError, true)
  assert.match(reply.content[0].text, new RegExp(fragment))
}
async function successfulPair(registry) {
  const args = fixture()
  const c = await registry.get('checkpoint_claim_prepare').handler(args)
  fallback(c)
  const claim = JSON.parse(c.structuredContent.claim_record_text)
  const verifyArgs = {
    project_id: p, job_id: j, job_record_text: args.job_record_text, checkpoint_id: cp,
    claim_record_text: JSON.stringify(claim), claim_record_sha: 'b'.repeat(40),
    tester_run_record_text: args.claimant_run_record_text,
    tester_run_record_sha: args.claimant_run_record_sha,
    attempt_id: claim.attempt_id, lease_token: claim.lease_token,
    target_ref: 'main', target_revision: 'rev-new',
    result: 'PASS', evidence_refs: ['durable-proof'], evidence_bundle_attestation_snapshots: [],
    measurements: [], limitations: []
  }
  const v = await registry.get('checkpoint_verification_prepare').handler(verifyArgs)
  fallback(v)
  return { args, claim, verifyArgs, verification: v.structuredContent,
    claimReply: c.structuredContent }
}
test('actual facade registration sequence and original auth metadata', () => {
  const registry = setup()
  assert.deepEqual([...registry.keys()], [
    'checkpoint_claim_prepare', 'checkpoint_verification_prepare', 'checkpoint_gate_evaluate'
  ])
  for (const item of registry.values()) {
    assert.deepEqual(Array.from(item.definition.securitySchemes[0].scopes), ['gsa'])
    assert.equal(item.definition._meta.securitySchemes[0].type, 'oauth2')
  }
})
test('negative auth, invalid Job and stale planning revision are rejected', async () => {
  const unauth = setup(false)
  for (const name of unauth.keys()) {
    reject(await unauth.get(name).handler({}), 'Authentication required')
  }
  const registry = setup()
  reject(await registry.get('checkpoint_claim_prepare').handler({
    ...fixture(), job_record_text: 'broken'
  }), 'Invalid Job JSON')
  const stale = makeJob()
  stale.planning_review.reviewed_revision = 6
  reject(await registry.get('checkpoint_claim_prepare').handler({
    ...fixture(), job_record_text: JSON.stringify(stale)
  }), 'not Reviewer PASS')
  const tester = { ...makeTester(), role: 'coder' }
  reject(await registry.get('checkpoint_claim_prepare').handler({
    ...fixture(), claimant_run_record_text: JSON.stringify(tester)
  }), 'current IN_PROGRESS NEXT Tester Run')
})
test('claim lease serialization, stale snapshot envelopes and original readback steps', async () => {
  const registry = setup()
  const acquired = await registry.get('checkpoint_claim_prepare').handler(fixture())
  fallback(acquired)
  assert.equal(acquired.structuredContent.disposition, 'CLAIM')
  assert.equal(acquired.structuredContent.claim_operation, 'CREATE')
  assert.match(acquired.structuredContent.external_steps.join(' '), /blob SHA/)
  assert.match(acquired.structuredContent.external_steps.join(' '), /Concurrent create failure/)
  const held = {
    ...JSON.parse(acquired.structuredContent.claim_record_text), claimant_run_id: 'different-tester',
    lease_expires_at: '2099-01-01T00:00:00Z'
  }
  reject(await registry.get('checkpoint_claim_prepare').handler({
    ...fixture(), current_claim_record_text: JSON.stringify(held),
    current_claim_record_sha: 'c'.repeat(40)
  }), 'CHECKPOINT_ALREADY_CLAIMED')
  reject(await registry.get('checkpoint_claim_prepare').handler({
    ...fixture(), completed_task_run_snapshots: [{
      path: 'wrong', sha: 'not-a-sha', record_text: '{}'
    }]
  }), 'invalid durable snapshot envelope')
  reject(await registry.get('checkpoint_claim_prepare').handler({
    ...fixture(), attempt_kind: 'RETEST'
  }), 'RETEST requires the current terminal claim')
})
test('verification validates active lease, Tester evidence, failure class and Retest routes', async () => {
  const registry = setup()
  const { verifyArgs, verification } = await successfulPair(registry)
  const v = JSON.parse(verification.verification_record_text)
  assert.equal(v.applicability.status, 'CANDIDATE')
  assert.equal(verification.route, 'CONTINUE')
  assert.match(verification.external_steps.join(' '), /orphaned/)
  reject(await registry.get('checkpoint_verification_prepare').handler({
    ...verifyArgs, lease_token: 'stale-token'
  }), 'STALE_CHECKPOINT_LEASE')
  const expired = { ...JSON.parse(verifyArgs.claim_record_text),
    lease_expires_at: '2020-01-01T00:00:00Z' }
  reject(await registry.get('checkpoint_verification_prepare').handler({
    ...verifyArgs, claim_record_text: JSON.stringify(expired)
  }), 'lease expired')
  reject(await registry.get('checkpoint_verification_prepare').handler({
    ...verifyArgs, evidence_refs: [], measurements: []
  }), 'requires durable evidence')
  reject(await registry.get('checkpoint_verification_prepare').handler({
    ...verifyArgs, result: 'FAIL', evidence_refs: []
  }), 'requires failure_class')
  const product = await registry.get('checkpoint_verification_prepare').handler({
    ...verifyArgs, result: 'FAIL', failure_class: 'PRODUCT_FAILURE', evidence_refs: []
  })
  fallback(product)
  assert.equal(product.structuredContent.route, 'CODER_REPAIR_GOAL_RECHECK_RETEST')
  const environment = await registry.get('checkpoint_verification_prepare').handler({
    ...verifyArgs, result: 'BLOCKED', failure_class: 'ENVIRONMENT_FAILURE', evidence_refs: []
  })
  assert.equal(environment.structuredContent.route, 'RETEST_WHEN_READY')
  const planGap = await registry.get('checkpoint_verification_prepare').handler({
    ...verifyArgs, result: 'FAIL', failure_class: 'PLAN_GAP', evidence_refs: []
  })
  assert.equal(planGap.structuredContent.route, 'PLANNER_REVISION_SUPERSEDE')
  const attestationJob = { ...makeJob(), repository_context: {
    working_repository_url: 'https://github.com/team/repo'
  } }
  reject(await registry.get('checkpoint_verification_prepare').handler({
    ...verifyArgs, job_record_text: JSON.stringify(attestationJob),
    evidence_bundle_attestation_snapshots: [{ path: 'stale', sha: 'a'.repeat(40), record_text: '{}' }]
  }), 'stale EvidenceBundle attestation')
})
test('actual NEXT evidence gate rejects stale verification/revision/attempt/namespace/SHA', async () => {
  const registry = setup()
  const { args, verification } = await successfulPair(registry)
  const claim = JSON.parse(verification.next_claim_record_text)
  const record = JSON.parse(verification.verification_record_text)
  const claimSnapshot = value => ({ path: claimPath(p, j, 7, cp, ns),
    sha: 'a'.repeat(40), record_text: JSON.stringify(value) })
  const verificationSnapshot = value => ({ path: verificationPath(p, value.verification_id, 'NEXT', ns),
    sha: 'b'.repeat(40), record_text: JSON.stringify(value) })
  const gateArgs = {
    job_record_text: args.job_record_text, target_kind: 'TASK', target_id: 'TASK-1',
    checkpoint_claim_snapshots: [claimSnapshot(claim)],
    checkpoint_verification_snapshots: [verificationSnapshot(record)]
  }
  const evaluate = overrides => registry.get('checkpoint_gate_evaluate').handler({
    ...gateArgs, ...overrides
  })
  const pass = await evaluate()
  fallback(pass)
  assert.equal(pass.structuredContent.allowed, true)
  assert.deepEqual(Array.from(pass.structuredContent.required_checkpoint_ids), [cp])
  assert.ok(pass.structuredContent.external_steps.length >= 0)
  const staleVerification = { ...record, verification_id: 'prior-verification' }
  const staleAttempt = { ...record, lease_token: 'old-token' }
  const staleRevision = { ...record,
    applicability: { ...record.applicability, target_revision: 'old-revision' } }
  const staleNamespace = { ...record, memory_namespace: 'other-namespace' }
  for (const stale of [staleVerification, staleAttempt, staleRevision, staleNamespace]) {
    const res = await evaluate({
      checkpoint_verification_snapshots: [verificationSnapshot(stale)]
    })
    assert.equal(res.structuredContent.allowed, false)
    assert.ok(res.structuredContent.blocking.length >= 1)
  }
  const staleClaim = { ...claim, planning_revision: 6 }
  assert.equal((await evaluate({
    checkpoint_claim_snapshots: [claimSnapshot(staleClaim)]
  })).structuredContent.allowed, false)
  const malformed = await evaluate({ checkpoint_verification_snapshots: [{
    path: 'bad', sha: 'stale', record_text: '{}'
  }] })
  assert.equal(malformed.structuredContent.allowed, false)
  assert.match(malformed.structuredContent.blocking.join(' '), /invalid durable snapshot envelope/)
  const legacy = await evaluate({
    job_record_text: JSON.stringify({ ...makeJob(), execution_contract: 'V2_STABLE' })
  })
  assert.equal(legacy.structuredContent.allowed, true)
  assert.equal(legacy.structuredContent.external_steps.length, 0)
  const mutatedVerification = { ...record, lease_token: 'bad' }
  assert.throws(() => assert.equal(
    checkpointVerificationApplicable(makeJob(), makeJob().test_checkpoints[0],
      claim, mutatedVerification), true
  ), assert.AssertionError)
})
