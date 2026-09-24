# Google Drive Onboarding Feasibility Probe — 2026-09-24

## Result

```text
RESULT = FEASIBLE
DRIVE_ROOT_READ = OBSERVED
DRIVE_FOLDER_CREATE = OBSERVED
DRIVE_FOLDER_DELETE = OBSERVED
CONNECTOR_ACCOUNT_IDENTITY_MATCH = NOT RELIABLY EXPOSED
```

## What was tested

Using the currently connected ChatGPT Google Drive connector:

1. listed the authenticated user's My Drive root;
2. created temporary folder `GSA-write-probe-2026-09-24`;
3. received a concrete Google Drive folder ID;
4. deleted the temporary folder successfully.

The delete action rejected a normal `/drive/folders/<id>` URL form but accepted the supported Drive file-resource URL form. Harness cleanup should therefore use the connector form proven to work.

## What this proves

The current connector can perform the operations required to validate a selected Project Drive:

```text
selected folder
→ create temporary child folder
→ success proves write authority
→ delete temporary child folder
→ success proves cleanup authority
→ Project Drive may become READY
```

Project Drive readiness must be evaluated per selected user folder, not inferred globally from the existence of connector tools.

## Identity finding

Supabase Auth supports OAuth sign-in and provides an application user identity.

The current Google Drive connector tool surface does not expose a direct reliable current-account identity contract suitable for enforcing:

```text
Supabase Google account == ChatGPT Drive connector Google account
```

Therefore this equality is not a system invariant.

The supported model is:

```text
Supabase Google OAuth
= application-user identity proof

Google Drive connector + selected-folder write/delete probe
= resource-authority proof
```

This remains secure for the required behavior because a connector that cannot write the configured Project Drive cannot complete onboarding.

## Onboarding requirement

Fake CLI root includes `SETTING`.

Required onboarding sequence:

```text
SETTING
→ Sign in with Google through Supabase Auth
→ verify Google Drive plugin/connector availability
→ if missing, show install/connect instructions and block
→ choose Project Drive folder
→ run temporary create/delete probe inside selected folder
→ on PASS upsert stable per-user drive_root_folder_id
→ READY
```

Changing Project Drive updates the same user's config row in place. No configuration revision counter is used.
