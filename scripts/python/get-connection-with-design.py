#! /usr/bin/env python3

import sys
import os
import requests

if not len(sys.argv) == 4:
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <DESIGN>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

for var in ["TOKEN", "BACKEND_HOST"]:
    if not var in os.environ:
        print('Required environment variable not set: %s' % var)
        sys.exit(1)

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
DESIGN = sys.argv[3]

TOKEN = os.environ['TOKEN']
PORT = os.environ.get('PORT', '')
HOST_URL = 'https://{}{}{}'.format(
    os.environ['BACKEND_HOST'],
    ':' if PORT else '',
    PORT
)
API_VERSION = 'v1.9'

url = '%s/API/V1.5/%s/subProject/%s' % (HOST_URL, PROJECT_ID, SUBPROJECT_ID)
headers= {'token':TOKEN}
r = requests.get(url, headers=headers)
response = r.json()
connections = response["connections"]
connectionsFiltered = {k: v  for k,v in connections.items() if v['designType'] == DESIGN}


print(connectionsFiltered)
