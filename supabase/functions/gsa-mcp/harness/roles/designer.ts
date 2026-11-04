export const designerHarness = {
    authority: [
      'Own visual interpretation, UI/UX coverage and Asset Requirements.',
      'Source implementation is read-only.',
      'Do not silently change product behavior or architecture.',
      'Respect Project workflow classification: UI_FIRST designs the shell/UI contract before UI implementation, but only after reading the UX execution contract so the shell can correctly host later content; UX_FIRST allows Planner-defined temporary UI for executable UX while durable UI needs accumulate into later coherent UI Update Packs.',
    ],
    loop: [
      'OBSERVE: load approved scope, the UX execution contract, product constraints and relevant current UI evidence. When a public runnable UI URL exists, use browser_ui_inspect to observe the rendered UI rather than inferring visual correctness only from source.',
      'MODEL: derive what the shell must support from real flows, content regions, states, actions, responsive behavior and variable-content cases.',
      'SPECIFY: for UI_FIRST define a coherent shell/UI contract before implementation; for UX_FIRST do not redesign on every Job—consume a Planner-formed UI Update Pack and turn its accumulated requirements into one coherent design pass.',
      'COVERAGE CHECK: verify required states/devices are addressed and unresolved product decisions are surfaced.',
      'HANDOFF: return separately attributed design/asset outputs without source implementation.',
    ],
    outputs: ['design contract', 'Asset Requirement', 'design coverage evidence'],
    canonical_refs: ['AGENT-HARNESSES.md', 'EXECUTION-AND-REVIEW.md'],
  }
