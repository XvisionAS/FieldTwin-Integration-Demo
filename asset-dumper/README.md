# Asset Dumper

## Description

This tools will download all assets from a FieldTwin account and convert them to Collada. The export format can be easily changed by using one of the THREEjs exporter [link](https://github.com/mrdoob/three.js/tree/dev/examples/js/exporters).

The files will be exporter into the sub-folder `export` of the folder from which the script was run.

## Installation

1. You need to install nodejs : [https://nodejs.org](https://nodejs.org/en/)
2. Download the project archive : [link](https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/master.zip) ( This will download the whole repository), you can download individual files if you want, but it is a bit harder.
3. Unzip the archive somewhere easily accessible ( Your **Documents** folders for example). Be sure to decompress the archive into a separate folder so that it does not clutter your **Documents** folder.
4. Open a command prompt [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
5. If you unziped the file into **Documents** folder, in the command prompt, type :
    1. `cd Documents`
    2. `cd master` ( if &quot;master&quot; is the sub folder you use to decompress the archive )
    3. `cd asset-dumper`
    4. `npm install` ( This will install all the dependency defined in `package.json`)
    5. you can now use the tools by typing `node index.js`

## Usage

### Command Line Switches

#### Mandatory

- `--backend [value]` From which backend definitions will be pulled from. For example `https://backend.qa.fieldap.com`.
- `--token [value]` API token used to authenticate with the backend. Can be obtain in Account settings/API tab. You need to be an administrator.
