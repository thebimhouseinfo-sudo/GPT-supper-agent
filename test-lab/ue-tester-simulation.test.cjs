'use strict'
// U-E Tester simulation fixtures. This model is deliberately NOT production GSA
// orchestration or an Autodesk host. Negative controls verify the oracle detects
// defective fake behavior rather than always returning PASS.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { loadSourceModule } = require('./helpers/harness-ts-loader.cjs')
const oracle = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenarios/tester/UE-S1-S4-ORACLES.json'), 'utf8'))

class FakeBoundary {
  constructor(bugs = {}) {
    this.bugs = bugs
    this.revision = 1
    this.session = 1
    this.tasks = new Map()
    this.pending = []
    this.active = []
    this.seen = new Set()
    this.events = []
    this.saved = false
    this.maxCadActive = 0
  }
  emit(kind, data = {}) { this.events.push({ index: this.events.length, kind, ...data }) }
  submit({ root, id, chat = 'A', revision = 1, kind = 'CAD', extraChild = false }) {
    if (typeof id !== 'string' || !id.trim() || typeof root !== 'string' || !root.trim()) {
      this.emit('BLOCKED_INVALID', { root, id }); return null
    }
    if (revision !== this.revision && !this.bugs.staleBypass) {
      this.emit('BLOCKED_STALE', { root, id, revision }); return null
    }
    if (this.seen.has(id)) { this.emit('DUPLICATE_SKIPPED', { root, id }); return this.tasks.get(id) }
    this.seen.add(id)
    const task = this.spawn({ root, id, chat, kind })
    if (extraChild && this.bugs.doubleSpawn) this.spawn({ root, id: id + ':unintended', chat, kind })
    return task
  }
  spawn({ root, id, chat, kind }) {
    const task = { root, id, chat, kind, session: this.session, state: 'WAITING' }
    this.tasks.set(id, task)
    this.emit('SPAWN', { root, id, chat, flow_kind: kind, parent: root, session: this.session })
    if (kind === 'SYSTEM') { task.state = 'DONE'; this.emit('SYSTEM_DONE', { root, id }); return task }
    if (this.active.length > 0 && !this.bugs.concurrentCad) {
      task.state = 'QUEUED'
      this.pending.push(task)
      this.emit('WAIT_FOR_CAD_OWNER', { root, id, owner: this.active[0].id })
    } else this.start(task)
    return task
  }
  start(task) {
    task.state = 'ACTIVE'
    this.active.push(task)
    this.maxCadActive = Math.max(this.maxCadActive, this.active.length)
    this.emit('HOST_SEND', { root: task.root, id: task.id, session: this.session })
  }
  ack(id, result) {
    const task = this.tasks.get(id)
    if (!task || (task.state !== 'ACTIVE' && !this.bugs.lateAck)) {
      this.emit('STALE_ACK_IGNORED', { id, result }); return false
    }
    if ((task.session !== this.session || task.state === 'CANCELED') && !this.bugs.lateAck) {
      this.emit('STALE_ACK_IGNORED', { id, result }); return false
    }
    if (!['ok', 'fail'].includes(result)) throw Error('Fake host outcome must be ok/fail')
    const previousState = task.state
    task.state = result === 'ok' ? 'DONE' : 'FAIL'
    this.emit('HOST_ACK', { root: task.root, id, result, previousState, state: task.state })
    if (task.id.startsWith('save:') && result === 'ok') this.saved = true
    this.active = this.active.filter(t => t !== task)
    if (this.active.length === 0 && this.pending.length) this.start(this.pending.shift())
    return true
  }
  cancel(id) {
    const task = this.tasks.get(id)
    if (!task || !['ACTIVE', 'QUEUED'].includes(task.state)) return false
    task.state = 'CANCELED'
    this.pending = this.pending.filter(t => t.id !== id)
    this.active = this.active.filter(t => t.id !== id)
    this.emit('CANCEL', { root: task.root, id })
    if (this.active.length === 0 && this.pending.length) this.start(this.pending.shift())
    return true
  }
  close() {
    for (const task of this.tasks.values()) if (['ACTIVE', 'QUEUED'].includes(task.state)) task.state = 'CANCELED'
    this.pending = []; this.active = []; this.session += 1
    this.emit('HOST_CLOSED', { session: this.session })
  }
  reconnect() { this.emit('HOST_RECONNECTED', { session: this.session }); return true }
  rootCadChildren(root) { return this.events.filter(e => e.kind === 'SPAWN' && e.root === root && e.flow_kind === 'CAD') }
  hostSends(root) { return this.events.filter(e => e.kind === 'HOST_SEND' && e.root === root) }
  report() { return { fidelity: 'SIMULATED', nativeHost: 'REAL_HOST_UNVERIFIED', events: this.events } }
}
function scenario(id) {
  const result = oracle.scenarios.find(s => s.id === id)
  assert.ok(result, 'missing frozen oracle ' + id)
  assert.match(result.why_a_user_does_this, /\S/)
  assert.ok(result.criteria.length >= 2)
  assert.ok(result.boundary_profiles.length >= 2)
  return result
}
test('UE-00: on-demand catalog and MCP load_skill expose sourced simulate; host skill remains a distinct hint', async () => {
  const catalog = loadSourceModule('harness-catalog.ts')
  assert.equal(catalog.ROLE_HARNESSES.tester.authority[0].includes('read-only'), true)
  assert.deepEqual(Array.from(catalog.ROLE_SKILLS.tester), ['testing-evidence', 'simulate'])
  assert.deepEqual(Array.from(catalog.ROLE_HOST_SKILLS.tester), ['scenario-tester'])
  assert.ok(catalog.RUNTIME_SKILLS.simulate.body.includes('5b55a25057d2a33b320e54840f5578d81269c8b0'))
  assert.match(catalog.RUNTIME_SKILLS.simulate.body, /SOURCE BLIND/)
  assert.match(catalog.RUNTIME_SKILLS.simulate.body, /REAL_HOST_UNVERIFIED/)
  assert.match(catalog.ROLE_HARNESSES.tester.loop.join('\n'), /load GSA simulate on demand/)
  const handlers = new Map(), chain = new Proxy(() => {}, { get: () => chain, apply: () => chain })
  const tools = loadSourceModule('harness-skill-tools.ts')
  tools.registerHarnessSkillTools({
    server: { registerTool: (name, spec, fn) => handlers.set(name, { spec, fn }) },
    z: new Proxy({}, { get: () => chain }), req: {}, AUTH_SCOPES: ['gsa'],
    authContext: async () => ({ actor: 'test' }), authError: () => ({ isError: true }),
    renderHarness: catalog.renderHarness, ROLE_HARNESSES: catalog.ROLE_HARNESSES,
    ROLE_SKILLS: catalog.ROLE_SKILLS, ROLE_HOST_SKILLS: catalog.ROLE_HOST_SKILLS,
    RUNTIME_SKILLS: catalog.RUNTIME_SKILLS,
  })
  assert.deepEqual([...handlers.keys()], ['get_agent_harness', 'get_skill_catalog', 'load_skill'])
  const overview = (await handlers.get('get_agent_harness').fn({ role: 'tester', mode: 'JOB' })).structuredContent
  assert.ok(overview.suggested_skills.includes('simulate'))
  assert.deepEqual(Array.from(overview.suggested_host_skills), ['scenario-tester'])
  const listing = (await handlers.get('get_skill_catalog').fn({})).structuredContent.skills
  assert.ok(listing.some(s => s.name === 'simulate'))
  const loaded = await handlers.get('load_skill').fn({ name: 'simulate' })
  assert.equal(loaded.structuredContent.skill_text, catalog.RUNTIME_SKILLS.simulate.body)
  assert.equal(loaded.content[0].text, JSON.stringify(loaded.structuredContent))
})

test('UE-S1: normal entrypoint and external pass/fail, with terminal truth', () => {
  scenario('S1')
  const h = new FakeBoundary(), t = h.submit({ root: 'click-1', id: 'create:1' })
  assert.equal(t.state, 'ACTIVE')
  assert.equal(h.rootCadChildren('click-1').length, 1)
  assert.equal(t.state, 'ACTIVE', 'sending is not host-confirmed DONE')
  assert.equal(h.ack('create:1', 'ok'), true)
  assert.equal(t.state, 'DONE')
  assert.equal(h.ack('create:1', 'ok'), false, 'duplicate host callback ignored')
  const failure = new FakeBoundary(), bad = failure.submit({ root: 'click-2', id: 'create:2' })
  assert.equal(failure.ack('create:2', 'fail'), true)
  assert.equal(bad.state, 'FAIL')
  assert.equal(failure.saved, false)
  assert.equal(h.report().nativeHost, 'REAL_HOST_UNVERIFIED')
})

test('UE-S2: create -> run -> save -> reopen; failed save is not a saved PASS', () => {
  scenario('S2')
  const h = new FakeBoundary()
  for (const id of ['create:1', 'run:1', 'save:1']) {
    const task = h.submit({ root: 'journey-1', id })
    assert.equal(task.state, 'ACTIVE')
    assert.equal(h.ack(id, 'ok'), true)
    assert.equal(task.state, 'DONE')
  }
  assert.equal(h.saved, true, 'synthetic persistence acknowledged')
  assert.deepEqual(h.hostSends('journey-1').map(e => e.id), ['create:1', 'run:1', 'save:1'])
  const failed = new FakeBoundary()
  failed.submit({ root: 'journey-2', id: 'create:2' }); failed.ack('create:2', 'ok')
  failed.submit({ root: 'journey-2', id: 'run:2' }); failed.ack('run:2', 'ok')
  const save = failed.submit({ root: 'journey-2', id: 'save:2' })
  failed.ack('save:2', 'fail')
  assert.equal(save.state, 'FAIL')
  assert.equal(failed.saved, false, 'mock fail cannot be promoted to saved')
})

test('UE-S3: two-chat CAD serialization, harmless SYSTEM overlap and duplicate root negative controls', () => {
  scenario('S3')
  const h = new FakeBoundary()
  const a = h.submit({ root: 'one-click', id: 'draw:1', chat: 'A' })
  const system = h.submit({ root: 'one-click', id: 'system:log', chat: 'A', kind: 'SYSTEM' })
  assert.equal(system.state, 'DONE', 'SYSTEM may proceed while CAD is active')
  h.submit({ root: 'one-click', id: 'draw:1', chat: 'A' })
  const b = h.submit({ root: 'second-chat-click', id: 'draw:2', chat: 'B' })
  assert.equal(b.state, 'QUEUED')
  assert.equal(h.maxCadActive, 1)
  assert.equal(h.rootCadChildren('one-click').length, 1)
  assert.equal(h.hostSends('second-chat-click').length, 0, 'B waits for A')
  h.ack('draw:1', 'ok')
  assert.equal(a.state, 'DONE')
  assert.equal(b.state, 'ACTIVE')
  h.ack('draw:2', 'ok')
  assert.equal(b.state, 'DONE')
  assert.equal(h.maxCadActive, 1)
  assert.ok(h.events.some(e => e.kind === 'WAIT_FOR_CAD_OWNER'))

  const double = new FakeBoundary({ doubleSpawn: true })
  double.submit({ root: 'one-click', id: 'draw:1', extraChild: true })
  assert.equal(double.rootCadChildren('one-click').length, 2,
    'NEGATIVE CONTROL catches unrequested second CAD flow even though it queues')
  const concurrent = new FakeBoundary({ concurrentCad: true })
  concurrent.submit({ root: 'first', id: 'cad:A' })
  concurrent.submit({ root: 'second', id: 'cad:B' })
  assert.equal(concurrent.maxCadActive, 2, 'NEGATIVE CONTROL catches exclusive lease bypass')
})

test('UE-S4: bad request, stale revision, cancel, close/reconnect and late ACK controls', () => {
  scenario('S4')
  const h = new FakeBoundary()
  assert.equal(h.submit({ root: 'r0', id: ' ' }), null)
  assert.equal(h.submit({ root: 'r1', id: 'stale:1', revision: 0 }), null)
  assert.equal(h.hostSends('r1').length, 0)
  const old = h.submit({ root: 'r2', id: 'draw:pending' })
  assert.equal(h.cancel(old.id), true)
  assert.equal(old.state, 'CANCELED')
  h.close(); h.reconnect()
  assert.equal(h.ack(old.id, 'ok'), false)
  assert.equal(old.state, 'CANCELED')
  const fresh = h.submit({ root: 'r3', id: 'draw:new' })
  assert.equal(fresh.state, 'ACTIVE', 'reconnect has no stranded CAD lock')
  h.ack(fresh.id, 'ok')
  assert.equal(fresh.state, 'DONE')
  const late = new FakeBoundary({ lateAck: true })
  const zombie = late.submit({ root: 'r2', id: 'draw:zombie' })
  late.cancel(zombie.id); late.close(); late.reconnect(); late.ack(zombie.id, 'ok')
  assert.equal(zombie.state, 'DONE', 'NEGATIVE CONTROL exposes late callback acceptance')
  const bypass = new FakeBoundary({ staleBypass: true })
  bypass.submit({ root: 'old-plan', id: 'stale:write', revision: 0 })
  assert.equal(bypass.hostSends('old-plan').length, 1,
    'NEGATIVE CONTROL exposes stale Plan bypass')
})

test('UE-FIDELITY: synthetic checks never claim native host PASS or independent source-blind execution', () => {
  assert.match(oracle.source_independence, /UNVERIFIED/)
  assert.match(oracle.mock_boundary, /synthetic/)
  assert.equal(oracle.scenarios.length, 4)
  const h = new FakeBoundary()
  assert.equal(h.report().fidelity, 'SIMULATED')
  assert.equal(h.report().nativeHost, 'REAL_HOST_UNVERIFIED')
  assert.ok(oracle.evidence_rules.some(x => /Mock PASS does not/.test(x)))
})
