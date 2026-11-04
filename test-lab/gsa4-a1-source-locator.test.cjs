'use strict'
// GSA4 A1 source routing: the index must address actual current A0 code.
// Metadata alone never authorizes Git writes, tool execution or policy omission.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const repoRoot = path.resolve(__dirname, '..')
const locator = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/architecture/GSA4-A1-SOURCE-LOCATOR.json'), 'utf8'))
const root = path.resolve(repoRoot, locator.source_root)
const pinnedNames = JSON.parse(fs.readFileSync(path.join(__dirname, 'gsa1-tool-name-inventory.json'), 'utf8')).names
const safeName = s => { assert.match(s, /^[A-Za-z][A-Za-z0-9_-]*$/); return s }

function sourceAt(relative) {
  assert.equal(typeof relative, 'string')
  assert.match(relative, /^[\w./-]+\.ts$/, 'TS source-relative path required')
  const full = path.resolve(root, relative)
  assert.ok(full.startsWith(root + path.sep), 'owner escapes GSA source: ' + relative)
  return fs.readFileSync(full, 'utf8')
}
function assertActualOwner(entry) {
  const content = sourceAt(entry.owner)
  const symbol = safeName(entry.name)
  assert.match(content, new RegExp("(?:server\\s*\\.\\s*registerTool|transitionTool)\\s*\\(\\s*['\"]" + symbol + "['\"]"),
    'tool absent from mapped owner ' + entry.name + ' -> ' + entry.owner)
  sourceAt(entry.facade)
}
function assertHelper(entry) {
  const content = sourceAt(entry.owner)
  const symbol = safeName(entry.symbol)
  assert.match(content, new RegExp('\\b(?:function\\s+|const\\s+)' + symbol + '\\b'),
    'symbol absent from owner ' + entry.symbol + ' -> ' + entry.owner)
}

test('A1 locator covers the exact 58-name GSA public inventory in order', () => {
  assert.equal(locator.schema, 'gsa4-a1-source-locator/v1')
  assert.equal(locator.advisory_only, true)
  assert.equal(locator.tool_owners.length, 58)
  assert.deepEqual(locator.tool_owners.map(x => x.name), pinnedNames)
  assert.equal(new Set(locator.tool_owners.map(x => x.name)).size, 58)
  assert.match(locator.validation, /CURRENT Git ref\/blob SHA/)
})

test('A1 tool owners point to their actual TS registration and original facade', () => {
  for (const entry of locator.tool_owners) assertActualOwner(entry)
})

test('A1 helper symbols and error routes resolve to real source and tests', () => {
  for (const entry of locator.helper_owners) assertHelper(entry)
  for (const route of locator.error_routes) {
    assert.ok(sourceAt(route.owner).includes(route.code),
      'error code absent at owner: ' + route.code + ' -> ' + route.owner)
    for (const dep of route.related) sourceAt(dep)
    for (const t of route.tests) assert.ok(fs.existsSync(path.join(repoRoot, t)), 'test missing: ' + t)
  }
  for (const tests of Object.values(locator.tests_by_area)) {
    for (const t of tests) assert.ok(fs.existsSync(path.join(repoRoot, t)), 'regression missing: ' + t)
  }
})

test('A1 rejects wrong tool, symbol and escaped owner paths', () => {
  const tool = locator.tool_owners.find(x => x.name === 'run_begin')
  assert.ok(tool)
  assert.throws(() => assertActualOwner({...tool, owner:'run/verification.ts'}), /tool absent/)
  assert.throws(() => assertActualOwner({...tool, owner:'../index.ts'}), /source-relative|escapes/)
  assert.throws(() => assertHelper({symbol:'imaginaryMissingGsa4Helper',owner:'run-dispatch-closure-guards.ts'}), /symbol absent/)
})

test('A1 is navigation metadata, not a new runtime registry or permission authority', () => {
  assert.equal(Object.hasOwn(locator,'runtime_tool_registry'),false)
  assert.equal(Object.hasOwn(locator,'permissions'),false)
  assert.ok(locator.tool_owners.every(x => !('schema' in x) && !('handler' in x)))
})
