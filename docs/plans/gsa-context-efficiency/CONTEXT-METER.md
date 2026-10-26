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


## Opt-in MCP HTTP response-size probe

Source entrypoint now conditionally annotates **non-streamed JSON responses only** when server environment variable `GSA_CONTEXT_METER_HEADERS=1` is set AND the HTTP transport has supplied a numeric `Content-Length` header. It adds `X-GSA-Context-Proxy-Version: v1`, `X-GSA-Context-Response-Bytes`, and `X-GSA-Context-Visibility: HOST_UNKNOWN`.

**Off by default.** No MCP body read, response content capture, persistent log, background request, network telemetry, or token claim. If a response is streamed, lacks Content-Length, is not JSON, or the feature flag is disabled, no probe header is added. Do not treat absent header as a zero-byte response. Header bytes reflect **HTTP output only** and are not equivalent to model-facing input or tool-response payload (SSE and other transport framing may apply).

This is an incremental, safe boundary probe; it **does not satisfy automatic capture of all MCP tool payloads** and must not be used for an R-00 baseline without pinned runtime and event provenance. Live CI/E2E remain deferred by Human.


## Streamed-response measurement amendment (2026-10-26)

Opt-in `GSA_CONTEXT_METER_HEADERS=1` now counts transport bytes even without `Content-Length` by using a transparent streaming `TransformStream` and emitting one size-only `console.info` JSON record **after successful stream completion** (`metric=gsa-mcp-http-response-bytes`, `version=1`, `bytes`, `visibility=HOST_UNKNOWN`, `completeness=COMPLETE`). On cancellation or error, no completion record is emitted. No payload text, identities or request URLs are logged. Streams are forwarded chunk-for-chunk and no false `Content-Length` is introduced.

Where a numeric `Content-Length` is available, the original header-based probe remains; otherwise only the completion log can provide observed size. Do not sum the header and stream measurements for a single response; they are alternative observation paths. Existing docs describing header-only behavior refer to the initial implementation and are superseded by this amendment.

**Safety and interpretation:** The transparent stream wrapper is an untested application-code change and may affect streaming backpressure or host behavior; validate under actual MCP SSE/JSON before release. HTTP transport size still is not ChatGPT model-facing tokens. No continuous baseline, per-tool attribution or GSA0/GSA1 comparison is implied.


## Runtime/run correlation (2026-10-26)

When `GSA_CONTEXT_METER_HEADERS=1`, the runtime now labels size-only completed HTTP response samples with two **operator-provided** environment variables:

- `GSA_CONTEXT_RUNTIME_SHA`: pinned lowercase 40-character source commit SHA.
- `GSA_CONTEXT_RUN_ID`: non-sensitive experiment/Job-run label, 1–64 ASCII alphanumeric, underscore or hyphen characters. Do **not** put user identities, session tokens, private project names or secrets in the label.

Invalid/absent labels are recorded as `null` and marked `eligible_for_baseline:false`; the live runtime SHA is **not inferred** from a claimed Git branch. This opt-in log collects numerical transport bytes, a bounded synthetic run identifier, a source SHA, completion marker and the source of observation (`CONTENT_LENGTH` or `STREAM_COUNT`). It does not persist response bodies. A single response follows one counting path, not two.

The offline `test-lab/context-run-report.cjs` groups these size-only JSONL records by run and pinned runtime SHA, rejects invalid/unpinned samples and marks run identifiers appearing under multiple SHAs `INVALID_MIXED_RUNTIME_SHA`. Usage: `node test-lab/context-run-report.cjs size-only-events.jsonl`.

**Caveat:** This is instrumented HTTP transport data, not proven model-facing context consumption. Even pinned runs remain `CANDIDATE_NEEDS_WORKLOAD_PROVENANCE`, never an automatically accepted GSA0 baseline. Additional Job/runtimes and equivalent-workload evidence are required for the rolling GSA0/GSA1 comparison. User deferred real-world tests; no CI/E2E PASS is claimed.
