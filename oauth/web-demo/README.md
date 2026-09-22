# OAuth2 web login demo

## Description

A minimal server-side web client that logs a user in through FieldTwin's
OAuth2 authorization-code + PKCE flow and obtains a JWT for that user —
useful as a reference for building a web app that needs to act as a real,
logged-in FieldTwin user (as opposed to an iframe [integration](../../INTEGRATIONS.md),
which is handed a JWT directly by FieldTwin without a login flow).

`server.mjs` serves a "Log in" page, drives the authorization-code + PKCE
exchange, and stores the resulting token pair server-side in a session
(never in the URL or in a cookie itself). The logged-in page lets you test
the token against the API, refresh it, log out, and view/revoke this app's
own authorization.

This demonstrates **FieldTwin's implementation** of the OAuth2
authorization-code + PKCE flow. `/oauth/token` requests use
`application/x-www-form-urlencoded` bodies and include `client_id`, per
RFC 6749 §4.1.3, matching a standard public-client token request.

Authorization starts through the FieldTwin login frontend, which then drives
`/oauth/authorize` itself — a client doesn't call that endpoint directly.
`/oauth/authorize` responds with **JSON**, which the login frontend
navigates on the client's behalf, not an HTTP redirect with a `Location`
header.

## What a "client" is

There is no separate OAuth client registry. A client is a **custom tab /
integration** entry on a FieldTwin account (`account.customTabs`) — the same
thing that already powers embedded iframe tabs. Its `id` is the `client_id`
this demo sends.

PKCE (`code_challenge`/`code_verifier`, S256) is required for every client.
The manifest's `public` field is currently informational/reserved — it does
not relax the PKCE requirement.

## Requirements

- **Node 18 or later** — the scripts use Node's built-in `fetch`, added in
  Node 18.
- **A FieldTwin backend that serves the `/oauth/authorize`, `/oauth/token`
  and `/oauth/authorizations` routes.** These are newer than the rest of
  this repo; if you're pointed at an older/deployed FieldTwin instance and
  login fails immediately, check with the FieldTwin team on whether that
  instance has been upgraded to include them.
- The default `LOGIN_URL`/`BACKEND_URL` (`*.lvh.me`) assume a local FieldTwin
  development stack, where `lvh.me` and subdomains resolve to `127.0.0.1`.
  Against a deployed instance, set both to that instance's actual frontend
  and backend URLs (see [Environment variables](#environment-variables)) —
  e.g. `LOGIN_URL=https://app.example.com/login BACKEND_URL=https://api.example.com`.

## Installation

1. Clone this code repository or download it from:  
   https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/refs/heads/master.zip
   and extract the zip contents
2. Install [NodeJS](https://nodejs.org/en/)
3. Open a Command Prompt or Terminal [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
4. Change into this directory
   ```
   cd <path to cloned repository or extracted zip>
   cd oauth/web-demo
   ```

No `npm install` is needed — the script only uses Node's built-in modules.

## Usage

```
node server.mjs
```

This starts a server on `http://localhost:5555` (configurable, see below)
and prints the manifest URL it's serving at `/manifest`.

1. Open `http://localhost:5555/` in a browser.
2. Register the demo as a client on your FieldTwin account — either:
   - copy the manifest URL shown on the page into the admin UI's "add
     integration by manifest URL" field. The browser fetches it directly, so
     this always works for a demo running on your own machine; or
   - `PUT` it to `/API/v1.10/:accountId/integrations/manifest` as
     `{ "url": "<manifest URL>" }`. **This only works if the FieldTwin
     backend itself can reach that URL** — the endpoint fetches it
     server-side. Since the manifest URL defaults to
     `http://localhost:<PORT>/manifest`, "localhost" here means the
     *backend's* localhost, which is only this demo's machine when the
     backend also runs locally (e.g. a local dev stack). Against a
     deployed/remote backend this will fail; use the Admin UI method above
     instead, or serve the manifest somewhere the backend can reach; or
   - register a custom tab by hand (Admin UI → Integrations → create a tab,
     set "Public OAuth client", redirect URI `http://localhost:5555/callback`)
     — see the fields table below.
3. Click **Log in**. No restart is needed once the client is registered —
   the demo picks up the manifest's own `id` as `client_id` automatically.
4. After approving the consent screen you land on a logged-in page showing
   the decoded JWT, this app's own authorization (with a revoke button), and
   buttons to test/refresh the token or log out. The raw access token is
   **not** shown by default — see [Security notes](#security-notes).

Fields relevant to OAuth, if registering by hand instead of by manifest:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Becomes `client_id`. Defaults to the manifest's own id (`oauth-demo-client`) unless you set `CLIENT_ID`/`MANIFEST_ID` below. |
| `name` | string | Shown to the user on the consent screen. **Required** by the integration schema. |
| `url` | string | **Required** by the integration schema. Any placeholder URL works for this demo — it's the login/manifest URL that matters for OAuth, not this field. |
| `redirectUris` | string[] | Must exactly match `http://localhost:<PORT>/callback`. |
| `projectWideAccess` | boolean | Set on the demo's manifest so login works with no project context, since this is an account-level client with no FieldTwin project of its own. |

## Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `5555` | Port the demo listens on. |
| `LOGIN_URL` | `http://futureon-webapp.lvh.me/login` | Where the authorization request is opened. |
| `BACKEND_URL` | `http://futureon-backend.lvh.me` | Base URL for `/oauth/token` and the resource API calls. |
| `MANIFEST_ID` | `oauth-demo-client` | The `id` advertised in the served manifest. |
| `CLIENT_ID` | *(manifest's `id`)* | Override if you registered the custom tab under a different id than the manifest advertises. |
| `UNSAFE_SHOW_TOKENS` | *(unset)* | Set to `1` to render the raw `access_token` on the logged-in page, for debugging. **Unsafe outside a local demo** — see [Security notes](#security-notes). The `refresh_token` is never rendered, regardless of this setting. |

### Output

Nothing is written to disk. Token pairs live in an in-memory session map,
keyed by an opaque, `HttpOnly` session cookie. Sessions and in-flight login
attempts expire on their own (see [Security notes](#security-notes)), and
restarting the server drops everything immediately.

## Security notes

- **PKCE is mandatory, for everyone.** Without the matching
  `code_verifier`, a stolen authorization code is useless.
- **`state` is checked**, not just echoed, before the code exchange is
  trusted, and a pending login expires after 5 minutes.
- **The redirect from `/oauth/authorize` is a JSON response** the login
  frontend navigates itself — not an HTTP redirect — so a client shouldn't
  expect a `Location` header on that hop.
- **Token pairs never appear in a URL and are never sent to the browser.**
  They're stored server-side, keyed by an opaque `HttpOnly` session cookie,
  so they can't leak through browser history, a `Referer` header, or an
  access log. The logged-in page shows only the decoded JWT and API test
  results by default. The raw `access_token` can be shown for debugging via
  `UNSAFE_SHOW_TOKENS=1`, clearly labeled as unsafe when it is — the
  `refresh_token` is never rendered, opt-in or not. Every authenticated
  response also sends `Cache-Control: no-store, private` and
  `Pragma: no-cache` so it isn't retained by the browser or an intermediary.
- **Sessions expire.** In-memory sessions and pending logins are capped in
  count and pruned on a timer, and `Log out` deletes a session immediately
  rather than waiting for it to expire or for the server to restart. This is
  demo-only bookkeeping — size a real deployment's session lifetime to its
  actual refresh-token/session policy.
- **State-changing requests carry a per-session CSRF token**, embedded as a
  hidden form field and checked on every `POST`, and the `Origin` header is
  checked against this demo's own origin as defense in depth. `SameSite=Lax`
  alone isn't enough, since cookies aren't isolated by port and another
  localhost application can still count as "same-site".
- **The server only binds to `127.0.0.1`**, matching the loopback-client
  model (RFC 8252 §7.3) — it isn't reachable from other devices on the
  network.
- **Revocation is immediate.** Deleting the custom tab, or the user revoking
  their own grant via `POST /oauth/authorizations/:clientId/revoke`, is
  checked on every resource call and every refresh — click **Test JWT**
  after revoking from another tab to see it take effect immediately, even
  on an otherwise-unexpired token.
- **"This app's authorization"** reflects only what this integration-scoped
  token can see — the backend restricts it to its own grant, not every app
  you've connected. To see or manage everything you've connected, use your
  FieldTwin account's own interactive UI/session.
