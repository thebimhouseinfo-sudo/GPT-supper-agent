# User Configuration and Drive Root v1.0

## 1. Purpose

Define how a GPT Super Agent installation resolves the user's Google Drive Project root without storing user-specific Drive location in GitHub or relying on conversation memory.

This configuration layer is separate from Project Memory.

## 2. Logical root

The harness refers to one logical root:

```text
SUPER_AGENT_DRIVE_ROOT
```

The logical name is stable across users.

Its physical Google Drive folder is user-specific runtime configuration.

## 3. Configuration authority

User-specific Drive root configuration MUST NOT be stored in:
- the GPT Super Agent GitHub repository;
- Project Memory under the configured root;
- durable Knowledge artifacts;
- conversation history as authoritative state.

The plugin/runtime resolves the current value from the per-user configuration store.

Initial Phase-2 implementation uses Supabase as that store.

Supabase is configuration infrastructure only. It does not replace Google Drive as the durable Project memory/control plane and does not become source-code truth.

## 4. Stable per-user record

Initial logical record:

```text
user_id
drive_root_folder_id
drive_root_name?
created_at
updated_at
```

Rules:
- one active Drive-root configuration record per user;
- `user_id` is the stable record identity/key;
- `drive_root_folder_id` is the canonical Google Drive locator;
- display path/name is UX metadata only;
- no configuration revision counter is required.

Changing root means updating the existing user's record in place:

```text
same user_id
+ new drive_root_folder_id
+ optional new drive_root_name
+ updated_at
```

Do not create a new semantic configuration identity merely because the folder changed.

## 5. Folder identity

Use Google Drive folder ID as the canonical locator.

Do not use a human-readable Drive path as durable identity because folders may be renamed or moved.

A display path/name may be shown to the user but is not authoritative.

## 6. Runtime resolution

GPT/harness behavior:

```text
need Drive root
→ resolve current per-user configuration
→ obtain current drive_root_folder_id
→ operate relative to that folder
```

A previously seen folder ID in chat/context is not authoritative.

The plugin/runtime should resolve the current root at the point the Drive root is needed, especially before root-scoped discovery or write actions.

Changing the setting therefore takes effect on subsequent resolution without requiring migration of GitHub source or a new config ID.

## 7. Settings UX

The fake CLI/settings surface may expose:

```text
Google Drive Root
[Choose folder]
[Change folder]
```

The user chooses or changes the root.

GPT may explain the requirement but must not silently choose or change the user's Drive root.

The settings surface writes the selected folder ID into the stable per-user configuration record.

## 8. Supabase security baseline

Initial Supabase implementation:
- table such as `user_drive_config`;
- Row Level Security enabled;
- authenticated user may read/insert/update only the row whose `user_id = auth.uid()`;
- service credentials/secrets are never committed to GitHub;
- only publishable/client-safe configuration may exist in client code where applicable.

Exact table/column naming is implementation detail as long as these semantics are preserved.

## 9. Bootstrap

If no user configuration exists:

```text
Drive-root-dependent action
→ CONFIG_REQUIRED
→ user selects a Google Drive folder
→ create the stable per-user record
→ retry root resolution
```

No default physical folder belonging to the repository owner is assumed for other users.

## 10. Invariants

1. GitHub contains shared code/contracts, not user-specific Drive folder IDs.
2. Google Drive remains Project memory/control plane.
3. Supabase stores per-user plugin configuration only.
4. `SUPER_AGENT_DRIVE_ROOT` is a logical alias resolved at runtime.
5. One user has one stable root-config record.
6. Changing folder updates the record in place; no revision counter is required.
7. Drive folder ID is authoritative; display path/name is not.
8. Conversation memory is never authoritative for the current Drive root.
9. GPT must not silently select or change the root.
10. RLS isolates one user's root configuration from another user's.
