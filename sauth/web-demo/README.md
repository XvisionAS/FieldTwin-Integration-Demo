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
the token against the API, refresh it, and list/revoke connected apps.

## What a "client" is

There is no separate OAuth client registry. A client is a **custom tab /
integration** entry on a FieldTwin account (`account.customTabs`) — the same
thing that already powers embedded iframe tabs. Its `id` is the `client_id`
this demo sends.

PKCE (`code_challenge`/`code_verifier`, S256) is required for every client.

## Installation

1. Clone this code repository or download it from:  
   https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/refs/heads/master.zip
   and extract the zip contents
2. Install [NodeJS](https://nodejs.org/en/)
3. Open a Command Prompt or Terminal [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
4. Change into this directory
   ```
   cd <path to cloned repository or extracted zip>
   cd sauth/web-demo
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
     integration by manifest URL" field, or `PUT` it to
     `/API/v1.10/:accountId/integrations/manifest` as `{ "url": "<manifest URL>" }`
     (the backend fetches and validates it for you); or
   - register a custom tab by hand (Admin UI → Integrations → create a tab,
     set "Public OAuth client", redirect URI `http://localhost:5555/callback`)
     — see the fields table below.
3. Click **Log in**. No restart is needed once the client is registered —
   the demo picks up the manifest's own `id` as `client_id` automatically.
4. After approving the consent screen you land on a logged-in page showing
   the decoded JWT, the raw token pair, and buttons to test/refresh the
   token or list/revoke connected apps.

Fields relevant to OAuth, if registering by hand instead of by manifest:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Becomes `client_id`. Defaults to the manifest's own id (`oauth-demo-client`) unless you set `CLIENT_ID`/`MANIFEST_ID` below. |
| `name` | string | Shown to the user on the consent screen. |
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

### Output

Nothing is written to disk. Token pairs live in an in-memory session map,
keyed by an opaque, `HttpOnly` session cookie — restarting the server drops
all sessions.

## Security notes

- **PKCE is mandatory, for everyone.** Without the matching
  `code_verifier`, a stolen authorization code is useless.
- **`state` is checked**, not just echoed, before the code exchange is
  trusted.
- **The redirect from `/oauth/authorize` is a JSON response** the login
  frontend navigates itself — not an HTTP redirect — so a client shouldn't
  expect a `Location` header on that hop.
- **Token pairs never appear in a URL.** They're stored server-side and
  handed to the browser only via an `HttpOnly` cookie, so they can't leak
  through browser history, a `Referer` header, or an access log.
- **Revocation is immediate.** Deleting the custom tab, or the user revoking
  their own grant via `POST /oauth/authorizations/:clientId/revoke`, is
  checked on every resource call and every refresh — click **Test JWT**
  after revoking from another tab to see it take effect immediately, even
  on an otherwise-unexpired token.
