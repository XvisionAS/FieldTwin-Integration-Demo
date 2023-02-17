# FieldTwin API Python Integration Example

The example code in this folder provides a sample FieldTwin integration tab that invokes
a serverless cloud function written in Python.

When the tab is active, a connection can be selected in FieldTwin Design and a graph of
the connection profile (depth vs distance along the connection) is calculated and displayed.

![Screenshot](./docs/integration.png)

## Implementation

The example implementation consists of a simple frontend user interface written in
`HTML` and `Javascript` and a single backend cloud function written in `Python`.

### Frontend user interface

See [index.html](./index.html): this provides the simple iframe display shown above.
It responds to window message events from the main FieldTwin Design window.

* On initial startup, it receives a `loaded` message from FieldTwin providing the
  project and subproject IDs, and the backend URL and access token required for making
  requests to the FieldTwin API
* After a period of time, a `tokenRefresh` message is sent from FieldTwin to replace
  the API access token with a new one
* The iframe also responds to `select` and `unselect` messages from FieldTwin.
  These are sent whenever an object is selected or un-selected in FieldTwin.
  If the selected object is a connection, an HTTP request is created and sent to the
  backend cloud function requesting a profile image for the selected connection.

### Backend cloud function

See [cloud-function](./cloud-function/): This consists of a single Python function that
is deployed to Google's serverless Cloud Functions environment. See https://cloud.google.com/functions.
Similar products are also provided by Amazon Web Services https://aws.amazon.com/lambda/ 
and Microsoft Azure https://azure.microsoft.com/en-gb/products/functions.

Cloud Functions provide a simple way to develop and deploy backend applications
to run in the cloud without needing to manage servers or containers.

Once the function is written and deployed, an `https` endpoint URL is created which
is used to call the function.

![](./docs/cloud-function.png)

The Python cloud function is called from the frontend Javascript code. The call passes
parameters providing the projectId, subProjectId and connectionId, the FieldTwin API URL
and access token.

The Python code performs the following functions:

* Calls the FieldTwin API to request the project data and connection profile points
* Calculates the depth vs distance profile from the connection points
* Creates a graph image of the profile
* Returns the image to the frontend for display

## Installation

1. Self-hosted option: deploy the file `index.html` on a public or private web
   hosting service and obtain the URL to reach it  
   or  
   Pre-hosted option: use the URL `https://xvisionas.github.io/FieldTwin-Integration-Demo/python-tab/`
2. In FieldTwin Admin, go to Account Settings, then Integrations, and click _Create New Tab_.
   Set the following values:  
   ```
   Name:                           Python Demo
   URL:                            <the URL from step 1>
   Use GET verb:                   yes
   Tab Display Position:           Module Panel (default)
   ```

![](./docs/demo-configuration.png)

### Backend cloud function

The backend Python function is already hosted as described above.
If you wish to host it yourself, you will need to update `cloudFunctionUrl` in `index.html`
so that it calls your own URL instead of the default.
