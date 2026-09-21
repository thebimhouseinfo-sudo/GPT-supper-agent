# THEORY REVIEW — Pass 03

## Status

```text
LOOP_STAGE = REVIEW
PASS = 03
RESULT = SELF_REVIEW_COMPLETE
AWAITING_HUMAN_CHECK = true
CANONICAL = false
```

---

# 1. Overall result

Pass 03 finds no need to redesign the hierarchy, storage tree, role model, or CLI.

It does find one remaining **theory-completeness task** and four important boundary refinements.

---

# 2. R3-01 — complete legal state transitions — MUST FIX

Current state names are defined, but implementation would still need to invent some transition rules.

Recommendation: synthesize a transition matrix before Phase 1 is declared complete.

At minimum define:

```text
Project:
ACTIVE ↔ PAUSED
ACTIVE/PAUSED ↔ ARCHIVED

Job:
DRAFT → READY
READY → IN_PROGRESS
IN_PROGRESS ↔ WAITING
IN_PROGRESS/WAITING → BLOCKED
BLOCKED → READY | IN_PROGRESS | CANCELLED | SUPERSEDED
IN_PROGRESS/WAITING → COMPLETED
nonterminal → CANCELLED | SUPERSEDED

Task:
PLANNED → READY
READY → IN_PROGRESS
IN_PROGRESS ↔ WAITING
IN_PROGRESS/WAITING → BLOCKED
BLOCKED → READY | IN_PROGRESS | CANCELLED | SUPERSEDED
IN_PROGRESS/WAITING → COMPLETED
nonterminal → CANCELLED | SUPERSEDED

Run:
CREATED → READY → IN_PROGRESS
IN_PROGRESS → WAITING_HUMAN | BLOCKED | COMPLETED | FAILED | CANCELLED | SUPERSEDED
WAITING_HUMAN → IN_PROGRESS | CANCELLED | SUPERSEDED
BLOCKED → IN_PROGRESS | FAILED | CANCELLED | SUPERSEDED

Handoff:
PENDING → CONSUMED | BLOCKED | SUPERSEDED
BLOCKED → PENDING | SUPERSEDED
```

Terminal historical records should not normally move backward; later remediation uses new linked work except explicitly supported Task reopen.

Decision recommendation: **MUST ADD**.

---

# 3. R3-02 — Direct Coder cannot bypass owning Project — ACCEPT recommendation

Recommended rule:

```text
target repo already OWNED by Project P
→ standalone Direct Coder write is not allowed
→ open/use Project P
→ perform work under Project governance

target repo unowned by GSA
→ Direct Coder may perform explicitly authorized bounded one-off work
→ no automatic ownership claim
→ promote if work becomes durable/recurring
```

Reason:
preserves the meaning of one-repo/one-owning-Project and prevents a side door around Project Memory/governance.

Decision recommendation: **ACCEPT**.

---

# 4. R3-03 — cross-Project refs are weak/provenance refs — ACCEPT recommendation

To preserve true Project hard-delete:

```text
strong referential integrity
→ only required inside same Project

cross-Project reference
→ provenance/snapshot/external reference
→ must remain intelligible even if target Project is later deleted
```

Examples:
- record Project/Job ID + summary + source repo/revision;
- do not make Project B impossible to load because Project A record vanished.

Decision recommendation: **ACCEPT**.

---

# 5. R3-04 — Project deletion releases GSA repo ownership — ACCEPT recommendation

```text
delete Project
→ delete Drive Project memory
→ DO NOT delete GitHub repos
→ release GSA ownership association
```

A future Project can explicitly attach one of those repos as OWNED.

This does not modify the repo itself.

Decision recommendation: **ACCEPT**.

---

# 6. R3-05 — CONTROL has no unique historical truth — ACCEPT recommendation

```text
CONTROL.json
= rebuildable materialized current-state view
```

Therefore:
- it may cache current refs/state summaries;
- it may not be the only place a durable historical fact exists;
- losing/rebuilding CONTROL must not destroy Project meaning/history.

Decision recommendation: **ACCEPT**.

---

# 7. R3-06 — BLOCKED state vs BLOCKED result — ACCEPT clarification

```text
Job/Task/Run lifecycle BLOCKED
= work currently cannot progress

evaluation result BLOCKED
= evaluator/Run could not reach judgement/completion
```

They may coexist but one does not automatically imply the other.

Decision recommendation: **ACCEPT**.

---

# 8. Confirmed no-change areas

Pass 03 confirms:

- no new root Project Memory folders;
- no findings/ folder;
- no phase/milestone entity collection;
- no new CLI command;
- no new role;
- no new Job type;
- file serialization remains mechanical implementation detail.

---

# 9. Review conclusion

Recommended outcome:

```text
ACCEPT ALL
→ add formal transition matrix
→ apply Direct Coder / cross-Project delete boundaries
→ run FIX PASS 03
→ COLLECT/REVIEW PASS 04
```

If Pass 04 finds no material semantic gap, Phase 1 theory may be close to completeness review rather than another broad domain-definition cycle.
