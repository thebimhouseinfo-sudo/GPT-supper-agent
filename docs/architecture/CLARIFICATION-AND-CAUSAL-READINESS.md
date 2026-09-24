# Clarification & Causal Readiness Protocol v1

## 1. Purpose

Runtime roles must not jump from materially ambiguous intent to consequential execution.

Shared order:

```text
known facts
→ missing information
→ causal impact
→ infer if safe
→ ask/escalate if material
→ proceed
```

---

## 2. Ask-or-infer rule

Ask only when:

```text
information is missing
AND materially decision-changing
AND not already available from current context / Project Memory / relevant evidence
AND safe inference would create meaningful risk
```

Do not re-ask known information.

---

## 3. Material unknowns

Material when different answers could change:
- product behavior;
- architecture;
- contract/API;
- repo/write scope;
- data/migration;
- user flow;
- design direction;
- device/accessibility requirements;
- security/privacy;
- acceptance;
- executor/capability needs.

Non-material implementation detail should usually be inferred from evidence.

---

## 4. Role behavior

Planner:
- resolves product/scope/architecture blockers before dependent planning.

Designer:
- resolves visual/design blockers before material design output.

Coder:
- resolves implementation ambiguity but escalates material scope/architecture/design changes.

Reviewer:
- requests missing evidence/criteria where required; does not invent acceptance rules.

Tester:
- may explore beyond known assumptions but must distinguish observation from binding requirement.

Orchestrator:
- routes unresolved material decisions to appropriate Human Gate/role.

---

## 5. Human decision boundary

```text
semantic / product / architecture decision
→ Human

mechanical detailing after semantics fixed
→ GPT
```

No role may silently cross this boundary.

---

## 6. Theory DETAIL exception

During theory construction, unresolved architecture questions follow the meta-rule:

```text
discover
→ nominate preferred option
→ record alternatives/trade-offs
→ defer to REVIEW
→ continue
```

This theory process must not be confused with runtime Project execution, where blocking product decisions may require immediate user input.

---

## 7. Strict clarification requests

If user explicitly asks for clarification-first behavior:
- surface material unknowns;
- explain why each matters;
- wait before consequential execution where required.

Do not turn harmless details into interrogation.

---

## 8. Fast/best-effort requests

Low-risk local detail may proceed with safe inference.

Fast execution does not permit guessing:
- architecture;
- shared contracts;
- security-sensitive behavior;
- destructive intent;
- repo ownership;
- material product behavior.

---

## 9. Causal trace

Useful external explanation format:

```text
requirement
→ constraint
→ design/architecture consequence
→ implementation obligation
→ acceptance evidence
```

Do not expose hidden chain-of-thought; provide concise inspectable rationale.

---

## 10. Readiness

Readiness is domain/topology-specific rather than one universal status list.

Examples:
- Job READY;
- DESIGN_READY;
- SHELL_READY;
- capability available;
- Human Gate resolved.

Canonical lifecycle/status semantics live in STATE-MACHINE.md and specialist domain definitions.

---

## 11. Core invariants

1. Do not ask what is already known.
2. Do not guess material product/architecture intent.
3. Infer safe low-impact detail when evidence supports it.
4. Explain why a blocking question matters.
5. Plan before consequential execution.
6. Record material assumptions when downstream work depends on them.
