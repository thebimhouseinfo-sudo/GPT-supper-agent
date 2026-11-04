'use strict'
// Golden handler-body fingerprint is pinned to GSA3 run-execution-tools.ts blob 29434ca7fe558b5e669eab99daf2091d4936bd7d.
// This scoped migration guard intentionally does NOT modify gsa1-module-boundary.test.cjs.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.resolve(__dirname, '../supabase/functions/gsa-mcp')
const names = ['run_begin','relationship_knowledge_prepare','goal_recheck_record','run_verification_record','run_complete']
const golden = {
  "run_begin": { file: "run/run-begin.ts", length: 13028, fnv1a32: 'dd3128ce' },
  "relationship_knowledge_prepare": { file: "run/relationship-knowledge.ts", length: 3365, fnv1a32: '22f8eae2' },
  "goal_recheck_record": { file: "run/goal-recheck.ts", length: 7918, fnv1a32: 'ee6b1117' },
  "run_verification_record": { file: "run/verification.ts", length: 7363, fnv1a32: '07aab975' },
  "run_complete": { file: "run/complete.ts", length: 16549, fnv1a32: 'd6a0a703' },
}

function hash32(text) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function registrationBlock(source, file) {
  const matches = [...source.matchAll(/^  server\.registerTool\($/gm)]
  assert.equal(matches.length, 1, file + ': exactly one registration')
  const end = source.lastIndexOf('\n  )')
  assert.ok(end > matches[0].index, file + ': registration close')
  return source.slice(matches[0].index, end + 4).trimEnd()
}

test('five extracted handlers match byte-exact pinned registration blocks', () => {
  const facade = fs.readFileSync(path.join(root, 'run-execution-tools.ts'), 'utf8')
  const facadeAst = ts.createSourceFile('run-execution-tools.ts', facade, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  assert.equal(facadeAst.parseDiagnostics.length, 0)
  assert.doesNotMatch(facade, /server\.registerTool\(/)
  for (const name of names) {
    const { file, length, fnv1a32 } = golden[name]
    const source = fs.readFileSync(path.join(root, file), 'utf8')
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    assert.equal(ast.parseDiagnostics.length, 0, file + ': TS parse diagnostics')
    const block = registrationBlock(source, file)
    assert.equal(block.length, length, name + ': original block length drift')
    assert.equal(hash32(block), fnv1a32, name + ': pinned body/schema/error strings drift')
    assert.match(block, new RegExp("^  server\\.registerTool\\(\\s*'" + name + "'"))
  }
  const completion = fs.readFileSync(path.join(root, golden.run_complete.file), 'utf8')
  for (const guard of ['validateRunVerificationSnapshot(', 'validateTesterEvidenceVerificationSnapshot(', 'validateTesterEvidenceClaimSnapshot(', 'CODER_COMPLETION_BLOCKED:', 'HANDOFF_EVIDENCE_REJECTED:']) {
    assert.ok(completion.includes(guard), 'run_complete evidence guard missing: ' + guard)
  }
})

// Restricted test loader: only the five authored relative .ts imports are allowed.
function loadTs(filename, cache = new Map()) {
  const absolute = path.resolve(root, filename)
  assert.ok(absolute.startsWith(root + path.sep), 'module escaped gsa-mcp root')
  if (cache.has(absolute)) return cache.get(absolute).exports
  const source = fs.readFileSync(absolute, 'utf8')
  const result = ts.transpileModule(source, { fileName: absolute, reportDiagnostics: true, compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS
  } })
  const errors = (result.diagnostics || []).filter(x => x.category === ts.DiagnosticCategory.Error)
  assert.equal(errors.length, 0, filename + ': TypeScript transpile errors')
  const module = { exports: {} }
  cache.set(absolute, module)
  const fn = vm.runInThisContext('(function(exports, require, module) {\n' + result.outputText + '\n})', { filename: absolute })
  fn(module.exports, requested => {
    assert.ok(requested.startsWith('./'), 'unexpected import: ' + requested)
    return loadTs(path.resolve(path.dirname(absolute), requested), cache)
  }, module)
  return module.exports
}

test('facade executes five registrations exactly once and in original order', async () => {
  const observed = []
  let z
  z = new Proxy(function () {}, { get: () => z, apply: () => z })
  const authErrors = [
    'Authentication required to begin a Run.',
    'Authentication required to prepare relationship knowledge.',
    'Authentication required to persist Goal Recheck.',
    'Authentication required to prepare Run Verification.',
    'Authentication required to complete a Run.'
  ]
  const { registerRunExecutionTools } = loadTs('run-execution-tools.ts')
  registerRunExecutionTools({
    server: { registerTool: (name, config, callback) => observed.push({ name, config, callback }) },
    z, req: {}, AUTH_SCOPES: ['gsa:test'],
    authContext: async () => null,
    authError: (_request, message) => ({ isError: true, content: [{ type: 'text', text: message }] })
  })
  assert.deepEqual(observed.map(entry => entry.name), names)
  assert.equal(new Set(observed.map(entry => entry.name)).size, 5)
  for (let i = 0; i < observed.length; i++) {
    assert.equal(typeof observed[i].callback, 'function', names[i] + ': handler absent')
    assert.ok(observed[i].config.inputSchema && observed[i].config.outputSchema, names[i] + ': schemas absent')
    const denied = await observed[i].callback({})
    assert.equal(denied.isError, true, names[i] + ': missing deny')
    assert.equal(denied.content[0].text, authErrors[i], names[i] + ': auth error drift')
  }
})
