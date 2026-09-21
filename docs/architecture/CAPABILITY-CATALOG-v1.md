# Capability Catalog v1

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

## 3. Initial catalog

### Google Drive / Project Memory
- list Project root children;
- create folder;
- read text/file;
- create raw markdown/json;
- update raw markdown/json;
- comments read/write if used;
- revision-aware/conditional update.

### GitHub
- repository read;
- text file create/update/delete;
- branch create;
- commit;
- PR create/read;
- PR comments/review surfaces;
- changed-file/diff inspection;
- Actions run status/log read;
- binary commit;
- merge;
- delete branch;
- protected-branch/rules visibility where permission permits.

### Runtime / testing
- deployed URL access;
- browser navigation;
- localhost/private runtime access;
- screenshot capture;
- interactive product use;
- desktop/Revit/AutoCAD execution.

### Media/design
- image generation;
- image edit;
- transparent output;
- exact-size output;
- persistence of generated image directly to Drive/GitHub.

## 4. Observed matrix

Phase-1 keeps this matrix explicit.

```text
Capability                         State      Evidence/Note
Drive conditional write           UNKNOWN    probe required
GitHub source read/write           AVAILABLE  connector observed
GitHub independent identity review UNAVAILABLE same user identity
Runtime/browser Tester execution   UNKNOWN    probe required
Image generation                   AVAILABLE  platform tool exists
Image direct persistence           UNKNOWN    probe required
```

Other entries must be filled from observed connector behavior before relying on them.

## 5. Repo readiness baseline

For each coding Job, record available repository checks:
- CI workflow exists?;
- tests?;
- build?;
- lint?;
- typecheck?;
- deploy preview?;
- other relevant checks.

Missing check is not failure, but its acceptance criterion remains UNVERIFIED if no alternative evidence exists.

## 6. Probe rule

Platform probes determine capability truth; they do not silently expand role authority.

Probe results update this catalog/matrix and may reveal a theory gap requiring Phase-1 amendment.
