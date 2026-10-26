'use strict'
// R-00: transform a locally saved MCP response-event JSONL into size-only
// context meter events. Never export response bodies or sensitive metadata.
// Input: {"tool":"get_agent_harness","structuredContent":{...},"content":[...]}
// Only structuredContent is counted as *candidate* GSA output by default;
// host visibility is unknown. No automatic model-facing attribution.
const fs = require('node:fs')

function bytes(value) { return Buffer.byteLength(JSON.stringify(value) ?? '', 'utf8') }
function derive(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      typeof raw.tool !== 'string' || !raw.tool) throw Error('tool name required')
  const structured = raw.structuredContent
  const content = raw.content
  if (structured === undefined && content === undefined) throw Error('response payload required')
  const structuredBytes = structured === undefined ? 0 : bytes(structured)
  const textBytes = Array.isArray(content)
    ? content.reduce((n,x)=>n+(x && x.type === 'text' && typeof x.text === 'string'
      ? Buffer.byteLength(x.text,'utf8') : 0),0) : 0
  // MCP tools often duplicate structuredContent as JSON text content.
  // Do not add these together as though both were shown to the model.
  const duplicated = structured !== undefined && Array.isArray(content) &&
    content.length === 1 && content[0]?.type === 'text' &&
    typeof content[0].text === 'string' && (() => {
      try { return JSON.stringify(JSON.parse(content[0].text)) === JSON.stringify(structured) }
      catch { return false }
    })()
  return {
    kind: 'observed_tool_sizes', tool: raw.tool,
    structured_bytes:structuredBytes, text_bytes:textBytes,
    payload_bytes:structuredBytes || textBytes,
    duplication:duplicated ? 'STRUCTURED_EQUALS_TEXT' : 'UNKNOWN',
    visibility:'HOST_MODEL_VISIBILITY_UNKNOWN'
  }
}
function capture(file) {
  return fs.readFileSync(file,'utf8').split(/\r?\n/).filter(s=>s.trim())
    .map((line,i)=> { try {return derive(JSON.parse(line))}
      catch(e) { throw Error('line '+(i+1)+': '+e.message) } })
}
if(require.main === module) {
  try {
    const file=process.argv[2]
    if(!file || process.argv.length!==3) throw Error('Usage: node test-lab/mcp-context-capture.cjs mcp-responses.jsonl')
    for(const event of capture(file)) process.stdout.write(JSON.stringify(event)+'\n')
  } catch(e) { process.stderr.write('MCP_CAPTURE_ERROR: '+e.message+'\n');process.exitCode=1 }
}
module.exports={derive,capture}
