'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// A0-E independently guards the three physical evidence owners.
// Original GSA3 registration blocks are byte-preserved; hashes include schemas and handlers.
const sourceRoot = path.join(__dirname, '../supabase/functions/gsa-mcp')
const owners = [
  ['evidence-repo/publish-prepare.ts', 'evidence_repository_publish_prepare'],
  ['evidence-repo/publish-finalize.ts', 'evidence_repository_publish_finalize'],
  ['evidence-repo/probe.ts', 'evidence_repository_probe_verification_prepare']
]
const baselineFingerprints = {"evidence-repo/publish-prepare.ts":"6884586d","evidence-repo/publish-finalize.ts":"3cf9e172","evidence-repo/probe.ts":"83de20f0"}

function source(relative) {
  return fs.readFileSync(path.join(sourceRoot, relative), 'utf8')
}
function fingerprint(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16).padStart(8, '0')
}
function loadModule(relative) {
  const file = relative + '.ts'
  const code = source(file)
  const parsed = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  assert.equal(parsed.parseDiagnostics.length, 0, file + ' TypeScript syntax')
  const emitted = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true
  })
  assert.equal((emitted.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0)
  const mod = { exports: {} }
  vm.runInNewContext(emitted.outputText, {
    module: mod, exports: mod.exports,
    require: (name) => {
      assert.ok(name.startsWith('./'), 'module import must be relative')
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(relative), name.replace(/\.ts$/, '')))
      assert.ok(target === 'evidence-repository-tools' || target.startsWith('evidence-repo/'))
      return loadModule(target)
    }
  }, { timeout: 3000, filename: file })
  return mod.exports
}
const zChain = new Proxy(() => {}, { get: () => () => zChain })
const z = new Proxy({}, { get: () => () => zChain })
const revision = 'a'.repeat(40)
const evidenceRevision = 'b'.repeat(40)
const project = { lifecycle: 'ACTIVE', project_id: 'p',
  repositories: [{ relation: 'OWNED', url: 'https://github.com/org/repo' }] }
const job = { project_id: 'p', job_id: 'j', lifecycle: 'IN_PROGRESS',
  execution_contract: 'NEXT', memory_namespace: 'mem',
  repository_context: { working_repository_url: 'https://github.com/org/repo' } }
const testerRun = { project_id: 'p', job_id: 'j', run_id: 'r',
  execution_contract: 'NEXT', memory_namespace: 'mem',
  role: 'tester', lifecycle: 'IN_PROGRESS', target_ref: 'main', target_revision: revision }
function capture(authorized = true) {
  const registered = []
  const probeCalls = []
  const deps = {
    server: { registerTool: (name, definition, handler) => registered.push({ name, definition, handler }) },
    z, req: {}, AUTH_SCOPES: ['scope-a'],
    authContext: async () => authorized ? { id: 'tester' } : null,
    authError: () => ({ isError: true, content: [{ type: 'text', text: 'AUTH_REQUIRED' }] }),
    verificationPath: (projectId, id) => 'memory/' + projectId + '/' + id + '.json',
    uuidv7: () => 'verification-id',
    normalizeGithubRepo: (url) => {
      const match = /^https:\/\/github\.com\/([^/]+\/[^/#?]+)/i.exec(url)
      return match ? { full_name: match[1] } : null
    },
    DURABLE_RECORD_SNAPSHOT_SCHEMA: z.any(),
    jobExecutionContract: (record) => record.execution_contract,
    recordNextMemoryNamespace: (record) => record.memory_namespace,
    resolveExecutionContract: (contract) => contract,
    prettyJson: (value) => JSON.stringify(value, null, 2),
    DEFAULT_NEXT_MEMORY_NAMESPACE: 'default',
    parseProjectManifest: () => project,
    invalidExecutionContract: () => ({ isError: true, content: [{ type: 'text', text: 'INVALID_CONTRACT' }] }),
    validateRepositoryProbeSnapshot: (snapshot) => {
      probeCalls.push(snapshot)
      return snapshot ? { ref: 'probe/verified.json', sha: 'd'.repeat(40) }
        : { error: 'EVIDENCE_REPO_DENY: missing repository probe Verification' }
    }
  }
  loadModule('evidence-repository-tools').registerRepositoryEvidenceTools(deps)
  return { registered, probeCalls, tools: Object.fromEntries(registered.map(r => [r.name, r])) }
}
function textOf(result) {
  return result.content?.[0]?.text || ''
}
function assertFallback(result) {
  assert.ok(result.structuredContent, 'structured MCP response')
  assert.equal(textOf(result), JSON.stringify(result.structuredContent), 'exact JSON text fallback')
}
const prepareArgs = {
  project_manifest_text: '{}', project_manifest_sha: 'manifestsha',
  job_record_text: JSON.stringify(job), repository_full_name: 'org/repo', job_id: 'j',
  checkpoint_id: 'cp1', attempt_id: 'a1', run_id: 'r', target_ref: 'main', target_revision: revision,
  privacy_class: 'REPO_SAFE', evidence_ref: 'gsa-evidence/p',
  expected_evidence_ref_head: null, automation_isolation_verified: true,
  automation_evidence_refs: ['gsa-evidence/p'], publication_mode: 'PROBE',
  probe_id: 'PROBE-GIT-EVIDENCE-01', artifacts: [{
    label: 'probe-git-evidence-01.png', mime_type: 'image/png', size_bytes: 42,
    sha256: 'c'.repeat(64)
  }]
}
const prefix = 'tests/gsa/p/j/cp1/a1'
const finalizeArgs = {
  publication_mode: 'PROBE', probe_id: 'PROBE-GIT-EVIDENCE-01',
  project_id: 'p', job_id: 'j', job_record_text: JSON.stringify(job),
  tester_run_record_text: JSON.stringify(testerRun), checkpoint_id: 'cp1',
  attempt_id: 'a1', run_id: 'r', repository_full_name: 'org/repo',
  target_ref: 'main', target_revision: revision, source_ref_readback_revision: revision,
  evidence_ref: 'gsa-evidence/p', expected_parent_sha: revision,
  evidence_commit_sha: evidenceRevision, evidence_commit_parent_sha: revision,
  evidence_ref_readback_head: evidenceRevision, evidence_prefix: prefix,
  manifest_path: prefix + '/manifest.json', manifest_sha256: 'c'.repeat(64),
  human_openable_url: 'https://github.com/org/repo/blob/example',
  artifact_count: 1, size_bytes: 42, manifest_readback_verified: true,
  artifact_readback_verified: true, automation_side_effects_observed: false
}

test('A0-E registration blocks, schemas and handler bodies retain pinned GSA3 bytes', () => {
  const facade = source('evidence-repository-tools.ts')
  assert.match(facade, /export function registerRepositoryEvidenceTools\(deps: any\)/)
  assert.equal((facade.match(/registerEvidence(?:PublishPrepare|PublishFinalize|Probe)\(deps\)/g) || []).length, 3)
  for (const [file, name] of owners) {
    const code = source(file)
    const start = code.indexOf('  server.registerTool(')
    assert.ok(start >= 0, file + ' registerTool exists')
    assert.equal((code.match(/server\.registerTool\(/g) || []).length, 1)
    assert.match(code, new RegExp("server\\.registerTool\\(\\s*'" + name + "'"))
    assert.equal(fingerprint(code.slice(start, code.lastIndexOf('\n}')).trimEnd()),
      baselineFingerprints[file], file + ' original registration block changed')
  }
  assert.equal((facade.match(/server\.registerTool\(/g) || []).length, 0)
})
test('A0-E facade registers exactly three tools once and in original order', () => {
  const { registered } = capture()
  assert.equal(JSON.stringify(registered.map(x => x.name)), JSON.stringify(owners.map(x => x[1])))
  for (const item of registered) {
    assert.deepEqual(Array.from(item.definition.securitySchemes).map(x => x.type), ['oauth2'])
    assert.ok(item.definition.inputSchema && item.definition.outputSchema)
    assert.equal(typeof item.handler, 'function')
  }
})
test('A0-E auth rejects all three handlers before parsing or publication', async () => {
  const { registered } = capture(false)
  for (const item of registered) {
    const result = await item.handler({})
    assert.equal(result.isError, true)
    assert.equal(textOf(result), 'AUTH_REQUIRED')
  }
})
test('A0-E PROBE and PUBLISH prepare remain separate; PUBLISH requires validator', async () => {
  const { tools, probeCalls } = capture()
  const prepare = tools.evidence_repository_publish_prepare.handler
  const observed = await prepare(prepareArgs)
  assertFallback(observed)
  assert.equal(observed.structuredContent.allowed, true)
  assert.equal(observed.structuredContent.publication_mode, 'PROBE')
  assert.equal(observed.structuredContent.force_allowed, false)
  assert.equal(observed.structuredContent.manifest.binary_capability.observed, false)
  assert.equal(probeCalls.length, 0, 'probe cannot consume existing probe verification')
  const denied = await prepare({ ...prepareArgs, publication_mode: 'PUBLISH', probe_id: undefined })
  assert.equal(denied.isError, true)
  assert.match(textOf(denied), /missing repository probe Verification/)
  assert.equal(probeCalls.length, 1, 'PUBLISH validator callback called')
  const oversized = await prepare({ ...prepareArgs, artifacts: [{ ...prepareArgs.artifacts[0], size_bytes: 65537 }] })
  assert.equal(oversized.isError, true)
  assert.match(textOf(oversized), /one synthetic/)
})
test('A0-E finalize enforces Git readback and PROBE attestation distinction', async () => {
  const { tools, probeCalls } = capture()
  const finalize = tools.evidence_repository_publish_finalize.handler
  const result = await finalize(finalizeArgs)
  assertFallback(result)
  assert.equal(result.structuredContent.valid, true)
  assert.equal(result.structuredContent.publication_mode, 'PROBE')
  assert.equal(result.structuredContent.evidence_bundle_ref, null)
  assert.equal(result.structuredContent.evidence_bundle_attestation_record_text, null)
  assert.equal(result.structuredContent.probe_observation.usable_as_product_evidence, false)
  assert.equal(probeCalls.length, 0)
  const stale = await finalize({ ...finalizeArgs, source_ref_readback_revision: 'f'.repeat(40) })
  assert.equal(stale.isError, true)
  assert.match(textOf(stale), /tested source revision moved/)
  const nonAppend = await finalize({ ...finalizeArgs, evidence_commit_parent_sha: 'f'.repeat(40) })
  assert.equal(nonAppend.isError, true)
  assert.match(textOf(nonAppend), /not append-only/)
  const unverifiedPublish = await finalize({ ...finalizeArgs, publication_mode: 'PUBLISH', probe_id: undefined })
  assert.equal(unverifiedPublish.isError, true)
  assert.match(textOf(unverifiedPublish), /EVIDENCE_REPO_INVALID: missing repository probe Verification/)
  assert.equal(probeCalls.length, 1)
})
test('A0-E probe Verification uses finalized observation, not product evidence', async () => {
  const { tools } = capture()
  const finalize = await tools.evidence_repository_publish_finalize.handler(finalizeArgs)
  const probe = tools.evidence_repository_probe_verification_prepare.handler
  const result = await probe({
    project_id: 'p', job_id: 'j', job_record_text: JSON.stringify(job),
    repository_full_name: 'org/repo', target_ref: 'main', target_revision: revision,
    probe_finalize_result_text: JSON.stringify(finalize.structuredContent)
  })
  assertFallback(result)
  const proof = JSON.parse(result.structuredContent.verification_record_text)
  assert.equal(proof.kind, 'CAPABILITY_PROBE')
  assert.equal(proof.result, 'OBSERVED')
  assert.equal(proof.usable_as_product_evidence, false)
  const invalid = await probe({ job_record_text: '{', probe_finalize_result_text: '{}' })
  assert.equal(invalid.isError, true)
  assert.match(textOf(invalid), /invalid Job\/finalize JSON/)
})
