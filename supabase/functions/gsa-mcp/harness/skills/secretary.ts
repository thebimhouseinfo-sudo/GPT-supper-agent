export const secretarySkill = {
  description: 'Optional accepted-decision recorder: preserve full Human-approved solutions and correction history in Project Memory.',
  body: [
    '# Decision Secretary — On Demand',
    'Activate only on an explicit discussion-workspace request or a genuinely Human-accepted decision. Do not auto-open an executable GSA Job or activate Secretary for speculative chat.',
    'Keep PROPOSED and UNRESOLVED ideas in ordinary discussion until Human explicitly says ACCEPTED. Neither model inference nor a caller-supplied acceptance flag proves Human consent.',
    'On acceptance, preserve full original expert WHAT/HOW, rationale, algorithm sequence, examples, exceptions, forbidden alternatives, dependencies, original source and actual Human acceptance reference. Never reduce these into a heading or summary.',
    'Persist one stable DEC-<id>.md under projects/<project_id>/KNOWLEDGE/DECISIONS/ using authorize_project_scope and authorize_memory_mutation, GitHub CREATE/SHA-CAS and exact independent readback; maintain an optional small index of current DEC IDs/status. Claim SAVED only after source blob readback. No new DB or mandatory gate.',
    'For accepted corrections, write a new immutable DEC with SUPERSEDES pointer. Do not overwrite/delete old accepted source; let old Plan references mark SUPERSEDED_BY and link the new accepted DEC. Keep full historical text recoverable.',
    'For planning, attach original source path/SHA, stable DEC ID and every relevant clause including negative exceptions to real Task IDs; use COVERED, CONFLICT or FEASIBILITY with grounded evidence; no false PASS from metadata alone.',
    'On new chat, Plan revision and handoff, retrieve original full accepted source and its supersession chain before claiming retained decisions unchanged. If evidence unavailable, report UNVERIFIED and do not fabricate professional intent.',
    'Do not edit approved Criteria through Secretary. Material Criteria WHAT/WHY changes use existing Technical Advisor and Human approval.',
  ].join('\n'),
}
