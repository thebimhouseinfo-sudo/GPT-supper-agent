import { normalizeGithubRepo } from './platform-utils.ts'
import { DEFAULT_NEXT_MEMORY_NAMESPACE, resolveExecutionContract } from './runtime-contract.ts'
import { recordNextMemoryNamespace, sameNextMemoryNamespace, executionMemoryRoot, verificationPath, checkpointClaimPath, parseDurableSnapshots } from './durable-record-io.ts'

export function evidenceBundleRefValidationError(
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

export async function sha256Utf8Text(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, '0')).join('')
}

export function validateEvidenceBundleAttestationSnapshot(
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
  const recordMemoryNamespace = recordNextMemoryNamespace(record)
  const expectedPath =
    typeof record?.verification_id === 'string' && recordMemoryNamespace
      ? verificationPath(expected.project_id, record.verification_id, 'NEXT', recordMemoryNamespace)
      : ''
  const bundle = record?.evidence_bundle_ref
  const bundleError = evidenceBundleRefValidationError(bundle, expected)
  const publicationProof = record?.publication_proof
  const privateProofValid =
    record?.backend !== 'PRIVATE_SUPABASE' || (
      publicationProof?.kind === 'SUPABASE_MANIFEST_READBACK' &&
      publicationProof?.evidence_bundle_id === bundle?.evidence_bundle_id &&
      publicationProof?.manifest_path === bundle?.manifest_path &&
      publicationProof?.manifest_sha256 === bundle?.manifest_sha256 &&
      publicationProof?.row_readback_verified === true
    )
  const repositoryProofValid =
    record?.backend !== 'REPOSITORY_GIT' || (
      publicationProof?.kind === 'REPOSITORY_PUBLISH_FINALIZE' &&
      publicationProof?.evidence_ref === bundle?.evidence_ref &&
      publicationProof?.evidence_commit_sha === bundle?.evidence_commit_sha &&
      publicationProof?.manifest_path === bundle?.manifest_path &&
      publicationProof?.manifest_sha256 === bundle?.manifest_sha256 &&
      publicationProof?.manifest_readback_verified === true &&
      publicationProof?.artifact_readback_verified === true &&
      publicationProof?.automation_side_effects_observed === false &&
      publicationProof?.probe_verification_ref === bundle?.binary_probe_verification_ref &&
      publicationProof?.probe_verification_sha === bundle?.binary_probe_verification_sha
    )
  const valid =
    expectedPath === entry.path &&
    record?.kind === 'EVIDENCE_BUNDLE' &&
    record?.project_id === expected.project_id &&
    record?.job_id === expected.job_id &&
    resolveExecutionContract(record?.execution_contract) === 'NEXT' &&
    recordMemoryNamespace != null &&
    record?.producer === 'tester' &&
    record?.result === 'PUBLISHED' &&
    record?.checkpoint_id === expected.checkpoint_id &&
    record?.attempt_id === expected.attempt_id &&
    record?.run_id === expected.run_id &&
    record?.target_ref === expected.target_ref &&
    record?.target_revision === expected.target_revision &&
    String(record?.repository_full_name || '').toLowerCase() === expected.repository_full_name.toLowerCase() &&
    record?.backend === bundle?.backend &&
    privateProofValid &&
    repositoryProofValid &&
    !bundleError
  if (!valid) {
    return { error: 'EvidenceBundle attestation does not match the current checkpoint attempt/Tester Run/target.', ref: null, sha: null, record: null, bundle: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record, bundle }
}

export function validateTesterEvidenceVerificationSnapshot(
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
  const recordMemoryNamespace = recordNextMemoryNamespace(record)
  const expectedPath =
    typeof record?.verification_id === 'string' && recordMemoryNamespace
      ? verificationPath(expected.project_id, record.verification_id, 'NEXT', recordMemoryNamespace)
      : ''
  const valid =
    expectedPath === entry.path &&
    ['TEST','RETEST'].includes(record?.kind) &&
    resolveExecutionContract(record?.execution_contract) === 'NEXT' &&
    recordMemoryNamespace != null &&
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
      item.path.startsWith(executionMemoryRoot(expected.project_id, 'NEXT', recordMemoryNamespace ?? DEFAULT_NEXT_MEMORY_NAMESPACE) + '/VERIFICATION/') &&
      /^[0-9a-f]{40}$/.test(String(item.sha || ''))
    )
  if (!valid) {
    return { error: 'TEST/RETEST Verification is not the exact successful durable evidence record for this Tester Run/target.', ref: null, sha: null, record: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record }
}

export function validateTesterEvidenceClaimSnapshot(
  snapshot: any,
  verification: any,
  expected: {
    project_id: string
    job_id: string
    run_id: string
    target_ref: string
    target_revision: string
    planning_revision: number
  },
) {
  const parsed = parseDurableSnapshots([snapshot], 'tester_evidence_claim_snapshot')
  if (parsed.error || parsed.entries.length !== 1) {
    return { error: 'invalid durable terminal checkpoint claim snapshot.', ref: null, sha: null, record: null }
  }
  const entry = parsed.entries[0]
  const claim = entry.record
  const claimMemoryNamespace = recordNextMemoryNamespace(claim)
  const expectedPath =
    typeof verification?.checkpoint_id === 'string' && Number.isInteger(Number(verification?.planning_revision)) && claimMemoryNamespace
      ? checkpointClaimPath(expected.project_id, expected.job_id, Number(verification.planning_revision), verification.checkpoint_id, claimMemoryNamespace)
      : ''
  const requiredState =
    verification?.result === 'PASS' ? 'SATISFIED' :
    verification?.result === 'OBSERVED' ? 'OBSERVED' :
    null
  const valid =
    expectedPath === entry.path &&
    claim?.kind === 'CHECKPOINT_CLAIM' &&
    claim?.execution_contract === 'NEXT' &&
    claimMemoryNamespace != null &&
    sameNextMemoryNamespace(claim, verification) &&
    claim?.project_id === expected.project_id &&
    claim?.job_id === expected.job_id &&
    claim?.planning_revision === expected.planning_revision &&
    verification?.planning_revision === expected.planning_revision &&
    claim?.checkpoint_id === verification?.checkpoint_id &&
    claim?.mode === verification?.mode &&
    claim?.state === requiredState &&
    claim?.claimant_run_id === expected.run_id &&
    claim?.last_verification_id === verification?.verification_id &&
    claim?.attempt_id === verification?.attempt_id &&
    claim?.attempt_kind === verification?.attempt_kind &&
    claim?.lease_token === verification?.lease_token &&
    claim?.target_ref === expected.target_ref &&
    claim?.target_revision === expected.target_revision &&
    claim?.last_target_revision === expected.target_revision &&
    claim?.last_result === verification?.result &&
    claim?.retest_required === false &&
    claim?.lease_expires_at == null &&
    verification?.applicability?.status === 'CANDIDATE' &&
    verification?.applicability?.planning_revision === expected.planning_revision &&
    verification?.applicability?.checkpoint_id === verification?.checkpoint_id &&
    verification?.applicability?.target_revision === expected.target_revision
  if (!valid) {
    return { error: 'terminal checkpoint claim does not currently make this TEST/RETEST Verification applicable.', ref: null, sha: null, record: null }
  }
  return { error: null, ref: entry.path, sha: entry.sha, record: claim }
}

export function checkpointVerificationApplicable(job: any, checkpoint: any, claim: any, verification: any) {
  if (!claim || !verification) return false
  if (claim.kind !== 'CHECKPOINT_CLAIM' || claim.execution_contract !== 'NEXT') return false
  const nextMemoryNamespace = recordNextMemoryNamespace(job)
  if (!nextMemoryNamespace) return false
  if (!sameNextMemoryNamespace(job, claim) || !sameNextMemoryNamespace(job, verification)) return false
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
      !ref.path.startsWith(executionMemoryRoot(job.project_id, 'NEXT', nextMemoryNamespace) + '/VERIFICATION/') ||
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
