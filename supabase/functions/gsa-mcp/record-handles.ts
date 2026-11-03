// GSA1: pure record display handles, moved unchanged from index.ts.

export function projectHandle(projectId: string) {
  return 'P-' + projectId.replace(/-/g, '').slice(-4).toUpperCase()
}

export function jobHandle(jobId: string) {
  return 'J-' + jobId.replace(/-/g, '').slice(-4).toUpperCase()
}

export function runHandle(runId: string) {
  return 'R-' + runId.replace(/-/g, '').slice(-4).toUpperCase()
}

export function uuidv7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let ts = BigInt(Date.now())
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number(ts & 0xffn)
    ts >>= 8n
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join('-')
}
