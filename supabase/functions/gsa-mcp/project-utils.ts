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
