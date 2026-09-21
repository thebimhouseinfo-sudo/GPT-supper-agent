# THEORY REVIEW — Pass 02

## Status

```text
LOOP_STAGE = REVIEW
PASS = 02
RESULT = SELF_REVIEW_COMPLETE
AWAITING_HUMAN_CHECK = true
CANONICAL = false
```

This review evaluates gaps discovered after SYNTHESIS/FIX Pass 01.

---

# 1. Overall conclusion

No foundational redesign is required.

The Project → Job → Task → Run model remains coherent.

Pass 02 identifies **six recommended refinements** and four confirmations.

---

# 2. R2-01 — add KNOWLEDGE/design/ — ACCEPT recommendation

Recommendation:

```text
KNOWLEDGE/
├── architecture/
├── decisions/
├── contracts/
├── plans/
└── design/
```

Reason:

Approved design is normative Project knowledge consumed by Coder/Reviewer.

It is not:
- source code;
- evidence;
- merely an Asset Requirement.

`ARTIFACTS/assets/` remains for Asset Requirement lifecycle.

Decision recommendation: **ADD**.

---

# 3. R2-02 — Findings embedded in Review record — ACCEPT recommendation

Recommendation:

```text
Review record
→ contains findings[]
→ every Finding still has globally unique ID
```

Do not create a separate findings/ folder initially.

Reason:
- Finding has no independent lifecycle without its Review;
- avoids file explosion;
- unique ID still supports lookup/linking;
- remediation/re-review fields can reference Finding ID.

If later scale proves painful, index can be added without changing semantics.

Decision recommendation: **EMBED**.

---

# 4. R2-03 — Job hard-delete with tombstone — MODIFY recommendation

Pure cascade deletion risks breaking release/evidence/cross-Job references.

Pure blocking contradicts the user's desire to allow Job deletion.

Recommended compromise:

```text
Job hard delete
→ explicit destructive confirmation
→ delete Job-owned detailed records
→ repair/remove safe internal references
→ preserve minimal tombstone if any external durable reference exists
```

Minimal tombstone:
- deleted Job ID;
- Project ID;
- deleted_at if available;
- reason/user action;
- former type/objective summary if needed for surviving references.

If no external references exist:
```text
full deletion allowed
```

This preserves "delete" while avoiding broken references.

Decision recommendation: **ALLOW DELETE + CONDITIONAL TOMBSTONE**.

---

# 5. R2-04 — Project ID globally unique — ACCEPT recommendation

Recommendation:

```text
all durable entity IDs intended for detached reference
→ globally unique
```

Includes:
- Project;
- Job;
- Task;
- Run;
- Handoff;
- Review/Finding;
- Evidence;
- Retest;
- Asset Requirement;
- Human Gate;
- Release record.

Exact syntax remains mechanical.

Decision recommendation: **ACCEPT**.

---

# 6. R2-05 — Milestone/Stage remains embedded topology — ACCEPT recommendation

Recommendation:

```text
Project
→ Job
→ Task
→ Run
```

remains ownership hierarchy.

Milestone/Stage:
```text
= topology structures inside Job
≠ mandatory first-class durable entity
```

They may carry IDs inside Job topology when referencing is useful.

Do not create:
```text
WORK/phases/
WORK/milestones/
```

unless real use later proves independent lifecycle need.

Decision recommendation: **KEEP EMBEDDED**.

---

# 7. R2-06 — CONTROL.json is rebuildable materialized view — ACCEPT recommendation

Recommendation:

```text
entity records/history
→ durable source records

CONTROL.json
→ current materialized index/view
→ rebuildable
```

On conflict, entity records + causal history win over stale CONTROL snapshot.

CONTROL should use optimistic concurrency.

Decision recommendation: **ACCEPT**.

---

# 8. R2-07 — Direct Agent promotion — ACCEPT recommendation

Recommended promotion:

```text
ephemeral Direct Agent work
→ user chooses promotion
→ create/open Project
→ create appropriate Job when needed
→ persist only useful conclusions/artifacts/target refs
→ do NOT dump entire conversation
```

Decision recommendation: **ACCEPT**.

---

# 9. R2-08 — job new remains advanced shortcut — ACCEPT recommendation

```text
job new
→ request bounded work unit
→ normal Orchestrator/Planner normalization/readiness still applies
```

It is not a bypass around planning/topology rules.

Decision recommendation: **ACCEPT**.

---

# 10. R2-09 — capability persistence is last observation, not eternal truth — ACCEPT recommendation

```text
stored capability record
= last known observation

consequential execution
→ refresh when permission/runtime freshness can matter
```

This prevents stale capability assumptions.

Decision recommendation: **ACCEPT**.

---

# 11. R2-10 — repo relationship history — ACCEPT recommendation

Current relation:
```text
OWNED | REFERENCED
```

Add enough provenance/history to explain attachment/ownership transfer when material.

Ownership transfer requires Human governance.

No need for a separate repo registry subsystem.

Decision recommendation: **ACCEPT**.

---

# 12. Confirmed no-change decisions

Pass 02 confirms:

1. No Task CLI initially.
2. No dedicated Human Gate CLI initially.
3. No Direct Tester/Orchestrator initially.
4. No separate QA Agent.

---

# 13. Review Pass 02 result

Recommended human check outcome:

```text
ACCEPT ALL
with one notable refinement:
Job delete = real deletion + conditional minimal tombstone when surviving references require identity preservation.
```

If accepted:

```text
REVIEW PASS 02
→ ACCEPTED
→ SYNTHESIS/FIX PASS 02
→ COLLECT/REVIEW PASS 03
```

Pass 02 does not expose any unresolved foundational product decision beyond the deletion/tombstone trade-off described above.
