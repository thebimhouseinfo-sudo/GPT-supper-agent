'use strict'
// SOURCE-CONTRACT test only: does not simulate real Advisor delivery or Criteria write.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const code = fs.readFileSync(path.join(__dirname, '../supabase/functions/gsa-mcp/index.ts'), 'utf8')
const source = ts.createSourceFile('index.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

test('Advisor continuation preserves valid TypeScript and declared MCP response schema', () => {
  assert.equal(source.parseDiagnostics.length, 0)
  const tool = code.slice(code.indexOf("'project_criteria_advice_check'"), code.indexOf("'project_role_addins_resolve'"))
  assert.match(tool, /next_action:\s*z\.enum\(\['INVOKE_TECHNICAL_ADVISOR'/)
  assert.match(tool, /'ADVISOR_SCOPE_MISMATCH'/)
  assert.match(tool, /'ADVISOR_RECEIPT_MISSING_STALE_OR_OUT_OF_SCOPE'/)
  assert.match(tool, /next_action:\s*dispatchAdvisor\s*\?\s*'INVOKE_TECHNICAL_ADVISOR'/)
  assert.match(tool, /Advisor admission alone is not completed advice/)
  assert.match(tool, /without requesting a second approval/i)
})

test('Advisor consultation cannot masquerade as Criteria write authorization', () => {
  const decision = code.slice(code.indexOf('function projectCriteriaAdvisoryDecision'), code.indexOf('// M5: reuse M3 Bootstrap'))
  assert.match(decision, /criteria_write_prepared:\s*false/)
  assert.match(decision, /input\?\.human_decision !== 'APPROVE'/)
  assert.match(decision, /'SCOPED_ADVICE_REQUIRES_INDEPENDENT_READBACK'/)
})

test('Planner role explicitly dispatches advisor and resumes previously settled decision', () => {
  assert.match(code, /Planner must start_direct_agent\(role=advisor\)/)
  assert.match(code, /Advisor admission alone is not delivered advice/)
  assert.match(code, /never stop at a receipt error or ask for the same approval twice/)
})

test('new advice can be submitted before its receipt exists in old Criteria', () => {
  const decision = code.slice(code.indexOf('function projectCriteriaAdvisoryDecision'), code.indexOf('// M5: reuse M3 Bootstrap'))
  assert.match(decision, /input\?\.delivered_advice/)
  assert.match(decision, /proposed\?\.delivered_to_human !== true/)
  assert.match(decision, /baseline !== input\.criteria_current_sha/)
  assert.match(decision, /scope !== input\.delta_scope/)
  assert.match(decision, /receipt_format: 'PROPOSED_CANONICAL'/)
  assert.match(decision, /criteria_write_prepared: false/)
})

test('Advisor evidence remains externally verifiable, not standalone write permission', () => {
  const tool = code.slice(code.indexOf("'project_criteria_advice_check'"), code.indexOf("'project_role_addins_resolve'"))
  assert.match(tool, /delivered_advice: z\.object/)
  assert.match(tool, /this is only a claim pending independent readback/)
  assert.match(tool, /'ADVISOR_DELIVERY_EVIDENCE_INVALID'/)
})

test('Direct Advisor admission explicitly exposes executable harness but never claims consultation ran', () => {
  const section = code.slice(code.indexOf("'start_direct_agent'"), code.indexOf("'get_instruction'"))
  assert.match(section, /execution_state: z\.literal\('ADMITTED_NOT_EXECUTED'\)/)
  assert.match(section, /advisor_harness: role === 'advisor' \? renderHarness\('advisor'\) : null/)
  assert.match(section, /RUN_ADVISOR_CONSULTATION_IN_HOST_AND_DELIVER_ADVICE_TO_HUMAN/)
  assert.doesNotMatch(section, /execution_state: 'ADVICE_DELIVERED'/)
})
