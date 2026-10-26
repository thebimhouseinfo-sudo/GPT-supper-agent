# R-00 — Context Meter v1

**Purpose:** Report a reproducible proxy from **GSA-observable** material. This is NOT a measure of true ChatGPT host context-window use, exact tokenizer counts, caching, latency or reasoning tokens.

## Recorder interface

`test-lab/context-meter.cjs` reads UTF-8 JSON Lines (one event per line):

```jsonl
{"kind":"model_facing","text":"GSA output positively known to reach model"}
{"kind":"tool","text":"tool response or input whose host visibility is unverified"}
{"kind":"file_read","path":"src/app.ts","text":"file data"}
{"kind":"file_search","path":"src/app.ts","text":"search matches"}
{"kind":"navigation","from":"src/app.ts","to":"src/logic.ts"}
```

Keep `model_facing` reserved for independently observable GSA-owned model-facing payload. Tool text with uncertain host duplication goes under `tool`, **not additionally** into model-facing totals. Avoid emitting secrets, identifiers or full private source in telemetry when only a size or count is needed; recorder is offline input and does not log user data on its own.

Run:

```sh
node test-lab/context-meter.cjs records.jsonl --code-lines=120 --complexity=4
```

Report raw UTF-8 byte counts, Unicode character counts, calls, navigation read/search/hops, distinct file paths and **character count / 4** as an explicitly approximate token proxy. There is no external tokenizer integration. Only feed genuine observation events; synthetic samples are for calibration, **not** an official GSA0/1/2 baseline.

## Workload-normalized comparison

For real qualifying functional implementation Jobs, independently log **hand-authored application code** lines changed `L` = added+deleted (no documentation, test files, generated files or format-only churn; moves separately) and complexity dimensions (flow/state; dependencies; concurrency/error/security/native host; acceptance breadth), each scored 0–2 **before** seeing context outcome. Let `D` be their sum in [0,8].

- `K = 1 + D/8`
- `W = L × K`
- `C = GSA-observable model-facing estimated tokens`
- `E = 1000 × C / W`; lower is better
- `I = (1 - E_candidate / E_baseline) × 100%`

Output `E` is null unless both `L>0` and `D` are provided. Compare to **one current active baseline** per the approved rolling plan; retain raw figures and low/central/high sensitivity. Skip numeric comparison if runner version is mixed/unknown, workload is incommensurate, application LOC nearly zero, tests/docs-only, or metric capture is faulty: mark INCONCLUSIVE or INVALID explicitly. No fabricated benefit.

## State and release

Meter version: `gsa-context-proxy/v1`. This first version is a standalone deterministic reader, not a hooked MCP recorder and not a real-world baseline. R00-1 event inventory and real version-pinned instrumented captures remain pending. Human explicitly deferred live testing on 2026-10-25. Avoid merging to main or production deploy on this basis.

## R00-1/R00-2: size-only MCP response capture (2026-10-26)

When an **authorized, already available** response-event JSONL export exists, run `node test-lab/mcp-context-capture.cjs mcp-responses.jsonl > observed-sizes.jsonl`, then `node test-lab/context-meter.cjs observed-sizes.jsonl`. This input is a local export with entries containing `tool`, and `structuredContent` and/or `content`. It does **not** fetch host conversation history or install a background recorder. Do not create an external telemetry sink.

The capture output contains **only tool name, byte counts, duplicate-serialization flag and host-visibility-UNKNOWN**, never response text, file paths, tokens or raw payload bodies. `observed_tool_sizes` is counted as a separate `tools` observation in the meter, not `model_facing`; if `structuredContent` is duplicated in one JSON text content entry, the proxy counts one candidate payload instead of summing the two. Even where no duplication is detected, host inclusion of either channel remains UNKNOWN.

This is **offline instrumentation**, not automatic live capture. A real GSA0 baseline is **not available yet** until an actually pinned runtime and comparable approved real U Job are observed. Running test lab input through this capture is useful for shape checks only, not context-efficiency claims. Human has deferred live tests, so no CI/E2E PASS is asserted.
