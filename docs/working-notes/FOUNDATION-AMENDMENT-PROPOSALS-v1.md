---
id: FOUNDATION-AMENDMENT-PROPOSALS
version: 1
status: WAITING_FOR_USER_APPROVAL
canonical: false
---

# Foundation Amendment Proposals v1

## FA-1 — Rename durable Drive Job to Project and introduce finite Job

Affected invariants:

- F2
- F3
- F4
- F5
- F6
- F7
- F8
- F9
- F10
- F13
- command wording that currently uses Job for the Drive container

Trigger evidence:

The current term Job simultaneously means a durable Drive memory root and a unit of work that can be accepted/completed. Long-lived systems such as Kid eSchool do not naturally “complete”; they are Projects. Finite plan/code/design/review work does complete.

Problem:

One entity is carrying two incompatible lifecycle meanings.

Proposed change:

```text
Project
= long-lived durable Drive root
= one direct child folder of configured Drive root
= canonical memory/control plane
= references 1..N GitHub repositories
= user archives it; it is not automatically “done”

Job
= finite typed unit of work inside a Project
= type: plan | code | design | review
= has dependencies, owner role, tasks, runs and result

Task
= small work pack inside a Job

Run
= one execution attempt/session for one Job
```

Marker change:

```text
JOB.md + PROJECT.md
→ PROJECT.md
```

`PROJECT.md` becomes the Project marker + human-readable overview + YAML front matter.

The exact files beneath `jobs/` and `runs/` are defined later by Project Memory Schema.

Impact:

- rename old Job-as-container references carefully;
- introduce finite Job semantics in State Machine;
- `job list` becomes project listing, exposed as `gsa/ls`;
- Drive-first behavior remains unchanged in substance;
- single/multi-repo consistency remains unchanged;
- “Project ≠ Repo” remains;
- no GitHub source is moved into Drive.

Alternative that keeps foundation intact:

Keep durable entity named Job and introduce another name such as Work Package for finite work. Rejected by recommendation because it preserves lifecycle ambiguity and conflicts with the agreed human vocabulary.

Recommendation: ACCEPT.

---

## FA-2 — Clarify Reviewer/Coder write boundaries under one identity

Affected invariant:

- F11

Trigger evidence:

All roles use the user's same connected GitHub and Google identities. Harness-level role boundaries are SOFT. Reviewer needs to publish review findings on a PR, while repository source contents must remain read-only for Reviewer. Coder must report Runs/handoffs despite canonical Project Memory being read-only from the Coder role perspective.

Problem:

“GitHub read-only” is too broad for Reviewer if signed PR comments are allowed, and “Drive read-only” is ambiguous for Coder reporting.

Proposed change:

```text
Reviewer
→ GitHub repository contents: read-only
→ GitHub PR discussion/review comments: may write signed review records
→ Drive: may write review artifacts allowed by Project schema
→ never repairs source code

Coder
→ GitHub approved work branch/PR source: may write
→ canonical Project Memory definitions/decisions/plans: read-only
→ emits handoff/run result to Orchestrator reporting channel
→ Orchestrator persists durable Run/handoff records
```

All such role restrictions remain SOFT unless a platform mechanism is separately verified as HARD.

Impact:

- F11 wording
- Reviewer contract
- Coder contract
- Run/handoff model
- enforcement matrix

Alternative that keeps foundation intact:

Keep Reviewer fully GitHub read-only and store all findings only in Drive. This loses useful PR-local review evidence and traceability.

Recommendation: ACCEPT.

---

## FA-3 — Invocation namespace is an alias, not product identity

Affected invariant:

- F14

Trigger evidence:

Final product naming is not settled. Internal identifiers do not require a product name.

Problem:

Freezing `@gsa` / `gsa/` as identity unnecessarily couples architecture to a temporary name.

Proposed change:

```text
invocation handle / command namespace
= configured alias table

current default aliases
= @gsa
= gsa/
```

Rules:

- internal ids remain product-neutral;
- signatures contain role/run/target, not product name;
- renaming the product changes display/alias configuration, not Project/Job/Run identity.

Impact:

- F14
- README invocation wording
- command spec

Alternative that keeps foundation intact:

Keep `gsa` permanently frozen. No technical benefit.

Recommendation: ACCEPT.

---

## Approval

These proposals do not modify the Frozen Foundation until the user explicitly approves them.

Recommended decision:

```text
FA-1 ACCEPT
FA-2 ACCEPT
FA-3 ACCEPT
```
