import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

function page() {
  const url = JSON.stringify(SUPABASE_URL)
  const key = JSON.stringify(SUPABASE_ANON_KEY)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>GPT Super Agent · Connect</title>
  <style>
    :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: Canvas; color: CanvasText; }
    main { width: min(560px, calc(100vw - 32px)); border: 1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius: 18px; padding: 28px; box-sizing: border-box; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { line-height: 1.5; }
    .muted { opacity: .72; }
    .box { margin: 18px 0; padding: 16px; border-radius: 12px; background: color-mix(in srgb, CanvasText 6%, transparent); }
    button { width: 100%; padding: 12px 16px; margin-top: 10px; border: 0; border-radius: 10px; font: inherit; cursor: pointer; }
    button.primary { background: CanvasText; color: Canvas; }
    button.secondary { background: color-mix(in srgb, CanvasText 10%, transparent); color: CanvasText; }
    #error { color: #c33; white-space: pre-wrap; }
  </style>
</head>
<body>
<main>
  <h1>GPT Super Agent</h1>
  <p class="muted">Sign in with Google so GPT Super Agent can identify your account. Google Drive remains a separate ChatGPT connection.</p>

  <div id="status" class="box">Checking GPT Super Agent sign-in…</div>
  <div id="details" class="box" hidden></div>
  <div id="error" hidden></div>

  <button id="login" class="primary" hidden>Continue with Google</button>
  <button id="approve" class="primary" hidden>Continue to GPT Super Agent</button>
  <button id="deny" class="secondary" hidden>Cancel</button>
</main>

<script type="module">
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  const SUPABASE_URL = ${url}
  const SUPABASE_ANON_KEY = ${key}
  const params = new URLSearchParams(location.search)
  const authorizationId = params.get('authorization_id')
  const status = document.querySelector('#status')
  const details = document.querySelector('#details')
  const errorBox = document.querySelector('#error')
  const login = document.querySelector('#login')
  const approve = document.querySelector('#approve')
  const deny = document.querySelector('#deny')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  function showError(message) {
    errorBox.hidden = false
    errorBox.textContent = message
    status.textContent = 'Authorization cannot continue.'
  }

  function returnUrl() {
    const u = new URL(location.href)
    u.search = ''
    u.hash = ''
    if (authorizationId) u.searchParams.set('authorization_id', authorizationId)
    return u.toString()
  }

  async function boot() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session) {
      status.textContent = authorizationId
        ? 'Sign in with Google to connect ChatGPT to your GSA account.'
        : 'Sign in with Google to create or open your GSA account.'
      login.hidden = false
      return
    }

    const email = sessionData.session.user.email ?? 'Google user'
    status.textContent = 'GSA Account connected: ' + email

    if (!authorizationId) {
      details.hidden = false
      details.replaceChildren()

      const title = document.createElement('strong')
      title.textContent = 'Account ready'
      const text = document.createElement('p')
      text.textContent =
        'Your Supabase user ID is linked to this verified Google account. Project Drive is configured separately through ChatGPT Google Drive.'
      details.append(title, text)
      return
    }

    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
    if (error) {
      showError(error.message)
      return
    }

    details.hidden = false
    details.replaceChildren()

    const title = document.createElement('strong')
    title.textContent = data.client?.name ?? data.client_name ?? 'ChatGPT'
    const text = document.createElement('p')
    text.textContent = 'Allow this ChatGPT connection to use your GSA account configuration.'

    details.append(title, text)
    approve.hidden = false
    deny.hidden = false
  }

  login.addEventListener('click', async () => {
    login.disabled = true
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: returnUrl() },
    })
    if (error) {
      login.disabled = false
      showError(error.message)
    }
  })

  approve.addEventListener('click', async () => {
    approve.disabled = true
    deny.disabled = true
    const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId)
    if (error) {
      approve.disabled = false
      deny.disabled = false
      showError(error.message)
      return
    }
    location.assign(data.redirect_url)
  })

  deny.addEventListener('click', async () => {
    approve.disabled = true
    deny.disabled = true
    const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId)
    if (error) {
      approve.disabled = false
      deny.disabled = false
      showError(error.message)
      return
    }
    location.assign(data.redirect_url)
  })

  boot().catch((error) => showError(String(error?.message ?? error)))
</script>
</body>
</html>`
}

Deno.serve((req) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })
  return new Response(page(), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  })
})
