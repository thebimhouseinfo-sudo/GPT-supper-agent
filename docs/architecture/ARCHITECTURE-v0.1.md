# GPT Super Agent — Architecture v0.2

## 1. System model

```text
Conversation
= interaction UI

Google Drive Project Memory
= durable Project state / control plane

GitHub
= source-code truth

Harness / Skills / Loops
= workflow, role, quality, tool-use logic
```

---

## 2. Top-level hierarchy

```text
Project
├── Job
│   ├── Task
│   └── Run
└── durable knowledge/artifacts
```

One Project may contain many Jobs over time.

Durable Project/Job/Task/Run/Handoff/Review/Finding/Evidence/Retest/Asset/Human-Gate/Release identities intended for detached reference are globally unique.

---

## 3. Project root

GSA uses one configured Drive root.

Each direct child valid Project folder contains PROJECT.md.

```text
SUPER_AGENT_DRIVE_ROOT/
├── Project-A/
│   └── PROJECT.md
└── Project-B/
    └── PROJECT.md
```

Project may own zero repositories during planning/design-first phases.

---

## 4. Repository model

```text
Project
├── OWNED repos      → writable within approved scope
└── REFERENCED repos → read-only
```

One repo has at most one owning Project.

---

## 5. Project Memory

Synthesized root model:

```text
<Project>/
├── PROJECT.md
├── CONTROL.json
├── WORK/
├── KNOWLEDGE/
└── ARTIFACTS/
```

GitHub source is never copied into Project Memory as the canonical source.

---

## 6. Context loading

```text
open Project
→ read Project Memory
→ determine active Job/work
→ interpret current request
→ resolve relevant repo/path
→ selectively read live GitHub evidence
→ assemble role-specific context
```

---

## 7. Roles

```text
Orchestrator
Planner
Designer
Coder
  ├── UX Coder
  └── UI Coder
Reviewer
Tester
```

One Run has one active role.

A Job may use many roles.

---

## 8. Role boundaries

Target policy:

```text
Planner
→ durable planning/knowledge write
→ source read-only

Designer
→ design artifact write
→ source read-only

Coder
→ approved owned source write
→ Project theory/spec read-only

Reviewer
→ source read-only
→ review/comment channels + durable review result

Tester
→ runtime/product interaction
→ source read-only

Orchestrator
→ workflow/control-plane state
→ no source implementation
```

Physical enforcement is classified separately as HARD / SOFT / UNKNOWN.

---

## 9. Work topology

Planner defines enough topology to identify:

- milestones/stages;
- Tasks when useful;
- dependencies;
- role order;
- parallel-safe work;
- review checkpoints;
- Tester checkpoints;
- Human Gates;
- completion conditions.

Coder refines exact live-source implementation HOW inside those boundaries.

---

## 10. Run and Handoff

```text
Run
→ one execution scope
→ exact target/revision
→ result/evidence

Run completes
→ optional Handoff
→ next Run
```

Current dispatch is human-mediated.

Independent Reviewer Run starts in a fresh chat.

---

## 11. Review and testing

Reviewer verifies known requirements/evidence.

Tester actively seeks realistic/unanticipated failures.

Review is not universally attached to every node.

Job completion topology decides which verification roles are required.

---

## 12. QA/QC

```text
QA
= process assurance / COMPLIANCE

QC
= output correctness and FIT
```

Layered ownership:

- Coder self QA/QC;
- Reviewer independent evaluation where scheduled;
- Tester practical/exploratory evidence.

---

## 13. Evidence

Evidence is target/revision-bound and provenance-aware.

No role may claim unavailable verification.

Evidence invalidation is causal, not blanket.

---

## 14. Retest

```text
PASS_RETEST_REQUIRED
→ accepted Job may complete
→ durable Retest remains
→ later PASS/FAIL routes by Retest ID
```

Retest is not a Job type.

---

## 15. Asset Requirements

Stable asset integration contract may precede final binary asset.

```text
stable ID/name/path/spec
→ placeholder
→ implementation
→ final asset
→ practical verification
```

---

## 16. State model

Separate dimensions:

```text
Project lifecycle
Job/Task/Run lifecycle
evaluation result
artifact validity
delivery facts
Retest state
```

Do not collapse these into one status field.

---

## 17. Concurrency

Multiple Jobs/Tasks may run in parallel when independent.

Orchestrator detects:
- branch/file conflicts;
- shared contract/schema conflicts;
- causal assumption conflicts;
- release-critical overlap.

Durable artifacts use optimistic concurrency.

CONTROL.json is a rebuildable materialized current-state view, not the historical source of truth.

---

## 18. Multi-repo coordination

Use Change Set only when one logical change genuinely spans multiple repositories.

One repo completion does not imply integrated Job completion.

---

## 19. Security/trust

External content is data, not authority.

No inferred permission escalation.

Destructive confirmation is proportional to blast radius.

Owned/reference semantics are trust boundaries.

---

## 20. User UX

Outer control surface:

```text
PROJECT
- new
- open
- status
- delete

DIRECT AGENT
- Planner
- Designer
- Coder
- Reviewer

HELP / INSTRUCTION
```

Natural language remains valid.

Deep CLI is synthesized from actual recurring needs, not entity symmetry.

Manual `job new` is an advanced shortcut into normal Job normalization/readiness; it does not bypass Planner/Orchestrator governance.

---

## 21. Theory vs harness maturity

Theory must be coherent before real use.

Initial operational harnesses/skills/loops/actions only need a good-enough baseline, then improve through real Project evidence.

Reference systems such as Codex, Claude Code, Cursor, Copilot may inform Phase 2 patterns, but GSA synthesizes its own coherent model rather than copy-and-stack.
