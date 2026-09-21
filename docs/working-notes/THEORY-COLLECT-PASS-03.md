# THEORY COLLECT — Pass 03

## Status

```text
LOOP_STAGE = COLLECT
PASS = 03
INPUT = SYNTHESIS/FIX PASS 02
CANONICAL = false
```

Pass 03 looks for second-order contradictions created by the now-stable Project-first model.

---

# 1. Consistency scan result

Searches for obsolete canonical assumptions returned no active matches for:

- universal final Reviewer acceptance;
- JOB.md as Project/Job root marker;
- direct Job subfolders under Drive root;
- Job-as-Drive-root wording;
- Planner-owned detailed visual methodology;
- job archive CLI.

This indicates the major Pass 01 contradictions were successfully removed.

---

# 2. Gap C3-01 — state transition table is still incomplete

Current State Machine defines state vocabularies and semantic rules but does not yet enumerate enough legal/illegal transitions.

Theory-completeness rule requires implementation not to invent lifecycle behavior.

Need synthesize at least:

- normal transitions;
- terminal transitions;
- reopen semantics;
- cancellation/supersession transitions;
- blocked/waiting recovery;
- who/what may trigger transitions;
- invalid examples.

This is a genuine remaining theory gap.

---

# 3. Gap C3-02 — Direct Coder vs Project repository ownership

Accepted rules currently say:

```text
one repo
→ at most one owning Project

Direct Coder
→ may perform small standalone coding work
→ no automatic Project creation
```

Potential conflict:

```text
Direct Coder targets Repo A
but Repo A is already OWNED by Project P
```

Allowing a standalone Direct Coder write would bypass Project governance/history.

Need define routing.

Candidate:

```text
repo already owned by Project
→ Direct Coder must open/use owning Project context
→ no standalone bypass

repo not owned by any Project
→ Direct Coder may perform explicitly authorized bounded one-off change
→ does not automatically claim ownership
→ recommend promotion if work becomes durable/recurring
```

---

# 4. Gap C3-03 — Project hard delete vs cross-Project durable references

Project delete is intentionally true hard deletion of the Project Drive folder.

Durable IDs are globally unique and cross-Project references are theoretically possible.

Potential contradiction:

```text
Project B durable record
→ hard-refers to Job/Task/Run inside Project A
→ Project A deleted
→ broken referential dependency
```

Because user explicitly wants true Project deletion, GSA should not require a global tombstone registry.

Candidate rule:

```text
cross-Project references
→ may record provenance/snapshot/reference text
→ must NOT require target Project internal record to remain resolvable for integrity

within-Project references
→ may be strong durable references
```

This keeps Project hard delete real.

---

# 5. Gap C3-04 — Project delete and repo ownership release

If a Project is deleted but owned repos continue to exist, their GSA ownership relationship disappears.

Need define semantic consequence.

Candidate:

```text
Project delete
→ does not delete repo
→ releases GSA ownership claim for its owned repos
→ future Project may explicitly claim/attach them as OWNED
```

This should be stated to avoid "ghost ownership."

---

# 6. Gap C3-05 — Review Finding lookup

Findings are embedded in Review records but globally unique.

Direct lookup by Finding ID may require scanning reviews/.

This is acceptable at initial scale because:
- Finding is not independent lifecycle root;
- CONTROL does not need to index every historical Finding;
- future optional index can accelerate lookup.

No new folder is justified.

---

# 7. Gap C3-06 — CONTROL rebuild contract

CONTROL is now explicitly rebuildable.

Need define what data it may cache vs what must be derivable.

Candidate:

```text
CONTROL contains only current summary/index refs
→ no unique historical fact may exist only in CONTROL
```

If CONTROL is lost:
```text
Project remains reconstructable from PROJECT.md + durable entity/artifact records
```

---

# 8. Gap C3-07 — Project Memory file formats remain implementation-level

Current storage synthesis suggests:
- human-semantic records may use Markdown + YAML;
- structured operational records may use JSON.

This does not need further product decision unless connector limitations require one format.

Treat exact serialization as mechanical implementation detail after semantic schemas are stable.

---

# 9. Gap C3-08 — Job result vocabulary reuse

Shared evaluation results include:

```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

But a Job in lifecycle BLOCKED does not necessarily have evaluation result BLOCKED.

Need clarify:
- lifecycle BLOCKED = current progress condition;
- result BLOCKED = an evaluation/attempt could not reach judgement.

No contradiction if kept separate, but docs should explicitly warn against mirroring them automatically.

---

# 10. COLLECT result

Material items requiring REVIEW:

1. State transition table completeness.
2. Direct Coder routing for Project-owned repos.
3. Cross-Project reference weakness to preserve true Project deletion.
4. Project deletion releases repo ownership claim.
5. CONTROL contains no unique historical facts.
6. Lifecycle BLOCKED and evaluation BLOCKED remain distinct.

No new storage folder, role, Job type, or CLI command is justified.
