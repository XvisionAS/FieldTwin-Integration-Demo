# Creating a cost server to interact with FieldAp cost computation.
Since version 1.5, it is possible to develop a small piece of sofware that will receive query from FieldAp to compute a cost.
From the user point of view, a button appears on the UI of the costs module, that allows her or him to launch a computation using this so call `cost server`.

# Technical details
The cost server is just a simple server that replies to a `POST` query. The address FieldAp should use to make this query is defined on the account administration page, section `module`.

Each `POST` query to the `cost server` contains information about one element. So if the user ask to compute cost on 10 assets, the `cost server` will receive 10 different queries.

## POST query
Depending on how the cost server is setup on the account admin page, the server can be query either in a one shot format ( each connection / stage asset will have it own query ) or in batch mode, where one query will contains multiple sub query.

### One shot query
For each cost computation query, FieldAp client will send all the metadata concerning the assets ( or connection ) with the query.

Here is an example of a simple query for a connection, with only one meta datum.

```javascript
{
  "isBatch":false,
  "connections":{
    "-LRQs4ZryGJur2nKAiX6":[
      {
        "id":"-LPXdHZjnMhWQkQjtbk0",
        "name":"Number of Functions",
        "vendorId":"SubSeaSeven",
        "type":"choices",
        "displayIfConditions":[
          {
            "displayIfEqual":[
              {"id":"-LPWmJxjUWyU9OOijkLP"},
              {"id":"-LPWmNIBwD_WN7c_L93-"}
            ],
            "displayIfEqualBis":[],
            "displayIfEqualTer":[],
            "not":false,
            "operator":"or",
            "operandId":"connection-types",
            "order":0,
            "metaDatum":"-LPXdHZjnMhWQkQjtbk0"
          }
        ],
        "displayIfConditionsSorted": [
          {
            "displayIfEqual":[
              {"id":"-LPWmJxjUWyU9OOijkLP"},
              {"id":"-LPWmNIBwD_WN7c_L93-"}
            ],
            "displayIfEqualBis":[],
            "displayIfEqualTer":[],
            "not":false,
            "operator":"or",
            "operandId":"connection-types",
            "order":0,
            "metaDatum":"-LPXdHZjnMhWQkQjtbk0"
            }
          ],
        "value": {"name":"1 to 56","id": "1to56","vendorId":" 1to56"},
        "valueBis":null,
        "currentValue":{"name":"1 to 56", "id":"1to56", "vendorId":"1to56"},
        "option":null,
        "order":0,
        "cost":0,
        "relateToId":"-LPWjqF7ez0RsjYFQFLT",
        "relateToType":"connection",
        "vendorAttributes":
          {"tagId":"numberOf"},
        "costPerLength":false,
        "length":19.096479834244896,
        "displayIfValues": [
          {"id":"connection-types","name":"Connection Type","noDisplay":true,"type":"choices","options":{"items":{}}}
          ],
        "visible":true
      }
    ]
  }
}
```

Here is the reply from the basic cost server, provided by the FieldAp:

```javascript
{
  "connections": {
    "-LRQs4ZryGJur2nKAiX6": {
      "entries": [
        {"number":null, "item":"Random Price", "cost":1000019.0964798343, "description":"", "quantity":1}
        ],
      "stateText":"Computed on: 2018-11-16T10:56:32.819Z",
      "stateType":"success"}
    },
  "stagedAssets":{}
}
```

The answer is JSON object, that must contains two object with key (`"stagedAssets"` and `"connections"`) each of this object containing  an costs object per connection/sytagedAsset Id.
this cost object contains an  `entries` array, each entry in this array is a cost. The cost is then computed by adding the cost of each of these entries ( quantity is a multiplicator for the cost entry ).

It can also contains `stateText` which is a text that will be displayed in the cost UI, as well as `stateType`, which can be one of 'warning', 'danger', 'primary', 'success', 'default', and will determine the way `stateText` will be displayed.

### Batch query

In this mode, a master query is sent, that contains multiple sub query. Each sub query is an object that is indexed by the `id` of the model it relate to, and each of these sub queries object is indexed by the type of each model.
Field ap support cost for two models : `connections` and `stagedAssets`.

Also at the root of the query you will find an attribute `isBatch` set to true.

Here is an example of such query :

```javascript
{
  "isBatch":true,
  "connections":{
    "-KlcQpnk7Ot6U_RYRzc4":[
      {
        "id":"-KWdh7ZJlzWf_0013EAN",
        "name":"Diameter",
        "vendorId":"12345",
        "type":"numerical",
        "value":"12",
        "order":0,
        "cost":0,
        "relateToId":"2",
        "relateToType":"connection",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "costPerLength":false,
        "length":50.892759999770526,
        "visible":true,
        "vendorAttributes": { "tagId": "foo"}
      },
      {
        "id":"-KXfhd52DUAIfrbOh6TK",
        "name":"Insulation",
        "vendorId":null,
        "type":"choices",
        "value":{
          "id":4,
          "name":"Insulated",
          "vendorId":""
        },
        "order":1,
        "cost":0,
        "relateToId":"2",
        "relateToType":"connection",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "costPerLength":false,
        "length":50.892759999770526,
        "visible":true,
        "vendorAttributes": { "tagId": "bar"}
      },
      {
        "id":"-KbLWRkf5PZDcANaftfX",
        "name":"User specified",
        "vendorId":null,
        "type":"numerical",
        "value":"0",
        "order":2,
        "cost":1000000,
        "relateToId":"2",
        "relateToType":"connection",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "costPerLength":false,
        "length":50.892759999770526,
        "visible":true,
        "vendorAttributes": { "tagId": "foo"}
      },
      {
        "id":"-KfNowl7HpQS4ZPe6oCN",
        "name":"Base",
        "vendorId":null,
        "type":"boolean",
        "value":"0",
        "order":3,
        "cost":1000000,
        "relateToId":"2",
        "relateToType":"connection",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "costPerLength":false,
        "length":50.892759999770526,
        "visible":true,
        "vendorAttributes": { "tagId": "bar"}
      }
    ]
  },
  "stagedAssets":{
    "-KlcQpneT-B6dxambHID":[
      {
        "id":"-KiptVgGDfr2a-ts3xzc",
        "name":"Discharge Pressure",
        "vendorId":null,
        "type":"numerical",
        "value":"",
        "order":0,
        "cost":null,
        "relateToId":"-K5uq-UwVB4bmgUC3Z_G",
        "relateToType":"asset",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "visible":true,
        "vendorAttributes": { "tagId": "foo"}
      },
      {
        "id":"-KiptVi5Lajkws0cVc1c",
        "name":"Pressure Differential",
        "vendorId":null,
        "type":"numerical",
        "value":"",
        "order":1,
        "cost":null,
        "relateToId":"-K5uq-UwVB4bmgUC3Z_G",
        "relateToType":"asset",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "visible":true,
        "vendorAttributes": { "tagId": "bar"}
      },
      {
        "id":"-KiptVjMgz5bf7rtW2NB",
        "name":"Power",
        "vendorId":null,
        "type":"numerical",
        "value":"",
        "order":2,
        "cost":null,
        "relateToId":"-K5uq-UwVB4bmgUC3Z_G",
        "relateToType":"asset",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "visible":true,
        "vendorAttributes": { "tagId": "bizon"}
      }
    ],
    "-KlcQpnfBqYMNDwDE_Mv":[
      {
        "id":"-KiptVgGDfr2a-ts3xzc",
        "name":"Discharge Pressure",
        "vendorId":null,
        "type":"numerical",
        "value":"1",
        "option":null,
        "order":0,
        "cost":null,
        "relateToId":"-K5uq-UwVB4bmgUC3Z_G",
        "relateToType":"asset",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "visible":true,
        "vendorAttributes": { "tagId": "bizon"}
      },
      {
        "id":"-KiptVi5Lajkws0cVc1c",
        "name":"Pressure Differential",
        "vendorId":null,
        "type":"numerical",
        "value":"2",
        "option":null,
        "order":1,
        "cost":null,
        "relateToId":"-K5uq-UwVB4bmgUC3Z_G",
        "relateToType":"asset",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "visible":true,
        "vendorAttributes": { "tagId": "bizon"}
      },
      {
        "id":"-KiptVjMgz5bf7rtW2NB",
        "name":"Power",
        "vendorId":null,
        "type":"numerical",
        "value":"3",
        "option":null,
        "order":2,
        "cost":null,
        "relateToId":"-K5uq-UwVB4bmgUC3Z_G",
        "relateToType":"asset",
        "displayIfEqual":[

        ],
        "displayIfEqualBis":[

        ],
        "displayIfEqualTer":[

        ],
        "visible":true,
        "vendorAttributes": { "tagId": "bizon"}
      }
    ]
  }
}
```

The answer should follow the same format, which each cost contains within the structure like this :

```javascript
{
  "stagedAssets":{
    "-KlcQpneT-B6dxambHID":{
      "entries":[

      ],
      "stateText":"Batch on : Fri Jun 02 2017 12:54:48 GMT+0200 (W. Europe Daylight Time)",
      "stateType":"success"
    },
    "-KlcQpnfBqYMNDwDE_Mv":{
      "entries":[

      ],
      "stateText":"Batch on : Fri Jun 02 2017 12:54:48 GMT+0200 (W. Europe Daylight Time)",
      "stateType":"success"
    }
  },
  "connections":{
    "-KlcQpnk7Ot6U_RYRzc4":{
      "entries":[
        {
          "number":null,
          "item":"User specified",
          "cost":1000000,
          "description":"",
          "quantity":1
        }
      ],
      "stateText":"Batch on : Fri Jun 02 2017 12:54:48 GMT+0200 (W. Europe Daylight Time)",
      "stateType":"success"
    }
  }
}
```
