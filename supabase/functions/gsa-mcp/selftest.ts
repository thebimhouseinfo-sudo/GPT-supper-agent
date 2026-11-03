import { BASE_AGENT_HARNESS, ROLE_SKILLS, RUNTIME_SKILLS, renderHarness } from './harness-catalog.ts'
import { checkpointBoundaryPrerequisiteIds, checkpointLeaseExpired, goalRecheckRunMatches, uxFirstTemporaryUiGateRequired } from './execution-guards.ts'
import { normalizeGithubRepo } from './platform-utils.ts'
import { uuidv7 } from './record-handles.ts'
import { validateExecutionTopology } from './planning-guards.ts'
// GSA1: Source-equivalent diagnostics; no production side-effects.
type ExecutionContract = 'V2_STABLE' | 'NEXT'
export function registerSelftest(app: any, deps: any) {
  const { CUTOVER_INVENTORY, PROJECT_REF, buildProjectManifest, checkpointAttemptPath, checkpointClaimPath, checkpointVerificationApplicable, checkpointVerificationOutcome, cutoverInventoryError, edgeFunctionBase, evaluateNextEvidenceGate, evidenceBundleRefValidationError, goalRecheckCoverageError, jobCreationExecutionContractDefault, mcpResource, nextClosureCoverageError, nextDispatchPreflightError, nextMemoryNamespaceForRequest, nextPlanSupersessionMatches, parseProjectManifest, prettyJson, productFailureRetestValidationError, projectScopeDecision, recordPath, resolveExecutionContract, resolveNextMemoryNamespace, resolveRequiredTaskSkills, resourceMetadata, runtimeSurface, transitionProjectManifest, validMemoryPath, validateEvidenceBundleAttestationSnapshot, validateRunVerificationSnapshot, validateTesterEvidenceClaimSnapshot, verificationPath } = deps
app.get('/selftest', (c: any) => {
  const now = new Date().toISOString()
  const projectId = uuidv7()
  const p3StagingRequest = new Request('https://example.supabase.co/functions/v1/gsa-mcp-next/selftest')
  const p3ProductionRequest = new Request('https://example.supabase.co/functions/v1/gsa-mcp/selftest')
  const p3PendingInventory = CUTOVER_INVENTORY.map((item: any) =>
    item.id === 'P3-C01' ? { ...item, disposition: 'PENDING' } : item
  )
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
  const legacyCoderRun: { project_id: string; job_id: string; run_id: string; role: string; lifecycle: string; execution_contract?: ExecutionContract } = { project_id: projectId, job_id: legacyJobId, run_id: legacyRunId, role: 'coder', lifecycle: 'IN_PROGRESS' }
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
  const cp7NoCheckpointTaskId = uuidv7()
  const cp7NoCheckpointGate = evaluateNextEvidenceGate(
    {
      project_id: projectId,
      job_id: uuidv7(),
      execution_contract: 'NEXT',
      planning_revision: 1,
      planning_review: { status: 'PASS', reviewed_revision: 1 },
      tasks: [{ task_id: cp7NoCheckpointTaskId }],
      evidence_needs: [],
      evidence_requirements: [],
      test_checkpoints: [],
      milestones: [],
      planning_topology: [{ node_id: cp7NoCheckpointTaskId, node_type: 'TASK', depends_on: [], planning_revision: 1 }],
    },
    [],
    [],
    { kind: 'TASK', id: cp7NoCheckpointTaskId },
  )
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
  const cp6TerminalClaim = {
    ...cp6ClaimWithBundle,
    lease_expires_at: null,
    retest_required: false,
  }
  const cp6TerminalClaimSnapshot = {
    path: checkpointClaimPath(projectId, nextJobId, 3, checkpointId),
    sha: '5'.repeat(40),
    record_text: prettyJson(cp6TerminalClaim),
  }
  const cp6OrphanClaimSnapshot = {
    ...cp6TerminalClaimSnapshot,
    record_text: prettyJson({
      ...cp6TerminalClaim,
      last_verification_id: uuidv7(),
    }),
  }
  const cp6HandoffClaimExpected = {
    project_id: projectId,
    job_id: nextJobId,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    planning_revision: 3,
  }
  const cp6JobWithRepo = {
    ...nextGateJob,
    repository_context: { working_repository_url: 'https://github.com/example/source' },
  }
  const cp6ProductionJobWithRepo = {
    ...cp6JobWithRepo,
    memory_namespace: 'PRODUCTION',
  }
  const cp6ProductionClaimWithBundle = {
    ...cp6ClaimWithBundle,
    memory_namespace: 'PRODUCTION',
  }
  const cp6ProductionAttestationRef = {
    ...cp6AttestationRef,
    path: verificationPath(projectId, uuidv7(), 'NEXT', 'PRODUCTION'),
  }
  const cp6ProductionVerificationWithBundle = {
    ...cp6VerificationWithBundle,
    memory_namespace: 'PRODUCTION',
    evidence_bundle_attestation_refs: [cp6ProductionAttestationRef],
  }
  const cp6ProductionVerificationWithLabAttestation = {
    ...cp6ProductionVerificationWithBundle,
    evidence_bundle_attestation_refs: [{
      ...cp6ProductionAttestationRef,
      path: verificationPath(projectId, uuidv7(), 'NEXT', 'TEST_LAB'),
    }],
  }

  const cp6PrivateAttestationId = uuidv7()
  const cp6PrivateAttestation = {
    verification_id: cp6PrivateAttestationId,
    kind: 'EVIDENCE_BUNDLE',
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    producer: 'tester',
    result: 'PUBLISHED',
    planning_revision: 3,
    checkpoint_id: checkpointId,
    attempt_id: attemptId,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    repository_full_name: 'example/source',
    backend: 'PRIVATE_SUPABASE',
    evidence_bundle_ref: cp6PrivateBundle,
    publication_proof: {
      kind: 'SUPABASE_MANIFEST_READBACK',
      evidence_bundle_id: cp6PrivateBundle.evidence_bundle_id,
      manifest_path: cp6PrivateBundle.manifest_path,
      manifest_sha256: cp6PrivateBundle.manifest_sha256,
      row_readback_verified: true,
    },
  }
  const cp6PrivateAttestationSnapshot = {
    path: verificationPath(projectId, cp6PrivateAttestationId, 'NEXT'),
    sha: '7'.repeat(40),
    record_text: prettyJson(cp6PrivateAttestation),
  }
  const cp6BadPrivateAttestationSnapshot = {
    ...cp6PrivateAttestationSnapshot,
    record_text: prettyJson({
      ...cp6PrivateAttestation,
      publication_proof: {
        ...cp6PrivateAttestation.publication_proof,
        manifest_sha256: '0'.repeat(64),
      },
    }),
  }
  const cp6RepoAttestationId = uuidv7()
  const cp6RepoAttestation = {
    verification_id: cp6RepoAttestationId,
    kind: 'EVIDENCE_BUNDLE',
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    producer: 'tester',
    result: 'PUBLISHED',
    planning_revision: 3,
    checkpoint_id: checkpointId,
    attempt_id: attemptId,
    run_id: nextRunId,
    target_ref: cp6TargetRef,
    target_revision: cp6TargetRevision,
    repository_full_name: 'example/source',
    backend: 'REPOSITORY_GIT',
    evidence_bundle_ref: cp6RepoBundle,
    publication_proof: {
      kind: 'REPOSITORY_PUBLISH_FINALIZE',
      evidence_ref: cp6RepoBundle.evidence_ref,
      evidence_commit_sha: cp6RepoBundle.evidence_commit_sha,
      manifest_path: cp6RepoBundle.manifest_path,
      manifest_sha256: cp6RepoBundle.manifest_sha256,
      manifest_readback_verified: true,
      artifact_readback_verified: true,
      automation_side_effects_observed: false,
      probe_verification_ref: cp6RepoBundle.binary_probe_verification_ref,
      probe_verification_sha: cp6RepoBundle.binary_probe_verification_sha,
    },
  }
  const cp6RepoAttestationSnapshot = {
    path: verificationPath(projectId, cp6RepoAttestationId, 'NEXT'),
    sha: '6'.repeat(40),
    record_text: prettyJson(cp6RepoAttestation),
  }
  const cp6BadRepoAttestationSnapshot = {
    ...cp6RepoAttestationSnapshot,
    record_text: prettyJson({
      ...cp6RepoAttestation,
      publication_proof: {
        ...cp6RepoAttestation.publication_proof,
        evidence_commit_sha: '1'.repeat(40),
      },
    }),
  }

  const cp7ProductFailureOutcome = checkpointVerificationOutcome('FAIL', 'PRODUCT_FAILURE')
  const cp7PlanGapOutcome = checkpointVerificationOutcome('FAIL', 'PLAN_GAP')
  const cp7RepairRevision = 'e'.repeat(40)
  const cp7RepairGoalId = uuidv7()
  const cp7RepairGoal = {
    verification_id: cp7RepairGoalId,
    kind: 'GOAL_RECHECK',
    execution_contract: 'NEXT',
    project_id: projectId,
    job_id: nextJobId,
    target_revision: cp7RepairRevision,
    result: 'PASS',
    criteria: [{ result: 'MET' }],
    scope_drift: [],
  }
  const cp7FailedProductClaim = {
    ...nextGateClaim,
    state: 'FAILED_PRODUCT',
    retest_required: true,
    last_failure_class: 'PRODUCT_FAILURE',
    last_result: 'FAIL',
    last_verification_id: verificationId,
    last_target_revision: cp6TargetRevision,
  }
  const cp7RepairGoalRef = verificationPath(projectId, cp7RepairGoalId, 'NEXT')
  const cp7ProductRetestAllowed =
    productFailureRetestValidationError(
      cp7FailedProductClaim,
      cp7RepairRevision,
      verificationId,
      prettyJson(cp7RepairGoal),
      cp7RepairGoalRef,
      projectId,
      nextJobId,
    ) === null
  const cp7ProductRetestSameTargetRejected =
    productFailureRetestValidationError(
      cp7FailedProductClaim,
      cp6TargetRevision,
      verificationId,
      prettyJson(cp7RepairGoal),
      cp7RepairGoalRef,
      projectId,
      nextJobId,
    ) !== null
  const cp7PlanGapVerificationId = uuidv7()
  const cp7PlanGapVerification = {
    ...nextGateVerification,
    verification_id: cp7PlanGapVerificationId,
    result: 'FAIL',
    failure_class: 'PLAN_GAP',
    route: 'PLANNER_REVISION_SUPERSEDE',
  }
  const cp7PlanGapClaim = {
    ...nextGateClaim,
    state: 'NEEDS_PLANNER_REVISION',
    last_failure_class: 'PLAN_GAP',
    last_result: 'FAIL',
    last_verification_id: cp7PlanGapVerificationId,
    last_target_revision: cp7PlanGapVerification.target_revision,
  }
  const cp7PlanGapVerificationRef = verificationPath(projectId, cp7PlanGapVerificationId, 'NEXT')
  const cp7PlanGapCurrent = { ...nextGateJob, lifecycle: 'IN_PROGRESS' }
  const cp7PlanGapSupersessionAccepted = nextPlanSupersessionMatches(
    cp7PlanGapCurrent,
    cp7PlanGapVerification,
    cp7PlanGapVerificationRef,
    cp7PlanGapClaim,
    projectId,
    nextJobId,
  )
  const cp7PlanGapSupersessionMismatchRejected = !nextPlanSupersessionMatches(
    cp7PlanGapCurrent,
    cp7PlanGapVerification,
    cp7PlanGapVerificationRef,
    { ...cp7PlanGapClaim, last_verification_id: uuidv7() },
    projectId,
    nextJobId,
  )
  const cp7PlannerSkill = RUNTIME_SKILLS['job-planning']?.body ?? ''
  const p0OwnedSourceScope = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'MUTATE_SOURCE',
    target_repository_url: 'https://github.com/example/source',
  })
  const p0ExternalSourceScope = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'MUTATE_SOURCE',
    target_repository_url: 'https://github.com/example/other',
  })
  const p0ExternalReadExplicit = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'READ_EXTERNAL',
    target_repository_url: 'https://github.com/example/other',
    user_directed_external_read: true,
  })
  const p0ExternalReadImplicit = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'READ_EXTERNAL',
    target_repository_url: 'https://github.com/example/other',
    user_directed_external_read: false,
  })
  const p0OwnedMemoryScope = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'MUTATE_MEMORY',
    target_memory_path: 'projects/' + projectId + '/WORK/JOBS/example.json',
  })
  const p0OtherMemoryScope = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: projectId,
    operation: 'MUTATE_MEMORY',
    target_memory_path: 'projects/' + uuidv7() + '/WORK/JOBS/example.json',
  })
  const p0PausedMutationScope = projectScopeDecision({
    project_manifest_text: paused?.next ?? manifest,
    project_id: projectId,
    operation: 'MUTATE_SOURCE',
    target_repository_url: 'https://github.com/example/source',
  })
  const p0WrongProjectIdentity = projectScopeDecision({
    project_manifest_text: manifest,
    project_id: uuidv7(),
    operation: 'MUTATE_SOURCE',
    target_repository_url: 'https://github.com/example/source',
  })
  const p1TaskA = uuidv7()
  const p1TaskB = uuidv7()
  const p1RunA = uuidv7()
  const p1DispatchJob = {
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    planning_review: { status: 'PASS', reviewed_revision: 7 },
    tasks: [
      { task_id: p1TaskA, dependencies: [] },
      { task_id: p1TaskB, dependencies: [p1TaskA] },
    ],
    topology: [
      { stage: 1, handler: 'coder', task_id: p1TaskA, depends_on: [], next: p1TaskB },
      { stage: 2, handler: 'tester', task_id: p1TaskB, depends_on: [p1TaskA], next: null },
    ],
  }
  const p1CompletedRun = {
    run_id: p1RunA,
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    primary_task_id: p1TaskA,
    role: 'coder',
    lifecycle: 'COMPLETED',
    result: 'PASS',
  }
  const p1CompletedEntry = {
    path: recordPath(projectId, 'RUNS', p1RunA, 'NEXT'),
    sha: '4'.repeat(40),
    record_text: prettyJson(p1CompletedRun),
    record: p1CompletedRun,
  }
  const p1JobSha = '5'.repeat(40)
  const p1DispatchValid = nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 7, p1JobSha, p1JobSha, [p1CompletedEntry])
  const p1WrongRole = nextDispatchPreflightError(p1DispatchJob, 'coder', [p1TaskB], 7, p1JobSha, p1JobSha, [p1CompletedEntry])
  const p1MissingPrerequisite = nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 7, p1JobSha, p1JobSha, [])
  const p1StaleRevision = nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 6, p1JobSha, p1JobSha, [p1CompletedEntry])
  const p1StaleJobSha = nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 7, p1JobSha, '6'.repeat(40), [p1CompletedEntry])
  const p1V2StableUnaffected = nextDispatchPreflightError({ ...p1DispatchJob, execution_contract: 'V2_STABLE' }, 'coder', [p1TaskB], 1, null, null, []) === null
  const p2UiTask = uuidv7()
  const p2UiJob = {
    ...p1DispatchJob,
    tasks: [{ task_id: p2UiTask, dependencies: [], required_skills: ['ui-coder-frontend'] }],
    topology: [{ stage: 1, handler: 'coder', task_id: p2UiTask, depends_on: [], next: null }],
  }
  const p2UiSkillResolution = resolveRequiredTaskSkills(p2UiJob, [p2UiTask])
  const p2UiDispatch = nextDispatchPreflightError(p2UiJob, 'coder', [p2UiTask], 7, p1JobSha, p1JobSha, [])
  const p2UnknownSkillResolution = resolveRequiredTaskSkills(
    { ...p2UiJob, tasks: [{ task_id: p2UiTask, dependencies: [], required_skills: ['missing-runtime-skill'] }] },
    [p2UiTask],
  )
  const p2GenericJob = { ...p2UiJob, tasks: [{ task_id: p2UiTask, dependencies: [], required_skills: [] }] }
  const p2GenericSkillResolution = resolveRequiredTaskSkills(p2GenericJob, [p2UiTask])
  const p2GenericCoderUnaffected = nextDispatchPreflightError(
    p2GenericJob,
    'coder',
    [p2UiTask],
    7,
    p1JobSha,
    p1JobSha,
    [],
  )

  const p2GoalTask = uuidv7()
  const p2GoalJob = {
    ...p1DispatchJob,
    tasks: [{
      task_id: p2GoalTask,
      dependencies: [],
      required_skills: [],
      completion_criteria: ['criterion A', 'criterion B'],
    }],
    topology: [{ stage: 1, handler: 'coder', task_id: p2GoalTask, depends_on: [], next: null }],
  }
  const p2GoalRun = {
    run_id: uuidv7(),
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    primary_task_id: p2GoalTask,
    affected_task_refs: [p2GoalTask],
    role: 'coder',
    lifecycle: 'IN_PROGRESS',
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
  }
  const p2GoalCompleteCoverage = goalRecheckCoverageError(p2GoalJob, p2GoalRun, [
    { task_id: p2GoalTask, criterion: 'criterion A', result: 'MET' },
    { task_id: p2GoalTask, criterion: 'criterion B', result: 'MET' },
  ])
  const p2GoalMissingCoverage = goalRecheckCoverageError(p2GoalJob, p2GoalRun, [
    { task_id: p2GoalTask, criterion: 'criterion A', result: 'MET' },
  ])

  const p2ReviewerTask = uuidv7()
  const p2TesterTask = uuidv7()
  const p2ReviewerRunId = uuidv7()
  const p2TesterRunId = uuidv7()
  const p2ClosureJob = {
    ...p1DispatchJob,
    tasks: [
      { task_id: p2ReviewerTask, dependencies: [], completion_criteria: ['review'] },
      { task_id: p2TesterTask, dependencies: [], completion_criteria: ['test'] },
    ],
    topology: [
      { stage: 1, handler: 'reviewer', task_id: p2ReviewerTask, depends_on: [], next: p2TesterTask },
      { stage: 2, handler: 'tester', task_id: p2TesterTask, depends_on: [], next: null },
    ],
  }
  const p2ReviewerRun = {
    run_id: p2ReviewerRunId,
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    primary_task_id: p2ReviewerTask,
    role: 'reviewer',
    lifecycle: 'COMPLETED',
    result: 'PASS',
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
  }
  const p2TesterRun = {
    run_id: p2TesterRunId,
    project_id: projectId,
    job_id: nextJobId,
    execution_contract: 'NEXT',
    planning_revision: 7,
    primary_task_id: p2TesterTask,
    role: 'tester',
    lifecycle: 'COMPLETED',
    result: 'PASS',
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
  }
  const p2ReviewerRunEntry = {
    path: recordPath(projectId, 'RUNS', p2ReviewerRunId, 'NEXT'),
    sha: '8'.repeat(40),
    record_text: prettyJson(p2ReviewerRun),
    record: p2ReviewerRun,
  }
  const p2TesterRunEntry = {
    path: recordPath(projectId, 'RUNS', p2TesterRunId, 'NEXT'),
    sha: '9'.repeat(40),
    record_text: prettyJson(p2TesterRun),
    record: p2TesterRun,
  }
  const p2ReviewVerificationId = uuidv7()
  const p2TestVerificationId = uuidv7()
  const p2ReviewVerification = {
    verification_id: p2ReviewVerificationId,
    kind: 'REVIEW',
    project_id: projectId,
    job_id: nextJobId,
    task_id: p2ReviewerTask,
    run_id: p2ReviewerRunId,
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
    producer: 'reviewer',
    execution_contract: 'NEXT',
    planning_revision: 7,
    result: 'PASS',
    findings: [],
    evidence_refs: ['review-evidence'],
  }
  const p2TestVerification = {
    verification_id: p2TestVerificationId,
    kind: 'TEST',
    project_id: projectId,
    job_id: nextJobId,
    task_id: p2TesterTask,
    run_id: p2TesterRunId,
    target_ref: 'correction/p2',
    target_revision: '7'.repeat(40),
    producer: 'tester',
    execution_contract: 'NEXT',
    planning_revision: 7,
    result: 'PASS',
    failure_class: null,
    evidence_refs: ['test-evidence'],
  }
  const p2ReviewVerificationEntry = {
    path: verificationPath(projectId, p2ReviewVerificationId, 'NEXT'),
    sha: 'a'.repeat(40),
    record_text: prettyJson(p2ReviewVerification),
    record: p2ReviewVerification,
  }
  const p2TestVerificationEntry = {
    path: verificationPath(projectId, p2TestVerificationId, 'NEXT'),
    sha: 'b'.repeat(40),
    record_text: prettyJson(p2TestVerification),
    record: p2TestVerification,
  }
  const p2ClosureRefs = [
    p2ReviewerRunEntry.path,
    p2TesterRunEntry.path,
    p2ReviewVerificationEntry.path,
    p2TestVerificationEntry.path,
  ]
  const p2ClosureCoveragePass = nextClosureCoverageError(
    p2ClosureJob,
    [p2ReviewerRunEntry, p2TesterRunEntry],
    [p2ReviewVerificationEntry, p2TestVerificationEntry],
    p2ClosureRefs,
  )
  const p2ClosureMissingVerification = nextClosureCoverageError(
    p2ClosureJob,
    [p2ReviewerRunEntry, p2TesterRunEntry],
    [p2ReviewVerificationEntry],
    p2ClosureRefs,
  )
  const p2StaleReviewVerification = validateRunVerificationSnapshot(
    { ...p2ReviewVerificationEntry, record_text: prettyJson({ ...p2ReviewVerification, target_revision: '6'.repeat(40) }) },
    p2ReviewerRun,
    'reviewer',
    'PASS',
  )
  const p2EmptyEvidenceReviewVerification = validateRunVerificationSnapshot(
    { ...p2ReviewVerificationEntry, record_text: prettyJson({ ...p2ReviewVerification, evidence_refs: [] }) },
    p2ReviewerRun,
    'reviewer',
    'PASS',
  )
  const p2ImportantFindingReviewVerification = validateRunVerificationSnapshot(
    {
      ...p2ReviewVerificationEntry,
      record_text: prettyJson({
        ...p2ReviewVerification,
        findings: [{ severity: 'IMPORTANT', finding: 'unresolved', evidence: [] }],
      }),
    },
    p2ReviewerRun,
    'reviewer',
    'PASS',
  )
  const p2TesterFailureClassVerification = validateRunVerificationSnapshot(
    {
      ...p2TestVerificationEntry,
      record_text: prettyJson({ ...p2TestVerification, failure_class: 'PRODUCT_FAILURE' }),
    },
    p2TesterRun,
    'tester',
    'PASS',
  )
  const p2V2ClosureUnaffected = nextClosureCoverageError(
    { ...p2ClosureJob, execution_contract: 'V2_STABLE' },
    [],
    [],
    [],
  ) === null

  const checks = {
    uuidv7_shape: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(projectId),
    manifest_parse: Boolean(parsed && parsed.project_id === projectId && parsed.lifecycle === 'ACTIVE'),
    pause_transition: Boolean(paused && parseProjectManifest(paused.next)?.lifecycle === 'PAUSED'),
    resume_transition: Boolean(resumed && parseProjectManifest(resumed.next)?.lifecycle === 'ACTIVE'),
    memory_path_accept: validMemoryPath('projects/' + projectId + '/PROJECT.md'),
    memory_path_reject: !validMemoryPath('README.md') && !validMemoryPath('../projects/' + projectId + '/PROJECT.md'),
    p0_owned_source_scope_allowed: p0OwnedSourceScope.allowed && p0OwnedSourceScope.mutation_allowed,
    p0_external_source_mutation_rejected: !p0ExternalSourceScope.allowed && !p0ExternalSourceScope.mutation_allowed,
    p0_explicit_external_read_is_read_only: p0ExternalReadExplicit.allowed && !p0ExternalReadExplicit.mutation_allowed && p0ExternalReadExplicit.scope === 'EXPLICIT_EXTERNAL_READ',
    p0_implicit_external_read_rejected: !p0ExternalReadImplicit.allowed,
    p0_owned_memory_scope_allowed: p0OwnedMemoryScope.allowed && p0OwnedMemoryScope.mutation_allowed,
    p0_other_project_memory_rejected: !p0OtherMemoryScope.allowed,
    p0_paused_project_mutation_rejected: !p0PausedMutationScope.allowed,
    p0_wrong_project_identity_rejected: !p0WrongProjectIdentity.allowed,
    repo_normalization: normalizeGithubRepo('https://github.com/example/memory.git')?.full_name === 'example/memory',
    planner_harness_present: Boolean(renderHarness('planner')?.includes('ROLE LOOP')),
    p0_shared_harness_requires_project_scope_guard: BASE_AGENT_HARNESS.includes('authorize_project_scope'),
    p0_planner_traceability_guard: Boolean(renderHarness('planner')?.includes('owner/surface/evidence/disposition traceability')),
    p0_reviewer_runtime_invariant_check: Boolean(renderHarness('reviewer')?.includes('schema presence alone is not implementation proof')),
    p1_valid_next_dispatch_allowed: p1DispatchValid === null,
    p1_wrong_role_dispatch_rejected: Boolean(p1WrongRole?.includes('NEXT_DISPATCH_WRONG_ROLE')),
    p1_unmet_prerequisite_dispatch_rejected: Boolean(p1MissingPrerequisite?.includes('NEXT_DISPATCH_PREREQUISITE_BLOCKED')),
    p1_stale_planning_revision_rejected: Boolean(p1StaleRevision?.includes('NEXT_DISPATCH_STALE_PLANNING_REVISION')),
    p1_stale_job_sha_rejected: Boolean(p1StaleJobSha?.includes('NEXT_DISPATCH_STALE_JOB_SHA')),
    p1_v2_stable_dispatch_unchanged: p1V2StableUnaffected,
    p1_shared_harness_requires_exact_dispatch_state: BASE_AGENT_HARNESS.includes('exact current Job SHA and planning_revision'),
    p2_ui_coder_required_skill_context_injected:
      p2UiSkillResolution.error === null &&
      p2UiSkillResolution.names.includes('ui-coder-frontend') &&
      p2UiSkillResolution.contexts.some((item: any) => item.name === 'ui-coder-frontend' && item.skill_text.length > 0),
    p2_ui_coder_dispatch_allowed_with_runtime_injection: p2UiDispatch === null,
    p2_unknown_required_skill_rejected: Boolean(p2UnknownSkillResolution.error?.includes('NEXT_DISPATCH_REQUIRED_SKILL_UNKNOWN')),
    p2_generic_coder_unaffected_by_ui_skill:
      p2GenericSkillResolution.error === null &&
      p2GenericSkillResolution.names.length === 0 &&
      p2GenericCoderUnaffected === null,
    p2_goal_recheck_full_criterion_coverage_passes: p2GoalCompleteCoverage === null,
    p2_goal_recheck_missing_criterion_rejected: Boolean(p2GoalMissingCoverage?.includes('GOAL_RECHECK_COVERAGE_REJECTED')),
    p2_reviewer_tester_closure_coverage_passes: p2ClosureCoveragePass === null,
    p2_missing_durable_verification_blocks_closure: Boolean(p2ClosureMissingVerification?.includes('NEXT_CLOSURE_COVERAGE_REJECTED')),
    p2_stale_review_verification_rejected: Boolean(p2StaleReviewVerification.error),
    p2_empty_evidence_review_verification_rejected: Boolean(p2EmptyEvidenceReviewVerification.error),
    p2_important_finding_review_verification_rejected: Boolean(p2ImportantFindingReviewVerification.error),
    p2_tester_success_failure_class_rejected: Boolean(p2TesterFailureClassVerification.error),
    p2_v2_stable_closure_unchanged: p2V2ClosureUnaffected,
    p3_cutover_inventory_resolved: cutoverInventoryError() === null,
    p3_unresolved_cutover_inventory_rejected: Boolean(cutoverInventoryError(p3PendingInventory)?.includes('CUTOVER_INVENTORY_UNRESOLVED')),
    p3_staging_surface_detected: runtimeSurface(p3StagingRequest) === 'STAGING_NEXT',
    p3_production_surface_detected: runtimeSurface(p3ProductionRequest) === 'PRODUCTION',
    p3_staging_new_job_default_remains_v2: jobCreationExecutionContractDefault(p3StagingRequest) === 'V2_STABLE',
    p3_production_new_job_default_is_next: jobCreationExecutionContractDefault(p3ProductionRequest) === 'NEXT',
    p3_staging_next_namespace_is_test_lab: nextMemoryNamespaceForRequest(p3StagingRequest) === 'TEST_LAB',
    p3_production_next_namespace_is_production: nextMemoryNamespaceForRequest(p3ProductionRequest) === 'PRODUCTION',
    p3_historical_next_missing_namespace_defaults_test_lab: resolveNextMemoryNamespace(undefined, 'NEXT') === 'TEST_LAB',
    p3_production_next_job_path_outside_test_lab:
      recordPath(projectId, 'JOBS', uuidv7(), 'NEXT', 'PRODUCTION').startsWith('projects/' + projectId + '/WORK/JOBS/') &&
      !recordPath(projectId, 'JOBS', uuidv7(), 'NEXT', 'PRODUCTION').includes('/TEST-LAB/NEXT/'),
    p3_production_next_verification_path_outside_test_lab:
      verificationPath(projectId, uuidv7(), 'NEXT', 'PRODUCTION').startsWith('projects/' + projectId + '/VERIFICATION/') &&
      !verificationPath(projectId, uuidv7(), 'NEXT', 'PRODUCTION').includes('/TEST-LAB/NEXT/'),
    p3_staging_and_production_next_paths_are_separate:
      recordPath(projectId, 'JOBS', nextJobId, 'NEXT', 'TEST_LAB') !== recordPath(projectId, 'JOBS', nextJobId, 'NEXT', 'PRODUCTION'),
    p3_missing_execution_contract_still_v2_compatible: resolveExecutionContract(undefined) === 'V2_STABLE',
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
    critic_harness_present: Boolean(renderHarness('critic_reviewer')?.includes('HUMAN AUTHORITY:')),
    critic_skill_suggested: (ROLE_SKILLS.critic_reviewer ?? []).includes('critic-review'),
    critic_human_authority_scoped: Boolean(renderHarness('critic_reviewer')?.includes('HUMAN AUTHORITY:') && renderHarness('critic_reviewer')?.includes('Human-preauthorized milestone crl')),
    critic_stateless_contract: Boolean(renderHarness('critic_reviewer')?.includes('Conversation history is non-authoritative')),
    ux_first_temp_ui_defaults_to_gate:
      uxFirstTemporaryUiGateRequired({ product_workflow: 'UX_FIRST', ui_strategy: { temporary_ui: [{ kind: 'temporary' }], temporary_ui_human_approval: 'REQUIRED_PENDING' } }, 'coder') &&
      !uxFirstTemporaryUiGateRequired({ product_workflow: 'UX_FIRST', ui_strategy: { temporary_ui: [{ kind: 'temporary' }], temporary_ui_human_approval: 'APPROVED' } }, 'coder') &&
      !uxFirstTemporaryUiGateRequired({ product_workflow: 'UX_FIRST', ui_strategy: { temporary_ui: [{ kind: 'temporary' }], temporary_ui_human_approval: 'REQUIRED_PENDING' } }, 'tester'),
    run_begin_requires_job_snapshot:
      p1DispatchValid === null &&
      Boolean(nextDispatchPreflightError(p1DispatchJob, 'tester', [p1TaskB], 7, null, null, [p1CompletedEntry])?.includes('NEXT_DISPATCH_STALE_JOB_SHA')),
    oauth_public_resource_canonical_on_internal_http:
      mcpResource(new Request('http://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp-next/mcp')) ===
      'https://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp-next/mcp' &&
      resourceMetadata(new Request('http://fbyqktduoqlpbbtkghkf.supabase.co/functions/v1/gsa-mcp/mcp')).startsWith('https://'),
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
    cp7_next_no_checkpoint_dispatch_allowed: cp7NoCheckpointGate.allowed && cp7NoCheckpointGate.required_checkpoint_ids.length === 0,
    cp7_ui_coder_frontend_remains_opt_in: Boolean(RUNTIME_SKILLS['ui-coder-frontend']) && !(ROLE_SKILLS.coder ?? []).includes('ui-coder-frontend'),
    cp7_ui_coder_frontend_handoff_requires_explicit_load:
      cp7PlannerSkill.includes('required_skills=[ui-coder-frontend]') &&
      cp7PlannerSkill.includes('explicitly name ui-coder-frontend in the handoff') &&
      cp7PlannerSkill.includes('run_begin resolves and injects the full required skill context at dispatch') &&
      Boolean(RUNTIME_SKILLS['ui-coder-frontend']) &&
      !(ROLE_SKILLS.coder ?? []).includes('ui-coder-frontend'),
    cp7_product_failure_routes_to_repair_retest:
      cp7ProductFailureOutcome.state === 'FAILED_PRODUCT' &&
      cp7ProductFailureOutcome.route === 'CODER_REPAIR_GOAL_RECHECK_RETEST' &&
      cp7ProductFailureOutcome.retestRequired === true,
    cp7_product_failure_retest_requires_repaired_goal:
      cp7ProductRetestAllowed && cp7ProductRetestSameTargetRejected,
    cp7_plan_gap_routes_to_supersession:
      cp7PlanGapOutcome.state === 'NEEDS_PLANNER_REVISION' &&
      cp7PlanGapOutcome.route === 'PLANNER_REVISION_SUPERSEDE' &&
      cp7PlanGapOutcome.retestRequired === false,
    cp7_plan_gap_supersession_requires_terminal_claim:
      cp7PlanGapSupersessionAccepted && cp7PlanGapSupersessionMismatchRejected,
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
    cp6_private_attestation_accepts_authenticated_proof: validateEvidenceBundleAttestationSnapshot(cp6PrivateAttestationSnapshot, cp6ExpectedBundleContext).error === null,
    cp6_private_attestation_rejects_manifest_proof_mismatch: validateEvidenceBundleAttestationSnapshot(cp6BadPrivateAttestationSnapshot, cp6ExpectedBundleContext).error !== null,
    cp6_repo_attestation_accepts_finalize_proof: validateEvidenceBundleAttestationSnapshot(cp6RepoAttestationSnapshot, cp6ExpectedBundleContext).error === null,
    cp6_repo_attestation_rejects_commit_proof_mismatch: validateEvidenceBundleAttestationSnapshot(cp6BadRepoAttestationSnapshot, cp6ExpectedBundleContext).error !== null,
    cp6_checkpoint_bundle_is_applicable_when_exact: checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], cp6ClaimWithBundle, cp6VerificationWithBundle),
    p3_production_checkpoint_bundle_attestation_is_applicable: checkpointVerificationApplicable(cp6ProductionJobWithRepo, cp6ProductionJobWithRepo.test_checkpoints[0], cp6ProductionClaimWithBundle, cp6ProductionVerificationWithBundle),
    p3_production_checkpoint_bundle_rejects_test_lab_attestation_path: !checkpointVerificationApplicable(cp6ProductionJobWithRepo, cp6ProductionJobWithRepo.test_checkpoints[0], cp6ProductionClaimWithBundle, cp6ProductionVerificationWithLabAttestation),
    cp6_checkpoint_bundle_rejects_missing_attestation_ref: !checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], cp6ClaimWithBundle, { ...cp6VerificationWithBundle, evidence_bundle_attestation_refs: [] }),
    cp6_checkpoint_bundle_rejects_retest_attempt_mismatch: !checkpointVerificationApplicable(cp6JobWithRepo, cp6JobWithRepo.test_checkpoints[0], { ...cp6ClaimWithBundle, attempt_id: uuidv7() }, cp6VerificationWithBundle),
    cp6_handoff_claim_accepts_current_terminal_verification: validateTesterEvidenceClaimSnapshot(cp6TerminalClaimSnapshot, cp6VerificationWithBundle, cp6HandoffClaimExpected).error === null,
    cp6_handoff_claim_rejects_orphan_verification: validateTesterEvidenceClaimSnapshot(cp6OrphanClaimSnapshot, cp6VerificationWithBundle, cp6HandoffClaimExpected).error !== null,
    edge_function_external_path: edgeFunctionBase(new Request('https://example.supabase.co/functions/v1/gsa-mcp-next/mcp')) === `https://${PROJECT_REF}.supabase.co/functions/v1/gsa-mcp-next`,
    edge_function_runtime_path: edgeFunctionBase(new Request('https://example.supabase.co/gsa-mcp-next/mcp')) === `https://${PROJECT_REF}.supabase.co/functions/v1/gsa-mcp-next`,
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

}
