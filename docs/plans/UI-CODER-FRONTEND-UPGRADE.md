# UI Coder Frontend Upgrade Plan

Status: **UNDER REVIEW / CR REQUIRED**
Scope: **GSA Online / GPT-supper-agent**

This plan defines the frontend workflow around capabilities GSA Online actually owns and can verify.

Only a Human-invoked CR may clear the UNDER REVIEW mark. Normal Reviewer PASS may validate execution planning but does not convert this architecture note into a Human-approved final UI workflow.

**Execution gate:** implementation planning may reach READY, but source execution must not start until Human invokes CR for this current architecture revision and the resulting Human decision allows implementation.

---

## 1. Objective

Keep **UI Coder as the primary frontend implementation specialization** while simplifying the workflow around capabilities GSA Online actually has.

UI Coder remains a Coder specialization, not a new top-level Agent.

Its job is to translate approved UX/design intent into real application source, make the UI runnable, inspect the rendered result with available browser capability, refine implementation, and hand the frozen implementation to independent Reviewer/Tester/Human verification.

There is no separate external design-authoring phase between Designer and source implementation.

---

## 2. Core workflow

Target flow:

~~~text
Planner / approved product contract
→ Designer when visual design work is required
→ reviewed Designer package
→ UI Coder implements frontend directly in target source
→ UI Coder runs/opens the real app and performs browser-backed development inspection
→ UI Coder self QA/QC + Goal Recheck
→ Reviewer when required by topology/risk
→ Tester independently verifies the runnable UI
→ Human receives review-ready screenshots/evidence
→ UI Coder revises source when feedback remains inside the approved contract
→ repeat Reviewer/Tester/Human checks as required
~~~

The rendered application, not a separate design canvas, becomes the practical visual feedback surface.

---

## 3. UI Coder authority

UI Coder remains a Coder specialization and may write approved Project-owned frontend source inside the active Job/Task scope.

At runtime, frontend methodology is exposed as a **task-specific UI Coder skill/overlay** named `ui-coder-frontend`. It must not be auto-loaded for every Coder Run.

Activation is explicit and deterministic:

~~~text
Planner/Orchestrator classifies the Task as frontend / UI Coder work
→ the Coder handoff names ui-coder-frontend
→ Coder loads ui-coder-frontend before frontend implementation
→ normal non-UI Coder work keeps only the base Coder skills
~~~

The runtime skill catalog and the actual skill loader must agree on the same loadable skill name; catalog-only visibility is insufficient. This activation contract does not create a new Agent or lifecycle and does not require adding the specialization to default `ROLE_SKILLS.coder`.

Primary focus remains:

- composition;
- hierarchy;
- scale;
- spacing and density;
- typography;
- visual tokens;
- artwork/icon placement;
- state appearance;
- responsive visual composition;
- component implementation;
- frontend structure required to realize the approved visual/interaction contract.

Approved design is an implementation constraint, not decorative inspiration.

UI Coder may improve implementation structure, component reuse, CSS architecture, accessibility, responsiveness and maintainability as long as those changes do not materially alter the approved product/design contract.

Material visual/product changes route back to Planner/Designer/Human rather than being silently invented in code.

---

## 4. Designer relationship

Designer continues to own visual interpretation and design-readiness output.

Designer may produce, depending on scope:

- visual direction;
- component/state treatment;
- responsive intent;
- design tokens/system guidance;
- artwork/icon language;
- visual asset requirements;
- prompts/specifications;
- design acceptance references;
- design coverage.

Designer does **not** become the frontend implementer.

UI Coder consumes the reviewed Designer package and turns it into production source.

### Design-owned target-repository folder

When durable design artifacts are required, use a design-owned target-repository area, for example:

~~~text
design/
  designer/
    design-contract.md
    design-coverage.md
    responsive-intent.md
    asset-requirements.*
    prompts/
    references/
~~~

The design-owned folder contains Designer artifacts only; UI Coder implementation lives in the normal production source tree.

Designer remains read-only to product source. Durable Designer outputs may be persisted into the bounded `design/designer/**` artifact area by GSA/Orchestrator on the Designer's behalf, or by a future explicitly bounded design-artifact write capability. This must not grant Designer generic product-source mutation authority.

---

## 5. No separate pre-code UI Design Phase

The previous proposal inserted a separate UI Design Phase before source implementation. That phase is removed.

Without a capable design-authoring/code-handoff tool, duplicating the UI first in another workspace would add cost without giving GSA a stronger implementation artifact.

Instead:

~~~text
reviewed design intent
→ production frontend source
→ rendered UI
→ inspect/refine
~~~

For greenfield work, Designer may still define the visual shell before Coder implementation when Planner classifies the work as UI_FIRST and no adequate design contract exists.

For brownfield work with an existing usable shell, UI Coder normally evolves the current source rather than rebuilding a second representation elsewhere.

---

## 6. Screen coverage rule moves into implementation

The useful rule remains:

~~~text
FULL SCREEN COVERAGE
+
REPRESENTATIVE CONTENT COVERAGE
~~~

Every distinct required screen type/state must exist in the runnable implementation before the UI slice is considered review-ready.

Repeated/generated content does not need exhaustive instances when representative content is sufficient to prove:

- layout;
- hierarchy;
- density;
- visual states;
- responsive behavior;
- asset placement;
- interaction affordances.

Coverage is verified against the real implementation, not against an external design artifact.

---

## 7. Browser-backed UI Coder development loop

UI Coder may use GSA's available browser/UI inspection capability as a **development feedback surface** after a runnable preview/deployment exists.

The generic UI Coder specialization must explicitly authorize this bounded development/self-QA use. Browser inspection remains read-only observation against the runnable target and never becomes merge, acceptance or Tester authority.

Typical loop:

~~~text
implement source
→ run/deploy preview
→ browser_ui_inspect / equivalent observation
→ inspect responsive composition, clipping, missing assets, visible states, console/page errors
→ refine source
→ self-check
~~~

Browser tool presence alone is not proof of capability; only successful observation against the exact target counts.

UI Coder's own browser inspection is development/self-QA evidence. It does **not** replace independent Tester verification.

---

## 8. Asset handling

There is no expectation that the frontend/design tool generates production artwork.

Designer asset requirements may define stable:

- asset ID;
- filename/path;
- prompt/source;
- intended usage;
- format/dimensions/ratio;
- placeholder strategy;
- acceptance conditions.

UI Coder integrates:

- existing approved assets;
- assets generated by the approved external image/media pipeline;
- generic UI primitives/icons when allowed by the design contract;
- stable placeholders when final binary assets are not yet available.

Production assets go directly into the target repository's normal asset location, such as `src/assets/` or `public/assets/`, according to repository convention.

If Human later replaces an asset while preserving the agreed filename/path/contract, frontend code should not need mechanical changes. A materially visible asset replacement invalidates affected visual evidence/baselines and requires the relevant visual retest/Human review.

---

## 9. Human review

Human subjective acceptance remains authoritative.

Because there is no separate design canvas, Human normally reviews the **rendered implementation** through Tester-prepared evidence.

Expected Human-facing handoff:

~~~text
Tester verifies runnable UI
→ representative page/state/viewport evidence
→ direct Human-openable links/paths according to the active Tester evidence contract
→ Human review
~~~

The frontend workflow does not choose the persistence backend for Tester evidence. If the separately reviewed Tester architecture later makes a target-repository evidence folder canonical, this workflow consumes that result; until then it remains storage-agnostic.

Routine visual refinements that remain inside the approved contract may route directly back to UI Coder.

Material changes to required screens, navigation topology, product flow, state semantics, major responsive behavior or asset contracts route through Planner/Designer/review as applicable.

---

## 10. Tester boundary

Tester remains independent from UI Coder.

UI Coder:
- implements;
- performs development inspection;
- self-checks.

Tester:
- authors the independent verification approach;
- traverses the actual UI;
- checks required states/flows/viewports;
- captures review evidence;
- classifies failures/limitations;
- does not accept UI Coder self-report as proof.

Tester evidence storage follows the separately reviewed GSA Online Tester plan.

---

## 11. Verified cleanup inventory

A live source audit of current `main` established that the abandoned external design-workspace experiment never became a production flow.

The implemented footprint is only **one lab-only runtime skill declaration** in `supabase/functions/gsa-mcp/index.ts`. The related Test Lab scenario wording has already been rewritten into generic frontend capability guidance.

The audit found no implemented downstream integration/product artifacts requiring migration or compatibility handling:

- no external design-provider adapter/client;
- no provider credential/config/session flow;
- no provider-specific API route;
- no external design-file/page/object persistence model;
- no provider-generated asset pipeline;
- no generated-code import/reuse pipeline;
- no provider-specific database/storage migration;
- no provider-owned target-repository workspace;
- no committed generated assets, screenshots, draft code or stable external-design refs.

The current runtime may still advertise the obsolete lab capability while the connected skill loader cannot invoke it. Treat this as a stale capability declaration, not as evidence of an integrated execution flow.

### Cleanup acceptance

Implementation removes exactly the audited obsolete lab declaration and any directly tied stale runtime/catalog/loader reference. Do not invent migrations or cleanup for integrations/products that never existed.

After cleanup:

- active runtime/source contains no abandoned external-design-provider dependency;
- current Test Lab UI Coder guidance remains provider-independent;
- generic UI Coder behavior remains intact;
- historical Git commits and superseded durable audit records remain preserved.

The cleanup must preserve:

- capability-backed verification;
- full screen + representative content coverage;
- Designer asset-contract precedence;
- Human subjective acceptance;
- browser-backed development inspection;
- independent Tester verification.

---

## 12. Initial implementation sequence after plan approval

1. Remove obsolete external-design-tool-specific runtime/lab source.
2. Rebaseline the UI Coder specialization against `CODER-UIUX-HARNESS.md`.
3. Add/adjust the `ui-coder-frontend` specialization and wire deterministic activation: frontend/UI Coder Tasks must name it in the Coder handoff and Coder must load it before frontend implementation.
4. Preserve Planner UI_FIRST/UX_FIRST classification and Designer-before-UI rule when a required shell/design contract is missing.
5. Make UI Coder implement directly in target source.
6. Use browser inspection for development feedback on the real runnable UI.
7. Run context-isolated Reviewer source/contract review after the implementation changes.
8. Invoke Tester separately only when topology or an unresolved empirical capability question requires independent verification; Reviewer does not execute Test Lab experiments.
9. Keep Tester/Human evidence handoff storage-agnostic and follow whichever persistence contract the separately reviewed Tester plan currently authorizes.
10. Deploy/read back the changed GSA runtime before Tester capability verification. Distinguish server-ready from connected-client-schema-stale; a stale client surface is RETEST_REQUIRED / CLIENT_REFRESH_NEEDED, not implementation PASS or product failure.
11. Run a small Test Lab experiment only for genuinely uncertain UI Coder/browser capabilities.

---

## 13. Core principle

> UI Coder is the primary frontend implementer. Designer defines visual intent when needed; UI Coder realizes that intent directly in production source; the runnable UI is the feedback surface; Tester independently verifies it; Human owns subjective acceptance.
