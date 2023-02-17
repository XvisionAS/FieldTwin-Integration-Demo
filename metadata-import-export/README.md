# Metadata import-export

## Description

This tool is deployed as a tab inside FieldTwin Design. It shows how to respond to
window messages, call the FieldTwin API, download and upload metadata using an Excel
spreadsheet.

This example uses the [SheetJS library](https://sheetjs.com/) for Excel compatibility
and queries FieldTwin for metadata attached to a staged asset, connection or well.

## Installation

1. Self-hosted option: deploy the file `index.html` on a public or private web
   hosting service and obtain the URL to reach it  
   or  
   Pre-hosted option: use the URL `https://xvisionas.github.io/FieldTwin-Integration-Demo/metadata-import-export/`
2. In FieldTwin Admin, go to Account Settings, then Integrations, and click _Create New Tab_.
   Set the following values:  
   ```
   Name:                           Metadata Tab
   URL:                            <the URL from step 1>
   Use GET verb:                   yes
   Do not pass arguments in URL:   yes
   Tab Display Position:           Module Panel (default)
   ```

## Usage

1. Open a project in FieldTwin Design, and select a staged asset, connection, or well
2. You can now download attached metadata using excel file from sheetJs library

![Object with no documents uploaded](./step1-2.png)

3. You can select local excel file (3) and compare metadata with selected object (4) 
4. Upload excel metadata to selected object

![Object with one document uploaded](./step3-4-5.png)
