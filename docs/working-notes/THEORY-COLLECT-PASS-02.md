# THEORY COLLECT — Pass 02

## Status

```text
LOOP_STAGE = COLLECT
PASS = 02
INPUT = SYNTHESIS + FIX PASS 01
CANONICAL = false
```

This pass collects issues discovered after the first synthesis and canonical consistency rewrite.

---

# 1. Canonical consistency result

Major obsolete assumptions have been removed from the architecture set:

- Project is now the top-level Drive entity;
- PROJECT.md replaces JOB.md as root marker;
- Job is finite work inside Project;
- Tester exists as a first-class role;
- review is topology-driven;
- universal final Reviewer gate removed;
- state/result/validity/delivery facts separated;
- owned vs referenced repository authority defined;
- specialist UI methodology delegated out of core;
- premature old storage trees removed/replaced.

No remaining architecture file intentionally defines Job as the Drive root.

---

# 2. New synthesis gaps discovered

## C2-01. Approved design artifact storage

Current Project Memory synthesis has:

```text
KNOWLEDGE/
├── architecture/
├── decisions/
├── contracts/
└── plans/
```

but Designer produces durable approved design artifacts used by Coder/Reviewer.

Need decide semantic home for:
- selected concept;
- design system/tokens;
- design coverage;
- responsive visual rules;
- design references/specification.

Candidate:
```text
KNOWLEDGE/design/
```

Reason:
approved design intent is normative Project knowledge, not evidence and not merely an asset.

---

## C2-02. Finding storage granularity

Review schema currently references finding IDs, but Project Memory only has reviews/.

Options:

A. one file per Finding;
B. Findings embedded inside Review record but retain stable IDs;
C. separate global findings ledger.

Need choose minimal correct structure.

Access need:
```text
finding ID
→ review
→ target
→ remediation Run
→ re-review
```

---

## C2-03. Job hard-delete referential integrity

User accepted:
```text
Job hard-delete allowed
```

But synthesized records may be referenced by:
- release milestones;
- Retests;
- Asset Requirements;
- evidence;
- cross-Job dependencies;
- findings/handoffs.

Need define deletion behavior.

Options:
A. block deletion when durable external references exist;
B. cascade-delete all Job-owned records and repair external refs;
C. hard-delete content but leave tombstone identity record;
D. user-selectable cascade/retain tombstone.

---

## C2-04. Project ID uniqueness

Universal ID strategy strongly implies Project ID is also globally unique.

This was synthesized but should be made explicit in canonical ID policy.

---

## C2-05. Phase/milestone persistence

Theory uses milestone/stage topology but does not promote Phase/Milestone to first-class hierarchy entities.

Need ensure:
```text
Project → Job → Task → Run
```
remains the only ownership hierarchy.

Candidate:
milestones/stages are structured fields inside Job topology, not separate root entity records unless a real need emerges.

---

## C2-06. CONTROL.json authority

CONTROL.json is a current snapshot/index.

Need prevent ambiguity:
- entity records remain historical/source records;
- CONTROL must be rebuildable from durable entities;
- CONTROL may not silently override entity history.

Candidate:
```text
CONTROL = rebuildable materialized view / index
```

---

## C2-07. Direct Agent promotion

Direct Agent work is ephemeral by default.

Need define promotion behavior without inventing a global ephemeral store.

Candidate:
```text
user chooses promote
→ create/open Project
→ create appropriate Job if needed
→ persist only useful final context/artifacts
→ do not persist whole prior conversation
```

---

## C2-08. Job creation ownership

Command synthesis includes optional `job new`, while Planner usually defines Jobs.

Need avoid duplicate semantics.

Candidate:
```text
job new
= manual shortcut to request a bounded Job
→ Orchestrator/Planner normalizes objective/topology
```

It does not bypass planning/readiness rules.

---

## C2-09. Capability cache vs current capability

Capability observations are freshness-sensitive.

Need avoid treating stored capability metadata as permanent truth.

Candidate:
```text
stored capability
= last observed knowledge

consequential action
→ refresh if freshness matters
```

---

## C2-10. Repository relationship persistence

Current Project schema stores repo relationship list.

Need capture ownership changes safely.

Candidate:
- relation;
- role;
- provenance;
- attached_at;
- detached/transferred history where material.

Ownership transfer is Human Gate/governance event.

---

# 3. No-new-command finding

Pass 02 found no strong reason to add:
- Task CLI;
- Human Gate CLI;
- Tester Direct Agent;
- Orchestrator Direct Agent.

Current minimal CLI direction remains sufficient.

---

# 4. No-new-role finding

No first-class QA role is justified.

Current:
```text
Coder self QA/QC
Reviewer independent evaluation
Tester practical/exploratory testing
```
remains sufficient.

---

# 5. Storage candidate delta

Potential Project Memory adjustment:

```text
KNOWLEDGE/
└── design/
```

No other new top-level folder is justified by Pass 02.

Finding records can likely remain inside Review records unless review proves otherwise.

---

# 6. COLLECT result

```text
COLLECT PASS 02
→ COMPLETE

NEXT
→ REVIEW PASS 02
```
