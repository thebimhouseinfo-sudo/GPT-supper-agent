# Project Memory Model v1

## 1. Purpose

Google Drive Project Memory is the durable Project state/control plane.

It stores:
- Project identity/lifecycle;
- work state;
- decisions;
- architecture/contracts/plans;
- reviews/evidence;
- Retests;
- Asset Requirements;
- approvals;
- release records.

It does not store GitHub source as canonical code truth.

---

## 2. Root layout

```text
<Project>/
├── PROJECT.md
├── CONTROL.json
├── WORK/
│   ├── jobs/
│   ├── tasks/
│   ├── runs/
│   └── handoffs/
├── KNOWLEDGE/
│   ├── architecture/
│   ├── decisions/
│   ├── contracts/
│   ├── plans/
│   └── design/
└── ARTIFACTS/
    ├── reviews/
    ├── evidence/
    ├── retests/
    ├── assets/
    ├── approvals/
    └── releases/
```

This structure is derived from collected domain persistence/query requirements.

---

## 3. PROJECT.md

PROJECT.md is:
- Project marker;
- stable identity entry point;
- human-readable overview;
- high-level lifecycle/repository summary.

It is not the full state/history store.

---

## 4. CONTROL.json

CONTROL.json is the compact current-state index/cache.

It may contain:
- Project lifecycle;
- active/waiting/blocked Jobs;
- pending Handoffs;
- pending Human Gates;
- pending Retests;
- current release refs;
- revision token.

Historical entity files remain authoritative for history.

CONTROL.json is a rebuildable materialized view/index. If it conflicts with durable entity history, rebuild/reconcile CONTROL from the durable records rather than treating the stale snapshot as authority.

---

## 5. WORK

WORK stores durable operational entities:

- Job;
- Task;
- Run;
- Handoff.

No per-role folder is required.

---

## 6. KNOWLEDGE

KNOWLEDGE stores durable semantic truth:

- architecture;
- decisions;
- contracts;
- plans;
- approved design intent/artifacts.

Artifacts are organized by meaning, not by which role authored them.

---

## 7. ARTIFACTS

ARTIFACTS stores durable supporting records with distinct lifecycle/query needs:

- reviews;
- evidence;
- Retests;
- Asset Requirements;
- materially consequential approvals;
- release/milestone records.

---

## 8. Repository relationships

Project stores explicit relationships:

```text
OWNED
REFERENCED
```

Owned repos may be written within approved scope.

Referenced repos are read-only.

Repository relationship changes that matter to governance should preserve provenance/history. Ownership transfer is a human-governed event rather than a silent metadata edit.

---

## 9. Context Builder

Opening/resuming work uses:

```text
Project Memory
→ current work
→ relevant decisions/contracts/plans
→ current request
→ relevant repo/path
→ selective live evidence
```

Do not load the whole Project or whole repo by default.

---

## 10. Concurrency

Mutable durable records must support optimistic concurrency/revision checking.

Avoid last-write-wins for concurrent chats.

---

## 11. Evidence

Prefer durable references/metadata over duplicating external raw data.

Examples:
- CI run reference;
- PR/revision;
- screenshot reference;
- user Retest result;
- deployment evidence.

---

## 12. Retests

Retest records are durable and append-preserve attempt history.

Old FAIL is not erased by later PASS.

---

## 13. Assets

Asset Requirement contracts live in Project Memory.

Final production binary assets normally live in owned source repositories at stable target paths.

---

## 14. Persistence exclusions

Do not persist by default:
- raw chat transcripts;
- hidden reasoning;
- transient tool chatter;
- speculative guesses;
- runtime confirmations;
- ephemeral Direct Agent work unless promoted;
- redundant copies of GitHub source.

---

## 15. Lazy creation

PROJECT.md and CONTROL.json are bootstrap artifacts.

Subcollections may be created lazily as work requires them.

---

## 16. Global registry

No global Project registry is required initially.

The configured Drive root + Project folders are the discovery source.

Cross-Project global-ID lookup may be slower but remains unambiguous due to globally unique durable IDs.


---

## 17. Findings

Review findings remain embedded in their owning Review record by default.

Each Finding still has a globally unique ID so Tasks, Runs, waivers, Retests, and re-reviews can reference it directly.

A separate `findings/` collection is not required initially.

---

## 18. Job deletion / tombstones

Job hard-delete remains allowed.

```text
no surviving durable external references
→ full Job deletion allowed

surviving durable external references
→ delete detailed Job-owned records
→ preserve minimal tombstone identity needed to keep references interpretable
```

A tombstone is not archive and does not preserve the full Job history.

---

## 19. Milestone / Stage persistence

Milestones and stages remain structured topology inside Job records.

They are not promoted into a new ownership hierarchy or separate WORK collections unless real use later proves an independent lifecycle need.
