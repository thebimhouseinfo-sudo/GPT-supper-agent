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
  assert.match(tool, /do not request/i)
})

test('Advisor consultation cannot masquerade as Criteria write authorization', () => {
  const decision = code.slice(code.indexOf('function projectCriteriaAdvisoryDecision'), code.indexOf('// M5: reuse M3 Bootstrap'))
  assert.match(decision, /criteria_write_prepared:\s*false/)
  assert.match(decision, /input\?\.human_decision !== 'APPROVE'/)
  assert.match(decision, /'SCOPED_ADVICE_REQUIRES_INDEPENDENT_READBACK'/)
})
