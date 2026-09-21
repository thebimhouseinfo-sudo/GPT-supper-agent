# Project Memory Model v1.1

## 1. Purpose

Google Drive Project Memory is the durable Project control plane.

It stores enough durable state to reopen work without chat history while avoiding database-style over-normalization.

GitHub remains source-code truth.

## 2. Minimal logical layout

Physical folders may be implemented lazily, but the logical model is:

```text
<Project>/
├── PROJECT.md
├── CONTROL.json              # optional/rebuildable current-state cache
├── WORK/
│   ├── jobs/
│   └── runs/
├── KNOWLEDGE/
└── VERIFICATION/
```

Asset requirements, approvals and releases may live as compact records under the most relevant semantic area rather than requiring one folder family each.

## 3. PROJECT.md

PROJECT.md is:
- Project marker;
- stable human-readable identity entry point;
- high-level lifecycle/repository summary.

Structured ownership/identity fields must not exist only as prose.

## 4. Repository claims

Each OWNED repo has a structured claim containing at least:
- Project ID;
- repository stable identifier/full name;
- relation = OWNED;
- claim timestamp/reference;
- provenance.

REFERENCED relationships are also structured.

Duplicate OWNED claims:
```text
detected
→ block write routing
→ show conflicting Projects
→ human resolves ownership
```

No "earliest claim automatically wins" authority rule.

## 5. Job records

Job records are the primary finite-work container.

By default Job record embeds:
- Job identity/type/objective;
- scope;
- Tasks;
- milestone/stage topology;
- dependencies;
- completion/evidence requirements;
- linked Retests/assets/verification refs;
- current durable causes for waiting/blocking.

Task becomes a separate file only if real volume/query/concurrency later proves a need.

## 6. Run records

Runs are separate unique append-preserving records.

A Run record includes:
- Run ID/short handle;
- Job;
- primary Task or Job-level scope;
- affected Task refs;
- role;
- parent_run_id if any;
- exact target/revision;
- scope claim;
- inputs;
- result;
- output/evidence/handoff refs;
- timestamps where available.

Executed Run records are not normally overwritten/deleted.

## 7. Handoff representation

Handoff is a semantic transition contract.

Storage should remain compact:
- either a small unique handoff record;
- or a pending transition object associated with source Run/Job.

It must still preserve:
- source Run;
- target role;
- target/revision;
- completed/remaining work;
- gate/blocker;
- successor Run when consumed.

Consumed handoff history remains traceable.

## 8. Verification storage

Review, Evidence and Retest remain distinct semantic concepts but may share one physical verification record family:

```text
verification kind =
  REVIEW
  EVIDENCE
  RETEST
  TEST
  GOAL_RECHECK
```

Findings remain embedded in Review records by default.

Each record keeps its kind-specific fields and globally unique identity.

## 9. Knowledge

KNOWLEDGE stores durable semantic truth:
- architecture;
- decisions;
- contracts;
- plans;
- design intent;
- other Project knowledge.

Organize by meaning, not authoring role.

## 10. CONTROL.json

CONTROL.json is optional/rebuildable materialized current-state view.

It may cache:
- Project lifecycle;
- active Job handles;
- pending handoffs;
- pending Human Gates;
- pending Retests;
- release refs.

Rules:
- no unique durable fact may exist only in CONTROL;
- correctness must not depend on atomic conditional update;
- stale/lost CONTROL is rebuilt from durable records.

## 11. Concurrency model

Default is append-first + recheck-before-consequential-action.

```text
unique Run/verification records
→ append-preserving history
→ minimal shared mutable state
```

If the Drive connector later proves revision-aware conditional writes, they may strengthen mutable record safety but are not foundational correctness requirements.

## 12. Cross-chat consistency

Consistency is eventual.

Before source write, handoff consumption, destructive action, merge/deploy or material control-plane mutation:
- re-read Project lifecycle;
- re-read relevant scope claim/current target;
- detect obvious conflict;
- block/reconcile if conflict exists.

## 13. Retest

Retest history is append-preserving.

Pending Retests must remain visible even if originating Job is COMPLETED.

Retest FAIL after completion creates a linked remediation Job.

## 14. Assets

Asset Requirement contract may be embedded/recorded with the owning Job/knowledge artifact while retaining unique ID.

Final production binary assets normally live in Project-owned source at stable target paths.

## 15. Persistence exclusions

Do not persist by default:
- raw chat transcripts;
- hidden reasoning;
- transient tool chatter;
- runtime confirmations;
- redundant source copies;
- ephemeral Direct Agent work before promotion.

## 16. No global registry

Configured Drive root + Project folders remain Project discovery source.

No mandatory global registry is added.

Global IDs and structured repo claims allow cross-Project conflict discovery when needed.

## 17. Job deletion

Initial model removes tombstone machinery.

Before hard delete:
- identify durable references;
- warn user;
- user chooses cancel/delete/cascade according to available scope.

Do not silently leave broken references.

More elaborate tombstones may be added only after demonstrated need.

## 18. Cross-Project references

Do not attempt database-like strong cross-Project integrity initially.

Cross-Project references are provenance references and should carry enough human-readable/source context to remain understandable if target memory later disappears.

## 19. Promotion from Direct Agent

Direct Agent has no durable lifecycle.

Promotion creates new Project/Job state from a compact promotion packet:
- objective;
- produced result/artifact;
- assumptions/decisions;
- repo target if relevant;
- remaining work;
- source references.
