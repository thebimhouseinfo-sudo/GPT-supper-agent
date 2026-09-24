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

function ancestryContainsRoot(chain: string[] | undefined, rootId: string) {
  return Array.isArray(chain) && chain.includes(rootId)
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
          'User-facing fake CLI root is authoritative: PROJECT / DIRECT AGENT / SETTING / HELP. Root groups have no shortcuts.',
          'When the user types gsa/ or asks for the GSA root menu, call get_cli_root and render the authoritative menu including each subcommand shortcut and short description. Do not expose raw MCP tool names such as get_profile/get_drive_config/set_drive_config as CLI commands.',
          'Stable subcommand aliases: PROJECT list=ls, open=op, create=new, status=st, pause=pa, resume=rs, archive=ar, delete=rm; DIRECT AGENT planner=pl, designer=ds, coder=cd, reviewer=rv, tester=ts; SETTING GSA Account=acct, Project Drive=drive; HELP instruction=guide, command help=help.',
          'Treat a shortcut exactly as its canonical subcommand. Do not invent additional aliases.',
          'DIRECT AGENT contains Planner, Designer, Coder, Reviewer, Tester.',
          'SETTING contains GSA Account and Project Drive.',
          'Google Drive and GitHub are separate connected ChatGPT apps. A pasted provider URL is sufficient routing context; do not require @Google Drive or @GitHub.',
          'For Project Drive setup, first resolve the REAL connected Google Drive account with the Google Drive get_profile tool. Never infer the Drive account from the GSA/Supabase email; the two identities may differ.',
          'Then call Google Drive get_file_metadata on the pasted target folder and inspect its permissions. If the connected Drive email has role owner, writer, organizer, or fileOrganizer, write access is verified non-destructively.',
          'Only when permission metadata is insufficient may you fall back to a create/delete probe. If a fallback probe is needed, create it INSIDE the pasted target folder and delete it with https://drive.google.com/file/d/<PROBE_ID>/view.',
          'Call set_drive_config with write_access_verified=true after metadata verification, or with write_probe_passed=true only after a fallback create/delete probe fully succeeds.',
          'HARD DRIVE SANDBOX: after Project Drive is configured, every GSA-initiated Google Drive mutation must stay inside that configured folder or its proven descendants. Never use the literal Drive parent root. Never mutate ancestors, siblings, or unrelated items.',
          'Before any Drive mutation, call get_drive_config, resolve target/parent IDs and ancestry, then call authorize_drive_mutation. Proceed to the external Google Drive mutation only when the guard returns allowed=true. If ancestry is missing, ambiguous, or outside the root, STOP.',
          'CREATE: parent must be the configured Project Drive root or a proven descendant. Setup/probe creation may only be a direct child of the selected Project Drive.',
          'MOVE: source and destination must both be inside the same Project Drive boundary. Cross-boundary moves are forbidden.',
          'DELETE: never delete by name. Automatic delete is allowed only for an exact Drive ID created by GSA in the same Run and still inside Project Drive. Deleting any pre-existing user item requires an explicit Human Gate naming the exact Drive ID.',
          'Fallback probe: create one direct child under Project Drive, capture the returned ID, and delete only that same ID. Never create at My Drive root and never move the probe.',
          'PROVEN DRIVE PROBE FLOW: create the probe directly under the target Project Drive URL using Google Drive create_folder(parent_folder=<target URL>); capture the returned item ID; remove only that newly created item using Google Drive delete_file with the connector-supported file-resource URL form built from the returned ID; never move the probe and never use My Drive root.',
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
        root: z.array(z.object({
          command: z.string(),
          description: z.string(),
        })),
        project: z.array(z.object({
          command: z.string(),
          shortcut: z.string(),
          description: z.string(),
        })),
        direct_agent: z.array(z.object({
          command: z.string(),
          shortcut: z.string(),
          description: z.string(),
        })),
        setting: z.array(z.object({
          command: z.string(),
          shortcut: z.string(),
          description: z.string(),
        })),
        help: z.array(z.object({
          command: z.string(),
          shortcut: z.string(),
          description: z.string(),
        })),
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
        root: [
          { command: 'PROJECT', description: 'Manage Projects and their lifecycle.' },
          { command: 'DIRECT AGENT', description: 'Call a specialist role directly.' },
          { command: 'SETTING', description: 'Manage GSA account and Project Drive.' },
          { command: 'HELP', description: 'Show instructions and command reference.' },
        ],
        project: [
          { command: 'list', shortcut: 'ls', description: 'List available Projects.' },
          { command: 'open', shortcut: 'op', description: 'Open a Project by handle or exact target.' },
          { command: 'create', shortcut: 'new', description: 'Create a new Project.' },
          { command: 'status', shortcut: 'st', description: 'Show current Project status.' },
          { command: 'pause', shortcut: 'pa', description: 'Pause the active Project.' },
          { command: 'resume', shortcut: 'rs', description: 'Resume a paused Project.' },
          { command: 'archive', shortcut: 'ar', description: 'Archive a Project without deleting its source repo.' },
          { command: 'delete', shortcut: 'rm', description: 'Delete Project Memory only after explicit confirmation.' },
        ],
        direct_agent: [
          { command: 'planner', shortcut: 'pl', description: 'Plan scope, tasks, dependencies and gates.' },
          { command: 'designer', shortcut: 'ds', description: 'Define UI/UX and asset requirements.' },
          { command: 'coder', shortcut: 'cd', description: 'Implement approved source changes.' },
          { command: 'reviewer', shortcut: 'rv', description: 'Run context-isolated review.' },
          { command: 'tester', shortcut: 'ts', description: 'Verify behavior and evidence.' },
        ],
        setting: [
          { command: 'GSA Account', shortcut: 'acct', description: 'Show the authenticated GSA account.' },
          { command: 'Project Drive', shortcut: 'drive', description: 'View or configure the Project Drive root.' },
        ],
        help: [
          { command: 'instruction', shortcut: 'guide', description: 'Show how GSA is intended to be used.' },
          { command: 'command help', shortcut: 'help', description: 'Show command syntax and aliases.' },
        ],
      }

      const formatGroup = (
        title: string,
        description: string,
        items: Array<{ command: string; shortcut: string; description: string }>,
      ) =>
        title + ' — ' + description + '\n' +
        items.map((item) =>
          '  • ' + item.command + ' [' + item.shortcut + '] — ' + item.description
        ).join('\n')

      const text =
        'GSA/\n' +
        formatGroup('PROJECT', menu.root[0].description, menu.project) + '\n' +
        formatGroup('DIRECT AGENT', menu.root[1].description, menu.direct_agent) + '\n' +
        formatGroup('SETTING', menu.root[2].description, menu.setting) + '\n' +
        formatGroup('HELP', menu.root[3].description, menu.help)

      return {
        structuredContent: menu,
        content: [{ type: 'text', text }],
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
        drive_root_url: z.string().nullable(),
        drive_root_name: z.string().nullable(),
        gsa_account_email: z.string().nullable(),
        mutation_scope: z.string(),
        mutation_policy: z.array(z.string()),
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

      const configured = Boolean(data?.drive_root_folder_id)
      const driveRootId = data?.drive_root_folder_id ?? null
      const result = {
        configured,
        drive_root_folder_id: driveRootId,
        drive_root_url: driveRootId
          ? `https://drive.google.com/drive/folders/${driveRootId}`
          : null,
        drive_root_name: data?.drive_root_name ?? null,
        gsa_account_email: data?.email ?? auth.user.email ?? null,
        mutation_scope: configured
          ? 'PROJECT_DRIVE_ROOT_AND_PROVEN_DESCENDANTS_ONLY'
          : 'NO_DRIVE_MUTATION_UNTIL_PROJECT_DRIVE_CONFIGURED',
        mutation_policy: [
          'FORBID_DRIVE_ROOT_ALIAS',
          'FORBID_OUTSIDE_ROOT_MUTATION',
          'FORBID_CROSS_BOUNDARY_MOVE',
          'FORBID_DELETE_BY_NAME',
          'AUTO_DELETE_ONLY_SAME_RUN_GSA_CREATED_EXACT_ID',
          'PREEXISTING_DELETE_REQUIRES_EXPLICIT_HUMAN_GATE',
          'FAIL_CLOSED_ON_UNKNOWN_ANCESTRY',
        ],
      }
      return {
        structuredContent: result,
        content: [{ type: 'text', text: JSON.stringify(result) }],
      }
    },
  )

  server.registerTool(
    'authorize_drive_mutation',
    {
      title: 'Authorize Drive mutation inside Project Drive sandbox',
      description:
        'Mandatory guard before any GSA-initiated Google Drive create/update/move/delete. Reads the configured Project Drive root and fails closed unless supplied ancestry proves the mutation stays inside that boundary.',
      inputSchema: {
        operation: z.enum(['create', 'update', 'move', 'delete']),
        target_id: z.string().min(1).optional(),
        target_ancestry: z.array(z.string().min(1)).optional(),
        destination_parent_id: z.string().min(1).optional(),
        destination_ancestry: z.array(z.string().min(1)).optional(),
        created_by_gsa_same_run: z.boolean().optional(),
        human_gate_approved: z.boolean().optional(),
      },
      outputSchema: {
        allowed: z.boolean(),
        reason: z.string(),
        drive_root_folder_id: z.string().nullable(),
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    } as any,
    async ({
      operation,
      target_id,
      target_ancestry,
      destination_parent_id,
      destination_ancestry,
      created_by_gsa_same_run,
      human_gate_approved,
    }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to authorize Drive mutation.')

      const { data, error } = await auth.supabase
        .from('user_drive_config')
        .select('drive_root_folder_id')
        .eq('user_id', auth.user.id)
        .maybeSingle()

      if (error || !data?.drive_root_folder_id) {
        return {
          structuredContent: {
            allowed: false,
            reason: 'Project Drive is not configured. Drive mutation is blocked.',
            drive_root_folder_id: null,
          },
          content: [{ type: 'text', text: 'DENY: Project Drive is not configured.' }],
        }
      }

      const rootId = data.drive_root_folder_id as string
      const targetInside =
        target_id === rootId || ancestryContainsRoot(target_ancestry, rootId)
      const destinationInside =
        destination_parent_id === rootId ||
        ancestryContainsRoot(destination_ancestry, rootId)

      let allowed = false
      let reason = 'Mutation denied by Project Drive sandbox.'

      if (operation === 'create') {
        allowed = destinationInside
        reason = allowed
          ? 'Create parent is inside Project Drive.'
          : 'Create parent is outside or not proven inside Project Drive.'
      } else if (operation === 'update') {
        allowed = targetInside
        reason = allowed
          ? 'Update target is inside Project Drive.'
          : 'Update target is outside or not proven inside Project Drive.'
      } else if (operation === 'move') {
        allowed =
          targetInside &&
          destinationInside &&
          target_id !== rootId
        reason = allowed
          ? 'Move source and destination are inside the same Project Drive boundary.'
          : 'Cross-boundary move, Project Drive root move, or unproven ancestry is forbidden.'
      } else if (operation === 'delete') {
        allowed =
          targetInside &&
          target_id !== rootId &&
          (created_by_gsa_same_run === true || human_gate_approved === true)
        reason = allowed
          ? 'Delete target is inside Project Drive and has required deletion authority.'
          : 'Delete denied: target outside/unproven, Project Drive root, or lacks same-Run creation evidence / explicit Human Gate.'
      }

      return {
        structuredContent: {
          allowed,
          reason,
          drive_root_folder_id: rootId,
        },
        content: [{
          type: 'text',
          text: `${allowed ? 'ALLOW' : 'DENY'}: ${reason}`,
        }],
      }
    },
  )

  server.registerTool(
    'set_drive_config',
    {
      title: 'Set Project Drive configuration',
      description:
        'Store the current user\'s Google Drive Project root from a pasted Google Drive folder URL after write authority has been verified. Preferred verification is connected-Drive-profile plus target-folder permission metadata; a create/delete probe is fallback only. The server extracts and stores the canonical folder ID.',
      inputSchema: {
        drive_root_url: z.string().url(),
        drive_root_name: z.string().min(1).optional(),
        write_access_verified: z.literal(true).optional(),
        write_probe_passed: z.literal(true).optional(),
        verification_method: z.enum(['permission_metadata', 'create_delete_probe']).optional(),
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
    async ({ drive_root_url, drive_root_name, write_access_verified, write_probe_passed, verification_method }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to change Project Drive configuration.')

      const verified = write_access_verified === true || write_probe_passed === true
      if (!verified) {
        return {
          content: [{ type: 'text', text: 'Project Drive write authority must be verified before saving configuration. Prefer Drive profile + folder permission metadata; use create/delete probe only as fallback.' }],
          isError: true,
        }
      }

      if (verification_method === 'permission_metadata' && write_access_verified !== true) {
        return {
          content: [{ type: 'text', text: 'permission_metadata verification requires write_access_verified=true.' }],
          isError: true,
        }
      }

      if (verification_method === 'create_delete_probe' && write_probe_passed !== true) {
        return {
          content: [{ type: 'text', text: 'create_delete_probe verification requires write_probe_passed=true.' }],
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
