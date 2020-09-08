# create-layout

Two small javascript scripts:

1. `get-layout.sh` to "read" a subProject.

  usage:
``` bash
  export TOKEN="token"
  export LEGACY_API_HOST="legacyapi.[instance].fieldap.com"
  export PROJECT_ID="projectId"
  export SUB_PROJECT_ID="subProject1"
  ./get-layout.sh > layout.json

```
2. `create-layout` to create a layout in a sub project reading from `stdin`

  usage:
``` bash
  export TOKEN="token"
  export LEGACY_API_HOST="legacyapi.[instance].fieldap.com"
  export PROJECT_ID="projectId"
  export SUB_PROJECT_ID="subProject2"
  ./create-layout.sh < layout.json

```

`env.sh` to fill and source needed env variable

`result-commented.js` contains some small comments on some entries obtained from a generic subProject and  `./get-layout.sh > result.json`

demo video at https://youtu.be/n9ULYkZ7fnE
