# GSA4 — Follow-on research: hierarchical context delegation in Project documents

**Status:** RESEARCH BACKLOG ONLY — not a document restructuring decision or fixed Agent/document permission matrix; no implementation, measurement or simulation PASS.  
**Human clarification (2026-11-04):** The example "Coder may not need to read Criteria" was **illustrative, NOT a rule**. Study **how responsibilities and context flow down a management/task hierarchy**. Every level should normally do the work delegated by its immediate owner with sufficient context, while being able to open higher-level authoritative source **when the work genuinely requires it**. Do not hard-code a role-to-file ban.  
**Research sequence:** Group 1 (GSA Harness/role/skills) → Group 2 (GSA runtime source) first; Group 3 is a **later study of Project documents across projects**.  
**Parent:** [GSA4-RESEARCH-PLAN.md](./GSA4-RESEARCH-PLAN.md).

## 1. Separate the research objects

| Group | Content | Goal | Current priority |
| --- | --- | --- | --- |
| **1 — Agent operating guidance** | `harness-catalog.ts`, `AGENT-HARNESSES.md`, `EXECUTION-AND-REVIEW.md`, `gsa-job-runtime/SKILL.md` | Cohesive split and eventually deliver the correct task/role instruction sections, preserving mandatory rules | **FIRST** |
| **2 — GSA source implementation** | `index.ts`, `run-execution-tools.ts`, `project-setup-tools.ts`, tests, other large TypeScript modules | Let GSA development Agents navigate small, coherent implementation surfaces | **SECOND** |
| **3 — Per-Project documents and records** | Project Criteria, Plan, Milestones, Jobs/Tasks, decisions, implementation design, evidence, logs, historical notes | Develop a reusable **hierarchical responsibility → context** model and avoid monolithic documents for projects managed by GSA | **LATER** |

Not all large Markdown documents belong to Group 3: GSA operating instructions (Group 1) are different from the user project's own requirements and project plans (Group 3).

## 2. Human's MEP organization analogy — the actual research question

Example of nested accountability:

```text
Site Manager — entire multidisciplinary project
    ├── Architecture
    ├── Structure
    ├── MEP
    │   └── System / PM / Manager
    │       └── Discipline Lead
    │           └── Team Members
    └── Civil
```

Each parent receives or owns an objective and delegates a smaller **scope of responsibility** to children. A Team Member typically needs the delegated deliverable, relevant interfaces/constraints and acceptance criteria, **not all management context of Site Manager**. Equally, a Discipline Lead need not read all information managed by the parent PM/Manager. A complex task or cross-discipline interface may require looking upward or sideways.

**Research principle, not an implemented law:** `Context(node, task) = minimum sufficient scope of parent-delegated objective + applicable constraints/acceptance/interfaces + references to authoritative upstream information + relevant current evidence`. Escalate/expand dynamically when missing, inconsistent or cross-team information makes it necessary. **Delegation depth alone does not determine a fixed document allowance.**

GSA roles (Planner, Orchestrator, Coder, Reviewer, Tester, etc.) are **responsibilities**, not literal positions in the MEP org chart. A Coder can be a delegated implementer in one Job and need broad system context in another. Reviewers and Testers require independently sufficient evidence and must not simply accept a delegate's summary.

## 2A. Human clarification — REVERSE research from Member/Lead task needs, NOT top-down document assignment

**Research starting point:** for each **concrete work item**, discover what the actual assignee at each responsibility level must know to (a) execute correctly and (b) recognize *before starting* when they lack the information, authority or interface decisions to proceed. Only then work **upward** to identify what the immediate Leader, Manager and upper Project owner must prepare, reference, decide or hand off. **Do not** begin by dividing a large Criteria/Plan into named roles and guessing who should read which file.

**Proposed bottom-up study order, repeating at each level (Member → Leader → Manager → Project owner):**

1. **Define the real task and expected outcome:** scope, deliverables, applicable acceptance and failure modes, correct/incorrect examples. User/request and Criteria are the oracle, not current code or a guessed document hierarchy.
2. **Determine the minimum essential working facts:** inputs and relevant revisions, constraints, interfacing disciplines, approved decisions, and evidence needed to complete the specific task. Distinguish `NEED_BEFORE_START` from `NEED_DURING_EXECUTION` and `VERIFY_BEFORE_FINISH`.
3. **Determine the *uncertainty detector*:** what facts/decisions must the assignee be able to recognize as **unknown, ambiguous, conflicting, stale or outside delegated scope**? Define when they **MUST ASK BEFORE DOING** rather than continue on an unsupported assumption. Insufficient knowledge to *notice* a problem is a stronger failure than merely lacking a source reference.
4. **Define the next question and ownership:** exactly what should be asked, to which owning Lead/Manager/discipline/Human, with what evidence and a pointer to authoritative upstream source. Prefer a bounded targeted lookup; no general prohibition against reading parent documents.
5. **Map upstream handoff obligations:** only after Member requirements are clear, ask what their Lead needs to know to supply those facts, reject or escalate assumptions, and check the delivered result. Repeat this upward through management levels and laterally for interfaces.
6. **Infer document structure from the resulting access patterns:** choose parent index, cohesive reference leaves, Goal/Task briefs, provenance links or precise section retrieval only when justified by tasks. Store a single authoritative source per decision; avoid copies that may drift.
7. **Simulate and review end-to-end:** include routine Task, missing input, conflicting revision, cross-discipline constraint, unauthorized request, independent review, and an execution that requires a broad parent source read. Verify correct result or correctly triggered ASK/STOP, and measure **sum of context and handoff effort across all participants**, not just Member context.

**Illustrative MEP task, not a fixed architecture:** HVAC Member receives "coordinate air outlets in room A" plus approved outlet schedule, current reflected ceiling plan and installation constraints. Before drawing, they must check if ceiling/lighting coordination and airflow/type data are sufficient. If architectural revision conflicts with approved equipment data, their expected behavior is to **identify the conflict and ask the discipline Lead**; the Lead may need to consult MEP Manager/Architectural owner. The study asks which facts/reference links must accompany the original assignment to make this decision possible *without forcing the Member to read the whole multidisciplinary plan*.

**Research deliverables:** for every test Task, construct a **Task-Need Matrix** with columns `Level/assignee | Task | Must know before start | Red flags / must ask | Authoritative reference | Who answers | Allowed action | Completion evidence | Read-context cost`; then derive a **handoff lineage diagram** showing exactly which upper-level facts were translated, retained as source links, or escalated. Document a counterexample where a "minimal" packet is dangerously insufficient.

**Key quality test:** reduction of reading load is **invalid** if the assignee can no longer detect a missing prerequisite, silently performs the wrong work, or shifts disproportionate context/repair effort to another level. The correct result can be ASK, STOP or READ_MORE — not necessarily immediate execution.

This research method is **deferred to Group 3**. It does not establish runtime rules or ban any Agent from reading Criteria, Plan or other authorized upstream materials.

## 3. Delegation contract: what each level passes down

Treat this as an **illustrative packet**, not a mandated new schema or duplicate authoritative document:

- Objective and exact scope the delegate owns; expected deliverable / quality criteria
- Relevant constraints and non-goals, including safety/security and interfaces to adjacent work
- Known prerequisites and inputs; current authoritative revision/source references
- What the delegate can decide itself, what must be escalated, and required evidence/handoff
- **Optional discoverable parent context**, not obligatorily loaded in full

The parent is responsible for conveying sufficient information; the child is responsible for completing its assigned goal and raising concrete gaps. Neither should invent missing approval or treat a condensed summary as authority to override a contradictory canonical decision.

## 4. Dynamic read conditions — NOT a fixed Role × Document matrix

The old "Coder: no Criteria if packet complete" table was overly prescriptive and has been retired as a proposal. Instead, test decisions based on **delegation/task state**:

| Condition | Initial read strategy | Escalation / widened read |
| --- | --- | --- |
| Routine delegated, well-specified Task | Local Goal, deliverables, acceptance, related constraints/references | Open parent Criteria/Plan sections only if needed for accuracy, fit or decision |
| Incomplete or conflicting Task | Identify exact missing decision/revision and authoritative owner | Read relevant parent source or request owner clarification; no unsupported completion claim |
| System-level decision / change affecting other disciplines | Owner reviews applicable parent goals and cross-discipline interfaces | Notify/escalate affected management/owners; preserve existing approval rules |
| Multi-Agent independent review or test | Reconstruct exact approved target, source revision and evidence independently | Review the higher-level governing material necessary to confirm expected behavior or scope |
| New feature or material Criteria change | Planner/owner examines affected goals/constraints and relationship to parent scope | Seek required Human decision; Advisor consultation under its actual authorized contract |
| Resume/handoff/recovery | Read local durable state, current revision and bounded handoff | Expand only where state or evidence does not reconcile |

**Coder/Criteria example:** sometimes reading Criteria is redundant; sometimes it is essential. Whether to read depends on responsibility, task completeness, dependency impact, authoritative gaps and the available retrieval cost — **not on job title**.

## 5. Alternative mechanisms to research later (no selection)

- **H-A: Hierarchical document ownership and summary/index per level.** Parent owns canonical goals, child has bounded Job/Task context and source links; test what information must cross handoff.
- **H-B: Task-first progressive retrieval.** Initially read local Task/Goal and only traverse parent/adjacent authoritative nodes on explicit triggers; keep source provenance.
- **H-C: Cohesive documents with precise section navigation.** Avoid extra physical files when range/heading reads can provide equivalent context cheaply.
- **H-D: Fixed role-document policy** as a comparison/negative-control candidate: likely too rigid, but evaluate rather than assert.
- **H-E: KEEP existing behavior** when delegated context is incomplete or verification would require full reads.

All proposals should compare aggregate context (not just the deepest member), tool-call/lookup cost, loss of important constraints, cross-discipline dependency handling and correctness of handoff. A short child context that forces every higher-level owner to reread/repair work is **not** an overall win.

## 6. Later simulation scope and acceptance questions

Start with the **concrete Task-Need Matrix and pre-execution uncertainty/ASK conditions at the lowest relevant responsibility level**, then work upward to Lead, Manager and Project owner before selecting a document architecture. Use four User journeys already identified (Bootstrap; Continue Coding; Test → Fix → Retest; New Feature), and add illustrative multi-level MEP delegation, cross-discipline change, incomplete instruction and source revision conflict. First establish User goals, acceptance and ASK/STOP expectations independent of code; then trace actual context reads, parent handoffs and escalation. Separate real observed reads from paper assumptions.

The eventual study should establish: (1) reusable document taxonomy and owner links, (2) role + **responsibility-level + Task-state** read decisions, (3) no loss of parent-goal traceability, authority, Reviewer/Tester independence or safety, and (4) a measurable end-to-end improvement or KEEP decision.

**Do not begin this Group 3 study during Group 1–2 file-splitting research.** This document records Human clarification, not a Criteria edit or runtime behavior change.
