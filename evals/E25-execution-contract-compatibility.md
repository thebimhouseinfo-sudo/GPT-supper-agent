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

### E25-04 — Invalid contract

Input: `execution_contract: "UNKNOWN"`.

Expected: every Job-record entrypoint that parses this record rejects it with the shared execution-contract error.

### E25-05 — Runtime identity

Expected `get_runtime_status` on CP0 staging source:
- `source_build_id = "CP0-J-F177-R2"`;
- `execution_contract_default = "V2_STABLE"`.

Deployment evidence must additionally bind the staged source body to the exact Reviewer-approved GitHub revision.

## Regression floor

Re-run the behavioral expectations from:
- E17 minimal Job runtime;
- E19 planning review loop.

No historical Job rewrite is allowed.
