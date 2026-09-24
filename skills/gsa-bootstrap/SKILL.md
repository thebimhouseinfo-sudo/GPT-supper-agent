---
name: gsa-bootstrap
description: Bootstrap and verify the GPT Super Agent runtime before Project work.
---

# GPT Super Agent bootstrap

Use this skill only for Phase-2 M1A bootstrap and runtime verification.

1. When GSA runtime availability is unknown, call `get_runtime_status`.
2. Treat the current public bootstrap MCP endpoint as read-only.
3. Do not infer or claim a signed-in application user from this bootstrap tool.
4. Do not infer a Project Drive root from chat memory or from the MCP endpoint.
5. Until OAuth is observed end to end, report authentication as unproven.
6. Project work that requires user-specific Drive configuration remains blocked until the authenticated runtime is installed and verified.

This bootstrap skill is intentionally small. Full Orchestrator/role workflows are added only after M1A proves the loading and authentication path.
