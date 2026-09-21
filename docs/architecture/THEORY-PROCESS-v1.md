# Theory Construction Process v1

## Purpose

This document governs how GSA theory is developed. It is not product/runtime architecture.

## Loop

```text
DETAIL
→ COLLECT
→ REVIEW
→ SYNTHESIZE
→ FIX
→ repeat
```

During DETAIL:
- unresolved consequential choices are nominated;
- viable alternatives/trade-offs are recorded;
- `REVIEW_REQUIRED` is marked;
- work continues unless no safe provisional path exists.

During COLLECT:
- gather nominations;
- merge duplicates;
- expose contradictions;
- collect persistence/query/CLI/state needs.

During REVIEW:
- challenge semantics, platform realism, authority, lifecycle, complexity and missing responsibilities;
- internal review may nominate/disposition fixes;
- independent Claude peer review is used as the final Phase-1 challenge gate instead of a generic human completeness check;
- the human still retains authority for any material product/architecture/governance choice surfaced by that review.

During SYNTHESIZE:
- convert reviewed semantics into coherent cross-domain contracts, records, state and storage.

During FIX:
- reconcile canonical docs and remove obsolete contradictions.

## Phase maturity

```text
Phase 1 = coherent theory + implementation-relevant contracts + platform truth boundary
Phase 2 = initial operational harness/skills/loops/actions
Phase 3+ = real-world calibration/hardening
```

Phase 2 must not invent unresolved product/architecture semantics.

## External peer review

Independent peer review is challenge evidence, not authority.

Finding disposition:
```text
ACCEPT
ACCEPT_WITH_MODIFICATION
REJECT_WITH_REASON
DEFER_TO_PHASE_2_CALIBRATION
```

Accepted material findings reopen relevant Phase-1 domain before Phase 2.

## Phase-1 close gate

Required:
```text
semantic theory coherent
+ missing contracts synthesized
+ platform probes classified
+ consistency review passes
+ Claude peer review round 2 finds no unresolved material gap
  OR all round-2 material findings are dispositioned and fixed
+ no new human-owned architecture/product decision remains unresolved
→ Phase 2
```
