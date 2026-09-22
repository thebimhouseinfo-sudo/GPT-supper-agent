# UI Specification / Design Coverage Model v1.2

## 1. Purpose

Defines design coverage/readiness obligations, not a mandatory file package.

## 2. Design Coverage

```text
requirements + content + flows + features
→ Design Coverage
→ detailed design
→ DESIGN_READY
```

Cover known surfaces, flows, shared shell, meaningful states, responsive variants and media-heavy cases.

## 3. UI tree

Useful technique, not mandatory storage.

## 4. Surface obligations

Define applicable purpose/content/hierarchy/interaction/states/responsive behavior/accessibility/assets/acceptance.

## 5. Ownership

Planner owns functional intent.

Designer owns visual interpretation/system.

Coder owns exact implementation HOW.

## 6. Responsive coverage

Specify semantic behavior before implementation breakpoint numbers.

## 7. Representative variation

Cover materially different real cases, not only happy path.

## 8. DESIGN_READY

Known required design space is covered enough that implementation should not routinely redesign it.

Does not require every final production asset.

## 9. SHELL_READY

```text
DESIGN_READY
→ shell implementation
→ representative pilot
→ practical verification
→ SHELL_READY
→ scale-out
```

Practical verification:
- Tester only when runtime/product capability is `OBSERVED`;
- otherwise human Retest/evidence.

## 10. Reopen design

Legitimate new constraint/capability/accessibility/usability/device findings use Causal Change Review.

## 11. Traceability

```text
requirement
→ design coverage
→ design artifact
→ implementation Task
→ verification record
```

## 12. Assets

Stable Asset Requirement contracts may precede final binary.

## 13. Specialist delegation

Detailed design methodology belongs to specialist skills.

## 14. Core principle

> Cover the known product space before coding without inventing unavailable practical verification.
