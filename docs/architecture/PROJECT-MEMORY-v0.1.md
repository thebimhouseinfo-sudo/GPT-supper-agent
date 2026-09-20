# Project Memory & Knowledge Model v0.1

## 1. Project Memory purpose

Google Drive is the durable memory store owned logically by the plugin for each Job.

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
CodeAgent/
  registry.json

  jobs/
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

      design/
        brief/
        concepts/
        screens/
        system/
        assets/
          ASSET-MANIFEST.json
          ASSET-SHEET.md
          source/
          approved/
        reviews/

      lessons/
        LESSONS.md

      repos/
        <repo>.json
```

Markdown is primarily human/agent-readable. JSON is primarily orchestrator-readable.

The `design/` workspace may also contain binary visual artifacts such as concept images, contact sheets, and approved production asset candidates. These are design artifacts, not source code. Approved assets enter a source repository only when Coder integrates them at manifest-defined target paths.

## 3. Global registry

`registry.json` indexes Jobs without duplicating their project state.

Example:

```json
{
  "jobs": [
    {
      "id": "kid-eschool",
      "name": "Kid eSchool",
      "status": "active",
      "memory_root": "jobs/kid-eschool"
    }
  ]
}
```

## 4. Project vs repo knowledge

Project-level artifacts contain shared truth.

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

## 5. Repo graph

`REPO-GRAPH.json` models providers, consumers, roles, and shared contracts.

Its purpose is causal impact analysis, not merely documentation.

If a shared provider or contract changes, the graph identifies all consumers that must be considered.

## 6. Contracts

Shared interfaces across repositories are first-class Project Memory.

A contract should identify at least:

- contract id and version
- provider repo
- consumer repos
- schema or behavior
- compatibility rules
- migration constraints

A contract change can invalidate a single-repo implementation plan.

## 7. Decisions

Decision logs capture durable project decisions and their scope.

Decision scope may be:

- global
- project
- repo
- contract
- subsystem

Agents load only relevant decisions into working context.

## 8. Knowledge Base

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
    gptworker/

  domains/
    revit/
    autocad/
    web/
    education/

  lessons/
```

## 9. Knowledge profiles

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

## 10. Knowledge metadata

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

## 11. Capability knowledge

The system must distinguish:

- documented capability
- observed capability
- unknown capability
- known-unavailable capability

Unknown is treated as unavailable until verified.

Negative knowledge is valuable and should be retained when durable, e.g.:

- GitHub repository write does not imply shell execution.
- A cloud repo connector does not imply localhost access.
- A tool cannot claim runtime verification it cannot physically perform.

## 12. Context Builder

Agents MUST NOT receive the entire project memory or chat history by default.

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

Designer context additionally includes the approved Design Brief, UI Tree, node requirements, Design Foundation constraints, Device Matrix, existing visual references, and required asset inventory.
