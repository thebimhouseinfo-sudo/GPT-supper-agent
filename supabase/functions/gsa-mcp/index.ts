import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'

const PROJECT_REF = 'fbyqktduoqlpbbtkghkf'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? `https://${PROJECT_REF}.supabase.co`
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const MCP_RESOURCE = `${SUPABASE_URL}/functions/v1/gsa-mcp/mcp`
const RESOURCE_METADATA = `${SUPABASE_URL}/functions/v1/gsa-mcp/.well-known/oauth-protected-resource`
const AUTH_ISSUER = `${SUPABASE_URL}/auth/v1`
const AUTH_SCOPES = ['email', 'profile']

function challenge(error = 'invalid_token', description = 'Sign in to GPT Super Agent to continue') {
  return `Bearer resource_metadata="${RESOURCE_METADATA}", scope="${AUTH_SCOPES.join(' ')}", error="${error}", error_description="${description}"`
}

function extractDriveFolderId(input: string) {
  try {
    const url = new URL(input)
    if (url.hostname !== 'drive.google.com') return null

    const folderMatch = url.pathname.match(/\/folders\/([A-Za-z0-9_-]+)/)
    if (folderMatch?.[1]) return folderMatch[1]

    const id = url.searchParams.get('id')
    return id && /^[A-Za-z0-9_-]+$/.test(id) ? id : null
  } catch {
    return null
  }
}

function authError(description: string) {
  return {
    content: [{ type: 'text' as const, text: description }],
    isError: true,
    _meta: {
      'mcp/www_authenticate': [challenge('invalid_token', description)],
    },
  }
}

async function authContext(req: Request) {
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

function createServer(req: Request) {
  const server = new McpServer(
    { name: 'gpt-super-agent', version: '0.2.0' },
    {
      instructions:
        [
          'GPT Super Agent (GSA) runtime.',
          'User-facing fake CLI root is authoritative: PROJECT / DIRECT AGENT / SETTING / HELP.',
          'When the user types gsa/ or asks for the GSA root menu, call get_cli_root and render that menu. Do not expose raw MCP tool names such as get_profile/get_drive_config/set_drive_config as CLI commands.',
          'DIRECT AGENT contains Planner, Designer, Coder, Reviewer, Tester.',
          'SETTING contains GSA Account and Project Drive.',
          'Google Drive and GitHub are separate connected ChatGPT apps. A pasted provider URL is sufficient routing context; do not require @Google Drive or @GitHub.',
          'For Project Drive setup, create the probe INSIDE the pasted target folder, never in My Drive root when a target URL is supplied.',
          'After create_folder returns the probe id, delete it using Google Drive delete_file with URL https://drive.google.com/file/d/<PROBE_ID>/view. This file-resource URL form is required even when the probe is a folder.',
          'Only call set_drive_config with write_probe_passed=true after create and delete both succeed.',
          'GSA OAuth establishes only GSA user identity; it never owns Google Drive authentication or credentials.',
        ].join(' '),
    },
  )

  server.registerTool(
    'get_cli_root',
    {
      title: 'Show GSA root menu',
      description:
        'Call when the user types gsa/, gsa, asks for the GSA root page, or asks what GSA can do. Return the authoritative fake CLI root. Do not replace it with raw MCP tool names.',
      inputSchema: {},
      outputSchema: {
        root: z.array(z.string()),
        project: z.array(z.string()),
        direct_agent: z.array(z.string()),
        setting: z.array(z.string()),
        help: z.array(z.string()),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to use GPT Super Agent.')

      const menu = {
        root: ['PROJECT', 'DIRECT AGENT', 'SETTING', 'HELP'],
        project: ['list', 'open', 'create', 'status', 'pause', 'resume', 'archive', 'delete'],
        direct_agent: ['planner', 'designer', 'coder', 'reviewer', 'tester'],
        setting: ['GSA Account', 'Project Drive'],
        help: ['instruction', 'command help'],
      }

      return {
        structuredContent: menu,
        content: [{
          type: 'text',
          text:
            'GSA/\n' +
            '├── PROJECT\n' +
            '├── DIRECT AGENT\n' +
            '├── SETTING\n' +
            '└── HELP',
        }],
      }
    },
  )

  server.registerTool(
    'get_runtime_status',
    {
      title: 'Get GSA runtime status',
      description:
        'Verify that the authenticated GPT Super Agent MCP runtime is reachable.',
      inputSchema: {},
      outputSchema: {
        phase: z.string(),
        mcp: z.string(),
        auth: z.string(),
        project_drive: z.string(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to use GPT Super Agent.')

      const { data } = await auth.supabase
        .from('user_drive_config')
        .select('drive_root_folder_id')
        .eq('user_id', auth.user.id)
        .maybeSingle()

      const status = {
        phase: 'M1A_BOOTSTRAP_SPIKE',
        mcp: 'SERVER_DEPLOYED',
        auth: 'AUTHENTICATED',
        project_drive: data?.drive_root_folder_id ? 'CONFIGURED' : 'NOT_CONFIGURED',
      }
      return {
        structuredContent: status,
        content: [{ type: 'text', text: JSON.stringify(status) }],
      }
    },
  )

  server.registerTool(
    'get_profile',
    {
      title: 'Get connected GSA account',
      description:
        'Return the authenticated GPT Super Agent account identity. Use to confirm which account is connected before user-specific work.',
      inputSchema: {},
      outputSchema: {
        user_id: z.string(),
        email: z.string().nullable(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: {
        securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
        'openai/profile': true,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to read the connected GSA account.')

      const result = { user_id: auth.user.id, email: auth.user.email ?? null }
      return {
        structuredContent: result,
        content: [{ type: 'text', text: JSON.stringify(result) }],
      }
    },
  )

  server.registerTool(
    'get_drive_config',
    {
      title: 'Get Project Drive configuration',
      description:
        'Read the current user\'s configured Google Drive Project root. The returned folder ID is runtime configuration, not chat memory.',
      inputSchema: {},
      outputSchema: {
        configured: z.boolean(),
        drive_root_folder_id: z.string().nullable(),
        drive_root_name: z.string().nullable(),
        email: z.string().nullable(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to read Project Drive configuration.')

      const { data, error } = await auth.supabase
        .from('user_drive_config')
        .select('email, drive_root_folder_id, drive_root_name')
        .eq('user_id', auth.user.id)
        .maybeSingle()

      if (error) {
        return {
          content: [{ type: 'text', text: `Failed to read Project Drive configuration: ${error.message}` }],
          isError: true,
        }
      }

      const result = {
        configured: Boolean(data?.drive_root_folder_id),
        drive_root_folder_id: data?.drive_root_folder_id ?? null,
        drive_root_name: data?.drive_root_name ?? null,
        email: data?.email ?? auth.user.email ?? null,
      }
      return {
        structuredContent: result,
        content: [{ type: 'text', text: JSON.stringify(result) }],
      }
    },
  )

  server.registerTool(
    'set_drive_config',
    {
      title: 'Set Project Drive configuration',
      description:
        'Store the current user\'s Google Drive Project root from a pasted Google Drive folder URL after the connected Google Drive app has successfully completed a temporary write/delete probe. The server extracts and stores the canonical folder ID.',
      inputSchema: {
        drive_root_url: z.string().url(),
        drive_root_name: z.string().min(1).optional(),
        write_probe_passed: z.literal(true),
      },
      outputSchema: {
        saved: z.boolean(),
        user_id: z.string(),
        drive_root_folder_id: z.string(),
        drive_root_url: z.string(),
        drive_root_name: z.string().nullable(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    } as any,
    async ({ drive_root_url, drive_root_name, write_probe_passed }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to change Project Drive configuration.')
      if (write_probe_passed !== true) {
        return {
          content: [{ type: 'text', text: 'Project Drive write/delete probe must pass before saving configuration.' }],
          isError: true,
        }
      }

      const drive_root_folder_id = extractDriveFolderId(drive_root_url)
      if (!drive_root_folder_id) {
        return {
          content: [{ type: 'text', text: 'A valid Google Drive folder URL is required.' }],
          isError: true,
        }
      }

      const canonicalUrl = `https://drive.google.com/drive/folders/${drive_root_folder_id}`

      const payload = {
        user_id: auth.user.id,
        email: auth.user.email ?? '',
        drive_root_folder_id,
        drive_root_name: drive_root_name ?? null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await auth.supabase
        .from('user_drive_config')
        .upsert(payload, { onConflict: 'user_id' })
        .select('user_id, drive_root_folder_id, drive_root_name')
        .single()

      if (error) {
        return {
          content: [{ type: 'text', text: `Failed to save Project Drive configuration: ${error.message}` }],
          isError: true,
        }
      }

      const result = {
        saved: true,
        user_id: data.user_id,
        drive_root_folder_id: data.drive_root_folder_id,
        drive_root_url: canonicalUrl,
        drive_root_name: data.drive_root_name,
      }

      return {
        structuredContent: result,
        content: [{ type: 'text', text: JSON.stringify(result) }],
      }
    },
  )

  return server
}

const root = new Hono()
const app = new Hono()

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'gpt-super-agent',
    phase: 'M1A',
    oauth_private_tools: true,
  }),
)

app.get('/.well-known/oauth-protected-resource', (c) =>
  c.json({
    resource: MCP_RESOURCE,
    authorization_servers: [AUTH_ISSUER],
    scopes_supported: AUTH_SCOPES,
  }),
)

app.all('/mcp', async (c) => {
  const authHeader = c.req.raw.headers.get('Authorization') ?? ''

  if (!authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: 'unauthorized',
        error_description: 'Connect your GPT Super Agent account to continue.',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': challenge(
            'invalid_token',
            'Connect your GPT Super Agent account to continue',
          ),
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  const transport = new WebStandardStreamableHTTPServerTransport()
  const server = createServer(c.req.raw)
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

root.route('/gsa-mcp', app)
Deno.serve(root.fetch)
