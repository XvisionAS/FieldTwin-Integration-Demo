#! /usr/bin/env python

import sys
import os
import requests



if not len(sys.argv) == 5:
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <WELL_ID> <RANGE>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

shouldExit = False
for var in ["API_TOKEN", "BACKEND_URL"]:
    if not var in os.environ:
        print('%s: Environment variable needed not set' % var)
        shouldExit = True

if shouldExit:
    sys.exit(1)

def inRange(p1, p2, range):
    return (((float(p1[0]) - float(p2[0])) ** 2 + (float(p1[0]) - float(p2[0])) ** 2) ** 0.5) <= float(range)

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
WELL_ID = sys.argv[3]
RANGE = sys.argv[4]

API_TOKEN = os.environ['API_TOKEN']
BACKEND_URL = os.environ['BACKEND_URL']

url = '%s/API/V1.5/%s/subProject/%s/well/%s' % (BACKEND_URL, PROJECT_ID, SUBPROJECT_ID, WELL_ID)
headers= {'token':API_TOKEN}
r = requests.get(url, headers=headers)
response = r.json()
wellPos = (response["x"], response["y"])

url = '%s/API/V1.5/%s/subProject/%s' % (BACKEND_URL, PROJECT_ID, SUBPROJECT_ID)
headers= {'token':API_TOKEN}
r = requests.get(url, headers=headers)
response = r.json()
stagedAssets = response["stagedAssets"]
stagedAssetsFiltered = {k: v  for k,v in stagedAssets.items() if inRange((v['initialState']['x'], v['initialState']['y']), wellPos, RANGE)}


print(stagedAssetsFiltered)
