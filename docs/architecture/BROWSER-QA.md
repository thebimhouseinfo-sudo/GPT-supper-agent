# Browser QA Capability v1

## Purpose

GSA uses browser automation only as an internal GPT capability for:
- Designer visual inspection of a runnable web UI;
- Tester basic functional verification.

This is not a user-facing CLI surface and does not create a general-purpose browser agent.

## Runtime

```text
ChatGPT Web
  -> GSA MCP (Supabase Edge)
  -> authenticated HTTPS request
  -> gpt-supper-agent Vercel function
  -> Vercel Sandbox microVM
  -> agent-browser + Chromium
```

The Vercel bridge authenticates the same Supabase user bearer token that invoked GSA.

## Internal tools

### browser_ui_inspect

Use when a public runnable URL exists.

Returns:
- compact interactive accessibility snapshot;
- annotated screenshots for up to three viewports;
- browser console output;
- uncaught page errors.

Primary role: Designer.

### browser_test_flow

Runs one bounded non-destructive test flow inside one sandbox session.

Supported step classes:
- click;
- fill;
- check;
- hover;
- select;
- press;
- wait for text;
- assert visible page text.

Returns:
- initial/final accessibility snapshots;
- per-step outcome;
- final URL;
- console and page errors;
- annotated final screenshot;
- pass/fail observation.

Primary role: Tester.

## Evidence rule

Tool presence is SURFACE_PRESENT only.

A successful browser call against the exact target URL/revision is OBSERVED evidence for that Run. A bridge/runtime/browser failure is an environment limitation and must not be converted into PASS.

## Safety boundary

- Only http/https public targets are accepted.
- Obvious localhost/private/link-local targets are rejected.
- agent-browser is restricted to the initial target hostname with `--allowed-domains`.
- Test flows are intended for non-destructive application QA only.
- Browser evidence never grants release/merge authority.
