#!/usr/bin/env node
// Minimal OAuth2 authorization-code + PKCE web client against FieldTwin's login system.
// Usage: node server.mjs, then register the printed manifest URL - CLIENT_ID is only needed to
// override which customTab id to use (e.g. one created some other way).
import http from 'node:http'
import crypto from 'node:crypto'

const PORT = Number(process.env.PORT || 5555)
const LOGIN_URL = process.env.LOGIN_URL || 'http://futureon-webapp.lvh.me/login'
const BACKEND_URL = process.env.BACKEND_URL || 'http://futureon-backend.lvh.me'
const CLIENT_ID = process.env.CLIENT_ID
const REDIRECT_URI = `http://localhost:${PORT}/callback`
const MANIFEST_URL = `http://localhost:${PORT}/manifest`

// This integration registers itself via its own /manifest URL (paste it into the admin UI's
// "add by manifest URL" field, or PUT it to /API/v1.10/:accountId/integrations/manifest).
const MANIFEST = {
  id: process.env.MANIFEST_ID || 'oauth-demo-client',
  name: 'OAuth web demo',
  url: `http://localhost:${PORT}/`,
  projectWideAccess: true,
  redirectUris: [REDIRECT_URI, 'http://127.0.0.1:*/callback'],
  public: true,
}

// Defaults to the manifest's own id, so login works the moment it's registered, no restart
// needed; CLIENT_ID overrides it for a tab created some other way.
const EFFECTIVE_CLIENT_ID = CLIENT_ID || MANIFEST.id

// One flow in flight per state - fine for a demo, keyed so a stray callback can't be confused
// with the request actually waiting on it.
const pending = new Map()

// Token pairs live server-side, keyed by an opaque session id in an HttpOnly cookie - never in a
// URL, where they'd end up in browser history, a Referer header, or any access log.
const sessions = new Map()

function parseCookies(req) {
  const header = req.headers.cookie || ''
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const eq = part.indexOf('=')
        return [decodeURIComponent(part.slice(0, eq)), decodeURIComponent(part.slice(eq + 1))]
      })
  )
}

function createSession(res, accessToken, refreshToken) {
  const sessionId = crypto.randomBytes(24).toString('hex')
  sessions.set(sessionId, { accessToken, refreshToken })
  res.setHeader('Set-Cookie', `sid=${sessionId}; HttpOnly; Path=/; SameSite=Lax`)
  return sessions.get(sessionId)
}

function getSession(req) {
  return sessions.get(parseCookies(req).sid)
}

async function readFormBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
}

const page = (body) =>
  `<!doctype html><html><body style="font-family: monospace; max-width: 720px; margin: 40px auto;">${body}</body></html>`

const manifestCopyBox = `
  <div style="margin: 1em 0; padding: 1em; border: 1px solid #ccc;">
    <label for="manifestUrl">Integration manifest URL (paste into "add integration by manifest URL"):</label><br />
    <input id="manifestUrl" type="text" readonly value="${MANIFEST_URL}"
      style="width: 80%; font-family: monospace; padding: 0.4em;" onclick="this.select()" />
    <button onclick="navigator.clipboard.writeText(document.getElementById('manifestUrl').value).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 1500) })">Copy</button>
  </div>`

function decodeJwt(token) {
  const [headerB64, payloadB64] = token.split('.')
  const decode = (b64) => JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'))
  return { header: decode(headerB64), payload: decode(payloadB64) }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// What this user has approved via the OAuth consent screen (GET /oauth/authorizations) - the
// access_token from the flow above works as the bearer here too, same as any other resource call.
async function fetchConnectedApps(accessToken) {
  try {
    const response = await fetch(`${BACKEND_URL}/oauth/authorizations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
      return []
    }
    return (await response.json()) || []
  } catch (e) {
    return []
  }
}

function renderConnectedApps(apps) {
  if (!apps.length) {
    return '<p>No connected apps for this user.</p>'
  }
  return `<ul>${apps
    .map(
      (app) => `
    <li style="margin-bottom: 0.5em;">
      ${escapeHtml(app.name || app.clientId)} - granted ${escapeHtml(app.grantedAt || 'unknown')}
      <form method="POST" action="/revoke" style="display:inline">
        <input type="hidden" name="client_id" value="${escapeHtml(app.clientId)}" />
        <button type="submit">Revoke</button>
      </form>
    </li>`
    )
    .join('')}</ul>`
}

// Shared page for anywhere we end up holding a token pair (login, revoke, JWT test, refresh),
// optionally with a one-line `notice`.
async function renderLoggedInPage(accessToken, refreshToken, { expiresIn, notice } = {}) {
  const { header, payload } = decodeJwt(accessToken)
  const apps = await fetchConnectedApps(accessToken)
  return page(`
    <h2>Logged in</h2>
    ${notice ? `<p><strong>${escapeHtml(notice)}</strong></p>` : ''}
    ${expiresIn !== undefined ? `<p>expires_in: ${expiresIn}s</p>` : ''}
    <h3>Connected apps</h3>
    ${renderConnectedApps(apps)}
    <p>
      <form method="POST" action="/whoami" style="display:inline">
        <button type="submit">Test JWT (GET /API/v2.0/accounts/:accountId)</button>
      </form>
      <form method="POST" action="/refresh" style="display:inline">
        <button type="submit">Refresh (POST /oauth/token grant_type=refresh_token)</button>
      </form>
    </p>
    <h3>JWT header</h3><pre>${escapeHtml(JSON.stringify(header, null, 2))}</pre>
    <h3>JWT payload</h3><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
    <h3>raw access_token</h3><pre style="white-space: pre-wrap; word-break: break-all;">${escapeHtml(accessToken)}</pre>
    <h3>raw refresh_token</h3><pre style="white-space: pre-wrap; word-break: break-all;">${escapeHtml(refreshToken)}</pre>
    <a href="/">Log in again</a>
  `)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (url.pathname === '/manifest') {
    // Local dev tool only - wide open CORS so any origin (e.g. the admin UI) can fetch it directly.
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      })
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify(MANIFEST, null, 2))
    return
  }

  if (url.pathname === '/') {
    const state = crypto.randomBytes(16).toString('hex')
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
    pending.set(state, codeVerifier)

    const authorizeUrl = new URL(LOGIN_URL)
    authorizeUrl.searchParams.set('client_id', EFFECTIVE_CLIENT_ID)
    authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authorizeUrl.searchParams.set('code_challenge', codeChallenge)
    authorizeUrl.searchParams.set('code_challenge_method', 'S256')
    authorizeUrl.searchParams.set('state', state)

    // If this id isn't registered yet, "Log in" below demos the invalid_client failure instead.
    const notice = `<p>Using client_id: <code>${EFFECTIVE_CLIENT_ID}</code></p>`

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(
      page(
        `<h2>OAuth web demo</h2>${notice}<a href="${authorizeUrl.toString()}"><button style="font-size:1.2em;padding:0.5em 1em;">Log in</button></a>${manifestCopyBox}`
      )
    )
    return
  }

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const codeVerifier = pending.get(state)
    pending.delete(state)

    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>Login declined</h2><p>error=${escapeHtml(error)}</p><a href="/">Try again</a>`))
      return
    }
    if (!code || !codeVerifier) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>Invalid callback</h2><p>Missing or unrecognized state.</p><a href="/">Try again</a>`))
      return
    }

    try {
      const tokenResponse = await fetch(`${BACKEND_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      })
      const data = await tokenResponse.json()
      if (!tokenResponse.ok) {
        throw new Error(data.error_description || data.error || `HTTP ${tokenResponse.status}`)
      }

      createSession(res, data.access_token, data.refresh_token)
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(await renderLoggedInPage(data.access_token, data.refresh_token, { expiresIn: data.expires_in }))
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>Token exchange failed</h2><pre>${escapeHtml(String(e.message || e))}</pre><a href="/">Try again</a>`))
    }
    return
  }

  if (url.pathname === '/revoke' && req.method === 'POST') {
    const session = getSession(req)
    if (!session) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>No active session</h2><a href="/">Log in</a>`))
      return
    }
    const clientId = (await readFormBody(req)).get('client_id')
    if (!clientId) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>Missing client_id</h2><a href="/">Back</a>`))
      return
    }

    let notice
    try {
      const revokeResponse = await fetch(
        `${BACKEND_URL}/oauth/authorizations/${encodeURIComponent(clientId)}/revoke`,
        { method: 'POST', headers: { Authorization: `Bearer ${session.accessToken}` } }
      )
      notice = revokeResponse.ok
        ? `Revoked access for ${clientId}.`
        : `Failed to revoke ${clientId}: HTTP ${revokeResponse.status}`
    } catch (e) {
      notice = `Failed to revoke ${clientId}: ${e.message}`
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(await renderLoggedInPage(session.accessToken, session.refreshToken, { notice }))
    return
  }

  if (url.pathname === '/whoami' && req.method === 'POST') {
    const session = getSession(req)
    if (!session) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>No active session</h2><a href="/">Log in</a>`))
      return
    }

    // A real resource fetch, not just JWT verification - revocation is only enforced when
    // something actually resolves rights, which a signature/expiry check alone doesn't do.
    const { payload } = decodeJwt(session.accessToken)
    let notice
    try {
      const whoamiResponse = await fetch(`${BACKEND_URL}/API/v2.0/accounts/${payload.accountId}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
      notice = whoamiResponse.ok
        ? 'JWT still works: GET /API/v2.0/accounts/:accountId -> 200.'
        : `JWT no longer works: GET /API/v2.0/accounts/:accountId -> HTTP ${whoamiResponse.status}.`
    } catch (e) {
      notice = `Could not reach backend to check: ${e.message}`
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(await renderLoggedInPage(session.accessToken, session.refreshToken, { notice }))
    return
  }

  if (url.pathname === '/refresh' && req.method === 'POST') {
    const session = getSession(req)
    if (!session) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>No active session</h2><a href="/">Log in</a>`))
      return
    }

    try {
      const refreshResponse = await fetch(`${BACKEND_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: session.refreshToken }),
      })
      const data = await refreshResponse.json()
      if (!refreshResponse.ok) {
        throw new Error(data.error_description || data.error || `HTTP ${refreshResponse.status}`)
      }
      session.accessToken = data.access_token
      session.refreshToken = data.refresh_token
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(
        await renderLoggedInPage(session.accessToken, session.refreshToken, {
          expiresIn: data.expires_in,
          notice: 'Refreshed: minted a fresh access_token/refresh_token pair.',
        })
      )
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(
        page(`<h2>Refresh failed</h2><pre>${escapeHtml(String(e.message || e))}</pre><a href="/">Log in again</a>`)
      )
    }
    return
  }

  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, () => {
  console.log(`OAuth web demo listening on http://localhost:${PORT}`)
  console.log(`Manifest URL: ${MANIFEST_URL}`)
  console.log(`Using client_id: ${EFFECTIVE_CLIENT_ID}${CLIENT_ID ? '' : ' (the manifest\'s own id - register it and log in, no restart needed)'}`)
})
