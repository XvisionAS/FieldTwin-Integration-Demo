#! /usr/bin/env python3

import sys
import os
import json
import requests

if not len(sys.argv) == 6   :
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <ASSETID> <METADATAID> <NEWVALUE>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

for var in ["TOKEN", "BACKEND_HOST"]:
    if not var in os.environ:
        print('Required environment variable not set: %s' % var)
        sys.exit(1)

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
ASSETID = sys.argv[3]
METADATAID = sys.argv[4]
NEWVALUE = sys.argv[5]

TOKEN = os.environ['TOKEN']
PORT = os.environ.get('PORT', '')
HOST_URL = 'https://{}{}{}'.format(
    os.environ['BACKEND_HOST'],
    ':' if PORT else '',
    PORT
)
API_VERSION = 'v1.9'

url = '%s/API/V1.5/%s/subProject/%s' % (HOST_URL, PROJECT_ID, SUBPROJECT_ID)
headers= {'token':TOKEN,'Content-Type': 'application/json'}
r = requests.get(url, headers=headers)

if r.status_code != 200:
    print(r.text)
    sys.exit(1)

response = r.json()
stagedAssets = response["stagedAssets"]
stagedAssetsFiltered = [k  for k,v in stagedAssets.items() if v['asset']['id'] == ASSETID]

url = '%s/API/V1.5/%s/subProject/%s/stagedAssets' % (HOST_URL, PROJECT_ID, SUBPROJECT_ID)
value = { "metaData": [ {"id": METADATAID, "value": NEWVALUE}]}
payload = { k : value for k in stagedAssetsFiltered } 

r = requests.patch(url, data=json.dumps(payload), headers=headers)

if r.status_code != 200:
    print(r.text)
    sys.exit(1)
