# Integration in FieldAP

## Revision

| Number | Author  | Description                                 |
| :----- | :------ | :------------------------------------------ |
| 1      | olivier | Initial release                             |
| 2      | olivier | Added `canEdit` and list of user rights     |
| 3      | olivier | Added custom message                        |
| 4      | olivier | Added `loaded` event description            |
| 5      | olivier | Added information about project wide access |
| 6      | olivier | Added information about all project access  |
| 7      | olivier | Added didUpdate/didCreate/didDelete details |
| 8      | olivier | Added `tokenRefresh` event description      |

## Introduction

This document explains how to develop an integration for *FieldAP*. An *integration* is a web page, which is loaded inside the main interface of *FieldAP* through an *iFrame*.

There are two kinds of integrations:

1. **global**, these integrations are loaded when the application starts, and are kept alive through the whole life cycle of the application. These can receive a message when a project is created or deleted from the dashboard. 
2. **local**, integrations are loaded only when a project is opened. They only receive messages that relate to the project that is currently open. These generally have a user interface (UI) which is visible in FieldAp's main interface, but integrations aren't required to have an UI. In this document, integrations without an UI are referred to as *headless*.

## Setting up an integration

> You need to be the administrator of an account to be able to setup a new integration.

Link: [FieldAP Online Documentation](https://docs.fieldap.com/account/#tabs)

> By default, and for security reasons, an integration receive a JWT that only gives access to the sub project the user is currently editing. Through the administration panel, you can also:

* Give access to the whole project of the sub project.
* Give access to all the projects an user have access to across the account.

## How to serve an integration for use in FieldAP

Depending on how the integration was setup, *FieldAP* will create an iFrame that either generates a *GET* or a *POST* request to the integration URL.

This request will contain the following, depending on the HTTP method used:

1. query params `token`, `backendUrl`, `subProject`, `canEdit` and `project` for *GET*
2. body with attributes `token`, `backendUrl`, `subProject`, `canEdit` and `project` for *POST*

| attribute    | description                                                                                                                                                 |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`      | Security token needed for making a FieldAP API call.                                                                                                        |
| `backEndUrl` | Contains backend url of the project.                                                                                                                        |
| `project`    | Contains the project ID for the integration it is instanciated from.                                                                                        |
| `subProject` | Contains the subProject ID for the integration it is instanciated from.                                                                                     |
| `canEdit`    | Indicated if the user has the rights to edit for the integration. This has to be handled by the integration, as FieldAP does not have a way to control that.|

`token` is a *JWT* and contain information about the user and user rights. You can parse it with any *JWT* library. The public key to validate this JWT can be found at `https://backend.[name-of-instance].fieldap.com/token/publicKey`.

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

By default JWT have an expiration time of one (1) hour after it was created. You can refresh the token by calling this endpoint : `https://backend.[name-of-instance].fieldap.com/token/refresh`.
You pass the JWT the usual way (using header `Authentification`: `Bearer ${JWT}`) and you receive a JSON object with the new JWT inside the attribute `token`

Since 5.5, a new message is posted by the application to the integration `tokenRefresh` that pass a new refreshed token ( so you do not need to refresh the token ).

## Generate a JWT using an API token

It is possible to generate a JWT using an API token. For that you need start a **POST** request use this endpoint : `https://backend.[name-of-instance].fieldap.com/token/generate`.
You pass the API token the usual way (using header `token`:`[API Token]`).
The body of the request must contain:

* `userId` : Id of the user the JWT will be generated for.
* `subProjectId` : Id of the sub project the JWT will be generated for.
* optional `customTabId` : integration id to generate the token for. Integration id can be looked up by an API call or in the account settings.

On success, the query return a JSON object that contains an attribute `token`.


## User rights management

Within the JWT passed to the integration, there is an attribute `userRights` that contains what the user has access to. These rights will be followed by the API you are using, but in case you need to check them, this is the list of possible values:

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

Definition of the different element *type* that can be sent:

* for the `select` event:
  * `staged-asset`
  * `connection`
  * `well`
  * `overlay`
  * `layer`
  * `customCost`
* for the other events you can also in addition have:
  * `metaDatumValue`

Definition of the different attributes for types can be found in [API docs](https://apidocs.fieldap.com)

### loaded

This event is sent when an integration iframe is fully loaded. It contains information about subProject, project and tokens used to communicate with API.
The argument will contain these attributes :

| Attribute         | Decription                                                    |
| :---------------- | :------------------------------------------------------------ |
| event             | is set to `loaded`                                            |
| subProject        | is set to subProject id, if a sub project is loaded           |
| project           | is set to project id, if a project is loaded                  |
| account           | is set to account id, if a project is loaded                  |
| token             | is set to the JWT that the integration can use to query data. |
| trafficManagerJWT | is set to traffic manager JWT if present.                     |
| backendUrl        | is set to the address of the backend the JWT is refering to.  |

### tokenRefresh

This message is sent whenever the JWT will become stall. It contains a new refreshed JWT that the integration can use to communicate with FielTwin backend.

| Attribute         | Decription                                                    |
| :---------------- | :------------------------------------------------------------ |
| event             | is set to `tokenRefresh`                                            |
| subProject        | is set to subProject id, if a sub project is loaded           |
| project           | is set to project id, if a project is loaded                  |
| account           | is set to account id, if a project is loaded                  |
| token             | is set to the JWT that the integration can use to query data. |
| trafficManagerJWT | is set to traffic manager JWT if present.                     |
| backendUrl        | is set to the address of the backend the JWT is refering to.  |


### costQuery

This message is sent after the integration posted a message `getCostQuery`.
The result will contain these attributes:

| Attribute       | Decription                                                                                                                                |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| event           | is set to `costQuery`                                                                                                                     |
| data            | is an object that contains:                                                                                                               |
| queryId         | is the value that you can pass when calling `getCostQuery`. It allows you to identify a query when posting `getCostQuery` multiple times. |
| removeEmptyItem | do not include items that have no meta data defined.                                                                                      |
| query           | is the actual query and is composed of :                                                                                                  |
| stagedAssets    | contains an array of assets and their meta data.                                                                                          |
| connections     | contains an array of connections and their meta data.                                                                                     |

### select

When one or more assets get selected, a `select` event is sent.
The result will contain these attributes :

| Attribute    | Description                                        |
| :----------- | :------------------------------------------------- |
| event        | is set to  `select`                                |
| data         | contains an array of selected items                |
| data.[].type | contains the type of the selected item.            |
| data.[].id   | unique id of the selected item.                    |
| data.[].name | display name of selected.                          |
| id           | ( obsolete ) unique id of the first selected item. |
| type         | ( obsolete ) type of the first selected item.    |

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

Sent when the selection is reset (no more items selected).
The result will contain this attribute:

* attribute `event` is set to  `unselect`

### projectData

This message is sent after the integration posted a message `getProjectData`.
The result will contain these attributes :


| Attribute                    | Description                                |
| :--------------------------- | :----------------------------------------- |
| event                        | is set to `projectData`.                   |
| data                         | contains data about the event.             |
| data.assets                  | arrays of information about staged asset.  |
| data.assets.[].name          | name of staged asset.                      |
| data.assets.[].tags          | tags of staged asset.                      |
| data.assets.[].metaData      | meta data of staged asset.                 |
| data.connections             | arrays of information about staged asset.  |
| data.connections.[].name     | name of connection.                        |
| data.connections.[].tags     | tags of connection.                        |
| data.connections.[].metaData | meta data of connection.                   |
| data.wells                   | arrays of information about staged asset.  |
| data.wells.[].name           | name of well.                              |
| data.wells.[].tags           | tags of well.                              |
| data.wells.[].metaData       | meta data of well.                         |
| data.project                 | information about the current project.     |
| data.project.subProjectName  | current sub-project name.                  |
| data.project.subProjectTags  | aggregation of all sub-project tags.       |

### `didCreate` and `didCreateFromNetwork`

Sent when an item was created. Contains the same data as didUpdate, except it does not have `previousData` or `diff`.

* `didCreate` event corresponds to an event triggered in the user browser. 
* `didCreateFromNetwork` corresponds to a modification to the sub project done through another client or through an API call

The result will contain these attributes:

| Attribute | Description                                      |
| :-------- | :----------------------------------------------- |
| event     | is set to  `didCreate` or `didCreateFromNetwork` |
| id        | unique id of the updated item.                   |
| type      | type of the updated item.                        |
| data      | contain the raw data of the selected item.       |

### `didUpdate` and `didUpdateFromNetwork`

Sent when an item was modified.

* `didUpdate` event corresponds to an event triggered in the user browser.
* `didUpdateFromNetwork` corresponds to a modification to the sub project done through another client or through an API call.

The result will contain these attributes:

| Attribute    | Description                                          |
| :----------- | :--------------------------------------------------- |
| event        | is set to  `didUpdate` or `didUpdateFromNetwork`     |
| id           | unique id of the updated item.                       |
| type         | type of the updated item.                            |
| data         | contains the raw data of the selected item.          |
| previousData | contains the previous raw data of the selected item. |
| diff         | contains only the attributes that where modified.    |

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

### `didDelete` and `didDeleteFromNetwork`

Sent when an item was deleted. Contains the same data as didUpdate. The data field corresponds at the time of the deletion, so some of the relationships might be set to `null`. In this case, you will find this information inside the `previousData` (if it was set previously, so for example if you create and then delete an element, `previousData` will not be set).

* `didDelete` event corresponds to an event triggered in the user browser.
* `didDeleteFromNetwork` corresponds to a modification to the sub project done through another client or through an API call.

The result will contain these attributes:

| Attribute    | Description                                          |
| :----------- | :--------------------------------------------------- |
| event        | is set to  `didDelete` or `didDeleteFromNetwork`     |
| id           | unique id of the updated item.                       |
| type         | type of the updated item.                            |
| data         | contains the raw data of the selected item.          |
| previousData | contains the previous raw data of the selected item. |
| diff         | contains only the attributes that where modified.    |

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
    "userRight":{
      "cost":true,
      "metaData":true,
      "layer":true,
      "well":true,
      "costGen":"-LvFdcBUG9Ign29XgVw2"
    },
    "subProject":"-LvA9E5njA5MwR38ClmA"
  }
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

## didUpdate / didCreate / didDelete attributes
### Activity

> `event.type` is set to `activity`.

| Attribute                        | Description                                                                                                                                                                                     |
| :------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| actionKind                       | Type of action to be performed. Can be `move`, `show`, `hide`, `fadeIn`, `fadeOut`, `idle`.                                                                                                     |
| activityType                     | Can be  `task`, `milestone` or `project`.                                                                                                                                                       |
| actor                            | id of the staged asset that the activity is executed on. Can be null.                                                                                                                           |
| actorAsConnection                | id of the connection that the activity is executed on. Can be null.                                                                                                                             |
| category                         | Can be `Installation`, `Fabrication` or `Engineering`                                                                                                                                           |
| clonedFroms                      | Array of ids that describe the parents this activity was cloned from                                                                                                                           |
| costObject                       | Describe cost                                                                                                                                                                                   |
| costObject.value                 | Cost value                                                                                                                                                                                     |
| costObject.entries               | Array of cost entry for cost breakdown                                                                                                                                                         |
| costObject.entries[].cost        | Cost of the entry                                                                                                                                                                               |
| costObject.entries[].description | Entry description                                                                                                                                                                               |
| costObject.entries[].item        | Item vendor id                                                                                                                                                                                 |
| costObject.entries[].notes       | User notes                                                                                                                                                                                     |
| costObject.entries[].number      | Part number                                                                                                                                                                                     |
| costObject.entries[].quantity    | Numbers of item (Cost is multiplied by)                                                                                                                                                         |
| costObject.costPerDay            | Define cost per day (for activity only)                                                                                                                                                         |
| costObject.currency              | Define currency, taken from the list described in account/project                                                                                                                               |
| created                          | Creation date "2020-09-11T07:52:47.355Z"                                                                                                                                                       |
| creator                          | Creator email "name@company.com"                                                                                                                                                               |
| destinationLocation              | target position if any for `move` type activity.                                                                                                                                               |
| destinationLocation.x            | x target position                                                                                                                                                                               |
| destinationLocation.y            | y target position                                                                                                                                                                               |
| destinationPort                  | id of the destination port if any for `move` type activity.                                                                                                                                     |
| destinationStagedAsset           | id of the destination asset if any for `move` type activity.                                                                                                                                   |
| destinationType                  | Define which destination attribute will be for `move` type activity. Can be `location` for `destinationLocation`, `port` for `destinationPort` or `staged-asset` for `destinationStagedAsset`. |
| startDate                        | Start date of the activity                                                                                                                                                                     |
| endDate                          | End date of the activity                                                                                                                                                                       |
| intermediaryPoints               | Intermediary points of the spline for `move` type activity                                                                                                                                     |
| isValidForCost                   | Indicate if this element should be used for computing cost                                                                                                                                     |
| name                             | Name of the activity                                                                                                                                                                           |
| open                             | UI: indicate if the task should be open ( and show sub task ) in the gantt diagram                                                                                                             |
| parent                           | id of the parent activity if any                                                                                                                                                               |
| sortorder                        | UI: order in which task with the same parent will appear                                                                                                                                       |
| subProject                       | id of the sub project that contain this activity                                                                                                                                               |
| vendorAttributes                 | Vendor attributes                                                                                                                                                                               |


### Bookmark

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
| subProject      | id of the sub project that contains this activity                      |
| viewBox         | View bounding box of the bookmark                                      |
| viewBox.x1      |                                                                        |
| viewBox.x2      |                                                                        |
| viewBox.y1      |                                                                        |
| viewBox.y2      |                                                                        |

### Connection

> `event.type` is set to `connection`.

| Attribute                             | Description                                                                                                                                                   |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bendable                              | `true` if the connection is using bendable radius                                                                                                             |
| clonedFroms                           | Array of ids that describe the parents this element was cloned from                                                                                           |
| costObject                            | Describe cost                                                                                                                                                 |
| costObject.value                      | Cost value                                                                                                                                                     |
| costObject.entries                    | Array of cost entry for cost breakdown                                                                                                                         |
| costObject.entries[].cost             | Cost of the entry                                                                                                                                             |
| costObject.entries[].description      | Entry description                                                                                                                                             |
| costObject.entries[].item             | Item vendor id                                                                                                                                                 |
| costObject.entries[].notes            | User notes                                                                                                                                                     |
| costObject.entries[].number           | Part number                                                                                                                                                   |
| costObject.entries[].quantity         | Numbers of item (Cost is multiplied by)                                                                                                                       |
| costObject.costPerDay                 | Define cost per day (for activity only)                                                                                                                       |
| costObject.currency                   | Define currency, taken from the list described in account/project                                                                                             |
| created                               | Creation date                                                                                                                                                 |
| creator                               | Creator email                                                                                                                                                 |
| customResults                         | Custom results are set by integrations using the `Legacy API` and allow an integration to display some data relative to the element                           |
| designType                            | One of the design from the account assigned to the connection                                                                                                 |
| from                                  | Staged asset the connection start from, if any                                                                                                                 |
| fromCoordinate                        | 3D coordinate of the start point of the connection                                                                                                             |
| fromCoordinate.x                      |                                                                                                                                                               |
| fromCoordinate.y                      |                                                                                                                                                               |
| fromCoordinate.z                      |                                                                                                                                                               |
| fromSocket                            | Which socket on the `from` staged asset the connection is connected to                                                                                         |
| importParams                          | If connection was imported ( WFS, shapefile, etc. ) this JSON object contains all the meta data that were imported with it. This is a key->value store        |
| intermediaryPoints                    | Array of 3d point that define                                                                                                                                 |
| isInactive                            | `true` if the connection is not in use anymore (for old connections that are obsolete)                                                                         |
| isLocked                              | If locked, the element cannot be edited anymore                                                                                                               |
| isValidForCost                        | `true` if this element should be used for computing cost                                                                                                       |
| metaDataValue                         | Contains an array of id of meta data value                                                                                                                     |
| noHeightSampling                      | If true the connection will not be height sampled                                                                                                             |
| params                                | Parameters                                                                                                                                                     |
| params.type                           | Id of the connection type. Lists of valid types are defined in account and project                                                                             |
| params.label                          | Label of the connection, if not set, type name will be used                                                                                                   |
| params.textFollowConnection           | `true` if label should follow connection path instead of being a separate entity                                                                               |
| params.textFollowConnectionFlip       | If `textFollowConnection`, `true` if the position on the spline (top/bottom) should be flipped                                                                 |
| params.textFollowConnectionOffset     | If `textFollowConnection`, add an offset to the text position along the connection                                                                             |
| params.textFollowConnectionRepetition | If `textFollowConnection`, number of repetitions of the text along the connection                                                                             |
| params.textFollowConnectionFlip       | If `textFollowConnection`, indicate if the position on the spline (top/bottom) should be flipped                                                               |
| renderOrder                           | Rendering sort order to indicate which connection is on top of the other                                                                                       |
| showCustomResults                     | `true` if custom results (integration driven) should be displayed                                                                                             |
| showLabel                             | `true` if connection label should be displayed                                                                                                                 |
| showLength                            | `true` if connection length should be displayed                                                                                                               |
| status                                | Status of the connection. This is used by the integration to display visual information about a connection. Value can be `warning`, `danger`, `primary`, `success` |
| straight                              | `true` if the connection is straight                                                                                                                           |
| subProject                            | Id of the sub project that contains this activity                                                                                                             |
| tags                                  | Array of tags                                                                                                                                                 |
| to                                    | Staged asset where the connections ends at, if any                                                                                                             |
| toCoordinate                          | 3D coordinate of the end point of the connection                                                                                                               |
| toCoordinate.x                        |                                                                                                                                                               |
| toCoordinate.y                        |                                                                                                                                                               |
| toCoordinate.z                        |                                                                                                                                                               |
| fromSocket                            | Which socket on the `to` staged asset the connection is connected to                                                                                           |
| visible                               | If true, connection is visible                                                                                                                                |

### Custom Cost

> `event.type` is set to `customCost`.

| Attribute      | Description                                                         |
| :------------- | :------------------------------------------------------------------ |
| assetName      | Name of the custom cost                                             |
| clonedFroms    | Array of ids that describe the parents this element was cloned from |
| created        | Creation date                                                       |
| creator        | Creator email                                                       |
| isValidForCost | `true` if this element should be use for computing cost             |
| kind           | What the cost relates to                                            |
| subProject     | Id of the sub project that contains this activity                   |
| tags           | Array of tags                                                       |

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
| subProject              | Id of the sub project that contains this activity                                    |
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

| Attribute    | Description                                                                                                                                                     |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| category     | If `type` is asset, and `value` is a valid asset, category of the asset                                                                                        |
| metaDatumId  | Id of the meta data this value refers to                                                                                                                       |
| name         | Name of the meta data the value refers to                                                                                                                      |
| options      | Options of the meta data the value refers to. Depends on `type`. See [Legacy API](https://apidocs.fieldap.com/#api-MetadataDefinitions-AddMetaDataDefinitions) |
| ownerId      | Id of the element (connection, staged asset, layer, etc.) that holds this value                                                                                 |
| relateToId   | Which id the meta data refers to                                                                                                                               |
| relateToType | Which type the meta data refers to                                                                                                                             |
| subCategory  | If `type` is asset, and `value` is a valid asset, sub category of the asset                                                                                    |
| subType      | If `type` is asset, and `value` is a valid asset, sub type of the asset                                                                                        |
| type         | Type of the meta data                                                                                                                                          |
| value        | Actual value                                                                                                                                                   |
| valueBis     | Some meta data represents two values, this is the second one                                                                                                   |

### Overlay

> `event.type` is set to `overlay`.

| Attribute       | Description                                                         |
| :-------------- | :------------------------------------------------------------------ |
| backgroundColor | background color                                                    |
| color           | foreground (text) color                                             |
| clonedFroms     | Array of ids that describe the parents this element was cloned from |
| created         | Creation date                                                       |
| creator         | Creator email                                                       |
| fontSize        | Font size                                                           |
| subProject      | Id of the sub project that contains this activity                   |
| tags            | Array of tags                                                       |
| text            | Text to be displayed                                                |
| visible         | Define overlay visibility                                           |
| x               | X position                                                          |
| y               | Y position                                                          |

### Port

> `event.type` is set to `port`.

| Attribute   | Description                                                            |
| :---------- | :--------------------------------------------------------------------- |
| angle       | Heading, from the center of the screen. Gives the direction to the port|
| clonedFroms | Array of ids that describe the parents this element was cloned from    |
| created     | Creation date                                                          |
| creator     | Creator email                                                          |
| name        | Name of the port                                                       |
| subProject  | Id of the sub project that contains this activity                      |
| x           | X position                                                             |
| y           | Y position                                                             |

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


### Staged Asset

> `event.type` is set to `stagedAsset`.

| Attribute                        | Description                                                                                                                                                      |
| :------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asset                            | Id of the asset (representation) of the staged asset                                                                                                            |
| assetData                        | Information about the asset                                                                                                                                      |
| assetData.name                   | Name of the asset                                                                                                                                                |
| assetData.description            | Description of the asset                                                                                                                                        |
| assetData.category               | Asset category                                                                                                                                                  |
| assetData.subCategory            | Asset sub category                                                                                                                                              |
| assetData.subType                | Asset sub type                                                                                                                                                  |
| assetData.kind                   | Asset sub type                                                                                                                                                  |
| clonedFroms                      | Array of ids that describe the parents this element was cloned from                                                                                              |
| costObject                       | Cost definition                                                                                                                                                  |
| costObject.value                 | Cost value                                                                                                                                                      |
| costObject.currency              | Currency of the cost                                                                                                                                            |
| costObject.entries               | Array of cost entry for cost breakdown                                                                                                                          |
| costObject.entries[].cost        | Cost of the entry                                                                                                                                                |
| costObject.entries[].description | Entry description                                                                                                                                                |
| costObject.entries[].item        | Item vendor id                                                                                                                                                  |
| costObject.entries[].notes       | User note                                                                                                                                                        |
| costObject.entries[].number      | Part number                                                                                                                                                      |
| costObject.entries[].quantity    | Number of items (Cost is multiplied by)                                                                                                                          |
| costObject.costPerDay            | Define cost per day (for activity only)                                                                                                                          |
| costObject.currency              | Define currency, taken from the list described in account/project                                                                                                |
| created                          | Creation date                                                                                                                                                    |
| creator                          | Creator email                                                                                                                                                    |
| custom                           | (deprecated)                                                                                                                                                    |
| customResults                    | Custom results are set by integrations using the `Legacy API` and allows an integration to display some data relative to the element                            |
| havePerAssetSockets              | If `true` the staged asset contains it own set of sockets                                                                                                        |
| hiddenLabel                      | If `true` the label is hidden                                                                                                                                    |
| initialState                     | Set of states (position, etc.) for the staged asset                                                                                                              |
| initialState.height              | Height of the staged asset                                                                                                                                      |
| initialState.opacity             | Opacity of the staged asset                                                                                                                                      |
| initialState.rotation            | Heading of the staged asset                                                                                                                                      |
| initialState.scale               | Scale of the staged asset                                                                                                                                        |
| initialState.well                | Id of the well the staged asset is connected to, if any                                                                                                          |
| initialState.width               | Width of the staged asset                                                                                                                                        |
| initialState.x                   | X real world coordinate of the staged asset                                                                                                                      |
| initialState.y                   | Y real world coordinate of the staged asset                                                                                                                      |
| isInactive                       | `true` if the staged asset is not in use anymore                                                                                                                |
| isLocked                         | If locked, the element cannot be edited anymore                                                                                                                  |
| isValidForCost                   | `true` if this element should be used for computing cost                                                                                                        |
| metaDataValue                    | Contains an array of id of meta data value                                                                                                                      |
| name                             | Name of the staged asset                                                                                                                                        |
| perAssetParams                   | Parameters for the staged asset                                                                                                                                  |
| perAssetParams.fontSize          | Font size for displaying label                                                                                                                                  |
| perAssetSockets2d                | If `havePerAssetSockets` is `true`, array of definition of socket                                                                                                |
| perAssetSockets2d[].name         | Name of the socket, used in `fromSocket` and `toSocket` when connecting a connection to the staged asset                                                        |
| perAssetSockets2d[].x            | X offset of the socket, relative to the center of the asset                                                                                                      |
| perAssetSockets2d[].y            | Y offset of the socket, relative to the center of the asset                                                                                                      |
| perAssetSockets2d[].z            | z offset of the socket, relative to the center of the asset                                                                                                      |
| perAssetSockets2d[].types        | array of type for the socket. Only the first item is used                                                                                                        |
| port                             | Id of the port the staged asset is docked to, if any                                                                                                            |
| renderOrder                      | Render order for the rendering                                                                                                                                  |
| showCustomResults                | `true`  custom results are visible                                                                                                                              |
| showMetaInfo                     | `true` if meta data info box is visible                                                                                                                          |
| socketMetaDataValue              | Array of meta data values for sockets                                                                                                                            |
| status                           | Status of the staged asset. This is used by the integration to display visual information about a connection. Value can be `warning`, `danger`, `primary`, `success` |
| subProject                       | "-MAR0MZqqqk-Tel75u4V"                                                                                                                                          |
| tags                             | Array of tags                                                                                                                                                    |
| textColor                        | Color to use for render label                                                                                                                                    |
| visible                          | Define staged asset visibility                                                                                                                                  |
| wellmasterConfiguration          | deprecated                                                                                                                                                      |

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

### Well

> `event.type` is set to `well`.

| Attribute           | Description                                                                                                                                                                                                        |
| :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| activeWellBore      | Id of the active bore                                                                                                                                                                                              |
| canBeDrag           | If `true`, user can move the well by dragging it                                                                                                                                                                    |
| clonedFroms         | Array of ids that describe the parents this element was cloned from                                                                                                                                                |
| color               | Rendering color of the well                                                                                                                                                                                        |
| created             | Creation date                                                                                                                                                                                                      |
| creator             | Creator email                                                                                                                                                                                                      |
| fontSize            | Label font size                                                                                                                                                                                                    |
| isInactive          | `true` if the well is in not in use anymore                                                                                                                                                                        |
| kind                | Id of the well type. These are defined in the account settings                                                                                                                                                      |
| labelOffsetX        | X offset of the label, relative to the well position                                                                                                                                                                |
| labelOffsetY        | Y offset of the label, relative to the well position                                                                                                                                                                |
| labelRotation       | Label rotation                                                                                                                                                                                                      |
| labelVisible        | If `true` label is visible                                                                                                                                                                                          |
| metaDataValue       | Contains an array of id of meta data value                                                                                                                                                                          |
| name                | Label / name of the well                                                                                                                                                                                            |
| radius              | Display radius                                                                                                                                                                                                      |
| radiusViewDependant | Dynamic scale of the radius according to the zoom                                                                                                                                                                  |
| referenceLevel      | reference level of the well. Can be set to `sea`, `rkb` or `seabed`. `sea` set initial depth to `0`, `rkb` set inital depth to `rkb` attribute, `seabed` set inital depth to touch down ( height sampling ) value.  |
| rkb                 | if `referenceLevel` is set to `rkb` initial depth will be using this value                                                                                                                                          |
| subProject          | Id of the sub project that contains this activity                                                                                                                                                                  |
| tags                | Array of tags                                                                                                                                                                                                      |
| visible             | Define well visibility                                                                                                                                                                                              |
| x                   | Top hole X Position                                                                                                                                                                                                |
| y                   | Top hole Y position                                                                                                                                                                                                |

### Well Bore

> `event.type` is set to `wellBore`.

| Attribute        | Description                                                                                                     |
| :--------------- | :-------------------------------------------------------------------------------------------------------------- |
| casingShoes      | Array of casing shoes                                                                                           |
| clonedFroms      | Array of ids that describe the parents this element was cloned from                                             |
| name             | Name of the bore                                                                                                |
| path             | Array of 3D point. Z value depends on `referenceLevel` set on the parent well                                   |
| path[].x         | x value of the point                                                                                            |
| path[].y         | x value of the point                                                                                            |
| path[].z         | x value of the point                                                                                            |
| tags             | Array of tags                                                                                                   |
| targets          | Array of 2 target points. First point is reservoir penetration point. Second point is entry inside the reservoir|
| targets[].active |                                                                                                                 |
| targets[].x      |                                                                                                                 |
| targets[].y      |                                                                                                                 |
| targets[].z      |                                                                                                                 |
| targets[].depth  |                                                                                                                 |
| targets[].az     |                                                                                                                 |
| targets[].incl   |                                                                                                                 |
| metaDataValue    | Contains an array of id of meta data value                                                                      |
| kind             | Id of the well bore type. These are defined in the account settings                                             |
| subProject       | Id of the sub project that contains this activity                                                               |
| well             | Id of the parent well                                                                                           |


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

Allows you to get some information about a project. The function will set these attributes:

* attribute `event` is set to `getProjectData`.

Result format is defined in `projectData`.

#### Calling getProjectData

```javascript
{
  event:"getProjectData"  
}
```

### computeCostUsingServer

Launch a cost computation on a cost server. A cost server needs to be defined first. 

#### Calling computeCostUsingServer

```javascript
{
  event:"computeCostUsingServer"  
}
```

### zoomOn

Focus the view on the given item. The function gets these attributes:

| Attribute       | Description                                                                              |
| :-------------- | :--------------------------------------------------------------------------------------- |
| event           | is set to `zoomOn`.                                                                      |
| event.data.type | type of the item to focus on (`stagedAsset`, `connection`, `well`, `layer`, `overlay`).. |
| event.data.id   | id of the item to focus on.                                                              |

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

Select and focus on one or multiple items.

| Attribute             | Description                                                                            |
| :-------------------- | :------------------------------------------------------------------------------------ |
| event                 | is set to `zoomOn`.                                                                   |
| event.data.items      | array of item to select.                                                              |
| event.data.items.id   | id of the item to select.                                                             |
| event.data.items.type | type of the item to select (`stagedAsset`, `connection`, `well`, `layer`, `overlay`). |

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

#### Requesting cost query

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

For meta data of type "button", user can define a custom message to be sent when the user clicks on the button.
The message contains the usual information, `event` will be set to the value defined in the meta data.

