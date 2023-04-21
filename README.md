# FieldTwin Code Samples

Welcome to the FieldTwin code samples repository. Here you can find examples of how to
create a FieldTwin integration or call the FieldTwin API.

## Resources

You will find the following resources helpful:

* [FieldTwin Documentation Center](https://docs.fieldtwin.com/)
* [Integrations in FieldTwin](./INTEGRATIONS.md)
  * How to develop an integration
  * Reference for the window messages that can be sent to and from an integration
* [API Reference](https://api.fieldtwin.com/)
* [Example API calls](./HOWTO.md)

## List of samples

| Folder | Description | API / Integration | Tags
---------|-------------|-------------------|-----------
| archived | Old samples that are no longer maintained | | 
| [asset-dumper](./asset-dumper/) | Exports 3D assets from FieldTwin as Collada files | API | Javascript, Node.js, API token
| [doc-tab](./doc-tab/) | A minimal single page integration that shows the document files uploaded against an object in FieldTwin Design | Integration | HTML, Javascript, JWT
| [events-tab](./events-tab/) | An integration that prints all window messages from FieldTwin as they arrive, and the contents of the decoded JWT. Useful for testing and debugging. | Integration | HTML, Javascript, JWT
| [excel-macro](./excel-macro/) | Calling the API from an Excel workbook using Excel macros | API | Excel, VB Script, VBA, API token
| [heat-loss-custom-tab](./heat-loss-custom-tab/) | Pending review | | 
| [lay-connection](./lay-connection/) | Pending review | | 
| [metadata-import-export](./metadata-import-export/) | A single page integration that exports/imports metadata to/from an Excel worksheet | Integration | HTML, Vue.js, Excel, JWT
| [power-bi](./power-bi/) | Instructions for how to embed a Power BI report inside FieldTwin | Integration | Power BI
| [python-notebook](./python-notebook/) | Jupyter notebooks for plotting the seabed profile of a connection, sorting connections into length order, and getting and setting metadata values | API | Python, API token
| [python-tab](./python-tab/) | An integration that calls a serverless Python function to plot the seabed profile of a connection | Integration | HTML, Python, Serverless, JWT
| [scripts/javascript](./scripts/javascript/) | Scripts to export a project layout and recreate it in an empty project | API | Javascript, Node.js, API token
| [scripts/python](./scripts/python/) | Scripts for reading project data and updating metadata values using Python | API | Python, API token
| [simple-cost-server](./simple-cost-server/) | Pending review | | 
