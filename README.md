# Integration in FieldAP

## Introduction

This document explains how to develop an integration for *FieldAP*. An *integration* is a web page, which is loaded inside the main interface of *FieldAP* through an *iFrame*.

There is two kind of integration :

1. **global**, these integrations are loaded when the application starts, and are kept alive through the whole life cycle of the application. These can receive message when a project is created or deleted from the dashboard. 
2. **local**, integrations are loaded only when a project is opened. They only receive messages that relate to the project that is currently open. These generally have a user iterface (UI) which is visible FieldAp's main interface, but integrations aren't required to have a UI. In this document, integrations without a UI are referred to as *headless*.

## Setting up an integration

> You need to be administrator of an account to be able to setup a new integration.

[Online Documentation](https://docs.fieldap.com/account/#tabs)

## How to serve integration for use in FieldAP

Depending on how the integration was setup, *FieldAP* will create an iFrame that either generate a *GET* or a *POST* request to the integration URL.

This request will contain the following, depending on the HTTP method used:

* a query params `token` for *GET*
* a body with attribute `token` for *POST*

This `token` value should be used to when querying the FieldAP API.

> The API can be accessed using `https://backend.[name-of-instance].fieldap.com` so for `https://app.fieldap.com` the API access is `https://backend.app.fieldap.com`.

For example, using `NodeJS + ExpressJS`:

```javascript

const express    = require("express")
const bodyParser = require("body-parser")

const app = express()

app.use(bodyParser.json())

app.post("/", function (request, response) {
  response.send(`
  <html>
    <body>
      <h1>${request.body.token}</h1>
    </body>
  </html>
  `)
})

app.listen()

```

> note that this reference implementation depends on `npm install express body-parser`

This example webserver will reply to a *POST* request on `/`, and return HTML that contains the token sent by *FieldAP*.

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
  - `staged-asset`
  - `connection`
  - `well`
  - `overlay`
  - `layer`
  - `customCost`
* for the other events you can also in plus have:
  - `metaDatumValue`

Definition of the different attributes for types can be found in [API docs](https://apidocs.fieldap.com)

### select

#### description

When one or more asset get selected, a `select` event is sent. 

#### format

* attribute `event` is set to  `select`
* attribute `data` contains an array of selected items :
  * attribute `data.[].type` contains the type of the selected item.
  * attribute `data.[].id` uniq id of the selected item.
  * attribute `data.[].name` display name of selected.
* attribute `id`( obsolete ) uniq id of the first selected item.
* attribute `type` ( obsolete ) type of the first selected item.

#### example

##### Simple selection

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

##### In case of multi-selection:

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

#### description

Sent when selection is reset ( no more items selected ).

#### format

* attribute `event` is set to  `unselect`

#### example

```javascript
{
  event: "unselect"
}
```

### `didUpdate` and `didUpdateFromNetwork`

#### description

Sent when an item was modified. 

`didUpdate` event correspond to an event triggered in the user browser. 

`didUpdateFromNetwork` correspond to a modification to the sub project done through another client or through an API call

#### format

* attribute `event` is set to  `didUpdate` or `didUpdateFromNetwork`
* attribute `id` uniq id of the updated item.
* attribute `type` type of the updated item.
* attribute `data` contains the raw data of the selected item
* attribute `previousData` contains the previous raw data of the selected item
* attribute `diff` contains only the attributes that where modified.

#### example

##### For an overlay updated through the user's client

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

##### For a metaDataValue updated through the network

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

The `didCreate` event correspond to an event triggered in the user browser, the `didCreateFromNetwork` correspond to a
modification to the sub project done through another client or through an API call

#### format

* attribute `event` is set to  `didCreate` or `didCreateFromNetwork`
* attribute `id` uniq id of the created item.
* attribute `type` type of the created item.
* attribute `data` contains the raw data of the selected item

### `didDelete` and `didDeleteFromNetwork`

Sent when an item was deleted . Contains the same data as didUpdate. The data field correspond to the data before deletion.  

`didDelete` event correspond to an event triggered in the user browser.

`didDeleteFromNetwork` correspond to a modification to the sub project done through another client or through an API call

#### format

* attribute `event` is set to  `didDelete` or `didDeleteFromNetwork`
* attribute `id` uniq id of the deleted item.
* attribute `type` type of the deleted item.
* attribute `data` contains the raw data of the deleted item
* attribute `previousData` contains the previous raw data of the selected item
* attribute `diff` contains only the attributes that where modified.

#### example

##### deletion of a custom-cost from Network

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

##### deletion of a connection from client

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

### `didClone`

#### description

Sent when a project or a sub project is cloned.

> For getting the `didClone` notification when a project is cloned, the integration needs to be a **global** integration, as these event are sent from the dashboard, without any project loaded.

The even contains a map of all the id that where created and their corresponding source id as well as which project and sub project information.

#### format

##### `didClone` for a project 
* attribute `event` is set to  `didClone`
* attribute `fromProjectId`source project id.
* attribute `fromProjectName` source project name.
* attribute `fromAccountId` source account id.
* attribute `projectId` new project id.
* attribute `projectName`new project name.
* attribute `acountId` new account id.
* attribute `idsMap` contains a map of source id => target id. useful if you need to migrate data that relate to each asset.

##### `didClone` for a sub-project

* attribute `event` is set to `didClone`
* attribute `fromSubProjectId` source sub project id.
* attribute `fromSubProjectName` source sub project name.
* attribute `fromProjectId` source project id.
* attribute `fromProjectName` source project name.
* attribute `fromAccountId` source account id.
* attribute `toProjectName` target project name.
* attribute `subProjectId` new sub project id.
* attribute `subProjectName` new sub project name
* attribute `idsMap`


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

#### description

Allows to get some information about a project.

#### arguments

* attribute `event` is set to` getProjectData`.

#### return format
* attribute `event` is set to `projectData`.
* attribute `data` contains data about the event.
* attribute `data.assets` arrays of informations about staged asset.
	* attribute `data.assets.[].name` name of staged asset.
	* attribute `data.assets.[].tags` tags of staged asset.
	* attribute `data.assets.[].metaData` meta data of staged asset.
	* attribute `data.connections` arrays of informations about staged asset.
	* attribute `data.connections.[].name` name of connection.
	* attribute `data.connections.[].tags` tags of connection.
	* attribute `data.connections.[].metaData` meta data of connection.
	* attribute `data.wells` arrays of informations about staged asset.
	* attribute `data.wells.[].name` name of well.
	* attribute `data.wells.[].tags` tags of well.
	* attribute `data.wells.[].metaData` meta data of well.
	* attribute `data.project` informations about the current project.
	* attribute `data.project.subProjectName` current sub-project name.
	* attribute `data.project.subProjectTags` aggregation of all sub-project tags.

#### samples

```javascript
{
  event:"getProjectData"  
}
```

### zoomOn

#### description

Focus the view on the given item

#### arguments

* attribute `event` is set to `zoomOn`.
* attribute `event.type` type of the item to focus on.
* attribute `event.id` id of the item to focus on. 

#### samples

```javascript
{
  event:"zoomOn",
  data:{
    type:"well",
    id:"id_of_the_well"
  }
}
```