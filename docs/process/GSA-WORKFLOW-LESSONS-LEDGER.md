# GSA Workflow Lessons Ledger

Status: **CP1 CANONICAL PROCESS LEDGER**

Authority:
- this file is authoritative for **lesson ownership, disposition and checkpoint routing**;
- canonical architecture/harness/schema/eval files remain authoritative for the behavior they own;
- `docs/plans/GSA-V2-IMPROVEMENT-NOTES.md` remains a non-canonical intake/research note.

## 1. Collection contract

Lessons Learned is a continuous workstream. The collector shorthand is **LLC**.

In CP1, LLC is a **collector responsibility**, not a new runtime role, command, schema or autonomous fixer.

LLC records a candidate when real work exposes:
- a workaround because the normal workflow lacks a contract;
- a repeated workflow failure or ambiguity;
- a defect that was unusually hard to detect;
- a Reviewer, Human-invoked CR or Tester finding with reusable workflow value;
- an external mechanism worth migrating into GSA constraints.

LLC does **not** repair the workflow when collecting the lesson. Collection preserves the observation, evidence and candidate owner so a later reviewed checkpoint can decide whether to change canonical behavior.

Typical flow:

```text
candidate
→ dedupe against existing rule
→ classify owner
→ already-owned | delta-required | deferred checkpoint
→ implement when owned by the active checkpoint
→ eval / pilot / review
→ MERGE into canonical owner
→ checkpoint merge into upgrade/gsa-next
```

A workaround or temporary Human-approved bypass is evidence of a possible workflow gap; it must not silently become the new canonical path.

## 2. Dispositions

- `ALREADY_OWNED` — accepted lesson already has a canonical owner and sufficient evidence; do not duplicate it.
- `CP1_DELTA` — CP1 adds the missing canonical wording/process ownership without activating later runtime features.
- `DEFER_CP3` — Tester semantic behavior belongs to CP3.
- `DEFER_CP4` — first-class evidence/checkpoint planning structures belong to CP4.

## 3. Accepted lesson ledger

| ID | Lesson | Disposition | Canonical owner / destination | Evidence / eval | Checkpoint |
|---|---|---|---|---|---|
| WL-001 | Job boundary = context boundary | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E21 | CP1 |
| WL-002 | Objective → Phase → Task → Job Pack → Milestone decomposition | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E21 | CP1 |
| WL-003 | Progressive L0/L1/L2/L3 context | CP1_DELTA | `docs/architecture/AGENT-HARNESSES.md` | E19, E21, runtime harness | CP1 |
| WL-004 | Brownfield source is evidence, not automatic authority | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E22 | CP1 |
| WL-005 | Relationship / precedence direction must be explicit and reread upstream truth later | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E22 | CP1 |
| WL-006 | Coder self-review → repair → Goal Recheck | ALREADY_OWNED | `docs/architecture/CODER-GOAL-RECHECK.md`, `EXECUTION-AND-REVIEW.md` | E23 | Existing |
| WL-007 | Reviewer is context-isolated and source read-only | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md` | E24 | Existing |
| WL-008 | Critic Reviewer is Human-invoked only and stateless-by-contract | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md` | canonical contract | Existing |
| WL-009 | Tool presence != proven capability; UNVERIFIED != PASS | ALREADY_OWNED | `docs/architecture/CAPABILITY-CATALOG.md`, `EXECUTION-AND-REVIEW.md` | capability catalog | Existing |
| WL-010 | Translate local triggers into Trigger → Required action → Evidence → Exit condition | CP1_DELTA | `docs/architecture/EXECUTION-AND-REVIEW.md` | E26 | CP1 |
| WL-011 | Tester supports VERIFY / MEASURE / PROBE | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, runtime `testing-evidence` | E27 | CP3 |
| WL-012 | Tester runs at meaningful sparse checkpoints, not after every Task | ALREADY_OWNED | `docs/architecture/EXECUTION-AND-REVIEW.md` semantic rule; first-class checkpoint structure still lands in CP4 | E27 + Tester upgrade plan | CP3/CP4 |
| WL-013 | Unknown runtime facts must not be guessed; preserve them as first-class EvidenceNeed / UnknownRuntimeFact | DEFER_CP4 | CP4 Planner EvidenceNeed/checkpoint planning model | Tester upgrade plan + CP4 roadmap | CP4 |
| WL-014 | Checkpoints may depend on multiple prerequisite nodes / Milestone boundaries | DEFER_CP4 | CP4 typed checkpoint planning model | Tester upgrade plan + CP4 roadmap | CP4 |
| WL-015 | Staging runtime evidence is valid only when deployed source is bound to the exact reviewed source | ALREADY_OWNED | CP0 contract in E25 + upgrade roadmap | CP0 source/deploy read-back evidence | CP0 |
| WL-016 | Environment/tooling limitation is not a product PASS or product failure; keep unavailable checks explicit | ALREADY_OWNED | `CAPABILITY-CATALOG.md`, `EXECUTION-AND-REVIEW.md` | CP0 Tester PASS_RETEST_REQUIRED | Existing/CP0 |
| WL-017 | Merge checkpoints early into integration; promote to production main only at final release | ALREADY_OWNED | `docs/plans/GSA-UPGRADE-INTEGRATION-ROADMAP.md` | CP0 merge evidence | Upgrade roadmap |
| WL-018 | LLC collects workflow candidates but never resolves them implicitly | CP1_DELTA | this ledger + `docs/architecture/EXECUTION-AND-REVIEW.md` | E26 | CP1 |

## 4. CP1 closure rule

CP1 is complete only when:
- every minimum lesson in the master roadmap appears in this ledger;
- every `ALREADY_OWNED` row points to a real canonical owner;
- every `CP1_DELTA` row has matching canonical source and evidence;
- deferred CP3/CP4 rows remain non-activating;
- the improvement note points here instead of acting as authority;
- E26 passes review.

At CP7, this ledger is reread to prove no accepted lesson remains only in a working note.
