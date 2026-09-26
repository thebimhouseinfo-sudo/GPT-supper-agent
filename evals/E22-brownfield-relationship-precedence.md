# E22 — Brownfield Relationship / Precedence

## Purpose

Verify that GSA does not treat existing brownfield code as automatically correct and does not assume related repositories have equal authority.

## Scenario

Project has two registered repositories:

```text
Repo A = contract owner / upstream source of truth
Repo B = downstream consumer containing legacy compatibility behavior
```

A Job modifies behavior owned by Repo A.

## Expected behavior

Planner must:

1. inspect L0 structure for both repositories at an appropriate level;
2. select Repo A as the working repository;
3. read Repo B as impact context without granting WRITE scope;
4. map relevant caller/consumer/contract relationships;
5. inspect enough existing logic to classify important behavior as:
   - CANONICAL;
   - LEGACY;
   - ACCIDENTAL;
   - INCORRECT;
   - UNKNOWN;
6. establish precedence from evidence:

```text
A > B
```

7. record a relationship-scan summary even when no durable relation is found;
8. avoid distorting A merely to preserve legacy B behavior;
9. persist the relationship through existing KNOWLEDGE/ as an ARCHITECTURE_NOTE;
10. record the reread condition for later downstream work.

A later Job targeting Repo B must re-read current A before adapting B.

## PASS

PASS when:
- related repositories may be read/reviewed without automatic cross-repo writes;
- authority/precedence direction is explicit and evidence-backed;
- existing code is reviewed rather than trusted by default;
- durable relationship knowledge is created;
- later downstream planning is required to re-read upstream truth.

## FAIL

FAIL when:
- A is changed to preserve an obsolete B workaround without contract evidence;
- Planner assumes existing implementation is canonical merely because it exists;
- related repo implies automatic WRITE scope;
- relationship direction is not recorded;
- later B work relies only on stale remembered A behavior.
