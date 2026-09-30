# UI Coder Penpot Upgrade Plan

## 1. Objective

Upgrade the existing UI Coder specialization with a real UI design phase powered by Penpot before source implementation.

This plan is intentionally narrow.

It does **not** redesign the existing Designer role, Reviewer role, Tester role, Coder family, Job lifecycle, or planning architecture.

The purpose is to add the missing practical design-authoring capability to UI Coder while preserving existing reviewed design inputs and downstream implementation workflow.

---

## 2. Core Change

Current conceptual flow:

```text
Designer package
→ Reviewer PASS
→ UI Coder implementation
```

Upgraded flow:

```text
Designer package
→ Reviewer PASS
→ UI DESIGN PHASE
→ UI Coder + Penpot
→ Tester
→ Human
↕
UI Coder ↔ Tester
→ UI DESIGN APPROVED
→ continue implementation
```

Penpot is added as an operational capability of UI Coder.

UI Coder is not split into a new top-level Agent in this plan.

---

## 3. UI Design Phase

A new UI Design Phase is inserted after the existing Designer package has passed its required review and before UI Coder proceeds with normal source implementation.

During this phase UI Coder may use Penpot to:

- build the application shell;
- create all distinct required screen types;
- create reusable visual components;
- create or apply design tokens;
- define visual state variants;
- realize responsive compositions;
- place representative sample content;
- create/export UI assets;
- integrate generated assets required by the reviewed Designer package;
- prepare the visual shell for Tester/Human review;
- use Penpot design-to-code capabilities where useful for later implementation.

The addition of Penpot expands UI Coder capability. It must not be interpreted as narrowing UI Coder's existing responsibilities.

---

## 4. Screen Coverage Rule

The UI Design Phase follows:

```text
FULL SCREEN COVERAGE
+
REPRESENTATIVE CONTENT COVERAGE
```

Every distinct product screen required by the approved design/spec must be represented in the shell.

Repeated/generated content inside a screen does not need exhaustive design instances.

Instead, UI Coder should use representative samples sufficient to demonstrate the relevant:

- layout;
- hierarchy;
- content density;
- visual states;
- responsive behavior;
- asset placement;
- interaction affordances.

Example:

If an educational application contains Topic, Lesson List, Theory, Practice, Result, and Print screens, all six screen types must be designed.

It is not necessary to reproduce every lesson or every practice item inside Penpot.

---

## 5. UI Asset Handling

### 5.1 Penpot-native UI assets

Assets belonging to the application shell or general UI visual language may be created in Penpot and exported as real production assets when appropriate.

Examples may include:

- icons;
- simple vectors;
- badges;
- decorative UI elements;
- card decorations;
- progress visuals;
- shared UI artwork;
- other shell-level visual assets.

These exported assets may be used directly by the source implementation.

### 5.2 Reviewed generated-asset contracts

When the reviewed Designer package already defines a specific generated visual with a stable contract such as:

- asset ID;
- filename;
- prompt;
- intended usage;
- path or slot;
- ratio/dimension requirements;

UI Coder should preserve that contract.

For example, when Designer has specified a page background, card background, hero artwork, or other explicit generated image, UI Coder should:

```text
use the reviewed prompt
→ generate the intended asset
→ preserve the approved filename/ID
→ place the real asset in the UI
```

UI Coder should not casually replace such a defined visual with an unrelated icon/vector merely because Penpot can create one.

### 5.3 Generic UI primitives

Where no specific generated visual is required and a simple icon/vector/component adequately satisfies the approved UI intent, UI Coder may use an appropriate Penpot/UI primitive instead of unnecessarily invoking an image-generation workflow.

### 5.4 Content-deep assets

Assets that belong to deep/generated content rather than the shell may continue to use the existing external asset-generation pipeline.

This plan does not redefine that pipeline.

---

## 6. Tester Checkpoint During UI Design

After the shell reaches a testable state, Tester is invoked as a UI-design checkpoint.

Tester should focus on observable shell behavior and evidence such as:

- screen availability;
- prototype/navigation flow;
- visual state availability;
- responsive behavior;
- viewport overflow/clipping;
- obvious layout breakage;
- representative flow completion where the prototype supports it;
- screenshots across relevant viewports;
- concise objective observations.

Tester evidence is then presented to Human review.

Tester is not the visual decision-maker and does not replace Human subjective acceptance.

---

## 7. Human Design Loop

Human review is required because visual/UI acceptance contains subjective product decisions.

The normal loop is:

```text
UI Coder
→ Penpot shell
→ Tester
→ screenshots + observed evidence
→ Human
→ feedback
→ UI Coder revises Penpot
→ Tester retests
→ Human
→ ...
```

This loop may continue while the UI is being refined.

Routine visual refinements should not require Reviewer to re-enter every iteration.

Examples:

- spacing;
- sizing;
- visual density;
- color treatment;
- icon sizing;
- composition;
- artwork placement;
- other non-material refinements inside the approved design contract.

If Human feedback materially changes an upstream contract, the existing planning/review workflow should be used as applicable.

Examples include material changes to:

- required screen set;
- navigation topology;
- product flow;
- state semantics;
- major responsive behavior;
- reviewed asset contract.

---

## 8. UI Design Approval

When the shell has completed the Tester/Human design loop, it reaches:

```text
UI DESIGN APPROVED
```

This means the Penpot design is accepted as the visual implementation reference for subsequent source work.

UI Coder may then continue implementation using:

- the approved Penpot artifact;
- exported UI assets;
- reviewed generated assets;
- Penpot design-to-code output where useful;
- the existing Designer package and implementation constraints.

The UI should no longer need to be invented from scratch inside source code.

---

## 9. Capability / Readiness Requirement

Penpot availability must be treated as an operational capability rather than assumed from tool presence alone.

Before the workflow depends on it, the integration should be proven against the real target environment.

At minimum the system should distinguish:

```text
DISCOVERED
→ REACHABLE
→ INVOCABLE
→ FUNCTIONAL
→ GOAL_MET
```

A listed Penpot/MCP capability is not by itself proof that UI Coder can successfully author, read back, export, and continue a real design workflow.

Tester may be used to probe/verify this capability before it becomes a required dependency of the UI Design Phase.

---

## 10. Initial Implementation Scope

The first implementation should stay simple:

1. Add Penpot capability to UI Coder.
2. Add the UI Design Phase before normal UI implementation.
3. Allow UI Coder to create/edit the shell in Penpot.
4. Support full screen coverage with representative content.
5. Support creation/export of UI assets from Penpot.
6. Preserve reviewed generated-asset contracts where Designer has already supplied ID/filename/prompt/usage.
7. Add a Tester checkpoint for shell flow/responsive/screenshots.
8. Add the Human design-review loop.
9. After Human acceptance, allow UI Coder to continue implementation using the approved Penpot design and design-to-code output where useful.

Do not expand this first implementation into a redesign of Designer or the rest of the GSA architecture.

---

## 11. Follow-up Before Detailed Execution Planning

Before converting this upgrade into a detailed execution plan, perform a focused architecture review of the existing Designer system and its interfaces with:

- Planner;
- Reviewer;
- UI Coder;
- UX Coder;
- asset requirements;
- Design Coverage;
- DESIGN_READY semantics;
- Tester;
- current UI/UX Coder harness behavior.

The purpose of that review is to integrate the new UI Design Phase without deleting, duplicating, narrowing, or accidentally overriding proven existing behavior.

---

## 12. Core Principle

> Penpot adds a real UI-design workspace to UI Coder. The upgrade inserts a reviewable, testable, Human-approved UI Design Phase before source implementation without prematurely redesigning the existing Designer architecture.
