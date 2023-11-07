# Integrations in FieldTwin

## Revision

| Number | Author  | Description                                                                                                     |
| :----- | :------ | :-------------------------------------------------------------------------------------------------------------- |
| 1      | olivier | Initial release                                                                                                 |
| 2      | olivier | Added `canEdit` and list of user rights                                                                         |
| 3      | olivier | Added custom message                                                                                            |
| 4      | olivier | Added `loaded` event description                                                                                |
| 5      | olivier | Added information about project wide access                                                                     |
| 6      | olivier | Added information about all project access                                                                      |
| 7      | olivier | Added didUpdate/didCreate/didDelete details                                                                     |
| 8      | olivier | Added `tokenRefresh` event description                                                                          |
| 9      | olivier | Added modification to didUpdate message for meta datum value                                                    |
| 10     | olivier | Added `clearSelection` message                                                                                  |
| 11     | olivier | removed trafficManagerJWT                                                                                       |
| 12     | olivier | Added `requestInfo` and `replyInfo`                                                                             |
| 13     | olivier | Added `getViewBox`                                                                                              |
| 14     | matt    | Added `didClone`, documents, shapes, segments, parent attributes; updates for 7.2; removed activities and ports |

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

## How to serve an integration for use in FieldTwin

Depending on how the integration was setup, **FieldTwin** will create an iFrame that either generates
a _GET_ or a _POST_ request to the integration URL.

This request will contain the following attributes:

`token`, `frontendUrl`, `backendUrl`, `stream`, `subProject`, `project`, `account`, `canEdit`, `projectWideAccess`, `projectAllFromUser`

- As query parameters for _GET_
- As the request body for _POST_

| attribute            | description                                                                                                                                  |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`              | Security token (JWT) needed for making a FieldTwin API call                                                                                  |
| `frontendUrl`        | URL of the window that contains the iframe. Also the link for viewing the subproject                                                         |
| `backendUrl`         | URL of the FieldTwin backend. Use this as the base of the JWT public key URL and the API URL                                                 |
| `stream`             | In FieldTwin 7.2 and later - the ID of the subproject branch                                                                                 |
| `subProject`         | The currently open sub project ID                                                                                                            |
| `project`            | The currently open project ID                                                                                                                |
| `account`            | The ID of the account that contains the project                                                                                              |
| `canEdit`            | Whether the user's role enables 'edit' rights for the integration. To be handled by the integration itself, FieldTwin does not enforce this  |
| `projectWideAccess`  | Whether the integration is granted access to the whole project (not just the current sub project)                                            |
| `projectAllFromUser` | Whether the integration is granted access to all of the current user's projects in the account                                               |

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

It is possible to generate a JWT using an API token. For that you need to send a **POST** request to
this endpoint: `https://backend.[name-of-instance].fieldtwin.com/token/generate`.
You pass the API token the usual way (using header `token: [API Token]`).
The body of the request must contain:

- `userId` : ID of the user the JWT will be generated for.
- `subProjectId` : ID of the sub project the JWT will be generated for.
- optional `customTabId` : integration ID to generate the token for.
  Integration ID can be looked up by an API call or in the account settings.

On success, the query returns a JSON object that contains an attribute `token`.

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

Here's how an integration can receive these messages from **FieldTwin** :

```javascript
window.addEventListener('message', function (event) {
  // IMPORTANT: Check the origin of the data!
  if (~event.origin.indexOf('https://backend.app.fieldtwin.com')) {
    console.log(JSON.stringify(event.data, null, 2))
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

### loaded

This event is sent when an integration iframe is fully loaded. It contains information about subProject,
project and tokens used to communicate with API. The argument will contain these attributes:

| Attribute          | Decription                                                          |
| :----------------- | :------------------------------------------------------------------ |
| event              | is set to `loaded`                                                  |
| subProject         | is set to subproject ID, if a sub project is loaded                 |
| stream             | is set to the subproject branch ID in FieldTwin 7.2 and later       |
| project            | is set to project ID, if a project is loaded                        |
| account            | is set to account ID, if a project is loaded                        |
| token              | is set to the JWT that the integration can use to query the API     |
| backendUrl         | the FieldTwin backend URL (JWT public key and API)                  |
| frontendUrl        | the URL hosting the iframe (URL to view the subproject)             |
| canEdit            | whether the user's role has 'edit' rights for the integration       |
| projectWideAccess  | whether the JWT grants access to the whole project                  |
| projectAllFromUser | whether the JWT grants access to all of the current user's projects |

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

### costQuery

This message is sent after the integration posted a message `getCostQuery`.
The result will contain these attributes:

| Attribute       | Decription                                                                                                                                |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| event           | is set to `costQuery`                                                                                                                     |
| isFrameActive   | true if the frame is currently selected and active in the UI                                                                              |
| data            | is an object that contains:                                                                                                               |
| queryId         | is the value that you can pass when calling `getCostQuery`. It allows you to identify a query when posting `getCostQuery` multiple times  |
| removeEmptyItem | do not include items that have no meta data defined                                                                                       |
| query           | is the actual query and is composed of :                                                                                                  |
| stagedAssets    | contains an array of assets and their meta data                                                                                           |
| connections     | contains an array of connections and their meta data                                                                                      |

### select

When one or more objects are selected in Design, a `select` event is sent.
The event will contain these attributes:

| Attribute          | Description                                                                          |
| :----------------- | :----------------------------------------------------------------------------------- |
| event              | is set to `select`                                                                   |
| isFrameActive      | true if the frame is currently selected and active in the UI                         |
| id                 | ( obsolete ) unique id of the first selected item                                    |
| type               | ( obsolete ) type of the first selected item                                         |
| cursorPosition     | {x,y,z} value of cursor where selection happened (values in project space)           |
| data               | contains an array of selected items                                                  |
| data.[].type       | contains the type of the selected item                                               |
| data.[].id         | unique id of the selected item                                                       |
| data.[].name       | display name of selected item                                                        |
| data.[].isForeign  | true if the selected item comes from a linked parent project                         |
| data.[].project    | ID of the parent project when isForeign is true                                      |
| data.[].subProject | ID of the parent subproject when isForeign is true                                   |
| data.[].stream     | ID of the parent subproject branch when isForeign is true in FieldTwin 7.2 and later |

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

| Attribute                    | Description                               |
| :--------------------------- | :---------------------------------------- |
| event                        | is set to `projectData`                   |
| isFrameActive                | true if the frame is currently selected   |
| data                         | contains data about the event             |
| data.assets                  | arrays of information about staged asset  |
| data.assets.[].name          | name of staged asset                      |
| data.assets.[].tags          | tags of staged asset                      |
| data.assets.[].metaData      | meta data of staged asset                 |
| data.connections             | arrays of information about staged asset  |
| data.connections.[].name     | name of connection                        |
| data.connections.[].tags     | tags of connection                        |
| data.connections.[].metaData | meta data of connection                   |
| data.wells                   | arrays of information about staged asset  |
| data.wells.[].name           | name of well                              |
| data.wells.[].tags           | tags of well                              |
| data.wells.[].metaData       | meta data of well                         |
| data.project                 | information about the current project     |
| data.project.subProjectName  | current sub-project name                  |
| data.project.subProjectTags  | aggregation of all sub-project tags       |

## requestInfo

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

### Example of requestInfo

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

## viewBox

The message is sent in response to an integration sending the `getViewBox` command.
It contains the current view box of the application in project coordinates.

| Attribute          | Description                              |
| :----------------- | :--------------------------------------- |
| event              | is set to `viewBox`                      |
| isFrameActive      | true if the frame is currently selected  |
| data               | contains data about the event            |
| data.viewBox       | viewBox object                           |
| data.viewBox.x1    | start x in project coordinate of viewbox |
| data.viewBox.y1    | start y in project coordinate of viewbox |
| data.viewBox.x2    | end x in project coordinate of viewbox   |
| data.viewBox.y2    | end y in project coordinate of viewbox   |

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

### didClone

Sent when a project or subproject is cloned (_copied_ in 7.2).

The event will contain these attributes:

| Attribute          | Description                                                                          |
| :----------------- | :----------------------------------------------------------------------------------- |
| event              | is set to `didClone`                                                                 |
| type               | type of the cloned item (`project` or `subProject`)                                  |
| id                 | unique ID of the newly created item                                                  |
| data               | contains the raw data of the newly created item (as for `didCreate`)                 |
| fromSubProjectId   | only for type subProject, the original subproject ID
| fromSubProjectName | only for type subProject, the original subproject ID
| toSubProjectId     | only for type subProject, the newly created subproject ID
| toSubProjectName   | only for type subProject, the newly created subproject name
| subProjectId       | only for type subProject, the newly created subproject ID
| fromProjectId      | the original project ID
| fromProjectName    | the original project name
| fromAccountId      | the original account ID
| toProjectId        | the new (type project) or target (type subProject) project ID
| toProjectName      | the new (type project) or target (type subProject) project name
| project            | the new (type project) or target (type subProject) project ID
| projectId          | the new (type project) or target (type subProject) project ID
| projectName        | the new (type project) or target (type subProject) project name
| toAccountId        | the target account ID

### didCreate and didCreateFromNetwork

Sent when an item was created.  
Contains the same data as `didUpdate`, except it does not have `previousData` or `diff`.

- `didCreate` event corresponds to an event triggered in the user's browser
- `didCreateFromNetwork` corresponds to a modification to the sub project done through another client or through an API call

The event will contain these attributes:

| Attribute     | Description                                     |
| :------------ | :---------------------------------------------- |
| event         | is set to `didCreate` or `didCreateFromNetwork` |
| <other>       | see the `didUpdate` event                       |

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
| stream        | ID of the parent subproject branch when isForeign is true in FieldTwin 7.2 and later |

#### Example for an overlay updated through the user's client

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

#### Example for a metaDataValue updated through the network

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

| Attribute     | Description                                          |
| :------------ | :--------------------------------------------------- |
| event         | is set to `didDelete` or `didDeleteFromNetwork`      |
| <other>       | see the `didUpdate` event                            |

#### Example for deletion of a custom-cost from Network

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

## didUpdate / didCreate / didDelete attributes

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
| :------------ | :----------------------------------------------------------------------------------------------|
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

| Attribute          | Description                                                                   |
| :----------------- | :---------------------------------------------------------------------------- |
| document           | ID of the parent document record                                              |
| subProject         | ID of the sub project that contains this revision                             |
| creator            | Email address of user that uploaded the file                                  |
| created            | Timestamp of the upload                                                       |
| url                | URL to access or download the file (signed and time limited with expiry)      |
| description        | User's description                                                            |
| documentRevisionId | A group ID linking all revisions that refer to the same file revision         |

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
| :--------------------------------- | :--------------------------------------------------------------------------------------------------------------|
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
| condenserProgress      | Condensing progress (deprecated)                                       |
| connectionAngleVisible | Global setting, indicate if angle between connection point are visible |
| created                | Creation date                                                          |
| creator                | Creator email                                                          |
| description            | Description of the sub project                                         |
| globalDepthScale       | Depth scale                                                            |
| gridColor              | Color of the grid                                                      |
| gridNotVisible         | If `true`, do not render the grid                                      |
| importerError          | Cloning error, if any                                                  |
| importerProgress       | Cloning progress                                                       |
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
| :------------ | :----------------------------------------------------------------------------------------------|
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
    event: 'getProjectData'
  },
  '*'
)
```

The results, if any, will then be sent from **FieldTwin** via another `postMessage`.

### getProjectData

Allows you to get some information about a project without calling the API.
Set these attributes:

- attribute `event` set to `getProjectData`

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

| Attribute          | Description                                                                      |
| :----------------- | :------------------------------------------------------------------------------- |
| event              | is set to `zoomAt`                                                               |
| event.data.point.x | X position of the center of the camera lookat                                    |
| event.data.point.y | Y position of the center of the camera lookat                                    |
| event.data.point.z | indicate the height distance from the center where the eye of the camera will be |

#### Focusing on a point

```javascript
{
  event: "zoomAt",
  data: {
    point: { x: 15300, y: 113105, z: 300 }
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

#### Example for selecting and focusing on a well

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

* `documentCount` : number of documents held for a given resource

```javascript
{
  event: "replyInfo",
  data: {
    items: [{
      id: "id_of_the_resource",
      type: "type_of_the_resource",
      documentCount: 3
    }]
  }
}
```

### User defined message

For metadata of type "button", the administrator can define a custom message to be sent when the user
clicks on the button. The message contains project and related item information, and `event` will be
set to the value saved in the metadata definition.
