# E25 — Execution contract backward compatibility

## Goal

Prove CP0 adds a non-activating execution contract discriminator without changing historical GSA Job behavior.

## Contract

```text
missing execution_contract -> V2_STABLE
execution_contract=V2_STABLE -> V2_STABLE
execution_contract=NEXT -> NEXT (representation only in CP0)
anything else -> reject
```

CP0 does not activate NEXT orchestration. The discriminator only creates the compatibility fence for later checkpoints.

## Cases

### E25-01 — Historical Job

Input: an existing Job record with no `execution_contract`.

Expected:
- planning review/revision paths still accept the record when all existing lifecycle rules pass;
- DRAFT -> READY remains unchanged;
- READY -> IN_PROGRESS remains unchanged;
- `run_begin` remains unchanged;
- no NEXT behavior activates.

### E25-02 — Explicit stable Job

Input: same fixture with `execution_contract: "V2_STABLE"`.

Expected: behavior is equivalent to E25-01.

### E25-03 — Explicit NEXT staging Job

Input: a synthetic Test Lab Job created with `execution_contract: "NEXT"`.

Expected:
- the record is representable/readable;
- ordinary V2 lifecycle tools remain usable;
- CP0 does not add checkpoint/UI-Coder/EvidenceNeed routing.

### E25-03B — NEXT Coder Goal Recheck continuity

Input: a Coder Run created from a synthetic NEXT Job.

Expected:
- `run_begin` persists `execution_contract: "NEXT"` on the Run;
- `goal_recheck_record` requires the exact current owning Run record plus its current Git blob SHA, validates project/job/run identity plus `role=coder` and `lifecycle=IN_PROGRESS`, and derives `execution_contract` from that Run rather than accepting a caller-selected contract;
- a historical owning Run with no `execution_contract` derives V2_STABLE and keeps the historical `projects/<project-id>/VERIFICATION/` path;
- a NEXT owning Run derives NEXT and persists under `projects/<project-id>/TEST-LAB/NEXT/VERIFICATION/`;
- before Verification persistence, the contract-derived owning Run path must be re-fetched and its Git blob SHA must exactly match the supplied Run SHA; a missing path or stale SHA blocks persistence;
- a mismatched Run identity/role/lifecycle is rejected before a Verification path is returned;
- callers cannot force a NEXT Run Goal Recheck into the V2_STABLE namespace: there is no independent Goal Recheck contract selector, and a fabricated legacy-shaped snapshot for a NEXT Run cannot satisfy read-back at the stable Run path/SHA;
- `run_complete` accepts only a Goal Recheck whose derived contract and verification path match the owning Run.

### E25-04 — Invalid contract

Input: `execution_contract: "UNKNOWN"`.

Expected: every Job-record entrypoint that parses this record rejects it with the shared execution-contract error.

### E25-05 — Runtime identity

Expected `get_runtime_status` on CP0 staging source:
- `source_build_id = "CP0-J-F177-R2"`;
- `execution_contract_default = "V2_STABLE"`.

Deployment evidence must additionally:
- read back the deployed `gsa-mcp-next` source body;
- prove that the deployed `index.ts` content is byte-equivalent to the Reviewer-approved GitHub blob;
- record the exact Reviewer-approved Git commit and Git blob SHA beside the Supabase function version/hash.

The runtime `source_build_id` is a checkpoint marker, not a self-referential Git commit SHA. Exact revision binding comes from deployed-source read-back equality plus the recorded Git commit/blob identity.

## Regression floor

Re-run the behavioral expectations from:
- E17 minimal Job runtime;
- E19 planning review loop.

No historical Job rewrite is allowed.

## Staging route compatibility

The same reviewed source is deployable under both function slugs:

- production-compatible route prefix: `/gsa-mcp/*`;
- isolated staging route prefix: `/gsa-mcp-next/*`.

Protected-resource metadata is derived from the incoming request URL so staging never advertises the production MCP resource URL.
