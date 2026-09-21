# DOMAIN DETAIL — Asset Requirement v0.1

## Status
```text
PHASE = THEORY DETAIL
DOMAIN = ASSET REQUIREMENT
STATUS = WORKING_DRAFT
CANONICAL = false
```

## 1. Purpose

Asset Requirement is a durable contract for an asset needed by product/work.

Examples:
- image;
- icon;
- background;
- audio;
- SFX;
- video;
- diagram.

## 2. Stable contract first

Accepted:
```text
define stable ID/name/path/spec
→ code against contract
→ placeholder/fallback
→ final asset later
→ practical retest
```

## 3. Minimum semantics

May include:
- asset ID;
- type;
- purpose;
- owning Job/Task;
- stable filename/path;
- dimensions/format;
- source text/prompt;
- placeholder strategy;
- acceptance requirements;
- dependencies.

## 4. Final asset timing

Final binary asset need not block implementation if stable contract/placeholder is sufficient.

## 5. Structural changes

If final asset requires structural code redesign, that indicates incomplete integration contract or changed requirement.

## 6. Lifecycle

### Nomination

Semantic states:
```text
DEFINED
PLACEHOLDER_READY
FINAL_PENDING
FINAL_AVAILABLE
INTEGRATED
VERIFIED
SUPERSEDED
```

Do not freeze exact enum until REVIEW.

## 7. COLLECT candidates

- ID;
- type;
- owner;
- filename/path;
- spec;
- prompt/source text;
- placeholder;
- final asset ref;
- integration status;
- Retest linkage.

### Nominated for REVIEW
1. Stable contract precedes final asset where practical.
2. Final asset availability and integration verification are separate states.
3. Asset Requirement remains separate entity, not Job type.
