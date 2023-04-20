# create-layout

## Description

This example contains 2 scripts: one to read a subproject and save it as JSON data,
and the other to replay the JSON data into an empty subproject. This demonstrates a way
of populating a whole field design using the FieldTwin API.

## Installation

1. Clone this code repository or download it from:  
   https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/refs/heads/master.zip
   and extract the zip contents
2. Install [NodeJS](https://nodejs.org/en/)
3. Open a Command Prompt or Terminal [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
4. Change into this directory and install the project requirements
   ```
   cd <path to cloned repository or extracted zip>
   cd scripts/javascript/create-layout
   npm install
   ```

## Usage

Run the tools from the Command Prompt:

1. Use `get-layout.js` to read a subproject and save it as a file

```
export TOKEN=api-token
export BACKEND_HOST=legacyapi.[instance].fieldtwin.com

node get-layout.js --project=projectId1 --sub-project=subProjectId1 > layout.json
```

In a Microsoft Windows Command Prompt use `set` instead of `export`.

2. Use `create-layout.js` to recreate the layout in an **empty** subproject

:warning: Be sure to change the `--sub-project` value (and optionally the `--project`
value) so that you do not duplicate the field in the same subproject it came from!

:warning: The target project must use the same Coordinate Reference System as the source project.

```
export TOKEN=api-token
export BACKEND_HOST=legacyapi.[instance].fieldtwin.com

node create-layout.js --project=projectId2 --sub-project=subProject2 < layout.json
```

In a Microsoft Windows Command Prompt use `set` instead of `export`.

### Command Line Switches

- `--project [value]` The ID of the project to pull from (step 1) or push to (step 2)
- `--sub-project [value]` The ID of the subproject to pull from (step 1) or push to (step 2)

The IDs of the project and subproject can be found from the URL in your browser's address
bar when the project is open in FieldTwin Design. They look like `-MeidQjcOmxpYWFIq5zp`.

The required API token can be created by an administrator in FieldTwin Admin from the
Account Settings / API section. It must be created for the same account that the project
lives in.

### Notes

See this example running in the video at https://youtu.be/n9ULYkZ7fnE

`layout-commented.jsonc` contains some small comments on the output obtained from a
generic subproject using `get-layout.js > layout.json`
