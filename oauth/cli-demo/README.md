# OAuth2 CLI login demo

## Description

A minimal command-line client that logs a user in through FieldTwin's OAuth2
authorization-code + PKCE flow and obtains a JWT for that user — useful as a
reference for building an external (non-iframe) client that needs to act as a
real, logged-in FieldTwin user, e.g. a CLI tool or a backend service.

`login.mjs` opens the FieldTwin login page in the user's browser, listens on
a loopback port for the redirect, exchanges the returned code for a token
pair, and then offers a small text menu to exercise the token (test it
against the API, refresh it, list/revoke connected apps, or log in again).

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
| `name` | string | Shown to the user on the consent screen. |
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
  3) List connected apps
  4) Revoke a connected app
  5) Re-login (e.g. as a different user)
  q) Quit
```

- **Test JWT** makes a real API call with the current access token, so it
  also proves whether the token still works after a revoke.
- **Refresh** exchanges the `refresh_token` for a fresh token pair.
- **List/revoke connected apps** call `GET /oauth/authorizations` and
  `POST /oauth/authorizations/:clientId/revoke` — the same self-service
  endpoints a user has for any client they've approved.

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
