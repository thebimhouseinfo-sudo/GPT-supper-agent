'use strict'
// Test-only source locators for GSA4 A0. Every view is assembled from the actual
// exported TypeScript declarations; no policy or MCP registration is reimplemented.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const ts = require('typescript')
const root = path.resolve(__dirname, '../../supabase/functions/gsa-mcp')
const cache = new Map()

function source(file) {
  const full = path.resolve(root, file)
  assert.ok(full.startsWith(root + path.sep), 'source escapes GSA runtime: ' + file)
  const name = path.relative(root, full).replaceAll('\\', '/')
  if (!cache.has(name)) {
    const content = fs.readFileSync(full, 'utf8')
    const ast = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    assert.equal(ast.parseDiagnostics.length, 0, name + ' must parse')
    const imports = new Map()
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
      const spec = statement.moduleSpecifier.text
      if (!spec.startsWith('./') && !spec.startsWith('../')) continue
      const bindings = statement.importClause?.namedBindings
      if (!bindings || !ts.isNamedImports(bindings)) continue
      for (const item of bindings.elements) {
        imports.set(item.name.text, {
          file: path.posix.normalize(path.posix.join(path.posix.dirname(name), spec)),
          exported: item.propertyName?.text ?? item.name.text,
        })
      }
    }
    cache.set(name, {name, content, ast, imports})
  }
  return cache.get(name)
}

function exportedFunction(file, name) {
  const m = source(file)
  const found = m.ast.statements.find(n => ts.isFunctionDeclaration(n) &&
    n.name?.text === name && n.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword))
  assert.ok(found && found.body, m.name + ' missing exported function ' + name)
  return {meta:m, node:found}
}

function registrationGraph(file, entry) {
  const names = [], visited = [], sources = new Map(), stack = []
  function visit(file, name) {
    const key = file + '#' + name
    assert.ok(!stack.includes(key), 'registration import cycle: ' + [...stack,key].join(' -> '))
    assert.ok(!visited.includes(key), 'duplicated registration call: ' + key)
    visited.push(key)
    stack.push(key)
    const {meta, node} = exportedFunction(file, name)
    sources.set(meta.name, meta.content)
    function walk(n) {
      if (ts.isCallExpression(n)) {
        const callee = n.expression
        const first = n.arguments[0]
        if (ts.isPropertyAccessExpression(callee) && callee.expression.getText(meta.ast) === 'server' &&
            callee.name.text === 'registerTool' && first && ts.isStringLiteral(first)) {
          names.push(first.text)
        } else if (ts.isIdentifier(callee) && callee.text === 'transitionTool' &&
                   first && ts.isStringLiteral(first)) {
          names.push(first.text)
        } else if (ts.isIdentifier(callee) && /^register[A-Z]/.test(callee.text) &&
                   meta.imports.has(callee.text)) {
          const target = meta.imports.get(callee.text)
          visit(target.file, target.exported)
        }
      }
      ts.forEachChild(n, walk)
    }
    walk(node.body)
    stack.pop()
  }
  visit(file, entry)
  // Detect unreachable extra declarations and registrations in every visited owner.
  const staticNames = []
  for (const [file, content] of sources) {
    for (const m of content.matchAll(/server\.registerTool\(\s*['"]([^'"]+)['"]|transitionTool\(\s*['"]([^'"]+)['"]/g)) {
      staticNames.push(m[1] ?? m[2])
    }
  }
  assert.deepEqual([...names].sort(), staticNames.sort(),
    entry + ' registration graph must include all registered names, without hidden leaf names')
  assert.equal(new Set(names).size, names.length, entry + ' duplicate tool registration')
  return {names, sources, visited}
}

function toolSource(file, entry) {
  const graph = registrationGraph(file, entry)
  // Source-bound assertions should inspect the leaf that really registers the tool.
  // Single-file registrations keep their original direct source.
  const leaves = [...graph.sources.entries()].filter(([p]) => p !== file)
  return (leaves.length ? leaves : [[file, source(file).content]]).map(x => x[1]).join('\n')
}

function initializer(file, variable, facade) {
  const m = source(file)
  const imp = facade.imports.get(variable)
  assert.ok(imp && imp.file === m.name && imp.exported === variable,
    'harness catalog must import ' + variable + ' from ' + file)
  const decl = m.ast.statements.filter(ts.isVariableStatement)
    .flatMap(s => s.declarationList.declarations)
    .find(d => ts.isIdentifier(d.name) && d.name.text === variable)
  assert.ok(decl && decl.initializer, file + ' must declare ' + variable)
  assert.ok(ts.isArrayLiteralExpression(decl.initializer) || ts.isObjectLiteralExpression(decl.initializer),
    'expected literal owner: ' + file)
  return decl.initializer.getText(m.ast)
}

function harnessSource() {
  const facade = source('harness-catalog.ts')
  const shared = initializer('harness/shared.ts', 'BASE_AGENT_HARNESS', facade)
  const roles = [
    'orchestrator','planner','advisor','designer','coder','reviewer','critic_reviewer','tester'
  ]
  const skills = [
    ['debugging','debuggingSkill'],['critic-review','criticReviewSkill'],
    ['critical-challenge','criticalChallengeSkill'],['job-planning','jobPlanningSkill'],
    ['coding-loop','codingLoopSkill'],['delegation','delegationSkill'],
    ['planning-review','planningReviewSkill'],['review-evidence','reviewEvidenceSkill'],
    ['testing-evidence','testingEvidenceSkill'],['tester-lab','testerLabSkill'],
    ['ui-coder-frontend','uiCoderFrontendSkill'],
  ]
  const roleEntries = roles.map(role => '  ' + role + ': ' +
    initializer('harness/roles/' + role + '.ts', role + 'Harness', facade))
  const skillEntries = skills.map(([skill,variable]) => "  '" + skill + "': " +
    initializer('harness/skills/' + skill + '.ts', variable, facade))
  const start = facade.content.indexOf('export const ROLE_SKILLS')
  const end = facade.content.indexOf('export const RUNTIME_SKILLS')
  assert.ok(start >= 0 && end > start, 'facade owns canonical Role/Host Skill mapping')
  const roleSkillMaps = facade.content.slice(start, end).replace(/^export\s+/gm, '')
  // Read-only legacy source view: actual literal nodes, plus actual facade maps.
  // This preserves original negative mutation assertions while following new owners.
  return [
    'const BASE_AGENT_HARNESS = ' + shared + '\n\n',
    'const ROLE_HARNESSES = {\n' + roleEntries.join(',\n') + '\n}\n\n',
    roleSkillMaps,
    'const RUNTIME_SKILLS: Record<string, any> = {\n' + skillEntries.join(',\n') + '\n}\n\n',
    facade.content,
  ].join('\n')
}

module.exports = {source, registrationGraph, toolSource, harnessSource}
