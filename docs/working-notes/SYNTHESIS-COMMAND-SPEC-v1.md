# SYNTHESIS — Command / User UX v1

## Status

```text
LOOP_STAGE = SYNTHESIZE
PASS = 01
DOMAIN = COMMAND / USER UX
STATUS = SYNTHESIZED_DRAFT
CANONICAL = false
```

The fake CLI is a harness selector/control surface. Natural language remains fully valid.

---

## 1. Outer landing page

Accepted:

```text
GPT SUPER AGENT
│
├── PROJECT
│   ├── new
│   ├── open
│   ├── status
│   └── delete
│
├── DIRECT AGENT
│   ├── Planner
│   ├── Designer
│   ├── Coder
│   └── Reviewer
│
└── HELP / INSTRUCTION
```

Tester and Orchestrator are not outer Direct Agent entries initially.

---

## 2. Project operations

### project new

Creates Project durable context.

May begin with 0 owned repos.

### project open

Lists:
```text
ACTIVE
PAUSED
```

Hides:
```text
ARCHIVED
```

Opening loads Drive context first.

### project status

Lists all Projects including ARCHIVED and shows:
- lifecycle;
- active/waiting/blocked Jobs;
- pending Human Gates;
- pending Retests;
- recent release milestones.

Allows lifecycle changes.

### project delete

Hard-deletes Project Drive control-plane memory after explicit destructive confirmation.

Does not imply repo deletion.

---

## 3. Deep command synthesis principle

### Nomination

Keep deep CLI minimal.

Prefer natural language for infrequent operations.

Create explicit commands only for:
- highly recurring;
- ambiguity-sensitive;
- discoverability-critical;
- destructive;
- status/query actions.

---

## 4. Proposed deep operations

Synthesized minimal set:

```text
gsa/project ...
gsa/job ...
gsa/retest ...
gsa/review ...
gsa/continue
gsa/help
```

Exact slash syntax may be rendered by UI differently.

---

## 5. Job surface

Need:

```text
job list
job open <id>
job delete <id>
```

Do NOT expose job archive because Job has no ARCHIVED state.

Job creation is usually driven by Planner/workflow, but explicit user creation may still be useful.

### Nomination

Support:
```text
job new
```

only as an advanced/manual action, not primary landing-page entry.

Reason:
most Jobs should emerge from Project work planning.

---

## 6. Task surface

### Nomination

No dedicated Task CLI initially.

Reasons:
- Task is mostly internal work decomposition;
- user can reference Task IDs naturally;
- avoid deep command sprawl.

Natural examples:
```text
show T-...
continue T-...
cancel T-...
```

If real usage proves frequent need, add later.

---

## 7. Continue

```text
gsa/continue
```

Purpose:
- resume open Project's highest-priority actionable Handoff/Job;
- show choice if multiple parallel actionable items exist;
- never guess across conflicting work.

This maps naturally to human-dispatched current platform.

---

## 8. Review

```text
gsa/review <target>
```

Purpose:
invoke Reviewer harness against exact target/revision.

If target is ambiguous, ask user/select from current Project context.

---

## 9. Retest

```text
gsa/retest list
gsa/retest <id>
```

Natural language reporting remains valid:

```text
RT-... PASS
RT-... FAIL — <observed>
```

A dedicated report subcommand is unnecessary initially.

---

## 10. Human Gates

### Nomination

No dedicated gate command initially.

Pending gates appear in Project status/continue flow.

User answers naturally in chat.

Reason:
gate decisions are contextual and often need explanation/options, not terse CLI syntax.

---

## 11. Direct Agent UX

Direct Agent invocation loads specialist harness but does not create Project automatically.

If work grows:
```text
offer promotion
→ create/open Project
→ persist necessary context
```

Do not silently promote.

---

## 12. Destructive confirmation

Explicit confirmation required for:
- Project delete;
- Job delete;
- future destructive operations with material blast radius.

Task delete remains restricted by referential-integrity rule.

---

## 13. Natural language equivalence

Every command must have natural-language equivalent.

Examples:

```text
"open my paused KE Math project"
= project open flow

"show pending retests"
= gsa/retest list

"review PR 42"
= gsa/review PR#42
```

---

## 14. Command invariants

1. CLI is optional control surface.
2. Outer landing page remains small.
3. Deep CLI exists only where recurring ambiguity/utility justifies it.
4. Task operations remain natural-language-first initially.
5. Human Gate response remains conversational.
6. Project delete never implies repo delete.
7. Job archive command does not exist.
8. Continue is the main human-dispatched resume primitive.
