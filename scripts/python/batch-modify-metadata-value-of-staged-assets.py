#! /usr/bin/env python

import argparse

import sys
import os
import requests
import json


if not len(sys.argv) == 6   :
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <ASSETID> <METADATAID> <NEWVALUE>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

shouldExit = False
for var in ["API_TOKEN", "BACKEND_URL"]:
    if not var in os.environ:
        print('%s: Environment variable needed not set' % var)
        shouldExit = True

if shouldExit:
    sys.exit(1)

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
ASSETID = sys.argv[3]
METADATAID = sys.argv[4]
NEWVALUE = sys.argv[5]

API_TOKEN = os.environ['API_TOKEN']
BACKEND_URL = os.environ['BACKEND_URL']

url = '%s/API/V1.5/%s/subProject/%s' % (BACKEND_URL, PROJECT_ID, SUBPROJECT_ID)
headers= {'token':API_TOKEN,'Content-Type': 'application/json'}
r = requests.get(url, headers=headers)

if r.status_code != 200:
    print(r.text)
    sys.exit(1)

response = r.json()
stagedAssets = response["stagedAssets"]
stagedAssetsFiltered = [k  for k,v in stagedAssets.items() if v['asset']['id'] == ASSETID]

url = '%s/API/V1.5/%s/subProject/%s/stagedAssets' % (BACKEND_URL, PROJECT_ID, SUBPROJECT_ID)
value = { "metaData": [ {"id": METADATAID, "value": NEWVALUE}]}
payload = { k : value for k in stagedAssetsFiltered } 

r = requests.patch(url, data=json.dumps(payload), headers=headers)

if r.status_code != 200:
    print(r.text)
    sys.exit(1)
