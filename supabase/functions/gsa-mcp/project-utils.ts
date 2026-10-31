import { normalizeGithubRepo } from './platform-utils.ts'

// GSA1: pure project name and branch validation, extracted without behavior changes.
export function safeProjectName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').slice(0,120)
}

export function validIntegrationBranch(name: string) {
  return typeof name === 'string' && name.length > 0 && name.length <= 128 &&
    !name.startsWith('/') && !name.endsWith('/') && !name.endsWith('.lock') &&
    !name.includes('..') && !name.includes('//') && !name.includes('@{') &&
    /^[A-Za-z0-9][A-Za-z0-9_.\/-]*$/.test(name) &&
    name.split('/').every((segment) => segment !== '.' && segment !== '..' && !segment.startsWith('.'))
}

export function knowledgePath(projectId: string, knowledgeId: string, slug: string) {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'knowledge'
  return 'projects/' + projectId + '/KNOWLEDGE/' + knowledgeId + '-' + safeSlug + '.md'
}

export function isRetiredSourceBranch(rows: Array<{ repository_url: string; branch: string }>, repositoryUrl: string, branch: string | null | undefined): boolean {
  return !!branch && rows.some((row) => row.repository_url.toLowerCase() === repositoryUrl.toLowerCase() && row.branch === branch)
}

export function parseRetiredBranchRows(text: string): Array<{ repository_url: string; branch: string; sha: string }> | null {
  const rows: Array<{ repository_url: string; branch: string; sha: string }> = []
  const seen = new Set<string>()
  let inSection = false
  for (const line of text.split('\n')) {
    if (/^## /.test(line)) {
      inSection = /^## Retired Branches(?:\s|$)/.test(line)
      continue
    }
    if (!inSection || !/^\s*-\s*/.test(line)) continue
    const match = line.match(/^\s*-\s*(https:\/\/github\.com\/[^\s|]+)\s*\|\s*branch=([^\s|]+)\s*\|\s*sha=([a-f0-9]{40})\s*\|\s*status=RETIRED\s*$/i)
    if (!match || !validIntegrationBranch(match[2])) return null
    const repo = normalizeGithubRepo(match[1])
    if (!repo) return null
    const key = repo.url.toLowerCase() + '|' + match[2]
    if (seen.has(key)) return null
    seen.add(key)
    rows.push({ repository_url: repo.url, branch: match[2], sha: match[3].toLowerCase() })
  }
  return rows
}
