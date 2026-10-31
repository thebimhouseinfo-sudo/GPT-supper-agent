// GSA1: pure request slug routing and GitHub repository URL normalization.

export function edgeFunctionSlug(req: Request) {
  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const candidate = parts[0] === 'functions' && parts[1] === 'v1' ? parts[2] : parts[0]
  // Only exact gsa-mcp is production. Explicit gsa-mcp-* function slugs are staging.
  // No arbitrary path may opt into the production NEXT namespace.
  return candidate === 'gsa-mcp' || (typeof candidate === 'string' && /^gsa-mcp-[a-z0-9-]+$/.test(candidate))
    ? candidate : 'gsa-mcp-invalid'
}

export function normalizeGithubRepo(input: string) {
  try {
    const url = new URL(input)
    if (url.hostname !== 'github.com') return null
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/')
    if (parts.length < 2 || !parts[0] || !parts[1]) return null
    const owner = parts[0]
    const name = parts[1].replace(/\.git$/, '')
    return {
      full_name: owner + '/' + name,
      url: 'https://github.com/' + owner + '/' + name,
    }
  } catch {
    return null
  }
}
