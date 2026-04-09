# Integrations in FieldTwin

## Revision

| Number | Author | Description |
| :-- | :-- | :-- |
| 1 | olivier | Initial release |
| 2 | olivier | Added `canEdit` and list of user rights |
| 3 | olivier | Added custom message |
| 4 | olivier | Added `loaded` event description |
| 5 | olivier | Added information about project wide access |
| 6 | olivier | Added information about all project access |
| 7 | olivier | Added didUpdate/didCreate/didDelete details |
| 8 | olivier | Added `tokenRefresh` event description |
| 9 | olivier | Added modification to didUpdate message for meta datum value |
| 10 | olivier | Added `clearSelection` message |
| 11 | olivier | removed trafficManagerJWT |
| 12 | olivier | Added `requestInfo` and `replyInfo` |
| 13 | olivier | Added `getViewBox` |
| 14 | matt | Added `didClone`, documents, shapes, segments, parent attributes; updates for 8.0; removed activities and ports |
| 15 | olivier | Added `toast` |
| 16 | olivier | Added `getResources` |
| 17 | matt | Described `integrationId` on `replyInfo`, updated `projectData` content |
| 18 | peter | Added `createResources` `updateResources` `deleteResources` |
| 19 | christian | added `APIServerIsReady` and `APIVersion` to `loaded` event |
| 20 | olivier | Added `exportToGLTF` |
| 21 | olivier | added `getVisibleResources` query and `visibleResources` reply |
| 22 | olivier | added `tags` attribute to `replyInfo` |
| 23 | christian | added `project.CRS` to `projectData` |
| 24 | olivier | added `dashboardUrl`, `frontendUrl` and FT version to loading event |
| 25 | olivier | added `didDrag` |
| 26 | olivier | Added `exportToGeoJSON` |
| 27 | olivier | Added missing attributes to `loaded` event and documented API pod readiness events |
| 28 | olivier | Added `selectByTag` message |
| 29 | olivier | Added `displayDocument` message for opening documents in file viewer |
| 32 | olivier | Added `requestTagsInfos` message |
| 33 | olviier | Added `updateTagStyles` |
| 34 | olivier | Added Dynamic Pages documentation |
| 35 | olivier | Added `getResourcesByTags` message |
| 36 | olivier | Added `updateTagsAnnotation` and `clearTagsAnnotation` messages |
| 37 | olivier | Added Operation Search documentation |
| 38 | olivier | Added `openOperationPanel` message documentation |
| 39 | olivier | Added Integration Manifest documentation |
| 40 | olivier | Added `timeSeriesInfo`, `getTimeSeriesData` and `timeSeriesData` messages for time-series viewer |
| 41 | olivier | Added `displayTimeSeries` message to open the time-series panel in the operation HUD |
| 42 | olivier | Added `contextMenuUpdate` and `contextMenuAction` documentation for integration-defined context menu entries |
| 43 | olivier | Added dynamic page placement and operation visibility fallback rules to manifest and integration docs |
| 44 | olivier | Added designer visibility configuration with `showInDesigner` for integrations and dynamic pages |
| 45 | olivier | Clarified background loading, toolbar dialog placement, and dynamic-page parent behavior |

## Introduction

This document explains how to develop an integration for **FieldTwin**. An _integration_ is a web page,
which is loaded inside the main interface of **FieldTwin** through an _iFrame_.

There are two kinds of integrations:

1. **global**, these integrations are loaded when the application starts, and are kept alive through
   the whole life cycle of the application. These can receive a message when a project is created or
   deleted from the Dashboard.
2. **local**, these integrations are loaded only when a project is opened. They only receive messages
   that relate to the project that is currently open. These generally have a user interface (UI) which
   is visible in FieldTwin Design's main interface, but integrations aren't required to have a UI.
   In this document, integrations without a UI are referred to as _headless_.

## Setting up an integration

> You need to be the administrator of an account to be able to setup a new integration.

Link: [FieldTwin Online Documentation](https://admin.fieldtwin.com/Integrations/#tabs)

> By default, and for security reasons, an integration receives a JWT that only gives access to the
> sub project the user is currently editing. Through the administration panel, you can also:
>
> - Give access to the whole project, all of its sub projects
> - Give access to all the projects a user can access across the account

## Integration Manifest

An integration can provide a manifest endpoint to allow administrators to quickly import its configuration. This endpoint should return a JSON object describing the integration's properties.

### Manifest Endpoint Requirements

1. **Method**: `GET`
2. **Response Format**: `application/json`

### Example Manifest

```json
{
  "name": "Asset Inspector",
  "url": "https://asset-inspector.example.com",
  "logo": "https://asset-inspector.example.com/logo.png",
  "tabPosition": "property-panel",
  "showInDesigner": true,
  "showInOperation": true,
  "resourceTypes": ["stagedAssets"],
  "projectWideAccess": true,
  "allowAccessToClipboard": true
}
```

### Manifest Properties

| Property | Type | Description |
| :-- | :-- | :-- |
| `name` | `string` | **Required**. The display name of the integration. |
| `url` | `string` | The main entry point URL for the integration. Required unless `dynamicPagesUrl` is used instead. If `runInBackground` is enabled and `backgroundUrl` is omitted, FieldTwin uses this URL for the hidden background instance as well. |
| `logo` | `string` | URL to an image to be used as the integration's logo. |
| `tabPosition` | `string` | Where the integration appears (`bottom`, `property-panel`, `hidden`, `global`, `main-toolbar-dialog`). `main-toolbar-dialog` integrations open from the main toolbar rather than being added from the Layout menu. |
| `showInDesigner` | `boolean` | Whether the integration is available outside operation mode, including designer and presenter. Defaults to `true`. |
| `showInOperation` | `boolean` | Whether the integration is available in operation mode. Defaults to `true`. |
| `dynamicPagesUrl` | `string` | URL to fetch dynamic pages from (see [Dynamic Pages](#dynamic-pages) section). The returned pages control the visible tabs, while the parent integration can still be loaded in the background when `runInBackground`, `backgroundUrl`, `hidden`, or `global` behavior is configured. |
| `projectWideAccess` | `boolean` | If true, the JWT gives access to the entire project (all sub-projects). |
| `projectAllFromUser` | `boolean` | If true, the JWT gives access to all projects the user can access in the account. |
| `proxy` | `boolean` | If true, FieldTwin will proxy requests to the integration (useful for HTTP or CORS issues). |
| `useGET` | `boolean` | Use GET instead of POST when loading the iframe. |
| `noURLParams` | `boolean` | If true and `useGET` is true, don't pass parameters in the URL; use window messages instead. |
| `resourceTypes` | `array` | List of resource types (`stagedAssets`, `connections`) this integration applies to (for `property-panel`). |
| `width` / `height` | `string` | CSS dimensions for the dialog (for `main-toolbar-dialog`). |
| `allowAccessToClipboard` | `boolean` | If true, the iframe is allowed access to the system clipboard. |
| `doNotUseSubprojectApiEndpoints` | `boolean` | If true, indicates the integration doesn't need to wait for sub-project API pods to be ready. |
| `runInBackground` | `boolean` | If true, FieldTwin also loads an additional hidden copy of the parent integration for background work. |
| `backgroundUrl` | `string` | Optional URL used by the hidden background copy. When omitted, the background copy falls back to `url`. |
| `projectSettingsUrl` | `string` | URL for an optional settings page in the Project settings. |
| `accountSettingsUrl` | `string` | URL for an optional settings page in the Account settings. |
| `compatibleWithChildAccount` | `boolean` | If true, indicates compatibility with child accounts in multi-account setups. |

## Dynamic Pages

Dynamic Pages allow an integration to provide multiple pages/tabs that are dynamically fetched from an external endpoint. Instead of defining a static `url` for the integration, you can configure a `dynamicPagesUrl` endpoint that returns a list of available pages.

When dynamic pages are enabled, each page can override where it appears and whether it is available in designer or operation mode. If a page omits one of these fields, FieldTwin falls back to the integration-level configuration. If the integration also omits it, FieldTwin uses the default value.

### Placement and visibility resolution

For each resolved dynamic page, FieldTwin uses the following fallback rules:

1. `page.tabPosition` → `integration.tabPosition` → `bottom`
2. `page.showInDesigner` → `integration.showInDesigner` → `true`
3. `page.showInOperation` → `integration.showInOperation` → `true`

Supported `tabPosition` values are `bottom`, `property-panel`, `hidden`, `global`, and `main-toolbar-dialog`.

`main-toolbar-dialog` pages are opened from the main toolbar. They are not added through the Layout menu.

### Configuration

In the integration settings, set the `dynamicPagesUrl` field to your endpoint URL instead of using the static `url` field for visible tabs.

When dynamic pages are returned, the visible default tab from `url` is replaced by the resolved dynamic pages. However, the parent integration definition is still used for headless/background behavior. In practice this means:

- if `runInBackground` is `true`, FieldTwin still loads a hidden parent integration in the background
- if `backgroundUrl` is set, that URL is used for the hidden background copy
- if `backgroundUrl` is omitted, the hidden background copy falls back to `url`
- hidden or global parent integrations continue to behave as headless/background integrations even when they also provide dynamic pages

### Endpoint Requirements

Your endpoint must:

1. Accept **POST** requests
2. Accept the `Authorization` header containing the user's JWT token (`Bearer <token>`)
3. Return a JSON array of page definitions

### Request Format

FieldTwin will send a POST request to your `dynamicPagesUrl` endpoint:

```http
POST /your-dynamic-pages-endpoint HTTP/1.1
Content-Type: application/json
Authorization: Bearer <user-jwt-token>
Accept: application/json

{}
```

The request body is currently an empty JSON object `{}` but is reserved for future use.

### Response Format

Your endpoint should return a JSON array of page objects:

```json
[
  {
    "title": "Dashboard",
    "iframeUrl": "https://your-server.com/dashboard",
    "path": "dashboard",
    "tabPosition": "bottom",
    "showInDesigner": true,
    "showInOperation": true
  },
  {
    "title": "Reports",
    "iframeUrl": "https://your-server.com/reports",
    "path": "reports"
  },
  {
    "title": "Settings",
    "iframeUrl": "https://your-server.com/settings",
    "path": "settings"
  }
]
```

### Page Object Properties

| Property | Required | Description |
| :-- | :-- | :-- |
| `title` | Yes | Display name shown in the tab |
| `iframeUrl` | Yes | Full URL to load in the iframe for this page |
| `path` | No | Unique identifier for the page (used internally). If omitted, FieldTwin generates a stable fallback path using the page order (`page-1`, `page-2`, ...). |
| `tabPosition` | No | Overrides the integration `tabPosition` for this page. Falls back to the integration setting, then `bottom`. |
| `showInDesigner` | No | Overrides whether this page is available outside operation mode, including designer and presenter. Falls back to the integration setting, then `true`. |
| `showInOperation` | No | Overrides whether this page is available in operation mode. Falls back to the integration setting, then `true`. |

### Caching

Dynamic pages are cached for 5 minutes by default. After the cache expires, FieldTwin will fetch the list again on the next request.

### Example Server Implementation (Node.js + Express)

```javascript
const express = require('express')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

app.post('/dynamic-pages', (req, res) => {
  // Extract and verify the JWT from Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' })
  }

  const token = authHeader.split(' ')[1]

  // Decode the JWT to get user information
  // Note: In production, verify the token signature using FieldTwin's public key
  const decoded = jwt.decode(token)
  const userId = decoded?.userId

  // Return pages based on user permissions or other logic
  const pages = [
    {
      title: 'My Dashboard',
      iframeUrl: `https://your-server.com/dashboard?user=${userId}`,
      path: 'dashboard',
    },
    {
      title: 'Analytics',
      iframeUrl: 'https://your-server.com/analytics',
      path: 'analytics',
    },
  ]

  res.json(pages)
})

app.listen(3000)
```

### Use Cases

Dynamic Pages are useful when:

- You need to show different pages based on user permissions
- The available pages change based on external data or configuration
- You want to provide a personalized set of tools per user
- The integration serves multiple distinct features that should appear as separate tabs

## How to serve an integration for use in FieldTwin

Depending on how the integration was setup, **FieldTwin** will create an iFrame that either generates
a _GET_ or a _POST_ request to the integration URL.

This request will contain the following attributes:

`token`, `frontendUrl`, `backendUrl`, `stream`, `subProject`, `project`, `account`, `canEdit`, `projectWideAccess`, `projectAllFromUser`

- As query parameters for _GET_
- As the request body for _POST_

| attribute            | FT version | description                                                                                                                                 |
| :------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `token`              |            | Security token (JWT) needed for making a FieldTwin API call                                                                                 |
| `frontendUrl`        |            | URL of the window that contains the iframe. Also the link for viewing the subproject                                                        |
| `backendUrl`         |            | URL of FieldTwin backend. Use this as the base of the JWT public key URL and the API URL                                                    |
| `designerUrl`        | 8.1        | URL of FieldTwin designer.                                                                                                                  |
| `dashboardUrl`       | 8.1        | URL of FieldTwin dashboard.                                                                                                                 |
| `frontendUrl`        | 8.1        | URL of the frontends that host the integration                                                                                              |
| `stream`             | 8.0        | In FieldTwin 8.0 and later - the ID of the subproject branch                                                                                |
| `subProject`         |            | The currently open sub project ID                                                                                                           |
| `project`            |            | The currently open project ID                                                                                                               |
| `account`            |            | The ID of the account that contains the project                                                                                             |
| `canEdit`            |            | Whether the user's role enables 'edit' rights for the integration. To be handled by the integration itself, FieldTwin does not enforce this |
| `projectWideAccess`  |            | Whether the integration is granted access to the whole project (not just the current sub project)                                           |
| `projectAllFromUser` |            | Whether the integration is granted access to all of the current user's projects in the account                                              |

`token` is a [JWT](https://jwt.io/) and contains information about the user and user rights.
You can parse it with any _JWT_ library but to be secure you must ensure that the token has been
signed by FieldTwin. The public key to validate this can be found at:
`https://backend.[name-of-instance].fieldtwin.com/token/publicKey`.

The FieldTwin API can be accessed using `https://backend.[name-of-instance].fieldtwin.com`
so for `https://app.fieldtwin.com` the API access is `https://backend.app.fieldtwin.com/API/...`.
Link: [FieldTwin API Online Documentation](https://api.fieldtwin.com).

Integration example, using `NodeJS + Express`:

```javascript
const express = require('express')

const app = express()

app.use(express.json())

// POST verb
app.post('/', function (request, response) {
  response.send(`
  <html>
    <body>
      <h1>TOKEN: ${request.body.token}</h1>
      <h1>PROJECT ID:${request.body.project}</h1>
      <h1>SUB-PROJECT ID:${request.body.subProject}</h1>
    </body>
  </html>
  `)
})

// or ...

// GET verb
app.get('/', function (request, response) {
  response.send(`
  <html>
    <body>
      <h1>TOKEN: ${request.query.token}</h1>
      <h1>PROJECT ID:${request.query.project}</h1>
      <h1>SUB-PROJECT ID:${request.query.subProject}</h1>
    </body>
  </html>
  `)
})

app.listen()
```

This example webserver will reply to a _POST_ request on `/`, and return HTML that contains the
token sent by **FieldTwin**.

> Note that this reference implementation depends on `npm install express`

> If you do not have access to a nodejs backend, and just want to have a one page integration,
> you can receive these same attributes by listening for the window message `loaded`.
> Example: https://github.com/XvisionAS/FieldTwin-Integration-Demo/blob/75fb43e1b31014753354789078f646d325075eae/doc-tab/index.html#L37-L42

## Refreshing the JWT

By default the JWT has an expiration time of one (1) hour after it was created. You can refresh the
token by calling this endpoint: `https://backend.[name-of-instance].fieldtwin.com/token/refresh`.
You pass the JWT the usual way (using header `Authentication: Bearer ${JWT}`) and you receive
back a JSON object with the new JWT inside the attribute `token`.

Since FieldTwin 5.5, a new message is posted by the application to the integration `tokenRefresh`
that passes a new JWT, so if you handle this message you do not need to refresh the token.

## Generate a JWT using an API token

It is possible to generate a JWT using an API token. In FieldTwin 8.0+ this needs to be an API token
that is not restricted to a user role.

Send a **POST** request to this endpoint: `https://backend.[name-of-instance].fieldtwin.com/token/generate`.
You pass the API token the usual way (using header `token: [API Token]`).
The body of the request must contain:

- `userId` : ID of the user the JWT will be generated for.
- optional `subProjectId` : ID of the sub project the JWT will be generated for. Usually required.
  If blank, generates a JWT that can be used to call a limited number of account related API calls.
- optional `customTabId` : integration ID to generate the token for.
  Integration ID can be looked up by an API call or in the account settings.

On success, the query returns a JSON object that contains an attribute `token` containing
a JWT for the requested user.

## User rights management

Within the JWT passed to the integration, there is an attribute `userRights` that contains what the
user has access to. These rights will be enforced by the API you are using, but in case you need to
check them, this is the list of possible values:

- Account
  - `canAdminAccount`: User is an administrator of the account
- Project
  - `canCreateProject`: User can create project
  - `canCloneProject`: User can clone an existing project
- Generic rights
  - `canAdmin`: User is an administrator of the project, if this is true, user can also edit everything
  - `canEdit`: User can edit the project, if this is true, user can edit everything
- Connections
  - `canViewConnections`: User can view connections
  - `canViewConnectionsMetaData`: User can view connections meta data
  - `canViewConnectionsCosts`: User can view connections costs
  - `canEditConnections`: User can edit connections
  - `canEditConnectionsMetaData`: User can edit connections meta data
  - `canEditConnectionsCosts`: User can edit connections costs
- Staged assets
  - `canViewStagedAssets`
  - `canViewStagedAssetsMetaData`
  - `canViewStagedAssetsCosts`
  - `canEditStagedAssets`
  - `canEditStagedAssetsMetaData`
  - `canEditStagedAssetsCosts`
- Layers
  - `canViewLayers`
  - `canViewLayersMetaData`
  - `canViewLayersCosts`
  - `canEditLayers`
  - `canEditLayersMetaData`
  - `canEditLayersCosts`
- Text Layers
  - `canViewOverlays`
  - `canEditOverlays`
- Ports
  - `canViewPorts`
  - `canEditPorts`
- Shapes
  - `canViewShapes`
  - `canViewShapesMetaData`
  - `canEditShapes`
  - `canEditShapesMetaData`
- Wells
  - `canViewWells`
  - `canViewWellsMetaData`
  - `canViewWellsCosts`
  - `canEditWells`
  - `canEditWellsMetaData`
  - `canEditWellsCosts`
- Activities
  - `canViewActivities`
  - `canViewActivitiesCosts`
  - `canEditActivities`
  - `canEditActivitiesCosts`
- Custom Costs
  - `canEditCustomCosts`
  - `canViewCustomCosts`
- Documents
  - `canViewDocuments`
  - `canEditDocuments`
- View Points
  - `canEditBookmarks`
  - `canViewBookmarks`

> Not all attributes will be present in `userRights`.
> If `canEdit` is true for the project, you can assume that all `canViewThing` and `canEditThing` are true.
> If `canAdmin` is true for the project, all `canView` and `canEdit` and `canCreate` are true.
> If `canAdminAccount` is true, all other permissions are true.

## Samples

Follow this link : [GitHub Repository](https://github.com/XvisionAS/FieldTwin-Integration-Demo)

## Communication from FieldTwin to integration

The main interface of **FieldTwin** can send and receive messages from the integration using
[postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

FieldTwin identifies each integration via its `customTabId` (provided in the `loaded` event). All messages sent from the integration to the host are automatically tagged with this ID by the host. This ID is used by the host to group search results, manage progress indicators, and isolate visual filters for each integration instance.

Here's how an integration can receive these messages from **FieldTwin** :

```javascript
window.addEventListener('message', function (event) {
  // IMPORTANT: Check the origin of the data!
  if (~event.origin.indexOf('https://backend.app.fieldtwin.com')) {
    if (event.data instanceof Blob) {
      // this is only use by `exportToGLTF`
    } else {
      console.log(JSON.stringify(event.data, null, 2))
    }
  } else {
    // Not coming from correct origin
    return
  }
})
```

Follow this link: [Sample](https://github.com/XvisionAS/FieldTwin-Integration-Demo/tree/master/events-demo/views)

Definition of the different element _type_ that can be sent:

- for the `select` event:
  - `connection`
  - `connectionSegment`
  - `customCost`
  - `layer`
  - `overlay`
  - `shape`
  - `stagedAsset`
  - `well`
  - `wellBore`
  - `wellBoreSegment`
- for the other events you can also in addition have:
  - `bookmark`
  - `document`
  - `documentRevision`
  - `metaDatumValue`
  - `project`
  - `subProject`

Definition of the different attributes for types can be found in [API docs](https://api.fieldtwin.com)

### If `event.data` is an instance of Blob

This was introduced to handle `exportToGLTF` message, which export the whole field to GLTF.
In this case, the function return a blob which contains the GLTF data.
Example :

```javascript
async function onMessage(message) {
  if (message.data instanceof Blob) {
    // use library "saveAs" to save the blob to a file
    saveAs(message.data, `export.gltf`)
  } else {
    // handle message as JSON
  }
}
```

### loaded

This event is sent when an integration iframe is fully loaded. It contains information about subProject,
project and tokens used to communicate with API. The argument will contain these attributes:

| Attribute          | Description                                                         |
| :----------------- | :------------------------------------------------------------------ |
| event              | is set to `loaded`                                                  |
| subProject         | is set to subproject ID, if a sub project is loaded                 |
| subProjectDocument | is set to subproject document ID                                    |
| stream             | is set to the subproject branch ID in FieldTwin 8.0 and later       |
| project            | is set to project ID, if a project is loaded                        |
| account            | is set to account ID, if a project is loaded                        |
| token              | is set to the JWT that the integration can use to query the API     |
| backendUrl         | the FieldTwin backend URL (JWT public key and API)                  |
| frontendUrl        | the URL hosting the iframe (URL to view the subproject)             |
| designerUrl        | FieldTwin designer URL                                              |
| dashboardUrl       | FieldTwin dashboard URL                                             |
| projectorUrl       | FieldTwin projection service URL                                    |
| canEdit            | whether the user's role has 'edit' rights for the integration       |
| projectWideAccess  | whether the JWT grants access to the whole project                  |
| projectAllFromUser | whether the JWT grants access to all of the current user's projects |
| customTabId        | unique identifier for this integration tab instance                 |
| selection          | what is currently selected. Array of object { type, id }            |
| cssUrl             | main CSS url                                                        |
| cssThemeUrl        | current theme CSS url                                               |
| cloudType          | azure, gcloud, s3, onpremise                                        |
| superAdmin         | true if current user is super admin                                 |
| sessionId          | unique session identifier for this integration instance             |
| userId             | current user's ID                                                   |
| userMail           | current user's email address                                        |
| APIServerIsReady   | if set to true, the API server is ready to receive requests         |
| APIVersion         | the version of the API server in the form "vx.y" e.g. "v1.10"       |

### tokenRefresh

This message is sent before the previous JWT expires. It contains a new refreshed JWT that the
integration can use to communicate with FieldTwin backend.

| Attribute     | Decription                                                      |
| :------------ | :-------------------------------------------------------------- |
| event         | is set to `tokenRefresh`                                        |
| subProject    | is set to subProject ID, if a sub project is loaded             |
| project       | is set to project ID, if a project is loaded                    |
| account       | is set to account ID, if a project is loaded                    |
| token         | is set to the JWT that the integration can use to query the API |
| backendUrl    | is set to the address of the backend the JWT is refering to     |
| isFrameActive | true if the frame is currently selected and active in the UI    |

### apiPodIsReady / apiPodIsNotReady

These events are sent periodically to inform the integration about the status of the API server pod.
The API server uses dynamic pods that may need to warm up or may become unavailable.

| Attribute      | Description                                                       |
| :------------- | :---------------------------------------------------------------- |
| event          | is set to `apiPodIsReady` or `apiPodIsNotReady`                   |
| subProject     | is set to subProject ID                                           |
| APIServerReady | boolean indicating if the API server is ready to receive requests |
| APIVersion     | the version of the API server in the form "vx.y" e.g. "v1.10"     |

### siblingApiPodIsReady / siblingApiPodIsNotReady

These events are sent when an integration has project-wide access. They inform about the readiness
status of API pods for sibling subProjects (other subProjects in the same project).

| Attribute               | Description                                                   |
| :---------------------- | :------------------------------------------------------------ |
| event                   | is set to `siblingApiPodIsReady` or `siblingApiPodIsNotReady` |
| subProject              | is set to the sibling subProject ID                           |
| sibling                 | always true to indicate this is a sibling pod status          |
| siblingAPIServerIsReady | boolean indicating if the sibling API server is ready         |
| APIVersion              | the version of the API server in the form "vx.y" e.g. "v1.10" |

### costQuery

This message is sent after the integration posted a message `getCostQuery`.
The result will contain these attributes:

| Attribute       | Decription                                                                                                                               |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| event           | is set to `costQuery`                                                                                                                    |
| isFrameActive   | true if the frame is currently selected and active in the UI                                                                             |
| data            | is an object that contains:                                                                                                              |
| queryId         | is the value that you can pass when calling `getCostQuery`. It allows you to identify a query when posting `getCostQuery` multiple times |
| removeEmptyItem | do not include items that have no meta data defined                                                                                      |
| query           | is the actual query and is composed of :                                                                                                 |
| stagedAssets    | contains an array of assets and their meta data                                                                                          |
| connections     | contains an array of connections and their meta data                                                                                     |

### select

When one or more objects are selected in Design, a `select` event is sent.
The event will contain these attributes:

| Attribute                   | Description                                                                          |
| :-------------------------- | :----------------------------------------------------------------------------------- |
| event                       | is set to `select`                                                                   |
| isFrameActive               | true if the frame is currently selected and active in the UI                         |
| id                          | ( obsolete ) unique id of the first selected item                                    |
| type                        | ( obsolete ) type of the first selected item                                         |
| cursorPosition              | {x,y,z} value of cursor where selection happened (values in project space)           |
| cursorPosition.x            | x position                                                                           |
| cursorPosition.y            | y position                                                                           |
| cursorPosition.z            | z position, on seabed ( height sampled )                                             |
| cursorPosition.intersection | {x,y,z} value of cursor of intersecting point on a resource if any                   |
| data                        | contains an array of selected items                                                  |
| data.[].type                | contains the type of the selected item                                               |
| data.[].id                  | unique id of the selected item                                                       |
| data.[].name                | display name of selected item                                                        |
| data.[].isForeign           | true if the selected item comes from a linked parent project                         |
| data.[].project             | ID of the parent project when isForeign is true                                      |
| data.[].subProject          | ID of the parent subproject when isForeign is true                                   |
| data.[].stream              | ID of the parent subproject branch when isForeign is true in FieldTwin 8.0 and later |

#### Example of single selection

```javascript
{
  event: "select",
  isFrameActive: true,
  data: [
    {
      type: "stagedAsset",
      id: "-LvCAe-JPACMW-F74Ocs",
      name: "6 Slot Manifold - Diverless Vertical Connection System #1"
    }
  ],
  id: "-LvCAe-JPACMW-F74Ocs",
  type: "stagedAsset",
  cursorPosition: {
    x: 665000
    y: 400000
    z: 90
  }
}
```

#### Example of multi-selection

```javascript
{
  event: "select",
  isFrameActive: true,
  data: [
    {
      type: "stagedAsset",
      id: "-LvCAe-JPACMW-F74Ocs",
      name: "6 Slot Manifold - Diverless Vertical Connection System #1"
    },
    {
      type: "stagedAsset",
      id: "-LvCAbWf-Rf78H59Rnqj",
      name: "6 Slot Manifold - Diverless Horizontal Connection System #1"
    }
  ],
  id: "-LvCAe-JPACMW-F74Ocs",
  type: "stagedAsset",
  cursorPosition: {
    x: 665000
    y: 400000
    z: 90
  }
}
```

### selectByTag

Select resources based on their tags. This message allows you to filter and select resources that match the specified tags.
The event sent by the integration should contain these attributes:

| Attribute      | Description                                                                                                               |
| :------------- | :------------------------------------------------------------------------------------------------------------------------ |
| event          | must be set to `selectByTag`                                                                                              |
| tags           | Array of tag names (strings). Case-insensitive match                                                                      |
| matchAll       | Optional. If true (default), resources must have ALL specified tags. If false, resources need ANY of the tags             |
| resourceTypes  | Optional. Array of resource type names to search (e.g., ["well", "connection"]). If not specified, all types are searched |
| focusSelection | Optional. If true, the camera will zoom to show the selected resources                                                    |

#### Example selecting all wells with a specific tag

```javascript
window.parent.postMessage(
  {
    event: 'selectByTag',
    data: {
      tags: ['Production'],
    },
  },
  '*'
)
```

#### Example selecting resources with multiple tags (ALL required)

```javascript
window.parent.postMessage(
  {
    event: 'selectByTag',
    data: {
      tags: ['High Priority', 'Phase 1'],
      matchAll: true, // resources must have both tags
      resourceTypes: ['connection', 'stagedAsset'],
      focusSelection: true,
    },
  },
  '*'
)
```

#### Example selecting resources with any of the tags

```javascript
window.parent.postMessage(
  {
    event: 'selectByTag',
    data: {
      tags: ['Production', 'Development', 'Test'],
      matchAll: false, // resources need at least one of these tags
      focusSelection: true,
    },
  },
  '*'
)
```

### getResourcesByTags

Get resources grouped by tag without selecting them. This is useful when you need to query which resources have specific tags without modifying the current selection.

The event sent by the integration should contain these attributes:

| Attribute     | Description                                                                                                               |
| :------------ | :------------------------------------------------------------------------------------------------------------------------ |
| event         | must be set to `getResourcesByTags`                                                                                       |
| tags          | Array of tag names (strings). Case-insensitive match                                                                      |
| resourceTypes | Optional. Array of resource type names to search (e.g., ["well", "connection"]). If not specified, all types are searched |
| queryId       | Optional. An identifier that will be returned in the response for correlation                                             |

The response message will contain:

| Attribute    | Description                                                                                      |
| :----------- | :----------------------------------------------------------------------------------------------- |
| event        | is set to `resourcesByTags`                                                                      |
| data.results | Object where keys are the requested tags and values are arrays of `{ resourceType, resourceId }` |
| data.queryId | The queryId from the request (if provided)                                                       |
| data.error   | Error message if the request was invalid                                                         |

#### Example getting resources by tags

```javascript
window.parent.postMessage(
  {
    event: 'getResourcesByTags',
    data: {
      tags: ['VALVE-001', 'PUMP-002'],
      queryId: 'my-query-123',
    },
  },
  '*'
)
```

#### Response example

```javascript
{
  event: 'resourcesByTags',
  data: {
    results: {
      'VALVE-001': [
        { resourceType: 'stagedAssets', resourceId: 'asset-abc-123' },
        { resourceType: 'connections', resourceId: 'conn-xyz-456' }
      ],
      'PUMP-002': [
        { resourceType: 'stagedAssets', resourceId: 'asset-def-789' }
      ]
    },
    queryId: 'my-query-123'
  }
}
```

#### Example with resource type filter

```javascript
window.parent.postMessage(
  {
    event: 'getResourcesByTags',
    data: {
      tags: ['Production', 'Phase 1'],
      resourceTypes: ['stagedAsset', 'connection'],
    },
  },
  '*'
)
```

### updateTagsAnnotation

Create or update volatile annotation resources on resources that have specific tags. This is useful when an integration wants to display visual indicators (like status icons, counts, or labels) on resources based on their tags. The annotations are created as actual annotation resources but marked as volatile, so they are not saved to the database and exist only in the current session. Annotations are tracked per integration, so each integration manages its own annotations independently.

The event sent by the integration should contain these attributes:

| Attribute   | Description                                                                     |
| :---------- | :------------------------------------------------------------------------------ |
| event       | must be set to `updateTagsAnnotation`                                           |
| annotations | Object where keys are tag names and values are arrays of annotation definitions |
| queryId     | Optional. An identifier that will be returned in the response for correlation   |

Each annotation definition in the array can have these properties:

| Property | Description                                                                                        |
| :------- | :------------------------------------------------------------------------------------------------- |
| icon     | Optional. FontAwesome solid icon name (e.g., `faExclamationTriangle`, `faCheckCircle`, `faWrench`) |
| text     | Optional. Text to display on the annotation                                                        |
| count    | Optional. A number to display on the annotation                                                    |
| color    | Optional. Hex color string for the annotation (e.g., `#ff0000`). Defaults to `#ff9900`             |

The response message will contain:

| Attribute          | Description                                                                      |
| :----------------- | :------------------------------------------------------------------------------- |
| event              | is set to `tagsAnnotationUpdated`                                                |
| data.success       | Boolean indicating if the operation succeeded                                    |
| data.queryId       | The queryId from the request (if provided)                                       |
| data.annotatedTags | Array of objects with `tag`, `resourceCount`, and `annotationCount` for each tag |
| data.error         | Error message if the request was invalid                                         |

#### Example creating status annotations

```javascript
window.parent.postMessage(
  {
    event: 'updateTagsAnnotation',
    data: {
      annotations: {
        'VALVE-001': [{ icon: 'faCheckCircle', color: '#00ff00', text: 'Open' }],
        'VALVE-002': [{ icon: 'faTimesCircle', color: '#ff0000', text: 'Closed' }],
        'PUMP-003': [{ icon: 'faExclamationTriangle', color: '#ffaa00', count: 3 }],
      },
      queryId: 'status-update-1',
    },
  },
  '*'
)
```

#### Response example

```javascript
{
  event: 'tagsAnnotationUpdated',
  data: {
    success: true,
    queryId: 'status-update-1',
    annotatedTags: [
      { tag: 'VALVE-001', resourceCount: 2, annotationCount: 2 },
      { tag: 'VALVE-002', resourceCount: 1, annotationCount: 1 },
      { tag: 'PUMP-003', resourceCount: 1, annotationCount: 1 }
    ]
  }
}
```

### clearTagsAnnotation

Remove annotations previously created by the integration via `updateTagsAnnotation`. You can clear annotations for specific tags or all annotations created by the integration.

The event sent by the integration should contain these attributes:

| Attribute | Description                                                                                               |
| :-------- | :-------------------------------------------------------------------------------------------------------- |
| event     | must be set to `clearTagsAnnotation`                                                                      |
| tags      | Optional. Array of tag names to clear. If not provided, all annotations from this integration are cleared |
| queryId   | Optional. An identifier that will be returned in the response for correlation                             |

The response message will contain:

| Attribute        | Description                                     |
| :--------------- | :---------------------------------------------- |
| event            | is set to `tagsAnnotationCleared`               |
| data.success     | Boolean indicating if the operation succeeded   |
| data.queryId     | The queryId from the request (if provided)      |
| data.clearedTags | Array of tag names that had annotations removed |

#### Example clearing specific tag annotations

```javascript
window.parent.postMessage(
  {
    event: 'clearTagsAnnotation',
    data: {
      tags: ['VALVE-001', 'VALVE-002'],
    },
  },
  '*'
)
```

#### Example clearing all annotations from this integration

```javascript
window.parent.postMessage(
  {
    event: 'clearTagsAnnotation',
    data: {},
  },
  '*'
)
```

### unselect

Sent when the selection is reset (no more items are selected).
The event will contain these attributes:

| Attribute      | Description                                                                     |
| :------------- | :------------------------------------------------------------------------------ |
| event          | is set to `unselect`                                                            |
| isFrameActive  | true if the frame is currently selected                                         |
| cursorPosition | {x,y,z} value of cursor where unselect click happened (values in project space) |

### projectData

This message is sent after the integration posted a message `getProjectData`.
The result will contain these attributes:

| Attribute                               | Description                                    |
| :-------------------------------------- | :--------------------------------------------- |
| event                                   | is set to `projectData`                        |
| data                                    | contains data about the event                  |
| data.project                            | information about the current project          |
| data.project.subProjectName             | current sub-project name                       |
| data.project.subProjectTags             | aggregation of all sub-project tags            |
| data.project.developmentLocation        | country defined in the project                 |
| data.project.toSeabed                   | seabed depth defined in the project            |
| data.project.CRS                        | CRS used in the project                        |
| data.stagedAssets                       | array of information about staged assets       |
| data.stagedAssets.[].id                 | id of staged asset                             |
| data.stagedAssets.[].name               | name of staged asset                           |
| data.stagedAssets.[].tags               | tags of staged asset                           |
| data.stagedAssets.[].metaData           | meta data of staged asset                      |
| data.stagedAssets.[].type               | asset type of staged asset                     |
| data.connectionSegments                 | array of information about connections         |
| data.connections.[].id                  | id of connection                               |
| data.connections.[].name                | name of connection                             |
| data.connections.[].tags                | tags of connection                             |
| data.connections.[].metaData            | meta data of connection                        |
| data.connection.[].length               | length of connection                           |
| data.connectionSegments                 | array of information about connection segments |
| data.connectionSegments.[].id           | id of segment                                  |
| data.connectionSegments.[].connectionId | id of parent connection                        |
| data.connectionSegments.[].name         | name of segment                                |
| data.connectionSegments.[].tags         | tags of segment                                |
| data.connectionSegments.[].metaData     | meta data of segment                           |
| data.connectionSegments.[].length       | length of segment                              |
| data.layers                             | array of information about layers              |
| data.layers.[].id                       | id of layer                                    |
| data.layers.[].name                     | name of layer                                  |
| data.layers.[].tags                     | tags of layer                                  |
| data.layers.[].metaData                 | meta data of layer                             |
| data.shapes                             | array of information about shapes              |
| data.shapes.[].id                       | id of shape                                    |
| data.shapes.[].name                     | name of shape                                  |
| data.shapes.[].tags                     | tags of shape                                  |
| data.shapes.[].metaData                 | meta data of shape                             |
| data.wells                              | array of information about wells               |
| data.wells.[].id                        | id of well                                     |
| data.wells.[].name                      | name of well                                   |
| data.wells.[].tags                      | tags of well                                   |
| data.wells.[].metaData                  | meta data of well                              |
| data.wellBores                          | array of information about well bores          |
| data.wellBores.[].id                    | id of bore                                     |
| data.wellBores.[].wellId                | id of parent well                              |
| data.wellBores.[].name                  | name of bore                                   |
| data.wellBores.[].tags                  | tags of bore                                   |
| data.wellBores.[].metaData              | meta data of bore                              |
| data.wellBores.[].length                | length of bore                                 |
| data.wellBoreSegments                   | array of information about well bore segments  |
| data.wellBoreSegments.[].id             | id of segment                                  |
| data.wellBoreSegments.[].wellBoreId     | id of parent well bore                         |
| data.wellBoreSegments.[].name           | name of segment                                |
| data.wellBoreSegments.[].tags           | tags of segment                                |
| data.wellBoreSegments.[].metaData       | meta data of segment                           |
| data.wellBoreSegments.[].length         | length of segment                              |

### requestInfo

Requests information about project items from the integration. The number of items is limited to 100
and multiple `requestInfo` may be sent. These requests are sent at initial loading and on selection.
It allows for an integration to return some information used in the UI (for now only `documentCount`).
The reply is expected to be sent using `replyInfo` (see below) and not as a return of this call.

| Attribute          | Description                             |
| :----------------- | :-------------------------------------- |
| event              | is set to `requestInfo`                 |
| isFrameActive      | true if the frame is currently selected |
| data               | contains data about the event           |
| data.items         | array of id/type the request is for     |
| data.items.[].id   | id of the record the request is for     |
| data.items.[].type | type of the record the request is for   |

#### Example of requestInfo

```javascript
{
  event: "requestInfo",
  isFrameActive: true,
  data: {
    items:[{
      type: "wells",
      id: "id_of_the_well"
    }, {
      type: "stagedAssets",
      id: "id_of_the_staged_asset"
    }, {
      type: "assets",
      id: "id_of_the_asset"
    }]
  }
}
```

### viewBox

The message is sent in response to an integration sending the `getViewBox` command.
It contains the current view box of the application in project coordinates.

| Attribute       | Description                              |
| :-------------- | :--------------------------------------- |
| event           | is set to `viewBox`                      |
| isFrameActive   | true if the frame is currently selected  |
| data            | contains data about the event            |
| data.viewBox    | viewBox object                           |
| data.viewBox.x1 | start x in project coordinate of viewbox |
| data.viewBox.y1 | start y in project coordinate of viewbox |
| data.viewBox.x2 | end x in project coordinate of viewbox   |
| data.viewBox.y2 | end y in project coordinate of viewbox   |

```javascript
{
  event: "viewBox",
  isFrameActive: true,
  data: {
    viewBox: {
      x1: 100000,
      y1: 450000,
      x2: 120000,
      y2: 470000
    }
  }
}
```

### visibleResources

This message is sent in response to an integration sending `getVisibleResources` command.
It contains an array of resources ( with minimum information) that are visible at the current camera position.

| Attribute                   | Description                                                                          |
| :-------------------------- | :----------------------------------------------------------------------------------- |
| event                       | is set to `visibleResources`                                                         |
| data.resources              | array of resources                                                                   |
| data.resources[].type       | contains the type of the selected item                                               |
| data.resources[].id         | unique id of the selected item                                                       |
| data.resources[].name       | display name of selected item                                                        |
| data.resources[].isForeign  | true if the selected item comes from a linked parent project                         |
| data.resources[].project    | ID of the parent project when isForeign is true                                      |
| data.resources[].subProject | ID of the parent subproject when isForeign is true                                   |
| data.resources[].stream     | ID of the parent subproject branch when isForeign is true in FieldTwin 8.0 and later |
| data.resources[].well       | ID of parent well if resource is a well bore                                         |
| data.resources[].connection | ID of parent connection if resource is a connection segment                          |
| data.resources[].wellBore   | ID of parent well bore if resource is a well bore segment                            |
| data.queryId                | same value defined in getResources query                                             |

### resources

This message is sent in response to an integration sending `getResources` command.
It contains an array of resources, as defined in `didUpdate / didCreate / didDelete attributes` section.

| Attribute      | Description                              |
| :------------- | :--------------------------------------- |
| event          | is set to `resources`                    |
| data           | contains the raw data of requested items |
| data.resources | array of resources                       |
| data.queryId   | same value defined in getResources query |

### didClone

Sent when a project or subproject is cloned (_copied_ in 8.0).

The event will contain these attributes:

| Attribute          | Description                                                          |
| :----------------- | :------------------------------------------------------------------- |
| event              | is set to `didClone`                                                 |
| type               | type of the cloned item (`project` or `subProject`)                  |
| id                 | unique ID of the newly created item                                  |
| data               | contains the raw data of the newly created item (as for `didCreate`) |
| fromSubProjectId   | only for type subProject, the original subproject ID                 |
| fromSubProjectName | only for type subProject, the original subproject ID                 |
| toSubProjectId     | only for type subProject, the newly created subproject ID            |
| toSubProjectName   | only for type subProject, the newly created subproject name          |
| subProjectId       | only for type subProject, the newly created subproject ID            |
| fromProjectId      | the original project ID                                              |
| fromProjectName    | the original project name                                            |
| fromAccountId      | the original account ID                                              |
| toProjectId        | the new (type project) or target (type subProject) project ID        |
| toProjectName      | the new (type project) or target (type subProject) project name      |
| project            | the new (type project) or target (type subProject) project ID        |
| projectId          | the new (type project) or target (type subProject) project ID        |
| projectName        | the new (type project) or target (type subProject) project name      |
| toAccountId        | the target account ID                                                |
| idsMap             | map of original IDs to newly created IDs                             |

### didCreate and didCreateFromNetwork

Sent when an item was created.
Contains the same data as `didUpdate`, except it does not have `previousData` or `diff`.

- `didCreate` event corresponds to an event triggered in the user's browser
- `didCreateFromNetwork` corresponds to a modification to the sub project done through another client or through an API call

The event will contain these attributes:

| Attribute | Description                                     |
| :-------- | :---------------------------------------------- |
| event     | is set to `didCreate` or `didCreateFromNetwork` |
| <other>   | see the `didUpdate` event                       |

### didUpdate and didUpdateFromNetwork

Sent when an item was modified.

- `didUpdate` event corresponds to an event triggered in the user's browser
- `didUpdateFromNetwork` corresponds to a modification to the sub project done through another client or through an API call

The event will contain these attributes:

| Attribute     | Description                                                                          |
| :------------ | :----------------------------------------------------------------------------------- |
| event         | is set to `didUpdate` or `didUpdateFromNetwork`                                      |
| id            | unique ID of the updated item                                                        |
| type          | type of the updated item                                                             |
| data          | contains the raw data of the updated item                                            |
| previousData  | contains the previous raw data of the updated item                                   |
| diff          | contains only the attributes that where modified                                     |
| isFrameActive | true if the frame is currently selected                                              |
| isForeign     | true if the updated item comes from a linked parent project                          |
| project       | ID of the parent project when isForeign is true                                      |
| subProject    | ID of the parent subproject when isForeign is true                                   |
| stream        | ID of the parent subproject branch when isForeign is true in FieldTwin 8.0 and later |

#### Example of an overlay updated through the user's client

```javascript
{
  event: "didUpdate",
  id: "-LdIy8vwvUsX_A4DC4E3",
  type: "overlay",
  isFrameActive: true,
  data: {
    tags: [],
    text: "BdN \nSouthern Template",
    x: 388998.7275622606,
    y: 5308658.38831538,
    color: "#FFF",
    backgroundColor: "#0000",
    fontSize: 300,
    width: 100,
    height: 100,
    visible: true,
    subProject: "-LdIy8mGinoxAbbIK1JC"
  },
  previousData: {
    tags: [],
    text: "BdN \nSouthern Template",
    x: 388998.7275622606,
    y: 5308658.38831538,
    color: "#FFF",
    backgroundColor: "#0000",
    fontSize: 300,
    width: 100,
    height: 100,
    visible: false,
    subProject: "-LdIy8mGinoxAbbIK1JC"
  },
  diff: {
    visible: false
  }
}
```

#### Example of a metaDataValue updated through the network

```json
{
  "event": "didUpdateFromNetwork",
  "id": "-LvAW4EZXEXALeigTUzZ",
  "type": "metaDatumValue",
  "isFrameActive": true,
  "data": {
    "type": "string",
    "options": {
      "default": "blue"
    },
    "relateToId": "-K5uq-UAY4FhTHllT1xs",
    "relateToType": "asset",
    "ownerId": "-LvAOzgcvH3CzYP7IYCP",
    "value": "227"
  },
  "previousData": {
    "type": "string",
    "options": { "default": "blue" },
    "relateToId": "-K5uq-UAY4FhTHllT1xs",
    "relateToType": "asset",
    "ownerId": "-LvAOzgcvH3CzYP7IYCP",
    "value": "226"
  },
  "diff": {
    "value": "226"
  }
}
```

### didDelete and didDeleteFromNetwork

Sent when an item was deleted.
Contains the same data as `didUpdate`. The data field corresponds to the time of the deletion, so some
of the relationships might be set to `null`. In this case, you will find this information inside the
`previousData` (if it was set previously, so for example if you create and then delete an element,
`previousData` will not be set).

- `didDelete` event corresponds to an event triggered in the user browser
- `didDeleteFromNetwork` corresponds to a modification to the sub project done through another client or through an API call

The event will contain these attributes:

| Attribute | Description                                     |
| :-------- | :---------------------------------------------- |
| event     | is set to `didDelete` or `didDeleteFromNetwork` |
| <other>   | see the `didUpdate` event                       |

#### Example for deletion of a custom-cost from network

```json
{
  "event": "didDeleteFromNetwork",
  "id": "-LvKED-ci3fW07aNMgqh",
  "type": "customCost",
  "data": {
    "tags": [],
    "isValidForCost": true,
    "costObject": {
      "value": 2356,
      "entries": [],
      "costPerDay": 0,
      "currency": "USD",
      "stateText": "User input",
      "stateType": "danger",
      "startDate": "2019-12-09T23:00:00.000Z",
      "endDate": "2019-12-19T23:00:00.000Z",
      "supplier": "subsurface 42"
    },
    "assetName": "custom entry",
    "kind": "SPS",
    "userRight": {
      "cost": true,
      "metaData": true,
      "layer": true,
      "well": true,
      "costGen": "-LvFdcBUG9Ign29XgVw2"
    },
    "subProject": "-LvA9E5njA5MwR38ClmA"
  }
}
```

#### Example for deletion of a connection from client

```json
{
  "event": "didDelete",
  "id": "-LvAl_FGFuSPZJHdo_Cj",
  "type": "connection",
  "data": {
    "tags": [],
    "isValidForCost": true,
    "costObject": {
      "value": 0,
      "entries": [],
      "costPerDay": 0,
      "costPerLengthUnit": 300,
      "costByLength": true,
      "currency": "USD"
    },
    "showCustomResults": false,
    "customResults": {},
    "designType": null,
    "visible": true,
    "userRight": { "cost": true, "metaData": true, "layer": true, "well": true, "costGen": "-LvFdcBUG9Ign29XgVw2" },
    "bendable": false,
    "fromSocket": "b",
    "toSocket": null,
    "fromCoordinate": { "x": -207.13230953079614, "y": 30.84226897392744, "z": 2.191579 },
    "toCoordinate": { "x": -228.97472122228268, "y": 4.667924202314097, "z": -1200 },
    "intermediaryPoints": [],
    "params": { "type": 2, "label": "Oil Production #2" },
    "renderOrder": 0,
    "showLabel": false,
    "showLength": false,
    "status": null,
    "importParams": {},
    "straight": false,
    "isLocked": false,
    "subProject": null,
    "metaDataValue": [],
    "from": null,
    "to": null
  },
  "previousData": {
    "tags": [],
    "isValidForCost": true,
    "costObject": {
      "value": 0,
      "entries": [],
      "costPerDay": 0,
      "costPerLengthUnit": 300,
      "costByLength": true,
      "currency": "USD"
    },
    "showCustomResults": false,
    "customResults": {},
    "designType": null,
    "visible": true,
    "userRight": { "cost": true, "metaData": true, "layer": true, "well": true, "costGen": "-LvFdcBUG9Ign29XgVw2" },
    "bendable": false,
    "fromSocket": "b",
    "toSocket": null,
    "fromCoordinate": {
      "x": -207.13230953079614,
      "y": 30.84226897392744,
      "z": 2.191579
    },
    "toCoordinate": {
      "x": -228.97472122228268,
      "y": 4.667924202314097,
      "z": -1200
    },
    "intermediaryPoints": [],
    "params": { "type": 2, "label": "Oil Production #2" },
    "renderOrder": 0,
    "showLabel": false,
    "showLength": false,
    "status": null,
    "importParams": {},
    "straight": false,
    "isLocked": false,
    "subProject": "-LvA9E5njA5MwR38ClmA",
    "metaDataValue": ["-LvAl_ca3FLw3YLrIewI", "-LvAlb8fiOTeGCRB4PkT"],
    "from": "-LvAOzgcvH3CzYP7IYCP",
    "to": null
  },
  "diff": {
    "subProject": "-LvA9E5njA5MwR38ClmA",
    "metaDataValue": {
      "0": "-LvAl_ca3FLw3YLrIewI",
      "1": "-LvAlb8fiOTeGCRB4PkT"
    },
    "from": "-LvAOzgcvH3CzYP7IYCP"
  }
}
```

## didDrag

This event is send every seconds when a selection is dragged. It contains the data relative to the selection that is being dragged.

| Attribute | Description                                                      |
| :-------- | :--------------------------------------------------------------- |
| event     | is set to `didDrag`                                              |
| resources | array of resources that is being dragged. see below "attributes" |

## exportToGeoJSON

This event is sent after an `exportToGeoJSON` request, it contains the exported data if any

| Attribute | Description                               |
| :-------- | :---------------------------------------- |
| event     | is set to `exportToGeoJSON`               |
| GeoJSON   | contains exported GeoJSON                 |
| queryId   | same value as passed in the initial query |

## didUpdate / didCreate / didDelete / didDrag attributes

### Connection

> `event.type` is set to `connection`.

| Attribute                             | Description                                                                                                                                                        |
| :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bendable                              | `true` if the connection is using bendable radius                                                                                                                  |
| clonedFroms                           | Array of ids that describe the parents this element was cloned from                                                                                                |
| costObject                            | Describe cost                                                                                                                                                      |
| costObject.value                      | Cost value                                                                                                                                                         |
| costObject.entries                    | Array of cost entry for cost breakdown                                                                                                                             |
| costObject.entries[].cost             | Cost of the entry                                                                                                                                                  |
| costObject.entries[].description      | Entry description                                                                                                                                                  |
| costObject.entries[].item             | Item vendor id                                                                                                                                                     |
| costObject.entries[].notes            | User notes                                                                                                                                                         |
| costObject.entries[].number           | Part number                                                                                                                                                        |
| costObject.entries[].quantity         | Numbers of item (Cost is multiplied by)                                                                                                                            |
| costObject.costPerDay                 | Define cost per day (for activity only)                                                                                                                            |
| costObject.currency                   | Define currency, taken from the list described in account/project                                                                                                  |
| created                               | Creation date                                                                                                                                                      |
| creator                               | Creator email                                                                                                                                                      |
| customResults                         | Custom results are set by integrations using the `Legacy API` and allow an integration to display some data relative to the element                                |
| designType                            | One of the design from the account assigned to the connection                                                                                                      |
| from                                  | Staged asset the connection start from, if any                                                                                                                     |
| fromCoordinate                        | 3D coordinate of the start point of the connection                                                                                                                 |
| fromCoordinate.x                      |                                                                                                                                                                    |
| fromCoordinate.y                      |                                                                                                                                                                    |
| fromCoordinate.z                      |                                                                                                                                                                    |
| fromSocket                            | Which socket on the `from` staged asset the connection is connected to                                                                                             |
| importParams                          | If connection was imported ( WFS, shapefile, etc. ) this JSON object contains all the meta data that were imported with it. This is a key->value store             |
| intermediaryPoints                    | Array of 3d point that define                                                                                                                                      |
| isInactive                            | `true` if the connection is not in use anymore (for old connections that are obsolete)                                                                             |
| isLocked                              | If locked, the element cannot be edited anymore                                                                                                                    |
| isValidForCost                        | `true` if this element should be used for computing cost                                                                                                           |
| metaDataValue                         | Contains an array of id of meta data value                                                                                                                         |
| noHeightSampling                      | If true the connection will not be height sampled                                                                                                                  |
| params                                | Parameters                                                                                                                                                         |
| params.type                           | Id of the connection type. Lists of valid types are defined in account and project                                                                                 |
| params.label                          | Label of the connection, if not set, type name will be used                                                                                                        |
| params.textFollowConnection           | `true` if label should follow connection path instead of being a separate entity                                                                                   |
| params.textFollowConnectionFlip       | If `textFollowConnection`, `true` if the position on the spline (top/bottom) should be flipped                                                                     |
| params.textFollowConnectionOffset     | If `textFollowConnection`, add an offset to the text position along the connection                                                                                 |
| params.textFollowConnectionRepetition | If `textFollowConnection`, number of repetitions of the text along the connection                                                                                  |
| params.textFollowConnectionFlip       | If `textFollowConnection`, indicate if the position on the spline (top/bottom) should be flipped                                                                   |
| renderOrder                           | Rendering sort order to indicate which connection is on top of the other                                                                                           |
| showCustomResults                     | `true` if custom results (integration driven) should be displayed                                                                                                  |
| showLabel                             | `true` if connection label should be displayed                                                                                                                     |
| showLength                            | `true` if connection length should be displayed                                                                                                                    |
| status                                | Status of the connection. This is used by the integration to display visual information about a connection. Value can be `warning`, `danger`, `primary`, `success` |
| straight                              | `true` if the connection is straight                                                                                                                               |
| subProject                            | Id of the sub project that contains this connection                                                                                                                |
| tags                                  | Array of tags                                                                                                                                                      |
| to                                    | Staged asset where the connections ends at, if any                                                                                                                 |
| toCoordinate                          | 3D coordinate of the end point of the connection                                                                                                                   |
| toCoordinate.x                        |                                                                                                                                                                    |
| toCoordinate.y                        |                                                                                                                                                                    |
| toCoordinate.z                        |                                                                                                                                                                    |
| fromSocket                            | Which socket on the `to` staged asset the connection is connected to                                                                                               |
| visible                               | If true, connection is visible                                                                                                                                     |

### Connection Segment

> `event.type` is set to `connectionSegment`.

| Attribute     | Description                                                                                    |
| :------------ | :--------------------------------------------------------------------------------------------- |
| connection    | ID of parent connection                                                                        |
| subProject    | ID of subproject containing this item                                                          |
| name          | Name of the segment (label)                                                                    |
| length        | Length of the segment in the project unit                                                      |
| opacity       | Opacity of the segment, between 1 (fully opaque) and 0 (fully transparent)                     |
| startOffset   | Starting point of the segment from the connection's "from" point (when relativeToEnd is false) |
| thickness     | Rendering thickness                                                                            |
| visible       | If true, segment is visible                                                                    |
| relativeToEnd | If true, startOffset is from the connection's "to" point                                       |
| labelVisible  | If true, label is visible                                                                      |
| labelSize     | Label font size                                                                                |
| labelOffsetX  | Label X offset                                                                                 |
| labelOffsetY  | Label Y offset                                                                                 |
| metaDataValue | An array of IDs of attached metadata values                                                    |

### Custom Cost

> `event.type` is set to `customCost`.

| Attribute              | Description                                                         |
| :--------------------- | :------------------------------------------------------------------ |
| assetName              | Name of the custom cost                                             |
| costObject.cost        |                                                                     |
| costObject.description |                                                                     |
| costObject.item        |                                                                     |
| costObject.notes       |                                                                     |
| costObject.quantity    |                                                                     |
| costObject.entries     |                                                                     |
| clonedFroms            | Array of ids that describe the parents this element was cloned from |
| created                | Creation date                                                       |
| creator                | Creator email                                                       |
| isValidForCost         | `true` if this element should be use for computing cost             |
| kind                   | What the cost relates to                                            |
| subProject             | Id of the sub project that contains this cost                       |
| tags                   | Array of tags                                                       |

### Document

> `event.type` is set to `document`.

| Attribute          | Description                                                                                           |
| :----------------- | :---------------------------------------------------------------------------------------------------- |
| fileName           | Filename of uploaded file (latest file details are in linked documentRevision)                        |
| subProject         | ID of the sub project that contains this document                                                     |
| relateToType       | Object type the document is linked to - `connections`, `stagedAssets`, etc                            |
| relateToId         | Object ID the document is linked to (connection ID, staged asset ID, ...) or null                     |
| documentGroupId    | A group ID relevant when the document is attached to a multiple selection and not a single relateToId |
| documentGroupCount | Number of documents in the group                                                                      |
| tags               | Array of tags                                                                                         |
| revisions          | Array of documentRevision IDs stored for this document, oldest first                                  |

### Document Revision

> `event.type` is set to `documentRevision`.

| Attribute          | Description                                                              |
| :----------------- | :----------------------------------------------------------------------- |
| document           | ID of the parent document record                                         |
| subProject         | ID of the sub project that contains this revision                        |
| creator            | Email address of user that uploaded the file                             |
| created            | Timestamp of the upload                                                  |
| url                | URL to access or download the file (signed and time limited with expiry) |
| description        | User's description                                                       |
| documentRevisionId | A group ID linking all revisions that refer to the same file revision    |

### Layer

> `event.type` is set to `layer`.

| Attribute               | Description                                                                          |
| :---------------------- | :----------------------------------------------------------------------------------- |
| clonedFroms             | Array of ids that describe the parents this element was cloned from                  |
| created                 | Creation date                                                                        |
| creator                 | Creator email                                                                        |
| fileName                | Original imported file name                                                          |
| geoLocBoundingBox       | If geo located, information about the layer real world coordinate                    |
| geoLocBoundingBox.min_x |                                                                                      |
| geoLocBoundingBox.min_y |                                                                                      |
| geoLocBoundingBox.min_z |                                                                                      |
| geoLocBoundingBox.max_x |                                                                                      |
| geoLocBoundingBox.max_y |                                                                                      |
| geoLocBoundingBox.max_z |                                                                                      |
| METConfiguration        | MET layer configuration. For now there is no configuration value                     |
| arcgisConfiguration     | ArcGIS layer configuration                                                           |
| gradientPalette         | If `isGradient` is `true`, define the gradient to be used for rendering              |
| gradientPalette.[].a    | Depth of the gradient step                                                           |
| gradientPalette.[].c    | Color of the gradient step                                                           |
| heightSample            | If `true`, layer will be draped on another layer                                     |
| heightSamplerLayerId    | If `heightSample`, id of the layer this layer will be draped on                      |
| isArcGIS                | If `true`, this layer is an ArcGIS layer                                             |
| isBathymetry            | If `true`, this layer is a bathymetry                                                |
| isGeoLoc                | If `true`, this layer is geo located                                                 |
| isGradient              | If `true` and if `isXVB` is true, the layer will be rendered as a gradient           |
| isInactive              | `true` if the layer is in not in use anymore                                         |
| isMET                   | If `true`, this layer is a MET layer                                                 |
| isWMS                   | If `true`, this layer is a WMS layer                                                 |
| isXVB                   | If `true`, this layer is a XVB ( 3D ) layer                                          |
| kind                    | Id of the layer type. These are defined in the account settings                      |
| metaDataValue           | Contains an array of id of meta data value                                           |
| name                    | Layer name, as displayed in the UI                                                   |
| opacity                 | Opacity of the layer, between 1 (fully opaque) and 0 (fully transparent)             |
| processingState         | Status of conversion                                                                 |
| processingStateMessage  | Progress message of the conversion                                                   |
| rotation                | Heading of the layer                                                                 |
| scale                   | Scale of the layer                                                                   |
| seaBedTextureName       | If `isXVB` is `true`, which texture to apply to render the layer in 3D               |
| seabedColor             | if `isXVB` is `true`, which color to use to render the layer in 3D                   |
| useSeabedColor          | if `true` use `seabedColor` instead of `seaBedTextureName` to render the layer in 3D |
| subProject              | Id of the sub project that contains this layer                                       |
| url                     | URI of the file                                                                      |
| urlNormalMap            | If `isXVB` is true. URI to the normal map to use to augment rendering                |
| visible                 | Define layer visibility                                                              |
| wmsConfiguration        | WMS layer configuration                                                              |
| x                       | X offset                                                                             |
| y                       | Y offset                                                                             |
| z                       | Z offset                                                                             |

### Meta Datum Value

> A meta datum value is created or modified every time the user edits a meta data in the field. A value is link to a meta data using `metaDatumId`.
> `event.type` is set to `metaDatumValue`.

> Since 5.4 value are not directly attached to a definition directly, but to a definition id, so that mulitple definition can be use.
>
> 1. The existing attribute of the message ( subCategory, subType, ownerId, options ) will reflect the first definition
> 2. All the definition are available inside `definitions` array.

| Attribute               | Description                                                                                                                                                     |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options                 | Options of the meta data the value refers to. Depends on `type`. See [FieldTwin API](https://api.fieldtwin.com/#api-MetadataDefinitions-AddMetaDataDefinitions) |
| ownerId                 | Id of the element (connection, staged asset, layer, etc.) that holds this value                                                                                 |
| metaDatumId             | Id of the meta data this value refers to                                                                                                                        |
| relateToId              | Which id the meta data refers to                                                                                                                                |
| relateToType            | Which type the meta data refers to                                                                                                                              |
| name                    | Name of the meta data the value refers to                                                                                                                       |
| type                    | Type of the meta data                                                                                                                                           |
| category                | If `type` is asset, and `value` is a valid asset, category of the asset                                                                                         |
| subCategory             | If `type` is asset, and `value` is a valid asset, sub category of the asset                                                                                     |
| subType                 | If `type` is asset, and `value` is a valid asset, sub type of the asset                                                                                         |
| value                   | Actual value                                                                                                                                                    |
| valueBis                | Some meta data represents two values, this is the second one                                                                                                    |
| definitionId            | Generic definition id to use across all FieldTwin instances                                                                                                     |
| definitions             | Array of one or more definition                                                                                                                                 |
| definitions.name        | Name of the meta data the value refers to                                                                                                                       |
| definitions.type        | Type of the meta data                                                                                                                                           |
| definitions.options     | Options of the meta data the value refers to. Depends on `type`. See [FieldTwin API](https://api.fieldtwin.com/#api-MetadataDefinitions-AddMetaDataDefinitions) |
| definitions.category    | If `type` is asset, and `value` is a valid asset, category of the asset                                                                                         |
| definitions.subCategory | If `type` is asset, and `value` is a valid asset, sub category of the asset                                                                                     |
| definitions.subType     | Type of the meta data                                                                                                                                           |
| definitions.metaDatumId | of the meta data                                                                                                                                                |

### Project

> `event.type` is set to `project`.

| Attribute                                           | Description                                                         |
| :-------------------------------------------------- | :------------------------------------------------------------------ |
| CRS                                                 | Project coordinate reference system                                 |
| account                                             | Id of the parent account                                            |
| canOverrideConnectionColor                          | If `true` user can override connection color                        |
| clonedFroms                                         | Array of ids that describe the parents this element was cloned from |
| collaboration                                       | N/A                                                                 |
| consents                                            | N/A                                                                 |
| containsObsoleteAssets                              | If `true` this project contains at least one obsolete asset         |
| costByLengthIsDefault                               | If `true` cost for connection is computed by length as default      |
| country                                             | Id of the country this project is in                                |
| created                                             | Creation date                                                       |
| creator                                             | Creator email                                                       |
| currencyTypes                                       | Array of valid currency for this project                            |
| currencyTypes[].id                                  | Id of the currency                                                  |
| currencyTypes[].name                                | Name of the currency                                                |
| currencyTypes[].rate                                | Rate of the currency                                                |
| customer                                            | Id of the customer for this project                                 |
| dynamicScaleConfiguration                           | Array containing overrride for dynamic scale values                 |
| dynamicScaleConfiguration[].factor                  | Dynamic scale factor                                                |
| dynamicScaleConfiguration[].type                    | Which attribute this value applies to                               |
| dynamicScaleConfiguration[].factor                  | Which value of `type` attribute this value applies to               |
| endDate                                             | End date of the project                                             |
| fieldName                                           | Internal field name                                                 |
| havePerProjectAssetPrices                           | IF `true`, project contains override for asset costs                |
| havePerProjectPrices                                | If `true`, project contains default prices                          |
| name                                                | Name of the project                                                 |
| perProjectAssetPrices                               | Array of asset price override                                       |
| perProjectAssetPrices[].id                          | Id of the asset this cost relates to                                |
| perProjectAssetPrices[].cost                        | Cost value                                                          |
| perProjectAssetPrices[].currency                    | Currency of the cost                                                |
| perProjectAssetPrices[].entries                     | Array of cost entry for cost breakdown                              |
| perProjectAssetPrices[].entries[].cost              | Cost of the entry                                                   |
| perProjectAssetPrices[].entries[].description       | Entry description                                                   |
| perProjectAssetPrices[].entries[].item              | Item vendor id                                                      |
| perProjectAssetPrices[].entries[].notes             | User notes                                                          |
| perProjectAssetPrices[].entries[].number            | Part number                                                         |
| perProjectAssetPrices[].entries[].quantity          | Numbers of item (Cost is multiplied by)                             |
| perProjectConnectionPrices                          | Per project connection price                                        |
| perProjectConnectionPrices.{connection id}.value    | Cost value for {connection id} connection                           |
| perProjectCurrencyTypes                             | Extra per project currency                                          |
| perProjectCurrencyTypes[].id                        | Id of the currency                                                  |
| perProjectCurrencyTypes[].name                      | Name of the currency                                                |
| perProjectCurrencyTypes[].rate                      | Rate of the currency                                                |
| perProjectPrices                                    | Array of default project cost                                       |
| perProjectPrices[].assetName                        | Name of the cost                                                    |
| perProjectPrices[].costObject                       | Cost definition                                                     |
| perProjectPrices[].costObject.cost                  | Cost value                                                          |
| perProjectPrices[].costObject.currency              | Currency of the cost                                                |
| perProjectPrices[].costObject.entries               | Array of cost entry for cost breakdown                              |
| perProjectPrices[].costObject.entries[].cost        | Cost of the entry                                                   |
| perProjectPrices[].costObject.entries[].description | Entry description                                                   |
| perProjectPrices[].costObject.entries[].item        | Item vendor id                                                      |
| perProjectPrices[].costObject.entries[].notes       | User note                                                           |
| perProjectPrices[].costObject.entries[].number      | Part number                                                         |
| perProjectPrices[].costObject.entries[].quantity    | Number of items (Cost is multiplied by)                             |
| perProjectPrices[].kind                             | Type of the cost                                                    |
| projectConnections                                  | Per project connection override                                     |
| projectCurrency                                     | Project currency                                                    |
| projectPhase                                        | Id of project phase, if any                                         |
| projectType                                         | Id of project type, if any                                          |
| projectUnitSystem                                   | Project unit system                                                 |
| realWorldCoordinate                                 | deprecated                                                          |
| region                                              | Id of region, if any                                                |
| screenShot                                          | Screenshot                                                          |
| seaBedLevel                                         | Default seabed level                                                |
| startDate                                           | Start date of the project                                           |
| uniqConnectionOnTypedSocket                         | If `true`, only one connection can be connected to a socket         |
| updatedAt                                           | Last updated timestamp                                              |
| updatedBy                                           | Email of the user that did the last update                          |
| userRoles                                           | Object that contains assigned user role for each user               |
| users                                               | Array of id of users that have access to the project                |
| wellmasterConfiguration                             | Deprecated                                                          |
| wfsConfigurationId                                  | Deprecated                                                          |
| wmsConfigurationId                                  | Deprecated                                                          |

### Shape

> `event.type` is set to `shape`.

| Attribute                          | Description                                                                                                    |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| subProject                         | ID of subproject containing this item                                                                          |
| name                               | Name of the shape (label)                                                                                      |
| shapeType                          | One value from: Box, Sphere, Triangle, Circle, Rectangle, Cone, Cylinder, Ring, Torus, Polygon, FlatTube, Tube |
| opacity                            | Opacity of the shape, between 1 (fully opaque) and 0 (fully transparent)                                       |
| x                                  | X coordinate of shape                                                                                          |
| y                                  | Y coordinate of shape                                                                                          |
| z                                  | Z coordinate of shape                                                                                          |
| scale                              | Scale of shape, default 1                                                                                      |
| labelVisible                       | If true, label is visible                                                                                      |
| labelSize                          | Label font size                                                                                                |
| labelOffsetX                       | Label X offset                                                                                                 |
| labelOffsetY                       | Label Y offset                                                                                                 |
| labelZAlign                        | Align label to top                                                                                             |
| labelColor                         | Label color, e.g. "#FFF"                                                                                       |
| color                              | Shape color, e.g. "#0000FF"                                                                                    |
| visible                            | If true, shape is visible                                                                                      |
| metaDataValue                      | An array of IDs of attached metadata values                                                                    |
| rotation.x                         | 3D rotation of shape                                                                                           |
| rotation.y                         | 3D rotation of shape                                                                                           |
| rotation.z                         | 3D rotation of shape                                                                                           |
| stagedAsset                        | Optional staged asset ID to snap to                                                                            |
| connection                         | Optional connection ID to snap to                                                                              |
| smoothTubeEnds                     | Rendering options                                                                                              |
| doNotCrossBathy                    | Rendering options                                                                                              |
| stickToBathy                       | Rendering options                                                                                              |
| invertClippingMask                 | Rendering options                                                                                              |
| useAsDepthMask                     | Rendering options                                                                                              |
| smoothPolygonEdgesEnabled          | Rendering options                                                                                              |
| useAsLight                         | Rendering options                                                                                              |
| lightIntensity                     | Rendering options                                                                                              |
| spotlightDecay                     | Rendering options                                                                                              |
| pointLightDecay                    | Rendering options                                                                                              |
| spotlightPenumbra                  | Rendering options                                                                                              |
| shadowMappingEnabled               | Rendering options                                                                                              |
| outlineColor                       | Rendering options                                                                                              |
| outlineOpacity                     | Rendering options                                                                                              |
| outlineRender                      | Rendering options                                                                                              |
| outlineRenderAsMesh                | Rendering options                                                                                              |
| outlineRenderAsMeshRadius          | Rendering options                                                                                              |
| outlineRenderAsMeshLightingEnabled | Rendering options                                                                                              |
| shadingEnabled                     | Rendering options                                                                                              |
| textureEnabled                     | Rendering options                                                                                              |
| textureScale                       | Rendering options                                                                                              |
| localParallaxMappingHeightScale    | Rendering options                                                                                              |
| textureEdgeFade                    | Rendering options                                                                                              |
| assetAlignment                     | Asset snap options                                                                                             |
| connectionOffset                   | Connection snap options                                                                                        |
| connectionLength                   | Connection snap options                                                                                        |
| connectionRadius                   | Connection snap options                                                                                        |
| connectionRelativeToEnd            | Connection snap options                                                                                        |
| connectionCoversEntire             | Connection snap options                                                                                        |
| lineThickness                      | shapeType specific attributes                                                                                  |
| boxWidth                           | shapeType specific attributes                                                                                  |
| boxHeight                          | shapeType specific attributes                                                                                  |
| boxDepth                           | shapeType specific attributes                                                                                  |
| sphereRadius                       | shapeType specific attributes                                                                                  |
| circleRadius                       | shapeType specific attributes                                                                                  |
| rectangleWidth                     | shapeType specific attributes                                                                                  |
| rectangleHeight                    | shapeType specific attributes                                                                                  |
| coneRadius                         | shapeType specific attributes                                                                                  |
| coneHeight                         | shapeType specific attributes                                                                                  |
| cylinderRadiusTop                  | shapeType specific attributes                                                                                  |
| cylinderRadiusBottom               | shapeType specific attributes                                                                                  |
| cylinderHeight                     | shapeType specific attributes                                                                                  |
| ringInnerRadius                    | shapeType specific attributes                                                                                  |
| ringOuterRadius                    | shapeType specific attributes                                                                                  |
| torusRadius                        | shapeType specific attributes                                                                                  |
| torusThickness                     | shapeType specific attributes                                                                                  |
| triangleWidth                      | shapeType specific attributes                                                                                  |
| triangleHeight                     | shapeType specific attributes                                                                                  |
| isLocked                           | shapeType specific attributes                                                                                  |
| polyIs3D                           | shapeType specific attributes                                                                                  |
| polyOuterRing                      | shapeType specific attributes                                                                                  |
| polyInnerRings                     | shapeType specific attributes                                                                                  |

### Staged Asset

> `event.type` is set to `stagedAsset`.

| Attribute                        | Description                                                                                                                                                          |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asset                            | Id of the asset (representation) of the staged asset                                                                                                                 |
| assetData                        | Information about the asset                                                                                                                                          |
| assetData.name                   | Name of the asset                                                                                                                                                    |
| assetData.description            | Description of the asset                                                                                                                                             |
| assetData.category               | Asset category                                                                                                                                                       |
| assetData.subCategory            | Asset sub category                                                                                                                                                   |
| assetData.subType                | Asset sub type                                                                                                                                                       |
| assetData.kind                   | Asset sub type                                                                                                                                                       |
| clonedFroms                      | Array of ids that describe the parents this element was cloned from                                                                                                  |
| costObject                       | Cost definition                                                                                                                                                      |
| costObject.value                 | Cost value                                                                                                                                                           |
| costObject.currency              | Currency of the cost                                                                                                                                                 |
| costObject.entries               | Array of cost entry for cost breakdown                                                                                                                               |
| costObject.entries[].cost        | Cost of the entry                                                                                                                                                    |
| costObject.entries[].description | Entry description                                                                                                                                                    |
| costObject.entries[].item        | Item vendor id                                                                                                                                                       |
| costObject.entries[].notes       | User note                                                                                                                                                            |
| costObject.entries[].number      | Part number                                                                                                                                                          |
| costObject.entries[].quantity    | Number of items (Cost is multiplied by)                                                                                                                              |
| costObject.costPerDay            | Define cost per day (for activity only)                                                                                                                              |
| costObject.currency              | Define currency, taken from the list described in account/project                                                                                                    |
| created                          | Creation date                                                                                                                                                        |
| creator                          | Creator email                                                                                                                                                        |
| custom                           | (deprecated)                                                                                                                                                         |
| customResults                    | Custom results are set by integrations using the `Legacy API` and allows an integration to display some data relative to the element                                 |
| havePerAssetSockets              | If `true` the staged asset contains it own set of sockets                                                                                                            |
| hiddenLabel                      | If `true` the label is hidden                                                                                                                                        |
| initialState                     | Set of states (position, etc.) for the staged asset                                                                                                                  |
| initialState.height              | Height of the staged asset                                                                                                                                           |
| initialState.opacity             | Opacity of the staged asset                                                                                                                                          |
| initialState.rotation            | Heading of the staged asset                                                                                                                                          |
| initialState.scale               | Scale of the staged asset                                                                                                                                            |
| initialState.well                | Id of the well the staged asset is connected to, if any                                                                                                              |
| initialState.width               | Width of the staged asset                                                                                                                                            |
| initialState.x                   | X real world coordinate of the staged asset                                                                                                                          |
| initialState.y                   | Y real world coordinate of the staged asset                                                                                                                          |
| isInactive                       | `true` if the staged asset is not in use anymore                                                                                                                     |
| isLocked                         | If locked, the element cannot be edited anymore                                                                                                                      |
| isValidForCost                   | `true` if this element should be used for computing cost                                                                                                             |
| metaDataValue                    | Contains an array of id of meta data value                                                                                                                           |
| name                             | Name of the staged asset                                                                                                                                             |
| perAssetParams                   | Parameters for the staged asset                                                                                                                                      |
| perAssetParams.fontSize          | Font size for displaying label                                                                                                                                       |
| perAssetSockets2d                | If `havePerAssetSockets` is `true`, array of definition of socket                                                                                                    |
| perAssetSockets2d[].name         | Name of the socket, used in `fromSocket` and `toSocket` when connecting a connection to the staged asset                                                             |
| perAssetSockets2d[].x            | X offset of the socket, relative to the center of the asset                                                                                                          |
| perAssetSockets2d[].y            | Y offset of the socket, relative to the center of the asset                                                                                                          |
| perAssetSockets2d[].z            | z offset of the socket, relative to the center of the asset                                                                                                          |
| perAssetSockets2d[].types        | array of type for the socket. Only the first item is used                                                                                                            |
| port                             | Id of the port the staged asset is docked to, if any                                                                                                                 |
| renderOrder                      | Render order for the rendering                                                                                                                                       |
| showCustomResults                | `true` custom results are visible                                                                                                                                    |
| showMetaInfo                     | `true` if meta data info box is visible                                                                                                                              |
| socketMetaDataValue              | Array of meta data values for sockets                                                                                                                                |
| status                           | Status of the staged asset. This is used by the integration to display visual information about a connection. Value can be `warning`, `danger`, `primary`, `success` |
| subProject                       | "-MAR0MZqqqk-Tel75u4V"                                                                                                                                               |
| tags                             | Array of tags                                                                                                                                                        |
| textColor                        | Color to use for render label                                                                                                                                        |
| visible                          | Define staged asset visibility                                                                                                                                       |
| wellmasterConfiguration          | deprecated                                                                                                                                                           |

### Sub Project

> `event.type` is set to `subProject`.

| Attribute              | Description                                                            |
| :--------------------- | :--------------------------------------------------------------------- |
| backgroundColor        | Background color of the project                                        |
| clonedFroms            | Array of ids that describe the parents this element was cloned from    |
| connectionAngleVisible | Global setting, indicate if angle between connection point are visible |
| created                | Creation date                                                          |
| creator                | Creator email                                                          |
| description            | Description of the sub project                                         |
| globalDepthScale       | Depth scale                                                            |
| gridColor              | Color of the grid                                                      |
| gridNotVisible         | If `true`, do not render the grid                                      |
| locked                 | if `true`, sub project is locked and user cannot make any modification |
| lockedBy               | email of the user who locked the sub project                           |
| name                   | Name of the sub project                                                |
| project                | id of the parent project                                               |
| seabedTextureName      | deprecated                                                             |
| sunDirection           | Direction of the sun for 3D rendering                                  |
| sunDirection.x         |                                                                        |
| sunDirection.y         |                                                                        |
| sunDirection.z         |                                                                        |
| updatedAt              | Last update timestamp                                                  |
| updatedBy              | Email of the user that did the last update                             |
| viewDependantScale     | If true, use dynamic scaling (scale is dependant of zoom)              |
| wfsConfiguration       | deprecated                                                             |

### Text Layer

> `event.type` is set to `overlay`.

| Attribute          | Description                                                         |
| :----------------- | :------------------------------------------------------------------ |
| x                  | X position                                                          |
| y                  | Y position                                                          |
| z                  | Z position                                                          |
| subProject         | ID of the sub project that contains this text                       |
| text               | Text to be displayed                                                |
| rotation           | Rotation in radians                                                 |
| color              | Foreground (text) color, e.g. "#FFF"                                |
| backgroundColor    | Background color                                                    |
| backgroundOpacity  | Background opacity, 0 to 1                                          |
| outlineColor       |                                                                     |
| outlineOpacity     |                                                                     |
| faceCamera         | True to ignore rotation and face the viewer                         |
| clonedFroms        | Array of ids that describe the parents this element was cloned from |
| fontSize           | Font size                                                           |
| tags               | Array of tags                                                       |
| visible            | True when visible                                                   |
| viewDependantScale | True to enable dynamic scaling                                      |

### View Point

> `event.type` is set to `bookmark`.

| Attribute       | Description                                                            |
| :-------------- | :--------------------------------------------------------------------- |
| camera          | if is3D is set to true, contains the camera definition of the bookmark |
| camera.center   | 3d position where the camera is looking at                             |
| camera.center.x |                                                                        |
| camera.center.y |                                                                        |
| camera.center.z |                                                                        |
| camera.fov      | field of view, in degree, of the camera                                |
| camera.from     | 3d position of where the camera is located                             |
| camera.from.x   |                                                                        |
| camera.from.y   |                                                                        |
| camera.from.z   |                                                                        |
| camera.viewBox  | Camera view box in 2D. Same as `viewBox` attribute                     |
| clonedFroms     | Array of ids that describes the parents this element was cloned from   |
| created         | Creation date                                                          |
| creator         | Creator email                                                          |
| is3D            | indicate if the bookmark was taken from the 3D view of the 2D view     |
| name            | name of the bookmark                                                   |
| subProject      | id of the sub project that contains this bookmark                      |
| viewBox         | View bounding box of the bookmark                                      |
| viewBox.x1      |                                                                        |
| viewBox.x2      |                                                                        |
| viewBox.y1      |                                                                        |
| viewBox.y2      |                                                                        |

### Well

> `event.type` is set to `well`.

| Attribute           | Description                                                                                                                                                                                                        |
| :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| activeWellBore      | Id of the active bore                                                                                                                                                                                              |
| canBeDrag           | If `true`, user can move the well by dragging it                                                                                                                                                                   |
| clonedFroms         | Array of ids that describe the parents this element was cloned from                                                                                                                                                |
| color               | Rendering color of the well                                                                                                                                                                                        |
| created             | Creation date                                                                                                                                                                                                      |
| creator             | Creator email                                                                                                                                                                                                      |
| fontSize            | Label font size                                                                                                                                                                                                    |
| isInactive          | `true` if the well is in not in use anymore                                                                                                                                                                        |
| kind                | Id of the well type. These are defined in the account settings                                                                                                                                                     |
| labelOffsetX        | X offset of the label, relative to the well position                                                                                                                                                               |
| labelOffsetY        | Y offset of the label, relative to the well position                                                                                                                                                               |
| labelRotation       | Label rotation                                                                                                                                                                                                     |
| labelVisible        | If `true` label is visible                                                                                                                                                                                         |
| metaDataValue       | Contains an array of id of meta data value                                                                                                                                                                         |
| name                | Label / name of the well                                                                                                                                                                                           |
| radius              | Display radius                                                                                                                                                                                                     |
| radiusViewDependant | Dynamic scale of the radius according to the zoom                                                                                                                                                                  |
| referenceLevel      | reference level of the well. Can be set to `sea`, `rkb` or `seabed`. `sea` set initial depth to `0`, `rkb` set inital depth to `rkb` attribute, `seabed` set inital depth to touch down ( height sampling ) value. |
| rkb                 | if `referenceLevel` is set to `rkb` initial depth will be using this value                                                                                                                                         |
| subProject          | Id of the sub project that contains this well                                                                                                                                                                      |
| tags                | Array of tags                                                                                                                                                                                                      |
| visible             | Define well visibility                                                                                                                                                                                             |
| x                   | Top hole X Position                                                                                                                                                                                                |
| y                   | Top hole Y position                                                                                                                                                                                                |

### Well Bore

> `event.type` is set to `wellBore`.

| Attribute        | Description                                                                                                      |
| :--------------- | :--------------------------------------------------------------------------------------------------------------- |
| casingShoes      | Array of casing shoes                                                                                            |
| clonedFroms      | Array of ids that describe the parents this element was cloned from                                              |
| name             | Name of the bore                                                                                                 |
| path             | Array of 3D point. Z value depends on `referenceLevel` set on the parent well                                    |
| path[].x         | x value of the point                                                                                             |
| path[].y         | x value of the point                                                                                             |
| path[].z         | x value of the point                                                                                             |
| tags             | Array of tags                                                                                                    |
| targets          | Array of 2 target points. First point is reservoir penetration point. Second point is entry inside the reservoir |
| targets[].active |                                                                                                                  |
| targets[].x      |                                                                                                                  |
| targets[].y      |                                                                                                                  |
| targets[].z      |                                                                                                                  |
| targets[].depth  |                                                                                                                  |
| targets[].az     |                                                                                                                  |
| targets[].incl   |                                                                                                                  |
| metaDataValue    | Contains an array of id of meta data value                                                                       |
| kind             | Id of the well bore type. These are defined in the account settings                                              |
| subProject       | Id of the sub project that contains this well bore                                                               |
| well             | Id of the parent well                                                                                            |

### Well Bore Segment

> `event.type` is set to `wellBoreSegment`.

| Attribute     | Description                                                                                    |
| :------------ | :--------------------------------------------------------------------------------------------- |
| wellBore      | ID of parent well bore                                                                         |
| subProject    | ID of subproject containing this item                                                          |
| name          | Name of the segment (label)                                                                    |
| length        | Length of the segment in the project unit                                                      |
| opacity       | Opacity of the segment, between 1 (fully opaque) and 0 (fully transparent)                     |
| startOffset   | Starting point of the segment from the well bore's initial point (when relativeToEnd is false) |
| thickness     | Rendering thickness                                                                            |
| visible       | If true, segment is visible                                                                    |
| relativeToEnd | If true, startOffset is from the well bore's end point                                         |
| labelVisible  | If true, label is visible                                                                      |
| labelSize     | Label font size                                                                                |
| labelOffsetX  | Label X offset                                                                                 |
| labelOffsetY  | Label Y offset                                                                                 |
| metaDataValue | An array of IDs of attached metadata values                                                    |

## Communication from integration to FieldTwin

Integrations are able to call functions in **FieldTwin** using the `postMessage` mechanism.

To do this, use `postMessage` on the `window.parent` object within the integration client.

```javascript
window.parent.postMessage(
  {
    event: 'getProjectData',
  },
  '*'
)
```

The results, if any, will then be sent from **FieldTwin** via another `postMessage`.

### getProjectData

Allows you to get some information about a project without calling the API.
Set these attributes:

| Attribute | Description                |
| :-------- | :------------------------- |
| event     | is set to `getProjectData` |

The result format is defined in the `projectData` message section.

#### Calling getProjectData

```javascript
{
  event: 'getProjectData'
}
```

### computeCostUsingServer

Launch a cost computation on a cost server. A cost server needs to be defined first.

#### Calling computeCostUsingServer

```javascript
{
  event: 'computeCostUsingServer'
}
```

### zoomAt

Focus the view on a given point. Z position will be height sampled, and the provided z value of the
point will be added to it. This means that if you set `z` as 100, the camera will be at position
`100 + height sampled z`.

| Attribute    | Description                                                                      |
| :----------- | :------------------------------------------------------------------------------- |
| event        | is set to `zoomAt`                                                               |
| event.data.x | X position of the center of the camera lookat                                    |
| event.data.y | Y position of the center of the camera lookat                                    |
| event.data.z | indicate the height distance from the center where the eye of the camera will be |

#### Focusing on a point

```javascript
{
  event: "zoomAt",
  data: {
    x: 15300,
    y: 113105,
    z: 300
  }
}
```

### zoomOn

Focus the view on the given item. Set these attributes:

| Attribute       | Description                                                                                                                                         |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| event           | is set to `zoomOn`                                                                                                                                  |
| event.data.type | type of the item to focus on (`stagedAsset`, `connection`, `connectionSegment`, `well`, `wellBore`, `wellBoreSegment`, `layer`, `overlay`, `shape`) |
| event.data.id   | ID of the item to focus on                                                                                                                          |

#### Calling zoomOn to focus on a well

```javascript
{
  event: "zoomOn",
  data: {
    type: "well",
    id: "id_of_the_well"
  }
}
```

### select

Select and focus on one or multiple items.

| Attribute               | Description                                                                                                                                       |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| event                   | is set to `select`                                                                                                                                |
| event.data.items        | array of item(s) to select                                                                                                                        |
| event.data.items[].id   | ID of the item to select                                                                                                                          |
| event.data.items[].type | type of the item to select (`stagedAsset`, `connection`, `connectionSegment`, `well`, `wellBore`, `wellBoreSegment`, `layer`, `overlay`, `shape`) |

#### Selecting and focusing on a well

```javascript
{
  event: "select",
  data:{
    items:[{
      type: "well",
      id: "id_of_the_well"
    }]
  }
}
```

### clearSelection

Clears the current selection.

| Attribute | Description                |
| :-------- | :------------------------- |
| event     | is set to `clearSelection` |

#### Example

```javascript
{
  event: 'clearSelection'
}
```

### getCostQuery

Request a JSON object that contains a cost server query of the whole sub project.
You can pass a query id for tracking that will be returned in the reply `costQuery`.

#### Requesting cost query

```javascript
{
  event: "getCostQuery",
  data: {
    queryId: "id_of_the_query"
  }
}
```

The result format is defined in the `costQuery` message section.

### getViewBox

Request the current viewport. The response will be returned to the integration through message `viewBox`.

### replyInfo

This message is sent from the integration to provide information about particular item(s). This can
be sent whenever the integration decides, but typically it is in response to an earlier `requestInfo`
message. For now it only sets one metric:

| Attribute                   | Description                                               |
| :-------------------------- | :-------------------------------------------------------- |
| event                       | is set to `replyInfo`                                     |
| data.items                  | array of object                                           |
| data.items.[].id            | id of the resource for which to update document count     |
| data.items.[].type          | resource's type for which to update document count        |
| data.items.[].documentCount | number of documents held for a given resource             |
| data.tags                   | array of tags that will be use by the subprojects         |
| integrationId               | optional integration ID (e.g. the `customTabId` from JWT) |

```javascript
{
  event: "replyInfo",
  integrationId: "my-document-search",
  data: {
    items: [{
      id: "id_of_the_resource",
      type: "type_of_the_resource",
      documentCount: 3
    }]
  }
}
```

If `integrationId` is not provided, 2 different integrations that send `replyInfo` for the same
object will overwrite each other's metrics. Providing a unique value for your integration in `integrationId`
ensures that your `documentCount` is counted separately instead of being replaced.

### toast

Display a temporary pop-up notification ("toast" message) in the FieldTwin Design UI.

| Attribute    | Description                                           |
| :----------- | :---------------------------------------------------- |
| event        | is set to `toast`                                     |
| data.type    | message type, can be danger, warning, info or success |
| data.message | message to display                                    |

```javascript
{
  event: "toast",
  data: {
    type: "success",
    message: "Win win"
  }
}
```

### displayDocument

Display a document in a File Viewer tab in FieldTwin Design. This allows integrations to show PDFs, images, videos, spreadsheets, and 3D models in the viewer.

| Attribute     | Description                                                                                                        |
| :------------ | :----------------------------------------------------------------------------------------------------------------- |
| event         | is set to `displayDocument`                                                                                        |
| data.url      | URL of the document to display                                                                                     |
| data.fileType | File type/extension (e.g., 'pdf', 'png', 'mp4', 'xlsx', 'gltf')                                                    |
| data.tabId    | (Optional) Golden Layout component ID of specific File Viewer tab to target. If omitted, uses the last-focused tab |

Supported file types:

- **PDF**: pdf
- **Images**: png, jpg, jpeg, gif, bmp, webp, svg, ico
- **Videos**: mp4, webm, ogg, mov, avi
- **Spreadsheets**: xlsx, xls, csv, xlsb, xlsm
- **3D Models**: gltf, glb, obj, fbx, stl, ply, dae, 3ds
- **CAD Files**: step, stp

```javascript
{
  event: "displayDocument",
  data: {
    url: "https://example.com/document.pdf",
    fileType: "pdf"
  }
}
```

Example targeting a specific tab:

```javascript
{
  event: "displayDocument",
  data: {
    url: "https://example.com/spreadsheet.xlsx",
    fileType: "xlsx",
    tabId: "FileViewerTab-abc123"
  }
}
```

### exportToGLTF

Ask the host software to export the whole design as GLTF. The reply is sent as a blob through postMessage and needs special handling.

```javascript
{
  event:"exportToGLTF",
  data: {
    queryId: `[query_id_not_used_for_now]`,
  },
}
```

### exportToGeoJSON

Ask the host software to export the whole design as GeoJSON.

| Attribute                            | Description                                                                                                     |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| event                                | is set to `exportToGeoJSON`                                                                                     |
| data.queryId                         | id that will be sent back with the reply                                                                        |
| data.mergeParentProjects             | default to true, export parent projects data                                                                    |
| data.exportMetaData                  | default to true, export meta data as properties                                                                 |
| data.onlyPublicMetaData              | only export public metadata                                                                                     |
| data.onlyStdMetaData                 | only export standard metadata                                                                                   |
| data.filterMetaDataByTags            | array of string, filter which resource are exported by tags                                                     |
| data.simplify                        | allow connection simplification                                                                                 |
| data.simplifyTolerance               | simplification tolerance                                                                                        |
| data.disableConvertion               | Do not convert coordinate to lat / long                                                                         |
| data.onlyPublicMetaData              | message to display                                                                                              |
| data.exportLayerOnlyIfContourChecked | true by default, only exports layers that have conntour enables, if not will try to export all layer as contour |
| data.types                           | array of types to exports, default to 'wells', 'wellBores', 'connections', 'stagedAssets', 'shapes', 'layers'   |
| data.resourceIds                     | array of resources id to export                                                                                 |

```javascript
{
  event:"exportToGeoJSON",
  data: {
    queryId: `[query_id_not_used_for_now]`,
  },
}
```

### getResources

Allow integration to request informations from a list of resources using their ids and type. The response will be returned to the integration through message `resources`.

| Attribute                  | Description                                      |
| :------------------------- | :----------------------------------------------- |
| event                      | is set to `getResources`                         |
| data.items                 | array of object                                  |
| data.items.[].id           | id of the resource for which to get informations |
| data.items.[].type         | resource's type for which to get informations    |
| data.items.[].resourceType | alias for type                                   |
| data.queryId               | id that will be sent back with the reply         |

```javascript
{
  event:"getResources",
  data: {
    items: [
      {
        id: "id_of_the_resource",
        resourceType: "type_of_the_resource",
      }
    ],
    queryId:"id_of_the_query"
  }
}

```

### createResource

Allow the integration to create a resource in FieldTwin Design.
When the optional `volatile` flag is `true` the resource is temporary and will not be saved.
This can be used to create display-only features that are controlled by the integration.

On success a `didCreate` message will follow containing the created resource object.

| Attribute                      | Description                                                                              |
| :----------------------------- | :--------------------------------------------------------------------------------------- |
| event                          | is set to `createResource`                                                               |
| data                           | object                                                                                   |
| data.volatile                  | optional: do not save the resource in the database                                       |
| data.draggable                 | optional: allow the resource to be dragged even if locked. Only work if volatile is true |
| data.resourceType              | resource type string                                                                     |
| data.projectTreeViewCustomPath | array of strings, describing hiearchy in project tree view                               |
| data.attributes                | object containing data attributes for the new resource                                   |

```javascript
{
  event: "createResource",
  data: {
    volatile: true,
    resourceType: "type_of_resource",
    attributes: { <object_attributes> },
  },
}
```

### createResources

Allow the integration to create a list of resources in FieldTwin Design.
When the optional `volatile` flag is `true` the resource is temporary and will not be saved.
This can be used to create display-only features that are controlled by the integration.

On success `didCreate` messages will follow containing the created resource objects.

| Attribute                         | Description                                                                              |
| :-------------------------------- | :--------------------------------------------------------------------------------------- |
| event                             | is set to `createResources`                                                              |
| data                              | array of objects                                                                         |
| data.[].volatile                  | optional: do not save the resource in the database                                       |
| data.[].draggable                 | optional: allow the resource to be dragged even if locked. Only work if volatile is true |
| data.[].projectTreeViewCustomPath | array of strings, describing hiearchy in project tree view                               |
| data.[].resourceType              | resource type string                                                                     |
| data.[].attributes                | object containing data attributes for the new resource                                   |

```javascript
{
  event: "createResources",
  data: [
    {
      resourceType: "type_of_resource",
      attributes: { <object_attributes> },
    },
    {
      resourceType: "type_of_resource",
      attributes: { <object_attributes> },
    },
    ...
  ]
}
```

### updateResource

Allow the integration to update a resource in FieldTwin Design.
On success a `didUpdate` message will follow containing the updated resource object.

| Attribute                      | Description                                                                          |
| :----------------------------- | :----------------------------------------------------------------------------------- |
| event                          | is set to `updateResource`                                                           |
| data                           | object                                                                               |
| data.resourceType              | resource type string                                                                 |
| data.resourceId                | the id of the resource to be updated                                                 |
| data.projectTreeViewCustomPath | array of strings, describing hiearchy in project tree view, set to `null` to default |
| data.attributes                | object containing updated attributes for the resource                                |

```javascript
{
  event: "updateResource",
  data: {
    resourceType: "type_of_resource",
    resourceId: "id_of_resource",
    attributes: { <object_attributes> },
  },
}
```

### updateResources

Allow the integration to update a list of resource in FieldTwin Design.
On success `didUpdate` messages will follow containing the updated resource objects.

| Attribute                      | Description                                                                          |
| :----------------------------- | :----------------------------------------------------------------------------------- |
| event                          | is set to `updateResources`                                                          |
| data                           | array of objects                                                                     |
| data.projectTreeViewCustomPath | array of strings, describing hiearchy in project tree view, set to `null` to default |
| data.[].resourceType           | resource type string                                                                 |
| data.[].resourceId             | the id of the resource to be updated                                                 |
| data.[].attributes             | object containing updated attributes for the resource                                |

```javascript
{
  event: "updateResources",
  data: [
    {
      resourceType: "type_of_resource",
      resourceId: "id_of_resource",
      attributes: { <object_attributes> },
    },
    {
      resourceType: "type_of_resource",
      resourceId: "id_of_resource",
      attributes: { <object_attributes> },
    },
    ...
  ],
}
```

### deleteResource

Allow the integration to delete a resource from FieldTwin Design.
On success a `didDelete` message will follow containing the deleted resource object.

| Attribute         | Description                          |
| :---------------- | :----------------------------------- |
| event             | is set to `deleteResource`           |
| data              | object                               |
| data.resourceType | resource type string                 |
| data.resourceId   | the id of the resource to be deleted |

```javascript
{
  event: "deleteResource",
  data: {
    resourceType: "type_of_resource",
    resourceId: "id_of_resource",
  },
}
```

### deleteResources

Allow the integration to delete a list of resources from FieldTwin Design.
On success `didDelete` messages will follow containing the deleted resource objects.

| Attribute            | Description                          |
| :------------------- | :----------------------------------- |
| event                | is set to `deleteResources`          |
| data                 | array of objects                     |
| data.[].resourceType | resource type string                 |
| data.[].resourceId   | the id of the resource to be deleted |

```javascript
{
  event: "deleteResources",
  data: [
    {
      resourceType: "type_of_resource",
      resourceId: "id_of_resource",
    },
    {
      resourceType: "type_of_resource",
      resourceId: "id_of_resource",
    },
    ...
  ],
}
```

### displayDocument

Opens a document in FieldTwin's file viewer. The file viewer must be open and support the file type for this to succeed.

Returns a response indicating success or failure.

| Attribute     | Description                                                                |
| :------------ | :------------------------------------------------------------------------- |
| event         | is set to `displayDocument`                                                |
| data          | object                                                                     |
| data.url      | URL of the document to display (required)                                  |
| data.fileType | File extension/type (optional, will be extracted from URL if not provided) |

#### Supported file types

The file viewer supports the following formats:

- **3D Models**: STEP (.step, .stp), GLTF/GLB (.gltf, .glb), OBJ (.obj), FBX (.fbx), STL (.stl), PLY (.ply), Collada (.dae), 3DS (.3ds)
- **Vector**: SVG (.svg), GeoJSON (.geojson, .json), DXF (.dxf), DWG (.dwg)
- **Documents**: PDF (.pdf)
- **Images**: PNG (.png), JPEG (.jpg, .jpeg), GIF (.gif), BMP (.bmp), WebP (.webp), ICO (.ico)
- **Video**: MP4 (.mp4), WebM (.webm), OGG (.ogg), MOV (.mov), AVI (.avi)
- **Spreadsheets**: Excel (.xlsx, .xls, .xlsb, .xlsm), CSV (.csv)

#### Request example

```javascript
{
  event: "displayDocument",
  data: {
    url: "https://example.com/documents/drawing.pdf",
    fileType: "pdf"
  }
}
```

#### Response

The message handler returns a response object:

```javascript
{
  event: "displayDocument",
  success: true,  // or false if failed
  error: null     // or error message if failed
}
```

Error messages:

- `"No URL provided"` - The url parameter was missing
- `"Unable to open document - unsupported file type or no file viewer available"` - File type not supported or no viewer open
- `"File viewer not available"` - File viewer feature not loaded in this frontend

way to dismiss charts without requiring integration code.

### getUserSettings

Return the user settings object stored inside the user. Can be use by integration to store transcient data.

### setUserSettgins

Merge the user settings with the passed object.

### requestTagsInfos (from File Viewer)

Sent when a document is loaded and tags have been extracted. The integration receives this event to determine how to style the tags.

| Attribute              | Description                                                  |
| :--------------------- | :----------------------------------------------------------- |
| event                  | is set to `requestTagsInfos`                                 |
| data                   | object                                                       |
| data.documentUrl       | URL of the document that was loaded                          |
| data.tags              | Array of tag objects extracted from the document             |
| data.tags[].text       | The text content of the tag                                  |
| data.tags[].source     | Extraction source: 'direct' (PDF text) or 'ocr' (image)      |
| data.tags[].confidence | OCR confidence score (0-100), only present for OCR tags      |
| data.subProject        | ID of the current subproject                                 |
| data.project           | ID of the current project                                    |
| data.requestId         | Unique request ID - include this in updateTagStyles response |

#### Example event received by integration

```javascript
{
  event: "requestTagsInfos",
  data: {
    documentUrl: "https://example.com/documents/P&ID-Rev3.pdf",
    tags: [
      { text: "VALVE-001", source: "direct" },
      { text: "VALVE-002", source: "direct" },
      { text: "PUMP-A-01", source: "ocr", confidence: 92.5 },
      { text: "TANK-B-03", source: "ocr", confidence: 88.1 }
    ],
    subProject: "-LvA9E5njA5MwR38ClmA",
    project: "-LvA9E5njA5MwR38ClmB"
  }
}
```

### updateTagStyles (to File Viewer)

Sent by the integration to apply styling to tags. Supports pattern matching with wildcards for efficient bulk styling.

| Attribute                              | Description                                                                                                                                                                        |
| :------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| event                                  | is set to `updateTagStyles`                                                                                                                                                        |
| data                                   | object                                                                                                                                                                             |
| data.tagStyles                         | Array of tag style objects                                                                                                                                                         |
| data.tagStyles[].pattern               | Tag pattern to match (supports wildcards with `*`)                                                                                                                                 |
| data.tagStyles[].style                 | Style object containing CSS properties to apply                                                                                                                                    |
| data.tagStyles[].style.color           | Text color (CSS color string, e.g., "#FF0000", "red", "rgb(255,0,0)")                                                                                                              |
| data.tagStyles[].style.backgroundColor | Background color (CSS color string)                                                                                                                                                |
| data.tagStyles[].style.border          | Border style (CSS border value, e.g., "1px solid #00FF00")                                                                                                                         |
| data.tagStyles[].style.borderRadius    | Border radius (CSS value, e.g., "4px")                                                                                                                                             |
| data.tagStyles[].style.fontWeight      | Font weight ("normal", "bold", "100"-"900")                                                                                                                                        |
| data.tagStyles[].style.fontStyle       | Font style ("normal", "italic", "oblique")                                                                                                                                         |
| data.tagStyles[].style.fontSize        | Font size (CSS size string, e.g., "14px", "1.2em")                                                                                                                                 |
| data.tagStyles[].style.textDecoration  | Text decoration ("none", "underline", "line-through")                                                                                                                              |
| data.tagStyles[].style.opacity         | Opacity (0-1 or CSS value)                                                                                                                                                         |
| data.tagStyles[].style.padding         | Padding (CSS value)                                                                                                                                                                |
| data.tagStyles[].style.margin          | Margin (CSS value)                                                                                                                                                                 |
| data.requestId                         | Optional request ID from requestTagsInfos event. If provided, styles are applied only to the document that made the request. If omitted, styles are applied to all open documents. |

#### Pattern Matching

Patterns support wildcard matching using the `*` character:

- `"VALVE-*"` matches all tags starting with "VALVE-" (e.g., "VALVE-001", "VALVE-ABC")
- `"*-CRITICAL"` matches all tags ending with "-CRITICAL"
- `"PUMP-*-01"` matches tags like "PUMP-A-01", "PUMP-B-01"
- `"*"` matches all tags (use for default styling)

#### Styling Priority

When multiple patterns match a tag, the most specific pattern wins:

1. Exact match (no wildcards)
2. First matching wildcard pattern in the array order

#### Request ID Behavior

The `requestId` field controls which documents receive the styling:

- **With `requestId`**: Styles are applied only to the document that sent the original `requestTagsInfos` event with that `requestId`. This is useful when responding to a specific document's tag extraction.
- **Without `requestId`**: Styles are applied to **all** open documents in File Viewer. This allows integrations to proactively style documents based on their own data/state changes, without waiting for a tag extraction request.

#### Example: Basic tag styling

```javascript
window.parent.postMessage(
  {
    event: 'updateTagStyles',
    data: {
      tagStyles: [
        {
          pattern: 'VALVE-001',
          style: {
            color: '#00FF00',
            backgroundColor: '#004400',
            fontWeight: 'bold',
          },
        },
        {
          pattern: 'VALVE-002',
          style: {
            color: '#FF0000',
            backgroundColor: '#440000',
            fontWeight: 'bold',
          },
        },
      ],
    },
  },
  '*'
)
```

#### Example: Wildcard patterns for bulk styling

```javascript
window.parent.postMessage(
  {
    event: 'updateTagStyles',
    data: {
      tagStyles: [
        // All valves - green (open status)
        {
          pattern: 'VALVE-*',
          style: {
            color: '#00FF00',
            backgroundColor: 'rgba(0, 100, 0, 0.3)',
            border: '1px solid #00FF00',
          },
        },
        // All pumps - blue
        {
          pattern: 'PUMP-*',
          style: {
            color: '#0088FF',
            backgroundColor: 'rgba(0, 50, 150, 0.2)',
            fontWeight: 'bold',
          },
        },
        // Critical equipment - red background
        {
          pattern: '*-CRITICAL',
          style: {
            backgroundColor: '#FF0000',
            color: '#FFFFFF',
            fontWeight: 'bold',
            textDecoration: 'underline',
          },
        },
        // Default style for all tags
        {
          pattern: '*',
          style: {
            color: '#333333',
            fontSize: '12px',
          },
        },
      ],
    },
  },
  '*'
)
```

#### Example: Status-based valve styling

```javascript
// Integration receives requestTagsInfos event with valve tags
// It queries its database for valve statuses and responds with styling

async function handleRequestTagsInfos(event) {
  const { tags, documentUrl, requestId } = event.data

  // Extract valve IDs from tags
  const valveIds = tags.map((tag) => tag.text).filter((text) => text.startsWith('VALVE-'))

  // Query valve statuses from your system
  const valveStatuses = await fetchValveStatuses(valveIds)

  // Build styling based on status
  const tagStyles = valveStatuses.map((valve) => ({
    pattern: valve.id,
    style: {
      color: valve.status === 'OPEN' ? '#00FF00' : valve.status === 'CLOSED' ? '#FF0000' : '#FFA500', // PARTIAL = orange
      backgroundColor:
        valve.status === 'OPEN'
          ? 'rgba(0, 100, 0, 0.2)'
          : valve.status === 'CLOSED'
            ? 'rgba(100, 0, 0, 0.2)'
            : 'rgba(255, 165, 0, 0.2)',
      fontWeight: 'bold',
      border: `2px solid ${valve.status === 'OPEN' ? '#00FF00' : valve.status === 'CLOSED' ? '#FF0000' : '#FFA500'}`,
    },
  }))

  // Send styling back to File Viewer with requestId for targeted delivery
  window.parent.postMessage(
    {
      event: 'updateTagStyles',
      data: {
        tagStyles,
        requestId, // Include requestId to ensure response goes to correct document
      },
    },
    '*'
  )
}

// Listen for tag extraction events
window.addEventListener('message', (event) => {
  if (event.data.event === 'requestTagsInfos') {
    handleRequestTagsInfos(event)
  }
})
```

#### Example: Proactive styling without requestId

Integrations can send styling updates at any time without waiting for tag extraction. This is useful when your integration's data changes and you want to update all open documents immediately:

```javascript
// Example: Integration detects valve status changed in external system
function onValveStatusChanged(valveId, newStatus) {
  // Update styling for all open documents immediately
  window.parent.postMessage(
    {
      event: 'updateTagStyles',
      data: {
        tagStyles: [
          {
            pattern: valveId,
            style: {
              color: newStatus === 'OPEN' ? '#00FF00' : '#FF0000',
              backgroundColor: newStatus === 'OPEN' ? 'rgba(0, 100, 0, 0.2)' : 'rgba(100, 0, 0, 0.2)',
              fontWeight: 'bold',
            },
          },
        ],
        // No requestId = apply to ALL open documents
      },
    },
    '*'
  )
}

// Integration can also send bulk updates for all equipment
function updateAllEquipmentStyling(equipmentStatuses) {
  const tagStyles = equipmentStatuses.map((eq) => ({
    pattern: eq.id,
    style: {
      color: eq.isOperational ? '#00FF00' : '#FF0000',
      backgroundColor: eq.isOperational ? 'rgba(0, 100, 0, 0.2)' : 'rgba(100, 0, 0, 0.2)',
    },
  }))

  window.parent.postMessage(
    {
      event: 'updateTagStyles',
      data: { tagStyles }, // No requestId = applies to all documents
    },
    '*'
  )
}
```

### User defined message

For metadata of type "button", the administrator can define a custom message to be sent when the user
clicks on the button. The message contains project and related item information, and `event` will be
set to the value saved in the metadata definition.

## Operation Search

FieldTwin Operation provides a global search interface (Google Maps style) that allows integrations to provide searchable content and handle actions when results are selected.

### operationSearch

This event is sent from the host to **all active integrations** when the user presses **Enter** in the operation search input. Integrations should listen for this event and perform a search within their own domain.

| Attribute | Description                         |
| :-------- | :---------------------------------- |
| event     | is set to `operationSearch`         |
| query     | the search string typed by the user |

### operationSearchResults

Integrations should reply with this message to provide search results to the host.

| Attribute                | Description                                                                                    |
| :----------------------- | :--------------------------------------------------------------------------------------------- |
| event                    | must be set to `operationSearchResults`                                                        |
| results                  | an array of result objects                                                                     |
| results.category         | a string identifying the category of the item (for grouping, used if no tags)  |
| results.tags             | (optional) an array of strings. Items sharing the same tags are grouped together. |
| results.html             | the HTML string to display for the result (sanitized by host)                                  |
| results.action           | (optional) the event name to send back to integration on click                                 |
| results.args             | (optional) an object containing arguments for the action                                       |
| results.target           | (optional) "core" to execute action in core app, otherwise sends to integration                |
| results.noPanel          | (optional) boolean. If `true`, clicking the item will NOT open/focus the integration panel     |
| results.subItems         | (optional) an array of sub-item objects. These are displayed beneath the parent when expanded. |
| results.subItems.id      | (optional) unique ID for the sub-item.                                                         |
| results.subItems.html    | the HTML string to display for the sub-item.                                                   |
| results.subItems.action  | (optional) event to send back to integration on click.                                         |
| results.subItems.args    | (optional) arguments for the action.                                                           |
| results.subItems.target  | (optional) "core" to execute action in core app.                                               |
| results.subItems.noPanel | (optional) boolean. If `true`, clicking does not open panel.                                   |
| results.subItems.icon    | (optional) icon to display: `file`, `cube`, or `circle` (default).                             |

#### Example

```javascript
window.parent.postMessage(
  {
    event: 'operationSearchResults',
    data: {
      results: [
        {
          category: 'Assets',
          html: '<strong>Asset 001</strong> - <em>Active</em>',
          action: 'focusOnAsset',
          args: { id: 'asset-123' },
          subItems: [
            {
              html: 'Maintenance Log',
              icon: 'file',
              action: 'openMaintenanceLog',
              args: { id: 'log-456' },
            },
            {
              html: 'Subsea Tree 3D',
              icon: 'cube',
              action: 'focusOnTree',
              args: { id: 'tree-789' },
            },
          ],
        },
      ],
    },
  },
  '*'
)
```

### operationSearchProgress

Integrations can use this message to communicate search progress or status to the host. If no update is received for 30 seconds, the progress indicator will be automatically removed.

| Attribute  | Description                                                                          |
| :--------- | :----------------------------------------------------------------------------------- |
| event      | must be set to `operationSearchProgress`                                             |
| status     | a string describing the current progress state (e.g., "Scanning database...")        |
| progress   | (optional) a number from 0 to 100 representing completion percentage                 |
| isComplete | (optional) boolean. If `true`, the progress indicator for this integration is hidden |

#### Example

```javascript
window.parent.postMessage(
  {
    event: 'operationSearchProgress',
    data: {
      status: 'Querying external API...',
      progress: 50,
      isComplete: false,
    },
  },
  '*'
)
```

### Visual Filtering (Operation Mode)

FieldTwin Operation allows integrations to provide dynamic visual filters displayed as persistent buttons next to the global search bar.

#### visualFilteringUpdate

Integrations can send this message at any time to update the list of available filters. Filters are automatically grouped by integration and sorted by `integrationId` to ensure a consistent UI layout.

| Attribute                | Description                                                           |
| :----------------------- | :-------------------------------------------------------------------- |
| event                    | must be set to `visualFilteringUpdate`                                |
| filters                  | an array of filter objects                                            |
| filters.id               | unique ID for the filter                                              |
| filters.label            | display name for the button                                           |
| filters.state            | boolean indicating if the filter is currently active                  |
| filters.subFilters       | (optional) array of sub-filters. If present, the button opens a popup |
| filters.subFilters.id    | unique ID for the sub-filter                                          |
| filters.subFilters.label | display name for the sub-filter                                       |
| filters.subFilters.state | boolean indicating if the sub-filter is active                        |

#### Example

```javascript
window.parent.postMessage(
  {
    event: 'visualFilteringUpdate',
    data: {
      filters: [
        {
          id: 'safety',
          label: 'Safety Hazards',
          state: true,
          subFilters: [
            { id: 'electrical', label: 'Electrical', state: true },
            { id: 'chemical', label: 'Chemical', state: false },
          ],
        },
      ],
    },
  },
  '*'
)
```

#### visualFilterToggle

When a user interacts with a filter chip or a sub-filter checkbox, FieldTwin sends a message back to the originating integration.

| Attribute        | Description                                          |
| :--------------- | :--------------------------------------------------- |
| event            | set to `visualFilterToggle`                          |
| data.id          | the ID of the parent filter                          |
| data.state       | the new desired state (boolean)                      |
| data.subFilterId | (optional) the ID of the specific sub-filter toggled |

### Context Menu Entries (Operation Mode)

Integrations can publish custom context menu entries that appear in the viewport context menu in Operation mode.

#### contextMenuUpdate

Use this message to register or replace context menu entries for the sending integration.

| Attribute                     | Description                                                                                         |
| :---------------------------- | :-------------------------------------------------------------------------------------------------- |
| event                         | must be set to `contextMenuUpdate`                                                                  |
| data.entries                  | array of menu entries                                                                               |
| data.entries[].id             | unique ID for this entry within the integration                                                     |
| data.entries[].label          | text shown in the context menu                                                                      |
| data.entries[].tooltip        | (optional) tooltip text                                                                             |
| data.entries[].icon           | (optional) Font Awesome icon name (for example `faMapMarker`, `faWrench`)                          |
| data.entries[].action         | integration-defined action string returned in `contextMenuAction`                                   |
| data.entries[].args           | (optional) object payload returned in `contextMenuAction`                                           |
| data.entries[].subItems       | (optional) nested entries using the same structure                                                  |

#### Example

```javascript
window.parent.postMessage(
  {
    event: 'contextMenuUpdate',
    data: {
      entries: [
        {
          id: 'asset-tools',
          label: 'Asset Tools',
          icon: 'faWrench',
          subItems: [
            {
              id: 'open-integration-detail',
              label: 'Open details',
              action: 'openDetails',
              args: { source: 'context-menu' },
            },
          ],
        },
      ],
    },
  },
  '*'
)
```

### Action Events

When a user clicks on a search result that has an `action` defined, FieldTwin will send a message back to the **specific integration** that provided that result.

| Attribute | Description                                              |
| :-------- | :------------------------------------------------------- |
| event     | set to the `action` string provided in the search result |
| data      | set to the `args` object provided in the search result   |

### contextMenuAction

When a user clicks a context menu item defined by `contextMenuUpdate`, FieldTwin sends a `contextMenuAction` message to the originating integration.

| Attribute      | Description                                                               |
| :------------- | :------------------------------------------------------------------------ |
| event          | set to `contextMenuAction`                                                |
| action         | the `action` string from the clicked entry                                |
| args           | the `args` object from the clicked entry (if any)                         |
| integrationId  | integration ID that registered the menu entry                             |

#### Example

```javascript
window.addEventListener('message', (event) => {
  const msg = event.data
  if (msg?.event !== 'contextMenuAction') {
    return
  }

  if (msg.action === 'openDetails') {
    openDetails(msg.args)
  }
})
```

### Operation UI Navigation

#### openOperationPanel

Integrations can use this message to request the FieldTwin UI to open or focus on a specific integration panel. This is particularly useful for opening [Dynamic Pages](#dynamic-pages) from another integration or from a Global integration.

| Attribute          | Description                                                                             |
| :----------------- | :-------------------------------------------------------------------------------------- |
| event              | must be set to `openOperationPanel`                                                     |
| data.path          | (optional) the specific path of a Dynamic Page to open. This should match the page `path` returned by `dynamicPagesUrl` (or the generated fallback path such as `page-1` if omitted). |
| data.integrationId | (optional) the ID of the integration to open. Defaults to the sending integration's ID. |

#### Example

```javascript
window.parent.postMessage(
  {
    event: 'openOperationPanel',
    data: {
      integrationId: 'my-asset-manager',
      path: '/details/asset-123',
    },
  },
  '*'
)
```

### Time Series

The **Time Series** Golden Layout panel allows integrations to publish multi-channel time-series data
that engineers can inspect, zoom, measure, and export directly inside FieldTwin. The protocol uses
three messages in a request/reply pattern.

#### displayTimeSeries

Sent by the integration to open the **Time Series** panel in the right-side operation HUD.
All series already registered via `timeSeriesInfo` will be available in the panel immediately.

| Attribute | Description                        |
| :-------- | :--------------------------------- |
| event     | must be set to `displayTimeSeries` |

##### Example

```javascript
window.parent.postMessage({ event: 'displayTimeSeries' }, '*')
```

#### timeSeriesInfo

Sent by the integration to publish its available time series. The host registers the metadata and
the **Time Series** panel displays these series in its tree. Send this on startup and whenever your
dataset changes.

| Attribute            | Description                                                                                                                                                              |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| event                | must be set to `timeSeriesInfo`                                                                                                                                          |
| data.series          | array of series descriptor objects (see below)                                                                                                                           |
| data.replaceExisting | *(optional, default `false`)* when `true`, all series previously registered by this integration are removed before the new list is applied; when `false` the lists merge |

Each series descriptor:

| Field       | Description                                                                             |
| :---------- | :-------------------------------------------------------------------------------------- |
| id          | Unique series identifier (scoped to this integration)                                   |
| name        | Display name shown in the series tree                                                   |
| unit        | Y-axis unit string (e.g. `bar`, `°C`, `m/s`). Series with the same unit share a Y axis. |
| xMin        | Minimum X value of the full dataset                                                     |
| xMax        | Maximum X value of the full dataset                                                     |
| sampleCount | Total number of samples in the full dataset (used to compute the downsampling ratio)    |
| xAxisTitle  | Label for the X axis                                                                    |
| yAxisTitle  | Label for the Y axis                                                                    |
| color       | (optional) hex color string — auto-assigned if omitted                                  |

##### Example

```javascript
window.parent.postMessage(
  {
    event: 'timeSeriesInfo',
    data: {
      replaceExisting: true, // omit or set false to merge with existing series
      series: [
        {
          id: 'pressure',
          name: 'Wellhead Pressure',
          unit: 'bar',
          xMin: 0,
          xMax: 86400,
          sampleCount: 86400,
          xAxisTitle: 'Time (s)',
          yAxisTitle: 'Pressure',
        },
        {
          id: 'temperature',
          name: 'Fluid Temperature',
          unit: '°C',
          xMin: 0,
          xMax: 86400,
          sampleCount: 86400,
          xAxisTitle: 'Time (s)',
          yAxisTitle: 'Temperature',
        },
      ],
    },
  },
  '*'
)
```

#### getTimeSeriesData

Sent by the **Time Series** panel to request downsampled data for a specific viewport window.
The host automatically calculates an appropriate `sampleCount` based on the viewport pixel width
(capped at `2 × pixel width` or 4096) to avoid loading unnecessary data.

This message is sent only to the integration that owns the series (matched by `customTabId`).

| Attribute        | Description                                                       |
| :--------------- | :---------------------------------------------------------------- |
| event            | set to `getTimeSeriesData`                                        |
| data.seriesId    | the `id` of the series to fetch (as provided in `timeSeriesInfo`) |
| data.reqId       | unique request correlation ID — must be echoed back in the reply  |
| data.xMin        | start of the requested data window                                |
| data.xMax        | end of the requested data window                                  |
| data.sampleCount | maximum number of samples to return                               |

##### Example (integration side)

```javascript
window.addEventListener('message', (event) => {
  if (event.data?.event !== 'getTimeSeriesData') return

  const { seriesId, reqId, xMin, xMax, sampleCount } = event.data.data
  const buffer = buildSampledBuffer(seriesId, xMin, xMax, sampleCount)

  // Transfer the buffer to avoid copying
  event.source.postMessage({ event: 'timeSeriesData', data: { reqId, buffer } }, event.origin, [buffer])
})
```

#### timeSeriesData

Reply to `getTimeSeriesData`. Contains a binary `ArrayBuffer` of `Float64` values and a
`stride` field that selects the encoding:

**Stride 2 (legacy / simple):** `[x0, y0, x1, y1, …]` — one mean value per sample.  
**Stride 4 (envelope):** `[x0, mean0, min0, max0, x1, mean1, min1, max1, …]` — mean plus the
min/max spread for each sample, used to render a shaded confidence band in the chart.

Passing the buffer as a transferable (third argument to `postMessage`) avoids copying and is
strongly recommended.

| Attribute   | Description                                                                     |
| :---------- | :------------------------------------------------------------------------------ |
| event       | must be set to `timeSeriesData`                                                 |
| data.reqId  | the `reqId` from the `getTimeSeriesData` request                                |
| data.buffer | `ArrayBuffer` — see stride encoding above                                       |
| data.stride | `2` (default, legacy) or `4` (envelope with min/max). Omitting defaults to `2`. |

##### Example (stride 4 — min/max envelope)

```javascript
function buildSampledBuffer(seriesId, xMin, xMax, sampleCount) {
  // Each sample produces 4 Float64 values: x, mean, min, max.
  const arr = new Float64Array(sampleCount * 4)
  const step = (xMax - xMin) / Math.max(1, sampleCount - 1)
  for (let i = 0; i < sampleCount; i++) {
    const x = xMin + i * step
    const { mean, min, max } = sampleEnvelope(seriesId, x)
    arr[i * 4] = x
    arr[i * 4 + 1] = mean
    arr[i * 4 + 2] = min
    arr[i * 4 + 3] = max
  }
  return arr.buffer
}

window.addEventListener('message', (event) => {
  if (event.data?.event !== 'getTimeSeriesData') return
  const { seriesId, reqId, xMin, xMax, sampleCount } = event.data.data
  const buffer = buildSampledBuffer(seriesId, xMin, xMax, sampleCount)
  event.source.postMessage({ event: 'timeSeriesData', data: { reqId, buffer, stride: 4 } }, event.origin, [buffer])
})
```
