# warning-zone

## Description

This example contains a script which demonstrates a way to find out list of assets that fall inside circle shapes. For calculation only asset's origin coordinates have been considered whether it is inside the circle's radius or not. Assets that fall inside circle updated with `Falls inside ${shape.name}` tags

## Installation

1. Clone this code repository or download it from:  
   https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/refs/heads/master.zip
   and extract the zip contents
2. Install [NodeJS](https://nodejs.org/en/)
3. Open a Command Prompt or Terminal [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
4. Change into this directory and install the project requirements
   ```
   cd <path to cloned repository or extracted zip>
   cd scripts/javascript/warning-zone
   npm install
   ```

## Usage

Run the script from the Command Prompt:

FieldTwin 7.1 and below:  
`BACKEND_HOST=backend.<instance>.fieldtwin.com TOKEN=api_token node index.js --project=projectId --sub-project=subProjectId`

FieldTwin 7.2 and above:  
`BACKEND_HOST=backend.<instance>.fieldtwin.com TOKEN=api_token node index.js --project=projectId --sub-project=subProjectId --stream=streamId`