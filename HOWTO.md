# How to ... with the FieldTwin API

The following examples can be run with the [curl](https://curl.se/) command line
utility or imported into the [Postman](https://www.postman.com/) application
(_File_ menu, _Import_, select _Raw Text_, paste the whole `curl` command, _Continue_,
review and replace the variable placeholders with values).

Command line setup for curl commands:

```
export TOKEN=<api token>
export BACKEND_HOST=backend.<your company>.fieldtwin.com
export PROJECT=<project id>
export SUBPROJECT=<subproject id>
```

The API token can be created by an administrator in FieldTwin Admin from the
Account Settings / API section. It must be created for the same account that the
project lives in.

The IDs of the project and subproject (and objects below) can be found from the
URL in your browser's address bar when the project is open in FieldTwin Design.
They look like this: `-MeidQjcOmxpYWFIq5zp`.

## Create a manifold

[docs link](https://api.fieldtwin.com/#api-StagedAssets-AddStagedAsset)

```
curl -H "token: ${TOKEN}" \
     -H "content-type: application/json" \
     --request POST \
     --data '{
                "name": "New Manifold #1",
                "asset": "-K5uq-URmQV-aH0-uBpF",
                "tags": [],
                "initialState": {
                    "rotation": 0,
                    "x": 135277.5,
                    "y": 6565034.6,
                    "scale": 1
                },
                "metaData": []
            }' \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}/stagedAsset
```

* Asset ID `-K5uq-URmQV-aH0-uBpF` equates to a Manifold in FutureOn's standard asset library
  * The list of available assets can be found by calling `/API/v1.9/assets`
* Coordinate values are provided inside the bounds and in the unit of the
  [Coordinate Reference System](https://design.fieldtwin.com/dashboard/#project-settings)
  defined for the project
  * For example meters for [EPSG:23031](https://epsg.io/23031) or us-feet for [EPSG:3452](https://epsg.io/3452)
* For subsea assets the `z` value is automatically set from the bathymetry if uploaded,
  or else the seabed level defined for the project
* `z` values in FieldTwin are `0` at sea level, negative below sea level and positive
  above sea level

## Get a 3D well bore profile

[docs link](https://api.fieldtwin.com/#api-Wells-GetWell)

```
export WELL=<well id>

curl -H "token: ${TOKEN}" \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}/well/${WELL}
```

* The bore profile is returned in the `wellBores[0 .. n].path` attribute
* The bore path is empty by default, it can be set or imported from FieldTwin Design

## Get the generated seabed profile for a connection

[docs link](https://api.fieldtwin.com/#api-Connections-GetConnection)

```
export SAMPLE_RESOLUTION=5
export CONNECTION=<connection id>

curl -H "token: ${TOKEN}" \
     -H "sample-every: ${SAMPLE_RESOLUTION}" \
     -H "simplify: true" \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}/connection/${CONNECTION}
```

* The value of sample resolution can be `1` or more
* Providing `simplify: true` removes the points that fall in a straight line
* The connection profile is returned in the `sampled` attribute

## Visualise custom data for a staged asset

[docs link](https://api.fieldtwin.com/#api-StagedAssets-SetStagedAsset)

Custom results are names and values displayed in a box next to the staged asset in
FieldTwin Design. They can be used for displaying simulation results or operational
data.

```
export STAGEDASSET=<staged asset id>

curl -H "token: ${TOKEN}" \
     -H "content-type: application/json" \
     --request PATCH \
     --data '{
                "customResults": {
                    "Current": [
                        {"name": "Service", "value": "Production", "type": "string"},
                        {"name": "Valve 1 cycles", "value": 384, "type": "decimal"},
                        {"name": "Valve 2 cycles", "value": 410, "type": "decimal"},
                        {"name": "Current Pressure", "value": 5113, "type": "decimal"},
                        {"name": "Current Temp", "value": 60, "type": "decimal"}
                    ]
                },
                "showCustomResults": true
            }' \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}/stagedAsset/${STAGEDASSET}
```

To hide the custom results in FieldTwin Design:

```
curl -H "token: ${TOKEN}" \
     -H "content-type: application/json" \
     --request PATCH \
     --data '{ "showCustomResults": false }' \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}/stagedAsset/${STAGEDASSET}
```

## Visualise custom data along a connection

[docs link](https://api.fieldtwin.com/#api-Connections-SetConnection)

Connection visualisation data is displayed at key points on or alongside a connection
in FieldTwin Design. This can be used for displaying simulation results, survey results
or operational data.

```
export CONNECTION=<connection id>

curl -H "token: ${TOKEN}" \
     -H "content-type: application/json" \
     --request PATCH \
     --data '{
                "visualisationMaps": [{
                    "id": "connection-1-custom-temp",
                    "name": "Temperature Survey",
                    "normalizedKp": false,
                    "rendering": "bar",
                    "data": [
                        {"kp": 100, "v": 68},
                        {"kp": 200, "v": 67},
                        {"kp": 300, "v": 66},
                        {"kp": 400, "v": 65},
                        {"kp": 500, "v": 64}
                    ]
                }],
                "visibleVisualisationMapId": "connection-1-custom-temp"
            }' \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}/connection/${CONNECTION}
```

* The visualisation data is provided as an array of key points `kp` as a distance
  along the connection and a corresponding numeric value `v`
* When `normalizedKp` is true, the key point `kp` is a value between `0` and `1`
  instead of a value in feet/meters (so `0.5` would be half way along the connection)
* A palette for the visualisation can also be provided, but a default palette is
  generated by default

To hide the visualisation in FieldTwin Design:

```
curl -H "token: ${TOKEN}" \
     -H "content-type: application/json" \
     --request PATCH \
     --data '{ "visibleVisualisationMapId": null }' \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}/connection/${CONNECTION}
```

## Store custom data at project level

[docs link (write)](https://api.fieldtwin.com/#api-Projects-PatchProject)  
[docs link (read)](https://api.fieldtwin.com/#api-Projects-GetProjectVendorAttributes)

FieldTwin provides the `vendorAttributes` attribute on many objects including account,
project, subproject, staged asset, connection, and document. This can be used to attach
custom data to the object. There is no built-in visualisation of this data.

Because `vendorAttributes` can be used by more than one integration or for more than one
purpose, we use a convention of storing data objects inside a child key to keep the different
uses separate. The API will merge the provided top-level key(s) into the `vendorAttributes`
without overwriting other existing top-level keys.

```
curl -H "token: ${TOKEN}" \
     -H "content-type: application/json" \
     --request PATCH \
     --data '{ "vendorAttributes": { "myIntegration": { "foo": "bar" } } }' \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}
```

Example of data separation using keys:

```
curl -H "token: ${TOKEN}" \
     -H "content-type: application/json" \
     --request PATCH \
     --data '{ "vendorAttributes": { "drillPro": { "settings": { "name": "Drill Pro v1" } } } }' \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}

curl -H "token: ${TOKEN}" \
     -H "content-type: application/json" \
     --request PATCH \
     --data '{ "vendorAttributes": { "heatCalc": { "scenario": "Base Case", "autoCalc": true, "pipes": ["c-1", "c-2", "c-3"] } } }' \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}

curl -H "token: ${TOKEN}" \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/vendorAttributes
-->
     {
          "drillPro": {
               "settings": {
                    "name": "Drill Pro v1"
               }
          },
          "heatCalc": {
               "scenario": "Base Case",
               "autoCalc": true,
               "pipes": ["c-1", "c-2", "c-3"]
          }
     }
```

* Only one level of keys is merged into `vendorAttributes`
     * In the above example, to add something new into `drillPro` you have to PATCH
       the whole `drillPro` object a second time
* To delete one set of `vendorAttributes`,
  send PATCH data of the format: `{ "vendorAttributes": { "myIntegration": null } }`

## Delete a staged asset

[docs link](https://api.fieldtwin.com/#api-StagedAssets-DeleteStagedAsset)

```
export STAGEDASSET=<staged asset id>

curl -H "token: ${TOKEN}" \
     --request DELETE \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}/stagedAsset/${STAGEDASSET}
```

## Requesting linked (parent/child) subprojects

[docs link](https://design.fieldtwin.com/dashboard/#links)

By default, requesting a child subproject returns the sum of objects from both the parent
subproject(s) and the child. Objects that are automatically merged from a parent subproject
have a different `subProject` value and are given additional attributes in the JSON:

```
curl -H "token: ${TOKEN}" \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}
-->
{
     "id": "-MjF6TYxJ-mkAzWnnsfa",
     "name": "Child Subproject",
     "stagedAssets": {
          "-MkaNgEfqAYhqyhQHNsz": {
               "name": "Local FPSO #1",
               "visible": true,
               "subProject": "-MjF6TYxJ-mkAzWnnsfa"
          },
          "-MjF4vtXQ574Bid3Zbs2": {
               "name": "XMT from parent backdrop",
               "visible": true,
               "subProject": "-MjF3wciX_dTQzLL4aOu",
               "project": "-MjF3L9vJdSXSOiYZiMQ",
               "isForeign": true,
               "getFromSubProject": "https://example.fieldtwin.com/API/v1.9/-MjF3L9vJdSXSOiYZiMQ/subProject/-MjF3wciX_dTQzLL4aOu",
               "getFrom": "https://example.fieldtwin.com/API/v1.9/-MjF3L9vJdSXSOiYZiMQ/subProject/-MjF3wciX_dTQzLL4aOu/stagedAsset/-MjF4vtXQ574Bid3Zbs2"
          }
     }
}
```

If you wish to request a child subproject without merging the items from the parent(s),
set the `merge-foreign` request header to `false`. The parent objects are then returned
in a separate list of `foreignSubProjects`.

```
curl -H "token: ${TOKEN}" \
     -H "merge-foreign: false" \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}
-->
{
     "id": "-MjF6TYxJ-mkAzWnnsfa",
     "name": "Child Subproject",
     "stagedAssets": {
          "-MkaNgEfqAYhqyhQHNsz": {
               "name": "Local FPSO #1",
               "visible": true,
               "subProject": "-MjF6TYxJ-mkAzWnnsfa"
          }
     },
     "foreignSubProjects": [
          {
               "id": "-MjF3wciX_dTQzLL4aOu",
               "name": "Parent Project 1",
               "stagedAssets": {
                    "-MjF4vtXQ574Bid3Zbs2": {
                         "name": "XMT from parent backdrop",
                         "visible": true,
                         "subProject": "-MjF3wciX_dTQzLL4aOu",
                         "project": "-MjF3L9vJdSXSOiYZiMQ",
                         "isForeign": true
                    }
               }
          }
     ]
}
```

Requesting a parent subproject returns only the objects that live in the parent.

## Provide a JWT instead of an API token

A JWT is passed to an integration in the [`loaded` window message](./INTEGRATIONS.md#loaded)
and optionally in the request parameters of an integration's URL.

Unlike an API token, a JWT is restricted to the current user's permissions for
the open project, it does not allow account administration, and it expires after
1 hour (by default). Listen out for the `tokenRefresh` window message to receive
a new JWT before the old one expires.

You should replace the `Token` header with an `Authorization` header; do not provide both.

```
export JWT=<jwt value>

curl -H "Authorization: Bearer ${JWT}" \
     https://${BACKEND_HOST}/API/v1.9/${PROJECT}/subProject/${SUBPROJECT}
```

For integration user interfaces and settings pages you should use the provided JWT
whenever possible. API tokens are suitable for back-end tasks when there is no user
session or when administration permission is required.
