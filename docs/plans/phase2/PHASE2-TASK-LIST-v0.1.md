# Phase 2 Task List v0.1

## Status

```text
STATUS = READY_FOR_M0
TASK_LABELS = PLANNING_ONLY
```

Task labels below are plan handles, not runtime canonical IDs.

| Task | Milestone | Owner | Depends on | Output | Independent review? |
|---|---|---|---|---|---|
| P2-T001 | M0 | Planner | — | canonical source pin/check | No |
| P2-T002 | M0 | Planner | T001 | Phase-1 gate verification record | No |
| P2-T003 | M0 | Coder | T002 | initial implementation tree skeleton | No |
| P2-T004 | M0 | Reviewer | T001-T003 | M0 consistency spot-check | Only if canonical mismatch/change occurs |
| P2-T010 | M1 | Coder | M0 | PROJECT.md template + validation contract | No |
| P2-T011 | M1 | Coder | T010 | Project discovery/open/status behavior | No |
| P2-T012 | M1 | Coder | T010 | Repo Claim template/schema | No |
| P2-T013 | M1 | Coder | T012 | proactive OWNED claim scan | No |
| P2-T014 | M1 | Coder | T010 | Job + embedded Task schema/template | No |
| P2-T015 | M1 | Coder | T014 | Run schema/template | No |
| P2-T016 | M1 | Coder | T015 | Verification/Handoff/Human Gate/Asset schemas | No |
| P2-T017 | M1 | Coder | T016 | Knowledge Artifact + Release Record templates | No |
| P2-T018 | M1 | Coder | T014-T017 | read-time status reconstruction rules | No |
| P2-T019 | M1 | Coder | T018 | CONTROL rebuild/stale fallback rules | No |
| P2-T020 | M1 | Tester/Retest | T011-T019 | M1 storage/resume acceptance | No independent Reviewer unless sensitive files change |
| P2-T030 | M2 | Coder | M1 | Context Packet template | No |
| P2-T031 | M2 | Coder | T030 | Context Builder workflow | No |
| P2-T032 | M2 | Coder | M1 | Run start/end workflow | No |
| P2-T033 | M2 | Coder | T032 | child Run workflow | No |
| P2-T034 | M2 | Coder | T032 | Handoff create/discover/consume workflow | No |
| P2-T035 | M2 | Tester/Retest | T031-T034 | fresh-chat continuation test | No |
| P2-T040 | M3 | Planner | M2 | Planner harness v0 | No |
| P2-T041 | M3 | Coder | M2 | Coder harness v0 | No |
| P2-T042 | M3 | Coder | T041 | Goal Recheck template/workflow | No |
| P2-T043 | M3 | Planner/Coder | T040-T042 | Job scope-growth handling | No |
| P2-T044 | M3 | Tester/Retest | T040-T043 | simple Code Job acceptance | No |
| P2-T050 | M4 | Coder | M1,M3 | review-floor classifier | **Yes if classifier modifies governance semantics; otherwise no** |
| P2-T051 | M4 | Coder | M2 | Reviewer Handoff workflow | No |
| P2-T052 | M4 | Reviewer | T051 | Reviewer harness v0 | Fresh-chat by definition |
| P2-T053 | M4 | Coder+Reviewer | T052 | finding/fix/re-review loop | Yes when topology/floor requires |
| P2-T054 | M4 | Coder | M1 | Review Coverage Summary generator | No |
| P2-T055 | M4 | Coder | T054 | merge-authorization guard + Release persistence | **Mandatory review if touching workflow/deployment/security-sensitive integration** |
| P2-T056 | M4 | Tester/Retest | T050-T055 | E5/E5b/E6/E12/E12b | No extra review beyond eval target |
| P2-T060 | M5 | Designer | M2 | Designer harness v0 | No |
| P2-T061 | M5 | Coder/Designer | T060 | Asset Requirement workflow | No |
| P2-T062 | M5 | Coder/Designer | M2,T060 | child Designer Run integration | No |
| P2-T063 | M5 | Tester/Retest | T061-T062 | DESIGN_READY/asset-flow eval | No |
| P2-T070 | M6 | Coder | M1,M2 | Tester capability gate | No |
| P2-T071 | M6 | Tester | T070 | Tester harness v0 | No |
| P2-T072 | M6 | Coder | M1 | Retest workflow | No |
| P2-T073 | M6 | Coder | T072 | post-completion remediation Job routing | No |
| P2-T074 | M6 | Coder | M1,M4 | Release/delivery-facts workflow | No |
| P2-T075 | M6 | Tester/Retest | T070-T074 | PASS/PASS_RETEST_REQUIRED acceptance | No |
| P2-T080 | M7 | Planner | M1-M6 | eval manifest | No |
| P2-T081 | M7 | Coder | T080 | eval fixtures E1-E14 | No |
| P2-T082 | M7 | Reviewer | T081 | eval-result independence review for architecture-critical failures | As needed |
| P2-T083 | M7 | Planner | T081-T082 | M7 gate report | No |
| P2-T090 | M8 | Planner | M7 | pilot scope/Job plan | No |
| P2-T091 | M8 | Multi-role | T090 | KE Math Grade 1 vertical-slice pilot | Topology/floor driven |
| P2-T092 | M8 | Reviewer/Tester | T091 | pilot acceptance + evidence | Topology/floor driven |
| P2-T100 | M9 | Planner | M8 | calibration issue classification | No |
| P2-T101 | M9 | Coder/Designer/etc. | T100 | bounded harness/skill fixes | Trigger-driven |
| P2-T102 | M9 | Reviewer | T101 | final Phase-2 initial-build review | Yes for any architecture-sensitive correction |

---

# Task completion rules

A Task is complete only when:
- output exists;
- acceptance criteria mapped to evidence;
- applicable mandatory review floor evaluated;
- blockers/UNVERIFIED areas recorded;
- next handler or closure is clear.

---

# Task growth rule

If implementation discovers additional work:

```text
same finite objective
→ add Task under owning milestone/Job

materially different objective
→ create linked Job/workstream proposal
```

Do not silently expand the Phase-2 Job objective.

---

# Parallel-safe opportunities

Potentially parallel after M2:
- Designer harness drafting (M5) can proceed while Planner/Coder baseline stabilizes;
- eval fixture drafting can begin early, but execution waits for owning milestone outputs;
- documentation/template work may parallelize when files do not overlap.

Not parallel-safe:
- shared schema edits;
- capability vocabulary;
- merge authorization semantics;
- review-floor patterns;
- record identity/field contracts.

---

# Stop conditions

Stop affected Task and route governance when:
- canonical Phase-1 contradiction appears;
- required authority is missing;
- ownership conflict unresolved;
- actual platform behavior invalidates assumed safety fallback;
- merge/release would proceed without explicit human authorization.
