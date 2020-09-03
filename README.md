# Integration in FieldAP

## Revision

| Number  | Author    | Description                                     |
| ------- | --------- | ----------------------------------------------- |
| 1       | olivier   | Initial release                                 |
| 2       | olivier   | Added `canEdit` and list of user rights         |
| 3       | olivier   | Added custom message                            |
| 4       | olivier   | Added `loaded` event description                |
| 5       | olivier   | Added information about project wide access     |
| 6       | olivier   | Added information about all project access      |

## Introduction

This document explains how to develop an integration for *FieldAP*. An *integration* is a web page, which is loaded inside the main interface of *FieldAP* through an *iFrame*.

There is two kind of integration :

1. **global**, these integrations are loaded when the application starts, and are kept alive through the whole life cycle of the application. These can receive message when a project is created or deleted from the dashboard.
2. **local**, integrations are loaded only when a project is opened. They only receive messages that relate to the project that is currently open. These generally have a user interface (UI) which is visible FieldAp's main interface, but integrations aren't required to have a UI. In this document, integrations without a UI are referred to as *headless*.

## Setting up an integration

> You need to be administrator of an account to be able to setup a new integration.

Link: [FieldAP Online Documentation](https://docs.fieldap.com/account/#tabs)

> By default, and for security reason, an integration receive a JWT that only give access to the sub project the user is currently editing. Through the administration panel, you can also :

* Give access to the whole project of the sub project.
* Give access to all the project an user have access to across the account.

## How to serve integration for use in FieldAP

Depending on how the integration was setup, *FieldAP* will create an iFrame that either generate a *GET* or a *POST* request to the integration URL.

This request will contain the following, depending on the HTTP method used:

1. query params `token`, `backendUrl`, `subProject`, `canEdit` and `project` for *GET*
2. body with attributes `token`, `backendUrl`, `subProject`, `canEdit` and `project` for *POST*

| attribute    | description                                                  |
| ------------ | ------------------------------------------------------------ |
| `token`      | Security token needed for making FieldAP API call.           |
| `backEndUrl` | Contains backend url of the project.                         |
| `project`    | Contains project ID the integration is instantiate from.     |
| `subProject` | Contains subProject ID  the integration is instantiate from. |
| `canEdit`    | Indicate if the user has rights to edit for the integration. This needs to be handled by the integration, as Fieldap does not have any way to control that. |

`token` is a *JWT* and contains information about user and user rights, you can parse it with any *JWT* library. The public key to validate this JWT can be found at `https://backend.[name-of-instance].fieldap.com/token/publicKey`.

FieldAP API can be accessed using `https://backend.[name-of-instance].fieldap.com` so for `https://app.fieldap.com` the API access is `https://backend.app.fieldap.com`. Link: [FieldAP API Online Documentation](https://apidocs.fieldap.com).

For example, using `NodeJS + ExpressJS`:

```javascript

const express    = require("express")
const bodyParser = require("body-parser")

const app = express()

app.use(bodyParser.json())

// POST verb
app.post("/", function (request, response) {
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

// GET verb
app.get("/", function (request, response) {
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

> note that this reference implementation depends on `npm install express body-parser`
> If you do not have access to a nodejs backend, and just want to have a one page integration, you can also list the the message `loaded`.

This example webserver will reply to a *POST* request on `/`, and return HTML that contains the token sent by *FieldAP*.

## Refreshing JWT

By default JWT have an expiration time of 1 hour after it was created. You can refresh the toke by calling this endpoint : `https://backend.[name-of-instance].fieldap.com/token/refresh`.
You pass the JWT the usual way ( using header `Authentification`: `Bearer ${JWT}`) and you receive a JSON object with the new JWT inside the attribute `token`

## Generate a JWT using an API token

It is possible to generate a JWT using an API token. For that you need start a **POST** request use this endpoint : `https://backend.[name-of-instance].fieldap.com/token/generate`.
You pass the API token the usual way ( using header `token`:`[API Token]`).
The body of the request most contains :

* `userId` : Id of the user the JWT will be generate for.
* `subProjectId` : Id of the sub project the JWT will be generate for.
* optional `customTabId` : integration id to generate the token for. Integration id can be lookup by an API call or in the account settings.

On success, the query return a JSON object that contains an attribute `token`.

## User rights management

Within the JWT passed to the integration, there is an attribute `userRights` that contains what the user have access to. These rights will be followed by the API you are using, but in case you need to check them, this is the list of possible value:

* Account
  * `canAdminAccount`: User is an administrator of the account
* Project
  * `canCreateProject`: User can create project  
  * `canCloneProject`: User can clone an existing project
* Generic rights
  * `canAdmin`: User is an administrator of the project, if this is true, user can also edit everything
  * `canEdit`: User can edit the project, if this is true, user can edit everything
* Connections
  * `canViewConnections`: User can view connections
  * `canViewConnectionsMetaData`: User can view connections meta data
  * `canViewConnectionsCosts`: User can view connections costs
  * `canEditConnections`: User can edit connections
  * `canEditConnectionsMetaData`: User can edit connections meta data
  * `canEditConnectionsCosts`: User can edit connections costs
* Staged assets
  * `canViewStagedAssets`
  * `canViewStagedAssetsMetaData`
  * `canViewStagedAssetsCosts`
  * `canEditStagedAssets`
  * `canEditStagedAssetsMetaData`
  * `canEditStagedAssetsCosts`
* Layers
  * `canViewLayers`
  * `canViewLayersMetaData`
  * `canViewLayersCosts`
  * `canEditLayers`
  * `canEditLayersMetaData`
  * `canEditLayersCosts`
* Overlays
  * `canViewOverlays`
  * `canEditOverlays`
  * `canViewPorts`
  * `canEditPorts`
* Wells
  * `canViewWells`
  * `canViewWellsMetaData`
  * `canViewWellsCosts`
  * `canEditWells`
  * `canEditWellsMetaData`
  * `canEditWellsCosts`
* Activities
  * `canViewActivities`
  * `canViewActivitiesCosts`
  * `canEditActivities`
  * `canEditActivitiesCosts`
* Custom Costs
  * `canEditCustomCosts`
  * `canViewCustomCosts`
  * `canEditBookmarks`
  * `canViewBookmarks`

## Samples

Follow this link : [GitHub Repository](https://github.com/XvisionAS/FieldTwin-Integration-Demo)

## Communication from FieldAP to integration

The main interface of *FieldAP* can send and receive messages from the integration using [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

Here's how an integration can receive these messages from *FieldAP* :

```javascript
    window.addEventListener('message', function(event) {
        // IMPORTANT: Check the origin of the data!
        if (~event.origin.indexOf('https://backend.app.fieldap.com')) {
            console.log(JSON.stringify(event.data, null, 2) );
        } else {
            // Not coming from correct origin
            return;
        }
    });
```

Follow this link: [Sample](https://github.com/XvisionAS/FieldTwin-Integration-Demo/tree/master/events-demo/views)

Definition of the different asset *type* that can be sent :

* for the `select` event:
  * `staged-asset`
  * `connection`
  * `well`
  * `overlay`
  * `layer`
  * `customCost`
* for the other events you can also in plus have:
  * `metaDatumValue`

Definition of the different attributes for types can be found in [API docs](https://apidocs.fieldap.com)

### costQuery

This message is sent after the integration posted a message `getCostQuery`.
The result will contains these attributes :

* attribute `event` is set to `costQuery`
* attribute `data` is an object that contains:
  * attribute `queryId` is the value that you can pass when calling `getCostQuery`. It allows to identify a query when posting `getCostQuery` multiple times.
  * attribute `removeEmptyItem` do not include items that have no meta data defined.
  * attribute `query` is the actual query and is composed of :
    * attribute `stagedAssets` contains an array of assets and their meta data.
    * attribute `connections` contains an array of connections and their meta data.

### loaded

This event is sent when an integration iframe is fully loaded. It contains information about subProject, project and tokens used to communicate with API.
The result will contains these attributes :

* attribute `event` is set to `loaded`
* attribute `subProject` is set to subProject id, if a sub project is loaded
* attribute `project` is set to project id, if a project is loaded
* attribute `account` is set to account id, if a project is loaded
* attribute `token` is set to the JWT that the integration can use to query data.
* attribute `trafficManagerJWT` is set to traffic manager JWT if present.
* attribute `backendUrl` is set to the address of the backend the JWT is referring to.

### select

When one or more asset get selected, a `select` event is sent.
The result will contains these attributes :

* attribute `event` is set to  `select`
* attribute `data` contains an array of selected items :
  * attribute `data.[].type` contains the type of the selected item.
  * attribute `data.[].id` uniq id of the selected item.
  * attribute `data.[].name` display name of selected.
* attribute `id`( obsolete ) uniq id of the first selected item.
* attribute `type` ( obsolete ) type of the first selected item.

#### For example, for a simple selection

```javascript
{
  event: "select",
  data: [
    {
      type: "staged-asset",
      id: "-LvCAe-JPACMW-F74Ocs",
      name: "6 Slot Manifold - Diverless Vertical Connection System #1"
    }
  ],
  id: "-LvCAe-JPACMW-F74Ocs",
  type: "staged-asset"
}
```

#### For example, in case of multi-selection

```javascript
{
  event: "select",
  data: [
    {
      type: "staged-asset",
      id: "-LvCAe-JPACMW-F74Ocs",
      name: "6 Slot Manifold - Diverless Vertical Connection System #1"
    },
    {
      type: "staged-asset",
      id: "-LvCAbWf-Rf78H59Rnqj",
      name: "6 Slot Manifold - Diverless Horizontal Connection System #1"
    }
  ],
  id: "-LvCAe-JPACMW-F74Ocs",
  type: "staged-asset"
}
```

### unselect

Sent when selection is reset ( no more items selected ).
The result will contains this attribute :

* attribute `event` is set to  `unselect`

### projectData

This message is sent after the integration posted a message `getProjectData`.
The result will contains these attributes :

* attribute `event` is set to `projectData`.
* attribute `data` contains data about the event.
* attribute `data.assets` arrays of information about staged asset.
  * attribute `data.assets.[].name` name of staged asset.
  * attribute `data.assets.[].tags` tags of staged asset.
  * attribute `data.assets.[].metaData` meta data of staged asset.
  * attribute `data.connections` arrays of information about staged asset.
  * attribute `data.connections.[].name` name of connection.
  * attribute `data.connections.[].tags` tags of connection.
  * attribute `data.connections.[].metaData` meta data of connection.
  * attribute `data.wells` arrays of information about staged asset.
  * attribute `data.wells.[].name` name of well.
  * attribute `data.wells.[].tags` tags of well.
  * attribute `data.wells.[].metaData` meta data of well.
  * attribute `data.project` information about the current project.
  * attribute `data.project.subProjectName` current sub-project name.
  * attribute `data.project.subProjectTags` aggregation of all sub-project tags.

### `didUpdate` and `didUpdateFromNetwork`

Sent when an item was modified.

`didUpdate` event correspond to an event triggered in the user browser.
`didUpdateFromNetwork` correspond to a modification to the sub project done through another client or through an API call.

The result will contains these attributes :

* attribute `event` is set to  `didUpdate` or `didUpdateFromNetwork`
* attribute `id` uniq id of the updated item.
* attribute `type` type of the updated item.
* attribute `data` contains the raw data of the selected item
* attribute `previousData` contains the previous raw data of the selected item
* attribute `diff` contains only the attributes that where modified.

#### Example for an overlay updated through the user's client

```javascript
{
  event: "didUpdate",
  id: "-LdIy8vwvUsX_A4DC4E3",
  type: "overlay",
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
  "event":"didUpdateFromNetwork",
  "id":"-LvAW4EZXEXALeigTUzZ",
  "type":"metaDatumValue",
  "data": {
    "type":"string",
    "options": {
      "default":"blue"
    },
    "relateToId":"-K5uq-UAY4FhTHllT1xs",
    "relateToType":"asset",
    "ownerId":"-LvAOzgcvH3CzYP7IYCP",
    "value":"227"
  },
  "previousData": {
    "type":"string",
    "options":{ "default":"blue"
    },
    "relateToId":"-K5uq-UAY4FhTHllT1xs",
    "relateToType":"asset",
    "ownerId":"-LvAOzgcvH3CzYP7IYCP",
    "value":"226"
  },
  "diff":{
    "value":"226"
  }
}
```

### `didCreate` and `didCreateFromNetwork`

#### description

Sent when an item was created. Contains the same data as didUpdate, except it does not have `previousData` or `diff`.

The `didCreate` event correspond to an event triggered in the user browser. `didCreateFromNetwork` correspond to a
modification to the sub project done through another client or through an API call

The result will contains these attributes :

* attribute `event` is set to  `didCreate` or `didCreateFromNetwork`
* attribute `id` uniq id of the created item.
* attribute `type` type of the created item.
* attribute `data` contains the raw data of the selected item

### `didDelete` and `didDeleteFromNetwork`

Sent when an item was deleted . Contains the same data as didUpdate. The data field correspond to the data before deletion.  

`didDelete` event correspond to an event triggered in the user browser.
`didDeleteFromNetwork` correspond to a modification to the sub project done through another client or through an API call.

The result will contains these attributes :

* attribute `event` is set to  `didDelete` or `didDeleteFromNetwork`
* attribute `id` uniq id of the deleted item.
* attribute `type` type of the deleted item.
* attribute `data` contains the raw data of the deleted item
* attribute `previousData` contains the previous raw data of the selected item
* attribute `diff` contains only the attributes that where modified.

#### Example for deletion of a custom-cost from Network

```json
{
  "event":"didDeleteFromNetwork",
  "id":"-LvKED-ci3fW07aNMgqh",
  "type":"customCost",
  "data": {
    "tags":[],
    "isValidForCost":true,
    "costObject":{"value":2356,
    "entries":[],
    "costPerDay":0,
    "currency":"USD",
    "stateText":"User input",
    "stateType":"danger",
    "startDate":"2019-12-09T23:00:00.000Z",
    "endDate":"2019-12-19T23:00:00.000Z",
    "supplier":"subsurface 42"},
    "assetName":"custom entry",
    "kind":"SPS",
    "userRight":{"cost":true,
    "metaData":true,
    "layer":true,
    "well":true,
    "costGen":"-LvFdcBUG9Ign29XgVw2"},
    "subProject":"-LvA9E5njA5MwR38ClmA"}
}
```

#### Example for deletion of a connection from client

```json
{
  "event":"didDelete",
  "id":"-LvAl_FGFuSPZJHdo_Cj",
  "type":"connection",
  "data": {
    "tags":[],
    "isValidForCost":true,
    "costObject":{"value":0,
    "entries":[],
    "costPerDay":0,
    "costPerLengthUnit":300,
    "costByLength":true,
    "currency":"USD"},
    "showCustomResults":false,
    "customResults":{},
    "designType":null,
    "visible":true,
    "userRight":{"cost":true,
    "metaData":true,
    "layer":true,
    "well":true,
    "costGen":"-LvFdcBUG9Ign29XgVw2"},
    "bendable":false,
    "fromSocket":"b",
    "toSocket":null,
    "fromCoordinate":{"x":-207.13230953079614,
    "y":30.84226897392744,
    "z":2.191579},
    "toCoordinate":{"x":-228.97472122228268,
    "y":4.667924202314097,
    "z":-1200},
    "intermediaryPoints":[],
    "params":{"type":2,
    "label":"Oil Production #2"},
    "renderOrder":0,
    "showLabel":false,
    "showLength":false,
    "status":null,
    "importParams":{},
    "straight":false,
    "isLocked":false,
    "subProject":null,
    "metaDataValue":[],
    "from":null,
    "to":null
  },
  "previousData":{
    "tags":[],
    "isValidForCost":true,
    "costObject":{"value":0,
    "entries":[],
    "costPerDay":0,
    "costPerLengthUnit":300,
    "costByLength":true,
    "currency":"USD"},
    "showCustomResults":false,
    "customResults":{},
    "designType":null,
    "visible":true,
    "userRight":{"cost":true,
    "metaData":true,
    "layer":true,
    "well":true,
    "costGen":"-LvFdcBUG9Ign29XgVw2"},
    "bendable":false,
    "fromSocket":"b",
    "toSocket":null,
    "fromCoordinate": {
      "x":-207.13230953079614,
      "y":30.84226897392744,
      "z":2.191579
    },
    "toCoordinate":{
      "x":-228.97472122228268,
      "y":4.667924202314097,
      "z":-1200
    },
    "intermediaryPoints":[],
    "params":{"type":2,
    "label":"Oil Production #2"},
    "renderOrder":0,
    "showLabel":false,
    "showLength":false,
    "status":null,
    "importParams":{},
    "straight":false,
    "isLocked":false,
    "subProject":"-LvA9E5njA5MwR38ClmA",
    "metaDataValue":[
      "-LvAl_ca3FLw3YLrIewI",
      "-LvAlb8fiOTeGCRB4PkT"
    ],
    "from":"-LvAOzgcvH3CzYP7IYCP",
    "to":null
    },
  "diff":{
    "subProject":"-LvA9E5njA5MwR38ClmA",
    "metaDataValue": {
      "0":"-LvAl_ca3FLw3YLrIewI",
      "1":"-LvAlb8fiOTeGCRB4PkT"
  },
  "from":"-LvAOzgcvH3CzYP7IYCP"
  }
}
```

## Communication from integration to FieldAP

While this feature is limited for now, integrations are able to call functions in *FieldAP* using the `postMessage` mechanism.

To do that, just use `postMessage` from `window.parent` within the integration client.

```javascript
window.parent.postMessage(
  {
    event: 'getProjectData'
  },
  '*'
);
```

The results, if any will then be sent via another `postMessage`.

### getProjectData

Allows to get some information about a project. The function consume these attributes:

* attribute `event` is set to `getProjectData`.

Results format is defined in `projectData`.

#### samples

```javascript
{
  event:"getProjectData"  
}
```

### computeCostUsingServer

Launch a cost computation on cost server. A cost server needs to be defined. 

#### Calling computCostUsingServer

```javascript
{
  event:"computeCostUsingServer"  
}
```

### zoomOn

Focus the view on the given item. The function consume these attributes:

* attribute `event` is set to `zoomOn`.
* attribute `event.data.type` type of the item to focus on (`stagedAsset`, `connection`, `well`, `layer`, `overlay`)..
* attribute `event.data.id` id of the item to focus on.

#### Calling zoomOn to focus on a well

```javascript
{
  event:"zoomOn",
  data:{
    type:"well",
    id:"id_of_the_well"
  }
}
```

### select

Select and focus on an one or multiple items.

* attribute `event` is set to `zoomOn`.
* attribute `event.data.items` array of item to select.
* attribute `event.data.items.id` id of the item to select.
* attribute `event.data.items.type` type of the item to select (`stagedAsset`, `connection`, `well`, `layer`, `overlay`).

#### Example for selecting and focusing on a well

```javascript
{
  event:"select",
  data:{
    items:[{
      type:"well",
      id:"id_of_the_well"
    }]
  }
}
```

### getCostQuery

Request a JSON object that contains a cost server query of the whole sub project. You can pass a query id that will be returned in the reply `costQuery`.

```javascript
{
  event:"getCostQuery",
  data:{
    queryId:"id_of_the_query"
  }
}
```

Result is described in message `costQuery`

### user defined message

For meta data of type "button", user can define a custom message to be sent when the user click on the button.
The message contains the usual information, `event` will be set to the value defined in the meta data.
