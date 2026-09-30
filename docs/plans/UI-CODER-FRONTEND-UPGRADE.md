# UI Coder Frontend Upgrade Plan

Status: **UNDER REVIEW / CR REQUIRED**
Scope: **GSA Online / GPT-supper-agent**

This plan defines the frontend workflow around capabilities GSA Online actually owns and can verify.

Only a Human-invoked CR may clear the UNDER REVIEW mark. Normal Reviewer PASS may validate execution planning but does not convert this architecture note into a Human-approved final UI workflow.

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
→ representative page/state/viewport screenshots
→ target-repo test/evidence folder
→ direct GitHub folder/file links
→ Human review
~~~

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

## 11. Source cleanup required after this plan is approved

Implementation must later remove obsolete external-design-tool-specific runtime/source artifacts, including any obsolete design-workspace lab skill, design-tool-specific Test Lab scenarios, design-tool-specific capability wording and dead integration assumptions.

That cleanup is **not part of this planning-only change**.

The cleanup must preserve useful generic UI Coder rules already present, including:

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
3. Add/adjust a generic frontend/UI Coder skill only where the current runtime needs more explicit operating instructions.
4. Preserve Planner UI_FIRST/UX_FIRST classification and Designer-before-UI rule when a required shell/design contract is missing.
5. Make UI Coder implement directly in target source.
6. Use browser inspection for development feedback on the real runnable UI.
7. Keep Reviewer and Tester independent.
8. Keep Tester/Human evidence handoff in the target repository according to the separately reviewed Tester plan.
9. Run a small Test Lab experiment only for genuinely uncertain UI Coder/browser capabilities; do not invent an external design-tool dependency.

---

## 13. Core principle

> UI Coder is the primary frontend implementer. Designer defines visual intent when needed; UI Coder realizes that intent directly in production source; the runnable UI is the feedback surface; Tester independently verifies it; Human owns subjective acceptance.
