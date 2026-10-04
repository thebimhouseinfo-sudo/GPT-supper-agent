import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'

const PROJECT_REF = 'fbyqktduoqlpbbtkghkf'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? `https://${PROJECT_REF}.supabase.co`
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const AUTH_ISSUER = `${SUPABASE_URL}/auth/v1`
const AUTH_SCOPES = ['email', 'profile']
const BROWSER_BRIDGE_URL = Deno.env.get('GSA_BROWSER_BRIDGE_URL') ?? 'https://gpt-supper-agent.vercel.app/api/browser'

const EXECUTION_CONTRACT_VALUES = ['V2_STABLE', 'NEXT'] as const
type ExecutionContract = typeof EXECUTION_CONTRACT_VALUES[number]
const DEFAULT_EXECUTION_CONTRACT: ExecutionContract = 'V2_STABLE'
const GSA_SOURCE_BUILD_ID = 'CP0-J-F177-R2'

function resolveExecutionContract(value: unknown): ExecutionContract | null {
  if (value == null || value === '') return DEFAULT_EXECUTION_CONTRACT
  return value === 'V2_STABLE' || value === 'NEXT' ? value : null
}

function jobExecutionContract(job: any): ExecutionContract | null {
  return resolveExecutionContract(job?.execution_contract)
}

function goalRecheckRunMatches(run: any, projectId: string, jobId: string, runId: string) {
  return run?.project_id === projectId &&
    run?.job_id === jobId &&
    run?.run_id === runId &&
    run?.role === 'coder' &&
    run?.lifecycle === 'IN_PROGRESS'
}

function invalidExecutionContract() {
  return {
    content: [{ type: 'text' as const, text: 'Invalid execution_contract. Expected V2_STABLE or NEXT; missing defaults to V2_STABLE.' }],
    isError: true,
  }
}

function edgeFunctionBase(req: Request) {
  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const candidate = parts[0] === 'functions' && parts[1] === 'v1' ? parts[2] : parts[0]
  const slug = candidate === 'gsa-mcp-next' ? 'gsa-mcp-next' : 'gsa-mcp'
  return `${url.origin}/functions/v1/${slug}`
}

function mcpResource(req: Request) {
  return edgeFunctionBase(req) + '/mcp'
}

function resourceMetadata(req: Request) {
  return edgeFunctionBase(req) + '/.well-known/oauth-protected-resource'
}

function challenge(req: Request, error = 'invalid_token', description = 'Sign in to GPT Super Agent to continue') {
  return `Bearer resource_metadata="${resourceMetadata(req)}", scope="${AUTH_SCOPES.join(' ')}", error="${error}", error_description="${description}"`
}

function authError(req: Request, description: string) {
  return {
    content: [{ type: 'text' as const, text: description }],
    isError: true,
    _meta: { 'mcp/www_authenticate': [challenge(req, 'invalid_token', description)] },
  }
}

async function callBrowserBridge(req: Request, payload: Record<string, unknown>) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) throw new Error('Authentication required for browser QA.')

  const response = await fetch(BROWSER_BRIDGE_URL, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(110_000),
  })

  const text = await response.text()
  let data: any = null
  try { data = JSON.parse(text) } catch {
    throw new Error('Browser bridge returned invalid JSON (HTTP ' + response.status + ').')
  }

  if (!response.ok || !data?.ok) {
    throw new Error('Browser bridge failed: ' + String(data?.error ?? ('HTTP ' + response.status)))
  }

  return data
}

function privateEvidenceReadbackUrl(bundleId: string) {
  const url = new URL(BROWSER_BRIDGE_URL)
  url.pathname = url.pathname.replace(/\/api\/browser\/?$/, '/api/evidence')
  url.search = ''
  url.searchParams.set('bundle', bundleId)
  return url.toString()
}

async function callPrivateEvidenceReadback(req: Request, bundleId: string) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) throw new Error('Authentication required for private evidence read-back.')
  const response = await fetch(privateEvidenceReadbackUrl(bundleId), {
    method: 'GET',
    headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30_000),
  })
  const text = await response.text()
  let data: any = null
  try { data = JSON.parse(text) } catch {
    throw new Error('Private evidence read-back returned invalid JSON (HTTP ' + response.status + ').')
  }
  if (!response.ok || data?.ok !== true) {
    throw new Error('Private evidence read-back failed: ' + String(data?.error ?? ('HTTP ' + response.status)))
  }
  return data
}

async function authContext(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { token, user: data.user, supabase }
}

function uuidv7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let ts = BigInt(Date.now())
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number(ts & 0xffn)
    ts >>= 8n
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join('-')
}

function projectHandle(projectId: string) {
  return 'P-' + projectId.replace(/-/g, '').slice(-4).toUpperCase()
}


function jobHandle(jobId: string) {
  return 'J-' + jobId.replace(/-/g, '').slice(-4).toUpperCase()
}

function runHandle(runId: string) {
  return 'R-' + runId.replace(/-/g, '').slice(-4).toUpperCase()
}

function executionMemoryRoot(projectId: string, executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT) {
  return executionContract === 'NEXT'
    ? 'projects/' + projectId + '/TEST-LAB/NEXT'
    : 'projects/' + projectId
}

function recordPath(projectId: string, family: 'JOBS' | 'RUNS' | 'HANDOFFS' | 'CHECKPOINT_ATTEMPTS', recordId: string, executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT) {
  return executionMemoryRoot(projectId, executionContract) + '/WORK/' + family + '/' + recordId + '.json'
}

function verificationPath(projectId: string, verificationId: string, executionContract: ExecutionContract = DEFAULT_EXECUTION_CONTRACT) {
  return executionMemoryRoot(projectId, executionContract) + '/VERIFICATION/' + verificationId + '.json'
}


function checkpointClaimPath(projectId: string, jobId: string, planningRevision: number, checkpointId: string) {
  return executionMemoryRoot(projectId, 'NEXT') + '/WORK/CHECKPOINT_CLAIMS/' + jobId + '/r' + planningRevision + '/' + encodeURIComponent(checkpointId) + '.json'
}

function checkpointAttemptPath(projectId: string, attemptId: string) {
  return recordPath(projectId, 'CHECKPOINT_ATTEMPTS', attemptId, 'NEXT')
}

function checkpointLeaseExpired(claim: any, nowMs = Date.now()) {
  const expires = Date.parse(String(claim?.lease_expires_at ?? ''))
  return !Number.isFinite(expires) || expires <= nowMs
}

function parseRecordTexts(texts: string[], label: string) {
  const records: any[] = []
  for (const text of texts ?? []) {
    try { records.push(JSON.parse(text)) } catch {
      return { records: [], error: label + ' contains invalid JSON.' }
    }
  }
  return { records, error: null as string | null }
}

function parseDurableSnapshots(snapshots: any[], label: string) {
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

function validateClaimSnapshots(entries: any[], label: string) {
  for (const entry of entries) {
    const record = entry.record
    if (record?.kind !== 'CHECKPOINT_CLAIM' || record.execution_contract !== 'NEXT') return label + ' contains a non-NEXT checkpoint claim.'
    if (entry.path !== checkpointClaimPath(record.project_id, record.job_id, record.planning_revision, record.checkpoint_id)) {
      return label + ' path does not match the deterministic checkpoint claim path.'
    }
  }
  return null
}

function validateVerificationSnapshots(entries: any[], label: string) {
  for (const entry of entries) {
    const record = entry.record
    if (!['TEST','RETEST'].includes(record?.kind) || record.execution_contract !== 'NEXT' || typeof record.verification_id !== 'string') {
      return label + ' contains a non-NEXT TEST/RETEST Verification.'
    }
    if (entry.path !== verificationPath(record.project_id, record.verification_id, 'NEXT')) {
      return label + ' path does not match the deterministic Verification path.'
    }
  }
  return null
}

function validateCompletedTaskRunSnapshots(job: any, entries: any[]) {
  const completed = new Set<string>()
  for (const entry of entries) {
    const run = entry.record
    if (
      resolveExecutionContract(run?.execution_contract) !== 'NEXT' ||
      run.project_id !== job.project_id ||
      run.job_id !== job.job_id ||
      run.planning_revision !== job.planning_revision ||
      run.lifecycle !== 'COMPLETED' ||
      !['PASS','PASS_RETEST_REQUIRED'].includes(run.result) ||
      typeof run.run_id !== 'string' ||
      typeof run.primary_task_id !== 'string'
    ) return { completed, error: 'completed_task_run_snapshots contains a Run that is not a successful current-revision NEXT Task Run.' }
    if (entry.path !== recordPath(job.project_id, 'RUNS', run.run_id, 'NEXT')) {
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

function durableSnapshotReadbackSteps(snapshots: any[], label: string) {
  return (snapshots ?? []).map((snapshot: any) =>
    'Read back ' + label + ' at ' + snapshot.path + ' and require blob SHA=' + snapshot.sha + ' plus byte-identical record_text before the consequential persistence step.'
  )
}

function evidenceBundleRefValidationError(
  bundle: any,
  expected: {
    project_id: string
    job_id: string
    checkpoint_id?: string | null
    attempt_id?: string | null
    run_id?: string | null
    target_ref?: string | null
    target_revision: string
    repository_full_name?: string | null
  },
) {
  if (!bundle || typeof bundle !== 'object') return 'evidence bundle ref must be an object.'
  const binding = bundle.binding
  if (!binding || typeof binding !== 'object') return 'evidence bundle ref is missing immutable binding.'
  const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '')
  if (!same(binding.project_id, expected.project_id) || !same(binding.job_id, expected.job_id)) return 'evidence bundle project/job binding mismatch.'
  if (expected.checkpoint_id != null && !same(binding.checkpoint_id, expected.checkpoint_id)) return 'evidence bundle checkpoint binding mismatch.'
  if (expected.attempt_id != null && !same(binding.attempt_id, expected.attempt_id)) return 'evidence bundle attempt binding mismatch.'
  if (expected.run_id != null && !same(binding.run_id, expected.run_id)) return 'evidence bundle Tester Run binding mismatch.'
  if (expected.target_ref != null && !same(binding.target_ref, expected.target_ref)) return 'evidence bundle target_ref binding mismatch.'
  if (!same(binding.target_revision, expected.target_revision)) return 'evidence bundle target_revision binding mismatch.'
  if (!/^[0-9a-f]{40}$/.test(String(binding.target_revision || ''))) return 'evidence bundle target_revision is not an exact Git SHA.'
  if (expected.repository_full_name) {
    if (String(binding.repository || '').toLowerCase() !== expected.repository_full_name.toLowerCase()) return 'evidence bundle repository binding mismatch.'
  }
  const artifactCount = Number(bundle.artifact_count || 0)
  const sizeBytes = Number(bundle.size_bytes || 0)
  if (!Number.isInteger(artifactCount) || artifactCount < 1 || artifactCount > 12) return 'evidence bundle artifact_count is outside the bounded range.'
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) return 'evidence bundle size_bytes is invalid.'

  if (bundle.backend === 'PRIVATE_SUPABASE') {
    const bundleId = String(bundle.evidence_bundle_id || '')
    if (!/^[0-9a-f]{64}$/.test(bundleId)) return 'private evidence bundle id is invalid.'
    if (String(bundle.manifest_path || '') !== 'db:gsa_evidence_bundles/' + bundleId) return 'private evidence manifest path is not bound to the bundle id.'
    if (!/^[0-9a-f]{64}$/.test(String(bundle.manifest_sha256 || ''))) return 'private evidence manifest hash is invalid.'
    if (!/^https?:\/\//i.test(String(bundle.viewer_url || '')) || !String(bundle.viewer_url).includes(encodeURIComponent(bundleId))) return 'private evidence viewer URL is not bound to the bundle id.'
    if (bundle.immutable !== true || bundle.manifest_readback_verified !== true) return 'private evidence bundle is not immutable/read-back verified.'
    if (bundle.target_revision !== expected.target_revision) return 'private evidence top-level target revision mismatch.'
    if (sizeBytes > 50 * 1024 * 1024) return 'private evidence bundle exceeds the 50 MiB bound.'
    return null
  }

  if (bundle.backend === 'REPOSITORY_GIT') {
    if (bundle.privacy_class !== 'REPO_SAFE' || bundle.publication_mode !== 'PUBLISH') return 'repository evidence must be a completed REPO_SAFE PUBLISH bundle.'
    if (bundle.evidence_ref !== 'gsa-evidence/' + expected.project_id) return 'repository evidence ref is outside the Project evidence namespace.'
    if (!/^[0-9a-f]{40}$/.test(String(bundle.evidence_commit_sha || ''))) return 'repository evidence commit is invalid.'
    if (!/^[0-9a-f]{64}$/.test(String(bundle.manifest_sha256 || ''))) return 'repository evidence manifest hash is invalid.'
    if (!String(bundle.manifest_path || '').startsWith('tests/gsa/' + expected.project_id + '/')) return 'repository evidence manifest path is outside the bounded prefix.'
    if (!/^https?:\/\//i.test(String(bundle.human_openable_url || '')) || !String(bundle.human_openable_url).includes(String(bundle.evidence_commit_sha))) return 'repository evidence Human link is not commit-pinned.'
    if (bundle.immutable !== true || bundle.manifest_readback_verified !== true || bundle.artifact_readback_verified !== true) return 'repository evidence read-back is incomplete.'
    if (bundle.automation_side_effects_observed !== false) return 'repository evidence automation isolation is not proven.'
    if (!/^[0-9a-f]{40}$/.test(String(bundle.append_only_parent_sha || ''))) return 'repository evidence append-only parent is invalid.'
    if (typeof bundle.binary_probe_verification_ref !== 'string' || !bundle.binary_probe_verification_ref) return 'repository evidence is missing durable probe Verification ref.'
    if (!/^[0-9a-f]{40}$/.test(String(bundle.binary_probe_verification_sha || ''))) return 'repository evidence is missing durable probe Verification SHA.'
    if (sizeBytes > 25 * 1024 * 1024) return 'repository evidence bundle exceeds the 25 MiB bound.'
    return null
  }

  return 'unknown evidence bundle backend.'
}

async function sha256Utf8Text(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, '0')).join('')
}

function validateEvidenceBundleAttestationSnapshot(
  snapshot: any,
  expected: {
    project_id: string
    job_id: string
    checkpoint_id: string
    attempt_id: string
    run_id: string
    target_ref: string
    target_revision: string
    repository_full_name: string
  },
) {
  const parsed = parseDurableSnapshots([snapshot], 'evidence_bundle_attestation_snapshot')
  if (parsed.error || parsed.entries.length !== 1) {
    return { error: 'invalid durable EvidenceBundle attestation snapshot.', ref: null, sha: null, record: null, bundle: null }
  }
  const entry = parsed.entries[0]
  const record = entry.record
  const expectedPath =
    typeof record?.verification_id === 'string'
      ? verificationPath(expected.project_id, record.verification_id, 'NEXT')
      : ''
  const bundle = record?.evidence_bundle_ref
  const bundleError = evidenceBundleRefValidationError(bundle, expected)
  const valid =
    expectedPath === entry.path &&
    record?.kind === 'EVIDENCE_BUNDLE' &&
    record?.project_id === expected.project_id &&
    record?.job_id === expected.job_id &&
    resolveExecutionContract(record?.execution_contract) === 'NEXT' &&
    record?.producer === 'tester' &&
    record?.result === 'PUBLISHED' &&
    record?.checkpoint_id === expected.checkpoint_id &&
    record?.attempt_id === expected.attempt_id &&
    record?.run_id === expected.run_id &&
    record?.target_ref === expected.target_ref &&
    record?.target_revision === expected.target_revision &&
    String(record?.repository_full_name || '').toLowerCase() === expected.repository_full_name.toLowerCase() &&
    !bundleError
  if (!valid) {
    return { error: 'EvidenceBundle attestation does not match the current checkpoint attempt/Tester Run/target.', ref: null, sha: null, record: null, bundle: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record, bundle }
}

function validateTesterEvidenceVerificationSnapshot(
  snapshot: any,
  expected: {
    project_id: string
    job_id: string
    run_id: string
    target_ref: string
    target_revision: string
  },
) {
  const parsed = parseDurableSnapshots([snapshot], 'tester_evidence_verification_snapshot')
  if (parsed.error || parsed.entries.length !== 1) {
    return { error: 'invalid durable TEST/RETEST Verification snapshot.', ref: null, sha: null, record: null }
  }
  const entry = parsed.entries[0]
  const record = entry.record
  const expectedPath =
    typeof record?.verification_id === 'string'
      ? verificationPath(expected.project_id, record.verification_id, 'NEXT')
      : ''
  const valid =
    expectedPath === entry.path &&
    ['TEST','RETEST'].includes(record?.kind) &&
    resolveExecutionContract(record?.execution_contract) === 'NEXT' &&
    record?.producer === 'tester' &&
    record?.project_id === expected.project_id &&
    record?.job_id === expected.job_id &&
    record?.run_id === expected.run_id &&
    record?.target_ref === expected.target_ref &&
    record?.target_revision === expected.target_revision &&
    ['PASS','OBSERVED'].includes(record?.result) &&
    Array.isArray(record?.evidence_bundle_refs) &&
    record.evidence_bundle_refs.length > 0 &&
    Array.isArray(record?.evidence_bundle_attestation_refs) &&
    record.evidence_bundle_attestation_refs.length === record.evidence_bundle_refs.length &&
    record.evidence_bundle_attestation_refs.every((item: any) =>
      item &&
      typeof item.path === 'string' &&
      item.path.startsWith(executionMemoryRoot(expected.project_id, 'NEXT') + '/VERIFICATION/') &&
      /^[0-9a-f]{40}$/.test(String(item.sha || ''))
    )
  if (!valid) {
    return { error: 'TEST/RETEST Verification is not the exact successful durable evidence record for this Tester Run/target.', ref: null, sha: null, record: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record }
}

function evidencePublicationProofValidationError(
  record: any,
  expected: {
    project_id: string
    job_id: string
    checkpoint_id?: string | null
    attempt_id?: string | null
    run_id?: string | null
    target_ref?: string | null
    target_revision: string
    repository_full_name?: string | null
  },
) {
  if (!record || record.kind !== 'EVIDENCE_BUNDLE') return 'evidence publication proof kind is invalid.'
  if (record.execution_contract !== 'NEXT' || record.producer !== 'tester' || record.result !== 'PERSISTED') return 'evidence publication proof is not a successful NEXT Tester proof.'
  if (record.project_id !== expected.project_id || record.job_id !== expected.job_id) return 'evidence publication proof project/job mismatch.'
  if (!record.bundle_ref) return 'evidence publication proof is missing bundle_ref.'
  const bundleError = evidenceBundleRefValidationError(record.bundle_ref, expected)
  if (bundleError) return bundleError
  if (record.backend !== record.bundle_ref.backend) return 'evidence publication proof backend mismatch.'
  if (record.backend === 'PRIVATE_SUPABASE') {
    if (record.readback?.manifest_sha256 !== record.bundle_ref.manifest_sha256 || record.readback?.authenticated !== true) return 'private evidence publication proof lacks exact authenticated manifest read-back.'
  } else if (record.backend === 'REPOSITORY_GIT') {
    if (record.readback?.evidence_commit_sha !== record.bundle_ref.evidence_commit_sha || record.readback?.manifest_sha256 !== record.bundle_ref.manifest_sha256) return 'repository evidence publication proof lacks exact immutable commit/manifest read-back.'
    if (record.readback?.source_revision_unchanged !== true || record.readback?.append_only_verified !== true || record.readback?.automation_side_effects_observed !== false) return 'repository evidence publication proof does not prove source/append/automation isolation.'
  }
  return null
}

function parseEvidencePublicationProofSnapshots(
  snapshots: any[],
  expected: {
    project_id: string
    job_id: string
    checkpoint_id?: string | null
    attempt_id?: string | null
    run_id?: string | null
    target_ref?: string | null
    target_revision: string
    repository_full_name?: string | null
  },
) {
  const parsed = parseDurableSnapshots(snapshots ?? [], 'evidence_bundle_proof_snapshots')
  if (parsed.error) return { error: parsed.error, bundles: [] as any[], refs: [] as any[] }
  const bundles: any[] = []
  const refs: any[] = []
  const keys = new Set<string>()
  for (const entry of parsed.entries) {
    const record = entry.record
    const expectedPath = typeof record?.verification_id === 'string'
      ? verificationPath(expected.project_id, record.verification_id, 'NEXT')
      : ''
    if (entry.path !== expectedPath) return { error: 'evidence bundle proof snapshot path is not canonical.', bundles: [], refs: [] }
    const proofError = evidencePublicationProofValidationError(record, expected)
    if (proofError) return { error: proofError, bundles: [], refs: [] }
    const bundle = record.bundle_ref
    const key = bundle.backend === 'PRIVATE_SUPABASE'
      ? 'PRIVATE:' + bundle.evidence_bundle_id
      : 'REPO:' + bundle.evidence_commit_sha + ':' + bundle.manifest_path
    if (keys.has(key)) return { error: 'duplicate evidence publication proof snapshot.', bundles: [], refs: [] }
    keys.add(key)
    bundles.push(bundle)
    refs.push({ path: entry.path, sha: entry.sha })
  }
  return { error: null as string | null, bundles, refs }
}

function checkpointVerificationApplicable(job: any, checkpoint: any, claim: any, verification: any) {
  if (!claim || !verification) return false
  if (claim.kind !== 'CHECKPOINT_CLAIM' || claim.execution_contract !== 'NEXT') return false
  if (claim.project_id !== job.project_id || claim.job_id !== job.job_id || claim.planning_revision !== job.planning_revision || claim.checkpoint_id !== checkpoint.checkpoint_id) return false
  if (claim.mode !== checkpoint.mode || !['SATISFIED','OBSERVED'].includes(claim.state)) return false
  if (claim.last_verification_id !== verification.verification_id || claim.lease_token !== verification.lease_token || claim.attempt_id !== verification.attempt_id) return false
  if (!['TEST','RETEST'].includes(verification.kind) || verification.execution_contract !== 'NEXT' || verification.producer !== 'tester') return false
  if (verification.project_id !== job.project_id || verification.job_id !== job.job_id || verification.planning_revision !== job.planning_revision || verification.checkpoint_id !== checkpoint.checkpoint_id) return false
  if (verification.mode !== checkpoint.mode || verification.attempt_kind !== claim.attempt_kind || claim.last_result !== verification.result) return false
  if (verification.result === 'PASS' && claim.state !== 'SATISFIED') return false
  if (verification.result === 'OBSERVED' && claim.state !== 'OBSERVED') return false
  if (verification.applicability?.status !== 'CANDIDATE') return false
  if (verification.applicability?.planning_revision !== job.planning_revision || verification.applicability?.checkpoint_id !== checkpoint.checkpoint_id) return false
  if (claim.target_revision !== verification.target_revision || claim.last_target_revision !== verification.target_revision || verification.applicability?.target_revision !== verification.target_revision) return false
  const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')?.full_name ?? null
  const bundleRefs = verification.evidence_bundle_refs ?? []
  const attestationRefs = verification.evidence_bundle_attestation_refs ?? []
  if (bundleRefs.length !== attestationRefs.length) return false
  if (bundleRefs.length && !workingRepo) return false
  const attestationPaths = new Set<string>()
  for (const ref of attestationRefs) {
    if (
      !ref ||
      typeof ref.path !== 'string' ||
      !ref.path.startsWith(executionMemoryRoot(job.project_id, 'NEXT') + '/VERIFICATION/') ||
      !/^[0-9a-f]{40}$/.test(String(ref.sha || '')) ||
      attestationPaths.has(ref.path)
    ) return false
    attestationPaths.add(ref.path)
  }
  for (const bundle of bundleRefs) {
    if (evidenceBundleRefValidationError(bundle, {
      project_id: job.project_id,
      job_id: job.job_id,
      checkpoint_id: checkpoint.checkpoint_id,
      attempt_id: claim.attempt_id,
      run_id: claim.claimant_run_id,
      target_ref: claim.target_ref,
      target_revision: verification.target_revision,
      repository_full_name: workingRepo,
    })) return false
  }
  const expectedEvidenceNeeds = checkpoint.evidence_need_ids ?? []
  const applicableEvidenceNeeds = verification.applicability?.evidence_need_ids ?? []
  if (!expectedEvidenceNeeds.every((id: string) => applicableEvidenceNeeds.includes(id))) return false
  if (checkpoint.mode === 'VERIFY') return verification.result === 'PASS'
  return ['PASS','OBSERVED'].includes(verification.result)
}

function checkpointBoundaryPrerequisiteIds(job: any, checkpoint: any) {
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

function requiredCheckpointIds(job: any, target: { kind: 'TASK' | 'MILESTONE' | 'JOB', id?: string | null }) {
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
    return [...new Set(milestone?.gate_checkpoint_ids ?? [])]
  }
  return [...new Set((job.test_checkpoints ?? []).map((item: any) => item.checkpoint_id))]
}

function evaluateNextEvidenceGate(job: any, claimSnapshots: any[], verificationSnapshots: any[], target: { kind: 'TASK' | 'MILESTONE' | 'JOB', id?: string | null }) {
  const executionContract = jobExecutionContract(job)
  if (executionContract !== 'NEXT') return { allowed: true, required_checkpoint_ids: [], blocking: [] as string[] }
  if (job.planning_review?.status !== 'PASS' || job.planning_review?.reviewed_revision !== job.planning_revision) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Current NEXT planning revision is not Reviewer PASS.'] }
  }
  const claimParsed = parseDurableSnapshots(claimSnapshots ?? [], 'checkpoint_claim_snapshots')
  if (claimParsed.error) return { allowed: false, required_checkpoint_ids: [], blocking: [claimParsed.error] }
  const claimSnapshotError = validateClaimSnapshots(claimParsed.entries, 'checkpoint_claim_snapshots')
  if (claimSnapshotError) return { allowed: false, required_checkpoint_ids: [], blocking: [claimSnapshotError] }
  const verificationParsed = parseDurableSnapshots(verificationSnapshots ?? [], 'checkpoint_verification_snapshots')
  if (verificationParsed.error) return { allowed: false, required_checkpoint_ids: [], blocking: [verificationParsed.error] }
  const verificationSnapshotError = validateVerificationSnapshots(verificationParsed.entries, 'checkpoint_verification_snapshots')
  if (verificationSnapshotError) return { allowed: false, required_checkpoint_ids: [], blocking: [verificationSnapshotError] }
  if (target.kind === 'TASK' && !(job.tasks ?? []).some((item: any) => item.task_id === target.id)) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Unknown NEXT Task target: ' + String(target.id ?? '')] }
  }
  if (target.kind === 'MILESTONE' && !(job.milestones ?? []).some((item: any) => item.milestone_id === target.id)) {
    return { allowed: false, required_checkpoint_ids: [], blocking: ['Unknown NEXT Milestone target: ' + String(target.id ?? '')] }
  }
  const ids = requiredCheckpointIds(job, target)
  const blocking: string[] = []
  for (const checkpointId of ids) {
    const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpointId)
    if (!checkpoint) {
      blocking.push('Unknown required checkpoint: ' + checkpointId)
      continue
    }
    const matchingClaims = claimParsed.entries.filter((entry: any) => {
      const item = entry.record
      return item?.kind === 'CHECKPOINT_CLAIM' &&
        item.project_id === job.project_id &&
        item.job_id === job.job_id &&
        item.planning_revision === job.planning_revision &&
        item.checkpoint_id === checkpointId &&
        entry.path === checkpointClaimPath(job.project_id, job.job_id, job.planning_revision, checkpointId)
    })
    if (matchingClaims.length !== 1) {
      blocking.push('Expected exactly one current deterministic checkpoint claim: ' + checkpointId)
      continue
    }
    const claim = matchingClaims[0].record
    const matchingVerifications = verificationParsed.entries.filter((entry: any) =>
      entry.record?.verification_id === claim.last_verification_id &&
      entry.path === verificationPath(job.project_id, claim.last_verification_id, 'NEXT')
    )
    if (matchingVerifications.length !== 1 || !checkpointVerificationApplicable(job, checkpoint, claim, matchingVerifications[0].record)) {
      blocking.push('Mandatory checkpoint evidence is not applicable: ' + checkpointId)
    }
  }
  return { allowed: blocking.length === 0, required_checkpoint_ids: ids, blocking }
}

function knowledgePath(projectId: string, knowledgeId: string, slug: string) {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'knowledge'
  return 'projects/' + projectId + '/KNOWLEDGE/' + knowledgeId + '-' + safeSlug + '.md'
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2) + '\n'
}

const EVIDENCE_NEED_SCHEMA = z.object({
  evidence_need_id: z.string().min(1),
  kind: z.enum(['EVIDENCE_NEED','UNKNOWN_RUNTIME_FACT']).default('EVIDENCE_NEED'),
  description: z.string().min(1),
  owner_task_id: z.string().min(1),
  required_by_task_ids: z.array(z.string().min(1)).min(1),
  checkpoint_id: z.string().min(1),
})

const TEST_CHECKPOINT_SPEC_SCHEMA = z.object({
  checkpoint_id: z.string().min(1),
  mode: z.enum(['VERIFY','MEASURE','PROBE']),
  boundary: z.enum(['BEFORE_NODE','AFTER_NODE_SET','MILESTONE_GATE','JOB_FINAL']),
  prerequisite_node_ids: z.array(z.string().min(1)).default([]),
  boundary_node_id: z.string().min(1).optional(),
  milestone_id: z.string().min(1).optional(),
  evidence_need_ids: z.array(z.string().min(1)).default([]),
})

const EVIDENCE_REQUIREMENT_SCHEMA = z.object({
  evidence_requirement_id: z.string().min(1),
  consumer_task_id: z.string().min(1),
  evidence_need_id: z.string().min(1),
  checkpoint_id: z.string().min(1),
})

const MILESTONE_SCHEMA = z.object({
  milestone_id: z.string().min(1),
  name: z.string().min(1),
  node_ids: z.array(z.string().min(1)).min(1),
  gate_checkpoint_ids: z.array(z.string().min(1)).default([]),
})

const PLANNING_TOPOLOGY_NODE_SCHEMA = z.object({
  node_id: z.string().min(1),
  node_type: z.enum(['TASK','TEST_CHECKPOINT','MILESTONE_GATE']),
  depends_on: z.array(z.string().min(1)).default([]),
})

const DURABLE_RECORD_SNAPSHOT_SCHEMA = z.object({
  path: z.string().min(1),
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  record_text: z.string().min(2),
})

function validateExecutionTopology(tasks: any[], topology: any[]): string | null {
  if (!Array.isArray(tasks) || !Array.isArray(topology)) return 'EXECUTION_TOPOLOGY_INVALID: tasks/topology must be arrays.'
  const taskIds = tasks.map((task: any) => task?.task_id)
  if (taskIds.some((id: any) => typeof id !== 'string' || !id)) return 'EXECUTION_TOPOLOGY_INVALID: every Task requires task_id.'
  if (new Set(taskIds).size !== taskIds.length) return 'EXECUTION_TOPOLOGY_INVALID: Task IDs must be unique.'
  if (topology.length !== tasks.length) return 'EXECUTION_TOPOLOGY_INVALID: execution topology must contain exactly one stage per Task.'
  const topologyTaskIds = topology.map((stage: any) => stage?.task_id)
  if (topologyTaskIds.some((id: any) => typeof id !== 'string' || !id) || new Set(topologyTaskIds).size !== topologyTaskIds.length) {
    return 'EXECUTION_TOPOLOGY_INVALID: topology task_id values must be present and unique.'
  }
  if (taskIds.some((id: string) => !topologyTaskIds.includes(id))) return 'EXECUTION_TOPOLOGY_INVALID: every current Task must appear exactly once in execution topology.'
  const stages = topology.map((stage: any) => stage?.stage)
  if (stages.some((stage: any) => !Number.isInteger(stage) || stage < 1) || new Set(stages).size !== stages.length) {
    return 'EXECUTION_TOPOLOGY_INVALID: topology stage values must be unique positive integers.'
  }
  const validHandlers = new Set(['planner','designer','coder','reviewer','tester'])
  const taskIdSet = new Set(taskIds)
  const sameStringSet = (left: any[], right: any[]) => {
    const a = [...new Set((left ?? []).map(String))].sort()
    const b = [...new Set((right ?? []).map(String))].sort()
    return a.length === b.length && a.every((value, index) => value === b[index])
  }
  for (const task of tasks) {
    const deps = task?.dependencies ?? []
    if (!Array.isArray(deps) || deps.some((id: any) => typeof id !== 'string' || !taskIdSet.has(id) || id === task.task_id) || new Set(deps).size !== deps.length) {
      return 'EXECUTION_TOPOLOGY_INVALID: Task dependencies must be unique current Task IDs and cannot self-reference.'
    }
    const stage = topology.find((item: any) => item.task_id === task.task_id)
    if (!stage || !validHandlers.has(stage.handler)) return 'EXECUTION_TOPOLOGY_INVALID: every Task requires one valid execution handler.'
    if (!sameStringSet(stage.depends_on ?? [], deps)) return 'EXECUTION_TOPOLOGY_INVALID: topology depends_on must match the owning Task dependencies.'
    if (stage.next != null && (!taskIdSet.has(stage.next) || stage.next === task.task_id)) {
      return 'EXECUTION_TOPOLOGY_INVALID: topology next must be null or another current Task ID.'
    }
  }
  return null
}

function normalizeNextPlanningModel(model: any, planningRevision: number) {
  return {
    evidence_needs: (model.evidence_needs ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
    test_checkpoints: (model.test_checkpoints ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
    evidence_requirements: (model.evidence_requirements ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
    milestones: (model.milestones ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
    planning_topology: (model.planning_topology ?? []).map((item: any) => ({ ...item, planning_revision: planningRevision })),
  }
}

function validateNextPlanningModel(executionContract: ExecutionContract, tasks: any[], model: any, planningRevision: number): string | null {
  const evidenceNeeds = model.evidence_needs ?? []
  const checkpoints = model.test_checkpoints ?? []
  const requirements = model.evidence_requirements ?? []
  const milestones = model.milestones ?? []
  const planningTopology = model.planning_topology ?? []
  const hasNextFields = evidenceNeeds.length || checkpoints.length || requirements.length || milestones.length || planningTopology.length

  if (executionContract === 'V2_STABLE') {
    return hasNextFields ? 'NEXT_PLANNING_FIELDS_REQUIRE_NEXT: V2_STABLE Jobs must keep CP4 planning collections empty.' : null
  }
  if (!hasNextFields) return null

  const taskIds = new Set(tasks.map((task: any) => task.task_id))
  const unique = (values: string[]) => new Set(values).size === values.length
  const evidenceNeedIds = evidenceNeeds.map((item: any) => item.evidence_need_id)
  const checkpointIds = checkpoints.map((item: any) => item.checkpoint_id)
  const milestoneIds = milestones.map((item: any) => item.milestone_id)
  const topologyIds = planningTopology.map((item: any) => item.node_id)
  if (!unique(evidenceNeedIds) || !unique(checkpointIds) || !unique(milestoneIds) || !unique(topologyIds)) {
    return 'NEXT_PLANNING_INVALID: EvidenceNeed, checkpoint, milestone and topology node IDs must be unique.'
  }
  const evidenceNeedSet = new Set(evidenceNeedIds)
  const checkpointSet = new Set(checkpointIds)
  const milestoneSet = new Set(milestoneIds)
  const knownNodeIds = new Set([...taskIds, ...checkpointIds])
  const checkpointById = new Map(checkpoints.map((item: any) => [item.checkpoint_id, item]))
  const evidenceNeedById = new Map(evidenceNeeds.map((item: any) => [item.evidence_need_id, item]))

  for (const item of evidenceNeeds) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: EvidenceNeed is not bound to the current planning revision.'
    if (!taskIds.has(item.owner_task_id) || !(item.required_by_task_ids ?? []).every((id: string) => taskIds.has(id)) || !checkpointSet.has(item.checkpoint_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceNeed owner/consumer/checkpoint references must resolve inside the current plan.'
    }
    const producer: any = checkpointById.get(item.checkpoint_id)
    if (!(producer?.evidence_need_ids ?? []).includes(item.evidence_need_id)) {
      return 'NEXT_PLANNING_INVALID: every EvidenceNeed must be declared as produced by its referenced checkpoint.'
    }
    for (const consumerTaskId of item.required_by_task_ids ?? []) {
      const hasRequirement = requirements.some((req: any) =>
        req.consumer_task_id === consumerTaskId &&
        req.evidence_need_id === item.evidence_need_id &&
        req.checkpoint_id === item.checkpoint_id
      )
      if (!hasRequirement) return 'NEXT_PLANNING_INVALID: every EvidenceNeed consumer must have a matching EvidenceRequirement.'
    }
  }
  for (const item of checkpoints) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: TestCheckpointSpec is not bound to the current planning revision.'
    if (!(item.evidence_need_ids ?? []).every((id: string) => evidenceNeedSet.has(id))) return 'NEXT_PLANNING_INVALID: checkpoint evidence_need_ids contain an unknown reference.'
    if (!(item.prerequisite_node_ids ?? []).every((id: string) => taskIds.has(id) || checkpointSet.has(id))) return 'NEXT_PLANNING_INVALID: checkpoint prerequisite_node_ids contain an unknown node.'
    if (item.boundary === 'BEFORE_NODE' && (!item.boundary_node_id || !taskIds.has(item.boundary_node_id))) return 'NEXT_PLANNING_INVALID: BEFORE_NODE requires a valid boundary_node_id.'
    if (item.boundary === 'AFTER_NODE_SET' && !(item.prerequisite_node_ids ?? []).length) return 'NEXT_PLANNING_INVALID: AFTER_NODE_SET requires prerequisite_node_ids.'
    if (item.boundary === 'MILESTONE_GATE' && (!item.milestone_id || !milestoneSet.has(item.milestone_id))) return 'NEXT_PLANNING_INVALID: MILESTONE_GATE requires a valid milestone_id.'
  }
  for (const item of requirements) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: EvidenceRequirement is not bound to the current planning revision.'
    if (!taskIds.has(item.consumer_task_id) || !evidenceNeedSet.has(item.evidence_need_id) || !checkpointSet.has(item.checkpoint_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceRequirement references must resolve to current tasks/evidence/checkpoints.'
    }
    const need: any = evidenceNeedById.get(item.evidence_need_id)
    if (need?.checkpoint_id !== item.checkpoint_id || !(need?.required_by_task_ids ?? []).includes(item.consumer_task_id)) {
      return 'NEXT_PLANNING_INVALID: EvidenceRequirement must match the EvidenceNeed producer checkpoint and declared consumer set.'
    }
  }
  for (const item of milestones) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: milestone is not bound to the current planning revision.'
    if (!(item.node_ids ?? []).every((id: string) => taskIds.has(id) || checkpointSet.has(id)) || !(item.gate_checkpoint_ids ?? []).every((id: string) => checkpointSet.has(id))) {
      return 'NEXT_PLANNING_INVALID: milestone node/gate references must resolve inside the current plan.'
    }
  }
  if ((checkpoints.length || milestones.length) && !planningTopology.length) return 'NEXT_PLANNING_INVALID: typed planning_topology is required when checkpoints or milestones exist.'
  for (const item of planningTopology) {
    if (item.planning_revision !== planningRevision) return 'NEXT_PLANNING_REVISION_MISMATCH: topology node is not bound to the current planning revision.'
    if (!knownNodeIds.has(item.node_id) || !(item.depends_on ?? []).every((id: string) => knownNodeIds.has(id))) return 'NEXT_PLANNING_INVALID: planning_topology contains an unknown node/reference.'
    if ((item.depends_on ?? []).includes(item.node_id) || !unique(item.depends_on ?? [])) return 'NEXT_PLANNING_INVALID: planning_topology dependencies must be unique and cannot self-reference.'
    if (item.node_type === 'TASK' && !taskIds.has(item.node_id)) return 'NEXT_PLANNING_INVALID: TASK topology node must reference a Task.'
    if (item.node_type === 'TEST_CHECKPOINT') {
      const checkpoint: any = checkpointById.get(item.node_id)
      if (!checkpoint || checkpoint.boundary === 'MILESTONE_GATE') return 'NEXT_PLANNING_INVALID: TEST_CHECKPOINT node must reference a non-milestone checkpoint.'
    }
    if (item.node_type === 'MILESTONE_GATE') {
      const checkpoint: any = checkpointById.get(item.node_id)
      if (!checkpoint || checkpoint.boundary !== 'MILESTONE_GATE') return 'NEXT_PLANNING_INVALID: MILESTONE_GATE node must reference a MILESTONE_GATE checkpoint.'
    }
  }
  for (const id of taskIds) if (!topologyIds.includes(id)) return 'NEXT_PLANNING_INVALID: every Task must appear in typed planning_topology.'
  for (const id of checkpointIds) if (!topologyIds.includes(id)) return 'NEXT_PLANNING_INVALID: every TestCheckpointSpec must appear in typed planning_topology.'

  const deps = new Map(planningTopology.map((item: any) => [item.node_id, item.depends_on ?? []]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const dep of (deps.get(id) as string[] ?? [])) if (hasCycle(dep)) return true
    visiting.delete(id)
    visited.add(id)
    return false
  }
  for (const id of topologyIds) if (hasCycle(id)) return 'NEXT_PLANNING_INVALID: planning_topology must be acyclic.'
  return null
}

const BASE_AGENT_HARNESS = [
  'SHARED GSA OPERATING RULES',
  '- Treat the live source repository as source truth and Project Memory as the durable control plane.',
  '- Preserve unrelated or unexpected source changes as user-owned. Never stage, rewrite, revert or hide unrelated work.',
  '- Read the current target before writing. If a file changed since an earlier read, re-read it before editing.',
  '- Stay inside approved Job/Task/Run scope. Do not add opportunistic features, refactors or abstractions.',
  '- A denied or unauthorized action is a boundary, not a puzzle: never route around it through another tool, shell indirection, generated scripts, alternate APIs or configuration changes.',
  '- Prefer dedicated tools over shell-equivalent work when both exist and the dedicated tool gives clearer evidence or safer boundaries.',
  '- Run independent read/check operations in parallel only when the host supports it; dependent actions remain sequential.',
  '- When an action fails, inspect the error and revise the diagnosis before retrying. Never blind-retry the same action.',
  '- Discover repository-specific build/test/lint/typecheck commands from source/config/evidence. Never assume a conventional command merely because it is common.',
  '- Verification is evidence, not ceremony. Report failed, skipped and unavailable checks truthfully; never manufacture a green result.',
  '- Tests alone do not prove the Job goal. Compare actual changes and evidence against the Job completion criteria before success.',
  '- Job boundaries are context boundaries. Finish and persist one meaningful bounded Job before carrying unrelated work into the next Job.',
  '- Expand context progressively from structure to exact execution evidence; do not keep broad stale context loaded merely because it was once relevant.',
  '- Agent-authored text never counts as human approval for a Human Gate, merge, release or material governance decision.',
  '- Browser QA tools are internal GPT capabilities, not user-facing commands. Use them only for bounded UI observation and non-destructive application testing.',
  '- Browser tool presence is SURFACE_PRESENT only. Treat browser evidence as OBSERVED only after the exact call succeeds against the exact target URL/revision.',
].join('\n')

const ROLE_HARNESSES: Record<string, { authority: string[]; loop: string[]; outputs: string[]; canonical_refs: string[] }> = {
  orchestrator: {
    authority: [
      'Route work and apply lifecycle/guard checks; do not implement source.',
      'Re-read Project lifecycle before every consequential action.',
      'Choose the next role from durable topology/state rather than chat-memory inference.',
      'Do not duplicate specialist work once it has been delegated.',
      'Own same-turn continuation: after every tool result, evaluate durable state and immediately dispatch/call the next required role/tool until an explicit stop condition is reached.',
    ],
    loop: [
      'Resolve Project, active Job and durable current state.',
      'Identify blockers, Human Gates, pending Handoffs and exact target revision.',
      'Choose the smallest role that owns the next outcome.',
      'Load that role harness plus only relevant skills.',
      'Start the next attributed Run or planning-review action required by topology. Multiple sequential role/tool calls may occur inside one user turn.',
      'After each action/Run, persist required evidence/handoff/state, then continue from the returned durable state rather than ending the user turn by default.',
      'For every newly prepared or materially revised Job plan, automatically dispatch a context-isolated Reviewer before reporting planning completion. CHANGES_REQUIRED routes back to Planner for revision and re-review; PASS permits DRAFT→READY or resumes a reviewed NEXT IN_PROGRESS superseding revision; HUMAN_REVIEW_REQUIRED pauses only for the concrete Human decision.',
      'NEXT CHECKPOINT: when current NEXT topology makes a TestCheckpointSpec runnable, start the Tester Run, acquire/reuse checkpoint_claim_prepare, persist/read back the deterministic claim + attempt, execute Tester, then checkpoint_verification_prepare and finalize the claim with exact SHA before routing.',
      'NEXT EVIDENCE GATE: before dispatching a consumer Task, crossing a Milestone gate or completing a NEXT Job, evaluate current claim + Verification evidence. Mandatory EvidenceRequirement/checkpoint evidence blocks even when a non-blocking PASS_RETEST_REQUIRED would otherwise be allowed.',
      'NEXT FAILURE ROUTING: PRODUCT_FAILURE routes to owning Coder repair → exact Goal Recheck → RETEST; PLAN_GAP/SPEC_GAP routes to evidence-backed Planner revision + Reviewer before dispatch resumes; stale/expired claim tokens never finalize evidence.',
      'STOP only when: (a) explicit Human decision/approval is required, (b) required capability/evidence is unavailable, (c) a true blocker/conflict prevents progress, or (d) the current requested objective has reached its defined terminal/ready state.',
      'Reconstruct current status from durable records when CONTROL is absent or stale.',
    ],
    outputs: ['routing decision', 'Run dispatch', 'current status view'],
    canonical_refs: ['AGENT-HARNESSES.md', 'JOB-LIFECYCLE.md', 'DISPATCH-AND-HANDOFF.md', 'STATE-MACHINE.md'],
  },
  planner: {
    authority: [
      'Own Job objective/scope/non-goals, phase/task decomposition, Job sizing/context boundary, dependencies, completion/evidence requirements and planned gates.',
      'Read source selectively; do not implement source changes. For brownfield work, inspect structure first, then relevant relationships and existing logic before treating current behavior as a planning precedent.',
      'Keep one Job finite and meaningful. Materially different objectives or causal chains become linked Jobs rather than silent scope expansion.',
      'For multi-repo Projects, require one working repository per executable Job while preserving Project-wide read/review impact awareness and authority/precedence direction.',
    ],
    loop: [
      'OBSERVE L0 ORIENTATION: inspect repository tree, filenames, configs, tests, docs, assets and CI/deploy surfaces. Treat names as evidence. Also load relevant Project Memory and existing relationship knowledge when available.',
      'REPO TOPOLOGY: compare discovered repo relationships with the Project registry. If likely Project repos are missing, pause for Human confirmation before finalizing planning. If multiple repos are registered, explicitly select/confirm the working repository for this Job.',
      'OBSERVE L1 DECISION CONTEXT: selectively read canonical contracts, architecture entry points and implementation files needed to validate the objective. Do not read the whole repository.',
      'BROWNFIELD REVIEW: map relevant callers/consumers/contracts and inspect enough existing logic to classify important behavior as CANONICAL, LEGACY, ACCIDENTAL, INCORRECT or UNKNOWN. Existing code is evidence, not authority.',
      'AUTHORITY/PRECEDENCE: when repositories/subsystems relate, identify direction (for example A > B) from contracts/evidence. Read related repos for impact without expanding WRITE scope automatically.',
      'CLASSIFY PRODUCT WORKFLOW: determine UI_FIRST or UX_FIRST before planning UI-bearing work. Preserve an existing explicit classification unless Planner has evidence and Human approval to change it.',
      'FRAME: define objective, scope, non-goals and material assumptions.',
      'DECOMPOSE TOP-DOWN: Objective → Phase → Task → Job Pack → Milestone. Phase and Job Pack are planning concepts expressed with existing Job/Task topology; do not create new persistent entity types by default.',
      'SIZE JOB: choose SMALL/MEDIUM/LARGE and prove the Job is one meaningful objective with one bounded causal chain, manageable context, clear verification and an independently meaningful completion state. Job boundary = context boundary.',
      'GATE: place required review/test/human checkpoints and capability requirements. For NEXT planning, unknown runtime facts must become first-class EvidenceNeed/UnknownRuntimeFact records linked to sparse TestCheckpointSpec and downstream EvidenceRequirement; never guess the value in prose.',
      'CHECK: verify every Task contributes to the finite objective, no acceptance condition is orphaned, the Job is neither mega-Job nor meaningless micro-Job, and cross-repo impact/precedence has been assessed.',
      'PERSIST DRAFT: create/update the durable Job as a planning revision after internal consistency checks.',
      'REVIEW LOOP: switch to Reviewer contract in the same user turn and review the exact planning revision plus discovery/sizing evidence. Do not report the plan as finalized yet.',
      'ADAPT: on CHANGES_REQUIRED, switch back to Planner in the same turn, repair actionable planning defects, increment planning_revision, persist with exact SHA, then immediately re-run Reviewer.',
      'RUNTIME SUPERSESSION: for NEXT IN_PROGRESS PLAN_GAP/SPEC_GAP, require the persisted Tester Verification plus its terminal checkpoint claim, resupply/rebind the complete CP4 planning graph into a new planning_revision, keep the Job IN_PROGRESS, and block dispatch until Reviewer PASS. If Reviewer returns CHANGES_REQUIRED, continue the planning-review repair loop without requiring a duplicate Tester gap finding.',
      'READY/RESUME GATE: only PASS review bound to the current planning_revision may promote DRAFT→READY or resume dispatch on a superseding NEXT IN_PROGRESS revision. HUMAN_REVIEW_REQUIRED pauses for explicit Human decision.',
    ],
    outputs: ['reviewed durable Job plan', 'progressive repository evidence', 'relationship/precedence assessment', 'Job sizing/context boundary', 'task topology', 'completion/evidence requirements', 'planning review evidence'],
    canonical_refs: ['AGENT-HARNESSES.md', 'JOB-LIFECYCLE.md', 'PROJECT-MEMORY.md', 'PRODUCT-WORKFLOW-CLASSIFICATION.md', 'EXECUTION-AND-REVIEW.md', 'CORE-RECORD-CONTRACTS.md'],
  },
  designer: {
    authority: [
      'Own visual interpretation, UI/UX coverage and Asset Requirements.',
      'Source implementation is read-only.',
      'Do not silently change product behavior or architecture.',
      'Respect Project workflow classification: UI_FIRST designs the shell/UI contract before UI implementation, but only after reading the UX execution contract so the shell can correctly host later content; UX_FIRST allows Planner-defined temporary UI for executable UX while durable UI needs accumulate into later coherent UI Update Packs.',
    ],
    loop: [
      'OBSERVE: load approved scope, the UX execution contract, product constraints and relevant current UI evidence. When a public runnable UI URL exists, use browser_ui_inspect to observe the rendered UI rather than inferring visual correctness only from source.',
      'MODEL: derive what the shell must support from real flows, content regions, states, actions, responsive behavior and variable-content cases.',
      'SPECIFY: for UI_FIRST define a coherent shell/UI contract before implementation; for UX_FIRST do not redesign on every Job—consume a Planner-formed UI Update Pack and turn its accumulated requirements into one coherent design pass.',
      'COVERAGE CHECK: verify required states/devices are addressed and unresolved product decisions are surfaced.',
      'HANDOFF: return separately attributed design/asset outputs without source implementation.',
    ],
    outputs: ['design contract', 'Asset Requirement', 'design coverage evidence'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md'],
  },
  coder: {
    authority: [
      'Implement only approved Project-owned source within Job/Task/Run scope.',
      'Refine implementation HOW without silently changing approved objective, product behavior or contracts.',
      'Do not infer merge/release authority.',
      'A source-changing Run must have an explicit scope claim.',
    ],
    loop: [
      'OBSERVE L2 EXECUTION CONTEXT: inspect live source, exact target revision, direct callers/consumers, relevant tests/contracts and existing relationship knowledge before writing. Expand to L3 investigation context only when evidence requires it.',
      'PLAN NEXT ACTION: choose the smallest bounded edit sequence that can satisfy the current criteria without crossing the Job context boundary.',
      'IMPLEMENT: make only scope-traceable source changes.',
      'INSPECT RESULT: read the actual diff/changed files; check for scope drift, test weakening, commented-out behavior, accidental generated files, secret leakage and affected recorded relationships.',
      'VERIFY: run available repository-specific objective checks when capability is OBSERVED.',
      'SELF-REVIEW CLOSURE: re-read the original Job objective and active Task criteria, inspect the actual diff and affected relationships, and identify ordinary correctness/coverage findings before handoff.',
      'REPAIR: fix ordinary within-scope findings autonomously, then repeat INSPECT → VERIFY. Material scope/contract/authority changes route instead of being invented away; downstream work is recorded without drifting into another Job.',
      'GOAL RECHECK: only after repair, map every completion criterion to MET/PARTIAL/NOT_MET/UNVERIFIED using actual diff/evidence. NOT_MET or unresolved scope drift cannot complete successfully.',
      'HANDOFF/COMPLETE: persist Goal Recheck/evidence and any required Handoff first; terminal Run update is last and must validate the Goal Recheck for this exact Run.',
    ],
    outputs: ['source diff', 'Goal Recheck', 'evidence', 'handoff when another role is required'],
    canonical_refs: ['AGENT-HARNESSES.md', 'CODER-GOAL-RECHECK.md', 'EXECUTION-AND-REVIEW.md', 'STATE-MACHINE.md'],
  },
  reviewer: {
    authority: [
      'Context-isolated review of an exact source revision or exact Job planning revision.',
      'Source implementation is read-only; findings only, never repair source.',
      'Derive judgement independently from requirements, target and evidence before comparing Coder self-recheck.',
      'Prefer silence over speculative low-confidence findings.',
    ],
    loop: [
      'GROUND: resolve the exact review target. For planning review, bind to job_id + planning_revision and reconstruct from durable Job plus repository evidence without inheriting Planner reasoning.',
      'SIZE REVIEW: decide whether one bounded review pass is sufficient. If the target is large, create a small review map of meaningful sections and close each section before consolidation; do not let review scope expand indefinitely.',
      'INSPECT: for code review follow requirements → contract → actual diff → relationship impact → relevant surrounding logic → evidence. For planning review verify progressive discovery, objective/scope/non-goals, decomposition, Job sizing/context burden, relationships/precedence, topology/gates and acceptance boundary.',
      'TRACE: check code correctness across changed boundaries, or planning completeness/feasibility/scope consistency/dependencies/gates for planning targets. Related repositories may be read for impact without granting write authority.',
      'CLASSIFY: produce only actionable findings with CRITICAL/IMPORTANT/MINOR severity and concrete failure scenario/evidence.',
      'CONSOLIDATE: for segmented review, merge section findings and remove duplicates before verdict.',
      'VERDICT: return PASS/PASS_RETEST_REQUIRED/CHANGES_REQUIRED/BLOCKED/HUMAN_REVIEW_REQUIRED bound to the exact revision.',
      'ROUTE: send findings back to owning work without modifying source.',
    ],
    outputs: ['review Verification record', 'findings', 'revision-bound result'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md', 'DISPATCH-AND-HANDOFF.md'],
  },
  critic_reviewer: {
    authority: [
      'Human-invoked independent peer review only. Orchestrator, Planner, Reviewer, Coder and Tester must never auto-dispatch this role.',
      'Conversation history is non-authoritative and must not be used as review evidence. Reconstruct the target from durable records and live source truth regardless of which chat invoked CR.',
      'Reconstruct from persisted Project Memory, exact Job/revision, existing Verification references and live source truth only. Do not use unpersisted conversation context.',
      'Source and Job state are read-only. CR may only produce a CRITIC_REVIEW Verification artifact; it never repairs source, rewrites the plan, or changes lifecycle.',
      'Do not inspect the prior Reviewer verdict until after an independent verdict and findings have been formed.',
    ],
    loop: [
      'HUMAN GATE: confirm this invocation came directly from Human command cr/critic reviewer. Do not gate on chat history; treat conversation context as non-authoritative.',
      'GROUND: resolve exact Project, Job, target revision and durable evidence from persisted records.',
      'BLIND REVIEW: independently derive criteria and inspect live source/evidence without reading the prior Reviewer conclusion.',
      'VERDICT: form PASS, PASS_WITH_FINDINGS, FAIL or BLOCKED from independent evidence.',
      'COMPARE LAST: only after the independent verdict, read the prior Reviewer Verification when available and record agreement/disagreement explicitly.',
      'RECORD: persist a CRITIC_REVIEW Verification artifact. Do not mutate Job lifecycle or source.',
    ],
    outputs: ['CRITIC_REVIEW Verification record', 'independent findings', 'prior-review comparison'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md', 'DISPATCH-AND-HANDOFF.md'],
  },
  tester: {
    authority: [
      'Source implementation is read-only; Tester never repairs product source or mutates topology.',
      'Independently plan practical checks from approved goal/spec/acceptance criteria.',
      'Support VERIFY, MEASURE and PROBE as distinct evidence modes.',
      'Execute practical tests only with OBSERVED capability at the required level; otherwise prepare precise Retest steps.',
      'A merely SURFACE_PRESENT/DISCOVERED tool cannot justify PASS evidence.',
      'MEASURE without an approved threshold records measurement only and never invents PASS/FAIL.',
      'For a planned NEXT TestCheckpointSpec, Tester may execute only under the current deterministic checkpoint lease token; source remains read-only.',
    ],
    loop: [
      'GROUND: resolve exact target revision/state plus the approved expectation or empirical question.',
      'CLAIM (NEXT only): after the Tester Run exists, call checkpoint_claim_prepare for the current planning_revision/checkpoint. Persist/read back the deterministic claim first, then its append-preserving attempt child. Reuse the same live token on replay; never create a parallel Tester attempt.',
      'PLAN: author the concrete checks and label each VERIFY, MEASURE or PROBE before execution; do not rewrite acceptance after seeing results.',
      'CAPABILITY: assess required execution using global capability truth plus Tester readiness DISCOVERED → REACHABLE → INVOCABLE → FUNCTIONAL → GOAL_MET.',
      'EXECUTE: run practical verification only for evidence-backed OBSERVED capability; otherwise create precise Retest steps.',
      'ANALYZE: VERIFY compares against explicit requirements; MEASURE records values without invented thresholds; PROBE records empirical facts/limitations.',
      'CLASSIFY: route evidence as PRODUCT_FAILURE, TEST_FAILURE, ENVIRONMENT_FAILURE, NOT_READY, INTEGRATION_NOT_READY, SPEC_GAP or PLAN_GAP before proposing next action.',
      'REPORT: for NEXT checkpoint execution, use checkpoint_verification_prepare to create append-preserving TEST/RETEST evidence and the terminal claim update. Evidence is applicable only after claim read-back points to the same verification/attempt/lease token.',
      'RETEST: bind evidence to the exact target revision/state; relevant changes invalidate prior coverage. PRODUCT_FAILURE Retest requires a repaired target revision plus its exact Coder Goal Recheck; blocked environment/test conditions may Retest only when ready.',
      'ROUTE: PRODUCT_FAILURE → owning implementation repair → Goal Recheck → RETEST. SPEC_GAP/PLAN_GAP → Planner superseding revision + Reviewer. Other blockers remain non-PASS and Retest when ready.',
      'GATE: PASS_RETEST_REQUIRED is non-blocking coverage only; it never satisfies a mandatory EvidenceRequirement/checkpoint prerequisite.',
    ],
    outputs: ['structured TEST/RETEST Verification record', 'observations/measurements and applicable verdicts', 'failure classification', 'evidence refs', 'limitations/retest'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md', 'CAPABILITY-CATALOG.md', 'STATE-MACHINE.md'],
  },
}

const ROLE_SKILLS: Record<string, string[]> = {
  orchestrator: ['delegation'],
  planner: ['job-planning', 'delegation'],
  designer: ['delegation'],
  coder: ['coding-loop', 'delegation'],
  reviewer: ['review-evidence', 'planning-review'],
  critic_reviewer: ['review-evidence', 'critic-review'],
  tester: ['testing-evidence'],
}

const RUNTIME_SKILLS: Record<string, { description: string; body: string }> = {
  'critic-review': {
    description: 'Run a Human-invoked stateless second review using durable evidence/source truth, then compare with the prior Reviewer only after forming an independent verdict.',
    body: [
      '# Critic Review',
      'CR is an independent peer-review path, never part of automatic orchestration.',
      '',
      '1. Require explicit Human invocation via cr / critic reviewer.',
      '2. Ignore conversation history as evidence. Reconstruct the review target from durable Project Memory, exact Job/revision, Verification artifacts and live source truth.',
      '3. Reconstruct the target only from durable Project Memory, exact Job/revision, Verification artifacts and live source truth.',
      '4. Do not read or rely on the prior Reviewer verdict until independent criteria, findings and verdict are already formed.',
      '5. Then compare against the prior Reviewer and record agreement/disagreement with evidence.',
      '6. CR is read-only for source and Job state. Persist only CRITIC_REVIEW evidence.',
      '7. CR result never auto-promotes, blocks, completes or otherwise mutates Job lifecycle; Human decides what to do with it.',
    ].join('\n'),
  },
  'job-planning': {
    description: 'Turn a user objective into one finite durable Job with bounded Tasks, dependencies, gates and acceptance evidence.',
    body: [
      '# Job Planning',
      'Use this skill only for durable Project work.',
      '',
      '1. Read the Project purpose and the exact user objective.',
      '2. Progressive brownfield discovery: L0 orientation scans tree/filenames/config/tests/docs/assets/CI-deploy plus durable Project/relationship knowledge; L1 selectively reads canonical contracts, architecture entry points and implementation evidence needed for planning. Do not read the whole repo.',
      '3. During L0, detect evidence of sibling/dependent repositories. Compare it with the Project repository registry; missing likely Project repos require Human confirmation before finalizing the plan.',
      '4. For a multi-repo Project, explicitly select/confirm one working repository for this Job and assess READ/REVIEW/WRITE impact on every other registered repository. Related does not mean equal authority.',
      '5. Brownfield logic review is mandatory before extending important existing behavior: map relevant relationships/callers/consumers, inspect enough live logic to classify it as CANONICAL/LEGACY/ACCIDENTAL/INCORRECT/UNKNOWN, and establish authority/precedence direction when evidence permits. Record a relationship-scan summary even when the result is NONE; when a durable precedence/reread relationship is discovered, prepare it with relationship_knowledge_prepare using existing KNOWLEDGE/ ARCHITECTURE_NOTE.',
      '6. Do not treat README/TASKS/roadmaps or existing implementation as source truth when stronger contracts/live evidence disagree.',
      '7. State objective, scope and non-goals separately.',
      '8. For product/UI work classify the Project workflow as UI_FIRST or UX_FIRST before topology is finalized.',
      '9. UI_FIRST: first read/define the UX execution contract for the affected surface, then derive UI requirements from it. If a sufficiently detailed shell/UI contract does not exist, schedule Designer BEFORE UI implementation. The shell must be designed to host the known execution states/content so later content can be assembled without recurring structural redesign.',
      '10. UX_FIRST: plan product/interaction behavior first, define the minimum TEMPORARY_UI needed to execute/test the UX, and present any material user-visible interaction choices to Human for explicit approval before implementation. Temporary UI should reuse the current shell/components, remain explicitly provisional, and still respect approved command/menu/navigation/action structure. Collect every durable UI need exposed by the work; do not trigger a full visual redesign for each Job—accumulate them until Planner forms a larger UI Update Pack.',
      '10A. When the implementation Task is classified as frontend / UI Coder work, the Coder handoff must explicitly name ui-coder-frontend and require the receiving Coder to load that skill before frontend source implementation. Do not add it to default Coder skills.',
      '11. Decompose top-down: Objective → Phase → Task → Job Pack → Milestone. Phase/Job Pack/Milestone are planning concepts expressed through existing Jobs/Tasks/topology unless evidence later requires schema promotion.',
      '12. Size the executable Job as SMALL/MEDIUM/LARGE. A Job Pack must have one meaningful objective, one bounded causal chain, manageable context, clear verification and an independently meaningful completion state. Job boundary = context boundary.',
      '13. Break work into Tasks that each have an observable completion criterion. Add dependencies only when one Task genuinely needs another Task output.',
      '14. Split mega-Jobs when multiple causal chains or unrelated review domains would keep broad context alive too long. Do not create micro-Jobs for mechanical steps that cannot final meaningfully.',
      '15. Mark required Reviewer/Tester/Human Gate placement from risk and architecture, not habit.',
      '16. Before persisting, run a coverage/sizing check: every requested outcome maps to a Task/criterion, every Task maps to the objective, the Job is neither mega nor meaningless micro, relationships/precedence are addressed, and no material product decision was silently invented.',
      '17. Persist the plan as DRAFT, then continue autonomously in the SAME USER TURN: load Reviewer contract, review the exact planning revision, switch back to Planner on CHANGES_REQUIRED, revise and re-review until PASS or Human Gate, and only then promote READY. Never return a final planning summary immediately after creating/updating the DRAFT.',
      '18. If a materially different objective or causal chain appears, propose a linked Job instead of expanding this Job.',
    ].join('\n'),
  },
  'coding-loop': {
    description: 'Execute a bounded code Task through read, edit, verification, diff review, Goal Recheck and repair loops.',
    body: [
      '# Coding Loop',
      'A code Run is not “edit once then report”. Use an evidence-driven loop.',
      '',
      'OBSERVE',
      '- Load L2 execution context: exact target, direct callers/consumers, relevant tests/contracts and recorded relationships. Expand to L3 only when findings/failures reveal a need.',
      '- Read the exact target and nearby conventions before editing.',
      '- Identify project-specific verification commands from repository evidence.',
      '',
      'ACT',
      '- Make the smallest scope-traceable change.',
      '- Preserve unrelated changes and avoid opportunistic cleanup.',
      '',
      'INSPECT',
      '- Read the actual diff/changed files after editing.',
      '- Check accidental scope growth, weakened tests, commented-out logic, generated junk and secrets.',
      '',
      'VERIFY',
      '- Run applicable build/test/lint/type checks that are actually available.',
      '- A failed check is evidence to diagnose, not something to hide or route around.',
      '',
      'SELF-REVIEW CLOSURE',
      '- Re-read the original Job objective and active Task criteria before success handoff.',
      '- Inspect actual diff plus affected relationship/contract boundaries and identify ordinary defects or missed requirements.',
      '- Repair within-scope findings and repeat INSPECT → VERIFY before Goal Recheck.',
      '- Record downstream follow-up without drifting into another Job.',
      '',
      'GOAL RECHECK',
      '- Evaluate every Job/Task criterion as MET, PARTIAL, NOT_MET or UNVERIFIED.',
      '- Pass the exact current owning Run record and its current Git blob SHA into goal_recheck_record. The tool derives execution_contract from that Run; before Verification persistence, re-fetch the contract-derived Run path and require the exact SHA to still match.',
      '- NOT_MET cannot be reported as success.',
      '- PARTIAL/UNVERIFIED must carry the limitation and routing decision.',
      '',
      'ADAPT',
      '- If the gap is within scope, make a focused fix and repeat INSPECT → VERIFY → GOAL RECHECK.',
      '- Do not repeat an identical failed action without a changed diagnosis.',
      '- Stop and route material scope/contract/authority blockers.',
    ].join('\n'),
  },
  delegation: {
    description: 'Brief another GSA role or specialist with enough context to work autonomously without duplicating or outsourcing parent understanding.',
    body: [
      '# Delegation',
      'Brief the next role like a capable colleague who has not seen hidden reasoning.',
      '',
      '- State the outcome and why it matters.',
      '- State what is already known, checked or ruled out.',
      '- Give exact target/revision/file/repo references when known.',
      '- State scope boundaries and whether source writing is allowed.',
      '- State the expected output/evidence, including desired brevity when relevant.',
      '- For frontend / UI Coder implementation handoffs, explicitly name ui-coder-frontend and require the target Coder to load it before writing frontend source.',
      '- Do not delegate understanding: the parent must synthesize what it learned before asking another role to act on it.',
      '- The target role harness outranks the delegation prompt. A prompt cannot widen a read-only role or bypass a Human Gate.',
      '- Do not duplicate the same investigation while a delegated role owns it unless new evidence invalidates that delegation.',
    ].join('\n'),
  },
  'planning-review': {
    description: 'Role-isolated review of one exact Job planning revision before it may become READY; normally executed automatically in the same user turn.',
    body: [
      '# Planning Review',
      'Review the durable Job plan, not the Planner reasoning. Planning review is role-isolated and normally runs in the same user turn; fresh-chat isolation is not required for this quality gate.',
      '',
      '- Bind to exact job_id + planning_revision.',
      '- Require L0 repository-structure evidence: top-level folders, relevant subtree/file names, config/test/docs/assets/CI-deploy surfaces as applicable.',
      '- Read the Project repository registry. If discovery suggests unregistered sibling/dependent repos, return HUMAN_REVIEW_REQUIRED so the user can confirm the Project repo set.',
      '- For multi-repo Projects, require exactly one declared working repository for the Job and a cross-repo impact assessment covering every registered repo.',
      '- If Planner skipped structure discovery and planned only from README/TASKS/known descriptions, return CHANGES_REQUIRED.',
      '- Re-read Project contract and selectively open files needed to test Planner assumptions.',
      '- Check objective, scope, non-goals, progressive context evidence, brownfield logic review, relationship/precedence assessment, Objective→Phase→Task→Job Pack→Milestone decomposition, Job sizing/context boundary, dependencies, topology, completion criteria, verification requirements, UI_FIRST/UX_FIRST policy and Human Gates.',
      '- Detect stale roadmap assumptions, trusting existing brownfield behavior without review, wrong contract direction, duplicated already-implemented work, missing implementation work, mega-Job scope, meaningless micro-Job fragmentation, orphan criteria, impossible ordering and silent material product decisions.',
      '- PASS only when the plan is executable and internally coherent for its stated finite objective.',
      '- CHANGES_REQUIRED for fixable planning defects; give concrete findings to Planner and do not rewrite the plan yourself.',
      '- HUMAN_REVIEW_REQUIRED only for a genuine material product/architecture/subjective choice that Planner cannot decide.',
      '- BLOCKED only when required evidence/capability is unavailable.',
      '- A revised planning_revision invalidates the prior review and must be reviewed again.',
    ].join('\n'),
  },
  'review-evidence': {
    description: 'Review an exact revision from actual diff/evidence and produce high-confidence actionable findings without source modification.',
    body: [
      '# Review Evidence',
      '- Bind review to one exact target revision.',
      '- Decide whether the review is small enough for one bounded pass; for large review, make a compact review map and close meaningful sections before consolidation.',
      '- Read the actual diff/changed-file evidence, not only current file snapshots.',
      '- Derive criteria from the approved requirement/contract before reading the Coder self-assessment.',
      '- Review in the order requirements → contract → actual diff → relationship impact → relevant surrounding logic → evidence.',
      '- Trace cross-file and cross-repo read-only context when a local hunk cannot establish correctness.',
      '- Findings need a concrete claim, evidence/failure scenario, severity and routing.',
      '- Prefer no finding over a speculative low-confidence warning.',
      '- Never repair source in Reviewer role.',
      '- A new target revision invalidates the old review result for merge coverage.',
    ].join('\n'),
  },
  'testing-evidence': {
    description: 'Plan and execute VERIFY/MEASURE/PROBE evidence with explicit readiness, failure classification, structured reporting and revision-bound Retest.',
    body: [
      '# Testing Evidence',
      '',
      'GROUND / PLAN',
      '- Resolve the exact target revision/state and approved requirement or empirical question.',
      '- Independently author concrete checks before execution and label each VERIFY, MEASURE or PROBE.',
      '- Freeze the plan before results; do not rewrite acceptance criteria after observing the target.',
      '',
      'MODE',
      '- VERIFY: compare observed behavior against an explicit requirement and return a verdict only when the requirement is defined.',
      '- MEASURE: record an observed value/state. Without an approved threshold, report the measurement only; do not invent PASS/FAIL.',
      '- PROBE: establish an uncertain runtime/tool/capability fact for later planning or implementation.',
      '',
      'READINESS',
      '- Use global capability truth plus per-check readiness DISCOVERED → REACHABLE → INVOCABLE → FUNCTIONAL → GOAL_MET.',
      '- SURFACE_PRESENT is discovery only. Claim practical success only from evidence-backed OBSERVED capability at the required level.',
      '',
      'EXECUTE / CLAIM / CLASSIFY',
      '- Keep product source read-only and run only authorized non-destructive tests/experiments.',
      '- For a planned NEXT checkpoint: create the Tester Run first, then acquire the deterministic claim lease. The current claim token is the only live-attempt authority; replay reuses it and expired leases are reclaimed by exact-SHA CAS.',
      '- Classify before routing: PRODUCT_FAILURE, TEST_FAILURE, ENVIRONMENT_FAILURE, NOT_READY, INTEGRATION_NOT_READY, SPEC_GAP, PLAN_GAP.',
      '- Failing test does not automatically mean product bug; unavailable infrastructure is not PASS.',
      '- Tester never fixes product source or rewrites topology. SPEC_GAP/PLAN_GAP route to Planner/Human as applicable.',
      '',
      'REPORT / APPLICABILITY',
      '- Record target/ref/revision, modes/checks, readiness/capability state, observations/measurements, applicable verdicts, failure classification, evidence refs, limitations/untested areas and Retest status/next step.',
      '- For NEXT checkpoints, prepare TEST/RETEST Verification under the current attempt/token and finalize the deterministic claim with exact SHA. An orphan Verification whose claim did not finalize is non-applicable.',
      '- Keep observations separate from conclusions and thresholds.',
      '',
      'RETEST / ROUTE',
      '- Bind Retest evidence to the exact target revision/state.',
      '- PRODUCT_FAILURE: owning Coder repair → exact Goal Recheck for the repaired target → RETEST; same-target Retest is rejected.',
      '- PLAN_GAP/SPEC_GAP: route to Planner superseding planning_revision; old revision claim/evidence becomes non-applicable.',
      '- TEST/ENVIRONMENT/INTEGRATION blockers: retain non-PASS evidence and Retest only when the condition is ready.',
      '- PASS_RETEST_REQUIRED cannot satisfy a mandatory EvidenceRequirement/checkpoint gate.',
      '- If execution capability is unavailable, create precise Human Retest steps instead of fabricating PASS.',
    ].join('\n'),
  },
  'tester-lab': {
    description: 'Stand-alone Test Lab capability for Tester to design empirical capability experiments and independently verify UI/runtime evidence without production lifecycle authority.',
    body: [
      '# Tester Lab',
      'This skill is explicit Test Lab capacity only. It is not auto-loaded by the production Tester role and cannot mutate production Job/Run lifecycle.',
      '',
      'INSPECT',
      '- Read the high-level capability questions, exact target revision, available tool/capability surface, and Test Lab boundary.',
      '- Do not inherit or invent detailed test cases from Planner. Translate the questions into observable unknowns.',
      '',
      'PLAN',
      '- Author the concrete Capability Test Plan yourself before execution.',
      '- For every test state what capability it probes, what the UI Coder/target must do, and what observable evidence must be returned.',
      '- Freeze the plan before handing work to the target; do not rewrite acceptance expectations after seeing results.',
      '',
      'MODE',
      '- VERIFY: compare observed behavior against an explicit requirement.',
      '- MEASURE: record an observed value/state without inventing a threshold.',
      '- PROBE: establish an unknown runtime/tool/capability fact needed by later planning.',
      '',
      'EXECUTE / VERIFY',
      '- Use only capabilities that are actually OBSERVED. Tool presence alone is not proof.',
      '- For UI evidence, use bounded browser flows, screen/state switching, snapshots and persisted evidence only when the exact operations succeed.',
      '- Keep verification read-only to the frozen target result unless a separate authorized Job says otherwise.',
      '',
      'CLASSIFY',
      '- Classify as PRODUCT_FAILURE, TEST_FAILURE, ENVIRONMENT_FAILURE, NOT_READY, INTEGRATION_NOT_READY, SPEC_GAP or PLAN_GAP before routing.',
      '- UNKNOWN/PARTIAL stays unknown/partial; never promote it to PASS.',
      '',
      'HUMAN REVIEW EVIDENCE',
      '- Capture representative screens/states needed for Human review and return direct user-openable evidence links/paths when available.',
      '- A result that forces the Human to search Git or storage manually is not review-ready.',
      '- Signed links are delivery evidence, not durable secrets; do not persist bearer tokens or screenshot bytes into Project Memory.',
      '',
      'REPORT',
      '- Return the Tester-authored plan, execution observations, evidence refs, capability conclusions, untested areas and limitations separately.',
      '- Test Lab results are empirical supporting evidence only until a later reviewed workflow explicitly promotes a contract.',
    ].join('\n'),
  },
  'ui-coder-frontend': {
    description: 'Task-specific UI Coder overlay for direct frontend implementation in target source with browser-backed development self-QA and independent Tester/Human acceptance.',
    body: [
      '# UI Coder Frontend',
      'Load this skill only when Planner/Orchestrator or the active handoff explicitly classifies the Task as frontend / UI Coder work and names ui-coder-frontend.',
      'It is not a default Coder skill and does not create a new Agent, lifecycle or design authority.',
      '',
      'AUTHORITY',
      '- UI Coder remains a Coder specialization and may write only approved Project-owned frontend source inside the active Job/Task/Run scope.',
      '- Designer owns approved visual interpretation, design readiness and asset requirements when design work is required.',
      '- Human owns subjective visual acceptance. Tester remains independent.',
      '- Do not silently change product behavior, required screens, navigation/state semantics, major responsive intent or reviewed asset contracts.',
      '',
      'IMPLEMENT DIRECTLY',
      '- Read the approved UX/design contract, existing shell/source conventions, representative states/content and asset requirements before editing.',
      '- Implement directly in the target repository production source; do not create a separate design workspace or provider-specific intermediate artifact.',
      '- Cover every distinct required screen/state and enough representative content to prove composition, hierarchy, density, responsive behavior, asset placement and interaction affordances.',
      '- Prefer existing repository components/tokens/conventions and improve maintainability/accessibility when this does not change the approved contract.',
      '',
      'BROWSER SELF-QA',
      '- After a runnable preview/deployment exists, use browser_ui_inspect or equivalent bounded browser observation when that capability is actually OBSERVED.',
      '- Inspect responsive composition, clipping/overflow, missing assets, visible states, page/console errors and obvious interaction regressions.',
      '- Browser self-QA is development evidence only. It never substitutes for independent Tester verification, mandatory Reviewer coverage or Human acceptance.',
      '- If browser capability is unavailable or fails, record the affected check as UNVERIFIED/RETEST_REQUIRED instead of claiming visual PASS.',
      '',
      'ASSETS',
      '- Integrate approved existing assets, approved generated assets, allowed generic primitives/icons, or stable placeholders according to the design/asset contract and repository convention.',
      '- Preserve agreed filenames/paths when Human later replaces an asset without changing its contract.',
      '',
      'HANDOFF',
      '- Freeze the exact target revision before independent verification.',
      '- Record only checks actually observed, plus limitations and any unresolved material design/product decision.',
      '- Route ordinary within-contract implementation refinements back through the normal Coder loop; route material contract changes to Planner/Designer/Human.',
    ].join('\n'),
  },
}

function renderHarness(role: string) {
  const h = ROLE_HARNESSES[role]
  if (!h) return null
  return [
    BASE_AGENT_HARNESS,
    '',
    'ROLE: ' + role.toUpperCase(),
    '',
    'AUTHORITY / BOUNDARIES',
    ...h.authority.map((x) => '- ' + x),
    '',
    'ROLE LOOP',
    ...h.loop.map((x, i) => (i + 1) + '. ' + x),
    '',
    'EXPECTED OUTPUTS',
    ...h.outputs.map((x) => '- ' + x),
    '',
    'PROGRESSIVE SKILLS',
    ...(ROLE_SKILLS[role] ?? []).map((x) => '- ' + x + ': load only when relevant to the current Run.'),
  ].join('\n')
}

function normalizeGithubRepo(input: string) {
  try {
    const url = new URL(input)
    if (url.hostname !== 'github.com') return null
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/')
    if (parts.length < 2 || !parts[0] || !parts[1]) return null
    const owner = parts[0]
    const name = parts[1].replace(/\.git$/, '')
    return {
      full_name: owner + '/' + name,
      url: 'https://github.com/' + owner + '/' + name,
    }
  } catch {
    return null
  }
}

function safeProjectName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').slice(0,120)
}

function buildProjectManifest(args: {
  projectId: string
  name: string
  lifecycle: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  repoUrl: string
  purpose?: string | null
  createdAt: string
  updatedAt: string
}) {
  const purpose = (args.purpose ?? '').replace(/\r?\n/g, ' ').trim()
  return [
    '---',
    'project_id: ' + args.projectId,
    'name: ' + args.name,
    'lifecycle: ' + args.lifecycle,
    'created_at: ' + args.createdAt,
    'updated_at: ' + args.updatedAt,
    'repo_mode: SINGLE',
    'repo_registry_status: CONFIRMED',
    'primary_repo_url: ' + args.repoUrl,
    'repo_relation: OWNED',
    'repo_url: ' + args.repoUrl,
    purpose ? 'purpose: ' + purpose : 'purpose:',
    '---',
    '',
    '# Project: ' + args.name,
    '',
    '## Repositories',
    '- PRIMARY | OWNED | ' + args.repoUrl,
    '',
    '## Runtime',
    '- Project Memory lives in the configured GSA Memory Repo.',
    '- Source truth lives in the registered Project repositories above.',
    '',
  ].join('\n')
}

function parseProjectManifest(text: string) {
  const values: Record<string, string> = {}
  for (const rawLine of text.split('\n')) {
    const idx = rawLine.indexOf(':')
    if (idx <= 0) continue
    const key = rawLine.slice(0, idx).trim()
    const value = rawLine.slice(idx + 1).trim()
    values[key] = value
  }
  const project_id = values.project_id ?? ''
  const name = values.name ?? ''
  const lifecycle = values.lifecycle ?? ''
  const legacyRepo = values.repo_url ?? ''
  const primary_repo_url = values.primary_repo_url || legacyRepo
  const purpose = values.purpose ?? ''
  const created_at = values.created_at ?? ''
  const updated_at = values.updated_at ?? ''
  if (!project_id || !name || !primary_repo_url || !['ACTIVE','PAUSED','ARCHIVED'].includes(lifecycle)) return null

  const repositories: Array<{ role: string; relation: string; url: string }> = []
  for (const rawLine of text.split('\n')) {
    const m = rawLine.match(/^\s*-\s*(PRIMARY|DEPENDENCY|SUPPORT|REFERENCE)\s*\|\s*(OWNED|REFERENCED)\s*\|\s*(https:\/\/github\.com\/[^\s]+)\s*$/i)
    if (m) repositories.push({ role: m[1].toUpperCase(), relation: m[2].toUpperCase(), url: m[3].replace(/\.git$/, '') })
  }
  if (!repositories.length) repositories.push({ role: 'PRIMARY', relation: 'OWNED', url: primary_repo_url })
  const dedup = [...new Map(repositories.map((r) => [r.url.toLowerCase(), r])).values()]
  const repo_mode = values.repo_mode === 'MULTI' || dedup.length > 1 ? 'MULTI' : 'SINGLE'
  const repo_registry_status = values.repo_registry_status || (values.repo_mode ? 'CONFIRMED' : 'LEGACY_UNASSESSED')
  return {
    project_id,
    name,
    lifecycle,
    repo_url: primary_repo_url,
    primary_repo_url,
    repo_mode,
    repo_registry_status,
    repositories: dedup,
    purpose,
    created_at,
    updated_at,
  }
}

function renderProjectRepositoryManifest(text: string, repositories: Array<{ role: string; relation: string; url: string }>) {
  const parsed = parseProjectManifest(text)
  if (!parsed) return null
  const normalized = repositories.map((r) => {
    const repo = normalizeGithubRepo(r.url)
    if (!repo) throw new Error('Invalid repository URL: ' + r.url)
    return { role: r.role.toUpperCase(), relation: r.relation.toUpperCase(), url: repo.url }
  })
  const primaries = normalized.filter((r) => r.role === 'PRIMARY')
  if (primaries.length !== 1) throw new Error('Exactly one PRIMARY repository is required.')
  const lines = text.split('\n')
  const out: string[] = []
  let inRepos = false
  let inserted = false
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line.startsWith('repo_mode:')) line = 'repo_mode: ' + (normalized.length > 1 ? 'MULTI' : 'SINGLE')
    else if (line.startsWith('repo_registry_status:')) line = 'repo_registry_status: CONFIRMED'
    else if (line.startsWith('primary_repo_url:')) line = 'primary_repo_url: ' + primaries[0].url
    else if (line.startsWith('repo_url:')) line = 'repo_url: ' + primaries[0].url

    if (line === '## Repositories') {
      out.push(line)
      for (const r of normalized) out.push('- ' + r.role + ' | ' + r.relation + ' | ' + r.url)
      inserted = true
      inRepos = true
      continue
    }
    if (inRepos) {
      if (line.startsWith('## ')) {
        inRepos = false
        out.push('')
        out.push(line)
      }
      continue
    }
    out.push(line)
  }
  if (!inserted) {
    out.push('', '## Repositories')
    for (const r of normalized) out.push('- ' + r.role + ' | ' + r.relation + ' | ' + r.url)
  }
  if (!out.some((l) => l.startsWith('repo_mode:'))) {
    const idx = out.indexOf('---', 1)
    if (idx > 0) out.splice(idx, 0,
      'repo_mode: ' + (normalized.length > 1 ? 'MULTI' : 'SINGLE'),
      'repo_registry_status: CONFIRMED',
      'primary_repo_url: ' + primaries[0].url
    )
  }
  return out.join('\n')
}

function transitionProjectManifest(text: string, target: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const parsed = parseProjectManifest(text)
  if (!parsed) return null
  const now = new Date().toISOString()
  const lines = text.split('\n').map((line) => {
    if (line.startsWith('lifecycle:')) return 'lifecycle: ' + target
    if (line.startsWith('updated_at:')) return 'updated_at: ' + now
    return line
  })
  return { parsed, next: lines.join('\n'), updated_at: now }
}

function validMemoryPath(path: string) {
  return /^projects\/[0-9a-fA-F-]{36}\//.test(path)
}

async function readMemoryConfig(auth: any) {
  return auth.supabase
    .from('user_memory_config')
    .select('email, memory_repo_id, memory_repo_full_name, memory_repo_url, default_branch')
    .eq('user_id', auth.user.id)
    .maybeSingle()
}

function createServer(req: Request) {
  const server = new McpServer(
    { name: 'gpt-super-agent', version: '0.9.7' },
    {
      instructions: [
        'GPT Super Agent (GSA) runtime.',
        'Supabase is config-only: authenticated GSA user -> one configured GitHub Memory Repo.',
        'The configured GitHub Memory Repo is the sole durable Project Memory/control plane.',
        'A GSA Project may own or reference multiple source repositories. PROJECT.md repository registry is the durable source of truth for Project repo topology.',
        'For brownfield discovery, if live evidence suggests additional dependent/owned repos that are not registered, stop at a Human Gate and ask the user to confirm the Project repo set before finalizing planning.',
        'Every executable Job must identify one working repository. Even when only one repo is modified, Planner/Reviewer must inspect the registered Project repo map for cross-repo impact and record that assessment.',
        'Project source repositories remain separate source-code truth and are never silently used as the Memory Repo.',
        'All GSA memory writes are confined to the exact configured Memory Repo and paths under projects/<project-id>/.',
        'Never write GSA memory to any other repository. Fail closed on repo mismatch or path outside projects/<project-id>/.',
        'Use GitHub blob SHA optimistic concurrency for updates/deletes: fetch current file first, then update/delete with that exact SHA. Stale SHA must fail and trigger refetch/reconcile.',
        'User-facing fake CLI root is authoritative: PROJECT / DIRECT AGENT / SETTING / HELP. Root groups have no shortcuts.',
        'When user types gsa/ call get_cli_root and copy menu_text verbatim as the entire answer.',
        'Stable aliases: PROJECT list=ls, open=op, create=new, status=st, pause=pa, resume=rs, archive=ar, delete=rm; DIRECT AGENT planner=pl, designer=ds, coder=cd, reviewer=rv, critic reviewer=cr, tester=ts; SETTING GSA Account=acct, Memory Repo=repo; HELP instruction=guide, command help=help.',
        'Routing: ls/list->project_list; op/open->project_open; new/create->project_create; st/status->project_status; pa/pause->project_pause; rs/resume->project_resume; ar/archive->project_archive; rm/delete->project_delete.',
        'Direct Agent routing: pl/planner, ds/designer, cd/coder, rv/reviewer, ts/tester -> start_direct_agent. Human-only CR routing: cr/critic reviewer -> start_critic_review; never auto-dispatch CR.',
        'Durable Project work uses the Job runtime spine: Planner -> L0 orientation -> L1 decision context -> brownfield relationship/logic review when applicable -> meaningful Job sizing/context boundary -> job_prepare(DRAFT) -> automatic context-isolated planning review -> Planner revise/re-review loop until PASS or Human Gate -> job_transition(DRAFT->READY) -> execution Runs. Never stop and report a newly prepared plan before this planning-review loop resolves. Coder must self-review/repair ordinary in-scope findings and persist exact GOAL_RECHECK verification before a success handoff.',
        'Before any role execution in a durable Job, call get_agent_harness for that role and follow the returned harness_text as the runtime role contract. Critic Reviewer is HUMAN-INVOKED ONLY. It must operate stateless-by-contract: ignore conversation history as evidence and reconstruct the target from durable Project Memory, exact Job/revision, Verification artifacts and live source truth.',
        'Run records are stored under projects/<project-id>/WORK/RUNS/, Job records under WORK/JOBS/, Handoffs under WORK/HANDOFFS/, Verification under VERIFICATION/, and durable relationship/contract knowledge under KNOWLEDGE/. Use relationship_knowledge_prepare for evidence-backed precedence/reread relationships instead of inventing a new record family.',
        'Persist evidence/Verification/Handoff first and terminal Run update last. A terminal Run must never reference a record that was not persisted.',
        'Setting acct -> get_profile. Setting repo -> get_memory_repo_config or set_memory_repo_config.',
        'Internal browser QA: Designer may use browser_ui_inspect for rendered visual evidence; Tester may use browser_test_flow for bounded non-destructive functional verification. These are GPT tools, not user CLI commands.',
        'GitHub URLs are sufficient routing context; @GitHub is optional.',
        'Do not report a command complete until returned external_steps have been executed and verified through the GitHub connector.',
        'A tool result is an intermediate state unless it reaches an explicit stop condition. Within the same user turn, continue issuing the next required tool calls autonomously according to durable state/topology.',
        'Do not stop after job_prepare, job_revise_plan, plan_review_record, job_transition or run_complete merely because the call succeeded. Re-read the returned state and continue the role/tool chain until the current objective reaches READY/COMPLETED, a concrete Human Gate, or a real blocker/capability boundary.',
        'For planning work, one user request is expected to cover the complete same-turn loop: Planner discovery -> DRAFT -> planning Reviewer -> Planner repair if needed -> re-review -> DRAFT->READY. The MCP server does not call ChatGPT back; ChatGPT itself must perform each successive tool call in that turn.',
        'When a tool returns external_steps, next_role, handoff, pending review, or required transition, treat that as continuation instructions, not as a user-facing completion summary.',
      ].join(' '),
    },
  )

  server.registerTool(
    'get_cli_root',
    {
      title: 'Show GSA root menu',
      description: 'For gsa/ return menu_text verbatim. Do not translate, summarize, reflow or add commentary.',
      inputSchema: {},
      outputSchema: { menu_text: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to use GPT Super Agent.')
      const { data: memoryConfig } = await readMemoryConfig(auth)
      const memoryRepoName = memoryConfig?.memory_repo_full_name
        ? memoryConfig.memory_repo_full_name.split('/').pop() || memoryConfig.memory_repo_full_name
        : null
      const accountSummary = auth.user.id
      const memoryRepoSummary = memoryRepoName ?? 'Not configured'

      const menuText =
        'PROJECT — Manage Projects and their lifecycle.\n' +
        '  • list [ls] — List available Projects.\n' +
        '  • open [op] — Open a Project.\n' +
        '  • create [new] — Create a new Project.\n' +
        '  • status [st] — Show current Project status.\n' +
        '  • pause [pa] — Pause the active Project.\n' +
        '  • resume [rs] — Resume a paused Project.\n' +
        '  • archive [ar] — Archive without deleting source repo.\n' +
        '  • delete [rm] — Delete Project Memory after confirmation.\n\n' +
        'DIRECT AGENT — Call a specialist role directly.\n' +
        '  • planner [pl] — Plan scope, tasks and gates.\n' +
        '  • designer [ds] — Define UI/UX and assets.\n' +
        '  • coder [cd] — Implement approved changes.\n' +
        '  • reviewer [rv] — Run context-isolated review.\n' +
        '  • critic reviewer [cr] — Human-only stateless peer review from durable evidence.\n' +
        '  • tester [ts] — Verify behavior and evidence.\n\n' +
        'SETTING — Manage GSA configuration.\n' +
        '  • GSA Account [acct] — ' + accountSummary + '\n' +
        '  • Memory Repo [repo] — ' + memoryRepoSummary + '\n\n' +
        'HELP — Usage reference.\n' +
        '  • instruction [guide] — Show GSA usage instructions.\n' +
        '  • command help [help] — Show commands and aliases.'

      return { structuredContent: { menu_text: menuText }, content: [{ type: 'text', text: menuText }] }
    },
  )

  server.registerTool(
    'get_runtime_status',
    {
      title: 'Get GSA runtime status',
      description: 'Verify authenticated GSA runtime and Memory Repo configuration state.',
      inputSchema: {},
      outputSchema: { phase: z.string(), mcp: z.string(), auth: z.string(), memory_repo: z.string(), source_build_id: z.string(), execution_contract_default: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to use GPT Super Agent.')
      const { data } = await readMemoryConfig(auth)
      const status = {
        phase: 'M2_AUTONOMOUS_SAME_TURN_ORCHESTRATION',
        mcp: 'SERVER_DEPLOYED',
        auth: 'AUTHENTICATED',
        memory_repo: data?.memory_repo_full_name ? 'CONFIGURED' : 'NOT_CONFIGURED',
        source_build_id: GSA_SOURCE_BUILD_ID,
        execution_contract_default: DEFAULT_EXECUTION_CONTRACT,
      }
      return { structuredContent: status, content: [{ type: 'text', text: JSON.stringify(status) }] }
    },
  )

  server.registerTool(
    'browser_ui_inspect',
    {
      title: 'Inspect rendered UI in browser',
      description: 'Internal GPT capability for Designer/UI inspection. Open a public runnable web UI in Vercel Sandbox with agent-browser and return accessibility snapshot, annotated screenshots, console output and page errors. Not a user-facing command.',
      inputSchema: {
        url: z.string().url(),
        viewports: z.array(z.object({
          width: z.number().int().min(320).max(1920),
          height: z.number().int().min(480).max(1440),
          label: z.string().max(40).optional(),
        })).max(3).optional(),
        evidence: z.object({
          persist: z.boolean(),
          label: z.string().min(1).max(80).optional(),
          expires_in: z.number().int().min(60).max(604800).optional(),
          bundle: z.object({
            project_id: z.string().min(1).max(240),
            repository: z.string().min(1).max(500),
            job_id: z.string().min(1).max(240),
            checkpoint_id: z.string().min(1).max(240),
            attempt_id: z.string().min(1).max(240),
            run_id: z.string().min(1).max(240),
            target_ref: z.string().max(500).optional(),
            target_revision: z.string().regex(/^[0-9a-f]{40}$/),
            privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']).optional(),
            result: z.string().max(80).optional(),
            limitations: z.array(z.string().max(500)).max(20).optional(),
          }).optional(),
        }).optional(),
      },
      outputSchema: {
        observed: z.boolean(),
        title: z.string(),
        url: z.string(),
        snapshot: z.string(),
        console: z.string(),
        page_errors: z.string(),
        screenshot_count: z.number().int(),
        evidence: z.array(z.object({
          artifact_id: z.string().optional(),
          label: z.string(),
          storage_path: z.string(),
          signed_url: z.string().url(),
          expires_at: z.string(),
          mime_type: z.string(),
          size_bytes: z.number().int().nonnegative().optional(),
          sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })).optional(),
        evidence_bundle: z.object({
          evidence_bundle_id: z.string().regex(/^[0-9a-f]{64}$/),
          backend: z.literal('PRIVATE_SUPABASE'),
          privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']),
          binding: z.object({
            project_id: z.string().min(1),
            repository: z.string().min(1),
            job_id: z.string().min(1),
            checkpoint_id: z.string().min(1),
            attempt_id: z.string().min(1),
            run_id: z.string().min(1),
            target_ref: z.string().nullable(),
            target_revision: z.string().min(1),
          }),
          manifest_path: z.string(),
          manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/),
          viewer_url: z.string().url(),
          target_revision: z.string(),
          artifact_count: z.number().int().positive().max(12),
          size_bytes: z.number().int().positive().max(50 * 1024 * 1024),
          immutable: z.literal(true),
          manifest_readback_verified: z.literal(true),
        }).optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ url, viewports, evidence }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to inspect UI.')
      try {
        const data = await callBrowserBridge(req, { mode: 'ui_inspect', url, viewports, ...(evidence ? { evidence } : {}) })
        const screenshots = Array.isArray(data.screenshots) ? data.screenshots : []
        const summary = {
          observed: true,
          title: String(data.title ?? ''),
          url: String(data.url ?? url),
          snapshot: String(data.snapshot ?? ''),
          console: String(data.console ?? ''),
          page_errors: String(data.page_errors ?? ''),
          screenshot_count: screenshots.length,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
          evidence_bundle: data.evidence_bundle ?? undefined,
        }
        const content: any[] = [{ type: 'text', text: JSON.stringify(summary) }]
        for (const shot of screenshots) {
          if (shot?.data) {
            content.push({
              type: 'image',
              data: String(shot.data),
              mimeType: String(shot.mimeType ?? 'image/png'),
            })
          }
        }
        return { structuredContent: summary, content }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          structuredContent: {
            observed: false,
            title: '',
            url,
            snapshot: '',
            console: '',
            page_errors: message,
            screenshot_count: 0,
            evidence: [],
          },
          content: [{ type: 'text', text: 'Browser UI inspection unavailable: ' + message }],
          isError: true,
        }
      }
    },
  )

  server.registerTool(
    'browser_test_flow',
    {
      title: 'Run basic browser test flow',
      description: 'Internal GPT capability for Tester. Execute one bounded non-destructive web-app flow in a Vercel Sandbox using semantic locators/CSS, then return step evidence, final snapshot, console/page errors and an annotated screenshot. Not a user-facing command.',
      inputSchema: {
        url: z.string().url(),
        viewport: z.object({
          width: z.number().int().min(320).max(1920),
          height: z.number().int().min(480).max(1440),
          label: z.string().max(40).optional(),
        }).optional(),
        stop_on_failure: z.boolean().optional(),
        evidence: z.object({
          persist: z.boolean(),
          label: z.string().min(1).max(80).optional(),
          expires_in: z.number().int().min(60).max(604800).optional(),
          bundle: z.object({
            project_id: z.string().min(1).max(240),
            repository: z.string().min(1).max(500),
            job_id: z.string().min(1).max(240),
            checkpoint_id: z.string().min(1).max(240),
            attempt_id: z.string().min(1).max(240),
            run_id: z.string().min(1).max(240),
            target_ref: z.string().max(500).optional(),
            target_revision: z.string().regex(/^[0-9a-f]{40}$/),
            privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']).optional(),
            result: z.string().max(80).optional(),
            limitations: z.array(z.string().max(500)).max(20).optional(),
          }).optional(),
        }).optional(),
        steps: z.array(z.object({
          action: z.enum(['click', 'fill', 'check', 'hover', 'select', 'press', 'wait_text', 'assert_text']),
          by: z.enum(['css', 'text', 'label', 'placeholder', 'testid', 'role']).optional(),
          target: z.string().max(500).optional(),
          name: z.string().max(300).optional(),
          value: z.string().max(4000).optional(),
        })).max(20),
      },
      outputSchema: {
        observed: z.boolean(),
        passed: z.boolean(),
        url: z.string(),
        initial_snapshot: z.string(),
        final_snapshot: z.string(),
        console: z.string(),
        page_errors: z.string(),
        steps: z.array(z.any()),
        screenshot_count: z.number().int(),
        evidence: z.array(z.object({
          artifact_id: z.string().optional(),
          label: z.string(),
          storage_path: z.string(),
          signed_url: z.string().url(),
          expires_at: z.string(),
          mime_type: z.string(),
          size_bytes: z.number().int().nonnegative().optional(),
          sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })).optional(),
        evidence_bundle: z.object({
          evidence_bundle_id: z.string().regex(/^[0-9a-f]{64}$/),
          backend: z.literal('PRIVATE_SUPABASE'),
          privacy_class: z.enum(['PRIVATE_REQUIRED','REPO_SAFE']),
          binding: z.object({
            project_id: z.string().min(1),
            repository: z.string().min(1),
            job_id: z.string().min(1),
            checkpoint_id: z.string().min(1),
            attempt_id: z.string().min(1),
            run_id: z.string().min(1),
            target_ref: z.string().nullable(),
            target_revision: z.string().min(1),
          }),
          manifest_path: z.string(),
          manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/),
          viewer_url: z.string().url(),
          target_revision: z.string(),
          artifact_count: z.number().int().positive().max(12),
          size_bytes: z.number().int().positive().max(50 * 1024 * 1024),
          immutable: z.literal(true),
          manifest_readback_verified: z.literal(true),
        }).optional(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ url, viewport, stop_on_failure, evidence, steps }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to run browser testing.')
      try {
        const data = await callBrowserBridge(req, {
          mode: 'test_flow',
          url,
          viewport,
          stop_on_failure,
          steps,
          ...(evidence ? { evidence } : {}),
        })
        const summary = {
          observed: true,
          passed: Boolean(data.passed),
          url: String(data.url ?? url),
          initial_snapshot: String(data.initial_snapshot ?? ''),
          final_snapshot: String(data.final_snapshot ?? ''),
          console: String(data.console ?? ''),
          page_errors: String(data.page_errors ?? ''),
          steps: Array.isArray(data.steps) ? data.steps : [],
          screenshot_count: data.screenshot?.data ? 1 : 0,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
          evidence_bundle: data.evidence_bundle ?? undefined,
        }
        const content: any[] = [{ type: 'text', text: JSON.stringify(summary) }]
        if (data.screenshot?.data) {
          content.push({
            type: 'image',
            data: String(data.screenshot.data),
            mimeType: String(data.screenshot.mimeType ?? 'image/png'),
          })
        }
        return { structuredContent: summary, content }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          structuredContent: {
            observed: false,
            passed: false,
            url,
            initial_snapshot: '',
            final_snapshot: '',
            console: '',
            page_errors: message,
            steps: [],
            screenshot_count: 0,
            evidence: [],
          },
          content: [{ type: 'text', text: 'Browser functional testing unavailable: ' + message }],
          isError: true,
        }
      }
    },
  )


  server.registerTool(
    'evidence_private_bundle_verification_prepare',
    {
      title: 'Prepare durable private evidence publication proof',
      description: 'Read back one authenticated private EvidenceBundle manifest, verify exact binding/hash identity, and prepare an append-only EVIDENCE_BUNDLE Verification proof for later TEST/RETEST or Tester Handoff consumption.',
      inputSchema: {
        job_record_text: z.string().min(2),
        tester_run_record_text: z.string().min(2),
        bundle_ref: z.any(),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        bundle_ref: z.any(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ job_record_text, tester_run_record_text, bundle_ref }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to verify private evidence.')
      let job: any, testerRun: any
      try {
        job = JSON.parse(job_record_text)
        testerRun = JSON.parse(tester_run_record_text)
      } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_PRIVATE_PROOF_REJECTED: invalid Job/Tester Run JSON.' }], isError: true }
      }
      if (jobExecutionContract(job) !== 'NEXT' || job.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'EVIDENCE_PRIVATE_PROOF_REJECTED: owning Job must be current NEXT IN_PROGRESS.' }], isError: true }
      }
      if (
        resolveExecutionContract(testerRun.execution_contract) !== 'NEXT' ||
        testerRun.project_id !== job.project_id ||
        testerRun.job_id !== job.job_id ||
        testerRun.role !== 'tester' ||
        testerRun.lifecycle !== 'IN_PROGRESS' ||
        testerRun.run_id !== bundle_ref?.binding?.run_id
      ) {
        return { content: [{ type: 'text', text: 'EVIDENCE_PRIVATE_PROOF_REJECTED: bundle must belong to the current IN_PROGRESS NEXT Tester Run.' }], isError: true }
      }
      const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')?.full_name ?? null
      if (!workingRepo) return { content: [{ type: 'text', text: 'EVIDENCE_PRIVATE_PROOF_REJECTED: current Job working repository is unavailable.' }], isError: true }
      const binding = bundle_ref?.binding
      const bundleError = evidenceBundleRefValidationError(bundle_ref, {
        project_id: job.project_id,
        job_id: job.job_id,
        checkpoint_id: binding?.checkpoint_id ?? null,
        attempt_id: binding?.attempt_id ?? null,
        run_id: testerRun.run_id,
        target_ref: binding?.target_ref ?? null,
        target_revision: String(binding?.target_revision || ''),
        repository_full_name: workingRepo,
      })
      if (bundleError || bundle_ref?.backend !== 'PRIVATE_SUPABASE') {
        return { content: [{ type: 'text', text: 'EVIDENCE_PRIVATE_PROOF_REJECTED: ' + (bundleError || 'backend is not PRIVATE_SUPABASE.') }], isError: true }
      }

      let readback: any
      try {
        readback = await callPrivateEvidenceReadback(req, bundle_ref.evidence_bundle_id)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return { content: [{ type: 'text', text: 'EVIDENCE_PRIVATE_PROOF_REJECTED: ' + message }], isError: true }
      }
      const manifest = readback?.manifest
      const manifestBinding = manifest?.binding
      const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '')
      const bindingMatches =
        manifestBinding &&
        same(manifestBinding.project_id, binding.project_id) &&
        String(manifestBinding.repository || '').toLowerCase() === String(binding.repository || '').toLowerCase() &&
        same(manifestBinding.job_id, binding.job_id) &&
        same(manifestBinding.checkpoint_id, binding.checkpoint_id) &&
        same(manifestBinding.attempt_id, binding.attempt_id) &&
        same(manifestBinding.run_id, binding.run_id) &&
        same(manifestBinding.target_ref, binding.target_ref) &&
        same(manifestBinding.target_revision, binding.target_revision)
      const artifacts = Array.isArray(manifest?.artifacts) ? manifest.artifacts : []
      const valid =
        readback?.ok === true &&
        readback?.evidence_bundle_id === bundle_ref.evidence_bundle_id &&
        readback?.manifest_sha256 === bundle_ref.manifest_sha256 &&
        manifest?.schema_version === 1 &&
        manifest?.backend === 'PRIVATE_SUPABASE' &&
        manifest?.privacy_class === bundle_ref.privacy_class &&
        manifest?.evidence_bundle_id === bundle_ref.evidence_bundle_id &&
        manifest?.manifest_path === bundle_ref.manifest_path &&
        bindingMatches &&
        artifacts.length === bundle_ref.artifact_count &&
        artifacts.every((item: any) =>
          typeof item?.storage_path === 'string' &&
          item.storage_path.includes('/bundles/' + bundle_ref.evidence_bundle_id + '/') &&
          /^[0-9a-f]{64}$/.test(String(item?.sha256 || '')) &&
          Number.isInteger(Number(item?.size_bytes)) &&
          Number(item.size_bytes) > 0
        )
      if (!valid) {
        return { content: [{ type: 'text', text: 'EVIDENCE_PRIVATE_PROOF_REJECTED: authenticated manifest read-back does not match the supplied bundle identity.' }], isError: true }
      }

      const verificationId = uuidv7()
      const memoryPath = verificationPath(job.project_id, verificationId, 'NEXT')
      const verification = {
        verification_id: verificationId,
        kind: 'EVIDENCE_BUNDLE',
        project_id: job.project_id,
        job_id: job.job_id,
        execution_contract: 'NEXT',
        producer: 'tester',
        result: 'PERSISTED',
        backend: 'PRIVATE_SUPABASE',
        bundle_ref,
        readback: {
          authenticated: true,
          evidence_bundle_id: bundle_ref.evidence_bundle_id,
          manifest_sha256: bundle_ref.manifest_sha256,
          binding_verified: true,
          artifact_count: artifacts.length,
        },
        created_at: new Date().toISOString(),
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: memoryPath,
        verification_record_text: prettyJson(verification),
        bundle_ref,
        external_steps: [
          'Authorize/create verification_memory_path and persist verification_record_text append-only.',
          'Read back the persisted proof and pass its exact {path, sha, record_text} snapshot to checkpoint_verification_prepare or Tester run_complete Handoff.',
          'Never pass raw private bundle_ref as authority for TEST/RETEST PASS.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  function validateRepositoryProbeSnapshot(
    snapshot: any,
    expected: {
      project_id: string
      job_id: string
      execution_contract: ExecutionContract
      repository_full_name: string
      target_ref: string
      target_revision: string
      evidence_ref: string
    },
  ) {
    if (!snapshot) return { error: 'EVIDENCE_REPO_DENY: PUBLISH requires a durable successful probe Verification snapshot.' }
    const parsed = parseDurableSnapshots([snapshot], 'binary_probe_verification_snapshot')
    if (parsed.error || parsed.entries.length !== 1) {
      return { error: 'EVIDENCE_REPO_DENY: invalid binary probe Verification snapshot.' }
    }
    const entry = parsed.entries[0]
    const record = entry.record
    const expectedPath =
      typeof record?.verification_id === 'string'
        ? verificationPath(expected.project_id, record.verification_id, expected.execution_contract)
        : ''
    const repoMatches =
      String(record?.repository_full_name || '').toLowerCase() === expected.repository_full_name.toLowerCase()
    const valid =
      expectedPath === entry.path &&
      record?.kind === 'CAPABILITY_PROBE' &&
      record?.project_id === expected.project_id &&
      record?.job_id === expected.job_id &&
      resolveExecutionContract(record?.execution_contract) === expected.execution_contract &&
      record?.producer === 'tester' &&
      record?.probe_id === 'PROBE-GIT-EVIDENCE-01' &&
      record?.capability === 'REPOSITORY_BINARY_EVIDENCE' &&
      record?.result === 'OBSERVED' &&
      repoMatches &&
      record?.target_ref === expected.target_ref &&
      record?.target_revision === expected.target_revision &&
      record?.evidence_ref === expected.evidence_ref &&
      record?.source_revision_unchanged === true &&
      record?.append_only_verified === true &&
      record?.manifest_readback_verified === true &&
      record?.artifact_readback_verified === true &&
      record?.automation_side_effects_observed === false &&
      record?.usable_as_product_evidence === false &&
      /^[0-9a-f]{40}$/.test(String(record?.evidence_commit_sha || ''))
    if (!valid) {
      return { error: 'EVIDENCE_REPO_DENY: probe Verification is not an exact successful PROBE-GIT-EVIDENCE-01 observation for this publication target.' }
    }
    return { error: null, ref: entry.path, sha: entry.sha, record }
  }


  server.registerTool(
    'evidence_repository_publish_prepare',
    {
      title: 'Prepare bounded repository evidence publication',
      description: 'Authorize one bounded repository evidence PROBE or REPO_SAFE PUBLISH attempt against the active Project OWNED working repo. Returns a fail-closed Git publication contract; it does not mutate Git itself.',
      inputSchema: {
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().min(7),
        job_record_text: z.string().min(2),
        repository_full_name: z.string().min(3),
        job_id: z.string().uuid(),
        checkpoint_id: z.string().min(1).max(240),
        attempt_id: z.string().min(1).max(240),
        run_id: z.string().uuid(),
        target_ref: z.string().min(1).max(500),
        target_revision: z.string().regex(/^[0-9a-f]{40}$/),
        privacy_class: z.literal('REPO_SAFE'),
        evidence_ref: z.string().min(1).max(240),
        expected_evidence_ref_head: z.string().regex(/^[0-9a-f]{40}$/).nullable(),
        automation_isolation_verified: z.literal(true),
        automation_evidence_refs: z.array(z.string().min(1)).min(1),
        publication_mode: z.enum(['PROBE','PUBLISH']).default('PUBLISH'),
        probe_id: z.literal('PROBE-GIT-EVIDENCE-01').optional(),
        binary_probe_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        artifacts: z.array(z.object({
          label: z.string().min(1).max(100),
          mime_type: z.literal('image/png'),
          size_bytes: z.number().int().positive().max(5 * 1024 * 1024),
          sha256: z.string().regex(/^[0-9a-f]{64}$/),
        })).min(1).max(12),
      },
      outputSchema: {
        allowed: z.boolean(),
        reason: z.string(),
        publication_mode: z.enum(['PROBE','PUBLISH']),
        probe_id: z.string().nullable(),
        evidence_ref: z.string(),
        evidence_prefix: z.string(),
        expected_parent_sha: z.string(),
        force_allowed: z.literal(false),
        max_bundle_bytes: z.number().int(),
        manifest: z.any(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({
      project_manifest_text, project_manifest_sha, job_record_text, repository_full_name,
      job_id, checkpoint_id, attempt_id, run_id, target_ref, target_revision,
      evidence_ref, expected_evidence_ref_head, automation_evidence_refs,
      publication_mode, probe_id, binary_probe_verification_snapshot, artifacts,
    }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to authorize repository evidence publication.')
      const project = parseProjectManifest(project_manifest_text)
      if (!project || project.lifecycle !== 'ACTIVE') {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: Project must be ACTIVE.' }], isError: true }
      }
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(job)
      if (!executionContract) return invalidExecutionContract()
      if (job.project_id !== project.project_id || job.job_id !== job_id || job.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: Job identity/lifecycle mismatch.' }], isError: true }
      }
      const requested = normalizeGithubRepo('https://github.com/' + repository_full_name.replace(/^https?:\/\/github\.com\//i, ''))
      if (!requested) return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: invalid repository.' }], isError: true }
      const owned = project.repositories.find((item: any) => item.relation === 'OWNED' && normalizeGithubRepo(item.url)?.full_name.toLowerCase() === requested.full_name.toLowerCase())
      const working = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')
      if (!owned || !working || working.full_name.toLowerCase() !== requested.full_name.toLowerCase()) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: repository is not the active Project OWNED working repository.' }], isError: true }
      }
      if (!project_manifest_sha || target_ref === evidence_ref) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: evidence ref must be separate from the tested source ref.' }], isError: true }
      }
      const requiredRef = 'gsa-evidence/' + project.project_id
      if (evidence_ref !== requiredRef) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: evidence ref must equal ' + requiredRef }], isError: true }
      }

      const mode = publication_mode === 'PROBE' ? 'PROBE' : 'PUBLISH'
      let probeVerification: any = null
      if (mode === 'PROBE') {
        if (probe_id !== 'PROBE-GIT-EVIDENCE-01') {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: PROBE mode requires PROBE-GIT-EVIDENCE-01.' }], isError: true }
        }
        if (binary_probe_verification_snapshot) {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: PROBE establishes capability and must not consume a prior probe Verification.' }], isError: true }
        }
        if (
          artifacts.length !== 1 ||
          Number(artifacts[0]?.size_bytes || 0) > 64 * 1024 ||
          !String(artifacts[0]?.label || '').toLowerCase().startsWith('probe-git-evidence-01')
        ) {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: PROBE requires one synthetic probe-git-evidence-01 artifact <= 64 KiB.' }], isError: true }
        }
      } else {
        const validatedProbe = validateRepositoryProbeSnapshot(binary_probe_verification_snapshot, {
          project_id: project.project_id,
          job_id,
          execution_contract: executionContract,
          repository_full_name: requested.full_name,
          target_ref,
          target_revision,
          evidence_ref: requiredRef,
        })
        if (validatedProbe.error) {
          return { content: [{ type: 'text', text: validatedProbe.error }], isError: true }
        }
        probeVerification = validatedProbe
      }

      const totalBytes = artifacts.reduce((sum: number, item: any) => sum + Number(item.size_bytes || 0), 0)
      const maxBundleBytes = 25 * 1024 * 1024
      if (totalBytes > maxBundleBytes) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: repository evidence bundle exceeds 25 MiB.' }], isError: true }
      }
      const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
      const prefix = ['tests/gsa', project.project_id, clean(job_id), clean(checkpoint_id), clean(attempt_id)].join('/')
      if (!prefix || prefix.includes('..')) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_DENY: invalid evidence prefix.' }], isError: true }
      }
      const expectedParent = expected_evidence_ref_head || target_revision
      const manifest = {
        schema_version: 1,
        backend: 'REPOSITORY_GIT',
        privacy_class: 'REPO_SAFE',
        publication_mode: mode,
        probe_id: mode === 'PROBE' ? 'PROBE-GIT-EVIDENCE-01' : null,
        binding: {
          project_id: project.project_id,
          repository: requested.full_name,
          job_id,
          checkpoint_id,
          attempt_id,
          run_id,
          target_ref,
          target_revision,
        },
        evidence_ref,
        expected_parent_sha: expectedParent,
        force_allowed: false,
        automation_isolation: {
          verified: true,
          evidence_refs: automation_evidence_refs,
        },
        binary_capability: {
          observed: mode === 'PUBLISH',
          verification_ref: mode === 'PUBLISH' ? probeVerification.ref : null,
          verification_sha: mode === 'PUBLISH' ? probeVerification.sha : null,
        },
        artifacts,
      }
      const result = {
        allowed: true,
        reason: mode === 'PROBE'
          ? 'Bounded synthetic repository evidence capability probe authorized.'
          : 'Bounded REPO_SAFE evidence publication authorized by exact durable probe Verification.',
        publication_mode: mode,
        probe_id: mode === 'PROBE' ? 'PROBE-GIT-EVIDENCE-01' : null,
        evidence_ref,
        evidence_prefix: prefix,
        expected_parent_sha: expectedParent,
        force_allowed: false as const,
        max_bundle_bytes: maxBundleBytes,
        manifest,
        external_steps: [
          'Re-fetch Project, Job, tested source ref and evidence ref immediately before mutation; deny on lifecycle/scope/revision drift.',
          'Require tested source ref still resolves to target_revision exactly.',
          'If evidence ref exists, require its live head equals expected_evidence_ref_head and create the new evidence commit with that exact head as parent.',
          'If evidence ref does not exist, require expected_evidence_ref_head=null and bootstrap the first evidence commit with target_revision as parent.',
          'Create only artifact blobs plus manifest.json below evidence_prefix. Do not modify any path outside that prefix.',
          'Create the evidence commit with parent == expected_parent_sha exactly.',
          'Move only evidence_ref using a non-force/fast-forward ref update. force=true and non-fast-forward updates are forbidden.',
          'Read back evidence_ref and immutable commit/blob contents; verify hashes and source ref immutability.',
          'Verify no CI, preview deploy, release or source workflow was triggered by the evidence ref update. If isolation is not proven, treat repository routing as unavailable and use PRIVATE_REQUIRED/private backend.',
          mode === 'PROBE'
            ? 'Finalize this PROBE, then create/persist its CAPABILITY_PROBE Verification before any PUBLISH attempt.'
            : 'Immediately re-read the binary probe Verification snapshot before mutation; its path/SHA/record must still be the exact snapshot authorized above.',
          'Call evidence_repository_publish_finalize with observed read-back values before referencing repository evidence from Verification/Handoff.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'evidence_repository_publish_finalize',
    {
      title: 'Finalize repository evidence publication',
      description: 'Validate immutable read-back for one prepared repository evidence PROBE or PUBLISH attempt. Fails closed on source drift, ref mismatch, non-append ancestry, probe-evidence mismatch or automation side effects.',
      inputSchema: {
        publication_mode: z.enum(['PROBE','PUBLISH']).default('PUBLISH'),
        probe_id: z.literal('PROBE-GIT-EVIDENCE-01').optional(),
        binary_probe_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        tester_run_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1).max(240),
        attempt_id: z.string().min(1).max(240),
        run_id: z.string().uuid(),
        repository_full_name: z.string().min(3),
        target_ref: z.string().min(1),
        target_revision: z.string().regex(/^[0-9a-f]{40}$/),
        source_ref_readback_revision: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_ref: z.string().min(1),
        expected_parent_sha: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_commit_sha: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_commit_parent_sha: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_ref_readback_head: z.string().regex(/^[0-9a-f]{40}$/),
        evidence_prefix: z.string().min(1),
        manifest_path: z.string().min(1),
        manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/),
        human_openable_url: z.string().url(),
        artifact_count: z.number().int().min(1).max(12),
        size_bytes: z.number().int().positive().max(25 * 1024 * 1024),
        manifest_readback_verified: z.literal(true),
        artifact_readback_verified: z.literal(true),
        automation_side_effects_observed: z.literal(false),
      },
      outputSchema: {
        valid: z.boolean(),
        backend: z.literal('REPOSITORY_GIT'),
        publication_mode: z.enum(['PROBE','PUBLISH']),
        evidence_bundle_ref: z.any().nullable(),
        probe_observation: z.any().nullable(),
        evidence_publication_verification_id: z.string().nullable(),
        evidence_publication_verification_memory_path: z.string().nullable(),
        evidence_publication_verification_record_text: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async (args: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to finalize repository evidence publication.')
      let job: any, testerRun: any
      try {
        job = JSON.parse(args.job_record_text)
        testerRun = JSON.parse(args.tester_run_record_text)
      } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: invalid Job/Tester Run JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(job)
      if (!executionContract) return invalidExecutionContract()
      if (job.project_id !== args.project_id || job.job_id !== args.job_id || job.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: Job identity/lifecycle mismatch.' }], isError: true }
      }
      if (
        resolveExecutionContract(testerRun.execution_contract) !== 'NEXT' ||
        testerRun.project_id !== args.project_id ||
        testerRun.job_id !== args.job_id ||
        testerRun.run_id !== args.run_id ||
        testerRun.role !== 'tester' ||
        testerRun.lifecycle !== 'IN_PROGRESS' ||
        testerRun.target_revision !== args.target_revision
      ) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: publication must belong to the current target-bound NEXT Tester Run.' }], isError: true }
      }
      const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')
      const requestedRepo = normalizeGithubRepo('https://github.com/' + String(args.repository_full_name || '').replace(/^https?:\/\/github\.com\//i, ''))
      if (!workingRepo || !requestedRepo || workingRepo.full_name.toLowerCase() !== requestedRepo.full_name.toLowerCase()) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: repository does not match the current Job working repository.' }], isError: true }
      }

      const requiredRef = 'gsa-evidence/' + args.project_id
      const mode = args.publication_mode === 'PROBE' ? 'PROBE' : 'PUBLISH'
      let probeVerification: any = null
      if (mode === 'PROBE') {
        if (args.probe_id !== 'PROBE-GIT-EVIDENCE-01') {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: PROBE mode requires PROBE-GIT-EVIDENCE-01.' }], isError: true }
        }
        if (args.binary_probe_verification_snapshot) {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: PROBE must not consume a prior probe Verification.' }], isError: true }
        }
        if (args.artifact_count !== 1 || args.size_bytes > 64 * 1024) {
          return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: PROBE evidence must remain one bounded fixture <= 64 KiB.' }], isError: true }
        }
      } else {
        const validatedProbe = validateRepositoryProbeSnapshot(args.binary_probe_verification_snapshot, {
          project_id: args.project_id,
          job_id: args.job_id,
          execution_contract: executionContract,
          repository_full_name: args.repository_full_name,
          target_ref: args.target_ref,
          target_revision: args.target_revision,
          evidence_ref: requiredRef,
        })
        if (validatedProbe.error) {
          return { content: [{ type: 'text', text: validatedProbe.error.replace('EVIDENCE_REPO_DENY:', 'EVIDENCE_REPO_INVALID:') }], isError: true }
        }
        probeVerification = validatedProbe
      }

      if (args.source_ref_readback_revision !== args.target_revision) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: tested source revision moved.' }], isError: true }
      }
      if (args.evidence_commit_parent_sha !== args.expected_parent_sha) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: evidence commit is not append-only from expected parent.' }], isError: true }
      }
      if (args.evidence_ref_readback_head !== args.evidence_commit_sha) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: evidence ref read-back does not match evidence commit.' }], isError: true }
      }
      if (args.evidence_ref !== requiredRef) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: unexpected evidence ref.' }], isError: true }
      }
      const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
      const expectedPrefix = ['tests/gsa', args.project_id, clean(args.job_id), clean(args.checkpoint_id), clean(args.attempt_id)].join('/')
      if (String(args.evidence_prefix) !== expectedPrefix || !String(args.manifest_path).startsWith(expectedPrefix + '/')) {
        return { content: [{ type: 'text', text: 'EVIDENCE_REPO_INVALID: evidence prefix/manifest path does not match project/job/checkpoint/attempt identity.' }], isError: true }
      }

      const bundleRef = {
        backend: 'REPOSITORY_GIT',
        publication_mode: mode,
        privacy_class: 'REPO_SAFE',
        binding: {
          project_id: args.project_id,
          repository: requestedRepo.full_name,
          job_id: args.job_id,
          checkpoint_id: args.checkpoint_id,
          attempt_id: args.attempt_id,
          run_id: args.run_id,
          target_ref: args.target_ref,
          target_revision: args.target_revision,
        },
        repository: requestedRepo.full_name,
        target_ref: args.target_ref,
        target_revision: args.target_revision,
        evidence_ref: args.evidence_ref,
        evidence_commit_sha: args.evidence_commit_sha,
        manifest_path: args.manifest_path,
        manifest_sha256: args.manifest_sha256,
        human_openable_url: args.human_openable_url,
        artifact_count: args.artifact_count,
        size_bytes: args.size_bytes,
        immutable: true,
        append_only_parent_sha: args.expected_parent_sha,
        manifest_readback_verified: true,
        artifact_readback_verified: true,
        automation_side_effects_observed: false,
        binary_probe_verification_ref: mode === 'PUBLISH' ? probeVerification.ref : null,
        binary_probe_verification_sha: mode === 'PUBLISH' ? probeVerification.sha : null,
      }
      const probeObservation = mode === 'PROBE' ? {
        project_id: args.project_id,
        job_id: args.job_id,
        execution_contract: executionContract,
        probe_id: 'PROBE-GIT-EVIDENCE-01',
        capability: 'REPOSITORY_BINARY_EVIDENCE',
        observed: true,
        repository_full_name: args.repository_full_name,
        target_ref: args.target_ref,
        target_revision: args.target_revision,
        evidence_ref: args.evidence_ref,
        evidence_commit_sha: args.evidence_commit_sha,
        append_only_parent_sha: args.expected_parent_sha,
        manifest_path: args.manifest_path,
        manifest_sha256: args.manifest_sha256,
        human_openable_url: args.human_openable_url,
        source_revision_unchanged: true,
        append_only_verified: true,
        manifest_readback_verified: true,
        artifact_readback_verified: true,
        automation_side_effects_observed: false,
        usable_as_product_evidence: false,
      } : null
      const publicationVerificationId = mode === 'PUBLISH' ? uuidv7() : null
      const publicationVerificationPath = publicationVerificationId
        ? verificationPath(args.project_id, publicationVerificationId, 'NEXT')
        : null
      const publicationVerification = mode === 'PUBLISH' ? {
        verification_id: publicationVerificationId,
        kind: 'EVIDENCE_BUNDLE',
        project_id: args.project_id,
        job_id: args.job_id,
        execution_contract: 'NEXT',
        producer: 'tester',
        result: 'PERSISTED',
        backend: 'REPOSITORY_GIT',
        bundle_ref: bundleRef,
        readback: {
          evidence_commit_sha: args.evidence_commit_sha,
          manifest_sha256: args.manifest_sha256,
          source_revision_unchanged: true,
          append_only_verified: true,
          manifest_readback_verified: true,
          artifact_readback_verified: true,
          automation_side_effects_observed: false,
        },
        created_at: new Date().toISOString(),
      } : null
      const result = {
        valid: true,
        backend: 'REPOSITORY_GIT' as const,
        publication_mode: mode,
        evidence_bundle_ref: mode === 'PUBLISH' ? bundleRef : null,
        probe_observation: probeObservation,
        evidence_publication_verification_id: publicationVerificationId,
        evidence_publication_verification_memory_path: publicationVerificationPath,
        evidence_publication_verification_record_text: publicationVerification ? prettyJson(publicationVerification) : null,
        external_steps: mode === 'PUBLISH' ? [
          'Authorize/create evidence_publication_verification_memory_path and persist evidence_publication_verification_record_text append-only.',
          'Read back that proof and pass its exact {path, sha, record_text} snapshot to checkpoint_verification_prepare or Tester run_complete Handoff.',
          'Raw evidence_bundle_ref is presentation metadata only and cannot authorize TEST/RETEST PASS.',
        ] : [
          'Use evidence_repository_probe_verification_prepare to persist the capability probe observation before repository PUBLISH is considered available.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'evidence_repository_probe_verification_prepare',
    {
      title: 'Prepare durable repository evidence capability probe Verification',
      description: 'Convert one successfully finalized PROBE-GIT-EVIDENCE-01 observation into an append-only CAPABILITY_PROBE Verification record. Persist and read back this exact record before any repository PUBLISH attempt.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        repository_full_name: z.string().min(3),
        target_ref: z.string().min(1),
        target_revision: z.string().regex(/^[0-9a-f]{40}$/),
        probe_finalize_result_text: z.string().min(2),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, job_id, job_record_text, repository_full_name, target_ref, target_revision, probe_finalize_result_text }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare repository probe Verification.')
      let job: any, finalized: any
      try {
        job = JSON.parse(job_record_text)
        finalized = JSON.parse(probe_finalize_result_text)
      } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_PROBE_VERIFICATION_REJECTED: invalid Job/finalize JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(job)
      if (!executionContract) return invalidExecutionContract()
      if (job.project_id !== project_id || job.job_id !== job_id || job.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'EVIDENCE_PROBE_VERIFICATION_REJECTED: Job identity/lifecycle mismatch.' }], isError: true }
      }
      const observation = finalized?.probe_observation
      const repoMatches = String(observation?.repository_full_name || '').toLowerCase() === String(repository_full_name).toLowerCase()
      const valid =
        finalized?.valid === true &&
        finalized?.backend === 'REPOSITORY_GIT' &&
        finalized?.publication_mode === 'PROBE' &&
        finalized?.evidence_bundle_ref == null &&
        observation?.project_id === project_id &&
        observation?.job_id === job_id &&
        resolveExecutionContract(observation?.execution_contract) === executionContract &&
        observation?.probe_id === 'PROBE-GIT-EVIDENCE-01' &&
        observation?.capability === 'REPOSITORY_BINARY_EVIDENCE' &&
        observation?.observed === true &&
        repoMatches &&
        observation?.target_ref === target_ref &&
        observation?.target_revision === target_revision &&
        observation?.evidence_ref === 'gsa-evidence/' + project_id &&
        observation?.source_revision_unchanged === true &&
        observation?.append_only_verified === true &&
        observation?.manifest_readback_verified === true &&
        observation?.artifact_readback_verified === true &&
        observation?.automation_side_effects_observed === false &&
        observation?.usable_as_product_evidence === false &&
        /^[0-9a-f]{40}$/.test(String(observation?.evidence_commit_sha || ''))
      if (!valid) {
        return { content: [{ type: 'text', text: 'EVIDENCE_PROBE_VERIFICATION_REJECTED: finalized result is not an exact successful bounded repository evidence probe observation.' }], isError: true }
      }

      const verificationId = uuidv7()
      const memoryPath = verificationPath(project_id, verificationId, executionContract)
      const verification = {
        verification_id: verificationId,
        kind: 'CAPABILITY_PROBE',
        project_id,
        job_id,
        execution_contract: executionContract,
        producer: 'tester',
        probe_id: 'PROBE-GIT-EVIDENCE-01',
        capability: 'REPOSITORY_BINARY_EVIDENCE',
        result: 'OBSERVED',
        repository_full_name,
        target_ref,
        target_revision,
        evidence_ref: observation.evidence_ref,
        evidence_commit_sha: observation.evidence_commit_sha,
        append_only_parent_sha: observation.append_only_parent_sha,
        manifest_path: observation.manifest_path,
        manifest_sha256: observation.manifest_sha256,
        human_openable_url: observation.human_openable_url,
        source_revision_unchanged: true,
        append_only_verified: true,
        manifest_readback_verified: true,
        artifact_readback_verified: true,
        automation_side_effects_observed: false,
        usable_as_product_evidence: false,
        created_at: new Date().toISOString(),
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: memoryPath,
        verification_record_text: prettyJson(verification),
        external_steps: [
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=verification_memory_path).',
          'Persist verification_record_text append-only at verification_memory_path.',
          'Read back the persisted probe Verification and pass its exact {path, sha, record_text} durable snapshot to repository PUBLISH prepare/finalize.',
          'Any missing/stale/mismatched probe snapshot keeps repository PUBLISH fail-closed.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'evidence_bundle_attestation_prepare',
    {
      title: 'Prepare durable EvidenceBundle publication attestation',
      description: 'Validate one already-persisted private or repository evidence bundle against the active NEXT Tester Run, then prepare an append-only EVIDENCE_BUNDLE Verification. Persist/read back this exact attestation before checkpoint Verification or Human Handoff may consume the bundle.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1),
        attempt_id: z.string().uuid(),
        tester_run_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA,
        backend: z.enum(['PRIVATE_SUPABASE','REPOSITORY_GIT']),
        private_bundle_ref: z.any().optional(),
        repository_finalize_result_text: z.string().min(2).optional(),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        evidence_bundle_ref: z.any(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({
      project_id, job_id, job_record_text, checkpoint_id, attempt_id,
      tester_run_snapshot, backend, private_bundle_ref, repository_finalize_result_text,
    }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare EvidenceBundle attestation.')

      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: invalid Job JSON.' }], isError: true }
      }
      if (
        job.project_id !== project_id ||
        job.job_id !== job_id ||
        jobExecutionContract(job) !== 'NEXT' ||
        job.lifecycle !== 'IN_PROGRESS'
      ) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: owning Job must be the current IN_PROGRESS NEXT Job.' }], isError: true }
      }

      const runParsed = parseDurableSnapshots([tester_run_snapshot], 'tester_run_snapshot')
      if (runParsed.error || runParsed.entries.length !== 1) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: invalid Tester Run snapshot.' }], isError: true }
      }
      const runEntry = runParsed.entries[0]
      const testerRun = runEntry.record
      if (
        runEntry.path !== recordPath(project_id, 'RUNS', testerRun?.run_id, 'NEXT') ||
        resolveExecutionContract(testerRun?.execution_contract) !== 'NEXT' ||
        testerRun?.project_id !== project_id ||
        testerRun?.job_id !== job_id ||
        testerRun?.role !== 'tester' ||
        testerRun?.lifecycle !== 'IN_PROGRESS' ||
        testerRun?.planning_revision !== job.planning_revision ||
        typeof testerRun?.target_ref !== 'string' ||
        !/^[0-9a-f]{40}$/.test(String(testerRun?.target_revision || ''))
      ) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: bundle must belong to the exact current IN_PROGRESS NEXT Tester Run and exact Git target revision.' }], isError: true }
      }

      const checkpoint = (job.test_checkpoints ?? []).find((item: any) =>
        item.checkpoint_id === checkpoint_id && item.planning_revision === job.planning_revision
      )
      if (!checkpoint) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: checkpoint is not part of the current plan revision.' }], isError: true }
      }
      const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')?.full_name ?? null
      if (!workingRepo) {
        return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: current Job working repository is unavailable.' }], isError: true }
      }

      const expected = {
        project_id,
        job_id,
        checkpoint_id,
        attempt_id,
        run_id: testerRun.run_id,
        target_ref: testerRun.target_ref,
        target_revision: testerRun.target_revision,
        repository_full_name: workingRepo,
      }

      let bundle: any = null
      let publicationProof: any = null

      if (backend === 'PRIVATE_SUPABASE') {
        bundle = private_bundle_ref
        const bundleError = evidenceBundleRefValidationError(bundle, expected)
        if (bundleError || bundle?.backend !== 'PRIVATE_SUPABASE') {
          return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: ' + (bundleError || 'private bundle backend mismatch.') }], isError: true }
        }

        const { data, error } = await auth.supabase
          .from('gsa_evidence_bundles')
          .select('manifest_json,manifest_sha256')
          .eq('user_id', auth.user.id)
          .eq('evidence_bundle_id', bundle.evidence_bundle_id)
          .limit(1)
          .maybeSingle()
        if (error || !data) {
          return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: authenticated private manifest row was not found.' }], isError: true }
        }
        const manifestText = String(data.manifest_json || '')
        const manifestSha = String(data.manifest_sha256 || '').toLowerCase()
        const computedSha = await sha256Utf8Text(manifestText)
        if (
          manifestSha !== computedSha ||
          manifestSha !== String(bundle.manifest_sha256 || '').toLowerCase()
        ) {
          return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: private manifest SHA/read-back mismatch.' }], isError: true }
        }

        let manifest: any
        try { manifest = JSON.parse(manifestText) } catch {
          return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: persisted private manifest JSON is invalid.' }], isError: true }
        }
        const manifestBinding = manifest?.binding ?? {}
        const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '')
        const bindingMatches =
          manifest?.schema_version === 1 &&
          manifest?.backend === 'PRIVATE_SUPABASE' &&
          manifest?.evidence_bundle_id === bundle.evidence_bundle_id &&
          manifest?.privacy_class === bundle.privacy_class &&
          manifest?.manifest_path === bundle.manifest_path &&
          same(manifestBinding.project_id, expected.project_id) &&
          String(manifestBinding.repository || '').toLowerCase() === workingRepo.toLowerCase() &&
          same(manifestBinding.job_id, expected.job_id) &&
          same(manifestBinding.checkpoint_id, expected.checkpoint_id) &&
          same(manifestBinding.attempt_id, expected.attempt_id) &&
          same(manifestBinding.run_id, expected.run_id) &&
          same(manifestBinding.target_ref, expected.target_ref) &&
          same(manifestBinding.target_revision, expected.target_revision)
        const artifacts = Array.isArray(manifest?.artifacts) ? manifest.artifacts : []
        const artifactBytes = artifacts.reduce((sum: number, item: any) => sum + Number(item?.size_bytes || 0), 0)
        const expectedSize = artifactBytes + new TextEncoder().encode(manifestText).byteLength
        const artifactsValid =
          artifacts.length === bundle.artifact_count &&
          artifacts.length >= 1 &&
          artifacts.length <= 12 &&
          artifacts.every((item: any) =>
            item?.mime_type === 'image/png' &&
            Number.isInteger(Number(item?.size_bytes)) &&
            Number(item.size_bytes) > 0 &&
            Number(item.size_bytes) <= 5 * 1024 * 1024 &&
            /^[0-9a-f]{64}$/.test(String(item?.sha256 || ''))
          )
        if (!bindingMatches || !artifactsValid || expectedSize !== bundle.size_bytes) {
          return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: persisted private manifest does not exactly match bundle identity/artifacts.' }], isError: true }
        }
        publicationProof = {
          kind: 'SUPABASE_MANIFEST_READBACK',
          evidence_bundle_id: bundle.evidence_bundle_id,
          manifest_path: bundle.manifest_path,
          manifest_sha256: computedSha,
          authenticated_user_id: auth.user.id,
          row_readback_verified: true,
        }
      } else {
        let finalized: any
        try { finalized = JSON.parse(String(repository_finalize_result_text || '')) } catch {
          return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: repository finalize result JSON is invalid.' }], isError: true }
        }
        bundle = finalized?.evidence_bundle_ref
        const bundleError = evidenceBundleRefValidationError(bundle, expected)
        if (
          finalized?.valid !== true ||
          finalized?.backend !== 'REPOSITORY_GIT' ||
          finalized?.publication_mode !== 'PUBLISH' ||
          finalized?.probe_observation != null ||
          bundleError
        ) {
          return { content: [{ type: 'text', text: 'EVIDENCE_BUNDLE_ATTESTATION_REJECTED: repository bundle is not an exact successful finalized PUBLISH result' + (bundleError ? ': ' + bundleError : '.') }], isError: true }
        }
        publicationProof = {
          kind: 'REPOSITORY_PUBLISH_FINALIZE',
          evidence_ref: bundle.evidence_ref,
          evidence_commit_sha: bundle.evidence_commit_sha,
          manifest_path: bundle.manifest_path,
          manifest_sha256: bundle.manifest_sha256,
          manifest_readback_verified: bundle.manifest_readback_verified === true,
          artifact_readback_verified: bundle.artifact_readback_verified === true,
          automation_side_effects_observed: bundle.automation_side_effects_observed,
          probe_verification_ref: bundle.binary_probe_verification_ref,
          probe_verification_sha: bundle.binary_probe_verification_sha,
        }
      }

      const verificationId = uuidv7()
      const path = verificationPath(project_id, verificationId, 'NEXT')
      const record = {
        verification_id: verificationId,
        kind: 'EVIDENCE_BUNDLE',
        project_id,
        job_id,
        execution_contract: 'NEXT',
        producer: 'tester',
        result: 'PUBLISHED',
        planning_revision: job.planning_revision,
        checkpoint_id,
        attempt_id,
        run_id: testerRun.run_id,
        target_ref: testerRun.target_ref,
        target_revision: testerRun.target_revision,
        repository_full_name: workingRepo,
        backend,
        evidence_bundle_ref: bundle,
        publication_proof: publicationProof,
        created_at: new Date().toISOString(),
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: path,
        verification_record_text: prettyJson(record),
        evidence_bundle_ref: bundle,
        external_steps: [
          ...durableSnapshotReadbackSteps([tester_run_snapshot], 'Tester Run snapshot'),
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=verification_memory_path).',
          'Persist verification_record_text append-only and read it back byte-identically with its Git blob SHA.',
          'Only the exact read-back {path,sha,record_text} snapshot may be passed to checkpoint_verification_prepare.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'get_profile',
    {
      title: 'Get connected GSA account',
      description: 'Return authenticated GSA account identity.',
      inputSchema: {},
      outputSchema: { user_id: z.string(), email: z.string().nullable() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }], 'openai/profile': true },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to read GSA account.')
      const result = { user_id: auth.user.id, email: auth.user.email ?? null }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_memory_repo_config',
    {
      title: 'Get GSA Memory Repo configuration',
      description: 'Read the authenticated user\'s configured GitHub Memory Repo.',
      inputSchema: {},
      outputSchema: {
        configured: z.boolean(),
        memory_repo_id: z.number().nullable(),
        memory_repo_full_name: z.string().nullable(),
        memory_repo_url: z.string().nullable(),
        default_branch: z.string().nullable(),
        gsa_account_email: z.string().nullable(),
        write_scope: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to read Memory Repo configuration.')
      const { data, error } = await readMemoryConfig(auth)
      if (error) return { content: [{ type: 'text', text: 'Failed to read Memory Repo configuration: ' + error.message }], isError: true }
      const result = {
        configured: Boolean(data?.memory_repo_full_name),
        memory_repo_id: data?.memory_repo_id ?? null,
        memory_repo_full_name: data?.memory_repo_full_name ?? null,
        memory_repo_url: data?.memory_repo_url ?? null,
        default_branch: data?.default_branch ?? null,
        gsa_account_email: data?.email ?? auth.user.email ?? null,
        write_scope: data?.memory_repo_full_name
          ? 'EXACT_CONFIGURED_REPO_AND_PROJECTS_PREFIX_ONLY'
          : 'NO_MEMORY_WRITE_UNTIL_CONFIGURED',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'set_memory_repo_config',
    {
      title: 'Set GSA Memory Repo configuration',
      description: 'Persist a verified private GitHub repository as this user\'s GSA Memory Repo. GitHub connector verification must happen before calling this tool.',
      inputSchema: {
        repository_url: z.string().url(),
        repository_id: z.number().int().positive(),
        repository_full_name: z.string().min(3),
        default_branch: z.string().min(1),
        visibility: z.literal('private'),
        push_verified: z.literal(true),
      },
      outputSchema: {
        saved: z.boolean(),
        memory_repo_id: z.number(),
        memory_repo_full_name: z.string(),
        memory_repo_url: z.string(),
        default_branch: z.string(),
        write_scope: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    } as any,
    async ({ repository_url, repository_id, repository_full_name, default_branch }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to configure Memory Repo.')
      const normalized = normalizeGithubRepo(repository_url)
      if (!normalized || normalized.full_name.toLowerCase() !== String(repository_full_name).toLowerCase()) {
        return { content: [{ type: 'text', text: 'Repository URL/full-name mismatch.' }], isError: true }
      }
      const payload = {
        user_id: auth.user.id,
        email: auth.user.email ?? '',
        memory_repo_id: repository_id,
        memory_repo_full_name: normalized.full_name,
        memory_repo_url: normalized.url,
        default_branch,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await auth.supabase
        .from('user_memory_config')
        .upsert(payload, { onConflict: 'user_id' })
        .select('memory_repo_id, memory_repo_full_name, memory_repo_url, default_branch')
        .single()
      if (error) return { content: [{ type: 'text', text: 'Failed to save Memory Repo configuration: ' + error.message }], isError: true }
      const result = {
        saved: true,
        memory_repo_id: Number(data.memory_repo_id),
        memory_repo_full_name: data.memory_repo_full_name,
        memory_repo_url: data.memory_repo_url,
        default_branch: data.default_branch,
        write_scope: 'EXACT_CONFIGURED_REPO_AND_PROJECTS_PREFIX_ONLY',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'authorize_memory_mutation',
    {
      title: 'Authorize a GSA Memory Repo mutation',
      description: 'Mandatory guard before GSA writes/deletes Project Memory. Fails closed on wrong repo or path outside projects/<project-id>/.',
      inputSchema: {
        repository_full_name: z.string().min(3),
        path: z.string().min(1),
        operation: z.enum(['create', 'update', 'delete']),
        human_gate_approved: z.boolean().optional(),
      },
      outputSchema: {
        allowed: z.boolean(),
        reason: z.string(),
        configured_repo: z.string().nullable(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ repository_full_name, path, operation, human_gate_approved }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to authorize memory mutation.')
      const { data, error } = await readMemoryConfig(auth)
      if (error || !data?.memory_repo_full_name) {
        const result = { allowed: false, reason: 'Memory Repo is not configured.', configured_repo: null }
        return { structuredContent: result, content: [{ type: 'text', text: 'DENY: Memory Repo is not configured.' }] }
      }
      const sameRepo = data.memory_repo_full_name.toLowerCase() === String(repository_full_name).toLowerCase()
      const safePath = validMemoryPath(path)
      let allowed = sameRepo && safePath
      let reason = allowed ? 'Mutation is inside configured Memory Repo projects/ scope.' : 'Wrong repository or path outside projects/<project-id>/.'
      if (operation === 'delete' && human_gate_approved !== true) {
        allowed = false
        reason = 'Delete requires explicit Human Gate approval.'
      }
      const result = { allowed, reason, configured_repo: data.memory_repo_full_name }
      return { structuredContent: result, content: [{ type: 'text', text: (allowed ? 'ALLOW: ' : 'DENY: ') + reason }] }
    },
  )

  server.registerTool(
    'project_list',
    {
      title: 'List GSA Projects',
      description: 'Handler for PROJECT list / ls using the configured GitHub Memory Repo.',
      inputSchema: {},
      outputSchema: {
        memory_repo_full_name: z.string().nullable(),
        default_branch: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to list Projects.')
      const { data } = await readMemoryConfig(auth)
      const result = {
        memory_repo_full_name: data?.memory_repo_full_name ?? null,
        default_branch: data?.default_branch ?? null,
        external_steps: data?.memory_repo_full_name ? [
          'GitHub: list/fetch directory projects/ in the configured Memory Repo at default_branch.',
          'For each direct project-id directory, fetch projects/<project-id>/PROJECT.md.',
          'Include ACTIVE and PAUSED. Hide ARCHIVED unless explicitly requested.',
          'Return Project name, lifecycle and short handle. Never guess duplicate/ambiguous targets.',
        ] : ['Memory Repo is not configured. Run SETTING -> Memory Repo first.'],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_create',
    {
      title: 'Create a GSA Project',
      description: 'Handler for PROJECT create / new. Project Memory is a single PROJECT.md file under projects/<uuid>/ in the configured Memory Repo.',
      inputSchema: {
        name: z.string().min(1),
        repository_url: z.string().url(),
        purpose: z.string().optional(),
      },
      outputSchema: {
        project_id: z.string(),
        handle: z.string(),
        project_name: z.string(),
        lifecycle: z.string(),
        source_repository_url: z.string(),
        memory_repo_full_name: z.string(),
        memory_path: z.string(),
        project_manifest_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ name, repository_url, purpose }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to create a Project.')
      const source = normalizeGithubRepo(repository_url)
      if (!source) return { content: [{ type: 'text', text: 'A canonical GitHub source repository URL is required.' }], isError: true }
      const { data, error } = await readMemoryConfig(auth)
      if (error || !data?.memory_repo_full_name) {
        return { content: [{ type: 'text', text: 'Memory Repo is not configured. Configure SETTING -> Memory Repo first.' }], isError: true }
      }
      const projectId = uuidv7()
      const cleanName = safeProjectName(name)
      const now = new Date().toISOString()
      const path = 'projects/' + projectId + '/PROJECT.md'
      const manifest = buildProjectManifest({
        projectId,
        name: cleanName,
        lifecycle: 'ACTIVE',
        repoUrl: source.url,
        purpose: purpose ?? null,
        createdAt: now,
        updatedAt: now,
      })
      const result = {
        project_id: projectId,
        handle: projectHandle(projectId),
        project_name: cleanName,
        lifecycle: 'ACTIVE',
        source_repository_url: source.url,
        memory_repo_full_name: data.memory_repo_full_name,
        memory_path: path,
        project_manifest_text: manifest,
        external_steps: [
          'GitHub source repo: verify repository_url is accessible. Read-only during Project creation.',
          'Memory Repo: scan existing projects/*/PROJECT.md and reject duplicate OWNED claim for the same source repo.',
          'Call authorize_memory_mutation(operation=create, repository_full_name=memory_repo_full_name, path=memory_path). Continue only on ALLOW.',
          'GitHub Memory Repo: create_file at memory_path on configured default branch with project_manifest_text.',
          'Fetch memory_path back and verify project_id, lifecycle=ACTIVE and source repo URL. Record returned blob SHA as current revision.',
          'Do not create empty directory placeholders; Git paths materialize only when records exist.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_register_repositories',
    {
      title: 'Register Project source repositories',
      description: 'Update one Project repository registry after explicit Human confirmation. Supports single- and multi-repo Projects.',
      inputSchema: {
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().min(7),
        human_confirmed: z.literal(true),
        repositories: z.array(z.object({
          role: z.enum(['PRIMARY','DEPENDENCY','SUPPORT','REFERENCE']),
          relation: z.enum(['OWNED','REFERENCED']),
          url: z.string().url(),
        })).min(1),
      },
      outputSchema: {
        repository_mode: z.string(),
        registered_repositories: z.array(z.object({ role: z.string(), relation: z.string(), url: z.string() })),
        memory_path: z.string(),
        expected_sha: z.string(),
        updated_manifest_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ memory_path, project_manifest_text, project_manifest_sha, human_confirmed, repositories }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to register Project repositories.')
      if (!human_confirmed) return { content: [{ type: 'text', text: 'Explicit Human confirmation is required.' }], isError: true }
      if (!validMemoryPath(memory_path)) return { content: [{ type: 'text', text: 'Invalid Project Memory path.' }], isError: true }
      let updated: string
      try {
        updated = renderProjectRepositoryManifest(project_manifest_text, repositories)!
      } catch (err) {
        return { content: [{ type: 'text', text: String(err) }], isError: true }
      }
      const parsed = parseProjectManifest(updated)
      if (!parsed) return { content: [{ type: 'text', text: 'Updated PROJECT.md would be invalid.' }], isError: true }
      const result = {
        repository_mode: parsed.repo_mode,
        registered_repositories: parsed.repositories,
        memory_path,
        expected_sha: project_manifest_sha,
        updated_manifest_text: updated,
        external_steps: [
          'GitHub: verify every supplied repository URL is accessible and resolve its canonical identity.',
          'For every OWNED repository, scan other Project manifests and reject conflicting OWNED claims.',
          'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=memory_path).',
          'Update PROJECT.md with updated_manifest_text using expected_sha exactly; stale SHA requires refetch/reconcile.',
          'Read back PROJECT.md and verify repository_mode, PRIMARY repo and full registered repository set.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_open',
    {
      title: 'Open a GSA Project',
      description: 'Validate an exact PROJECT.md fetched from the configured Memory Repo.',
      inputSchema: {
        memory_path: z.string().min(1),
        project_manifest_text: z.string().min(1),
        project_manifest_sha: z.string().min(7),
      },
      outputSchema: {
        project_id: z.string(),
        handle: z.string(),
        name: z.string(),
        lifecycle: z.string(),
        source_repository_url: z.string(),
        repository_mode: z.string(),
        repo_registry_status: z.string(),
        registered_repositories: z.array(z.object({ role: z.string(), relation: z.string(), url: z.string() })),
        memory_path: z.string(),
        project_manifest_sha: z.string(),
        openable: z.boolean(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ memory_path, project_manifest_text, project_manifest_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to open a Project.')
      if (!validMemoryPath(memory_path)) return { content: [{ type: 'text', text: 'Invalid Project Memory path.' }], isError: true }
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      const result = {
        project_id: parsed.project_id,
        handle: projectHandle(parsed.project_id),
        name: parsed.name,
        lifecycle: parsed.lifecycle,
        source_repository_url: parsed.primary_repo_url,
        repository_mode: parsed.repo_mode,
        repo_registry_status: parsed.repo_registry_status,
        registered_repositories: parsed.repositories,
        memory_path,
        project_manifest_sha,
        openable: parsed.lifecycle !== 'ARCHIVED',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_status',
    {
      title: 'Show GSA Project status',
      description: 'Parse current PROJECT.md from Memory Repo.',
      inputSchema: { project_manifest_text: z.string().min(1), project_manifest_sha: z.string().min(7) },
      outputSchema: {
        project_id: z.string(),
        handle: z.string(),
        name: z.string(),
        lifecycle: z.string(),
        source_repository_url: z.string(),
        repository_mode: z.string(),
        repo_registry_status: z.string(),
        registered_repositories: z.array(z.object({ role: z.string(), relation: z.string(), url: z.string() })),
        project_manifest_sha: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ project_manifest_text, project_manifest_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to show Project status.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      const result = {
        project_id: parsed.project_id,
        handle: projectHandle(parsed.project_id),
        name: parsed.name,
        lifecycle: parsed.lifecycle,
        source_repository_url: parsed.primary_repo_url,
        repository_mode: parsed.repo_mode,
        repo_registry_status: parsed.repo_registry_status,
        registered_repositories: parsed.repositories,
        project_manifest_sha,
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  const transitionTool = (
    toolName: string,
    title: string,
    target: 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
    allowedFrom: string[],
  ) => {
    server.registerTool(
      toolName,
      {
        title,
        description: 'Return exact PROJECT.md replacement and require GitHub update_file with the current blob SHA.',
        inputSchema: {
          memory_path: z.string().min(1),
          project_manifest_text: z.string().min(1),
          project_manifest_sha: z.string().min(7),
        },
        outputSchema: {
          from: z.string(),
          to: z.string(),
          memory_path: z.string(),
          expected_sha: z.string(),
          updated_manifest_text: z.string(),
          external_steps: z.array(z.string()),
        },
        securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
        _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      } as any,
      async ({ memory_path, project_manifest_text, project_manifest_sha }: any) => {
        const auth = await authContext(req)
        if (!auth) return authError(req, 'Authentication required to change Project lifecycle.')
        if (!validMemoryPath(memory_path)) return { content: [{ type: 'text', text: 'Invalid Project Memory path.' }], isError: true }
        const parsed = parseProjectManifest(project_manifest_text)
        if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
        if (!allowedFrom.includes(parsed.lifecycle)) {
          return { content: [{ type: 'text', text: 'Lifecycle transition blocked from ' + parsed.lifecycle + ' to ' + target + '.' }], isError: true }
        }
        const tr = transitionProjectManifest(project_manifest_text, target)!
        const result = {
          from: parsed.lifecycle,
          to: target,
          memory_path,
          expected_sha: project_manifest_sha,
          updated_manifest_text: tr.next,
          external_steps: [
            'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=memory_path). Continue only on ALLOW.',
            'GitHub Memory Repo: update_file at memory_path using expected_sha exactly. A stale SHA failure must cause refetch/reconcile, never force overwrite.',
            'Fetch memory_path back and verify lifecycle=' + target + '.',
          ],
        }
        return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
      },
    )
  }

  transitionTool('project_pause', 'Pause a GSA Project', 'PAUSED', ['ACTIVE'])
  transitionTool('project_resume', 'Resume a GSA Project', 'ACTIVE', ['PAUSED'])
  transitionTool('project_archive', 'Archive a GSA Project', 'ARCHIVED', ['ACTIVE','PAUSED'])

  server.registerTool(
    'project_delete',
    {
      title: 'Delete GSA Project Memory',
      description: 'Delete all files under one projects/<project-id>/ prefix after explicit Human Gate. Source repo is never deleted.',
      inputSchema: {
        project_id: z.string().uuid(),
        confirmed: z.boolean(),
      },
      outputSchema: {
        allowed: z.boolean(),
        project_prefix: z.string(),
        reason: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, confirmed }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to delete Project Memory.')
      const prefix = 'projects/' + project_id + '/'
      if (!confirmed) {
        const result = {
          allowed: false,
          project_prefix: prefix,
          reason: 'Explicit human confirmation is required. Source repository will not be deleted.',
          external_steps: ['Show exact Project identity and source repository, then ask for explicit confirmation.'],
        }
        return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
      }
      const result = {
        allowed: true,
        project_prefix: prefix,
        reason: 'Human confirmed Project Memory deletion only.',
        external_steps: [
          'GitHub Memory Repo: enumerate every file under project_prefix.',
          'For each file, call authorize_memory_mutation(operation=delete, repository_full_name=configured Memory Repo, path=file path, human_gate_approved=true).',
          'Fetch current blob SHA immediately before each delete_file call.',
          'Delete each exact file path with its current SHA. Never delete outside project_prefix.',
          'Verify no files remain under project_prefix.',
          'Do not mutate or delete the source repository.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_agent_harness',
    {
      title: 'Load a GSA role harness',
      description: 'Load shared GSA operating rules plus one role contract. Then load only the returned suggested skills that are relevant to the current Run.',
      inputSchema: {
        role: z.enum(['orchestrator','planner','designer','coder','reviewer','critic_reviewer','tester']),
        mode: z.enum(['JOB','DIRECT_AGENT']).default('JOB'),
      },
      outputSchema: {
        role: z.string(),
        mode: z.string(),
        harness_text: z.string(),
        canonical_refs: z.array(z.string()),
        suggested_skills: z.array(z.string()),
        context_policy: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ role, mode }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to load a role harness.')
      const harness = renderHarness(role)
      if (!harness) return { content: [{ type: 'text', text: 'Unknown role harness.' }], isError: true }
      const result = {
        role,
        mode,
        harness_text: harness,
        canonical_refs: ROLE_HARNESSES[role].canonical_refs,
        suggested_skills: ROLE_SKILLS[role] ?? [],
        context_policy: role === 'critic_reviewer'
          ? 'STATELESS_REVIEW_HUMAN_ONLY; ignore conversation history as evidence, reconstruct from durable records and live source only, and compare prior Reviewer verdict last.'
          : role === 'reviewer'
            ? 'FRESH_CHAT_CONTEXT_ISOLATED; load exact requirements + target/revision + evidence only.'
            : 'MINIMUM_SUFFICIENT_CONTEXT; load skill bodies progressively and prefer durable references plus selective live-source reads.',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_skill_catalog',
    {
      title: 'List GSA runtime skills',
      description: 'Return only skill names and descriptions for progressive disclosure. Load a full body with load_skill only when it is relevant.',
      inputSchema: {},
      outputSchema: {
        skills: z.array(z.object({ name: z.string(), description: z.string() })),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to list runtime skills.')
      const skills = Object.entries(RUNTIME_SKILLS).map(([name, skill]) => ({ name, description: skill.description }))
      return { structuredContent: { skills }, content: [{ type: 'text', text: JSON.stringify({ skills }) }] }
    },
  )

  server.registerTool(
    'load_skill',
    {
      title: 'Load one GSA runtime skill',
      description: 'Progressively load a task-specific GSA skill after its catalog entry or role suggestion is relevant.',
      inputSchema: {
        name: z.enum(['job-planning','coding-loop','delegation','planning-review','review-evidence','critic-review','testing-evidence','ui-coder-frontend']),
      },
      outputSchema: {
        name: z.string(),
        description: z.string(),
        skill_text: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ name }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to load a runtime skill.')
      const skill = RUNTIME_SKILLS[name]
      if (!skill) return { content: [{ type: 'text', text: 'Unknown runtime skill.' }], isError: true }
      const result = { name, description: skill.description, skill_text: skill.body }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'job_prepare',
    {
      title: 'Prepare a durable GSA Job',
      description: 'Planner finalization tool. Builds one finite Job record after the Planner harness has produced an approved plan. NEXT plans may include revision-bound EvidenceNeed, TestCheckpointSpec, EvidenceRequirement, milestones and typed planning_topology; V2_STABLE keeps these collections empty.',
      inputSchema: {
        project_id: z.string().uuid(),
        type: z.enum(['plan','code','design','review']),
        objective: z.string().min(1),
        scope: z.array(z.string()).min(1),
        non_goals: z.array(z.string()).default([]),
        execution_contract: z.enum(['V2_STABLE','NEXT']).default('V2_STABLE'),
        work_context: z.enum(['NEW','BROWNFIELD']),
        phase: z.string().min(1),
        milestone: z.string().min(1),
        relationship_scan_summary: z.string().min(1),
        job_sizing: z.object({
          size: z.enum(['SMALL','MEDIUM','LARGE']),
          rationale: z.string().min(1),
          bounded_causal_chain: z.string().min(1),
          context_boundary: z.array(z.string()).min(1),
          independently_meaningful_completion: z.string().min(1),
          split_or_keep_reason: z.string().min(1),
        }),
        brownfield_logic_review: z.array(z.object({
          target: z.string().min(1),
          classification: z.enum(['CANONICAL','LEGACY','ACCIDENTAL','INCORRECT','UNKNOWN']),
          evidence: z.array(z.string()).min(1),
          implication: z.string().min(1),
        })).default([]),
        relationship_assessment: z.array(z.object({
          source: z.string().min(1),
          target: z.string().min(1),
          relationship: z.string().min(1),
          precedence: z.string().min(1),
          reason: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          reread_condition: z.string().min(1),
        })).default([]),
        repository_structure_evidence: z.array(z.string()).min(1),
        selected_source_evidence: z.array(z.string()).default([]),
        project_repository_mode: z.enum(['SINGLE','MULTI']),
        registered_repositories: z.array(z.string().url()).min(1),
        working_repository_url: z.string().url(),
        cross_repo_impact: z.array(z.object({
          repository_url: z.string().url(),
          impact: z.enum(['NONE','READ_ONLY_CONTRACT_CHECK','COORDINATED_CHANGE_REQUIRED','UNKNOWN']),
          reason: z.string().min(1),
        })).min(1),
        product_workflow: z.enum(['UI_FIRST','UX_FIRST']).optional(),
        temporary_ui: z.array(z.string()).default([]),
        collected_ui_requirements: z.array(z.string()).default([]),
        ui_update_pack_trigger: z.string().optional(),
        temporary_ui_human_approval: z.enum(['NOT_REQUIRED','REQUIRED_PENDING','APPROVED']).optional(),
        tasks: z.array(z.object({
          task_id: z.string().optional(),
          objective: z.string().min(1),
          scope: z.array(z.string()).default([]),
          dependencies: z.array(z.string()).default([]),
          completion_criteria: z.array(z.string()).min(1),
        })).min(1),
        evidence_needs: z.array(EVIDENCE_NEED_SCHEMA).default([]),
        test_checkpoints: z.array(TEST_CHECKPOINT_SPEC_SCHEMA).default([]),
        evidence_requirements: z.array(EVIDENCE_REQUIREMENT_SCHEMA).default([]),
        milestones: z.array(MILESTONE_SCHEMA).default([]),
        planning_topology: z.array(PLANNING_TOPOLOGY_NODE_SCHEMA).default([]),
        completion_requirements: z.array(z.string()).min(1),
        verification_requirements: z.array(z.string()).default([]),
        review_triggers: z.array(z.string()).default([]),
      },
      outputSchema: {
        job_id: z.string(),
        handle: z.string(),
        memory_path: z.string(),
        job_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, type, objective, scope, non_goals, execution_contract, work_context, phase, milestone, relationship_scan_summary, job_sizing, brownfield_logic_review, relationship_assessment, repository_structure_evidence, selected_source_evidence, project_repository_mode, registered_repositories, working_repository_url, cross_repo_impact, product_workflow, temporary_ui, collected_ui_requirements, ui_update_pack_trigger, temporary_ui_human_approval, tasks, evidence_needs, test_checkpoints, evidence_requirements, milestones, planning_topology, completion_requirements, verification_requirements, review_triggers }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare a Job.')
      const { data } = await readMemoryConfig(auth)
      if (!data?.memory_repo_full_name) return { content: [{ type: 'text', text: 'Memory Repo is not configured.' }], isError: true }
      const normalizedRegistered = (registered_repositories ?? []).map((u: string) => normalizeGithubRepo(u)?.url).filter(Boolean)
      const normalizedWorking = normalizeGithubRepo(working_repository_url)?.url
      if (!normalizedWorking || !normalizedRegistered.includes(normalizedWorking)) {
        return { content: [{ type: 'text', text: 'Working repository must be one of the registered Project repositories.' }], isError: true }
      }
      const impactUrls = new Set((cross_repo_impact ?? []).map((x: any) => normalizeGithubRepo(x.repository_url)?.url).filter(Boolean))
      const missingImpact = normalizedRegistered.filter((u: string) => !impactUrls.has(u))
      if (missingImpact.length) {
        return { content: [{ type: 'text', text: 'Cross-repo impact assessment must cover every registered repository: ' + missingImpact.join(', ') }], isError: true }
      }
      if (project_repository_mode === 'MULTI' && normalizedRegistered.length < 2) {
        return { content: [{ type: 'text', text: 'MULTI Project requires at least two registered repositories.' }], isError: true }
      }
      if (work_context === 'BROWNFIELD' && !(brownfield_logic_review ?? []).length) {
        return { content: [{ type: 'text', text: 'BROWNFIELD_PLANNING_INCOMPLETE: relevant existing logic review evidence is required before preparing the Job.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const jobId = uuidv7()
      const now = new Date().toISOString()
      const normalizedTasks = tasks.map((task: any) => ({
        task_id: task.task_id || uuidv7(),
        objective: task.objective,
        scope: task.scope ?? [],
        dependencies: task.dependencies ?? [],
        completion_criteria: task.completion_criteria,
        lifecycle: 'READY',
      }))
      const topology = normalizedTasks.map((task: any, index: number) => ({
        stage: index + 1,
        handler: type === 'design' ? 'designer' : type === 'review' ? 'reviewer' : index === 0 ? 'coder' : 'coder',
        task_id: task.task_id,
        depends_on: task.dependencies,
        next: index + 1 < normalizedTasks.length ? normalizedTasks[index + 1].task_id : null,
      }))
      const executionTopologyError = executionContract === 'NEXT' ? validateExecutionTopology(normalizedTasks, topology) : null
      if (executionTopologyError) return { content: [{ type: 'text', text: executionTopologyError }], isError: true }
      const nextPlanning = normalizeNextPlanningModel({ evidence_needs, test_checkpoints, evidence_requirements, milestones, planning_topology }, 1)
      const nextPlanningError = validateNextPlanningModel(executionContract, normalizedTasks, nextPlanning, 1)
      if (nextPlanningError) return { content: [{ type: 'text', text: nextPlanningError }], isError: true }
      const record = {
        job_id: jobId,
        handle: jobHandle(jobId),
        project_id,
        type,
        objective,
        scope,
        non_goals,
        execution_contract: executionContract,
        planning_context: {
          work_context,
          phase,
          milestone,
          relationship_scan_summary,
          job_sizing,
          brownfield_logic_review: brownfield_logic_review ?? [],
          relationship_assessment: relationship_assessment ?? [],
        },
        repository_discovery: {
          structure_evidence: repository_structure_evidence,
          selected_source_evidence: selected_source_evidence ?? [],
        },
        repository_context: {
          project_repository_mode,
          registered_repositories: normalizedRegistered,
          working_repository_url: normalizedWorking,
          cross_repo_impact: cross_repo_impact ?? [],
        },
        product_workflow: product_workflow ?? null,
        ui_strategy: product_workflow === 'UX_FIRST' ? {
          temporary_ui: temporary_ui ?? [],
          collected_ui_requirements: collected_ui_requirements ?? [],
          ui_update_pack_trigger: ui_update_pack_trigger ?? null,
          temporary_ui_human_approval: temporary_ui_human_approval ?? ((temporary_ui ?? []).length ? 'REQUIRED_PENDING' : 'NOT_REQUIRED'),
          temporary_ui_policy: 'MINIMUM_EXECUTION_SCAFFOLD_REUSE_CURRENT_SHELL_PROVISIONAL_HUMAN_APPROVAL_FOR_MATERIAL_INTERACTION_CHOICES',
        } : null,
        tasks: normalizedTasks,
        topology,
        evidence_needs: nextPlanning.evidence_needs,
        test_checkpoints: nextPlanning.test_checkpoints,
        evidence_requirements: nextPlanning.evidence_requirements,
        milestones: nextPlanning.milestones,
        planning_topology: nextPlanning.planning_topology,
        dependencies: [],
        completion_requirements,
        verification_requirements,
        review_triggers,
        planning_revision: 1,
        planning_review: {
          status: 'PENDING',
          reviewed_revision: null,
          verification_ref: null,
        },
        lifecycle: 'DRAFT',
        result: null,
        linked_job_ids: [],
        created_at: now,
        updated_at: now,
      }
      const path = recordPath(project_id, 'JOBS', jobId, executionContract)
      const externalSteps = [
        'Re-read current PROJECT.md and require lifecycle=ACTIVE before persisting the Job.',
        'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path). Continue only on ALLOW.',
        'GitHub Memory Repo: create_file at memory_path with job_record_text.',
        'Fetch the new Job record back and verify job_id/project_id/lifecycle=DRAFT/planning_revision=1.',
      ]
      if ((relationship_assessment ?? []).length) {
        externalSteps.push('For each durable precedence/reread relationship discovered by planning, call relationship_knowledge_prepare and persist/read-back the resulting existing KNOWLEDGE/ ARCHITECTURE_NOTE before relying on it in later Jobs.')
      }
      externalSteps.push(
        'Immediately continue in this SAME USER TURN: load Reviewer harness + planning-review skill and review this exact revision. Do not report planning completion to the user yet.',
        'Do not modify source during Planner Job persistence.',
      )
      const result = {
        job_id: jobId,
        handle: jobHandle(jobId),
        memory_path: path,
        job_record_text: prettyJson(record),
        external_steps: externalSteps,
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'job_transition',
    {
      title: 'Transition a durable GSA Job',
      description: 'Serialized Job lifecycle update using the exact current Job record and blob SHA. Supports DRAFT→READY only after PASS planning review, READY→IN_PROGRESS when execution starts, and IN_PROGRESS→COMPLETED only after completion evidence exists.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        target_lifecycle: z.enum(['READY','IN_PROGRESS','COMPLETED','CANCELLED','SUPERSEDED']),
        result: z.enum(['PASS','PASS_RETEST_REQUIRED','CANCELLED','SUPERSEDED']).optional(),
        completion_evidence_refs: z.array(z.string()).default([]),
        planning_review_verification_ref: z.string().optional(),
        checkpoint_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        checkpoint_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
      },
      outputSchema: {
        memory_path: z.string(),
        expected_job_sha: z.string(),
        next_job_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, job_record_sha, target_lifecycle, result, completion_evidence_refs, planning_review_verification_ref, checkpoint_claim_snapshots, checkpoint_verification_snapshots }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to transition a Job.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(current)
      if (!executionContract) return invalidExecutionContract()
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Job identity mismatch.' }], isError: true }
      }
      const allowed =
        (current.lifecycle === 'DRAFT' && ['READY','CANCELLED','SUPERSEDED'].includes(target_lifecycle)) ||
        (current.lifecycle === 'READY' && ['IN_PROGRESS','CANCELLED','SUPERSEDED'].includes(target_lifecycle)) ||
        (current.lifecycle === 'IN_PROGRESS' && ['COMPLETED','CANCELLED','SUPERSEDED'].includes(target_lifecycle))
      if (!allowed) {
        return { content: [{ type: 'text', text: 'Invalid Job lifecycle transition: ' + current.lifecycle + ' → ' + target_lifecycle }], isError: true }
      }
      if (target_lifecycle === 'READY') {
        if (!planning_review_verification_ref) {
          return { content: [{ type: 'text', text: 'DRAFT→READY requires a PASS planning-review Verification reference.' }], isError: true }
        }
        if (current.planning_review?.status !== 'PASS' || current.planning_review?.reviewed_revision !== current.planning_revision) {
          return { content: [{ type: 'text', text: 'Current planning revision is not marked PASS by planning review.' }], isError: true }
        }
        if (current.planning_review?.verification_ref !== planning_review_verification_ref) {
          return { content: [{ type: 'text', text: 'Planning review Verification reference mismatch.' }], isError: true }
        }
      }
      if (target_lifecycle === 'COMPLETED') {
        if (!['PASS','PASS_RETEST_REQUIRED'].includes(result ?? '')) {
          return { content: [{ type: 'text', text: 'Completed Job requires result PASS or PASS_RETEST_REQUIRED.' }], isError: true }
        }
        if (!(completion_evidence_refs ?? []).length) {
          return { content: [{ type: 'text', text: 'Completed Job requires at least one durable completion evidence reference.' }], isError: true }
        }
        if (executionContract === 'NEXT') {
          if (current.planning_review?.status !== 'PASS' || current.planning_review?.reviewed_revision !== current.planning_revision) {
            return { content: [{ type: 'text', text: 'NEXT_JOB_COMPLETION_BLOCKED: current planning revision is not Reviewer PASS.' }], isError: true }
          }
          const gate = evaluateNextEvidenceGate(
            current,
            checkpoint_claim_snapshots ?? [],
            checkpoint_verification_snapshots ?? [],
            { kind: 'JOB', id: null },
          )
          if (!gate.allowed) {
            return {
              content: [{
                type: 'text',
                text: 'NEXT_JOB_COMPLETION_BLOCKED: mandatory checkpoint/evidence gate is unsatisfied. PASS_RETEST_REQUIRED cannot bypass it. ' + gate.blocking.join('; '),
              }],
              isError: true,
            }
          }
        }
      }
      const next = {
        ...current,
        lifecycle: target_lifecycle,
        result: result ?? current.result ?? null,
        completion_evidence_refs: completion_evidence_refs ?? current.completion_evidence_refs ?? [],
        updated_at: new Date().toISOString(),
      }
      const memoryPath = recordPath(project_id, 'JOBS', job_id, executionContract)
      const externalSteps = [
        'Re-read current PROJECT.md and require lifecycle=ACTIVE before a consequential Job transition.',
        'Verify the current Job file blob SHA still equals expected_job_sha. On mismatch, refetch/reconcile; never force overwrite.',
      ]
      if (target_lifecycle === 'COMPLETED') {
        externalSteps.push('Verify every completion_evidence_ref already exists and applies to the current accepted target revision before Job completion.')
        if (executionContract === 'NEXT') {
          externalSteps.push(
            ...durableSnapshotReadbackSteps(checkpoint_claim_snapshots ?? [], 'checkpoint claim snapshot'),
            ...durableSnapshotReadbackSteps(checkpoint_verification_snapshots ?? [], 'checkpoint Verification snapshot'),
          )
        }
      }
      externalSteps.push(
        'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=memory_path).',
        'GitHub Memory Repo: update the Job file with next_job_record_text using expected_job_sha exactly.',
        'Read back the Job and verify the target lifecycle/result before reporting the Job transition complete.',
      )
      const out = {
        memory_path: memoryPath,
        expected_job_sha: job_record_sha,
        next_job_record_text: prettyJson(next),
        external_steps: externalSteps,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'job_revise_plan',
    {
      title: 'Revise a GSA Job plan',
      description: 'Planner-only exact-SHA planning revision update. DRAFT revisions follow the normal planning loop; NEXT IN_PROGRESS revisions are allowed only from persisted PLAN_GAP/SPEC_GAP Tester evidence and supersede the old planning topology.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        objective: z.string().min(1).optional(),
        scope: z.array(z.string()).optional(),
        non_goals: z.array(z.string()).optional(),
        work_context: z.enum(['NEW','BROWNFIELD']).optional(),
        phase: z.string().min(1).optional(),
        milestone: z.string().min(1).optional(),
        relationship_scan_summary: z.string().min(1).optional(),
        job_sizing: z.object({
          size: z.enum(['SMALL','MEDIUM','LARGE']),
          rationale: z.string().min(1),
          bounded_causal_chain: z.string().min(1),
          context_boundary: z.array(z.string()).min(1),
          independently_meaningful_completion: z.string().min(1),
          split_or_keep_reason: z.string().min(1),
        }).optional(),
        brownfield_logic_review: z.array(z.object({
          target: z.string().min(1),
          classification: z.enum(['CANONICAL','LEGACY','ACCIDENTAL','INCORRECT','UNKNOWN']),
          evidence: z.array(z.string()).min(1),
          implication: z.string().min(1),
        })).optional(),
        relationship_assessment: z.array(z.object({
          source: z.string().min(1),
          target: z.string().min(1),
          relationship: z.string().min(1),
          precedence: z.string().min(1),
          reason: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          reread_condition: z.string().min(1),
        })).optional(),
        repository_structure_evidence: z.array(z.string()).optional(),
        selected_source_evidence: z.array(z.string()).optional(),
        tasks: z.array(z.any()).optional(),
        topology: z.array(z.any()).optional(),
        evidence_needs: z.array(EVIDENCE_NEED_SCHEMA).optional(),
        test_checkpoints: z.array(TEST_CHECKPOINT_SPEC_SCHEMA).optional(),
        evidence_requirements: z.array(EVIDENCE_REQUIREMENT_SCHEMA).optional(),
        milestones: z.array(MILESTONE_SCHEMA).optional(),
        planning_topology: z.array(PLANNING_TOPOLOGY_NODE_SCHEMA).optional(),
        completion_requirements: z.array(z.string()).optional(),
        verification_requirements: z.array(z.string()).optional(),
        review_triggers: z.array(z.string()).optional(),
        revision_reason: z.string().min(1),
        superseding_verification_record_text: z.string().min(2).optional(),
        superseding_verification_ref: z.string().min(1).optional(),
        superseding_claim_record_text: z.string().min(2).optional(),
        superseding_claim_record_sha: z.string().min(7).optional(),
      },
      outputSchema: {
        memory_path: z.string(),
        expected_job_sha: z.string(),
        next_job_record_text: z.string(),
        planning_revision: z.number(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, job_record_sha, objective, scope, non_goals, work_context, phase, milestone, relationship_scan_summary, job_sizing, brownfield_logic_review, relationship_assessment, repository_structure_evidence, selected_source_evidence, tasks, topology, evidence_needs, test_checkpoints, evidence_requirements, milestones, planning_topology, completion_requirements, verification_requirements, review_triggers, revision_reason, superseding_verification_record_text, superseding_verification_ref, superseding_claim_record_text, superseding_claim_record_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to revise a Job plan.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(current)
      if (!executionContract) return invalidExecutionContract()
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Job identity mismatch.' }], isError: true }
      }
      const inProgressNextRevision = executionContract === 'NEXT' && current.lifecycle === 'IN_PROGRESS'
      const inProgressReviewRepair =
        inProgressNextRevision &&
        ['CHANGES_REQUIRED','HUMAN_REVIEW_REQUIRED'].includes(current.planning_review?.status) &&
        Boolean(current.superseding_verification_ref)
      const inProgressGapSupersession = inProgressNextRevision && !inProgressReviewRepair
      if (current.lifecycle !== 'DRAFT' && !inProgressNextRevision) {
        return { content: [{ type: 'text', text: 'Planner revision is allowed only for DRAFT Jobs or NEXT IN_PROGRESS supersession/review repair.' }], isError: true }
      }
      let supersedingVerification: any = null
      let supersedingClaim: any = null
      if (inProgressGapSupersession) {
        if (!superseding_verification_record_text || !superseding_verification_ref || !superseding_claim_record_text || !superseding_claim_record_sha) {
          return { content: [{ type: 'text', text: 'NEXT_PLAN_SUPERSESSION_REJECTED: first IN_PROGRESS supersession requires persisted PLAN_GAP/SPEC_GAP Verification plus its terminal checkpoint claim.' }], isError: true }
        }
        try {
          supersedingVerification = JSON.parse(superseding_verification_record_text)
          supersedingClaim = JSON.parse(superseding_claim_record_text)
        } catch {
          return { content: [{ type: 'text', text: 'NEXT_PLAN_SUPERSESSION_REJECTED: invalid superseding Verification/claim JSON.' }], isError: true }
        }
        const expectedVerificationRef = verificationPath(project_id, supersedingVerification.verification_id, 'NEXT')
        const supersessionMatches =
          ['TEST','RETEST'].includes(supersedingVerification.kind) &&
          supersedingVerification.execution_contract === 'NEXT' &&
          supersedingVerification.project_id === project_id &&
          supersedingVerification.job_id === job_id &&
          supersedingVerification.planning_revision === current.planning_revision &&
          ['PLAN_GAP','SPEC_GAP'].includes(supersedingVerification.failure_class) &&
          supersedingVerification.route === 'PLANNER_REVISION_SUPERSEDE' &&
          superseding_verification_ref === expectedVerificationRef &&
          supersedingClaim.kind === 'CHECKPOINT_CLAIM' &&
          supersedingClaim.execution_contract === 'NEXT' &&
          supersedingClaim.project_id === project_id &&
          supersedingClaim.job_id === job_id &&
          supersedingClaim.planning_revision === current.planning_revision &&
          supersedingClaim.state === 'NEEDS_PLANNER_REVISION' &&
          supersedingClaim.checkpoint_id === supersedingVerification.checkpoint_id &&
          supersedingClaim.last_failure_class === supersedingVerification.failure_class &&
          supersedingClaim.last_result === supersedingVerification.result &&
          supersedingClaim.last_verification_id === supersedingVerification.verification_id &&
          supersedingClaim.lease_token === supersedingVerification.lease_token &&
          supersedingClaim.attempt_id === supersedingVerification.attempt_id &&
          supersedingClaim.last_target_revision === supersedingVerification.target_revision
        if (!supersessionMatches) {
          return { content: [{ type: 'text', text: 'NEXT_PLAN_SUPERSESSION_REJECTED: Verification must be the current terminal PLAN_GAP/SPEC_GAP claim result for this planning revision.' }], isError: true }
        }
      } else if (inProgressReviewRepair && !current.superseding_verification_ref) {
        return { content: [{ type: 'text', text: 'NEXT_PLAN_SUPERSESSION_REJECTED: review-repair revision has no originating supersession evidence.' }], isError: true }
      }
      if (executionContract === 'NEXT' && tasks !== undefined && topology === undefined) {
        return { content: [{ type: 'text', text: 'NEXT_EXECUTION_TOPOLOGY_REBIND_REQUIRED: revising Tasks must resupply execution topology for the same planning revision.' }], isError: true }
      }
      const nextRevision = Number(current.planning_revision ?? 0) + 1
      const hasCurrentNextPlanning = ['evidence_needs','test_checkpoints','evidence_requirements','milestones','planning_topology'].some((key) => (current[key] ?? []).length)
      const allNextPlanningSupplied = evidence_needs !== undefined && test_checkpoints !== undefined && evidence_requirements !== undefined && milestones !== undefined && planning_topology !== undefined
      if (executionContract === 'NEXT' && hasCurrentNextPlanning && !allNextPlanningSupplied) {
        return { content: [{ type: 'text', text: 'NEXT_PLANNING_REBIND_REQUIRED: every revision of a NEXT Job with active CP4 planning must explicitly resupply all CP4 planning collections for the new planning_revision.' }], isError: true }
      }
      const nextTasks = tasks ?? current.tasks
      const nextTopology = topology ?? current.topology
      const executionTopologyError = executionContract === 'NEXT' ? validateExecutionTopology(nextTasks ?? [], nextTopology ?? []) : null
      if (executionTopologyError) return { content: [{ type: 'text', text: executionTopologyError }], isError: true }
      const nextPlanning = normalizeNextPlanningModel({
        evidence_needs: evidence_needs ?? current.evidence_needs ?? [],
        test_checkpoints: test_checkpoints ?? current.test_checkpoints ?? [],
        evidence_requirements: evidence_requirements ?? current.evidence_requirements ?? [],
        milestones: milestones ?? current.milestones ?? [],
        planning_topology: planning_topology ?? current.planning_topology ?? [],
      }, nextRevision)
      const nextPlanningError = validateNextPlanningModel(executionContract, nextTasks, nextPlanning, nextRevision)
      if (nextPlanningError) return { content: [{ type: 'text', text: nextPlanningError }], isError: true }
      const next = {
        ...current,
        objective: objective ?? current.objective,
        scope: scope ?? current.scope,
        non_goals: non_goals ?? current.non_goals,
        planning_context: {
          work_context: work_context ?? current.planning_context?.work_context ?? 'NEW',
          phase: phase ?? current.planning_context?.phase ?? 'UNSPECIFIED',
          milestone: milestone ?? current.planning_context?.milestone ?? 'UNSPECIFIED',
          relationship_scan_summary: relationship_scan_summary ?? current.planning_context?.relationship_scan_summary ?? 'UNSPECIFIED',
          job_sizing: job_sizing ?? current.planning_context?.job_sizing ?? null,
          brownfield_logic_review: brownfield_logic_review ?? current.planning_context?.brownfield_logic_review ?? [],
          relationship_assessment: relationship_assessment ?? current.planning_context?.relationship_assessment ?? [],
        },
        repository_discovery: {
          structure_evidence: repository_structure_evidence ?? current.repository_discovery?.structure_evidence ?? [],
          selected_source_evidence: selected_source_evidence ?? current.repository_discovery?.selected_source_evidence ?? [],
        },
        tasks: nextTasks,
        topology: nextTopology,
        evidence_needs: nextPlanning.evidence_needs,
        test_checkpoints: nextPlanning.test_checkpoints,
        evidence_requirements: nextPlanning.evidence_requirements,
        milestones: nextPlanning.milestones,
        planning_topology: nextPlanning.planning_topology,
        completion_requirements: completion_requirements ?? current.completion_requirements,
        verification_requirements: verification_requirements ?? current.verification_requirements,
        review_triggers: review_triggers ?? current.review_triggers,
        planning_revision: nextRevision,
        planning_review: { status: 'PENDING', reviewed_revision: null, verification_ref: null },
        supersedes_planning_revision: inProgressNextRevision ? current.planning_revision : current.supersedes_planning_revision ?? null,
        superseding_verification_ref: inProgressGapSupersession ? superseding_verification_ref : current.superseding_verification_ref ?? null,
        superseding_claim_sha: inProgressGapSupersession ? superseding_claim_record_sha : current.superseding_claim_sha ?? null,
        last_planning_revision_reason: revision_reason,
        updated_at: new Date().toISOString(),
      }
      const memoryPath = recordPath(project_id, 'JOBS', job_id, executionContract)
      const out = {
        memory_path: memoryPath,
        expected_job_sha: job_record_sha,
        next_job_record_text: prettyJson(next),
        planning_revision: nextRevision,
        external_steps: [
          'Fetch current Job immediately before update and require blob SHA equals expected_job_sha.',
          'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=memory_path).',
          'Update Job with next_job_record_text using expected_job_sha exactly; stale SHA requires refetch/reconcile.',
          'Read back the Job and verify the incremented planning_revision plus planning_review=PENDING.',
          inProgressNextRevision
            ? 'The Job remains IN_PROGRESS but all further NEXT dispatch/checkpoint claims are blocked until Reviewer PASS binds to this exact superseding planning_revision. For first runtime supersession, read back the originating Verification and terminal claim (exact claim SHA) before updating the Job.'
            : 'The DRAFT Job remains non-executable until Reviewer PASS and READY transition.',
          'Immediately continue in this SAME USER TURN with a new Reviewer planning review for this exact revision before any user-facing planning-complete report.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'plan_review_record',
    {
      title: 'Record planning review for one exact Job revision',
      description: 'Reviewer-only planning Verification. PASS unlocks DRAFT→READY or resumes a superseding NEXT IN_PROGRESS planning revision; CHANGES_REQUIRED routes automatically back to Planner.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        planning_revision: z.number().int().positive(),
        result: z.enum(['PASS','CHANGES_REQUIRED','HUMAN_REVIEW_REQUIRED','BLOCKED']),
        findings: z.array(z.object({
          severity: z.enum(['CRITICAL','IMPORTANT','MINOR']),
          finding: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          required_change: z.string().min(1),
        })).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        job_memory_path: z.string(),
        expected_job_sha: z.string(),
        reviewed_job_record_text: z.string(),
        next_role: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, job_record_sha, planning_revision, result, findings, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to record planning review.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(current)
      if (!executionContract) return invalidExecutionContract()
      const reviewableLifecycle = current.lifecycle === 'DRAFT' || (executionContract === 'NEXT' && current.lifecycle === 'IN_PROGRESS')
      if (current.job_id !== job_id || current.project_id !== project_id || !reviewableLifecycle || current.planning_revision !== planning_revision) {
        return { content: [{ type: 'text', text: 'Planning review target does not match the current reviewable planning revision.' }], isError: true }
      }
      if (!(current.repository_discovery?.structure_evidence ?? []).length) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: repository structure evidence is required before planning review.' }], isError: true }
      }
      if (!current.planning_context?.job_sizing?.size || !(current.planning_context?.job_sizing?.context_boundary ?? []).length) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: V2 Job sizing and context boundary evidence are required before planning review.' }], isError: true }
      }
      if (!current.planning_context?.relationship_scan_summary) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: relationship mapping summary is required before planning review.' }], isError: true }
      }
      if (current.planning_context?.work_context === 'BROWNFIELD' && !(current.planning_context?.brownfield_logic_review ?? []).length) {
        return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: brownfield logic review evidence is required before planning review.' }], isError: true }
      }
      if (executionContract === 'NEXT') {
        const executionTopologyError = validateExecutionTopology(current.tasks ?? [], current.topology ?? [])
        if (executionTopologyError) return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: ' + executionTopologyError }], isError: true }
      }
      const cp4PlanningError = validateNextPlanningModel(executionContract, current.tasks ?? [], {
        evidence_needs: current.evidence_needs ?? [],
        test_checkpoints: current.test_checkpoints ?? [],
        evidence_requirements: current.evidence_requirements ?? [],
        milestones: current.milestones ?? [],
        planning_topology: current.planning_topology ?? [],
      }, planning_revision)
      if (cp4PlanningError) return { content: [{ type: 'text', text: 'PLANNING_REVIEW_INVALID: ' + cp4PlanningError }], isError: true }
      if (result === 'PASS' && (findings ?? []).some((f: any) => ['CRITICAL','IMPORTANT'].includes(f.severity))) {
        return { content: [{ type: 'text', text: 'PASS cannot contain unresolved CRITICAL/IMPORTANT planning findings.' }], isError: true }
      }
      const verificationId = uuidv7()
      const verificationMemoryPath = verificationPath(project_id, verificationId, executionContract)
      const verification = {
        verification_id: verificationId,
        kind: 'PLANNING_REVIEW',
        project_id,
        job_id,
        planning_revision,
        producer: 'reviewer',
        execution_contract: executionContract,
        result,
        findings: findings ?? [],
        limitations: limitations ?? [],
        repository_structure_evidence: current.repository_discovery.structure_evidence,
        selected_source_evidence: current.repository_discovery.selected_source_evidence ?? [],
        planning_context: current.planning_context ?? null,
        created_at: new Date().toISOString(),
      }
      const reviewedJob = {
        ...current,
        planning_review: {
          status: result,
          reviewed_revision: planning_revision,
          verification_ref: verificationMemoryPath,
        },
        updated_at: new Date().toISOString(),
      }
      const jobMemoryPath = recordPath(project_id, 'JOBS', job_id, executionContract)
      const nextRole = result === 'PASS' ? 'orchestrator' : result === 'CHANGES_REQUIRED' ? 'planner' : result === 'HUMAN_REVIEW_REQUIRED' ? 'human' : 'orchestrator'
      const steps = [
        'Persist verification_record_text first at verification_memory_path after authorize_memory_mutation(create).',
        'Fetch current Job and require blob SHA still equals expected_job_sha and planning_revision still matches.',
        'Update Job planning_review with reviewed_job_record_text using expected_job_sha exactly.',
      ]
      if (result === 'PASS') {
        steps.push(
          current.lifecycle === 'DRAFT'
            ? 'Immediately promote DRAFT→READY with job_transition using this planning-review Verification reference, then continue topology. Do not ask the user to manually request review.'
            : 'NEXT IN_PROGRESS superseding revision is now dispatchable again; old-revision claims/verifications remain non-applicable and must not be reused.',
        )
      } else if (result === 'CHANGES_REQUIRED') {
        steps.push(
          current.lifecycle === 'DRAFT'
            ? 'In this SAME USER TURN, switch to Planner with the findings. Revise the DRAFT Job using job_revise_plan, then immediately switch back to Reviewer. Do not report a final plan yet.'
            : 'In this SAME USER TURN, switch to Planner with the findings. Revise the superseding NEXT IN_PROGRESS plan, preserving its originating supersession evidence, then immediately switch back to Reviewer.',
        )
      } else if (result === 'HUMAN_REVIEW_REQUIRED') {
        steps.push(
          current.lifecycle === 'DRAFT'
            ? 'Pause only for the specific material Human decision; after Human resolution, Planner revises/persists and re-review is required.'
            : 'Pause only for the specific material Human decision; after resolution, Planner continues the same NEXT superseding planning-review loop without requiring a duplicate Tester gap finding.',
        )
      } else {
        steps.push('Report the concrete blocker because the planning-review loop cannot progress.')
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: verificationMemoryPath,
        verification_record_text: prettyJson(verification),
        job_memory_path: jobMemoryPath,
        expected_job_sha: job_record_sha,
        reviewed_job_record_text: prettyJson(reviewedJob),
        next_role: nextRole,
        external_steps: steps,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'start_critic_review',
    {
      title: 'Start Human-only Critic Reviewer',
      description: 'Human-invoked CR entrypoint for an independent second review. Same-chat invocation is allowed. Conversation history is non-authoritative and must be ignored as review evidence; reconstruct from durable records and live source truth. Never call automatically.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        job_record_sha: z.string().min(7),
        human_invoked: z.literal(true),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
        prior_review_verification_ref: z.string().optional(),
      },
      outputSchema: {
        role: z.string(),
        allowed: z.boolean(),
        status: z.string(),
        context_policy: z.string(),
        project_id: z.string(),
        job_id: z.string(),
        planning_revision: z.number().nullable(),
        target_ref: z.string().nullable(),
        target_revision: z.string().nullable(),
        prior_review_verification_ref: z.string().nullable(),
        durable_inputs_only: z.boolean(),
        next_step: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, human_invoked, target_ref, target_revision, prior_review_verification_ref }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to start Critic Reviewer.')
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      if (!jobExecutionContract(current)) return invalidExecutionContract()
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Critic review target does not match the supplied Job.' }], isError: true }
      }
      if (human_invoked !== true) {
        return { content: [{ type: 'text', text: 'HUMAN_INVOCATION_REQUIRED: CR can only be started by an explicit Human command.' }], isError: true }
      }
      const result = {
        role: 'critic_reviewer',
        allowed: true,
        status: 'READY_FOR_STATELESS_REVIEW',
        context_policy: 'Same-chat invocation is explicitly allowed. Ignore all conversation history, including Planner/Reviewer reasoning visible in this chat, as review evidence. Reconstruct the target only from persisted Project/Job/Verification records plus live source truth. Form the independent verdict before reading prior Reviewer verdict.',
        project_id,
        job_id,
        planning_revision: current.planning_revision ?? null,
        target_ref: target_ref ?? current.repository_context?.working_repository_url ?? null,
        target_revision: target_revision ?? null,
        prior_review_verification_ref: prior_review_verification_ref ?? current.planning_review?.verification_ref ?? null,
        durable_inputs_only: true,
        next_step: 'Proceed now even if Planner/Reviewer ran earlier in this same chat. Load critic_reviewer harness + critic-review skill, disregard chat-history reasoning, reconstruct from durable records/live source, perform blind review, then compare prior Reviewer last and persist with critic_review_record.',
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'critic_review_record',
    {
      title: 'Record independent Critic Reviewer Verification',
      description: 'Persist CRITIC_REVIEW evidence only. Does not modify Job lifecycle or source.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        planning_revision: z.number().int().positive().optional(),
        human_invoked: z.literal(true),
        result: z.enum(['PASS','PASS_WITH_FINDINGS','FAIL','BLOCKED']),
        findings: z.array(z.object({
          severity: z.enum(['CRITICAL','IMPORTANT','MINOR']),
          finding: z.string().min(1),
          evidence: z.array(z.string()).default([]),
          suggested_followup: z.string().optional(),
        })).default([]),
        limitations: z.array(z.string()).default([]),
        prior_review_verification_ref: z.string().optional(),
        prior_review_comparison: z.object({
          compared_after_independent_verdict: z.literal(true),
          agreement: z.enum(['AGREE','PARTIAL_DISAGREEMENT','DISAGREE','NO_PRIOR_REVIEW']),
          notes: z.array(z.string()).default([]),
        }),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        job_mutated: z.boolean(),
        next_role: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, planning_revision, human_invoked, result, findings, limitations, prior_review_verification_ref, prior_review_comparison, target_ref, target_revision }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to record Critic Review.')
      if (human_invoked !== true) {
        return { content: [{ type: 'text', text: 'CRITIC_REVIEW_REJECTED: explicit Human invocation is mandatory.' }], isError: true }
      }
      let current: any
      try { current = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(current)
      if (!executionContract) return invalidExecutionContract()
      if (current.job_id !== job_id || current.project_id !== project_id) {
        return { content: [{ type: 'text', text: 'Critic review target does not match the supplied Job.' }], isError: true }
      }
      if (planning_revision != null && current.planning_revision !== planning_revision) {
        return { content: [{ type: 'text', text: 'Critic review planning revision does not match the supplied Job snapshot.' }], isError: true }
      }
      if (result === 'PASS' && (findings ?? []).length > 0) {
        return { content: [{ type: 'text', text: 'Use PASS_WITH_FINDINGS when CR has findings.' }], isError: true }
      }
      const verificationId = uuidv7()
      const memoryPath = verificationPath(project_id, verificationId, executionContract)
      const verification = {
        verification_id: verificationId,
        kind: 'CRITIC_REVIEW',
        project_id,
        job_id,
        planning_revision: planning_revision ?? current.planning_revision ?? null,
        producer: 'critic_reviewer',
        execution_contract: executionContract,
        human_invoked: true,
        target_ref: target_ref ?? current.repository_context?.working_repository_url ?? null,
        target_revision: target_revision ?? null,
        result,
        findings: findings ?? [],
        limitations: limitations ?? [],
        prior_review_verification_ref: prior_review_verification_ref ?? current.planning_review?.verification_ref ?? null,
        prior_review_comparison,
        job_lifecycle_at_review: current.lifecycle,
        created_at: new Date().toISOString(),
      }
      const out = {
        verification_id: verificationId,
        verification_memory_path: memoryPath,
        verification_record_text: prettyJson(verification),
        job_mutated: false,
        next_role: 'human',
        external_steps: [
          'Persist verification_record_text at verification_memory_path after authorize_memory_mutation(create).',
          'Do not update the Job record or lifecycle from CR output.',
          'Present the independent verdict and any disagreement to Human for the next decision.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'checkpoint_claim_prepare',
    {
      title: 'Prepare NEXT Tester checkpoint claim',
      description: 'NEXT-only deterministic checkpoint claim/lease preparation. The claim path is keyed by project/job/planning_revision/checkpoint_id and is the sole serialization point for the live lease token.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1),
        claimant_run_id: z.string().uuid(),
        claimant_run_record_text: z.string().min(2),
        claimant_run_record_sha: z.string().min(7),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        attempt_kind: z.enum(['TEST','RETEST']).default('TEST'),
        retest_of_verification_id: z.string().min(1).optional(),
        repair_goal_recheck_record_text: z.string().min(2).optional(),
        repair_goal_recheck_verification_ref: z.string().min(1).optional(),
        completed_task_run_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        prerequisite_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        prerequisite_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        lease_seconds: z.number().int().min(60).max(3600).default(900),
        current_claim_record_text: z.string().min(2).optional(),
        current_claim_record_sha: z.string().min(7).optional(),
      },
      outputSchema: {
        disposition: z.enum(['CLAIM','REUSE','ALREADY_SATISFIED']),
        claim_memory_path: z.string(),
        claim_operation: z.enum(['CREATE','UPDATE','NONE']),
        expected_claim_sha: z.string().nullable(),
        claim_record_text: z.string().nullable(),
        attempt_memory_path: z.string().nullable(),
        attempt_record_text: z.string().nullable(),
        attempt_id: z.string().nullable(),
        lease_token: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, checkpoint_id, claimant_run_id, claimant_run_record_text, claimant_run_record_sha, target_ref, target_revision, attempt_kind, retest_of_verification_id, repair_goal_recheck_record_text, repair_goal_recheck_verification_ref, completed_task_run_snapshots, prerequisite_claim_snapshots, prerequisite_verification_snapshots, lease_seconds, current_claim_record_text, current_claim_record_sha }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to claim a NEXT checkpoint.')
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      if (job.project_id !== project_id || job.job_id !== job_id || jobExecutionContract(job) !== 'NEXT') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: owning Job must be the current NEXT Job.' }], isError: true }
      }
      let claimantRun: any
      try { claimantRun = JSON.parse(claimant_run_record_text) } catch {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: invalid claimant Tester Run JSON.' }], isError: true }
      }
      const claimantContract = resolveExecutionContract(claimantRun.execution_contract)
      if (
        claimantContract !== 'NEXT' ||
        claimantRun.project_id !== project_id ||
        claimantRun.job_id !== job_id ||
        claimantRun.run_id !== claimant_run_id ||
        claimantRun.role !== 'tester' ||
        claimantRun.lifecycle !== 'IN_PROGRESS' ||
        claimantRun.planning_revision !== job.planning_revision ||
        (claimantRun.target_ref && claimantRun.target_ref !== target_ref) ||
        (claimantRun.target_revision && claimantRun.target_revision !== target_revision)
      ) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: claimant must be the current IN_PROGRESS NEXT Tester Run for this exact target.' }], isError: true }
      }
      if (!['READY','IN_PROGRESS'].includes(job.lifecycle)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: owning NEXT Job is not executable.' }], isError: true }
      }
      if (job.planning_review?.status !== 'PASS' || job.planning_review?.reviewed_revision !== job.planning_revision) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current NEXT planning revision is not Reviewer PASS.' }], isError: true }
      }
      const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpoint_id && item.planning_revision === job.planning_revision)
      if (!checkpoint) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: checkpoint is not part of the current planning revision.' }], isError: true }
      }
      const prerequisiteClaims = parseDurableSnapshots(prerequisite_claim_snapshots ?? [], 'prerequisite_claim_snapshots')
      if (prerequisiteClaims.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteClaims.error }], isError: true }
      const prerequisiteClaimError = validateClaimSnapshots(prerequisiteClaims.entries, 'prerequisite_claim_snapshots')
      if (prerequisiteClaimError) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteClaimError }], isError: true }
      const prerequisiteVerifications = parseDurableSnapshots(prerequisite_verification_snapshots ?? [], 'prerequisite_verification_snapshots')
      if (prerequisiteVerifications.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteVerifications.error }], isError: true }
      const prerequisiteVerificationError = validateVerificationSnapshots(prerequisiteVerifications.entries, 'prerequisite_verification_snapshots')
      if (prerequisiteVerificationError) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + prerequisiteVerificationError }], isError: true }
      const completedRuns = parseDurableSnapshots(completed_task_run_snapshots ?? [], 'completed_task_run_snapshots')
      if (completedRuns.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + completedRuns.error }], isError: true }
      const completedTaskState = validateCompletedTaskRunSnapshots(job, completedRuns.entries)
      if (completedTaskState.error) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: ' + completedTaskState.error }], isError: true }
      const completedTaskIds = completedTaskState.completed
      if (checkpoint.boundary === 'BEFORE_NODE' && checkpoint.boundary_node_id && completedTaskIds.has(checkpoint.boundary_node_id)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_BOUNDARY_MISSED: BEFORE_NODE target is already durably completed: ' + checkpoint.boundary_node_id }], isError: true }
      }
      const runtimePrerequisiteIds = checkpointBoundaryPrerequisiteIds(job, checkpoint)
      for (const prerequisiteId of runtimePrerequisiteIds) {
        const prerequisiteCheckpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === prerequisiteId)
        if (prerequisiteCheckpoint) {
          const prerequisiteClaimMatches = prerequisiteClaims.entries.filter((entry: any) => {
            const item = entry.record
            return item?.kind === 'CHECKPOINT_CLAIM' &&
              item.project_id === project_id &&
              item.job_id === job_id &&
              item.planning_revision === job.planning_revision &&
              item.checkpoint_id === prerequisiteId &&
              entry.path === checkpointClaimPath(project_id, job_id, job.planning_revision, prerequisiteId)
          })
          const prerequisiteClaim = prerequisiteClaimMatches.length === 1 ? prerequisiteClaimMatches[0].record : null
          const prerequisiteVerificationMatches = prerequisiteClaim
            ? prerequisiteVerifications.entries.filter((entry: any) =>
                entry.record?.verification_id === prerequisiteClaim.last_verification_id &&
                entry.path === verificationPath(project_id, prerequisiteClaim.last_verification_id, 'NEXT')
              )
            : []
          const prerequisiteVerification = prerequisiteVerificationMatches.length === 1 ? prerequisiteVerificationMatches[0].record : null
          if (!checkpointVerificationApplicable(job, prerequisiteCheckpoint, prerequisiteClaim, prerequisiteVerification)) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_PREREQUISITE_BLOCKED: prerequisite checkpoint is not satisfied/applicable: ' + prerequisiteId }], isError: true }
          }
        } else if (!completedTaskIds.has(prerequisiteId)) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_PREREQUISITE_BLOCKED: prerequisite Task is not durably completed: ' + prerequisiteId }], isError: true }
        }
      }
      const claimPath = checkpointClaimPath(project_id, job_id, job.planning_revision, checkpoint_id)
      let current: any = null
      if (current_claim_record_text) {
        if (!current_claim_record_sha) return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim SHA is required with current claim text.' }], isError: true }
        try { current = JSON.parse(current_claim_record_text) } catch {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim JSON is invalid.' }], isError: true }
        }
        if (current.kind !== 'CHECKPOINT_CLAIM' || current.project_id !== project_id || current.job_id !== job_id || current.planning_revision !== job.planning_revision || current.checkpoint_id !== checkpoint_id) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: current claim identity/revision mismatch.' }], isError: true }
        }
        if (current.state === 'ACTIVE' && !checkpointLeaseExpired(current)) {
          if (current.claimant_run_id === claimant_run_id && current.target_revision === target_revision) {
            const out = {
              disposition: 'REUSE',
              claim_memory_path: claimPath,
              claim_operation: 'NONE',
              expected_claim_sha: current_claim_record_sha,
              claim_record_text: null,
              attempt_memory_path: checkpointAttemptPath(project_id, current.attempt_id),
              attempt_record_text: null,
              attempt_id: current.attempt_id,
              lease_token: current.lease_token,
              external_steps: [
                'Reuse the existing active attempt/token; do not create another claim or attempt record.',
                'Read the existing attempt record at attempt_memory_path before continuing Tester execution.',
              ],
            }
            return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
          }
          return { content: [{ type: 'text', text: 'CHECKPOINT_ALREADY_CLAIMED: another non-expired live lease owns this checkpoint revision.' }], isError: true }
        }
        if (['SATISFIED','OBSERVED'].includes(current.state) && attempt_kind === 'TEST') {
          const out = {
            disposition: 'ALREADY_SATISFIED',
            claim_memory_path: claimPath,
            claim_operation: 'NONE',
            expected_claim_sha: current_claim_record_sha,
            claim_record_text: null,
            attempt_memory_path: null,
            attempt_record_text: null,
            attempt_id: null,
            lease_token: null,
            external_steps: ['Use the current terminal claim plus its last_verification_id for evidence gating; do not create a duplicate TEST attempt.'],
          }
          return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
        }
        if (current.state === 'NEEDS_PLANNER_REVISION') {
          return { content: [{ type: 'text', text: 'CHECKPOINT_PLAN_REVISION_REQUIRED: PLAN_GAP/SPEC_GAP must be resolved by a new reviewed planning revision; do not RETEST this revision.' }], isError: true }
        }
        const reclaimingExpiredActive = current.state === 'ACTIVE' && checkpointLeaseExpired(current)
        if (reclaimingExpiredActive && current.attempt_kind !== attempt_kind) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_RECLAIM_REJECTED: expired lease reclaim must preserve the original attempt_kind.' }], isError: true }
        }
        if (attempt_kind === 'RETEST' && reclaimingExpiredActive) {
          if (current.target_revision !== target_revision || current.prior_verification_id !== retest_of_verification_id) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: expired RETEST reclaim must preserve the same Retest target and originating Verification.' }], isError: true }
          }
        } else if (attempt_kind === 'RETEST') {
          if (!current.retest_required || !retest_of_verification_id || current.last_verification_id !== retest_of_verification_id) {
            return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: RETEST must reference the terminal verification that requested Retest.' }], isError: true }
          }
          if (current.last_failure_class === 'PRODUCT_FAILURE') {
            if (current.last_target_revision === target_revision) {
              return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: PRODUCT_FAILURE Retest requires a repaired target revision/state.' }], isError: true }
            }
            if (!repair_goal_recheck_record_text || !repair_goal_recheck_verification_ref) {
              return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: PRODUCT_FAILURE Retest requires the repaired revision Goal Recheck.' }], isError: true }
            }
            let goal: any
            try { goal = JSON.parse(repair_goal_recheck_record_text) } catch {
              return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: invalid repair Goal Recheck JSON.' }], isError: true }
            }
            const expectedGoalRef = verificationPath(project_id, goal.verification_id, 'NEXT')
            const validGoal =
              goal.kind === 'GOAL_RECHECK' &&
              goal.execution_contract === 'NEXT' &&
              goal.project_id === project_id &&
              goal.job_id === job_id &&
              goal.target_revision === target_revision &&
              ['PASS','PASS_RETEST_REQUIRED'].includes(goal.result) &&
              !(goal.criteria ?? []).some((item: any) => item.result === 'NOT_MET') &&
              !(goal.scope_drift ?? []).length &&
              repair_goal_recheck_verification_ref === expectedGoalRef
            if (!validGoal) {
              return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: repair Goal Recheck must match the repaired target revision and have no NOT_MET/scope drift.' }], isError: true }
            }
          }
        } else if (current.state !== 'ACTIVE') {
          return { content: [{ type: 'text', text: 'CHECKPOINT_CLAIM_REJECTED: terminal/blocked checkpoint requires an explicit RETEST claim.' }], isError: true }
        }
      } else if (attempt_kind === 'RETEST') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_RETEST_REJECTED: RETEST requires the current terminal claim record.' }], isError: true }
      }

      const attemptId = uuidv7()
      const leaseToken = uuidv7()
      const now = new Date()
      const expires = new Date(now.getTime() + Number(lease_seconds ?? 900) * 1000)
      const generation = Number(current?.generation ?? 0) + 1
      const claim = {
        kind: 'CHECKPOINT_CLAIM',
        project_id,
        job_id,
        execution_contract: 'NEXT',
        planning_revision: job.planning_revision,
        checkpoint_id,
        mode: checkpoint.mode,
        state: 'ACTIVE',
        generation,
        attempt_id: attemptId,
        attempt_kind,
        lease_token: leaseToken,
        claimant_run_id,
        lease_expires_at: expires.toISOString(),
        target_ref,
        target_revision,
        prior_verification_id: retest_of_verification_id ?? current?.last_verification_id ?? null,
        last_verification_id: current?.last_verification_id ?? null,
        last_result: current?.last_result ?? null,
        last_failure_class: current?.last_failure_class ?? null,
        last_target_revision: current?.last_target_revision ?? null,
        retest_required: false,
        updated_at: now.toISOString(),
      }
      const attempt = {
        kind: 'CHECKPOINT_ATTEMPT',
        attempt_id: attemptId,
        project_id,
        job_id,
        execution_contract: 'NEXT',
        planning_revision: job.planning_revision,
        checkpoint_id,
        mode: checkpoint.mode,
        attempt_kind,
        lease_token: leaseToken,
        claimant_run_id,
        target_ref,
        target_revision,
        state: 'STARTED',
        retest_of_verification_id: retest_of_verification_id ?? null,
        started_at: now.toISOString(),
      }
      const attemptPath = checkpointAttemptPath(project_id, attemptId)
      const claimOperation = current ? 'UPDATE' : 'CREATE'
      const externalSteps = [
        'Immediately read back the claimant Tester Run from NEXT memory and require blob SHA equals claimant_run_record_sha plus role=tester, lifecycle=IN_PROGRESS, same project/job/run/target before any claim mutation.',
        claimOperation === 'CREATE'
          ? 'Call authorize_memory_mutation(create) for claim_memory_path, then create the deterministic claim record. Concurrent create failure means another claimant won; refetch instead of retrying blind.'
          : 'Immediately refetch claim_memory_path and require its blob SHA equals expected_claim_sha; authorize/update with exact SHA. Stale SHA means another claimant/reclaimer won.',
        'Read back the claim and require lease_token/attempt_id/generation exactly match this grant before creating the attempt child.',
        'Call authorize_memory_mutation(create) for attempt_memory_path and create attempt_record_text. Duplicate create means replay; read existing attempt and require the same lease_token.',
        ...durableSnapshotReadbackSteps(completed_task_run_snapshots ?? [], 'completed Task Run snapshot'),
        ...durableSnapshotReadbackSteps(prerequisite_claim_snapshots ?? [], 'prerequisite checkpoint claim snapshot'),
        ...durableSnapshotReadbackSteps(prerequisite_verification_snapshots ?? [], 'prerequisite checkpoint Verification snapshot'),
        'Task prerequisite completion is derived only from successful COMPLETED NEXT Run snapshots bound to the current planning_revision and expected topology handler.',
        'For MILESTONE_GATE and JOB_FINAL, runtime prerequisites are expanded from the current milestone/planning_topology; BEFORE_NODE is rejected once its boundary Task is already completed.',
        'Only the current durable lease token may produce terminal Tester Verification.',
        current?.last_failure_class === 'PRODUCT_FAILURE' && attempt_kind === 'RETEST' && current.state !== 'ACTIVE'
          ? 'Read back repair_goal_recheck_verification_ref and require it equals the supplied Goal Recheck for the repaired target revision before Tester execution.'
          : 'No additional repair Goal Recheck read-back is required for this claim/reclaim kind.',
      ]
      const out = {
        disposition: 'CLAIM',
        claim_memory_path: claimPath,
        claim_operation: claimOperation,
        expected_claim_sha: current_claim_record_sha ?? null,
        claim_record_text: prettyJson(claim),
        attempt_memory_path: attemptPath,
        attempt_record_text: prettyJson(attempt),
        attempt_id: attemptId,
        lease_token: leaseToken,
        external_steps: externalSteps,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'checkpoint_verification_prepare',
    {
      title: 'Prepare NEXT Tester checkpoint Verification',
      description: 'Prepare append-preserving TEST/RETEST Verification and the terminal deterministic claim update. Applicability requires the claim to finalize with the same attempt/token/verification id.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        checkpoint_id: z.string().min(1),
        claim_record_text: z.string().min(2),
        claim_record_sha: z.string().min(7),
        tester_run_record_text: z.string().min(2),
        tester_run_record_sha: z.string().min(7),
        attempt_id: z.string().uuid(),
        lease_token: z.string().uuid(),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        result: z.enum(['PASS','FAIL','BLOCKED','OBSERVED','UNVERIFIED']),
        failure_class: z.enum(['PRODUCT_FAILURE','TEST_FAILURE','ENVIRONMENT_FAILURE','NOT_READY','INTEGRATION_NOT_READY','SPEC_GAP','PLAN_GAP']).optional(),
        evidence_refs: z.array(z.string()).default([]),
        evidence_bundle_attestation_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).max(8).default([]),
        measurements: z.array(z.object({ name: z.string().min(1), value: z.any() })).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        verification_memory_path: z.string(),
        verification_record_text: z.string(),
        claim_memory_path: z.string(),
        expected_claim_sha: z.string(),
        next_claim_record_text: z.string(),
        route: z.enum(['CONTINUE','CODER_REPAIR_GOAL_RECHECK_RETEST','PLANNER_REVISION_SUPERSEDE','RETEST_WHEN_READY']),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, checkpoint_id, claim_record_text, claim_record_sha, tester_run_record_text, tester_run_record_sha, attempt_id, lease_token, target_ref, target_revision, result, failure_class, evidence_refs, evidence_bundle_attestation_snapshots, measurements, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare checkpoint Verification.')
      let job: any, claim: any
      try { job = JSON.parse(job_record_text); claim = JSON.parse(claim_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job/claim JSON.' }], isError: true }
      }
      if (job.project_id !== project_id || job.job_id !== job_id || jobExecutionContract(job) !== 'NEXT') {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: owning Job must be the current NEXT Job.' }], isError: true }
      }
      let testerRun: any
      try { testerRun = JSON.parse(tester_run_record_text) } catch {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: invalid Tester Run JSON.' }], isError: true }
      }
      if (
        resolveExecutionContract(testerRun.execution_contract) !== 'NEXT' ||
        testerRun.project_id !== project_id ||
        testerRun.job_id !== job_id ||
        testerRun.run_id !== claim.claimant_run_id ||
        testerRun.role !== 'tester' ||
        testerRun.lifecycle !== 'IN_PROGRESS' ||
        testerRun.planning_revision !== job.planning_revision
      ) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: Verification must be produced by the current IN_PROGRESS NEXT Tester Run that owns the lease.' }], isError: true }
      }
      const checkpoint = (job.test_checkpoints ?? []).find((item: any) => item.checkpoint_id === checkpoint_id && item.planning_revision === job.planning_revision)
      if (!checkpoint) return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: checkpoint not in current planning revision.' }], isError: true }
      if (
        claim.kind !== 'CHECKPOINT_CLAIM' ||
        claim.project_id !== project_id ||
        claim.job_id !== job_id ||
        claim.planning_revision !== job.planning_revision ||
        claim.checkpoint_id !== checkpoint_id ||
        claim.state !== 'ACTIVE' ||
        claim.attempt_id !== attempt_id ||
        claim.lease_token !== lease_token
      ) {
        return { content: [{ type: 'text', text: 'STALE_CHECKPOINT_LEASE: claim/attempt/token is no longer the active lease.' }], isError: true }
      }
      if (checkpointLeaseExpired(claim)) {
        return { content: [{ type: 'text', text: 'STALE_CHECKPOINT_LEASE: lease expired; reclaim before producing Verification.' }], isError: true }
      }
      if (claim.target_revision !== target_revision || claim.target_ref !== target_ref) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: target revision/state differs from the claimed attempt.' }], isError: true }
      }
      const workingRepo = normalizeGithubRepo(job?.repository_context?.working_repository_url || '')?.full_name ?? null
      if ((evidence_bundle_attestation_snapshots ?? []).length && !workingRepo) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: current Job working repository is unavailable for EvidenceBundle attestation validation.' }], isError: true }
      }
      const bundleKeys = new Set<string>()
      const validatedBundles: any[] = []
      const attestationRefs: any[] = []
      for (const snapshot of evidence_bundle_attestation_snapshots ?? []) {
        const attested = validateEvidenceBundleAttestationSnapshot(snapshot, {
          project_id,
          job_id,
          checkpoint_id,
          attempt_id,
          run_id: testerRun.run_id,
          target_ref,
          target_revision,
          repository_full_name: workingRepo,
        })
        if (attested.error) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: ' + attested.error }], isError: true }
        }
        const bundle = attested.bundle
        const key = bundle.backend === 'PRIVATE_SUPABASE'
          ? 'PRIVATE:' + bundle.evidence_bundle_id
          : 'REPO:' + bundle.evidence_commit_sha + ':' + bundle.manifest_path
        if (bundleKeys.has(key)) {
          return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: duplicate EvidenceBundle attestation.' }], isError: true }
        }
        bundleKeys.add(key)
        validatedBundles.push(bundle)
        attestationRefs.push({ path: attested.ref, sha: attested.sha })
      }
      if (!['PASS','OBSERVED'].includes(result) && !failure_class) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: non-success result requires failure_class.' }], isError: true }
      }
      if (['PASS','OBSERVED'].includes(result) && failure_class) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: successful/observed evidence cannot carry a failure_class.' }], isError: true }
      }
      if (['PASS','OBSERVED'].includes(result) && !(evidence_refs ?? []).length && !validatedBundles.length && !(measurements ?? []).length) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: successful/observed result requires durable evidence bundle/ref or measurement.' }], isError: true }
      }
      if (result === 'OBSERVED' && !['MEASURE','PROBE'].includes(checkpoint.mode)) {
        return { content: [{ type: 'text', text: 'CHECKPOINT_VERIFICATION_REJECTED: OBSERVED is only valid for MEASURE/PROBE.' }], isError: true }
      }

      const verificationId = uuidv7()
      const successful = result === 'PASS' || result === 'OBSERVED'
      const plannerGap = ['PLAN_GAP','SPEC_GAP'].includes(failure_class ?? '')
      const productFailure = failure_class === 'PRODUCT_FAILURE'
      const state = result === 'PASS' ? 'SATISFIED' : result === 'OBSERVED' ? 'OBSERVED' : plannerGap ? 'NEEDS_PLANNER_REVISION' : productFailure ? 'FAILED_PRODUCT' : 'BLOCKED'
      const route = successful ? 'CONTINUE' : plannerGap ? 'PLANNER_REVISION_SUPERSEDE' : productFailure ? 'CODER_REPAIR_GOAL_RECHECK_RETEST' : 'RETEST_WHEN_READY'
      const retestRequired = !successful && !plannerGap
      const applicabilityStatus = successful ? 'CANDIDATE' : 'NON_APPLICABLE'
      const now = new Date().toISOString()
      const verification = {
        verification_id: verificationId,
        kind: claim.attempt_kind === 'RETEST' ? 'RETEST' : 'TEST',
        project_id,
        job_id,
        execution_contract: 'NEXT',
        planning_revision: job.planning_revision,
        checkpoint_id,
        attempt_id,
        attempt_kind: claim.attempt_kind,
        lease_token,
        mode: checkpoint.mode,
        target_ref,
        target_revision,
        run_id: testerRun.run_id,
        producer: 'tester',
        result,
        failure_class: failure_class ?? null,
        evidence_refs: evidence_refs ?? [],
        evidence_bundle_refs: validatedBundles,
        evidence_bundle_attestation_refs: attestationRefs,
        measurements: measurements ?? [],
        limitations: limitations ?? [],
        retest_of_verification_id: claim.prior_verification_id ?? null,
        applicability: {
          status: applicabilityStatus,
          planning_revision: job.planning_revision,
          checkpoint_id,
          evidence_need_ids: checkpoint.evidence_need_ids ?? [],
          target_revision,
        },
        route,
        created_at: now,
      }
      const nextClaim = {
        ...claim,
        state,
        lease_expires_at: null,
        last_verification_id: verificationId,
        last_result: result,
        last_failure_class: failure_class ?? null,
        last_target_revision: target_revision,
        retest_required: retestRequired,
        updated_at: now,
      }
      const verificationPathValue = verificationPath(project_id, verificationId, 'NEXT')
      const claimPath = checkpointClaimPath(project_id, job_id, job.planning_revision, checkpoint_id)
      const out = {
        verification_id: verificationId,
        verification_memory_path: verificationPathValue,
        verification_record_text: prettyJson(verification),
        claim_memory_path: claimPath,
        expected_claim_sha: claim_record_sha,
        next_claim_record_text: prettyJson(nextClaim),
        route,
        external_steps: [
          ...durableSnapshotReadbackSteps(evidence_bundle_attestation_snapshots ?? [], 'EvidenceBundle attestation snapshot'),
          'Immediately read back the Tester Run and require blob SHA equals tester_run_record_sha plus role=tester, lifecycle=IN_PROGRESS and run_id=claim.claimant_run_id.',
        'Immediately refetch claim_memory_path and require blob SHA, state=ACTIVE, attempt_id and lease_token still match this preparation. Stale/expired claim blocks persistence.',
          'Authorize/create verification_memory_path and persist verification_record_text append-only.',
          'Then authorize/update claim_memory_path with next_claim_record_text using expected_claim_sha exactly.',
          'If the claim update loses CAS, the Verification is orphaned/non-applicable because evidence gates require current claim.last_verification_id + attempt/token match. Refetch and reconcile; never treat the orphan as PASS.',
          successful
            ? 'The terminal claim can satisfy gates only after read-back proves last_verification_id points to this Verification.'
            : route === 'PLANNER_REVISION_SUPERSEDE'
              ? 'Route to Planner. A later reviewed planning_revision uses a different deterministic claim namespace and makes this revision non-applicable.'
              : route === 'CODER_REPAIR_GOAL_RECHECK_RETEST'
                ? 'Route to owning Coder repair. After exact Goal Recheck, claim RETEST against the repaired target revision.'
                : 'Retest only after the blocking test/environment/integration condition is ready.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'checkpoint_gate_evaluate',
    {
      title: 'Evaluate NEXT checkpoint evidence gate',
      description: 'Read-only evidence applicability guard for NEXT Task, Milestone or Job targets. V2_STABLE always preserves the legacy path.',
      inputSchema: {
        job_record_text: z.string().min(2),
        target_kind: z.enum(['TASK','MILESTONE','JOB']),
        target_id: z.string().optional(),
        checkpoint_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        checkpoint_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
      },
      outputSchema: {
        allowed: z.boolean(),
        required_checkpoint_ids: z.array(z.string()),
        blocking: z.array(z.string()),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ job_record_text, target_kind, target_id, checkpoint_claim_snapshots, checkpoint_verification_snapshots }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to evaluate checkpoint gate.')
      let job: any
      try { job = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Job JSON.' }], isError: true }
      }
      const gate = evaluateNextEvidenceGate(job, checkpoint_claim_snapshots ?? [], checkpoint_verification_snapshots ?? [], { kind: target_kind, id: target_id ?? null })
      const out = {
        ...gate,
        external_steps: jobExecutionContract(job) === 'NEXT'
          ? [
              ...durableSnapshotReadbackSteps(checkpoint_claim_snapshots ?? [], 'checkpoint claim snapshot'),
              ...durableSnapshotReadbackSteps(checkpoint_verification_snapshots ?? [], 'checkpoint Verification snapshot'),
            ]
          : [],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'run_begin',
    {
      title: 'Begin a GSA Job Run',
      description: 'Create one attributed execution Run. Call get_agent_harness for the selected role before executing work.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        job_record_text: z.string().min(2),
        role: z.enum(['planner','designer','coder','reviewer','tester']),
        scope_claim: z.array(z.string()).min(1),
        primary_task_id: z.string().uuid().optional(),
        affected_task_refs: z.array(z.string()).default([]),
        parent_run_id: z.string().uuid().optional(),
        target_ref: z.string().optional(),
        target_revision: z.string().optional(),
        input_refs: z.array(z.string()).default([]),
        checkpoint_claim_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
        checkpoint_verification_snapshots: z.array(DURABLE_RECORD_SNAPSHOT_SCHEMA).default([]),
      },
      outputSchema: {
        run_id: z.string(),
        handle: z.string(),
        memory_path: z.string(),
        run_record_text: z.string(),
        next_step: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, job_record_text, role, scope_claim, primary_task_id, affected_task_refs, parent_run_id, target_ref, target_revision, input_refs, checkpoint_claim_snapshots, checkpoint_verification_snapshots }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to begin a Run.')
      let owningJob: any
      try { owningJob = JSON.parse(job_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid owning Job JSON.' }], isError: true }
      }
      const executionContract = jobExecutionContract(owningJob)
      if (!executionContract) return invalidExecutionContract()
      if (owningJob.job_id !== job_id || owningJob.project_id !== project_id || !['READY','IN_PROGRESS'].includes(owningJob.lifecycle)) {
        return { content: [{ type: 'text', text: 'Owning Job identity/lifecycle mismatch.' }], isError: true }
      }
      const currentTaskIds = new Set<string>((owningJob.tasks ?? []).map((item: any) => item.task_id))
      if (executionContract === 'NEXT' && primary_task_id && !currentTaskIds.has(primary_task_id)) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REJECTED: primary_task_id is not a Task in the current planning revision.' }], isError: true }
      }
      if (executionContract === 'NEXT' && (affected_task_refs ?? []).some((id: string) => !currentTaskIds.has(id))) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REJECTED: every affected_task_ref must be a current Task in this planning revision.' }], isError: true }
      }
      if (executionContract === 'NEXT' && ['coder','designer'].includes(role) && (owningJob.tasks ?? []).length > 0 && !primary_task_id) {
        return { content: [{ type: 'text', text: 'NEXT_TASK_BINDING_REQUIRED: NEXT source/design execution must bind one current primary Task so EvidenceRequirement guards cannot be bypassed.' }], isError: true }
      }
      if (
        executionContract === 'NEXT' &&
        (owningJob.planning_review?.status !== 'PASS' || owningJob.planning_review?.reviewed_revision !== owningJob.planning_revision)
      ) {
        return { content: [{ type: 'text', text: 'NEXT_PLAN_REVIEW_PENDING: current NEXT planning revision is not Reviewer PASS; dispatch is blocked.' }], isError: true }
      }
      if (executionContract === 'NEXT' && primary_task_id) {
        const gatedTaskIds = new Set<string>([primary_task_id])
        if (['coder','designer'].includes(role)) {
          for (const id of affected_task_refs ?? []) gatedTaskIds.add(id)
        }
        for (const taskId of gatedTaskIds) {
          const gate = evaluateNextEvidenceGate(
            owningJob,
            checkpoint_claim_snapshots ?? [],
            checkpoint_verification_snapshots ?? [],
            { kind: 'TASK', id: taskId },
          )
          if (!gate.allowed) {
            return {
              content: [{
                type: 'text',
                text: 'EVIDENCE_REQUIREMENT_BLOCKED: Task ' + taskId + ': ' + gate.blocking.join('; '),
              }],
              isError: true,
            }
          }
        }
      }
      if (
        role === 'coder' &&
        target_ref &&
        owningJob.repository_context?.working_repository_url &&
        normalizeGithubRepo(target_ref)?.url &&
        normalizeGithubRepo(target_ref)?.url !== owningJob.repository_context.working_repository_url
      ) {
        return { content: [{ type: 'text', text: 'Coder target repository does not match the Job working repository.' }], isError: true }
      }
      if (
        role === 'coder' &&
        owningJob.product_workflow === 'UX_FIRST' &&
        (owningJob.ui_strategy?.temporary_ui ?? []).length > 0 &&
        owningJob.ui_strategy?.temporary_ui_human_approval === 'REQUIRED_PENDING'
      ) {
        return {
          content: [{
            type: 'text',
            text: 'HUMAN_GATE_REQUIRED: UX_FIRST temporary UI contains user-facing provisional structure that is still REQUIRED_PENDING. Planner must obtain explicit Human approval and persist an approved Job planning revision before Coder may begin.',
          }],
          isError: true,
        }
      }
      const runId = uuidv7()
      const now = new Date().toISOString()
      const record = {
        run_id: runId,
        handle: runHandle(runId),
        project_id,
        job_id,
        execution_contract: executionContract,
        ...(executionContract === 'NEXT' ? { planning_revision: owningJob.planning_revision } : {}),
        primary_task_id: primary_task_id ?? null,
        affected_task_refs: affected_task_refs ?? [],
        parent_run_id: parent_run_id ?? null,
        role,
        target_ref: target_ref ?? null,
        target_revision: target_revision ?? null,
        scope_claim,
        input_refs: input_refs ?? [],
        lifecycle: 'IN_PROGRESS',
        derived_condition: null,
        result: null,
        output_refs: [],
        verification_refs: [],
        handoff_ref: null,
        started_at: now,
        ended_at: null,
      }
      const path = recordPath(project_id, 'RUNS', runId, executionContract)
      const result = {
        run_id: runId,
        handle: runHandle(runId),
        memory_path: path,
        run_record_text: prettyJson(record),
        next_step: 'Load get_agent_harness(role=' + role + ') and execute its loop with minimum sufficient context.',
        external_steps: [
          'Re-read current PROJECT.md and require lifecycle=ACTIVE before this consequential dispatch.',
          'The supplied owning Job snapshot has passed identity/lifecycle and UX_FIRST temporary-UI Human-Gate validation. Re-fetch it before persistence and require the same planning revision/state is still current.',
          ...(executionContract === 'NEXT'
            ? [
                ...durableSnapshotReadbackSteps(checkpoint_claim_snapshots ?? [], 'checkpoint claim snapshot'),
                ...durableSnapshotReadbackSteps(checkpoint_verification_snapshots ?? [], 'checkpoint Verification snapshot'),
              ]
            : []),
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'GitHub Memory Repo: create_file at memory_path with run_record_text before role execution begins.',
          'For coder source writes, re-read Project lifecycle and live target revision immediately before the first write.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'relationship_knowledge_prepare',
    {
      title: 'Prepare durable Project relationship knowledge',
      description: 'Prepare an existing KNOWLEDGE/ ARCHITECTURE_NOTE artifact for repo/subsystem relationship direction and reread conditions. This does not create a new record family.',
      inputSchema: {
        project_id: z.string().uuid(),
        title: z.string().min(1),
        source: z.string().min(1),
        target: z.string().min(1),
        relationship: z.string().min(1),
        precedence: z.string().min(1),
        reason: z.string().min(1),
        evidence: z.array(z.string()).default([]),
        reread_condition: z.string().min(1),
        depends_on: z.array(z.string()).default([]),
        approved_by_or_source: z.string().min(1),
      },
      outputSchema: {
        knowledge_id: z.string(),
        memory_path: z.string(),
        knowledge_record_text: z.string(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, title, source, target, relationship, precedence, reason, evidence, reread_condition, depends_on, approved_by_or_source }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to prepare relationship knowledge.')
      const knowledgeId = uuidv7()
      const now = new Date().toISOString()
      const body = [
        '---',
        'knowledge_id: ' + knowledgeId,
        'project_id: ' + project_id,
        'kind: ARCHITECTURE_NOTE',
        'title: ' + JSON.stringify(title),
        'revision: 1',
        'validity: CURRENT',
        'depends_on: ' + JSON.stringify(depends_on ?? []),
        'approved_by_or_source: ' + JSON.stringify(approved_by_or_source),
        'updated_at: ' + now,
        '---',
        '',
        '# ' + title,
        '',
        '## Relationship',
        '- source: ' + source,
        '- target: ' + target,
        '- relationship: ' + relationship,
        '- precedence: ' + precedence,
        '',
        '## Reason',
        reason,
        '',
        '## Evidence',
        ...((evidence ?? []).length ? (evidence ?? []).map((x: string) => '- ' + x) : ['- none recorded']),
        '',
        '## Reread condition',
        reread_condition,
        '',
      ].join('\n')
      const path = knowledgePath(project_id, knowledgeId, title)
      const out = {
        knowledge_id: knowledgeId,
        memory_path: path,
        knowledge_record_text: body,
        external_steps: [
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist knowledge_record_text at memory_path in the configured Memory Repo.',
          'Read back the Knowledge artifact before treating the relationship as durable Project memory.',
          'When the reread condition becomes true, re-read the current source-of-truth side before downstream planning or implementation.',
        ],
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'goal_recheck_record',
    {
      title: 'Prepare Coder Goal Recheck evidence',
      description: 'Build append-preserving GOAL_RECHECK Verification from the Coder loop. Pass the exact current owning Run record plus its current Git blob SHA; execution_contract and the Verification namespace are derived from that Run, and persistence is gated on exact Run read-back. Does not independently prove success.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        run_record_text: z.string().min(2),
        run_record_sha: z.string().min(7),
        task_id: z.string().uuid().optional(),
        target_ref: z.string().min(1),
        target_revision: z.string().min(1),
        criteria: z.array(z.object({
          criterion: z.string().min(1),
          result: z.enum(['MET','PARTIAL','NOT_MET','UNVERIFIED']),
          evidence: z.array(z.string()).default([]),
          limitation: z.string().optional(),
        })).min(1),
        scope_drift: z.array(z.string()).default([]),
        limitations: z.array(z.string()).default([]),
      },
      outputSchema: {
        verification_id: z.string(),
        memory_path: z.string(),
        owning_run_memory_path: z.string(),
        expected_run_sha: z.string(),
        verification_record_text: z.string(),
        ready_for_success_handoff: z.boolean(),
        blocking_reasons: z.array(z.string()),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    } as any,
    async ({ project_id, job_id, run_id, run_record_text, run_record_sha, task_id, target_ref, target_revision, criteria, scope_drift, limitations }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to persist Goal Recheck.')
      let owningRun: any
      try { owningRun = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid owning Run JSON.' }], isError: true }
      }
      if (!goalRecheckRunMatches(owningRun, project_id, job_id, run_id)) {
        return { content: [{ type: 'text', text: 'GOAL_RECHECK_REJECTED: owning Run identity/role/lifecycle mismatch.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(owningRun.execution_contract)
      if (!executionContract) return invalidExecutionContract()
      const verificationId = uuidv7()
      const blocking = criteria
        .filter((c: any) => c.result === 'NOT_MET')
        .map((c: any) => 'NOT_MET: ' + c.criterion)
      if ((scope_drift ?? []).length) blocking.push('Unresolved scope drift: ' + scope_drift.join('; '))
      const record = {
        verification_id: verificationId,
        kind: 'GOAL_RECHECK',
        project_id,
        job_id,
        task_id: task_id ?? null,
        run_id,
        target_ref,
        target_revision,
        producer: 'coder',
        execution_contract: executionContract,
        result: blocking.length ? 'CHANGES_REQUIRED' : (criteria.some((c: any) => c.result === 'PARTIAL' || c.result === 'UNVERIFIED') ? 'PASS_RETEST_REQUIRED' : 'PASS'),
        limitations: limitations ?? [],
        evidence_refs: criteria.flatMap((c: any) => c.evidence ?? []),
        criteria,
        scope_drift: scope_drift ?? [],
        created_at: new Date().toISOString(),
      }
      const path = verificationPath(project_id, verificationId, executionContract)
      const owningRunPath = recordPath(project_id, 'RUNS', run_id, executionContract)
      const result = {
        verification_id: verificationId,
        memory_path: path,
        owning_run_memory_path: owningRunPath,
        expected_run_sha: run_record_sha,
        verification_record_text: prettyJson(record),
        ready_for_success_handoff: blocking.length === 0,
        blocking_reasons: blocking,
        external_steps: [
          'Fetch the current owning Run at owning_run_memory_path immediately before Verification persistence.',
          'Require the fetched Run blob SHA to equal expected_run_sha exactly. Missing path or stale SHA blocks Goal Recheck persistence.',
          'Re-parse the fetched Run and require project_id/job_id/run_id, role=coder, lifecycle=IN_PROGRESS and resolved execution_contract to still match the supplied owning Run snapshot.',
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=memory_path).',
          'Persist this Verification record only after the owning Run read-back guard passes.',
          blocking.length ? 'Continue the Coder loop; do not claim success while blocking_reasons remain.' : 'If topology permits, proceed to required review/test/handoff or terminal Run completion.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'run_complete',
    {
      title: 'Complete a GSA Job Run',
      description: 'Prepare optional immutable Handoff plus terminal Run replacement. Persist referenced evidence/handoff first; update the Run last using exact blob SHA.',
      inputSchema: {
        project_id: z.string().uuid(),
        job_id: z.string().uuid(),
        run_id: z.string().uuid(),
        role: z.enum(['planner','designer','coder','reviewer','tester']),
        run_record_text: z.string().min(2),
        run_record_sha: z.string().min(7),
        lifecycle: z.enum(['COMPLETED','FAILED','CANCELLED','SUPERSEDED']),
        result: z.string().optional(),
        output_refs: z.array(z.string()).default([]),
        verification_refs: z.array(z.string()).default([]),
        goal_recheck_record_text: z.string().min(2).optional(),
        goal_recheck_verification_ref: z.string().min(1).optional(),
        handoff: z.object({
          next_role: z.enum(['planner','designer','coder','reviewer','tester']),
          primary_task_id: z.string().uuid().optional(),
          target_ref: z.string().optional(),
          target_revision: z.string().optional(),
          completed_summary: z.string().min(1),
          remaining: z.array(z.string()).default([]),
          required_inputs: z.array(z.string()).default([]),
          tester_evidence_verification_snapshot: DURABLE_RECORD_SNAPSHOT_SCHEMA.optional(),
          blocker_or_gate: z.string().optional(),
          expected_next_outcome: z.string().min(1),
        }).optional(),
      },
      outputSchema: {
        run_memory_path: z.string(),
        expected_run_sha: z.string(),
        terminal_run_record_text: z.string(),
        handoff_id: z.string().nullable(),
        handoff_memory_path: z.string().nullable(),
        handoff_record_text: z.string().nullable(),
        external_steps: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_id, job_id, run_id, role, run_record_text, run_record_sha, lifecycle, result, output_refs, verification_refs, goal_recheck_record_text, goal_recheck_verification_ref, handoff }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to complete a Run.')
      let current: any
      try { current = JSON.parse(run_record_text) } catch {
        return { content: [{ type: 'text', text: 'Invalid Run JSON.' }], isError: true }
      }
      if (current.run_id !== run_id || current.project_id !== project_id || current.job_id !== job_id || current.role !== role || current.lifecycle !== 'IN_PROGRESS') {
        return { content: [{ type: 'text', text: 'Run identity/lifecycle mismatch.' }], isError: true }
      }
      const executionContract = resolveExecutionContract(current.execution_contract)
      if (!executionContract) return invalidExecutionContract()
      if (role === 'coder' && lifecycle === 'COMPLETED') {
        if (!goal_recheck_record_text || !goal_recheck_verification_ref) {
          return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: exact GOAL_RECHECK record and its persisted verification ref are required for successful completion.' }], isError: true }
        }
        if (!(verification_refs ?? []).includes(goal_recheck_verification_ref)) {
          return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: GOAL_RECHECK verification ref must be included in verification_refs.' }], isError: true }
        }
        let goal: any
        try { goal = JSON.parse(goal_recheck_record_text) } catch {
          return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: invalid GOAL_RECHECK JSON.' }], isError: true }
        }
        const revisionMatches = !current.target_revision || !goal.target_revision || current.target_revision === goal.target_revision
        const goalExecutionContract = resolveExecutionContract(goal.execution_contract)
        const expectedGoalPath = typeof goal.verification_id === 'string' ? verificationPath(project_id, goal.verification_id, executionContract) : ''
        const persistedRefMatches = expectedGoalPath === goal_recheck_verification_ref
        const goalMatches = goal.kind === 'GOAL_RECHECK' && goal.project_id === project_id && goal.job_id === job_id && goal.run_id === run_id && goalExecutionContract === executionContract && revisionMatches && persistedRefMatches
        const unresolvedNotMet = (goal.criteria ?? []).some((x: any) => x.result === 'NOT_MET')
        const unresolvedDrift = (goal.scope_drift ?? []).length > 0
        const acceptableResult = ['PASS','PASS_RETEST_REQUIRED'].includes(goal.result)
        if (!goalMatches || unresolvedNotMet || unresolvedDrift || !acceptableResult) {
          return { content: [{ type: 'text', text: 'CODER_COMPLETION_BLOCKED: Goal Recheck must match this Run/target revision and its verification path, have no NOT_MET/unresolved scope drift, and result PASS or PASS_RETEST_REQUIRED.' }], isError: true }
        }
      }
      let handoffEvidenceBundles: any[] = []
      let handoffEvidenceAttestationRefs: any[] = []
      let handoffEvidenceVerificationRef: any = null
      if (handoff?.tester_evidence_verification_snapshot) {
        if (executionContract !== 'NEXT' || role !== 'tester' || !current.target_revision || !current.target_ref) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: durable EvidenceBundle handoff requires the exact target-bound NEXT Tester Run.' }], isError: true }
        }
        const verified = validateTesterEvidenceVerificationSnapshot(
          handoff.tester_evidence_verification_snapshot,
          {
            project_id,
            job_id,
            run_id,
            target_ref: handoff.target_ref ?? current.target_ref,
            target_revision: handoff.target_revision ?? current.target_revision,
          },
        )
        if (verified.error) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: ' + verified.error }], isError: true }
        }
        if (!(verification_refs ?? []).includes(verified.ref)) {
          return { content: [{ type: 'text', text: 'HANDOFF_EVIDENCE_REJECTED: the exact TEST/RETEST Verification ref must also be included in verification_refs.' }], isError: true }
        }
        handoffEvidenceBundles = verified.record.evidence_bundle_refs
        handoffEvidenceAttestationRefs = verified.record.evidence_bundle_attestation_refs
        handoffEvidenceVerificationRef = { path: verified.ref, sha: verified.sha }
      }
      const runPath = recordPath(project_id, 'RUNS', run_id, executionContract)
      let handoffId: string | null = null
      let handoffPath: string | null = null
      let handoffText: string | null = null
      if (handoff) {
        handoffId = uuidv7()
        handoffPath = recordPath(project_id, 'HANDOFFS', handoffId, executionContract)
        handoffText = prettyJson({
          handoff_id: handoffId,
          project_id,
          job_id,
          execution_contract: executionContract,
          source_run_id: run_id,
          next_role: handoff.next_role,
          primary_task_id: handoff.primary_task_id ?? null,
          target_ref: handoff.target_ref ?? current.target_ref ?? null,
          target_revision: handoff.target_revision ?? current.target_revision ?? null,
          completed_summary: handoff.completed_summary,
          remaining: handoff.remaining ?? [],
          required_inputs: handoff.required_inputs ?? [],
          evidence_bundle_refs: handoffEvidenceBundles,
          evidence_bundle_attestation_refs: handoffEvidenceAttestationRefs,
          evidence_verification_ref: handoffEvidenceVerificationRef,
          blocker_or_gate: handoff.blocker_or_gate ?? null,
          expected_next_outcome: handoff.expected_next_outcome,
          created_at: new Date().toISOString(),
        })
      }
      const terminal = {
        ...current,
        lifecycle,
        result: result ?? null,
        output_refs: output_refs ?? [],
        verification_refs: verification_refs ?? [],
        handoff_ref: handoffId,
        ended_at: new Date().toISOString(),
      }
      const externalSteps = [
        'Verify every output_ref and verification_ref already exists in durable storage before terminal Run update.',
        ...durableSnapshotReadbackSteps(
          handoff?.tester_evidence_verification_snapshot ? [handoff.tester_evidence_verification_snapshot] : [],
          'Tester evidence Verification snapshot',
        ),
      ]
      if (handoffPath) {
        externalSteps.push(
          'Call authorize_memory_mutation(operation=create, repository_full_name=configured Memory Repo, path=' + handoffPath + ') and persist handoff_record_text first.',
        )
      }
      externalSteps.push(
        'Fetch the current Run file immediately before update and require its blob SHA equals expected_run_sha.',
        'Call authorize_memory_mutation(operation=update, repository_full_name=configured Memory Repo, path=run_memory_path).',
        'GitHub Memory Repo: update the Run file with terminal_run_record_text using expected_run_sha exactly. On stale SHA, refetch/reconcile; never force overwrite.',
        'Read back terminal Run and any Handoff. Only then report the Run complete.',
      )
      const out = {
        run_memory_path: runPath,
        expected_run_sha: run_record_sha,
        terminal_run_record_text: prettyJson(terminal),
        handoff_id: handoffId,
        handoff_memory_path: handoffPath,
        handoff_record_text: handoffText,
        external_steps: externalSteps,
      }
      return { structuredContent: out, content: [{ type: 'text', text: JSON.stringify(out) }] }
    },
  )

  server.registerTool(
    'start_direct_agent',
    {
      title: 'Start a Direct Agent',
      description: 'Handler for pl/ds/cd/rv/ts. CR uses the separate Human-only start_critic_review path. Direct work is ephemeral by default.',
      inputSchema: {
        role: z.enum(['planner','designer','coder','reviewer','tester']),
        objective: z.string().optional(),
        target_url: z.string().url().optional(),
      },
      outputSchema: {
        role: z.string(),
        mode: z.string(),
        ephemeral: z.boolean(),
        purpose: z.string(),
        source_write: z.boolean(),
        expected_output: z.string(),
        objective: z.string().nullable(),
        target_url: z.string().nullable(),
        rules: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async ({ role, objective, target_url }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to start a Direct Agent.')
      const contracts: Record<string, { purpose: string; source_write: boolean; output: string }> = {
        planner: { purpose: 'Plan scope, tasks, dependencies and gates.', source_write: false, output: 'Plan / Project or Job proposal' },
        designer: { purpose: 'Define UI/UX and asset requirements.', source_write: false, output: 'Design / Asset Requirement' },
        coder: { purpose: 'Implement approved source changes.', source_write: true, output: 'Source diff + Goal Recheck + evidence' },
        reviewer: { purpose: 'Run context-isolated review.', source_write: false, output: 'Findings + review result' },
        tester: { purpose: 'Verify behavior and evidence.', source_write: false, output: 'Test / Retest evidence' },
      }
      const contract = contracts[role]
      const result = {
        role,
        mode: 'DIRECT_AGENT',
        ephemeral: true,
        purpose: contract.purpose,
        source_write: contract.source_write,
        expected_output: contract.output,
        objective: objective ?? null,
        target_url: target_url ?? null,
        rules: [
          'Direct work is ephemeral by default.',
          'If target belongs to an existing owning Project, Project governance wins.',
          'Promotion to durable Project/Job state requires an explicit promotion packet.',
          role === 'reviewer' ? 'Reviewer is context-isolated and source read-only.' : 'Respect role authority and connected-app permissions.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_instruction',
    {
      title: 'Show GSA usage instructions',
      description: 'Handler for guide.',
      inputSchema: {},
      outputSchema: { instruction_text: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to read GSA instructions.')
      const instructionText = [
        'GSA usage',
        '1. Configure SETTING -> Memory Repo once using a private GitHub repository.',
        '2. Project Memory is stored only under projects/<project-id>/ in that repo.',
        '3. PROJECT create [new] binds a separate GitHub source repository to durable Project Memory.',
        '4. Paste GitHub URLs directly; @GitHub is optional.',
        '5. Updates use blob SHA optimistic concurrency; stale writes must refetch/reconcile.',
        '6. Supabase stores user configuration only, never Project/Job/Run memory.',
      ].join('\n')
      return { structuredContent: { instruction_text: instructionText }, content: [{ type: 'text', text: instructionText }] }
    },
  )

  server.registerTool(
    'get_command_help',
    {
      title: 'Show GSA command help',
      description: 'Handler for help.',
      inputSchema: { command: z.string().optional() },
      outputSchema: { help_text: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ command }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError(req, 'Authentication required to read command help.')
      const helpText = command
        ? 'Command help requested for: ' + command + '. Use canonical aliases exactly.'
        : [
            'PROJECT: list[ls], open[op], create[new], status[st], pause[pa], resume[rs], archive[ar], delete[rm]',
            'DIRECT AGENT: planner[pl], designer[ds], coder[cd], reviewer[rv], critic reviewer[cr] (Human-only, stateless review), tester[ts]',
            'SETTING: GSA Account[acct], Memory Repo[repo]',
            'HELP: instruction[guide], command help[help]',
          ].join('\n')
      return { structuredContent: { help_text: helpText }, content: [{ type: 'text', text: helpText }] }
    },
  )

  return server
}

const root = new Hono()
const app = new Hono()

app.get('/selftest', (c) => {
  const now = new Date().toISOString()
  const projectId = uuidv7()
  const manifest = buildProjectManifest({
    projectId,
    name: 'Selftest Project',
    lifecycle: 'ACTIVE',
    repoUrl: 'https://github.com/example/source',
    purpose: 'selftest',
    createdAt: now,
    updatedAt: now,
  })
  const parsed = parseProjectManifest(manifest)
  const paused = transitionProjectManifest(manifest, 'PAUSED')
  const resumed = paused ? transitionProjectManifest(paused.next, 'ACTIVE') : null
  const legacyJobId = uuidv7()
  const legacyRunId = uuidv7()
  const nextJobId = uuidv7()
  const nextRunId = uuidv7()
  const legacyCoderRun = { project_id: projectId, job_id: legacyJobId, run_id: legacyRunId, role: 'coder', lifecycle: 'IN_PROGRESS' }
  const nextCoderRun = { project_id: projectId, job_id: nextJobId, run_id: nextRunId, role: 'coder', lifecycle: 'IN_PROGRESS', execution_contract: 'NEXT' }
  const checkpointId = 'CP-E29'
  const consumerTaskId = uuidv7()
  const evidenceNeedId = 'EN-E29'
  const verificationId = uuidv7()
  const attemptId = uuidv7()
  const leaseToken = uuidv7()
  const nextGateJob = {
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 3,
    planning_review: { status: 'PASS', reviewed_revision: 3 },
    tasks: [{ task_id: consumerTaskId }],
    evidence_needs: [{ evidence_need_id: evidenceNeedId, checkpoint_id: checkpointId, owner_task_id: consumerTaskId, required_by_task_ids: [consumerTaskId], planning_revision: 3 }],
    evidence_requirements: [{ evidence_requirement_id: 'ER-E29', consumer_task_id: consumerTaskId, evidence_need_id: evidenceNeedId, checkpoint_id: checkpointId, planning_revision: 3 }],
    test_checkpoints: [{ checkpoint_id: checkpointId, mode: 'VERIFY', boundary: 'BEFORE_NODE', boundary_node_id: consumerTaskId, prerequisite_node_ids: [], evidence_need_ids: [evidenceNeedId], planning_revision: 3 }],
    milestones: [],
  }
  const nextGateClaim = {
    kind: 'CHECKPOINT_CLAIM',
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 3,
    checkpoint_id: checkpointId,
    mode: 'VERIFY',
    state: 'SATISFIED',
    attempt_id: attemptId,
    attempt_kind: 'TEST',
    lease_token: leaseToken,
    target_revision: 'rev-b',
    last_verification_id: verificationId,
    last_result: 'PASS',
    last_target_revision: 'rev-b',
  }
  const nextGateVerification = {
    verification_id: verificationId,
    kind: 'TEST',
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 3,
    checkpoint_id: checkpointId,
    attempt_id: attemptId,
    attempt_kind: 'TEST',
    lease_token: leaseToken,
    mode: 'VERIFY',
    target_revision: 'rev-b',
    producer: 'tester',
    result: 'PASS',
    applicability: {
      status: 'CANDIDATE',
      planning_revision: 3,
      checkpoint_id: checkpointId,
      target_revision: 'rev-b',
      evidence_need_ids: [evidenceNeedId],
    },
  }
  const nextGateClaimSnapshot = {
    path: checkpointClaimPath(projectId, nextJobId, 3, checkpointId),
    sha: 'a'.repeat(40),
    record_text: prettyJson(nextGateClaim),
  }
  const nextGateVerificationSnapshot = {
    path: verificationPath(projectId, verificationId, 'NEXT'),
    sha: 'b'.repeat(40),
    record_text: prettyJson(nextGateVerification),
  }
  const nextTaskGatePass = evaluateNextEvidenceGate(nextGateJob, [nextGateClaimSnapshot], [nextGateVerificationSnapshot], { kind: 'TASK', id: consumerTaskId })
  const nextTaskGateMissing = evaluateNextEvidenceGate(nextGateJob, [], [], { kind: 'TASK', id: consumerTaskId })
  const nextTaskGateStale = evaluateNextEvidenceGate({ ...nextGateJob, planning_revision: 4, planning_review: { status: 'PASS', reviewed_revision: 4 } }, [nextGateClaimSnapshot], [nextGateVerificationSnapshot], { kind: 'TASK', id: consumerTaskId })
  const nextGateVerificationWrongNestedRevision = {
    ...nextGateVerification,
    applicability: { ...nextGateVerification.applicability, planning_revision: 2 },
  }
  const legacyGatePass = evaluateNextEvidenceGate({ project_id: projectId, job_id: legacyJobId, execution_contract: 'V2_STABLE' }, [], [], { kind: 'JOB', id: null })
  const executionTopologyValid = validateExecutionTopology(
    [{ task_id: consumerTaskId, dependencies: [] }],
    [{ stage: 1, handler: 'coder', task_id: consumerTaskId, depends_on: [], next: null }],
  ) === null
  const executionTopologyStale = validateExecutionTopology(
    [{ task_id: consumerTaskId, dependencies: [] }],
    [{ stage: 1, handler: 'coder', task_id: uuidv7(), depends_on: [], next: null }],
  ) !== null
  const topologyDependencyGateJob = {
    ...nextGateJob,
    evidence_requirements: [],
    planning_topology: [
      { node_id: checkpointId, node_type: 'TEST_CHECKPOINT', depends_on: [], planning_revision: 3 },
      { node_id: consumerTaskId, node_type: 'TASK', depends_on: [checkpointId], planning_revision: 3 },
    ],
  }
  const topologyDependencyGateMissing = evaluateNextEvidenceGate(topologyDependencyGateJob, [], [], { kind: 'TASK', id: consumerTaskId })
  const topologyDependencyGatePass = evaluateNextEvidenceGate(topologyDependencyGateJob, [prettyJson(nextGateClaim)].map((record_text) => ({ path: checkpointClaimPath(projectId, nextJobId, 3, checkpointId), sha: 'a'.repeat(40), record_text })), [prettyJson(nextGateVerification)].map((record_text) => ({ path: verificationPath(projectId, verificationId, 'NEXT'), sha: 'b'.repeat(40), record_text })), { kind: 'TASK', id: consumerTaskId })
  const milestoneBoundaryPrereqs = checkpointBoundaryPrerequisiteIds(
    { milestones: [{ milestone_id: 'M-E29', node_ids: [consumerTaskId, checkpointId] }] },
    { checkpoint_id: checkpointId, boundary: 'MILESTONE_GATE', milestone_id: 'M-E29', prerequisite_node_ids: [] },
  )
  const jobFinalBoundaryPrereqs = checkpointBoundaryPrerequisiteIds(
    { planning_topology: [{ node_id: consumerTaskId }, { node_id: checkpointId }, { node_id: 'CP-FINAL' }] },
    { checkpoint_id: 'CP-FINAL', boundary: 'JOB_FINAL', prerequisite_node_ids: [] },
  )
  const cp6TargetRef = 'refs/heads/cp6-selftest'
  const cp6TargetRevision = 'c'.repeat(40)
  const cp6EvidenceCommit = 'd'.repeat(40)
  const cp6PrivateBundle = {
    evidence_bundle_id: 'e'.repeat(64),
    backend: 'PRIVATE_SUPABASE',
    privacy_class: 'PRIVATE_REQUIRED',
    binding: {
      project_id: projectId,
      repository: 'example/source',
      job_id: nextJobId,
      checkpoint_id: checkpointId,
      attempt_id: attemptId,
      run_id: nextRunId,
      target_ref: cp6TargetRef,
      target_revision: cp6TargetRevision,
    },
    manifest_path: 'db:gsa_evidence_bundles/' + 'e'.repeat(64),
    manifest_sha256: 'f'.repeat(64),
    viewer_url: 'https://example.test/evidence.html?bundle=' + 'e'.repeat(64),
    target_revision: cp6TargetRevision,
    artifact_count: 2,
    size_bytes: 2048,
    immutable: true,
    manifest_readback_verified: true,
  }
  const cp6RepoBundle = {
    backend: 'REPOSITORY_GIT',
    publication_mode: 'PUBLISH',
    privacy_class: 'REPO_SAFE',
    binding: {
      project_id: projectId,
      repository: 'example/source',
      job_id: nextJobId,
      checkpoint_id: checkpointId,
      attempt_id: attemptId,
      run_id: nextRunId,
      target_ref: cp6TargetRef,
      target_revision: cp6TargetRevision,
    },
    evidence_ref: 'gsa-evidence/' + projectId,
    evidence_commit_sha: cp6EvidenceCommit,
    manifest_path: 'tests/gsa/' + projectId + '/' + nextJobId + '/' + checkpointId.toLowerCase() + '/' + attemptId + '/manifest.json',
    manifest_sha256: 'a'.repeat(64),
    human_openable_url: 'https://github.com/example/source/blob/' + cp6EvidenceCommit + '/tests/gsa/manifest.json',
    artifact_count: 1,
    size_bytes: 1024,
    immutable: true,
    append_only_parent_sha: 'b'.repeat(40),
    manifest_readback_verified: true,
    artifact_readback_verified: true,
    automation_side_effects_observed: false,
    binary_probe_verification_ref: verificationPath(projectId, uuidv7(), 'NEXT'),
    binary_probe_verification_sha: '9'.repeat(40),
  }
  const cp6ExpectedBundleContext = {
    project_id: projectId,
    job_id: nextJobId,
    checkpoint_id: checkpointId,
    attempt_id: attemptId,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    repository_full_name: 'example/source',
  }
  const cp6ClaimWithBundle = {
    ...nextGateClaim,
    claimant_run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    last_target_revision: cp6TargetRevision,
  }
  const cp6AttestationRef = {
    path: verificationPath(projectId, uuidv7(), 'NEXT'),
    sha: '8'.repeat(40),
  }
  const cp6VerificationWithBundle = {
    ...nextGateVerification,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    evidence_bundle_refs: [cp6PrivateBundle],
    evidence_bundle_attestation_refs: [cp6AttestationRef],
    applicability: {
      ...nextGateVerification.applicability,
      target_revision: cp6TargetRevision,
    },
  }
  const cp6JobWithRepo = {
    ...nextGateJob,
    repository_context: { working_repository_url: 'https://github.com/example/source' },
  }

  const checks = {
    uuidv7_shape: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(projectId),
    manifest_parse: Boolean(parsed && parsed.project_id === projectId && parsed.lifecycle === 'ACTIVE'),
    pause_transition: Boolean(paused && parseProjectManifest(paused.next)?.lifecycle === 'PAUSED'),
    resume_transition: Boolean(resumed && parseProjectManifest(resumed.next)?.lifecycle === 'ACTIVE'),
    memory_path_accept: validMemoryPath('projects/' + projectId + '/PROJECT.md'),
    memory_path_reject: !validMemoryPath('README.md') && !validMemoryPath('../projects/' + projectId + '/PROJECT.md'),
    repo_normalization: normalizeGithubRepo('https://github.com/example/memory.git')?.full_name === 'example/memory',
    planner_harness_present: Boolean(renderHarness('planner')?.includes('EXECUTION LOOP')),
    coder_harness_goal_recheck: Boolean(renderHarness('coder')?.includes('GOAL RECHECK')),
    base_harness_denial_boundary: BASE_AGENT_HARNESS.includes('denied or unauthorized action'),
    progressive_skill_catalog: Boolean(RUNTIME_SKILLS['coding-loop'] && RUNTIME_SKILLS['delegation']),
    coder_skill_suggested: (ROLE_SKILLS.coder ?? []).includes('coding-loop'),
    ui_coder_frontend_catalog_present: Boolean(RUNTIME_SKILLS['ui-coder-frontend']),
    ui_coder_frontend_not_default: !(ROLE_SKILLS.coder ?? []).includes('ui-coder-frontend'),
    tester_modes_present: Boolean(renderHarness('tester')?.includes('VERIFY, MEASURE and PROBE') && RUNTIME_SKILLS['testing-evidence']?.body.includes('MEASURE: record an observed value/state')),
    tester_measure_no_threshold_guard: Boolean(RUNTIME_SKILLS['testing-evidence']?.body.includes('do not invent PASS/FAIL')),
    tester_readiness_ladder_present: Boolean(RUNTIME_SKILLS['testing-evidence']?.body.includes('DISCOVERED → REACHABLE → INVOCABLE → FUNCTIONAL → GOAL_MET')),
    tester_failure_classes_present: Boolean(RUNTIME_SKILLS['testing-evidence']?.body.includes('PRODUCT_FAILURE, TEST_FAILURE, ENVIRONMENT_FAILURE, NOT_READY, INTEGRATION_NOT_READY, SPEC_GAP, PLAN_GAP')),
    tester_retest_revision_bound: Boolean(RUNTIME_SKILLS['testing-evidence']?.body.includes('Bind Retest evidence to the exact target revision/state')),
    critic_harness_present: Boolean(renderHarness('critic_reviewer')?.includes('FRESH CONTEXT GATE')),
    critic_skill_suggested: (ROLE_SKILLS.critic_reviewer ?? []).includes('critic-review'),
    critic_is_human_only: Boolean(renderHarness('critic_reviewer')?.includes('Human-invoked independent peer review only')),
    critic_stateless_contract: Boolean(renderHarness('critic_reviewer')?.includes('Conversation history is non-authoritative')),
    ux_first_temp_ui_defaults_to_gate: true,
    run_begin_requires_job_snapshot: true,
    job_record_path_shape: recordPath(projectId, 'JOBS', uuidv7()).startsWith('projects/' + projectId + '/WORK/JOBS/'),
    next_job_path_isolated: recordPath(projectId, 'JOBS', uuidv7(), 'NEXT').startsWith('projects/' + projectId + '/TEST-LAB/NEXT/WORK/JOBS/'),
    next_verification_path_isolated: verificationPath(projectId, uuidv7(), 'NEXT').startsWith('projects/' + projectId + '/TEST-LAB/NEXT/VERIFICATION/'),
    next_checkpoint_claim_path_deterministic: checkpointClaimPath(projectId, nextJobId, 3, 'CP 1') === checkpointClaimPath(projectId, nextJobId, 3, 'CP 1') && checkpointClaimPath(projectId, nextJobId, 3, 'CP 1').includes('/TEST-LAB/NEXT/WORK/CHECKPOINT_CLAIMS/'),
    next_checkpoint_attempt_path_isolated: checkpointAttemptPath(projectId, uuidv7()).includes('/TEST-LAB/NEXT/WORK/CHECKPOINT_ATTEMPTS/'),
    checkpoint_lease_expiry_guard: checkpointLeaseExpired({ lease_expires_at: new Date(Date.now() - 1000).toISOString() }) && !checkpointLeaseExpired({ lease_expires_at: new Date(Date.now() + 60_000).toISOString() }),
    cp5_task_gate_accepts_current_applicable_evidence: nextTaskGatePass.allowed,
    cp5_task_gate_blocks_missing_evidence: !nextTaskGateMissing.allowed && nextTaskGateMissing.blocking.length === 1,
    cp5_task_gate_rejects_stale_revision_evidence: !nextTaskGateStale.allowed,
    cp5_v2_gate_preserves_legacy_path: legacyGatePass.allowed,
    cp5_orphan_verification_not_applicable: !checkpointVerificationApplicable(nextGateJob, nextGateJob.test_checkpoints[0], { ...nextGateClaim, last_verification_id: uuidv7() }, nextGateVerification),
    cp5_execution_topology_validator_accepts_coherent_plan: executionTopologyValid,
    cp5_execution_topology_validator_rejects_stale_task_mapping: executionTopologyStale,
    cp5_typed_checkpoint_dependency_blocks_task_without_evidence: !topologyDependencyGateMissing.allowed,
    cp5_typed_checkpoint_dependency_opens_with_applicable_evidence: topologyDependencyGatePass.allowed,
    cp5_nested_applicability_revision_mismatch_rejected: !checkpointVerificationApplicable(nextGateJob, nextGateJob.test_checkpoints[0], nextGateClaim, nextGateVerificationWrongNestedRevision),
    cp5_milestone_boundary_expands_runtime_prereqs: milestoneBoundaryPrereqs.includes(consumerTaskId) && !milestoneBoundaryPrereqs.includes(checkpointId),
    cp5_job_final_boundary_expands_runtime_prereqs: jobFinalBoundaryPrereqs.includes(consumerTaskId) && jobFinalBoundaryPrereqs.includes(checkpointId) && !jobFinalBoundaryPrereqs.includes('CP-FINAL'),
    cp6_private_bundle_accepts_exact_binding: evidenceBundleRefValidationError(cp6PrivateBundle, cp6ExpectedBundleContext) === null,
    cp6_private_bundle_rejects_stale_revision: evidenceBundleRefValidationError({ ...cp6PrivateBundle, target_revision: '1'.repeat(40) }, cp6ExpectedBundleContext) !== null,
    cp6_private_bundle_rejects_wrong_attempt: evidenceBundleRefValidationError({ ...cp6PrivateBundle, binding: { ...cp6PrivateBundle.binding, attempt_id: uuidv7() } }, cp6ExpectedBundleContext) !== null,
    cp6_private_bundle_rejects_oversize: evidenceBundleRefValidationError({ ...cp6PrivateBundle, size_bytes: 51 * 1024 * 1024 }, cp6ExpectedBundleContext) !== null,
    cp6_repo_bundle_accepts_immutable_publish: evidenceBundleRefValidationError(cp6RepoBundle, cp6ExpectedBundleContext) === null,
    cp6_repo_bundle_rejects_private_class: evidenceBundleRefValidationError({ ...cp6RepoBundle, privacy_class: 'PRIVATE_REQUIRED' }, cp6ExpectedBundleContext) !== null,
    cp6_repo_bundle_rejects_mutable_evidence: evidenceBundleRefValidationError({ ...cp6RepoBundle, immutable: false }, cp6ExpectedBundleContext) !== null,
    cp6_repo_bundle_rejects_automation_side_effects: evidenceBundleRefValidationError({ ...cp6RepoBundle, automation_side_effects_observed: true }, cp6ExpectedBundleContext) !== null,
    cp6_repo_bundle_requires_probe_sha: evidenceBundleRefValidationError({ ...cp6RepoBundle, binary_probe_verification_sha: null }, cp6ExpectedBundleContext) !== null,
    cp6_checkpoint_bundle_is_applicable_when_exact: checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], cp6ClaimWithBundle, cp6VerificationWithBundle),
    cp6_checkpoint_bundle_rejects_missing_attestation_ref: !checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], cp6ClaimWithBundle, { ...cp6VerificationWithBundle, evidence_bundle_attestation_refs: [] }),
    cp6_checkpoint_bundle_rejects_retest_attempt_mismatch: !checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], { ...cp6ClaimWithBundle, attempt_id: uuidv7() }, cp6VerificationWithBundle),
    edge_function_external_path: edgeFunctionBase(new Request('https://example.supabase.co/functions/v1/gsa-mcp-next/mcp')) === 'https://example.supabase.co/functions/v1/gsa-mcp-next',
    edge_function_runtime_path: edgeFunctionBase(new Request('https://example.supabase.co/gsa-mcp-next/mcp')) === 'https://example.supabase.co/functions/v1/gsa-mcp-next',
    execution_contract_missing_is_stable: resolveExecutionContract(undefined) === 'V2_STABLE',
    execution_contract_stable_is_stable: resolveExecutionContract('V2_STABLE') === 'V2_STABLE',
    execution_contract_next_is_next: resolveExecutionContract('NEXT') === 'NEXT',
    execution_contract_invalid_rejected: resolveExecutionContract('UNKNOWN') === null,
    goal_recheck_legacy_run_identity_valid: goalRecheckRunMatches(legacyCoderRun, projectId, legacyJobId, legacyRunId),
    goal_recheck_next_run_identity_valid: goalRecheckRunMatches(nextCoderRun, projectId, nextJobId, nextRunId),
    goal_recheck_wrong_run_identity_rejected: !goalRecheckRunMatches(nextCoderRun, projectId, nextJobId, legacyRunId),
    goal_recheck_wrong_role_rejected: !goalRecheckRunMatches({ ...nextCoderRun, role: 'reviewer' }, projectId, nextJobId, nextRunId),
    goal_recheck_legacy_run_contract_stable: resolveExecutionContract(legacyCoderRun.execution_contract) === 'V2_STABLE',
    goal_recheck_next_run_contract_next: resolveExecutionContract(nextCoderRun.execution_contract) === 'NEXT',
    goal_recheck_invalid_run_contract_rejected: resolveExecutionContract('UNKNOWN') === null,
    goal_recheck_legacy_run_path_unchanged: recordPath(projectId, 'RUNS', legacyRunId, resolveExecutionContract(legacyCoderRun.execution_contract) ?? 'V2_STABLE').startsWith('projects/' + projectId + '/WORK/RUNS/'),
    goal_recheck_next_run_path_isolated: recordPath(projectId, 'RUNS', nextRunId, resolveExecutionContract(nextCoderRun.execution_contract) ?? 'V2_STABLE').startsWith('projects/' + projectId + '/TEST-LAB/NEXT/WORK/RUNS/'),
    goal_recheck_stable_verification_path_unchanged: verificationPath(projectId, uuidv7(), resolveExecutionContract(legacyCoderRun.execution_contract) ?? 'V2_STABLE').startsWith('projects/' + projectId + '/VERIFICATION/'),
    goal_recheck_next_verification_path_isolated: verificationPath(projectId, uuidv7(), resolveExecutionContract(nextCoderRun.execution_contract) ?? 'V2_STABLE').startsWith('projects/' + projectId + '/TEST-LAB/NEXT/VERIFICATION/'),
  }
  const pass = Object.values(checks).every(Boolean)
  return c.json({ pass, checks })
})

app.get('/health', (c) =>
  c.json({ ok: true, service: 'gpt-super-agent', phase: 'M2_AUTONOMOUS_SAME_TURN_ORCHESTRATION', oauth: true, source_build_id: GSA_SOURCE_BUILD_ID, execution_contract_default: DEFAULT_EXECUTION_CONTRACT }),
)

app.get('/.well-known/oauth-protected-resource', (c) =>
  c.json({ resource: mcpResource(c.req.raw), authorization_servers: [AUTH_ISSUER], scopes_supported: AUTH_SCOPES }),
)

app.all('/mcp', async (c) => {
  const authHeader = c.req.raw.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', error_description: 'Connect your GPT Super Agent account to continue.' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': challenge(c.req.raw, 'invalid_token', 'Connect your GPT Super Agent account to continue'),
          'Cache-Control': 'no-store',
        },
      },
    )
  }
  const transport = new WebStandardStreamableHTTPServerTransport()
  const server = createServer(c.req.raw)
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

root.route('/gsa-mcp', app)
root.route('/gsa-mcp-next', app)
Deno.serve(root.fetch)
