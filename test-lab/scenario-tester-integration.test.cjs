'use strict'
// Host-installed scenario-tester is a hint, not the GSA runtime simulate body.
// Test source-verified U-E route against the current GSA4 physical modules.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadSourceModule } = require('./helpers/harness-ts-loader.cjs')
const catalog = loadSourceModule('harness-catalog.ts')
const tester = catalog.ROLE_HARNESSES.tester

test('separate GSA simulate on demand from host-managed scenario-tester', () => {
  assert.deepEqual(Array.from(catalog.ROLE_SKILLS.tester), ['testing-evidence','simulate'])
  assert.deepEqual(Array.from(catalog.ROLE_HOST_SKILLS.tester), ['scenario-tester'])
  assert.equal(catalog.RUNTIME_SKILLS['scenario-tester'], undefined)
  assert.ok(catalog.RUNTIME_SKILLS.simulate.body.includes('Designer'))
  assert.match(catalog.RUNTIME_SKILLS.simulate.body, /TRACER/)
  assert.match(tester.loop.join('\n'), /SCENARIO_SKILL_NOT_LOADED/)
  assert.match(tester.loop.join('\n'), /REAL_HOST_UNVERIFIED/)
})

test('Tester remains independent, source-read-only, and uses existing evidence routes', () => {
  assert.match(tester.authority.join(' '), /implementation is read-only/)
  assert.match(tester.loop.join('\n'), /checkpoint_claim_prepare/)
  assert.match(tester.loop.join('\n'), /checkpoint_verification_prepare/)
  assert.match(tester.loop.join('\n'), /run_verification_record/)
  assert.match(catalog.RUNTIME_SKILLS.simulate.body, /no Simulation Agent\/Job\/Role\/state/)
  assert.match(catalog.RUNTIME_SKILLS.simulate.body, /existing EvidenceRequirement/)
})

test('scenario skill metadata does not assert host installed or native PASS', () => {
  assert.match(catalog.RUNTIME_SKILLS.simulate.body, /not an assertion/)
  assert.match(catalog.RUNTIME_SKILLS.simulate.body, /REAL_HOST_UNVERIFIED/)
  assert.match(catalog.RUNTIME_SKILLS['testing-evidence'].body, /REAL_HOST_UNVERIFIED/)
  assert.match(catalog.ROLE_HOST_SKILLS.tester[0], /^scenario-tester$/)
})
