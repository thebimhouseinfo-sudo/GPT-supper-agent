'use strict'
// Explicit allowlist for additive U-F Skill/Tester instructions.
// Hashes pin EVERY new line; baseline GSA3 fingerprints remain unchanged.
// Unexpected changes are not silently normalized away.
const assert = require('node:assert/strict')
const hashes = {
  debuggingSkill: ['c222f0a0323a88c9','4dd38ff679b56e68','6660c9dc88b70ad0'],
  testingEvidenceSkill: ['d51a999f2e0d8a1c','1f4266429120fc90'],
  codingLoopSkill: ['9661314993dfb732'],
  testerHarness: ['b82453f0fc303c06'],
}
function fnv64(s) {
  let h=0xcbf29ce484222325n
  for(let i=0;i<s.length;i++)
    h=BigInt.asUintN(64,(h ^ BigInt(s.charCodeAt(i)))*0x100000001b3n)
  return h.toString(16).padStart(16,'0')
}
function approve(name, lines) {
  const expected=hashes[name]||[]
  const got=Array.from(lines,line=>fnv64(line)) // copy VM-realm arrays to host realm
  assert.deepEqual(got,expected,'U-F exact approved delta absent/modified/duplicated for '+name)
}
function normalizeUFInitializer(name,source) {
  if(!Object.hasOwn(hashes,name))return source
  const lines=source.split('\n').filter(x=>/^      'U-F [^']*',$/.test(x))
  approve(name,lines)
  return source.replace(/^      'U-F [^\n]*',\n/gm,'')
}
function normalizeUFBody(name,body) {
  const srcName={'debugging':'debuggingSkill','testing-evidence':'testingEvidenceSkill',
    'coding-loop':'codingLoopSkill'}[name]
  if(!srcName)return body
  const lines=body.split('\n')
  const added=lines.filter(x=>x.startsWith('U-F '))
  approve(srcName,added.map(x=>"      '"+x+"',"))
  return lines.filter(x=>!x.startsWith('U-F ')).join('\n')
}
function normalizeUFRole(role,h) {
  if(role!=='tester')return h
  const added=h.loop.filter(x=>x.startsWith('U-F '))
  approve('testerHarness',added.map(x=>"      '"+x+"',"))
  return {...h,loop:h.loop.filter(x=>!x.startsWith('U-F '))}
}
module.exports={normalizeUFInitializer,normalizeUFBody,normalizeUFRole}
