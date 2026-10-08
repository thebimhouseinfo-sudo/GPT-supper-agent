# E32 — Project scope + correction traceability

Target: P0 correction branch.

## Admission / scope cases

1. Active Project + OWNED source repo mutation target → ALLOW.
2. Active Project + another repo mutation target → DENY.
3. Active Project + explicitly requested external repo read → ALLOW READ ONLY.
4. Active Project + implicit/proactive external repo read → DENY.
5. Active Project + own `projects/<project-id>/...` Memory path → ALLOW.
6. Active Project + another Project Memory path → DENY.
7. PAUSED Project + source/Memory mutation → DENY.
8. Supplied Project ID does not match exact PROJECT.md → DENY.
9. Unrelated remembered Project topic → harness requires Project-mismatch warning before operational continuation.
10. Human confirms outside-topic discussion → discussion may continue but mutation scope does not change.

## Traceability cases

1. Every accepted correction requirement has source, owner, implementation/evidence obligation and disposition in the canonical Lessons Ledger matrix.
2. Missing any traceability link is PLAN_GAP.
3. Reviewer checks executable behavior against the approved invariant; schema presence alone is insufficient.
4. P1/P2 must reread P0 traceability before execution.
5. P5 audits all accepted correction rows before release.

## Compatibility

- Missing/legacy execution contract remains V2_STABLE.
- Project-scope guard is additive and does not rewrite historical Job records.
- Direct Coder remains available when explicitly invoked, but stays inside active Project scope.
