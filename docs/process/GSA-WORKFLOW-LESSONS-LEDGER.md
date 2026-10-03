# GSA Workflow Lessons Ledger

Status: **CP1 CANONICAL PROCESS LEDGER**

Authority:
- this file is authoritative for **lesson ownership, disposition and checkpoint routing**;
- canonical architecture/harness/schema/eval files remain authoritative for the behavior they own;
- `docs/plans/GSA-V2-IMPROVEMENT-NOTES.md` remains a non-canonical intake/research note.

## 1. Collection contract

Lessons Learned is a continuous workstream. The collector shorthand is **LLC**.

In CP1, LLC is a **collector responsibility**, not a new runtime role, command, schema or autonomous fixer.

LLC records a candidate when real work exposes:
- a workaround because the normal workflow lacks a contract;
- a repeated workflow failure or ambiguity;
- a defect that was unusually hard to detect;
- a Reviewer, Human-invoked CR or Tester finding with reusable workflow value;
- an external mechanism worth migrating into GSA constraints.

LLC does **not** repair the workflow when collecting the lesson. Collection preserves the observation, evidence and candidate owner so a later reviewed checkpoint can decide whether to change canonical behavior.

Typical flow:

```text
candidate
→ dedupe against existing rule
→ classify owner
→ already-owned | delta-required | deferred checkpoint
→ implement when owned by the active checkpoint
→ eval / pilot / review
→ MERGE into canonical owner
→ checkpoint merge into upgrade/gsa-next
```

A workaround or temporary Human-approved bypass is evidence of a possible workflow gap; it must not silently become the new canonical path.

## 2. Dispositions

- `ALREADY_OWNED` — accepted lesson already has a canonical owner and sufficient evidence; do not duplicate it.
- `CP1_DELTA` — CP1 adds the missing canonical wording/process ownership without activating later runtime features.
- `DEFER_CP3` — Tester semantic behavior belongs to CP3.
- `CP4_DELTA` — CP4 adds first-class evidence/checkpoint planning structures without runtime execution.
- `CP5_DELTA` — CP5 activates safe checkpoint execution, applicability, recovery and evidence gates.
- `CANDIDATE` — collected by LLC; observation is durable but no canonical workflow change is implied until a later reviewed checkpoint accepts/owns it.

## 3. Accepted lesson ledger

| ID | Lesson | Disposition | Canonical owner / destination | Evidence / eval | Checkpoint |
|---|---|---|---|---|---|
| WL-001 | Job boundary = context boundary | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E21 | CP1 |
| WL-002 | Objective → Phase → Task → Job Pack → Milestone decomposition | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E21 | CP1 |
| WL-003 | Progressive L0/L1/L2/L3 context | CP1_DELTA | `docs/architecture/AGENT-HARNESSES.md` | E19, E21, runtime harness | CP1 |
| WL-004 | Brownfield source is evidence, not automatic authority | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E22 | CP1 |
| WL-005 | Relationship / precedence direction must be explicit and reread upstream truth later | CP1_DELTA | `docs/architecture/PLANNER-SCOPE-AND-UIUX.md` | E22 | CP1 |
| WL-006 | Coder self-review → repair → Goal Recheck | ALREADY_OWNED | `docs/architecture/CODER-GOAL-RECHECK.md`, `EXECUTION-AND-REVIEW.md` | E23 | Existing |
| WL-007 | Reviewer is context-isolated and source read-only | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md` | E24 | Existing |
| WL-008 | Critic Reviewer is Human-invoked only and stateless-by-contract | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md` | canonical contract | Existing |
| WL-009 | Tool presence != proven capability; UNVERIFIED != PASS | ALREADY_OWNED | `docs/architecture/CAPABILITY-CATALOG.md`, `EXECUTION-AND-REVIEW.md` | capability catalog | Existing |
| WL-010 | Translate local triggers into Trigger → Required action → Evidence → Exit condition | CP1_DELTA | `docs/architecture/EXECUTION-AND-REVIEW.md` | E26 | CP1 |
| WL-011 | Tester supports VERIFY / MEASURE / PROBE | ALREADY_OWNED | `docs/architecture/AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, runtime `testing-evidence` | E27 | CP3 |
| WL-012 | Tester runs at meaningful sparse checkpoints, not after every Task | ALREADY_OWNED | `docs/architecture/EXECUTION-AND-REVIEW.md` semantic rule; first-class checkpoint structure still lands in CP4 | E27 + Tester upgrade plan | CP3/CP4 |
| WL-013 | Unknown runtime facts must not be guessed; preserve them as first-class EvidenceNeed / UnknownRuntimeFact | CP4_DELTA | `AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, runtime Planner schema | E28 + CP4 roadmap | CP4 |
| WL-014 | Checkpoints may depend on multiple prerequisite nodes / Milestone boundaries | CP4_DELTA | `EXECUTION-AND-REVIEW.md`, runtime typed planning model | E28 + CP4 roadmap | CP4 |
| WL-015 | Staging runtime evidence is valid only when deployed source is bound to the exact reviewed source | ALREADY_OWNED | CP0 contract in E25 + upgrade roadmap | CP0 source/deploy read-back evidence | CP0 |
| WL-016 | Environment/tooling limitation is not a product PASS or product failure; keep unavailable checks explicit | ALREADY_OWNED | `CAPABILITY-CATALOG.md`, `EXECUTION-AND-REVIEW.md` | CP0 Tester PASS_RETEST_REQUIRED | Existing/CP0 |
| WL-017 | Merge checkpoints early into integration; promote to production main only at final release | ALREADY_OWNED | `docs/plans/GSA-UPGRADE-INTEGRATION-ROADMAP.md` | CP0 merge evidence | Upgrade roadmap |
| WL-018 | LLC collects workflow candidates but never resolves them implicitly | CP1_DELTA | this ledger + `docs/architecture/EXECUTION-AND-REVIEW.md` | E26 | CP1 |
| WL-019 | Random attempt IDs are not concurrency control; one deterministic checkpoint claim + exact-SHA lease must serialize a live Tester attempt | CP5_DELTA | `CORE-RECORD-CONTRACTS.md`, `EXECUTION-AND-REVIEW.md`, runtime checkpoint tools | E29 | CP5 |
| WL-020 | `PASS_RETEST_REQUIRED` must never bypass a mandatory EvidenceRequirement/checkpoint gate | CP5_DELTA | `JOB-LIFECYCLE.md`, `EXECUTION-AND-REVIEW.md`, runtime evidence gate | E29 | CP5 |
| WL-021 | PLAN_GAP/SPEC_GAP during NEXT execution requires a reviewed superseding planning revision; old revision evidence becomes non-applicable | CP5_DELTA | `STATE-MACHINE.md`, `EXECUTION-AND-REVIEW.md`, runtime plan supersession guard | E29 | CP5 |

| WL-023 | Cross-chat/session memory must not silently become operational context. GSA is project/repo work, so users may have multiple chat seasons open and may speak in the wrong frame. The active GSA project is also the default discussion frame: GSA must not start or continue discussion about another project merely because memory recognizes it. Another project may be referenced without interruption only when the user intentionally refers to it and the reference is materially relevant to the active project's work (for example dependency, comparison, migration, integration or lesson). If the topic belongs to another unrelated project, GSA must first warn that the user is speaking outside the current project frame and ask whether they still want to discuss it. User confirmation permits discussion only; it does not switch the active project or grant mutation authority. Prior-memory details remain retrieval hints only and must be re-grounded before they influence assumptions, routing or actions. | CANDIDATE | future context-isolation/admission contract review (`AGENT-HARNESSES.md` / `EXECUTION-AND-REVIEW.md`) | Real incident: a CAD add-in question sent in the Supper Agent chat was answered from CADGPT memory from another chat season instead of first detecting context mismatch and re-grounding | LLC backlog |

| WL-024 | **Hard discussion/write-scope isolation with controlled cross-project read.** Once a GSA project is opened, that project is the default discussion and absolute mutation boundary. GSA may read another project/repo only when the user intentionally references it or its relevance to the active project is concrete and material (for example shared architecture, dependency, migration, comparison, reusable implementation pattern or integration). Such cross-project access is read-only and may be used as reference evidence; relevant files/code/patterns may be copied or adapted **into the currently active project's allowed repository set**. Read/reference permission never grants mutation authority over the source project. Memory, prior chats, similarly named projects, user discussion, user confirmation, or even an explicit user instruction to write into another project's repo must never authorize a cross-project mutation. If the user appears to have sent a request from the wrong chat/project frame, GSA must stop operational discussion/mutation, warn that the topic belongs to another project and ask whether the user still wants to discuss it. If the user confirms, discussion may continue without changing the active project. If the user asks to edit/write/create/delete/merge/deploy in another project/repo, GSA must refuse that mutation and instruct the user to `gsa/stop`, then explicitly `open` the target project, re-establish its project/repo scope, and only then issue the write request there. **Cross-project writes are absolutely forbidden even when explicitly requested by the user.** The only exception is LLC collection: when recording a workflow lesson about GSA itself, LLC may write that lesson to the canonical `GPT-supper-agent` Lessons Ledger/repo even when the observed incident occurred while operating another project. This exception grants no other source-code or project mutation authority. | CANDIDATE | future admission/read-scope/write-authorization/context-isolation contract (`AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, project-open/mutation guards) | User requirement after cross-chat context incident: GSA needs useful cross-project reuse (e.g. CADGPT ↔ RevitGPT) without allowing a mistaken context to mutate the referenced repository | LLC backlog |

## 3.1 Candidate hard requirements from cross-chat safety incidents

Until a later reviewed checkpoint assigns and implements these candidates, the intended safety requirements are:

1. **Active project is the default discussion and mutation boundary.** GSA should reason and converse from the explicitly opened project/repo context, not from whichever other project memory happens to match a phrase.
2. **Cross-project discussion requires deliberate relevance.** GSA may discuss another project only when the user intentionally refers to it and the reference is materially relevant to the active project (for example dependency, comparison, migration, integration, reuse or lesson). This permission is contextual only and does not authorize any write to the referenced project.
3. **Memory is neither discussion authority nor write authorization.** Saved memory, prior chat seasons, inferred project identity, or familiar repo names may help locate a possible referent, but must not cause GSA to silently switch project context or continue an unrelated project discussion.
4. **Wrong-frame detection must warn before discussion continues.** If the current request appears to belong to another project/repo/chat frame and there is no clear user-intended relevant reference, GSA must stop operational discussion and mutation and explicitly warn the user that they are talking about a different project from the current one, then ask for confirmation before continuing discussion. Canonical behavior: “You are talking about another project that is not related to [current project]. Are you sure you want to discuss this topic?” If the user confirms, GSA may discuss the topic in the current chat but must not mutate that other project/repo. Operational work or mutation on the other project still requires an explicit project switch/open and repo-scope re-establishment.
5. **Cross-project read is allowed only for material relevance.** GSA may read files/source/durable evidence from another project when that project is intentionally referenced by the user or has a concrete relationship to the active project (for example shared architecture, dependency, migration, comparison, integration or reusable implementation). Cross-project reads must stay scoped to the relevant evidence; unrelated exploratory browsing is not implied.
6. **Reference-and-copy into the active project is allowed.** GSA may use relevant read-only material from another project as source evidence and may copy/adapt that material into the active project's registered/working repository set when it serves the active Job. The destination mutation is governed entirely by the active project's normal planning/review/write controls.
7. **Read permission never becomes write permission.** Reading or reusing material from another project does not authorize any mutation of that source project/repo.
8. **Active project is the absolute mutation boundary.** GSA may mutate only durable records belonging to the explicitly opened GSA project and repositories registered/selected for that project. User intent or user confirmation cannot widen this boundary.
9. **Explicit user request does not authorize cross-project writes.** If the user asks GSA to write/edit/create/delete/merge/deploy in another project's repo while a different project is active, GSA must refuse the mutation. The required behavior is to tell the user to run `gsa/stop`, then explicitly `open` the target project, re-establish its allowed repo scope, and repeat the requested write from that project context.
10. **Discussion permission is not mutation permission.** Even when cross-project discussion/read is intentionally relevant, GSA must not write to the referenced project until that project becomes the explicitly opened active project.
11. **LLC-only exception.** LLC may record a GSA workflow lesson in the canonical `GPT-supper-agent` Lessons Ledger when the lesson is discovered while operating another project. This exception is limited to lesson collection and does not permit arbitrary source/docs changes in `GPT-supper-agent` or any other repo.

## 4. CP1 closure rule

CP1 is complete only when:
- every minimum lesson in the master roadmap appears in this ledger;
- every `ALREADY_OWNED` row points to a real canonical owner;
- every `CP1_DELTA` row has matching canonical source and evidence;
- CP3 semantic rows and CP4 planning rows remain non-executing until their owning checkpoint/runtime activation is complete;
- the improvement note points here instead of acting as authority;
- E26 passes review.

At CP7, this ledger is reread to prove no accepted lesson remains only in a working note.


| WL-022 | Evidence JSON is not durable evidence: NEXT gates require deterministic path + exact blob-SHA snapshots and immediate read-back before consequential persistence | CP5_DELTA | `CORE-RECORD-CONTRACTS.md`, `EXECUTION-AND-REVIEW.md`, runtime gate/claim contracts | CP5 Reviewer finding + E29-19/20/21 | CP5 |
