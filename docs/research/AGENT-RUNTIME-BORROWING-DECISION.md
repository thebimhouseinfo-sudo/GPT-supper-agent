# Agent Runtime Borrowing Decision

## Goal

Reach a useful test-quality GSA agent runtime with minimum implementation effort by borrowing proven patterns instead of inventing a new coding-agent harness.

## Sources reviewed

1. GitHub Copilot Custom Agent Developer Guide.
2. Qwen Code (`QwenLM/qwen-code`, Apache-2.0).
3. Claude Code public repository (`anthropics/claude-code`, All rights reserved / Anthropic terms).
4. OpenCodex (`lidge-jun/opencodex`, MIT).

## Decision summary

### Adopt immediately

#### 1. Layered customization model — from Copilot / Claude plugin architecture

Use four distinct layers:

```text
BASE INSTRUCTIONS
→ ROLE HARNESS
→ TASK SKILLS (progressive disclosure)
→ MCP deterministic tools/guards
```

Do not duplicate the same operating rules in every role.

Role harness owns:
- identity/responsibility;
- tool/authority boundary;
- role-specific workflow;
- expected outputs.

Skill owns:
- task-specific procedure;
- examples/references;
- specialized loop.

MCP owns:
- state machine;
- deterministic IDs/record schemas;
- persistence;
- authorization/permission guards;
- concurrency checks.

#### 2. Strong base coding rules — adapted from Qwen Code

Adopt the following behavior, rewritten for GSA:
- preserve unrelated/user-owned changes;
- read current source before write and re-read overlapping changed files;
- never route around a denied tool/action;
- use concise planning only when needed;
- implement only approved scope;
- diagnose failures before changing tactics;
- discover project-specific verification commands rather than assuming them;
- report verification truthfully, including skipped/unavailable checks;
- run independent reads/checks in parallel where the host supports it, dependent actions sequentially;
- never claim completion from tests alone: match actual result to Job criteria.

These become one shared base harness, not copies inside Planner/Coder/Reviewer/Tester.

#### 3. Delegation briefing contract — adapted from Qwen Code

Adopt:
- brief a specialist like a capable colleague;
- state goal, why, known facts, boundaries and exact expected output;
- distinguish read-only research from source-writing work;
- do not delegate understanding/synthesis that the parent must own;
- specialist role definition outranks the caller's prompt;
- avoid duplicate work between parent and delegated role.

For GSA, durable cross-role work remains Handoff + successor Run rather than implicit hidden subagent state.

#### 4. Progressive skill disclosure — from Copilot / Claude / Qwen

At runtime:
- only skill name + description are cheap/catalog context;
- full skill body loads only when relevant;
- supporting references/examples are loaded only when the skill calls for them.

Initial runtime skills:
- `job-planning`
- `coding-loop`
- `delegation`
- `review-evidence`
- `testing-evidence`

#### 5. Hard guard in code, guidance in prompt — from OpenCodex

Security/consent/concurrency invariants must be enforced by MCP or provider APIs, not merely written in prompts.

Examples:
- Memory Repo boundary;
- delete Human Gate;
- stale SHA conflict;
- Project ACTIVE recheck;
- merge/release Human Gate.

Prompts explain the rule; deterministic runtime enforces it.

#### 6. Runtime documentation is executable behavior

Treat harness/skill Markdown as runtime-sensitive source:
- version it;
- test it;
- changes require evals;
- avoid hand-maintained duplicate capability lists.

This follows Qwen's treatment of bundled skills as executable behavior and OpenCodex's tested/generated operational skill surface.

## Do not copy

### Claude Code implementation text/code

The public repository license is not permissive open-source. Use its public structural ideas only:
- agents / skills / hooks / MCP separation;
- role-focused agent definitions;
- skill folders with references/scripts/examples;
- lifecycle hooks.

Do not copy Claude Code proprietary runtime source or system prompts.

### Whole Qwen agent runtime

Do not import:
- its CLI/session UI;
- provider/model stack;
- full tool scheduler;
- 100-turn conversation runtime;
- sandbox implementation;
- large review command pipeline.

GSA already has ChatGPT as the reasoning/runtime host. Rebuilding Qwen's host loop would duplicate ChatGPT.

### OpenCodex proxy/model routing

Do not import provider proxy, account pool, model routing or transport translation. They solve a different layer.

## Minimal GSA runtime architecture

```text
ChatGPT / GSA session
  |
  +-- Base harness
  |     scope / safety / truthfulness / tool discipline
  |
  +-- Role harness
  |     Planner | Designer | Coder | Reviewer | Tester
  |
  +-- Progressive skill
  |     load only task-relevant procedure
  |
  +-- Job/Run loop
  |     observe → act → verify → recheck → adapt
  |
  +-- MCP deterministic boundary
        records / state / guards / SHA / Human Gate
```

## Loop policy

Default specialist loop:

```text
OBSERVE
→ PLAN NEXT BOUNDED ACTION
→ ACT
→ INSPECT RESULT
→ VERIFY / RECHECK
→ if fixable gap: ADAPT and continue
→ if material scope/authority/capability blocker: STOP + route
→ if criteria satisfied: persist evidence/handoff/terminal Run
```

Rules:
- never blind-retry the same failing action;
- a repeated failure must produce a new diagnosis or stop;
- evidence is persisted before terminal state;
- Coder success requires Goal Recheck;
- Reviewer never repairs source;
- Tester cannot convert unavailable practical capability into PASS.

## Attribution / licensing

- Qwen Code patterns are adapted from Apache-2.0 material. If source text/code is copied substantially later, preserve required Apache notices.
- OpenCodex is MIT; copied substantial code/text requires retaining the MIT notice.
- Claude Code is treated as study/reference only; no proprietary implementation is copied.
- Copilot workshop material is used as design guidance; do not depend on its text verbatim in the runtime.

## Acceptance target

A GSA Job test is meaningful only when:
1. the role loads shared base policy + its role harness;
2. relevant skill is loaded progressively;
3. Coder performs read/implement/verify/diff/goal-recheck loop;
4. failed verification changes the next action rather than being ignored;
5. denied/unauthorized actions are not worked around;
6. durable evidence is enough for fresh-chat continuation.
