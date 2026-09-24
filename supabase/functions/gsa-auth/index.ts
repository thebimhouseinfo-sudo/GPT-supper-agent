import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

Deno.serve(() =>
  Response.json(
    {
      deprecated: true,
      message:
        'GSA auth UI is no longer hosted by Supabase Edge Functions because Edge Functions rewrite HTML to text/plain. Deploy the repository auth-ui/ directory on a frontend host such as Vercel.',
      source: 'auth-ui/',
    },
    { status: 410 },
  ),
)
