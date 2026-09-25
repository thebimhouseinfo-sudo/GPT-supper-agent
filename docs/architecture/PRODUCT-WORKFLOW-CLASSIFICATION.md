# Product Workflow Classification

## Purpose

Every product/application Project that can contain material UI/UX work must have one planning classification:

```text
UI_FIRST
UX_FIRST
```

This classification is independent of whether the repository is greenfield or brownfield.

Planner owns classification and topology consequences.
Changing an existing explicit classification is a material planning decision and requires Human approval.

## UI_FIRST

Use when visual structure/design is a primary product contract and implementation will depend materially on that design.

Workflow:

```text
objective
→ Planner
→ inspect existing UI/design artifacts
→ detailed-enough UI contract?
   ├─ YES → implementation topology
   └─ NO  → Designer/UI-definition first
→ Human review when design choice is material
→ Coder implementation
→ visual/behavior verification
```

Rule:

> Do not develop UI screen-by-screen opportunistically when the Project is UI_FIRST and the affected surface lacks a sufficiently detailed design contract.

Reason:
incremental visual invention changes layout, component boundaries, asset needs and implementation sequencing, forcing repeated replanning and rework.

A UI_FIRST contract should cover, as applicable:
- page/screen structure;
- navigation and major states;
- layout hierarchy;
- responsive behavior;
- reusable components;
- interaction states;
- visual language/design-system constraints;
- required assets;
- acceptance examples or references.

It does not require pixel-perfect design for every trivial state before any code can start. Planner decides whether the contract is sufficiently detailed for the affected implementation scope.

## UX_FIRST

Use when product behavior, task flow, information architecture or interaction logic must stabilize before visual design is worth freezing.

Workflow:

```text
objective
→ Planner
→ UX/product-flow work
→ implementation/prototype where topology allows
→ collect UI requirements produced by real UX needs
→ durable UI-requirement backlog
→ UI-design trigger/milestone
→ Designer creates coherent UI contract from accumulated requirements
→ visual implementation/refinement
```

Rule:

> UI requirements discovered during UX_FIRST work are collected; they are not automatically expanded into full visual design at every discovery point.

Examples of collected requirements:
- this flow needs a confirmation state;
- mobile needs a persistent primary action;
- this lesson needs an illustration slot;
- error state must preserve entered data;
- parent settings need a compact tablet layout.

These remain durable requirements until the planned UI design pass.

Coder must not use UX_FIRST as permission to invent permanent visual architecture. Temporary/prototype presentation is allowed only when topology and scope say so.

## Brownfield behavior

For an existing repository:

```text
Planner
→ read existing Project Memory + design/UX artifacts + live implementation
→ infer candidate classification from actual product workflow
→ preserve explicit existing classification when present
→ review whether existing artifacts are sufficient
→ upgrade only gaps required by the current objective
```

Brownfield does not mean "keep every old UI decision".
It means understand and review before changing it.

For UI_FIRST brownfield:
- existing UI may already be the design contract;
- Planner reviews consistency/completeness;
- Designer is inserted only where affected surfaces lack sufficient definition or need material redesign.

For UX_FIRST brownfield:
- existing screens are evidence of current interaction needs;
- Planner may collect missing/changed UI requirements while UX work continues;
- full visual redesign is deferred until its planned trigger unless the current objective specifically is UI redesign.

## Greenfield behavior

For a new repository:

```text
Planner research
→ nominate UI_FIRST or UX_FIRST with rationale/trade-offs
→ Human Gate on material workflow choice
→ persist classification
→ build topology consistent with it
```

UI_FIRST greenfield normally needs early Designer involvement.

UX_FIRST greenfield normally needs product/flow definition first and a durable UI-requirement collection mechanism.

## Planner topology rules

Before persisting a UI-bearing Job, Planner must answer:

1. What is the Project workflow classification?
2. Does the affected scope already have enough UI/UX contract to execute?
3. If UI_FIRST and UI contract is insufficient, where is the Designer/UI-definition predecessor?
4. If UX_FIRST, where are discovered UI requirements recorded?
5. What event/milestone triggers the coherent UI design pass?
6. Does the proposed topology accidentally ask Coder to invent a material product/design decision?

If any answer is missing, the plan is incomplete.

## Relationship to greenfield/brownfield intake

These are orthogonal dimensions:

```text
             UI_FIRST              UX_FIRST
greenfield   research + design      research + UX + collect UI
brownfield   review UI + upgrade    review UX + collect/upgrade
```

So GSA Planner evaluates both:

```text
Repository maturity: GREENFIELD | BROWNFIELD
Product workflow:    UI_FIRST | UX_FIRST
```

The combination determines the planning strategy.
