import { createClient } from 'npm:@supabase/supabase-js@2'
import { edgeFunctionSlug } from './platform-utils.ts'

export const PROJECT_REF = 'fbyqktduoqlpbbtkghkf'
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? `https://${PROJECT_REF}.supabase.co`
export const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
export const AUTH_ISSUER = `${SUPABASE_URL}/auth/v1`
export const AUTH_SCOPES = ['email', 'profile']
export const BROWSER_BRIDGE_URL = Deno.env.get('GSA_BROWSER_BRIDGE_URL') ?? 'https://gpt-supper-agent.vercel.app/api/browser'

export function edgeFunctionBase(req: Request) {
  // Resource identity is public HTTPS even when the edge gateway forwards an internal HTTP URL.
  // Never derive an OAuth protected resource origin from untrusted proxy/request origin.
  return `https://${PROJECT_REF}.supabase.co/functions/v1/${edgeFunctionSlug(req)}`
}

export function mcpResource(req: Request) {
  return edgeFunctionBase(req) + '/mcp'
}

export function resourceMetadata(req: Request) {
  return edgeFunctionBase(req) + '/.well-known/oauth-protected-resource'
}

export function challenge(req: Request, error = 'invalid_token', description = 'Sign in to GPT Super Agent to continue') {
  return `Bearer resource_metadata="${resourceMetadata(req)}", scope="${AUTH_SCOPES.join(' ')}", error="${error}", error_description="${description}"`
}

export function authError(req: Request, description: string) {
  return {
    content: [{ type: 'text' as const, text: description }],
    isError: true,
    _meta: { 'mcp/www_authenticate': [challenge(req, 'invalid_token', description)] },
  }
}

export async function callBrowserBridge(req: Request, payload: Record<string, unknown>) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) throw new Error('Authentication required for browser QA.')

  const response = await fetch(BROWSER_BRIDGE_URL, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(110_000),
  })

  const text = await response.text()
  let data: any = null
  try { data = JSON.parse(text) } catch {
    throw new Error('Browser bridge returned invalid JSON (HTTP ' + response.status + ').')
  }

  if (!response.ok || !data?.ok) {
    throw new Error('Browser bridge failed: ' + String(data?.error ?? ('HTTP ' + response.status)))
  }

  return data
}

export async function authContext(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { token, user: data.user, supabase }
}
