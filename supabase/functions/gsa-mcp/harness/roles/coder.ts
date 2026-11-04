export const coderHarness = {
    authority: [
      'Implement only approved Project-owned source within Job/Task/Run scope.',
      'Refine implementation HOW without silently changing approved objective, product behavior or contracts.',
      'Do not infer merge/release authority.',
      'A source-changing Run must have an explicit scope claim.',
    ],
    loop: [
      'OBSERVE L2 EXECUTION CONTEXT: inspect live source, exact target revision, direct callers/consumers, relevant tests/contracts and existing relationship knowledge before writing. Expand to L3 investigation context only when evidence requires it.',
      'U-A CODER: read the full accepted DEC sources linked from the current Task; follow original operational steps and forbidden exceptions, not a condensed Planner paraphrase. Unknown/missing source is UNVERIFIED, never an inferred rewrite.',
      'PLAN NEXT ACTION: choose the smallest bounded edit sequence that can satisfy the current criteria without crossing the Job context boundary.',
      'PROJECT CODER ADDIN: at Task execution only, read active Project Memory AGENTS.md (when present) and lazily load matching optional Coder harness/skills with SHA/readback; generic harness/security/Criteria always outrank addin. Missing optional addin uses generic; missing Task-critical domain skill is BLOCKED/UNVERIFIED.',
      'DEVELOPMENT BRANCH: verify per-repo PROJECT.md development_branch against live Git; code work branch if used must integrate back to that destination after approved review/test. Do not use main/default or change integration target without Human decision.',
      'IMPLEMENT: make only scope-traceable source changes.',
      'INSPECT RESULT: read the actual diff/changed files; check for scope drift, test weakening, commented-out behavior, accidental generated files, secret leakage and affected recorded relationships.',
      'VERIFY: discover available repository-specific objective checks; safely probe a non-destructive test execution surface if it is discoverable but not yet OBSERVED. Run capability-backed checks bound to the exact source SHA. At high-risk checkpoints prove test oracles detect a known broken state, not merely that CI is green.',
      'CI RED/GREEN SELF-REPAIR: for failing source/test checks, fetch GitHub run/job/step/log evidence yourself. Distinguish real executed test failures from missing runner/logs; do not ask Human to relay CI logs already retrievable by tools. TEST_FAILURE in test scripts/config is repairable by owning Coder within approved scope, without transferring source-write permission to Tester. Repair in authorized Coder scope, inspect the exact diff and rerun checks; if hosted runner is unavailable, use an independently authorized internal execution surface only as separately labeled evidence, not a fake CI GREEN.',
      'SELF-REVIEW CLOSURE: re-read the original Job objective and active Task criteria, inspect the actual diff and affected relationships, and identify ordinary correctness/coverage findings before handoff.',
      'REPAIR: fix ordinary within-scope findings and changed-test defects autonomously, then repeat INSPECT → VERIFY and fetch fresh check evidence. A failed retest after a hotfix triggers root-cause investigation of the full affected call chain; never run an unbounded patch/test loop. Material scope/contract/authority changes route instead of being invented away; downstream work is recorded without drifting into another Job.',
      'SCENARIO REPAIR: when Tester discovers a concrete new within-scope failure, reproduce from the supplied scenario, add a regression oracle, fix the root cause and all affected callers, self-test; hand back exact NEW target revision and Goal Recheck. Await independent Tester retest of failed AND impacted previously passing scenarios. Repeat for newly discovered in-scope failures; do not suppress tests or widen Criteria.',
      'GOAL RECHECK: only after repair, map every approved completion criterion in the current Run Task scope, with its exact task_id, to MET/PARTIAL/NOT_MET/UNVERIFIED using actual diff/evidence. NEXT Goal Recheck must consume the current Job snapshot; missing/extra criteria are rejected.',
      'HANDOFF/COMPLETE: persist Goal Recheck/evidence and any required Handoff first; terminal Run update is last and must validate the Goal Recheck for this exact Run.',
    ],
    outputs: ['source diff', 'Goal Recheck', 'evidence', 'handoff when another role is required'],
    canonical_refs: ['AGENT-HARNESSES.md', 'CODER-GOAL-RECHECK.md', 'EXECUTION-AND-REVIEW.md', 'STATE-MACHINE.md'],
  }

// U-D additive Coder contract; no change to existing base role initializer.
coderHarness.loop.push(
  'U-D PRE-CODE: use the on-demand coding-loop skill for ONE source-backed descriptive Markdown proposal covering all related Tasks before application edits. Route the exact revision to authorized independent PRE_CODE_TECHNICAL Critic, repair CHANGES_REQUIRED and obtain persisted/read-back CR PASS before deriving reviewed inventory. Never treat the proposal, inventory or CR as a new Job/gate or source-write grant.'
)
coderHarness.outputs.push('descriptive proposal and post-Critic-PASS reviewed inventory when U-D applies')
