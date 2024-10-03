# Metadata Definition Copy Tool

## Description

This tool will copy all meta data from one type to the other. It works on all types ( asset, connection, connector, layer, well ), and can even copy accross different type.

  > This tool will only copy meta data that have a vendorId set.
  > vendorId should always be of the form `name-of-company.type.subtype.name` for exampler :
  >
  > - FutureOn.general.radius
  > - FutureOn.economics.subcost.value

## Installation

1. You need to install nodejs : [https://nodejs.org](https://nodejs.org/en/)
2. Download the project archive : [link](https://github.com/XvisionAS/FieldTwin-Integration-Demo/archive/master.zip) ( This will download the whole repository), you can download individual files if you want, but it is a bit harder.
3. Unzip the archive somewhere easily accessible ( Your **Documents** folders for example). Be sure to decompress the archive into a separate folder so that it does not clutter your **Documents** folder.
4. Open a command prompt [help](https://www.lifewire.com/how-to-open-command-prompt-2618089)
5. If you unziped the file into **Documents** folder, in the command prompt, type :
    1. `cd Documents`
    2. `cd master` ( if &quot;master&quot; is the sub folder you use to decompress the archive )
    3. `cd metadata-copy`
    4. `npm install` ( This will install all the dependency defined in `package.json`)
    5. you can now use the tools by typing `node index.js`

## Usage

### Command Line Switches

#### Mandatory

- `--backend [value]` From which backend definitions will be pulled from. For example `https://backend.qa.fieldtwin.com`.
- `--token [value]` API token used to authenticate with the backend. Can be obtain in Account settings/API tab. You need to be an administrator.
- `--source-type [value]` One of `well`, `layer`, `connection`, `asset`, `connector`.
- `--source-id [value]` Uniq ID of the source item ( corresponding to the source type). Can be obtain by goind to Account settings, on the correconding type tab, and selecting the item you want to copy. ID will be the first item displayed after selection.
- `--target-id [value]` Uniq ID of the target item ( corresponding to the source type, or target source type ).

#### Optionnal

- `--target-backend [value]` To which backend definitions will be pushed to. Default to `--backend` if not defined.
- `--target-token [value]` API token used to authenticate with `--target-backend`. Default to `--token` if not defined.
- `--target-type [value]` One of `well`, `layer`, `connection`, `asset`, `connector`. Default to `--source-type` if not defined.

## Sample

### Copy from one connection type to the other

```sh
  node index.js --backend "https://backend.qa.fieldtwin.com" --token [APItoken] --source-id 1 --source-type connection --target-id 2
```

### Copy from one connection type to the other on a different backend

```sh
  node index.js --backend "https://backend.qa.fieldtwin.com" --token "[APItoken]" --target-backend "https://backend.app.fieldtwin.com" --target-token "[APIToken]" --source-id 1 --source-type connection --target-id 2
```

