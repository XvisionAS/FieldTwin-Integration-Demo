#! /usr/bin/env python

import sys
import os
import requests

if not len(sys.argv) == 4:
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <DESIGN>' % os.path.basename(sys.argv[0]))
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
DESIGN = sys.argv[3]

API_TOKEN = os.environ['API_TOKEN']
BACKEND_URL = os.environ['BACKEND_URL']

url = '%s/API/V1.5/%s/subProject/%s' % (BACKEND_URL, PROJECT_ID, SUBPROJECT_ID)
headers= {'token':API_TOKEN}
r = requests.get(url, headers=headers)
response = r.json()
connections = response["connections"]
connectionsFiltered = {k: v  for k,v in connections.items() if v['designType'] == DESIGN}


print(connectionsFiltered)
