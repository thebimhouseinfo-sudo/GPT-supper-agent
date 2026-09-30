# Test Lab

Test Lab is the repository's **empirical capability-experiment** area. It exists to answer questions that cannot be safely settled from prompts, schemas, or tool presence alone.

## Authority boundary

- Test Lab is **not** production Project Memory.
- Test Lab results are **not** production Verification and cannot satisfy or mutate Job/Run lifecycle gates.
- Production Planner/Coder/Tester harnesses do not automatically load or consume Test Lab output.
- `evals/` remains the canonical deterministic contract/regression-test surface. Test Lab complements it; it does not replace it.
- Any future promotion of Lab evidence into workflow/checkpoint semantics belongs to a separately reviewed upgrade.

## Layout

- `scenarios/ui-coder/` — empirical UI Coder capability scenarios and Tester-authored work requests.
- `scenarios/tester/` — empirical Tester planning/verification scenarios.
- `fixtures/` — small, synthetic, non-sensitive inputs needed to reproduce experiments.
- `results/` — small Markdown/JSON result manifests and evidence references.
- `scratch/` — local/temporary experiment output; ignored by Git.

## Result manifest minimum

A small result manifest should identify, when applicable:

- scenario/test identifier;
- target source/design revision;
- environment and capability surface used;
- capability question or operation tested;
- requested output/evidence;
- observed outcome;
- evidence references;
- limitations / untested areas;
- direct Human-review links or paths for screenshots/artifacts when available.

A tool being present is not proof that the capability works. Record unavailable, partial, blocked, or unverified outcomes explicitly.

## Evidence and privacy

Do not commit credentials, access tokens, private screenshots, HAR/trace payloads, videos, large binaries, or generated design/media assets here. Store binary/private evidence in an approved external/private location and put only a stable reference in the result manifest.

For Human UI review, the evidence handoff should contain **direct user-openable links/paths** to the relevant screenshots/artifacts. A result that forces the reviewer to search repository/storage manually is not Human-review-ready.

## Cleanup

Scratch output is disposable. Small scenario/result manifests may remain when they are useful for reproducing a capability finding. Remove stale external evidence references when they no longer resolve or when their retention period ends.
