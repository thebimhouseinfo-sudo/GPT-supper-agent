# Claude Peer Review Round 2 — Disposition

## Status

```text
SOURCE = Claude Peer Review Round 2
DISPOSITION = ACCEPT ALL R2-01..R2-07
PHASE_2 = BLOCKED UNTIL MUST PROBES + FINAL CONSISTENCY REVIEW
CANONICAL = false
```

## Verdict received

Claude round 2 concluded:

```text
READY FOR PHASE 2 WITH PROBES/CALIBRATION GATES
```

conditional on:
- resolving R2-01 and R2-02;
- resolving the other IMPORTANT findings;
- running the three MUST probes.

## Dispositions

### R2-01 — Job shared mutable write-back race
```text
ACCEPT
```
Fix:
- explicit read-time join model;
- completing Runs never mutate Job progress/reference arrays;
- Job Tasks/topology are planning/control-owned;
- Runs/Verification/Retests/Assets carry job_id/task_id backrefs;
- Job status view joins records at read time.

### R2-02 — mandatory review floor detection
```text
ACCEPT
```
Fix:
- Repo Claim gains Project/Planner-governed sensitive path declarations;
- actual changed-file/operation evidence is mechanically classified;
- universal patterns include workflow files and lockfiles;
- Coder scope-claim hint cannot disable review floor.

### R2-03 — capability AVAILABLE vs probe contradiction
```text
ACCEPT
```
Fix:
replace ambiguous availability with evidence states:
```text
OBSERVED
SURFACE_PRESENT
UNAVAILABLE
UNKNOWN
```
Only OBSERVED is operationally proven.

### R2-04 — missing Knowledge Artifact schema
```text
ACCEPT
```
Fix:
add compact Knowledge Artifact record/front matter:
- id;
- kind;
- revision;
- validity;
- depends_on[];
- supersedes?;
- source/approval metadata.

### R2-05 — pending-Handoff discovery scope
```text
ACCEPT
```
Fix:
- Project open → default current Project;
- no Project open → shallow Drive-root Project scan;
- use CONTROL pending handles where valid;
- fallback to durable records;
- never full-load Project knowledge/source merely to find handoffs.

### R2-06 — Job scope-growth rule
```text
ACCEPT
```
Fix:
Task growth remains in Job only when finite objective remains materially the same.
Materially different objective becomes linked Job.

### R2-07 — Run WAITING_HUMAN duplication
```text
ACCEPT
```
Fix:
Run stored lifecycle no longer includes WAITING_HUMAN/BLOCKED as authoritative lifecycle.
They are derived work conditions from Human Gate/blocker records.

## Additional schema fix

Round 2 also noted Review Coverage Summary lacked a record shape.

Fix:
`CORE-RECORD-CONTRACTS-v1.md` now defines the summary fields and allows Release Record to reference/embed it.

## Probe classification adopted

### MUST_BE_PROBED_BEFORE_PHASE_2
1. raw Drive create/update/read round-trip;
2. GitHub binary commit round-trip;
3. merge + branch cleanup/confirmation behavior.

### CAN_BE_PROBED_DURING_PHASE_2_BOOTSTRAP
- protected/default branch behavior;
- image direct persistence;
- practical runtime/browser Tester capability.

### NOT NEEDED FOR PHASE-2 ENTRY
- Drive comments unless later selected as load-bearing.

## Authority note

Claude remains independent challenge evidence, not product/architecture authority.

These dispositions are accepted because they reconcile already-approved semantics and remove contradictions without changing the settled hierarchy/authority model.
