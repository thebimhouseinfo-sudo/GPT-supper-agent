# GSA V2 — External Coding-Agent Migration Matrix

## Purpose

Track A runs in parallel with real GSA pilots.

The goal is not to copy product feature lists. It is to identify mechanisms that improve sequential coding quality and classify whether GSA can migrate them under ChatGPT Web/plugin constraints.

Classification:

```text
DIRECT_MIGRATION
PARTIAL_EMULATION
INFRA_LIMITATION
OUT_OF_SCOPE
```

## Sources reviewed

- Aider repository map documentation: https://aider.chat/docs/repomap.html
- Aider lint/test loop documentation: https://aider.chat/docs/usage/lint-test.html
- SWE-agent tools / ACI documentation: https://swe-agent.com/latest/config/tools/
- SWE-agent project overview: https://swe-agent.com/latest/background/
- Cursor Agent documentation: https://cursor.com/docs/agent/overview
- Cursor Rules documentation: https://cursor.com/docs/rules
- Cursor Bugbot documentation: https://cursor.com/docs/bugbot
- Cursor Agent Review documentation: https://prod.cursor.com/docs/agent/agent-review
- OpenAI Codex introduction / AGENTS.md guidance: https://openai.com/index/introducing-codex/
- OpenAI Codex agent loop: https://openai.com/index/unrolling-the-codex-agent-loop/
- OpenAI coding-agent safety boundaries: https://openai.com/index/running-codex-safely/

## Migration matrix

| Mechanism | Source pattern | Classification | GSA migration |
|---|---|---|---|
| Concise repository map before deep reads | Aider repo map | PARTIAL_EMULATION | Use L0 tree/filenames/config/contracts + selective L1/L2 reads. Do not attempt local tree-sitter repo-map daemon. |
| Automatic lint/test after edits | Aider | PARTIAL_EMULATION | Convert event trigger into Coder lifecycle obligation: meaningful edit boundary → inspect/verify → repair → Goal Recheck. |
| Error output feeds repair loop | Aider | DIRECT_MIGRATION | Keep failed checks as evidence; diagnose and change hypothesis before retry. Already partially present; strengthened in coding loop. |
| LM-centric constrained tool interface | SWE-agent ACI | DIRECT_MIGRATION | Prefer narrow tools with explicit inputs/evidence and clear state transitions. Avoid generic prompt-only action where runtime guard is practical. |
| State emitted after each action | SWE-agent state command | PARTIAL_EMULATION | GSA cannot run a local state hook after every filesystem action. Equivalent is durable lifecycle state + tool result continuation + checkpoint obligations. |
| Persistent scoped repository rules | Cursor Rules / BUGBOT.md | DIRECT_MIGRATION | Keep universal invariants in base harness, role rules in role harnesses, task methodology in progressive skills. Avoid dumping all rules into every context. |
| Review based on actual branch/diff | Cursor Agent Review / Bugbot | DIRECT_MIGRATION | Reviewer reads exact revision/diff, not Coder narrative; already present and extended with relationship impact. |
| Different review depth for small vs complex changes | Cursor Agent Review | DIRECT_MIGRATION | Reviewer SIZE REVIEW: one bounded pass for small work; review map/sections for large work. |
| Review rules scoped by changed paths | Cursor Bugbot | PARTIAL_EMULATION | Existing review-floor sensitive-path logic covers part. Future calibration may scope review knowledge by affected paths without new global prompt growth. |
| Learned review rules from recurring feedback | Cursor Bugbot | PARTIAL_EMULATION | Promote only repeated evidence-backed GSA lessons into Knowledge/harness/skills; do not auto-learn every comment. |
| Repo-local instructions / AGENTS.md | Codex | DIRECT_MIGRATION | GSA equivalent is Project Memory + canonical docs + scoped harness/skills. Read only instructions relevant to active files/task. |
| Verification evidence/logs for user trust | Codex | DIRECT_MIGRATION | Preserve Verification records, exact revision, limitations and Goal Recheck before handoff. |
| Sandbox / local executor / continuous shell | Codex/SWE-agent local infrastructure | INFRA_LIMITATION | Do not emulate as a general GSA requirement. Use connected tools/browser only where available. |
| Filesystem watcher / auto hook | local agents | INFRA_LIMITATION as implementation; PARTIAL_EMULATION as intent | Migrate invariant into Trigger→Action→Evidence→Exit lifecycle obligation. |
| Parallel/cloud agents | Cursor/Codex cloud patterns | OUT_OF_SCOPE | GSA current MVP is sequential. |
| IDE-native continuous editor state | Cursor | INFRA_LIMITATION | Do not judge GSA against this infrastructure advantage; use explicit read-before-write and revision-bound evidence. |

## Migration decisions implemented in first V2 pass

1. Progressive L0-L3 context model.
2. Brownfield code review before extension.
3. Explicit relationship authority/precedence.
4. Job sizing as context control.
5. Coder self-review closure translated from local auto-test/review triggers.
6. Runtime guard requiring a valid same-Run Goal Recheck for successful Coder completion.
7. Adaptive review depth / bounded large-review sections.
8. Instruction placement discipline:
   - universal invariant → base harness;
   - role behavior → role harness;
   - task method → runtime skill.

## Deferred benchmark items

These remain research/calibration candidates, not current requirements:

- more formal symbol-level repository ranking;
- path-scoped review knowledge loading;
- automated promotion of recurring review findings into durable rules;
- compaction/summarizer behavior beyond Job-boundary context resets.

They should be promoted only if real GSA pilots show measurable value and the plugin infrastructure can support them without creating a heavier orchestration problem than the one being solved.
