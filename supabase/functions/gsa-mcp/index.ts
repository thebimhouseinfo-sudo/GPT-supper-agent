import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createMcpHandler, McpServer } from 'npm:@modelcontextprotocol/server@^2.0.0'
import { z } from 'npm:zod@^4.3.6'

const handler = createMcpHandler(() => {
  const server = new McpServer(
    { name: 'gsa-bootstrap', version: '0.1.0' },
    {
      instructions:
        'GPT Super Agent M1A bootstrap endpoint. This public bootstrap surface is read-only. Do not treat it as authenticated user identity or Project Drive authority.',
    },
  )

  server.registerTool(
    'get_runtime_status',
    {
      title: 'Get GSA runtime status',
      description:
        'Use this to verify that the GPT Super Agent MCP bootstrap endpoint is reachable. It does not authenticate a user or expose Project Memory.',
      inputSchema: z.object({}),
      outputSchema: z.object({
        phase: z.string(),
        mcp: z.string(),
        auth: z.string(),
        project_drive: z.string(),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async () => {
      const status = {
        phase: 'M1A_BOOTSTRAP_SPIKE',
        mcp: 'OBSERVED_SERVER_DEPLOYMENT',
        auth: 'NOT_YET_PROVEN',
        project_drive: 'NOT_CONFIGURED_BY_THIS_PUBLIC_TOOL',
      }

      return {
        structuredContent: status,
        content: [{ type: 'text', text: JSON.stringify(status) }],
      }
    },
  )

  return server
})

Deno.serve((req) => {
  const url = new URL(req.url)

  if (req.method === 'GET' && url.pathname.endsWith('/health')) {
    return Response.json({
      ok: true,
      service: 'gsa-bootstrap',
      phase: 'M1A',
      auth: 'not-yet-enabled',
    })
  }

  return handler.fetch(req)
})
