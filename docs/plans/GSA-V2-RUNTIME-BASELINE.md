# GSA V2 — Runtime Baseline Matrix

## Baseline

Branch baseline started from main commit `26640b1bda147ce6f2fb5929eb2faa22448c2ffa`.

Primary runtime surface:

```text
supabase/functions/gsa-mcp/index.ts
```

Operational documentation:

```text
skills/gsa-job-runtime/SKILL.md
```

The planned `harness/roles/*` tree is not currently the runtime implementation surface.

## Matrix

| V2 requirement | Before V2 | Owning layer | V2 action |
|---|---|---|---|
| Structure-first brownfield discovery | Covered at L0/L1 | Planner harness + job-planning | Extend to L0-L3 progressive context |
| Brownfield logic review | Partial | Planner/job-planning | Require relationship + relevant logic review before extension |
| Authority/precedence | Missing/implicit | Planner + Project memory | Add explicit relationship assessment + durable Knowledge helper |
| Objective→Phase→Task→Job Pack→Milestone | Missing | Planner/job_prepare | Add planning concepts and Job sizing metadata without new entity family |
| Job boundary = context boundary | Missing | Base harness + Planner | Add invariant and sizing gate |
| Mega/micro Job detection | Partial mega-Job check | planning-review | Add explicit sizing/context burden review |
| Coder self-review closure | Partial diff review + Goal Recheck | Coder + coding-loop | Add goal reread, relationship review, in-scope repair loop |
| Goal Recheck required for successful Coder completion | Prompt-level only | run_complete | Add runtime validation of same-Run GOAL_RECHECK |
| Large review decomposition | Missing | Reviewer + review-evidence | Add SIZE REVIEW / bounded section consolidation |
| Durable relationship map | Architecture supports KNOWLEDGE but no runtime helper | Project Memory runtime | Add relationship_knowledge_prepare using ARCHITECTURE_NOTE |
| CR remains Human-only | Covered | CR harness/tools | Preserve unchanged |
| External benchmark feasibility filter | Missing as durable research | docs/research | Add migration matrix |

## Ruling

V2 does not introduce Phase, JobPack, Milestone or Relationship as new record families.

The first implementation uses:
- existing Job/Task topology;
- Job planning metadata;
- existing KNOWLEDGE/ ARCHITECTURE_NOTE;
- Verification/Handoff already present.

Schema promotion requires pilot evidence that these structures are insufficient.
