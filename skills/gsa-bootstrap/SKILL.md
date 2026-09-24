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
6. GSA authentication is only for GSA identity/configuration. Never present Google Drive connection as part of GSA account setup.
7. Google Drive is an external ChatGPT connector. Use it only to select/probe the user's chosen Project Drive folder.
8. Project work requiring a Drive root remains blocked until both GSA identity is known and the selected folder has passed the external Drive write/delete probe.

This bootstrap skill is intentionally small. Full Orchestrator/role workflows are added only after M1A proves the loading and authentication path.


## URL-first routing

When the user provides a recognized connected-app URL, treat the URL as the target and use the matching connected app automatically.

Examples:
- Google Drive folder/document URL → use Google Drive;
- GitHub repository/PR/file URL → use GitHub.

Do not require the user to type `@Google Drive` or `@GitHub` when the provider is already identifiable from the URL.

The connector may still be invoked internally; this rule concerns user-facing syntax only.

For Project Drive setup:
1. ask for/pick up the pasted Google Drive folder URL;
2. resolve and probe it through the connected Google Drive app;
3. call GSA `set_drive_config` with that URL only after the write/delete probe passes.
