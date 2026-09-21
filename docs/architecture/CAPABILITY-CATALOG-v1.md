# Capability Catalog v1.1

## 1. State

```text
AVAILABLE
UNAVAILABLE
UNKNOWN
```

Derived execution mode:
```text
NORMAL
DEGRADED
BLOCKED
```

UNKNOWN is never assumed AVAILABLE.

## 2. Enforcement

```text
HARD
SOFT
UNKNOWN
```

Capability availability and policy enforcement are separate dimensions.

## 3. Current observed connector surface

The following reflects capabilities visible/used in the current ChatGPT connector environment. "AVAILABLE" means the action surface is present or has been successfully used; it does not imply every target permission succeeds.

### Google Drive

```text
list folder                         AVAILABLE
create folder                       AVAILABLE
read files/folders                  AVAILABLE
upload raw file bytes               AVAILABLE
replace raw file bytes in place     AVAILABLE
native Docs/Sheets/Slides edits     AVAILABLE
file comments read/write            AVAILABLE
conditional/revision-aware write    UNAVAILABLE in current update action schema
```

Important:
Drive raw-file update action exposes no revision/precondition parameter. Therefore GSA correctness must not depend on compare-and-swap.

### GitHub

Observed/available tool surface:

```text
repo/file read                      AVAILABLE
text create/update/delete           AVAILABLE (used in Phase 1)
branch create                       AVAILABLE
commit/tree/blob creation            AVAILABLE
PR create/read/update               AVAILABLE
PR diff/changed files               AVAILABLE
PR comments/review surfaces         AVAILABLE
Actions run/job/log inspection      AVAILABLE
workflow rerun                      AVAILABLE
binary blob creation                AVAILABLE
merge pull request                  AVAILABLE
independent reviewer identity       UNAVAILABLE under same connected user identity
branch delete                       UNKNOWN in current exposed high-level actions
protected-branch enforcement read   DEGRADED/permission-dependent via available read surfaces
```

Merge action existence does not authorize merge; human authorization rule still applies.

### Runtime / testing

```text
public web fetch/search             AVAILABLE
general deployed-app interaction    UNKNOWN
authenticated/private preview       UNKNOWN
localhost/private runtime           UNAVAILABLE in ordinary connector chat unless another executor is provided
desktop/Revit/AutoCAD execution     UNAVAILABLE in ordinary online harness
interactive screenshot-driven test UNKNOWN
```

Tester practical execution remains capability-gated.

### Media/design

```text
image generation                    AVAILABLE
image editing                       AVAILABLE
transparent output request          AVAILABLE
exact-size behavior                 capability-dependent
direct generated-image persistence
  into Drive/GitHub                 UNKNOWN
```

## 4. Repo readiness baseline

Each coding Job records which objective checks are actually available:
- CI workflow?;
- tests?;
- build?;
- lint?;
- typecheck?;
- deploy preview?;
- runtime/browser?;
- other domain-specific checks.

Missing check is not itself failure, but affected criteria remain `UNVERIFIED` unless another evidence path exists.

## 5. Enforcement examples

Likely HARD or externally enforced only when platform actually provides it:
- connector repository authorization scope;
- protected branch/rules;
- explicit platform confirmation prompts;
- human-controlled merge flow.

Likely SOFT in harness:
- role write boundaries when same connector exposes write action;
- review-trigger detection;
- scope-claim conflict detection;
- check-before-consequential-action.

## 6. Remaining Phase-1 probes

Still require real target tests before relying on them:
- raw Drive create/update round-trip under intended Project root;
- Google Drive comment workflow only if chosen for Phase 2;
- GitHub binary commit round-trip;
- merge + branch cleanup behavior/confirmation;
- protected/default branch behavior on a representative repo;
- direct image persistence path;
- practical runtime/browser capability for Tester.

These probes may be performed on a disposable test Project/repo or representative pilot before Phase-2 harness claims those capabilities as operational.

## 7. Rule

Platform probe result may change capability/enforcement truth.

It does not silently expand role authority or rewrite product semantics.
