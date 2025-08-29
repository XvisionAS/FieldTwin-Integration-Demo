# Asset Dumper

## Description

This tool will download all assets from a FieldTwin account and convert them to GLTF.

## Installation

1. Clone this code repository or download it from:  
   https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/refs/heads/master.zip
   and extract the zip contents
2. Install [NodeJS](https://nodejs.org/en/)
3. Open a Command Prompt or Terminal [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
4. Change into this directory and install the project requirements
   ```
   cd <path to cloned repository or extracted zip>
   cd asset-dumper
   npm install
   ```

## Usage

Run the tool from the Command Prompt:

```
node index.js --backend https://backend.example.fieldtwin.com --token abc123
```

### Command Line Switches

- `--backend [value]` URL of which backend the definitions will be pulled from,
  for example `https://backend.qa.fieldtwin.com`
- `--token [value]` API token used to authenticate with the API.
  This can be created by an administrator in FieldTwin Admin from the Account Settings / API section.

### Output

The files are exported into a sub-directory `export` from the working directory.
`export` will be created if it does not exist.
