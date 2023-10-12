const axios = require('axios')
const parseArgs = require('minimist')

const TOKEN = process.env.TOKEN || '91f8153e-ab28-43f6-b389-a6af824f8fcc'
const PORT = process.env.PORT || ''
const BACKEND_HOST = `${process.env.BACKEND_HOST ? 'https://'+process.env.BACKEND_HOST : 'http://futureon-backend.lvh.me'}`
const HOST_URL = `${BACKEND_HOST}${PORT ? ':' : ''}${PORT}`
const API_VERSION = 'v1.9'

const argv = parseArgs(process.argv.slice(''))
const PROJECT_ID = argv['project']
const SUB_PROJECT_ID = argv['sub-project']
const STREAM_ID = argv['stream']

const stagedAssetsUrl = `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}:${STREAM_ID}/stagedassets`
const shapesUrl = `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}:${STREAM_ID}/shapes`

let stagedAssets;
let shapes;

axios.get(stagedAssetsUrl, {
    headers: { token: TOKEN }
}).then(res => {
    stagedAssets = res.data;

    axios.get(shapesUrl, {
        headers: { token: TOKEN }
    }).then(res => {
        shapes = res.data.shapes;
        if (stagedAssets && shapes) {
            for (const shape of shapes) {
                if (shape.shapeType === 'Circle') {
                    const stagedAssetsInOverlappedZone = isInside(shape, stagedAssets);
                    if (stagedAssetsInOverlappedZone.length > 0) {
                        addWarningTag(stagedAssetsInOverlappedZone)
                    }
                }
            }
        }
    }).catch(error => console.log(error))
}).catch(error => console.log(error))

const isInside = (shape, stagedAssets) => {
    const inDangerZoneAsstes = [];
    for (const key in stagedAssets) {
        if ((stagedAssets[key].initialState.x - shape.x) * (stagedAssets[key].initialState.x - shape.x) +
            (stagedAssets[key].initialState.y - shape.y) * (stagedAssets[key].initialState.y - shape.y) <= shape.circleRadius * shape.circleRadius)
            inDangerZoneAsstes.push(stagedAssets[key]);
    }
    return inDangerZoneAsstes;
}

const addWarningTag = (stagedAssetsInOverlappedZone) => {
    const payload = {
        "globals": {
            "tags": ["warning!!"]
        }
    };
    for (const stagedAsset of stagedAssetsInOverlappedZone) {
        payload[stagedAsset.id] = {}
    }

    axios.patch(stagedAssetsUrl,
        payload,
        { headers: { 'Content-Type': 'application/json', token: TOKEN }, }
    ).then((response) => {
        console.log(response)
    }).catch((error) => {
        console.log(error)
    })
}