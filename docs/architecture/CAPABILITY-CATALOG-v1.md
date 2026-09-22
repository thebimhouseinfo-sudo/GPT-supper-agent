# Capability Catalog v1.3

## 1. Capability evidence state

```text
OBSERVED
= successful end-to-end execution has been observed for the relevant action class

SURFACE_PRESENT
= connector/tool action exists but end-to-end behavior for this use has not been proven

UNAVAILABLE
= action is absent or known unusable in the current environment

UNKNOWN
= surface/behavior has not yet been established
```

Only OBSERVED may be relied on as an operational guarantee.

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

Capability evidence and policy enforcement are separate.

## 4. Current observed matrix

### Google Drive

Phase-1 raw-file round-trip probe completed successfully.

Observed:
```text
create folder                      OBSERVED
upload raw .md bytes               OBSERVED
read raw .md                       OBSERVED
replace raw bytes in place         OBSERVED
read-back updated bytes            OBSERVED
delete raw file                    OBSERVED
delete temporary folder            OBSERVED (via Drive file resource URL form)
conditional/revision-aware write   UNAVAILABLE in current raw update action schema
```

Probe evidence:
- temporary Drive folder created;
- `phase1-drive-probe.md` uploaded as raw `text/markdown`;
- v1 bytes read back exactly;
- same Drive file ID updated to v2 bytes;
- v2 bytes read back exactly;
- temporary file/folder deleted.

Therefore raw Drive Project-memory file round-trip is operationally OBSERVED.

### GitHub

Observed during Phase 1:
```text
repo/file read                     OBSERVED
text create/update/delete          OBSERVED
branch create                      OBSERVED
create blob/tree/commit            OBSERVED
move/update branch ref             OBSERVED
binary blob/commit round-trip      OBSERVED
PR create/read                     OBSERVED
PR merge                           OBSERVED
binary read-back                   OBSERVED
independent reviewer identity      UNAVAILABLE under same connected user identity
branch delete action               UNAVAILABLE in current exposed connector surface
automatic branch cleanup on merge  NOT OBSERVED (probe branch remained)
```

Merge probe details:
- a 16-byte binary probe was committed on a temporary branch;
- binary bytes were fetched back exactly;
- PR #1 was opened and reported mergeable;
- connector merge succeeded;
- probe branch remained after merge;
- current connector exposes no branch-delete action;
- branch was force-reset to current main as cleanup fallback;
- merged binary probe file was then deleted from main.

Important governance result:
```text
merge capability = OBSERVED
connector-enforced human confirmation = NOT RELIED UPON
explicit human authorization = harness SOFT governance requirement
branch auto-cleanup = do not assume
```

### GitHub capability still surface-present/unproven

```text
PR diff/changed files              SURFACE_PRESENT
PR review/comment surfaces         SURFACE_PRESENT
Actions run/job/log inspection     SURFACE_PRESENT
workflow rerun                     SURFACE_PRESENT
protected/default branch behavior  UNKNOWN / permission-dependent
```

These are not Phase-1 entry blockers because the theory has safe fallbacks or they can be probed during Phase-2 bootstrap before first real use.

### Runtime / testing

```text
public web fetch/search            OBSERVED
general deployed-app interaction   UNKNOWN
authenticated/private preview      UNKNOWN
localhost/private runtime          UNAVAILABLE in ordinary connector chat unless another executor exists
desktop Revit/AutoCAD execution    UNAVAILABLE in ordinary online harness
interactive screenshot testing    UNKNOWN
```

Tester practical execution remains capability-gated; human Retest is the fallback.

### Media/design

```text
image generation                   SURFACE_PRESENT
image editing                      SURFACE_PRESENT
transparent-output request         SURFACE_PRESENT
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

A criterion is not verified by a capability unless that capability is OBSERVED for the relevant action/environment.

## 6. Phase-1 probe gate

### MUST_BE_PROBED_BEFORE_PHASE_2

```text
raw Drive create/update/read round-trip   PASS / OBSERVED
GitHub binary commit round-trip           PASS / OBSERVED
merge + branch cleanup/confirmation       PASS AS CLASSIFICATION
  merge                                  OBSERVED
  automatic branch cleanup               NOT OBSERVED
  connector branch delete                UNAVAILABLE
  fallback                               preserve/reset branch; never assume deletion
```

All MUST probes have been executed and classified.

### CAN_BE_PROBED_DURING PHASE-2 BOOTSTRAP BEFORE FIRST REAL USE
- protected/default branch behavior;
- direct generated-image persistence;
- practical runtime/browser Tester capability.

### NOT NEEDED FOR PHASE-2 ENTRY
- Google Drive comment workflow unless later selected as load-bearing.

## 7. Rule

Probe results update capability evidence only.

They do not expand role authority.

Unavailable branch cleanup or Tester runtime capability does not block Phase 2 because coherent fallbacks exist.
