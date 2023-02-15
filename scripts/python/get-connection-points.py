#! /usr/bin/env python3

import sys
import os
import requests

if not len(sys.argv) == 4:
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <CONNECTION_ID>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

for var in ["TOKEN", "BACKEND_HOST"]:
    if not var in os.environ:
        print('Required environment variable not set: %s' % var)
        sys.exit(1)

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
CONNECTION_ID = sys.argv[3]

TOKEN = os.environ['TOKEN']
PORT = os.environ.get('PORT', '')
HOST_URL = 'https://{}{}{}'.format(
    os.environ['BACKEND_HOST'],
    ':' if PORT else '',
    PORT
)
API_VERSION = 'v1.9'

url = '%s/API/V1.5/%s/subProject/%s/connection/%s' % (HOST_URL, PROJECT_ID, SUBPROJECT_ID, CONNECTION_ID)
headers= {'token':TOKEN}
r = requests.get(url, headers=headers)
response = r.json()
print('%s %s %s' % (response['fromCoordinate']['x'], response['fromCoordinate']['y'], response['fromCoordinate']['z']))

for p in response['intermediaryPoints']:
    print('%s %s %s' % (p['x'], p['y'], p['z']))

print('%s %s %s' % (response['toCoordinate']['x'], response['toCoordinate']['y'], response['toCoordinate']['z']))
