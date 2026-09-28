#!/usr/bin/env node
// Minimal OAuth2 authorization-code + PKCE CLI client against FieldTwin's login system.
// Usage: node login.mjs (ACCOUNT_ID=<account id> and/or CLIENT_ID=<customTab id> to skip the prompt/override the default)
import http from 'node:http'
import crypto from 'node:crypto'
import readline from 'node:readline'
import { spawn } from 'node:child_process'

const LOGIN_URL = process.env.LOGIN_URL || 'http://futureon-webapp.lvh.me/login'
const BACKEND_URL = process.env.BACKEND_URL || 'http://futureon-backend.lvh.me'

// Defaults to a fixed id, matching the web demo's own MANIFEST.id fallback - register a customTab
// with this id once (redirectUris: ["http://127.0.0.1:*/callback"]) and CLIENT_ID never needs
// setting; CLIENT_ID overrides it for a tab created some other way.
const TAB_ID = process.env.CLIENT_ID || 'oauth-demo-client'

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer))).finally(() => rl.close())
}

// FieldTwin's OAuth client_id is the compound `<accountId>:<id>` - a customTab id is only unique
// within its own account, never across the whole graph, so the account has to be explicit. Read
// from ACCOUNT_ID if set, otherwise ask for it once before starting the login flow.
async function resolveClientId() {
  const accountId = (process.env.ACCOUNT_ID || (await ask('FieldTwin account id for this customTab: '))).trim()
  if (!accountId) {
    throw new Error('an account id is required to build client_id (<accountId>:<id>)')
  }
  return `${accountId}:${TAB_ID}`
}

// Set once by main() before login() ever runs - referenced here as a `let` so every function
// below (waitForCallback, login, refreshTokens, revokeAuthorization's caller) sees the resolved value.
let CLIENT_ID

function decodeJwt(token) {
  const [headerB64, payloadB64] = token.split('.')
  const decode = (b64) => JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'))
  return { header: decode(headerB64), payload: decode(payloadB64) }
}

function openBrowser(url) {
  const child =
    process.platform === 'darwin'
      ? spawn('open', [url], { stdio: 'ignore', detached: true })
      : process.platform === 'win32'
        ? spawn('explorer.exe', [url], { stdio: 'ignore', detached: true })
        : spawn('xdg-open', [url], { stdio: 'ignore', detached: true })

  // spawn() failures (e.g. no GUI browser on this machine) surface as an async 'error' event, not
  // a thrown exception - without this listener, Node treats it as an uncaught exception and exits.
  child.on('error', () => {})
  child.unref()
}

const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000

async function waitForCallback(state) {
  return new Promise((resolve, reject) => {
    let redirectUri
    let settled = false
    let timer

    // Guards against the timeout and a real callback racing each other, and against the
    // request handler and the server's own 'error' event both trying to settle.
    const settle = (fn, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn(value)
    }

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1')
      if (url.pathname !== '/callback') {
        res.writeHead(404)
        res.end()
        return
      }
      const returnedState = url.searchParams.get('state')
      const returnedCode = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      // A stray or replayed request (wrong/missing state) must not stop the listener - only the
      // one genuine callback we're actually waiting for gets to close it.
      if (returnedState !== state.value) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Unrecognized request.')
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(error ? `Login declined (${error}). You can close this tab.` : 'Logged in. You can close this tab.')
      server.close()

      if (error) {
        settle(reject, new Error(`authorization denied: ${error}`))
      } else if (!returnedCode) {
        settle(reject, new Error('missing code'))
      } else {
        settle(resolve, { code: returnedCode, redirectUri })
      }
    })

    server.on('error', (err) => settle(reject, err))

    // Without this, a login that's never completed (tab closed, browser never opened) leaves
    // the process hanging forever on an open loopback listener.
    timer = setTimeout(() => {
      server.close()
      settle(reject, new Error('Timed out waiting for the login callback.'))
    }, CALLBACK_TIMEOUT_MS)

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      redirectUri = `http://127.0.0.1:${port}/callback`

      const codeChallenge = state.codeChallenge
      const authorizeUrl = new URL(LOGIN_URL)
      authorizeUrl.searchParams.set('client_id', CLIENT_ID)
      authorizeUrl.searchParams.set('redirect_uri', redirectUri)
      authorizeUrl.searchParams.set('code_challenge', codeChallenge)
      authorizeUrl.searchParams.set('code_challenge_method', 'S256')
      authorizeUrl.searchParams.set('state', state.value)

      console.log(`Open this URL to log in:\n${authorizeUrl.toString()}\n`)
      openBrowser(authorizeUrl.toString())
    })
  })
}

function printTokens({ access_token, expires_in }) {
  const { header, payload } = decodeJwt(access_token)
  console.log('expires_in:', expires_in)
  console.log('\nJWT header:', JSON.stringify(header, null, 2))
  console.log('\nJWT payload:', JSON.stringify(payload, null, 2))
}

// Same resource call as the web demo's "Test JWT" button - proves the token actually works
// against a real API route, not just that it decodes.
async function testJwt(accessToken) {
  const { payload } = decodeJwt(accessToken)
  const response = await fetch(`${BACKEND_URL}/API/v2.0/accounts/${payload.accountId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  console.log(
    response.ok
      ? 'JWT still works: GET /API/v2.0/accounts/:accountId -> 200.'
      : `JWT no longer works: GET /API/v2.0/accounts/:accountId -> HTTP ${response.status}.`
  )
}

async function refreshTokens(refreshToken) {
  const response = await fetch(`${BACKEND_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }).toString(),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error_description || data.error || `HTTP ${response.status}`)
  }
  console.log('Refreshed: minted a fresh access_token/refresh_token pair.')
  printTokens(data)
  return data
}

// The backend restricts an integration-scoped token to seeing and revoking only its own
// authorization, so this normally returns at most one entry, not every app the user has
// connected - see the README for how to view the full list.
async function listAuthorizations(accessToken) {
  const response = await fetch(`${BACKEND_URL}/oauth/authorizations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(`Failed to check this app's authorization: HTTP ${response.status}`)
  }
  const apps = (await response.json()) || []
  if (!apps.length) {
    console.log('No authorization found for this app - it may already have been revoked.')
  } else {
    apps.forEach((app, i) => console.log(`${i + 1}. ${app.clientId} (${app.name || 'unnamed'}) - granted ${app.grantedAt}`))
  }
  return apps
}

async function revokeAuthorization(accessToken, clientId) {
  const response = await fetch(`${BACKEND_URL}/oauth/authorizations/${encodeURIComponent(clientId)}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (response.ok) {
    console.log(`Revoked access for ${clientId}.`)
    return
  }
  // Surface the server's actual reason (e.g. invalid_client, or "may only revoke its own
  // authorization") instead of a bare status code that hides what actually went wrong.
  const data = await response.json().catch(() => ({}))
  console.log(`Failed to revoke ${clientId}: ${data.error_description || data.error || `HTTP ${response.status}`}`)
}

// Same actions the web demo offers as buttons, as a text menu - loops so a refresh's new token
// pair can immediately be used by the next action too.
async function menu(tokens) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (question) => new Promise((resolve) => rl.question(question, resolve))

  while (true) {
    console.log(
      "\nWhat next?\n  1) Test JWT (GET /API/v2.0/accounts/:accountId)\n  2) Refresh tokens\n  3) View this app's authorization\n  4) Revoke this app's authorization\n  5) Re-login (e.g. as a different user)\n  q) Quit"
    )
    const answer = (await ask('> ')).trim()

    if (answer === 'q' || answer === '') break

    try {
      if (answer === '1') {
        await testJwt(tokens.access_token)
      } else if (answer === '2') {
        tokens = await refreshTokens(tokens.refresh_token)
      } else if (answer === '3') {
        await listAuthorizations(tokens.access_token)
      } else if (answer === '4') {
        const apps = await listAuthorizations(tokens.access_token)
        if (apps.length) {
          const input = (await ask(`Revoke which one (1-${apps.length})? `)).trim()
          const app = apps[Number(input) - 1]
          if (app) {
            await revokeAuthorization(tokens.access_token, app.clientId)
          } else {
            console.log('Not a valid selection.')
          }
        }
      } else if (answer === '5') {
        tokens = await login()
        printTokens(tokens)
      } else {
        console.log('Unrecognized option.')
      }
    } catch (e) {
      console.error('Failed:', e.message)
    }
  }

  rl.close()
}

async function login() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
  const state = { value: crypto.randomBytes(16).toString('hex'), codeChallenge }

  const { code, redirectUri } = await waitForCallback(state)

  const tokenResponse = await fetch(`${BACKEND_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  })
  const data = await tokenResponse.json()
  if (!tokenResponse.ok) {
    throw new Error(data.error_description || data.error || `HTTP ${tokenResponse.status}`)
  }
  return data
}

async function main() {
  CLIENT_ID = await resolveClientId()
  console.log(`Using client_id: ${CLIENT_ID}`)

  const tokens = await login()
  printTokens(tokens)
  await menu(tokens)
}

main().catch((e) => {
  console.error('Login failed:', e.message)
  process.exit(1)
})
