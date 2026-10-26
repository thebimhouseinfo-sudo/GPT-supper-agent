'use strict'
// R-00: group *size-only* MCP HTTP samples by explicitly pinned run/runtime.
// Input records from GSA console JSON logs, one JSON object per line.
// Never accept source content, URLs, user IDs or authentication data.
const fs = require('node:fs')
const SHA = /^[0-9a-f]{40}$/
const RUN = /^[a-zA-Z0-9_-]{1,64}$/
function report(records) {
  const groups = new Map()
  let rejected = 0, unpinned = 0
  for (const x of records) {
    if (!x || x.metric !== 'gsa-mcp-http-response-bytes' || x.version !== 1 ||
        x.visibility !== 'HOST_UNKNOWN' || x.completeness !== 'COMPLETE' ||
        !Number.isSafeInteger(x.bytes) || x.bytes < 0 ||
        !['CONTENT_LENGTH','STREAM_COUNT'].includes(x.source)) { rejected++; continue }
    if (!RUN.test(x.run_id ?? '') || !SHA.test(x.runtime_sha ?? '') ||
        x.eligible_for_baseline !== true) { unpinned++; continue }
    const key = x.run_id + ':' + x.runtime_sha
    if (!groups.has(key)) groups.set(key, {
      run_id:x.run_id, runtime_sha:x.runtime_sha, responses:0, http_bytes:0,
      content_length_samples:0, streamed_samples:0,
      model_facing_visibility:'UNKNOWN', baseline_status:'CANDIDATE_NEEDS_WORKLOAD_PROVENANCE'
    })
    const a=groups.get(key)
    a.responses++
    a.http_bytes+=x.bytes
    if(x.source==='CONTENT_LENGTH') a.content_length_samples++
    else a.streamed_samples++
  }
  const runs=[...groups.values()].sort((a,b)=>a.run_id.localeCompare(b.run_id)||a.runtime_sha.localeCompare(b.runtime_sha))
  const byRun=new Map()
  for(const x of runs) byRun.set(x.run_id,(byRun.get(x.run_id)||0)+1)
  for(const x of runs) if(byRun.get(x.run_id)>1) x.baseline_status='INVALID_MIXED_RUNTIME_SHA'
  return {schema:'gsa-context-run-report/v1',runs,excluded:{invalid:rejected,unpinned},
    warning:'Size-only HTTP transport samples; NOT actual model tokens or approved comparable U Job baselines.'}
}
if(require.main===module) {
  try {
    if(process.argv.length!==3) throw Error('Usage: node test-lab/context-run-report.cjs size-only-events.jsonl')
    const lines=fs.readFileSync(process.argv[2],'utf8').split(/\r?\n/).filter(x=>x.trim())
    const records=lines.map((s,i)=>{try{return JSON.parse(s)}catch{throw Error('Invalid JSON at line '+(i+1))}})
    process.stdout.write(JSON.stringify(report(records),null,2)+'\n')
  } catch(e){process.stderr.write('CONTEXT_REPORT_ERROR: '+e.message+'\n');process.exitCode=1}
}
module.exports={report}
