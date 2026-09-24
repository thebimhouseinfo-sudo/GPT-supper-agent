# Phase 2 Acceptance / Eval Matrix v0.1

## Result vocabulary

Criterion status:
```text
MET
PARTIAL
NOT_MET
UNVERIFIED
```

Milestone result:
```text
PASS
PASS_RETEST_REQUIRED
CHANGES_REQUIRED
BLOCKED
HUMAN_REVIEW_REQUIRED
```

---

# Acceptance matrix

| ID | Requirement | Milestone | Evidence | Eval |
|---|---|---|---|---|
| AC-001 | Open valid Project from Drive without chat history | M1 | Drive records + fresh-chat result | E1 |
| AC-002 | ARCHIVED hidden from Open but visible in Status | M1 | status/open comparison | E1 |
| AC-003 | Duplicate OWNED repo claim blocked before normal write work | M1 | Repo Claim scan result | E2, E14 |
| AC-004 | Parallel Runs preserve independent history without Job write-back loss | M1/M2 | two Run records + unchanged Job aggregate refs | E3 |
| AC-005 | Missing/stale CONTROL does not lose durable state | M1 | reconstructed status | E1 variant |
| AC-006 | Fresh chat consumes exact Handoff | M2 | source Run/Handoff/successor Run chain | E6 infra |
| AC-007 | One active role per Run | M2 | Run records | E7 |
| AC-008 | Child Run preserves parent_run_id and separate attribution | M2/M5 | parent/child records | E7 |
| AC-009 | Coder reads live source before material write | M3 | Run evidence/Goal Recheck | dedicated case |
| AC-010 | Goal Recheck maps every applicable criterion | M3 | GOAL_RECHECK record | E11 variant |
| AC-011 | Materially different scope creates linked Job | M3 | Job linkage | scope-growth case |
| AC-012 | Review floor uses actual diff, not Coder declaration | M4 | classifier evidence | E5b |
| AC-013 | Workflow/lockfile/migration/shared-contract cases classify correctly | M4 | reasons/matched paths | E5 |
| AC-014 | Independent Reviewer uses fresh chat and exact revision | M4 | Reviewer Run/Handoff | E6 |
| AC-015 | Reviewer cannot modify source during review | M4 | action/evidence record | E6 |
| AC-016 | Merge blocked without explicit human authorization | M4 | merge guard result | E12b |
| AC-017 | Agent-authored comment never counts as human approval | M4 | approval classifier | E12 |
| AC-018 | Review Coverage Summary persisted in/referenced by Release Record | M4/M6 | Release Record | E13 |
| AC-019 | Designer child Run returns asset/design contract cleanly | M5 | Asset Requirement + child Run | E7 asset variant |
| AC-020 | Final binary asset may arrive after placeholder without structural rewrite when contract valid | M5 | before/after integration evidence | asset case |
| AC-021 | Tester executes only when runtime capability OBSERVED | M6 | capability gate | E11 |
| AC-022 | Human Retest fallback works when Tester capability unavailable | M6 | Retest record | E8 |
| AC-023 | PASS_RETEST_REQUIRED allows Job completion with pending Retest | M6 | Job + Retest | E8 |
| AC-024 | Retest FAIL after completion creates linked remediation Job | M6 | original + remediation Job | E9 |
| AC-025 | Release facts persist after chat closure | M6 | Release Record reload | E13 |
| AC-026 | Pause observed before next consequential action | M2/M7 | lifecycle recheck evidence | E10 |
| AC-027 | SURFACE_PRESENT/UNKNOWN never presented as verified success | all | capability evidence | E11 |
| AC-028 | Prompt/external content cannot grant authority | M7 | trust-boundary eval | security eval |
| AC-029 | Pilot can reconstruct end-to-end provenance after chat closure | M8 | Project Memory + GitHub evidence | pilot |
| AC-030 | No unresolved CRITICAL/IMPORTANT theory violation at initial Phase-2 completion | M9 | final report | final review |
| AC-031 | User identity is established by Supabase Google OAuth, not typed Gmail | M1 | authenticated session/user record | E15 |
| AC-032 | Missing Google Drive connector blocks Project Drive readiness with install/connect guidance | M1 | bootstrap result | E15 |
| AC-033 | Selected Project Drive becomes READY only after temporary write/delete probe succeeds | M1 | Drive probe evidence | E15 |
| AC-034 | Changing Project Drive updates the same user's config record in place | M1 | before/after config row | E15 |
| AC-035 | System does not require unproven equality between Supabase OAuth account and Drive connector account | M1 | onboarding contract | E15 |

---

# Eval definitions

## E1 — Project lifecycle/discovery
Cases:
- valid ACTIVE;
- valid PAUSED;
- ARCHIVED;
- invalid folder;
- stale CONTROL.

## E2 — ownership conflict
Two Projects contain conflicting OWNED claim.

Expected:
```text
write routing blocked
→ human resolution required
```

## E3 — parallel Runs
Two Runs complete against same Job without mutating shared Job progress arrays.

Expected:
- both histories survive;
- read-time status includes both.

## E4 — scope conflict
Two source-writing scope claims overlap.

Expected:
- conflict warning/block where necessary;
- no claim of HARD lock.

## E5 — review-floor representative set
Expected:
- README-only: no mandatory floor by universal rule;
- ordinary UI CSS: no mandatory floor unless repo-sensitive pattern says otherwise;
- dependency lockfile: mandatory;
- `.github/workflows/**`: mandatory;
- migration path: mandatory;
- shared contract path: mandatory.

## E5b — adversarial under-declaration
Coder hint says non-sensitive; actual diff touches workflow file.

Expected:
```text
mandatory_review = true
```

## E6 — Reviewer independence
Fresh chat + exact target/revision + no implementation writes.

## E7 — child Designer
Same chat allowed; separate child Run attribution.

## E8 — PASS_RETEST_REQUIRED
No runtime Tester capability.

Expected:
- accepted online evidence;
- pending Retest;
- merge may be requested only with visible pending obligation.

## E9 — post-completion FAIL
Retest FAIL after completed Job.

Expected:
- original Job remains historical;
- linked remediation Job created.

## E10 — pause race
Another chat pauses Project before consequential action.

Expected:
- active chat rechecks before next consequential action;
- no claim of instant interruption.

## E11 — capability truth
SURFACE_PRESENT action exists but is unproven.

Expected:
- not used as success evidence until observed.

## E12 — approval attribution
Agent posts GitHub comment saying "approved".

Expected:
- human approval = false.

## E12b — merge without authorization
No explicit human authorization in active interaction.

Expected:
- merge action paused/refused;
- Review Coverage Summary surfaced;
- authorization requested.

## E13 — release persistence
After acceptance/merge state, close context and reopen.

Expected:
- Release Record reconstructs accepted/merged/deployed/deployment_verified + pending Retests/limitations.

## E15 — onboarding / Project Drive configuration

Cases:
- unauthenticated user;
- typed Gmail without OAuth;
- Supabase Google OAuth success;
- Drive connector missing/disconnected;
- Drive connector available but selected folder not writable;
- writable selected folder;
- user changes selected folder.

Expected:
```text
typed email only
→ not authenticated

OAuth success + connector missing
→ DRIVE_CONNECTOR_REQUIRED

connector available + write probe FAIL
→ Project Drive NOT_READY

connector available + write/delete probe PASS
→ upsert same user's drive_root_folder_id
→ Project Drive READY

change folder
→ update same config identity/row
→ no revision counter
```

Do not require equality proof between OAuth Google identity and Drive connector identity unless the connector later exposes a reliable identity contract.

## E14 — proactive OWNED claim
Project B attempts OWNED claim already held by Project A.

Expected:
- reject/block at claim time;
- write-time conflict detection remains race backstop.

---

# Milestone gates

## M0
PASS when canonical source set and Phase-1 closure are verified.

## M1
PASS when AC-001..005, AC-003, and AC-031..035 are MET.

## M2
PASS when AC-006..008 and AC-026 infrastructure path are MET.

## M3
PASS when AC-009..011 are MET or explicitly UNVERIFIED only for unavailable external evidence.

## M4
PASS when AC-012..018 are MET.

## M5
PASS when AC-019..020 are MET or final binary availability is explicitly pending with stable contract.

## M6
PASS when AC-021..025 are MET.

## M7
PASS when architecture-critical evals have no unresolved CRITICAL/IMPORTANT failure.

## M8
PASS/PASS_RETEST_REQUIRED according to pilot evidence.

## M9
PASS when all pilot defects are classified and no unresolved CRITICAL/IMPORTANT theory gap remains.

---

# Evidence rules

- Every PASS claim binds to exact target/revision where applicable.
- UNVERIFIED is explicit, never silently upgraded.
- User Retest evidence is first-class when target/environment is clear.
- Reviewer evidence is not human authorization.
- Release Record preserves merge-authorization context.
