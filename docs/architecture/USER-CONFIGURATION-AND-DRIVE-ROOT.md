# User Configuration and Drive Root

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

## 4. User identity

The fake CLI root exposes `SETTING`.

Initial onboarding uses Supabase Auth with Google OAuth:

```text
SETTING
→ Sign in with Google
→ Supabase Auth creates/resolves auth.users.id
→ verified email is stored/displayed as account label
```

The authoritative application identity is the Supabase authenticated user ID.

The verified Google email is a human-readable unique account label and may be stored for UX, but authorization/RLS binds to `auth.uid()`, not to a user-entered email string.

The user must not establish identity by typing an arbitrary Gmail address.

## 5. Google Drive is an external ChatGPT connection

The ChatGPT Google Drive plugin/connector is not owned, configured, authenticated, or stored by GSA.

GSA never requests Google Drive OAuth scopes and never stores Google Drive credentials.

The responsibilities are separate:

```text
Supabase Auth + Google sign-in
= establish GSA user identity only

ChatGPT Google Drive plugin
= external ChatGPT capability used to access the folder

Supabase user_drive_config
= remember which Drive folder ID this GSA user selected
```

If the user's ChatGPT account does not currently have usable Google Drive access, GSA may explain that Project Drive operations cannot continue, but connection/authorization is performed through ChatGPT's own Google Drive plugin UI outside GSA.

Current connector evidence supports Drive listing, folder creation and deletion.

For normal UX, the user supplies the Google Drive folder URL directly. Once Google Drive is connected in ChatGPT, the URL itself is sufficient routing context; the user does not need to prefix the request with `@Google Drive`.

```text
paste Drive folder URL
→ ChatGPT routes the URL to the connected Google Drive app
→ resolve/probe the folder
→ GSA extracts/stores the canonical folder ID
```

The `@` app mention remains an optional explicit routing mechanism, not a GSA requirement.

Preferred write-authority verification is non-destructive permission metadata:

```text
Drive get_profile
+ target folder get_file_metadata
→ match connected Drive email against folder permission role
→ owner/writer/organizer/fileOrganizer = write-authority verified
```

Only when permission metadata is insufficient should ChatGPT fall back to a temporary create/delete probe. That fallback may create only one direct child inside the selected Project Drive root and may delete only the exact returned ID from that creation.

GSA must never infer the Google Drive connector account from the GSA/Supabase email; they are independent identities and may differ.

No equality between the Supabase Google account and the ChatGPT Google Drive account is required. The proofs are intentionally independent:
- Supabase Auth proves GSA application-user identity;
- the ChatGPT Google Drive connector proves practical authority over the selected folder.


## 5A. Project Drive mutation boundary

Once configured, `drive_root_folder_id` is not only a locator; it is the absolute GSA Drive mutation boundary.

GSA may mutate only:
- the configured Project Drive folder itself where the operation is meaningful;
- descendants whose ancestry is proven to reach that folder.

GSA must never mutate:
- My Drive root;
- folders/files outside the configured root;
- ancestors/siblings;
- targets whose ancestry cannot be proven.

For any mutation, provider-visible names are insufficient. Stable Drive IDs and parent ancestry must be used.

Automatic delete is limited to GSA-created ephemeral items from the same Run. Pre-existing user items require explicit Human Gate confirmation by exact Drive item ID.

## 6. Stable per-user record

Initial logical record:

```text
user_id
email
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

## 7. Folder identity

Use Google Drive folder ID as the canonical locator.

Do not use a human-readable Drive path as durable identity because folders may be renamed or moved.

A display path/name may be shown to the user but is not authoritative.

## 8. Runtime resolution

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

## 9. Settings UX

The fake CLI root includes:

```text
PROJECT
DIRECT AGENT
SETTING
HELP / INSTRUCTION
```

`SETTING` exposes at least:

```text
GSA Account
  [Sign in with Google]
  verified email

Project Drive
  current folder
  [Paste folder URL]
  [Change folder URL]
```

Google Drive connection status is not a GSA account setting. Google Drive remains a separate ChatGPT plugin/connector managed outside this app.

The user chooses or changes the root.

GPT may explain the requirement but must not silently choose or change the user's Drive root.

The settings surface writes the selected folder ID into the stable per-user configuration record.

## 10. Supabase security baseline

Initial Supabase implementation:
- table such as `user_drive_config`;
- Row Level Security enabled;
- authenticated user may read/insert/update only the row whose `user_id = auth.uid()`;
- service credentials/secrets are never committed to GitHub;
- only publishable/client-safe configuration may exist in client code where applicable.

Exact table/column naming is implementation detail as long as these semantics are preserved.

## 11. Bootstrap

If no user configuration exists:

```text
first use
→ SETTING
→ Sign in with Google through Supabase Auth
→ Supabase resolves stable auth.users.id + verified email
→ user pastes the Google Drive folder URL
→ ChatGPT automatically routes that URL to the already-connected Google Drive app
→ resolve the actual connected Drive account with Drive profile
→ inspect target-folder permission metadata
→ if current Drive account has write-capable role, authority PASS
→ otherwise, only if metadata is insufficient, use create/delete probe fallback
→ on PASS create/update the stable per-user config record
→ Project Drive = READY
```

No default physical folder belonging to the repository owner is assumed for other users.

## 12. Fallback design

Primary design remains Supabase-backed per-user configuration.

If the Supabase/Auth identity chain proves impractical in the Phase-2 spike, the permitted fallback is discovery of one fixed marker folder under the connected user's My Drive root.

```text
My Drive root
→ fixed marker folder
→ Project root
```

This fallback is not implemented in parallel with the primary path. It exists only as a bounded recovery option because root listing is already OBSERVED.

Reasons it is not primary:
- weaker multi-user/account configuration semantics;
- depends on a reserved Drive folder name;
- less explicit settings/account UX;
- harder to support future non-Drive per-user settings.

## 13. Invariants

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
11. Supabase Google OAuth, not typed Gmail, establishes application-user identity.
12. Google Drive authentication/connection is external to GSA and remains owned by ChatGPT's Google Drive plugin.
13. GSA stores no Google Drive credential or OAuth scope.
14. Project Drive becomes READY only after an observed write/delete probe succeeds in the selected folder.
15. Supabase identity and Drive resource authority are separate proofs; cross-connector account equality is not required.
16. A recognized connected-app URL is sufficient routing context; GSA must not require the user to type `@Google Drive` or `@GitHub` when the target URL already identifies the provider.
