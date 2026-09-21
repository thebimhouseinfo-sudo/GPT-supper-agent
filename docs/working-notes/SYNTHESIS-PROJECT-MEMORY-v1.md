# SYNTHESIS — Project Memory / Storage Model v1

## Status

```text
LOOP_STAGE = SYNTHESIZE
PASS = 01
DOMAIN = PROJECT MEMORY / STORAGE
STATUS = SYNTHESIZED_DRAFT
CANONICAL = false
```

This is the first physical storage synthesis after collecting all domain persistence/query requirements.

---

## 1. Design goals

Storage must support:

- Project discovery;
- cross-chat reopen;
- global ID resolution inside Project context;
- Job/Task/Run lineage;
- handoff;
- Human Gates;
- reviews/findings;
- evidence;
- Retest;
- Asset Requirements;
- release history;
- concurrency-safe updates;
- selective context loading.

Avoid:
- one file per trivial event when unnecessary;
- one giant file containing all Project history;
- duplicating GitHub source;
- persisting raw chats/tool chatter;
- premature specialist folder trees.

---

## 2. Project root

Synthesized canonical root:

```text
<Project>/
├── PROJECT.md
├── CONTROL.json
├── WORK/
├── KNOWLEDGE/
└── ARTIFACTS/
```

Rationale:

- `PROJECT.md` = identity/human entry point.
- `CONTROL.json` = compact machine-readable current control-plane snapshot.
- `WORK/` = Job/Task/Run operational history.
- `KNOWLEDGE/` = durable Project decisions/contracts/architecture/plans.
- `ARTIFACTS/` = evidence/reviews/assets/retests/releases and other durable supporting records.

This tree is intentionally shallow at root.

---

## 3. PROJECT.md

Purpose:

- Project marker;
- stable identity;
- name/purpose;
- lifecycle;
- high-level repo relationships summary;
- human-readable overview.

Do not turn PROJECT.md into full state/history store.

---

## 4. CONTROL.json

Purpose: fast current-state lookup.

Candidate content:

- Project ID;
- lifecycle;
- active Job IDs;
- waiting/blocking Job IDs;
- pending Human Gate IDs;
- pending Retest IDs;
- recent/current handoff refs;
- current release milestone refs;
- concurrency revision;
- timestamps where available.

`CONTROL.json` is a derived/current control snapshot, not the sole historical source.

---

## 5. WORK/

Synthesized:

```text
WORK/
├── jobs/
├── tasks/
├── runs/
└── handoffs/
```

Use one durable record per entity because:
- IDs are globally unique;
- direct lookup matters;
- history/lineage matters;
- entities can outlive one chat.

Suggested record format:
- Markdown + YAML when human narrative is useful;
- JSON when state is primarily structured.

Nomination for synthesis:

```text
Job
→ Markdown + YAML

Task
→ JSON or compact Markdown + YAML

Run
→ JSON

Handoff
→ JSON
```

Exact schema defined separately.

---

## 6. KNOWLEDGE/

Synthesized:

```text
KNOWLEDGE/
├── architecture/
├── decisions/
├── contracts/
└── plans/
```

Purpose:
durable semantic truth that informs work.

Do not create one folder per role.

Planner/Designer/Reviewer outputs are stored by artifact meaning, not by agent identity.

---

## 7. ARTIFACTS/

Synthesized:

```text
ARTIFACTS/
├── reviews/
├── evidence/
├── retests/
├── assets/
├── approvals/
└── releases/
```

These entities have distinct lifecycles/query patterns and justify separate collections.

This is now justified by collected requirements, unlike earlier premature folder nominations.

---

## 8. Reviews

One review record per review execution/target when durable.

It should reference:
- Reviewer Run;
- exact target/revision;
- findings;
- result;
- re-review lineage.

GitHub inline comments remain in GitHub; Project Memory stores the durable review summary/reference needed for cross-chat governance.

---

## 9. Evidence

Evidence store contains durable evidence references/metadata, not necessarily raw duplicated blobs.

Examples:
- CI run URL/id;
- screenshot file reference;
- user Retest report;
- deployment evidence;
- test result.

Prefer references over copying source/system data unnecessarily.

---

## 10. Retests

One durable record per Retest ID.

This validates a dedicated `ARTIFACTS/retests/` collection after collection/review.

Attempt history is append-preserving inside the Retest record or linked attempts.

---

## 11. Asset Requirements

`ARTIFACTS/assets/` stores Asset Requirement contracts and their lifecycle.

Final binary production assets normally live in owned repo source locations, not Drive Project Memory, unless they are design/reference artifacts rather than product source assets.

---

## 12. Approvals

Only materially consequential Planned Human Gates/waivers are persisted here.

Runtime Confirmations are not stored as approval records.

---

## 13. Releases

Release/milestone records preserve:
- milestone identity;
- scope;
- revision/tag/release;
- delivery facts;
- known limitations;
- pending Retests;
- human authorization where relevant.

---

## 14. Indexing strategy

### Nomination

Do not create a global registry file for all Projects.

Inside one Project, `CONTROL.json` acts as current-state index/cache.

Entity files remain source records.

Reason:
- fast open/status;
- no full recursive scan for normal resume;
- avoids one huge historical ledger.

Alternative:
derive everything by scanning entity folders every time.

Cost:
slower and connector-heavy.

---

## 15. Global ID lookup

Within an open Project:
- CONTROL and entity collections allow direct resolution.

Cross-Project global lookup may require enumerating Projects or a future optional cache, but no global registry is required initially.

Global uniqueness prevents ambiguity even when lookup is slower.

---

## 16. Lazy creation

Only create collections/files when needed except:
- PROJECT.md;
- CONTROL.json;
- root collection folders may be created lazily or at bootstrap.

### Nomination

Create root marker + CONTROL immediately; create subfolders lazily.

Reason:
avoid empty scaffolding.

---

## 17. Concurrency

Every mutable structured record should expose revision/version metadata sufficient for optimistic concurrency.

Typical pattern:

```text
read
→ capture revision
→ modify
→ compare/update
→ reconcile if stale
```

---

## 18. What is not persisted

Do not persist by default:
- full chat transcripts;
- hidden reasoning;
- transient tool chatter;
- temporary guesses;
- redundant GitHub source copies;
- every Runtime Confirmation;
- ephemeral Direct Agent work unless promoted.

---

## 19. Storage invariants

1. Project root is Drive.
2. PROJECT.md is identity marker.
3. CONTROL.json is current control snapshot, not full history.
4. Work entities have durable records.
5. Artifacts are grouped by semantic lifecycle, not role.
6. GitHub remains source-code truth.
7. Evidence is referenced rather than blindly duplicated.
8. Storage is lazily populated.
9. Optimistic concurrency is required.
10. Raw conversation is not durable memory.
