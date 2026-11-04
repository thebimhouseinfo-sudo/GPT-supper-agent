# GSA4 — Group 3 Research: Agent × Job × Task × Phase Context Architecture

**Status:** RESEARCH-ONLY / SOURCE-STATIC + PAPER SIMULATION; no production/host experiment; no independent Reviewer PASS claimed.  
**Date:** 2026-11-04  
**Repository / working branch:** thebimhouseinfo-sudo/GPT-supper-agent / upgrade/gsa-context-efficiency  
**Pinned GSA3 SOURCE baseline:** 0b5cf875402c7735e1ef573ab95df5858c6ac5e8  
**Scope:** per-Project task-oriented context, handoffs, Skills/Knowledge and document access. Not physical splitting of Harness (Group 1) or TypeScript modules (Group 2).  
**Authority boundary:** This paper does not modify Criteria, parent Plan, Harness, source, Job/Run records, deployment or runtime policies. It is a parallel exploratory study requested by Human. The parent GSA4 plan still forbids implementing or empirically evaluating post-split selective routing (R6+) before actual physical extraction and parity PASS; this paper is NOT R6 execution.

## GOAL

From the actual needs of each executing task, infer what each real GSA Agent must **know to act correctly**, **know to recognize that it cannot yet act**, **read/verify**, **receive from its work owner**, **escalate**, and **prove on completion**. Evaluate reusable context selection across projects, roles, Jobs, Tasks and phases while preserving current Human authority, role isolation, provenance, NEXT gates, readback and mandatory checks. Compare A–F against KEEP; do not claim measured savings or propose a new Role.

## 1. Evidence and as-is baseline

### 1.1 Evidence levels and inspected sources

- **SOURCE_STATIC (observed in pinned source):** supabase/functions/gsa-mcp/harness-catalog.ts (blob f8ec1edd68786dc1333edeb4b68d8120b02da53c); harness-skill-tools.ts (60e0d4a5ce355c94b9c15691452329eea8b9ac8f); run-execution-tools.ts (29434ca7fe558b5e669eab99daf2091d4936bd7d).
- **CONTRACT DOCUMENTS (pinned source):** docs/architecture/AGENT-HARNESSES.md (b56994bdfca2e603fa3c53490afae6b712c175ce), CORE-RECORD-CONTRACTS.md (6df287b90c9be95959c24deba2a57952ee1b4cb4), JOB-LIFECYCLE.md (a0d9eb4462598348c2374d546bc452d7d574466d), PROJECT-MEMORY.md (76d2f89e292eccd188c8e5d2baae475976d3d157), DISPATCH-AND-HANDOFF.md (e7dd6df2112bd498c45b9018fcea3ecedbe26ab1), EXECUTION-AND-REVIEW.md (9e6a9ffca96d718b9f167add55931b9725e058ad), PLANNER-SCOPE-AND-UIUX.md (275ea46a1241b8458571688aa02aa7214ab7c5ae).
- **GSA4 research requirements read from development branch:** GSA4-RESEARCH-PLAN.md (blob 825e7932751ff1ddb642797de97c7a7e3fe1f81d) and GSA4-PROJECT-DOCUMENT-ACCESS-FOLLOWON-SCOPE-20261104.md (15332a69017d58e47432c8303d9d66219821cc20). These newer documents did not exist at the pinned GSA3 source commit; reading them at the branch, while pinning implementation observations to GSA3, avoids accidentally treating later plans as existing runtime.
- **SCENARIO_SIMULATED:** tables and traces in this report are paper walkthroughs, not calls to an installed simulate skill, not source-executed workflows, not host observations and not independent review.
- **UNKNOWN:** actual host model-facing token totals, runtime hit frequency of optional Project add-ins, document-access traces, caching, time per lookup, behavior under deliberately incomplete packets; no percentages will be asserted.

Repository comparison at research time showed the development branch diverged from the pinned GSA3 baseline; these inspected GSA MCP source paths were not reported as changed in that comparison. Re-pin live HEAD before any future empirical work.

### 1.2 What GSA3 actually does

1. **Eight available Harness roles:** orchestrator, planner, advisor (Technical Advisor), designer, coder, reviewer, critic_reviewer (Critic Reviewer), tester. The latter two are not arbitrary new management ranks. Attributed durable NEXT run_begin accepts handlers planner/designer/coder/reviewer/tester; Orchestrator is an implicit routing responsibility, Advisor and CR have separate entry/authorization rules. **Harness-role availability ≠ ability to start every role as a normal NEXT Task Run.**
2. **get_agent_harness(role, mode)** renders the shared BASE_AGENT_HARNESS plus selected ROLE_HARNESS and returns canonical_refs, suggested_skills and context_policy. **Suggested** skills are not proof their bodies are loaded. ROLE_SKILLS is a per-role suggestion table, not a per-Job domain selector.
3. **get_skill_catalog → load_skill(name)** provides progressive disclosure of 11 runtime Skills: job-planning, coding-loop, debugging, delegation, planning-review, review-evidence, critic-review, testing-evidence, tester-lab, ui-coder-frontend, critical-challenge. The host-managed scenario-tester is a **suggestion**, not a GSA runtime skill and not evidence of availability.
4. **NEXT run_begin** validates the current Job, planning revision, owning Task and topology, required prerequisite Run snapshots and evidence gates. It resolves Task required_skills and returns required_skill_contexts with corresponding loaded_skills recorded on the Run. The verified explicit specialization is frontend/UI Task requiring ui-coder-frontend; no general, observed automatic domain mapping for AutoLISP versus MCP versus backend versus other frontend skills exists in these inspected runtime paths.
5. **Project AGENTS.md** may contain optional Coder/Tester add-ins, read lazily for matching Tasks and never overriding global policy. Missing Task-critical domain competence must lead to BLOCKED/UNVERIFIED, not an invented skill. Existence of the add-in mechanism is not proof that any particular Project has a complete AutoLISP/MCP/UI skill pack.
6. **Core durable identity:** Project → Job → optional embedded Task → Run; review/test evidence and Handoffs are separate append-preserving records. Job is a finite objective, not a Role. Job type is plan/code/design/review; work type/domain must not be conflated with immutable Job type.
7. **Handoff** records next role, exact target/revision, completed/remaining, required inputs, blockers and expected outcome; consumer must independently check ACTIVE Project, revision, scope, gate and conflicting consumption. Compact CONTROL is a cache, never sole authority.
8. **Safety/must-read:** run_begin external_steps for Coder require independent read of existing Criteria, reviewed Plan, Milestones, readiness, Human approval and configured Development Branch before source writes (M5), plus current Job/Project SHA checks and authorizations. A proposed smaller task packet is **not** permission to omit these mandatory source-of-authority validations. Some verification may be a bounded read or tool-side check in a future design, but only with proved parity and explicit approval.
9. **Independence:** Reviewer must reconstruct exact target and requirements without inheriting Planner/Coder reasoning; CR is Human-only or exact preauthorized crl and compares previous Reviewer verdict **last**. Tester is source-read-only, distinguishes VERIFY/MEASURE/PROBE and seven failure classes; never promotes unobserved capabilities to PASS.
10. **As-is loading evidence limit:** these signatures establish what tools return and what source prescribes, **not** the bytes any host actually sends to a model on a real run or all documents it reads.

### 1.3 Findings that affect research interpretation

- The optimization object is **task working context**, not a blanket prohibition on opening Criteria/Plan or an attempt to bypass mandated verification.
- ROLE_HARNESSES is a responsibility/authority boundary; **Work Position is transient responsibility in a specific Job/Task/Phase, never a ninth Role or an elevated permission set.**
- Source inspection alone cannot determine whether the planned physical split decreases tokens. Group 3 context selection must be evaluated later on parity-proven physical files as required by the parent research sequence.
- Initial/Material Criteria approval specifically invokes Advisor after Human signals that decision; normal brainstorm, research and HOW planning do not auto-invoke it.

## 2. Bottom-up method and vocabulary

Do **not** start by assigning filenames to roles. For each concrete Task, ask: (1) goal, (2) output and correct/incorrect example, (3) necessary prior facts, (4) Skill procedure, (5) domain Knowledge, (6) relevant Project docs/sections, (7) relevant live source, (8) preconditions, (9) unknown/conflict detector, (10) who can answer, (11) finish evidence. Only then ask what upstream Planner/Orchestrator/other owner must supply; infer physical documents last.

**Context categories:**

| Category | Meaning | Selection / authority |
|---|---|---|
| Role Core | authority, security, lifecycle, evidence, independence, allowed mutations | Mandatory; Role-specific; cannot be downgraded by Job metadata |
| Project Frame | active project, owned/linked repositories, authoritative development branch, Criteria provenance | Project-scoped; exact canonical record when consequential |
| Job Contract | finite goal, non-goals, dependencies, interface constraints, acceptance, revision | Delegated by Planner; exact current Job record |
| Task Contract | immediate deliverable, own scope, prerequisites, acceptance, work position, question triggers | Current Task and allowed references; **not** permission |
| Phase Delta | planning vs execution vs debugging vs review vs retest state and unresolved evidence | Read from current state, not an arbitrary caller-declared phase |
| Skill | procedural how-to/method; skill bodies are not Project truth | Runtime catalog or verified Project add-in; only applicable Skills |
| Domain Knowledge | technical facts/standards/platform caveats | Source/version/confidence scoped; do not fabricate compliance |
| Project Knowledge | decisions, contracts, architectural rationale, designs and dependency validity | KNOWLEDGE metadata, exact revision, supersession/validity |
| Relevant Source | exact target, neighboring callers/consumers, tests, configs | Actual Git revision/paths; broaden on findings |
| Verification / Handoff | evidence, failure class, open questions, next action, lineage | Independent readback; not a replacement for source oracle |

**Distinguish three separate operations:** (A) injecting text into model context, (B) consulting an authoritative source, and (C) authorizing execution. A shorter A does not remove mandatory B/C. A forwarded summary is advisory until checked against the canonical source where current contracts demand it.

**Question detector:** NEED_BEFORE_START (missing approval/revision/input/criteria), NEED_DURING_EXECUTION (unexpected cross-module or cross-discipline impact), VERIFY_BEFORE_FINISH (evidence/coverage/target freshness), and CHANGE_INVALIDATES_CONTEXT (revision superseded). Each should have READ_MORE, ASK or STOP disposition and a known owner.

## 3. Agent Role × Work Position × Context matrix

The table is a **research Task mapping**. R=Role Harness (always apply); J=Job/Task current records; C=approved Criteria/Plan/goal where required; K=validated domain/Project Knowledge; S=relevant source; E=exact evidence; H=handoff. Abbreviations are descriptive, **not** a new runtime schema. Every row is conditional on actual scope and recorded approvals.

| Agent Role | Project Type / Job | Task / Work Position / Phase | Goal / Deliverable | Required Harness; Skills | Required Knowledge / Documents / Source | Must Know; Must Ask / Escalation Owner | Evidence |
|---|---|---|---|---|---|---|---|
| Orchestrator | Any / bootstrap | Admit Project, coordinate / admission | correct active Project/route | R; delegation when relevant | PROJECT.md, lifecycle, branch/repo registry, pending Job/H | Active Project/identity; mismatch → Human | target Project, next role, safe stop |
| Planner | Brownfield CAD or GSA / bootstrap | discover objective / planning | bounded reviewed plan | R; critical-challenge, job-planning as needed | Criteria, repo tree L0, selective L1, relationship K, contract docs | owned repos/branch, acceptance; missing repo claim → Human | source findings, Job topology and review |
| Technical Advisor | Any / initial/material Criteria | advise tradeoffs / decision | factual advice, alternatives | R; domain reading as necessary | Criteria draft+delta, relevant architecture/source only if needed | Human intent to finalize WHAT/WHY; missing → Planner/Human; never PASS | stated risk, uncertainty, choices |
| Planner | Backend/MCP / new feature | decomposition / planning | tasks/interfaces/evidence | R; job-planning; critical-challenge | API contract, Criteria, known architecture, implementation impact | unknown runtime fact → Tester PROBE or Human | accepted Job proposal, gates |
| Designer | Web app / UI design | UX shell design / design | design coverage and asset spec | R; applicable design method | approved flow/UX contract, UI states, current rendered UI | unclear product behavior → Planner/Human | design contract, coverage, unresolved points |
| Coder | AutoCAD / AutoLISP code Job | block attribute modification / execution | accurate LISP plus bounded diff | R; coding-loop; verified CAD add-in if available | DWG/test fixture safety, AutoLISP/block/ATT, CAD conventions, Job+Task, target source/tests | DWG authority/safety, block schema, rollback; missing → Planner/Human | diff, actual drawing-based result where available, Goal Recheck |
| Coder | GSA/Backend MCP Job | tool auth/registration / execution | typed secure MCP change | R; coding-loop; debugging only on repro | TS schema, API/auth, tool registry, affected callers/consumers, tests | auth trust, backward compat, target SHA; unclear contract → Planner/Human | diff, contract tests, CI, Goal Recheck |
| Coder | Web frontend Job | responsive UI implementation / execution | working accessible UI | R; ui-coder-frontend if declared NEXT; coding-loop | UI/design contract, components, states, CSS/build/tests | design approval, responsive intent, a11y; ambiguity → Designer/Planner | screenshots/DOM behavior if observed, tests, Goal Recheck |
| Coder | GSA TypeScript bug Job | root-cause investigation / debugging | regression + root fix | R; coding-loop; debugging only on qualifying bug | failing trace, caller graph, test oracle, runtime revision | failure classified, scope; spec gap → Planner | known-bad RED, fixed GREEN, exact diff |
| Coder | Any / assigned feasibility research | source read / research-only phase | bounded feasibility finding | R; procedure as needed | relevant contract/source, unknowns | no implementation approval → STOP before writes | cited finding, UNKNOWN limits |
| Reviewer | Any / plan revision | isolated planning review | revision-bound PASS/findings | R; planning-review, review-evidence | persisted Job revision, Criteria goal, topology, repo evidence | freshness and independence; material new requirement → Human via Planner | durable planning Verification |
| Reviewer | Backend/CAD/UI / source review | inspect changed boundary / review | correctness and change-risk assessment | R; review-evidence | exact changed files, required requirements, callers/tests, sensitive-path floor | same revision, missing authority/test → BLOCKED/finding to Coder/Planner | REVIEW Verification, severity/evidence |
| Critic Reviewer | Any / human cr or preauthorized crl | independent challenge / CR phase | adversarial assessment | R; critic-review, review-evidence | independent durable Project/Job/target/source; prior Reviewer LAST | authorization missing → STOP Human; cannot infer crl | CRITIC_REVIEW artifact; comparison last |
| Tester | Backend/MCP / CI | VERIFY or PROBE / test | evidence-backed result/class | R; testing-evidence; tester-lab if relevant | acceptance, exact target, CI logs, tool capability; E | capability unproved → PROBE; SPEC_GAP → Planner; failure → owning Coder | TEST Verification, failure class/limitations |
| Tester | CAD / DWG test | verify block/geometry / test | measured drawing result | R; testing-evidence + verified CAD test guidance | safe test DWG, known expected entities, test bridge/capability | real host unavailable → UNVERIFIED, not PASS; Human only if inaccessible | observed geometry/ATT, target revision, RETEST |
| Tester | UI / retest | independent scenario retest / retest | fixed + regression scenarios verdict | R; testing-evidence; host scenario-tester only if actually available | approved flow, changed build, prior failure and independent checks | new target revision/changed UI required; regressions fail → Coder | TEST/RETEST, screens/evidence, coverage gaps |
| Orchestrator | Any / interrupted run | restore from H/Run/cursor / resume | safe next step or stop | R; delegation as relevant | exact H, Job, Run, cursor if NEXT, Git SHA/claim | unknown write or conflicting consumption → STOP/reconcile, never assume | reconciled lineage and next action |

**Same Role / different Job check:** AutoLISP Coder does not inherit Backend MCP auth Skill; MCP Coder does not automatically read CAD block rules; frontend Coder alone currently has an observed NEXT automatic UI Skill activation. Research Coder with no write authorization does not get to code merely by having the Coder Role. Reviewers and Testers must additionally vary their technical oracle by target rather than reuse implementation Skill bodies.

## 4. Task-Need Matrix — from assignee upward

A complete practical Task need has: Goal, Deliverable, Required before start, Skill, Knowledge, Docs/sections, Source, Gate, Unknown detector, ASK owner, Evidence. Below the **assignee-first** cases, followed by upstream obligations.

| Assignee / concrete Task | Must know BEFORE start (not only HOW) | READ_MORE when | MUST ASK / STOP; owner | Completion evidence |
|---|---|---|---|---|
| AutoLISP Coder: update block ATTR | exact drawing/fixture and permission, target block/ATT schema, units, do-not-touch entities, approved change, expected attribute values, restoration/check | entity names mismatch, nested/dynamic block, duplicate tags, impacted callers | bad or unclear drawing provenance/approval → STOP; missing product decision → Planner/Human; missing CAD domain information → Lead equivalent = owning Planner or verified source, not invented Agent Role | actual diff; before/after counts/values from trusted verification |
| MCP Coder: new tool authorization | current auth contract, exact tool name/schema, trusted caller boundary, error semantics, backward compatibility, security acceptance | shared middleware/signatures affected | approval or security contract change outside Task → Planner/Human; stale revision → STOP | contract/auth negative tests; exact target; Goal Recheck |
| Frontend Coder: responsive screen | approved flow, states, design tokens, breakpoints/accessibility, UI_FIRST/UX_FIRST constraints | component design or behavior deviates from Design | unresolved interaction semantics → Designer/Planner; user-facing behavior change → Human through Planner | responsive/keyboard/empty/error state evidence |
| Bug Coder: failing test | failure classification, known-bad reproduction, exact module+call path, accepted behavior | missing root cause, failed hotfix retest | unclear expected behavior → Planner; no reproducible oracle → READ_MORE/UNVERIFIED | regression known-bad RED; new revision GREEN if executed |
| Tester: verify backend error | explicit expected error, callable test surface, target commit and environment | logs/auth config discrepancies | unobserved surface → PROBE before VERIFY; SPEC_GAP→Planner; environment-only failure→Orchestrator | TEST/RETEST with classification |
| Reviewer: review security diff | authorized scope, exact revision, acceptance and changed shared interfaces | diff hides transitive caller impact | inadequate oracle/evidence → finding/BLOCKED; material requirement gap → Planner/Human | independent findings with source and severity |
| Planner: bootstrap brownfield | user goal, existing Criteria status, repo structure, ownership and branch policy | undocumented dependency or stale README | missing owned repo/Human branch decision → Human | structure scan, selected L1, bounded plan |
| Orchestrator: resume handoff | live Project, Job, Task, Handoff state, target, pending mutation | stale cache or lost response | conflicting source/cursor or consumed Handoff → STOP/reconcile | durable next Run or precise blocker |

**Reverse obligations:**
- **Planner → assignee:** distill goal/non-goals/interfaces, completion criteria, approved choices, uncertainty triggers and authoritative links; do not forward only a task title.
- **Orchestrator → assignee:** select correct role and current Work Position from current durable state/topology; establish revision, prerequisites, Human approval and authority; do not invent an approval from the previous Agent's prose.
- **Coder → Reviewer:** exact diff/target and mapped acceptance, impacted surfaces, tests, limitations; Reviewer reconstructs authoritative oracle independently.
- **Tester → Coder:** reproducible observed failure, classified cause, expected/actual, environment, commit, affected scenarios; not merely “tests failed.”
- **Assignee → Human (via actual owner):** one specific missing material decision with options/impact and source references; no synthetic “manager” Role.

**Illustrative non-GSA analogy to validate reuse:** An HVAC member coordinating air outlets needs the approved schedule, current ceiling layout, room constraints and lighting/structure interfaces, NOT the entire site-manager binder. If ceiling revision conflicts with airflow or clearance constraints, a packet that hides interface ownership is dangerously “minimal”: member must identify conflict and ask discipline Lead, who consults higher owner as needed. In GSA the actual counterparts are current Planner/Orchestrator/Human and domain owner, never new MEP-named GSA Roles.

## 5. Skill and Knowledge selection — real Agent, specific Job

**Model:** Role Core → Job domain → Task method and requirements → relevant Knowledge/source → phase condition → action/evidence. This is a *research decision path*, not an implemented runtime selector.

| Same Role | Common core | Job-only Skill/Knowledge candidates (verify catalog/existence!) | Task-only | Conditional debugging/retest |
|---|---|---|---|---|
| Coder / AutoLISP | generic coding-loop, role authority, Goal Recheck | project-approved CAD conventions, AutoLISP / block / ATT / DWG safety; no built-in AutoLISP runtime Skill verified | specific block definition, attributes, current drawing test fixture, intended placements | geometry/probe evidence; repair-specific debug Skill if reproducible |
| Coder / Backend MCP | same generic core | TS/MCP schemas, registration, auth/security, API contracts; no built-in generic MCP Job Skill verified | chosen tool handler, schema, callers, integration tests | debugging on actual failure, contract migration check |
| Coder / Frontend | same generic core | **ui-coder-frontend** auto-injected for NEXT Task explicitly requiring it; verified Design tokens/UX contract | component, responsive interactions, UI state and UI test | visual regression or a11y debugging only when relevant |
| Coder / TS bug | same generic core | target subsystem knowledge | failure trace, test oracle, exact caller graph | debugging after reproducible bug / failed hotfix |
| Planner / brownfield | planning core; discovery L0/L1 | repo architecture/repo policy knowledge | dependency interfaces and planned acceptance for this Job | seek PROBE only on unknown runtime facts |
| Planner / UI feature | planning core | UI_FIRST/UX_FIRST contract and accessibility constraints | UX flow, Design readiness, staged pack | ask Designer or Human on material behavior |
| Reviewer / plan | review independence | Criteria/Job/topology contracts | exact planning revision and approved goal/phase goals | CHANGES_REQUIRED→Planner loop |
| Reviewer / source | review independence | relevant platform security/CAD/UI contract | diff/affected callers/tests/revision | broaden for transitive effect; independent verdict |
| Tester / MCP | test independence | protocol/security/capability knowledge | test endpoint and oracle | PROBE before VERIFY, classify runner |
| Tester / CAD | test independence | safe CAD host/evidence knowledge | exact DWG/expected entities | no host→UNVERIFIED or Human-only steps |
| Tester / UI | test independence | browser/UI/a11y test knowledge | flow/scenarios/screens | RETEST new build plus regressions |

**Do not use Job type=code as a proxy for domain.** Proposed selection can use existing Job scope/Task descriptions and explicit verified references before introducing metadata. The chosen domain must be justified by observed source/approved assignment, not model confidence alone. Required Skill names must resolve against catalog or verified Project add-in; a caller-supplied string is not activation proof.

Knowledge metadata already has kind/revision/validity/depends_on/supersedes; start with those before inventing a new registry. STALE or SUPERSEDED Knowledge may be historical reference but cannot silently override current Decisions/Contracts. “Relevant source” means precise module+callers+consumers+tests, potentially spanning files after the separate physical-split work; source **imports** are not model reads.

## 6. Context handoff and provenance diagram

~~~text
Human approved GOAL / Criteria and active PROJECT.md
        |
        v
Planner (Role Contract + Work Position: Job planner)
  L0 structure -> L1 selective decisions/contracts -> Job/Tasks/topology
        |
        |  durable Job + exact SHA/revision + Task spec + refs
        v
Orchestrator (Role Contract + Work Position: current route owner)
  verify ACTIVE Project, Job revision, topology, gates, role, scope
        |
        +----> Advisor only at Human initial/material Criteria checkpoint
        |          -> Human choice -> Planner (not Advisor approval)
        |
        +----> Designer if UI/design task -> design ref/coverage
        |
        +----> Coder: Task brief + scope + required Skills + current sources
        |          -> actual diff + Goal Recheck + limitations
        |                              |
        |                              v
        +----> Reviewer: independently reconstruct approved oracle + exact diff
        |                              |
        |                              v
        +----> Tester: independently check exact target, capability, oracle
                      | PRODUCT_FAILURE -> Coder fix -> NEW SHA -> RETEST
                      | SPEC_GAP/PLAN_GAP -> Planner revision -> Reviewer
                      | ENVIRONMENT_FAILURE -> probe/alternate/UNVERIFIED
                      + PASS evidence -> Orchestrator evaluates completion
        |
        +----> Critic Reviewer only Human cr or exact preauthorized crl;
                      blind independent verdict, previous Reviewer result LAST
~~~

**Conceptual handoff packet fields** (not a new required durable record): project_id, job_id, task_id, role, work_position description, current_phase derived from state, job/planning/source SHA, goal/deliverable, non-goals, constraints/acceptance, known inputs, must-check prerequisites, Skill names + verified origin, Knowledge/docs source refs+revisions, source entrypoints, unresolved_unknowns/ASK owner, evidence criteria, producer/source Run, expected next outcome. Prefer references to canonical sources over duplicated large text; include enough **red flags** to detect when refs must be opened.

**Authority/provenance rules:** each inherited constraint carries canonical ref + revision + scope/owner; “summarized by Planner” does not turn it into approved Criteria. A new revision invalidates dependent packets until checked. Preserve compact handoff and separate durable record provenance rather than copying full Criteria on every transition. The receiving Reviewer/Tester must still independently reconstruct their own oracle, not blindly trust Coder's compact summary.

## 7. Four mandatory workflow paper simulations

Each trace below is **SCENARIO_SIMULATED** using actual GSA contract facts but fictional task inputs; it is NOT a run in the host. A “correct” STOP/ASK may be the successful task outcome.

### S1 — Bootstrap brownfield Project

Input: Human asks to adopt an existing CAD/backend repo; Criteria exist but the development branch or linked source repo is uncertain.

1. **Orchestrator** applies active Project/identity boundary; no always-running manager. Read PROJECT.md and minimal state.
2. **Planner** needs L0 filenames/tree, ownership claims/config/tests/CI surface, then selective L1 source, current Criteria/Plan, approved decisions; domain-heavy implementation knowledge is *not* preloaded.
3. If missing owned dependent repo or development branch, **ASK Human** for exact binding; if merely architectural knowledge is missing, **READ_MORE** targeted source; never guess main.
4. Once the relevant planning action is authorized, **Planner→Reviewer** automatic independent planning review, persist/read back exact revision and PASS before READY; then **STOP** for Human execution approval.
5. **Advisor** does not run for routine brownfield discovery; only for the specific Human initial/material Criteria checkpoint.

Negative case: a tiny task packet that does not mention cross-repo ownership lets Planner finalize unsafe source scope. Disqualify regardless of tokens.

### S2 — Continue Coding, same Coder across three Jobs

Common input: approved Job is IN_PROGRESS, one unfinished Task, Handoff/Run from previous session, known source revision.

1. **Orchestrator** reconstructs Project/Job/Task/Run/Handoff and NEXT cursor where applicable; reconciles pending mutation before any replay. Wrong planning revision/consumed Handoff → **STOP**.
2. **Coder** receives current Task goal/acceptance, target branch/SHA, previous findings and required Skill references. Re-read applicable mandatory Coder pre-write Criteria/Plan/Milestones, branch and Human approval; no summary-only bypass.
3. **AutoLISP Job:** open CAD-specific block/ATT/drawing safety and specific LISP/test files; do not preload auth/UI framework. Missing drawing permission or schema → ASK before execution.
4. **Backend/MCP Job:** open tool contract/TS handler/auth tests and dependent call path; do not preload DWG/visual design docs. Unapproved security policy change → Planner/Human.
5. **Frontend Job:** resolve declared ui-coder-frontend for NEXT, read Designer output/component/state tests; do not read backend auth except if the task actually crosses API/security boundary.
6. **Coder** diffs/self-tests, maps every criterion in Goal Recheck, creates revision-bound evidence/Handoff; **Reviewer/Tester** consume independently at required topology gates.

Negative case: Domain auto-selection from words “grille” accidentally picks frontend Skill because Task also mentions “UI”. Require explicit Task objective/affected artifacts and verified domain references, not noun matching.

### S3 — Test → Fix Bug → Retest

Input: Tester reports failing MCP auth test for SHA-A, then Coder produces SHA-B.

1. **Tester VERIFY:** know exact expected behavior, SHA-A, runnable surface/readiness and test oracle; classify PRODUCT_FAILURE versus TEST_FAILURE/ENVIRONMENT_FAILURE/SPEC_GAP/PLAN_GAP. No general coding Skill required for independent test.
2. **Orchestrator** reads classification/evidence, dispatches right owner; a runner-not-started case is ENVIRONMENT_FAILURE/UNVERIFIED, not a product defect. SPEC_GAP/PLAN_GAP goes to Planner and reviewed revision.
3. **Coder investigate:** source call graph + failure trace + contract; load debugging only if reproducible/nontrivial or failed hotfix; do not use Tester Skill as implementation instruction.
4. **Coder fix:** approved edit and exact diff; regression oracle detects known-bad SHA-A and intended SHA-B when executable; Goal Recheck tied to new revision.
5. **Reviewer** independently checks the changed sensitive boundary/contract as topology/mandatory floor dictates.
6. **Tester RETEST:** re-derive oracle from approved goal, check SHA-B, rerun failing scenario and impacted previously passing regressions; prior evidence for SHA-A is not automatically valid for SHA-B.

Negative: a handoff containing only “tests pass now” is insufficient for independent verification; missing target revision or observed capability → **READ_MORE/UNVERIFIED**, not PASS.

### S4 — New Feature across planning, design, implementation and test

Input: add a new UI that invokes a backend MCP capability; Human specifies desired behavior but not detailed design.

1. **Planner** frames goal/acceptance/non-goals, dependency and interfaces; checks approved Criteria/goal/Phase Goal. **Advisor** only if the Human is finalizing or materially changing WHAT/WHY, not merely discussing technical HOW.
2. **Designer** acts if needed under UI_FIRST/UX_FIRST, produces flow/state/layout/design contract, not permission to change approved behavior.
3. **Reviewer planning** independently validates Job/Task topology, evidence checks, phase Goal alignment; Human approves reviewed execution.
4. **Orchestrator** routes backend Coder and frontend Coder Tasks with different Work Positions and context. API contract is a shared interface reference; both need the same authoritative version, but not necessarily each other's entire source tree.
5. **Coder** executes bounded changes, handles unexpected interface mismatch via **READ_MORE** and Planner/Human for material scope decisions; Reviewer checks changed contracts; Tester checks integration and negative paths independently.
6. Acceptance depends on **whole feature Goal**, not just individual Task green checkmarks; any orphan acceptance or unresolved cross-system dependency blocks closure.

Negative: frontend Task “shows button” passes in isolation but fails parent Goal because backend authorization/response is absent. A Task-only context packet without parent Goal/interface reference is disqualified.

## 8. Architecture options A–F

| Option | Initial selector | Main strength | Main failure/risk | Required mitigation |
|---|---|---|---|---|
| A — Role-based | Role → broad docs + role Skills | very simple role identity; easy governance | same Coder loads AutoLISP, Backend and UI irrelevant facts or misses domain under narrow template | add explicit Task escape hatch; otherwise disqualified by S2 |
| B — Job-based | Project + Job domain | strong domain relevance and Job ownership | same Job may mix plan/debug/test phases; overreads sibling Tasks and not enough isolation | phase filter + independent review |
| C — Task-based | task objective/artifact | low initial footprint; fast narrow execution | misses parent Goal, security contracts, interface and prerequisites; vulnerable to ambiguous tasks | mandatory Role/Job/authority provenance and uncertainty detector |
| D — Hybrid Role×Job×Task×Phase | Role Core + domain + current Task + phase | best explicit structural match to Work Position | metadata/dispatch complexity and stale classification | derive phase from durable state, fail closed, preserve mandatory reads |
| E — Progressive Context | small sufficient packet, READ_MORE on triggers | limits rereads/excess only when source discovery works | “too-small” packet hides the fact that it is wrong; repeated hops can erase savings | include must-know + red flags + canonical links; expansion before action |
| F — KEEP | GSA3 behavior unchanged | zero behavioral risk/new registry; actual costs known after measurement | irrelevant shared/reread context may persist | valid winner if D/E do not measurably improve end-to-end cost safely |

D and E can be combined **as a candidate**: D selects the initial bounded working packet, E controls audited expansion. Neither is selected for implementation here. Keep F as a genuine alternative, not a strawman. A/B/C may be usable as partial indexing strategies without being exclusive architectural laws.

### 8.1 Theoretical scenario comparison (same four fixtures)

Legend: OK = preserves constraints if stated mitigation applied; RISK = unsafe without extra context; HOPS = expected extra reference navigation; all labels are **paper expectations**, not observed runtime outcomes.

| Option | S1 Bootstrap | S2 three Coder Jobs | S3 bug/retest | S4 new feature | Main efficiency implication |
|---|---|---|---|---|---|
| A | OK with selective source | RISK: wrong domain skill/overread | RISK: too-general test/debug phase | RISK: shared interface missing | low selector complexity; potentially high irrelevant read volume |
| B | OK if Job frames ownership | OK domain, HOPS on Task | RISK phase/revision mismatch | RISK cross-Job interface | less domain overread; may load all Job docs |
| C | RISK missing project owner | RISK missing parent Goal/gates | RISK stale target/evidence | RISK child succeeds while feature fails | smallest initial packet, highest safety repair requirement |
| D | OK with gates/readback | OK distinct positions | OK revision/phase if derived | OK shared interface links | extra selection logic, best structured candidate |
| E | OK only with detection rules | OK when explicit skill/domain refs | OK when fail cases trigger reads | RISK hidden parent dependency | minimal initial packet; unpredictable lookup cost |
| F KEEP | current policy remains | current specialization limits | current behavior retains safety | current behavior retains safety | zero new design complexity, no proven savings |

**Interpretation:** “OK” means a design *could* preserve the specified constraints, not PASS on correctness. No options were run. C is not safe as a standalone default; A and B cannot be the whole solution without escape hatches; D+E deserves a bounded future benchmark but is not a chosen build.

## 9. Cost model: context, file reads, ASK and complexity

Avoid comparing only the final Coder prompt. Define **workflow end-to-end** cost per scenario:

~~~text
TotalContext = Σ over attributed role/Run model-visible input UTF-8 bytes
             (Role Harness + Skill bodies + Knowledge + Project Docs
              + Source excerpts + Handoff + tool outputs)
TotalReads   = Σ exact file/range/tool-source reads (including rereads)
TotalHops    = Σ retrieval/role-handoff/context-expansion operations
TotalEscalations = Σ ASK / STOP / READ_MORE transitions by cause
TotalWork    = model cost + tool latency + repair/re-review/retest cost
Correctness  = preserved invariant/acceptance and independent evidence
~~~

Count duplicated data only once *within the same response* if a tool reports both content and structuredContent mirrors; across separate Runs, genuine re-sent context counts again. Source TypeScript file size is not proof of model-delivered text. Cache benefits are unknown until host observation. Model token counts require real tokenizer/tool capture or explicitly labeled estimates.

**Separate buckets required per fixture:** H (Harness), Sk (Skills), K (Knowledge), D (Project documents), S (live source), Ho (Handoff), plus number of files opened/reread, number of role transitions, number of ASK/STOP/READ_MORE and their causes. Record both *initial packet* and *all later expansions*.

| Option | H | Sk | K | D | S | Ho | File reads/rereads | Coordination complexity | **Savings vs GSA3 BASE** |
|---|---|---|---|---|---|---|---|---|---|
| F = as-is BASE | currently shared+Role | suggestions; NEXT required UI | selective/manual | selective/manual, Coder M5 check | L0–L3 selective | existing durable H | **not measured** | existing | 0% by definition of comparator; absolute context UNKNOWN |
| A | similar or role-wide | Role-wide tendency | often too broad/too narrow | role-bound | role-driven | still H | **not measured** | low | UNKNOWN |
| B | preserve Role | per Job | Job-domain | Job-related | job-related | still H | **not measured** | medium | UNKNOWN |
| C | preserve Role | per Task | Task-only initially | Task-linked | Task target only | still H | **not measured** | medium + escalations | UNKNOWN; safety hazard |
| D | preserve Role | Role+Job+Task | applicable domain | Task+phase with mandatory verifications | exact target and affected path | revision-bound H | **not measured** | medium/high | UNKNOWN |
| E | preserve Role | progressive | progressive on triggers | bounded initial + expand | L2→L3 on findings | refs with red flags | **not measured** | medium/high; variable hops | UNKNOWN |

**Why no invented percentages/read counts:** This is not a controlled execution log. Current host payload sizes, multi-agent source opening, average file/range reads, role transition counts and retry rates have not been captured in this study. Listing arbitrary read counts would not satisfy “report savings against BASE”; it would mislabel invented fixture values as product measurements. The table explicitly records UNKNOWN instead. For a real comparison, freeze Task/Job/revision fixtures; instrument CT-00 on the actual post-split parity baseline, capture each role/packet/range read, compare equal work/equal acceptance, then publish per-bucket bytes/tokens/reads/latency and correctness.

**Prespecified fair test plan (later, NOT executed):** use identical S1–S4 fixtures plus negative variants; for S2 three domain Jobs, and S3 one hotfix fails once; include cold start/resume, stale revision, missing Skill, missing approval, cross-repo reference, no test capability and conflicting upstream contract. Keep exact source commit, test oracle and required evidence fixed; count tools/latency across *all* Agents, including failures and repeated reads, not just the chosen Coder. CT-00 predates GSA4 and is reused, not rebuilt.

## 10. ASK / STOP / READ_MORE decision contract

| Trigger | Correct next action | Owner | Not acceptable |
|---|---|---|---|
| Exact authoritative section exists but not yet read | READ_MORE bounded section/current revision, validate before action | current Agent | guessing from stale summary |
| Domain Knowledge/Skill not verified | READ_MORE catalog, Project add-in or expert docs; if truly Task-critical absent, STOP/UNVERIFIED | current Agent → Planner | silently substituting unrelated Skill |
| Task lacks observable acceptance or contradicts parent Goal | ASK precise question; suspend affected work | Planner; Human for WHAT/WHY | satisfying superficial Task title |
| Missing Human implementation approval or configured owned source branch | STOP source write; Planner/Orchestrator obtains actual decision | Human (through owner) | inventing “approved” flag |
| Unknown source write outcome / stale SHA / cursor PENDING | STOP, reconcile authoritative Git/Run/cursor | Orchestrator / owning Coder | replay blindly or treat packet as current |
| Cross-domain contract impacts another Job | READ_MORE interface/parent source, ASK for material scope revision | Planner/Human | stealth scope expansion |
| Tester has no OBSERVED execution capability | authorized non-destructive PROBE; if still missing UNVERIFIED/Human-only step | Tester→Orchestrator/Human | simulated PASS |
| Reviewer lacks exact revision/oracle | READ_MORE independent source; BLOCKED if unavailable | Reviewer → Planner/Coder | trusting prior reasoning or chat |
| CR lacks exact Human or milestone authorization | STOP | Human | auto-CR because “high risk” |
| Knowledge current tag conflicts with canonical superseding decision | READ_MORE current authority, STOP on unresolved contradiction | Planner/Human for decision | selecting newer-looking prose |
| Failed hotfix retest | READ_MORE root call graph, bounded Coder repair and independent retest | Coder → Tester | unbounded patches or weak tests |

**Critical distinction:** “receives sufficient context to execute” AND “receives sufficient context to know execution must stop” are both required; the latter cannot be tested only on happy-path acceptance.

## 11. Smallest viable experimental design for later validation

**Do not implement before parent R0–R5 extraction/parity checkpoint.** After parity approval, begin with a **read-only packet compiler or paper manifest** from existing record fields, not a new database, Role or mandatory gate:

1. Parse current authorized Project/Job/Task/Run/target references; normalize current phase from durable lifecycle/topology. Ignore user-fabricated role/approval/phase overrides.
2. Include fixed Role authority and current relevant Job Task goal/acceptance plus **minimal red-flag map** (missing input, material interfaces, owner, escalation and canonical source refs).
3. Resolve declared required Skill from catalog and verifiable optional Project add-in; avoid automatic guessing of specialized Skill from keywords.
4. Build a list of authoritative source/document refs with revision/validity and reason, not an asserted digest of full Criteria. Keep existing M5 and other mandatory pre-write checks unchanged.
5. Allow READ_MORE on named dependency/finding, L2→L3 source relationships and cross-job interface; log why and how much was opened.
6. On revisions, use exact SHA/lineage to invalidate dependent handoff/knowledge/context packet and require refreshed checks.
7. Compare correctness and total cost with F/KEEP. Consider an additive Task-level context_manifest only if existing objective/scope/required_skills plus links prove insufficient; never make new free-form metadata an authorization source.

### Potential future metadata — hypotheses only

- Existing: Project registry/branch/Criteria refs; Job objective/scope/non_goals/tasks/topology/planning_revision/repository_context; Task objective/scope/dependencies/required_skills/completion_criteria; Run role/scope_claim/target_revision/loaded_skills; Handoff required_inputs/next_role/target_revision/remaining; Knowledge validity/depends_on; Verification oracle/evidence.
- Optional if proven necessary: Work Position descriptor (free of new permissions), task interface_refs, task_domain_ref, knowledge_refs with validity, phase-scoped recommended source entrypoints, must_ask_conditions with owner and canonical source. A selector must *derive* actual permissions from current Contracts and Project authority, **not** accept these fields as a grant.
- Prefer heading/range navigation and existing single-authority parent docs over splitting every Project record into many small files. Group 3 does not decide a physical Project-doc tree before observed access patterns.

## 12. Technical Review — independent challenge questions and disposition

This is **self-review of the paper**, NOT a separate context-isolated Reviewer Run, not a CR and not a verified runtime test.

| Challenge | Finding / disposition |
|---|---|
| Did we accidentally replace GSA's real roles with MEP hierarchy roles? | NO: all eight roles retained; Work Position is transient descriptor only |
| Do role names automatically select a fixed document set? | NO: same Coder has different Job/Task/Phase requirements; no blanket “Coder cannot read Criteria” |
| Does progressive context suppress mandatory Criteria/Plan/Milestones checks? | NO: M5, SHA, approval, capability and independence remain explicit |
| Is Technical Advisor assumed to act on every complex Task? | NO: real Criteria Human decision trigger only |
| Does every role start as a normal NEXT Run? | NO: run_begin handler schema limited to five roles; Advisor/CR/Orchestrator distinguished |
| Can frontend NEXT required Skill be faked by caller self-claim? | NO: required_skills derived from current Job Task and runtime catalog |
| Are Reviewer/Tester dependent on Coder's summary? | NO: independent target/oracle reconstruction retained |
| Are original source/Skill/Knowledge references verifiable? | YES for inspected source/contracts; hypothetical Project domain packs clearly labeled proposals |
| Are simulated results called PASS/observed host savings? | NO: all scenarios paper-only; no measurements, no percent claims |
| Does this paper contradict parent plan's R6+ sequencing? | Contained as parallel research scope; **no actual post-split selector experiment/implementation or selection** |
| Missing independent review? | OPEN: context-isolated Reviewer was not invoked as a recorded Run; technical paper may be reviewed later without pretending PASS |
| Missing live host baselines? | OPEN: CT-00 runs and actual model/navigation metrics explicitly deferred |
| Risk of minimal packet concealing a parent dependency? | Covered via parent-goal/interface red flags + negative scenarios; remains unproven empirically |
| Risk of increased read/handoff overhead exceeding savings? | OPEN until total workflow capture; KEEP remains option |
| Potential staleness as other parallel groups edit branch? | Pin GSA3 source; future work must re-pin branch and source refs before test |

### Research outcome and recommendation

**Research classification: SOURCE_STATIC_COMPLETE for the inspected role/dispatch contracts; PAPER_SCENARIO_REVIEWED_BY_AUTHOR_ONLY; EMPIRICAL_UNVERIFIED; IMPLEMENTATION_NOT_AUTHORIZED.**

- The **working hypothesis** with the best completeness is **D (Hybrid Role × Job × Task × Phase) + E (Progressive READ_MORE)** *provided* each Task begins with enough interface/unknown detection information, keeps source provenance and preserves mandatory independent checks. This is **not** the implementation decision.
- **C alone** is unsafe in the negative parent-Goal/cross-interface cases; **A** ignores differences among Jobs within a Role; **B** is useful as domain indexing but insufficient for testing/retest phase differences.
- **F/KEEP** must win if bounded post-split measurements show no useful total-workflow improvement or if any option reduces correctness, Human control, independent verification or auditability.
- **Next eligible step**, only after actual Group 1/2 physical extraction and parity PASS: independent research review of these task needs, freeze fixtures/negative oracles, compare as-is vs candidate with real CT-00 captures, quantify per-bucket context and total reads/turns/tool latency, then decide selection. This report itself does not authorize source changes.

**Files modified by this research:** only this Group 3 report. No Criteria, parent Plan, Group 1/2 reports, Harness, runtime, Job records, merge or deploy.
