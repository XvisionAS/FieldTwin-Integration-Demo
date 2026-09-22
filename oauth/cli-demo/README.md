# OAuth2 CLI login demo

## Description

A minimal command-line client that logs a user in through FieldTwin's OAuth2
authorization-code + PKCE flow and obtains a JWT for that user — useful as a
reference for building an external (non-iframe) client that needs to act as a
real, logged-in FieldTwin user, e.g. a CLI tool or a backend service.

`login.mjs` opens the FieldTwin login page in the user's browser, listens on
a loopback port for the redirect, exchanges the returned code for a token
pair, and then offers a small text menu to exercise the token (test it
against the API, refresh it, view/revoke this app's own authorization, or
log in again).

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
A registered client's `public` field is currently informational/reserved —
it does not relax the PKCE requirement.

## Requirements

- **Node 18 or later** — the script uses Node's built-in `fetch`, added in
  Node 18.
- **A FieldTwin backend that serves the `/oauth/authorize`, `/oauth/token`
  and `/oauth/authorizations` routes.** These are newer than the rest of
  this repo; if you're pointed at an older/deployed FieldTwin instance and
  login fails immediately, check with the FieldTwin team on whether that
  instance has been upgraded to include them.
- The default `LOGIN_URL`/`BACKEND_URL` (`*.lvh.me`) assume a local FieldTwin
  development stack, where `lvh.me` and subdomains resolve to `127.0.0.1`.
  Against a deployed instance, set both to that instance's actual frontend
  and backend URLs (see
  [Environment variables](#environment-variables)) — e.g.
  `LOGIN_URL=https://app.example.com/login BACKEND_URL=https://api.example.com`.

## Installation

1. Clone this code repository or download it from:  
   https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/refs/heads/master.zip
   and extract the zip contents
2. Install [NodeJS](https://nodejs.org/en/)
3. Open a Command Prompt or Terminal [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
4. Change into this directory
   ```
   cd <path to cloned repository or extracted zip>
   cd oauth/cli-demo
   ```

No `npm install` is needed — the script only uses Node's built-in modules.

## Register a client

Before running the demo, register a custom tab as an OAuth client on your
FieldTwin account. Pick whichever of these is most convenient — all three
write the same shape into `account.customTabs`:

- **Admin UI**: account → Integrations → create a tab, then set
  "Public OAuth client" and add a redirect URI of
  `http://127.0.0.1:*/callback` (the port is a wildcard; scheme, host and
  path/query must match exactly) in the tab's Information panel.
- **API**: `POST /API/v1.9/:accountId/integrations` with a JSON body — see
  fields below.
- **Manifest URL**: see the companion [web-demo](../web-demo/), which serves
  a working manifest you can register from.

Fields relevant to OAuth:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Becomes `client_id`. Defaults to `oauth-demo-client` if you don't override `CLIENT_ID` below — register a tab with that id once and you never need to set `CLIENT_ID`. |
| `name` | string | Shown to the user on the consent screen. **Required** by the v1.9 integration schema. |
| `url` | string | **Required** by the v1.9 integration schema when registering via the API. Any placeholder URL works for this demo — it isn't otherwise used by the OAuth flow. |
| `redirectUris` | string[] | `http://127.0.0.1:*/callback` or `http://localhost:*/callback` — only the port is a wildcard. |
| `projectWideAccess` or `projectAllFromUser` | boolean | **At least one must be `true`**, since this demo logs in with no project context. |

## Usage

```
node login.mjs
```

This opens the login URL in your default browser (falls back to printing
the URL if it can't be opened automatically). Once you approve the consent
screen, the script prints the decoded JWT header/payload and drops into a
menu:

```
What next?
  1) Test JWT (GET /API/v2.0/accounts/:accountId)
  2) Refresh tokens
  3) View this app's authorization
  4) Revoke this app's authorization
  5) Re-login (e.g. as a different user)
  q) Quit
```

- **Test JWT** makes a real API call with the current access token, so it
  also proves whether the token still works after a revoke.
- **Refresh** exchanges the `refresh_token` for a fresh token pair.
- **View/revoke this app's authorization** call `GET /oauth/authorizations`
  and `POST /oauth/authorizations/:clientId/revoke` — the same self-service
  endpoints a user has for any client they've approved. The backend
  restricts an integration-scoped token to seeing and revoking only its own
  authorization, so this normally shows at most one entry, not every app
  you've connected — the full list is only available through your
  FieldTwin account's own interactive UI/session.

### Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `LOGIN_URL` | `http://futureon-webapp.lvh.me/login` | Where the authorization request is opened. |
| `BACKEND_URL` | `http://futureon-backend.lvh.me` | Base URL for `/oauth/token` and the resource API calls. |
| `CLIENT_ID` | `oauth-demo-client` | Override if you registered the custom tab under a different id. |

### Output

Nothing is written to disk — the JWT header/payload and each menu action's
result are printed to the console only. Token pairs are held in memory for
the life of the process.
