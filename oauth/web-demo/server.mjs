#!/usr/bin/env node
// Minimal OAuth2 authorization-code + PKCE web client against FieldTwin's login system.
// Usage: node server.mjs, then open http://localhost:5555/, enter the account id to register
// this demo's customTab on, and register the printed manifest URL against that same account -
// CLIENT_ID overrides which customTab id to use; ACCOUNT_ID pre-fills the account id and skips
// the browser prompt.
import http from 'node:http'
import crypto from 'node:crypto'

const PORT = Number(process.env.PORT || 5555)
const LOGIN_URL = process.env.LOGIN_URL || 'http://futureon-webapp.lvh.me/login'
const BACKEND_URL = process.env.BACKEND_URL || 'http://futureon-backend.lvh.me'
const CLIENT_ID = process.env.CLIENT_ID
const REDIRECT_URI = `http://localhost:${PORT}/callback`
const MANIFEST_URL = `http://localhost:${PORT}/manifest`

// Debug-only: renders the raw access_token on the logged-in page. Off by default - the refresh
// token is never rendered, opt-in or not (see the security notes in the README).
const SHOW_TOKENS = process.env.UNSAFE_SHOW_TOKENS === '1'

// This integration registers itself via its own /manifest URL (paste it into the admin UI's
// "add by manifest URL" field, or PUT it to /API/v1.10/:accountId/integrations/manifest).
const MANIFEST = {
  id: process.env.MANIFEST_ID || 'oauth-demo-client',
  name: 'OAuth web demo',
  url: `http://localhost:${PORT}/`,
  projectWideAccess: true,
  redirectUris: [REDIRECT_URI, 'http://127.0.0.1:*/callback'],
}

// Defaults to the manifest's own id, so login works the moment it's registered, no restart
// needed; CLIENT_ID overrides it for a tab created some other way.
const TAB_ID = CLIENT_ID || MANIFEST.id

// FieldTwin's OAuth client_id is the compound `<accountId>:<id>` - a customTab id is only unique
// within its own account, never across the whole graph, so the account has to be explicit.
// ACCOUNT_ID pre-fills it; otherwise the "/" page collects it through an HTML form (POST
// /account) before it'll offer a "Log in" button, and "Reset account" (POST /account/reset)
// clears it again to switch accounts without restarting the process.
let currentAccountId = process.env.ACCOUNT_ID || null

function getClientId() {
  return currentAccountId ? `${currentAccountId}:${TAB_ID}` : null
}

// One flow in flight per state - fine for a demo, keyed so a stray callback can't be confused
// with the request actually waiting on it. Entries carry a creation time so they can expire.
const pending = new Map()
const PENDING_TTL_MS = 5 * 60 * 1000
const MAX_PENDING = 500

// Token pairs live server-side, keyed by an opaque session id in an HttpOnly cookie - never in a
// URL, where they'd end up in browser history, a Referer header, or any access log. Demo-only TTL;
// a real deployment should size this to its actual refresh-token/session policy.
const sessions = new Map()
const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const MAX_SESSIONS = 500

const ALLOWED_ORIGINS = new Set(
  [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`].map((origin) => new URL(origin).origin)
)

const NO_STORE_HTML_HEADERS = {
  'Content-Type': 'text/html',
  'Cache-Control': 'no-store, private',
  Pragma: 'no-cache',
}

function pruneExpired(map, ttlMs) {
  const cutoff = Date.now() - ttlMs
  for (const [key, value] of map) {
    if (value.createdAt < cutoff) map.delete(key)
  }
}

function capSize(map, max) {
  while (map.size > max) {
    map.delete(map.keys().next().value)
  }
}

// Runs even if nothing hits "/" or logs in for a while, so idle entries don't linger until the
// next request happens to prune them. unref() so it never keeps the process alive by itself.
setInterval(() => {
  pruneExpired(pending, PENDING_TTL_MS)
  pruneExpired(sessions, SESSION_TTL_MS)
}, 60 * 1000).unref()

function parseCookies(req) {
  const header = req.headers.cookie || ''
  const cookies = {}
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    try {
      cookies[decodeURIComponent(trimmed.slice(0, eq))] = decodeURIComponent(trimmed.slice(eq + 1))
    } catch {
      // Malformed percent-encoding in a cookie value - ignore that cookie rather than crash.
    }
  }
  return cookies
}

function createSession(res, accessToken, refreshToken, clientId = getClientId()) {
  pruneExpired(sessions, SESSION_TTL_MS)
  capSize(sessions, MAX_SESSIONS - 1)
  const sessionId = crypto.randomBytes(24).toString('hex')
  const session = {
    accessToken,
    refreshToken,
    clientId,
    csrfToken: crypto.randomBytes(24).toString('hex'),
    createdAt: Date.now(),
  }
  sessions.set(sessionId, session)
  res.setHeader('Set-Cookie', `sid=${sessionId}; HttpOnly; Path=/; SameSite=Lax`)
  return session
}

function getSession(req) {
  const sessionId = parseCookies(req).sid
  const session = sessions.get(sessionId)
  if (!session) return undefined
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(sessionId)
    return undefined
  }
  return session
}

function isTrustedOrigin(req) {
  const origin = req.headers.origin
  return !origin || ALLOWED_ORIGINS.has(origin)
}

function hasValidCsrf(session, formBody) {
  return Boolean(session.csrfToken) && formBody.get('csrf') === session.csrfToken
}

function forbidden(res, message) {
  res.writeHead(403, NO_STORE_HTML_HEADERS)
  res.end(page(`<h2>Request rejected</h2><p>${escapeHtml(message)}</p><a href="/">Back</a>`))
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

// Shown at the top of every page. Before an account id is set, it's the only way in - a form
// posting to /account. Once set, it's a one-line status with a "Reset account" button (POST
// /account/reset) that clears it again, so switching accounts never needs a restart. `csrfField`
// is only available once a session exists (the logged-in page), matching every other state-
// changing form in this file - see isTrustedOrigin/hasValidCsrf below.
function accountStatus(csrfField = '') {
  if (!currentAccountId) {
    return `
      <div style="margin: 1em 0; padding: 1em; border: 1px solid #ccc;">
        <p>Enter the FieldTwin account id to register this demo's customTab on:</p>
        <form method="POST" action="/account">
          <input type="text" name="accountId" placeholder="account id" autofocus required
            style="width: 60%; font-family: monospace; padding: 0.4em;" />
          <button type="submit">Continue</button>
        </form>
      </div>`
  }
  return `
    <p>
      Account: <code>${escapeHtml(currentAccountId)}</code>
      (client_id: <code>${escapeHtml(getClientId())}</code>)
      <form method="POST" action="/account/reset" style="display:inline">
        ${csrfField}
        <button type="submit">Reset account</button>
      </form>
    </p>`
}

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
// The backend restricts an integration-scoped token to its own authorization, so this normally
// returns at most one entry. Failures are reported distinctly from "no apps" rather than
// collapsed into an empty list.
async function fetchConnectedApps(accessToken) {
  try {
    const response = await fetch(`${BACKEND_URL}/oauth/authorizations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` }
    }
    return { ok: true, apps: (await response.json()) || [] }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

function renderConnectedApps(result, csrfField) {
  if (!result.ok) {
    return `<p>Could not check this app's authorization: ${escapeHtml(result.error)}</p>`
  }
  if (!result.apps.length) {
    return '<p>No authorization found for this app - it may already have been revoked.</p>'
  }
  return `<ul>${result.apps
    .map(
      (app) => `
    <li style="margin-bottom: 0.5em;">
      ${escapeHtml(app.name || app.clientId)} - granted ${escapeHtml(app.grantedAt || 'unknown')}
      <form method="POST" action="/revoke" style="display:inline">
        ${csrfField}
        <input type="hidden" name="client_id" value="${escapeHtml(app.clientId)}" />
        <button type="submit">Revoke</button>
      </form>
    </li>`
    )
    .join('')}</ul>`
}

// Shared page for anywhere we end up holding a token pair (login, revoke, JWT test, refresh),
// optionally with a one-line `notice`.
async function renderLoggedInPage(session, { expiresIn, notice } = {}) {
  const { header, payload } = decodeJwt(session.accessToken)
  const authResult = await fetchConnectedApps(session.accessToken)
  const csrfField = `<input type="hidden" name="csrf" value="${escapeHtml(session.csrfToken)}" />`
  return page(`
    <h2>Logged in</h2>
    ${accountStatus(csrfField)}
    ${notice ? `<p><strong>${escapeHtml(notice)}</strong></p>` : ''}
    ${expiresIn !== undefined ? `<p>expires_in: ${expiresIn}s</p>` : ''}
    <h3>This app's authorization</h3>
    <p style="font-size:0.85em;color:#555">
      FieldTwin restricts an integration-scoped token to seeing and revoking only its own
      authorization - the full list of apps you've connected is only visible in your FieldTwin
      account settings.
    </p>
    ${renderConnectedApps(authResult, csrfField)}
    <p>
      <form method="POST" action="/whoami" style="display:inline">
        ${csrfField}
        <button type="submit">Test JWT (GET /API/v2.0/accounts/:accountId)</button>
      </form>
      <form method="POST" action="/refresh" style="display:inline">
        ${csrfField}
        <button type="submit">Refresh (POST /oauth/token grant_type=refresh_token)</button>
      </form>
      <form method="POST" action="/logout" style="display:inline">
        ${csrfField}
        <button type="submit">Log out</button>
      </form>
    </p>
    <h3>JWT header</h3><pre>${escapeHtml(JSON.stringify(header, null, 2))}</pre>
    <h3>JWT payload</h3><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
    ${
      SHOW_TOKENS
        ? `<h3>⚠️ raw access_token — UNSAFE_SHOW_TOKENS=1, do not enable outside a local demo</h3>
    <pre style="white-space: pre-wrap; word-break: break-all;">${escapeHtml(session.accessToken)}</pre>`
        : ''
    }
    <a href="/">Log in again</a>
  `)
}

async function handleRequest(req, res) {
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
    let loginButton = ''
    if (currentAccountId) {
      pruneExpired(pending, PENDING_TTL_MS)
      capSize(pending, MAX_PENDING - 1)

      const state = crypto.randomBytes(16).toString('hex')
      const codeVerifier = crypto.randomBytes(32).toString('base64url')
      const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
      // Pinned to the client_id in effect right now, not re-read at /callback time - a Reset
      // account/re-Continue in another tab mid-flow must not change which client this code redeems as.
      pending.set(state, { codeVerifier, clientId: getClientId(), createdAt: Date.now() })

      const authorizeUrl = new URL(LOGIN_URL)
      authorizeUrl.searchParams.set('client_id', getClientId())
      authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI)
      authorizeUrl.searchParams.set('code_challenge', codeChallenge)
      authorizeUrl.searchParams.set('code_challenge_method', 'S256')
      authorizeUrl.searchParams.set('state', state)

      // If this id isn't registered yet, "Log in" below demos the invalid_client failure instead.
      loginButton = `<a href="${authorizeUrl.toString()}"><button style="font-size:1.2em;padding:0.5em 1em;">Log in</button></a>`
    }

    const session = getSession(req)
    const csrfField = session && session.csrfToken
      ? `<input type="hidden" name="csrf" value="${escapeHtml(session.csrfToken)}" />`
      : ''

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(page(`<h2>OAuth web demo</h2>${accountStatus(csrfField)}${manifestCopyBox}${loginButton}`))
    return
  }

  if (url.pathname === '/account' && req.method === 'POST') {
    if (!isTrustedOrigin(req)) {
      forbidden(res, 'Unexpected Origin header.')
      return
    }
    const body = await readFormBody(req)
    const accountId = (body.get('accountId') || '').trim()
    if (!accountId) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(
        page(`<h2>OAuth web demo</h2><p style="color:#900">An account id is required.</p>${accountStatus()}`)
      )
      return
    }
    currentAccountId = accountId
    res.writeHead(303, { Location: '/' })
    res.end()
    return
  }

  if (url.pathname === '/account/reset' && req.method === 'POST') {
    if (!isTrustedOrigin(req)) {
      forbidden(res, 'Unexpected Origin header.')
      return
    }
    // Only checked when a session actually exists (the reset button also lives on the pre-login
    // page, which has no csrfToken to check yet) - mirrors every other form below.
    const session = getSession(req)
    if (session) {
      const body = await readFormBody(req)
      if (!hasValidCsrf(session, body)) {
        forbidden(res, 'Invalid or missing CSRF token.')
        return
      }
      sessions.delete(parseCookies(req).sid)
    }
    currentAccountId = null
    res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0')
    res.writeHead(303, { Location: '/' })
    res.end()
    return
  }

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const entry = pending.get(state)
    pending.delete(state)
    const valid = entry && Date.now() - entry.createdAt <= PENDING_TTL_MS ? entry : undefined
    const codeVerifier = valid?.codeVerifier
    // The client_id this /callback redeems as - pinned at /authorize time (see "/" above), not
    // re-read from currentAccountId now, in case the account was reset in between.
    const clientId = valid?.clientId

    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>Login declined</h2><p>error=${escapeHtml(error)}</p><a href="/">Try again</a>`))
      return
    }
    if (!code || !codeVerifier || !clientId) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>Invalid callback</h2><p>Missing, unrecognized, or expired state.</p><a href="/">Try again</a>`))
      return
    }

    try {
      const tokenResponse = await fetch(`${BACKEND_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier,
        }).toString(),
      })
      const data = await tokenResponse.json()
      if (!tokenResponse.ok) {
        throw new Error(data.error_description || data.error || `HTTP ${tokenResponse.status}`)
      }

      const session = createSession(res, data.access_token, data.refresh_token, clientId)
      res.writeHead(200, NO_STORE_HTML_HEADERS)
      res.end(await renderLoggedInPage(session, { expiresIn: data.expires_in }))
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/html' })
      res.end(page(`<h2>Token exchange failed</h2><pre>${escapeHtml(String(e.message || e))}</pre><a href="/">Try again</a>`))
    }
    return
  }

  if (url.pathname === '/revoke' && req.method === 'POST') {
    const session = getSession(req)
    if (!session) {
      res.writeHead(400, NO_STORE_HTML_HEADERS)
      res.end(page(`<h2>No active session</h2><a href="/">Log in</a>`))
      return
    }
    if (!isTrustedOrigin(req)) {
      forbidden(res, 'Unexpected Origin header.')
      return
    }
    const body = await readFormBody(req)
    if (!hasValidCsrf(session, body)) {
      forbidden(res, 'Invalid or missing CSRF token.')
      return
    }
    const clientId = body.get('client_id')
    if (!clientId) {
      res.writeHead(400, NO_STORE_HTML_HEADERS)
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

    res.writeHead(200, NO_STORE_HTML_HEADERS)
    res.end(await renderLoggedInPage(session, { notice }))
    return
  }

  if (url.pathname === '/whoami' && req.method === 'POST') {
    const session = getSession(req)
    if (!session) {
      res.writeHead(400, NO_STORE_HTML_HEADERS)
      res.end(page(`<h2>No active session</h2><a href="/">Log in</a>`))
      return
    }
    if (!isTrustedOrigin(req)) {
      forbidden(res, 'Unexpected Origin header.')
      return
    }
    const body = await readFormBody(req)
    if (!hasValidCsrf(session, body)) {
      forbidden(res, 'Invalid or missing CSRF token.')
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

    res.writeHead(200, NO_STORE_HTML_HEADERS)
    res.end(await renderLoggedInPage(session, { notice }))
    return
  }

  if (url.pathname === '/refresh' && req.method === 'POST') {
    const session = getSession(req)
    if (!session) {
      res.writeHead(400, NO_STORE_HTML_HEADERS)
      res.end(page(`<h2>No active session</h2><a href="/">Log in</a>`))
      return
    }
    if (!isTrustedOrigin(req)) {
      forbidden(res, 'Unexpected Origin header.')
      return
    }
    const body = await readFormBody(req)
    if (!hasValidCsrf(session, body)) {
      forbidden(res, 'Invalid or missing CSRF token.')
      return
    }

    try {
      const clientId = session.clientId || getClientId() || ''
      const refreshResponse = await fetch(`${BACKEND_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          // Not actually checked by /oauth/token for a refresh (it trusts the refresh_token's own
          // claims), sent only for parity with the authorization_code request above.
          client_id: clientId,
          refresh_token: session.refreshToken,
        }).toString(),
      })
      const data = await refreshResponse.json()
      if (!refreshResponse.ok) {
        throw new Error(data.error_description || data.error || `HTTP ${refreshResponse.status}`)
      }
      session.accessToken = data.access_token
      // RFC 6749 §6 permits a refresh response to omit refresh_token, meaning the existing one
      // stays valid - overwriting it with undefined would break the next refresh.
      if (data.refresh_token) session.refreshToken = data.refresh_token
      session.createdAt = Date.now()
      res.writeHead(200, NO_STORE_HTML_HEADERS)
      res.end(
        await renderLoggedInPage(session, {
          expiresIn: data.expires_in,
          notice: 'Refreshed: minted a fresh access_token/refresh_token pair.',
        })
      )
    } catch (e) {
      res.writeHead(400, NO_STORE_HTML_HEADERS)
      res.end(
        page(`<h2>Refresh failed</h2><pre>${escapeHtml(String(e.message || e))}</pre><a href="/">Log in again</a>`)
      )
    }
    return
  }

  if (url.pathname === '/logout' && req.method === 'POST') {
    const session = getSession(req)
    if (session) {
      if (!isTrustedOrigin(req)) {
        forbidden(res, 'Unexpected Origin header.')
        return
      }
      const body = await readFormBody(req)
      if (!hasValidCsrf(session, body)) {
        forbidden(res, 'Invalid or missing CSRF token.')
        return
      }
      sessions.delete(parseCookies(req).sid)
    }
    res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0')
    res.writeHead(200, NO_STORE_HTML_HEADERS)
    res.end(page(`<h2>Logged out</h2><a href="/">Log in again</a>`))
    return
  }

  res.writeHead(404)
  res.end('not found')
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('Unhandled error handling request:', err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
    }
    res.end('Internal server error')
  })
})

server.on('error', (err) => {
  console.error('Server error:', err)
})

// A malformed HTTP request (not one of our own handler's errors) reaches here instead of crashing.
server.on('clientError', (err, socket) => {
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`OAuth web demo listening on http://localhost:${PORT}`)
  console.log(`Manifest URL: ${MANIFEST_URL}`)
  console.log(
    currentAccountId
      ? `Using client_id: ${getClientId()}`
      : `Open http://localhost:${PORT}/ and enter the FieldTwin account id to continue (or set ACCOUNT_ID).`
  )
})
