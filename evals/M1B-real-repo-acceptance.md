# M1B Real-Repo Acceptance — Memory Repo Cutover

## Status

```text
SOURCE_REPO = KE-Math-Grade1
MEMORY_BACKEND = GITHUB MEMORY REPO
RUNTIME = GSA MCP v20+
OLD STORAGE ACCEPTANCE = SUPERSEDED
NEW MEMORY-REPO ACCEPTANCE = PENDING CONFIGURED PRIVATE REPO
```

## Source repository

Pilot target:

`thebimhouseinfo-sudo/KE-Math-Grade1`

The Project-memory acceptance must not modify this source repository.

## Cutover requirement

All durable acceptance evidence must now be reproduced using:

```text
configured private Memory Repo
└── projects/<project-id>/...
```

No alternate storage backend participates in the acceptance result.

## Required evidence

- Memory Repo config saved through RLS;
- fresh-chat config recovery;
- create/read PROJECT.md;
- list/open/status;
- ACTIVE → PAUSED → ACTIVE;
- blob SHA changes across updates;
- stale SHA conflict;
- wrong-repo mutation DENY;
- outside-prefix mutation DENY;
- source repository unchanged.

See `evals/E1-project-lifecycle.md`.
