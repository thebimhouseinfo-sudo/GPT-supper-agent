# GSA V2 — Runtime Baseline Matrix

## V2_STABLE — verified 2026-09-30

Status: **VERIFIED / ACTIVE**

The production V2 baseline is pinned to the following runtime source:

- source branch: `main`
- runtime source commit: `789fcaf7dfc15ffced8efa45c7ee19362fd36718`
- `supabase/functions/gsa-mcp/index.ts` blob: `38a170a5d8b80f24c19fee13d4f8714a473f3f67`
- deployed Supabase Edge Function: `gsa-mcp` version `40`
- deployed function hash: `ee10a557afd6788610e625f691f471a1fb46cec169f51335c6b17fa2221b30b8`
- `verify_jwt`: `false` intentionally; `gsa-mcp` performs bearer-token validation in the function body.

Verification evidence:

- deployed `index.ts` bytes were read back after deployment and matched the selected source bytes exactly;
- runtime status remained `M2_AUTONOMOUS_SAME_TURN_ORCHESTRATION / SERVER_DEPLOYED / AUTHENTICATED / CONFIGURED`;
- Project open/status remained ACTIVE, SINGLE-repo and CONFIRMED;
- Planner exposed structure-first brownfield planning and same-turn planning-review behavior;
- Coder exposed inspect-result and Goal Recheck closure;
- Reviewer exposed revision-bound context-isolated planning review;
- V2 runtime terms including `job_sizing`, `brownfield_logic_review` and `relationship_knowledge_prepare` are present;
- future P1/P2 terms such as `evidence_needs`, `test_checkpoints`, Penpot and Test Lab integration are not present.

Rollback target captured before parity deployment:

- previous production version: `gsa-mcp v39`
- previous deployed hash: `35dbfc42b226efb69f2beb06bdde89152d7838a3098ef04181929ab6f02e3962`
- if the V2_STABLE smoke fails later, restore the previous deployment target before continuing any P1/P2 rollout.

This marker freezes **runtime V2 only**. It does not activate the planned UI Coder, Tester, Penpot, Test Lab, EvidenceNeed, checkpoint, or new workflow integration.

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
