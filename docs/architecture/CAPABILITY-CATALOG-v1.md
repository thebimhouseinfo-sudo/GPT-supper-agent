# Capability Catalog v1.2

## 1. Capability evidence state

```text
OBSERVED
= successful end-to-end execution has been observed for the relevant action class

SURFACE_PRESENT
= connector/tool action exists in schema but end-to-end behavior for this use has not been proven

UNAVAILABLE
= required action is absent or known unusable in current environment

UNKNOWN
= surface/behavior has not yet been established
```

Only OBSERVED capability may be relied on as an operational guarantee.

SURFACE_PRESENT may justify a probe, not a success claim.

## 2. Derived execution mode

```text
NORMAL
DEGRADED
BLOCKED
```

## 3. Enforcement

```text
HARD
SOFT
UNKNOWN
```

Availability evidence and policy enforcement are separate.

## 4. Current matrix

### Google Drive

```text
list folder                       SURFACE_PRESENT
create folder                     SURFACE_PRESENT
read files/folders                SURFACE_PRESENT
upload raw file bytes             SURFACE_PRESENT
replace raw file bytes            SURFACE_PRESENT
native Workspace edits            SURFACE_PRESENT
file comments                     SURFACE_PRESENT
conditional/revision-aware write  UNAVAILABLE in current raw update action schema
```

Raw Drive Project round-trip remains a required probe before Phase 2.

### GitHub

```text
repo/file read                    OBSERVED
text create/update                OBSERVED
text delete                       SURFACE_PRESENT
branch create                     SURFACE_PRESENT
commit/tree/blob creation         SURFACE_PRESENT
PR create/read/update             SURFACE_PRESENT
PR diff/changed files             SURFACE_PRESENT
PR review/comment surfaces        SURFACE_PRESENT
Actions run/job/log inspection    SURFACE_PRESENT
workflow rerun                    SURFACE_PRESENT
binary blob/commit path           SURFACE_PRESENT
merge pull request                SURFACE_PRESENT
independent reviewer identity     UNAVAILABLE under same connected user identity
branch delete                     UNKNOWN in current exposed high-level actions
protected-branch behavior         UNKNOWN / permission-dependent
```

Binary commit and merge behavior remain required probes before Phase 2.

### Runtime / testing

```text
public web fetch/search           OBSERVED
general deployed-app interaction  UNKNOWN
authenticated/private preview     UNKNOWN
localhost/private runtime         UNAVAILABLE in ordinary connector chat unless another executor exists
desktop Revit/AutoCAD execution   UNAVAILABLE in ordinary online harness
interactive screenshot testing   UNKNOWN
```

Tester practical execution remains capability-gated.

### Media/design

```text
image generation                  SURFACE_PRESENT
image editing                     SURFACE_PRESENT
transparent-output request        SURFACE_PRESENT
direct generated-image persistence UNKNOWN
```

## 5. Repo readiness baseline

Each coding Job records observed/surface-present status for applicable:
- CI;
- tests;
- build;
- lint;
- typecheck;
- preview;
- runtime/browser;
- domain-specific checks.

If not OBSERVED, an acceptance criterion cannot be marked verified by that capability.

## 6. Phase-1 probe classification

### MUST_BE_PROBED_BEFORE_PHASE_2
- raw Drive create/update/read round-trip in a disposable Project folder;
- GitHub binary commit round-trip;
- merge behavior + branch cleanup/confirmation path.

### CAN_BE_PROBED_DURING_PHASE_2_BOOTSTRAP BEFORE FIRST REAL USE
- protected/default branch behavior;
- direct generated-image persistence;
- practical runtime/browser Tester capability.

### NOT NEEDED FOR PHASE-2 ENTRY
- Google Drive comment workflow unless later selected as load-bearing.

## 7. Rule

Probe updates capability evidence state only.

It does not expand role authority.

A theory fallback may permit Phase 2 even when a capability remains unavailable, but all MUST probes must be executed and classified before entry.
