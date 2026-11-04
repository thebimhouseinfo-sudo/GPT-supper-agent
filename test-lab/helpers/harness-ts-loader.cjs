'use strict'
// Restricted, import-aware TypeScript source executor for the GSA Harness tests.
// Only local .ts modules inside the gsa-mcp tree are loadable; cycles are rejected.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const sourceRoot = path.resolve(__dirname, '../../supabase/functions/gsa-mcp')

function loadSourceModule(entry) {
  assert.ok(['harness-catalog.ts', 'harness-skill-tools.ts'].includes(entry), 'Unexpected test entry module')
  const cache = new Map()
  const loading = new Set()
  function load(file) {
    const absolute = path.resolve(file)
    assert.ok(absolute.startsWith(sourceRoot + path.sep) && absolute.endsWith('.ts'),
      'Refusing out-of-scope TypeScript import: ' + absolute)
    assert.ok(!loading.has(absolute), 'Circular Harness import: ' + absolute)
    if (cache.has(absolute)) return cache.get(absolute)
    loading.add(absolute)
    try {
      const source = fs.readFileSync(absolute, 'utf8')
      const parsed = ts.createSourceFile(absolute, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
      assert.equal(parsed.parseDiagnostics.length, 0, absolute + ' must parse')
      const compiled = ts.transpileModule(source, {
        fileName: absolute,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        reportDiagnostics: true,
      })
      assert.equal((compiled.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length,
        0, absolute + ' must transpile')
      const mod = { exports: {} }
      const localRequire = specifier => {
        assert.match(specifier, /^\.\.?\//, 'Only relative imports are allowed in Harness test loader')
        const requested = path.resolve(path.dirname(absolute), specifier)
        return load(path.extname(requested) ? requested : requested + '.ts')
      }
      vm.runInNewContext(compiled.outputText,
        { module: mod, exports: mod.exports, require: localRequire },
        { filename: absolute, timeout: 2500 })
      cache.set(absolute, mod.exports)
      return mod.exports
    } finally {
      loading.delete(absolute)
    }
  }
  return load(path.join(sourceRoot, entry))
}

module.exports = { loadSourceModule }
