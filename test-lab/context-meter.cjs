'use strict'
// R-00: honest GSA-controlled context proxy. Does NOT measure ChatGPT host tokens.
// Usage: node test-lab/context-meter.cjs records.jsonl [--code-lines=N --complexity=0..8]
// JSONL records: {kind:"model_facing",text:string}, {kind:"tool",text:string},
// {kind:"file_read",path:string,text:string}, {kind:"file_search",path:string,text:string},
// {kind:"navigation",from:string,to:string}. Tool/file records are counted once;
// mark model_facing only when payload is explicitly known to face the model.
const fs = require('node:fs')

function parseArgs(argv) {
  const file = argv[0]
  if (!file || argv.some(x => x === '--help')) return null
  const opt = Object.fromEntries(argv.slice(1).map(a => {
    const m = a.match(/^--([a-z-]+)=(\d+)$/)
    if (!m) throw Error('Invalid option: ' + a)
    return [m[1], Number(m[2])]
  }))
  for (const name of Object.keys(opt)) {
    if (!['code-lines','complexity'].includes(name)) throw Error('Unknown option: ' + name)
  }
  if (opt.complexity !== undefined && opt.complexity > 8) throw Error('complexity must be 0..8')
  return {file, opt}
}

function measure(records, opt = {}) {
  const out = {
    schema: 'gsa-context-proxy/v1', visibility: 'GSA_OWNED_OBSERVABLE_ONLY',
    model_facing: {calls:0, utf8_bytes:0, characters:0, estimated_tokens:0},
    tools:{calls:0, utf8_bytes:0, observed_structured_bytes:0, observed_text_bytes:0, duplicate_structured_text:0, visibility_unknown:0},
    navigation:{file_reads:0, file_searches:0, hops:0, unique_files:0},
    normalization:{code_lines:opt['code-lines'] ?? null, complexity:opt.complexity ?? null,
      workload:null, context_per_1000_work_units:null},
    warning:'Proxy counts are NOT model input tokens, caching, latency or host context usage.'
  }
  const paths = new Set()
  for (const r of records) {
    if (!r || typeof r.kind !== 'string') throw Error('record.kind required')
    if (r.kind === 'model_facing') {
      if (typeof r.text !== 'string') throw Error('model_facing text required')
      out.model_facing.calls++
      out.model_facing.utf8_bytes += Buffer.byteLength(r.text,'utf8')
      out.model_facing.characters += Array.from(r.text).length
    } else if (r.kind === 'observed_tool_sizes') {
      if (typeof r.tool !== 'string' || !r.tool ||
          !Number.isSafeInteger(r.structured_bytes) || r.structured_bytes < 0 ||
          !Number.isSafeInteger(r.text_bytes) || r.text_bytes < 0 ||
          !Number.isSafeInteger(r.payload_bytes) || r.payload_bytes < 0 ||
          r.visibility !== 'HOST_MODEL_VISIBILITY_UNKNOWN') throw Error('invalid observed tool sizes')
      out.tools.calls++
      out.tools.utf8_bytes += r.payload_bytes
      out.tools.observed_structured_bytes += r.structured_bytes
      out.tools.observed_text_bytes += r.text_bytes
      out.tools.visibility_unknown++
      if (r.duplication === 'STRUCTURED_EQUALS_TEXT') out.tools.duplicate_structured_text++
    } else if (r.kind === 'tool' || r.kind === 'file_read' || r.kind === 'file_search') {
      if (typeof r.text !== 'string') throw Error(r.kind + ' text required')
      out.tools.calls++
      out.tools.utf8_bytes += Buffer.byteLength(r.text,'utf8')
      if (r.kind === 'file_read') out.navigation.file_reads++
      if (r.kind === 'file_search') out.navigation.file_searches++
      if (r.path !== undefined) {
        if (typeof r.path !== 'string' || !r.path) throw Error('valid path required')
        paths.add(r.path)
      }
    } else if (r.kind === 'navigation') {
      if (typeof r.from !== 'string' || typeof r.to !== 'string') throw Error('navigation endpoints required')
      out.navigation.hops++
      paths.add(r.from); paths.add(r.to)
    } else throw Error('Unsupported record kind: ' + r.kind)
  }
  out.navigation.unique_files = paths.size
  // Character-based estimate only, not an external tokenization claim.
  out.model_facing.estimated_tokens = Math.ceil(out.model_facing.characters / 4)
  const L = opt['code-lines'], D = opt.complexity
  if (Number.isInteger(L) && L > 0 && Number.isInteger(D) && D >= 0 && D <= 8) {
    const W = L * (1 + D / 8)
    out.normalization.workload = W
    out.normalization.context_per_1000_work_units =
      1000 * out.model_facing.estimated_tokens / W
  }
  return out
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2))
    if (!args) {
      process.stderr.write('Usage: node test-lab/context-meter.cjs records.jsonl [--code-lines=N --complexity=0..8]\n')
      process.exitCode = 2
    } else {
      const lines = fs.readFileSync(args.file,'utf8').split(/\r?\n/).filter(x=>x.trim())
      process.stdout.write(JSON.stringify(measure(lines.map((x,i)=>{
        try {return JSON.parse(x)} catch {throw Error('Invalid JSONL line ' + (i+1))}
      }), args.opt),null,2)+'\n')
    }
  } catch(e) {
    process.stderr.write('CONTEXT_METER_ERROR: ' + e.message + '\n')
    process.exitCode = 1
  }
}
module.exports = {measure,parseArgs}
