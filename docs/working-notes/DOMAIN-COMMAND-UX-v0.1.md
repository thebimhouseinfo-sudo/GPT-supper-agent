# DOMAIN DETAIL — Command / User UX v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = COMMAND / USER UX
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Fake CLI is a low-ambiguity harness selector/control surface, not a real shell and not a replacement for natural language.

## 2. Outer landing page — accepted

```text
GPT SUPER AGENT
├── PROJECT
│   ├── new
│   ├── open
│   ├── status
│   └── delete
├── DIRECT AGENT
│   ├── Planner
│   ├── Designer
│   ├── Coder
│   └── Reviewer
└── HELP / INSTRUCTION
```

Only ARCHIVED Projects are hidden from Project Open.

## 3. Natural language

Natural language remains valid equivalent input.

Command surface exists for discoverability/deterministic harness selection.

## 4. Deeper CLI

Accepted meta-rule:
```text
domain semantics first
→ collect CLI needs
→ remove duplicates
→ decide natural-language-only cases
→ synthesize hierarchy
```

Do not nominate second-level commands during domain DETAIL.

## 5. Destructive actions

Project delete must clearly mean Drive Project deletion, not repo deletion.

Job/Task delete UX awaits reviewed semantics.

## 6. Direct Agent

Direct Agents are lightweight, no automatic Project creation.

## 7. Status

Status should surface actionable durable obligations such as pending Retests/Human Gates/blockers when relevant.

## 8. COLLECT candidates

Already accepted:
- project new/open/status/delete;
- direct Planner/Designer/Coder/Reviewer;
- help/instruction.

Candidates from domains:
- pending Retest access;
- Job/Task navigation;
- Human Gate response;
- workflow continue/handoff;
- review target invocation.

No command is finalized here beyond accepted outer layer.
