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

function uuidv7() {
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

function projectHandle(projectId: string) {
  return 'P-' + projectId.replace(/-/g, '').slice(-4).toUpperCase()
}

function normalizeRepoUrl(input: string) {
  try {
    const url = new URL(input)
    if (url.hostname !== 'github.com') return null
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/')
    if (parts.length < 2 || !parts[0] || !parts[1]) return null
    return 'https://github.com/' + parts[0] + '/' + parts[1].replace(/\.git$/, '')
  } catch {
    return null
  }
}

function safeProjectName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').slice(0,120)
}

function buildProjectManifest(args: {
  projectId: string
  name: string
  lifecycle: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  repoUrl: string
  purpose?: string | null
  createdAt: string
  updatedAt: string
}) {
  const purpose = (args.purpose ?? '').replace(/\r?\n/g, ' ').trim()
  return [
    '---',
    'project_id: ' + args.projectId,
    'name: ' + args.name,
    'lifecycle: ' + args.lifecycle,
    'created_at: ' + args.createdAt,
    'updated_at: ' + args.updatedAt,
    'repo_relation: OWNED',
    'repo_url: ' + args.repoUrl,
    purpose ? 'purpose: ' + purpose : 'purpose:',
    '---',
    '',
    '# Project: ' + args.name,
    '',
    '## Repository',
    '- OWNED: ' + args.repoUrl,
    '',
    '## Runtime',
    '- Project Memory lives in this Google Drive folder.',
    '- Source truth lives in the repository above.',
    '',
  ].join('\n')
}

function parseProjectManifest(text: string) {
  const values: Record<string, string> = {}
  for (const rawLine of text.split('\n')) {
    const idx = rawLine.indexOf(':')
    if (idx <= 0) continue
    const key = rawLine.slice(0, idx).trim()
    const value = rawLine.slice(idx + 1).trim()
    values[key] = value
  }
  const project_id = values.project_id ?? ''
  const name = values.name ?? ''
  const lifecycle = values.lifecycle ?? ''
  const repo_url = values.repo_url ?? ''
  const purpose = values.purpose ?? ''
  const created_at = values.created_at ?? ''
  const updated_at = values.updated_at ?? ''
  if (!project_id || !name || !repo_url || !['ACTIVE','PAUSED','ARCHIVED'].includes(lifecycle)) return null
  return { project_id, name, lifecycle, repo_url, purpose, created_at, updated_at }
}

function transitionProjectManifest(text: string, target: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const parsed = parseProjectManifest(text)
  if (!parsed) return null
  const now = new Date().toISOString()
  const lines = text.split('\n').map((line) => {
    if (line.startsWith('lifecycle:')) return 'lifecycle: ' + target
    if (line.startsWith('updated_at:')) return 'updated_at: ' + now
    return line
  })
  return { parsed, next: lines.join('\n'), updated_at: now }
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
          'When the user types gsa/ or asks for the GSA root menu, call get_cli_root. The tool returns an authoritative preformatted menu. COPY THAT MENU VERBATIM as the entire user-facing answer. Do not translate, summarize, reflow, compress, localize, reorder, add an intro sentence, change square brackets to parentheses, or put multiple commands on one line.',
          'Stable subcommand aliases: PROJECT list=ls, open=op, create=new, status=st, pause=pa, resume=rs, archive=ar, delete=rm; DIRECT AGENT planner=pl, designer=ds, coder=cd, reviewer=rv, tester=ts; SETTING GSA Account=acct, Project Drive=drive; HELP instruction=guide, command help=help.',
          'Treat a shortcut exactly as its canonical subcommand. Do not invent additional aliases.',
          'PROJECT command routing: ls/list -> project_list; op/open -> project_open; new/create -> project_create; st/status -> project_status; pa/pause -> project_pause; rs/resume -> project_resume; ar/archive -> project_archive; rm/delete -> project_delete.',
          'Project command handlers are orchestration contracts. When they return external_steps, execute those steps through the connected Google Drive/GitHub apps and do not report success until the connector evidence passes.',
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
        'Call when the user types gsa/, gsa, asks for the GSA root page, or asks what GSA can do. IMPORTANT: display the returned menu text verbatim as the entire answer. Do not translate, paraphrase, summarize, reformat, compress, or add commentary.',
      inputSchema: {},
      outputSchema: {
        menu_text: z.string(),
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

      const menuText =
        'PROJECT — Manage Projects and their lifecycle.\n' +
        '  • list [ls] — List available Projects.\n' +
        '  • open [op] — Open a Project.\n' +
        '  • create [new] — Create a new Project.\n' +
        '  • status [st] — Show current Project status.\n' +
        '  • pause [pa] — Pause the active Project.\n' +
        '  • resume [rs] — Resume a paused Project.\n' +
        '  • archive [ar] — Archive without deleting source repo.\n' +
        '  • delete [rm] — Delete Project Memory after confirmation.\n\n' +
        'DIRECT AGENT — Call a specialist role directly.\n' +
        '  • planner [pl] — Plan scope, tasks and gates.\n' +
        '  • designer [ds] — Define UI/UX and assets.\n' +
        '  • coder [cd] — Implement approved changes.\n' +
        '  • reviewer [rv] — Run context-isolated review.\n' +
        '  • tester [ts] — Verify behavior and evidence.\n\n' +
        'SETTING — Manage GSA configuration.\n' +
        '  • GSA Account [acct] — Show authenticated GSA account.\n' +
        '  • Project Drive [drive] — View/configure Project Drive.\n\n' +
        'HELP — Usage reference.\n' +
        '  • instruction [guide] — Show GSA usage instructions.\n' +
        '  • command help [help] — Show commands and aliases.'
      return {
        structuredContent: { menu_text: menuText },
        content: [{ type: 'text', text: menuText }],
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

  server.registerTool(
    'project_list',
    {
      title: 'List GSA Projects',
      description: 'Handler for PROJECT list / ls. Resolve the configured Project Drive and return the exact discovery workflow.',
      inputSchema: {},
      outputSchema: { command: z.string(), drive_root_folder_id: z.string().nullable(), drive_root_url: z.string().nullable(), external_steps: z.array(z.string()) },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    } as any,
    async () => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to list Projects.')
      const { data, error } = await auth.supabase.from('user_drive_config').select('drive_root_folder_id').eq('user_id', auth.user.id).maybeSingle()
      if (error) return { content: [{ type: 'text', text: 'Failed to resolve Project Drive: ' + error.message }], isError: true }
      const rootId = data?.drive_root_folder_id ?? null
      const rootUrl = rootId ? 'https://drive.google.com/drive/folders/' + rootId : null
      const result = {
        command: 'PROJECT list [ls]',
        drive_root_folder_id: rootId,
        drive_root_url: rootUrl,
        external_steps: rootUrl ? [
          'Google Drive: list_folder on drive_root_url, direct children only.',
          'For each candidate folder, require exactly one PROJECT.md child; zero means not a Project and multiple means collision/conflict.',
          'Read PROJECT.md; include ACTIVE and PAUSED. Hide ARCHIVED unless explicitly requested.',
          'Return compact choices with Project name, lifecycle and handle. Never guess between duplicates.',
        ] : ['Project Drive is not configured. Run SETTING -> Project Drive first.'],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_create',
    {
      title: 'Create a GSA Project',
      description: 'Handler for PROJECT create / new. Produce canonical Project identity, PROJECT.md and exact external connector steps.',
      inputSchema: { name: z.string().min(1), repository_url: z.string().url(), purpose: z.string().optional() },
      outputSchema: {
        command: z.string(), project_id: z.string(), handle: z.string(), project_name: z.string(), project_folder_name: z.string(),
        lifecycle: z.string(), repository_url: z.string(), project_drive_root_id: z.string(), project_drive_root_url: z.string(),
        project_manifest_text: z.string(), required_folders: z.array(z.string()), external_steps: z.array(z.string())
      },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ name, repository_url, purpose }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to create a Project.')
      const repoUrl = normalizeRepoUrl(repository_url)
      if (!repoUrl) return { content: [{ type: 'text', text: 'A canonical GitHub repository URL is required.' }], isError: true }
      const { data, error } = await auth.supabase.from('user_drive_config').select('drive_root_folder_id').eq('user_id', auth.user.id).maybeSingle()
      if (error || !data?.drive_root_folder_id) return { content: [{ type: 'text', text: 'Project Drive is not configured. Configure SETTING -> Project Drive before creating a Project.' }], isError: true }
      const projectId = uuidv7()
      const handle = projectHandle(projectId)
      const cleanName = safeProjectName(name)
      const now = new Date().toISOString()
      const rootId = data.drive_root_folder_id as string
      const rootUrl = 'https://drive.google.com/drive/folders/' + rootId
      const manifest = buildProjectManifest({ projectId, name: cleanName, lifecycle: 'ACTIVE', repoUrl, purpose: purpose ?? null, createdAt: now, updatedAt: now })
      const result = {
        command: 'PROJECT create [new]',
        project_id: projectId, handle, project_name: cleanName, project_folder_name: cleanName, lifecycle: 'ACTIVE', repository_url: repoUrl,
        project_drive_root_id: rootId, project_drive_root_url: rootUrl, project_manifest_text: manifest,
        required_folders: ['WORK','WORK/jobs','WORK/runs','WORK/handoffs','WORK/gates','WORK/assets','WORK/releases','KNOWLEDGE','VERIFICATION'],
        external_steps: [
          'GitHub: resolve repository_url and verify the repository is accessible. Read only during Project creation.',
          'Google Drive: list direct children of project_drive_root_url and refuse/ask if the intended Project folder target is ambiguous.',
          'Call authorize_drive_mutation(operation=create, destination_parent_id=project_drive_root_id, destination_ancestry=[project_drive_root_id]); continue only on ALLOW.',
          'Google Drive: create the Project folder directly under project_drive_root_url. Never use My Drive root.',
          'Create every required_folders entry as descendants of the new Project folder only.',
          'Create exactly one PROJECT.md inside the Project folder using an in-folder copy/upload/template route; write project_manifest_text into it.',
          'Verify exactly one PROJECT.md exists and all required folders exist.',
          'Read PROJECT.md back and verify project_id, repository_url and lifecycle=ACTIVE before reporting success.',
        ],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_open',
    {
      title: 'Open a GSA Project',
      description: 'Handler for PROJECT open / op. Validate an exact PROJECT.md already read from the selected Drive Project folder.',
      inputSchema: { project_folder_url: z.string().url(), project_manifest_text: z.string().min(1) },
      outputSchema: { command: z.string(), project_id: z.string(), handle: z.string(), name: z.string(), lifecycle: z.string(), repository_url: z.string(), project_folder_url: z.string(), openable: z.boolean(), warning: z.string().nullable() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ project_folder_url, project_manifest_text }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to open a Project.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract. Project open is blocked.' }], isError: true }
      const result = { command: 'PROJECT open [op]', project_id: parsed.project_id, handle: projectHandle(parsed.project_id), name: parsed.name, lifecycle: parsed.lifecycle, repository_url: parsed.repo_url, project_folder_url, openable: parsed.lifecycle !== 'ARCHIVED', warning: parsed.lifecycle === 'ARCHIVED' ? 'Project is ARCHIVED.' : null }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_status',
    {
      title: 'Show GSA Project status',
      description: 'Handler for PROJECT status / st. Parse PROJECT.md and return lifecycle/source facts.',
      inputSchema: { project_manifest_text: z.string().min(1) },
      outputSchema: { command: z.string(), project_id: z.string(), handle: z.string(), name: z.string(), lifecycle: z.string(), repository_url: z.string(), phase_detail: z.string() },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    } as any,
    async ({ project_manifest_text }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to show Project status.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      const result = { command: 'PROJECT status [st]', project_id: parsed.project_id, handle: projectHandle(parsed.project_id), name: parsed.name, lifecycle: parsed.lifecycle, repository_url: parsed.repo_url, phase_detail: 'M1B lifecycle status; Job/Run/CONTROL enrichment is added by later milestones.' }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_pause',
    {
      title: 'Pause a GSA Project',
      description: 'Handler for PROJECT pause / pa. Return exact updated PROJECT.md text for in-place update by exact Drive document ID.',
      inputSchema: { project_manifest_text: z.string().min(1) },
      outputSchema: { command: z.string(), from: z.string(), to: z.string(), updated_manifest_text: z.string(), external_steps: z.array(z.string()) },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    } as any,
    async ({ project_manifest_text }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to pause a Project.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      if (parsed.lifecycle === 'ARCHIVED') return { content: [{ type: 'text', text: 'ARCHIVED Project cannot be paused.' }], isError: true }
      const tr = transitionProjectManifest(project_manifest_text, 'PAUSED')!
      const result = { command: 'PROJECT pause [pa]', from: parsed.lifecycle, to: 'PAUSED', updated_manifest_text: tr.next, external_steps: ['Update the existing PROJECT.md by exact Drive document ID; do not create a second PROJECT.md.','Read PROJECT.md back and verify lifecycle=PAUSED.','Block consequential Project work while PAUSED.'] }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_resume',
    {
      title: 'Resume a GSA Project',
      description: 'Handler for PROJECT resume / rs. Resume only a PAUSED Project.',
      inputSchema: { project_manifest_text: z.string().min(1) },
      outputSchema: { command: z.string(), from: z.string(), to: z.string(), updated_manifest_text: z.string(), external_steps: z.array(z.string()) },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    } as any,
    async ({ project_manifest_text }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to resume a Project.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      if (parsed.lifecycle !== 'PAUSED') return { content: [{ type: 'text', text: 'Only PAUSED Projects can resume; current lifecycle=' + parsed.lifecycle + '.' }], isError: true }
      const tr = transitionProjectManifest(project_manifest_text, 'ACTIVE')!
      const result = { command: 'PROJECT resume [rs]', from: 'PAUSED', to: 'ACTIVE', updated_manifest_text: tr.next, external_steps: ['Update the existing PROJECT.md by exact Drive document ID.','Read PROJECT.md back and verify lifecycle=ACTIVE before consequential work.'] }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_archive',
    {
      title: 'Archive a GSA Project',
      description: 'Handler for PROJECT archive / ar. Archive Project Memory without deleting or modifying source repository.',
      inputSchema: { project_manifest_text: z.string().min(1) },
      outputSchema: { command: z.string(), from: z.string(), to: z.string(), updated_manifest_text: z.string(), external_steps: z.array(z.string()) },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    } as any,
    async ({ project_manifest_text }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to archive a Project.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      const tr = transitionProjectManifest(project_manifest_text, 'ARCHIVED')!
      const result = { command: 'PROJECT archive [ar]', from: parsed.lifecycle, to: 'ARCHIVED', updated_manifest_text: tr.next, external_steps: ['Update the existing PROJECT.md by exact Drive document ID.','Read PROJECT.md back and verify lifecycle=ARCHIVED.','Do not delete or alter GitHub source repository.','Default PROJECT list must hide this Project.'] }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'project_delete',
    {
      title: 'Delete GSA Project Memory',
      description: 'Handler for PROJECT delete / rm. Never deletes source repository and requires explicit human confirmation.',
      inputSchema: { project_folder_id: z.string().min(1), project_manifest_text: z.string().min(1), project_root_ancestry: z.array(z.string().min(1)), confirmed: z.boolean() },
      outputSchema: { command: z.string(), allowed: z.boolean(), project_id: z.string().nullable(), reason: z.string(), external_steps: z.array(z.string()) },
      securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }],
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: AUTH_SCOPES }] },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    } as any,
    async ({ project_folder_id, project_manifest_text, project_root_ancestry, confirmed }: any) => {
      const auth = await authContext(req)
      if (!auth) return authError('Authentication required to delete Project Memory.')
      const parsed = parseProjectManifest(project_manifest_text)
      if (!parsed) return { content: [{ type: 'text', text: 'Invalid PROJECT.md contract.' }], isError: true }
      if (confirmed !== true) {
        const result = { command: 'PROJECT delete [rm]', allowed: false, project_id: parsed.project_id, reason: 'Explicit human confirmation is required. This deletes Project Memory only; the GitHub repository is never deleted.', external_steps: ['Show exact Project name, Project ID, Drive folder ID and source repository URL; ask the human to confirm deletion.'] }
        return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
      }
      const { data } = await auth.supabase.from('user_drive_config').select('drive_root_folder_id').eq('user_id', auth.user.id).maybeSingle()
      const rootId = data?.drive_root_folder_id ?? null
      const inside = Boolean(rootId && ancestryContainsRoot(project_root_ancestry, rootId))
      const result = {
        command: 'PROJECT delete [rm]',
        allowed: inside,
        project_id: parsed.project_id,
        reason: inside ? 'Human confirmed and Project folder ancestry is inside configured Project Drive. Source repository remains untouched.' : 'Delete blocked because Project folder ancestry is not proven inside configured Project Drive.',
        external_steps: inside ? ['Call authorize_drive_mutation for exact project_folder_id with human_gate_approved=true.','Proceed only on ALLOW.','Google Drive: delete exactly project_folder_id, never by name.','Verify Project folder no longer exists.','Do not mutate GitHub source.'] : [],
      }
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] }
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
, 'm'))
    return match?.[1]?.trim() ?? ''
  }
  const project_id = read('project_id')
  const name = read('name')
  const lifecycle = read('lifecycle')
  const repo_url = read('repo_url')
  const purpose = read('purpose')
  const created_at = read('created_at')
  const updated_at = read('updated_at')
  if (!project_id || !name || !repo_url || !['ACTIVE','PAUSED','ARCHIVED'].includes(lifecycle)) return null
  return { project_id, name, lifecycle, repo_url, purpose, created_at, updated_at }
}

function transitionProjectManifest(text: string, target: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const parsed = parseProjectManifest(text)
  if (!parsed) return null
  const now = new Date().toISOString()
  let next = text.replace(/^lifecycle:\s*.*$/m, 'lifecycle: ' + target)
  if (/^updated_at:/m.test(next)) next = next.replace(/^updated_at:\s*.*$/m, 'updated_at: ' + now)
  return { parsed, next, updated_at: now }
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
          'When the user types gsa/ or asks for the GSA root menu, call get_cli_root. The tool returns an authoritative preformatted menu. COPY THAT MENU VERBATIM as the entire user-facing answer. Do not translate, summarize, reflow, compress, localize, reorder, add an intro sentence, change square brackets to parentheses, or put multiple commands on one line.',
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
        'Call when the user types gsa/, gsa, asks for the GSA root page, or asks what GSA can do. IMPORTANT: display the returned menu text verbatim as the entire answer. Do not translate, paraphrase, summarize, reformat, compress, or add commentary.',
      inputSchema: {},
      outputSchema: {
        menu_text: z.string(),
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

      const menuText =
        'PROJECT — Manage Projects and their lifecycle.\n' +
        '  • list [ls] — List available Projects.\n' +
        '  • open [op] — Open a Project.\n' +
        '  • create [new] — Create a new Project.\n' +
        '  • status [st] — Show current Project status.\n' +
        '  • pause [pa] — Pause the active Project.\n' +
        '  • resume [rs] — Resume a paused Project.\n' +
        '  • archive [ar] — Archive without deleting source repo.\n' +
        '  • delete [rm] — Delete Project Memory after confirmation.\n\n' +
        'DIRECT AGENT — Call a specialist role directly.\n' +
        '  • planner [pl] — Plan scope, tasks and gates.\n' +
        '  • designer [ds] — Define UI/UX and assets.\n' +
        '  • coder [cd] — Implement approved changes.\n' +
        '  • reviewer [rv] — Run context-isolated review.\n' +
        '  • tester [ts] — Verify behavior and evidence.\n\n' +
        'SETTING — Manage GSA configuration.\n' +
        '  • GSA Account [acct] — Show authenticated GSA account.\n' +
        '  • Project Drive [drive] — View/configure Project Drive.\n\n' +
        'HELP — Usage reference.\n' +
        '  • instruction [guide] — Show GSA usage instructions.\n' +
        '  • command help [help] — Show commands and aliases.'
      return {
        structuredContent: { menu_text: menuText },
        content: [{ type: 'text', text: menuText }],
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
