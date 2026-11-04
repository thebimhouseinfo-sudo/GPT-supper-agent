# GSA4 — R0 Initial Research: source, meter, simulate and method

**State:** R0 STARTED / source-read and evidence inventory only. **Independent method review pending.** No theoretical scenario PASS, real-host test, module split or runtime edit.  
**Date:** 2026-11-04.  
**Canonical plan:** [GSA4-RESEARCH-PLAN.md](./GSA4-RESEARCH-PLAN.md), within [DETAIL-PLAN.md](./DETAIL-PLAN.md).  
**Source tree observed:** GSA development commit `8544d224c891209ef311e59a7fd60e0501bfbf16` for inventory; pin a new exact revision before further measurements. GSA3 main release baseline `0b5cf875402c7735e1ef573ab95df5858c6ac5e8`. Branch document changes after inventory do not by themselves establish any runtime behavior change.

## GOAL

Validate the baseline and research tools; decide the scope and quality conditions of a future source-blind User-input simulation. Do not preselect file grouping or context router.

## Evidence — existing CT-00 confirmed in source

Repo tree and source inspections independently found the **already implemented** CT-00 assets:

| File | Observed role | Blob SHA |
| --- | --- | --- |
| [`docs/plans/gsa-context-efficiency/CONTEXT-METER.md`](./CONTEXT-METER.md) | Meter v1 methodology, known limitations, size-only HTTP and run correlation | `766e7b77e3d302debcf1b72cde2753f77198da18` |
| [`test-lab/context-meter.cjs`](../../test-lab/context-meter.cjs) | Offline JSONL recorder for model-facing/tool/file navigation | `eeaf29ba1e0fdeeb79c7ddba3de421481b7242d6` |
| [`test-lab/context-run-report.cjs`](../../test-lab/context-run-report.cjs) | Run/runner SHA correlation and invalid-mixed-version rejection | `15618f066276893b25bcd0f2d7ced23609041236` |
| `test-lab/mcp-context-capture.cjs` | Source-tree-confirmed size-only MCP response adapter; inspect contract before use | tree entry observed |
| `test-lab/gsa2-harness-dedup.test.cjs` | Existing Harness equality/role-entry test, likely candidate golden baseline after pin | tree entry observed |
| `test-lab/gsa3-tool-skill-payload.test.cjs` | Existing tool/skill output regression | tree entry observed |

**Verified intended interface:** `node test-lab/context-meter.cjs records.jsonl --code-lines=120 --complexity=4`; `node test-lab/context-run-report.cjs size-only-events.jsonl [workloads.json]`. `CONTEXT-METER.md` explicitly warns these are **GSA-observable proxies, not true ChatGPT host tokens/caching/latency**; `model_facing` and uncertain `tool` channels cannot be double-counted. The program has been read, **not executed** in this research step. Do **not rebuild CT-00**.

## Evidence — original `simulate` source located

The [Bootstrap repository's source skill](https://github.com/thebimhouseinfo-sudo/bootstrap/blob/main/project-template/.agents/skills/simulate/SKILL.md) is real and readable, observed blob `5b55a25057d2a33b320e54840f5578d81269c8b0`. It has associated references for input catalog, application brief, external mocks, causal fanout and host simulations.

**Its essential method:** a Designer blinded to code derives real-user journeys/expected outcomes from Criteria, requirements and observable user behavior; freeze scenario IDs/design/hash **before** a Tracer inspects source and traces handler/guard/state/external boundaries. Simulate success and failure of external services and trace the User's next action. A source-only trace must be labeled accordingly.

**Availability distinction:** that skill exists as **Bootstrap repository source**, but it has not been shown as an installed/callable ChatGPT Skill in this session. GSA's current `get_skill_catalog` lists `tester-lab` but not `simulate`. GSA's `ROLE_HOST_SKILLS.tester` references `scenario-tester`, yet source reference is not evidence of installed host capability. **No skill was actually executed; no simulation PASS claimed.** If host skill is unavailable, design a controlled theoretical fixture simulation as an explicitly narrower method.

**Important honesty limit:** source files were already inspected during the preceding discussion. Thus scenario examples listed in the Research Plan are **coverage hints only**, not a strict source-blind simulate design. Independent source-blind Designer must derive/freeze the real scenario fixtures from Human requirements/Criteria before a Tracer reads/uses implementation details.

## Evidence — large module inventory, not proven model co-read

Source tree and file contents show these sizable modules (observed GSA development inventory at the pinned tree; approximate source UTF-8 bytes):

| Module | Size | Caution |
| --- | ---: | --- |
| `supabase/functions/gsa-mcp/index.ts` | approximately 142 KB | Many registration/runtime functions; GSA1 had already extracted 28 internal imported modules |
| `supabase/functions/gsa-mcp/harness-catalog.ts` | 85.5 KB | Contains shared/role Harness, skill catalog and render function |
| `supabase/functions/gsa-mcp/run-execution-tools.ts` | about 49 KB | Run dispatch & evidence operations |
| `supabase/functions/gsa-mcp/selftest.ts` | about 49 KB | Selftest/fixtures |
| `supabase/functions/gsa-mcp/checkpoint-tools.ts` | about 35.5 KB | Evidence/checkpoint lifecycle |
| `supabase/functions/gsa-mcp/evidence-repository-tools.ts` | about 31 KB | Evidence repositories and attestation |
| `supabase/functions/gsa-mcp/project-setup-tools.ts` | about 29 KB | Project setup/Criteria/Bootstrap |

File size and TypeScript imports **do not demonstrate** that an AI model actually opened the same files in one Task. Confirm code-navigation/co-read from observable task logs or controlled source-navigation tasks before proposing split for file-size reasons.

## R0 options / early recommendation for Reviewer

| Option | Scope | Benefit | Risk | Provisional assessment |
| --- | --- | --- | --- | --- |
| A | Harness text only | Fast to audit | Misses Agent routing, skill injection, rereads, and actual loading overhead | Too narrow for GSA4 user goal |
| B | Harness + skills | Good immediate value | Still misses Project/Run and source-navigation costs | Useful **first audit subset** |
| C | End-to-end User → Agent → Harness/Skills/Context → Tools/Handoff | Correctly matches Human-approved research question | Broad scope if implemented all at once | **Recommended research scope**, stage investigations |
| D | No research / narrow selector NO_BUILD | No investigative cost | Cannot answer the broader Agent-level architecture question | Not sufficient evidence for current R0 decision |

**Provisional method choice:** C as inventory boundary, B as a pragmatic early subset for measured/role-focused examples. This is a **proposal for independent research-method review**, not an approved technical architecture.

## R0 next steps and review readiness

1. Independent research-method Reviewer checks the above scope against approved Criteria and D01–D13 Human decisions; source-blind simulation Designer obtains User journey fixtures without implementation code.
2. Verify actual meter commands on a safe, pinned synthetic JSONL fixture **only when a relevant executable environment is available**. Report SOURCE_EXECUTED separately; don't pretend static inspection ran a test.
3. Create complete eight-Agent as-is trace, separating known harness producer code, suggested skills, recommended reads, actual observed source-navigation and unknown host context behavior.
4. Only when R0 review coverage is satisfactory proceed to options R2 and sim design R3; do not code modularization before design decision.

**No Criteria change, app code mutation, runtime deploy, extra meter, new router, Job or gate is implied by this research report.**
