# Phase 1 Platform Probe Checklist v0.1

## Status

```text
CANONICAL = false
PURPOSE = classify platform capabilities before Phase 2
```

These probes test platform reality. They do not authorize Phase 2 by themselves.

## Drive

- list configured root children;
- create folder;
- create/read/update raw .md;
- create/read/update raw .json;
- determine whether updates preserve raw file format;
- test conditional/revision-aware update if connector exposes it;
- Google Doc comment write/read only if planned workflow needs comments.

## GitHub

- text source create/update/delete;
- create branch;
- PR create/read/comment;
- changed filenames/diff;
- Actions run status;
- Actions logs;
- binary file commit;
- merge behavior and confirmation;
- branch deletion behavior;
- protected/default branch behavior within connector permissions.

## Media

- generate image;
- transparency;
- exact dimension behavior;
- determine whether generated image can be persisted directly to Drive/GitHub without manual download.

## Runtime / Tester

Determine whether available connected capabilities can:
- open deployed URL;
- interact with app;
- capture screenshot;
- use authenticated/private preview;
- exercise relevant UI realistically.

If unavailable:
```text
Tester practical execution = UNAVAILABLE
human Retest workflow = default
```

## Output

Update CAPABILITY-CATALOG-v1.md observed matrix with:
```text
capability
state
evidence
enforcement = HARD | SOFT | UNKNOWN
limitations
```
