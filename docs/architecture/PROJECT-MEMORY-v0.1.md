# Project Memory & Knowledge Model v0.1

## 1. Project Memory purpose

Google Drive is the durable memory store. One Super Agent root folder is configured once; each Job receives an automatically created subfolder beneath that root.

It does NOT contain source code.

Typical content is Markdown and JSON representing:

- project architecture
- decisions
- contracts
- repo relationships
- plans
- task state
- review findings
- cross-repo impact
- lessons
- capability and platform profiles

Raw chat transcripts, temporary reasoning, tool chatter, and intermediate guesses MUST NOT be persisted as project memory.

## 2. Suggested Job layout

```text
<configured Super Agent Drive root>/
  <job-id>/
    JOB.json
    PROJECT.md
    PROJECT-PROFILE.json
    ARCHITECTURE.md
    STATE.json
    REPO-GRAPH.json
    KNOWLEDGE-PROFILE.json
    CAPABILITY-MATRIX.json

    decisions/
      ADR-0001.md
      ADR-0002.md

    contracts/
      <contract>.json

    plans/
      MASTER-0001.md
      MASTER-0001.json

    tasks/
      TASK-0001.json

    reviews/
      REVIEW-0001.md

    approvals/
      APPROVAL-0001.json

    design/
      brief/
      concepts/
        selected/
      asset-sheet/
        ASSET-SHEET.png
        ASSET-SPECS.json
        PROMPTS.md
        ASSET-SHEET.md
      reviews/

    lessons/
      LESSONS.md

    repos/
      <repo>.json
```

Markdown is primarily human/agent-readable. JSON is primarily orchestrator-readable.

Durable artifacts should carry id/version/status/input references so downstream artifacts can be invalidated or revalidated when upstream decisions change.

The `design/` workspace may contain concept images and one crop-ready `ASSET-SHEET.png`. The Asset Sheet is a single image canvas containing concept-derived visual assets already separated from one another, numbered, and padded for manual cropping. It is intentionally not a complete directory of individually generated production assets. `ASSET-SPECS.json` and `PROMPTS.md` are sidecars that explain each numbered region and support later high-quality regeneration of individual assets.

## 3. Configured Drive root

Super Agent stores one stable root folder reference in its configuration. Job commands operate relative to that root.

The user is not asked for a Drive folder link during normal `job create`.

Required root children are created/validated automatically:

```text
registry.json
knowledge/
jobs/
```

## 4. Global registry

`registry.json` indexes Jobs without duplicating their durable Job state.

A Job entry may also summarize its attached GitHub code environment, but the Job itself remains the Drive-persisted work entity.

Example:

```json
{
  "jobs": [
    {
    "id": "kid-eschool",
    "name": "Kid eSchool",
    "status": "active",
    "memory_root": "jobs/kid-eschool",
    "code_environment": {
      "type": "github",
      "repositories": [
        "thebimhouseinfo-sudo/Kideschool",
        "thebimhouseinfo-sudo/KE-Math-Grade1"
      ]
    }
    }
  ]
}
```

## 5. Job, Project, and repo knowledge

These concepts are distinct:

```text
Job
= durable work state stored in Drive

Project
= logical system/product context for planning

Repo
= one GitHub source repository inside the Job's code environment
```

Project-level artifacts contain shared truth across the repos relevant to the Job.

Example:

```text
ARCHITECTURE.md
REPO-GRAPH.json
contracts/*
decisions/*
```

Repo metadata points to shared project artifacts.

Example:

```json
{
  "repo": "thebimhouseinfo-sudo/KE-Math-Grade1",
  "project": "kid-eschool",
  "role": "subject-app",
  "consumes": [
    "authentication",
    "child-profile",
    "navigation"
  ],
  "provides": [
    "math-learning"
  ]
}
```

## 6. Repo graph

`REPO-GRAPH.json` models providers, consumers, roles, and shared contracts.

Its purpose is causal impact analysis, not merely documentation.

If a shared provider or contract changes, the graph identifies all consumers that must be considered.

## 7. Contracts

Shared interfaces across repositories are first-class Project Memory.

A contract should identify at least:

- contract id and version
- provider repo
- consumer repos
- schema or behavior
- compatibility rules
- migration constraints

A contract change can invalidate a single-repo implementation plan.

## 8. Decisions

Decision logs capture durable project decisions and their scope.

Decision scope may be:

- global
- project
- repo
- contract
- subsystem

Agents load only relevant decisions into working context.

## 9. Knowledge Base

Project Memory answers:

> What has this project decided and what state is it in?

Knowledge Base answers:

> What must the agent know to reason correctly?

Suggested hierarchy:

```text
knowledge/
  engineering/
    testing/
    debugging/
    multi-repo/

  platforms/
    chatgpt/
    github/
    google-drive/
    vercel/

  domains/
    revit/
    autocad/
    web/
    education/

  lessons/
```

## 10. Knowledge profiles

Each Job declares required knowledge profiles.

Example:

```json
{
  "job": "revit-mep-plugin",
  "knowledge_profiles": [
    "dotnet",
    "revit",
    "revit-mep"
  ]
}
```

Planner determines these profiles from actual project evidence and user intent.

## 11. Knowledge metadata

Knowledge items should carry provenance and freshness information where relevant.

Example:

```json
{
  "topic": "revit-connectors",
  "product": "Autodesk Revit",
  "version": "2026",
  "source_type": "official-docs",
  "verified_at": "2026-09-21",
  "confidence": "high"
}
```

Platform knowledge may become stale and must be refreshed contextually.

## 12. Capability knowledge

The system must distinguish:

- documented capability
- observed capability
- unknown capability
- known-unavailable capability

Unknown is treated as unavailable until verified.

Negative knowledge is valuable and should be retained when durable, e.g.:

- GitHub repository write does not imply shell execution.
- A cloud repo connector does not imply localhost access.
- Super Agent does not assume ownership of local/offline execution.
- A tool cannot claim runtime verification it cannot physically perform.

## 13. Drive-first Context Builder

Context construction always starts from the active Job's Drive memory.

```text
Job selected
→ Drive Job Memory
→ current state / plans / decisions / repo graph
→ current user request
→ repo/path relevance resolution
→ selective GitHub read
→ role-specific context packet
```

The attached GitHub repositories are code environments, not the first context source.

Super Agent should avoid broad repo scans when Drive already narrows the relevant repository/subsystem.

For status/planning/history questions, Drive may be sufficient and GitHub reading may be unnecessary.

## 14. Context packet composition

Agents MUST NOT receive the entire project memory, entire GitHub codebase, or chat history by default.

A context packet should be assembled from:

```text
current task
+ relevant project invariants
+ relevant decisions
+ relevant contracts
+ relevant architecture
+ relevant domain/platform knowledge
+ relevant live repo evidence
+ relevant previous review findings
```

Planner, Designer, Coder, and Reviewer receive different context packets according to role.

Designer context additionally includes the approved Design Brief, use cases, target audience, UI Tree, node requirements, Design Foundation constraints, Device Matrix, existing visual references, and relevant design skills. The asset inventory is derived after concept creation rather than treated as a fixed upstream input.
