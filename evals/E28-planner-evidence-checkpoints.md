# E28 — Planner EvidenceNeed + checkpoint planning model

Status: CP4 eval contract

## Purpose

Prove that NEXT planning can represent empirical dependencies as first-class structures while V2_STABLE remains unchanged and CP5 runtime execution is not activated.

## E28-01 valid multi-prerequisite PROBE

Given NEXT Tasks T2, T3, T4 and downstream T5:
- EvidenceNeed EN1 describes one unknown runtime fact, owned by T2 and required by T5.
- TestCheckpointSpec CP1 uses mode PROBE, boundary AFTER_NODE_SET, prerequisites [T2,T3,T4], evidence_need_ids [EN1].
- EvidenceRequirement ER1 binds T5 to EN1/CP1.
- planning_topology contains T2,T3,T4,CP1,T5 with CP1 depending on T2/T3/T4 and T5 depending on CP1.

Expected: plan validation succeeds and every CP4 structure is stamped with the current planning_revision.

## E28-02 orphan reference rejection

Use an EvidenceRequirement whose evidence_need_id or checkpoint_id does not exist.

Expected: NEXT_PLANNING_INVALID; planning review cannot PASS.

## E28-03 boundary validation

- BEFORE_NODE without a valid boundary_node_id => reject.
- AFTER_NODE_SET with an empty prerequisite set => reject.
- MILESTONE_GATE without a valid milestone_id => reject.

## E28-04 typed topology completeness

Omit one Task or one TestCheckpointSpec from planning_topology.

Expected: reject; every Task and checkpoint must have a typed planning node.

## E28-05 planning revision rebind

Start from a NEXT plan with non-empty CP4 collections. Revise Tasks/topology without resupplying all CP4 collections.

Expected: NEXT_PLANNING_REBIND_REQUIRED.

Resupply all CP4 collections for the new revision.

Expected: accepted and every CP4 record is rebound to the new planning_revision.

## E28-06 V2_STABLE compatibility

A V2_STABLE Job with all CP4 collections omitted/empty remains valid and follows the existing Job/topology path.

A V2_STABLE Job that attempts non-empty CP4 collections is rejected with NEXT_PLANNING_FIELDS_REQUIRE_NEXT.

## E28-07 CP5 non-activation

Inspect the CP4 diff.

Expected:
- no checkpoint attempt record;
- no claim/lease/CAS;
- no replay/crash recovery;
- no Tester dispatch based on test_checkpoints;
- no EvidenceRequirement runtime blocking.

CP4 is planning-only.
