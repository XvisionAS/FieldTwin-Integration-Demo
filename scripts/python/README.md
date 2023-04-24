# Python examples

## Description

A collection of Python scripts that call the FieldTwin API 

* `get-connection-points.py` - prints the start, middle, and end coordinates of a connection
* `get-connections-with-design.py` - prints the list of connections in a subproject
  that have a particular design type
* `get-staged-assets-in-range-of-well.py` - prints the list of staged assets in a
  subproject that are within a straight line distance from a particular well
* `get-staged-assets-of-category.py` - prints the list of staged assets in a subproject
  that have a particular asset category
* `batch-modify-metadata-value.py` - changes the stored value of a particular metadata
  field on connections, staged assets, layers and wells in a subproject

## Installation

1. Clone this code repository or download it from:  
   https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/refs/heads/master.zip
   and extract the zip contents
2. Install [Python 3](https://www.python.org/downloads/)
3. Open a Command Prompt or Terminal [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
4. Change into this directory, create a Python virtual environment,
   activate the environment, and install the project requirements
   ```
   cd <path to cloned repository or extracted zip>
   cd scripts/python
   python3 -m venv .
   source bin/activate
   pip3 install -r requirements.txt
   ```

These scripts require Python version 3.6 or later.

## Usage

Run the tools from the Command Prompt:

```
export TOKEN=api-token
export BACKEND_HOST=legacyapi.[instance].fieldtwin.com

python3 get-connection-points.py  <PROJECT_ID>          <SUBPROJECT_ID>       <CONNECTION_ID>
python3 get-connection-points.py  -MuVwueeyoYvwUw2eIra  -MuVwueeyoYvwUw2eIrb  -MuVwuegoQkES3lvYuix

python3 get-connections-with-design.py  <PROJECT_ID>          <SUBPROJECT_ID>       <DESIGN_TYPE>
python3 get-connections-with-design.py  -MuVwueeyoYvwUw2eIra  -MuVwueeyoYvwUw2eIrb  None

python3 get-staged-assets-in-range-of-well.py  <PROJECT_ID>          <SUBPROJECT_ID>       <WELL_ID>             <DISTANCE>
python3 get-staged-assets-in-range-of-well.py  -MuVwueeyoYvwUw2eIra  -MuVwueeyoYvwUw2eIrb  -MuVwuegoQkES2lvYuid  100

python3 get-staged-assets-of-category.py  <PROJECT_ID>          <SUBPROJECT_ID>       <ASSET_CATEGORY>
python3 get-staged-assets-of-category.py  -MuVwueeyoYvwUw2eIra  -MuVwueeyoYvwUw2eIrb  Hosts
```

The IDs of the project and subproject can be found from the URL in your browser's address
bar when the project is open in FieldTwin Design. They look like `-MeidQjcOmxpYWFIq5zp`.
When you select a connection / staged asset / well the ID of that object can also be found
on the end of the URL.

The required API token can be created by an administrator in FieldTwin Admin from the
Account Settings / API section. It must be created for the same account that the project
lives in.

### batch-modify-metadata-value

This tool examines connections, staged assets, layers and wells in a subproject and
changes the value of all metadata entries that match a given "vendor ID". The vendor ID
is an optional part of the metadata field definition, set up in FieldTwin Admin.
FutureOn's standard metadata library defines vendor IDs with the prefix `Std.`.

:warning: Run this tool against a test project so that you do not overwrite good data.

```
python3 batch-modify-metadata-value.py  <PROJECT_ID>          <SUBPROJECT_ID>       <VENDOR_ID>  <METADATA_VALUE>
python3 batch-modify-metadata-value.py  -MuVwueeyoYvwUw2eIra  -MuVwueeyoYvwUw2eIrb  Std.Service  "Production"
```
