# M0 Gate

## Result

```text
M0 = PASS
BASELINE_MAIN_SHA = 5e70e1446e4b9d804152a89664e30e5028de529f
PHASE_2_STARTED = YES
NEXT_TASK = P2-T005
```

## Canonical source pin

Source index:
`docs/architecture/DOCUMENT-INDEX.md`

All 22 canonical architecture paths listed by the index were present at the pinned baseline SHA.

Pinned domains:
- Foundation
- Architecture
- System Definition
- Project Memory
- Core Record Contracts
- Job Lifecycle
- State Model
- Governance / Artifact Lifecycle
- Security / Trust Boundaries
- User Configuration / Memory Repo
- Agent Harnesses
- Execution / Review
- Dispatch / Handoff
- Attribution / Scope Claims
- Capability Catalog
- Identity / Handles
- Coder Goal Recheck
- Clarification / Causal Readiness
- Planner Scope / UIUX
- Designer Harness
- Coder UIUX Harness
- UI Spec Model

## Entry checks

- PASS — README/current architecture declares Phase 1 as governed baseline and Phase 2 not previously started.
- PASS — DOCUMENT-INDEX resolves all canonical architecture paths.
- PASS — baseline main SHA recorded above.
- PASS — capability states required for M1A are classified in CAPABILITY-CATALOG.
- PASS — no M0 criterion depends on deleted peer-review/history files.
- PASS — CONTROL fast path + durable reconstruction/no Run→Job aggregate write-back is canonical.
- PASS — mechanical review-floor classification is defined from actual diff/operations.
- PASS — capability vocabulary is OBSERVED / SURFACE_PRESENT / UNAVAILABLE / UNKNOWN.
- PASS — Knowledge Artifact contract exists.
- PASS — scoped Handoff discovery and immutable consumption model exist.
- PASS — Job scope-growth boundary exists.
- PASS — Run WAITING_HUMAN / BLOCKED / ABANDONED are derived conditions.

## Capability snapshot relevant to M1A

```text
GitHub repository metadata/read             OBSERVED
GitHub text create/update/delete            OBSERVED
GitHub blob/tree/commit                     OBSERVED
GitHub PR create/read/merge                 OBSERVED
GitHub branch delete                        UNAVAILABLE

Supabase per-user OAuth/config chain        TO_PROVE in M1A
Harness delivery/loading into ChatGPT       TO_PROVE in M1A
```

## Non-blocking limitations

- protected/default branch behavior remains UNKNOWN / permission-dependent;
- generated-image direct persistence remains UNKNOWN;
- practical runtime/browser Tester capability remains UNKNOWN;
- branch auto-cleanup is not assumed.

These do not block M1A.

## Implementation roots

Git does not preserve empty directories, so M0 creates only placeholder files for:

```text
harness/
schemas/
evals/
```

No downstream milestone artifact is populated speculatively.

## Change control

```text
MECHANICAL → implement
HARNESS_QUALITY → calibrate
CAPABILITY_TRUTH → update evidence/fallback
SEMANTIC_CONTRADICTION → stop affected work and reopen architecture governance
```

## M0 conclusion

The current governed architecture is coherent enough to begin Phase 2.

Proceed to P2-T005: M1A harness/runtime bootstrap spike.


## Storage backend amendment

The M0 semantic baseline remains valid, but the physical Project Memory backend was later amended by explicit human decision:

```text
Project Memory backend = per-user private GitHub Memory Repo
Supabase = user identity + Memory Repo config only
Source repositories = separate source-code truth
```

Current implementation must follow the canonical Memory Repo architecture, not superseded storage experiments.
